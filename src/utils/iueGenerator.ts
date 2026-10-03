/**
 * Utilitário Oficial de Identificadores Únicos do Estudante (IUE) e NIM
 * Padrão Institucional do MINEDH / EduGestão
 * 
 * Estrutura Padronizada do IUE:
 * [INICIAIS]-[Nº_DOCUMENTO]-[CÓDIGO_ESCOLA]/[PROVÍNCIA]/[DISTRITO]/[ANO]
 * 
 * Exemplo Oficial:
 * ABV-110104567890A-EPBCHN/TETE/CB/2027
 */

export interface StudentIUEParams {
  name: string;
  documentNumber?: string; // BI, Passaporte, Certidão ou NUIT
  idCardNumber?: string;
  nuit?: string;
  schoolName?: string;
  schoolCode?: string;
  province?: string;
  district?: string;
  academicYear?: number | string;
}

export interface ParsedIUE {
  isValid: boolean;
  raw: string;
  initials: string;
  documentNumber: string;
  schoolCode: string;
  province: string;
  district: string;
  year: string;
}

// Stop words em língua portuguesa para extração de iniciais
const PORTUGUESE_STOP_WORDS = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'para', 'com', 'por'
]);

// Mapeamento de siglas de distritos mais comuns em Moçambique
const DISTRICT_CODE_MAP: Record<string, string> = {
  'cahora bassa': 'CB',
  'cahora-bassa': 'CB',
  'chitima': 'CHN',
  'chitima norte': 'CHN',
  'kamavota': 'KM',
  'ka mavota': 'KM',
  'kampfumo': 'KMP',
  'ka mpfumo': 'KMP',
  'kamaxakeni': 'KMX',
  'ka maxakeni': 'KMX',
  'kamubukwana': 'KMB',
  'ka mubukwana': 'KMB',
  'katembe': 'KT',
  'ka tembe': 'KT',
  'kanyaka': 'KN',
  'ka nyaka': 'KN',
  'matola': 'MAT',
  'boane': 'BOA',
  'manhiça': 'MNH',
  'marracuene': 'MRR',
  'namaacha': 'NAM',
  'moamba': 'MOA',
  'magude': 'MAG',
  'gurué': 'GU',
  'gurue': 'GU',
  'mocuba': 'MCB',
  'milange': 'MLG',
  'quelimane': 'QLM',
  'chinde': 'CHD',
  'alto molócuè': 'AML',
  'alto molocue': 'AML',
  'moatize': 'MTZ',
  'changara': 'CHG',
  'mutarara': 'MTR',
  'marara': 'MRR',
  'chifunde': 'CFD',
  'angónia': 'ANG',
  'angonia': 'ANG',
  'beira': 'BEI',
  'dondo': 'DND',
  'nhamatanda': 'NHT',
  'buzi': 'BUZ',
  'chimoio': 'CHM',
  'manica': 'MNC',
  'gondola': 'GND',
  'nampula': 'NPL',
  'nacala': 'NCL',
  'nacala-porto': 'NCL',
  'ilha de moçambique': 'IDM',
  'ilha de mocambique': 'IDM',
  'monapo': 'MNP',
  'angoche': 'ANG',
  'xai-xai': 'XX',
  'chókwè': 'CKW',
  'chokwe': 'CKW',
  'maxixe': 'MAX',
  'inhambane': 'INH',
  'vilankulo': 'VLK',
  'pemba': 'PMB',
  'montepuez': 'MTP',
  'mocímboa da praia': 'MCP',
  'lichinga': 'LCH',
  'cuamba': 'CBA'
};

/**
 * Remove acentos e caracteres especiais para padronização de códigos
 */
