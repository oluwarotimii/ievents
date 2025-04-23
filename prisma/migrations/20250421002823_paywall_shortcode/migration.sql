/*
  Warnings:

  - A unique constraint covering the columns `[short_code]` on the table `short_urls` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `short_code` to the `short_urls` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "short_urls" DROP CONSTRAINT "short_urls_form_id_fkey";

-- DropForeignKey
ALTER TABLE "short_urls" DROP CONSTRAINT "short_urls_user_id_fkey";

-- DropIndex
DROP INDEX "short_urls_url_key";

-- AlterTable
ALTER TABLE "short_urls" ADD COLUMN     "clicks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "expires_at" TIMESTAMPTZ,
ADD COLUMN     "short_code" TEXT NOT NULL,
ALTER COLUMN "form_id" DROP NOT NULL,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "short_urls_short_code_key" ON "short_urls"("short_code");

-- AddForeignKey
ALTER TABLE "short_urls" ADD CONSTRAINT "short_urls_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_urls" ADD CONSTRAINT "short_urls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
