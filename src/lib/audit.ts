// src/lib/audit.ts

import { db } from "@/lib/db";
import { AuditAction } from "@prisma/client";

export async function logAction({
  userId,
  action,
  entityType,
  entityId,
  description,
}: {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  description?: string;
}) {
  await db.auditLog.create({
    data: {
      userId,
      action,
      entityType,
      entityId,
      description,
    },
  });
}