export function removeDiacritics(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

/**
 * Extrai as iniciais de um nome, ignorando preposições e conectivos
 * Ex: "António Beula Vicente" -> "ABV"
 * Ex: "Maria de Lurdes da Conceição" -> "MLC"
 */
export function extractInitials(name: string): string {
  if (!name || !name.trim()) return 'EST';
  
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const significantInitials = words
    .filter(word => !PORTUGUESE_STOP_WORDS.has(word.toLowerCase()))
    .map(word => {
      const clean = removeDiacritics(word);
      return clean.charAt(0);
    })
    .filter(Boolean)
    .join('');

  if (significantInitials.length >= 2) {
    return significantInitials.slice(0, 6);
  }

  // Fallback se o nome for curto ou consistir apenas de preposições
  const fallbackInitials = words
    .map(word => removeDiacritics(word).charAt(0))
    .join('');

  return (fallbackInitials || 'EST').slice(0, 6);
}

/**
 * Normaliza e gera o código da escola (sigla)
 * Ex: "Escola Primária Básica de Chitima Norte" -> "EPBCHN"
 * Ex: "Escola Secundária Josina Machel" -> "ESJM"
 * Ex: "ESG Cahora Bassa" -> "ESGS" ou "ESGCB"
 */
export function extractSchoolCode(schoolName?: string, customCode?: string): string {
  if (customCode && customCode.trim()) {
    return removeDiacritics(customCode.trim().replace(/[^a-zA-Z0-9]/g, ''));
  }

  if (!schoolName || !schoolName.trim()) {
    return 'MINEDH';
  }

  const cleanName = schoolName.trim();

  // Mapeamentos diretos conhecidos
  const knownSchools: Record<string, string> = {
    'escola secundária josina machel': 'ESJM',
    'escola secundaria josina machel': 'ESJM',
    'escola primária básica de chitima norte': 'EPBCHN',
    'escola primaria basica de chitima norte': 'EPBCHN',
    'escola secundária de songo': 'ESGS',
    'escola secundaria de songo': 'ESGS',
    'escola secundária geral de songo': 'ESGS',
    'escola secundária de cahora bassa': 'ESGCB',
    'escola secundaria de cahora bassa': 'ESGCB',
    'esg de cahora bassa': 'ESGCB',
    'escola secundária de gurué': 'ESGU',
    'escola secundaria de gurue': 'ESGU',
    'escola secundária francisco manyanga': 'ESFM',
    'escola secundaria francisco manyanga': 'ESFM',
    'escola primária completa 3 de fevereiro': 'EPC3F',
    'escola primaria completa 3 de fevereiro': 'EPC3F',
    'escola comunitária são pedro': 'ECSP',
    'escola comunitaria sao pedro': 'ECSP'
  };

  const lower = cleanName.toLowerCase();
  if (knownSchools[lower]) {
    return knownSchools[lower];
  }

  // Extrair iniciais das palavras significativas da escola
  const words = cleanName.split(/\s+/).filter(Boolean);
  const initials = words
    .filter(w => !PORTUGUESE_STOP_WORDS.has(w.toLowerCase()))
    .map(w => {
      const clean = removeDiacritics(w).replace(/[^A-Z0-9]/g, '');
      return clean.charAt(0);
    })
    .join('');

  return initials.length >= 3 ? initials.slice(0, 8) : removeDiacritics(cleanName.replace(/[^A-Z0-9]/gi, '')).slice(0, 6) || 'ESC';
}

/**
 * Normaliza o nome da província (letras maiúsculas, sem acentos, sem espaços)
 * Ex: "Zambézia" -> "ZAMBEZIA", "Maputo Cidade" -> "MAPUTO"
 */
export function normalizeProvince(province?: string): string {
  if (!province || !province.trim()) return 'MAPUTO';
  
  let clean = removeDiacritics(province.trim());
  
  if (clean.includes('MAPUTO CIDADE') || clean.includes('CIDADE DE MAPUTO')) {
    return 'MAPUTO';
  }
  if (clean.includes('MAPUTO PROVINCIA')) {
    return 'MAPUTO_PROV';
  }
  if (clean.includes('CABO DELGADO')) {
    return 'CABODELGADO';
  }
  
  return clean.replace(/[^A-Z0-9]/g, '');
}

/**
 * Normaliza a sigla do distrito
 * Ex: "Cahora Bassa" -> "CB"
 * Ex: "KaMavota" -> "KM"
 * Ex: "Gurué" -> "GU"
 */
export function extractDistrictCode(district?: string): string {
  if (!district || !district.trim()) return 'CB';
  
  const lower = district.trim().toLowerCase();
  if (DISTRICT_CODE_MAP[lower]) {
    return DISTRICT_CODE_MAP[lower];
  }

  // Verificar se começa com "ka" ou "distrito"
  const clean = removeDiacritics(district.trim());
  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return words
      .filter(w => !PORTUGUESE_STOP_WORDS.has(w.toLowerCase()))
      .map(w => w.charAt(0))
      .join('')
      .slice(0, 4);
  }

  return clean.replace(/[^A-Z0-9]/g, '').slice(0, 3);
}

function stableStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Normaliza o número do documento (BI, NUIT, Certidão)
 * Se não informado, gera um código de identificação alfanumérico estruturado e determinístico
 */
export function normalizeDocumentNumber(doc?: string, nuit?: string, idCardNumber?: string, fallbackSeed = ''): string {
  const candidate = (doc || idCardNumber || nuit || '').trim();
  
  if (candidate) {
    // Manter alfanuméricos (ex: 110104567890A, 080045678912B)
    const cleaned = removeDiacritics(candidate).replace(/[^A-Z0-9]/g, '');
    if (cleaned.length >= 4) {
      return cleaned;
    }
  }

  // Fallback determinístico para documento provisório de matrícula (NUNCA usar Math.random para evitar loops infinitos)
  const seed = (fallbackSeed || candidate || 'PROVISORIO').trim();
  const hash = stableStringHash(seed);
  const stableNum = (hash % 900000000 + 100000000).toString();
  return `${stableNum}P`;
}

