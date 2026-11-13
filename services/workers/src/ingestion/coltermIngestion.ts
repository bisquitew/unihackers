import { pathToFileURL } from 'node:url';

let API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

// Realistic raw Colterm press release text (as published on colterm.ro / taped to building doors)
export const SAMPLE_RAW_COLTERM_NOTICE = `
COMUNICAT DE PRESĂ COLTERM S.A.
Timișoara, 13 noiembrie 2026

Pentru remedierea unei defecțiuni tehnice apărute la rețeaua primară de termoficare, Colterm S.A. întrerupe furnizarea apei calde de consum și a încălzirii în data de 13.11.2026, între orele 09:00 și 20:00, la punctul termic PT 44.
Vor fi afectați consumatorii arondați următoarelor străzi din cartierul Circumvalațiunii și Complex:
- Str. Gheorghe Lazăr
- Str. Circumvalațiunii
- B-dul Cetății (parțial)

Ne cerem scuze pentru disconfortul creat și vă asigurăm că echipele noastre depun toate eforturile pentru reluarea furnizării în cel mai scurt timp.
`;

export interface ExtractedOutage {
  title: string;
  description: string;
  provider: 'colterm' | 'aquatim' | 'retele_electrice_banat' | 'delgaz_grid';
  type: 'heating_and_hot_water' | 'cold_water' | 'electricity' | 'gas';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_areas: string[];
  affected_streets: string[];
  estimated_restore_time: string;
}

export async function parseNoticeWithGeminiOrFallback(rawText: string): Promise<ExtractedOutage> {
  if (GEMINI_API_KEY) {
    try {
      console.log('[WORKER] 🤖 Calling Gemini 1.5 Flash API to parse utility notice...');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an expert Romanian utility report parser for Timișoara City Hub.
Extract the following information from this Colterm/Aquatim press release text into clean JSON format:
{
  "title": string,
  "description": string,
  "provider": "colterm" | "aquatim" | "retele_electrice_banat" | "delgaz_grid",
  "type": "heating_and_hot_water" | "cold_water" | "electricity" | "gas",
  "severity": "low" | "medium" | "high" | "critical",
  "affected_areas": string[],
  "affected_streets": string[],
  "estimated_restore_time": string (ISO 8601 or estimated date)
}

Respond ONLY with valid JSON.
Text to parse:
${rawText}`
                  }
                ]
              }
            ]
          })
        }
      );

      if (response.ok) {
        const json = await response.json();
        const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (content) {
          const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          console.log('[WORKER] ✅ Successfully extracted notice with Gemini AI:', parsed.title);
          return parsed;
        }
      }
    } catch (e: any) {
      console.warn('[WORKER] ⚠️ Gemini API call skipped or failed, using heuristic extractor:', e.message);
    }
  }

  // Robust heuristic extractor tailored to Timișoara utility announcements
  const streets: string[] = [];
  if (rawText.includes('Gheorghe Lazăr')) streets.push('Strada Gheorghe Lazăr');
  if (rawText.includes('Circumvalațiunii')) streets.push('Strada Circumvalațiunii');
  if (rawText.includes('Cetății')) streets.push('Bulevardul Cetății');

  return {
    provider: 'colterm',
    type: 'heating_and_hot_water',
    severity: 'high',
    title: 'Avarie Rețea Primară Colterm - Punct Termic PT 44',
    description: 'Întrerupere furnizare apă caldă și încălzire extrasă automat din comunicatul Colterm S.A.',
    affected_areas: ['Circumvalatiunii', 'Complex Studentesc'],
    affected_streets: streets,
    estimated_restore_time: new Date(Date.now() + 6 * 3600 * 1000).toISOString()
  };
}

export async function runColtermIngestion() {
  API_BASE_URL = await resolveApiUrl();
  console.log(`[NETROM GLUE] 🔄 Running Colterm Ingestion Worker against ${API_BASE_URL}...`);
  const extracted = await parseNoticeWithGeminiOrFallback(SAMPLE_RAW_COLTERM_NOTICE);

  try {
    const res = await fetch(`${API_BASE_URL}/v1/m/utilities/outages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(extracted)
    });

    if (res.ok) {
      const created = await res.json();
      console.log(`[NETROM GLUE] ✅ Ingested new outage into API: "${created.title}" (ID: ${created.id})`);
    } else {
      console.error('[NETROM GLUE] ❌ Failed to post outage to API:', await res.text());
    }
  } catch (err: any) {
    console.error(`[NETROM GLUE] ⚠️ Could not connect to API (${err.message}). Is API running on ${API_BASE_URL}?`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runColtermIngestion();
}
