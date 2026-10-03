import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  Bell, Send, Megaphone, ShieldAlert, Sparkles, X, 
  Users, CheckCircle2, AlertTriangle, AlertCircle, Info, Filter, Clock
} from 'lucide-react';
import { UserNotification } from '../types';

interface SecretariatNoticeBroadcasterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecretariatNoticeBroadcaster: React.FC<SecretariatNoticeBroadcasterProps> = ({ isOpen, onClose }) => {
  const { currentUser, sendNotification, activeSchool } = useStore();

  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState<'todos' | 'professores' | 'alunos' | 'pais'>('todos');
  const [priority, setPriority] = useState<'urgente' | 'importante' | 'normal'>('importante');
  const [category, setCategory] = useState<'Académico' | 'Exames' | 'Administrativo' | 'Financeiro' | 'Geral'>('Geral');
  
  const [isSending, setIsSaving] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSaving(true);

    const newNotice: Omit<UserNotification, 'id' | 'createdAt'> = {
      title: title.trim(),
      message: message.trim(),
      senderName: currentUser?.name || 'Secretaria Geral',
      senderRole: currentUser?.roleTitle || 'Chefe da Secretaria',
      targetAudience,
      priority,
      category,
      schoolId: activeSchool?.id || currentUser?.schoolId || 's1'
    };

    try {
      await sendNotification(newNotice);
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        setTitle('');
        setMessage('');
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Erro ao emitir aviso da Secretaria:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70  p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-slate-900 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
              <Megaphone size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded shadow-xs tracking-wider">
                  SECRETARIA GERAL
                </span>
                <span className="bg-emerald-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded flex items-center gap-1">
                  <Sparkles size={10} /> Tempo Real
                </span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight mt-1 font-serif">
                Emitir Aviso / Notificação Importante
              </h3>
              <p className="text-xs text-amber-200/90 font-medium">
                Transmissão direta para o painel de Alunos, Professores e Encarregados.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {sendSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>Aviso transmitido com sucesso em tempo real para o painel central!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Título do Comunicado / Aviso:
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Calendário das Provas de Exame do III Trimestre"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Público-Alvo:
              </label>
              <select
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="todos">Todos (Comunidade Escolar)</option>
                <option value="professores">Apenas Professores / Docentes</option>
                <option value="alunos">Apenas Alunos / Estudantes</option>
                <option value="pais">Encarregados de Educação</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nível de Prioridade:
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="urgente">🔴 Urgente (Destaque Vermelho)</option>
                <option value="importante">🟠 Importante (Destaque Âmbar)</option>
                <option value="normal">🔵 Normal (Informativo)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Categoria:
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="Académico">Académico</option>
                <option value="Exames">Exames & Avaliações</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Financeiro">Financeiro / Propinas</option>
                <option value="Geral">Geral</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mensagem Detalhada do Comunicado:
            </label>
            <textarea
              required
              rows={4}
              placeholder="Escreva a mensagem oficial que será apresentada no painel principal dos utilizadores..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full p-3.5 border border-slate-300 rounded-2xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSending || !title.trim() || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Send size={15} /> {isSending ? 'A transmitir...' : 'Transmitir Aviso em Tempo Real'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
