/**
 * Proxy (antes "middleware"): bloquea /admin a quien no esté logueado
 * como ADMIN o STAFF.
 *
 * Corre en el runtime Edge, por eso usa `authConfig` (sin Prisma ni bcrypt).
 * La decisión la toma el callback `authorized` leyendo el JWT firmado.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Solo intercepta el panel; el catálogo público no pasa por acá.
  matcher: ["/admin/:path*"],
};
