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
