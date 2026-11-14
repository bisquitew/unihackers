// A minimal MCP (Model Context Protocol) client over Streamable HTTP, enough to call a remote server's tools.
// Used by the assistant to reach Solana's official MCP servers. No SDK dependency: one JSON-RPC POST per call,
// answered as plain JSON or as a short server-sent event stream. Read-only use, allow-listed tools, timeouts, cache.

export type McpErrorKind = 'timeout' | 'http' | 'protocol' | 'tool';

// No constructor parameter properties: server.ts runs under node --experimental-strip-types.
export class McpError extends Error {
  readonly kind: McpErrorKind;
  constructor(message: string, kind: McpErrorKind) {
    super(message);
    this.name = 'McpError';
    this.kind = kind;
  }
}

interface ToolResult {
  /** structuredContent when the server sends it, otherwise the text content parsed as JSON when possible. */
  data: unknown;
  /** The text parts joined (what a model would read). */
  text: string;
}

const PROTOCOL_VERSION = '2025-03-26';
const CLIENT_INFO = { name: 'timisoara-city-hub-assistant', version: '1.0.0' };

/** Parses either a JSON body or an SSE body ("event: message\ndata: {...}") and returns the response for `id`. */
function parseRpcBody(body: string, contentType: string, id: number): any {
  if (contentType.includes('text/event-stream')) {
    const messages = body
      .split(/\r?\n/)
      .filter((l) => l.startsWith('data:'))
      .map((l) => {
        try {
          return JSON.parse(l.slice(5).trim());
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    return messages.find((m) => m.id === id) ?? messages[messages.length - 1];
  }
  return JSON.parse(body);
}

export class McpHttpClient {
  private sessionId: string | null = null;
  private nextId = 1;
  private readonly cache = new Map<string, { at: number; value: ToolResult }>();

  readonly url: string;
  private readonly opts: { allowedTools: string[]; timeoutMs: number; cacheMs: number };

  constructor(url: string, opts: { allowedTools: string[]; timeoutMs: number; cacheMs: number }) {
    this.url = url;
    this.opts = opts;
  }

  private async rpc(method: string, params: unknown): Promise<any> {
    const id = this.nextId++;
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
      'mcp-protocol-version': PROTOCOL_VERSION,
    };
    if (this.sessionId) headers['mcp-session-id'] = this.sessionId;
    let res: Response;
    try {
      res = await fetch(this.url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
        signal: AbortSignal.timeout(this.opts.timeoutMs),
      });
    } catch (err) {
      const timedOut = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
      throw new McpError(timedOut ? `${new URL(this.url).host} did not answer in ${this.opts.timeoutMs} ms` : `${new URL(this.url).host} is unreachable`, timedOut ? 'timeout' : 'http');
    }
    const session = res.headers.get('mcp-session-id');
    if (session) this.sessionId = session;
    const body = await res.text();
    if (!res.ok) throw new McpError(`${new URL(this.url).host} answered HTTP ${res.status}`, 'http');
    let msg: any;
    try {
      msg = parseRpcBody(body, res.headers.get('content-type') ?? '', id);
    } catch {
      throw new McpError('Unreadable MCP response', 'protocol');
    }
    if (!msg) throw new McpError('Empty MCP response', 'protocol');
    if (msg.error) throw new McpError(`MCP error: ${msg.error.message ?? 'unknown'}`, 'protocol');
    return msg.result;
  }

  /** Stateless servers accept tools/call directly; servers that need a session get one initialize first. */
  private async ensureSession(): Promise<void> {
    if (this.sessionId) return;
    await this.rpc('initialize', { protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: CLIENT_INFO });
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    if (!this.opts.allowedTools.includes(name)) throw new McpError(`Tool ${name} is not allowed`, 'tool');
    const key = `${name}:${JSON.stringify(args)}`;
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < this.opts.cacheMs) return hit.value;

    let result: any;
    try {
      result = await this.rpc('tools/call', { name, arguments: args });
    } catch (err) {
      // a server that wants a session answers 400/404 without one: initialize once and retry
      if (err instanceof McpError && err.kind === 'http' && !this.sessionId) {
        await this.ensureSession();
        result = await this.rpc('tools/call', { name, arguments: args });
      } else {
        throw err;
      }
    }
    const text = (Array.isArray(result?.content) ? result.content : [])
      .filter((c: any) => c?.type === 'text' && typeof c.text === 'string')
      .map((c: any) => c.text)
      .join('\n');
    if (result?.isError) throw new McpError(text.slice(0, 200) || 'The MCP tool reported an error', 'tool');
    let data: unknown = result?.structuredContent;
    if (data === undefined) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }
    const value = { data, text };
    this.cache.set(key, { at: Date.now(), value });
    if (this.cache.size > 200) this.cache.delete(this.cache.keys().next().value as string);
    return value;
  }
}
