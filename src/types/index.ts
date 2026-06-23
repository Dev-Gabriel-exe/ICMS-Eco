// src/types/index.ts

// ─────────────────────────────────────────────
// Roles
// ─────────────────────────────────────────────

export type Role = "admin" | "employee" | "reviewer";


// ─────────────────────────────────────────────
// Eixos (A–I)
// ─────────────────────────────────────────────

export type Axis = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";

// ─────────────────────────────────────────────
// Tipos de pontuação dos critérios
// ─────────────────────────────────────────────

export type ScoringType = "fixed" | "per_unit" | "percentage" | "per_faixa";

// ─────────────────────────────────────────────
// Configurações de scoring por tipo
// ─────────────────────────────────────────────

export interface FixedConfig      { type: "fixed" }

export interface PerUnitConfig {
  type: "per_unit";
  unitValue: number;
  maxPoints: number;
}

export interface PercentageConfig {
  type: "percentage";
  coefficient: number;
  maxPoints: number;
}

export interface FaixaLevel {
  level: number;
  minQty: number;
  points: number;
}

export interface FaixaC5 {
  minPop: number;
  maxPop: number | null;
  levels: FaixaLevel[];
}

export interface PerFaixaConfigC5 {
  type: "population";
  faixas: FaixaC5[];
}

export interface TerritoryRange {
  minPct: number;
  maxPct: number | null;
  points: number;
}

export interface PerFaixaConfigTerritory {
  type: "territory";
  ranges: TerritoryRange[];
}

export type ScoringConfig =
  | FixedConfig
  | PerUnitConfig
  | PercentageConfig
  | PerFaixaConfigC5
  | PerFaixaConfigTerritory;

// ─────────────────────────────────────────────
// Sub-documento exigido por critério
// ─────────────────────────────────────────────

export interface CriteriaSubDoc {
  /** UUID gerado pelo banco */
  id: string;
  criteriaId: string;
  /** Código único dentro do critério, ex: "lo_aterro", "contrato_parceria" */
  code: string;
  /** Label exibido na UI, ex: "Licença de Operação do Aterro" */
  label: string;
  /** Descrição detalhada do que é exigido */
  description: string;
  /** true = múltiplos arquivos permitidos (fotos, comprovantes) */
  acceptsMultiple: boolean;
  /** Ordem de exibição dentro do critério */
  order: number;
}

// ─────────────────────────────────────────────
// Critério
// ─────────────────────────────────────────────

export interface Criteria {
  id: string;               // "A.1", "B.3" etc.
  axis: Axis;
  axisName: string;
  axisMinPoints: number;
  description: string;
  requirement: string;
  requiredDocs: string;
  maxPoints: number;
  scoringType: ScoringType;
  scoringConfig: ScoringConfig | null;
  hasMapLink: boolean;
  isReusable: boolean;
  validYears: number | null;
  /** Sub-documentos específicos exigidos por este critério (opcional — nem todos têm) */
  subDocs?: CriteriaSubDoc[];
}

// ─────────────────────────────────────────────
// Checklist Item
// ─────────────────────────────────────────────

export type ItemStatus = "not_started" | "in_progress" | "complete" | "returned";

export interface ChecklistItem {
  id: string;
  municipalityId: string;
  certameId: string;
  criteriaId: string;
  status: ItemStatus;
  quantity?: number | null;
  percentageValue?: number | null;
  faixaLevel?: number | null;
  mapLink?: string | null;
  notes?: string | null;
  pointsClaimed: number;
  updatedById?: string | null;
  updatedAt: Date;
  createdAt: Date;
  // Relações opcionais para display
  criteria?: Criteria;
  evidences?: Evidence[];
}

// ─────────────────────────────────────────────
// Evidência (atualizado para incluir subDocId e campos de validação)
// ─────────────────────────────────────────────

/** Alinhado com o enum Prisma ValidationStatus */
export type ValidationStatus = "pending" | "approved" | "rejected";

export interface Evidence {
  id: string;
  checklistItemId: string;
  /** ID do sub-documento ao qual esta evidência pertence (null = genérico) */
  subDocId: string | null;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  fileSizeBytes: number | null;
  fileType: string | null;
  uploadedBy: string;
  uploadedAt: Date | string;

  validationStatus: ValidationStatus;
  /** Comentário do admin ao aprovar ou reprovar */
  reviewComment: string | null;
  validatedBy: string | null;
  validatedAt: Date | string | null;

  // Checklist de qualidade (preenchido pelo admin)
  isValid?: boolean;
  hasDate?: boolean | null;
  dateIsInPeriod?: boolean | null;
  hasGeotag?: boolean | null;
  isPdfSearchable?: boolean | null;
  hasElectronicSignature?: boolean | null;
  followsAnnexII?: boolean | null;
  isOriginalDoc?: boolean | null;

  // Relações populadas opcionalmente
  uploader?: { name: string; email: string };
  validator?: { name: string } | null;
  subDoc?: CriteriaSubDoc | null;
}

// ─────────────────────────────────────────────
// Pontuação do eixo
// ─────────────────────────────────────────────

export interface AxisScore {
  axis: Axis;
  axisName: string;
  points: number;
  maxPoints: number;
  criteriaMet: boolean;
  progress: number;
  itemsComplete: number;
  itemsTotal: number;
}

// ─────────────────────────────────────────────
// Selo
// ─────────────────────────────────────────────

export type SeloCategory = "A" | "B" | "C" | null;

// ─────────────────────────────────────────────
// Score completo do município
// ─────────────────────────────────────────────

export interface MunicipalityScore {
  municipalityId: string;
  certameId: string;
  axes: AxisScore[];
  totalPoints: number;
  criteriaMet: number;
  seloEstimado: SeloCategory;
  a1Compliant: boolean;
}

// ─────────────────────────────────────────────
// Ponderação histórica
// ─────────────────────────────────────────────

export interface WeightedScore {
  pfp: number;
  nfcp: number;
  seloFinal: SeloCategory;
}

// ─────────────────────────────────────────────
// Município (resumo para listas)
// ─────────────────────────────────────────────

export interface MunicipalitySummary {
  id: string;
  name: string;
  population: number;
  ibgeCode?: string | null;
  isActive: boolean;
  score?: MunicipalityScore;
}

// ─────────────────────────────────────────────
// Usuário
// ─────────────────────────────────────────────

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  municipalities?: { id: string; name: string }[];
}

// ─────────────────────────────────────────────
// Certame
// ─────────────────────────────────────────────

export interface CertameSummary {
  id: string;
  year: number;
  periodoInicio: Date;
  periodoFim: Date;
  isActive: boolean;
  isClosed: boolean;
}

// ─────────────────────────────────────────────
// Notificações
// ─────────────────────────────────────────────

export type NotifType =
  | "EVIDENCE_RETURNED"
  | "EVIDENCE_UPLOADED"
  | "AXIS_BELOW_MINIMUM"
  | "CERTAME_DEADLINE_30"
  | "CERTAME_DEADLINE_15"
  | "CERTAME_DEADLINE_7"
  | "CERTAME_OPENED";

export interface Notification {
  id: string;
  userId: string;
  type: NotifType;
  title: string;
  body: string;
  isRead: boolean;
  entityId?: string | null;
  createdAt: Date;
}

// ─────────────────────────────────────────────
// API responses genéricas
// ─────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;