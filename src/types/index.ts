// src/types/index.ts

// ─────────────────────────────────────────────
// Roles
// ─────────────────────────────────────────────

export type Role = "admin" | "employee";

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

export interface FixedConfig {
  type: "fixed";
}

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
  level: number;   // 1, 2 ou 3
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
  faixaLevel?: number | null;    // 1, 2 ou 3 — para C.5
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
// Evidência
// ─────────────────────────────────────────────

export type ValidationStatus = "pending" | "valid" | "warning" | "returned" | "replaced";

export interface Evidence {
  id: string;
  checklistItemId: string;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  fileSizeBytes: number;
  fileType: string;
  uploadedById: string;
  uploadedAt: Date;
  isValid?: boolean;

  // Checklist de validação
  hasDate?: boolean | null;
  dateIsInPeriod?: boolean | null;
  hasGeotag?: boolean | null;
  isPdfSearchable?: boolean | null;
  hasElectronicSignature?: boolean | null;
  followsAnnexII?: boolean | null;
  isOriginalDoc?: boolean | null;

  // Status de revisão
  validationStatus: ValidationStatus;
  returnReason?: string | null;
  returnedById?: string | null;
  returnedAt?: Date | null;

  // Relações
  uploadedBy?: { name: string; email: string };
  returnedBy?: { name: string } | null;
}

// ─────────────────────────────────────────────
// Pontuação do eixo
// ─────────────────────────────────────────────

export interface AxisScore {
  axis: Axis;
  axisName: string;
  points: number;
  maxPoints: number;
  criteriaMet: boolean;   // >= 50 pts
  progress: number;        // 0-100
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