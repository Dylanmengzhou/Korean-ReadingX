/*
  Warnings:

  - You are about to drop the column `minutes` on the `articles` table. All the data in the column will be lost.
  - You are about to drop the column `word_count` on the `articles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "articles" DROP COLUMN "minutes",
DROP COLUMN "word_count";
