import { ProfileManifest } from '../admin/profileManifest';

export const PEDAGOGICAL_PROFILE_MANIFEST: ProfileManifest = {
  profileId: 'pedagogical',
  name: 'Direcção Adjunta Pedagógica',
  category: 'Gestão Pedagógica e Académica',
  description: 'Coordenação dos ciclos de ensino (1º Ciclo, 2º Ciclo ESG1 e ESG2), homologação de pautas, matriz curricular e calendário.',
  canSignOfficialDocuments: true,
  features: [
    {
      id: 'pautas',
      name: 'Pautas Oficiais de Aproveitamento',
      path: '/pedagogical/pautas',
      icon: 'BookOpen',
      description: 'Pautas de frequência trimestral, exame geral e pautas finais oficiais do MINEDH.'
    },
    {
      id: 'pautaControl',
      name: 'Painel de Controlo de Pautas',
      path: '/pedagogical/control',
      icon: 'Sliders',
      description: 'Ajuste de pesos de avaliação, trancamento de notas e cálculo de médias estatísticas.'
    },
    {
      id: 'curriculum',
      name: 'Matriz Curricular & Disciplinas',
      path: '/pedagogical/curriculum',
      icon: 'Layers',
      description: 'Gestão da grade curricular conforme o nível de ensino e plano de aulas.'
    },
    {
      id: 'calendar',
      name: 'Calendário Académico & Avaliações',
      path: '/pedagogical/calendar',
      icon: 'Calendar',
      description: 'Cronograma letivo, marcação de avaliações periódicas e conselhos de turma.'
    },
    {
      id: 'printConfig',
      name: 'Configurador de Impressão A3/A4',
      path: '/pedagogical/print',
      icon: 'Printer',
      description: 'Padronização de fontes, colunas e cabeçalhos para impressão de pautas homologadas.'
    },
    {
      id: 'signature',
      name: 'Visto Pedagógico Oficial',
      path: '/pedagogical/signature',
      icon: 'FileSignature',
      description: 'Homologação e aposição de visto digital nos documentos de avaliação.'
    }
  ]
};
