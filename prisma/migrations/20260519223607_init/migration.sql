-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'employee');

-- CreateEnum
CREATE TYPE "ChecklistStatus" AS ENUM ('not_started', 'in_progress', 'complete');

-- CreateEnum
CREATE TYPE "ScoringType" AS ENUM ('fixed', 'per_unit', 'per_faixa', 'percentage');

-- CreateTable
CREATE TABLE "municipalities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "population" INTEGER NOT NULL,
    "state_code" TEXT NOT NULL DEFAULT 'PI',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "municipalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'employee',
    "must_change_password" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_municipalities" (
    "user_id" TEXT NOT NULL,
    "municipality_id" TEXT NOT NULL,

    CONSTRAINT "user_municipalities_pkey" PRIMARY KEY ("user_id","municipality_id")
);

-- CreateTable
CREATE TABLE "certames" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "periodo_inicio" TIMESTAMP(3) NOT NULL,
    "periodo_fim" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "certames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criteria" (
    "id" TEXT NOT NULL,
    "axis" TEXT NOT NULL,
    "axis_name" TEXT NOT NULL,
    "axis_min_points" INTEGER NOT NULL DEFAULT 50,
    "description" TEXT NOT NULL,
    "requirement" TEXT NOT NULL DEFAULT '',
    "required_docs" TEXT NOT NULL DEFAULT '',
    "max_points" INTEGER NOT NULL,
    "scoring_type" "ScoringType" NOT NULL,
    "scoring_config" JSONB,
    "has_map_link" BOOLEAN NOT NULL DEFAULT false,
    "is_reusable" BOOLEAN NOT NULL DEFAULT false,
    "valid_years" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "municipality_id" TEXT NOT NULL,
    "certame_id" TEXT NOT NULL,
    "criteria_id" TEXT NOT NULL,
    "status" "ChecklistStatus" NOT NULL DEFAULT 'not_started',
    "points_claimed" DECIMAL(6,2),
    "quantity" INTEGER,
    "percentage_value" DECIMAL(5,2),
    "faixa_level" INTEGER,
    "map_link" TEXT,
    "notes" TEXT,
    "updated_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidences" (
    "id" TEXT NOT NULL,
    "checklist_item_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_size_bytes" INTEGER,
    "file_type" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_valid" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "annual_scores" (
    "id" TEXT NOT NULL,
    "municipality_id" TEXT NOT NULL,
    "certame_id" TEXT NOT NULL,
    "axis" TEXT NOT NULL,
    "points_annual" DECIMAL(6,2) NOT NULL,
    "criteria_met" BOOLEAN NOT NULL DEFAULT false,
    "finalized" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "annual_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "certames_year_key" ON "certames"("year");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_items_municipality_id_certame_id_criteria_id_key" ON "checklist_items"("municipality_id", "certame_id", "criteria_id");

-- CreateIndex
CREATE UNIQUE INDEX "annual_scores_municipality_id_certame_id_axis_key" ON "annual_scores"("municipality_id", "certame_id", "axis");

-- AddForeignKey
ALTER TABLE "user_municipalities" ADD CONSTRAINT "user_municipalities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_municipalities" ADD CONSTRAINT "user_municipalities_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_certame_id_fkey" FOREIGN KEY ("certame_id") REFERENCES "certames"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_criteria_id_fkey" FOREIGN KEY ("criteria_id") REFERENCES "criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_checklist_item_id_fkey" FOREIGN KEY ("checklist_item_id") REFERENCES "checklist_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annual_scores" ADD CONSTRAINT "annual_scores_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "annual_scores" ADD CONSTRAINT "annual_scores_certame_id_fkey" FOREIGN KEY ("certame_id") REFERENCES "certames"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
