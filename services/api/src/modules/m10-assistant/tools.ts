export const Type = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
  ARRAY: 'ARRAY',
  OBJECT: 'OBJECT',
} as const;
export type Type = (typeof Type)[keyof typeof Type];
export type FunctionDeclaration = any;
export type Schema = any;
import type { ApiModule } from '../../types.ts';

const SELF_ID = 'm10-assistant';

export interface RegisteredTool {
  name: string;
  moduleId: string;
  declaration: FunctionDeclaration;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

const TYPE_MAP: Record<string, Type> = {
  object: Type.OBJECT,
  string: Type.STRING,
  number: Type.NUMBER,
  integer: Type.INTEGER,
  boolean: Type.BOOLEAN,
  array: Type.ARRAY,
};

/**
 * Modules declare schemas in two styles: P2 uses lowercase 'object'/'string', P3 and P4 use
 * 'OBJECT'/'STRING'. The SDK's Schema expects the Type enum (uppercase), so normalise recursively.
 */
export function normaliseSchema(input: unknown): Schema | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const s = input as Record<string, unknown>;
  const out: Schema = {};

  if (typeof s.type === 'string') {
    const t = TYPE_MAP[s.type.toLowerCase()];
    if (t) out.type = t;
  }
  if (typeof s.description === 'string') out.description = s.description;
  if (typeof s.format === 'string') out.format = s.format;
  if (s.nullable === true) out.nullable = true;
  if (Array.isArray(s.enum)) out.enum = s.enum.map(String);
  if (Array.isArray(s.required) && s.required.length > 0) out.required = s.required.map(String);
  if (s.items) out.items = normaliseSchema(s.items);
  if (s.properties && typeof s.properties === 'object') {
    const props: Record<string, Schema> = {};
    for (const [key, value] of Object.entries(s.properties as Record<string, unknown>)) {
      const p = normaliseSchema(value);
      if (p) props[key] = p;
    }
    out.properties = props;
  }
  return out;
}

function toDeclaration(tool: { name: string; description?: unknown; parameters?: unknown }): FunctionDeclaration {
  const declaration: FunctionDeclaration = {
    name: tool.name,
    description: typeof tool.description === 'string' ? tool.description : undefined,
  };
  const params = normaliseSchema(tool.parameters);
  // Gemini rejects an OBJECT schema with empty properties; tools without parameters leave it unset.
  if (params?.properties && Object.keys(params.properties).length > 0) declaration.parameters = params;
  return declaration;
}

function buildRegistry(modules: ApiModule[]): Map<string, RegisteredTool> {
  const tools = new Map<string, RegisteredTool>();
  for (const mod of modules) {
    if (mod.id === SELF_ID) continue;
    const list = Array.isArray(mod.assistantTools) ? mod.assistantTools : [];
    for (const tool of list) {
      if (!tool || typeof tool.name !== 'string' || typeof tool.handler !== 'function') {
        console.warn(`[m10-assistant] Skipping a malformed tool in module "${mod.id}"`);
        continue;
      }
      const existing = tools.get(tool.name);
      if (existing) {
        console.warn(
          `[m10-assistant] Duplicate tool name "${tool.name}" in "${mod.id}"; keeping the one from "${existing.moduleId}"`,
        );
        continue;
      }
      tools.set(tool.name, {
        name: tool.name,
        moduleId: mod.id,
        declaration: toDeclaration(tool),
        handler: tool.handler,
      });
    }
  }
  return tools;
}

let cached: Promise<Map<string, RegisteredTool>> | null = null;

/**
 * All assistant tools from the other registered modules, keyed by tool name.
 * The registry is imported lazily because it imports this module (circular at load time).
 */
export function getTools(): Promise<Map<string, RegisteredTool>> {
  if (!cached) {
    cached = import('../index.ts').then(({ registeredModules }) => buildRegistry(registeredModules));
    cached.catch(() => { cached = null; }); // retry on the next call if the import failed
  }
  return cached;
}
