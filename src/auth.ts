/**
 * Auth.js — configuración completa (runtime Node).
 *
 * Seguridad:
 *  - La contraseña se compara con bcrypt contra el hash guardado.
 *  - Nunca se revela si falló el email o la contraseña (mismo error).
 *  - Solo ADMIN y STAFF pueden iniciar sesión en el panel.
 *  - Los datos de entrada se validan con Zod antes de tocar la base.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        // Sin usuario o sin hash (cuenta creada por otro proveedor).
        if (!user?.passwordHash) return null;

        const passwordOk = await bcrypt.compare(password, user.passwordHash);
        if (!passwordOk) return null;

        // El panel es solo para admin/staff.
        if (user.role !== "ADMIN" && user.role !== "STAFF") return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
