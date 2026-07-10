/**
 * ===================================================================
 * Sube las imágenes del sitio viejo a Cloudflare R2 y actualiza la base.
 *
 * Lee cada ProductImage cuya URL todavía apunta al sitio viejo, busca el
 * archivo en la carpeta local `assets/`, lo sube a R2 y reemplaza la URL.
 *
 * Es idempotente: si la imagen ya está en R2, la saltea.
 * Si algo falla, la base queda intacta para esa imagen.
 *
 * Uso:  npx tsx scripts/upload-images.ts
 * ===================================================================
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { uploadToR2 } from "../src/lib/r2";

const LEGACY_DIR = "/home/t4ifi/Andrès/Programacion/LeanWear";
const LEGACY_HOST = "leanwear-uy.github.io";

async function main() {
  const publicBase = process.env.R2_PUBLIC_URL;
  if (!publicBase) {
    console.error("✗ Falta R2_PUBLIC_URL en el .env. Completá primero las variables de R2.");
    process.exit(1);
  }

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const pendientes = await prisma.productImage.findMany({
    where: { url: { contains: LEGACY_HOST } },
    orderBy: { id: "asc" },
  });

  console.log(`Imágenes por migrar a R2: ${pendientes.length}\n`);
  if (pendientes.length === 0) {
    console.log("Nada que hacer: ya están todas en R2.");
    await prisma.$disconnect();
    return;
  }

  let ok = 0;
  let faltantes = 0;
  let errores = 0;

  for (const img of pendientes) {
    // "https://leanwear-uy.github.io/assets/nike/foo.jpg" -> "assets/nike/foo.jpg"
    const key = new URL(img.url).pathname.replace(/^\/+/, "");
    const localPath = path.join(LEGACY_DIR, key);

    if (!fs.existsSync(localPath)) {
      console.warn(`  ⚠ no encontrada localmente: ${key}`);
      faltantes++;
      continue;
    }

    try {
      const buffer = fs.readFileSync(localPath);
      const newUrl = await uploadToR2(key, buffer);
      await prisma.productImage.update({ where: { id: img.id }, data: { url: newUrl } });
      ok++;
      if (ok % 20 === 0) console.log(`  ... ${ok}/${pendientes.length} subidas`);
    } catch (e) {
      console.error(`  ✗ error con ${key}:`, (e as Error).message);
      errores++;
    }
  }

  console.log(`\n✓ Subidas a R2: ${ok}`);
  if (faltantes) console.log(`⚠ Sin archivo local: ${faltantes}`);
  if (errores) console.log(`✗ Con error: ${errores}`);

  const quedan = await prisma.productImage.count({ where: { url: { contains: LEGACY_HOST } } });
  console.log(`Imágenes que siguen apuntando al sitio viejo: ${quedan}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
