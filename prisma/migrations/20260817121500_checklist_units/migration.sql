-- AlterTable
ALTER TABLE "evidences" ADD COLUMN     "unit_id" TEXT;

-- CreateTable
CREATE TABLE "checklist_units" (
    "id" TEXT NOT NULL,
    "checklist_item_id" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "checklist_units_checklist_item_id_index_key" ON "checklist_units"("checklist_item_id", "index");

-- AddForeignKey
ALTER TABLE "checklist_units" ADD CONSTRAINT "checklist_units_checklist_item_id_fkey" FOREIGN KEY ("checklist_item_id") REFERENCES "checklist_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "checklist_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
