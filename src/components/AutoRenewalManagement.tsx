import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Student, SchoolTransitionBatch, IssuedCertificate, Class } from '../types';
import { Button } from './ui';
import { 
  RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, FileText, Award, 
  Download, Search, Filter, ShieldCheck, School as SchoolIcon, UserCheck, 
  Send, Users, Eye, Check, X, QrCode, FileCheck, Layers, ChevronRight, Receipt,
  Stethoscope, LayoutGrid, List, ChevronDown, ChevronUp, GraduationCap, Sparkles
} from 'lucide-react';
import { 
  generateUnifiedAcademicHistoryPDF, 
  generateOfficialCertificatePDF, 
  generateSchoolTransitionListPDF,
  generateEnrollmentReceiptPDF
} from '../utils/pdfGenerator';
import { formatDocumentReference } from '../utils/iueGenerator';
import { EnrollmentReceiptDocument } from './EnrollmentReceiptDocument';
import { MedicalCertificateDocument } from './MedicalCertificateDocument';

interface AutoRenewalManagementProps {
  currentSchoolId?: string;
  onViewStudentProcess?: (student: Student) => void;
  onViewCertificate?: (student: Student, cert: IssuedCertificate) => void;
}

export function AutoRenewalManagement({
  currentSchoolId,
  onViewStudentProcess,
  onViewCertificate
}: AutoRenewalManagementProps) {
  const store = useStore();
  const activeSchoolId = currentSchoolId || store.currentUser?.schoolId || store.schools[0]?.id || 's1';
  const currentSchool = store.schools.find(s => s.id === activeSchoolId) || store.schools[0];

  const [activeTab, setActiveTab] = useState<'renewal' | 'transitions' | 'new_admissions' | 'certificates'>('renewal');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'active' | 'graduated' | 'retained'>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('all');
  const [selectedTurmaFilter, setSelectedTurmaFilter] = useState<string>('all');
  const [viewLayout, setViewLayout] = useState<'by_class_turma' | 'flat_list'>('by_class_turma');
  const [collapsedTurmas, setCollapsedTurmas] = useState<Record<string, boolean>>({});

  const [isExecutingRenewal, setIsExecutingRenewal] = useState(false);
  const [renewalSuccessMsg, setRenewalSuccessMsg] = useState<string | null>(null);

  // Modal para Validação de Matrícula (Operador de Secretaria)
  const [selectedStudentForValidation, setSelectedStudentForValidation] = useState<Student | null>(null);
  const [selectedStudentForReceipt, setSelectedStudentForReceipt] = useState<Student | null>(null);
  const [selectedStudentForMedical, setSelectedStudentForMedical] = useState<Student | null>(null);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({
    birthCertificate: true,
    idCardCopy: true,
    vaccinationCard: true,
    previousYearDeclaration: true,
    enrollmentForm: true,
    passportPhotos: true
  });

  // Modal para Alocação de Novo Ingresso no Destino
  const [selectedNewAdmission, setSelectedNewAdmission] = useState<Student | null>(null);
  const [targetClassId, setTargetClassId] = useState<string>('');

  // Modal para QR Code
  const [selectedQrCodeStudent, setSelectedQrCodeStudent] = useState<Student | null>(null);

  // Alunos da escola atual
  const schoolStudents = store.students.filter(s => s.schoolId === activeSchoolId);
  const schoolClasses = store.classes.filter(c => c.schoolId === activeSchoolId);

  // Extrair classes e turmas únicas
  const availableGradeLevels = useMemo(() => {
    const gradesSet = new Set<string>();
    schoolClasses.forEach(c => {
      if (c.gradeLevel) gradesSet.add(c.gradeLevel);
    });
    schoolStudents.forEach(s => {
      if (s.entryGrade) gradesSet.add(s.entryGrade);
    });
    return Array.from(gradesSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [schoolClasses, schoolStudents]);

  // Transições emitidas pela escola atual ou recebidas
  const sentBatches = (store.transitionBatches || []).filter(b => b.sourceSchoolId === activeSchoolId);
  const receivedBatches = (store.transitionBatches || []).filter(b => b.targetSchoolId === activeSchoolId);

  // Novos Ingressos recebidos por transição aguardando matrícula
  const newAdmissionsAwaiting = store.students.filter(
    s => s.schoolId === activeSchoolId && s.transitionStatus === 'vacancy_confirmed' && (!s.classId || s.reactivationStatus === 'AGUARDANDO REATIVAÇÃO')
  );

  // Certificados da escola
  const schoolCertificates = (store.issuedCertificates || []).filter(
    c => schoolStudents.some(s => s.id === c.studentId) || c.schoolName === currentSchool?.name
  );

  // Contadores
  const totalActive = schoolStudents.length;
  const pendingValidationCount = schoolStudents.filter(s => s.reactivationStatus === 'PENDENTE DE REATIVAÇÃO' || s.reactivationStatus === 'AGUARDANDO REATIVAÇÃO').length;
  const activatedCount = schoolStudents.filter(s => s.reactivationStatus === 'MATRICULA_ATIVA' || s.enrollmentStatus === 'Activo').length;
  const graduatedCount = schoolStudents.filter(s => s.enrollmentStatus === 'Concluído' || s.transitionStatus === 'awaiting_vacancy_confirmation').length;

  // Toggle colapso da turma
  const toggleTurmaCollapse = (classId: string) => {
    setCollapsedTurmas(prev => ({ ...prev, [classId]: !prev[classId] }));
  };

  // Validar Todos os Alunos de uma Turma
  const handleValidateBatchTurma = (classId: string) => {
    const studentsInTurma = schoolStudents.filter(s => s.classId === classId && (s.reactivationStatus === 'PENDENTE DE REATIVAÇÃO' || s.reactivationStatus === 'AGUARDANDO REATIVAÇÃO'));
    if (studentsInTurma.length === 0) return;
    studentsInTurma.forEach(st => {
      store.validateAndActivateEnrollment(st.id, checkedDocs);
    });
    setRenewalSuccessMsg(`Foram validadas com sucesso as matrículas de ${studentsInTurma.length} alunos da turma.`);
  };

  // Filtragem de alunos
  const filteredStudents = schoolStudents.filter(st => {
    const matchSearch = st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.iue && st.iue.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (st.nim && st.nim.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    // Filtro por Classe
    const studentClass = schoolClasses.find(c => c.id === st.classId);
    const studentGrade = studentClass?.gradeLevel || st.entryGrade;
    if (selectedGradeFilter !== 'all' && studentGrade !== selectedGradeFilter) {
      return false;
    }

    // Filtro por Turma
    if (selectedTurmaFilter !== 'all' && st.classId !== selectedTurmaFilter) {
      return false;
    }

    if (filterStatus === 'pending') {
      return st.reactivationStatus === 'PENDENTE DE REATIVAÇÃO' || st.reactivationStatus === 'AGUARDANDO REATIVAÇÃO';
    }
    if (filterStatus === 'active') {
      return st.reactivationStatus === 'MATRICULA_ATIVA';
    }
    if (filterStatus === 'graduated') {
      return st.enrollmentStatus === 'Concluído' || st.transitionStatus === 'awaiting_vacancy_confirmation';
    }
    if (filterStatus === 'retained') {
      return st.entryType === 'repetente';
    }
    return true;
  });

  // Agrupamento hierárquico por Classe -> Turma
  const groupedByGradeAndTurma = useMemo(() => {
    const groups: Record<string, { gradeLevel: string; classes: { schoolClass: Class; students: Student[] }[] }> = {};

    const gradesToDisplay = selectedGradeFilter === 'all' 
      ? availableGradeLevels 
      : availableGradeLevels.filter(g => g === selectedGradeFilter);

    gradesToDisplay.forEach(grade => {
      groups[grade] = {
        gradeLevel: grade,
        classes: []
      };

      // Turmas desta classe
      const classesOfGrade = schoolClasses.filter(c => c.gradeLevel === grade && (selectedTurmaFilter === 'all' || c.id === selectedTurmaFilter));
      
      classesOfGrade.forEach(sClass => {
        const studentsInClass = filteredStudents.filter(st => st.classId === sClass.id);
        groups[grade].classes.push({
          schoolClass: sClass,
          students: studentsInClass
        });
      });

      // Alunos sem turma atribuída nesta classe
      const unassignedStudents = filteredStudents.filter(st => !st.classId && st.entryGrade === grade);
      if (unassignedStudents.length > 0) {
        groups[grade].classes.push({
          schoolClass: {
            id: `unassigned-${grade}`,
            schoolId: activeSchoolId,
            name: 'Sem Turma Atribuída',
            gradeLevel: grade,
            year: 2026,
            academicYear: 2026,
            shift: 'Diurno',
            room: 'Pendente',
            maxStudents: 50
          } as Class,
          students: unassignedStudents
        });
      }
    });

    return groups;
  }, [availableGradeLevels, selectedGradeFilter, selectedTurmaFilter, schoolClasses, filteredStudents, activeSchoolId]);

  // Executar Renovação Automática Anual
  const handleExecuteRenewal = () => {
    setIsExecutingRenewal(true);
    setTimeout(() => {
      try {
        const summary = store.executeAnnualAutoRenewal(activeSchoolId, 2026);
        setRenewalSuccessMsg(
          `Processamento Concluído com Sucesso! ${summary.totalProcessed} alunos processados (${summary.promotedCount} promovidos com renovação preparada, ${summary.retainedCount} retidos alocados nas últimas turmas, ${summary.graduatedCount} graduados encaminhados).`
        );
      } catch (err) {
        console.error('Erro na renovação automática', err);
      } finally {
        setIsExecutingRenewal(false);
      }
    }, 600);
  };

  // Validar Matrícula (Operador)
  const handleConfirmValidation = () => {
    if (!selectedStudentForValidation) return;
    store.validateAndActivateEnrollment(selectedStudentForValidation.id, checkedDocs);
    setSelectedStudentForValidation(null);
  };

  // Confirmar Vagas de Transição (Diretor da Escola de Destino)
  const handleVacancyDecision = (batchId: string, decision: 'approve' | 'reject') => {
    store.handleTransitionVacancyDecision(
      batchId, 
      decision, 
      currentSchool.directorName || store.currentUser?.name || 'Director da Escola'
    );
  };

  // Matricular Novo Ingresso na Escola de Destino
  const handleConfirmNewAdmissionEnrollment = () => {
    if (!selectedNewAdmission || !targetClassId) return;
    store.confirmDestinationEnrollment(selectedNewAdmission.id, targetClassId);
    setSelectedNewAdmission(null);
    setTargetClassId('');
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal de Governação & Automação Escolar */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-900/40 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-mono font-semibold">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>RF-MAT-002 • RF-MAT-003 • RF-HIST-001 • MINEDH Moçambique</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Renovação Automática de Matrículas & Transição Escolar
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Motor oficial do SIGE para transição de classe, alocação inteligente de turmas, encaminhamento inter-escolar de graduados e emissão imediata de certificados e processos digitais.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <Button
              onClick={handleExecuteRenewal}
              disabled={isExecutingRenewal}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg transition-all gap-2 flex-1 lg:flex-initial cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isExecutingRenewal ? 'animate-spin' : ''}`} />
              <span>{isExecutingRenewal ? 'A Processar Transição...' : 'Executar Renovação Automática 2026'}</span>
            </Button>
          </div>
        </div>

        {/* Mensagem de Feedback de Execução */}
        {renewalSuccessMsg && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>{renewalSuccessMsg}</span>
            </div>
            <button 
              onClick={() => setRenewalSuccessMsg(null)}
              className="text-emerald-400 hover:text-white text-xs font-bold px-2 py-1 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Cards de Métricas Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3.5">
            <span className="text-slate-400 block mb-1">Total Alunos Activos</span>
            <span className="text-xl font-bold text-white font-mono">{totalActive}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{currentSchool.name}</span>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5">
            <span className="text-amber-300 block mb-1">Pendentes de Reativação</span>
            <span className="text-xl font-bold text-amber-400 font-mono">{pendingValidationCount}</span>
            <span className="text-[10px] text-amber-200/70 block mt-0.5">Aguardando Validação</span>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5">
            <span className="text-emerald-300 block mb-1">Matrículas Ativas</span>
            <span className="text-xl font-bold text-emerald-400 font-mono">{activatedCount}</span>
            <span className="text-[10px] text-emerald-200/70 block mt-0.5">Validadas pela Secretaria</span>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3.5">
            <span className="text-blue-300 block mb-1">Transições de Graduados</span>
            <span className="text-xl font-bold text-blue-400 font-mono">{sentBatches.length + receivedBatches.length} Lotes</span>
            <span className="text-[10px] text-blue-200/70 block mt-0.5">{newAdmissionsAwaiting.length} novos ingressos</span>
          </div>
        </div>
      </div>

      {/* Navegação por Separadores */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('renewal')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'renewal'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Renovação & Reativação de Matrículas</span>
          {pendingValidationCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px]">
              {pendingValidationCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('transitions')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'transitions'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Send className="h-4 w-4" />
          <span>Encaminhamento de Graduados (RF-MAT-003)</span>
          {receivedBatches.some(b => b.status === 'Aguardando confirmação de vagas') && (
            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white font-bold text-[10px] animate-pulse">
              Novas Vagas
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('new_admissions')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'new_admissions'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Novos Ingressos Recebidos</span>
          {newAdmissionsAwaiting.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white font-bold text-[10px]">
              {newAdmissionsAwaiting.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'certificates'
              ? 'bg-blue-900 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Arquivo de Certificados (RF-HIST-001)</span>
          <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px]">
            {schoolCertificates.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SEPARADOR 1: RENOVAÇÃO & REATIVAÇÃO DE MATRÍCULAS (ORGANIZADO POR CLASSE E TURMA) */}
      {/* ========================================================================= */}
      {activeTab === 'renewal' && (
        <div className="space-y-4">
          
          {/* Barra de Filtros e Seletores por Classe e Turma */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-3">
            
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Pesquisa por Texto */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome, IUE ou NIM..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Modo de Visualização */}
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setViewLayout('by_class_turma')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewLayout === 'by_class_turma'
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Organizado por Classe e Turma"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span>Por Classe & Turma</span>
                </button>

                <button
                  onClick={() => setViewLayout('flat_list')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewLayout === 'flat_list'
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Lista Tabular Corrida"
                >
                  <List className="h-3.5 w-3.5" />
                  <span>Lista Geral</span>
                </button>
              </div>
            </div>

            {/* Segunda Linha de Filtros: Filtro por Classe, Turma e Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2 border-t border-gray-100 items-center">
              
              {/* Seletor de Classe */}
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-blue-900 shrink-0" />
                <select
                  value={selectedGradeFilter}
                  onChange={e => {
                    setSelectedGradeFilter(e.target.value);
                    setSelectedTurmaFilter('all');
                  }}
                  className="w-full p-2 rounded-lg border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">🎓 Todas as Classes</option>
                  {availableGradeLevels.map(grade => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seletor de Turma */}
              <div className="flex items-center gap-1.5">
                <SchoolIcon className="h-4 w-4 text-blue-900 shrink-0" />
                <select
                  value={selectedTurmaFilter}
                  onChange={e => setSelectedTurmaFilter(e.target.value)}
                  className="w-full p-2 rounded-lg border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">🏫 Todas as Turmas</option>
                  {schoolClasses
                    .filter(c => selectedGradeFilter === 'all' || c.gradeLevel === selectedGradeFilter)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.gradeLevel} - {c.name} ({c.period || 'Diurno'})
                      </option>
                    ))}
                </select>
              </div>

              {/* Filtro de Estado de Matrícula */}
              <div className="sm:col-span-2 flex flex-wrap items-center gap-1.5 justify-start sm:justify-end">
                {(['all', 'pending', 'active', 'graduated', 'retained'] as const).map(statusKey => (
                  <button
                    key={statusKey}
                    onClick={() => setFilterStatus(statusKey)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      filterStatus === statusKey
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {statusKey === 'all' && 'Todos'}
                    {statusKey === 'pending' && 'Pendentes'}
                    {statusKey === 'active' && 'Activos'}
                    {statusKey === 'graduated' && 'Graduados'}
                    {statusKey === 'retained' && 'Repetentes'}
                  </button>
                ))}
              </div>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* MODO 1: ORGANIZAÇÃO HIERÁRQUICA POR CLASSE E TURMA                        */}
          {/* ========================================================================= */}
          {viewLayout === 'by_class_turma' ? (
            <div className="space-y-6">
              {Object.keys(groupedByGradeAndTurma).length === 0 || (Object.values(groupedByGradeAndTurma) as any[]).every(g => g.classes.every((c: any) => c.students.length === 0)) ? (
                <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">
                  <SchoolIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="font-bold text-gray-700">Nenhum aluno ou turma encontrada para os critérios selecionados.</p>
                  <p className="text-xs text-gray-500 mt-1">Tente ajustar a classe, turma ou filtros de estado.</p>
                </div>
              ) : (
                (Object.values(groupedByGradeAndTurma) as any[]).map(group => {
                  const totalStudentsInGrade = group.classes.reduce((acc, c) => acc + c.students.length, 0);
                  if (totalStudentsInGrade === 0) return null;

                  return (
                    <div key={group.gradeLevel} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
                      
                      {/* Cabeçalho da Classe */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-blue-900 text-white font-bold text-sm">
                            <GraduationCap className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-black text-gray-950 uppercase font-serif">
                                {group.gradeLevel}
                              </h3>
                              <span className="bg-blue-100 text-blue-900 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                {totalStudentsInGrade} Alunos Inscritos
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Estrutura Pedagógica Oficial • {currentSchool.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 font-semibold">
                            {group.classes.length} {group.classes.length === 1 ? 'Turma' : 'Turmas'} nesta Classe
                          </span>
                        </div>
                      </div>

                      {/* Lista de Turmas desta Classe */}
                      <div className="space-y-4">
                        {group.classes.map(({ schoolClass, students }) => {
                          const isCollapsed = !!collapsedTurmas[schoolClass.id];
                          const pendingInClass = students.filter(s => s.reactivationStatus === 'PENDENTE DE REATIVAÇÃO' || s.reactivationStatus === 'AGUARDANDO REATIVAÇÃO').length;
                          const activeInClass = students.filter(s => s.reactivationStatus === 'MATRICULA_ATIVA' || s.enrollmentStatus === 'Activo').length;
                          const graduatedInClass = students.filter(s => s.enrollmentStatus === 'Concluído' || s.transitionStatus === 'awaiting_vacancy_confirmation').length;
                          const retainedInClass = students.filter(s => s.entryType === 'repetente').length;

                          return (
                            <div 
                              key={schoolClass.id}
                              className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50/50 shadow-xs transition-all"
                            >
                              {/* Barra Superior da Turma */}
                              <div className="bg-slate-900 text-white p-3.5 flex flex-wrap items-center justify-between gap-3">
                                
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => toggleTurmaCollapse(schoolClass.id)}
                                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white cursor-pointer"
                                  >
                                    {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                  </button>
                                  
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-black text-sm text-white">
                                        {schoolClass.gradeLevel} - {schoolClass.name}
                                      </span>
                                      <span className="text-[10px] bg-blue-500/30 text-blue-200 border border-blue-400/40 px-2 py-0.5 rounded font-mono font-bold">
                                        Turno: {schoolClass.period || 'Diurno'} • Sala: {schoolClass.room || '01'}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 mt-0.5">
                                      Director de Turma: {schoolClass.directorTeacherName || 'Prof. Coordenador'} • Lotação: {students.length}/{schoolClass.maxStudents || 45}
                                    </p>
                                  </div>
                                </div>

                                {/* Estatísticas Rápidas & Ações da Turma */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="flex items-center gap-1.5 text-[10.5px] font-bold bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                                    <span className="text-emerald-400">{activeInClass} Activos</span>
                                    <span className="text-slate-500">•</span>
                                    <span className="text-amber-400">{pendingInClass} Pendentes</span>
                                    {graduatedInClass > 0 && (
                                      <>
                                        <span className="text-slate-500">•</span>
                                        <span className="text-blue-300">{graduatedInClass} Graduados</span>
                                      </>
                                    )}
                                  </div>

                                  {pendingInClass > 0 && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleValidateBatchTurma(schoolClass.id)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg shadow-sm cursor-pointer"
                                      title="Validar e Ativar todas as matrículas pendentes desta turma"
                                    >
                                      <Check className="h-3.5 w-3.5 mr-1" />
                                      Validar Toda a Turma ({pendingInClass})
                                    </Button>
                                  )}
                                </div>

                              </div>

                              {/* Tabela de Estudantes desta Turma (Expansível) */}
                              {!isCollapsed && (
                                <div className="overflow-x-auto bg-white">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="bg-slate-100 text-slate-900 font-sans uppercase tracking-wider text-[11px] border-b border-slate-200">
                                        <th className="p-3">N.º / Estudante</th>
                                        <th className="p-3">IUE / NIM</th>
                                        <th className="p-3">Aproveitamento</th>
                                        <th className="p-3">Estado da Matrícula</th>
                                        <th className="p-3 text-right">Documentos & Ações Oficiais</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {students.length === 0 ? (
                                        <tr>
                                          <td colSpan={5} className="p-6 text-center text-gray-500 italic">
                                            Nenhum estudante com os filtros selecionados nesta turma.
                                          </td>
                                        </tr>
                                      ) : (
                                        students.map((student, idx) => {
                                          const isPending = student.reactivationStatus === 'PENDENTE DE REATIVAÇÃO' || student.reactivationStatus === 'AGUARDANDO REATIVAÇÃO';
                                          const isGraduated = student.enrollmentStatus === 'Concluído' || student.transitionStatus === 'awaiting_vacancy_confirmation';
                                          const isRetained = student.entryType === 'repetente';

                                          return (
                                            <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                                              
                                              <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-mono text-gray-400 text-[10px] w-5">
                                                    {(idx + 1).toString().padStart(2, '0')}.
                                                  </span>
                                                  <div>
                                                    <div className="font-bold text-gray-950">{student.name}</div>
                                                    <div className="text-[10.5px] text-gray-500">
                                                      Doc: {student.idCardNumber || student.nuit || 'Provisório'} • Nasc: {student.birthDate || 'N/A'}
                                                    </div>
                                                  </div>
                                                </div>
                                              </td>

                                              <td className="p-3">
                                                <div className="font-mono text-[11px] font-bold text-blue-950">
                                                  {student.iue || 'Aguardando Geração'}
                                                </div>
                                                {student.nim && (
                                                  <div className="font-mono text-[10px] text-gray-500">
                                                    NIM: {student.nim}
                                                  </div>
                                                )}
                                              </td>

                                              <td className="p-3">
                                                {isGraduated ? (
                                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                                                    <Award className="h-3 w-3" /> Graduado
                                                  </span>
                                                ) : isRetained ? (
                                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                                    Não Transitou
                                                  </span>
                                                ) : (
                                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                                    <CheckCircle2 className="h-3 w-3" /> Aprovado (Transitou)
                                                  </span>
                                                )}
                                              </td>

                                              <td className="p-3">
                                                {isPending ? (
                                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 border border-amber-300 text-amber-900 font-bold text-[10px]">
                                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                                    <span>PENDENTE</span>
                                                  </div>
                                                ) : isGraduated ? (
                                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-100 border border-blue-300 text-blue-900 font-bold text-[10px]">
                                                    <Send className="h-3.5 w-3.5 text-blue-600" />
                                                    <span>AGUARDANDO DESTINO</span>
                                                  </div>
                                                ) : (
                                                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-[10px]">
                                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                    <span>MATRÍCULA ACTIVA</span>
                                                  </div>
                                                )}
                                              </td>

                                              <td className="p-3 text-right space-x-1">
                                                {isPending && (
                                                  <Button
                                                    size="sm"
                                                    onClick={() => setSelectedStudentForValidation(student)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs cursor-pointer"
                                                  >
                                                    <UserCheck className="h-3.5 w-3.5 mr-1" />
                                                    Validar
                                                  </Button>
                                                )}

                                                <Button
                                                  size="sm"
                                                  onClick={() => setSelectedStudentForReceipt(student)}
                                                  className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg shadow-xs cursor-pointer"
                                                  title="Emitir Recibo Oficial de Matrícula (Com Emblema de Moçambique)"
                                                >
                                                  <Receipt className="h-3.5 w-3.5 mr-1" />
                                                  Recibo
                                                </Button>

                                                <Button
                                                  size="sm"
                                                  onClick={() => setSelectedStudentForMedical(student)}
                                                  className="bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg shadow-xs cursor-pointer"
                                                  title="Emitir Certificado / Atestado Médico Oficial (Com Emblema de Moçambique)"
                                                >
                                                  <Stethoscope className="h-3.5 w-3.5 mr-1" />
                                                  Médico
                                                </Button>

                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => generateUnifiedAcademicHistoryPDF({
                                                    student,
                                                    schoolName: currentSchool.name,
                                                    classes: store.classes,
                                                    subjects: store.subjects,
                                                    grades: store.grades
                                                  })}
                                                  className="text-[11px] text-blue-950 border-blue-300 hover:bg-blue-50 py-1 px-2 rounded-lg cursor-pointer"
                                                  title="Baixar Histórico Escolar Unificado (PDF)"
                                                >
                                                  <Download className="h-3.5 w-3.5" />
                                                </Button>

                                                {onViewStudentProcess && (
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => onViewStudentProcess(student)}
                                                    className="text-[11px] text-gray-700 border-gray-300 hover:bg-gray-100 py-1 px-2 rounded-lg cursor-pointer"
                                                    title="Ver Processo Individual Completo"
                                                  >
                                                    <Eye className="h-3.5 w-3.5" />
                                                  </Button>
                                                )}
                                              </td>

                                            </tr>
                                          );
                                        })
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              )}

                            </div>
                          );
                        })}
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* ========================================================================= */
            /* MODO 2: VISÃO TABULAR COMPLETA                                            */
            /* ========================================================================= */
            <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-sans uppercase tracking-wider text-[11px]">
                      <th className="p-3.5">Estudante & Identificação</th>
                      <th className="p-3.5">ID Único (IUE) / NIM</th>
                      <th className="p-3.5">Classe & Turma</th>
                      <th className="p-3.5">Resultado</th>
                      <th className="p-3.5">Estado da Matrícula</th>
                      <th className="p-3.5 text-right">Ações da Secretaria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                          Nenhum estudante encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(student => {
                        const studentClass = schoolClasses.find(c => c.id === student.classId);
                        const isPending = student.reactivationStatus === 'PENDENTE DE REATIVAÇÃO' || student.reactivationStatus === 'AGUARDANDO REATIVAÇÃO';
                        const isGraduated = student.enrollmentStatus === 'Concluído' || student.transitionStatus === 'awaiting_vacancy_confirmation';
                        const isRetained = student.entryType === 'repetente';

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5">
                              <div className="font-bold text-gray-950">{student.name}</div>
                              <div className="text-[11px] text-gray-500">
                                Doc: {student.idCardNumber || student.nuit || 'Provisório'} • Nasc: {student.birthDate || 'N/A'}
                              </div>
                            </td>

                            <td className="p-3.5">
                              <div className="font-mono text-[11px] font-bold text-blue-950">
                                {student.iue || 'Aguardando Geração'}
                              </div>
                              {student.nim && (
                                <div className="font-mono text-[10px] text-gray-500">
                                  NIM: {student.nim}
                                </div>
                              )}
                            </td>

                            <td className="p-3.5">
                              <div className="font-semibold text-gray-900">
                                {studentClass?.gradeLevel || student.entryGrade || '10ª Classe'}
                              </div>
                              <div className="text-[11px] text-slate-600 font-mono">
                                {studentClass?.name || 'Turma A'} ({studentClass?.period || 'Diurno'})
                              </div>
                            </td>

                            <td className="p-3.5">
                              {isGraduated ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                                  <Award className="h-3 w-3" /> Graduado do Nível
                                </span>
                              ) : isRetained ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                  Não Transitou (Última Turma)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  <CheckCircle2 className="h-3 w-3" /> Aprovado (Transitou)
                                </span>
                              )}
                            </td>

                            <td className="p-3.5">
                              {isPending ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100/80 border border-amber-300 text-amber-900 font-bold text-[10px]">
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                  <span>PENDENTE DE REATIVAÇÃO</span>
                                </div>
                              ) : isGraduated ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100/80 border border-blue-300 text-blue-900 font-bold text-[10px]">
                                  <Send className="h-3.5 w-3.5 text-blue-600" />
                                  <span>AGUARDANDO VAGA NO DESTINO</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100/80 border border-emerald-300 text-emerald-900 font-bold text-[10px]">
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>MATRÍCULA ACTIVA</span>
                                </div>
                              )}
                            </td>

                            <td className="p-3.5 text-right space-x-1">
                              {isPending && (
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedStudentForValidation(student)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-xs cursor-pointer"
                                >
                                  <UserCheck className="h-3.5 w-3.5 mr-1" />
                                  Validar Matrícula
                                </Button>
                              )}

                              <Button
                                size="sm"
                                onClick={() => setSelectedStudentForReceipt(student)}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg shadow-xs cursor-pointer"
                                title="Emitir Recibo Oficial de Matrícula (Com Emblema de Moçambique)"
                              >
                                <Receipt className="h-3.5 w-3.5 mr-1" />
                                Recibo
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => setSelectedStudentForMedical(student)}
                                className="bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg shadow-xs cursor-pointer"
                                title="Emitir Certificado / Atestado Médico Oficial (Com Emblema de Moçambique)"
                              >
                                <Stethoscope className="h-3.5 w-3.5 mr-1" />
                                Médico
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateUnifiedAcademicHistoryPDF({
                                  student,
                                  schoolName: currentSchool.name,
                                  classes: store.classes,
                                  subjects: store.subjects,
                                  grades: store.grades
                                })}
                                className="text-[11px] text-blue-950 border-blue-300 hover:bg-blue-50 py-1 px-2 rounded-lg cursor-pointer"
                                title="Baixar Histórico Escolar Unificado (PDF)"
                              >
                                <Download className="h-3.5 w-3.5 mr-1" />
                                Histórico PDF
                              </Button>

                              {onViewStudentProcess && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onViewStudentProcess(student)}
                                  className="text-[11px] text-gray-700 border-gray-300 hover:bg-gray-100 py-1 px-2 rounded-lg cursor-pointer"
                                  title="Ver Processo Individual Completo"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* SEPARADOR 2: ENCAMINHAMENTO DE GRADUADOS & TRANSIÇÃO INTER-ESCOLAR */}
      {/* ========================================================================= */}
      {activeTab === 'transitions' && (
        <div className="space-y-6">
          {/* Explicação do Fluxo Normativo RF-MAT-003 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-950 space-y-2">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-700" />
              Fluxo Oficial de Transição Inter-Escolar (RF-MAT-003)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 text-[11px]">
              <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1">
                <span className="font-bold text-blue-900 block">1. Identificação Automática</span>
                <p className="text-gray-600">Alunos que concluíram a classe máxima da escola são agregados em lotes de transição.</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1">
                <span className="font-bold text-blue-900 block">2. Notificação da Escola Recetora</span>
                <p className="text-gray-600">A escola de destino mais próxima recebe a lista com estado "Aguardando confirmação de vaga".</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1">
                <span className="font-bold text-blue-900 block">3. Decisão do Diretor</span>
                <p className="text-gray-600">Diretor de destino aprova vagas. Caso rejeitado, o sistema reencaminha para a próxima escola ativa.</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1">
                <span className="font-bold text-blue-900 block">4. Transferência Digital</span>
                <p className="text-gray-600">O Processo Individual, certificados e histórico unificado são transferidos mantendo o mesmo IUE.</p>
              </div>
            </div>
          </div>

          {/* Lotes Recebidos (Escola de Destino - Requer Validação do Diretor) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <SchoolIcon className="h-4 w-4 text-blue-700" />
              Lotes de Transição Recebidos de Outras Escolas ({receivedBatches.length})
            </h3>

            {receivedBatches.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 text-xs italic">
                Nenhuma solicitação de transição recebida no momento.
              </div>
            ) : (
              <div className="space-y-3">
                {receivedBatches.map(batch => {
                  const isPending = batch.status === 'Aguardando confirmação de vagas';

                  return (
                    <div key={batch.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-md">
                              {batch.id}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isPending ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {(batch.status || 'PROCESSADO').toUpperCase()}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-gray-950 mt-1">
                            Proveniente de: {batch.sourceSchoolName} → Ingresso em: {batch.targetGrade}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Total de Estudantes Graduados: <strong className="text-blue-950">{batch.totalStudents}</strong> • Ano Lectivo: {batch.academicYear}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const srcSchool = store.schools.find(s => s.id === batch.sourceSchoolId) || currentSchool;
                              generateSchoolTransitionListPDF({
                                batch,
                                originSchool: srcSchool,
                                destinationSchool: currentSchool
                              });
                            }}
                            className="text-xs text-blue-950 border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Guia de Transição (PDF)
                          </Button>

                          {isPending && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleVacancyDecision(batch.id, 'approve')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Confirmar Vagas
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVacancyDecision(batch.id, 'reject')}
                                className="text-red-700 border-red-300 hover:bg-red-50 text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5 mr-1" />
                                Rejeitar & Reencaminhar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Lista de Alunos do Lote */}
                      <div className="bg-slate-50 rounded-lg p-3">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                          Estudantes no Lote ({batch.students.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          {batch.students.map((st, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-md p-2 flex items-center justify-between">
                              <div>
                                <span className="font-bold text-gray-900 block truncate max-w-[180px]">{st.studentName}</span>
                                <span className="text-[10px] text-gray-500 font-mono">{st.studentIue}</span>
                              </div>
                              <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded">
                                {st.finalAverage}v
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lotes Emitidos (Escola de Origem) */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-700" />
              Lotes de Graduados Emitidos para Outras Escolas ({sentBatches.length})
            </h3>

            {sentBatches.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 text-xs italic">
                Nenhum lote de graduados emitido nesta escola. Execute a Renovação Automática para gerar transições.
              </div>
            ) : (
              <div className="space-y-3">
                {sentBatches.map(batch => (
                  <div key={batch.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                          {batch.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {batch.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-gray-950 mt-1">
                        Destino: {batch.targetSchoolName} (Classe: {batch.targetGrade})
                      </h4>
                      <p className="text-xs text-gray-500">
                        {batch.totalStudents} Estudantes • Criado em: {new Date(batch.createdAt).toLocaleDateString('pt-MZ')}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const destSchool = store.schools.find(s => s.id === batch.targetSchoolId) || currentSchool;
                        generateSchoolTransitionListPDF({
                          batch,
                          originSchool: currentSchool,
                          destinationSchool: destSchool
                        });
                      }}
                      className="text-xs text-blue-950 border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-lg cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Baixar Guia Oficial (PDF)
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEPARADOR 3: NOVOS INGRESSOS RECEBIDOS (MATRÍCULA NO DESTINO) */}
      {/* ========================================================================= */}
      {activeTab === 'new_admissions' && (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              Alunos Graduados com Vaga Confirmada no Estabelecimento de Destino
            </h3>
            <p className="mt-1 text-gray-600">
              Estes alunos foram encaminhados com sucesso de suas escolas anteriores. O operador de secretaria valida a documentação final e aloca a turma para concluir a matrícula definitiva (RF-MAT-003).
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-sans uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Estudante</th>
                  <th className="p-3.5">ID Único (IUE)</th>
                  <th className="p-3.5">Classe de Ingresso</th>
                  <th className="p-3.5">Histórico & Processo</th>
                  <th className="p-3.5 text-right">Alocação de Turma</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {newAdmissionsAwaiting.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                      Nenhum novo ingresso pendente de alocação de turma nesta escola.
                    </td>
                  </tr>
                ) : (
                  newAdmissionsAwaiting.map(st => (
                    <tr key={st.id} className="hover:bg-slate-50/80">
                      <td className="p-3.5 font-bold text-gray-950">
                        {st.name}
                        <span className="block text-[10px] text-gray-500 font-normal">
                          Nasc: {st.birthDate} • Doc: {st.idCardNumber || st.nuit || 'N/A'}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-[11px] font-bold text-blue-950">
                        {st.iue}
                      </td>

                      <td className="p-3.5 font-semibold text-gray-900">
                        {st.entryGrade || '11ª Classe'}
                      </td>

                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <FileCheck className="h-3 w-3" /> Processo Completo Transferido
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedNewAdmission(st);
                            const defaultCls = schoolClasses.find(c => c.gradeLevel === (st.entryGrade || '11ª Classe')) || schoolClasses[0];
                            if (defaultCls) setTargetClassId(defaultCls.id);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Concluir Matrícula
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEPARADOR 4: ARQUIVO DE CERTIFICADOS & DECLARAÇÕES (RF-HIST-001) */}
      {/* ========================================================================= */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-gray-950">
                Registo de Diplomas e Certificados de Conclusão Emitidos
              </h3>
              <p className="text-xs text-gray-500">
                Todos os documentos gerados automaticamente contêm autenticação digital QR Code e referência padronizada do MINEDH.
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-sans uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Código do Certificado</th>
                  <th className="p-3.5">Estudante & IUE</th>
                  <th className="p-3.5">Nível / Classe</th>
                  <th className="p-3.5">Média Final</th>
                  <th className="p-3.5">Data de Emissão</th>
                  <th className="p-3.5 text-right">Ações Oficiais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schoolCertificates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 italic">
                      Nenhum certificado emitido ainda. Os certificados são gerados automaticamente ao concluir a classe máxima ou publicar pautas finais.
                    </td>
                  </tr>
                ) : (
                  schoolCertificates.map(cert => {
                    const student = store.students.find(s => s.id === cert.studentId) || {
                      id: cert.studentId,
                      name: cert.studentName,
                      iue: cert.iue
                    } as Student;

                    return (
                      <tr key={cert.id} className="hover:bg-slate-50/80">
                        <td className="p-3.5 font-mono text-[11px] font-bold text-blue-950">
                          {cert.certificateCode}
                          <span className="block text-[10px] text-amber-700 font-normal">{cert.verificationCode}</span>
                        </td>

                        <td className="p-3.5">
                          <span className="font-bold text-gray-900 block">{cert.studentName}</span>
                          <span className="font-mono text-[10px] text-gray-500">{cert.iue}</span>
                        </td>

                        <td className="p-3.5 font-semibold text-gray-900">
                          {cert.gradeLevel}
                        </td>

                        <td className="p-3.5 font-mono font-bold text-blue-900">
                          {cert.average} valores
                        </td>

                        <td className="p-3.5 text-gray-600">
                          {cert.issuedAt}
                        </td>

                        <td className="p-3.5 text-right space-x-1.5">
                          <Button
                            size="sm"
                            onClick={() => generateOfficialCertificatePDF({
                              student,
                              certificate: cert,
                              school: currentSchool
                            })}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xs cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Baixar PDF
                          </Button>

                          {onViewCertificate && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onViewCertificate(student, cert)}
                              className="text-gray-700 border-gray-300 hover:bg-gray-100 text-[11px] px-2.5 py-1.5 rounded-lg cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VALIDAÇÃO DE MATRÍCULA PELO OPERADOR (RF-MAT-002 #4) */}
      {/* ========================================================================= */}
      {selectedStudentForValidation && (
        <div className="fixed inset-0 z-50 bg-slate-950/80  flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-200 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-950">Validação de Matrícula</h3>
                  <p className="text-xs text-gray-500">Conferência documental para ativação definitiva</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForValidation(null)}
                className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dados do Estudante */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Nome:</span>
                <strong className="text-gray-950">{selectedStudentForValidation.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">IUE Institucional:</span>
                <strong className="font-mono text-blue-900">{selectedStudentForValidation.iue}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Classe / Turma Atribuída:</span>
                <strong>{selectedStudentForValidation.entryGrade || '10ª Classe'}</strong>
              </div>
            </div>

            {/* Checklist Documental */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                Conferência de Documentos Obrigatórios (MINEDH):
              </span>
              <div className="space-y-2 text-xs">
                {[
                  { key: 'birthCertificate', label: 'Cópia de Certidão de Nascimento / BI' },
                  { key: 'vaccinationCard', label: 'Boletim / Cartão de Vacinação Atualizado' },
                  { key: 'previousYearDeclaration', label: 'Declaração / Certificado da Classe Anterior' },
                  { key: 'enrollmentForm', label: 'Ficha de Matrícula Assinada pelo Encarregado' },
                  { key: 'passportPhotos', label: 'Fotografias Tipo Passe (2)' }
                ].map(doc => (
                  <label key={doc.key} className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checkedDocs[doc.key]}
                      onChange={e => setCheckedDocs({ ...checkedDocs, [doc.key]: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-gray-800 font-medium">{doc.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => setSelectedStudentForValidation(null)}
                className="text-xs py-2 px-4 rounded-xl cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmValidation}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-5 rounded-xl shadow-md cursor-pointer"
              >
                <Check className="h-4 w-4 mr-1" />
                Validar & Ativar Matrícula
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ALOCAÇÃO DE TURMA DE NOVO INGRESSO NA ESCOLA DE DESTINO */}
      {/* ========================================================================= */}
      {selectedNewAdmission && (
        <div className="fixed inset-0 z-50 bg-slate-950/80  flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-200 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-base text-gray-950">Alocação de Turma do Novo Ingresso</h3>
              <button onClick={() => setSelectedNewAdmission(null)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              O aluno <strong className="text-gray-900">{selectedNewAdmission.name}</strong> possui processo e vaga confirmados para a classe <strong className="text-blue-900">{selectedNewAdmission.entryGrade || '11ª Classe'}</strong>.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Selecione a Turma no Estabelecimento:</label>
              <select
                value={targetClassId}
                onChange={e => setTargetClassId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Selecione uma turma --</option>
                {schoolClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.gradeLevel} - {c.name} ({c.period || 'Diurno'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <Button variant="outline" onClick={() => setSelectedNewAdmission(null)} className="text-xs py-2 px-4 rounded-xl cursor-pointer">
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmNewAdmissionEnrollment}
                disabled={!targetClassId}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-5 rounded-xl shadow-md cursor-pointer"
              >
                Concluir Matrícula Definitiva
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Recibo Oficial de Matrícula (Com Emblema de Moçambique) */}
      {selectedStudentForReceipt && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 ">
          <EnrollmentReceiptDocument
            student={selectedStudentForReceipt}
            schoolName={currentSchool.name}
            directorName={currentSchool.directorName}
            academicYear={2026}
            onClose={() => setSelectedStudentForReceipt(null)}
          />
        </div>
      )}

      {/* Modal: Atestado / Certificado Médico Oficial (Com Emblema de Moçambique) */}
      {selectedStudentForMedical && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 ">
          <MedicalCertificateDocument
            student={selectedStudentForMedical}
            schoolName={currentSchool.name}
            academicYear={2026}
            onClose={() => setSelectedStudentForMedical(null)}
          />
        </div>
      )}
    </div>
  );
}
