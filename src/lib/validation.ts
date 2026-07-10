/**
 * Validación de datos con Zod.
 *
 * Todo lo que entra desde un formulario se valida ACÁ, en el servidor,
 * antes de tocar la base. Nunca confiamos en la validación del navegador.
 */
import { z } from "zod";

/** Convierte "" en null y el resto en número. Para campos opcionales. */
const optionalNumber = z
  .union([z.string(), z.number(), z.null()])
  .transform((v) => {
    if (v === null || v === "" || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  })
  .refine((v) => v === null || v >= 0, { message: "No puede ser negativo" });

/** Entero no negativo con valor por defecto. */
const intWithDefault = (fallback: number) =>
  z
    .union([z.string(), z.number()])
    .transform((v) => {
      if (v === "" || v === null || v === undefined) return fallback;
      const n = Math.trunc(Number(v));
      return Number.isFinite(n) ? n : fallback;
    })
    .refine((v) => v >= 0, { message: "No puede ser negativo" });

/** "S, M, L" -> ["S","M","L"] */
const csvList = z
  .string()
  .default("")
  .transform((s) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
  );

/** "" -> null; si hay algo, tiene que ser una URL válida. */
const optionalUrl = z
  .string()
  .default("")
  .transform((s) => s.trim())
  .refine((s) => s === "" || /^https?:\/\/.+/i.test(s), {
    message: "Debe ser una URL que empiece con http:// o https://",
  })
  .transform((s) => (s === "" ? null : s));

const optionalText = (max: number) =>
  z
    .string()
    .default("")
    .transform((s) => s.trim())
    .refine((s) => s.length <= max, { message: `Máximo ${max} caracteres` })
    .transform((s) => (s === "" ? null : s));

export const productSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  description: optionalText(2000),

  brandId: z.string().min(1, "Elegí una marca"),
  categoryId: z.string().min(1, "Elegí una categoría"),
  supplierId: z
    .string()
    .default("")
    .transform((s) => (s === "" ? null : s)),

  section: z.enum(["STOCK", "ENCARGUE"]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
  condition: z.enum(["NEW", "PREOWNED"]),

  featured: z.coerce.boolean(),
  soldOut: z.coerce.boolean(),

  // Precio de venta en pesos. Vacío o 0 => la web muestra "Consultar".
  salePriceUyu: optionalNumber,
  // Costo de compra en dólares.
  purchaseCostUsd: optionalNumber,
  // Peso individual en gramos (clave para prorratear el envío).
  weightGrams: optionalNumber,

  supplierUrl: optionalUrl,
  sku: optionalText(60),

  stock: intWithDefault(0),
  lowStockThreshold: intWithDefault(2),

  sizes: csvList,
  colors: csvList,
});

export type ProductInput = z.infer<typeof productSchema>;

/** Toma un FormData del navegador y lo convierte a objeto para validar. */
export function formDataToProduct(fd: FormData) {
  const get = (k: string) => (fd.get(k) ?? "").toString();
  return {
    name: get("name"),
    description: get("description"),
    brandId: get("brandId"),
    categoryId: get("categoryId"),
    supplierId: get("supplierId"),
    section: get("section"),
    status: get("status"),
    condition: get("condition"),
    featured: fd.get("featured") === "on",
    soldOut: fd.get("soldOut") === "on",
    salePriceUyu: get("salePriceUyu"),
    purchaseCostUsd: get("purchaseCostUsd"),
    weightGrams: get("weightGrams"),
    supplierUrl: get("supplierUrl"),
    sku: get("sku"),
    stock: get("stock"),
    lowStockThreshold: get("lowStockThreshold"),
    sizes: get("sizes"),
    colors: get("colors"),
  };
}
