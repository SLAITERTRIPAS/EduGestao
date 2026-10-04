import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { DigitalLessonRecord, StudentAttendanceMark } from '../types';
import { validateLessonDateInCalendar } from '../utils/schoolCalendarStore';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  Info,
  Layers,
  Plus,
  Printer,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  AlertTriangle,
  XCircle,
  Eye,
  Award,
  Sparkles,
  ClipboardList,
  Save,
  RotateCcw
} from 'lucide-react';
import { MozambiqueEmblem } from './MozambiqueEmblem';

interface DigitalClassBookManagerProps {
  initialClassId?: string;
  initialSubjectId?: string;
  overrideRole?: 'teacher' | 'pedagogical' | 'secretariat' | 'director';
}

const DAYS_OF_WEEK = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
] as const;

export function DigitalClassBookManager({
  initialClassId,
  initialSubjectId,
  overrideRole
}: DigitalClassBookManagerProps) {
  const {
    currentUser,
    classes = [],
    subjects = [],
    assignments = [],
    students = [],
    digitalLessonRecords = [],
    addDigitalLessonRecord,
    pedagogicalVisaLessonRecord,
    secretariatAuditLessonRecord,
  } = useStore();

  const userRole = overrideRole || currentUser?.role || 'teacher';
  const isTeacher = userRole === 'teacher';
  const isPedagogical = userRole === 'pedagogical' || userRole === 'director';
  const isSecretariat = userRole === 'secretariat' || userRole === 'admin';

  // Teacher specific assignments
  const teacherAssignments = useMemo(() => {
    if (isTeacher) {
      return assignments.filter(a => a.teacherId === currentUser?.id || a.teacherName === currentUser?.name);
    }
    return assignments;
  }, [assignments, currentUser, isTeacher]);

  // Selected filters
  const [selectedClassId, setSelectedClassId] = useState<string>(
    initialClassId || (teacherAssignments.length > 0 ? teacherAssignments[0].classId : classes[0]?.id || '')
  );

  const availableSubjectsForClass = useMemo(() => {
    const classAssignments = assignments.filter(a => a.classId === selectedClassId);
    if (isTeacher) {
      return classAssignments.filter(a => a.teacherId === currentUser?.id || a.teacherName === currentUser?.name);
    }
    return classAssignments;
  }, [assignments, selectedClassId, isTeacher, currentUser]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || (availableSubjectsForClass.length > 0 ? availableSubjectsForClass[0].subjectId : subjects[0]?.id || '')
  );

  const [selectedTrimester, setSelectedTrimester] = useState<1 | 2 | 3>(1);
  const [activeSubTab, setActiveSubTab] = useState<
    'launch' | 'matrix' | 'lessons_list' | 'justifications' | 'teacher_assiduity' | 'official_print'
  >(isTeacher ? 'launch' : isPedagogical ? 'teacher_assiduity' : 'lessons_list');

  // State for absence justifications
  const [justificationRequests, setJustificationRequests] = useState<Array<{
    id: string;
    studentId: string;
    studentName: string;
    lessonRecordId: string;
    day: string;
    month: string;
    subjectName: string;
    reason: string;
    documentRef?: string;
    submittedAt: string;
    status: 'pending' | 'signed_approved' | 'rejected';
    teacherSignature?: string;
    signedAt?: string;
  }>>([
    {
      id: 'just-001',
      studentId: 'st-01',
      studentName: 'Amina Ali',
      lessonRecordId: 'l1',
      day: '12',
      month: 'Outubro',
      subjectName: 'Português',
      reason: 'Atestado Médico do Centro de Saúde da Polana',
      documentRef: 'DOC-MED-2026-88',
      submittedAt: '2026-10-02',
      status: 'pending'
    }
  ]);

  const [newJustForm, setNewJustForm] = useState({
    studentId: '',
    day: String(new Date().getDate()),
    month: 'Outubro',
    reason: '',
    documentRef: ''
  });

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDay, setFilterDay] = useState<string>('todos');

  // Selected class & subject objects
  const currentClass = useMemo(() => classes.find(c => c.id === selectedClassId), [classes, selectedClassId]);
  const currentSubject = useMemo(() => subjects.find(s => s.id === selectedSubjectId), [subjects, selectedSubjectId]);
  const currentAssignment = useMemo(() => {
    return assignments.find(a => a.classId === selectedClassId && a.subjectId === selectedSubjectId);
  }, [assignments, selectedClassId, selectedSubjectId]);

  // Enrolled students in current class
  const classStudents = useMemo(() => {
    return students
      .filter(st => st.classId === selectedClassId && st.status === 'active')
      .sort((a, b) => (a.frequencyNumber || 0) - (b.frequencyNumber || 0) || a.name.localeCompare(b.name));
  }, [students, selectedClassId]);

  // Existing lesson records for this class & subject & trimester
  const classLessons = useMemo(() => {
    return digitalLessonRecords
      .filter(l => l.classId === selectedClassId && (selectedSubjectId ? l.subjectId === selectedSubjectId : true) && l.trimester === selectedTrimester)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.lessonNumber - a.lessonNumber);
  }, [digitalLessonRecords, selectedClassId, selectedSubjectId, selectedTrimester]);

  // New Lesson Launch Form State
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const getTodayDayOfWeek = (): typeof DAYS_OF_WEEK[number] => {
    const dayIndex = new Date().getDay();
    const map: Record<number, typeof DAYS_OF_WEEK[number]> = {
      1: 'Segunda-feira',
      2: 'Terça-feira',
      3: 'Quarta-feira',
      4: 'Quinta-feira',
      5: 'Sexta-feira',
      6: 'Sábado',
      0: 'Segunda-feira'
    };
    return map[dayIndex] || 'Segunda-feira';
  };

  const [lessonForm, setLessonForm] = useState({
    date: todayStr,
    dayOfWeek: getTodayDayOfWeek(),
    lessonNumber: classLessons.length + 1,
    lessonSlot: '1º e 2º Tempos (07:00 - 08:35)',
    unitTopic: 'Unidade Temática Curricular',
    topic: '',
    objectives: '',
    homework: '',
    pedagogicalObservations: '',
    teacherAssiduity: 'present' as DigitalLessonRecord['teacherAssiduity'],
    substituteTeacherName: '',
  });

  // Student Attendance marks for the new lesson being launched
  const [attendanceMarks, setAttendanceMarks] = useState<Record<string, { status: 'P' | 'FJ' | 'FI' | 'A'; reason?: string }>>({});

  // Initialize attendance marks when classStudents changes
  React.useEffect(() => {
    const initial: Record<string, { status: 'P' | 'FJ' | 'FI' | 'A'; reason?: string }> = {};
    classStudents.forEach(st => {
      initial[st.id] = { status: 'P', reason: '' };
    });
    setAttendanceMarks(initial);
  }, [classStudents]);

  // Notification / Feedback banner
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // Quick attendance actions
  const markAllStudents = (status: 'P' | 'FJ' | 'FI' | 'A') => {
    const updated: Record<string, { status: 'P' | 'FJ' | 'FI' | 'A'; reason?: string }> = {};
    classStudents.forEach(st => {
      updated[st.id] = { status, reason: status === 'P' ? '' : attendanceMarks[st.id]?.reason || '' };
    });
    setAttendanceMarks(updated);
    showFeedback(`Todos os ${classStudents.length} alunos marcados como "${status === 'P' ? 'Presentes' : status}".`, 'info');
  };

  const setStudentStatus = (studentId: string, status: 'P' | 'FJ' | 'FI' | 'A') => {
    setAttendanceMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      }
    }));
  };

  const setStudentReason = (studentId: string, reason: string) => {
    setAttendanceMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        reason,
      }
    }));
  };

  // Compute live attendance summary for the active form
  const currentAttendanceSummary = useMemo(() => {
    const total = classStudents.length;
    let p = 0;
    let fj = 0;
    let fi = 0;
    let a = 0;

    classStudents.forEach(st => {
      const mark = attendanceMarks[st.id]?.status || 'P';
      if (mark === 'P') p++;
      else if (mark === 'FJ') fj++;
      else if (mark === 'FI') fi++;
      else if (mark === 'A') a++;
    });

    const rate = total > 0 ? Number((((p + a) / total) * 100).toFixed(1)) : 100;
    return {
      total,
      present: p,
      justified: fj,
      unjustified: fi,
      late: a,
      rate
    };
  }, [classStudents, attendanceMarks]);

  // Submit new Lesson and Attendance Launch
  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();

    // Check School Calendar official date restrictions
    const dateValidation = validateLessonDateInCalendar(lessonForm.date, selectedTrimester);
    if (!dateValidation.isValid) {
      showFeedback(dateValidation.reason || 'Lançamento Bloqueado pelo Calendário Escolar Oficial.', 'error');
      return;
    }

    if (!lessonForm.topic.trim()) {
      showFeedback('Por favor, informe o Tema da Aula / Conteúdo ministrado.', 'error');
      return;
    }

    if (!selectedClassId || !selectedSubjectId) {
      showFeedback('Selecione uma Turma e Disciplina válidas.', 'error');
      return;
    }

    const records: StudentAttendanceMark[] = classStudents.map(st => ({
      studentId: st.id,
      studentName: st.fullName || st.name,
      studentNumber: st.studentNumber || st.frequencyNumber?.toString() || '---',
      gender: (st.gender === 'F' ? 'F' : 'M') as 'M' | 'F',
      status: attendanceMarks[st.id]?.status || 'P',
      justificationReason: attendanceMarks[st.id]?.reason || '',
    }));

    const teacherName = currentAssignment?.teacherName || currentUser?.name || 'Docente Titular';
    const teacherId = currentAssignment?.teacherId || currentUser?.id || 'u4';

    const newRecord: Omit<DigitalLessonRecord, 'id' | 'createdAt'> = {
      assignmentId: currentAssignment?.id || `as-${selectedClassId}-${selectedSubjectId}`,
      classId: selectedClassId,
      className: currentClass?.name || 'Turma',
      subjectId: selectedSubjectId,
      subjectName: currentSubject?.name || 'Disciplina',
      teacherId,
      teacherName,
      schoolId: currentUser?.schoolId || 's1',
      date: lessonForm.date,
      dayOfWeek: lessonForm.dayOfWeek as any,
      trimester: selectedTrimester,
      academicYear: 2026,
      lessonNumber: Number(lessonForm.lessonNumber),
      lessonSlot: lessonForm.lessonSlot,
      unitTopic: lessonForm.unitTopic,
      topic: lessonForm.topic,
      objectives: lessonForm.objectives,
      homework: lessonForm.homework,
      pedagogicalObservations: lessonForm.pedagogicalObservations,
      teacherAssiduity: lessonForm.teacherAssiduity,
      substituteTeacherName: lessonForm.substituteTeacherName,
      teacherSignedAt: new Date().toISOString(),
      teacherSignatureStamp: `MINEDH-DIGITAL-${Math.floor(100000 + Math.random() * 900000)}`,
      attendanceRecords: records,
      attendanceSummary: {
        totalStudents: currentAttendanceSummary.total,
        presentCount: currentAttendanceSummary.present,
        justifiedAbsenceCount: currentAttendanceSummary.justified,
        unjustifiedAbsenceCount: currentAttendanceSummary.unjustified,
        lateCount: currentAttendanceSummary.late,
        attendanceRate: currentAttendanceSummary.rate,
      },
      pedagogicalVisa: {
        status: 'pendente',
        reviewedBy: '',
        reviewedAt: '',
        observation: '',
      },
      secretariatVisa: {
        status: 'pendente',
        auditedBy: '',
        auditedAt: '',
      }
    };

    addDigitalLessonRecord(newRecord);
    showFeedback(`Lição nº ${lessonForm.lessonNumber} e Assiduidade registadas com sucesso no Livro de Turma Digital!`, 'success');

    // Reset form for next lesson
    setLessonForm(prev => ({
      ...prev,
      lessonNumber: Number(prev.lessonNumber) + 1,
      topic: '',
      objectives: '',
      homework: '',
      pedagogicalObservations: '',
    }));

    setActiveSubTab('lessons_list');
  };

  // Selected Lesson for Detailed Modal Inspection / Pedagogical Visa
  const [selectedLessonForModal, setSelectedLessonForModal] = useState<DigitalLessonRecord | null>(null);
  const [pedagogicalObservationInput, setPedagogicalObservationInput] = useState('');

  const handleGrantPedagogicalVisa = (lessonId: string, status: 'aprovado' | 'com_observacoes') => {
    const reviewer = currentUser?.name ? `${currentUser.name} (DAP)` : 'Dr. João Pedagógico (DAP)';
    pedagogicalVisaLessonRecord(lessonId, {
      status,
      reviewedBy: reviewer,
      observation: pedagogicalObservationInput || (status === 'aprovado' ? 'Sumário e assiduidade validados com conformidade curricular.' : 'Observações pedagógicas registadas.')
    });
    showFeedback('Visto Pedagógico do DAP concedido e assinado digitalmente com sucesso!', 'success');
    setSelectedLessonForModal(null);
    setPedagogicalObservationInput('');
  };

  const handleGrantSecretariatAudit = (lessonId: string) => {
    const auditor = currentUser?.name ? `${currentUser.name} (Secretaria Geral)` : 'Dra. Ana Secretaria (Chefe de Secretaria)';
    secretariatAuditLessonRecord(lessonId, {
      status: 'auditado',
      auditedBy: auditor,
    });
    showFeedback('Assiduidade do docente auditada e homologada pela Secretaria Geral!', 'success');
    setSelectedLessonForModal(null);
  };

  // Teacher Assiduity Statistics (For DAP and Secretariat)
  const teacherAssiduityStats = useMemo(() => {
    const totalLessons = classLessons.length;
    const approvedVisas = classLessons.filter(l => l.pedagogicalVisa?.status === 'aprovado').length;
    const auditedSecretariat = classLessons.filter(l => l.secretariatVisa?.status === 'auditado').length;
    const averageStudentAttendance = totalLessons > 0
      ? (classLessons.reduce((acc, l) => acc + (l.attendanceSummary?.attendanceRate || 0), 0) / totalLessons).toFixed(1)
      : '0.0';

    return {
      totalLessons,
      approvedVisas,
      auditedSecretariat,
      averageStudentAttendance,
      complianceRate: totalLessons > 0 ? ((approvedVisas / totalLessons) * 100).toFixed(1) : '100.0'
    };
  }, [classLessons]);

  // Aggregate student attendance across all lessons for the weekly/term matrix
  const studentAttendanceMatrix = useMemo(() => {
    return classStudents.map(st => {
      let presences = 0;
      let justified = 0;
      let unjustified = 0;
      let lates = 0;

      const marksByLesson: Record<string, string> = {};

      classLessons.forEach(lesson => {
        const record = lesson.attendanceRecords?.find(r => r.studentId === st.id);
        const status = record?.status || 'P';
        marksByLesson[lesson.id] = status;

        if (status === 'P') presences++;
        else if (status === 'FJ') justified++;
        else if (status === 'FI') unjustified++;
        else if (status === 'A') lates++;
      });

      const totalLessonsCount = classLessons.length;
      const rate = totalLessonsCount > 0 ? Number((((presences + lates) / totalLessonsCount) * 100).toFixed(1)) : 100;
      const isRisk = unjustified >= 5;

      return {
        student: st,
        presences,
        justified,
        unjustified,
        lates,
        rate,
        isRisk,
        marksByLesson,
      };
    });
  }, [classStudents, classLessons]);

  return (
    <div className="space-y-6">
      {/* Institutional Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-emerald-50 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <BookOpen size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  MINEDH / SNE Moçambique
                </span>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Ano Letivo 2026
                </span>
                {isPedagogical && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                    <ShieldCheck size={13} /> Fiscalização DAP
                  </span>
                )}
                {isSecretariat && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <FileCheck size={13} /> Auditoria Secretaria
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                Livro de Turma Digital & Diário de Classe
              </h1>
              <p className="text-sm text-slate-500">
                Controlo oficial de assiduidade dos alunos por dia da semana, lançamento do tema da aula e fiscalização pedagógica da assiduidade docente.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveSubTab('official_print')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-all"
            >
              <Printer size={16} /> Imprimir Folha Oficial
            </button>
            {isTeacher && (
              <button
                onClick={() => setActiveSubTab('launch')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-md shadow-emerald-200 transition-all"
              >
                <Plus size={16} /> Lançar Tema & Presença
              </button>
            )}
          </div>
        </div>

        {/* Global Selectors Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Turma
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const firstSub = assignments.find(a => a.classId === e.target.value);
                if (firstSub) setSelectedSubjectId(firstSub.subjectId);
              }}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.gradeLevel || 'Ensino Geral'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Disciplina & Cadeira
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.area || 'Geral'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Trimestre Letivo
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {([1, 2, 3] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTrimester(t)}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                    selectedTrimester === t
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t}º Trim.
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Docente Responsável
            </label>
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm rounded-xl px-3 py-2 font-semibold truncate flex items-center gap-2">
              <UserCheck size={16} className="text-emerald-700 flex-shrink-0" />
              <span className="truncate">{currentAssignment?.teacherName || currentUser?.name || 'Prof. Titular'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border animate-in fade-in slide-in-from-top-2 duration-300 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : feedbackMsg.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' && <CheckCircle2 size={18} className="text-emerald-600" />}
            {feedbackMsg.type === 'error' && <XCircle size={18} className="text-rose-600" />}
            {feedbackMsg.type === 'info' && <Info size={18} className="text-blue-600" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs font-bold underline opacity-70 hover:opacity-100">
            Fechar
          </button>
        </div>
      )}

      {/* Main Subtabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {isTeacher && (
          <button
            onClick={() => setActiveSubTab('launch')}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeSubTab === 'launch'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Plus size={16} /> Lançar Aula & Presença de Hoje
          </button>
        )}

        <button
          onClick={() => setActiveSubTab('lessons_list')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'lessons_list'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardList size={16} /> Folha de Sumários ({classLessons.length} Aulas)
        </button>

        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'matrix'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar size={16} /> Grelha Semanal de Assiduidade dos Alunos
        </button>

        <button
          onClick={() => setActiveSubTab('justifications')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'justifications'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCheck size={16} /> Justificação de Faltas (Assinada pelo Professor)
        </button>

        <button
          onClick={() => setActiveSubTab('teacher_assiduity')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'teacher_assiduity'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck size={16} /> Fiscalização da Assiduidade do Docente (DAP & Secretaria)
        </button>

        <button
          onClick={() => setActiveSubTab('official_print')}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'official_print'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Printer size={16} /> Visualização de Impressão Oficial
        </button>
      </div>

      {/* SUBTAB 1: Lançar Tema da Aula & Presenças de Hoje (Teacher View) */}
      {activeSubTab === 'launch' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveLesson} className="space-y-6">
            {/* Bloco 1: Identificação da Lição e Tema */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                  <FileText size={20} className="text-emerald-600" />
                  <span>1. Registo do Tema da Aula & Dados Curriculares</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {currentClass?.name} • {currentSubject?.name} • {selectedTrimester}º Trimestre
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Data da Lição
                  </label>
                  <input
                    type="date"
                    required
                    value={lessonForm.date}
                    onChange={(e) => setLessonForm({ ...lessonForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  {(() => {
                    const check = validateLessonDateInCalendar(lessonForm.date, selectedTrimester);
                    if (!check.isValid) {
                      return (
                        <div className="mt-1.5 p-2 bg-rose-50 border border-rose-300 rounded-lg text-[11px] font-bold text-rose-900 flex items-center gap-1.5">
                          <AlertTriangle size={13} className="text-rose-600 shrink-0" />
                          <span>{check.reason}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Dia da Semana
                  </label>
                  <select
                    value={lessonForm.dayOfWeek}
                    onChange={(e) => setLessonForm({ ...lessonForm, dayOfWeek: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {DAYS_OF_WEEK.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Número da Lição
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={lessonForm.lessonNumber}
                    onChange={(e) => setLessonForm({ ...lessonForm, lessonNumber: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Tempo Letivo / Bloco
                  </label>
                  <select
                    value={lessonForm.lessonSlot}
                    onChange={(e) => setLessonForm({ ...lessonForm, lessonSlot: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="1º Tempo (07:00 - 07:45)">1º Tempo (07:00 - 07:45)</option>
                    <option value="2º Tempo (07:50 - 08:35)">2º Tempo (07:50 - 08:35)</option>
                    <option value="1º e 2º Tempos (07:00 - 08:35)">1º e 2º Tempos - Bloco Duplo (07:00 - 08:35)</option>
                    <option value="3º e 4º Tempos (08:45 - 10:20)">3º e 4º Tempos - Bloco Duplo (08:45 - 10:20)</option>
                    <option value="5º e 6º Tempos (10:30 - 12:05)">5º e 6º Tempos (10:30 - 12:05)</option>
                    <option value="Tarde: 1º e 2º Tempos (12:30 - 14:05)">Tarde: 1º e 2º Tempos (12:30 - 14:05)</option>
                    <option value="Tarde: 3º e 4º Tempos (14:15 - 15:50)">Tarde: 3º e 4º Tempos (14:15 - 15:50)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Unidade Temática do Programa MINEDH
                  </label>
                  <input
                    type="text"
                    value={lessonForm.unitTopic}
                    onChange={(e) => setLessonForm({ ...lessonForm, unitTopic: e.target.value })}
                    placeholder="Ex: Unidade 1: Equações Quadráticas e Inequações"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>Tema da Aula / Conteúdo Ministrado *</span>
                  <span className="text-slate-400 font-normal lowercase text-xs">Obrigatório para o sumário oficial</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={lessonForm.topic}
                  onChange={(e) => setLessonForm({ ...lessonForm, topic: e.target.value })}
                  placeholder="Ex: Resolução de Equações do 2º Grau pela Fórmula Resolvente de Bhaskara. Análise do discriminante Δ."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Objetivos de Aprendizagem / Competências
                  </label>
                  <textarea
                    rows={2}
                    value={lessonForm.objectives}
                    onChange={(e) => setLessonForm({ ...lessonForm, objectives: e.target.value })}
                    placeholder="Ex: O aluno deve ser capaz de determinar as raízes reais e verificar as soluções."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    TPC / Trabalho Para Casa & Tarefas
                  </label>
                  <textarea
                    rows={2}
                    value={lessonForm.homework}
                    onChange={(e) => setLessonForm({ ...lessonForm, homework: e.target.value })}
                    placeholder="Ex: Livro de Matemática 10ª classe, página 28, exercícios 1 a 5."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Assiduidade do Professor na Lição */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    Estatuto de Presença do Docente Titular nesta Aula
                  </span>
                  <span className="text-xs text-slate-500">
                    Atestado eletrónico de efetividade do professor
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'present', label: 'Aula Dada (Presente)', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
                    { id: 'substitute', label: 'Aula com Substituição', color: 'border-blue-500 bg-blue-50 text-blue-800' },
                    { id: 'compensated', label: 'Aula de Compensação', color: 'border-purple-500 bg-purple-50 text-purple-800' },
                    { id: 'absent_justified', label: 'Falta Justificada', color: 'border-amber-500 bg-amber-50 text-amber-800' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLessonForm({ ...lessonForm, teacherAssiduity: item.id as any })}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                        lessonForm.teacherAssiduity === item.id
                          ? `${item.color} ring-2 ring-emerald-500 shadow-sm`
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {lessonForm.teacherAssiduity === 'substitute' && (
                  <div className="mt-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Nome do Professor Substituto
                    </label>
                    <input
                      type="text"
                      value={lessonForm.substituteTeacherName}
                      onChange={(e) => setLessonForm({ ...lessonForm, substituteTeacherName: e.target.value })}
                      placeholder="Ex: Prof. Mário Cossa"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bloco 2: Controlo Digital de Assiduidade dos Alunos */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                  <Users size={20} className="text-emerald-600" />
                  <span>2. Folha de Chamada & Controlo de Assiduidade dos Alunos</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => markAllStudents('P')}
                    className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                  >
                    <CheckCircle2 size={14} /> Marcar Todos Presentes (P)
                  </button>
                  <button
                    type="button"
                    onClick={() => markAllStudents('FI')}
                    className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                  >
                    <XCircle size={14} /> Todos Faltas (FI)
                  </button>
                </div>
              </div>

              {/* Live Attendance Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div className="text-center p-2 rounded-lg bg-white border border-slate-200">
                  <span className="block text-slate-500 font-medium">Total de Alunos</span>
                  <span className="text-lg font-black text-slate-900">{currentAttendanceSummary.total}</span>
                </div>
                <div className="text-center p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <span className="block text-emerald-700 font-medium">Presentes (P)</span>
                  <span className="text-lg font-black text-emerald-800">{currentAttendanceSummary.present}</span>
                </div>
                <div className="text-center p-2 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="block text-amber-700 font-medium">Faltas Justificadas (FJ)</span>
                  <span className="text-lg font-black text-amber-800">{currentAttendanceSummary.justified}</span>
                </div>
                <div className="text-center p-2 rounded-lg bg-rose-50 border border-rose-200">
                  <span className="block text-rose-700 font-medium">Faltas Injustificadas (FI)</span>
                  <span className="text-lg font-black text-rose-800">{currentAttendanceSummary.unjustified}</span>
                </div>
                <div className="text-center p-2 rounded-lg bg-blue-50 border border-blue-200 col-span-2 sm:col-span-1">
                  <span className="block text-blue-700 font-medium">Taxa de Assiduidade</span>
                  <span className="text-lg font-black text-blue-800">{currentAttendanceSummary.rate}%</span>
                </div>
              </div>

              {/* Students Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900 text-white text-xs uppercase font-black tracking-wider">
                    <tr>
                      <th className="py-3 px-2 text-center w-10">Nº</th>
                      <th className="py-3 px-3">Nome do Aluno</th>
                      <th className="py-3 px-2 text-center w-14">Gên.</th>
                      <th className="py-3 px-3 text-center w-28">Aniversário</th>
                      <th className="py-3 px-3">Nome da Disciplina</th>
                      <th className="py-3 px-1 text-center w-10">P</th>
                      <th className="py-3 px-1 text-center w-10">FJ</th>
                      <th className="py-3 px-1 text-center w-10">FI</th>
                      <th className="py-3 px-2 text-center w-20">% Assid.</th>
                      <th className="py-3 px-3 text-center w-24">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {classStudents.map((st, idx) => {
                      const mark = attendanceMarks[st.id]?.status || 'P';
                      
                      // Calculate individual student assiduity rate
                      const studentLessonMarks = digitalLessonRecords
                        .filter(l => l.classId === selectedClassId && l.trimester === selectedTrimester)
                        .flatMap(l => (l.attendanceRecords || []).filter(r => r.studentId === st.id));
                      
                      const totalLessonsRecorded = studentLessonMarks.length;
                      const presents = studentLessonMarks.filter(m => m.status === 'P' || m.status === 'A').length;
                      const studentRate = totalLessonsRecorded > 0 
                        ? Math.round((presents / totalLessonsRecorded) * 100) 
                        : 100;

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-2 text-center font-bold text-slate-500 text-xs">
                            {st.frequencyNumber || idx + 1}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            <div>{st.fullName || st.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              Proc: {st.processCode || `PROC-2026-${st.id}`}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-xs">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                              st.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {st.gender || 'M'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-xs font-mono text-slate-600">
                            {st.birthDate ? new Date(st.birthDate).toLocaleDateString('pt-PT') : '14/05/2010'}
                          </td>
                          <td className="py-3 px-3 font-bold text-xs text-blue-900">
                            {currentSubject?.name || 'Geral'}
                          </td>

                          {/* P */}
                          <td className="py-3 px-1 text-center">
                            <button
                              type="button"
                              onClick={() => setStudentStatus(st.id, 'P')}
                              className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                                mark === 'P' 
                                  ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30' 
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              P
                            </button>
                          </td>

                          {/* FJ */}
                          <td className="py-3 px-1 text-center">
                            <button
                              type="button"
                              onClick={() => setStudentStatus(st.id, 'FJ')}
                              className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                                mark === 'FJ' 
                                  ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30' 
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              FJ
                            </button>
                          </td>

                          {/* FI */}
                          <td className="py-3 px-1 text-center">
                            <button
                              type="button"
                              onClick={() => setStudentStatus(st.id, 'FI')}
                              className={`w-7 h-7 rounded-lg text-xs font-black transition-all ${
                                mark === 'FI' 
                                  ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30' 
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              FI
                            </button>
                          </td>

                          {/* % Assid. */}
                          <td className="py-3 px-2 text-center font-mono font-black text-xs text-slate-800">
                            {studentRate}%
                          </td>

                          {/* Estado */}
                          <td className="py-3 px-3 text-center">
                            {studentRate >= 85 ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">Activo</span>
                            ) : studentRate >= 75 ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded">Alerta Faltas</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded">Risco Exclusão</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Botão de Gravação e Assinatura Digital do Docente */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Assinatura Eletrónica do Livro de Turma</h4>
                    <p className="text-xs text-slate-400">
                      Ao gravar, o sumário e as faltas são autenticados com o carimbo MINEDH-DIGITAL e enviados para visto do DAP.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setLessonForm(prev => ({
                        ...prev,
                        topic: '',
                        objectives: '',
                        homework: '',
                      }));
                      markAllStudents('P');
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={14} /> Limpar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-sm font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Gravar e Rubricar Lição nº {lessonForm.lessonNumber}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 2: Folha de Sumários / Histórico de Lições Registadas */}
      {activeSubTab === 'lessons_list' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <ClipboardList className="text-emerald-600" size={20} />
                  Folha Oficial de Sumários — {currentClass?.name} ({currentSubject?.name})
                </h3>
                <p className="text-xs text-slate-500">
                  {classLessons.length} Lições lecionadas no {selectedTrimester}º Trimestre • Docente: {currentAssignment?.teacherName || currentUser?.name || 'Prof. Titular'}
                </p>
              </div>

              {/* Filtros */}
              <div className="flex items-center gap-2">
                <select
                  value={filterDay}
                  onChange={(e) => setFilterDay(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 text-slate-700 focus:outline-none"
                >
                  <option value="todos">Todos os Dias da Semana</option>
                  {DAYS_OF_WEEK.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {classLessons.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                <BookOpen size={40} className="mx-auto text-slate-400" />
                <h4 className="font-bold text-slate-700">Nenhum sumário registado para esta turma/disciplina</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Utilize o separador "Lançar Aula & Presença de Hoje" para registrar a primeira lição e controlo de presenças digital.
                </p>
                {isTeacher && (
                  <button
                    onClick={() => setActiveSubTab('launch')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus size={14} /> Registar 1ª Lição
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {classLessons
                  .filter(l => filterDay === 'todos' || l.dayOfWeek === filterDay)
                  .map((lesson) => {
                    const isVisaPending = !lesson.pedagogicalVisa || lesson.pedagogicalVisa.status === 'pendente';
                    const isAuditPending = !lesson.secretariatVisa || lesson.secretariatVisa.status === 'pendente';

                    return (
                      <div
                        key={lesson.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-md transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center border border-emerald-200">
                              L.{lesson.lessonNumber}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{lesson.topic}</span>
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                                <span className="flex items-center gap-1 font-medium text-slate-700">
                                  <Calendar size={13} className="text-emerald-600" />
                                  {lesson.dayOfWeek}, {lesson.date}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-slate-600">
                                  <Clock size={13} />
                                  {lesson.lessonSlot}
                                </span>
                                <span>•</span>
                                <span className="text-emerald-700 font-semibold">{lesson.unitTopic}</span>
                              </div>
                            </div>
                          </div>

                          {/* Visas Badges */}
                          <div className="flex items-center gap-2">
                            {/* DAP Visa Badge */}
                            {lesson.pedagogicalVisa?.status === 'aprovado' ? (
                              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 size={13} /> Visto DAP: Aprovado
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                                <Clock size={13} /> Visto DAP: Pendente
                              </span>
                            )}

                            {/* Secretariat Audit Badge */}
                            {lesson.secretariatVisa?.status === 'auditado' ? (
                              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                                <FileCheck size={13} /> Auditado Secretaria
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                Secretaria: Por auditar
                              </span>
                            )}

                            <button
                              onClick={() => {
                                setSelectedLessonForModal(lesson);
                                setPedagogicalObservationInput(lesson.pedagogicalVisa?.observation || '');
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1 border border-slate-200"
                            >
                              <Eye size={14} /> Detalhes & Visto
                            </button>
                          </div>
                        </div>

                        {/* Summary & Attendance Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                          <div>
                            <span className="font-bold text-slate-600 block mb-0.5">Objetivos da Lição:</span>
                            <p className="text-slate-700">{lesson.objectives || 'Objetivos gerais do plano curricular'}</p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-600 block mb-0.5">Trabalho Para Casa (TPC):</span>
                            <p className="text-slate-700">{lesson.homework || 'Sem TPC atribuído nesta lição'}</p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-600 block mb-0.5">Estatística de Presenças:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-700 font-bold">{lesson.attendanceSummary.presentCount} Presentes</span>
                              <span>•</span>
                              <span className="text-amber-700 font-bold">{lesson.attendanceSummary.justifiedAbsenceCount} FJ</span>
                              <span>•</span>
                              <span className="text-rose-700 font-bold">{lesson.attendanceSummary.unjustifiedAbsenceCount} FI</span>
                              <span>•</span>
                              <span className="text-blue-700 font-bold">{lesson.attendanceSummary.attendanceRate}% Assiduidade</span>
                            </div>
                          </div>
                        </div>

                        {/* Signatures Footer */}
                        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Docente: {lesson.teacherName}</span>
                            <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {lesson.teacherSignatureStamp || 'MINEDH-DIGITAL-ASSIG'}
                            </span>
                          </div>
                          {lesson.pedagogicalVisa?.reviewedBy && (
                            <span className="text-purple-700 font-medium">
                              Visto por: {lesson.pedagogicalVisa.reviewedBy} ({lesson.pedagogicalVisa.visaNumber})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3.5: Justificação de Faltas & Assinatura do Professor */}
      {activeSubTab === 'justifications' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <FileCheck className="text-emerald-600" size={20} />
                  Submissão & Homologação de Justificação de Faltas — {currentClass?.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                  <strong>Regra do Livro de Turma:</strong> Uma vez fechada a chamada de uma lição, os registos ficam imutáveis. Para alterar uma falta injustificada (FI) para falta justificada (FJ), submete-se o pedido indicando o dia e o mês, sendo a falta justificada apenas após a assinatura do professor.
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1">
                <Clock size={14} /> Faltas de Lições Fechadas
              </span>
            </div>

            {/* Form de Submissão de Justificação */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                1. Registar Pedido de Justificação de Falta pelo Aluno / Encarregado
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Seleccionar Aluno da Turma
                  </label>
                  <select
                    value={newJustForm.studentId}
                    onChange={(e) => setNewJustForm({ ...newJustForm, studentId: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">Seleccione o Aluno...</option>
                    {classStudents.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.frequencyNumber || '•'} - {st.fullName || st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Dia da Falta
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={newJustForm.day}
                    onChange={(e) => setNewJustForm({ ...newJustForm, day: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mês da Falta
                  </label>
                  <select
                    value={newJustForm.month}
                    onChange={(e) => setNewJustForm({ ...newJustForm, month: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Doc. Comprovativo / N.º Atestado (Obrigatório) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newJustForm.documentRef}
                    onChange={(e) => setNewJustForm({ ...newJustForm, documentRef: e.target.value })}
                    placeholder="Ex: Atestado Médico nº 1234 (Obrigatório)"
                    className={`w-full bg-white border rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none ${
                      !newJustForm.documentRef ? 'border-amber-400 bg-amber-50/30' : 'border-slate-300'
                    }`}
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">
                    Motivo da Falta / Justificação de Falta ou Reposição de Teste *
                  </label>
                  <input
                    type="text"
                    required
                    value={newJustForm.reason}
                    onChange={(e) => setNewJustForm({ ...newJustForm, reason: e.target.value })}
                    placeholder="Descreva a razão e tipo de pedido (ex: Falta a teste / Reposição de teste por motivo de doença)"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!newJustForm.studentId || !newJustForm.reason) {
                        showFeedback('Por favor seleccione o aluno e indique o motivo da falta/reposição.', 'error');
                        return;
                      }
                      if (!newJustForm.documentRef || !newJustForm.documentRef.trim()) {
                        showFeedback('⚠️ Comprovativo Obrigatório: O sistema não aceita o envio de pedido de justificação de falta ou reposição de teste sem anexar/indicar o documento comprovativo.', 'error');
                        return;
                      }
                      const st = classStudents.find(s => s.id === newJustForm.studentId);
                      const newReq = {
                        id: `just-${Date.now()}`,
                        studentId: newJustForm.studentId,
                        studentName: st?.fullName || st?.name || 'Aluno',
                        lessonRecordId: 'l1',
                        day: newJustForm.day,
                        month: newJustForm.month,
                        subjectName: currentSubject?.name || 'Disciplina',
                        reason: newJustForm.reason,
                        documentRef: newJustForm.documentRef || 'ANEXO-DOC',
                        submittedAt: new Date().toISOString().split('T')[0],
                        status: 'pending' as const
                      };
                      setJustificationRequests(prev => [newReq, ...prev]);
                      setNewJustForm({ studentId: '', day: String(new Date().getDate()), month: 'Outubro', reason: '', documentRef: '' });
                      showFeedback('Pedido de justificação submetido com sucesso! Aguarda assinatura do professor.', 'success');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                  >
                    <Plus size={16} /> Submeter Justificação
                  </button>
                </div>
              </div>
            </div>

            {/* Tabela de Pedidos e Ação de Assinatura do Professor */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                2. Lista de Justificações Registadas & Assinatura Digital do Professor
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white uppercase font-black tracking-wider">
                    <tr>
                      <th className="p-3">Data / Mês da Falta</th>
                      <th className="p-3">Nome do Aluno</th>
                      <th className="p-3">Disciplina</th>
                      <th className="p-3">Motivo & Comprovativo</th>
                      <th className="p-3 text-center">Estado da Falta</th>
                      <th className="p-3 text-center">Assinatura do Professor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {justificationRequests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                          Nenhum pedido de justificação registado.
                        </td>
                      </tr>
                    ) : (
                      justificationRequests.map(req => (
                        <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-extrabold text-slate-900">
                            Dia {req.day} de {req.month}
                          </td>
                          <td className="p-3 font-bold text-slate-800">{req.studentName}</td>
                          <td className="p-3 text-blue-900 font-bold">{req.subjectName}</td>
                          <td className="p-3 text-slate-600">
                            <div>{req.reason}</div>
                            {req.documentRef && (
                              <span className="text-[10px] font-mono text-slate-400">
                                Doc: {req.documentRef}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {req.status === 'signed_approved' ? (
                              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-extrabold rounded-lg border border-amber-300">
                                FJ (Falta Justificada)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold rounded-lg border border-rose-200">
                                FI (Pendente de Assinatura)
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {req.status === 'signed_approved' ? (
                              <div className="flex flex-col items-center">
                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold rounded-lg border border-emerald-300 flex items-center gap-1">
                                  <ShieldCheck size={14} /> Assinado pelo Professor
                                </span>
                                <span className="text-[10px] font-mono text-emerald-700 mt-1">
                                  {req.teacherSignature}
                                </span>
                              </div>
                            ) : isTeacher ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setJustificationRequests(prev => prev.map(r => {
                                    if (r.id === req.id) {
                                      return {
                                        ...r,
                                        status: 'signed_approved',
                                        teacherSignature: `PROF-JUST-STAMP-${Math.floor(100000 + Math.random() * 900000)}`,
                                        signedAt: new Date().toISOString()
                                      };
                                    }
                                    return r;
                                  }));

                                  showFeedback(`Falta do dia ${req.day} de ${req.month} do estudante ${req.studentName} convertida com sucesso de FI para FJ e assinada pelo professor!`, 'success');
                                }}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 mx-auto"
                              >
                                <Award size={14} /> Assinar e Homologar Justificação
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 font-bold">Aguardando Docente</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Grelha Semanal de Assiduidade dos Alunos */}
      {activeSubTab === 'matrix' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Calendar className="text-emerald-600" size={20} />
                Matriz Geral de Assiduidade dos Alunos — {currentClass?.name}
              </h3>
              <p className="text-xs text-slate-500">
                Histórico de presenças por aula e dia da semana no {selectedTrimester}º Trimestre
              </p>
            </div>

            {/* Legenda de Presenças */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> P = Presente
              </span>
              <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> FJ = Falta Justificada
              </span>
              <span className="flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> FI = Falta Injustificada
              </span>
              <span className="flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> A = Atraso
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-3 text-center w-10 sticky left-0 bg-slate-100 z-10">Nº</th>
                  <th className="py-3 px-4 min-w-[200px] sticky left-10 bg-slate-100 z-10">Nome do Aluno</th>
                  <th className="py-3 px-2 text-center w-12">Gên.</th>
                  
                  {/* Lições Headers */}
                  {classLessons.map(l => (
                    <th key={l.id} className="py-2 px-2 text-center min-w-[50px] border-l border-slate-200">
                      <div className="font-bold">L.{l.lessonNumber}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {l.dayOfWeek.slice(0, 3)}
                      </div>
                      <div className="text-[9px] text-slate-400 font-normal">
                        {l.date.slice(5)}
                      </div>
                    </th>
                  ))}

                  <th className="py-3 px-3 text-center bg-emerald-50 text-emerald-900 border-l border-emerald-200 font-bold">
                    P
                  </th>
                  <th className="py-3 px-3 text-center bg-amber-50 text-amber-900 font-bold">
                    FJ
                  </th>
                  <th className="py-3 px-3 text-center bg-rose-50 text-rose-900 font-bold">
                    FI
                  </th>
                  <th className="py-3 px-3 text-center bg-blue-50 text-blue-900 font-bold">
                    % Assid.
                  </th>
                  <th className="py-3 px-3 text-center font-bold">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {studentAttendanceMatrix.map((item, idx) => (
                  <tr key={item.student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500 sticky left-0 bg-white z-10">
                      {item.student.frequencyNumber || idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 sticky left-10 bg-white z-10">
                      {item.student.fullName || item.student.name}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        item.student.gender === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {item.student.gender || 'M'}
                      </span>
                    </td>

                    {/* Lições Marks */}
                    {classLessons.map(l => {
                      const mark = item.marksByLesson[l.id] || 'P';
                      return (
                        <td key={l.id} className="py-2.5 px-2 text-center border-l border-slate-100">
                          <span className={`inline-block w-6 h-6 rounded text-[11px] font-black leading-6 text-center ${
                            mark === 'P'
                              ? 'bg-emerald-100 text-emerald-800'
                              : mark === 'FJ'
                              ? 'bg-amber-100 text-amber-800'
                              : mark === 'FI'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {mark}
                          </span>
                        </td>
                      );
                    })}

                    <td className="py-2.5 px-3 text-center font-bold text-emerald-700 bg-emerald-50/50 border-l border-emerald-100">
                      {item.presences}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-amber-700 bg-amber-50/50">
                      {item.justified}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-700 bg-rose-50/50">
                      {item.unjustified}
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-blue-800 bg-blue-50/50">
                      {item.rate}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.isRisk ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px] flex items-center justify-center gap-1">
                          <AlertTriangle size={11} /> Limite Faltas
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Regular
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 4: Fiscalização da Assiduidade do Docente (DAP & Secretaria) */}
      {activeSubTab === 'teacher_assiduity' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Direção Adjunta Pedagógica (DAP) & Secretaria Geral
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                Painel de Fiscalização & Homologação da Assiduidade Docente
              </h3>
              <p className="text-xs text-slate-500">
                Acompanhamento rigoroso de aulas lecionadas vs previstas, cumprimento de planos analíticos e emissão de vistos oficiais.
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-200 shadow-sm">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block mb-1">
                  Lições Ministradas
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-purple-900">{teacherAssiduityStats.totalLessons}</span>
                  <span className="text-xs text-purple-600 font-semibold">de 40 previstas no trimestre</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 shadow-sm">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  Vistos Pedagógicos DAP
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-900">{teacherAssiduityStats.approvedVisas}</span>
                  <span className="text-xs text-emerald-600 font-semibold">aulas homologadas</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-200 shadow-sm">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block mb-1">
                  Auditorias da Secretaria
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-blue-900">{teacherAssiduityStats.auditedSecretariat}</span>
                  <span className="text-xs text-blue-600 font-semibold">para efeitos de efetividade</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200 shadow-sm">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">
                  Assiduidade Média Alunos
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-900">{teacherAssiduityStats.averageStudentAttendance}%</span>
                  <span className="text-xs text-amber-600 font-semibold">nesta turma/disciplina</span>
                </div>
              </div>
            </div>

            {/* Pending Visas Table for DAP and Secretariat */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-purple-50 p-4 rounded-xl border border-purple-200">
                <div>
                  <h4 className="font-extrabold text-purple-950 text-sm flex items-center gap-2">
                    <ShieldCheck size={18} className="text-purple-700" />
                    Modo Direção Pedagógica (DAP): Verificação e Assinatura de Assiduidade do Professor
                  </h4>
                  <p className="text-xs text-purple-800 font-medium mt-0.5">
                    O Pedagógico acede ao livro da turma exclusivamente para auditar sumários, verificar a efetividade e assinar a presença ou ausência do professor.
                  </p>
                </div>
                {isPedagogical && (
                  <button
                    type="button"
                    onClick={() => {
                      let count = 0;
                      classLessons.forEach(l => {
                        if (l.pedagogicalVisa?.status !== 'aprovado') {
                          handleGrantPedagogicalVisa(l.id, 'aprovado');
                          count++;
                        }
                      });
                      showFeedback(`Homologadas e assina das ${count > 0 ? count : 'todas as'} aulas da turma com Visto Pedagógico DAP!`, 'success');
                    }}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Award size={15} /> Homologar & Assinar Todas em Lote
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold">
                    <tr>
                      <th className="py-3 px-3 text-center">Lição</th>
                      <th className="py-3 px-3">Data / Dia</th>
                      <th className="py-3 px-4">Tema da Lição</th>
                      <th className="py-3 px-3">Docente Titular</th>
                      <th className="py-3 px-3 text-center">Estatuto Professor</th>
                      <th className="py-3 px-3 text-center">Visto DAP</th>
                      <th className="py-3 px-3 text-center">Secretaria</th>
                      <th className="py-3 px-3 text-center">Ações Oficiais DAP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {classLessons.map(lesson => (
                      <tr key={lesson.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          L.{lesson.lessonNumber}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">{lesson.date}</div>
                          <div className="text-slate-400 text-[10px]">{lesson.dayOfWeek}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                          {lesson.topic}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {lesson.teacherName}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            lesson.teacherAssiduity === 'present'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : lesson.teacherAssiduity === 'substitute'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : lesson.teacherAssiduity === 'compensated'
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {lesson.teacherAssiduity === 'present' ? 'AULA DADA (PRESENTE)' :
                             lesson.teacherAssiduity === 'substitute' ? `SUBSTITUÍDO (${lesson.substituteTeacherName || 'PROF'})` :
                             lesson.teacherAssiduity === 'compensated' ? 'AULA DE COMPENSAÇÃO' : 'FALTA JUSTIFICADA'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {lesson.pedagogicalVisa?.status === 'aprovado' ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center gap-1">
                              <CheckCircle2 size={12} /> Assinado DAP
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                              Pendente Visto
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {lesson.secretariatVisa?.status === 'auditado' ? (
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                              Auditado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isPedagogical && (
                              <button
                                onClick={() => handleGrantPedagogicalVisa(lesson.id, 'aprovado')}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded text-[10px] transition-all shadow-sm flex items-center gap-1"
                                title="Assinar presença do professor e validar sumário"
                              >
                                <Award size={12} /> Assinar Presença DAP
                              </button>
                            )}
                            {isSecretariat && (
                              <button
                                onClick={() => handleGrantSecretariatAudit(lesson.id)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-[10px] transition-all shadow-sm flex items-center gap-1"
                              >
                                <FileCheck size={12} /> Auditar
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedLessonForModal(lesson);
                                setPedagogicalObservationInput(lesson.pedagogicalVisa?.observation || '');
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded text-[10px]"
                            >
                              Ver
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: Visualização Oficial de Impressão (Livro de Turma SNE Moçambique) */}
      {activeSubTab === 'official_print' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-200 transition-all"
            >
              <Printer size={16} /> Imprimir Caderno Oficial do Livro de Turma
            </button>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-300 shadow-md text-slate-900 space-y-8 font-serif print:border-none print:shadow-none print:p-0">
            {/* Official MINEDH Header */}
            <div className="text-center space-y-2 border-b-2 border-slate-900 pb-6">
              <div className="flex justify-center mb-2">
                <MozambiqueEmblem size={50} />
              </div>
              <h2 className="text-base font-bold tracking-widest uppercase">
                República de Moçambique
              </h2>
              <h3 className="text-sm font-bold uppercase text-slate-700">
                Ministério da Educação e Desenvolvimento Humano (MINEDH)
              </h3>
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 pt-1">
                LIVRO DE TURMA DIGITAL & DIÁRIO DE CLASSE OFICIAL
              </h1>
            </div>

            {/* School & Class Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans border-b border-slate-200 pb-4">
              <div>
                <span className="text-slate-500 font-bold uppercase block">Escola:</span>
                <span className="font-bold text-slate-900">Escola Secundária Josina Machel</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase block">Turma & Classe:</span>
                <span className="font-bold text-slate-900">{currentClass?.name} ({currentClass?.gradeLevel || '10ª Classe'})</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase block">Disciplina:</span>
                <span className="font-bold text-slate-900">{currentSubject?.name}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold uppercase block">Docente Titular:</span>
                <span className="font-bold text-slate-900">{currentAssignment?.teacherName || currentUser?.name}</span>
              </div>
            </div>

            {/* Official Summary Table */}
            <div className="space-y-2 font-sans">
              <h4 className="font-bold text-sm uppercase text-slate-800">
                I. Folha de Registo dos Temas Ministrados & Assinaturas
              </h4>
              <table className="w-full text-left text-xs border border-slate-400">
                <thead className="bg-slate-100 text-slate-800 uppercase font-bold border-b border-slate-400">
                  <tr>
                    <th className="p-2 border-r border-slate-300 text-center w-12">Lição</th>
                    <th className="p-2 border-r border-slate-300 text-center w-24">Data / Dia</th>
                    <th className="p-2 border-r border-slate-300">Tema da Aula / Conteúdo</th>
                    <th className="p-2 border-r border-slate-300 w-36">TPC / Tarefa</th>
                    <th className="p-2 border-r border-slate-300 text-center w-28">Rubrica Docente</th>
                    <th className="p-2 text-center w-28">Visto do DAP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {classLessons.map(l => (
                    <tr key={l.id}>
                      <td className="p-2 text-center font-bold border-r border-slate-300">{l.lessonNumber}</td>
                      <td className="p-2 text-center border-r border-slate-300">
                        <div>{l.date}</div>
                        <div className="text-[10px] text-slate-500">{l.dayOfWeek}</div>
                      </td>
                      <td className="p-2 font-medium border-r border-slate-300">{l.topic}</td>
                      <td className="p-2 text-slate-600 border-r border-slate-300">{l.homework || '---'}</td>
                      <td className="p-2 text-center border-r border-slate-300 font-mono text-[10px]">
                        {l.teacherSignatureStamp || 'ASSINADO'}
                      </td>
                      <td className="p-2 text-center font-mono text-[10px]">
                        {l.pedagogicalVisa?.status === 'aprovado' ? 'VISTO EM ORDEM' : 'PENDENTE'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Official Signatures Footer */}
            <div className="grid grid-cols-3 gap-8 pt-12 text-center text-xs font-sans">
              <div className="border-t border-slate-900 pt-2">
                <span className="font-bold block">O Professor da Disciplina</span>
                <span className="text-slate-500 block">{currentAssignment?.teacherName || currentUser?.name}</span>
              </div>
              <div className="border-t border-slate-900 pt-2">
                <span className="font-bold block">O Director Adjunto Pedagógico</span>
                <span className="text-slate-500 block">Dr. João Pedagógico (DAP)</span>
              </div>
              <div className="border-t border-slate-900 pt-2">
                <span className="font-bold block">A Chefe da Secretaria Geral</span>
                <span className="text-slate-500 block">Dra. Ana Secretaria</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Lesson Details & Pedagogical Visa Granting */}
      {selectedLessonForModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4 max-h-[90vh] flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  L.{selectedLessonForModal.lessonNumber}
                </div>
                <div>
                  <h3 className="font-black text-lg">Detalhes da Lição & Visto Pedagógico</h3>
                  <p className="text-xs text-slate-400">
                    {selectedLessonForModal.dayOfWeek}, {selectedLessonForModal.date} • {selectedLessonForModal.className}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLessonForModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
              <div>
                <span className="font-bold text-slate-500 uppercase text-xs block">Tema da Aula:</span>
                <p className="font-bold text-slate-900 text-base">{selectedLessonForModal.topic}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="font-semibold text-slate-500 block">Unidade Temática:</span>
                  <span className="font-bold text-slate-800">{selectedLessonForModal.unitTopic || '---'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">Tempo Letivo:</span>
                  <span className="font-bold text-slate-800">{selectedLessonForModal.lessonSlot}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">Docente Titular:</span>
                  <span className="font-bold text-slate-800">{selectedLessonForModal.teacherName}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 block">Carimbo Docente:</span>
                  <span className="font-mono text-emerald-700">{selectedLessonForModal.teacherSignatureStamp || 'MINEDH-VALID'}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase text-xs block mb-1">
                  Parecer / Observação do DAP para o Visto:
                </span>
                <textarea
                  rows={2}
                  value={pedagogicalObservationInput}
                  onChange={(e) => setPedagogicalObservationInput(e.target.value)}
                  placeholder="Inserir nota ou orientação pedagógica para o professor..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              {/* Student Attendance List Preview */}
              <div>
                <span className="font-bold text-slate-700 uppercase text-xs block mb-2">
                  Presenças Registadas nesta Aula ({selectedLessonForModal.attendanceRecords.length} Alunos):
                </span>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                  {selectedLessonForModal.attendanceRecords.map(r => (
                    <div key={r.studentId} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                      <span className="font-medium text-slate-800">{r.studentName}</span>
                      <div className="flex items-center gap-2">
                        {r.justificationReason && (
                          <span className="text-[10px] text-amber-700 italic">({r.justificationReason})</span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          r.status === 'P' ? 'bg-emerald-100 text-emerald-800' :
                          r.status === 'FJ' ? 'bg-amber-100 text-amber-800' :
                          r.status === 'FI' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {r.status === 'P' ? 'Presente' : r.status === 'FJ' ? 'Falta Just.' : r.status === 'FI' ? 'Falta Injust.' : 'Atraso'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
              <button
                onClick={() => setSelectedLessonForModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-all"
              >
                Fechar
              </button>

              <div className="flex items-center gap-2">
                {isSecretariat && (
                  <button
                    onClick={() => handleGrantSecretariatAudit(selectedLessonForModal.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <FileCheck size={14} /> Auditar Secretaria
                  </button>
                )}
                {isPedagogical && (
                  <button
                    onClick={() => handleGrantPedagogicalVisa(selectedLessonForModal.id, 'aprovado')}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 size={14} /> Homologar & Conceder Visto DAP
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
