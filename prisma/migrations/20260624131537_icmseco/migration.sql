-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'USER_LOGIN';
ALTER TYPE "AuditAction" ADD VALUE 'USER_LOGOUT';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'reviewer';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" TEXT;
