-- CreateEnum
CREATE TYPE "EvidenceKind" AS ENUM ('document', 'evidence');

-- AlterTable
ALTER TABLE "evidences" ADD COLUMN "kind" "EvidenceKind" NOT NULL DEFAULT 'document';
