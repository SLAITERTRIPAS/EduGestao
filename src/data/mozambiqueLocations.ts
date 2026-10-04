import { generateIUE } from '../utils/iueGenerator';

export interface ProvinceDistricts {
  province: string;
  districts: string[];
}

export const MOZAMBIQUE_PROVINCES: ProvinceDistricts[] = [
  {
    province: 'Cabo Delgado',
    districts: [
      'Pemba (Cidade)',
      'Ancuabe',
      'Balama',
      'Chiúre',
      'Ibo',
      'Macomia',
      'Mecúfi',
      'Meluco',
      'Metuge',
      'Mocímboa da Praia',
      'Montepuez',
      'Mueda',
      'Muidumbe',
      'Namuno',
      'Palma',
      'Quissanga'
    ]
  },
  {
    province: 'Gaza',
    districts: [
      'Xai-Xai (Cidade)',
      'Bilene',
      'Chibuto',
      'Chicualacuala',
      'Chigubo',
      'Chókwè',
      'Chongoene',
      'Guijá',
      'Limpopo',
      'Mabalane',
      'Manjacaze',
      'Mapai',
      'Massangena',
      'Massingir'
    ]
  },
  {
    province: 'Inhambane',
    districts: [
      'Inhambane (Cidade)',
      'Maxixe (Cidade)',
      'Funhalouro',
      'Govuro',
      'Homoíne',
      'Inharrime',
      'Inhassoro',
      'Jangamo',
      'Mabote',
      'Massinga',
      'Morrumbene',
      'Panda',
      'Vilankulo',
      'Zavala'
    ]
  },
  {
    province: 'Manica',
    districts: [
      'Chimoio (Cidade)',
      'Báruè',
      'Gondola',
      'Guro',
      'Macate',
      'Machaze',
      'Macossa',
      'Manica',
      'Mossurize',
      'Sussundenga',
      'Tambara',
      'Vanduzi'
    ]
  },
  {
    province: 'Maputo Cidade',
    districts: [
      'KaMpfumo',
      'KaNlhamankulu',
      'KaMaxakeni',
      'KaMavota',
      'KaMubukwana',
      'KaTembe',
      'KaNyaka'
    ]
  },
  {
    province: 'Maputo Província',
    districts: [
      'Matola (Cidade)',
      'Boane',
      'Magude',
      'Manhiça',
      'Marracuene',
      'Matutuíne',
      'Moamba',
      'Namaacha'
    ]
  },
  {
    province: 'Nampula',
    districts: [
      'Nampula (Cidade)',
      'Nacala-Porto (Cidade)',
      'Angoche',
      'Eráti',
      'Ilha de Moçambique',
      'Lalaua',
      'Larde',
      'Liúpo',
      'Malema',
      'Meconta',
      'Mecubúri',
      'Memba',
      'Mogincual',
      'Mogovolas',
      'Moma',
      'Monapo',
      'Mossuril',
      'Muecate',
      'Murrupula',
      'Nacala-a-Velha',
      'Nacarôa',
      'Rapale',
      'Ribáuè'
    ]
  },
  {
    province: 'Niassa',
    districts: [
      'Lichinga (Cidade)',
      'Cuamba (Cidade)',
      'Chimbunila',
      'Lago',
      'Majune',
      'Mandimba',
      'Marrupa',
      'Maúa',
      'Mecanhelas',
      'Mecula',
      'Metarica',
      'Muembe',
      'N\'gauma',
      'Sanga'
    ]
  },
  {
    province: 'Sofala',
    districts: [
      'Beira (Cidade)',
      'Dondo (Cidade)',
      'Búzi',
      'Caia',
      'Chemba',
      'Cheringoma',
      'Chibabava',
      'Gorongosa',
      'Machanga',
      'Marínguè',
      'Marromeu',
      'Muanza',
      'Nhamatanda'
    ]
  },
  {
    province: 'Tete',
    districts: [
      'Tete (Cidade)',
      'Moatize (Vila)',
      'Angónia',
      'Cahora-Bassa',
      'Changara',
      'Chifunde',
      'Chiuta',
      'Dôa',
      'Macanga',
      'Magoé',
      'Marara',
      'Marávia',
      'Mutarara',
      'Tsangano',
      'Zumbo'
    ]
  },
  {
    province: 'Zambézia',
    districts: [
      'Quelimane (Cidade)',
      'Mocuba (Cidade)',
      'Gurué (Cidade)',
      'Alto Molócue',
      'Chinde',
      'Derre',
      'Gilé',
      'Ilha de Inhassunge',
      'Luabo',
      'Lugela',
      'Maganja da Costa',
      'Milange',
      'Mocubela',
      'Molumbo',
      'Mopeia',
      'Morrumbala',
      'Mulevala',
      'Namacurra',
      'Namarroi',
      'Nicoadala',
      'Pebane'
    ]
  }
];

export function getDistrictsForProvince(provinceName: any): string[] {
  let nameStr = '';
  if (typeof provinceName === 'string') {
    nameStr = provinceName;
  } else if (provinceName && typeof provinceName === 'object') {
    nameStr = provinceName.provinceName || provinceName.province || provinceName.name || '';
  }

  const found = MOZAMBIQUE_PROVINCES.find(
    p => p.province.toLowerCase() === (nameStr || '').trim().toLowerCase()
  );
  return found ? found.districts : [];
}

