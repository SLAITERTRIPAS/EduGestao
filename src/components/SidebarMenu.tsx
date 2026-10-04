import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  MessageSquare, 
  FileText, 
  BarChart2, 
  FileSignature,
  GraduationCap,
  AlertCircle,
  ArrowRightLeft,
  Settings,
  HelpCircle,
  User,
  BookOpen,
  FileSpreadsheet,
  Users,
  Clock,
  UserCheck,
  UserPlus,
  Receipt,
  RefreshCw,
  DollarSign,
  CreditCard,
  TrendingDown,
  Building2,
  MapPin,
  School,
  Activity,
  Server,
  ShieldCheck,
  Mail,
  Key,
  Database,
  Award,
  BookOpenCheck,
  Layers
} from 'lucide-react';
import { useStore } from '../store';
import { UserProfileModal } from './UserProfileModal';
import { SystemDescriptiveMemoryModal } from './SystemDescriptiveMemoryModal';
import { MOZAMBIQUE_EMBLEM_URL } from '../types';

export interface MenuItemDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  color?: string;
  isCompetency?: boolean;
}

interface SidebarMenuProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  additionalContent?: React.ReactNode;
  customItems?: MenuItemDef[];
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({ activeTab, setActiveTab, additionalContent, customItems }) => {
  const { currentUser } = useStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const role = currentUser?.role || 'student';

  // 1. Administrador Geral (NUNCA tem acesso à assinatura digital)
  const adminItems: MenuItemDef[] = [
    { id: 'systemHealth', label: 'Saúde do Sistema & Logs', icon: <Activity size={18} /> },
    { id: 'smtp', label: 'Servidor SMTP', icon: <Server size={18} /> },
    { id: 'schools', label: 'Gestão de Escolas', icon: <Building2 size={18} /> },
    { id: 'managers', label: 'Gestão de Gestores', icon: <ShieldCheck size={18} /> },
    { id: 'emailLogs', label: 'Notificações Disparadas', icon: <Mail size={18} /> },
    { id: 'messages', label: 'Mensagens Oficiais', icon: <MessageSquare size={18} /> },
    { id: 'users', label: 'Gestão de Utilizadores', icon: <User size={18} /> },
    { id: 'credentials', label: 'Minhas Credenciais', icon: <Key size={18} /> },
    { id: 'statistics', label: 'Estatísticas Nacionais', icon: <BarChart2 size={18} /> },
    { id: 'backup', label: 'Backup Firestore', icon: <Database size={18} /> },
  ];

  // 2. Direção da Escola
  const directorItems: MenuItemDef[] = [
    { id: 'overview', label: 'Visão Geral & Estatísticas', icon: <LayoutDashboard size={18} /> },
    { id: 'school_type', label: 'Tipo de Escola & Ciclos', icon: <Layers size={18} /> },
    { id: 'academic', label: 'Gestão Académica & Pautas', icon: <FileSpreadsheet size={18} /> },
    { id: 'livro_turma', label: 'Livro de Turma & Assiduidade', icon: <BookOpenCheck size={18} /> },
    { id: 'transitions', label: 'Vagas & Transições', icon: <ArrowRightLeft size={18} /> },
    { id: 'school_statistics', label: 'Estatísticas da Escola', icon: <BarChart2 size={18} /> },
    { id: 'calendar', label: 'Calendário Escolar', icon: <Calendar size={18} /> },
    { id: 'reports', label: 'Relatórios Oficiais & Atas', icon: <FileText size={18} /> },
    { id: 'signature', label: 'Módulo Oficial de Assinatura', icon: <FileSignature size={18} /> },
    { id: 'messages', label: 'Mensagens Oficiais', icon: <MessageSquare size={18} /> },
    { id: 'permissions', label: 'Permissões & Acesso', icon: <ShieldCheck size={18} /> },
    { id: 'logo', label: 'Logótipo da Escola', icon: <Building2 size={18} /> },
    { id: 'emails', label: 'Notificações por E-mail', icon: <Mail size={18} /> },
    { id: 'backup', label: 'Backup Firestore', icon: <Database size={18} /> },
  ];

  // 3. Direção Adjunta Pedagógica (Todos os Ciclos)
  const pedagogicalItems: MenuItemDef[] = [
    { id: 'overview', label: 'Visão Geral Pedagógica', icon: <LayoutDashboard size={18} /> },
    { id: 'gestao_aulas', label: 'Gestão de Planos de Aula', icon: <Layers size={18} /> },
    { id: 'livro_turma', label: 'Livro de Turma & Assiduidade', icon: <BookOpenCheck size={18} /> },
    { id: 'pautas', label: 'Pautas de Frequência', icon: <FileSpreadsheet size={18} /> },
    { id: 'exames', label: 'Pauta de Exame', icon: <Award size={18} /> },
    { id: 'corpo_discente', label: 'Corpo Discente & Turmas', icon: <Users size={18} /> },
    { id: 'disciplinas', label: 'Disciplinas & Matriz', icon: <BookOpen size={18} /> },
    { id: 'horarios', label: 'Horários Letivos', icon: <Clock size={18} /> },
    { id: 'docentes', label: 'Docentes & Distribuição', icon: <UserCheck size={18} /> },
    { id: 'reports', label: 'Relatórios Trimestrais', icon: <FileText size={18} /> },
    { id: 'calendar', label: 'Calendário de Avaliações', icon: <Calendar size={18} /> },
    { id: 'chat', label: 'Mensagens Pedagógicas', icon: <MessageSquare size={18} /> },
  ];

  // 4. Chefes das Secretarias
  const secretariatItems: MenuItemDef[] = [
    { id: 'overview', label: 'Visão Geral da Secretaria', icon: <LayoutDashboard size={18} /> },
    { id: 'livro_turma', label: 'Livro de Turma & Efetividade', icon: <BookOpenCheck size={18} /> },
    { id: 'enrollment', label: 'Matrículas & Inscrições', icon: <UserPlus size={18} /> },
    { id: 'collection', label: 'Recibos & Cobranças', icon: <Receipt size={18} /> },
    { id: 'employees', label: 'Recursos Humanos & CTA', icon: <Users size={18} /> },
    { id: 'certificates', label: 'Certificados de Habilitação', icon: <Award size={18} /> },
    { id: 'declarations', label: 'Declarações com Notas', icon: <FileText size={18} /> },
    { id: 'pautas_exames', label: 'Pautas de Exame & Turmas', icon: <Award size={18} /> },
    { id: 'auto_renewal', label: 'Renovação Automática', icon: <RefreshCw size={18} /> },
    { id: 'calendar', label: 'Calendário Administrativo', icon: <Calendar size={18} /> },
    { id: 'reports', label: 'Relatórios da Secretaria', icon: <FileSpreadsheet size={18} /> },
    { id: 'signature', label: 'Assinatura de Documentos', icon: <FileSignature size={18} /> },
    { id: 'messages', label: 'Mensagens & Expediente', icon: <MessageSquare size={18} /> },
  ];

  // 5. Gestores Financeiros
  const financialItems: MenuItemDef[] = [
    { id: 'overview', label: 'Visão Geral & Caixa', icon: <DollarSign size={18} /> },
    { id: 'propinas', label: 'Propinas & Mensalidades', icon: <CreditCard size={18} /> },
    { id: 'emolumentos', label: 'Emolumentos & Taxas', icon: <Receipt size={18} /> },
    { id: 'despesas', label: 'Despesas & Fundo Maneio', icon: <TrendingDown size={18} /> },
    { id: 'balancete', label: 'Balancete Oficial MINEDH', icon: <FileText size={18} /> },
  ];

  // 6. Gestores Ministeriais, Provinciais e Distritais
  const governanceItems: MenuItemDef[] = [
    { id: 'overview', label: 'Visão Geral Governação', icon: <LayoutDashboard size={18} /> },
    { id: 'hierarchy_workflow', label: 'Hierarquia Estatística (6 Níveis)', icon: <BarChart2 size={18} /> },
    { id: 'provinces', label: 'Gestão Provincial & Distrital', icon: <MapPin size={18} /> },
    { id: 'national_directory', label: 'Diretório Nacional de Escolas', icon: <School size={18} /> },
    { id: 'hr_allocation', label: 'Alocação de Recursos Humanos', icon: <Users size={18} /> },
    { id: 'schools_report', label: 'Desempenho das Escolas', icon: <Building2 size={18} /> },
    { id: 'scheduler', label: 'Calendário Nacional', icon: <Calendar size={18} /> },
    { id: 'relatorios', label: 'Relatórios Ministeriais', icon: <FileSpreadsheet size={18} /> },
    { id: 'signature', label: 'Assinatura Oficial MINEDH', icon: <FileSignature size={18} /> },
    { id: 'chat', label: 'Mensagens Institucionais', icon: <MessageSquare size={18} /> },
  ];

  // 7. Professores
  const teacherItems: MenuItemDef[] = [
    { id: 'plano_aula', label: 'Plano de Aula', icon: <FileText size={18} /> },
    { id: 'gestao_aulas', label: 'Gestão das Aulas', icon: <Layers size={18} /> },
    { id: 'livro_turma', label: 'Livro de Turma Digital', icon: <BookOpenCheck size={18} /> },
    { id: 'caderneta', label: 'Caderneta de Notas', icon: <BookOpen size={18} /> },
    { id: 'overview', label: 'Minhas Turmas & Aulas', icon: <LayoutDashboard size={18} /> },
    { id: 'calendar', label: 'Calendário de Testes e Provas', icon: <Calendar size={18} /> },
    { id: 'reports', label: 'Relatório do Docente', icon: <FileText size={18} /> },
    { id: 'statistics', label: 'Estatísticas da Turma', icon: <BarChart2 size={18} /> },
    { id: 'chat', label: 'Mensagens & Comunicação', icon: <MessageSquare size={18} /> },
  ];

  // 8. Alunos
  const studentItems: MenuItemDef[] = [
    { id: 'grades', label: 'Consultar o Meu Resultado', icon: <GraduationCap size={18} /> },
    { id: 'tasks', label: 'Atividades da Turma', icon: <FileText size={18} /> },
    { id: 'messages', label: 'Mensagens', icon: <MessageSquare size={18} /> },
    { id: 'complaint', label: 'Reclamação de Notas', icon: <AlertCircle size={18} /> },
    { id: 'transfer', label: 'Pedido de Transferência', icon: <ArrowRightLeft size={18} /> },
  ];

  // 9. Encarregados de Educação
  const guardianItems: MenuItemDef[] = [
    { id: 'grades', label: 'Aproveitamento dos Educandos', icon: <GraduationCap size={18} /> },
    { id: 'tasks', label: 'Tarefas Escolares', icon: <FileText size={18} /> },
    { id: 'calendar', label: 'Calendário Escolar', icon: <Calendar size={18} /> },
    { id: 'messages', label: 'Contacto com a Escola', icon: <MessageSquare size={18} /> },
    { id: 'complaint', label: 'Reclamações', icon: <AlertCircle size={18} /> },
    { id: 'transfer', label: 'Transferência Escolar', icon: <ArrowRightLeft size={18} /> },
  ];

  const getProfileTitle = () => {
    switch (role) {
      case 'admin':
        return 'Administrador Geral';
      case 'director':
        return 'Direcção da Escola';
      case 'pedagogical':
        return 'Direcção Adjunta Pedagógica';
      case 'pedagogical_c1':
        return 'DAP • 1.º Ciclo';
      case 'pedagogical_c2':
        return 'DAP • 2.º Ciclo (ESG1)';
      case 'pedagogical_c3':
        return 'DAP • 2.º Ciclo (ESG2)';
      case 'teacher':
        return 'Portal do Docente';
      case 'secretariat':
      case 'secretariat_rh':
      case 'secretariat_patrimonio':
      case 'secretariat_recepcao':
      case 'secretariat_arquivo':
      case 'librarian':
        return 'Secretaria Escolar';
      case 'financial':
      case 'secretariat_financas':
        return 'Gestão Financeira & Caixa';
      case 'national':
        return 'Ministério da Educação (MINEDH)';
      case 'provincial':
        return 'Direcção Provincial (DPE)';
      case 'district':
        return 'Serviço Distrital (SDEJT)';
      case 'student':
        return 'Portal do Aluno';
      case 'guardian':
        return 'Encarregado de Educação';
      default:
        return 'Espaço de Trabalho';
    }
  };

  const getDefaultItemsForRole = (): MenuItemDef[] => {
    switch (role) {
      case 'admin':
        return adminItems;
      case 'director':
        return directorItems;
      case 'pedagogical':
      case 'pedagogical_c1':
      case 'pedagogical_c2':
      case 'pedagogical_c3':
        return pedagogicalItems;
      case 'teacher':
        return teacherItems;
      case 'secretariat':
      case 'secretariat_rh':
      case 'secretariat_patrimonio':
      case 'secretariat_recepcao':
      case 'secretariat_arquivo':
      case 'librarian':
        return secretariatItems;
      case 'financial':
      case 'secretariat_financas':
        return financialItems;
      case 'national':
      case 'provincial':
      case 'district':
        return governanceItems;
      case 'student':
        return studentItems;
      case 'guardian':
        return guardianItems;
      default:
        return studentItems;
    }
  };

  const menuItems = customItems || getDefaultItemsForRole();

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 no-print select-none">
      <div className="p-5 border-b border-slate-100 bg-slate-50/70">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Menu do Perfil</h2>
        <p className="text-sm font-extrabold text-slate-900 truncate" title={getProfileTitle()}>
          {getProfileTitle()}
        </p>
        <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-1">
          {currentUser?.name || 'Utilizador'}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === item.id 
                ? 'bg-blue-900 text-white shadow-md shadow-blue-950/20' 
                : item.isCompetency 
                  ? 'bg-indigo-50/70 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`shrink-0 ${activeTab === item.id ? 'text-white' : item.isCompetency ? 'text-indigo-600' : 'text-slate-500'}`}>
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge && (
              <span className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-mono font-bold shrink-0 ml-1 ${
                activeTab === item.id 
                  ? 'bg-white/20 text-white' 
                  : 'bg-indigo-100 text-indigo-800'
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}

        {additionalContent && (
          <>
            <div className="my-4 border-t border-slate-100 mx-2"></div>
            <div className="px-3 mb-1.5">
              <h3 className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest">Ações & Atalhos</h3>
            </div>
            {additionalContent}
          </>
        )}

        <div className="my-4 border-t border-slate-100 mx-2"></div>

        {/* Secondary Items */}
        <button
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-blue-700 transition-all cursor-pointer"
          onClick={() => setIsProfileModalOpen(true)}
        >
          <Settings size={16} className="text-slate-400" />
          <span>Perfil & Definições</span>
        </button>
        <button
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-amber-600 transition-all cursor-pointer"
          onClick={() => setIsMemoryModalOpen(true)}
        >
          <BookOpen size={16} className="text-amber-500" />
          <span>Memória Descritiva</span>
        </button>
        <button
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-all cursor-pointer"
          onClick={() => setIsHelpModalOpen(true)}
        >
          <HelpCircle size={16} className="text-slate-400" />
          <span>Centro de Ajuda</span>
        </button>
      </nav>

      {isProfileModalOpen && <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />}
      <SystemDescriptiveMemoryModal isOpen={isMemoryModalOpen} onClose={() => setIsMemoryModalOpen(false)} />

      {/* Modal Centro de Ajuda */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Centro de Suporte EduGestão</h3>
                <p className="text-xs text-slate-500">República de Moçambique • MINEDH / DNTIC</p>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
              <p>Linha de Apoio Escolar e Tecnológico disponível para utilizadores autorizados.</p>
              <p><strong>E-mail:</strong> suporte.sige@minedh.gov.mz</p>
              <p><strong>Contacto:</strong> +258 21 480 700 / Linha Verde: 800 123 456</p>
              <p><strong>Horário:</strong> Segunda a Sexta, 07:30 - 15:30</p>
            </div>
            <button
              onClick={() => setIsHelpModalOpen(false)}
              className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Institutional Footer */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center shrink-0">
             <img src={MOZAMBIQUE_EMBLEM_URL} alt="Emblema Nacional de Moçambique" className="h-9 w-9 object-contain" />
          </div>
          <div className="text-[10px] leading-tight font-bold text-slate-700 uppercase tracking-wider">
            República de <br/> Moçambique
          </div>
        </div>
      </div>
    </div>
  );
};
