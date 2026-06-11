-- AlterTable
ALTER TABLE "evidences" ADD COLUMN     "review_comment" TEXT,
ADD COLUMN     "sub_doc_id" TEXT,
ADD COLUMN     "validated_at" TIMESTAMP(3),
ADD COLUMN     "validated_by" TEXT;

-- CreateTable
CREATE TABLE "criteria_sub_docs" (
    "id" TEXT NOT NULL,
    "criteria_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "accepts_multiple" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "criteria_sub_docs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "criteria_sub_docs_criteria_id_code_key" ON "criteria_sub_docs"("criteria_id", "code");

-- AddForeignKey
ALTER TABLE "criteria_sub_docs" ADD CONSTRAINT "criteria_sub_docs_criteria_id_fkey" FOREIGN KEY ("criteria_id") REFERENCES "criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_sub_doc_id_fkey" FOREIGN KEY ("sub_doc_id") REFERENCES "criteria_sub_docs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
