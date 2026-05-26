-- AlterTable
ALTER TABLE "evidences" ADD COLUMN     "date_is_in_period" BOOLEAN,
ADD COLUMN     "follows_annex_ii" BOOLEAN,
ADD COLUMN     "has_date" BOOLEAN,
ADD COLUMN     "has_electronic_signature" BOOLEAN,
ADD COLUMN     "has_geotag" BOOLEAN,
ADD COLUMN     "is_original_doc" BOOLEAN,
ADD COLUMN     "is_pdf_searchable" BOOLEAN,
ADD COLUMN     "is_valid" BOOLEAN NOT NULL DEFAULT true;
