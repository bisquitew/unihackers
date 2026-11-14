import dotenv from 'dotenv';
dotenv.config();

export const config = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8000',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  authToken: process.env.AUTH_TOKEN || 'dev_ai_agent',
  ingestionIntervalMs: parseInt(process.env.INGESTION_INTERVAL_MS || '600000', 10), // 10 mins
};

export async function resolveApiUrl(): Promise<string> {
  if (process.env.API_BASE_URL) return process.env.API_BASE_URL;
  for (const port of [8000, 8001, 8080]) {
    try {
      const res = await fetch(`http://localhost:${port}/health`, { signal: AbortSignal.timeout(400) });
      if (res.ok) return `http://localhost:${port}`;
    } catch {}
  }
  return 'http://localhost:8000';
}
