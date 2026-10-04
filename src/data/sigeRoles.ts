import { SchoolLevelType } from '../types';

export interface SigeCategory {
  category: string;
  roles: string[];
}

export const SIGE_CARGOS_ESTRUTURA: SigeCategory[] = [
  {
    category: 'Gestão',
    roles: [
      'Director da Escola',
      'Director Pedagógico',
      'Director Administrativo'
    ]
  },
  {
    category: 'Secretaria',
    roles: [
      'Chefe da Secretaria',
      'Técnico Administrativo',
      'Arquivista'
    ]
  },
  {
    category: 'Pedagógico',
    roles: [
      'Coordenador de Ciclo',
      'Chefe de Grupo de Disciplina',
      'Professor'
    ]
  },
  {
    category: 'Apoio',
    roles: [
      'Bibliotecário',
      'Técnico de Informática',
      'Laboratorista',
      'Guarda',
      'Servente'
    ]
  },
  {
    category: 'Órgãos Participativos',
    roles: [
      'Conselho da Escola',
      'Associação de Pais e Encarregados de Educação'
    ]
  }
];

export interface SchoolLevelDefinition {
  id: SchoolLevelType;
  label: string;
  desc: string;
  classes: string[];
  subjects: string[];
}

export const ALL_SCHOOL_LEVELS_MAPPING: SchoolLevelDefinition[] = [
  {
    id: 'EP1',
    label: 'Escola Primária (1.º Ciclo: 1.ª–3.ª)',
    desc: 'Ensino Primário • 1.º Ciclo (1.ª, 2.ª e 3.ª classes)',
    classes: ['1.ª Classe', '2.ª Classe', '3.ª Classe'],
    subjects: ['Português', 'Matemática', 'Ciências Naturais', 'Ciências Sociais', 'Educação Visual e Ofícios', 'Educação Física']
  },
  {
    id: 'EP2',
    label: 'Escola Primária (2.º Ciclo: 4.ª–6.ª)',
    desc: 'Ensino Primário • 2.º Ciclo (4.ª, 5.ª e 6.ª classes)',
    classes: ['4.ª Classe', '5.ª Classe', '6.ª Classe'],
    subjects: ['Português', 'Matemática', 'Ciências Naturais', 'História', 'Geografia', 'Educação Visual', 'Educação Física', 'Inglês']
  },
  {
    id: 'ENSINO BÁSICO',
    label: 'Escola Básica (1.ª à 9.ª Classe)',
    desc: 'Ensino Básico Unificado (Primario 1.ª–6.ª + 1.º Ciclo Secundário 7.ª–9.ª)',
    classes: ['1.ª Classe', '2.ª Classe', '3.ª Classe', '4.ª Classe', '5.ª Classe', '6.ª Classe', '7.ª Classe', '8.ª Classe', '9.ª Classe'],
    subjects: ['Português', 'Matemática', 'Ciências Naturais', 'História', 'Geografia', 'Física', 'Química', 'Biologia', 'Inglês', 'Educação Física', 'Agro-Pecuária']
  },
  {
    id: 'ENSINO SECUNDÁRIO DO 1 CICLO',
    label: 'Ensino Secundário (1.º Ciclo: 7.ª–9.ª)',
    desc: 'Ensino Secundário • 1.º Ciclo (7.ª, 8.ª e 9.ª classes)',
    classes: ['7.ª Classe', '8.ª Classe', '9.ª Classe'],
    subjects: ['Português', 'Matemática', 'Física', 'Química', 'Biologia', 'História', 'Geografia', 'Inglês', 'Francês', 'Educação Física', 'Agro-Pecuária', 'TIC / Informática']
  },
  {
    id: 'ENSINO SECUNDÁRIO DO 2 CICLO',
    label: 'Ensino Secundário (2.º Ciclo: 10.ª–12.ª)',
    desc: 'Ensino Secundário • 2.º Ciclo (10.ª, 11.ª e 12.ª classes)',
    classes: ['10.ª Classe', '11.ª Classe', '12.ª Classe'],
    subjects: ['Português', 'Matemática', 'Física', 'Química', 'Biologia', 'História', 'Geografia', 'Filosofia', 'Inglês', 'Francês', 'Desenho', 'Introdução à Economia']
  }
];

export function computeAutoCurriculum(selectedLevelIds: SchoolLevelType[]): { classes: string[]; subjects: string[] } {
  const classesSet = new Set<string>();
  const subjectsSet = new Set<string>();

  selectedLevelIds.forEach(lvlId => {
    const def = ALL_SCHOOL_LEVELS_MAPPING.find(m => m.id === lvlId);
    if (def) {
      def.classes.forEach(c => classesSet.add(c));
      def.subjects.forEach(s => subjectsSet.add(s));
    }
  });

  return {
    classes: Array.from(classesSet),
    subjects: Array.from(subjectsSet)
  };
}

export const SCHOOL_PRESET_LOGOS = [
  'https://images.unsplash.com/photo-1594312915251-48db9280c8f1?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=200',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQua66hW5lOO75LXVLwiJWQJKtgoRJzX58EUSAAc2QdYQ&s=10'
];
