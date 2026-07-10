"use server";

/**
 * Server Actions de los pedidos de importación.
 * Después de cualquier cambio se recalcula el prorrateo por peso.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { recalcImportOrder } from "@/lib/imports";

export type ActionState = { error?: string };

const num = (fallback = 0) =>
  z.union([z.string(), z.number()]).transform((v) => {
    const n = Number(v === "" ? fallback : v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  });

const orderSchema = z.object({
  code: z.string().trim().min(1, "Poné un código").max(40),
  orderDate: z.string().min(1),
  supplierId: z.string().transform((s) => (s === "" ? null : s)),
  status: z.enum(["DRAFT", "ORDERED", "SHIPPED", "RECEIVED", "CANCELLED"]),
  shippingCostUsd: num(),
  taxesUsd: num(),
  otherCostsUsd: num(),
  exchangeRate: num(40).refine((v) => v > 0, "El tipo de cambio debe ser mayor a 0"),
  notes: z.string().transform((s) => (s.trim() === "" ? null : s.trim())),
});

function readOrder(fd: FormData) {
  const g = (k: string) => (fd.get(k) ?? "").toString();
  return {
    code: g("code"),
    orderDate: g("orderDate"),
    supplierId: g("supplierId"),
    status: g("status"),
    shippingCostUsd: g("shippingCostUsd"),
    taxesUsd: g("taxesUsd"),
    otherCostsUsd: g("otherCostsUsd"),
    exchangeRate: g("exchangeRate"),
    notes: g("notes"),
  };
}

export async function createImportOrder(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = orderSchema.safeParse(readOrder(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const d = parsed.data;
  const yaExiste = await prisma.importOrder.findUnique({ where: { code: d.code } });
  if (yaExiste) return { error: `Ya existe un pedido con el código "${d.code}".` };

  const order = await prisma.importOrder.create({
    data: { ...d, orderDate: new Date(d.orderDate) },
  });

  revalidatePath("/admin/importaciones");
  redirect(`/admin/importaciones/${order.id}`);
}

export async function updateImportOrder(
  id: string,
  _p: ActionState,
  fd: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = orderSchema.safeParse(readOrder(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const d = parsed.data;
  await prisma.importOrder.update({
    where: { id },
    data: { ...d, orderDate: new Date(d.orderDate) },
  });

  // Cambió el envío o los impuestos: hay que repartirlos de nuevo.
  await recalcImportOrder(id);

  revalidatePath(`/admin/importaciones/${id}`);
  return {};
}

export async function deleteImportOrder(id: string) {
  await requireAdmin();
  await prisma.importOrder.delete({ where: { id } }); // los items caen en cascada
  revalidatePath("/admin/importaciones");
  redirect("/admin/importaciones");
}

/* ---------------------------- Líneas del pedido ---------------------------- */

const itemSchema = z.object({
  productId: z.string().min(1, "Elegí un producto"),
  quantity: num(1).refine((v) => v >= 1, "La cantidad mínima es 1"),
  unitCostUsd: num(),
  unitWeightGrams: num().refine((v) => v >= 0, "El peso no puede ser negativo"),
});

export async function addImportItem(orderId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = itemSchema.safeParse({
    productId: (fd.get("productId") ?? "").toString(),
    quantity: (fd.get("quantity") ?? "").toString(),
    unitCostUsd: (fd.get("unitCostUsd") ?? "").toString(),
    unitWeightGrams: (fd.get("unitWeightGrams") ?? "").toString(),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const d = parsed.data;
  const repetido = await prisma.importItem.findUnique({
    where: { importOrderId_productId: { importOrderId: orderId, productId: d.productId } },
  });
  if (repetido) return { error: "Ese producto ya está en el pedido. Editá la línea existente." };

  await prisma.importItem.create({ data: { ...d, importOrderId: orderId } });

  // Copiamos peso y costo al producto, para tenerlos a mano en el catálogo.
  await prisma.product.update({
    where: { id: d.productId },
    data: { weightGrams: d.unitWeightGrams, purchaseCostUsd: d.unitCostUsd },
  });

  await recalcImportOrder(orderId);
  revalidatePath(`/admin/importaciones/${orderId}`);
  return {};
}

export async function removeImportItem(itemId: string) {
  await requireAdmin();
  const item = await prisma.importItem.delete({ where: { id: itemId } });
  await recalcImportOrder(item.importOrderId);
  revalidatePath(`/admin/importaciones/${item.importOrderId}`);
  return { ok: true };
}
