// Small live readings for the Home screen. Each returns null until the API has answered (and when it cannot be reached),
// so the screen can show a quiet placeholder instead of made-up numbers.
import { useEffect, useState } from 'react';
import { api } from './api';

export interface ParkingReading {
  name: string;
  free: number;
  capacity: number;
}

/** The lot with the most free spots right now, refreshed every minute. */
export function useTopParking(): ParkingReading | null {
  const [reading, setReading] = useState<ParkingReading | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .get<any[]>('/v1/m/parkie/lots')
        .then((lots) => {
          if (!alive || !Array.isArray(lots) || !lots.length) return;
          const best = [...lots].sort((a, b) => b.available_spots - a.available_spots)[0];
          setReading({ name: best.name, free: best.available_spots, capacity: best.capacity });
        })
        .catch(() => {});
    void load();
    const timer = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);
  return reading;
}
