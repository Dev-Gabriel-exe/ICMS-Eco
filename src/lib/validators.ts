import { z } from "zod";

// ─────────────────────────────────────────────
// Constantes reutilizáveis
// ─────────────────────────────────────────────

const AXES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;

const CHECKLIST_STATUS = ["not_started", "in_progress", "complete"] as const;

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

const MAX_FILE_SIZE_MB = 150;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string({ required_error: "E-mail é obrigatório" })
    .email("E-mail inválido")
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: "Senha é obrigatória" })
    .min(6, "Senha deve ter ao menos 6 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─────────────────────────────────────────────
// Município
// ─────────────────────────────────────────────

export const createMunicipalitySchema = z.object({
  name: z
    .string({ required_error: "Nome é obrigatório" })
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(120, "Nome muito longo")
    .trim(),
  population: z
    .number({ required_error: "População é obrigatória" })
    .int("Deve ser número inteiro")
    .positive("Deve ser positivo")
    .max(10_000_000, "Valor inválido"),
  stateCode: z
    .string()
    .length(2, "UF deve ter 2 caracteres")
    .toUpperCase()
    .default("PI"),
});

export const updateMunicipalitySchema = createMunicipalitySchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export type CreateMunicipalityInput = z.infer<typeof createMunicipalitySchema>;
export type UpdateMunicipalityInput = z.infer<typeof updateMunicipalitySchema>;

// ─────────────────────────────────────────────
// Usuário
// ─────────────────────────────────────────────

export const createUserSchema = z.object({
  name: z
    .string({ required_error: "Nome é obrigatório" })
    .min(2, "Nome deve ter ao menos 2 caracteres")
    .max(100, "Nome muito longo")
    .trim(),
  email: z
    .string({ required_error: "E-mail é obrigatório" })
    .email("E-mail inválido")
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: "Senha é obrigatória" })
    .min(8, "Senha deve ter ao menos 8 caracteres")
    .max(64, "Senha muito longa")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Senha deve conter letras maiúsculas, minúsculas e números"
    ),
  role: z.enum(["admin", "employee"]).default("employee"),
  municipalityIds: z
    .array(z.string().uuid("ID inválido"))
    .optional()
    .default([]),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  email: z.string().email().toLowerCase().trim().optional(),
  role: z.enum(["admin", "employee"]).optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(8, "Nova senha deve ter ao menos 8 caracteres")
      .max(64)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Senha deve conter letras maiúsculas, minúsculas e números"
      ),
    confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export const linkUserMunicipalitySchema = z.object({
  userId: z.string().uuid("ID de usuário inválido"),
  municipalityIds: z
    .array(z.string().uuid("ID inválido"))
    .min(1, "Selecione ao menos um município"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type LinkUserMunicipalityInput = z.infer<typeof linkUserMunicipalitySchema>;

// ─────────────────────────────────────────────
// Certame
// ─────────────────────────────────────────────

export const createCertameSchema = z.object({
  year: z
    .number({ required_error: "Ano é obrigatório" })
    .int()
    .min(2027, "Ano mínimo é 2027")
    .max(2100, "Ano inválido"),
  periodoInicio: z.coerce.date({
    required_error: "Data de início é obrigatória",
  }),
  periodoFim: z.coerce
    .date({ required_error: "Data de fim é obrigatória" })
    .refine((d) => d > new Date(), "Data de fim deve ser futura"),
  isActive: z.boolean().default(false),
}).refine(
  (data) => data.periodoFim > data.periodoInicio,
  { message: "Data de fim deve ser posterior ao início", path: ["periodoFim"] }
);

export type CreateCertameInput = z.infer<typeof createCertameSchema>;

// ─────────────────────────────────────────────
// ChecklistItem — atualização
// ─────────────────────────────────────────────

export const updateChecklistItemSchema = z
  .object({
    status: z.enum(CHECKLIST_STATUS, {
      required_error: "Status é obrigatório",
      invalid_type_error: "Status inválido",
    }),
    // per_unit
    quantity: z
      .number()
      .int("Deve ser número inteiro")
      .nonnegative("Deve ser ≥ 0")
      .optional()
      .nullable(),
    // percentage (E.1)
    percentageValue: z
      .number()
      .min(0, "Deve ser ≥ 0")
      .max(100, "Deve ser ≤ 100")
      .optional()
      .nullable(),
    // per_faixa C.5
    faixaLevel: z.enum(["1", "2", "3"]).transform(Number).optional().nullable(),
    // territory pct (H.1, H.3)
    territoryPct: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .nullable(),
    notes: z
      .string()
      .max(2000, "Observação muito longa (máx. 2000 caracteres)")
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    // Quando completo, exige ao menos um valor de pontuação
    if (data.status === "complete") {
      const hasValue =
        data.quantity != null ||
        data.percentageValue != null ||
        data.faixaLevel != null ||
        data.territoryPct != null;

      // Critérios fixed não precisam de valor adicional —
      // a validação fica no servidor que conhece o scoringType
    }
  });

export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;

// ─────────────────────────────────────────────
// Upload de evidência
// ─────────────────────────────────────────────

export const requestUploadUrlSchema = z.object({
  checklistItemId: z.string().uuid("ID do item inválido"),
  fileName: z
    .string({ required_error: "Nome do arquivo é obrigatório" })
    .min(1)
    .max(255)
    .refine(
      (name) => !name.includes("/") && !name.includes("\\"),
      "Nome de arquivo inválido"
    ),
  fileType: z.enum(ALLOWED_MIME_TYPES, {
    errorMap: () => ({
      message: `Tipo de arquivo não permitido. Use: PDF, JPG, PNG, WEBP, DOC, DOCX, XLS ou XLSX`,
    }),
  }),
  fileSizeBytes: z
    .number()
    .int()
    .positive("Tamanho deve ser positivo")
    .max(
      MAX_FILE_SIZE_BYTES,
      `Arquivo excede o limite de ${MAX_FILE_SIZE_MB} MB`
    ),
});

export const confirmUploadSchema = z.object({
  checklistItemId: z.string().uuid(),
  fileKey: z.string().min(1, "Chave do arquivo é obrigatória"),
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
});

export type RequestUploadUrlInput = z.infer<typeof requestUploadUrlSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;

// ─────────────────────────────────────────────
// Filtros de listagem (query params)
// ─────────────────────────────────────────────

export const municipalityFiltersSchema = z.object({
  search: z.string().max(100).optional(),
  isActive: z
    .string()
    .optional()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(20),
});

export const checklistFiltersSchema = z.object({
  municipalityId: z.string().uuid("ID de município inválido"),
  certameId: z.string().uuid("ID de certame inválido"),
  axis: z.enum(AXES).optional(),
  status: z.enum(CHECKLIST_STATUS).optional(),
});

export const evidenceFiltersSchema = z.object({
  checklistItemId: z.string().uuid().optional(),
  municipalityId: z.string().uuid().optional(),
  certameId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(5).max(50).default(20),
});

export type MunicipalityFilters = z.infer<typeof municipalityFiltersSchema>;
export type ChecklistFilters = z.infer<typeof checklistFiltersSchema>;
export type EvidenceFilters = z.infer<typeof evidenceFiltersSchema>;

// ─────────────────────────────────────────────
// Pontuação manual (override admin)
// ─────────────────────────────────────────────

export const overrideScoreSchema = z.object({
  municipalityId: z.string().uuid(),
  certameId: z.string().uuid(),
  axis: z.enum(AXES),
  pointsAnnual: z
    .number()
    .min(0, "Deve ser ≥ 0")
    .max(100, "Deve ser ≤ 100"),
  criteriaMet: z.boolean(),
  finalized: z.boolean().default(false),
});

export type OverrideScoreInput = z.infer<typeof overrideScoreSchema>;

// ─────────────────────────────────────────────
// Helpers de validação
// ─────────────────────────────────────────────

/**
 * Valida um schema Zod e retorna { data } ou { error } tipados.
 * Uso: const result = validate(createMunicipalitySchema, body)
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; issues: z.ZodIssue[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstIssue = result.error.issues[0];
  const path = firstIssue.path.length > 0 ? `${firstIssue.path.join(".")}: ` : "";
  return {
    success: false,
    error: `${path}${firstIssue.message}`,
    issues: result.error.issues,
  };
}

/**
 * Formata erros Zod em um objeto de campo → mensagem
 * para uso com react-hook-form ou exibição em formulários.
 */
export function formatZodErrors(
  error: z.ZodError
): Record<string, string> {
  return error.issues.reduce((acc, issue) => {
    const key = issue.path.join(".") || "_";
    acc[key] = issue.message;
    return acc;
  }, {} as Record<string, string>);
}

/**
 * Garante que uma string de ID é um UUID válido.
 */
export function isValidUUID(id: string): boolean {
  return z.string().uuid().safeParse(id).success;
}

/**
 * Retorna mensagem de erro amigável de um resultado Zod.
 */
export function getFirstZodError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Dados inválidos";
  const prefix = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
  return `${prefix}${issue.message}`;
}