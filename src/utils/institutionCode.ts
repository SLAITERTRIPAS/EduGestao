/**
 * Utilitário Oficial de Código Institucional Padronizado
 * Sistema Nacional de Educação • MINEDH / EduGestão
 * 
 * Regra de Composição Estruturada:
 * [INICIAIS_DA_PROVÍNCIA]/[INICIAIS_DO_DISTRITO]/[INICIAIS_DO_NOME_DA_ESCOLA]
 * 
 * Exemplos Oficiais:
 * - Província: Maputo Cidade, Distrito: KaMpfumo, Escola: Escola Secundária Josina Machel
 *   -> MAP/KMP/ESJM
 * - Província: Tete, Distrito: Cahora Bassa, Escola: Escola Primária Básica de Chitima Norte
 *   -> TET/CB/EPBCHN
 * - Província: Sofala, Distrito: Beira, Escola: Escola Secundária de Songo
 *   -> SOF/BEI/ESS
 */

export interface SchoolContextParams {
  id?: string;
  name?: string;
  province?: string;
  district?: string;
  districtName?: string;
  code?: string;
}

const STOP_WORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com', 'por', 'a', 'o'
]);

/**
 * Remove acentos e diacríticos
 */
export function cleanText(str?: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

/**
 * Extrai as iniciais da Província de Moçambique
 */
export function extractProvinceInitials(provinceName?: string): string {
  if (!provinceName) return 'MAP';
  const clean = cleanText(provinceName);

  const PROVINCE_MAP: Record<string, string> = {
    'MAPUTO CIDADE': 'MAP',
    'CIDADE DE MAPUTO': 'MAP',
    'MAPUTO PROVINCIA': 'MPR',
    'PROVINCIA DE MAPUTO': 'MPR',
    'MAPUTO': 'MAP',
    'GAZA': 'GAZ',
    'INHAMBANE': 'INH',
    'SOFALA': 'SOF',
    'MANICA': 'MAN',
    'TETE': 'TET',
    'ZAMBEZIA': 'ZAM',
    'NAMPULA': 'NAM',
    'CABO DELGADO': 'CDG',
    'NIASSA': 'NIA',
  };

  for (const [key, code] of Object.entries(PROVINCE_MAP)) {
    if (clean.includes(key)) return code;
  }

  // Fallback: primeiras 3 letras
  const letters = clean.replace(/[^A-Z]/g, '');
  return letters.slice(0, 3) || 'MAP';
}

/**
 * Extrai as iniciais do Distrito de Moçambique
 */
export function extractDistrictInitials(districtName?: string): string {
  if (!districtName) return 'KMP';
  const clean = cleanText(districtName);

  const DISTRICT_MAP: Record<string, string> = {
    'KAMPFUMO': 'KMP',
    'KA MPFUMO': 'KMP',
    'KAMAVOTA': 'KMV',
    'KA MAVOTA': 'KMV',
    'KAMAXAKENI': 'KMX',
    'KA MAXAKENI': 'KMX',
    'KAMUBUKWANA': 'KMB',
    'KA MUBUKWANA': 'KMB',
    'KATEMBE': 'KTB',
    'KA TEMBE': 'KTB',
    'KANYAKA': 'KNY',
    'KA NYAKA': 'KNY',
    'CAHORA BASSA': 'CB',
    'CAHORA-BASSA': 'CB',
    'CHITIMA': 'CHN',
    'MATOLA': 'MAT',
    'BOANE': 'BOA',
    'MANHICA': 'MNH',
    'MARRACUENE': 'MRR',
    'MOAMBA': 'MOA',
    'MAGUDE': 'MAG',
    'NAMAACHA': 'NAM',
    'XAI-XAI': 'XX',
    'CHOKWE': 'CKW',
    'CHIBUTO': 'CBT',
    'MAXIXE': 'MAX',
    'INHAMBANE': 'INH',
    'VILANKULO': 'VLK',
    'BEIRA': 'BEI',
    'DONDO': 'DND',
    'NHAMATANDA': 'NHT',
    'BUZI': 'BUZ',
    'CHIMOIO': 'CHM',
    'MANICA': 'MNC',
    'GONDOLA': 'GND',
    'TETE': 'TET',
    'MOATIZE': 'MTZ',
    'CHANGARA': 'CHG',
    'MUTARARA': 'MTR',
    'SONGO': 'SNG',
    'QUELIMANE': 'QLM',
    'MOCUBA': 'MCB',
    'GURUE': 'GUR',
    'MILANGE': 'MLG',
    'NAMPULA': 'NAM',
    'NACALA': 'NCL',
    'NACALA-PORTO': 'NCL',
    'MONAPO': 'MNP',
    'PEMBA': 'PMB',
    'MONTEPUEZ': 'MTP',
    'MOCIMBOA DA PRAIA': 'MCP',
    'LICHINGA': 'LCH',
    'CUAMBA': 'CBA',
  };

  for (const [key, code] of Object.entries(DISTRICT_MAP)) {
    if (clean.includes(key)) return code;
  }

  // Extrair iniciais significativas
  const words = clean.split(/\s+/).filter(w => !STOP_WORDS.has(w.toLowerCase()));
  if (words.length > 1) {
    const inits = words.map(w => w[0]).join('');
    if (inits.length >= 2) return inits.slice(0, 4);
  }

  return clean.replace(/[^A-Z]/g, '').slice(0, 3) || 'DST';
}

/**
 * Extrai as iniciais do Nome da Escola
 */
export function extractSchoolNameInitials(schoolName?: string): string {
  if (!schoolName) return 'ESJM';
  const clean = cleanText(schoolName);

  const KNOWN_MAP: Record<string, string> = {
    'JOSINA MACHEL': 'ESJM',
    'CHITIMA NORTE': 'EPBCHN',
    'FRANCISCO MANYANGA': 'ESFM',
    'SONGO': 'ESGS',
    '3 DE FEVEREIRO': 'EPC3F',
    'SAO PEDRO': 'ECSP',
    'HEROIS MOCAMBICANOS': 'ESHM',
    'CENTRAL': 'ESC',
  };

  for (const [key, code] of Object.entries(KNOWN_MAP)) {
    if (clean.includes(key)) return code;
  }

  // Extrair siglas das palavras substantivas (ignorando artigos e preposições)
  const words = clean.split(/\s+/).filter(w => !STOP_WORDS.has(w.toLowerCase()));
  const initials = words.map(w => w[0]).join('');
  
  if (initials.length >= 2) {
    return initials.slice(0, 6);
  }

  return clean.replace(/[^A-Z]/g, '').slice(0, 4) || 'ESC';
}

/**
 * Função principal que gera automaticamente o Código Institucional
 * padronizado no formato: [PROVÍNCIA]/[DISTRITO]/[ESCOLA]
 */
export function generateInstitutionalCode(
  school?: Partial<SchoolContextParams> | null,
  overrides?: { province?: string; district?: string; schoolName?: string }
): string {
  const province = overrides?.province || school?.province || 'Maputo Cidade';
  const district = overrides?.district || school?.district || school?.districtName || 'KaMpfumo';
  const schoolName = overrides?.schoolName || school?.name || 'Escola Secundária Josina Machel';

  const provInit = extractProvinceInitials(province);
  const distInit = extractDistrictInitials(district);
  const schoolInit = extractSchoolNameInitials(schoolName);

  return `${provInit}/${distInit}/${schoolInit}`;
}

/**
 * Alias de compatibilidade com chamadas existentes
 */
export const getInstitutionalCode = (
  schoolOrParams?: any,
  overrides?: { province?: string; district?: string; schoolName?: string }
): string => {
  if (!schoolOrParams && !overrides) {
    return 'MAP/KMP/ESJM';
  }
  if (typeof schoolOrParams === 'string') {
    return generateInstitutionalCode(null, { schoolName: schoolOrParams, ...overrides });
  }
  return generateInstitutionalCode(schoolOrParams, overrides);
};
