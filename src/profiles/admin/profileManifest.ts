export interface ProfileManifest {
  profileId: string;
  name: string;
  category: string;
  description: string;
  canSignOfficialDocuments: boolean;
  features: {
    id: string;
    name: string;
    path: string;
    icon: string;
    description: string;
  }[];
}

export const ADMIN_PROFILE_MANIFEST: ProfileManifest = {
  profileId: 'admin',
  name: 'Administrador Geral do Sistema',
  category: 'Tecnologia da Informação & Infraestrutura',
  description: 'Gestão técnica global, monitoramento de saúde do sistema, credenciais, backup Firestore e infraestrutura escolar.',
  canSignOfficialDocuments: false, // RESTRIÇÃO OFICIAL: Sem acesso à assinatura digital de documentos
  features: [
    {
      id: 'systemHealth',
      name: 'Saúde do Sistema & Firestore',
      path: '/admin/systemHealth',
      icon: 'Activity',
      description: 'Monitoramento em tempo real de latência, integridade da base de dados e tráfego de rede.'
    },
    {
      id: 'users',
      name: 'Gestão de Utilizadores',
      path: '/admin/users',
      icon: 'Users',
      description: 'Criação, edição e bloqueio de contas de utilizadores com atribuição de papéis.'
    },
    {
      id: 'credentials',
      name: 'Credenciais do Sistema',
      path: '/admin/credentials',
      icon: 'Key',
      description: 'Visualização e gestão de senhas e acessos administrativos.'
    },
    {
      id: 'smtp',
      name: 'Servidor SMTP / Notificações',
      path: '/admin/smtp',
      icon: 'Mail',
      description: 'Configuração dos parâmetros de envio de emails e alertas do sistema.'
    },
    {
      id: 'schools',
      name: 'Gestão de Escolas',
      path: '/admin/schools',
      icon: 'Building2',
      description: 'Registo e parametrização institucional de todas as escolas cadastradas.'
    },
    {
      id: 'backups',
      name: 'Backups & Restauração Firestore',
      path: '/admin/backups',
      icon: 'Database',
      description: 'Exportação, sincronização e segurança dos dados na nuvem.'
    },
    {
      id: 'audit',
      name: 'Trilha de Auditoria & Logs',
      path: '/admin/audit',
      icon: 'ShieldCheck',
      description: 'Registo imutável de todas as ações de escrita e acesso realizadas no sistema.'
    },
    {
      id: 'permissions',
      name: 'Controlo de Permissões',
      path: '/admin/permissions',
      icon: 'Lock',
      description: 'Gestão granular de privilégios de acesso aos módulos do sistema.'
    }
  ]
};
