// src/lib/constants.ts

export const AXIS_NAMES = {
  A: "Gerenciamento de Resíduos Sólidos",
  B: "Educação Ambiental",
  C: "Redução do Desmatamento e Conservação da Biodiversidade",
  D: "Recursos Hídricos",
  E: "Saneamento Básico e Qualidade da Água",
  F: "Controle da Poluição e Regularidade Ambiental Municipal",
  G: "Edificações Irregulares",
  H: "Unidades de Conservação",
  I: "Legislação sobre a Política Municipal de Meio Ambiente",
} as const;

export const AXIS_MIN_POINTS = {
  A: 50,
  B: 50,
  C: 50,
  D: 50,
  E: 50,
  F: 50,
  G: 50,
  H: 50,
  I: 50,
} as const;

export const AXIS_MAX_POINTS = {
  A: 100,
  B: 100,
  C: 100,
  D: 100,
  E: 100,
  F: 100,
  G: 100,
  H: 100,
  I: 100,
} as const;

export const VALID_AXES = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
] as const;