/*
  Warnings:

  - You are about to drop the column `is_valid` on the `evidences` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "evidences" DROP COLUMN "is_valid",
ADD COLUMN     "validation_status" "ValidationStatus" NOT NULL DEFAULT 'pending';
