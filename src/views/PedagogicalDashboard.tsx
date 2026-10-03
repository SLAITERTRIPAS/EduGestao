import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "../store";
import { Card, Button } from "../components/ui";
import {
  FileSpreadsheet,
  Send,
  FileCheck,
  Printer,
  CalendarDays,
  LayoutDashboard,
  ChevronRight,
  BookOpen,
  Users,
  Award,
  CheckCircle,
  Lock,
  AlertCircle,
  Search,
  Filter,
  GraduationCap,
  Clock,
  Plus,
  UserPlus,
  MessageSquare,
  FileText,
  BarChart2,
  FileSignature,
} from "lucide-react";
import { TrimesterReport } from "../types";
import { OfficialPauta } from "../components/OfficialPautas";
import { OfficialMessages } from "../components/OfficialMessages";
import { CollapsibleSidebar } from "../components/CollapsibleSidebar";
import { SidebarMenu } from "../components/SidebarMenu";
import {
  buildOfficialPautaRoster,
  formatTurmaAbrev,
  isLaboralPeriod,
} from "../utils/pautaCalculations";
import { ensureStudentCodeBeforeName } from "../utils/studentCodeValidator";
import { GestaoCorpoDiscente } from "../components/GestaoCorpoDiscente";
import { AcademicCalendarComponent } from "../components/AcademicCalendarComponent";
import { CollaboratorReportDispatcher } from "../components/CollaboratorReportDispatcher";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { SignatureManager } from "../components/SignatureManager";
import { NationalHierarchyStatisticsWorkflow } from "../components/NationalHierarchyStatisticsWorkflow";
import { SchoolNotificationAlerts } from "../components/SchoolNotificationAlerts";
import { UserWorkSummary } from "../components/UserWorkSummary";
import { UnifiedRoleStatisticsView } from "../components/UnifiedRoleStatisticsView";
import { Layers } from "lucide-react";

type Tab =
  | "overview"
  | "calendar"
  | "messages"
  | "reports"
  | "statistics"
  | "signature"
  | "pautas"
  | "exames"
  | "horarios"
  | "disciplinas"
  | "docentes"
  | "corpo_discente"
  | "chat";
type PautaSubView =
  "frequencia" | "pauta_exames" | "admitidos_exames" | "monitoria";

