// src/lib/r2.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ─────────────────────────────────────────────
// Cliente Cloudflare R2 (compatível com S3 API)
// ─────────────────────────────────────────────

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID!;
const R2_ACCESS_KEY = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
const R2_SECRET_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;
const R2_BUCKET     = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!;

// Limite de 150 MB por arquivo
export const MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024;

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
});

// ─────────────────────────────────────────────
// Gera chave única para o arquivo no bucket
// Estrutura: evidencias/{municipalityId}/{criteriaId}/{uuid}-{filename}
// ─────────────────────────────────────────────

export function generateFileKey(
  municipalityId: string,
  criteriaId: string,
  fileName: string
): string {
  const sanitized = fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
  const uuid = crypto.randomUUID();
  const timestamp = Date.now();
  return `evidencias/${municipalityId}/${criteriaId}/${timestamp}-${uuid}-${sanitized}`;
}

// ─────────────────────────────────────────────
// Gera chave única para arquivo de habilitação
// Estrutura: habilitacao/{municipalityId}/{docCode}/{timestamp}-{uuid}-{filename}
// ─────────────────────────────────────────────

export function generateHabilitacaoFileKey(
  municipalityId: string,
  docCode: string,
  fileName: string
): string {
  const sanitized = fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");
  const uuid = crypto.randomUUID();
  const timestamp = Date.now();
  return `habilitacao/${municipalityId}/${docCode}/${timestamp}-${uuid}-${sanitized}`;
}

// ─────────────────────────────────────────────
// Gera URL presignada para upload direto do browser → R2
// Válida por 15 minutos
// ─────────────────────────────────────────────

export async function generatePresignedUploadUrl(
  fileKey: string,
  fileType: string,
  fileSizeBytes: number
): Promise<string> {
  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `Arquivo excede o limite de ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`
    );
  }

  if (!ALLOWED_FILE_TYPES.includes(fileType)) {
    throw new Error(`Tipo de arquivo não permitido: ${fileType}`);
  }

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileKey,
    ContentType: fileType,
    
    Metadata: {
      "uploaded-at": new Date().toISOString(),
    },
  });

  return getSignedUrl(r2Client, command, { expiresIn: 900 }); // 15 min
}

// ─────────────────────────────────────────────
// Gera URL presignada para download (visualização)
// Válida por 1 hora
// ─────────────────────────────────────────────

export async function generatePresignedDownloadUrl(
  fileKey: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileKey,
  });
  return getSignedUrl(r2Client, command, { expiresIn: 3600 }); // 1h
}

// ─────────────────────────────────────────────
// URL pública (se bucket tem public access habilitado)
// ─────────────────────────────────────────────

export function getPublicFileUrl(fileKey: string): string {
  return `${R2_PUBLIC_URL}/${fileKey}`;
}

// ─────────────────────────────────────────────
// Deleta arquivo do R2
// ─────────────────────────────────────────────

export async function deleteFile(fileKey: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileKey,
  });
  await r2Client.send(command);
}

// ─────────────────────────────────────────────
// Valida tipo e tamanho antes de gerar URL
// ─────────────────────────────────────────────

export function validateFile(
  fileType: string,
  fileSizeBytes: number
): { valid: boolean; error?: string } {
  if (fileSizeBytes > MAX_FILE_SIZE_BYTES) {
    const mb = (fileSizeBytes / 1024 / 1024).toFixed(1);
    const maxMb = MAX_FILE_SIZE_BYTES / 1024 / 1024;
    return { valid: false, error: `Arquivo de ${mb}MB excede o limite de ${maxMb}MB` };
  }

  if (!ALLOWED_FILE_TYPES.includes(fileType)) {
    return { valid: false, error: `Tipo "${fileType}" não é permitido. Use PDF, imagens ou documentos Office.` };
  }

  return { valid: true };
}

export { r2Client };