/**
 * Gera o Identificador Único do Estudante (IUE) oficial do EduGestão / MINEDH
 * 
 * Formato Padrão:
 * [INICIAIS]-[Nº_DOCUMENTO]-[CÓDIGO_ESCOLA]/[PROVÍNCIA]/[DISTRITO]/[ANO]
 * 
 * Ex: ABV-110104567890A-EPBCHN/TETE/CB/2027
 */
export function generateIUE(params: StudentIUEParams): string {
  const initials = extractInitials(params.name);
  const docNumber = normalizeDocumentNumber(params.documentNumber, params.nuit, params.idCardNumber, params.name);
  const schoolCode = extractSchoolCode(params.schoolName, params.schoolCode);
  const province = normalizeProvince(params.province);
  const districtCode = extractDistrictCode(params.district);
  const year = params.academicYear ? String(params.academicYear).trim() : '2026';

  return `${initials}-${docNumber}-${schoolCode}/${province}/${districtCode}/${year}`;
}

/**
 * Gera o Número Interno de Matrícula (NIM) para uso operacional diário
 * 
 * Formato:
 * [ANO]-[DISTRITO_SIGLA]-[SEQUENCIAL_6_DIGITOS]
 * 
 * Ex: 2027-CB-000001 ou 2026-KM-000142
 */
export function generateNIM(params: {
  year?: number | string;
  district?: string;
  sequenceNumber?: number;
  fallbackSeed?: string;
}): string {
  const year = params.year ? String(params.year).trim() : '2026';
  const districtCode = extractDistrictCode(params.district);
  let seq = params.sequenceNumber;
  if (!seq) {
    if (params.fallbackSeed) {
      seq = (stableStringHash(params.fallbackSeed) % 99990) + 1;
    } else {
      seq = 1;
    }
  }
  const paddedSeq = String(seq).padStart(6, '0');

  return `${year}-${districtCode}-${paddedSeq}`;
}

/**
 * Converte o IUE em cabeçalho ou rodapé institucional de documentos
 * Ex: "REF: ABV-110104567890A-EPBCHN/TETE/CB/2027"
 */
export function formatDocumentReference(iue: string, type: 'REF' | 'REF_EDUGESTAO' = 'REF'): string {
  if (type === 'REF_EDUGESTAO') {
    return `REF. EDUGESTÃO: ${iue}`;
  }
  return `REF: ${iue}`;
}

/**
 * Gera os dados estruturados para o QR Code institucional
 */
export function generateStudentQRCodePayload(data: {
  iue: string;
  name: string;
  schoolName?: string;
  province?: string;
  district?: string;
  gradeLevel?: string;
  className?: string;
  academicYear?: number | string;
  status?: string;
}): string {
  return [
    `ID ÚNICO: ${data.iue}`,
    `ESTUDANTE: ${data.name}`,
    `ESCOLA: ${data.schoolName || 'Escola Secundária Josina Machel'}`,
    `PROVÍNCIA: ${data.province || 'Maputo Cidade'}`,
    `DISTRITO: ${data.district || 'Kamavota'}`,
    `CLASSE: ${data.gradeLevel || '10ª Classe'}`,
    `TURMA: ${data.className || 'Turma A'}`,
    `ANO LECTIVO: ${data.academicYear || 2026}`,
    `ESTADO: ${data.status || 'Activo'}`,
    `MINEDH / SIGE-EDUGESTÃO MOÇAMBIQUE`
  ].join('\n');
}

/**
 * Faz o parse de uma string de IUE para seus componentes estruturados
 */
export function parseIUE(iueString: string): ParsedIUE {
  if (!iueString || typeof iueString !== 'string') {
    return {
      isValid: false,
      raw: '',
      initials: '',
      documentNumber: '',
      schoolCode: '',
      province: '',
      district: '',
      year: ''
    };
  }

  const raw = iueString.trim();
  // Regex para [INICIAIS]-[Nº_DOC]-[ESCOLA]/[PROV]/[DIST]/[ANO]
  const pattern = /^([A-Z0-9]+)-([A-Z0-9]+)-([A-Z0-9]+)\/([A-Z0-9_]+)\/([A-Z0-9_]+)\/([0-9]{4})$/i;
  const match = raw.match(pattern);

  if (match) {
    return {
      isValid: true,
      raw,
      initials: match[1].toUpperCase(),
      documentNumber: match[2].toUpperCase(),
      schoolCode: match[3].toUpperCase(),
      province: match[4].toUpperCase(),
      district: match[5].toUpperCase(),
      year: match[6]
    };
  }

  // Fallback suave para IUEs parcialmente formatados
  const parts = raw.split(/[-/]/);
  return {
    isValid: parts.length >= 4,
    raw,
    initials: parts[0] || '',
    documentNumber: parts[1] || '',
    schoolCode: parts[2] || '',
    province: parts[3] || '',
    district: parts[4] || '',
    year: parts[5] || '2026'
  };
}

/**
 * Valida se a string é um IUE válido no padrão do MINEDH/EduGestão
 */
export function validateIUE(iue: string): boolean {
  return parseIUE(iue).isValid;
}
