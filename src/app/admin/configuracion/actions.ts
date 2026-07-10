"use server";

/**
 * Configuración de la tienda, marcas, categorías y proveedores.
 * Todo editable sin tocar código.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { slugify } from "@/lib/slug";

export type ActionState = { error?: string; ok?: string };

const opt = z.string().transform((s) => (s.trim() === "" ? null : s.trim()));
const pos = z
  .string()
  .transform((s) => Number(s))
  .refine((n) => Number.isFinite(n) && n > 0, "Tiene que ser un número mayor a 0");

const settingsSchema = z.object({
  storeName: z.string().trim().min(1, "El nombre no puede estar vacío"),
  tagline: opt,
  instagram: opt,
  contactEmail: opt,
  currencySymbol: z.string().trim().min(1).max(3),
  exchangeRateUsdUyu: pos,
  defaultMarginPct: z
    .string()
    .transform((s) => Number(s))
    .refine((n) => Number.isFinite(n) && n >= 0 && n < 100, "El margen va de 0 a 99"),
  encargueLeadTimeDays: opt,
});

export async function updateSettings(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const g = (k: string) => (fd.get(k) ?? "").toString();

  const parsed = settingsSchema.safeParse({
    storeName: g("storeName"),
    tagline: g("tagline"),
    instagram: g("instagram").replace(/^@/, ""), // por si escriben la arroba
    contactEmail: g("contactEmail"),
    currencySymbol: g("currencySymbol"),
    exchangeRateUsdUyu: g("exchangeRateUsdUyu"),
    defaultMarginPct: g("defaultMarginPct"),
    encargueLeadTimeDays: g("encargueLeadTimeDays"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  await prisma.storeSettings.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });

  revalidatePath("/admin/configuracion");
  revalidatePath("/", "layout"); // el sitio público usa estos datos
  return { ok: "Configuración guardada." };
}

/* ---------------------------------- Marcas ---------------------------------- */

export async function createBrand(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = (fd.get("name") ?? "").toString().trim();
  if (!name) return { error: "Escribí el nombre de la marca." };

  const slug = slugify(name);
  const existe = await prisma.brand.findFirst({ where: { OR: [{ name }, { slug }] } });
  if (existe) return { error: `La marca "${name}" ya existe.` };

  await prisma.brand.create({ data: { name, slug } });
  revalidatePath("/admin/configuracion");
  return { ok: `Marca "${name}" creada.` };
}

export async function deleteBrand(id: string) {
  await requireAdmin();
  const usados = await prisma.product.count({ where: { brandId: id } });
  if (usados > 0) return { error: `No se puede borrar: tiene ${usados} productos.` };

  await prisma.brand.delete({ where: { id } });
  revalidatePath("/admin/configuracion");
  return { ok: true };
}

/* -------------------------------- Categorías -------------------------------- */

export async function createCategory(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = (fd.get("name") ?? "").toString().trim();
  const parentId = (fd.get("parentId") ?? "").toString();
  if (!name) return { error: "Escribí el nombre de la categoría." };
  if (!parentId) return { error: "Elegí a qué grupo pertenece." };

  const slug = slugify(name);
  if (await prisma.category.findUnique({ where: { slug } })) {
    return { error: `La categoría "${name}" ya existe.` };
  }

  await prisma.category.create({ data: { name, slug, parentId } });
  revalidatePath("/admin/configuracion");
  return { ok: `Categoría "${name}" creada.` };
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const usados = await prisma.product.count({ where: { categoryId: id } });
  if (usados > 0) return { error: `No se puede borrar: tiene ${usados} productos.` };

  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/configuracion");
  return { ok: true };
}

/* -------------------------------- Proveedores -------------------------------- */

export async function createSupplier(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = (fd.get("name") ?? "").toString().trim();
  const url = (fd.get("url") ?? "").toString().trim() || null;
  if (!name) return { error: "Escribí el nombre del proveedor." };

  if (await prisma.supplier.findUnique({ where: { name } })) {
    return { error: `El proveedor "${name}" ya existe.` };
  }

  await prisma.supplier.create({ data: { name, url } });
  revalidatePath("/admin/configuracion");
  return { ok: `Proveedor "${name}" creado.` };
}

export async function deleteSupplier(id: string) {
  await requireAdmin();
  const pedidos = await prisma.importOrder.count({ where: { supplierId: id } });
  if (pedidos > 0) return { error: `No se puede borrar: tiene ${pedidos} pedidos.` };

  await prisma.supplier.delete({ where: { id } });
  revalidatePath("/admin/configuracion");
  return { ok: true };
}
