import { ProfileManifest } from '../admin/profileManifest';

export const DIRECTOR_PROFILE_MANIFEST: ProfileManifest = {
  profileId: 'director',
  name: 'Direcção da Escola',
  category: 'Gestão Executiva Escolar',
  description: 'Gestão estratégica, liderança pedagógica e administrativa, relatórios consolidados e assinatura digital executiva.',
  canSignOfficialDocuments: true,
  features: [
    {
      id: 'overview',
      name: 'Painel Executivo',
      path: '/director',
      icon: 'LayoutDashboard',
      description: 'Métricas gerais de matrículas, aproveitamento letivo e assiduidade global.'
    },
    {
      id: 'statistics',
      name: 'Estatísticas Detalhadas',
      path: '/director/statistics',
      icon: 'BarChart3',
      description: 'Distribuição demográfica por género, idade e desempenho por classe.'
    },
    {
      id: 'officialReports',
      name: 'Relatórios Oficiais da Direcção',
      path: '/director/reports',
      icon: 'FileText',
      description: 'Termos de abertura, termos de encerramento e actas institucionais.'
    },
    {
      id: 'signature',
      name: 'Assinatura Digital da Direcção',
      path: '/director/signature',
      icon: 'FileSignature',
      description: 'Módulo de aposição de assinatura e carimbo digital institucional com validação QR Code.'
    },
    {
      id: 'renewals',
      name: 'Renovações & Vagas',
      path: '/director/renewals',
      icon: 'RefreshCw',
      description: 'Aprovação do processo automático de renovação de matrículas escolares.'
    },
    {
      id: 'logoManager',
      name: 'Identidade Visual & Emblema',
      path: '/director/identity',
      icon: 'Image',
      description: 'Definição do logótipo escolar e emblema oficial nos cabeçalhos de documentos.'
    },
    {
      id: 'granularAccess',
      name: 'Controlo de Acesso Interno',
      path: '/director/access',
      icon: 'Shield',
      description: 'Gestão de permissões de acesso específicas para os colaboradores da escola.'
    }
  ]
};
