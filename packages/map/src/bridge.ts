import { useCallback, useEffect, useRef, useState } from 'react';
import { pinKinds } from './kinds';
import type { Coordinate, MapFocus, MapInsets, MapPin, MapSkin, MapTheme } from './types';

/* ---------- messages between the app and the map engine (see engine/engine.js) ---------- */
export interface EnginePin {
  id: string;
  lat: number;
  lng: number;
  art: string;
  title: string;
  kindLabel: string;
  /** small corner badge: a lock for private pins of the user, people for pins they shared, none otherwise */
  badge: 'lock' | 'shared' | '';
}

export type ToEngine =
  | { type: 'setPins'; pins: EnginePin[] }
  | { type: 'flyTo'; lat: number; lng: number; zoom?: number }
  | { type: 'select'; id: string | null }
  | { type: 'setTheme'; theme: MapTheme }
  | { type: 'setSkin'; skin: MapSkin }
  | { type: 'setReducedMotion'; value: boolean }
  | { type: 'setInsets'; top: number; right: number; bottom: number; left: number }
  | { type: 'setUserLocation'; location: { lat: number; lng: number } | null };

export type FromEngine =
  | { type: 'ready'; theme: string }
  | { type: 'pinPress'; id: string }
  | { type: 'longPress'; lat: number; lng: number }
  | { type: 'tap'; lat: number; lng: number }
  | { type: 'camera'; lat: number; lng: number; zoom: number; bearing: number; pitch: number }
  | { type: 'error'; message: string };

export function toEnginePin(pin: MapPin): EnginePin {
  const def = pinKinds[pin.kind];
  return {
    id: pin.id,
    lat: pin.coordinate.latitude,
    lng: pin.coordinate.longitude,
    art: def.art,
    title: pin.title,
    kindLabel: def.label,
    badge: pin.owner === 'me' ? (pin.visibility === 'public' ? 'shared' : 'lock') : '',
  };
}

/* ---------- the component's props ---------- */
export interface CityMapProps {
  pins: MapPin[];
  selectedId?: string | null;
  focus?: MapFocus | null;
  theme?: MapTheme;
  /** the look of the map: 'flat' (default, bright 2D) or 'city3d' */
  skin?: MapSkin;
  /** space covered by overlays (sheet, tab bar); the camera keeps the selected pin clear of it */
  insets?: MapInsets;
  userLocation?: Coordinate | null;
  reducedMotion?: boolean;
  onPinPress?: (id: string) => void;
  onLongPress?: (coordinate: Coordinate) => void;
  onMapPress?: (coordinate: Coordinate) => void;
  onCamera?: (camera: { latitude: number; longitude: number; zoom: number; bearing: number; pitch: number }) => void;
  onReady?: () => void;
  onError?: (message: string) => void;
}

/**
 * Shared by both hosts (WebView on phones, iframe on web): turns prop changes into engine commands
 * and engine messages into callbacks. Commands that depend on the map being loaded wait for `ready`.
 */
export function useEngineBridge(props: CityMapProps, post: (message: ToEngine) => void) {
  const [ready, setReady] = useState(false);
  const latest = useRef(props);
  latest.current = props;

  const handleMessage = useCallback((msg: FromEngine) => {
    const p = latest.current;
    switch (msg.type) {
      case 'ready':
        setReady(true);
        p.onReady?.();
        break;
      case 'pinPress':
        p.onPinPress?.(msg.id);
        break;
      case 'longPress':
        p.onLongPress?.({ latitude: msg.lat, longitude: msg.lng });
        break;
      case 'tap':
        p.onMapPress?.({ latitude: msg.lat, longitude: msg.lng });
        break;
      case 'camera':
        p.onCamera?.({ latitude: msg.lat, longitude: msg.lng, zoom: msg.zoom, bearing: msg.bearing, pitch: msg.pitch });
        break;
      case 'error':
        p.onError?.(msg.message);
        break;
    }
  }, []);

  const { pins, selectedId, focus, theme, skin, insets, userLocation, reducedMotion } = props;

  useEffect(() => {
    if (ready) post({ type: 'setReducedMotion', value: !!reducedMotion });
  }, [ready, reducedMotion, post]);

  useEffect(() => {
    if (ready) post({ type: 'setTheme', theme: theme ?? 'auto' });
  }, [ready, theme, post]);

  useEffect(() => {
    if (ready) post({ type: 'setSkin', skin: skin ?? 'flat' });
  }, [ready, skin, post]);

  useEffect(() => {
    if (ready) post({ type: 'setInsets', top: insets?.top ?? 0, right: insets?.right ?? 0, bottom: insets?.bottom ?? 0, left: insets?.left ?? 0 });
  }, [ready, insets?.top, insets?.right, insets?.bottom, insets?.left, post]);

  useEffect(() => {
    if (ready) post({ type: 'setPins', pins: pins.map(toEnginePin) });
  }, [ready, pins, post]);

  useEffect(() => {
    if (ready) post({ type: 'select', id: selectedId ?? null });
  }, [ready, selectedId, post]);

  useEffect(() => {
    if (ready && focus) post({ type: 'flyTo', lat: focus.latitude, lng: focus.longitude, zoom: focus.zoom });
  }, [ready, focus?.latitude, focus?.longitude, focus?.zoom, focus?.nonce, post]);

  useEffect(() => {
    if (ready) post({ type: 'setUserLocation', location: userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null });
  }, [ready, userLocation?.latitude, userLocation?.longitude, post]);

  return { ready, handleMessage };
}
