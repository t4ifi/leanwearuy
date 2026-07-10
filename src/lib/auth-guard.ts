import { auth } from "@/auth";

/**
 * Defensa en profundidad.
 *
 * El proxy ya bloquea /admin, pero las Server Actions se pueden invocar
 * directamente por HTTP. Por eso CADA acción que modifica datos vuelve a
 * verificar la sesión y el rol acá, del lado del servidor.
 */
export async function requireAdmin() {
  const session = await auth();
  const role = session?.user?.role;

  if (!session?.user || (role !== "ADMIN" && role !== "STAFF")) {
    throw new Error("No autorizado");
  }
  return session.user;
}
