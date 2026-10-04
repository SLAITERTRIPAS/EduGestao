import { ProfileManifest } from '../admin/profileManifest';

export const GOVERNANCE_PROFILE_MANIFEST: ProfileManifest = {
  profileId: 'governance',
  name: 'Governação da Educação (MINEDH / DPE / SDEJT)',
  category: 'Gestão Central & Distrital da Educação',
  description: 'Supervisão pedagógica e administrativa em 6 níveis hierárquicos, censo escolar e diretório nacional de escolas.',
  canSignOfficialDocuments: true,
  features: [
    {
      id: 'hierarchyStats',
      name: 'Fluxo Estatístico Hierárquico (6 Níveis)',
      path: '/governance/hierarchy',
      icon: 'Network',
      description: 'Navegação estatística piramidal: Nacional ➔ Provincial ➔ Distrital ➔ Zonal ➔ Escolar ➔ Turma.'
    },
    {
      id: 'schoolsDirectory',
      name: 'Diretório Nacional de Escolas',
      path: '/governance/schools',
      icon: 'Building',
      description: 'Mapa e base cadastral de todas as instituições de ensino com código IUE.'
    },
    {
      id: 'territorial',
      name: 'Gestão Territorial de Províncias & Distritos',
      path: '/governance/territorial',
      icon: 'MapPin',
      description: 'Parametrização das 11 províncias e distritos oficiais de Moçambique.'
    },
    {
      id: 'hrAllocation',
      name: 'Alocação de Recursos Humanos',
      path: '/governance/hr',
      icon: 'Users',
      description: 'Distribuição e colocação de professores e técnicos nas instituições de ensino.'
    },
    {
      id: 'census',
      name: 'Módulo de Relatórios Estatísticos Consolidados',
      path: '/governance/census',
      icon: 'BarChart',
      description: 'Indicadores globais de rendimento escolar e taxa de retenção/transição.'
    }
  ]
};
