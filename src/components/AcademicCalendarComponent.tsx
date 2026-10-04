import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Card, Button } from './ui';
import { AcademicEvent, Employee, UserNotification } from '../types';
import {
  getStoredEvents,
  saveEvents,
  createNotificationForEvent
} from '../utils/notificationStore';
import { SchoolCalendarConfigManager } from './SchoolCalendarConfigManager';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  MapPin,
  DoorOpen,
  Users,
  CheckSquare,
  Square,
  Send,
  X,
  Tag,
  Bell,
  Eye,
  FileText
} from 'lucide-react';

const INITIAL_EVENTS: AcademicEvent[] = [
  {
    id: 'evt-1',
    title: 'Início das Aulas do 1º Trimestre',
    description: 'Abertura oficial do ano lectivo e recepção aos alunos.',
    message: 'Sejam bem-vindos ao novo ano lectivo 2026. Solicitamos a comparência de todos os professores no Pátio Central.',
    date: '2026-09-01',
    startDate: '2026-09-01',
    endDate: '2026-09-01',
    location: 'Pátio Central',
    roomNumber: 'Anfiteatro 01',
    targetAudience: 'Estudantes e Professores',
    category: 'evento',
    creatorName: 'Direcção Pedagógica',
    creatorRole: 'pedagogical',
  },
  {
    id: 'evt-2',
    title: 'Dia da Vitória (Feriado Nacional)',
    description: 'Celebração nacional - Lusaka Accords anniversary.',
    message: 'Tolerância de ponto e feriado nacional em todas as instituições de ensino.',
    date: '2026-09-07',
    startDate: '2026-09-07',
    endDate: '2026-09-07',
    location: 'Nacional',
    roomNumber: 'N/A',
    targetAudience: 'Comunidade Escolar',
    category: 'feriado',
    creatorName: 'Governo de Moçambique',
    creatorRole: 'secretariat',
  },
  {
    id: 'evt-3',
    title: 'Prazo: Lançamento de Notas A1',
    description: 'Data limite para os professores submeterem as avaliações contínuas 1.',
    message: 'Lembramos a todos os docentes que o sistema encerra o lançamento do A1 no dia 18 de Setembro.',
    date: '2026-09-18',
    startDate: '2026-09-15',
    endDate: '2026-09-18',
    location: 'Secretaria Geral',
    roomNumber: 'Sala de Professores 02',
    targetAudience: 'Corpo Docente',
    category: 'prazo',
    creatorName: 'Conselho Pedagógico',
    creatorRole: 'pedagogical',
  },
  {
    id: 'evt-4',
    title: 'Reunião do Conselho de Turma',
    description: 'Avaliação intercalar do comportamento e aproveitamento das turmas.',
    message: 'Reunião obrigatória de análise do 1º trimestre com todos os directores de turma.',
    date: '2026-09-22',
    startDate: '2026-09-22',
    endDate: '2026-09-22',
    location: 'Bloco Administrativo',
    roomNumber: 'Sala de Reuniões 03',
    targetAudience: 'Professores e Directores de Turma',
    category: 'reuniao',
    creatorName: 'Pedagógico Central',
    creatorRole: 'pedagogical',
  },
  {
    id: 'evt-5',
    title: 'Dia das Forças Armadas de Libertação de Moçambique',
    description: 'Feriado nacional comemorativo.',
    message: 'Celebração do 25 de Setembro.',
    date: '2026-09-25',
    startDate: '2026-09-25',
    endDate: '2026-09-25',
    location: 'Nacional',
    roomNumber: 'N/A',
    targetAudience: 'Todos os Colaboradores',
    category: 'feriado',
    creatorName: 'Governo de Moçambique',
    creatorRole: 'secretariat',
  },
];

