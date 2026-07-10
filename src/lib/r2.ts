/**
 * Cloudflare R2 — almacenamiento de las imágenes de productos.
 *
 * R2 habla el mismo protocolo que Amazon S3, así que usamos el SDK de AWS
 * apuntándolo al endpoint de Cloudflare. Guardar las imágenes acá (y no en
 * el repo) hace que el sitio despliegue rápido y no tenga límite de tamaño.
 *
 * Las claves viven solo en el .env del servidor: nunca llegan al navegador.
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable ${name} en el .env`);
  return v;
}

let cached: S3Client | null = null;

export function r2Client(): S3Client {
  if (cached) return cached;

  cached = new S3Client({
    region: "auto",
    endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
  return cached;
}

/** Deduce el Content-Type a partir de la extensión del archivo. */
export function contentTypeFor(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  return (
    {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      avif: "image/avif",
      gif: "image/gif",
      svg: "image/svg+xml",
    }[ext ?? ""] ?? "application/octet-stream"
  );
}

/** Sube un archivo y devuelve su URL pública. */
export async function uploadToR2(key: string, body: Buffer | Uint8Array): Promise<string> {
  await r2Client().send(
    new PutObjectCommand({
      Bucket: requireEnv("R2_BUCKET_NAME"),
      Key: key,
      Body: body,
      ContentType: contentTypeFor(key),
      // Un año de caché: las imágenes no cambian (cada una tiene nombre único).
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return publicUrl(key);
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client().send(
    new DeleteObjectCommand({ Bucket: requireEnv("R2_BUCKET_NAME"), Key: key }),
  );
}

/** URL pública de un objeto (dominio r2.dev o el dominio propio). */
export function publicUrl(key: string): string {
  const base = requireEnv("R2_PUBLIC_URL").replace(/\/+$/, "");
  return `${base}/${key}`;
}
