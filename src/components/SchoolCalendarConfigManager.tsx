import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  getStoredSchoolCalendarConfig, 
  saveSchoolCalendarConfig, 
  SchoolCalendarConfig,
  TrimesterPeriodConfig,
  VacationPeriodConfig,
  NationalExamPeriodConfig
} from '../utils/schoolCalendarStore';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Lock, 
  Unlock, 
  Save, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  Award, 
  Plus, 
  Trash2,
  HelpCircle,
  FileText,
  Sparkles
} from 'lucide-react';

export function SchoolCalendarConfigManager() {
  const { currentUser, sendNotification } = useStore();
  const [config, setConfig] = useState<SchoolCalendarConfig>(() => getStoredSchoolCalendarConfig());
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const isDirectorOrPedagogical = 
    currentUser?.role === 'director' || 
    currentUser?.role === 'pedagogical' || 
    currentUser?.role === 'admin';

  const handleUpdateTrimester = (
    trimesterNum: 1 | 2 | 3, 
    field: keyof TrimesterPeriodConfig, 
    value: any
  ) => {
    setConfig(prev => ({
      ...prev,
      trimesters: prev.trimesters.map(t => {
        if (t.trimester === trimesterNum) {
          return { ...t, [field]: value };
        }
        return t;
      })
    }));
  };

  const handleUpdateVacation = (id: string, field: keyof VacationPeriodConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      vacations: prev.vacations.map(v => {
        if (v.id === id) {
          return { ...v, [field]: value };
        }
        return v;
      })
    }));
  };

  const handleUpdateExam = (id: string, field: keyof NationalExamPeriodConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      nationalExams: prev.nationalExams.map(e => {
        if (e.id === id) {
          return { ...e, [field]: value };
        }
        return e;
      })
    }));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    saveSchoolCalendarConfig({
      ...config,
      updatedBy: currentUser?.name || 'Diretor da Escola',
    });

    sendNotification({
      title: 'Calendário Escolar e Trimestres Atualizados',
      message: `O Diretor da Escola (${currentUser?.name}) atualizou as datas oficiais do Calendário Escolar 2026 e restrições do Livro de Turma Digital.`,
      senderName: currentUser?.name || 'Direção da Escola',
      senderRole: currentUser?.role || 'director',
      targetAudience: 'professores',
      priority: 'importante',
      category: 'Geral',
      targetLocation: 'calendar'
    });

    setSaveSuccessMsg('Configuração do Calendário Escolar guardada com sucesso! Os bloqueios automáticos no Livro de Turma Digital já estão ativos.');
    setTimeout(() => setSaveSuccessMsg(''), 5000);
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300 font-sans">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 mb-1">
            <ShieldCheck className="w-5 h-5 text-blue-700" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Configuração Ministerial • Regulamento de Calendário Escolar
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Configuração do Calendário Escolar & Bloqueios do Livro de Turma
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Definição oficial do início e fim dos trimestres, períodos de férias e exames nacionais com vinculação automática de bloqueio no Livro de Turma Digital.
          </p>
        </div>

        {isDirectorOrPedagogical && (
          <button
            onClick={handleSaveAll}
            className="px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-blue-900/20 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Save size={16} /> Guardar Calendário & Ativar Bloqueios
          </button>
        )}
      </div>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-400 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Configuration Form */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        
        {/* SECTION 1: TRIMESTRES LETIVOS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                <CalendarIcon size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  1. Definição de Trimestres Letivos & Estado de Trancamento
                </h3>
                <p className="text-xs text-slate-500">
                  Professores ficam automaticamente impedidos de lançar sumários/notas fora destas datas ou se o trimestre estiver trancado.
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
              Ano Lectivo {config.academicYear}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {config.trimesters.map(t => (
              <div 
                key={t.trimester}
                className={`p-5 rounded-2xl border transition-all space-y-4 ${
                  t.isLocked 
                    ? 'bg-rose-50/70 border-rose-300' 
                    : 'bg-slate-50/80 border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900">
                    {t.trimester}º Trimestre Letivo
                  </span>

                  <button
                    type="button"
                    onClick={() => handleUpdateTrimester(t.trimester, 'isLocked', !t.isLocked)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      t.isLocked
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    }`}
                  >
                    {t.isLocked ? (
                      <>
                        <Lock size={13} /> Trancado / Bloqueado
                      </>
                    ) : (
                      <>
                        <Unlock size={13} /> Aberto para Lançamentos
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Data de Início do {t.trimester}º Trimestre:
                    </label>
                    <input
                      type="date"
                      required
                      value={t.startDate}
                      onChange={e => handleUpdateTrimester(t.trimester, 'startDate', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Data de Fim do {t.trimester}º Trimestre:
                    </label>
                    <input
                      type="date"
                      required
                      value={t.endDate}
                      onChange={e => handleUpdateTrimester(t.trimester, 'endDate', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {t.isLocked && (
                  <p className="text-[11px] font-bold text-rose-800 bg-rose-100/80 p-2 rounded-lg text-center border border-rose-200">
                    ⚠️ Lançamentos e alterações no Livro de Turma estão trancados neste trimestre.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: PERÍODOS DE FÉRIAS E INTERRUPÇÕES */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  2. Períodos de Férias Escolares & Interrupções Letivas
                </h3>
                <p className="text-xs text-slate-500">
                  O Livro de Turma Digital bloqueia automaticamente lançamentos de sumários em datas dentro destes intervalos.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {config.vacations.map(vac => (
              <div key={vac.id} className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                <span className="font-extrabold text-xs uppercase tracking-wider text-amber-950 block">
                  {vac.name}
                </span>

                <div>
                  <label className="block text-[11px] font-bold text-amber-900 uppercase mb-1">
                    Início das Férias:
                  </label>
                  <input
                    type="date"
                    required
                    value={vac.startDate}
                    onChange={e => handleUpdateVacation(vac.id, 'startDate', e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-900 uppercase mb-1">
                    Fim das Férias:
                  </label>
                  <input
                    type="date"
                    required
                    value={vac.endDate}
                    onChange={e => handleUpdateVacation(vac.id, 'endDate', e.target.value)}
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: DATAS DE EXAMES NACIONAIS */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 text-purple-900 rounded-xl">
                <Award size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  3. Épocas de Exames Nacionais (3ª, 6ª, 9ª e 12ª Classes)
                </h3>
                <p className="text-xs text-slate-500">
                  Calendário regulamentar dos exames nacionais do Sistema Nacional de Educação (SNE).
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {config.nationalExams.map(exam => (
              <div key={exam.id} className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs uppercase tracking-wider text-purple-950">
                    {exam.title}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-200 text-purple-950 font-black text-[10px]">
                    {exam.phase}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-purple-900 uppercase mb-1">
                      Data Início Exames:
                    </label>
                    <input
                      type="date"
                      required
                      value={exam.startDate}
                      onChange={e => handleUpdateExam(exam.id, 'startDate', e.target.value)}
                      className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-purple-900 uppercase mb-1">
                      Data Fim Exames:
                    </label>
                    <input
                      type="date"
                      required
                      value={exam.endDate}
                      onChange={e => handleUpdateExam(exam.id, 'endDate', e.target.value)}
                      className="w-full bg-white border border-purple-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Bar */}
        {isDirectorOrPedagogical && (
          <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <Sparkles size={16} className="text-amber-400" />
              <span>Garantia de conformidade regimental MINEDH • Atualizado por {config.updatedBy || 'Diretor'}</span>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
            >
              Guardar Definições de Calendário
            </button>
          </div>
        )}

      </form>
    </div>
  );
}
