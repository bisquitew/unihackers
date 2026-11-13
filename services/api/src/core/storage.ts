import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { UploadRequestPayload, UploadSignedUrlResponse } from '@hub/contracts';

const VULTR_STORAGE_KEY = process.env.VULTR_STORAGE_KEY || '';
const VULTR_STORAGE_SECRET = process.env.VULTR_STORAGE_SECRET || '';
const VULTR_STORAGE_BUCKET = process.env.VULTR_STORAGE_BUCKET || 'timisoara-hub-media';
const VULTR_STORAGE_REGION = process.env.VULTR_STORAGE_REGION || 'fra1';
const VULTR_STORAGE_ENDPOINT = process.env.VULTR_STORAGE_ENDPOINT || `https://${VULTR_STORAGE_REGION}.vultrobjects.com`;

const LOCAL_UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure local uploads directory exists
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

// Generate S3 SigV4 presigned PUT URL
function generateVultrPresignedPutUrl(key: string, contentType: string, expiresInSeconds = 900): string {
  const dateObj = new Date();
  const dateStr = dateObj.toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 8); // YYYYMMDD
  const amzDate = dateObj.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ

  const host = `${VULTR_STORAGE_BUCKET}.${VULTR_STORAGE_REGION}.vultrobjects.com`;
  const credentialScope = `${dateStr}/${VULTR_STORAGE_REGION}/s3/aws4_request`;

  const queryParams = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${VULTR_STORAGE_KEY}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': expiresInSeconds.toString(),
    'X-Amz-SignedHeaders': 'content-type;host'
  });
  queryParams.sort();

  const canonicalRequest = [
    'PUT',
    `/${key}`,
    queryParams.toString(),
    `content-type:${contentType}\nhost:${host}\n`,
    'content-type;host',
    'UNSIGNED-PAYLOAD'
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex')
  ].join('\n');

  function hmac(key: Buffer | string, data: string): Buffer {
    return crypto.createHmac('sha256', key).update(data).digest();
  }

  const kDate = hmac('AWS4' + VULTR_STORAGE_SECRET, dateStr);
  const kRegion = hmac(kDate, VULTR_STORAGE_REGION);
  const kService = hmac(kRegion, 's3');
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  return `https://${host}/${key}?${queryParams.toString()}&X-Amz-Signature=${signature}`;
}

export const storageService = {
  createSignedUploadUrl(payload: UploadRequestPayload, hostHeader: string): UploadSignedUrlResponse {
    const moduleId = payload.module_id || 'general';
    const ext = path.extname(payload.filename) || (payload.content_type === 'image/png' ? '.png' : '.jpg');
    const randomId = crypto.randomUUID();
    const key = `${moduleId}/${Date.now()}-${randomId}${ext}`;
    const expiresIn = 900; // 15 minutes

    // Production mode with Vultr credentials
    if (VULTR_STORAGE_KEY && VULTR_STORAGE_SECRET) {
      const uploadUrl = generateVultrPresignedPutUrl(key, payload.content_type, expiresIn);
      const publicUrl = `https://${VULTR_STORAGE_BUCKET}.${VULTR_STORAGE_REGION}.vultrobjects.com/${key}`;
      return {
        upload_url: uploadUrl,
        public_url: publicUrl,
        key,
        expires_in: expiresIn
      };
    }

    // Dev / Local mode: direct local upload route
    const baseUrl = `http://${hostHeader || 'localhost:8000'}`;
    return {
      upload_url: `${baseUrl}/v1/core/upload/raw/${encodeURIComponent(key)}`,
      public_url: `${baseUrl}/uploads/${encodeURIComponent(key)}`,
      key,
      expires_in: expiresIn
    };
  },

  async saveLocalFile(key: string, data: Buffer): Promise<string> {
    const filePath = path.join(LOCAL_UPLOADS_DIR, key);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.writeFile(filePath, data);
    return filePath;
  },

  getLocalFile(key: string): { data: Buffer; contentType: string } | null {
    const filePath = path.join(LOCAL_UPLOADS_DIR, key);
    if (!fs.existsSync(filePath)) return null;

    const data = fs.readFileSync(filePath);
    const ext = path.extname(key).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.heic': 'image/heic',
      '.gif': 'image/gif'
    };
    return { data, contentType: mimeMap[ext] || 'application/octet-stream' };
  }
};
