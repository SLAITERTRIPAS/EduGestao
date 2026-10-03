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
  BookOpen
} from 'lucide-react';
import { useStore } from '../store';
import { UserProfileModal } from './UserProfileModal';
import { SystemDescriptiveMemoryModal } from './SystemDescriptiveMemoryModal';

interface MenuItemDef {
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

  const standardItems: MenuItemDef[] = [
    { id: 'overview', label: 'Visão Geral', icon: <LayoutDashboard size={18} /> },
    { id: 'calendar', label: 'Calendário', icon: <Calendar size={18} /> },
    { id: 'messages', label: 'Mensagem', icon: <MessageSquare size={18} /> },
    { id: 'reports', label: 'Relatório', icon: <FileText size={18} /> },
    { id: 'statistics', label: 'Estatística', icon: <BarChart2 size={18} /> },
    { id: 'signature', label: 'Assinatura', icon: <FileSignature size={18} /> },
  ];

  const studentItems: MenuItemDef[] = [
    { id: 'grades', label: 'Consultar o Meu Resultado', icon: <GraduationCap size={18} /> },
    { id: 'tasks', label: 'Atividades da Turma', icon: <FileText size={18} /> },
    { id: 'messages', label: 'Mensagens', icon: <MessageSquare size={18} /> },
    { id: 'complaint', label: 'Reclamação', icon: <AlertCircle size={18} /> },
    { id: 'transfer', label: 'Pedido de Transferência', icon: <ArrowRightLeft size={18} /> },
  ];

  const isStudent = currentUser?.role === 'student';
  const menuItems = customItems || (isStudent ? studentItems : standardItems);

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 no-print">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Menu Principal</h2>
        <p className="text-sm font-bold text-slate-800">
          {isStudent ? 'Portal do Aluno' : 'Espaço de Trabalho'}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : item.isCompetency 
                  ? 'bg-indigo-50/70 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`shrink-0 ${activeTab === item.id ? 'text-white' : item.isCompetency ? 'text-indigo-600' : 'text-slate-400'}`}>
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
            <div className="my-6 border-t border-slate-100 mx-4"></div>
            <div className="px-4 mb-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Funcionalidades</h3>
            </div>
            {additionalContent}
          </>
        )}

        {/* Separator if needed */}
        <div className="my-6 border-t border-slate-100 mx-4"></div>

        {/* Secondary Items */}
        <button
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-blue-600 transition-all cursor-pointer"
          onClick={() => setIsProfileModalOpen(true)}
        >
          <Settings size={18} className="text-slate-400" />
          Perfil & Definições
        </button>
        <button
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-amber-600 transition-all cursor-pointer"
          onClick={() => setIsMemoryModalOpen(true)}
        >
          <BookOpen size={18} className="text-amber-500" />
          Memória Descritiva
        </button>
        <button
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          onClick={() => alert('Centro de Ajuda EduGestão • Suporte Técnico MINEDH')}
        >
          <HelpCircle size={18} className="text-slate-400" />
          Suporte
        </button>
      </nav>

      {isProfileModalOpen && <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />}
      <SystemDescriptiveMemoryModal isOpen={isMemoryModalOpen} onClose={() => setIsMemoryModalOpen(false)} />

      {/* Institutional Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 flex items-center justify-center shrink-0">
             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Emblem_of_Mozambique.svg/600px-Emblem_of_Mozambique.svg.png" alt="Emblema Nacional de Moçambique" className="h-11 w-11 object-contain" />
          </div>
          <div className="text-[11px] leading-tight font-bold text-slate-600 uppercase tracking-wider">
            República de <br/> Moçambique
          </div>
        </div>
      </div>
    </div>
  );
};
