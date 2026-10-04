import { ProfileManifest } from '../admin/profileManifest';

export const GUARDIAN_PROFILE_MANIFEST: ProfileManifest = {
  profileId: 'guardian',
  name: 'Encarregados de Educação',
  category: 'Acompanhamento Parental',
  description: 'Acompanhamento do desempenho escolar, assiduidade, pagamento de propinas e comunicação direta com a escola.',
  canSignOfficialDocuments: false,
  features: [
    {
      id: 'performance',
      name: 'Aproveitamento dos Educandos',
      path: '/guardian/performance',
      icon: 'TrendingUp',
      description: 'Painel comparativo de evolução pedagógica dos filhos matriculados.'
    },
    {
      id: 'attendance',
      name: 'Assiduidade & Justificação de Faltas',
      path: '/guardian/attendance',
      icon: 'CheckSquare',
      description: 'Consulta do mapa de faltas e envio de justificativos médicos ou familiares.'
    },
    {
      id: 'payments',
      name: 'Situação Financeira & Propinas',
      path: '/guardian/payments',
      icon: 'CreditCard',
      description: 'Histórico de mensalidades pagas e emissão de referências para novos pagamentos.'
    },
    {
      id: 'communication',
      name: 'Contacto com a Direcção de Turma',
      path: '/guardian/contact',
      icon: 'MessageSquare',
      description: 'Envio de mensagens diretas e marcação de reuniões com o Diretor de Turma.'
    }
  ]
};
