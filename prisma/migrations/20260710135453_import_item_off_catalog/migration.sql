-- AlterTable
ALTER TABLE "ImportItem" ADD COLUMN     "name" TEXT,
ALTER COLUMN "productId" DROP NOT NULL;
