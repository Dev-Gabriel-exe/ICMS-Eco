-- CreateEnum
CREATE TYPE "NotifType" AS ENUM ('EVIDENCE_RETURNED', 'EVIDENCE_UPLOADED', 'AXIS_BELOW_MINIMUM', 'CERTAME_DEADLINE_30', 'CERTAME_DEADLINE_15', 'CERTAME_DEADLINE_7', 'CERTAME_OPENED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('MUNICIPALITY_CREATED', 'MUNICIPALITY_UPDATED', 'USER_CREATED', 'USER_UPDATED', 'EVIDENCE_UPLOADED', 'EVIDENCE_APPROVED', 'EVIDENCE_REJECTED', 'EVIDENCE_DELETED', 'CHECKLIST_UPDATED', 'CERTAME_CREATED', 'CERTAME_UPDATED', 'CERTAME_CLOSED');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotifType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "entity_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
