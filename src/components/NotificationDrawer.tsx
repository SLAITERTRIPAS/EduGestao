import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  Bell, CheckCircle2, Megaphone, ShieldAlert, X, 
  Trash2, Filter, Sparkles, AlertTriangle, AlertCircle, Info, Check, Clock, ExternalLink
} from 'lucide-react';
import { SecretariatNoticeBroadcaster } from './SecretariatNoticeBroadcaster';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { currentUser, chatMessages, markNotificationAsRead, activeSchool } = useStore();

  const [isBroadcasterOpen, setIsBroadcasterOpen] = useState(false);
  const [filterAudience, setFilterAudience] = useState<'all' | 'urgente' | 'unread'>('all');

  if (!isOpen) return null;

  // Combine chatMessages
  const allNotifs = Array.isArray(chatMessages) ? chatMessages : [];

  // Filter based on user role
  const filteredNotifs = allNotifs.filter((n: any) => {
    // Role filter
    if (n.targetAudience === 'professores' && currentUser?.role !== 'teacher') return false;
    if (n.targetAudience === 'alunos' && currentUser?.role !== 'student') return false;

    if (filterAudience === 'urgente') return n.priority === 'urgente';
    if (filterAudience === 'unread') return !n.isRead && !n.read;
    return true;
  });

  const canBroadcast = ['admin', 'director', 'secretariat', 'pedagogical', 'national', 'provincial', 'district'].includes(currentUser?.role || '');

  const handleOpenNotification = (notif: any) => {
    markNotificationAsRead(notif.id);
    onClose();

    // Determine target location based on notification attributes or category
    let target = notif.targetLocation;
    if (!target) {
      if (notif.category === 'Atividades' || (notif.title && notif.title.toLowerCase().includes('atividade'))) {
        target = currentUser?.role === 'student' ? 'tasks' : 'atividades';
      } else if (notif.category === 'Mensagens' || (notif.title && notif.title.toLowerCase().includes('mensagem'))) {
        target = 'messages';
      } else {
        target = 'messages';
      }
    }

    window.dispatchEvent(new CustomEvent('navigate-applet', {
      detail: {
        targetLocation: target,
        targetTab: target === 'atividades' ? 'overview' : target,
        targetMode: target === 'atividades' ? 'atividades' : undefined,
        notif
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50  animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col font-sans border-l border-slate-200">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-950 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl font-bold shadow-sm relative">
              <Bell size={20} />
              {filteredNotifs.some((n: any) => !n.isRead && !n.read) && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight font-serif text-white">
                Avisos & Notificações
              </h3>
              <p className="text-[11px] text-amber-200/90 font-medium">
                Comunicação em Tempo Real • MINEDH
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar & Filter Bar */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterAudience('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterAudience === 'all' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({allNotifs.length})
            </button>
            <button
              onClick={() => setFilterAudience('urgente')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filterAudience === 'urgente' ? 'bg-red-600 text-white font-bold shadow-xs' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              Urgentes
            </button>
          </div>

          {canBroadcast && (
            <button
              onClick={() => setIsBroadcasterOpen(true)}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg shadow-xs flex items-center gap-1 transition-all cursor-pointer text-[11px]"
            >
              <Megaphone size={13} /> Emitir Aviso
            </button>
          )}
        </div>

        {/* Notification List Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Bell size={36} className="mx-auto text-slate-300 stroke-1" />
              <p className="text-xs font-bold text-slate-600">Sem notificações ativas de momento.</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Os avisos importantes emitidos pela Secretaria e Direcção Pedagógica serão apresentados aqui em tempo real.
              </p>
            </div>
          ) : (
            filteredNotifs.map((notif: any) => (
              <div 
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all relative ${
                  notif.priority === 'urgente'
                    ? 'bg-red-50/80 border-red-200 text-red-950'
                    : notif.priority === 'importante'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                    : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                      notif.priority === 'urgente'
                        ? 'bg-red-600 text-white'
                        : notif.priority === 'importante'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {notif.priority || 'Normal'}
                    </span>
                    {notif.category && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                        {notif.category}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock size={11} /> {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                  </span>
                </div>

                <h4 className="font-extrabold text-xs text-slate-950 mb-1 leading-snug">
                  {notif.title}
                </h4>

                <p className="text-xs text-slate-700 leading-relaxed font-medium mb-3">
                  {notif.message}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200/60 pt-2 flex-wrap gap-2">
                  <span className="font-bold text-slate-600 truncate max-w-[180px]">
                    Emitido por: {notif.senderName} ({notif.senderRole})
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenNotification(notif)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-md flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                    >
                      <ExternalLink size={11} /> Abrir Local
                    </button>

                    {!notif.isRead && (
                      <button
                        onClick={() => markNotificationAsRead(notif.id)}
                        className="text-slate-500 hover:text-slate-900 font-bold flex items-center gap-0.5 cursor-pointer"
                        title="Marcar como lida"
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 text-center text-[10px] font-bold text-slate-500">
          EduGestão MINEDH • Sistema de Avisos em Tempo Real
        </div>

      </div>

      {/* Notice Broadcaster Modal */}
      <SecretariatNoticeBroadcaster 
        isOpen={isBroadcasterOpen} 
        onClose={() => setIsBroadcasterOpen(false)} 
      />
    </div>
  );
};
