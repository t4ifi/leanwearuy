"use server";

/**
 * Edición de la info de proveedor de un producto: el proveedor, el link
 * para reponerlo y los talles que se consiguen.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";

export type SupplierState = { error?: string; ok?: boolean };

const schema = z.object({
  supplierId: z.string().transform((s) => (s === "" ? null : s)),
  supplierUrl: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s === "" || /^https?:\/\/.+/i.test(s), "El link debe empezar con http:// o https://")
    .transform((s) => (s === "" ? null : s)),
  sizes: z
    .string()
    .default("")
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean)),
});

export async function updateSupplierInfo(
  productId: string,
  _prev: SupplierState,
  fd: FormData,
): Promise<SupplierState> {
  await requireAdmin();

  const parsed = schema.safeParse({
    supplierId: (fd.get("supplierId") ?? "").toString(),
    supplierUrl: (fd.get("supplierUrl") ?? "").toString(),
    sizes: (fd.get("sizes") ?? "").toString(),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  await prisma.product.update({ where: { id: productId }, data: parsed.data });

  revalidatePath("/admin/proveedor");
  revalidatePath("/"); // los talles se ven en la web
  return { ok: true };
}
