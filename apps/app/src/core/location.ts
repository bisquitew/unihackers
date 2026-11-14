// Where the person is, and which way they face, for the map's "you are here" arrow.
// Nothing is asked for until `start()` is called (the first press of the locate button), and everything stops on unmount.
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

export interface MyLocation {
  latitude: number;
  longitude: number;
  /** degrees clockwise from north, when the phone's compass knows */
  heading?: number;
}

export type LocationStatus = 'idle' | 'asking' | 'on' | 'denied' | 'unavailable';

export function useMyLocation() {
  const [location, setLocation] = useState<MyLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const watchers = useRef<{ remove: () => void }[]>([]);
  const heading = useRef<number | undefined>(undefined);

  const stop = useCallback(() => {
    watchers.current.forEach((w) => w.remove());
    watchers.current = [];
  }, []);
  useEffect(() => stop, [stop]);

  /** Asks permission (once), then follows the person. Resolves with the first fix, or null when it cannot be had. */
  const start = useCallback(async (): Promise<MyLocation | null> => {
    setStatus('asking');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setStatus('denied');
        return null;
      }
      const first = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const fix: MyLocation = { latitude: first.coords.latitude, longitude: first.coords.longitude, heading: heading.current };
      setLocation(fix);
      setStatus('on');
      stop();
      watchers.current.push(
        await Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, distanceInterval: 4 }, (p) => {
          setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude, heading: heading.current });
        }),
      );
      try {
        watchers.current.push(
          await Location.watchHeadingAsync((h) => {
            const next = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
            // small wobbles are ignored so the arrow does not make the map redraw all the time
            if (heading.current !== undefined && Math.abs(next - heading.current) < 5) return;
            heading.current = next;
            setLocation((l) => (l ? { ...l, heading: next } : l));
          }),
        );
      } catch {
        /* no compass: the dot stays a dot */
      }
      return fix;
    } catch {
      setStatus('unavailable');
      return null;
    }
  }, [stop]);

  return { location, status, start };
}