export function getInitials(name: any): string {
  let nameStr = '';
  if (typeof name === 'string') {
    nameStr = name;
  } else if (name && typeof name === 'object') {
    nameStr = name.name || name.fullName || '';
  }

  const cleanName = (nameStr || '').trim();
  if (!cleanName) return '';
  const stopWords = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);
  const words = cleanName.split(/\s+/).filter(Boolean);
  
  let initials = words
    .filter(w => !stopWords.has(w.toLowerCase()))
    .map(w => w[0]?.toUpperCase() || '')
    .join('');

  if (!initials && words.length > 0) {
    initials = words.map(w => w[0]?.toUpperCase() || '').join('');
  }
  return initials;
}

/**
 * Generates an automatic unique employee ID based on initials of the name and the NUIT
 */
export function generateEmployeeId(name: string, nuit: string): string {
  const initials = getInitials(name) || 'COL';
  const cleanNuit = (nuit || '').trim().replace(/\D/g, '');
  return cleanNuit ? `${initials}-${cleanNuit}` : initials;
}

export { 
  generateIUE, 
  generateNIM, 
  formatDocumentReference, 
  generateStudentQRCodePayload, 
  parseIUE, 
  validateIUE 
} from '../utils/iueGenerator';

/**
 * Generates an automatic unique student ID / IUE based on institutional standard:
 * [INICIAIS]-[Nº_DOCUMENTO]-[CÓDIGO_ESCOLA]/[PROVÍNCIA]/[DISTRITO]/[ANO]
 */
export function generateStudentId(
  name: string, 
  nuit?: string, 
  idCardNumber?: string,
  extra?: { schoolName?: string; schoolCode?: string; province?: string; district?: string; academicYear?: number | string }
): string {
  // If full parameters are provided, generate standard IUE
  if (extra?.province || extra?.schoolName || extra?.district) {
    return generateIUE({
      name,
      documentNumber: idCardNumber || nuit,
      schoolName: extra.schoolName,
      schoolCode: extra.schoolCode,
      province: extra.province,
      district: extra.district,
      academicYear: extra.academicYear
    });
  }

  const initials = getInitials(name) || 'ALU';
  const identifier = (nuit || idCardNumber || '').trim().replace(/\D/g, '');
  return identifier ? `${initials}-${identifier}` : `${initials}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
}

export const ACADEMIC_LEVELS = [
  'Doutoramento',
  'Mestrado',
  'Licenciatura',
  'Bacharelato',
  'Médio',
  'Básico',
  'Elementar'
] as const;

export const COMMON_TRAINING_AREAS = [
  // Áreas Docentes
  'Ensino de Língua Portuguesa',
  'Ensino de Matemática',
  'Ensino de Física',
  'Ensino de Química',
  'Ensino de Biologia',
  'Ensino de História',
  'Ensino de Geografia',
  'Ensino de Língua Inglesa',
  'Ensino de Língua Francesa',
  'Filosofia',
  'Educação Visual / Desenho',
  'Educação Física e Desporto',
  'TIC / Informática Educativa',
  'Pedagogia e Gestão Escolar',
  'Ciências da Educação',
  'Agro-Pecuária',
  'Construção Civil',
  'Mecânica e Eletricidade',
  // Áreas Administrativas (CTA)
  'Administração Pública e Gestão',
  'Contabilidade e Gestão Financeira',
  'Secretariado Executivo',
  'Recursos Humanos',
  'Arquivística e Gestão Documental',
  'Biblioteconomia e Documentação',
  'Psicologia Educacional',
  'Informática / Suporte Técnico',
  'Apoio Geral e Operacional'
];

export const INITIAL_PROVINCES = [
  { id: 'p1', name: 'Maputo Cidade' },
  { id: 'p2', name: 'Maputo Província' },
  { id: 'p3', name: 'Gaza' },
  { id: 'p4', name: 'Inhambane' },
  { id: 'p5', name: 'Sofala' },
  { id: 'p6', name: 'Manica' },
  { id: 'p7', name: 'Tete' },
  { id: 'p8', name: 'Zambézia' },
  { id: 'p9', name: 'Nampula' },
  { id: 'p10', name: 'Cabo Delgado' },
  { id: 'p11', name: 'Niassa' },
];

export const INITIAL_DISTRICTS = (() => {
  const list: { id: string; name: string; provinceId: string }[] = [
    { id: 'd1', name: 'KaMpfumo', provinceId: 'p1' },
    { id: 'd2', name: 'Matola', provinceId: 'p2' },
    { id: 'd3', name: 'Chókwè', provinceId: 'p3' },
  ];

  let counter = 4;
  INITIAL_PROVINCES.forEach(prov => {
    const dList = getDistrictsForProvince(prov.name);
    dList.forEach(dName => {
      const cleanName = dName.replace(/ \((Cidade|Vila)\)/g, '').trim();
      const exists = list.some(
        item => item.provinceId === prov.id && 
          (item.name.toLowerCase() === dName.toLowerCase() || item.name.toLowerCase() === cleanName.toLowerCase())
      );
      if (!exists) {
        list.push({
          id: `d${counter++}`,
          name: cleanName,
          provinceId: prov.id
        });
      }
    });
  });

  return list;
})();
