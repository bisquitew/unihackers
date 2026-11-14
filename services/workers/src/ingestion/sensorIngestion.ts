import { pathToFileURL } from 'node:url';
import { config, resolveApiUrl } from '../config.ts';

export const SAMPLE_SENSOR_PULSES = [
  { metric_type: 'pm25', area_id: 'area-cetate', value: 18.4, unit: 'µg/m³' },
  { metric_type: 'pm25', area_id: 'area-circumvalatiunii', value: 24.1, unit: 'µg/m³' },
  { metric_type: 'noise', area_id: 'area-complex', value: 68.5, unit: 'dB' },
  { metric_type: 'noise', area_id: 'area-cetate', value: 54.0, unit: 'dB' },
  { metric_type: 'smell_index', area_id: 'area-sagului', value: 2.1, unit: 'ppm' }
];

export async function runSensorIngestion(): Promise<{ ingested: number; errors: number }> {
  const apiUrl = await resolveApiUrl();
  console.log(`[NETROM GLUE] 🌿 Ingesting Environmental IoT Sensor readings into Tiger Cloud (${apiUrl})...`);

  let ingested = 0;
  let errors = 0;

  for (const pulse of SAMPLE_SENSOR_PULSES) {
    try {
      const res = await fetch(`${apiUrl}/v1/core/metrics/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.authToken}`
        },
        body: JSON.stringify({
          ...pulse,
          timestamp: new Date().toISOString()
        })
      });

      if (res.ok) {
        console.log(`[NETROM GLUE] ✅ Sensor metric ingested: ${pulse.metric_type} in ${pulse.area_id} = ${pulse.value} ${pulse.unit}`);
        ingested++;
      } else {
        const errText = await res.text();
        console.error(`[NETROM GLUE] ❌ Sensor metric rejected: ${res.status} - ${errText}`);
        errors++;
      }
    } catch (err: any) {
      console.error(`[NETROM GLUE] ⚠️ Sensor ingestion failed (${err.message})`);
      errors++;
    }
  }

  return { ingested, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSensorIngestion();
}
