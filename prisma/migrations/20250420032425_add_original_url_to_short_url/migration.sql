/*
  Warnings:

  - Added the required column `originalUrl` to the `short_urls` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "short_urls" ADD COLUMN     "originalUrl" TEXT NOT NULL;
