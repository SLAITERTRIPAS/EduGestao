import { Link, useLocation } from 'react-router-dom';
import { LogOut, Bell, RotateCw, Database, Minimize2, Maximize2, Eye, Activity, Server, Building2, ShieldCheck, Mail, MessageSquare, Fingerprint, User, Key, BarChart3, Settings } from 'lucide-react';
import { useStore } from '../store';
import { MOZAMBIQUE_EMBLEM_URL } from '../types';

interface SidebarProps {
  highContrast: boolean;
  toggleHighContrast: () => void;
  handleRefresh: () => void;
  toggleFullscreen: () => void;
  isFullscreen: boolean;
  logout: () => void;
  onOpenNotifications?: () => void;
  isSuperAdmin?: boolean;
}

export function Sidebar({ highContrast, toggleHighContrast, handleRefresh, toggleFullscreen, isFullscreen, logout, onOpenNotifications, isSuperAdmin }: SidebarProps) {
  const location = useLocation();
  const menuItems = [
    { id: 'systemHealth', label: 'Saúde do Sistema & Logs', path: '/admin/systemHealth', icon: Activity },
    { id: 'smtp', label: 'Servidor SMTP', path: '/admin/smtp', icon: Server },
    { id: 'schools', label: 'Gestão de Escolas', path: '/admin/schools', icon: Building2 },
    { id: 'managers', label: 'Gestão de Gestores', path: '/admin/managers', icon: ShieldCheck },
    { id: 'emailLogs', label: 'Notificações Disparadas', path: '/admin/emailLogs', icon: Mail },
    { id: 'messages', label: 'Mensagens', path: '/admin/messages', icon: MessageSquare },
    { id: 'users', label: 'Gestão de Utilizadores', path: '/admin/users', icon: User },
    { id: 'credentials', label: 'Minhas Credenciais', path: '/admin/credentials', icon: Key },
    { id: 'statistics', label: 'Estatísticas', path: '/admin/statistics', icon: BarChart3 },
    { id: 'backup', label: 'Backup Firestore', path: '/admin/backup', icon: Database },
  ];

  return (
    <nav className="w-64 bg-[#070d24] border-r border-[#18234d] flex flex-col py-6 no-print z-50">
      <div className="px-4 mb-6">
        <h1 className="text-white font-bold text-lg">Admin Panel</h1>
      </div>
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto px-2">
        {menuItems.map((item) => {
            if (item.id === 'schools' && !isSuperAdmin) return null;
            const Icon = item.icon;
            return (
                <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        location.pathname === item.path 
                        ? 'bg-blue-900 text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-[#18234d]'
                    }`}
                >
                    <Icon size={18} />
                    {item.label}
                </Link>
            );
        })}
      </div>
      
      <div className="px-4 mt-6 flex flex-col items-center gap-3 border-t border-[#18234d] pt-6">
        <img src={MOZAMBIQUE_EMBLEM_URL} alt="Emblema da República de Moçambique" className="w-16 h-16 opacity-80" />
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
            República de Moçambique
        </span>
      </div>

      <div className="px-4 mt-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-red-500/50 bg-red-950/40 text-red-300 hover:bg-red-600 hover:text-white transition-colors"
          title="Sair"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </nav>
  );
}
