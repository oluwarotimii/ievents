/*
  Warnings:

  - You are about to drop the column `originalUrl` on the `short_urls` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "short_urls" DROP COLUMN "originalUrl";
