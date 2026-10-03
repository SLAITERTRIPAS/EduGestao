import React from 'react';
import { useStore } from '../store';
import { Megaphone, AlertTriangle, Sparkles, X, ChevronRight, Bell } from 'lucide-react';

export const DashboardNoticeBanner: React.FC = () => {
  const { userNotifications, currentUser, markNotificationAsRead } = useStore();

  const allNotifs = Array.isArray(userNotifications) ? userNotifications : [];

  // Filter urgent or unread notices applicable to this user role
  const activeNotices = allNotifs.filter(n => {
    if (n.targetAudience === 'professores' && currentUser?.role !== 'teacher') return false;
    if (n.targetAudience === 'alunos' && currentUser?.role !== 'student') return false;
    return !n.isRead || n.priority === 'urgente';
  });

  if (activeNotices.length === 0) return null;

  const latestNotice = activeNotices[0];

  return (
    <div className={`p-4 rounded-2xl border mb-6 relative overflow-hidden transition-all shadow-md animate-in fade-in duration-300 ${
      latestNotice.priority === 'urgente'
        ? 'bg-gradient-to-r from-red-900 via-rose-900 to-slate-900 text-white border-red-500/50'
        : 'bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 text-white border-blue-500/40'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        
        <div className="flex items-start sm:items-center gap-3">
          <div className={`p-2.5 rounded-xl font-black shrink-0 ${
            latestNotice.priority === 'urgente'
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-amber-400 text-slate-950'
          }`}>
            <Megaphone size={20} />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-400 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-xs tracking-wider">
                COMUNICADO DA SECRETARIA GERAL
              </span>
              <span className="text-[10px] font-bold text-amber-200">
                • {latestNotice.category || 'Aviso Oficial'}
              </span>
            </div>

            <h3 className="text-sm font-extrabold text-white tracking-tight font-serif">
              {latestNotice.title}
            </h3>

            <p className="text-xs text-slate-200 leading-relaxed font-medium max-w-3xl line-clamp-2">
              {latestNotice.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0">
          <button
            onClick={() => markNotificationAsRead(latestNotice.id)}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer"
          >
            Compreendido
          </button>
        </div>

      </div>
    </div>
  );
};
