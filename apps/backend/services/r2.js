import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const endpoint = process.env.R2_ENDPOINT;
const region = process.env.R2_REGION || 'auto';
const bucket = process.env.R2_BUCKET_DOCS || process.env.R2_BUCKET_IMAGES;
const publicBase = (process.env.R2_PUBLIC_BASE_URL_DOCS || process.env.R2_PUBLIC_BASE_URL_IMAGES || '').replace(/\/$/, '');
const imageBucket = process.env.R2_BUCKET_IMAGES || bucket;
const imagePublicBase = (process.env.R2_PUBLIC_BASE_URL_IMAGES || publicBase || '').replace(/\/$/, '');
const previewBucket = process.env.R2_BUCKET_PREVIEWS || imageBucket;
const previewPublicBase = (process.env.R2_PUBLIC_BASE_URL_PREVIEWS || imagePublicBase || '').replace(/\/$/, '');
const maxDocBytes = Number(process.env.R2_MAX_DOC_BYTES || 50 * 1024 * 1024);
const maxImageBytes = Number(process.env.R2_MAX_IMAGE_BYTES || 8 * 1024 * 1024);
const signedExpiry = Number(process.env.R2_DOWNLOAD_EXPIRES_SEC || 900);

const allowedDocMimeTypes = new Set([
  'application/pdf',
  'application/json',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

if (!endpoint || !bucket) {
  console.warn('[r2] Missing R2 endpoint or bucket config; file operations will fail.');
}

export const r2Client = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export const r2Config = {
  bucket,
  publicBase,
  maxDocBytes,
  signedExpiry,
  allowedDocMimeTypes,
};
export const r2MediaConfig = {
  imageBucket,
  imagePublicBase,
  previewBucket,
  previewPublicBase,
  maxImageBytes,
  allowedImageMimeTypes,
};

export function assertAllowedDoc({ bytes, contentType }) {
  if (!allowedDocMimeTypes.has(contentType)) {
    throw new Error(`Unsupported content type: ${contentType}`);
  }
  if (bytes > maxDocBytes) {
    throw new Error(`Document exceeds max size of ${maxDocBytes} bytes`);
  }
}

export function getPublicR2Url(key) {
  if (!publicBase) return null;
  return `${publicBase}/${encodeURIComponent(key).replace(/%2F/g, '/')}`;
}

export function getPublicImageR2Url(key) {
  return imagePublicBase ? `${imagePublicBase}/${encodeURIComponent(key).replace(/%2F/g, '/')}` : null;
}

export function getPublicPreviewR2Url(key) {
  return previewPublicBase ? `${previewPublicBase}/${encodeURIComponent(key).replace(/%2F/g, '/')}` : null;
}

export function assertAllowedImage({ bytes, contentType }) {
  if (!allowedImageMimeTypes.has(contentType)) {
    throw new Error(`Unsupported image type: ${contentType}`);
  }
  if (bytes > maxImageBytes) {
    throw new Error(`Image exceeds max size of ${maxImageBytes} bytes`);
  }
}

export async function putImageObject({ key, body, contentType }) {
  if (!endpoint || !imageBucket || !imagePublicBase) {
    throw new Error('R2 image storage is not configured. Set R2_ENDPOINT, R2_BUCKET_IMAGES, and R2_PUBLIC_BASE_URL_IMAGES.');
  }
  const bytes = Buffer.isBuffer(body) ? body.byteLength : Buffer.byteLength(body);
  assertAllowedImage({ bytes, contentType });

  await r2Client.send(
    new PutObjectCommand({
      Bucket: imageBucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  return {
    key,
    bytes,
    contentType,
    url: getPublicImageR2Url(key),
  };
}

export async function putDocObject({ key, body, contentType }) {
  const bytes = Buffer.isBuffer(body) ? body.byteLength : Buffer.byteLength(body);
  assertAllowedDoc({ bytes, contentType });

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return {
    key,
    bytes,
    contentType,
    url: getPublicR2Url(key),
  };
}

export async function deleteDocObject(key) {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

export async function signDocGetUrl(key, expiresIn = signedExpiry) {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(r2Client, cmd, { expiresIn });
}
