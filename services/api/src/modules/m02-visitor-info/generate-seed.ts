/**
 * Regenerates seed.ts from docs/visitor-info/content.md, so the text is never retyped by hand.
 * Run after editing content.md:
 *   cd services/api && npx tsx src/modules/m02-visitor-info/generate-seed.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VISITOR_CATEGORIES, type VisitorCategory, type VisitorInfoEntry } from './types.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.resolve(here, '../../../../../docs/visitor-info/content.md');
const OUT = path.join(here, 'seed.ts');

const FIELDS = ['category', 'verify', 'source', 'checked', 'ro_title', 'ro', 'en_title', 'en'] as const;

export function parseContent(markdown: string): VisitorInfoEntry[] {
  const entries: VisitorInfoEntry[] = [];
  // Each entry is a "## <id>" heading followed by "- key: value" lines.
  const sections = markdown.replace(/\r\n/g, '\n').split(/^## /m).slice(1);
  for (const section of sections) {
    const [heading, ...lines] = section.split('\n');
    const id = heading.trim();
    const fields: Record<string, string> = {};
    for (const line of lines) {
      const m = /^- ([a-z_]+): (.*)$/.exec(line.trim());
      if (m) fields[m[1]] = m[2].trim();
    }
    // Sections without fields (e.g. "Not included yet") are notes, not entries.
    if (Object.keys(fields).length === 0) continue;
    if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`Bad entry id "${id}"`);
    const missing = FIELDS.filter((f) => !fields[f]);
    if (missing.length) throw new Error(`Entry "${id}" is missing: ${missing.join(', ')}`);
    if (!VISITOR_CATEGORIES.includes(fields.category as VisitorCategory)) {
      throw new Error(`Entry "${id}" has unknown category "${fields.category}"`);
    }
    if (fields.verify !== 'yes' && fields.verify !== 'no') throw new Error(`Entry "${id}": verify must be yes or no`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.checked)) throw new Error(`Entry "${id}": checked must be YYYY-MM-DD`);
    if (entries.some((e) => e.id === id)) throw new Error(`Duplicate entry id "${id}"`);
    entries.push({
      id,
      category: fields.category as VisitorCategory,
      verify: fields.verify === 'yes',
      sources: fields.source.split(/\s*;\s*/).filter(Boolean),
      checked: fields.checked,
      ro: { title: fields.ro_title, text: fields.ro },
      en: { title: fields.en_title, text: fields.en },
    });
  }
  return entries;
}

function main() {
  const entries = parseContent(fs.readFileSync(CONTENT, 'utf8'));
  const body =
    `// GENERATED from docs/visitor-info/content.md by generate-seed.ts. Do not edit by hand:\n` +
    `// change content.md, then run: cd services/api && npx tsx src/modules/m02-visitor-info/generate-seed.ts\n` +
    `import type { VisitorInfoEntry } from './types.ts';\n\n` +
    `export const seedVisitorInfo: VisitorInfoEntry[] = ${JSON.stringify(entries, null, 2)};\n`;
  fs.writeFileSync(OUT, body, 'utf8');
  console.log(`Wrote ${entries.length} entries to ${path.relative(process.cwd(), OUT)}`);
}

main();
