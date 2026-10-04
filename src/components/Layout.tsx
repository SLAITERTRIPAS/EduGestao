import { useStore } from '../store';
import { 
  Bell, 
  ArrowLeft,
  Eye
} from 'lucide-react';
import React, { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { UserProfileModal } from './UserProfileModal';
import { NotificationDrawer } from './NotificationDrawer';
import { GlobalHeader } from './GlobalHeader';

export function Layout({ children }: { children: ReactNode }) {
  const { currentUser, logout, highContrast, toggleHighContrast } = useStore();
  const showSidebar = !!currentUser;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [showPrintNotice, setShowPrintNotice] = useState(false);

  useEffect(() => {
    // window.print executes directly without blocking modal
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const getSubheaderTitle = () => {
    switch (currentUser?.role) {
      case 'admin':
        return 'Administração Central & Infraestrutura do Sistema';
      case 'director':
        return 'Direcção da Escola & Gestão Institucional';
      case 'pedagogical':
      case 'pedagogical_c1':
      case 'pedagogical_c2':
      case 'pedagogical_c3':
        return 'Direcção Adjunta Pedagógica & Sistema de Pautas (Todos os Ciclos)';
      case 'teacher':
        return 'Portal do Docente & Avaliação Pedagógica';
      case 'secretariat':
      case 'secretariat_rh':
      case 'secretariat_patrimonio':
      case 'secretariat_recepcao':
      case 'secretariat_arquivo':
      case 'librarian':
        return 'Secretaria Escolar & Gestão Administrativa';
      case 'financial':
      case 'secretariat_financas':
        return 'Gestão Financeira, Tesouraria & Propinas Escolar';
      case 'national':
      case 'provincial':
      case 'district':
        return 'Governação da Educação • MINEDH';
      case 'student':
      case 'guardian':
        return 'Portal do Estudante & Acompanhamento Académico';
      default:
        return 'Sistema Escolar Integrado';
    }
  };

  return (
    <div className={`min-h-screen ${highContrast ? 'high-contrast' : 'bg-slate-100'} flex flex-col font-sans text-slate-900`}>
      <GlobalHeader 
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        onRefresh={handleRefresh}
      />
      
      <div className="flex flex-1">
        {showSidebar && currentUser?.role === 'admin' && (
          <Sidebar 
            highContrast={highContrast} 
            toggleHighContrast={toggleHighContrast}
            handleRefresh={handleRefresh}
            toggleFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
            logout={logout}
            onOpenNotifications={() => setIsNotifDrawerOpen(true)}
            isSuperAdmin={currentUser?.id === 'ST849547771'}
          />
        )}
        
        <div className="flex flex-col flex-1">
          {/* Subheader */}
          <div className="bg-[#05091b] border-t border-[#121a38] px-4 py-2 flex items-center justify-between">
              <button
                onClick={() => window.history.back()}
                className="border border-amber-400 text-amber-300 hover:bg-amber-400 hover:text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Voltar
              </button>
              <div className="text-amber-300 font-bold text-sm">
                Módulo: <span className="text-white">{getSubheaderTitle()}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-900/50">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Sistema Online | Sempre em Dia
              </div>
          </div>
          
          <main className={`flex-1 w-full ${currentUser?.role === 'admin' ? 'p-4' : 'p-0'} overflow-x-hidden`}>
            {children}
          </main>

          {/* Universal Footer Component (Sticky/Push Pattern) */}
          <footer className="bg-[#05091b] border-t border-[#121a38] py-3.5 px-6 text-xs text-white/90 flex flex-col md:flex-row items-center justify-between gap-4 mt-auto no-print">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-bold text-white">EduGestão Moçambique</span>
              <span>·</span>
              <span>© {new Date().getFullYear()} Todos os direitos reservados.</span>
            </div>
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>Ministério da Educação e Desenvolvimento Humano (MINEDH)</span>
              <span>·</span>
              <span>DNTIC</span>
              <span>·</span>
              <span className="font-mono text-amber-300">v4.2-PRO</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-300">
              <span className="flex items-center gap-1 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Servidor Cloud Ativo
              </span>
              <span>·</span>
              <span className="font-mono">SIGE-MZ-SECURE</span>
            </div>
          </footer>
        </div>
      </div>

      {isProfileOpen && <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />}
      <NotificationDrawer isOpen={isNotifDrawerOpen} onClose={() => setIsNotifDrawerOpen(false)} />

    </div>
  );
}
