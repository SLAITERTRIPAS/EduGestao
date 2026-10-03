import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Globe, Map, School as SchoolIcon, Send } from 'lucide-react';
import { useStore } from '../store';
import { CollectionPeriod } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const CalendarScheduler: React.FC = () => {
  const { collectionPeriods, addCollectionPeriod, currentUser } = useStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetLevel: 'school' as 'provincial' | 'district' | 'school',
    endDate: ''
  });

  if (!currentUser) return null;

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(clickedDate);
    setIsModalOpen(true);
    setFormData(prev => ({ ...prev, endDate: clickedDate.toISOString().split('T')[0] }));
  };

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !formData.title) return;

    addCollectionPeriod({
      title: formData.title,
      description: formData.description,
      startDate: selectedDate.toISOString().split('T')[0],
      endDate: formData.endDate,
      status: 'draft',
      createdByRole: currentUser.role,
      targetLevel: formData.targetLevel
    });

    setIsModalOpen(false);
    setFormData({ title: '', description: '', targetLevel: 'school', endDate: '' });
  };

  const renderDays = () => {
    const totalDays = daysInMonth(currentMonth);
    const startDay = firstDayOfMonth(currentMonth);
    const days = [];

    // Empty spaces for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50/50" />);
    }

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const dateStr = date.toISOString().split('T')[0];
      const periods = collectionPeriods.filter(p => p.startDate <= dateStr && p.endDate >= dateStr);

      days.push(
        <div 
          key={d} 
          onClick={() => handleDateClick(d)}
          className="h-24 border border-slate-100 p-2 hover:bg-slate-50 cursor-pointer transition-colors group relative"
        >
          <span className="text-sm font-medium text-slate-500 group-hover:text-blue-600">{d}</span>
          <div className="mt-1 space-y-1">
            {periods.map(p => (
              <div 
                key={p.id} 
                className={`text-[10px] p-1 rounded truncate shadow-sm border ${
                  p.status === 'published' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                    : 'bg-blue-50 text-blue-700 border-blue-100'
                }`}
              >
                {p.title}
              </div>
            ))}
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      );
    }

    return days;
  };

  const monthName = currentMonth.toLocaleString('pt-MZ', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Calendário de Recolha de Dados</h2>
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Agendamento de Períodos Estatísticos</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-bold text-slate-700 capitalize">{monthName}</h3>
          <div className="flex border rounded-lg overflow-hidden">
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
              className="p-2 hover:bg-slate-50 border-r"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
              className="p-2 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase border-r last:border-0">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 bg-white">
        {renderDays()}
      </div>

      <div className="p-4 border-t border-slate-100 flex justify-center">
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Emblem_of_Mozambique.svg/600px-Emblem_of_Mozambique.svg.png" 
          alt="Emblema da República de Moçambique" 
          className="h-12 w-12 object-contain opacity-50"
          referrerPolicy="no-referrer"
        />
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40  z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Novo Período de Recolha</h3>
                    <p className="text-xs text-slate-500">Início: {selectedDate?.toLocaleDateString('pt-MZ')}</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSchedule} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Título do Período</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: Recolha do 2º Trimestre 2026"
                    value={formData.title}
                    onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Descrição</label>
                  <textarea 
                    rows={3}
                    placeholder="Instruções para as províncias/escolas..."
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nível Alvo</label>
                    <select 
                      value={formData.targetLevel}
                      onChange={e => setFormData(prev => ({ ...prev, targetLevel: e.target.value as any }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none bg-no-repeat bg-right"
                    >
                      <option value="school">Escolas</option>
                      <option value="district">Distritos</option>
                      <option value="provincial">Provincial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Data de Fim</label>
                    <input 
                      required
                      type="date" 
                      value={formData.endDate}
                      onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group"
                  >
                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Publicar Período de Recolha
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