export const AcademicCalendarComponent: React.FC = () => {
  const { currentUser, employees, schools } = useStore();
  const [activeCalendarSubTab, setActiveCalendarSubTab] = useState<'events' | 'config'>('events');
  const [events, setEvents] = useState<AcademicEvent[]>(() => {
    const saved = getStoredEvents();
    return saved.length > 0 ? saved : INITIAL_EVENTS;
  });

  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // Setembro 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);
  
  // Reading Mode State
  const [readingEvent, setReadingEvent] = useState<AcademicEvent | null>(null);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newTargetAudience, setNewTargetAudience] = useState('Todos os Colaboradores');
  const [newCategory, setNewCategory] = useState<'feriado' | 'prazo' | 'evento' | 'reuniao'>('evento');

  // Selected Recipients State
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  
  // Notification Toast
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Filter employees for current institution
  const schoolEmployees = employees.filter(
    (e) => !currentUser?.schoolId || e.schoolId === currentUser.schoolId
  );

  const canManageEvents =
    currentUser?.role === 'pedagogical' ||
    currentUser?.role === 'teacher' ||
    currentUser?.role === 'secretariat' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'director';

  const saveEventsUpdated = (updated: AcademicEvent[]) => {
    setEvents(updated);
    saveEvents(updated);
  };

  // Click on calendar date -> Open Event Scheduler modal for that date
  const handleDateClick = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setNewStartDate(dateStr);
    setNewEndDate(dateStr);
    setNewTitle('');
    setNewMessage('');
    setNewLocation('Bloco Principal');
    setNewRoomNumber('Sala 01');
    setNewTargetAudience('Todos os Colaboradores');
    setSelectedRecipientIds(schoolEmployees.map((e) => e.id)); // Default all selected
    setIsModalOpen(true);
  };

  const handleToggleRecipient = (empId: string) => {
    if (selectedRecipientIds.includes(empId)) {
      setSelectedRecipientIds(selectedRecipientIds.filter((id) => id !== empId));
    } else {
      setSelectedRecipientIds([...selectedRecipientIds, empId]);
    }
  };

  const handleSelectAllRecipients = () => {
    if (selectedRecipientIds.length === schoolEmployees.length) {
      setSelectedRecipientIds([]);
    } else {
      setSelectedRecipientIds(schoolEmployees.map((e) => e.id));
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStartDate || !newEndDate) {
      alert('Por favor preencha a data de início, data final e o título do evento.');
      return;
    }

    const selectedRecipients = schoolEmployees
      .filter((emp) => selectedRecipientIds.includes(emp.id))
      .map((emp) => ({
        id: emp.id,
        name: emp.name,
        role: emp.roleFunction || 'Colaborador',
        email: emp.email,
      }));

    const newEvt: AcademicEvent = {
      id: `evt-${Date.now()}`,
      title: newTitle.trim(),
      description: newMessage.trim(),
      message: newMessage.trim(),
      date: newStartDate,
      startDate: newStartDate,
      endDate: newEndDate,
      location: newLocation.trim() || 'Edifício Escolar',
      roomNumber: newRoomNumber.trim() || 'Sala Geral',
      targetAudience: newTargetAudience,
      category: newCategory,
      recipients: selectedRecipients,
      creatorName: currentUser?.name || 'Gestor Escolar',
      creatorRole: currentUser?.role || 'pedagogical',
      createdAt: new Date().toLocaleString('pt-PT'),
    };

    const updatedEvents = [newEvt, ...events];
    saveEventsUpdated(updatedEvents);

    // Create notifications for selected recipients
    if (selectedRecipients.length > 0) {
      createNotificationForEvent(
        newEvt,
        currentUser?.name || 'Direcção da Escola',
        currentUser?.role || 'Pedagógico',
        selectedRecipients
      );
    }

    // Trigger Notification Toast
    setToastNotification(`Você tem uma mensagem nova: "${newTitle}" foi enviada a ${selectedRecipients.length} colaboradores.`);
    setTimeout(() => setToastNotification(null), 7000);

    setIsModalOpen(false);
    setShowRecipientSelector(false);
  };

  const handleDeleteEvent = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Tem certeza que deseja remover este evento do calendário?')) {
      saveEventsUpdated(events.filter((ev) => ev.id !== id));
    }
  };

  // Month navigation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'feriado':
        return <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">Feriado Nacional</span>;
      case 'prazo':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">Prazo / Entrega</span>;
      case 'reuniao':
        return <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">Reunião Pedagógica</span>;
      default:
        return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap">Evento Escolar</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in font-sans">
      {/* Toast Notification Alert */}
      {toastNotification && (
        <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-amber-300 animate-bounce" />
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-amber-200">Notificação Enviada</p>
              <p className="text-sm font-bold">{toastNotification}</p>
            </div>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="p-1.5 hover:bg-emerald-700 rounded-lg text-white"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
            <button onClick={() => window.history.back()} className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl transition-colors border border-slate-200 shadow-2xs">
                <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 font-serif">
                <CalendarIcon className="text-blue-600" size={24} />
                Calendário Académico & Configuração de Trimestres
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl font-medium">
                Agendamento de eventos, avisos e configuração de início/fim de trimestres, férias e bloqueios do Livro de Turma Digital.
              </p>
            </div>
        </div>

        {/* Subtab Switcher */}
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveCalendarSubTab('events')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCalendarSubTab === 'events'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CalendarIcon size={16} />
            <span>Calendário & Eventos</span>
          </button>

          <button
            onClick={() => setActiveCalendarSubTab('config')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCalendarSubTab === 'config'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Clock size={16} />
            <span>Configuração do Diretor (Bloqueios)</span>
          </button>
        </div>
      </div>

      {activeCalendarSubTab === 'config' ? (
        <SchoolCalendarConfigManager />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            {canManageEvents && (
              <Button
                onClick={() => {
                  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
                  handleDateClick(todayStr);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 text-xs py-3 px-5 rounded-xl shadow-sm whitespace-nowrap"
              >
                <Plus size={16} />
                Agendar Novo Evento / Mensagem
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Grid View (Left Column) */}
        <Card className="lg:col-span-8 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-slate-900 font-serif">
              {monthNames[month]} {year}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors border border-slate-200/60 shadow-2xs"
                title="Mês Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors border border-slate-200/60 shadow-2xs"
                title="Próximo Mês"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-3 mb-3 text-center text-xs font-black text-slate-700 uppercase tracking-wider">
            <div>DOM</div>
            <div>SEG</div>
            <div>TER</div>
            <div>QUA</div>
            <div>QUI</div>
            <div>SEX</div>
            <div>SÁB</div>
          </div>

          <div className="grid grid-cols-7 gap-3">
            {/* Empty slots for previous month offset */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-28 bg-slate-50/40 rounded-2xl border border-slate-100"></div>
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = events.filter((e) => e.date === dateStr || (e.startDate <= dateStr && dateStr <= e.endDate));
              const isSelected = selectedDateStr === dateStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDateClick(dateStr)}
                  className={`h-28 p-2.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer overflow-hidden group ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-2 ring-blue-100'
                      : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/70 bg-white'
                  }`}
                  title="Clique para agendar evento nesta data"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                    )}
                  </div>

                  <div className="space-y-1 overflow-y-auto max-h-16 custom-scrollbar">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setReadingEvent(ev);
                        }}
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded truncate transition-transform hover:scale-102 text-center ${
                          ev.category === 'feriado'
                            ? 'bg-rose-100 text-rose-800'
                            : ev.category === 'prazo'
                            ? 'bg-amber-100 text-amber-900'
                            : ev.category === 'reuniao'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                        title={`${ev.title} (Clique para abrir no modo de leitura)`}
                      >
                        {ev.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Events List Sidebar (Right Column) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock size={16} className="text-blue-600" />
                EVENTOS DO MÊS
              </span>
              <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">
                {monthNames[month]} {year}
              </span>
            </h3>

            <div className="space-y-3.5 max-h-[520px] overflow-y-auto custom-scrollbar pr-1">
              {(selectedDateStr
                ? events.filter((e) => e.date === selectedDateStr || (e.startDate <= selectedDateStr && selectedDateStr <= e.endDate))
                : events.filter((e) => e.date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`) || e.startDate?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
              ).length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  Nenhum evento agendado. Clique numa data para criar um agendamento.
                </div>
              ) : (
                (selectedDateStr
                  ? events.filter((e) => e.date === selectedDateStr || (e.startDate <= selectedDateStr && selectedDateStr <= e.endDate))
                  : events.filter((e) => e.date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`) || e.startDate?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
                ).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setReadingEvent(ev)}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:bg-blue-50/40 cursor-pointer transition-all relative group shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-black text-slate-900 line-clamp-1">{ev.title}</span>
                      {getCategoryBadge(ev.category)}
                    </div>

                    <div className="space-y-1.5 text-[11px] text-slate-600">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <MapPin size={13} className="text-blue-600 shrink-0" />
                        <span>{ev.location || 'Local Não Definido'} • <strong className="text-slate-900">Sala: {ev.roomNumber || 'N/A'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 font-medium">
                        <Users size={13} className="text-emerald-600 shrink-0" />
                        <span>Público: <strong className="text-slate-900">{ev.targetAudience || 'Geral'}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <span className="font-mono text-[10px]">{ev.startDate === ev.endDate ? ev.startDate : `${ev.startDate} - ${ev.endDate}`}</span>
                      <span className="font-bold text-blue-600 flex items-center gap-1 text-[11px] hover:underline">
                        <Eye size={12} /> Ler mensagem
                      </span>
                    </div>

                    {canManageEvents && (
                      <button
                        onClick={(e) => handleDeleteEvent(ev.id, e)}
                        className="absolute top-2 right-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white hover:bg-rose-50 rounded-lg shadow-xs"
                        title="Remover Evento"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {selectedDateStr && (
              <button
                onClick={() => setSelectedDateStr(null)}
                className="w-full mt-4 text-xs font-bold text-blue-600 hover:underline text-center"
              >
                Ver todos os eventos do mês
              </button>
            )}
          </Card>
        </div>
      </div>

      {/* MODAL 1: FORMULÁRIO DE AGENDAMENTO DE EVENTO E MENSAGEM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75  flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                  <CalendarIcon size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Agendar Novo Evento & Mensagem</h3>
                  <p className="text-xs text-slate-500">Preencha os detalhes do evento e selecione os colaboradores destinatários.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setShowRecipientSelector(false);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-5">
              {/* Título */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Título do Evento / Assunto da Mensagem *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Reunião do Conselho Pedagógico - Avaliação Trimestral"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Datas de Início e Término */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Data de Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Data Final *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Lugar e Número da Sala */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <MapPin size={14} className="text-blue-600" /> Lugar / Localização *
                  </label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Ex: Bloco Administrativo ou Auditório Central"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <DoorOpen size={14} className="text-blue-600" /> Número da Sala *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRoomNumber}
                    onChange={(e) => setNewRoomNumber(e.target.value)}
                    placeholder="Ex: Sala 12 ou Sala de Reuniões 02"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Público-Alvo e Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Users size={14} className="text-emerald-600" /> Público-Alvo do Evento *
                  </label>
                  <select
                    value={newTargetAudience}
                    onChange={(e) => setNewTargetAudience(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
                  >
                    <option value="Todos os Colaboradores">Todos os Colaboradores</option>
                    <option value="Corpo Docente (Professores)">Corpo Docente (Professores)</option>
                    <option value="Directores de Turma">Directores de Turma</option>
                    <option value="Estudantes">Estudantes</option>
                    <option value="Encarregados de Educação">Encarregados de Educação</option>
                    <option value="Comunidade Escolar Geral">Comunidade Escolar Geral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Categoria do Evento *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
                  >
                    <option value="evento">Evento Escolar</option>
                    <option value="reuniao">Reunião Pedagógica</option>
                    <option value="prazo">Prazo de Entrega / Avaliação</option>
                    <option value="feriado">Feriado Nacional</option>
                  </select>
                </div>
              </div>

              {/* Campo para o Texto / Mensagem */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Texto da Mensagem / Detalhes do Agendamento *
                </label>
                <textarea
                  rows={4}
                  required
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escreva a mensagem detalhada a enviar aos destinatários..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600"
                ></textarea>
              </div>

              {/* Botão SELECIONAR DESTINATÁRIOS */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                      Destinatários da Mensagem
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {selectedRecipientIds.length} de {schoolEmployees.length} colaboradores selecionados
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setShowRecipientSelector(!showRecipientSelector)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl gap-2 shadow-sm"
                  >
                    <Users size={14} />
                    SELECIONAR DESTINATÁRIOS
                  </Button>
                </div>

                {/* Seleção de Destinatários Modal / Accordion */}
                {showRecipientSelector && (
                  <div className="mt-3 p-4 bg-white rounded-xl border border-indigo-200 shadow-inner space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-700">Lista de Colaboradores da Instituição</span>
                      <button
                        type="button"
                        onClick={handleSelectAllRecipients}
                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        {selectedRecipientIds.length === schoolEmployees.length ? (
                          <>
                            <CheckSquare size={14} /> Desmarcar Todos
                          </>
                        ) : (
                          <>
                            <Square size={14} /> Selecionar Todos
                          </>
                        )}
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                      {schoolEmployees.map((emp) => {
                        const isChecked = selectedRecipientIds.includes(emp.id);
                        return (
                          <div
                            key={emp.id}
                            onClick={() => handleToggleRecipient(emp.id)}
                            className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {isChecked ? (
                                <CheckSquare size={16} className="text-indigo-600 shrink-0" />
                              ) : (
                                <Square size={16} className="text-slate-400 shrink-0" />
                              )}
                              <div>
                                <p className="text-xs font-bold">{emp.name}</p>
                                <p className="text-[10px] text-slate-500">{emp.roleFunction || emp.career} • {emp.email}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded border text-slate-600">
                              {emp.department || 'Docente'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md gap-2"
                >
                  <Send size={16} />
                  Agendar Evento & Enviar Notificação
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: MODO DE LEITURA (Abrir mensagem em Modo de Leitura) */}
      {readingEvent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80  flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl">
                  <FileText size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    Modo de Leitura Oficial
                  </span>
                  <h3 className="text-xl font-black text-slate-900 mt-1">{readingEvent.title}</h3>
                </div>
              </div>
              <button
                onClick={() => setReadingEvent(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="py-6 space-y-6">
              {/* Event Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data de Início</span>
                  <strong className="text-slate-900 text-sm font-black">{readingEvent.startDate || readingEvent.date}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data Final</span>
                  <strong className="text-slate-900 text-sm font-black">{readingEvent.endDate || readingEvent.date}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lugar / Local</span>
                  <strong className="text-blue-700 font-bold">{readingEvent.location || 'Local Geral'}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Número da Sala</span>
                  <strong className="text-slate-900 font-bold">{readingEvent.roomNumber || '01'}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Público-Alvo</span>
                  <strong className="text-emerald-700 font-bold">{readingEvent.targetAudience || 'Geral'}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remetente</span>
                  <strong className="text-slate-900 font-bold">{readingEvent.creatorName}</strong>
                </div>
              </div>

              {/* Full Text Message */}
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Mensagem do Evento</h4>
                <div className="p-5 bg-slate-900 text-slate-100 rounded-2xl font-sans text-sm leading-relaxed border border-slate-800 shadow-inner">
                  {readingEvent.message || readingEvent.description || 'Nenhum detalhe adicional fornecido.'}
                </div>
              </div>

              {/* Recipients list if available */}
              {readingEvent.recipients && readingEvent.recipients.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                    Destinatários Notificados ({readingEvent.recipients.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                    {readingEvent.recipients.map((r, idx) => (
                      <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold px-2.5 py-1 rounded-lg">
                        {r.name} ({r.role})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button
                onClick={() => setReadingEvent(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md"
              >
                Fechar Leitura
              </Button>
            </div>
          </Card>
        </div>
      )}
        </div>
      )}
    </div>
  );
};
