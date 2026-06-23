// prisma/seed-subdocs.ts
// Adiciona os sub-documentos exigidos por critério conforme o Decreto 24.288/2025
// Execute após o seed principal: npx ts-node prisma/seed-subdocs.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SubDocInput = {
  criteriaId: string;
  code: string;
  label: string;
  description: string;
  acceptsMultiple: boolean;
  order: number;
};

const subDocs: SubDocInput[] = [
  // ── A.1 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "A.1",
    code: "lo_aterro",
    label: "Licença de Operação (LO) do Aterro Sanitário",
    description: "Cópia da LO do aterro sanitário receptor, vigente durante todo o período de apuração.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "A.1",
    code: "contrato_aterro",
    label: "Contrato ou instrumento de parceria com o aterro/transportadora",
    description: "Cópia do contrato ou instrumento de parceria vigente com o aterro sanitário ou empresa responsável pelo transporte e destinação final.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "A.1",
    code: "mtr_comprovante",
    label: "Manifestos de Transporte de Resíduos (MTR) ou Comprovação Fiscal",
    description: "Prova da efetiva e contínua destinação: MTR ou comprovação fiscal do serviço.",
    acceptsMultiple: true,
    order: 3,
  },
  {
    criteriaId: "A.1",
    code: "sinir_cadastro",
    label: "Comprovante de cadastro no SINIR",
    description: "Documento que comprove o cadastro do município no Sistema Nacional de Informações sobre a Gestão dos Resíduos Sólidos (SINIR).",
    acceptsMultiple: true,
    order: 4,
  },

  // ── A.2 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "A.2",
    code: "plano_coleta_seletiva",
    label: "Instrumento de planejamento (projeto técnico ou programa)",
    description: "Projeto técnico ou programa de coleta seletiva.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "A.2",
    code: "relatorio_coleta_seletiva",
    label: "Relatório Operacional com registro fotográfico datado",
    description: "Relatório descrevendo as ações executadas, com fotos datadas.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "A.2",
    code: "comprov_destinacao_seletiva",
    label: "Comprovação de destinação (cooperativas/comércios atacadistas)",
    description: "Documento que comprove a destinação dos resíduos coletados para cooperativas, comércios atacadistas ou correlatos.",
    acceptsMultiple: true,
    order: 3,
  },

  // ── A.3 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "A.3",
    code: "relatorio_limpeza_publica",
    label: "Relatório Operacional de limpeza pública",
    description: "Relatório do período de apuração discriminando a execução de cada serviço (coleta, varrição, capina, poda), com registro fotográfico datado e georreferenciado.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── A.4 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "A.4",
    code: "licenca_empresa_rss",
    label: "Licença Ambiental de Operação da empresa de coleta de RSS",
    description: "LAO ou documento equivalente válido da empresa contratada para coleta e transporte dos resíduos de serviço de saúde.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "A.4",
    code: "mtr_rss",
    label: "Manifesto de Transporte de Resíduos (MTR) de RSS",
    description: "Documento que comprove a destinação final adequada, contendo quantidade coletada, frequência, pontos atendidos e identificação do local de tratamento/disposição final, com LAO do receptor.",
    acceptsMultiple: true,
    order: 2,
  },

  // ── A.5 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "A.5",
    code: "pmgirs",
    label: "Plano Municipal de Gestão Integrada de Resíduos Sólidos",
    description: "Plano completo (ou simplificado para municípios < 20.000 hab.) ou plano de saneamento básico, com publicação.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── A.6 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "A.6",
    code: "relatorio_pev",
    label: "Relatório Operacional dos Pontos de Entrega Voluntária (PEVs)",
    description: "Descrição dos pontos de entrega, endereço, quantitativo recebido e registros fotográficos de cada PEV.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "A.6",
    code: "comprov_destinacao_pev",
    label: "Comprovação de destinação dos resíduos dos PEVs",
    description: "Documento comprovando destinação para cooperativas ou comércios atacadistas.",
    acceptsMultiple: true,
    order: 2,
  },

  // ── A.7 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "A.7",
    code: "contrato_cooperativa",
    label: "Contrato/convênio com cooperativa de catadores",
    description: "Instrumento de parceria com entidade de direito privado que reúna trabalhadores de coleta e seleção de materiais recicláveis.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "A.7",
    code: "projeto_cooperativa",
    label: "Projeto ou documento de planejamento das ações",
    description: "Documento descrevendo as ações planejadas no período do vínculo de parceria.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "A.7",
    code: "relatorio_cooperativa",
    label: "Relatório Operacional das ações desenvolvidas",
    description: "Relatório descrevendo as ações de capacitação e treinamento dos associados no período de apuração.",
    acceptsMultiple: true,
    order: 3,
  },

  // ── B.1 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "B.1",
    code: "relatorio_capacitacao_servidores",
    label: "Relatório Operacional ou certificados de capacitação",
    description: "Relatório de cursos/palestras/treinamentos (com fotos, ementa, data, carga horária, dados do educador, lista de frequência e comprovação de vínculo) voltados a servidores municipais. Contagem: máx. 3h por servidor.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── B.2 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "B.2",
    code: "relatorio_formacao_professores",
    label: "Relatório Operacional ou certificados de formação de professores",
    description: "Relatório de cursos/palestras/treinamentos (com fotos, ementa, data, carga horária, dados do instrutor, lista de frequência e comprovação de vínculo) voltados a professores. Contagem: máx. 3h por servidor.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── B.3 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "B.3",
    code: "relatorio_treinamento_tecnicos",
    label: "Relatório Operacional ou certificados de treinamento de técnicos",
    description: "Relatório de cursos/palestras/treinamentos (com fotos, ementa, data, carga horária, dados do instrutor, lista de frequência e comprovação de vínculo) voltados a profissionais do órgão municipal de meio ambiente.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── B.4 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "B.4",
    code: "publicacao_cientifica",
    label: "Publicação científica (artigo, livro, resumo) com ISSN/ISBN",
    description: "Publicação pelo município ou por ele financiada, com comprovação de autoria/financiamento. Com ISSN ou ISBN.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── B.5 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "B.5",
    code: "material_educativo",
    label: "Cópia do material educativo ou comprovante de campanha digital",
    description: "Material impresso publicado pelo município ou comprovante de contratação/impulsionamento de campanha de mídia digital multiplataforma.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── B.6 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "B.6",
    code: "projeto_ea_escolar",
    label: "Projeto Escolar/Educacional de Educação Ambiental",
    description: "Projeto sucinto conforme Relatório Técnico (problemática, justificativa, objetivos, culminância, metodologia, cronograma e avaliação).",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "B.6",
    code: "relatorio_ea_escolar",
    label: "Relatório Operacional de execução do projeto",
    description: "Relatório com fotos, relato sucinto, data de realização e frequência.",
    acceptsMultiple: true,
    order: 2,
  },

  // ── B.7 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "B.7",
    code: "relatorio_evento_ea",
    label: "Relatório Operacional dos eventos públicos temáticos",
    description: "Relatório com registro fotográfico datado, local de realização, público-alvo, lista de frequência, conteúdos abordados, relato sucinto e material divulgado.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── B.8 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "B.8",
    code: "projeto_pedagogico_guardioes",
    label: "Projeto Pedagógico Simplificado",
    description: "Documento descrevendo objetivos, público-alvo, cronograma (mínimo um semestre) e atividades, com foco claro na opção escolhida (Guardiões ou Brigadistas).",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "B.8",
    code: "lista_alunos_guardioes",
    label: "Relação dos alunos participantes",
    description: "Lista com nome completo, escola e turma dos alunos participantes.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "B.8",
    code: "relatorio_foto_guardioes",
    label: "Relatório Fotográfico Comentado (georreferenciado e datado)",
    description: "Mínimo 3 ações distintas (Guardiões) ou registros de instrução e atividades práticas (Brigadistas). Fotos georreferenciadas e datadas.",
    acceptsMultiple: true,
    order: 3,
  },
  {
    criteriaId: "B.8",
    code: "declaracao_capacitacao_brigadistas",
    label: "Declaração de Capacitação (somente Brigadistas Mirins)",
    description: "Documento assinado pelo instrutor responsável (servidor habilitado, bombeiro civil ou brigadista certificado) atestando o treinamento de prevenção. Exigido apenas para a opção Brigadistas.",
    acceptsMultiple: true,
    order: 4,
  },

  // ── B.9 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "B.9",
    code: "divulgacao_congresso",
    label: "Material de Divulgação do Congresso",
    description: "Cópia do cartaz, folder ou publicação em rede social convidando a população.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "B.9",
    code: "programacao_congresso",
    label: "Programação Oficial do Congresso",
    description: "Documento com data, local, temas das palestras/debates e nomes dos palestrantes/mediadores.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "B.9",
    code: "lista_presenca_congresso",
    label: "Lista de Presença",
    description: "Comprovante de participação do público, devidamente assinado.",
    acceptsMultiple: true,
    order: 3,
  },
  {
    criteriaId: "B.9",
    code: "ata_congresso",
    label: "Ata ou Relatório Final do Congresso",
    description: "Documento-síntese com principais pontos discutidos, propostas e encaminhamentos.",
    acceptsMultiple: true,
    order: 4,
  },
  {
    criteriaId: "B.9",
    code: "fotos_congresso",
    label: "Registro Fotográfico do Congresso",
    description: "Fotos georreferenciadas com data/hora mostrando mesa de abertura, palestrantes e público.",
    acceptsMultiple: true,
    order: 5,
  },

  // ── B.10 ─────────────────────────────────────────────────────────────────
  {
    criteriaId: "B.10",
    code: "plano_acao_caca",
    label: "Plano de Ação Simplificado",
    description: "Documento descrevendo objetivo, público-alvo, espécies a proteger e ações planejadas.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "B.10",
    code: "material_educativo_caca",
    label: "Cópia do Material Educativo Produzido",
    description: "Exemplar do panfleto, cartaz ou cópia do áudio/vídeo utilizado na campanha.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "B.10",
    code: "fotos_acoes_caca",
    label: "Relatório Fotográfico de ao menos 2 ações de sensibilização",
    description: "Registros de ao menos 2 ações em locais diferentes, georreferenciadas, com data e horário.",
    acceptsMultiple: true,
    order: 3,
  },

  // ── B.11 ─────────────────────────────────────────────────────────────────
  {
    criteriaId: "B.11",
    code: "identificacao_pagina",
    label: "Identificação da Página em Rede Social",
    description: "PDF com o link de acesso público e captura de tela da página principal (nome e descrição visíveis).",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "B.11",
    code: "relatorio_publicacoes",
    label: "Relatório de Atividade Continuada (mín. 4 posts/mês por 12 meses)",
    description: "PDF com capturas de tela comprovando mínimo de 4 publicações mensais durante pelo menos 12 meses do período de apuração.",
    acceptsMultiple: true,
    order: 2,
  },

  // ── C.1 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "C.1",
    code: "relatorio_semarh",
    label: "Relatório Técnico SEMARH",
    description: "Arquivo do Relatório Técnico referente ao Índice de Redução de Desmatamento Ilegal, emitido pela SEMARH conforme metodologia do Termo de Referência vigente.",
    acceptsMultiple: false,
    order: 1,
  },

  // ── C.2 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "C.2",
    code: "relatorio_areas_degradadas",
    label: "Relatório Operacional de identificação de áreas degradadas",
    description: "Relatório com identificação das áreas, coordenadas geográficas, diagnóstico do solo/água/vegetação, fatores geradores, registro fotográfico datado e georreferenciado, e análise da evolução.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "C.2",
    code: "mapa_areas_degradadas",
    label: "Mapa georreferenciado das áreas degradadas",
    description: "Mapa indicando as áreas degradadas identificadas.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "C.2",
    code: "quadro_resumo_degradadas",
    label: "Quadro resumo de áreas degradadas",
    description: "Tabela com identificação (local), coordenadas, extensão (ha), tipo e fator gerador da degradação, assinada por responsável técnico habilitado.",
    acceptsMultiple: true,
    order: 3,
  },

  // ── C.3 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "C.3",
    code: "projeto_recuperacao",
    label: "Projeto Técnico de Execução e Monitoramento (com ART)",
    description: "Projeto técnico vinculado às áreas do C.2, com diagnóstico, metodologia, espécies utilizadas (mín. 3 nativas), quantitativos, espaçamento, cronograma e taxa de sobrevivência ≥50% após 45 dias.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "C.3",
    code: "relatorio_recuperacao",
    label: "Relatório Operacional de execução (com ART)",
    description: "Relatório com data/local, atividades realizadas, quantitativo de mudas por espécie, notas fiscais de insumos e fotos georreferenciadas antes/durante/depois.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "C.3",
    code: "relatorio_monitoramento_c3",
    label: "Relatório Técnico de Monitoramento (com ART)",
    description: "Metodologia de avaliação, taxa de sobrevivência das mudas, análise comparativa com metas do projeto, ações corretivas, fotos georreferenciadas comparativas e comprovantes de manutenção.",
    acceptsMultiple: true,
    order: 3,
  },

  // ── C.4 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "C.4",
    code: "lei_viveiro",
    label: "Lei ou Decreto de criação do Viveiro Municipal",
    description: "Instrumento legal de criação do viveiro municipal.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "C.4",
    code: "nf_insumos_viveiro",
    label: "Notas fiscais de aquisição de insumos",
    description: "Notas fiscais dos insumos adquiridos para manutenção do viveiro.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "C.4",
    code: "fotos_viveiro",
    label: "Relatório Fotográfico do Viveiro (mín. 5 fotos georreferenciadas)",
    description: "Mínimo 5 fotos georreferenciadas e datadas mostrando a estrutura física e as mudas produzidas/em produção.",
    acceptsMultiple: true,
    order: 3,
  },
  {
    criteriaId: "C.4",
    code: "inventario_mudas",
    label: "Inventário de mudas assinado por responsável técnico",
    description: "Tabela/planilha com quantidade e espécies produzidas no período de apuração, data da contagem e assinatura de responsável técnico (com registro profissional).",
    acceptsMultiple: true,
    order: 4,
  },
  {
    criteriaId: "C.4",
    code: "relatorio_plantio_viveiro",
    label: "Relatório de plantio das mudas",
    description: "Descrição de quantidade, espécies, locais e datas de plantio, com registro fotográfico georreferenciado e datado ou notas fiscais de doação.",
    acceptsMultiple: true,
    order: 5,
  },

  // ── C.5 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "C.5",
    code: "projeto_plantio_mudas",
    label: "Projeto Técnico de plantio (com ART)",
    description: "Projeto assinado por responsável habilitado com localização georreferenciada, diagnóstico, metodologia (espaçamento, espécies nativas, cronograma) e plano de arborização.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "C.5",
    code: "relatorio_plantio_mudas",
    label: "Relatório Operacional de plantio",
    description: "Data e local, quantitativo por espécie, fotos georreferenciadas antes e depois, notas fiscais de mudas e insumos.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "C.5",
    code: "mapa_plantio_mudas",
    label: "Mapa georreferenciado com pontos de plantio",
    description: "Mapa com a distribuição dos pontos de plantio das mudas.",
    acceptsMultiple: true,
    order: 3,
  },

  // ── D.1 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "D.1",
    code: "lei_brigada",
    label: "Instrumento legal de criação da Brigada",
    description: "Lei, decreto ou portaria de criação da brigada, publicado em diário oficial.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "D.1",
    code: "relatorio_brigada",
    label: "Relatório Operacional da Brigada",
    description: "Endereço e descrição da sede com fotos georreferenciadas e datadas, instrumento de nomeação dos componentes, comprovação de vínculo do Chefe, treinamento comprovado (SEMARH/CBMPI/IBAMA/ICMBio, até 3 anos anteriores), relação de EPIs e materiais com NF, relatório de atividades (mín. 4) e ROIF nos casos de combate.",
    acceptsMultiple: true,
    order: 2,
  },

  // ── D.2 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "D.2",
    code: "lei_pmmc",
    label: "Instrumento legal de aprovação do PMMC",
    description: "Lei, decreto ou portaria de aprovação e publicação do Plano Municipal de Mudanças Climáticas no Diário Oficial.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "D.2",
    code: "pmmc_completo",
    label: "Cópia integral do PMMC",
    description: "Plano completo contemplando estratégias e metas de mitigação/adaptação, definição de responsabilidades e cronograma de execução.",
    acceptsMultiple: true,
    order: 2,
  },

  // ── D.3 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "D.3",
    code: "lei_ppcif",
    label: "Instrumento legal de aprovação do PPCIF",
    description: "Lei, decreto ou portaria de aprovação e publicação do Plano de Prevenção e Combate a Incêndios Florestais no Diário Oficial.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "D.3",
    code: "ppcif_completo",
    label: "Plano PPCIF completo (com todos os eixos exigidos)",
    description: "Plano com diagnóstico e mapa de risco, estrutura de governança, protocolos operacionais, inventário de recursos, plano de prevenção, de capacitação, de resposta e cronograma anual. Assinado pela autoridade responsável e coordenador.",
    acceptsMultiple: true,
    order: 2,
  },

  // ── D.4 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "D.4",
    code: "carta_compromisso_ods",
    label: "Carta-Compromisso 'Meu Município pelos ODS 2025-2030'",
    description: "Carta devidamente preenchida e assinada.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "D.4",
    code: "lei_comissao_ods",
    label: "Lei ou Decreto de criação da Comissão Municipal para os ODS",
    description: "Instrumento publicado em Diário Oficial.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "D.4",
    code: "portaria_membros_ods",
    label: "Portaria de Nomeação dos Membros da Comissão ODS",
    description: "Publicada em Diário Oficial, com indicação de paridade.",
    acceptsMultiple: true,
    order: 3,
  },
  {
    criteriaId: "D.4",
    code: "regimento_ods",
    label: "Regimento Interno da Comissão ODS",
    description: "Publicado em Diário Oficial.",
    acceptsMultiple: true,
    order: 4,
  },
  {
    criteriaId: "D.4",
    code: "plano_acao_ods",
    label: "Plano de Ação e Diagnóstico Situacional ODS",
    description: "Plano de ação e metas para implementação da iniciativa 'Meu Município pelos ODS' e respectivo diagnóstico situacional.",
    acceptsMultiple: true,
    order: 5,
  },

  // ── D.5 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "D.5",
    code: "relatorio_protecao_solo",
    label: "Relatório Operacional de proteção de solo (com ART)",
    description: "Relatório por ação, contendo diagnóstico da área (localização, coordenadas, extensão), metodologia analítica, técnicas e materiais (cobertura, contenção, cercamento, plantio direto com espécies nativas, etc.), ART, notas fiscais de insumos, fotos georreferenciadas antes/durante/depois e demonstração dos resultados. Taxa mínima de sobrevivência de mudas ≥50% após 45 dias.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── D.6 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "D.6",
    code: "inventario_faunistico",
    label: "Inventário Faunístico (com ART) — amostragem sazonal",
    description: "Inventário com amostragem sazonal (seca e/ou chuva), avaliando grau de ameaça, conforme Termos de Referência da SEMARH.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "D.6",
    code: "relatorio_monitoramento_fauna",
    label: "Relatório de Monitoramento, Atualização e Defesa das Espécies (com ART)",
    description: "Relatório atualizado anualmente conforme Termos de Referência da SEMARH. Exigido a partir do 2º ano.",
    acceptsMultiple: true,
    order: 2,
  },

  // ── D.7 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "D.7",
    code: "relatorio_abrigo_animais",
    label: "Relatório de abrigo para animais resgatados",
    description: "Descrição da estrutura física, quantitativo de animais atendidos, recursos empregados e instrumento de parceria/convênio (se apoio a terceiros).",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "D.7",
    code: "relatorio_castracao",
    label: "Relatório de controle populacional (castração)",
    description: "Quantitativo de animais em procedimentos de castração promovidos pelo município, com responsabilidade técnica, métodos e registro fotográfico datado.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "D.7",
    code: "relatorio_veterinario",
    label: "Relatório de atendimento médico veterinário gratuito",
    description: "Quantitativo de animais atendidos em procedimentos promovidos pelo município, com responsabilidade técnica, métodos e registro fotográfico datado.",
    acceptsMultiple: true,
    order: 3,
  },

  // ── D.8 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "D.8",
    code: "lei_cmdc",
    label: "Lei ou Decreto de criação e regulamentação da CMDC",
    description: "Instrumento legal criando e regulamentando a Coordenação Municipal de Defesa Civil.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "D.8",
    code: "plano_defesa_civil",
    label: "Plano Municipal de Ação da Defesa Civil",
    description: "Plano devidamente publicado.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "D.8",
    code: "nomeacao_coordenador_cmdc",
    label: "Ato de nomeação do Coordenador Municipal",
    description: "Instrumento legal de nomeação do coordenador da CMDC.",
    acceptsMultiple: true,
    order: 3,
  },
  {
    criteriaId: "D.8",
    code: "nomeacao_tecnicos_cmdc",
    label: "Ato de nomeação dos Técnicos Operacionais",
    description: "Instrumento legal de nomeação dos técnicos operacionais da CMDC.",
    acceptsMultiple: true,
    order: 4,
  },
  {
    criteriaId: "D.8",
    code: "relatorio_cmdc",
    label: "Relatório Operacional de atividades da CMDC",
    description: "Relatório de atividades de prevenção e mitigação de desastres de origem ambiental no período de apuração.",
    acceptsMultiple: true,
    order: 5,
  },

  // ── E.1 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "E.1",
    code: "declaracao_concessionaria",
    label: "Declaração da concessionária/empresa de saneamento",
    description: "Declaração emitida pela concessionária ou empresa de serviços de saneamento informando a cobertura de esgotamento sanitário.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "E.1",
    code: "licenca_operacao_esgoto",
    label: "Licença Ambiental de Operação do sistema de esgoto",
    description: "LAO emitida pelo órgão competente, em validade.",
    acceptsMultiple: true,
    order: 2,
  },

  // ── E.2 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "E.2",
    code: "projeto_nascentes",
    label: "Projeto Técnico de proteção de nascentes (com ART)",
    description: "Projeto com diagnóstico da área (coordenadas, extensão, condições do solo/água/vegetação), metodologia (cercamento, nucleação ou plantio), espécies nativas (mín. 2), quantitativo e cronograma. Taxa de sobrevivência ≥50% após 45 dias.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "E.2",
    code: "relatorio_nascentes",
    label: "Relatório Operacional de proteção de nascentes (com ART)",
    description: "Localização, mapas, coordenadas, diagnóstico, metodologia e ações executadas, quantitativo de mudas, fotos georreferenciadas antes e depois, NF de insumos, mapa georreferenciado das áreas e quadro resumo.",
    acceptsMultiple: true,
    order: 2,
  },

  // ── E.3 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "E.3",
    code: "relatorio_aguas_subterraneas",
    label: "Relatório Operacional de proteção de águas subterrâneas",
    description: "Diagnóstico, descrição e geolocalização da fonte, descrição da ação de proteção, metodologia, resultados (fotos datadas e georreferenciadas) e responsabilidade técnica.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── E.4 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "E.4",
    code: "projeto_aguas_superficiais",
    label: "Projeto Técnico de proteção de águas superficiais (com ART)",
    description: "Projeto com diagnóstico da área, metodologia (cercamento, plantio, nucleação, limpeza, desassoreamento, controle de erosão) e espécies nativas. Taxa de sobrevivência ≥50% após 45 dias.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "E.4",
    code: "relatorio_aguas_superficiais",
    label: "Relatório Operacional de proteção de águas superficiais (com ART)",
    description: "Localização, diagnóstico, mapas, coordenadas, extensão, ações executadas com metodologia analítica, quantitativo de mudas, fotos antes/durante/depois, NF de insumos, mapa georreferenciado e quadro resumo.",
    acceptsMultiple: true,
    order: 2,
  },

  // ── E.5 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "E.5",
    code: "relatorio_monitoramento_agua",
    label: "Relatório Técnico de Monitoramento da qualidade da água",
    description: "Relatório assinado por responsável habilitado com laudos laboratoriais (físico-química e bacteriológica) dos poços municipais, cobrindo mín. 2 trimestres distintos do ano de apuração, e identificação georreferenciada dos pontos de coleta.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── E.6 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "E.6",
    code: "outorga_captacao",
    label: "Portaria de Outorga de Direito de Uso (ou Dispensa de Outorga)",
    description: "Cópia emitida pelo órgão competente para os poços de domínio municipal vigentes no ano de apuração, conforme inventário do E.7.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── E.7 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "E.7",
    code: "inventario_hidro",
    label: "Inventário Hidrogeológico Municipal",
    description: "Mapa georreferenciado e planilha técnica com localização de todos os pontos de captação de domínio municipal, com dados de vazão, profundidade e status de operação.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── F.1 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "F.1",
    code: "relatorio_campanha_sonora",
    label: "Relatório Operacional da campanha de poluição sonora",
    description: "Descrição das atividades, locais de realização, registro fotográfico datado e mín. 4 dias de campanha distribuídos em 2 semestres (2 ações em cada semestre), dissociada de outras campanhas.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── F.2 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "F.2",
    code: "relatorio_campanha_atm",
    label: "Relatório Operacional da campanha de poluição atmosférica",
    description: "Descrição das atividades, locais de realização, registro fotográfico datado e mín. 4 dias distribuídos em 2 semestres, dissociada de outras campanhas.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── F.3 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "F.3",
    code: "relatorio_campanha_visual",
    label: "Relatório Operacional da campanha de poluição visual",
    description: "Descrição das atividades, locais de realização, registro fotográfico datado e mín. 4 dias distribuídos em 2 semestres, dissociada de outras campanhas.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── F.4 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "F.4",
    code: "relatorio_estrutura_fiscalizacao",
    label: "Relatório Operacional de estruturação da fiscalização",
    description: "Quadro de funcionários de fiscalização (conforme Lei 9.605/98 art. 70 §1º) com comprovação de vínculo, comprovante de designação da autoridade julgadora e planejamento de atividades preventivas.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── F.5 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "F.5",
    code: "relatorio_fiscalizacao_sonora",
    label: "Relatório Operacional de fiscalização de poluição sonora",
    description: "Descrição das atividades em mín. 6 dias distintos distribuídos em mín. 3 quadrimestres, com fotos datadas e georreferenciadas, metodologia de manuseio dos instrumentos de medição (certificados pelo Inmetro) e descrição de processos de apuração de irregularidades.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── F.6 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "F.6",
    code: "relatorio_fiscalizacao_visual",
    label: "Relatório Operacional de fiscalização de poluição visual",
    description: "Descrição das atividades em mín. 6 dias distintos distribuídos em mín. 3 quadrimestres, com fotos e descrição de processos de apuração de irregularidades.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── F.7 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "F.7",
    code: "relatorio_fiscalizacao_atm",
    label: "Relatório Operacional de fiscalização de poluição atmosférica",
    description: "Descrição das atividades em mín. 6 dias distintos distribuídos em mín. 3 quadrimestres, com fotos e descrição de processos de apuração de irregularidades.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── F.8 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "F.8",
    code: "cnd_ambiental",
    label: "Certidão Negativa de Débitos Ambientais (SEMARH)",
    description: "CND emitida pela SEMARH, válida dentro do período de apuração do certame.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── G.1 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "G.1",
    code: "lei_uso_solo",
    label: "Lei de uso e ocupação do solo",
    description: "Instrumento legal de instituição da política municipal de uso e ocupação do solo, conforme art. 2º, VI, da Lei Federal 10.257/2001.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "G.1",
    code: "lei_orgao_controle_solo",
    label: "Lei de instituição do órgão de controle de uso do solo",
    description: "Instrumento legal criando o órgão responsável pelo controle do uso e ocupação do solo.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "G.1",
    code: "nomeacao_quadro_solo",
    label: "Instrumento de nomeação do quadro funcional",
    description: "Instrumento legal de nomeação do quadro funcional para exercício das atribuições de controle de uso e ocupação do solo.",
    acceptsMultiple: true,
    order: 3,
  },
  {
    criteriaId: "G.1",
    code: "lei_conselho_urbano",
    label: "Lei e atas do Conselho Municipal de Desenvolvimento Urbano",
    description: "Instrumento legal de criação do conselho, nomeação dos membros e atas das reuniões.",
    acceptsMultiple: true,
    order: 4,
  },

  // ── G.2 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "G.2",
    code: "relatorio_licencas_urbanisticas",
    label: "Relatório Operacional de licenças urbanísticas",
    description: "Detalhamento das licenças urbanísticas emitidas no período de apuração: número da licença, interessado e data de validade.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── G.3 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "G.3",
    code: "relatorio_fiscalizacao_solo",
    label: "Relatório Operacional de fiscalização de uso do solo",
    description: "Descrição das atividades em mín. 6 dias distintos distribuídos em mín. 3 quadrimestres, com fotos datadas e georreferenciadas e descrição de processos de apuração de irregularidades.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── G.4 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "G.4",
    code: "plano_requalificacao",
    label: "Plano de requalificação urbana",
    description: "Cópia do plano de requalificação urbana.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "G.4",
    code: "relatorio_requalificacao",
    label: "Relatório Operacional de execução",
    description: "Relatório comprovando a execução do plano de requalificação no período de apuração.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "G.4",
    code: "art_requalificacao",
    label: "Comprovação de responsabilidade técnica (ART)",
    description: "ART ou documento equivalente do responsável técnico pelo plano de requalificação.",
    acceptsMultiple: true,
    order: 3,
  },

  // ── G.5 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "G.5",
    code: "diagnostico_assentamentos",
    label: "Diagnóstico de assentamentos precários e edificações irregulares",
    description: "Diagnóstico do território municipal no período de apuração, considerando: renda domiciliar, situação fundiária, domínio da área, população, infraestrutura urbana, padrão viário, padrão de lotes, áreas de risco, densidade, material de construção, localização com restrições e zoneamento municipal.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── H.1 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "H.1",
    code: "ato_criacao_uc_federal_estadual",
    label: "Ato normativo de criação da UC federal/estadual",
    description: "Legislação federal e/ou estadual de criação da Unidade de Conservação.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "H.1",
    code: "relatorio_incidencia_uc_fed_est",
    label: "Relatório de comprovação de incidência territorial",
    description: "Relatório demonstrando a incidência da UC federal/estadual no território municipal, com percentual do território abrangido.",
    acceptsMultiple: true,
    order: 2,
  },

  // ── H.2 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "H.2",
    code: "relatorio_acao_conjunta_uc",
    label: "Relatório Técnico de ação conjunta com UC estadual/federal",
    description: "Descrição da ação de cooperação para gestão da UC, metodologia e resultados (fotos datadas e georreferenciadas). Um relatório por ação (máx. 6 ações).",
    acceptsMultiple: true,
    order: 1,
  },

  // ── H.3 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "H.3",
    code: "ato_criacao_uc_municipal",
    label: "Ato normativo de criação da UC municipal",
    description: "Instrumento legal observando os parâmetros da legislação federal e estadual.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "H.3",
    code: "relatorio_incidencia_uc_mun",
    label: "Relatório de comprovação de incidência territorial",
    description: "Relatório demonstrando a incidência da UC municipal no território, com percentual abrangido.",
    acceptsMultiple: true,
    order: 2,
  },

  // ── H.4 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "H.4",
    code: "relatorio_sede_uc",
    label: "Relatório Operacional da sede administrativa da UC",
    description: "Descrição dos equipamentos e instalações da UC municipal com registro fotográfico datado.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── H.5 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "H.5",
    code: "plano_manejo_uc",
    label: "Plano de Manejo da UC municipal (aprovado pela SEMARH)",
    description: "Cópia do plano de manejo aprovado pela SEMARH.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "H.5",
    code: "ato_aprovacao_manejo",
    label: "Ato de aprovação do Plano de Manejo",
    description: "Publicação do ato de aprovação do plano de manejo.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "H.5",
    code: "relatorio_execucao_manejo",
    label: "Relatório Operacional de execução do Plano de Manejo",
    description: "Relatório de execução com registro fotográfico datado.",
    acceptsMultiple: true,
    order: 3,
  },

  // ── H.6 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "H.6",
    code: "lei_conselho_uc",
    label: "Ato legal de criação do Conselho Gestor da UC",
    description: "Criado conforme §6º, art. 17 do Decreto Federal 4.340/2002.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "H.6",
    code: "nomeacao_conselho_uc",
    label: "Instrumento de nomeação dos membros do Conselho Gestor",
    description: "Instrumento legal de nomeação dos membros do conselho gestor da UC.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "H.6",
    code: "atas_conselho_uc",
    label: "Atas das reuniões do Conselho Gestor",
    description: "Atas das reuniões realizadas no período de apuração.",
    acceptsMultiple: true,
    order: 3,
  },

  // ── H.7 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "H.7",
    code: "docs_h3_a_h6",
    label: "Todos os documentos comprobatórios dos itens H.3 a H.6",
    description: "Envie aqui os documentos referentes a H.3, H.4, H.5 e H.6 para comprovação da estrutura completa da UC municipal.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── I.1 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "I.1",
    code: "lei_mudancas_climaticas",
    label: "Legislação municipal de combate às mudanças climáticas",
    description: "Legislação devidamente publicada descrevendo ações ambientais com objetivos a serem perseguidos.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── I.2 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "I.2",
    code: "lei_taxa_residuos",
    label: "Legislação municipal de cobrança por coleta de resíduos",
    description: "Legislação conforme art. 29, inciso II, da Lei Federal 11.445/2007.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "I.2",
    code: "comprov_receitas_taxa",
    label: "Comprovante de receitas da Taxa de Coleta",
    description: "Documento oficial comprovando as receitas decorrentes da cobrança da taxa no período de apuração.",
    acceptsMultiple: true,
    order: 2,
  },

  // ── I.3 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "I.3",
    code: "lei_politica_ma",
    label: "Política Municipal de Meio Ambiente",
    description: "Legislação municipal publicada descrevendo ações ambientais com objetivos a serem perseguidos.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── I.4 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "I.4",
    code: "lei_politica_ea",
    label: "Política Municipal de Educação Ambiental",
    description: "Legislação municipal sobre o tema, devidamente publicada.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── I.5 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "I.5",
    code: "lei_orgao_ma",
    label: "Lei de Criação do Órgão Municipal de Meio Ambiente",
    description: "Cópia da lei de criação do órgão executivo municipal.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "I.5",
    code: "nomeacao_secretario_tecnicos",
    label: "Ato de nomeação do Secretário e Técnicos do Órgão Ambiental",
    description: "Ato ou decreto de nomeação com formação compatível.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "I.5",
    code: "declaracao_municipalizacao",
    label: "Declaração da SEMARH de municipalização do licenciamento",
    description: "Declaração emitida pela SEMARH comprovando a municipalização do licenciamento ambiental.",
    acceptsMultiple: true,
    order: 3,
  },
  {
    criteriaId: "I.5",
    code: "relatorio_licencas_ambientais",
    label: "Relatório Operacional de licenças ambientais expedidas",
    description: "Todas as licenças expedidas no ano de apuração.",
    acceptsMultiple: true,
    order: 4,
  },

  // ── I.6 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "I.6",
    code: "lei_fundo_ma",
    label: "Lei de Criação do Fundo Municipal de Meio Ambiente",
    description: "Cópia da lei de criação do fundo.",
    acceptsMultiple: true,
    order: 1,
  },
  {
    criteriaId: "I.6",
    code: "decreto_fundo_ma",
    label: "Decreto de regulamentação do Fundo",
    description: "Cópia do decreto de regulamentação do Fundo Municipal de Meio Ambiente.",
    acceptsMultiple: true,
    order: 2,
  },
  {
    criteriaId: "I.6",
    code: "atas_fundo_ma",
    label: "Atas das reuniões do Conselho Gestor do Fundo",
    description: "Cópia das atas das reuniões do conselho gestor.",
    acceptsMultiple: true,
    order: 3,
  },
  {
    criteriaId: "I.6",
    code: "posse_conselheiros_fundo",
    label: "Termo de posse dos conselheiros do Fundo",
    description: "Cópia do termo de posse dos conselheiros do Conselho Gestor do Fundo.",
    acceptsMultiple: true,
    order: 4,
  },

  // ── I.7 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "I.7",
    code: "lei_poluicao_sonora",
    label: "Legislação de controle da poluição sonora",
    description: "Cópia do instrumento legal devidamente publicado.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── I.8 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "I.8",
    code: "lei_poluicao_visual",
    label: "Legislação de controle da poluição visual",
    description: "Cópia do instrumento legal devidamente publicado.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── I.9 ──────────────────────────────────────────────────────────────────
  {
    criteriaId: "I.9",
    code: "lei_poluicao_atm",
    label: "Legislação de controle da poluição atmosférica",
    description: "Cópia do instrumento legal devidamente publicado.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── I.10 ─────────────────────────────────────────────────────────────────
  {
    criteriaId: "I.10",
    code: "leis_licenciamento_mun",
    label: "Legislações de licenciamento ambiental municipal",
    description: "Cópia dos instrumentos legais específicos sobre o licenciamento ambiental municipal, devidamente publicados.",
    acceptsMultiple: true,
    order: 1,
  },

  // ── I.11 ─────────────────────────────────────────────────────────────────
  {
    criteriaId: "I.11",
    code: "lei_bem_estar_animal",
    label: "Legislação de promoção do bem-estar animal",
    description: "Cópia do instrumento legal devidamente publicado.",
    acceptsMultiple: true,
    order: 1,
  },
];

async function main() {
  console.log(`🌱 Inserindo ${subDocs.length} sub-documentos...`);

  let created = 0;
  let skipped = 0;

  for (const sd of subDocs) {
    try {
      await prisma.criteriaSubDoc.upsert({
        where: {
          criteriaId_code: {
            criteriaId: sd.criteriaId,
            code: sd.code,
          },
        },
        update: {
          label: sd.label,
          description: sd.description,
          acceptsMultiple: sd.acceptsMultiple,
          order: sd.order,
        },
        create: sd,
      });
      created++;
    } catch (err) {
      console.warn(`⚠️  Erro ao inserir ${sd.criteriaId}/${sd.code}:`, err);
      skipped++;
    }
  }

  console.log(`✅ ${created} sub-documentos inseridos/atualizados, ${skipped} com erro.`);
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());