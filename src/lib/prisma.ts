/**
 * Cliente de Prisma (singleton).
 *
 * Usa el driver adapter de Neon, que habla con la base por HTTP/WebSocket.
 * Es lo recomendado para entornos serverless (Vercel), donde no conviene
 * mantener conexiones TCP abiertas.
 *
 * El singleton evita abrir decenas de conexiones cuando Next.js recarga
 * módulos en caliente durante el desarrollo.
 */
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Falta DATABASE_URL en el .env");

  const adapter = new PrismaNeon({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
