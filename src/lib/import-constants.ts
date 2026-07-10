/**
 * Valor especial del select de productos en un pedido: indica que el item
 * NO está en el catálogo (se carga con un nombre a mano).
 *
 * Vive fuera de `actions.ts` porque un archivo "use server" sólo puede
 * exportar funciones async.
 */
export const FUERA_DE_CATALOGO = "__fuera__";
