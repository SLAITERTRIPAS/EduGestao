import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CollapsibleSidebarProps {
  children: React.ReactNode;
  sidebarContent: React.ReactNode;
  initialCollapsed?: boolean;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({ 
  children, 
  sidebarContent, 
  initialCollapsed = false 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  return (
    <div className="flex w-full relative min-h-screen overflow-x-hidden bg-slate-100">
      {/* Sidebar Container */}
      <div 
        className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out shrink-0 overflow-hidden no-print ${
          isCollapsed ? 'w-0 opacity-0' : 'w-64 opacity-100'
        }`}
      >
        <div className="w-64 h-full overflow-y-auto">
          {sidebarContent}
        </div>
      </div>

      {/* Toggle Button - Positioned exactly on the border edge */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-1/2 -translate-y-1/2 z-50 w-9 h-9 bg-white border-2 border-blue-50 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.15)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.25)] hover:scale-110 active:scale-95 transition-all duration-300 group no-print cursor-pointer"
        style={{ 
          left: isCollapsed ? '0px' : '256px', 
          transform: 'translate(-50%, -50%)',
          transitionProperty: 'left, transform, scale, box-shadow'
        }}
        aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
      >
        {isCollapsed ? (
          <ChevronRight size={20} className="text-[#1e3a8a] group-hover:scale-110 transition-transform" />
        ) : (
          <ChevronLeft size={20} className="text-[#1e3a8a] group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Workspace Area - Work area is usually the children */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
};
