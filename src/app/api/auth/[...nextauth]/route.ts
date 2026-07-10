/**
 * Endpoints de autenticación (/api/auth/*).
 * Corre en Node porque necesita bcrypt y Prisma.
 */
import { handlers } from "@/auth";

export const runtime = "nodejs";
export const { GET, POST } = handlers;
