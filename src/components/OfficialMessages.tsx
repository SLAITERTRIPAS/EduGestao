import React, { useState } from 'react';
import { useStore } from '../store';
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
  Printer
} from 'lucide-react';
import { ChatMessage } from '../types';
import { printDocument } from '../utils/printHelper';

export function OfficialMessages() {
  const { currentUser, chatMessages, sendChatMessage, sendNotification, users, schools } = useStore();

  const [activeFolder, setActiveFolder] = useState<'inbox' | 'outbox'>('inbox');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'default' | 'detail' | 'compose'>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListCollapsed, setIsListCollapsed] = useState(false);

  // Compose state
  const [recipientLevel, setRecipientLevel] = useState<'admin' | 'district' | 'school' | 'all'>('admin');
  const [recipientName, setRecipientName] = useState('Administração Geral do Sistema');
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [category, setCategory] = useState<'suporte' | 'oficial' | 'geral'>('oficial');
  const [sendSuccess, setSendSuccess] = useState(false);

  // Reply state
  const [replyText, setReplyText] = useState('');

  if (!currentUser) return null;

  // Filter messages for current user
  const userInboxMessages = chatMessages.filter(msg => {
    // If msg sender is NOT current user, it belongs to inbox if addressed to user's level or role
    if (msg.senderId === currentUser.id) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'national') return true;
    if (msg.receiverLevel === 'all') return true;
    if (msg.receiverLevel === currentUser.role) return true;
    if (msg.receiverLevel === 'school' && currentUser.schoolId) return true;
    return true; // Default show in inbox for demonstration
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
    setRecipientLevel('admin');
    setRecipientName('Administração Geral / Suporte Técnico');
    setCategory('suporte');
    setSubject('Pedido de Suporte do Sistema');
    setMessageText('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const msgSubject = subject.trim() || 'Comunicação Oficial';
    sendChatMessage({
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      receiverLevel: recipientLevel,
      receiverName: recipientName,
      subject: msgSubject,
      text: messageText.trim(),
      category: category,
      read: false
    });

    sendNotification({
      title: `Nova Mensagem: ${msgSubject}`,
      message: `${currentUser.name} enviou uma mensagem para ${recipientName}: "${messageText.trim().substring(0, 90)}..."`,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      targetAudience: recipientLevel === 'all' ? 'todos' : recipientLevel === 'school' ? 'professores' : 'todos',
      priority: category === 'suporte' ? 'urgente' : 'importante',
      category: 'Geral',
      targetLocation: 'messages'
    });

    setSendSuccess(true);
    setTimeout(() => {
      setSendSuccess(false);
      setMessageText('');
      setSubject('');
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
      title: `Resposta a Mensagem: ${selectedMessage.subject || 'Comunicação Oficial'}`,
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
            Canal de Suporte
          </h4>

          <button
            onClick={handleContactSupport}
            className="w-full bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100/80 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
              <ShieldCheck size={20} className="text-blue-600" />
            </div>
            <span className="text-xs font-black text-slate-900 tracking-tight">
              Contactar Administração
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
                placeholder="Pesquisar conversa..."
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
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {msg.category || 'Oficial'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">
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

      {/* 3. RIGHT MAIN AREA (Default Empty State / Conversation Detail / Compose Form) */}
      <div className="flex-1 bg-white h-full flex flex-col overflow-y-auto relative">
        
        {/* CASE A: DEFAULT PLACEHOLDER STATE (Exact match to uploaded screenshot) */}
        {viewMode === 'default' && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white animate-in fade-in duration-300">
            {/* Soft blue circle with envelope */}
            <div className="w-20 h-20 rounded-full bg-blue-50/80 border border-blue-100/80 flex items-center justify-center text-blue-500 mb-4 shadow-xs">
              <Mail size={36} className="text-blue-500 stroke-[1.75]" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-extrabold text-slate-900 mb-2 font-serif tracking-tight">
              Selecione uma Pasta
            </h3>

            {/* Paragraph with bolded words */}
            <p className="text-xs md:text-sm text-slate-500 max-w-sm text-center leading-relaxed font-medium">
              Escolha entre a sua <strong className="font-extrabold text-slate-700">Caixa de Entrada</strong> ou{' '}
              <strong className="font-extrabold text-slate-700">Saída</strong> para gerir as suas comunicações oficiais.
            </p>
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
                  <Printer size={15} /> Imprimir
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

              {/* Reply Section */}
              <form onSubmit={handleSendReply} className="space-y-3 pt-4 border-t border-slate-200">
                <label className="block text-xs font-bold text-slate-700">
                  Responder a esta mensagem:
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
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition-all"
                  >
                    <Send size={15} /> Responder
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
                  <h3 className="font-extrabold text-base text-slate-900">Nova Mensagem Oficial</h3>
                  <p className="text-xs text-slate-500">Envio de comunicados e notificações formais do sistema.</p>
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
                    <span>Mensagem oficial enviada com sucesso ao destinatário!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Destinatário / Entidade:
                    </label>
                    <select
                      value={recipientLevel}
                      onChange={e => {
                        const val = e.target.value as any;
                        setRecipientLevel(val);
                        if (val === 'admin') setRecipientName('Administração Geral do Sistema');
                        else if (val === 'district') setRecipientName('Direcção Distrital de Educação');
                        else if (val === 'school') setRecipientName('Direcção da Escola');
                        else setRecipientName('Comunicação Geral');
                      }}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="admin">Administração Geral do Sistema</option>
                      <option value="district">Direcção Distrital de Educação (DDE)</option>
                      <option value="school">Direcção da Escola / Pedagogia</option>
                      <option value="all">Todos os Colaboradores e Docentes</option>
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
                      <option value="oficial">Comunicação Oficial / Circular</option>
                      <option value="suporte">Canal de Suporte Técnico</option>
                      <option value="geral">Aviso Geral</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assunto da Mensagem: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Assunto formal do comunicado..."
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Conteúdo da Mensagem: <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={8}
                    required
                    placeholder="Escreva aqui o texto completo do comunicado ou pedido..."
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    className="w-full p-4 border border-slate-300 rounded-2xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => alert('Anexo de ficheiro adicionado.')}
                  className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all"
                >
                  <Paperclip size={16} /> Anexar Ficheiro
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode('default')}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Send size={16} /> Enviar Mensagem
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
