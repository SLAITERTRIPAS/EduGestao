import { ProfileManifest } from '../admin/profileManifest';

export const SECRETARIAT_PROFILE_MANIFEST: ProfileManifest = {
  profileId: 'secretariat',
  name: 'Secretaria Escolar & Técnicos Administrativos',
  category: 'Administração Escolar & Gestão Documental',
  description: 'Gestão de matrículas, cadastro do corpo discente e colaboradores (CTA), emissão de certificados, declarações e guias.',
  canSignOfficialDocuments: true,
  features: [
    {
      id: 'students',
      name: 'Gestão do Corpo Discente',
      path: '/secretariat/students',
      icon: 'GraduationCap',
      description: 'Registo biográfico completo, encarregados de educação e histórico escolar dos alunos.'
    },
    {
      id: 'enrollment',
      name: 'Matrículas & Inscrições',
      path: '/secretariat/enrollment',
      icon: 'UserPlus',
      description: 'Inscrição de novos alunos com emissão imediata de Recibo Oficial de Matrícula.'
    },
    {
      id: 'employees',
      name: 'Gestão de Colaboradores & CTA',
      path: '/secretariat/employees',
      icon: 'Briefcase',
      description: 'Cadastro de professores, secretários e pessoal de apoio com processos individuais.'
    },
    {
      id: 'officialDocuments',
      name: 'Emissão de Documentos Oficiais',
      path: '/secretariat/documents',
      icon: 'FileText',
      description: 'Certificados de habilitações, declarações com/sem notas, atestados médicos e processos individuais.'
    },
    {
      id: 'transfers',
      name: 'Guias de Transferência',
      path: '/secretariat/transfers',
      icon: 'ArrowRightLeft',
      description: 'Emissão e validação de guias oficiais de transferência entre escolas.'
    },
    {
      id: 'collections',
      name: 'Emolumentos & Cobranças',
      path: '/secretariat/collections',
      icon: 'Receipt',
      description: 'Cobrança de taxas administrativas de secretaria com recibo digital.'
    },
    {
      id: 'notices',
      name: 'Difusor de Avisos & Circulares',
      path: '/secretariat/notices',
      icon: 'Megaphone',
      description: 'Publicação de comunicados e alertas para toda a comunidade escolar.'
    }
  ]
};
