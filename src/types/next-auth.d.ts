/**
 * Extiende los tipos de Auth.js para que `session.user` incluya
 * nuestro `id` y `role`, con autocompletado y chequeo de TypeScript.
 */
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}
