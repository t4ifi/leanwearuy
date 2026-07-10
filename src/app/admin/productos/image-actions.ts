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

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB por foto
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** De la URL pública deduce la "key" (ruta interna) del objeto en R2. */
function keyFromUrl(url: string): string {
  const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
  return url.startsWith(base) ? url.slice(base.length + 1) : new URL(url).pathname.replace(/^\/+/, "");
}

export async function uploadImages(productId: string, formData: FormData) {
  await requireAdmin();

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
      return { error: `"${file.name}": pesa más de 8 MB.` };
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const key = `productos/${product.slug}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const url = await uploadToR2(key, buffer);

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
