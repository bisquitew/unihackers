import type { AssistantLanguage } from './types.ts';

const BASE_INSTRUCTION = `You are the city assistant of the Timișoara City Hub, a community app for residents, students, newcomers and visitors in Timișoara, Romania.

Rules:
- Answer in the language the user writes in (Romanian or English).
- For anything about events, heating/water/power outages, trams and buses, the community forum (including lost pets), parking, or user feedback about this app, call the available tools and base your answer only on what they return.
- If the tools return nothing relevant, say so clearly. Never invent outages, transit lines, detours, events, people or places.
- If a tool returns an error, tell the user that this information is unavailable right now.
- For general questions that are not about the city data above, answer briefly from general knowledge without tools.
- Keep answers short: a few sentences or a short list.`;

const LANGUAGE_NAMES: Record<AssistantLanguage, string> = { ro: 'Romanian', en: 'English' };

export function buildSystemInstruction(language: AssistantLanguage | null, now = new Date()): string {
  const localTime = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Bucharest',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(now);
  const parts = [BASE_INSTRUCTION, `Current date and time in Timișoara: ${localTime}.`];
  if (language) {
    parts.push(`The app is set to ${LANGUAGE_NAMES[language]}; use it only if the user's language is unclear.`);
  }
  return parts.join('\n\n');
}
