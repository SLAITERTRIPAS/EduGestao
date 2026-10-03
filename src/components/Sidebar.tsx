import { LogOut, Bell, RotateCw, Database, Minimize2, Maximize2, Eye } from 'lucide-react';

interface SidebarProps {
  highContrast: boolean;
  toggleHighContrast: () => void;
  handleRefresh: () => void;
  toggleFullscreen: () => void;
  isFullscreen: boolean;
  logout: () => void;
  onOpenNotifications?: () => void;
}

export function Sidebar({ highContrast, toggleHighContrast, handleRefresh, toggleFullscreen, isFullscreen, logout, onOpenNotifications }: SidebarProps) {
  return (
    <nav className="w-16 bg-[#070d24] border-r border-[#18234d] flex flex-col items-center py-6 space-y-6 no-print z-50">
      <div className="flex flex-col items-center space-y-4">
        <button 
          onClick={onOpenNotifications}
          className="relative p-3 rounded-xl border border-cyan-500/40 bg-[#0c1738] text-cyan-300 hover:bg-cyan-500/20 transition-colors shadow-xs cursor-pointer"
          title="Notificações"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
        </button>
      </div>

      <div className="w-10 h-px bg-slate-700/60" />

      <div className="flex flex-col items-center space-y-3">
        <button
          onClick={toggleHighContrast}
          className={`p-3 rounded-xl border ${highContrast ? 'border-amber-400 bg-amber-950 text-amber-200' : 'border-cyan-500/50 bg-[#0c1738] text-cyan-300'} transition-colors`}
          title={highContrast ? "Desativar Alto Contraste" : "Ativar Alto Contraste"}
        >
          <Eye className="h-5 w-5" />
        </button>
        <button
          onClick={handleRefresh}
          className="p-3 rounded-xl border border-cyan-500/50 bg-[#0c1738] text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition-colors"
          title="Recarregar"
        >
          <RotateCw className="h-5 w-5" />
        </button>
        <button
          onClick={() => alert("Base de Dados conectada!")}
          className="p-3 rounded-xl border border-cyan-500/50 bg-[#0c1738] text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition-colors"
          title="Base de Dados"
        >
          <Database className="h-5 w-5" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-3 rounded-xl border border-cyan-500/50 bg-[#0c1738] text-cyan-300 hover:bg-cyan-500/20 hover:text-white transition-colors"
          title={isFullscreen ? "Minimizar" : "Ecrã Inteiro"}
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>
      </div>

      <div className="mt-auto">
        <button
          onClick={logout}
          className="p-3 rounded-xl border border-red-500/50 bg-red-950/40 text-red-300 hover:bg-red-600 hover:text-white transition-colors"
          title="Sair"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
}
