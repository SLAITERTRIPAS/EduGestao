import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { MOZAMBIQUE_EMBLEM_URL } from '../types';
import { 
  LogOut, 
  User, 
  Bell, 
  RotateCw, 
  Database, 
  Minimize2, 
  Maximize2 
} from 'lucide-react';

// Live Mozambican Institutional Digital Clock
const InstitutionalClock = React.memo(function InstitutionalClock() {
  const [currentDateTime, setCurrentDateTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dayName = currentDateTime.toLocaleDateString('pt-PT', { weekday: 'long' });
  const capitalizedDayName = dayName ? (dayName.charAt(0).toUpperCase() + dayName.slice(1)) : '';
  const formattedTime = currentDateTime.toLocaleTimeString('pt-PT', { hour12: false });
  const formattedDate = currentDateTime.toLocaleDateString('pt-PT', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="border border-amber-400/50 bg-[#0c163b] px-6 py-1.5 rounded-xl text-center shadow-lg shadow-black/40 min-w-[210px] bg-transparent">
      <div className="text-amber-400 text-xs font-bold uppercase tracking-wider">{capitalizedDayName}</div>
      <div className="text-amber-300 font-mono text-xl font-black tracking-widest">{formattedTime}</div>
      <div className="text-slate-300 text-[11px] font-medium">{formattedDate}</div>
    </div>
  );
});

interface GlobalHeaderProps {
  onOpenProfile?: () => void;
  onOpenNotifications?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  onOpenProfile,
  onOpenNotifications,
  onToggleFullscreen,
  isFullscreen = false,
  onRefresh,
  className = ""
}) => {
  const { currentUser, logout, activeSchool, schools = [], activeSchoolId } = useStore();
  const currentSchoolName = activeSchool?.name || (schools || []).find(s => s && s.id === currentUser?.schoolId)?.name || 'Escola Secundária Central';
  const currentSchoolLocation = activeSchool ? `${activeSchool.district || activeSchool.province || 'Moçambique'}` : 'Maputo';

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador Geral';
      case 'director': return 'Diretor da Escola';
      case 'pedagogical': return 'Diretor Adjunto Pedagógico';
      case 'pedagogical_c1': return 'DAP (1.º Ciclo)';
      case 'pedagogical_c2': return 'DAP (2.º Ciclo ESG1)';
      case 'pedagogical_c3': return 'DAP (2.º Ciclo ESG2)';
      case 'teacher': return 'Professor';
      case 'secretariat': return 'Chefe da Secretaria';
      case 'financial':
      case 'secretariat_financas': return 'Gestor Financeiro';
      case 'national': return 'Gestor do Ministério (MINEDH)';
      case 'provincial': return 'Gestor Provincial (DPE)';
      case 'district': return 'Gestor Distrital (SDEJT)';
      case 'student': return 'Aluno';
      case 'guardian': return 'Encarregado de Educação';
      case 'secretariat_rh': return 'Secretaria RH';
      case 'secretariat_patrimonio': return 'Património';
      case 'secretariat_recepcao': return 'Recepção / Atendimento';
      case 'secretariat_arquivo': return 'Arquivo Escolar';
      case 'librarian': return 'Biblioteca';
      default: return role;
    }
  };

  const handleRefreshClick = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <header className={`bg-[#070d24] border-b border-[#18234d] text-white sticky top-0 z-40 shadow-lg no-print ${className}`}>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Left: Official Emblem with Transparent Background & School Info */}
          <div className="flex items-center space-x-3.5 bg-transparent">
            <div className="relative flex items-center justify-center p-0 m-0 bg-transparent shrink-0">
              <img 
                src={MOZAMBIQUE_EMBLEM_URL} 
                alt="Emblema da República de Moçambique" 
                className="h-12 w-12 object-contain bg-transparent mix-blend-normal filter drop-shadow-md transition-transform duration-200 hover:scale-105" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-wide text-white font-serif">
                  SIGE • MOÇAMBIQUE
                </h1>
                <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-xs tracking-wider">
                  OFICIAL MINEDH
                </span>
              </div>
              <p className="text-xs text-amber-200/90 font-medium tracking-wide flex items-center gap-1">
                <span>{currentSchoolName}</span>
                <span>•</span>
                <span>{currentSchoolLocation}</span>
                {activeSchoolId && activeSchoolId !== 'all' && (
                  <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded ml-1">
                    TENANT ISOLADO
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Center: Mozambican Digital Live Clock Widget */}
          <div className="hidden md:flex justify-center">
            <InstitutionalClock />
          </div>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {onOpenNotifications && (
              <button 
                onClick={onOpenNotifications}
                className="relative p-2 rounded-lg border border-cyan-500/40 bg-[#0c1738] text-cyan-300 hover:bg-cyan-500/20 transition-colors shadow-xs cursor-pointer"
                title="Abrir Notificações do Sistema e Avisos em Tempo Real"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
              </button>
            )}

            <button 
              onClick={onOpenProfile}
              className="flex items-center space-x-2.5 pl-2 border-l border-slate-700/60 hover:opacity-90 transition-all cursor-pointer group text-left"
              title="Abrir Perfil do Utilizador & Permissões"
            >
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md border-2 border-amber-300 overflow-hidden">
                  {currentUser?.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-slate-950" />
                  )}
                </div>
              </div>
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                    {currentUser?.name || 'Utilizador'}
                  </div>
                  <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-xs tracking-wider">
                    {getRoleName(currentUser?.role || '')}
                  </span>
                </div>
                <div className="text-[10px] text-amber-200/90 font-medium">
                  {currentUser?.roleTitle || getRoleName(currentUser?.role || '')} • Clique p/ Perfil
                </div>
              </div>
            </button>
            
            {/* Actions Toolbar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700/60">
              <button onClick={handleRefreshClick} className="p-2 border border-blue-500 bg-[#0c1738] text-blue-400 rounded-lg hover:bg-blue-500/20" title="Recarregar">
                <RotateCw className="h-4 w-4"/>
              </button>
              <button className="p-2 border border-slate-500 bg-[#0c1738] text-slate-300 rounded-lg hover:bg-slate-500/20" title="Base de Dados Online">
                <Database className="h-4 w-4"/>
              </button>
              {onToggleFullscreen && (
                <button onClick={onToggleFullscreen} className="p-2 border border-emerald-500 bg-[#0c1738] text-emerald-400 rounded-lg hover:bg-emerald-500/20" title="Ecrã Inteiro">
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </button>
              )}
              <button onClick={logout} className="p-2 border border-red-500 bg-[#0c1738] text-red-400 rounded-lg hover:bg-red-500/20" title="Sair do Sistema">
                <LogOut className="h-4 w-4"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
