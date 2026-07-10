/**
 * Configuración de Auth.js "liviana" (sin Prisma ni bcrypt).
 *
 * El middleware de Next corre en el runtime Edge, donde NO se pueden usar
 * bcrypt ni el cliente de Prisma. Por eso separamos: acá va lo que el
 * middleware necesita para decidir quién pasa, y en `auth.ts` va el
 * proveedor de credenciales (que sí toca la base de datos).
 */
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  // En Vercel el dominio lo pone la plataforma; confiamos en el host del deploy.
  trustHost: true,

  pages: {
    signIn: "/login",
  },

  // Sesión por JWT: es obligatorio al usar login con credenciales.
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8 horas

  providers: [], // se agregan en auth.ts (runtime Node)

  callbacks: {
    /** Portero: decide si la request puede seguir. Lo usa el middleware. */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const isAdminArea = nextUrl.pathname.startsWith("/admin");

      if (isAdminArea) {
        return isLoggedIn && (role === "ADMIN" || role === "STAFF");
      }
      return true; // el resto del sitio es público
    },

    /** Guardamos id y rol dentro del token firmado. */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    /** Y los exponemos en `session.user` para usarlos en la app. */
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
