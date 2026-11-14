import {
  FunctionCallingConfigMode,
  GoogleGenAI,
  type Content,
  type FunctionCall,
  type GenerateContentConfig,
  type GenerateContentResponse,
  type Part,
} from '@google/genai';
import { getTools, type RegisteredTool } from './tools.ts';
import { buildSystemInstruction } from './prompt.ts';
import type { ChatInput, ChatResult, ToolUse } from './types.ts';

/** Stable, fast model (see Gemini models page). Override with GEMINI_MODEL if needed. */
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
/** Rounds in which the model may call tools; one extra round then forces a text answer. */
const MAX_TOOL_ROUNDS = 5;

/** Thrown when the assistant can't answer because Gemini is missing or failing (maps to 503). */
export class AssistantUnavailableError extends Error {}

let client: GoogleGenAI | null = null;
let clientKey = '';

function getClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new AssistantUnavailableError('The assistant is not configured: GEMINI_API_KEY is missing.');
  if (!client || key !== clientKey) {
    client = new GoogleGenAI({ apiKey: key });
    clientKey = key;
  }
  return client;
}

/** Error text that is safe to log: never contains the API key. */
function safeMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const key = process.env.GEMINI_API_KEY?.trim();
  return (key ? raw.split(key).join('[redacted]') : raw).slice(0, 300);
}

async function callModel(ai: GoogleGenAI, contents: Content[], config: GenerateContentConfig): Promise<GenerateContentResponse> {
  try {
    return await ai.models.generateContent({ model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL, contents, config });
  } catch (err) {
    const status = (err as { status?: number }).status;
    console.error(`[m10-assistant] Gemini request failed${status ? ` (HTTP ${status})` : ''}: ${safeMessage(err)}`);
    if (status === 429) {
      throw new AssistantUnavailableError('The assistant is getting too many questions right now. Please wait a few seconds and try again.');
    }
    throw new AssistantUnavailableError('The AI service is unavailable right now. Please try again in a moment.');
  }
}

async function runTool(call: FunctionCall, tools: Map<string, RegisteredTool>, used: Map<string, ToolUse>): Promise<Part> {
  const name = call.name ?? 'unknown';
  const respond = (response: Record<string, unknown>): Part => ({ functionResponse: { id: call.id, name, response } });

  const tool = tools.get(name);
  if (!tool) return respond({ error: `Unknown tool "${name}".` });
  used.set(tool.name, { name: tool.name, moduleId: tool.moduleId });

  try {
    const output = await tool.handler(call.args ?? {});
    return respond({ output: output ?? null });
  } catch (err) {
    console.warn(`[m10-assistant] Tool "${name}" (${tool.moduleId}) threw: ${safeMessage(err)}`);
    return respond({ error: `The ${tool.moduleId} data source failed: ${safeMessage(err)}` });
  }
}

export class AssistantService {
  async listTools(): Promise<{ moduleId: string; tools: string[] }[]> {
    const byModule = new Map<string, string[]>();
    for (const t of (await getTools()).values()) {
      byModule.set(t.moduleId, [...(byModule.get(t.moduleId) ?? []), t.name]);
    }
    return [...byModule.entries()].map(([moduleId, tools]) => ({ moduleId, tools }));
  }

  async chat(input: ChatInput): Promise<ChatResult> {
    const ai = getClient();
    const tools = await getTools();
    const declarations = [...tools.values()].map((t) => t.declaration);

    const baseConfig: GenerateContentConfig = {
      systemInstruction: buildSystemInstruction(input.language),
      ...(declarations.length ? { tools: [{ functionDeclarations: declarations }] } : {}),
    };

    const contents: Content[] = [
      ...input.history.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
      { role: 'user', parts: [{ text: input.message }] },
    ];
    const used = new Map<string, ToolUse>();

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const lastRound = round === MAX_TOOL_ROUNDS;
      const config: GenerateContentConfig = lastRound && declarations.length
        ? { ...baseConfig, toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.NONE } } }
        : baseConfig;

      const response = await callModel(ai, contents, config);
      const calls = response.functionCalls ?? [];

      if (calls.length === 0 || lastRound) {
        const reply = response.text?.trim();
        return {
          reply: reply || 'Sorry, I could not produce an answer. / Nu am putut formula un răspuns.',
          toolsUsed: [...used.values()],
        };
      }

      // Send the model's turn back unchanged (it carries thought signatures), then the tool results.
      contents.push(
        response.candidates?.[0]?.content ?? { role: 'model', parts: calls.map((functionCall) => ({ functionCall })) },
      );
      const results = await Promise.all(calls.map((call) => runTool(call, tools, used)));
      contents.push({ role: 'user', parts: results });
    }

    // Unreachable: the last round always returns.
    throw new AssistantUnavailableError('The assistant could not finish the answer.');
  }
}

export const assistantService = new AssistantService();
