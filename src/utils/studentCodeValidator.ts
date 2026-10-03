/**
 * Utilitário de Validação e Formatação do Código do Estudante
 * Sistema Nacional de Educação • MINEDH / EduGestão
 * 
 * Regra Obrigatória de Composição:
 * O código do estudante DEVE ser composto pelas iniciais de:
 * [PROVÍNCIA]-[DISTRITO]-[NOME_DA_ESCOLA]-[SEQUÊNCIA_OU_ANO_ID]
 * 
 * E deve ser exibido OBRIGATORIAMENTE ANTES DO NOME em todos os relatórios,
 * pautas e cadernetas do sistema.
 */

import { 
  extractProvinceInitials, 
  extractDistrictInitials, 
  extractSchoolNameInitials,
  cleanText
} from './institutionCode';

export interface StudentContext {
  id?: string;
  name?: string;
  studentCode?: string;
  iue?: string;
  nim?: string;
  processCode?: string;
  frequencyNumber?: number | string;
  pautaNumber?: number | string;
  province?: string;
  district?: string;
}

export interface SchoolValidationContext {
  id?: string;
  name?: string;
  province?: string;
  district?: string;
  districtName?: string;
  code?: string;
}

export interface StudentValidationResult {
  isValid: boolean;
  code: string;
  name: string;
  displayFormatted: string;
  reason?: string;
  expectedPrefix: string;
}

/**
 * Extrai o identificador numérico/alfanumérico do estudante
 */
export function extractStudentNumericId(student: Partial<StudentContext>): string {
  if (student.studentCode && student.studentCode.includes('-')) {
    const parts = student.studentCode.split('-');
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.length >= 2) return lastPart;
  }
  if (student.frequencyNumber !== undefined && student.frequencyNumber !== null) {
    return String(student.frequencyNumber).padStart(4, '0');
  }
  if (student.pautaNumber !== undefined && student.pautaNumber !== null) {
    return String(student.pautaNumber).padStart(4, '0');
  }
  if (student.id) {
    const digits = student.id.replace(/\D/g, '');
    if (digits.length >= 3) return digits.slice(-4);
    return cleanText(student.id).slice(-4);
  }
  return '0001';
}

/**
 * Gera o Código do Estudante seguindo a regra oficial de composição:
 * Iniciais da Província, Distrito e Nome da Escola.
 * Formato: [PROV]-[DIST]-[ESCOLA]-[NUM]
 */
export function generateStudentCode(
  student: Partial<StudentContext>,
  schoolContext?: Partial<SchoolValidationContext> | null
): string {
  const province = student.province || schoolContext?.province || 'Maputo Cidade';
  const district = student.district || schoolContext?.district || schoolContext?.districtName || 'KaMpfumo';
  const schoolName = schoolContext?.name || 'Escola Secundária Josina Machel';

  const provInit = extractProvinceInitials(province);
  const distInit = extractDistrictInitials(district);
  const schoolInit = extractSchoolNameInitials(schoolName);
  const numId = extractStudentNumericId(student);

  return `${provInit}-${distInit}-${schoolInit}-${numId}`;
}

/**
 * Valida se um código de estudante atende rigorosamente à regra de composição
 * (contendo as iniciais da Província, Distrito e Escola)
 */
export function validateStudentCode(
  studentCode: string | undefined | null,
  student: Partial<StudentContext>,
  schoolContext?: Partial<SchoolValidationContext> | null
): { isValid: boolean; reason?: string; expectedPrefix: string; formattedCode: string } {
  const province = student.province || schoolContext?.province || 'Maputo Cidade';
  const district = student.district || schoolContext?.district || schoolContext?.districtName || 'KaMpfumo';
  const schoolName = schoolContext?.name || 'Escola Secundária Josina Machel';

  const provInit = extractProvinceInitials(province);
  const distInit = extractDistrictInitials(district);
  const schoolInit = extractSchoolNameInitials(schoolName);
  const expectedPrefix = `${provInit}-${distInit}-${schoolInit}`;

  if (!studentCode || !studentCode.trim()) {
    const fallbackCode = generateStudentCode(student, schoolContext);
    return {
      isValid: false,
      reason: 'Código do estudante não preenchido. Gerado código automático padronizado.',
      expectedPrefix,
      formattedCode: fallbackCode,
    };
  }

  const clean = cleanText(studentCode).replace(/[\/\.]/g, '-');
  const containsProv = clean.includes(provInit);
  const containsDist = clean.includes(distInit);
  const containsSchool = clean.includes(schoolInit);

  if (containsProv && containsDist && containsSchool) {
    return {
      isValid: true,
      expectedPrefix,
      formattedCode: clean,
    };
  }

  // Gera o código padronizado corrigido
  const correctedCode = generateStudentCode(student, schoolContext);
  return {
    isValid: false,
    reason: `Código fora da regra de composição ministerial (requer iniciais de Província [${provInit}], Distrito [${distInit}] e Escola [${schoolInit}]).`,
    expectedPrefix,
    formattedCode: correctedCode,
  };
}

/**
 * Função de validação mandatória que garante que o código do estudante
 * é gerado e formatado ANTES do nome em qualquer relatório, pauta ou caderneta.
 */
export function ensureStudentCodeBeforeName(
  student: Partial<StudentContext>,
  schoolContext?: Partial<SchoolValidationContext> | null
): StudentValidationResult {
  const validation = validateStudentCode(student.studentCode, student, schoolContext);
  const code = validation.formattedCode;
  const name = (student.name || 'Estudante Sem Nome').trim();
  const displayFormatted = `[${code}] ${name}`;

  return {
    isValid: validation.isValid,
    code,
    name,
    displayFormatted,
    reason: validation.reason,
    expectedPrefix: validation.expectedPrefix,
  };
}

/**
 * Valida se uma string ou linha exibe o código ANTES do nome
 */
export function isCodeDisplayedBeforeName(text: string, code: string, name: string): boolean {
  if (!text || !code || !name) return false;
  const codeIdx = text.indexOf(code);
  const nameIdx = text.indexOf(name);
  if (codeIdx === -1 || nameIdx === -1) return false;
  return codeIdx < nameIdx;
}