export function PedagogicalDashboard() {
  const {
    classes,
    grades,
    examGrades,
    subjects,
    students,
    assignments,
    reports,
    submitReport,
    publishReport,
    currentUser,
    schools,
    employees,
    assignTeacherCompetencyRole,
    removeTeacherCompetencyRole,
  } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [pautaSubView, setPautaSubView] = useState<PautaSubView>("frequencia");

  useEffect(() => {
    const handleNav = (e: any) => {
      const loc = e.detail?.targetLocation || e.detail?.targetTab;
      if (loc === "messages") setActiveTab("messages");
      else if (loc === "reports") setActiveTab("reports");
      else if (loc === "calendar") setActiveTab("calendar");
      else if (loc === "overview") setActiveTab("overview");
    };
    window.addEventListener("navigate-applet", handleNav);
    return () => window.removeEventListener("navigate-applet", handleNav);
  }, []);

  // Competency Assignment Modal State
  const [competencyModalDocente, setCompetencyModalDocente] = useState<any | null>(null);
  const [selectedRoleType, setSelectedRoleType] = useState<'diretor_turma' | 'delegado_disciplina' | 'delegado_ciclo'>('diretor_turma');
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [targetSubjectId, setTargetSubjectId] = useState<string>('');
  const [targetCiclo, setTargetCiclo] = useState<'1º Ciclo' | '2º Ciclo' | '3º Ciclo'>('1º Ciclo');
  const [competencyFeedback, setCompetencyFeedback] = useState<string | null>(null);

  // Pautas filters
  const [selectedCiclo, setSelectedCiclo] = useState<string>("");
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");

  // Admitidos view filter
  const [admissionFilter, setAdmissionFilter] = useState<
    "todos" | "admitidos" | "dispensados" | "excluidos"
  >("todos");
  const [searchStudent, setSearchStudent] = useState<string>("");

  const myStudents = (students || []).filter((s) => s && s.classId === selectedClass);
  const selectedTurmaObj = (classes || []).find((c) => c && c.id === selectedClass);
  // Include 10ª Classe and 12ª Classe as examination classes
  const isExamClass = [
    "3ª Classe",
    "6ª Classe",
    "9ª Classe",
    "10ª Classe",
    "12ª Classe",
  ].includes(selectedTurmaObj?.gradeLevel || "");

  const userSchool = (schools || []).find((s) => s && s.id === currentUser?.schoolId);
  const schoolName = userSchool ? userSchool.name : "Escola Secundária Central";

  const getStudentSubjectGrade = (
    studentId: string,
    subjectId: string,
    trim: 1 | 2 | 3,
  ) => {
    const grade = grades.find(
      (g) =>
        g.studentId === studentId &&
        g.subjectId === subjectId &&
        g.trimester === trim,
    );
    return grade?.media !== undefined ? Math.round(grade.media) : null;
  };

  const getStudentFinalGrade = (studentId: string, subjectId: string) => {
    const t1 = getStudentSubjectGrade(studentId, subjectId, 1);
    const t2 = getStudentSubjectGrade(studentId, subjectId, 2);
    const t3 = getStudentSubjectGrade(studentId, subjectId, 3);
    const valid = [t1, t2, t3].filter((t) => t !== null) as number[];
    if (valid.length === 0) return null;
    const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
    return avg >= 9.5 ? Math.max(10, Math.round(avg)) : Math.round(avg);
  };

  const getStudentTrimesterAverage = (studentId: string, trim: 1 | 2 | 3) => {
    const valid = subjects
      .map((s) => getStudentSubjectGrade(studentId, s.id, trim))
      .filter((g) => g !== null) as number[];
    if (valid.length === 0) return null;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  };

  const getStudentOverallAverage = (studentId: string) => {
    const valid = subjects
      .map((s) => getStudentFinalGrade(studentId, s.id))
      .filter((g) => g !== null) as number[];
    if (valid.length === 0) return null;
    const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
    return avg >= 9.5 ? Math.max(10, Math.round(avg)) : Math.round(avg);
  };

  const getStatusText = (studentId: string) => {
    const avg = getStudentOverallAverage(studentId);
    if (avg === null) return "-";
    if (isExamClass) {
      if (avg >= 13.5) return "Dispens.";
      if (avg >= 9.5) return "Admit.";
      return "Excl.";
    } else {
      return avg >= 9.5 ? "Aprovado" : "Reprovado";
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes("Dispens")) return "text-green-600 font-bold";
    if (status.includes("Admit")) return "text-blue-600 font-bold";
    if (status.includes("Exc") && !status.includes("Excl"))
      return "text-orange-500";
    if (status.includes("Excl") || status.includes("Reprova"))
      return "text-red-600 font-bold";
    if (status.includes("Aprovado")) return "text-green-600 font-bold";
    return "";
  };

  const getCiclo = (grade: string) => {
    if (["1ª Classe", "2ª Classe", "3ª Classe"].includes(grade))
      return "1º Ciclo Primário";
    if (["4ª Classe", "5ª Classe", "6ª Classe"].includes(grade))
      return "2º Ciclo Primário";
    if (["7ª Classe", "8ª Classe", "9ª Classe"].includes(grade))
      return "1º Ciclo ESG";
    if (["10ª Classe", "11ª Classe", "12ª Classe"].includes(grade))
      return "2º Ciclo ESG";
    return "Outro";
  };

  const availableCiclos = useMemo(() => {
    return Array.from(
      new Set(classes.map((c) => getCiclo(c.gradeLevel))),
    ).sort();
  }, [classes]);

  const availablePeriodos = useMemo(() => {
    return Array.from(
      new Set(
        classes
          .filter((c) => getCiclo(c.gradeLevel) === selectedCiclo)
          .map((c) => c.period || "Manhã"),
      ),
    ).sort();
  }, [classes, selectedCiclo]);

  const availableGrades = useMemo(() => {
    return Array.from(
      new Set(
        classes
          .filter(
            (c) =>
              getCiclo(c.gradeLevel) === selectedCiclo &&
              (c.period || "Manhã") === selectedPeriodo,
          )
          .map((c) => c.gradeLevel),
      ),
    ).sort();
  }, [classes, selectedCiclo, selectedPeriodo]);

  const availableClasses = useMemo(() => {
    return classes.filter(
      (c) =>
        getCiclo(c.gradeLevel) === selectedCiclo &&
        (c.period || "Manhã") === selectedPeriodo &&
        c.gradeLevel === selectedGrade,
    );
  }, [classes, selectedCiclo, selectedPeriodo, selectedGrade]);

  // Auto-select defaults cleanly in a single effect to eliminate cascading re-render loops
  useEffect(() => {
    let nextCiclo = selectedCiclo;
    if (availableCiclos.length > 0 && (!selectedCiclo || !(availableCiclos as any[]).includes(selectedCiclo))) {
      nextCiclo = availableCiclos[0];
      setSelectedCiclo(nextCiclo);
    }

    if (nextCiclo && availablePeriodos.length > 0 && (!selectedPeriodo || !(availablePeriodos as any[]).includes(selectedPeriodo))) {
      setSelectedPeriodo(availablePeriodos[0]);
    }

    if (availableGrades.length > 0 && (!selectedGrade || !availableGrades.includes(selectedGrade))) {
      setSelectedGrade(availableGrades[0]);
    }

    if (availableClasses.length > 0 && (!selectedClass || !availableClasses.some(c => c.id === selectedClass))) {
      setSelectedClass(availableClasses[0].id);
    }
  }, [availableCiclos, availablePeriodos, availableGrades, availableClasses, selectedCiclo, selectedPeriodo, selectedGrade, selectedClass]);

  // Group subjects by area (memoized)
  const csSubjects = useMemo(() => subjects.filter((s) => s.area === "CS"), [subjects]);
  const mcnSubjects = useMemo(() => subjects.filter((s) => s.area === "MCN"), [subjects]);
  const aptpSubjects = useMemo(() => subjects.filter((s) => s.area === "APTP"), [subjects]);

  const hasAreas =
    csSubjects.length > 0 || mcnSubjects.length > 0 || aptpSubjects.length > 0;
  const displaySubjects = useMemo(() => {
    return hasAreas
      ? [...csSubjects, ...mcnSubjects, ...aptpSubjects]
      : subjects;
  }, [hasAreas, csSubjects, mcnSubjects, aptpSubjects, subjects]);

  // Schedule state
  const [scheduleView, setScheduleView] = useState<
    "turma" | "sala" | "docente"
  >("turma");
  const [scheduleRegime, setScheduleRegime] = useState<
    "laboral" | "pos-laboral"
  >("laboral");

  const scheduleSlots = [
    { t: "1º Tempo", laboral: "07:00 - 07:45", pos: "17:00 - 17:45", id: 1 },
    { t: "2º Tempo", laboral: "07:50 - 08:35", pos: "17:50 - 18:35", id: 2 },
    { t: "3º Tempo", laboral: "08:40 - 09:25", pos: "18:40 - 19:25", id: 3 },
    {
      isBreak: true,
      t: "Intervalo",
      laboral: "09:25 - 09:45",
      pos: "19:25 - 19:40",
      id: "break",
    },
    { t: "4º Tempo", laboral: "09:45 - 10:30", pos: "19:40 - 20:25", id: 4 },
    { t: "5º Tempo", laboral: "10:35 - 11:20", pos: "20:30 - 21:15", id: 5 },
  ];

  const [isAddingDocente, setIsAddingDocente] = useState(false);
  const [newDocente, setNewDocente] = useState({
    nome: "",
    email: "",
    telefone: "",
    ciclo: "",
    disciplina: "",
    classe: "",
  });

  // Build complete official pauta roster
  const subjectIds = subjects.map((s) => s.id);
  const officialData = React.useMemo(() => {
    return buildOfficialPautaRoster(students, classes, grades, subjectIds);
  }, [students, classes, grades, subjectIds]);

  // Students in selected class with official pauta calculations
  const classStudentsWithMF = myStudents.map((st) => {
    const rosterRecord = officialData.roster.find(
      (r) => r.student.id === st.id,
    );
    const mf = rosterRecord ? (rosterRecord as any).mf : getStudentOverallAverage(st.id);
    const admissionStatus = rosterRecord
      ? rosterRecord.finalStatus === "DISPENSADO"
        ? "Dispensado"
        : rosterRecord.finalStatus === "ADMITIDO"
          ? "Admitido"
          : "Excluído"
      : "Excluído";

    const pautaNumber = rosterRecord?.pautaNumber ?? null;
    const frequencyNumber =
      rosterRecord?.frequencyNumber ?? (st.frequencyNumber || 1);
    const juriNumber = rosterRecord?.juriNumber ?? 1;
    const turmaAbrev =
      rosterRecord?.turmaAbrev ||
      (selectedTurmaObj ? formatTurmaAbrev(selectedTurmaObj) : "T/A");
    const periodType = rosterRecord?.periodType || "LABORAL";

    return {
      ...st,
      mf,
      admissionStatus,
      pautaNumber,
      frequencyNumber,
      juriNumber,
      turmaAbrev,
      periodType,
    };
  });

  const totalAdmitidos = classStudentsWithMF.filter(
    (s) => s.admissionStatus === "Admitido",
  ).length;
  const totalDispensados = classStudentsWithMF.filter(
    (s) => s.admissionStatus === "Dispensado",
  ).length;
  const totalExcluidos = classStudentsWithMF.filter(
    (s) => s.admissionStatus === "Excluído",
  ).length;
  const taxaAdmissao =
    myStudents.length > 0
      ? Math.round(
          ((totalAdmitidos + totalDispensados) / myStudents.length) * 100,
        )
      : 0;

  // Filter admitted students list
  const filteredAdmittedStudents = classStudentsWithMF.filter((s) => {
    const matchesSearch = s.name
      .toLowerCase()
      .includes(searchStudent.toLowerCase());
    if (!matchesSearch) return false;
    if (admissionFilter === "todos") return true;
    if (admissionFilter === "admitidos")
      return s.admissionStatus === "Admitido";
    if (admissionFilter === "dispensados")
      return s.admissionStatus === "Dispensado";
    if (admissionFilter === "excluidos")
      return s.admissionStatus === "Excluído";
    return true;
  });

  return (
    <CollapsibleSidebar
      sidebarContent={
        <SidebarMenu
          activeTab={activeTab === "chat" ? "messages" : activeTab}
          setActiveTab={(tab) => {
            if (tab === "messages") setActiveTab("chat");
            else setActiveTab(tab as any);
          }}
          additionalContent={
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="px-4 mb-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestão Acadêmica</h3>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("pautas");
                    setPautaSubView("frequencia");
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "pautas" && pautaSubView === "frequencia"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4 text-slate-400" /> Pautas de Frequência
                </button>
                <button
                  onClick={() => {
                    setActiveTab("pautas");
                    setPautaSubView("pauta_exames");
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "pautas" && pautaSubView === "pauta_exames"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Award className="h-4 w-4 text-slate-400" /> Cadernetas e Exames
                </button>
                <button
                  onClick={() => setActiveTab("disciplinas")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "disciplinas"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <BookOpen className="h-4 w-4 text-slate-400" /> Disciplinas
                </button>
                <button
                  onClick={() => setActiveTab("docentes")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "docentes"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Users className="h-4 w-4 text-slate-400" /> Docentes
                </button>
                <button
                  onClick={() => setActiveTab("corpo_discente")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "corpo_discente"
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <GraduationCap className="h-4 w-4 text-slate-400" /> Turmas e Alunos
                </button>
                <button
                  onClick={() => setActiveTab("statistics")}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeTab === "statistics"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Layers className="h-4 w-4 text-indigo-600" /> Estatística dos Ciclos (1º, 2º e 3º)
                </button>
              </div>
            </div>
          }
        />
      }
    >
      <div className="overflow-y-auto p-6 md:p-8 custom-scrollbar">
        {activeTab === "statistics" && (
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
            <UnifiedRoleStatisticsView overrideRole="gestao" />
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
            <AcademicCalendarComponent />
          </div>
        )}

        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <LayoutDashboard className="h-8 w-8 text-blue-600" />
                  Visão Geral Pedagógica
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Indicadores globais de rendimento e gestão académica.
                </p>
              </div>
              <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Ano Lectivo 2026 • 1º Trimestre
                </span>
              </div>
            </header>

            <SchoolNotificationAlerts onNavigateTab={(tab) => setActiveTab(tab as any)} />

            <UserWorkSummary role="pedagogico" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                  Total de Alunos
                </h4>
                <div className="text-4xl font-black text-slate-900">
                  {students.length}
                </div>
              </Card>
              <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                  Turmas Activas
                </h4>
                <div className="text-4xl font-black text-slate-900">
                  {classes.length}
                </div>
              </Card>
              <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                  Pautas Publicadas
                </h4>
                <div className="text-4xl font-black text-slate-900">
                  {reports.filter((r) => r.status === "published").length}
                </div>
              </Card>
              <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                  Aproveitamento
                </h4>
                <div className="text-4xl font-black text-emerald-600">84%</div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "pautas" && (
          <div className="max-w-[100vw] mx-auto pb-12">
            {/* Top Bar with Sub-View Switcher */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Award className="h-6 w-6 text-blue-600" />
                  Módulo de Exames & Pautas Académicas
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Geração automática de admitidos, pauta geral de exames e
                  sincronização em tempo real das notas lançadas pelos docentes.
                </p>
              </div>

              {/* Subtabs */}
              <div className="inline-flex p-1 bg-white rounded-lg border border-gray-200 shadow-sm no-print">
                <button
                  id="tab-frequencia"
                  onClick={() => setPautaSubView("frequencia")}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    pautaSubView === "frequencia"
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Pauta Frequência
                </button>
                <button
                  id="tab-pauta-exames"
                  onClick={() => setPautaSubView("pauta_exames")}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    pautaSubView === "pauta_exames"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Award className="h-3.5 w-3.5" />
                  Pauta Geral de Exames
                </button>
                <button
                  id="tab-admitidos-exames"
                  onClick={() => setPautaSubView("admitidos_exames")}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    pautaSubView === "admitidos_exames"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  Lista de Admitidos ({totalAdmitidos + totalDispensados})
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <Card className="p-4 mb-6 shadow-sm no-print">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Ciclo de Ensino
                  </label>
                  <select
                    className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                    value={selectedCiclo}
                    onChange={(e) => {
                      setSelectedCiclo(e.target.value);
                      setSelectedPeriodo("");
                      setSelectedGrade("");
                      setSelectedClass("");
                    }}
                  >
                    <option value="">Selecione o Ciclo...</option>
                    {availableCiclos.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Período / Turno
                  </label>
                  <select
                    className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                    value={selectedPeriodo}
                    onChange={(e) => {
                      setSelectedPeriodo(e.target.value);
                      setSelectedGrade("");
                      setSelectedClass("");
                    }}
                    disabled={!selectedCiclo}
                  >
                    <option value="">Selecione o Período...</option>
                    {availablePeriodos.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Classe
                  </label>
                  <select
                    className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                    value={selectedGrade}
                    onChange={(e) => {
                      setSelectedGrade(e.target.value);
                      setSelectedClass("");
                    }}
                    disabled={!selectedPeriodo}
                  >
                    <option value="">Selecione a Classe...</option>
                    {availableGrades.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Turma
                  </label>
                  <select
                    className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    disabled={!selectedGrade}
                  >
                    <option value="">Selecione a Turma...</option>
                    {availableClasses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* SUB-VIEW 1: LISTA AUTOMÁTICA DE ADMITIDOS A EXAME */}
            {pautaSubView === "admitidos_exames" && (
              <div className="space-y-6">
                {/* Stats cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 no-print">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <span className="text-xs text-gray-500 font-medium">
                      Total de Candidatos
                    </span>
                    <p className="text-2xl font-extrabold text-gray-900 mt-1">
                      {myStudents.length}
                    </p>
                    <span className="text-[11px] text-gray-400">
                      Inscritos na {selectedTurmaObj?.name || "Turma"}
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm bg-green-50/20">
                    <span className="text-xs text-green-700 font-medium">
                      Admitidos ao Exame
                    </span>
                    <p className="text-2xl font-extrabold text-green-700 mt-1">
                      {totalAdmitidos}
                    </p>
                    <span className="text-[11px] text-green-600 font-medium">
                      Média MF ≥ 9.5
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm bg-blue-50/20">
                    <span className="text-xs text-blue-700 font-medium">
                      Dispensados de Exame
                    </span>
                    <p className="text-2xl font-extrabold text-blue-700 mt-1">
                      {totalDispensados}
                    </p>
                    <span className="text-[11px] text-blue-600 font-medium">
                      Média MF ≥ 13.5
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-red-200 shadow-sm bg-red-50/20">
                    <span className="text-xs text-red-700 font-medium">
                      Excluídos por Frequência
                    </span>
                    <p className="text-2xl font-extrabold text-red-700 mt-1">
                      {totalExcluidos}
                    </p>
                    <span className="text-[11px] text-red-600 font-medium">
                      Média MF &lt; 9.5
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-sm bg-indigo-50/20 col-span-2 md:col-span-1">
                    <span className="text-xs text-indigo-700 font-medium">
                      Taxa de Admissão
                    </span>
                    <p className="text-2xl font-extrabold text-indigo-700 mt-1">
                      {taxaAdmissao}%
                    </p>
                    <span className="text-[11px] text-indigo-600 font-medium">
                      Aptidão a exame
                    </span>
                  </div>
                </div>

                {/* Printable container */}
                <Card
                  id="lista-admitidos-container"
                  className="p-6 bg-white shadow-md border border-gray-200"
                >
                  {/* Official Header */}
                  <div className="text-center pb-6 border-b-2 border-black font-serif relative">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Emblem_of_Mozambique.svg/600px-Emblem_of_Mozambique.svg.png"
                      alt="República de Moçambique"
                      className="mx-auto h-16 w-16 mb-2 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <h1 className="text-base font-bold tracking-wide">
                      REPÚBLICA DE MOÇAMBIQUE
                    </h1>
                    <h2 className="text-sm font-semibold">
                      MINISTÉRIO DA EDUCAÇÃO E DESENVOLVIMENTO HUMANO
                    </h2>
                    <h3 className="text-xs font-bold uppercase text-gray-800">
                      DIRECÇÃO PROVINCIAL DA EDUCAÇÃO DE: MAPUTO CIDADE
                    </h3>
                    <h3 className="text-xs font-semibold uppercase text-gray-700">
                      SERVIÇOS DISTRITAIS DE EDUCAÇÃO, JUVENTUDE E TECNOLOGIA DE: KAMPFUMO
                    </h3>
                    <h3 className="text-sm uppercase font-black text-gray-900 mt-0.5">
                      {schoolName}
                    </h3>
                    <p className="text-xs font-mono font-bold text-blue-900">
                      CÓDIGO INSTITUCIONAL: PT/DCB/EBCHN/SONGO • ANO LECTIVO 2026
                    </p>
                    <div className="mt-3 inline-block bg-gray-100 border border-black px-6 py-1">
                      <h4 className="text-base font-extrabold uppercase tracking-wider">
                        LISTA OFICIAL DE ALUNOS ADMITIDOS AOS EXAMES
                      </h4>
                    </div>
                    <div className="flex justify-center items-center gap-6 mt-4 text-xs font-bold uppercase">
                      <span>
                        Ano Lectivo:{" "}
                        {selectedTurmaObj?.year || new Date().getFullYear()}
                      </span>
                      <span>Classe: {selectedTurmaObj?.gradeLevel}</span>
                      <span>Turma: {selectedTurmaObj?.name}</span>
                      <span>
                        Regime: {selectedTurmaObj?.period || "Diurno"}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 text-right text-[10px] text-gray-500 no-print">
                      Gerado automaticamente pelo Sistema
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-6 no-print">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="h-4 w-4 absolute left-3 top-2.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar aluno por nome..."
                          value={searchStudent}
                          onChange={(e) => setSearchStudent(e.target.value)}
                          className="pl-9 pr-3 py-1.5 text-xs rounded-md border border-gray-300 w-full focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <div className="flex bg-gray-100 rounded-lg p-1 text-xs">
                        <button
                          onClick={() => setAdmissionFilter("todos")}
                          className={`px-3 py-1 rounded-md font-medium transition-all ${admissionFilter === "todos" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"}`}
                        >
                          Todos ({myStudents.length})
                        </button>
                        <button
                          onClick={() => setAdmissionFilter("admitidos")}
                          className={`px-3 py-1 rounded-md font-medium transition-all ${admissionFilter === "admitidos" ? "bg-green-600 text-white shadow-sm" : "text-gray-600"}`}
                        >
                          Admitidos ({totalAdmitidos})
                        </button>
                        <button
                          onClick={() => setAdmissionFilter("dispensados")}
                          className={`px-3 py-1 rounded-md font-medium transition-all ${admissionFilter === "dispensados" ? "bg-blue-600 text-white shadow-sm" : "text-gray-600"}`}
                        >
                          Dispensados ({totalDispensados})
                        </button>
                        <button
                          onClick={() => setAdmissionFilter("excluidos")}
                          className={`px-3 py-1 rounded-md font-medium transition-all ${admissionFilter === "excluidos" ? "bg-red-600 text-white shadow-sm" : "text-gray-600"}`}
                        >
                          Excluídos ({totalExcluidos})
                        </button>
                      </div>

                      <Button
                        onClick={() => window.print()}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 px-3 rounded-md gap-1.5 shadow-sm"
                      >
                        <Printer className="h-3.5 w-3.5" /> Imprimir Lista
                      </Button>
                    </div>
                  </div>

                  {/* Table of Admitted Students */}
                  <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-slate-900 text-white font-bold uppercase font-serif tracking-wider">
                        <tr>
                          <th
                            className="px-3 py-2.5 text-center border-r border-slate-700 w-16"
                            title="Número de identificação por ano letivo durante a frequência nas aulas (não substituível)"
                          >
                            Nº Freq.
                          </th>
                          <th
                            className="px-3 py-2.5 text-center border-r border-slate-700 w-20 text-amber-300"
                            title="Número único atribuído a alunos admitidos aos exames, começando em 1"
                          >
                            Nº Pauta
                          </th>
                          <th
                            className="px-3 py-2.5 text-center border-r border-slate-700 w-20"
                            title="Turma abreviada: ex: T/A=TURMA A"
                          >
                            Turma
                          </th>
                          <th className="px-4 py-2.5 text-left border-r border-slate-700">
                            Nome Completo do Candidato
                          </th>
                          <th
                            className="px-3 py-2.5 text-center border-r border-slate-700 w-28"
                            title="Cada júri é composto por 30 alunos"
                          >
                            Júri (30 Alunos)
                          </th>
                          <th className="px-3 py-2.5 text-center border-r border-slate-700 w-24">
                            Regime
                          </th>
                          <th
                            className="px-3 py-2.5 text-center border-r border-slate-700 w-24 bg-blue-950 text-amber-300"
                            title="Média do Ciclo = Média de Frequência (M.CICLO = M.FREQ)"
                          >
                            MF (M.Ciclo)
                          </th>
                          <th className="px-3 py-2.5 text-center border-r border-slate-700">
                            Disciplinas de Exame
                          </th>
                          <th className="px-4 py-2.5 text-center">
                            Situação Oficial
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200 font-sans">
                        {filteredAdmittedStudents.length === 0 ? (
                          <tr>
                            <td
                              colSpan={9}
                              className="px-6 py-8 text-center text-gray-500 font-medium"
                            >
                              Nenhum estudante encontrado com os filtros
                              selecionados.
                            </td>
                          </tr>
                        ) : (
                          filteredAdmittedStudents.map((st, idx) => {
                            const badgeColor =
                              st.admissionStatus === "Admitido"
                                ? "bg-green-100 text-green-800 border-green-300"
                                : st.admissionStatus === "Dispensado"
                                  ? "bg-blue-100 text-blue-800 border-blue-300"
                                  : "bg-red-100 text-red-800 border-red-300";

                            return (
                              <tr
                                key={st.id}
                                className="hover:bg-amber-50/40 transition-colors"
                              >
                                {/* Nº FREQUÊNCIA: permanente */}
                                <td
                                  className="px-3 py-2.5 text-center font-bold text-gray-900 border-r border-gray-200 bg-gray-50/60"
                                  title="Nº de Frequência na Turma (não substituível)"
                                >
                                  {st.frequencyNumber}
                                </td>

                                {/* Nº PAUTA: único para admitidos, iniciando em 1 */}
                                <td
                                  className="px-3 py-2.5 text-center font-black text-blue-900 border-r border-gray-200 bg-blue-50/30"
                                  title="Nº de Pauta único de exame"
                                >
                                  {st.pautaNumber !== null
                                    ? st.pautaNumber
                                    : "-"}
                                </td>

                                {/* TURMA ABREVIADA */}
                                <td
                                  className="px-3 py-2.5 text-center font-black text-gray-900 border-r border-gray-200"
                                  title={`Turma: ${selectedTurmaObj?.name || "A"}`}
                                >
                                  {st.turmaAbrev}
                                </td>

                                {/* NOME COMPLETO (com código exibido obrigatoriamente antes do nome) */}
                                <td className="px-4 py-2.5 text-left font-bold text-gray-900 border-r border-gray-200">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono text-[11px] font-bold text-blue-900 bg-blue-50/90 border border-blue-200 px-1.5 py-0.5 rounded shadow-2xs select-all">
                                      [{ensureStudentCodeBeforeName(st).code}]
                                    </span>
                                    <span>{st.name}</span>
                                  </div>
                                </td>

                                {/* JÚRI (30 alunos por júri) */}
                                <td className="px-3 py-2.5 text-center font-semibold text-gray-800 border-r border-gray-200">
                                  <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[11px] font-bold">
                                    {`Júri 0${st.juriNumber}`}
                                  </span>
                                </td>

                                {/* REGIME (Diurno/Laboral vs Noturno/Pós-Laboral) */}
                                <td className="px-3 py-2.5 text-center text-gray-700 font-medium border-r border-gray-200">
                                  {st.periodType === "POS_LABORAL" ? (
                                    <span className="text-purple-800 font-bold">
                                      Pós-Laboral
                                    </span>
                                  ) : (
                                    <span className="text-blue-800 font-bold">
                                      Laboral
                                    </span>
                                  )}
                                </td>

                                {/* MF (MÉDIA DO CICLO = MÉDIA DE FREQUÊNCIA) */}
                                <td
                                  className="px-2 py-2 text-center align-middle border-r border-gray-200"
                                  title="Média do Ciclo = Média de Frequência"
                                >
                                  <div className={`flex items-center justify-center w-full h-8 px-2 py-1 rounded border font-mono font-extrabold text-sm shadow-2xs ${
                                    st.mf !== null && st.mf < 9.5
                                      ? 'text-red-700 bg-red-50 border-red-200'
                                      : 'text-blue-900 bg-blue-50 border-blue-200'
                                  }`}>
                                    {st.mf !== null ? st.mf.toFixed(1) : "-"}
                                  </div>
                                </td>

                                <td className="px-3 py-2.5 text-center text-gray-700 border-r border-gray-200">
                                  <span className="truncate block max-w-xs mx-auto text-[11px] font-medium">
                                    Português, Inglês, Francês, História,
                                    Geografia, Matemática, Biologia, Química,
                                    Física
                                  </span>
                                </td>

                                <td className="px-4 py-2.5 text-center">
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}
                                  >
                                    {(st.admissionStatus || 'Admitido').toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures block for official list */}
                  <div className="grid grid-cols-2 gap-8 mt-12 pt-8 border-t border-black text-center text-xs font-serif">
                    <div>
                      <p className="font-bold uppercase">
                        O Director Adjunto Pedagógico
                      </p>
                      <div className="w-48 border-b border-black mx-auto mt-10"></div>
                      <p className="mt-1 text-gray-600">Assinatura & Carimbo</p>
                    </div>
                    <div>
                      <p className="font-bold uppercase">
                        A Directora da Escola
                      </p>
                      <div className="w-48 border-b border-black mx-auto mt-10"></div>
                      <p className="mt-1 text-gray-600">Assinatura & Carimbo</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* SUB-VIEW 2: PAUTA GERAL DE EXAMES (CABEÇALHO DE PAUTA DE EXAME OFICIAL) */}
            {pautaSubView === "pauta_exames" && (
              <div className="space-y-6">
                <OfficialPauta type="exame" selectedTurma={selectedClass} />
              </div>
            )}

            {/* SUB-VIEW 3: PAUTA DE FREQUÊNCIA TRIMESTRAL (CABEÇALHO DE PAUTA DE FREQUÊNCIA OFICIAL) */}
            {pautaSubView === "frequencia" && (
              <div className="space-y-6">
                <OfficialPauta
                  type="frequencia"
                  selectedTurma={selectedClass}
                />
              </div>
            )}
          </div>
        )}

        {/* Gestão de Horários */}
        {activeTab === "horarios" && (
          <div className="max-w-[100vw] mx-auto pb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Gerador de Horário (Docente, Salas & Turmas)
            </h2>
            <Card className="p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <p className="text-sm text-gray-500 mb-4 md:mb-0 max-w-lg">
                  Gestão de salas fixas por curso e salas comuns partilhadas (1º
                  e 2º ano para disciplinas gerais).
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                    <button
                      onClick={() => setScheduleView("turma")}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md ${scheduleView === "turma" ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-600 hover:text-gray-900"}`}
                    >
                      Estudantes (Turma)
                    </button>
                    <button
                      onClick={() => setScheduleView("sala")}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md ${scheduleView === "sala" ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-600 hover:text-gray-900"}`}
                    >
                      Salas de Aula
                    </button>
                    <button
                      onClick={() => setScheduleView("docente")}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md ${scheduleView === "docente" ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-600 hover:text-gray-900"}`}
                    >
                      Docente
                    </button>
                  </div>
                  <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                    <button
                      onClick={() => setScheduleRegime("laboral")}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 ${scheduleRegime === "laboral" ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-600 hover:text-gray-900"}`}
                    >
                      ☀️ Laboral
                    </button>
                    <button
                      onClick={() => setScheduleRegime("pos-laboral")}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md flex items-center gap-2 ${scheduleRegime === "pos-laboral" ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-600 hover:text-gray-900"}`}
                    >
                      🌙 Pós-Laboral
                    </button>
                  </div>
                </div>
              </div>

              {/* Horário Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-blue-50 text-blue-900 border-b border-blue-100">
                    <tr>
                      <th className="px-4 py-4 font-bold border-r border-blue-100 w-40">
                        Tempo / Hora
                      </th>
                      <th className="px-4 py-4 font-bold border-r border-blue-100 text-center uppercase text-xs tracking-wider">
                        Segunda-feira
                      </th>
                      <th className="px-4 py-4 font-bold border-r border-blue-100 text-center uppercase text-xs tracking-wider">
                        Terça-feira
                      </th>
                      <th className="px-4 py-4 font-bold border-r border-blue-100 text-center uppercase text-xs tracking-wider">
                        Quarta-feira
                      </th>
                      <th className="px-4 py-4 font-bold border-r border-blue-100 text-center uppercase text-xs tracking-wider">
                        Quinta-feira
                      </th>
                      <th className="px-4 py-4 font-bold text-center uppercase text-xs tracking-wider">
                        Sexta-feira
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleSlots.map((row) =>
                      row.isBreak ? (
                        <tr
                          key={row.id}
                          className="bg-gray-100/50 border-b border-gray-200"
                        >
                          <td
                            className="px-4 py-3 font-medium text-gray-700 border-r border-gray-200 text-center italic"
                            colSpan={6}
                          >
                            {row.t} (
                            {scheduleRegime === "laboral"
                              ? row.laboral
                              : row.pos}
                            )
                          </td>
                        </tr>
                      ) : (
                        <tr
                          key={row.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-4 border-r border-gray-100 bg-gray-50/50">
                            <div className="font-bold text-gray-900">
                              {row.t}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              {scheduleRegime === "laboral"
                                ? row.laboral
                                : row.pos}
                            </div>
                          </td>
                          {["Seg", "Ter", "Qua", "Qui", "Sex"].map((day) => (
                            <td
                              key={day}
                              className="px-4 py-4 border-r border-gray-100 text-center"
                            >
                              {scheduleView === "docente" ? (
                                <div className="flex flex-col items-center justify-center p-2 rounded-md bg-white border border-gray-100 shadow-sm">
                                  <span className="font-bold text-blue-800">
                                    10ª Classe A
                                  </span>
                                  <span className="text-xs text-gray-500 mt-1">
                                    Sala 04
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center p-2 rounded-md bg-white border border-gray-100 shadow-sm">
                                  <span className="font-bold text-blue-800">
                                    Matemática
                                  </span>
                                  <span className="text-xs text-gray-500 mt-1">
                                    Prof. João Professor
                                  </span>
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Gestão de Disciplinas */}
        {activeTab === "disciplinas" && (
          <div className="max-w-[100vw] mx-auto pb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Gestão de Disciplinas & Classificação de Exames
            </h2>
            <Card className="p-6 border border-gray-200 shadow-sm mb-6">
              <h3 className="text-lg font-bold text-blue-900 mb-6 border-b pb-4">
                Registar Nova Disciplina Académica
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-6">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Ciclo
                  </label>
                  <select className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white">
                    <option>2º Ciclo ESG</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Turma
                  </label>
                  <input
                    type="text"
                    placeholder="Turma A"
                    className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Sala Nº
                  </label>
                  <select className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white">
                    <option>Sala 01</option>
                    <option>Sala 02</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-8">
                <div className="col-span-12 md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nome da Disciplina *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Matemática"
                    className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div className="col-span-12 md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Código da Disciplina *
                  </label>
                  <input
                    type="text"
                    placeholder="MAT-10"
                    className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div className="col-span-12 md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Carga Semanal
                  </label>
                  <select className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white">
                    <option>4h</option>
                    <option>6h</option>
                    <option>8h</option>
                  </select>
                </div>
                <div className="col-span-12 md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Docente Atribuído
                  </label>
                  <select className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white">
                    <option>João Professor</option>
                  </select>
                </div>
                <div className="col-span-12 md:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Classificação para Exame *
                  </label>
                  <select className="block w-full rounded-md border-blue-200 border px-3 py-2 text-sm text-blue-900 bg-blue-50 focus:border-blue-500 focus:ring-blue-500">
                    <option>📚 Disciplina com Exame</option>
                    <option>
                      📖 Disciplina Sem Exame (Avaliação Contínua)
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-6">
                  Salvar Disciplina
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Gestão de Docentes */}
        {activeTab === "docentes" && (
          <div className="max-w-[100vw] mx-auto pb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Gestão de Docentes & Alocações
              </h2>
              {!isAddingDocente && (
                <Button
                  onClick={() => setIsAddingDocente(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  + Adicionar Docente
                </Button>
              )}
            </div>

            {isAddingDocente ? (
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h3 className="text-lg font-bold text-blue-900">
                    Registo de Novo Docente
                  </h3>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingDocente(false)}
                  >
                    Fechar Formulário
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Nome Completo *
                      </label>
                      <input
                        type="text"
                        className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                        value={newDocente.nome}
                        onChange={(e) =>
                          setNewDocente({ ...newDocente, nome: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                        value={newDocente.email}
                        onChange={(e) =>
                          setNewDocente({
                            ...newDocente,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                        value={newDocente.telefone}
                        onChange={(e) =>
                          setNewDocente({
                            ...newDocente,
                            telefone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-700 border-b pb-2 mt-8">
                    Alocação Pedagógica
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Ciclo *
                      </label>
                      <select
                        className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                        value={newDocente.ciclo}
                        onChange={(e) =>
                          setNewDocente({
                            ...newDocente,
                            ciclo: e.target.value,
                          })
                        }
                      >
                        <option value="">Selecione o Ciclo</option>
                        {Array.from(
                          new Set(classes.map((c) => c.gradeLevel)),
                        ).map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Disciplina *
                      </label>
                      <select
                        className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                        value={newDocente.disciplina}
                        onChange={(e) =>
                          setNewDocente({
                            ...newDocente,
                            disciplina: e.target.value,
                          })
                        }
                      >
                        <option value="">Selecione a Disciplina</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Classe / Nível *
                      </label>
                      <select
                        className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                        value={newDocente.classe}
                        onChange={(e) =>
                          setNewDocente({
                            ...newDocente,
                            classe: e.target.value,
                          })
                        }
                      >
                        <option value="">Selecione a Classe</option>
                        {Array.from(
                          new Set(classes.map((c) => c.gradeLevel)),
                        ).map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t mt-8">
                    <Button
                      variant="outline"
                      className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-full px-6"
                      onClick={() => setIsAddingDocente(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6"
                      onClick={() => setIsAddingDocente(false)}
                    >
                      Salvar Docente
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
                      <tr>
                        <th className="px-4 py-3 text-left">Docente</th>
                        <th className="px-4 py-3 text-left">Disciplina(s)</th>
                        <th className="px-4 py-3 text-left">Cargos & Competências Atribuídas</th>
                        <th className="px-4 py-3 text-left">Habilitação / Categoria</th>
                        <th className="px-4 py-3 text-right">Acções de Gestão</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 text-sm">
                      {(employees || [])
                        .filter((e) => e.career === "Docente")
                        .map((doc) => {
                          const hasDiretor = doc.isDiretorTurma;
                          const hasDelegadoDisc = doc.isDelegadoDisciplina;
                          const hasDelegadoCiclo = doc.isDelegadoCiclo;

                          return (
                            <tr key={doc.id} className="hover:bg-blue-50/40 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-gray-900">
                                  {doc.name}
                                </div>
                                <div className="text-xs text-gray-500 font-mono">
                                  ID: {doc.id}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-blue-700 font-medium">
                                {doc.taughtSubjects?.filter(Boolean).join(", ") ||
                                  doc.trainingArea ||
                                  "Geral"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1.5">
                                  {hasDiretor && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                      🎓 Dir. Turma: {doc.diretorTurmaClassName || classes.find(c => c.id === doc.diretorTurmaClassId)?.name || doc.diretorTurmaClassId || 'Atribuída'}
                                    </span>
                                  )}
                                  {hasDelegadoDisc && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                      📖 Del. Disciplina: {doc.delegadoDisciplinaSubjectName || subjects.find(s => s.id === doc.delegadoDisciplinaSubjectId)?.name || doc.delegadoDisciplinaSubjectId || 'Atribuída'}
                                    </span>
                                  )}
                                  {hasDelegadoCiclo && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                                      🔄 Del. Ciclo: {doc.delegadoCicloType || '1º Ciclo'}
                                    </span>
                                  )}
                                  {!hasDiretor && !hasDelegadoDisc && !hasDelegadoCiclo && (
                                    <span className="text-xs text-gray-400 italic">
                                      Docente Regular (sem cargos adicionais)
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600 text-xs">
                                {doc.academicLevel} · {doc.category || "Docente"}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  onClick={() => {
                                    setCompetencyModalDocente(doc);
                                    setSelectedRoleType('diretor_turma');
                                    setTargetClassId(classes[0]?.id || '');
                                    setTargetSubjectId(subjects[0]?.id || '');
                                    setTargetCiclo('1º Ciclo');
                                  }}
                                  className="text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300"
                                >
                                  ⚙️ Atribuir Cargos
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* MODAL DE ATRIBUIÇÃO DE CARGOS AOS DOCENTES */}
                {competencyModalDocente && (
                  <div className="fixed inset-0 bg-slate-900/60  flex items-center justify-center p-4 z-50 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
                      {/* Header */}
                      <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-sm flex items-center gap-2">
                            🎓 Atribuição de Cargos & Competências
                          </h3>
                          <p className="text-xs text-indigo-200 mt-0.5">
                            Docente: <strong>{competencyModalDocente.name}</strong> ({competencyModalDocente.id})
                          </p>
                        </div>
                        <button
                          onClick={() => setCompetencyModalDocente(null)}
                          className="text-white/80 hover:text-white p-1 rounded-full text-sm font-bold"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="p-5 space-y-4 text-xs">
                        {/* Cargos Actuais do Docente */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                          <span className="font-bold text-slate-700 block">Cargos Actuais Registados:</span>
                          <div className="space-y-1.5">
                            {competencyModalDocente.isDiretorTurma && (
                              <div className="flex justify-between items-center bg-purple-50 p-2 rounded border border-purple-200">
                                <span className="text-purple-900 font-bold">
                                  🎓 Diretor de Turma: {competencyModalDocente.diretorTurmaClassName || classes.find(c => c.id === competencyModalDocente.diretorTurmaClassId)?.name || 'Turma'}
                                </span>
                                <button
                                  onClick={() => {
                                    removeTeacherCompetencyRole(competencyModalDocente.id, 'diretor_turma');
                                    setCompetencyModalDocente({ ...competencyModalDocente, isDiretorTurma: false });
                                  }}
                                  className="text-red-600 hover:text-red-800 font-bold text-[10px] bg-red-100/70 px-2 py-0.5 rounded"
                                >
                                  Remover
                                </button>
                              </div>
                            )}

                            {competencyModalDocente.isDelegadoDisciplina && (
                              <div className="flex justify-between items-center bg-amber-50 p-2 rounded border border-amber-200">
                                <span className="text-amber-900 font-bold">
                                  📖 Delegado de Disciplina: {competencyModalDocente.delegadoDisciplinaSubjectName || subjects.find(s => s.id === competencyModalDocente.delegadoDisciplinaSubjectId)?.name || 'Disciplina'}
                                </span>
                                <button
                                  onClick={() => {
                                    removeTeacherCompetencyRole(competencyModalDocente.id, 'delegado_disciplina');
                                    setCompetencyModalDocente({ ...competencyModalDocente, isDelegadoDisciplina: false });
                                  }}
                                  className="text-red-600 hover:text-red-800 font-bold text-[10px] bg-red-100/70 px-2 py-0.5 rounded"
                                >
                                  Remover
                                </button>
                              </div>
                            )}

                            {competencyModalDocente.isDelegadoCiclo && (
                              <div className="flex justify-between items-center bg-indigo-50 p-2 rounded border border-indigo-200">
                                <span className="text-indigo-900 font-bold">
                                  🔄 Delegado do Ciclo: {competencyModalDocente.delegadoCicloType || 'Ciclo'}
                                </span>
                                <button
                                  onClick={() => {
                                    removeTeacherCompetencyRole(competencyModalDocente.id, 'delegado_ciclo');
                                    setCompetencyModalDocente({ ...competencyModalDocente, isDelegadoCiclo: false });
                                  }}
                                  className="text-red-600 hover:text-red-800 font-bold text-[10px] bg-red-100/70 px-2 py-0.5 rounded"
                                >
                                  Remover
                                </button>
                              </div>
                            )}

                            {!competencyModalDocente.isDiretorTurma && !competencyModalDocente.isDelegadoDisciplina && !competencyModalDocente.isDelegadoCiclo && (
                              <p className="text-slate-400 italic text-[11px]">Nenhum cargo especial atribuído no momento.</p>
                            )}
                          </div>
                        </div>

                        {/* Formulário de Atribuição */}
                        <div className="space-y-3 pt-2">
                          <span className="font-bold text-slate-900 text-sm block">Atribuir Novo Cargo:</span>

                          <div>
                            <label className="block text-slate-700 font-bold mb-1">Tipo de Cargo *</label>
                            <div className="grid grid-cols-3 gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedRoleType('diretor_turma')}
                                className={`p-2 rounded-lg border text-center font-bold transition-all ${
                                  selectedRoleType === 'diretor_turma'
                                    ? 'bg-purple-100 border-purple-600 text-purple-900 shadow-xs'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                🎓 Dir. de Turma
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedRoleType('delegado_disciplina')}
                                className={`p-2 rounded-lg border text-center font-bold transition-all ${
                                  selectedRoleType === 'delegado_disciplina'
                                    ? 'bg-amber-100 border-amber-600 text-amber-900 shadow-xs'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                📖 Del. Disciplina
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedRoleType('delegado_ciclo')}
                                className={`p-2 rounded-lg border text-center font-bold transition-all ${
                                  selectedRoleType === 'delegado_ciclo'
                                    ? 'bg-indigo-100 border-indigo-600 text-indigo-900 shadow-xs'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                🔄 Del. do Ciclo
                              </button>
                            </div>
                          </div>

                          {/* Seletor específico dependendo do cargo */}
                          {selectedRoleType === 'diretor_turma' && (
                            <div>
                              <label className="block text-slate-700 font-bold mb-1">Selecionar Turma da qual será Diretor:</label>
                              <select
                                value={targetClassId}
                                onChange={(e) => setTargetClassId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-800"
                              >
                                {classes.map(c => (
                                  <option key={c.id} value={c.id}>
                                    {c.name} ({c.gradeLevel}) • {(c as any).shift || 'Geral'}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {selectedRoleType === 'delegado_disciplina' && (
                            <div>
                              <label className="block text-slate-700 font-bold mb-1">Selecionar Disciplina que irá Coordenar:</label>
                              <select
                                value={targetSubjectId}
                                onChange={(e) => setTargetSubjectId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-800"
                              >
                                {subjects.map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} ({s.area || 'Curricular'})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {selectedRoleType === 'delegado_ciclo' && (
                            <div>
                              <label className="block text-slate-700 font-bold mb-1">Selecionar Ciclo de Ensino:</label>
                              <select
                                value={targetCiclo}
                                onChange={(e) => setTargetCiclo(e.target.value as any)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold text-slate-800"
                              >
                                <option value="1º Ciclo">1º Ciclo (Iniciação & Básico - 1ª à 3ª / 8ª Classe)</option>
                                <option value="2º Ciclo">2º Ciclo (Intermédio & Transição - 4ª à 6ª / 9ª-10ª Classe)</option>
                                <option value="3º Ciclo">3º Ciclo (Conclusão & Pré-Universitário - 7ª / 11ª-12ª Classe)</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Botões do Modal */}
                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                          <Button
                            variant="outline"
                            onClick={() => setCompetencyModalDocente(null)}
                          >
                            Fechar
                          </Button>
                          <Button
                            onClick={() => {
                              const targetClass = classes.find(c => c.id === targetClassId) || classes[0];
                              const targetSubject = subjects.find(s => s.id === targetSubjectId) || subjects[0];

                              if (selectedRoleType === 'diretor_turma') {
                                assignTeacherCompetencyRole(competencyModalDocente.id, {
                                  roleType: 'diretor_turma',
                                  classId: targetClass?.id,
                                  className: targetClass?.name
                                });
                                setCompetencyModalDocente({
                                  ...competencyModalDocente,
                                  isDiretorTurma: true,
                                  diretorTurmaClassId: targetClass?.id,
                                  diretorTurmaClassName: targetClass?.name
                                });
                              } else if (selectedRoleType === 'delegado_disciplina') {
                                assignTeacherCompetencyRole(competencyModalDocente.id, {
                                  roleType: 'delegado_disciplina',
                                  subjectId: targetSubject?.id,
                                  subjectName: targetSubject?.name
                                });
                                setCompetencyModalDocente({
                                  ...competencyModalDocente,
                                  isDelegadoDisciplina: true,
                                  delegadoDisciplinaSubjectId: targetSubject?.id,
                                  delegadoDisciplinaSubjectName: targetSubject?.name
                                });
                              } else if (selectedRoleType === 'delegado_ciclo') {
                                assignTeacherCompetencyRole(competencyModalDocente.id, {
                                  roleType: 'delegado_ciclo',
                                  ciclo: targetCiclo
                                });
                                setCompetencyModalDocente({
                                  ...competencyModalDocente,
                                  isDelegadoCiclo: true,
                                  delegadoCicloType: targetCiclo
                                });
                              }
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                          >
                            ✓ Atribuir & Gravar Cargo
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botão para registar novo docente no final da lista */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/70 p-3 rounded-lg">
                  <div className="text-xs text-gray-500">
                    Total de{" "}
                    <strong>
                      {
                        (employees || []).filter((e) => e.career === "Docente")
                          .length
                      }
                    </strong>{" "}
                    docentes registados na instituição.
                  </div>
                  <Button
                    id="btn-registar-novo-docente-fim-lista"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer"
                    onClick={() => setIsAddingDocente(true)}
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Registar Novo Docente</span>
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {activeTab === "reports" && (
          <div className="w-full animate-in fade-in">
            <ErrorBoundary fallbackTitle="Erro ao Carregar Relatório de Atividades">
              <CollaboratorReportDispatcher />
            </ErrorBoundary>
          </div>
        )}

        {activeTab === "signature" && (
          <div className="max-w-5xl mx-auto pb-12">
            <SignatureManager />
          </div>
        )}

        {activeTab === "corpo_discente" && (
          <div className="max-w-[100vw] mx-auto pb-12">
            <GestaoCorpoDiscente />
          </div>
        )}

        {(activeTab === "chat" || activeTab === "messages") && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4">
            <OfficialMessages />
          </div>
        )}
      </div>
    </CollapsibleSidebar>
  );
}
