/**
 * Genera un slug (identificador para URLs) a partir de un texto.
 * Es el mismo algoritmo que usaba el sitio viejo, para no romper links.
 *   "Jordan 4 Lightning" -> "jordan-4-lightning"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD") // separa las tildes de las letras
    .replace(/[̀-ͯ]/g, "") // y las borra
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Asegura que el slug sea único agregando un sufijo si hace falta:
 *   "remera-corteiz" -> "remera-corteiz-2"
 */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base) || "producto";
  let candidate = root;
  let n = 2;
  while (await exists(candidate)) {
    candidate = `${root}-${n++}`;
  }
  return candidate;
}
