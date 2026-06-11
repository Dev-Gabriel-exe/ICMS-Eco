-- CreateEnum
CREATE TYPE "HabDocCode" AS ENUM ('CONSELHO_CRIACAO', 'CONSELHO_ATA', 'SECRETARIA_CRIACAO', 'SECRETARIA_NOMEACAO', 'SECRETARIA_QUADRO', 'PLANO_DIRETOR');

-- CreateEnum
CREATE TYPE "HabDocStatus" AS ENUM ('not_started', 'pending', 'approved', 'rejected');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'HABILITACAO_FILE_UPLOADED';
ALTER TYPE "AuditAction" ADD VALUE 'HABILITACAO_DOC_APPROVED';
ALTER TYPE "AuditAction" ADD VALUE 'HABILITACAO_DOC_REJECTED';

-- CreateTable
CREATE TABLE "habilitacao_docs" (
    "id" TEXT NOT NULL,
    "municipality_id" TEXT NOT NULL,
    "certame_id" TEXT NOT NULL,
    "code" "HabDocCode" NOT NULL,
    "status" "HabDocStatus" NOT NULL DEFAULT 'not_started',
    "reject_reason" TEXT,
    "validated_by" TEXT,
    "validated_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habilitacao_docs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habilitacao_files" (
    "id" TEXT NOT NULL,
    "hab_doc_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_size_bytes" INTEGER,
    "file_type" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habilitacao_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "habilitacao_docs_municipality_id_certame_id_code_key" ON "habilitacao_docs"("municipality_id", "certame_id", "code");

-- AddForeignKey
ALTER TABLE "habilitacao_docs" ADD CONSTRAINT "habilitacao_docs_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habilitacao_docs" ADD CONSTRAINT "habilitacao_docs_certame_id_fkey" FOREIGN KEY ("certame_id") REFERENCES "certames"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habilitacao_docs" ADD CONSTRAINT "habilitacao_docs_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habilitacao_files" ADD CONSTRAINT "habilitacao_files_hab_doc_id_fkey" FOREIGN KEY ("hab_doc_id") REFERENCES "habilitacao_docs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habilitacao_files" ADD CONSTRAINT "habilitacao_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
