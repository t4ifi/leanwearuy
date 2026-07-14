"use server";

/**
 * Server Actions para las imágenes de un producto.
 *
 * Los archivos se suben a Cloudflare R2 desde el servidor: el navegador
 * nunca ve las claves de R2. Cada archivo recibe un nombre único, así
 * dos fotos con el mismo nombre no se pisan.
 */
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { uploadToR2, deleteFromR2 } from "@/lib/r2";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB por foto (límite del servidor en Vercel ~4,5 MB)
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const R2_VARS = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL"];

/** De la URL pública deduce la "key" (ruta interna) del objeto en R2. */
function keyFromUrl(url: string): string {
  const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
  return url.startsWith(base) ? url.slice(base.length + 1) : new URL(url).pathname.replace(/^\/+/, "");
}

export async function uploadImages(productId: string, formData: FormData) {
  await requireAdmin();

  // Si faltan las credenciales de R2 (típico: no se cargaron en Vercel),
  // avisamos claro en vez de reventar con un error genérico.
  const faltan = R2_VARS.filter((k) => !process.env[k]);
  if (faltan.length) {
    return {
      error: `Falta configurar el almacenamiento de imágenes (R2) en el servidor: ${faltan.join(", ")}. Agregá esas variables en Vercel y volvé a desplegar.`,
    };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { slug: true, _count: { select: { images: true } } },
  });
  if (!product) return { error: "El producto no existe." };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "No elegiste ninguna imagen." };

  let position = product._count.images;
  let subidas = 0;

  for (const file of files) {
    if (!ALLOWED.includes(file.type)) {
      return { error: `"${file.name}": formato no permitido (usá JPG, PNG, WEBP o AVIF).` };
    }
    if (file.size > MAX_BYTES) {
      return {
        error: `"${file.name}" pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El máximo es 4 MB — achicá la foto o subí una más liviana.`,
      };
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const key = `productos/${product.slug}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    let url: string;
    try {
      url = await uploadToR2(key, buffer);
    } catch (e) {
      return { error: `No se pudo subir "${file.name}" a R2: ${(e as Error).message}` };
    }

    await prisma.productImage.create({
      data: {
        productId,
        url,
        position: position++,
        // La primera foto de todas queda como principal automáticamente.
        isPrimary: product._count.images === 0 && subidas === 0,
      },
    });
    subidas++;
  }

  revalidatePath(`/admin/productos/${productId}/editar`);
  revalidatePath("/admin/productos");
  return { ok: subidas };
}

export async function deleteImage(imageId: string) {
  await requireAdmin();

  const img = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!img) return { error: "La imagen no existe." };

  // Primero la base; si R2 falla, no dejamos una fila apuntando a la nada.
  await prisma.productImage.delete({ where: { id: imageId } });
  try {
    await deleteFromR2(keyFromUrl(img.url));
  } catch {
    // El archivo quedó huérfano en R2, pero la base está consistente.
  }

  // Si borramos la principal, ascendemos a la primera que quede.
  if (img.isPrimary) {
    const siguiente = await prisma.productImage.findFirst({
      where: { productId: img.productId },
      orderBy: { position: "asc" },
    });
    if (siguiente) {
      await prisma.productImage.update({ where: { id: siguiente.id }, data: { isPrimary: true } });
    }
  }

  revalidatePath(`/admin/productos/${img.productId}/editar`);
  revalidatePath("/admin/productos");
  return { ok: true };
}

export async function setPrimaryImage(imageId: string) {
  await requireAdmin();

  const img = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!img) return { error: "La imagen no existe." };

  // Una sola principal por producto.
  await prisma.$transaction([
    prisma.productImage.updateMany({
      where: { productId: img.productId },
      data: { isPrimary: false },
    }),
    prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ]);

  revalidatePath(`/admin/productos/${img.productId}/editar`);
  revalidatePath("/admin/productos");
  return { ok: true };
}
