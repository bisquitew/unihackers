import { pathToFileURL } from 'node:url';
import { config, resolveApiUrl } from '../config.ts';

export const SAMPLE_TRANSIT_ALERTS = [
  {
    line_number: '5',
    title: 'Confirmare STPT: Linia 5 Tramvai rămâne suspendată pe Calea Bogdăneștilor',
    reason: 'Lucrări majore de modernizare și reabilitare a infrastructurii căii de rulare.',
    status: 'suspended',
    affected_stops: ['Calea Bogdăneștilor', 'Balta Verde', 'Ronaț', 'Muzicescu'],
    alternative_instructions: 'Urcați în autobuzul temporar 5C din stația Piața Sf. Gheorghe.',
    replacement_line: '5C',
    valid_from: new Date().toISOString()
  },
  {
    line_number: 'E2',
    title: 'Deviere temporară Autobuz Expres E2 — Lucrări Bulevardul Take Ionescu',
    reason: 'Reasfaltare carosabil și reparații rețele edilitare.',
    status: 'detoured',
    affected_stops: ['Bulevardul Take Ionescu', 'Punctele Cardinale'],
    alternative_instructions: 'Traseu deviat prin Splaiul Nistrului și Strada Popa Șapcă.',
    replacement_line: 'E2 Dev.',
    valid_from: new Date().toISOString()
  }
];

export async function runTransitIngestion(): Promise<{ ingested: number; errors: number }> {
  const apiUrl = await resolveApiUrl();
  console.log(`[NETROM GLUE] 🚊 Running STPT Transit Roadworks Ingestion against ${apiUrl}...`);

  let ingested = 0;
  let errors = 0;

  for (const alert of SAMPLE_TRANSIT_ALERTS) {
    try {
      const res = await fetch(`${apiUrl}/v1/m/transit/detours`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.authToken}` // Auth0 for AI Agents (M2M)
        },
        body: JSON.stringify(alert)
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[NETROM GLUE] ✅ Transit detour alert published: Linia ${data.line_number} (ID: ${data.id})`);
        ingested++;
      } else {
        const errText = await res.text();
        console.error(`[NETROM GLUE] ❌ Transit detour rejected: ${res.status} - ${errText}`);
        errors++;
      }
    } catch (err: any) {
      console.error(`[NETROM GLUE] ⚠️ Transit API unreachable (${err.message})`);
      errors++;
    }
  }

  return { ingested, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runTransitIngestion();
}
