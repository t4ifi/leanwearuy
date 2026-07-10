/**
 * ===================================================================
 * Seed: crea el usuario administrador.
 *
 * La contraseña NUNCA se guarda en texto plano: se cifra con bcrypt
 * (hash + salt). Ni siquiera desde la base se puede leer la original.
 *
 * Lee ADMIN_EMAIL y ADMIN_PASSWORD del .env (que está fuera de git).
 * Es idempotente: si el usuario ya existe, actualiza su contraseña.
 *
 * Uso:  npx tsx prisma/seed.ts
 * ===================================================================
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { Role } from "../src/generated/prisma/enums";

const MIN_PASSWORD_LENGTH = 10;

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("✗ Faltan ADMIN_EMAIL y/o ADMIN_PASSWORD en el .env");
    process.exit(1);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("✗ ADMIN_EMAIL no parece un email válido");
    process.exit(1);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`✗ La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
    process.exit(1);
  }

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  // 12 rondas: buen equilibrio entre seguridad y velocidad de login.
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.ADMIN },
    create: { email, passwordHash, role: Role.ADMIN, name: "Admin" },
  });

  console.log(`✓ Usuario admin listo: ${user.email} (rol: ${user.role})`);
  console.log("  La contraseña quedó cifrada con bcrypt (12 rondas).");
  console.log("\n⚠ Ya podés borrar ADMIN_EMAIL y ADMIN_PASSWORD del .env.");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("ERROR en el seed:", e);
  process.exit(1);
});
