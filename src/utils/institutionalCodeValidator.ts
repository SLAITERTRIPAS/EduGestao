import { removeDiacritics, extractDistrictCode, extractSchoolCode } from './iueGenerator';

/**
 * Utilitário de Validação Global para Código Institucional
 * Padrão: [SIGLA_PROVINCIA]-[SIGLA_DISTRITO]-[SIGLA_ESCOLA]
 * Exemplo: MP-KM-ESJM (Maputo Cidade - KaMavota - Escola Secundária Josina Machel)
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  expectedStructure?: string;
  foundStructure?: string;
  errors: string[];
}

/**
 * Mapeamento de siglas de províncias para validação
 */
const PROVINCE_INITIALS: Record<string, string> = {
  'maputo cidade': 'MP',
  'maputo provincia': 'MPP',
  'gaza': 'GZ',
  'inhambane': 'INH',
  'sofala': 'SF',
  'manica': 'MN',
  'tete': 'TT',
  'zambezia': 'ZB',
  'nampula': 'NP',
  'cabo delgado': 'CD',
  'niassa': 'NS'
};

/**
 * Valida se o código institucional segue o padrão de integridade baseado nos dados geográficos e de nome
 */
export function validateInstitutionalCode(
  code: string,
  provinceName: string,
  districtName: string,
  schoolName: string
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: []
  };

  if (!code || !code.trim()) {
    result.isValid = false;
    result.errors.push('O Código Institucional é obrigatório.');
    return result;
  }

  const cleanCode = code.trim().toUpperCase();
  const parts = cleanCode.split('-');

  if (parts.length !== 3) {
    result.isValid = false;
    result.errors.push('A estrutura do código deve ser: PROV-DIST-ESCOLA (ex: MP-KM-ESJM).');
    result.foundStructure = `Detectadas ${parts.length} partes.`;
    return result;
  }

  const [codeProv, codeDist, codeSchool] = parts;

  // 1. Validar Província
  const expectedProv = PROVINCE_INITIALS[removeDiacritics(provinceName).toLowerCase()] || provinceName.substring(0, 2).toUpperCase();
  if (codeProv !== expectedProv) {
    result.isValid = false;
    result.errors.push(`Iniciais da Província incorretas. Esperado: ${expectedProv}, Encontrado: ${codeProv}`);
  }

  // 2. Validar Distrito
  const expectedDist = extractDistrictCode(districtName).toUpperCase();
  if (codeDist !== expectedDist) {
    result.isValid = false;
    result.errors.push(`Iniciais do Distrito incorretas. Esperado: ${expectedDist}, Encontrado: ${codeDist}`);
  }

  // 3. Validar Escola
  const expectedSchool = extractSchoolCode(schoolName).toUpperCase();
  if (codeSchool !== expectedSchool) {
    // Se o código for uma substring ou conter as iniciais, podemos ser mais flexíveis ou rígidos.
    // Para integridade automática, seremos rígidos mas informativos.
    result.isValid = false;
    result.errors.push(`Sigla da Escola incorreta. Esperado: ${expectedSchool}, Encontrado: ${codeSchool}`);
  }

  if (!result.isValid) {
    result.message = 'Erro de Integridade: O Código Institucional não corresponde à localização e nome da unidade escolar.';
    result.expectedStructure = `${expectedProv}-${expectedDist}-${expectedSchool}`;
  }

  return result;
}

/**
 * Sugere um código institucional válido com base nos dados fornecidos
 */
export function suggestInstitutionalCode(
  provinceName: string,
  districtName: string,
  schoolName: string
): string {
  const prov = PROVINCE_INITIALS[removeDiacritics(provinceName).toLowerCase()] || provinceName.substring(0, 2).toUpperCase();
  const dist = extractDistrictCode(districtName).toUpperCase();
  const sch = extractSchoolCode(schoolName).toUpperCase();
  
  return `${prov}-${dist}-${sch}`;
}
