// Loads the repo-root .env before any other module reads process.env.
// Imported first in index.ts. Existing environment variables are not overridden,
// and a missing .env is ignored (Docker/Vultr pass real env vars instead).
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });
