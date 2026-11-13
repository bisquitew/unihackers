let API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

async function resolveApiUrl(): Promise<string> {
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL;
  for (const port of [8000, 8001, 8080]) {
    try {
      const res = await fetch(`http://localhost:${port}/health`, { signal: AbortSignal.timeout(400) });
      if (res.ok) return `http://localhost:${port}`;
    } catch {}
  }
  return 'http://localhost:8000';
}

export async function runTransitIngestion() {
  API_BASE_URL = await resolveApiUrl();
  console.log(`[NETROM GLUE] 🔄 Running STPT Transit Roadworks Ingestion against ${API_BASE_URL}...`);

  const detourUpdate = {
    line_number: '5',
    title: 'Confirmare STPT: Linia 5 Tramvai rămâne suspendată pe Calea Bogdăneștilor',
    reason: 'Lucrări de infrastructură rutieră în desfășurare. Traseu deservit de autobuzul 5C.',
    status: 'suspended',
    affected_stops: ['Calea Bogdăneștilor', 'Balta Verde', 'Ronaț'],
    alternative_instructions: 'Urcați în autobuzul 5C din stația Piața Sf. Gheorghe.',
    replacement_line: '5C',
    valid_from: new Date().toISOString()
  };

  try {
    const res = await fetch(`${API_BASE_URL}/v1/m/transit/detours`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(detourUpdate)
    });

    if (res.ok) {
      const data = await res.json();
      console.log(`[NETROM GLUE] ✅ Transit detour alert published: Linia ${data.line_number} (ID: ${data.id})`);
    } else {
      console.error('[NETROM GLUE] ❌ Failed to post detour to API:', await res.text());
    }
  } catch (err: any) {
    console.error(`[NETROM GLUE] ⚠️ Transit API unreachable (${err.message})`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTransitIngestion();
}
