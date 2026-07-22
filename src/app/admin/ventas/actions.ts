"use server";

/**
 * Registro de ventas.
 *
 * Al vender, se guarda el costo real del momento (snapshot en pesos), así la
 * ganancia histórica no cambia aunque después varíen los costos o el dólar.
 * Si la venta es de un producto del catálogo, se le descuenta el stock.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guard";
import { VENTA_SUELTA } from "@/lib/sales-constants";

export type SaleState = { error?: string; ok?: boolean };

const num = (fallback = 0) =>
  z.union([z.string(), z.number()]).transform((v) => {
    const n = Number(v === "" ? fallback : v);
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  });

const schema = z.object({
  productId: z.string(),
  productName: z.string().trim(),
  quantity: num(1).refine((v) => v >= 1, "La cantidad mínima es 1"),
  unitPriceUyu: num().refine((v) => v > 0, "Poné el precio de venta"),
  unitCostUyu: num(),
  date: z.string().min(1),
  customer: z.string().transform((s) => (s.trim() === "" ? null : s.trim())),
  notes: z.string().transform((s) => (s.trim() === "" ? null : s.trim())),
});

export async function createSale(_prev: SaleState, fd: FormData): Promise<SaleState> {
  await requireAdmin();
  const g = (k: string) => (fd.get(k) ?? "").toString();

  const parsed = schema.safeParse({
    productId: g("productId"),
    productName: g("productName"),
    quantity: g("quantity"),
    unitPriceUyu: g("unitPriceUyu"),
    unitCostUyu: g("unitCostUyu"),
    date: g("date"),
    customer: g("customer"),
    notes: g("notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };

  const d = parsed.data;
  const esSuelta = d.productId === VENTA_SUELTA || d.productId === "";
  const productId = esSuelta ? null : d.productId;

  // Nombre: si es de catálogo, lo tomamos del producto (más confiable).
  let productName = d.productName;
  if (productId) {
    const prod = await prisma.product.findUnique({ where: { id: productId }, select: { name: true } });
    if (!prod) return { error: "El producto elegido no existe." };
    productName = prod.name;
  }
  if (!productName) return { error: "Falta el nombre del producto vendido." };

  await prisma.sale.create({
    data: {
      productId,
      productName,
      quantity: d.quantity,
      unitPriceUyu: d.unitPriceUyu,
      unitCostUyu: d.unitCostUyu,
      date: new Date(d.date),
      customer: d.customer,
      notes: d.notes,
    },
  });

  // Descontar stock (sin bajar de 0).
  if (productId) {
    const prod = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } });
    if (prod) {
      await prisma.product.update({
        where: { id: productId },
        data: { stock: Math.max(0, prod.stock - d.quantity) },
      });
    }
  }

  revalidatePath("/admin/ventas");
  return { ok: true };
}

export async function deleteSale(id: string) {
  await requireAdmin();

  const sale = await prisma.sale.delete({ where: { id } });

  // Devolver el stock que se había descontado.
  if (sale.productId) {
    const prod = await prisma.product.findUnique({ where: { id: sale.productId }, select: { stock: true } });
    if (prod) {
      await prisma.product.update({
        where: { id: sale.productId },
        data: { stock: prod.stock + sale.quantity },
      });
    }
  }

  revalidatePath("/admin/ventas");
  return { ok: true };
}
