import { useCallback, useEffect, useState } from 'react';
import { fetchPins, smellType, type SmellPin } from './api';

/** A pin ready to draw on the shared map: position, colour and a short label. */
export interface SmellMapPin extends SmellPin {
  color: string;
  label: string;
}

export interface UseSmellPinsOptions {
  hours?: number;
  includeDemo?: boolean;
  /** Re-fetch interval in ms; 0 turns polling off. */
  refreshMs?: number;
}

export interface UseSmellPinsResult {
  pins: SmellMapPin[];
  /** How many of the pins are demo data; show a "demo data" label when > 0. */
  demoCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Smell reports as map pins, for P1's shared Map tab (see manifest.mapLayer).
 * Data only: it renders nothing, so it works with any map library.
 */
export function useSmellPins({ hours = 24, includeDemo = true, refreshMs = 60_000 }: UseSmellPinsOptions = {}): UseSmellPinsResult {
  const [pins, setPins] = useState<SmellMapPin[]>([]);
  const [demoCount, setDemoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    fetchPins(hours, includeDemo)
      .then((r) => {
        setPins(r.pins.map((p) => ({ ...p, color: smellType(p.type).color, label: `${smellType(p.type).label} · ${p.intensity}/5` })));
        setDemoCount(r.demoCount);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load smell reports'))
      .finally(() => setLoading(false));
  }, [hours, includeDemo]);

  useEffect(() => {
    refresh();
    if (!refreshMs) return undefined;
    const timer = setInterval(refresh, refreshMs);
    return () => clearInterval(timer);
  }, [refresh, refreshMs]);

  return { pins, demoCount, loading, error, refresh };
}
