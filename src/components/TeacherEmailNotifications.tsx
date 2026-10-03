import React, { useState } from 'react';
import { useStore } from '../store';
import { Mail, Send, CheckCircle2, Search, RefreshCw, Calendar, User, ShieldAlert } from 'lucide-react';
import { Button } from './ui';

export function TeacherEmailNotifications() {
  const { emailNotifications, sendEmailNotification, users, classes, currentUser } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const teachers = users.filter(u => u.role === 'teacher');

  const handleManualSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) return;
    const teacher = users.find(u => u.id === selectedTeacherId);
    if (!teacher) return;
    const targetClass = classes.find(c => c.id === selectedClassId);

    setIsSending(true);
    setTimeout(() => {
      sendEmailNotification({
        teacherEmail: teacher.email,
        teacherName: teacher.name,
        subject: customSubject || '[MINEDH] Notificação Oficial da Secção Pedagógica',
        message: customMessage || `Prezado(a) Professor(a) ${teacher.name},\n\nNotificação referente ao processamento do arquivo histórico e fecho de trimestre.\n\nAtentamente,\nDirecção Pedagógica`,
        classId: selectedClassId || undefined,
        className: targetClass?.name || undefined
      });
      setIsSending(false);
      setSuccessMsg(true);
      setCustomSubject('');
      setCustomMessage('');
      setTimeout(() => setSuccessMsg(false), 3000);
    }, 600);
  };

  const filteredNotifications = emailNotifications.filter(n => 
    n.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.teacherEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-6 text-slate-100 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl shrink-0 mt-0.5">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-blue-300 uppercase tracking-wide">
                Sistema de Notificações por E-mail aos Docentes (MINEDH)
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                Alertas automáticos enviados aos professores assim que a Secção Pedagógica processa o arquivo histórico após o fechamento trimestral. Monitorize o histórico de envios e o status de entrega.
              </p>
            </div>
          </div>
          <div className="bg-blue-900/60 text-blue-200 border border-blue-500/40 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Servidor SMTP Ativo</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Manual Notification Form (Pedagogical Role) */}
        {currentUser?.role === 'pedagogical' || currentUser?.role === 'admin' ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <Send size={16} className="text-blue-700" /> Disparar Alerta Manual
            </h4>
            
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                <CheckCircle2 size={16} /> E-mail enviado com sucesso!
              </div>
            )}

            <form onSubmit={handleManualSend} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Docente Destinatário:</label>
                <select
                  value={selectedTeacherId}
                  onChange={e => setSelectedTeacherId(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-medium"
                >
                  <option value="">Selecione o professor...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Turma Relacionada (Opcional):</label>
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-medium"
                >
                  <option value="">Geral / Sem Turma Específica</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.gradeLevel})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assunto do E-mail:</label>
                <input
                  type="text"
                  placeholder="Ex: [MINEDH] Arquivo Histórico..."
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mensagem:</label>
                <textarea
                  rows={4}
                  placeholder="Escreva a mensagem oficial..."
                  value={customMessage}
                  onChange={e => setCustomMessage(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              <Button type="submit" disabled={isSending} className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2">
                {isSending ? <RefreshCw className="animate-spin h-4 w-4" /> : <Send size={16} />}
                {isSending ? 'A Enviar E-mail...' : 'Enviar Notificação por E-mail'}
              </Button>
            </form>
          </div>
        ) : (
          <div className="bg-blue-50/50 border border-blue-200 p-6 rounded-2xl flex flex-col justify-center items-center text-center">
            <Mail className="h-12 w-12 text-blue-600 mb-3" />
            <h4 className="font-bold text-blue-900">Caixa de Entrada de Alertas</h4>
            <p className="text-xs text-blue-700 mt-1">
              Visualize abaixo todas as notificações e confirmações de arquivo histórico enviadas para o seu endereço institucional.
            </p>
          </div>
        )}

        {/* Notifications History Log */}
        <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 ${currentUser?.role === 'pedagogical' || currentUser?.role === 'admin' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <RefreshCw size={16} className="text-slate-600" /> Registo de Alertas Enviados ({emailNotifications.length})
            </h4>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar professor ou assunto..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-left">
                  <th className="p-2.5 border-b">Data / Hora</th>
                  <th className="p-2.5 border-b">Docente</th>
                  <th className="p-2.5 border-b">E-mail</th>
                  <th className="p-2.5 border-b">Assunto</th>
                  <th className="p-2.5 border-b">Turma</th>
                  <th className="p-2.5 border-b text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map(notif => (
                  <tr key={notif.id} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className="p-2.5 text-slate-500 whitespace-nowrap">
                      {new Date(notif.sentAt).toLocaleString('pt-PT')}
                    </td>
                    <td className="p-2.5 font-bold text-slate-900">{notif.teacherName}</td>
                    <td className="p-2.5 text-blue-700 font-mono">{notif.teacherEmail}</td>
                    <td className="p-2.5 font-medium text-slate-800 max-w-xs truncate" title={notif.subject}>
                      {notif.subject}
                    </td>
                    <td className="p-2.5 font-semibold text-slate-700">
                      {notif.className || 'Geral'}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        <CheckCircle2 size={10} /> Enviado
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredNotifications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      Nenhum registo de notificação por e-mail encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
