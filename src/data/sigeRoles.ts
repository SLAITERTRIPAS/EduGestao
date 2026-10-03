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
    label: 'EP1',
    desc: 'Ensino Primário do 1º Grau (1.ª à 5.ª Classe)',
    classes: ['1.ª Classe', '2.ª Classe', '3.ª Classe', '4.ª Classe', '5.ª Classe'],
    subjects: ['Português', 'Matemática', 'Ciências Naturais', 'Ciências Sociais', 'Educação Visual e Ofícios', 'Educação Física']
  },
  {
    id: 'EP2',
    label: 'EP2',
    desc: 'Ensino Primário do 2º Grau (6.ª e 7.ª Classe)',
    classes: ['6.ª Classe', '7.ª Classe'],
    subjects: ['Português', 'Matemática', 'Ciências Naturais', 'História', 'Geografia', 'Educação Visual', 'Educação Física', 'Inglês']
  },
  {
    id: 'ENSINO BÁSICO',
    label: 'ENSINO BÁSICO',
    desc: 'Ensino Primário e Básico Unificado (1.ª à 9.ª Classe)',
    classes: ['1.ª Classe', '2.ª Classe', '3.ª Classe', '4.ª Classe', '5.ª Classe', '6.ª Classe', '7.ª Classe', '8.ª Classe', '9.ª Classe'],
    subjects: ['Português', 'Matemática', 'Ciências Naturais', 'História', 'Geografia', 'Física', 'Química', 'Biologia', 'Inglês', 'Educação Física', 'Agro-Pecuária']
  },
  {
    id: 'ENSINO SECUNDÁRIO DO 1 CICLO',
    label: 'ENSINO SECUNDÁRIO DO 1º CICLO',
    desc: 'Ensino Secundário Geral do 1º Ciclo (7.ª à 10.ª Classe)',
    classes: ['7.ª Classe', '8.ª Classe', '9.ª Classe', '10.ª Classe'],
    subjects: ['Português', 'Matemática', 'Física', 'Química', 'Biologia', 'História', 'Geografia', 'Inglês', 'Francês', 'Educação Física', 'Agro-Pecuária', 'TIC / Informática']
  },
  {
    id: 'ENSINO SECUNDÁRIO DO 2 CICLO',
    label: 'ENSINO SECUNDÁRIO DO 2º CICLO',
    desc: 'Ensino Secundário Pré-Universitário (11.ª e 12.ª Classe)',
    classes: ['11.ª Classe', '12.ª Classe'],
    subjects: ['Português', 'Matemática', 'Física', 'Química', 'Biologia', 'História', 'Geografia', 'Filosofia', 'Inglês', 'Francês', 'Desenho', 'Introdução à Economia']
  },
  {
    id: 'ENSINO PRÉ-UNIVERSITÁRIO',
    label: 'ENSINO PRÉ-UNIVERSITÁRIO',
    desc: 'Cursos Preparatórios Pré-Universitários (11.ª e 12.ª Classe)',
    classes: ['11.ª Classe', '12.ª Classe'],
    subjects: ['Português', 'Matemática', 'Física', 'Química', 'Biologia', 'História', 'Geografia', 'Filosofia', 'Inglês', 'Desenho Técnico']
  },
  {
    id: 'ENSINO TÉCNICO PROFISSIONAL',
    label: 'ENSINO TÉCNICO PROFISSIONAL',
    desc: 'Formação Técnica e Vocacional Básica e Elementar',
    classes: ['Nível 3 Técnico', 'Nível 4 Técnico', 'Nível 5 Técnico'],
    subjects: ['Português Aplicado', 'Matemática Aplicada', 'Desenho Técnico', 'TIC / Informática', 'Higiene e Segurança no Trabalho', 'Gestão e Empreendedorismo', 'Módulos Vocacionais Práticos']
  },
  {
    id: 'ENSINO MÉDIO PROFISSIONAL',
    label: 'ENSINO MÉDIO PROFISSIONAL',
    desc: 'Institutos Médios Politécnicos e Profissionais',
    classes: ['1º Ano Médio', '2º Ano Médio', '3º Ano Médio'],
    subjects: ['Português Técnico', 'Matemática Financeira', 'Contabilidade Geral', 'Informática de Gestão', 'Legislação Escolar e Trabalhista', 'Projetos Tecnológicos', 'Estágio Curricular']
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
