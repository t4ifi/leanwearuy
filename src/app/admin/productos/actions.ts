"use server";

/**
 * Server Actions del ABM de productos.
 *
 * Seguridad en cada acción:
 *  1. requireAdmin() — vuelve a verificar sesión y rol en el servidor.
 *  2. Zod — valida y normaliza todo lo que llega del formulario.
 * Nunca se confía en lo que manda el navegador.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { productSchema, formDataToProduct } from "@/lib/validation";
import { uniqueSlug } from "@/lib/slug";

export type ActionState = { error?: string; fieldErrors?: Record<string, string> };

/** Convierte los errores de Zod en un mapa campo -> mensaje. */
function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const key = String(i.path[0] ?? "");
    if (key && !out[key]) out[key] = i.message;
  }
  return out;
}

/** Campos que se escriben igual al crear y al editar. */
function toDbData(d: ReturnType<typeof productSchema.parse>) {
  return {
    name: d.name,
    description: d.description,
    brandId: d.brandId,
    categoryId: d.categoryId,
    supplierId: d.supplierId,
    section: d.section,
    status: d.status,
    condition: d.condition,
    featured: d.featured,
    soldOut: d.soldOut,
    salePriceUyu: d.salePriceUyu,
    purchaseCostUsd: d.purchaseCostUsd,
    weightGrams: d.weightGrams,
    supplierUrl: d.supplierUrl,
    sku: d.sku,
    stock: d.stock,
    lowStockThreshold: d.lowStockThreshold,
    sizes: d.sizes,
    colors: d.colors,
  };
}

export async function createProduct(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = productSchema.safeParse(formDataToProduct(formData));
  if (!parsed.success) {
    return { error: "Revisá los campos marcados.", fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  const data = parsed.data;
  const brand = await prisma.brand.findUnique({ where: { id: data.brandId } });
  if (!brand) return { error: "La marca elegida no existe." };

  // El slug incluye la marca, igual que en el sitio viejo.
  const slug = await uniqueSlug(`${brand.name} ${data.name}`, async (s) =>
    Boolean(await prisma.product.findUnique({ where: { slug: s }, select: { id: true } })),
  );

  await prisma.product.create({ data: { ...toDbData(data), slug } });

  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function updateProduct(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const existing = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { error: "El producto no existe." };

  const parsed = productSchema.safeParse(formDataToProduct(formData));
  if (!parsed.success) {
    return { error: "Revisá los campos marcados.", fieldErrors: toFieldErrors(parsed.error.issues) };
  }

  await prisma.product.update({ where: { id }, data: toDbData(parsed.data) });

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${id}/editar`);
  redirect("/admin/productos");
}

export async function deleteProduct(id: string) {
  await requireAdmin();

  // Si el producto está en un pedido de importación, no se borra:
  // se perdería el historial de costos. Se archiva en su lugar.
  const enPedidos = await prisma.importItem.count({ where: { productId: id } });
  if (enPedidos > 0) {
    await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    revalidatePath("/admin/productos");
    return { archived: true as const };
  }

  await prisma.product.delete({ where: { id } }); // las imágenes caen en cascada
  revalidatePath("/admin/productos");
  return { archived: false as const };
}
