import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { 
  FileText, 
  Layers, 
  Calendar, 
  User, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Search, 
  Plus, 
  Filter, 
  Award, 
  Printer, 
  ShieldCheck, 
  Sparkles, 
  Send,
  GraduationCap,
  ChevronDown,
  Info,
  Check
} from 'lucide-react';
import { DigitalLessonRecord } from '../types';

interface LessonPlannerManagerProps {
  initialMode?: 'plano_aula' | 'gestao_aulas';
  overrideRole?: 'teacher' | 'pedagogical' | 'director';
}

export function LessonPlannerManager({ initialMode = 'plano_aula', overrideRole }: LessonPlannerManagerProps) {
  const { 
    currentUser, 
    classes = [], 
    subjects = [], 
    assignments = [], 
    digitalLessonRecords = [],
    addDigitalLessonRecord,
    pedagogicalVisaLessonRecord,
    employees = []
  } = useStore();

  const userRole = overrideRole || currentUser?.role || 'teacher';
  const isTeacher = userRole === 'teacher';
  const isPedagogical = userRole === 'pedagogical' || userRole === 'director';

  const [activeTab, setActiveTab] = useState<'plano_aula' | 'gestao_aulas'>(
    isPedagogical ? 'gestao_aulas' : initialMode
  );

  // Form state for creating a new Lesson Plan
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  // Teacher's assigned classes
  const teacherClasses = useMemo(() => {
    if (isTeacher) {
      const assignedClassIds = assignments
        .filter(a => a.teacherId === currentUser?.id || a.teacherName === currentUser?.name)
        .map(a => a.classId);
      return classes.filter(c => assignedClassIds.includes(c.id));
    }
    return classes;
  }, [isTeacher, assignments, currentUser, classes]);

  const [selectedClassId, setSelectedClassId] = useState<string>(
    teacherClasses[0]?.id || classes[0]?.id || ''
  );

  const availableSubjects = useMemo(() => {
    const classAssignments = assignments.filter(a => a.classId === selectedClassId);
    if (isTeacher) {
      const teacherSubs = classAssignments.filter(a => a.teacherId === currentUser?.id || a.teacherName === currentUser?.name);
      if (teacherSubs.length > 0) {
        return subjects.filter(s => teacherSubs.some(t => t.subjectId === s.id));
      }
    }
    return subjects.filter(s => classAssignments.some(a => a.subjectId === s.id));
  }, [assignments, selectedClassId, isTeacher, currentUser, subjects]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    availableSubjects[0]?.id || subjects[0]?.id || ''
  );

  const [planForm, setPlanForm] = useState({
    date: todayStr,
    trimester: 1 as 1 | 2 | 3,
    lessonNumber: digitalLessonRecords.length + 1,
    lessonSlot: '1º e 2º Tempos (07:00 - 08:35)',
    unitTopic: '',
    topic: '',
    objectives: '',
    methodology: 'Expositivo, Elaboração Conjunta e Resolução de Exercícios',
    resources: 'Livro do Aluno, Quadro, Fichas de Leitura e Material Didático',
    homework: '',
    teacherName: currentUser?.name || 'Docente Titular',
  });

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Gestão das Aulas Filters
  const [filterTeacher, setFilterTeacher] = useState<string>('todos');
  const [filterClass, setFilterClass] = useState<string>('todos');
  const [filterSubject, setFilterSubject] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // List of unique teacher names for filter
  const teacherList = useMemo(() => {
    const names = new Set<string>();
    digitalLessonRecords.forEach(l => {
      if (l.teacherName) names.add(l.teacherName);
    });
    if (currentUser?.name) names.add(currentUser.name);
    return Array.from(names);
  }, [digitalLessonRecords, currentUser]);

  // Submit Lesson Plan -> Saves to Pedagogical Repository
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();

    if (!planForm.topic.trim()) {
      alert('Por favor, informe o Tema da Aula / Conteúdo a lecionar.');
      return;
    }

    const currentClassObj = classes.find(c => c.id === selectedClassId);
    const currentSubjectObj = subjects.find(s => s.id === selectedSubjectId);

    const newRecord: Omit<DigitalLessonRecord, 'id' | 'createdAt'> = {
      assignmentId: `as-${selectedClassId}-${selectedSubjectId}`,
      classId: selectedClassId,
      className: currentClassObj?.name || 'Turma',
      subjectId: selectedSubjectId,
      subjectName: currentSubjectObj?.name || 'Disciplina',
      teacherId: currentUser?.id || 'u4',
      teacherName: planForm.teacherName || currentUser?.name || 'Prof. Titular',
      schoolId: currentUser?.schoolId || 's1',
      date: planForm.date,
      dayOfWeek: 'Segunda-feira',
      trimester: planForm.trimester,
      academicYear: 2026,
      lessonNumber: Number(planForm.lessonNumber),
      lessonSlot: planForm.lessonSlot,
      unitTopic: planForm.unitTopic || 'Unidade Temática Curricular MINEDH',
      topic: planForm.topic,
      objectives: planForm.objectives || 'Aquisição de competências e objetivos curriculares',
      homework: planForm.homework || 'Exercícios de consolidação',
      pedagogicalObservations: `[MÉTODOS: ${planForm.methodology}] [MEIOS: ${planForm.resources}]`,
      teacherAssiduity: 'present',
      teacherSignedAt: new Date().toISOString(),
      teacherSignatureStamp: `MINEDH-PLANO-${Math.floor(100000 + Math.random() * 900000)}`,
      attendanceRecords: [],
      attendanceSummary: {
        totalStudents: 35,
        presentCount: 35,
        justifiedAbsenceCount: 0,
        unjustifiedAbsenceCount: 0,
        lateCount: 0,
        attendanceRate: 100,
      },
      pedagogicalVisa: {
        status: 'pendente',
        reviewedBy: '',
        reviewedAt: '',
        observation: '',
      }
    };

    addDigitalLessonRecord(newRecord);
    setFeedbackMsg({
      text: `Plano de Aula da classe ${currentClassObj?.name} lecionado em ${planForm.date} foi guardado com sucesso na Sessão Pedagógica!`,
      type: 'success'
    });

    // Reset form
    setPlanForm(prev => ({
      ...prev,
      lessonNumber: Number(prev.lessonNumber) + 1,
      topic: '',
      objectives: '',
      homework: '',
    }));

    setTimeout(() => {
      setFeedbackMsg(null);
      setActiveTab('gestao_aulas');
    }, 1500);
  };

  // Filtered Lesson Plans for Gestão das Aulas
  const filteredLessonPlans = useMemo(() => {
    return digitalLessonRecords
      .filter(l => {
        if (filterTeacher !== 'todos' && l.teacherName !== filterTeacher) return false;
        if (filterClass !== 'todos' && l.classId !== filterClass && l.className !== filterClass) return false;
        if (filterSubject !== 'todos' && l.subjectId !== filterSubject && l.subjectName !== filterSubject) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            l.topic.toLowerCase().includes(q) ||
            l.teacherName.toLowerCase().includes(q) ||
            l.className.toLowerCase().includes(q) ||
            l.subjectName.toLowerCase().includes(q) ||
            (l.unitTopic && l.unitTopic.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [digitalLessonRecords, filterTeacher, filterClass, filterSubject, searchQuery, sortOrder]);

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 mb-1">
            <Layers className="w-5 h-5 text-blue-700" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Sessão Pedagógica • Gestão de Planos de Aula MINEDH
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Plano de Aula & Gestão das Aulas Lecionadas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Elaboração de planos curriculares, arquivamento automático na Sessão Pedagógica e organização por data de lecionação.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveTab('plano_aula')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'plano_aula'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText size={16} />
            <span>Elaborar Plano de Aula</span>
          </button>

          <button
            onClick={() => setActiveTab('gestao_aulas')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'gestao_aulas'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers size={16} />
            <span>Gestão das Aulas ({filteredLessonPlans.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ELABORAÇÃO DO PLANO DE AULA */}
      {activeTab === 'plano_aula' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
                <FileText size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Formulário Oficial de Planificação da Aula
                </h3>
                <p className="text-xs text-slate-500">
                  Uma vez a aula planificada e dada, o plano é guardado automaticamente na Sessão Pedagógica.
                </p>
              </div>
            </div>

            <span className="text-xs font-extrabold px-3 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-300 font-mono">
              ANO LECTIVO 2026
            </span>
          </div>

          {feedbackMsg && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-400 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSavePlan} className="space-y-6">
            
            {/* Bloco 1: Identificação da Aula & Professor */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-50/80 rounded-2xl border border-slate-200">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Data de Lecionação *
                </label>
                <input
                  type="date"
                  required
                  value={planForm.date}
                  onChange={e => setPlanForm({ ...planForm, date: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Classe & Turma Lecionada *
                </label>
                <select
                  value={selectedClassId}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.gradeLevel || 'Ensino Geral'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Disciplina *
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={e => setSelectedSubjectId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {availableSubjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.area || 'Geral'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nome do Docente *
                </label>
                <input
                  type="text"
                  required
                  value={planForm.teacherName}
                  onChange={e => setPlanForm({ ...planForm, teacherName: e.target.value })}
                  placeholder="Nome do Professor..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  N.º da Lição / Aula
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={planForm.lessonNumber}
                  onChange={e => setPlanForm({ ...planForm, lessonNumber: Number(e.target.value) })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tempo Letivo
                </label>
                <select
                  value={planForm.lessonSlot}
                  onChange={e => setPlanForm({ ...planForm, lessonSlot: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="1º Tempo (07:00 - 07:45)">1º Tempo (07:00 - 07:45)</option>
                  <option value="2º Tempo (07:50 - 08:35)">2º Tempo (07:50 - 08:35)</option>
                  <option value="1º e 2º Tempos (07:00 - 08:35)">1º e 2º Tempos - Bloco Duplo (07:00 - 08:35)</option>
                  <option value="3º e 4º Tempos (08:45 - 10:20)">3º e 4º Tempos - Bloco Duplo (08:45 - 10:20)</option>
                  <option value="5º e 6º Tempos (10:30 - 12:05)">5º e 6º Tempos (10:30 - 12:05)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Unidade Temática (Programa MINEDH)
                </label>
                <input
                  type="text"
                  value={planForm.unitTopic}
                  onChange={e => setPlanForm({ ...planForm, unitTopic: e.target.value })}
                  placeholder="Ex: Unidade 2: Álgebra e Funções Quadráticas"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

            </div>

            {/* Bloco 2: Conteúdo, Objetivos e Métodos */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase mb-1 flex items-center justify-between">
                  <span>Tema da Aula / Conteúdo a Lecionar *</span>
                  <span className="text-slate-400 font-normal lowercase text-xs">Obrigatório para o plano pedagógico</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={planForm.topic}
                  onChange={e => setPlanForm({ ...planForm, topic: e.target.value })}
                  placeholder="Ex: Resolução de Equações Quadráticas incompletas através do método de fatorização e fórmula resolvente..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Objetivos de Aprendizagem & Competências Domínio
                  </label>
                  <textarea
                    rows={3}
                    value={planForm.objectives}
                    onChange={e => setPlanForm({ ...planForm, objectives: e.target.value })}
                    placeholder="Ex: O aluno identifica os termos a, b, c e aplica a fórmula para calcular as raízes da equação..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Estratégias / Métodos Didáticos
                  </label>
                  <textarea
                    rows={3}
                    value={planForm.methodology}
                    onChange={e => setPlanForm({ ...planForm, methodology: e.target.value })}
                    placeholder="Ex: Método expositivo interrogativo, elaboração conjunta, resolução de exercícios no quadro..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-3 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Meios & Recursos de Ensino
                  </label>
                  <input
                    type="text"
                    value={planForm.resources}
                    onChange={e => setPlanForm({ ...planForm, resources: e.target.value })}
                    placeholder="Ex: Livro de Matemática 10ª classe, giz, quadro, calculadoras..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Atividades de TPC & Avaliação Contínua
                  </label>
                  <input
                    type="text"
                    value={planForm.homework}
                    onChange={e => setPlanForm({ ...planForm, homework: e.target.value })}
                    placeholder="Ex: Resolver exercícios 4 e 5 da pág. 32 do livro do aluno..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Submit */}
            <div className="flex items-center justify-end pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-8 py-3.5 rounded-2xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Send size={16} />
                <span>Planificar & Concluir Aula (Guardar na Sessão Pedagógica)</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* TAB 2: GESTÃO DAS AULAS (SESSÃO PEDAGÓGICA) */}
      {activeTab === 'gestao_aulas' && (
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Layers size={18} className="text-blue-600" />
                  Repositório da Sessão Pedagógica • Aulas Organizadas por Data
                </h3>
                <p className="text-xs text-slate-500">
                  Planos de aula lecionados organizados por data de lecionação, nome do professor e classe/turma.
                </p>
              </div>

              {/* Order Toggle */}
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all self-start md:self-auto cursor-pointer"
              >
                <Calendar size={14} />
                <span>Data: {sortOrder === 'desc' ? 'Mais Recentes Primeiro' : 'Mais Antigas Primeiro'}</span>
              </button>
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              
              {/* Search */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por tema ou palavra..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Teacher Filter */}
              <div>
                <select
                  value={filterTeacher}
                  onChange={e => setFilterTeacher(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos os Professores ({teacherList.length})</option>
                  {teacherList.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Class Filter */}
              <div>
                <select
                  value={filterClass}
                  onChange={e => setFilterClass(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todas as Classes / Turmas ({classes.length})</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.gradeLevel || 'Geral'})</option>
                  ))}
                </select>
              </div>

              {/* Subject Filter */}
              <div>
                <select
                  value={filterSubject}
                  onChange={e => setFilterSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todas as Disciplinas ({subjects.length})</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Timeline List of Lesson Plans */}
          <div className="space-y-4">
            {filteredLessonPlans.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                <FileText size={48} className="mx-auto text-slate-300" />
                <h4 className="text-lg font-bold text-slate-800">Nenhum Plano de Aula Encontrado</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Não foram encontradas aulas arquivadas para os filtros selecionados. Altere os filtros ou elabore um novo plano de aula.
                </p>
              </div>
            ) : (
              filteredLessonPlans.map(plan => (
                <div 
                  key={plan.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:border-blue-300 transition-all space-y-4"
                >
                  {/* Top Line: Date, Teacher, Class & Subject Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="px-3 py-1 rounded-xl bg-blue-900 text-white font-mono font-black text-xs flex items-center gap-1.5 shadow-xs">
                        <Calendar size={13} /> {plan.date}
                      </span>

                      <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-900 font-extrabold text-xs flex items-center gap-1.5">
                        <User size={13} className="text-blue-600" /> {plan.teacherName}
                      </span>

                      <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-950 font-black text-xs border border-amber-300">
                        {plan.className}
                      </span>

                      <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-950 font-bold text-xs">
                        {plan.subjectName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {plan.pedagogicalVisa?.status === 'aprovado' ? (
                        <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1 border border-emerald-300">
                          <CheckCircle2 size={14} /> Visto DAP Concedido
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-800 font-bold text-xs border border-amber-300">
                          Pendente Visto Pedagógico
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Topic Content */}
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider mb-0.5">
                      Lição N.º {plan.lessonNumber} • {plan.unitTopic || 'Unidade Curricular MINEDH'}
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                      {plan.topic}
                    </h4>
                  </div>

                  {/* Objectives & Homework Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <span className="font-bold text-slate-700 block uppercase text-[10px] mb-1">
                        Objetivos de Aprendizagem:
                      </span>
                      <p className="text-slate-800 font-medium leading-relaxed">
                        {plan.objectives || 'Sem objetivos descritos.'}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block uppercase text-[10px] mb-1">
                        TPC & Tarefas de Casa:
                      </span>
                      <p className="text-slate-800 font-medium leading-relaxed">
                        {plan.homework || 'Exercícios de acompanhamento contínuo.'}
                      </p>
                    </div>
                  </div>

                  {/* Action Bar for DAP & Printing */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-[11px] font-mono text-slate-400 font-bold">
                      Selo de Registo: {plan.teacherSignatureStamp || 'MINEDH-PLANO-2026'}
                    </div>

                    <div className="flex items-center gap-2">
                      {isPedagogical && plan.pedagogicalVisa?.status !== 'aprovado' && (
                        <button
                          type="button"
                          onClick={() => {
                            pedagogicalVisaLessonRecord(plan.id, {
                              status: 'aprovado',
                              reviewedBy: currentUser?.name || 'Direção Pedagógica DAP',
                              observation: 'Plano de aula verificado e conforme com os objetivos curriculares.'
                            });
                          }}
                          className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Award size={14} /> Conceder Visto DAP
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer size={14} /> Imprimir Plano
                      </button>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
}
