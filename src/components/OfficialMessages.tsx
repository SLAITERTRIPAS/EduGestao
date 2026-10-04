import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { useHierarchicalStatistics } from '../hooks/useHierarchicalStatistics';
import { 
  Plus, 
  Inbox, 
  Send, 
  ShieldCheck, 
  Search, 
  Mail, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Paperclip, 
  CheckCircle2, 
  Clock,
  MessageSquare,
  ArrowLeft,
  X,
  Printer,
  Award,
  Building2,
  Landmark,
  GraduationCap,
  ChevronRight as ArrowRight,
  AlertCircle
} from 'lucide-react';
import { ChatMessage } from '../types';
import { printDocument } from '../utils/printHelper';

export function OfficialMessages() {
  const { currentUser, chatMessages, sendChatMessage, sendNotification, users, schools, provinces, districts } = useStore();

  const [activeFolder, setActiveFolder] = useState<'inbox' | 'outbox'>('inbox');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'default' | 'detail' | 'compose'>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListCollapsed, setIsListCollapsed] = useState(false);

  // Hierarchy Level Determination for Current User
  const userHierarchy = useMemo(() => {
    if (!currentUser) return 'subordinate';
    const role = (currentUser.role || '').toLowerCase();
    if (role === 'minister' || role === 'national' || role === 'admin') return 'minister';
    if (role === 'provincial') return 'provincial';
    if (role === 'district') return 'district';
    if (role === 'director' || role === 'diretor') return 'director';
    return 'subordinate';
  }, [currentUser]);

  // Hierarchical Recipient Options based on User Role
  const allowedRecipients = useMemo(() => {
    const list = [];
    
    if (userHierarchy === 'minister') {
      list.push({ id: 'provincial_all', label: 'Todas as 11 Direções Provinciais de Educação (DPE)', level: 'provincial', name: 'Todas as DPEs Provinciais' });
      if (Array.isArray(provinces)) {
        provinces.forEach(p => {
          list.push({ id: p.id, label: `DPE ${p.name} - Direção Provincial`, level: 'provincial', name: `DPE ${p.name}` });
        });
      }
    } else if (userHierarchy === 'provincial') {
      list.push({ id: 'minister_gab', label: 'Ministro da Educação / Gabinete Central (Superior Hierárquico)', level: 'national', name: 'Ministro da Educação' });
      const myProvId = currentUser.provinceId || 'p1';
      const myProvName = provinces?.find(p => p.id === myProvId)?.name || 'Maputo Cidade';
      list.push({ id: 'district_all', label: `Todos os Representantes Distritais (SDEJT) de ${myProvName}`, level: 'district', name: 'Todos os SDEJTs Distritais' });
      
      if (Array.isArray(districts)) {
        districts.filter(d => d.provinceId === myProvId).forEach(d => {
          list.push({ id: d.id, label: `SDEJT ${d.name} - Serviços Distritais`, level: 'district', name: `SDEJT ${d.name}` });
        });
      }
    } else if (userHierarchy === 'district') {
      const myProvId = currentUser.provinceId || 'p1';
      const myProvName = provinces?.find(p => p.id === myProvId)?.name || 'Maputo Cidade';
      list.push({ id: 'provincial_rep', label: `Direção Provincial de Educação - DPE ${myProvName} (Superior Hierárquico)`, level: 'provincial', name: `DPE ${myProvName}` });
      
      const myDistId = currentUser.districtId || 'd1';
      const myDistName = districts?.find(d => d.id === myDistId)?.name || 'KaMpfumo';
      list.push({ id: 'director_all', label: `Todos os Diretores de Escola do Distrito de ${myDistName}`, level: 'school', name: 'Todos os Diretores' });
      
      if (Array.isArray(schools)) {
        schools.filter(s => s.districtId === myDistId).forEach(s => {
          list.push({ id: s.id, label: `Director - ${s.name} (${s.code || 'ESC'})`, level: 'school', name: s.name });
        });
      }
    } else if (userHierarchy === 'director') {
      const myDistId = currentUser.districtId || 'd1';
      const myDistName = districts?.find(d => d.id === myDistId)?.name || 'KaMpfumo';
      list.push({ id: 'district_rep', label: `Serviço Distrital - SDEJT ${myDistName} (Superior Hierárquico)`, level: 'district', name: `SDEJT ${myDistName}` });
      list.push({ id: 'subordinates_all', label: 'Todos os Subordinados da Escola (DAP, Secretaria, Docentes e Alunos)', level: 'school', name: 'Todos os Subordinados da Escola' });
      list.push({ id: 'teachers_all', label: 'Corpo Docente & Professores da Escola', level: 'school', name: 'Corpo Docente' });
      list.push({ id: 'pedagogical_sec', label: 'Direção Pedagógica (DAP) & Secretaria Geral', level: 'school', name: 'DAP & Secretaria' });
    } else {
      list.push({ id: 'director_sch', label: 'Diretor da Escola (Superior Hierárquico Máximo)', level: 'director', name: 'Diretor da Escola' });
      list.push({ id: 'dap_sch', label: 'Direção Adjunta Pedagógica - DAP (Superior Pedagógico)', level: 'pedagogical', name: 'Diretor Adjunto Pedagógico (DAP)' });
      list.push({ id: 'sec_sch', label: 'Chefe de Secretaria Geral (Superior Administrativo)', level: 'secretariat', name: 'Chefe de Secretaria' });
    }
    
    return list;
  }, [userHierarchy, currentUser, provinces, districts, schools]);

  // Compose state
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(allowedRecipients[0]?.id || '');
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [category, setCategory] = useState<'suporte' | 'oficial' | 'geral'>('oficial');
  const [sendSuccess, setSendSuccess] = useState(false);
  const [attachReport, setAttachReport] = useState(false);
  const [showReportViewerId, setShowReportViewerId] = useState<string | null>(null);

  // Reply state
  const [replyText, setReplyText] = useState('');

  if (!currentUser) return null;

  const currentSelectedRecipient = allowedRecipients.find(r => r.id === selectedRecipientId) || allowedRecipients[0];

  // Filter messages for inbox based on user hierarchy
  const userInboxMessages = chatMessages.filter(msg => {
    if (msg.senderId === currentUser.id) return false;
    
    // Minister gets messages from provincial reps
    if (userHierarchy === 'minister') return true;
    
    // Provincial receives from Minister or replies from District reps
    if (userHierarchy === 'provincial') {
      return msg.senderRole === 'national' || (msg.senderRole as string) === 'minister' || msg.senderRole === 'district' || msg.receiverLevel === 'provincial';
    }

    // District receives from Provincial reps or replies from Directors
    if (userHierarchy === 'district') {
      return msg.senderRole === 'provincial' || msg.senderRole === 'director' || msg.receiverLevel === 'district';
    }

    // Director receives from District reps or from School Subordinates
    if (userHierarchy === 'director') {
      return msg.senderRole === 'district' || msg.senderRole === 'teacher' || msg.senderRole === 'pedagogical' || msg.senderRole === 'secretariat' || msg.senderRole === 'student' || msg.receiverLevel === 'school';
    }

    // Subordinates receive from Director / Superiors or broadcast to school
    return msg.senderRole === 'director' || msg.senderRole === 'pedagogical' || msg.senderRole === 'district' || msg.receiverLevel === 'all' || msg.receiverLevel === currentUser.role;
  });

  const userOutboxMessages = chatMessages.filter(msg => msg.senderId === currentUser.id);

  const displayedFolderMessages = (activeFolder === 'inbox' ? userInboxMessages : userOutboxMessages).filter(msg => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (msg.subject && msg.subject.toLowerCase().includes(q)) ||
      msg.senderName.toLowerCase().includes(q) ||
      msg.text.toLowerCase().includes(q)
    );
  });

  const selectedMessage = chatMessages.find(m => m.id === selectedMessageId);

  const handleOpenCompose = () => {
    setSelectedMessageId(null);
    setViewMode('compose');
    setSendSuccess(false);
  };

  const handleContactSupport = () => {
    setSelectedMessageId(null);
    setViewMode('compose');
    setSelectedRecipientId(allowedRecipients[0]?.id || '');
    setCategory('suporte');
    setSubject('Pedido de Suporte do Sistema');
    setMessageText('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const msgSubject = subject.trim() || 'Comunicação Oficial Hierárquica';
    const recipient = currentSelectedRecipient;

    const reportType = attachReport ? (
      userHierarchy === 'minister' ? 'nacional' :
      userHierarchy === 'provincial' ? 'provincial' :
      userHierarchy === 'district' ? 'distrital' :
      userHierarchy === 'director' ? 'escola' : undefined
    ) : undefined;

    const reportId = attachReport ? (
      userHierarchy === 'minister' ? 'nacional' :
      userHierarchy === 'provincial' ? (currentUser.provinceId || 'p1') :
      userHierarchy === 'district' ? (currentUser.districtId || 'd1') :
      userHierarchy === 'director' ? (currentUser.schoolId || 's1') : undefined
    ) : undefined;

    const reportName = attachReport ? (
      userHierarchy === 'minister' ? 'República de Moçambique' :
      userHierarchy === 'provincial' ? (provinces?.find(p => p.id === (currentUser.provinceId || 'p1'))?.name || 'Maputo Cidade') :
      userHierarchy === 'district' ? (districts?.find(d => d.id === (currentUser.districtId || 'd1'))?.name || 'KaMpfumo') :
      userHierarchy === 'director' ? (schools?.find(s => s.id === (currentUser.schoolId || 's1'))?.name || 'Escola Secundária') : undefined
    ) : undefined;

    sendChatMessage({
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      receiverLevel: recipient.level as any,
      receiverName: recipient.name,
      subject: msgSubject,
      text: messageText.trim(),
      category: category,
      read: false,
      attachedReportType: reportType,
      attachedReportJurisdictionId: reportId,
      attachedReportJurisdictionName: reportName
    });

    sendNotification({
      title: `Comunicado Oficial: ${msgSubject}`,
      message: `${currentUser.name} enviou uma comunicação oficial para ${recipient.name}: "${messageText.trim().substring(0, 90)}..."`,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      targetAudience: recipient.level === 'all' ? 'todos' : 'todos',
      priority: category === 'suporte' ? 'urgente' : 'importante',
      category: 'Geral',
      targetLocation: 'messages'
    });

    setSendSuccess(true);
    setTimeout(() => {
      setSendSuccess(false);
      setMessageText('');
      setSubject('');
      setAttachReport(false);
      setActiveFolder('outbox');
      setViewMode('default');
    }, 1200);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMessage) return;

    const replySub = `Re: ${selectedMessage.subject || 'Comunicação Oficial'}`;
    sendChatMessage({
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      receiverLevel: selectedMessage.senderRole as any,
      receiverName: selectedMessage.senderName,
      subject: replySub,
      text: replyText.trim(),
      category: selectedMessage.category || 'oficial',
      read: false
    });

    sendNotification({
      title: `Resposta Hierárquica: ${selectedMessage.subject || 'Comunicação Oficial'}`,
      message: `${currentUser.name} respondeu a ${selectedMessage.senderName}: "${replyText.trim().substring(0, 90)}..."`,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      recipientId: selectedMessage.senderId,
      recipientName: selectedMessage.senderName,
      targetAudience: 'todos',
      priority: 'importante',
      category: 'Geral',
      targetLocation: 'messages'
    });

    setReplyText('');
    setActiveFolder('outbox');
  };

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[580px] bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden animate-in fade-in duration-300 w-full font-sans">
      
      {/* 1. LEFT SUB-SIDEBAR (Navigation) */}
      <div className="w-64 min-w-[220px] bg-slate-50/70 border-r border-slate-200 p-4 flex flex-col justify-between shrink-0 no-print">
        <div className="space-y-4">
          
          {/* + Nova Mensagem Button */}
          <button
            onClick={handleOpenCompose}
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-xs tracking-wide py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Nova Mensagem</span>
          </button>

          {/* User Role Badge */}
          <div className="bg-slate-900 text-white p-3 rounded-2xl space-y-1">
            <span className="text-[10px] font-black uppercase text-amber-400 block tracking-wider">Nível de Comunicação</span>
            <div className="text-xs font-black truncate">
              {userHierarchy === 'minister' ? 'Nível Nacional / Ministro' :
               userHierarchy === 'provincial' ? 'Rep. Provincial (DPE)' :
               userHierarchy === 'district' ? 'Rep. Distrital (SDEJT)' :
               userHierarchy === 'director' ? 'Diretor de Escola' : 'Subordinado de Escola'}
            </div>
            <p className="text-[10px] text-slate-300 font-medium">
              {currentUser.name}
            </p>
          </div>

          {/* Folders List */}
          <nav className="space-y-1.5 pt-1">
            {/* Entrada (Inbox) */}
            <button
              onClick={() => {
                setActiveFolder('inbox');
                setSelectedMessageId(null);
                setViewMode('default');
              }}
              className={`w-full flex items-center justify-between py-3 px-4 rounded-2xl text-xs transition-all cursor-pointer ${
                activeFolder === 'inbox'
                  ? 'bg-blue-50 text-blue-600 font-extrabold border border-blue-100/80 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-bold border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Inbox size={18} className={activeFolder === 'inbox' ? 'text-blue-600' : 'text-slate-400'} />
                <span>Entrada</span>
              </div>
              {userInboxMessages.length > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  activeFolder === 'inbox' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {userInboxMessages.length}
                </span>
              )}
            </button>

            {/* Saída (Outbox) */}
            <button
              onClick={() => {
                setActiveFolder('outbox');
                setSelectedMessageId(null);
                setViewMode('default');
              }}
              className={`w-full flex items-center justify-between py-3 px-4 rounded-2xl text-xs transition-all cursor-pointer ${
                activeFolder === 'outbox'
                  ? 'bg-blue-50 text-blue-600 font-extrabold border border-blue-100/80 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-bold border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Send size={18} className={`-rotate-12 ${activeFolder === 'outbox' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>Saída</span>
              </div>
              {userOutboxMessages.length > 0 && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  activeFolder === 'outbox' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {userOutboxMessages.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Bottom Support Channel Section */}
        <div className="border-t border-slate-200/80 pt-4 mt-auto space-y-2">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
            Canal Institucional
          </h4>

          <button
            onClick={handleContactSupport}
            className="w-full bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-1 hover:shadow-md transition-all cursor-pointer group"
          >
            <span className="text-[11px] font-extrabold text-slate-800 group-hover:text-blue-600">
              Reporte / Suporte Técnico
            </span>
            <span className="text-[10px] text-slate-400">
              Canal direto de apoio institucional
            </span>
          </button>
        </div>
      </div>

      {/* 2. MIDDLE PANEL (Conversation List) */}
      {!isListCollapsed && (
        <div className="w-80 min-w-[280px] border-r border-slate-200 bg-white flex flex-col shrink-0 h-full relative no-print">
          
          {/* Search Box */}
          <div className="p-3 border-b border-slate-200/80 bg-white shrink-0">
            <div className="bg-slate-100/80 rounded-xl px-3 py-2 flex items-center gap-2 border border-slate-200/60 focus-within:bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Pesquisar mensagens..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {displayedFolderMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
                <p className="font-semibold">Nenhuma mensagem nesta pasta.</p>
              </div>
            ) : (
              displayedFolderMessages.map(msg => {
                const isSelected = msg.id === selectedMessageId;
                return (
                  <div
                    key={msg.id}
                    onClick={() => {
                      setSelectedMessageId(msg.id);
                      setViewMode('detail');
                    }}
                    className={`p-4 transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-blue-600'
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-900 truncate max-w-[170px]">
                        {activeFolder === 'inbox' ? msg.senderName : `Para: ${msg.receiverName || msg.receiverLevel}`}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">
                        {new Date(msg.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-800 truncate">
                      {msg.subject || 'Comunicação Oficial'}
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {msg.text}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                        {msg.category || 'Oficial'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">
                        • {msg.senderRole}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Edge Collapse Toggle Button */}
          <button
            onClick={() => setIsListCollapsed(true)}
            title="Ocultar lista de conversas"
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-500 hover:text-slate-900 shadow-sm flex items-center justify-center hover:scale-110 transition-all cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      )}

      {/* Collapsed Restore Button */}
      {isListCollapsed && (
        <button
          onClick={() => setIsListCollapsed(false)}
          title="Mostrar lista de conversas"
          className="absolute left-[260px] top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white border border-slate-300 text-slate-500 hover:text-slate-900 shadow-sm flex items-center justify-center hover:scale-110 transition-all cursor-pointer no-print"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* 3. RIGHT MAIN AREA */}
      <div className="flex-1 bg-white h-full flex flex-col overflow-y-auto relative">
        
        {/* CASE A: DEFAULT PLACEHOLDER STATE */}
        {viewMode === 'default' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white animate-in fade-in duration-300 space-y-6">
            {/* Flow Banner */}
            <div className="bg-slate-900 text-white p-5 rounded-3xl max-w-xl w-full text-left space-y-3 shadow-lg">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                <ShieldCheck size={18} /> Fluxo de Comunicação Hierárquica Oficial • MINEDH
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Conforme o Regulamento Ministerial, a comunicação oficial respeita rigorosamente a cadeia de comando:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-[10px] font-black pt-2">
                <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 p-2 rounded-xl">
                  1. MINISTRO
                </div>
                <div className="bg-blue-500/20 border border-blue-500/40 text-blue-300 p-2 rounded-xl">
                  2. REP. PROVINCIAL
                </div>
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-2 rounded-xl">
                  3. REP. DISTRITAL
                </div>
                <div className="bg-purple-500/20 border border-purple-500/40 text-purple-300 p-2 rounded-xl">
                  4. DIRETOR ESCOLA
                </div>
                <div className="bg-slate-700 border border-slate-600 text-slate-200 p-2 rounded-xl">
                  5. SUBORDINADOS
                </div>
              </div>
            </div>

            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <Mail size={32} />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-1 font-serif tracking-tight">
                Canal de Mensagens Oficiais
              </h3>
              <p className="text-xs md:text-sm text-slate-500 max-w-md text-center leading-relaxed font-medium">
                Selecione uma mensagem na caixa de entrada para visualizar ou clique em <strong className="text-slate-800">"Nova Mensagem"</strong> para despachar um comunicado dentro da sua cadeia hierárquica.
              </p>
            </div>
          </div>
        )}

        {/* CASE B: CONVERSATION DETAIL VIEW */}
        {viewMode === 'detail' && selectedMessage && (
          <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-blue-900 text-white flex items-center justify-center font-black text-sm shadow-sm">
                  {(selectedMessage.senderName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                    {selectedMessage.subject || 'Comunicação Oficial'}
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      {selectedMessage.category || 'Oficial'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    De: <span className="font-bold text-slate-800">{selectedMessage.senderName}</span> ({selectedMessage.senderRole}) • {new Date(selectedMessage.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printDocument()}
                  className="text-xs font-bold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 px-3.5 py-2 rounded-xl flex items-center gap-1.5 hover:shadow-xs transition-all cursor-pointer"
                >
                  <Printer size={15} /> Imprimir Despacho
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('default')}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Message Content */}
            <div className="flex-1 p-8 overflow-y-auto space-y-6">
              <div className="bg-slate-50/80 border border-slate-200 rounded-3xl p-6 shadow-xs leading-relaxed text-sm text-slate-800 whitespace-pre-wrap font-medium">
                {selectedMessage.text}
              </div>

              {/* Attachment Display */}
              {selectedMessage.attachedReportType && (
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 space-y-4 shadow-md animate-in slide-in-from-bottom duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/10 text-amber-400 rounded-2xl">
                        <Award size={24} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider">
                          Relatório Estatístico de Jurisdição Anexo
                        </h4>
                        <p className="text-xs text-slate-300">
                          Jurisdição: <strong className="text-white">{selectedMessage.attachedReportJurisdictionName}</strong> ({selectedMessage.attachedReportType})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowReportViewerId(showReportViewerId === selectedMessage.id ? null : selectedMessage.id)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>{showReportViewerId === selectedMessage.id ? 'Fechar Relatório' : 'Abrir Relatório Consolidado'}</span>
                    </button>
                  </div>

                  {showReportViewerId === selectedMessage.id && (
                    <div className="bg-white text-slate-900 rounded-2xl p-5 border border-slate-200 space-y-4 animate-in fade-in">
                      <JurisdictionalReportView
                        type={selectedMessage.attachedReportType}
                        id={selectedMessage.attachedReportJurisdictionId || ''}
                        name={selectedMessage.attachedReportJurisdictionName || ''}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Reply Section */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-4 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700">
                  Responder ao Emissor na Cadeia Hierárquica:
                </label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Escreva a sua resposta oficial..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Send size={15} /> Responder Oficialmente
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CASE C: COMPOSE NEW MESSAGE FORM */}
        {viewMode === 'compose' && (
          <div className="flex-1 flex flex-col h-full bg-white animate-in fade-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-2xl">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Nova Mensagem / Comunicado Oficial</h3>
                  <p className="text-xs text-slate-500">Envio de despachos autorizados pela hierarquia do MINEDH.</p>
                </div>
              </div>

              <button
                onClick={() => setViewMode('default')}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendMessage} className="p-8 flex-1 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {sendSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-3 animate-fadeIn">
                    <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    <span>Comunicado expedido com sucesso para o destinatário da cadeia hierárquica!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Destinatário Autorizado (Regra de Hierarquia): *
                    </label>
                    <select
                      value={selectedRecipientId}
                      onChange={e => setSelectedRecipientId(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-extrabold bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {allowedRecipients.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Categoria do Comunicado:
                    </label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="oficial">Comunicado Oficial / Circular Regimental</option>
                      <option value="suporte">Canal de Suporte Técnico</option>
                      <option value="geral">Aviso Geral</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assunto do Despacho: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Diretiva Regulamentar sobre o 1.º Trimestre Lectivo 2026..."
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Texto do Comunicado / Despacho: <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={8}
                    required
                    placeholder="Escreva aqui o texto completo do comunicado ou orientação institucional..."
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    className="w-full p-4 border border-slate-300 rounded-2xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                  />
                </div>

                {/* Jurisdictional Report Attachment Control */}
                {['minister', 'provincial', 'district', 'director'].includes(userHierarchy) && (
                  <div className="bg-blue-50 border border-blue-200/80 p-4 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                        <Award size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-blue-900">Anexar Relatório Estatístico de Jurisdição</p>
                        <p className="text-[10px] text-blue-700">
                          {userHierarchy === 'minister' ? 'Anexa o Relatório Consolidado Nacional do MINEDH' :
                           userHierarchy === 'provincial' ? 'Anexa o Relatório Consolidado Provincial da DPE correspondente' :
                           userHierarchy === 'district' ? 'Anexa o Relatório Distrital do SDEJT correspondente' :
                           'Anexa o Relatório Estatístico e de Aproveitamento da Escola'}
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={attachReport}
                        onChange={e => setAttachReport(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => alert('Anexo de documento anexado ao comunicado.')}
                  className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <Paperclip size={16} /> Anexar Documento / Circular PDF
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode('default')}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Send size={16} /> Expedir Despacho Oficial
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

      </div>

    </div>
  );
}

export function JurisdictionalReportView({ type, id, name }: { type: string, id: string, name: string }) {
  const { nationalData } = useHierarchicalStatistics();
  const { currentUser } = useStore();
  
  // Find report statistics based on type and id
  const stats = useMemo(() => {
    if (!currentUser) return null;

    // SECURITY JURISDICTION CHECK
    const role = (currentUser.role || '').toLowerCase();
    const isMinister = role === 'admin' || role === 'director_nacional' || role === 'minister' || role === 'national';

    if (!isMinister) {
      if (type === 'nacional') {
        return { isUnauthorized: true };
      }

      if (type === 'provincial') {
        const userProvinceId = currentUser.provinceId || '';
        if (role === 'provincial' && userProvinceId !== id) {
          return { isUnauthorized: true };
        }
        if ((role === 'district' || role === 'director' || role === 'secretariat') && userProvinceId !== id) {
          return { isUnauthorized: true };
        }
      }

      if (type === 'distrital') {
        const userDistrictId = currentUser.districtId || '';
        const userProvinceId = currentUser.provinceId || '';

        if (role === 'provincial') {
          const prov = nationalData.provinces.find(p => p.id === userProvinceId);
          const hasDistrict = prov?.districts.some(d => d.id === id);
          if (!hasDistrict) {
            return { isUnauthorized: true };
          }
        }

        if (role === 'district' && userDistrictId !== id) {
          return { isUnauthorized: true };
        }

        if ((role === 'director' || role === 'secretariat') && userDistrictId !== id) {
          return { isUnauthorized: true };
        }
      }

      if (type === 'escola') {
        const userSchoolId = currentUser.schoolId || '';
        const userDistrictId = currentUser.districtId || '';
        const userProvinceId = currentUser.provinceId || '';

        if (role === 'provincial') {
          const prov = nationalData.provinces.find(p => p.id === userProvinceId);
          const hasSchool = prov?.districts.some(d => d.schools?.some((s: any) => s.id === id || s.schoolId === id));
          if (!hasSchool) {
            return { isUnauthorized: true };
          }
        }

        if (role === 'district') {
          let hasSchool = false;
          for (const p of nationalData.provinces) {
            const d = p.districts.find(dst => dst.id === userDistrictId);
            if (d && d.schools?.some((s: any) => s.id === id || s.schoolId === id)) {
              hasSchool = true;
              break;
            }
          }
          if (!hasSchool) {
            return { isUnauthorized: true };
          }
        }

        if ((role === 'director' || role === 'secretariat') && userSchoolId !== id) {
          return { isUnauthorized: true };
        }
      }
    }

    if (type === 'nacional') {
      return {
        title: 'Ministério da Educação (MINEDH) - Relatório Estatístico Nacional',
        subtitle: 'Consolidação de Todas as Províncias',
        totalStudents: nationalData.totalStudents,
        maleStudents: nationalData.maleStudents,
        femaleStudents: nationalData.femaleStudents,
        passRate: nationalData.passRate,
        totalDocentes: nationalData.totalDocentes,
        totalCTA: nationalData.totalCTA,
        totalSchools: nationalData.totalSchools,
        totalClasses: nationalData.totalClasses,
        approvedCount: nationalData.approvedCount,
        reprovedCount: nationalData.reprovedCount,
        droppedCount: nationalData.droppedCount,
        transferredCount: nationalData.transferredCount,
        items: nationalData.provinces.map(p => ({ name: p.provinceName, value: p.totalStudents, rate: p.passRate, subLabel: `${p.totalSchools} Escolas` }))
      };
    } else if (type === 'provincial') {
      const prov = nationalData.provinces.find(p => p.id === id || p.provinceName.toLowerCase() === name.toLowerCase());
      if (!prov) return null;
      return {
        title: `DPE ${prov.provinceName} - Relatório Consolidado Provincial`,
        subtitle: 'Estatística de todos os distritos sob jurisdição',
        totalStudents: prov.totalStudents,
        maleStudents: prov.maleStudents,
        femaleStudents: prov.femaleStudents,
        passRate: prov.passRate,
        totalDocentes: prov.totalDocentes,
        totalCTA: prov.totalCTA,
        totalSchools: prov.totalSchools,
        totalClasses: prov.totalClasses,
        approvedCount: prov.approvedCount,
        reprovedCount: prov.reprovedCount,
        droppedCount: prov.droppedCount,
        transferredCount: prov.transferredCount,
        items: (prov.districts || []).map(d => ({ name: d.districtName, value: d.totalStudents, rate: d.passRate, subLabel: `${d.totalSchools} Escolas` }))
      };
    } else if (type === 'distrital') {
      let foundDist: any = null;
      let foundProvName = '';
      for (const p of nationalData.provinces) {
        const d = p.districts.find(dst => dst.id === id || dst.districtName.toLowerCase() === name.toLowerCase());
        if (d) {
          foundDist = d;
          foundProvName = p.provinceName;
          break;
        }
      }
      if (!foundDist) return null;
      return {
        title: `SDEJT ${foundDist.districtName} - Relatório Estatístico Distrital`,
        subtitle: `Província de ${foundProvName} • Lista de Escolas`,
        totalStudents: foundDist.totalStudents,
        maleStudents: foundDist.maleStudents,
        femaleStudents: foundDist.femaleStudents,
        passRate: foundDist.passRate,
        totalDocentes: foundDist.totalDocentes,
        totalCTA: foundDist.totalCTA,
        totalSchools: foundDist.totalSchools,
        totalClasses: foundDist.totalClasses,
        approvedCount: foundDist.approvedCount,
        reprovedCount: foundDist.reprovedCount,
        droppedCount: foundDist.droppedCount,
        transferredCount: foundDist.droppedCount,
        items: (foundDist.schools || []).map((s: any) => ({ name: s.schoolName || s.schoolId, value: s.totalStudents, rate: s.passRate, subLabel: s.schoolCode || 'ESC' }))
      };
    } else if (type === 'escola') {
      let foundSch: any = null;
      let foundDistName = '';
      for (const p of nationalData.provinces) {
        for (const d of p.districts) {
          const s = d.schools?.find((sch: any) => sch.id === id || sch.schoolId === id || sch.schoolName?.toLowerCase() === name.toLowerCase());
          if (s) {
            foundSch = s;
            foundDistName = d.districtName;
            break;
          }
        }
      }
      if (!foundSch) return null;
      return {
        title: `Escola ${foundSch.schoolName} - Estatística Local`,
        subtitle: `Distrito de ${foundDistName} • Código: ${foundSch.schoolCode || 'ESC-001'}`,
        totalStudents: foundSch.totalStudents,
        maleStudents: foundSch.maleStudents,
        femaleStudents: foundSch.femaleStudents,
        passRate: foundSch.passRate,
        totalDocentes: foundSch.totalDocentes || 24,
        totalCTA: foundSch.totalCTA || 8,
        totalSchools: 1,
        totalClasses: foundSch.totalClasses || 12,
        approvedCount: foundSch.approvedCount,
        reprovedCount: foundSch.reprovedCount,
        droppedCount: foundSch.droppedCount,
        transferredCount: foundSch.transferredCount || 0,
        items: []
      };
    }
    return null;
  }, [type, id, name, nationalData]);

  if (!stats) {
    return (
      <div className="p-4 bg-slate-50 text-slate-500 rounded-xl text-xs text-center">
        Relatório ou dados estatísticos da jurisdição "{name}" não encontrados ou ainda não consolidados pelo sistema.
      </div>
    );
  }

  if ('isUnauthorized' in stats && stats.isUnauthorized) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-3">
        <AlertCircle size={20} className="text-rose-600 shrink-0" />
        <div>
          <p className="font-extrabold uppercase">Acesso Negado à Jurisdição</p>
          <p className="text-[10px] text-rose-600 mt-0.5">O seu cargo não possui privilégios para aceder a relatórios fora da sua jurisdição escolar regulamentar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-100 pb-2">
        <h5 className="font-extrabold text-sm text-blue-900">{stats.title}</h5>
        <p className="text-[10px] text-slate-500">{stats.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Estudantes</p>
          <p className="text-sm font-black text-slate-900 font-mono mt-0.5">{stats.totalStudents.toLocaleString()}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">{stats.maleStudents.toLocaleString()} M • {stats.femaleStudents.toLocaleString()} F</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Aproveitamento</p>
          <p className="text-sm font-black text-emerald-700 font-mono mt-0.5">{stats.passRate}%</p>
          <p className="text-[9px] text-emerald-600 mt-0.5">{stats.approvedCount.toLocaleString()} Aprovados</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Docentes</p>
          <p className="text-sm font-black text-slate-900 font-mono mt-0.5">{stats.totalDocentes.toLocaleString()}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">Rácio: ~1:{Math.round(stats.totalStudents / (stats.totalDocentes || 1))}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50">
          <p className="text-[10px] font-bold text-slate-500 uppercase">Classes / Escolas</p>
          <p className="text-sm font-black text-slate-900 font-mono mt-0.5">{stats.totalClasses.toLocaleString()}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">{stats.totalSchools.toLocaleString()} {stats.totalSchools > 1 ? 'Escolas' : 'Escola'}</p>
        </div>
      </div>

      <div className="bg-slate-100 p-2.5 rounded-xl text-[10px] text-slate-600 flex justify-between gap-4 font-mono">
        <div>Reprovados: <strong className="text-rose-600 font-bold">{stats.reprovedCount.toLocaleString()}</strong></div>
        <div>Desistentes: <strong className="text-amber-600 font-bold">{stats.droppedCount.toLocaleString()}</strong></div>
        <div>Transferidos: <strong className="text-blue-600 font-bold">{stats.transferredCount.toLocaleString()}</strong></div>
      </div>

      {stats.items && stats.items.length > 0 && (
        <div className="space-y-1.5 pt-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detalhamento dos Sub-níveis</p>
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            {stats.items.map((it, idx) => (
              <div key={idx} className="p-2 flex items-center justify-between hover:bg-slate-50 transition-colors text-[11px]">
                <div>
                  <p className="font-bold text-slate-800">{it.name}</p>
                  <p className="text-[9px] text-slate-400">{it.subLabel}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 font-mono">{it.value.toLocaleString()} Alunos</p>
                  <p className="text-[9px] text-emerald-600 font-bold">Aprov.: {it.rate}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
