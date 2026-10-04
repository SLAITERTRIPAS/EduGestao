import { ProfileManifest } from '../admin/profileManifest';

export const STUDENT_PROFILE_MANIFEST: ProfileManifest = {
  profileId: 'student',
  name: 'Corpo Discente / Alunos',
  category: 'Acesso do Estudante',
  description: 'Consulta do boletim de notas, tarefas de casa, cartão do estudante com QR Code e requerimento de serviços escolares.',
  canSignOfficialDocuments: false,
  features: [
    {
      id: 'grades',
      name: 'Boletim de Notas & Médias',
      path: '/student/grades',
      icon: 'Award',
      description: 'Consulta em tempo real de notas trimestrais e médias finais de cada disciplina.'
    },
    {
      id: 'homework',
      name: 'Trabalhos de Casa (TPC)',
      path: '/student/homework',
      icon: 'BookOpen',
      description: 'Download de orientações e submissão digital de trabalhos escolares.'
    },
    {
      id: 'qrcode',
      name: 'Cartão de Estudante & QR Code',
      path: '/student/card',
      icon: 'QrCode',
      description: 'Identificação digital do aluno com código de validação rápida e autenticidade.'
    },
    {
      id: 'complaints',
      name: 'Reclamação de Notas',
      path: '/student/complaints',
      icon: 'AlertCircle',
      description: 'Submissão formal de pedidos de revisão de avaliação ao professor da disciplina.'
    },
    {
      id: 'transferRequest',
      name: 'Pedido de Transferência',
      path: '/student/transfer',
      icon: 'Send',
      description: 'Requerimento digital para mudança de turma ou estabelecimento de ensino.'
    }
  ]
};
