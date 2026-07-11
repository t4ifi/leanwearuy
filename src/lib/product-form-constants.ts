/**
 * Valores centinela para "crear al vuelo" desde el formulario de producto.
 * Van en su propio archivo porque un módulo "use server" sólo puede exportar
 * funciones async.
 */
export const NEW_BRAND = "__new_brand__";
export const NEW_CAT = "__new_cat__";

/** Talles predefinidos por tipo. Se muestran como casillas para tildar. */
export const SHOE_SIZES = [
  "36", "36.5", "37", "37.5", "38", "38.5", "39", "40", "40.5", "41",
  "42", "42.5", "43", "44", "44.5", "45", "46", "46.5", "47", "47.5",
];

export const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

/** Devuelve el set de talles según el grupo de la categoría. */
export function sizesForGroup(group: string | null | undefined): string[] {
  if (group === "Calzado") return SHOE_SIZES;
  if (group === "Ropa") return CLOTHING_SIZES;
  return []; // Accesorios / otros: talles a medida (cm, Único, etc.)
}
