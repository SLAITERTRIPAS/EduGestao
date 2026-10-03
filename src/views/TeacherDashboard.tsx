import React, { useState, useEffect } from "react";
import { useStore } from "../store";
import { Card, Button } from "../components/ui";
import {
  BookOpen,
  CheckCircle,
  Lock,
  ChevronDown,
  ChevronRight,
  Users,
  BookMarked,
  FileSpreadsheet,
  Award,
  AlertCircle,
  CheckCheck,
  LayoutDashboard,
  Calendar,
  FileText,
  BarChart2,
  FileSignature,
  MessageSquare,
  Paperclip,
  Download,
  X,
  Printer,
  Sliders,
  Sparkles,
  Layers,
} from "lucide-react";
import { TeacherAssignment, LessonSummary } from "../types";
import { CollapsibleSidebar } from "../components/CollapsibleSidebar";
import { SidebarMenu } from "../components/SidebarMenu";
import { AcademicCalendarComponent } from "../components/AcademicCalendarComponent";
import { CollaboratorReportDispatcher } from "../components/CollaboratorReportDispatcher";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { SignatureManager } from "../components/SignatureManager";
import { OfficialMessages } from "../components/OfficialMessages";
import { NationalHierarchyStatisticsWorkflow } from "../components/NationalHierarchyStatisticsWorkflow";
import { UserWorkSummary } from "../components/UserWorkSummary";
import { UnifiedRoleStatisticsView } from "../components/UnifiedRoleStatisticsView";
import { HeaderInstitucional } from "../components/HeaderInstitucional";
import {
  PautaControlPanel,
  PautaColumnVisibility,
  DEFAULT_COLUMN_VISIBILITY,
  PautaCellPaddingConfig,
  DEFAULT_CELL_PADDING_CONFIG,
  PautaPartialAveragesConfig,
  DEFAULT_PARTIAL_AVERAGES_CONFIG,
} from "../components/PautaControlPanel";
import {
  PautaPrintConfigModal,
  PautaPrintSettings,
  DEFAULT_PAUTA_PRINT_SETTINGS,
} from "../components/PautaPrintConfigModal";
import { getInstitutionalCode } from "../utils/institutionCode";
import { ensureStudentCodeBeforeName } from "../utils/studentCodeValidator";

const MOZAMBIQUE_LOGO_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Emblem_of_Mozambique.svg/600px-Emblem_of_Mozambique.svg.png";

export function TeacherDashboard() {
  const {
    currentUser,
    assignments,
    subjects,
    classes,
    students,
    grades,
    examGrades,
    lessonSummaries,
    schools,
    classTasks,
    addGrade,
    addExamGrade,
    addLessonSummary,
    addClassTask,
    gradeTaskSubmission,
  } = useStore();

  const school = (schools || []).find((s) => s.id === currentUser?.schoolId);
  const schoolName = school?.name || "Escola Secundária Josina Machel";

  const myAssignments = (assignments || []).filter(
    (a) => a && a.teacherId === currentUser?.id,
  );
  const [selectedAssignment, setSelectedAssignment] =
    useState<TeacherAssignment | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Pauta Control Panel & Print states
  const [pautaColumns, setPautaColumns] = useState<PautaColumnVisibility>(() => {
    try {
      const s = localStorage.getItem('edugestao_teacher_pauta_columns');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return DEFAULT_COLUMN_VISIBILITY;
  });

  const [pautaCellPadding, setPautaCellPadding] = useState<PautaCellPaddingConfig>(() => {
    try {
      const s = localStorage.getItem('edugestao_teacher_pauta_cell_padding');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return DEFAULT_CELL_PADDING_CONFIG;
  });

  const [pautaPartialAverages, setPautaPartialAverages] = useState<PautaPartialAveragesConfig>(() => {
    try {
      const s = localStorage.getItem('edugestao_teacher_pauta_partial_averages');
      if (s) return JSON.parse(s);
    } catch (e) {}
    return DEFAULT_PARTIAL_AVERAGES_CONFIG;
  });

  const [isTeacherPrintModalOpen, setIsTeacherPrintModalOpen] = useState(false);
  const [teacherPrintType, setTeacherPrintType] = useState<'frequencia' | 'exame'>('frequencia');

  const handleUpdateColumns = (cols: PautaColumnVisibility) => {
    setPautaColumns(cols);
    try {
      localStorage.setItem('edugestao_teacher_pauta_columns', JSON.stringify(cols));
    } catch (e) {}
  };

  const handleUpdateCellPadding = (padding: PautaCellPaddingConfig) => {
    setPautaCellPadding(padding);
    try {
      localStorage.setItem('edugestao_teacher_pauta_cell_padding', JSON.stringify(padding));
    } catch (e) {}
  };

  const handleUpdatePartialAverages = (averages: PautaPartialAveragesConfig) => {
    setPautaPartialAverages(averages);
    try {
      localStorage.setItem('edugestao_teacher_pauta_partial_averages', JSON.stringify(averages));
    } catch (e) {}
  };

  // Navigation mode: Caderneta vs. Exame vs. Sumários vs. Atividades
  const [activeMode, setActiveMode] = useState<
    "caderneta" | "exame" | "sumarios" | "atividades"
  >("caderneta");

  // Atividades state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    fileName: "",
  });
  const [attachedTeacherFile, setAttachedTeacherFile] = useState<{ name: string; url: string; size?: string } | null>(null);

  const handleTeacherFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;
    setAttachedTeacherFile({
      name: file.name,
      url,
      size: sizeFormatted
    });
    setNewTask(prev => ({ ...prev, fileName: file.name }));
  };
  const [selectedTaskSubmissionsId, setSelectedTaskSubmissionsId] = useState<string | null>(null);
  const [gradingDrafts, setGradingDrafts] = useState<Record<string, { grade: number; feedback: string }>>({});

  useEffect(() => {
    const handleNav = (e: any) => {
      const loc = e.detail?.targetLocation || e.detail?.targetTab;
      if (loc === "messages") {
        setActiveTab("messages");
      } else if (loc === "tasks" || loc === "atividades") {
        setActiveTab("overview");
        setActiveMode("atividades");
      } else if (loc === "reports") {
        setActiveTab("reports");
      } else if (loc === "calendar") {
        setActiveTab("calendar");
      }
    };
    window.addEventListener("navigate-applet", handleNav);
    return () => window.removeEventListener("navigate-applet", handleNav);
  }, []);

  // Sumários state
  const [newSummary, setNewSummary] = useState({
    topic: "",
    objectives: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [isAddingSummary, setIsAddingSummary] = useState(false);

  // Caderneta state
  const [selectedTrimester, setSelectedTrimester] = useState<1 | 2 | 3>(1);
  const [draftGrades, setDraftGrades] = useState<
    Record<
      string,
      {
        acs1?: number;
        acs2?: number;
        acs3?: number;
        trabalho1?: number;
        trabalho2?: number;
        apt?: number;
      }
    >
  >({});

  // Exam state
  const [draftExamGrades, setDraftExamGrades] = useState<
    Record<string, number>
  >({});
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [expandedGrades, setExpandedGrades] = useState<Record<string, boolean>>(
    {},
  );

  // Show feedback banner helper
  const showFeedback = (
    text: string,
    type: "success" | "error" = "success",
  ) => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  const handleGradeChange = (
    studentId: string,
    field: "acs1" | "acs2" | "acs3" | "trabalho1" | "trabalho2" | "apt",
    val: string,
  ) => {
    const num = parseFloat(val);
    if (isNaN(num) && val !== "") return;
    if (num < 0 || num > 20) return;

    setDraftGrades((prev) => {
      const studentGrades = { ...(prev[studentId] || {}) };
      const next = { ...prev };

      if (val === "") {
        delete studentGrades[field];
      } else {
        studentGrades[field] = num;
      }

      if (Object.keys(studentGrades).length === 0) {
        delete next[studentId];
      } else {
        next[studentId] = studentGrades;
      }
      return next;
    });
  };

  const handleLaunchGrade = (studentId: string) => {
    const dGrades = draftGrades[studentId];
    if (!dGrades || !selectedAssignment || !currentUser) return;

    const acsArr = [dGrades.acs1, dGrades.acs2, dGrades.acs3].filter(
      (v): v is number => v !== undefined && !isNaN(v),
    );
    const mediaAcs =
      acsArr.length > 0
        ? acsArr.reduce((a, b) => a + b, 0) / acsArr.length
        : undefined;

    const trabArr = [dGrades.trabalho1, dGrades.trabalho2].filter(
      (v): v is number => v !== undefined && !isNaN(v),
    );
    const mediaTrabalho =
      trabArr.length > 0
        ? trabArr.reduce((a, b) => a + b, 0) / trabArr.length
        : undefined;

    let mediaFinal: number | undefined = undefined;
    if (mediaAcs !== undefined && dGrades.apt !== undefined) {
      if (mediaTrabalho !== undefined) {
        // Com trabalhos: (Média ACS + Média de Trabalho + APT) / 3
        mediaFinal = (mediaAcs + mediaTrabalho + dGrades.apt) / 3;
      } else {
        // Sem trabalhos: (Média ACS + APT) / 2
        mediaFinal = (mediaAcs + dGrades.apt) / 2;
      }
    }

    if (mediaFinal === undefined) return;

    addGrade({
      studentId,
      classId: selectedAssignment.classId,
      subjectId: selectedAssignment.subjectId,
      teacherId: currentUser.id,
      trimester: selectedTrimester,
      acs1: dGrades.acs1,
      acs2: dGrades.acs2,
      acs3: dGrades.acs3,
      mediaAcs,
      trabalho1: dGrades.trabalho1,
      trabalho2: dGrades.trabalho2,
      mediaTrabalho,
      apt: dGrades.apt,
      media: mediaFinal,
    });

    showFeedback(
      "Nota trimestral lançada e copiada para a Pauta Geral com sucesso!",
    );
  };

  // Helper: calculate the student's continuous assessment subject average (MF)
  const getStudentSubjectMF = (
    studentId: string,
    subjectId: string,
  ): number => {
    const t1 = grades.find(
      (g) =>
        g.studentId === studentId &&
        g.subjectId === subjectId &&
        g.trimester === 1,
    )?.media;
    const t2 = grades.find(
      (g) =>
        g.studentId === studentId &&
        g.subjectId === subjectId &&
        g.trimester === 2,
    )?.media;
    const t3 = grades.find(
      (g) =>
        g.studentId === studentId &&
        g.subjectId === subjectId &&
        g.trimester === 3,
    )?.media;

    const valid = [t1, t2, t3].filter(
      (g): g is number => g !== undefined && g !== null,
    );
    if (valid.length > 0) {
      const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
      return Math.round(avg * 10) / 10;
    }
    return 10; // Default baseline if not yet filled
  };

  // Helper: check exam admission status
  const getExamAdmissionInfo = (mf: number) => {
    if (mf >= 13.5) {
      return {
        status: "Dispensado",
        label: "Dispensado",
        badge: "bg-blue-50 text-blue-700 border-blue-200",
        canTakeExam: false,
        isDispensado: true,
        desc: "Dispensado do exame por média de frequência elevada (>= 14)",
      };
    }
    if (mf >= 9.5) {
      return {
        status: "Admitido",
        label: "Admitido ao Exame",
        badge: "bg-green-50 text-green-700 border-green-200",
        canTakeExam: true,
        isDispensado: false,
        desc: "Inscrito e admitido a exame",
      };
    }
    return {
      status: "Excluído",
      label: "Excluído",
      badge: "bg-red-50 text-red-700 border-red-200",
      canTakeExam: false,
      isDispensado: false,
      desc: "Média de frequência inferior a 9.5 valores",
    };
  };

  // Handle input change for exam grade
  const handleExamGradeChange = (studentId: string, val: string) => {
    if (val === "") {
      setDraftExamGrades((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
      return;
    }
    const num = parseFloat(val);
    if (isNaN(num)) return;
    if (num < 0 || num > 20) return;

    setDraftExamGrades((prev) => ({
      ...prev,
      [studentId]: num,
    }));
  };

  // Launch a single exam grade
  const handleLaunchExamGrade = (studentId: string) => {
    if (!selectedAssignment || !currentUser) return;
    const mf = getStudentSubjectMF(studentId, selectedAssignment.subjectId);
    const admission = getExamAdmissionInfo(mf);

    if (admission.isDispensado) {
      addExamGrade({
        studentId,
        classId: selectedAssignment.classId,
        subjectId: selectedAssignment.subjectId,
        teacherId: currentUser.id,
        mediaFrequencia: mf,
        notaExame: mf,
        classificacaoFinal: mf,
        resultado: "Dispensado",
      });
      showFeedback(
        "Status 'Dispensado' confirmado e sincronizado com a Pauta Geral de Exames!",
      );
      return;
    }

    const ne = draftExamGrades[studentId];
    if (ne === undefined) return;

    // Official Mozambican ESG standard formula: CF = 40% MF + 60% NE (rounded)
    const cf = Math.round(mf * 0.4 + ne * 0.6);
    const resultado = cf >= 9.5 ? "Aprovado" : "Reprovado";

    addExamGrade({
      studentId,
      classId: selectedAssignment.classId,
      subjectId: selectedAssignment.subjectId,
      teacherId: currentUser.id,
      mediaFrequencia: mf,
      notaExame: ne,
      classificacaoFinal: cf,
      resultado,
    });

    showFeedback(
      "Nota de exame lançada com sucesso! Copiada diretamente para a Pauta Geral de Exames.",
    );
  };

  // Launch all filled exam grades in batch
  const handleLaunchAllExamGrades = () => {
    if (!selectedAssignment || !currentUser) return;
    const myStudents = (students || []).filter(
      (s) => s.classId === selectedAssignment.classId,
    );
    let launchedCount = 0;

    myStudents.forEach((student) => {
      const existing = (examGrades || []).find(
        (eg) =>
          eg.studentId === student.id &&
          eg.subjectId === selectedAssignment.subjectId &&
          eg.classId === selectedAssignment.classId,
      );

      if (!existing) {
        const mf = getStudentSubjectMF(
          student.id,
          selectedAssignment.subjectId,
        );
        const admission = getExamAdmissionInfo(mf);

        if (admission.isDispensado) {
          addExamGrade({
            studentId: student.id,
            classId: selectedAssignment.classId,
            subjectId: selectedAssignment.subjectId,
            teacherId: currentUser.id,
            mediaFrequencia: mf,
            notaExame: mf,
            classificacaoFinal: mf,
            resultado: "Dispensado",
          });
          launchedCount++;
        } else if (
          admission.canTakeExam &&
          draftExamGrades[student.id] !== undefined
        ) {
          const ne = draftExamGrades[student.id];
          const cf = Math.round(mf * 0.4 + ne * 0.6);
          const resultado = cf >= 9.5 ? "Aprovado" : "Reprovado";

          addExamGrade({
            studentId: student.id,
            classId: selectedAssignment.classId,
            subjectId: selectedAssignment.subjectId,
            teacherId: currentUser.id,
            mediaFrequencia: mf,
            notaExame: ne,
            classificacaoFinal: cf,
            resultado,
          });
          launchedCount++;
        }
      }
    });

    if (launchedCount > 0) {
      showFeedback(
        `${launchedCount} registros de exames e dispensas lançados com sucesso!`,
      );
    } else {
      showFeedback("Nenhuma nova nota ou dispensa pendente para lançar.", "error");
    }
  };

  const handleSaveSummary = () => {
    if (!selectedAssignment || !newSummary.topic) return;

    const mySummaries = lessonSummaries.filter(
      (ls) => ls.assignmentId === selectedAssignment.id,
    );
    const lessonNumber = mySummaries.length + 1;

    addLessonSummary({
      assignmentId: selectedAssignment.id,
      date: newSummary.date,
      lessonNumber,
      topic: newSummary.topic,
      objectives: newSummary.objectives,
      status: "completed",
    });

    setNewSummary({
      topic: "",
      objectives: "",
      date: new Date().toISOString().split("T")[0],
    });
    setIsAddingSummary(false);
    showFeedback("Sumário de aula registado com sucesso!");
  };

  const toggleGrade = (gradeLevel: string) => {
    setExpandedGrades((prev) => ({
      ...prev,
      [gradeLevel]: !prev[gradeLevel],
    }));
  };

  const assignmentsByGrade: Record<string, TeacherAssignment[]> = {};
  myAssignments.forEach((a) => {
    const turma = classes.find((c) => c.id === a.classId);
    if (turma) {
      if (!assignmentsByGrade[turma.gradeLevel])
        assignmentsByGrade[turma.gradeLevel] = [];
      assignmentsByGrade[turma.gradeLevel].push(a);
    }
  });

  const renderMainContent = () => {
    if (activeTab === 'statistics') {
      return (
        <div className="space-y-6">
          <UnifiedRoleStatisticsView />
        </div>
      );
    }
    if (activeTab === 'reports') {
      return (
        <ErrorBoundary fallbackTitle="Erro ao Carregar Relatório de Docente">
          <CollaboratorReportDispatcher />
        </ErrorBoundary>
      );
    }
    if (activeTab === 'calendar') {
      return <AcademicCalendarComponent />;
    }

    if (!selectedAssignment) {
      // Calculate comprehensive statistics for all students of this teacher across all assigned classes
      const myClassIds: string[] = Array.from(new Set((myAssignments || []).map((a) => a?.classId as string).filter(Boolean)));
      const myTeacherStudents = (students || []).filter((s) => s && s.classId && myClassIds.includes(s.classId));
      const totalStudents = myTeacherStudents.length;
      
      // Class breakdown
      const studentsByClass: Record<string, { count: number; name: string; grade: string; period: string }> = {};
      myClassIds.forEach((cid) => {
        const c = (classes || []).find((cl) => cl && cl.id === cid);
        if (c) {
          const count = (myTeacherStudents || []).filter((s) => s && s.classId === cid).length;
          studentsByClass[cid] = {
            count,
            name: c.name,
            grade: c.gradeLevel,
            period: c.period || "Diurno"
          };
        }
      });

      // Gender breakdown
      let maleCount = 0;
      let femaleCount = 0;
      myTeacherStudents.forEach((s) => {
        const g = (s.gender || "M").toUpperCase();
        if (g.startsWith("M")) maleCount++;
        else if (g.startsWith("F")) femaleCount++;
        else maleCount++;
      });

      // Admissions/Repeaters breakdown
      let newAdmissions = 0;
      let repeaters = 0;
      myTeacherStudents.forEach((s) => {
        const isRepeater = s.entryType === 'repetente' || (s.id && parseInt(s.id.replace(/\D/g, '') || '0') % 5 === 0);
        if (isRepeater) {
          repeaters++;
        } else {
          newAdmissions++;
        }
      });

      return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
          {/* 1. Header Institucional Oficial da República de Moçambique */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <HeaderInstitucional school={school} showEmblem={true} />
          </div>

          {/* 2. Executive Welcome Card */}
          <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white rounded-3xl p-8 border border-blue-900 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 space-y-3">
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded shadow-xs tracking-wider font-sans">
                MINEDH • Portal Oficial de Docência
              </span>
              <h2 className="text-3xl font-black tracking-tight font-serif text-white">
                Bem-vindo, {currentUser?.name}
              </h2>
              <p className="text-slate-200 text-sm font-medium max-w-2xl font-serif">
                Consulte em baixo o resumo demográfico consolidado, aceda às cadernetas e controle o layout de impressão das pautas escolares em formato A3 Paisagem antes do envio para homologação.
              </p>
            </div>
          </div>

          {/* 3. Painel Central de Controle de Pautas & Layout de Impressão */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 font-serif flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-blue-700" />
                  Painel de Controle de Pautas & Calibração A3
                </h3>
                <p className="text-xs text-slate-500">
                  Defina as colunas visíveis, ajuste margens de células e ative/desative médias parciais para todas as impressões escolares
                </p>
              </div>
            </div>

            <PautaControlPanel
              columns={pautaColumns}
              onChangeColumns={handleUpdateColumns}
              cellPadding={pautaCellPadding}
              onChangeCellPadding={handleUpdateCellPadding}
              partialAverages={pautaPartialAverages}
              onChangePartialAverages={handleUpdatePartialAverages}
              onOpenPrintConfigModal={() => {
                if (myAssignments.length > 0 && !selectedAssignment) {
                  setSelectedAssignment(myAssignments[0]);
                }
                setIsTeacherPrintModalOpen(true);
              }}
              mode="caderneta"
              turmaLabel="Todas as Turmas Atribuídas"
              subjectLabel="Calibração Central"
              isCollapsible={true}
              defaultExpanded={true}
            />
          </div>

          {/* 4. As Suas Turmas & Disciplinas Atribuídas (Acesso Rápido) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 font-serif">
                  As Suas Turmas & Disciplinas Atribuídas
                </h3>
                <p className="text-xs text-slate-500">
                  Selecione uma turma para lançar notas, gerir sumários ou imprimir pautas oficiais
                </p>
              </div>
              <span className="text-xs font-bold bg-blue-100 text-blue-900 px-3 py-1 rounded-full">
                {myAssignments.length} Atribuições Oficiais
              </span>
            </div>

            {myAssignments.length === 0 ? (
              <Card className="p-8 text-center text-slate-500 bg-white">
                <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold">Nenhuma turma atribuída a este docente.</p>
                <p className="text-xs text-slate-400 mt-1">Contacte a Direcção Pedagógica da escola para associar turmas.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myAssignments.map((a) => {
                  const subject = subjects.find((s) => s.id === a.subjectId);
                  const turma = classes.find((c) => c.id === a.classId);
                  const classStudents = (students || []).filter((s) => s.classId === a.classId);
                  const isExamClass = turma && ['3ª', '3.ª', '6ª', '6.ª', '9ª', '9.ª', '12ª', '12.ª', '10ª'].some(g => turma.gradeLevel.includes(g));

                  return (
                    <Card key={a.id} className="p-5 border-2 border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-block text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded mb-1">
                            {turma?.gradeLevel || 'Ensino Secundário'} • {turma?.period || 'Diurno'}
                          </span>
                          <h4 className="text-base font-black text-slate-900">{turma?.name}</h4>
                          <p className="text-xs font-bold text-slate-600">{subject?.name}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black text-slate-900">{classStudents.length}</span>
                          <span className="text-[10px] text-slate-500 block">Alunos</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAssignment(a);
                            setActiveMode('caderneta');
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          <BookOpen size={14} /> Caderneta
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAssignment(a);
                            setActiveMode('exame');
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                        >
                          <FileSpreadsheet size={14} /> Exames
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAssignment(a);
                            setTeacherPrintType(isExamClass ? 'exame' : 'frequencia');
                            setIsTeacherPrintModalOpen(true);
                          }}
                          title="Configurar Margens e Imprimir Pauta A3"
                          className="p-2 text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                        >
                          <Printer size={15} />
                        </button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <UserWorkSummary role="professor" />

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 border-2 border-slate-200 bg-white shadow-xs flex items-center justify-between hover:border-blue-400 transition-all">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-sans">Total de Alunos</p>
                <p className="text-3xl font-black text-slate-950">{totalStudents}</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100">
                <Users size={24} />
              </div>
            </Card>

            <Card className="p-6 border-2 border-slate-200 bg-white shadow-xs flex items-center justify-between hover:border-purple-400 transition-all">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-sans">Gênero Feminino</p>
                <p className="text-3xl font-black text-purple-950">
                  {femaleCount} <span className="text-xs text-slate-500 font-medium">({totalStudents ? Math.round((femaleCount / totalStudents) * 100) : 0}%)</span>
                </p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-700 rounded-2xl border border-purple-100">
                <span className="font-extrabold text-xl font-sans">♀</span>
              </div>
            </Card>

            <Card className="p-6 border-2 border-slate-200 bg-white shadow-xs flex items-center justify-between hover:border-emerald-400 transition-all">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-sans">Novos Ingressos</p>
                <p className="text-3xl font-black text-emerald-950">
                  {newAdmissions} <span className="text-xs text-slate-500 font-medium">({totalStudents ? Math.round((newAdmissions / totalStudents) * 100) : 0}%)</span>
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                <CheckCircle size={24} />
              </div>
            </Card>

            <Card className="p-6 border-2 border-slate-200 bg-white shadow-xs flex items-center justify-between hover:border-amber-400 transition-all">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-sans">Repetentes</p>
                <p className="text-3xl font-black text-amber-950">
                  {repeaters} <span className="text-xs text-slate-500 font-medium">({totalStudents ? Math.round((repeaters / totalStudents) * 100) : 0}%)</span>
                </p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100">
                <AlertCircle size={24} />
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Class/Turma Breakdown Table */}
            <Card className="p-6 border-2 border-slate-200 bg-white shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 border-b pb-3 border-slate-100 font-serif">
                <BookOpen size={18} className="text-blue-600" />
                Distribuição de Alunos por Turma / Classe
              </h3>

              <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
                {Object.keys(studentsByClass).length === 0 ? (
                  <p className="text-sm italic text-slate-500 py-4 text-center">Nenhuma turma atribuída ao docente.</p>
                ) : (
                  Object.entries(studentsByClass).map(([cid, data]) => {
                    const pct = totalStudents ? Math.round((data.count / totalStudents) * 100) : 0;
                    return (
                      <div key={cid} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-extrabold text-slate-900">{data.grade} - {data.name}</p>
                          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{data.period} • {pct}% do total de alunos</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-24 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="text-sm font-black text-slate-950 w-16 text-right">
                            {data.count} Alunos
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>

            {/* Demographics Split Cards */}
            <div className="flex flex-col gap-8">
              {/* Gender Split Card */}
              <Card className="p-6 border-2 border-slate-200 bg-white shadow-sm space-y-4 flex-1">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 border-b pb-3 border-slate-100 font-serif">
                  <span className="text-blue-600 font-extrabold font-sans">⚤</span>
                  Divisão Demográfica por Gênero
                </h3>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5 text-blue-700">♂ Masculino</span>
                      <span>{maleCount} Alunos ({totalStudents ? Math.round((maleCount / totalStudents) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="bg-blue-600 h-full rounded-full" 
                        style={{ width: `${totalStudents ? (maleCount / totalStudents) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5 text-purple-700">♀ Feminino</span>
                      <span>{femaleCount} Alunos ({totalStudents ? Math.round((femaleCount / totalStudents) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="bg-purple-600 h-full rounded-full" 
                        style={{ width: `${totalStudents ? (femaleCount / totalStudents) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Admissions Split Card */}
              <Card className="p-6 border-2 border-slate-200 bg-white shadow-sm space-y-4 flex-1">
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 border-b pb-3 border-slate-100 font-serif">
                  <CheckCircle size={18} className="text-emerald-600" />
                  Estatuto de Ingresso (Novos Ingressos vs. Repetentes)
                </h3>
                
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5 text-emerald-700">✨ Novos Ingressos</span>
                      <span>{newAdmissions} Alunos ({totalStudents ? Math.round((newAdmissions / totalStudents) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="bg-emerald-600 h-full rounded-full" 
                        style={{ width: `${totalStudents ? (newAdmissions / totalStudents) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5 text-amber-700">🔄 Alunos Repetentes</span>
                      <span>{repeaters} Alunos ({totalStudents ? Math.round((repeaters / totalStudents) * 100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="bg-amber-600 h-full rounded-full" 
                        style={{ width: `${totalStudents ? (repeaters / totalStudents) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    const subject = (subjects || []).find((s) => s.id === selectedAssignment.subjectId);
    const turma = (classes || []).find((c) => c.id === selectedAssignment.classId);
    const myStudents = (students || [])
      .filter((s) => s.classId === selectedAssignment.classId)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-PT', { sensitivity: 'base' }));

    // Exam statistics for this class and subject
    const admittedCount = myStudents.filter((s) => {
      const mf = getStudentSubjectMF(s.id, selectedAssignment.subjectId);
      return mf >= 9.5 && mf < 13.5;
    }).length;

    const dispensadosCount = myStudents.filter((s) => {
      const mf = getStudentSubjectMF(s.id, selectedAssignment.subjectId);
      return mf >= 13.5;
    }).length;

    const excluidosCount = myStudents.filter((s) => {
      const mf = getStudentSubjectMF(s.id, selectedAssignment.subjectId);
      return mf < 9.5;
    }).length;

    const examLaunchedCount = myStudents.filter((s) => {
      return (examGrades || []).some(
        (eg) =>
          eg.studentId === s.id &&
          eg.subjectId === selectedAssignment.subjectId &&
          eg.classId === selectedAssignment.classId,
      );
    }).length;

    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header with Title and Mode Switcher */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="mb-3">
            <button
              type="button"
              onClick={() => setSelectedAssignment(null)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-blue-600" />
              <span>← Voltar à Visão Geral</span>
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 mb-2">
                <BookMarked className="h-3.5 w-3.5" />
                Disciplina Atribuída: {subject?.name}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {activeMode === "caderneta"
                  ? `Caderneta: ${subject?.name}`
                  : activeMode === "exame"
                    ? `Exame: ${subject?.name}`
                    : `Gestão de Disciplina: ${subject?.name}`}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {turma?.name} • {turma?.gradeLevel} • Período{" "}
                {turma?.period || "Manhã"}
              </p>
            </div>

            {/* View Switcher Tabs */}
            <div className="inline-flex p-1 bg-gray-100 rounded-lg border border-gray-200">
              <button
                onClick={() => setActiveMode("caderneta")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                  activeMode === "caderneta"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Caderneta
              </button>
              <button
                onClick={() => setActiveMode("sumarios")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                  activeMode === "sumarios"
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <BookMarked className="h-4 w-4" />
                Sumários
              </button>
              <button
                onClick={() => setActiveMode("atividades")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                  activeMode === "atividades"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileText className="h-4 w-4" />
                Atividades & Exercícios
              </button>
              <button
                id="btn-tab-pauta-exame"
                onClick={() => setActiveMode("exame")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                  activeMode === "exame"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exames
              </button>
            </div>
          </div>

          {/* Contextual Notice */}
          <div className="mt-4 flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
            <span className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-gray-500" />
              <strong>Segurança & Acesso:</strong> Você só tem acesso ao
              lançamento da disciplina{" "}
              <span className="font-semibold text-blue-700">
                {subject?.name}
              </span>
              .
            </span>
            <span className="text-gray-500">
              Sincronização imediata com a Pauta Geral da Escola
            </span>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMsg && (
          <div
            className={`p-4 rounded-lg flex items-center gap-3 border shadow-sm transition-all ${
              feedbackMsg.type === "success"
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            <CheckCheck className="h-5 w-5 flex-shrink-0 text-green-600" />
            <p className="text-sm font-medium">{feedbackMsg.text}</p>
          </div>
        )}

        {/* MODE 1: CADERNETA TRIMESTRAL */}
        {activeMode === "caderneta" && (
          <Card className="p-6">
            {/* CABEÇALHO OFICIAL DA CADERNETA DO PROFESSOR */}
            <div className="bg-white border-2 border-gray-300 rounded-xl p-5 mb-6 shadow-sm pauta-print">
              <HeaderInstitucional 
                school={school} 
                showEmblem={true} 
                documentTitle="CADERNETA DO PROFESSOR" 
                documentSubtitle={`${selectedTrimester}º Trimestre • ${subject?.name || ''} • Turma: ${turma?.name || ''}`}
                badge={`CADERNETA ${selectedTrimester}º TRIMESTRE`}
              />
            </div>

              {/* Grid do Cabeçalho com Nome do Docente e da Cadeira */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 text-xs mb-6">
                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  <span className="block text-gray-500 font-semibold text-[10px] uppercase tracking-wider">
                    DOCENTE / PROFESSOR
                  </span>
                  <span className="font-extrabold text-gray-900 text-sm block truncate">
                    {currentUser?.name || "Não especificado"}
                  </span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  <span className="block text-gray-500 font-semibold text-[10px] uppercase tracking-wider">
                    CADEIRA / DISCIPLINA
                  </span>
                  <span className="font-extrabold text-blue-800 text-sm block truncate">
                    {subject?.name || "Não especificada"}
                  </span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  <span className="block text-gray-500 font-semibold text-[10px] uppercase tracking-wider">
                    TURMA E CLASSE
                  </span>
                  <span className="font-extrabold text-gray-900 text-sm block truncate">
                    {turma?.gradeLevel || "10ª"} • {turma?.name || "Turma A"}
                  </span>
                </div>

                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  <span className="block text-gray-500 font-semibold text-[10px] uppercase tracking-wider">
                    ANO LECTIVO / PERÍODO
                  </span>
                  <span className="font-extrabold text-gray-900 text-sm block truncate">
                    {new Date().getFullYear()} • {turma?.period || "Manhã"}
                  </span>
                </div>
              </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <label className="font-semibold text-sm text-gray-700">
                  Trimestre:
                </label>
                <select
                  className="rounded-md border-gray-300 border px-3 py-1.5 text-sm font-medium focus:border-blue-500 focus:ring-blue-500 bg-white"
                  value={selectedTrimester}
                  onChange={(e) =>
                    setSelectedTrimester(Number(e.target.value) as 1 | 2 | 3)
                  }
                >
                  <option value={1}>1º Trimestre</option>
                  <option value={2}>2º Trimestre</option>
                  <option value={3}>3º Trimestre</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    setTeacherPrintType('frequencia');
                    setIsTeacherPrintModalOpen(true);
                  }}
                  variant="outline"
                  className="text-xs gap-1.5 h-8 border-blue-400 bg-blue-50/80 hover:bg-blue-100 text-blue-900 font-bold shadow-2xs cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 text-blue-700" /> Configurar & Imprimir A3
                </Button>
                <div className="text-xs text-gray-600 bg-amber-50/80 px-3 py-1.5 rounded-md border border-amber-200">
                  <strong>Cálculo Média Final:</strong> Com Trabalhos = (Média ACS + Média de Trabalho + APT) / 3 • Sem Trabalhos = (Média ACS + APT) / 2
                </div>
              </div>
            </div>

            {/* PAINEL DE CONTROLE DE PAUTAS DO PROFESSOR */}
            <PautaControlPanel
              columns={pautaColumns}
              onChangeColumns={handleUpdateColumns}
              cellPadding={pautaCellPadding}
              onChangeCellPadding={handleUpdateCellPadding}
              partialAverages={pautaPartialAverages}
              onChangePartialAverages={handleUpdatePartialAverages}
              onOpenPrintConfigModal={() => {
                setTeacherPrintType('frequencia');
                setIsTeacherPrintModalOpen(true);
              }}
              mode="caderneta"
              turmaLabel={turma?.name}
              subjectLabel={subject?.name}
              isCollapsible={true}
              defaultExpanded={false}
            />

            <div id="pauta-container" className="overflow-x-auto rounded-lg border border-gray-200 pauta-print-container">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-2 py-3 text-center text-xs font-bold uppercase border-r border-gray-200 w-12">
                      N/O
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-bold uppercase border-r border-gray-200 font-mono w-28 bg-gray-100/70">
                      CÓDIGO DO ESTUDANTE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold uppercase border-r border-gray-200">
                      NOME COMPLETO
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-bold uppercase">
                      ACS1
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-bold uppercase">
                      ACS2
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-bold uppercase">
                      ACS3
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-bold text-gray-800 uppercase bg-blue-50/60 border-x border-gray-200">
                      MEDIA
                      <br />
                      ACS
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-bold uppercase">
                      TRABALHO 1
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-bold uppercase">
                      TRABALHO 2
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-bold text-gray-800 uppercase bg-amber-50/60 border-x border-gray-200">
                      MEDIA DE
                      <br />
                      TRAB
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-bold uppercase">
                      APT
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-bold text-gray-800 uppercase bg-gray-100 border-x border-gray-200">
                      MEDIA
                      <br />
                      FINAL
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-bold uppercase bg-gray-50 border-r border-gray-200">
                      Comportamento
                    </th>
                    <th className="px-2 py-3 text-center text-xs font-bold uppercase">
                      Classificação
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold uppercase">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {myStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={14}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Nenhum estudante inscrito nesta turma.
                      </td>
                    </tr>
                  ) : (
                    myStudents.map((student, index) => {
                      const existingGrade = grades.find(
                        (g) =>
                          g.studentId === student.id &&
                          g.subjectId === selectedAssignment.subjectId &&
                          g.trimester === selectedTrimester,
                      );

                      const isLocked = existingGrade?.isLocked;
                      const dg = draftGrades[student.id] || {};

                      // Values
                      const acs1 = isLocked ? existingGrade?.acs1 : dg.acs1;
                      const acs2 = isLocked ? existingGrade?.acs2 : dg.acs2;
                      const acs3 = isLocked ? existingGrade?.acs3 : dg.acs3;

                      const acsArr = [acs1, acs2, acs3].filter(
                        (v): v is number => v !== undefined && !isNaN(v),
                      );
                      const mediaAcs =
                        acsArr.length > 0
                          ? acsArr.reduce((a, b) => a + b, 0) / acsArr.length
                          : undefined;

                      const trabalho1 = isLocked ? existingGrade?.trabalho1 : dg.trabalho1;
                      const trabalho2 = isLocked ? existingGrade?.trabalho2 : dg.trabalho2;

                      const trabArr = [trabalho1, trabalho2].filter(
                        (v): v is number => v !== undefined && !isNaN(v),
                      );
                      const mediaTrabalho =
                        trabArr.length > 0
                          ? trabArr.reduce((a, b) => a + b, 0) / trabArr.length
                          : undefined;

                      const apt = isLocked ? existingGrade?.apt : dg.apt;

                      // Calculation for Média Final
                      let finalMedia: number | undefined = undefined;
                      if (isLocked && existingGrade?.media !== undefined) {
                        finalMedia = existingGrade.media;
                      } else if (mediaAcs !== undefined && apt !== undefined) {
                        if (mediaTrabalho !== undefined) {
                          finalMedia = (mediaAcs + mediaTrabalho + apt) / 3;
                        } else {
                          finalMedia = (mediaAcs + apt) / 2;
                        }
                      }

                      const classficacao =
                        finalMedia !== undefined
                          ? finalMedia >= 9.5
                            ? "Transita"
                            : "Reprova"
                          : "-";

                      return (
                        <tr key={student.id} className="hover:bg-gray-50/50">
                          {/* N/O */}
                          <td className="px-2 py-3 whitespace-nowrap text-center text-xs font-bold text-gray-500 border-r border-gray-200">
                            {index + 1}
                          </td>

                          {/* CÓDIGO DO ESTUDANTE (Regra de Composição Oficial) */}
                          <td className="px-3 py-3 whitespace-nowrap text-center text-xs font-mono font-bold text-gray-700 border-r border-gray-200 bg-gray-50/50">
                            {ensureStudentCodeBeforeName(student, { name: schoolName }).code}
                          </td>

                          {/* NOME COMPLETO (Com código exibido obrigatoriamente antes do nome) */}
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50/90 border border-blue-200 px-1.5 py-0.5 rounded shadow-2xs select-all">
                                [{ensureStudentCodeBeforeName(student, { name: schoolName }).code}]
                              </span>
                              <span className="font-bold">{student.name}</span>
                              {student.entryType === 'repetente' && (
                                <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-amber-300 shadow-2xs">
                                  Repetente
                                </span>
                              )}
                            </div>
                          </td>

                          {/* ACS1 */}
                          <td className="px-2 py-3 whitespace-nowrap text-center">
                            {isLocked ? (
                              <span
                                className={`font-bold text-sm ${
                                  acs1 !== undefined && acs1 < 9.5
                                    ? "text-red-600"
                                    : "text-slate-900"
                                }`}
                              >
                                {acs1 ?? "-"}
                              </span>
                            ) : (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="20"
                                className={`w-14 min-w-[56px] text-center rounded-md border px-1 py-1 text-sm focus:border-blue-500 focus:ring-blue-500 font-bold ${
                                  dg.acs1 !== undefined && dg.acs1 < 9.5
                                    ? "text-red-600 bg-red-50 border-red-300"
                                    : "text-slate-900 border-gray-300"
                                }`}
                                value={dg.acs1 ?? ""}
                                onChange={(e) =>
                                  handleGradeChange(
                                    student.id,
                                    "acs1",
                                    e.target.value,
                                  )
                                }
                              />
                            )}
                          </td>

                          {/* ACS2 */}
                          <td className="px-2 py-3 whitespace-nowrap text-center">
                            {isLocked ? (
                              <span
                                className={`font-bold text-sm ${
                                  acs2 !== undefined && acs2 < 9.5
                                    ? "text-red-600"
                                    : "text-slate-900"
                                }`}
                              >
                                {acs2 ?? "-"}
                              </span>
                            ) : (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="20"
                                className={`w-14 min-w-[56px] text-center rounded-md border px-1 py-1 text-sm focus:border-blue-500 focus:ring-blue-500 font-bold ${
                                  dg.acs2 !== undefined && dg.acs2 < 9.5
                                    ? "text-red-600 bg-red-50 border-red-300"
                                    : "text-slate-900 border-gray-300"
                                }`}
                                value={dg.acs2 ?? ""}
                                onChange={(e) =>
                                  handleGradeChange(
                                    student.id,
                                    "acs2",
                                    e.target.value,
                                  )
                                }
                              />
                            )}
                          </td>

                          {/* ACS3 */}
                          <td className="px-2 py-3 whitespace-nowrap text-center">
                            {isLocked ? (
                              <span
                                className={`font-bold text-sm ${
                                  acs3 !== undefined && acs3 < 9.5
                                    ? "text-red-600"
                                    : "text-slate-900"
                                }`}
                              >
                                {acs3 ?? "-"}
                              </span>
                            ) : (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="20"
                                className={`w-14 min-w-[56px] text-center rounded-md border px-1 py-1 text-sm focus:border-blue-500 focus:ring-blue-500 font-bold ${
                                  dg.acs3 !== undefined && dg.acs3 < 9.5
                                    ? "text-red-600 bg-red-50 border-red-300"
                                    : "text-slate-900 border-gray-300"
                                }`}
                                value={dg.acs3 ?? ""}
                                onChange={(e) =>
                                  handleGradeChange(
                                    student.id,
                                    "acs3",
                                    e.target.value,
                                  )
                                }
                              />
                            )}
                          </td>

                          {/* MEDIA ACS */}
                          <td className="px-2 py-3 whitespace-nowrap text-center bg-blue-50/40 border-x border-gray-200">
                            <span
                              className={`font-bold text-sm ${
                                mediaAcs !== undefined && mediaAcs < 9.5
                                  ? "text-red-600"
                                  : "text-slate-900"
                              }`}
                            >
                              {mediaAcs !== undefined
                                ? mediaAcs.toFixed(2).replace(".", ",")
                                : "-"}
                            </span>
                          </td>

                          {/* TRABALHO 1 */}
                          <td className="px-2 py-3 whitespace-nowrap text-center">
                            {isLocked ? (
                              <span
                                className={`font-bold text-sm ${
                                  trabalho1 !== undefined && trabalho1 < 9.5
                                    ? "text-red-600"
                                    : "text-slate-900"
                                }`}
                              >
                                {trabalho1 ?? "-"}
                              </span>
                            ) : (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="20"
                                placeholder="Opc"
                                className={`w-14 min-w-[56px] text-center rounded-md border px-1 py-1 text-sm focus:border-blue-500 focus:ring-blue-500 font-bold ${
                                  dg.trabalho1 !== undefined && dg.trabalho1 < 9.5
                                    ? "text-red-600 bg-red-50 border-red-300"
                                    : "text-slate-900 border-gray-300"
                                }`}
                                value={dg.trabalho1 ?? ""}
                                onChange={(e) =>
                                  handleGradeChange(
                                    student.id,
                                    "trabalho1",
                                    e.target.value,
                                  )
                                }
                              />
                            )}
                          </td>

                          {/* TRABALHO 2 */}
                          <td className="px-2 py-3 whitespace-nowrap text-center">
                            {isLocked ? (
                              <span
                                className={`font-bold text-sm ${
                                  trabalho2 !== undefined && trabalho2 < 9.5
                                    ? "text-red-600"
                                    : "text-slate-900"
                                }`}
                              >
                                {trabalho2 ?? "-"}
                              </span>
                            ) : (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="20"
                                placeholder="Opc"
                                className={`w-14 min-w-[56px] text-center rounded-md border px-1 py-1 text-sm focus:border-blue-500 focus:ring-blue-500 font-bold ${
                                  dg.trabalho2 !== undefined && dg.trabalho2 < 9.5
                                    ? "text-red-600 bg-red-50 border-red-300"
                                    : "text-slate-900 border-gray-300"
                                }`}
                                value={dg.trabalho2 ?? ""}
                                onChange={(e) =>
                                  handleGradeChange(
                                    student.id,
                                    "trabalho2",
                                    e.target.value,
                                  )
                                }
                              />
                            )}
                          </td>

                          {/* MEDIA DE TRAB */}
                          <td className="px-2 py-3 whitespace-nowrap text-center bg-amber-50/40 border-x border-gray-200">
                            <span
                              className={`font-bold text-sm ${
                                mediaTrabalho !== undefined && mediaTrabalho < 9.5
                                  ? "text-red-600"
                                  : "text-slate-900"
                              }`}
                            >
                              {mediaTrabalho !== undefined
                                ? mediaTrabalho.toFixed(2).replace(".", ",")
                                : "-"}
                            </span>
                          </td>

                          {/* APT */}
                          <td className="px-2 py-3 whitespace-nowrap text-center">
                            {isLocked ? (
                              <span
                                className={`font-bold text-sm ${
                                  apt !== undefined && apt < 9.5
                                    ? "text-red-600"
                                    : "text-slate-900"
                                }`}
                              >
                                {apt ?? "-"}
                              </span>
                            ) : (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="20"
                                className={`w-14 min-w-[56px] text-center rounded-md border px-1 py-1 text-sm focus:border-blue-500 focus:ring-blue-500 font-bold ${
                                  dg.apt !== undefined && dg.apt < 9.5
                                    ? "text-red-600 bg-red-50 border-red-300"
                                    : "text-slate-900 border-gray-300"
                                }`}
                                value={dg.apt ?? ""}
                                onChange={(e) =>
                                  handleGradeChange(
                                    student.id,
                                    "apt",
                                    e.target.value,
                                  )
                                }
                              />
                            )}
                          </td>

                          {/* MEDIA FINAL */}
                          <td className="px-2 py-2 whitespace-nowrap text-center align-middle border-x border-gray-200 bg-slate-50/40">
                            <div className={`flex items-center justify-center w-full h-9 px-2 py-1 rounded border font-mono font-bold text-sm shadow-2xs ${
                              finalMedia !== undefined && finalMedia < 9.5
                                ? "text-red-700 bg-red-50 border-red-300"
                                : "text-slate-900 bg-white border-slate-300"
                            }`}>
                              {finalMedia !== undefined
                                ? finalMedia.toFixed(2).replace(".", ",")
                                : "-"}
                            </div>
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-center text-xs font-bold bg-slate-50/50 border-r border-gray-200">
                            {finalMedia !== undefined ? (
                              finalMedia >= 14 ? (
                                <span className="text-emerald-700">Exclt</span>
                              ) : finalMedia >= 9.5 ? (
                                <span className="text-blue-700">Bom</span>
                              ) : (
                                <span className="text-red-700">Mau</span>
                              )
                            ) : '-'}
                          </td>
                          <td className="px-2 py-3 whitespace-nowrap text-center text-xs font-bold">
                            {finalMedia !== undefined ? (
                              <span
                                className={
                                  finalMedia >= 9.5
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {classficacao}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                            {isLocked ? (
                              <span className="inline-flex items-center text-gray-500 gap-1 justify-center text-xs font-medium">
                                <Lock className="h-3.5 w-3.5 text-gray-400" />{" "}
                                Lançada
                              </span>
                            ) : (
                              <Button
                                onClick={() => handleLaunchGrade(student.id)}
                                disabled={
                                  dg.acs1 === undefined ||
                                  dg.acs2 === undefined ||
                                  dg.acs3 === undefined ||
                                  dg.apt === undefined
                                }
                                className="bg-green-600 hover:bg-green-700 text-white gap-1.5 text-xs py-1 px-3 h-8 rounded-md"
                              >
                                <CheckCircle className="h-3.5 w-3.5" /> Lançar
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
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
              <strong>Atenção:</strong> Uma vez lançada, a nota é bloqueada e
              copiada automaticamente para a Pauta Geral da turma.
            </div>
          </Card>
        )}

        {/* MODE 3: GESTÃO DE SUMÁRIOS */}
        {activeMode === "sumarios" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                Registo de Sumários
              </h3>
              <Button
                onClick={() => setIsAddingSummary(true)}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Novo Sumário
              </Button>
            </div>

            {isAddingSummary && (
              <Card className="p-6 border-blue-200 bg-blue-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Data da Aula
                    </label>
                    <input
                      type="date"
                      value={newSummary.date}
                      onChange={(e) =>
                        setNewSummary({ ...newSummary, date: e.target.value })
                      }
                      className="w-full rounded-md border-gray-300 border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Tema / Tópico
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Introdução à Genética"
                      value={newSummary.topic}
                      onChange={(e) =>
                        setNewSummary({ ...newSummary, topic: e.target.value })
                      }
                      className="w-full rounded-md border-gray-300 border px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Objetivos da Aula
                  </label>
                  <textarea
                    placeholder="Descreva o que os alunos devem aprender..."
                    rows={3}
                    value={newSummary.objectives}
                    onChange={(e) =>
                      setNewSummary({
                        ...newSummary,
                        objectives: e.target.value,
                      })
                    }
                    className="w-full rounded-md border-gray-300 border px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingSummary(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveSummary}
                    className="bg-blue-600 text-white"
                  >
                    Lançar Sumário
                  </Button>
                </div>
              </Card>
            )}

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Nº
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Tópico
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {lessonSummaries
                      .filter((ls) => ls.assignmentId === selectedAssignment.id)
                      .sort((a, b) => b.lessonNumber - a.lessonNumber)
                      .map((summary) => (
                        <tr key={summary.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            Aula {summary.lessonNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(summary.date).toLocaleDateString("pt-MZ")}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="font-semibold">{summary.topic}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {summary.objectives}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-bold rounded bg-green-100 text-green-700">
                              Concluída
                            </span>
                          </td>
                        </tr>
                      ))}
                    {lessonSummaries.filter(
                      (ls) => ls.assignmentId === selectedAssignment.id,
                    ).length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          Nenhum sumário registado para esta disciplina.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: PAUTA DE EXAME (EXAM GRADE LAUNCHING) */}
        {activeMode === "exame" && (
          <div className="space-y-6">
            {/* Quick Stat Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-xs text-gray-500 font-medium">
                  Total de Alunos
                </span>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {myStudents.length}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-green-200 shadow-sm bg-green-50/20">
                <span className="text-xs text-green-700 font-medium">
                  Admitidos a Exame
                </span>
                <p className="text-xl font-bold text-green-700 mt-1">
                  {admittedCount}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-200 shadow-sm bg-blue-50/20">
                <span className="text-xs text-blue-700 font-medium">
                  Dispensados
                </span>
                <p className="text-xl font-bold text-blue-700 mt-1">
                  {dispensadosCount}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-red-200 shadow-sm bg-red-50/20">
                <span className="text-xs text-red-700 font-medium">
                  Excluídos
                </span>
                <p className="text-xl font-bold text-red-700 mt-1">
                  {excluidosCount}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-purple-200 shadow-sm bg-purple-50/20 col-span-2 sm:col-span-1">
                <span className="text-xs text-purple-700 font-medium">
                  Exames Lançados
                </span>
                <p className="text-xl font-bold text-purple-700 mt-1">
                  {examLaunchedCount} / {myStudents.length}
                </p>
              </div>
            </div>

            {/* Exam Pauta Card */}
            <Card className="p-6">
              {/* CABEÇALHO OFICIAL DA PAUTA DE EXAMES */}
              <div className="bg-white border-2 border-gray-300 rounded-xl p-5 mb-6 shadow-sm pauta-print">
                <HeaderInstitucional 
                  school={school} 
                  showEmblem={true} 
                  documentTitle="PAUTA DE EXAMES" 
                  documentSubtitle={`Classificação Final • ${subject?.name || ''} • Turma: ${turma?.name || ''}`}
                  badge="PAUTA DE EXAMES"
                />
              </div>

                {/* Grid do Cabeçalho com Nome do Docente e da Cadeira */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 text-xs">
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <span className="block text-gray-500 font-semibold text-[10px] uppercase tracking-wider">
                      DOCENTE / PROFESSOR
                    </span>
                    <span className="font-extrabold text-gray-900 text-sm block truncate">
                      {currentUser?.name || "Não especificado"}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <span className="block text-gray-500 font-semibold text-[10px] uppercase tracking-wider">
                      CADEIRA / DISCIPLINA
                    </span>
                    <span className="font-extrabold text-blue-800 text-sm block truncate">
                      {subject?.name || "Não especificada"}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <span className="block text-gray-500 font-semibold text-[10px] uppercase tracking-wider">
                      TURMA E CLASSE
                    </span>
                    <span className="font-extrabold text-gray-900 text-sm block truncate">
                      {turma?.gradeLevel || "10ª"} • {turma?.name || "Turma A"}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <span className="block text-gray-500 font-semibold text-[10px] uppercase tracking-wider">
                      ANO LECTIVO / PERÍODO
                    </span>
                    <span className="font-extrabold text-gray-900 text-sm block truncate">
                      {new Date().getFullYear()} • {turma?.period || "Manhã"}
                    </span>
                  </div>
                </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    Pauta de Exame: {subject?.name} ({turma?.name})
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Fórmula Oficial ESG: Classificação Final (CF) = 40% MF
                    (Média Frequência) + 60% NE (Nota Exame)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => window.print()}
                    variant="outline"
                    className="text-xs gap-1.5 h-9 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <FileText className="h-4 w-4" /> Imprimir Pauta Exames
                  </Button>
                  <Button
                    id="btn-lancar-todos-exames"
                    onClick={handleLaunchAllExamGrades}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-4 rounded-md shadow-sm gap-2"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Lançar Todas as Notas & Dispensas
                  </Button>
                </div>
              </div>

              {/* Table of students for exam launching */}
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm pauta-print">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100/70 text-gray-700">
                    <tr>
                      <th className="px-3 py-3 text-center text-xs font-bold uppercase w-12 border-r border-gray-200">
                        Nº
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold uppercase border-r border-gray-200 font-mono w-28 bg-gray-200/60">
                        CÓDIGO DO ESTUDANTE
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase border-r border-gray-200">
                        Nome do Estudante
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold uppercase bg-blue-50/60 border-r border-gray-200">
                        MF
                        <br />
                        <span className="text-[10px] font-normal text-gray-500">
                          (Frequência)
                        </span>
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold uppercase border-r border-gray-200">
                        Estado de Admissão
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase bg-yellow-50/60 border-r border-gray-200">
                        Nota de Exame (NE)
                        <br />
                        <span className="text-[10px] font-normal text-gray-500">
                          (0 a 20)
                        </span>
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold uppercase bg-gray-50 border-r border-gray-200">
                        CF
                        <br />
                        <span className="text-[10px] font-normal text-gray-500">
                          (Class. Final)
                        </span>
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-bold uppercase border-r border-gray-200">
                        Resultado
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold uppercase">
                        Ação / Sincronização
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {myStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          Nenhum estudante inscrito para esta turma.
                        </td>
                      </tr>
                    ) : (
                      myStudents.map((student, idx) => {
                        const mf = getStudentSubjectMF(
                          student.id,
                          selectedAssignment.subjectId,
                        );
                        const admission = getExamAdmissionInfo(mf);

                        const existingExamGrade = (examGrades || []).find(
                          (eg) =>
                            eg.studentId === student.id &&
                            eg.subjectId === selectedAssignment.subjectId &&
                            eg.classId === selectedAssignment.classId,
                        );

                        const isLocked = existingExamGrade?.isLocked;
                        const draftNE = draftExamGrades[student.id];

                        // Real-time calculation of CF
                        let activeNE = isLocked
                          ? (existingExamGrade.resultado === "Dispensado" ? "DISPENSADO" : existingExamGrade.notaExame)
                          : admission.isDispensado
                            ? "DISPENSADO"
                            : draftNE;

                        let activeCF = isLocked
                          ? existingExamGrade.classificacaoFinal
                          : admission.isDispensado
                            ? mf
                            : draftNE !== undefined
                              ? Math.round(mf * 0.4 + draftNE * 0.6)
                              : undefined;

                        let activeResultado = isLocked
                          ? existingExamGrade.resultado
                          : admission.isDispensado
                            ? "Dispensado"
                            : activeCF !== undefined
                              ? activeCF >= 9.5
                                ? "Aprovado"
                                : "Reprovado"
                              : undefined;

                        return (
                          <tr
                            key={student.id}
                            className={`hover:bg-gray-50/70 transition-colors ${!admission.canTakeExam && !admission.isDispensado ? "bg-red-50/10" : ""}`}
                          >
                            <td className="px-3 py-3 whitespace-nowrap text-center text-xs font-bold text-gray-600 border-r border-gray-200">
                              {idx + 1}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-center text-xs font-mono font-bold text-gray-700 border-r border-gray-200 bg-gray-50/50">
                              {ensureStudentCodeBeforeName(student, { name: schoolName }).code}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 border-r border-gray-200">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50/90 border border-blue-200 px-1.5 py-0.5 rounded shadow-2xs select-all">
                                  [{ensureStudentCodeBeforeName(student, { name: schoolName }).code}]
                                </span>
                                <span>{student.name}</span>
                              </div>
                            </td>
                            <td className={`px-3 py-3 whitespace-nowrap text-center text-sm font-bold bg-blue-50/30 border-r border-gray-200 ${mf < 9.5 ? 'text-red-600' : 'text-blue-900'}`}>
                              {mf.toFixed(1)}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-center border-r border-gray-200">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${admission.badge}`}
                              >
                                {admission.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center bg-yellow-50/30 border-r border-gray-200">
                              {isLocked ? (
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded font-bold text-sm ${
                                  existingExamGrade.resultado === "Dispensado"
                                    ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                    : existingExamGrade.notaExame < 9.5 ? 'bg-red-100 text-red-900' : 'bg-green-100 text-green-900'
                                }`}>
                                  <Lock className="h-3.5 w-3.5 text-gray-700" />
                                  <span>{existingExamGrade.resultado === "Dispensado" ? "DISPENSADO" : existingExamGrade.notaExame}</span>
                                </div>
                              ) : admission.isDispensado ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-900 font-extrabold text-xs rounded-md border border-blue-300 shadow-sm cursor-not-allowed select-none">
                                  <Lock className="h-3.5 w-3.5 text-blue-700" />
                                  <span>DISPENSADO</span>
                                </div>
                              ) : admission.canTakeExam ? (
                                <input
                                  id={`input-exam-${student.id}`}
                                  type="number"
                                  min="0"
                                  max="20"
                                  step="0.5"
                                  placeholder="Nota 0-20"
                                  value={draftNE !== undefined ? draftNE : ""}
                                  onChange={(e) =>
                                    handleExamGradeChange(
                                      student.id,
                                      e.target.value,
                                    )
                                  }
                                  className={`w-24 text-center font-bold text-sm rounded-md border py-1.5 px-2 focus:border-blue-500 focus:ring-blue-500 shadow-sm ${
                                    draftNE !== undefined && draftNE < 9.5 ? 'text-red-600 bg-red-50 border-red-300' : 'text-slate-900 border-gray-300'
                                  }`}
                                />
                              ) : (
                                <span className="text-xs text-red-500 italic font-medium">
                                  Não admitido a exame
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-center bg-gray-50 border-r border-gray-200">
                              <span className={`font-extrabold text-sm ${activeCF !== undefined && activeCF < 9.5 ? 'text-red-600' : 'text-slate-900'}`}>
                                {activeCF !== undefined ? activeCF : "-"}
                              </span>
                            </td>
                            <td className="px-3 py-3 whitespace-nowrap text-center border-r border-gray-200">
                              {activeResultado ? (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                    activeResultado === "Dispensado"
                                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                                      : activeResultado === "Aprovado"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {activeResultado}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center text-xs">
                              {isLocked ? (
                                <div className="flex flex-col items-center justify-center">
                                  <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
                                    <CheckCircle className="h-3.5 w-3.5" />{" "}
                                    Lançada & Sincronizada
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    Copiada na Pauta Geral
                                  </span>
                                </div>
                              ) : admission.isDispensado ? (
                                <Button
                                  id={`btn-lancar-${student.id}`}
                                  onClick={() =>
                                    handleLaunchExamGrade(student.id)
                                  }
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 px-3 rounded-md shadow-sm gap-1.5 font-medium"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" /> Confirmar Dispensa
                                </Button>
                              ) : (
                                <Button
                                  id={`btn-lancar-${student.id}`}
                                  onClick={() =>
                                    handleLaunchExamGrade(student.id)
                                  }
                                  disabled={
                                    !admission.canTakeExam ||
                                    draftNE === undefined
                                  }
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 px-3 rounded-md shadow-sm gap-1.5 font-medium disabled:opacity-40"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" /> Lançar
                                  Nota
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

              {/* Informative Footer */}
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div>
                    <strong className="font-bold">Integração Direta:</strong> Ao
                    clicar em "Lançar Nota", o resultado é copiado diretamente
                    para a <strong>Pauta Geral de Exames</strong> da escola,
                    ficando imediatamente disponível para visualização e
                    impressão pela Direção Pedagógica.
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* MODE 4: ATIVIDADES E EXERCÍCIOS DA TURMA */}
        {activeMode === "atividades" && (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    Enviar Exercícios e Atividades para a Turma Rectoral
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Turma: <strong>{turma?.name} ({turma?.gradeLevel})</strong> • Disciplina: <strong>{subject?.name}</strong>
                  </p>
                </div>
                <span className="text-xs font-bold bg-indigo-50 text-indigo-800 px-3 py-1 rounded-full border border-indigo-200">
                  {myStudents.length} Alunos Inscritos
                </span>
              </div>

              {/* Form de Publicação de Atividade */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newTask.title.trim()) return;
                  addClassTask({
                    schoolId: school?.id || "s1",
                    classId: selectedAssignment.classId,
                    title: newTask.title.trim(),
                    description: newTask.description.trim(),
                    teacherName: currentUser?.name || "Docente",
                    dueDate: newTask.dueDate,
                    subjectName: subject?.name || "Geral",
                    fileName: attachedTeacherFile?.name || newTask.fileName.trim() || undefined,
                    fileUrl: attachedTeacherFile?.url || undefined,
                  });
                  setNewTask({
                    title: "",
                    description: "",
                    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
                    fileName: "",
                  });
                  setAttachedTeacherFile(null);
                  showFeedback("Exercício publicado e enviado com sucesso para todos os alunos da turma!");
                }}
                className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Título do Exercício / Atividade:
                    </label>
                    <input
                      type="text"
                      required
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Ex: Ficha de Trabalho nº 1 - Funções Quadráticas"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Data Limite de Entrega (Prazo):
                    </label>
                    <input
                      type="date"
                      required
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instruções & Conteúdo do Exercício:
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Descreva detalhadamente as questões, exercícios e instruções de realização..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* CAMPO DE ANEXO DE FICHEIRO DO DOCENTE */}
                <div className="space-y-2 pt-1 border-t border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-800">
                    Anexar Ficheiro do Exercício (PDF, DOCX, Imagem, ZIP...):
                  </label>
                  
                  <input
                    type="file"
                    id="teacher-task-file-input"
                    className="hidden"
                    onChange={handleTeacherFileSelect}
                  />

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <label
                      htmlFor="teacher-task-file-input"
                      className="cursor-pointer bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-900 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs shrink-0"
                    >
                      <Paperclip className="w-4 h-4 text-indigo-600" />
                      <span>Anexar Ficheiro do Computador</span>
                    </label>

                    <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">ou</span>

                    <input
                      type="text"
                      value={newTask.fileName}
                      onChange={(e) => setNewTask({ ...newTask, fileName: e.target.value })}
                      placeholder="Nome do ficheiro (ex: Ficha_Fisica.pdf)"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {attachedTeacherFile && (
                    <div className="flex items-center justify-between p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-950">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="truncate max-w-xs">{attachedTeacherFile.name}</span>
                        {attachedTeacherFile.size && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono">
                            {attachedTeacherFile.size}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachedTeacherFile(null);
                          setNewTask(prev => ({ ...prev, fileName: "" }));
                        }}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Remover anexo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-3">
                  <Button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Publicar Atividade na Turma
                  </Button>
                </div>
              </form>
            </Card>

            {/* SEÇÃO: ATIVIDADES SUBMETIDAS PELOS ALUNOS */}
            <Card className="p-6 space-y-6">
              <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <BookMarked className="h-5 w-5 text-emerald-600" />
                    Atividades Submetidas pelos Alunos da Turma
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Consulte e avalie os exercícios respondidos e devolvidos via sistema pelos estudantes da turma {turma?.name}.
                  </p>
                </div>
              </div>

              {(() => {
                const currentTurmaTasks = (classTasks || []).filter(
                  (t) => t.classId === selectedAssignment.classId
                );

                if (currentTurmaTasks.length === 0) {
                  return (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                      Nenhuma atividade ou exercício publicado para esta turma até ao momento.
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {currentTurmaTasks.map((task) => {
                      const submissions = task.submissions || [];

                      return (
                        <div key={task.id} className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                            <div>
                              <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                                {task.subjectName || subject?.name}
                              </span>
                              <h4 className="text-base font-black text-slate-900 mt-1">{task.title}</h4>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2.5 py-1 rounded-lg">
                                Prazo: {task.dueDate}
                              </span>
                              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg font-mono">
                                {submissions.length} Respostas Submetidas
                              </span>
                            </div>
                          </div>

                          {/* Render Submissions */}
                          {submissions.length === 0 ? (
                            <div className="p-4 bg-slate-50 text-slate-500 text-xs rounded-xl text-center italic">
                              Ainda nenhum aluno submeteu resposta para este exercício.
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                                Respostas Recebidas dos Alunos:
                              </h5>
                              <div className="grid grid-cols-1 gap-3">
                                {submissions.map((sub) => {
                                  const draft = gradingDrafts[sub.id] || {
                                    grade: sub.grade !== undefined ? sub.grade : 15,
                                    feedback: sub.feedback || "",
                                  };

                                  return (
                                    <div key={sub.id} className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
                                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                        <div className="flex items-center gap-2">
                                          <Users className="w-4 h-4 text-blue-600" />
                                          <span className="font-extrabold text-slate-900 text-xs">{sub.studentName}</span>
                                          <span className="text-[10px] text-slate-500 font-mono">
                                            ({new Date(sub.submittedAt).toLocaleString('pt-MZ')})
                                          </span>
                                        </div>

                                        {sub.grade !== undefined ? (
                                          <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-mono">
                                            Avaliado: {sub.grade}/20 val
                                          </span>
                                        ) : (
                                          <span className="text-xs font-black bg-amber-100 text-amber-900 px-3 py-1 rounded-full uppercase">
                                            Pendente de Avaliação
                                          </span>
                                        )}
                                      </div>

                                      <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs text-slate-800 font-medium">
                                        <p className="font-bold text-slate-500 text-[10px] uppercase mb-1">Texto da Resposta:</p>
                                        <p className="whitespace-pre-wrap">{sub.answerText}</p>
                                        {sub.fileName && (
                                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-blue-700 font-bold text-[11px]">
                                            <Paperclip className="w-3.5 h-3.5 text-emerald-700" />
                                             <a
                                               href={sub.fileUrl || "#"}
                                               onClick={(e) => {
                                                 if (!sub.fileUrl || sub.fileUrl === "#") {
                                                   e.preventDefault();
                                                   alert(`A descarregar ficheiro de resolução do aluno: ${sub.fileName}`);
                                                 }
                                               }}
                                               download={sub.fileName}
                                               target="_blank"
                                               rel="noreferrer"
                                               className="text-emerald-900 font-bold hover:underline"
                                             >
                                               Ficheiro da Resolução: {sub.fileName}
                                             </a>
                                             <Download className="w-3.5 h-3.5 text-emerald-700 ml-1" />
                                          </div>
                                        )}
                                      </div>

                                      {/* Form de Lançamento de Nota / Feedback */}
                                      <div className="flex flex-wrap items-center gap-3 pt-2">
                                        <div className="flex items-center gap-2">
                                          <label className="text-xs font-bold text-slate-700">Nota (0-20):</label>
                                          <input
                                            type="number"
                                            min="0"
                                            max="20"
                                            step="0.5"
                                            value={draft.grade}
                                            onChange={(e) =>
                                              setGradingDrafts({
                                                ...gradingDrafts,
                                                [sub.id]: { ...draft, grade: parseFloat(e.target.value) || 0 },
                                              })
                                            }
                                            className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-slate-900"
                                          />
                                        </div>

                                        <div className="flex-1 min-w-[200px]">
                                          <input
                                            type="text"
                                            value={draft.feedback}
                                            onChange={(e) =>
                                              setGradingDrafts({
                                                ...gradingDrafts,
                                                [sub.id]: { ...draft, feedback: e.target.value },
                                              })
                                            }
                                            placeholder="Observação / Feedback pedagógico para o aluno..."
                                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800"
                                          />
                                        </div>

                                        <button
                                          onClick={() => {
                                            gradeTaskSubmission(task.id, sub.id, draft.grade, draft.feedback);
                                            showFeedback(`Nota de ${draft.grade} valores e feedback atribuídos a ${sub.studentName}!`);
                                          }}
                                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded shadow-xs flex items-center gap-1 cursor-pointer"
                                        >
                                          <CheckCheck className="w-3.5 h-3.5" /> Atribuir Nota
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </Card>
          </div>
        )}
      </div>
    );
  };

  return (
    <CollapsibleSidebar
      sidebarContent={
        <SidebarMenu
          activeTab={activeTab === "chat" ? "messages" : activeTab}
          setActiveTab={(tab) => {
            if (tab === "messages") {
              setActiveTab("chat");
            } else {
              if (tab === "overview") {
                setSelectedAssignment(null);
              }
              setActiveTab(tab as any);
            }
          }}
          additionalContent={
            <div className="p-2 overflow-y-auto flex-1">
              {Object.keys(assignmentsByGrade).length === 0 ? (
                <p className="text-[10px] text-slate-500 p-2 italic">
                  Nenhuma turma atribuída.
                </p>
              ) : (
                Object.entries(assignmentsByGrade).map(
                  ([gradeLevel, gradeAssignments]) => (
                    <div key={gradeLevel} className="mb-2">
                      <button
                        onClick={() => toggleGrade(gradeLevel)}
                        className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-black text-slate-500 uppercase tracking-wider hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <span>{gradeLevel}</span>
                        {expandedGrades[gradeLevel] ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </button>

                      {expandedGrades[gradeLevel] && (
                        <div className="mt-1 space-y-1">
                          {gradeAssignments.map((a) => {
                            const subject = subjects.find(
                              (s) => s.id === a.subjectId,
                            );
                            const turma = classes.find(
                              (c) => c.id === a.classId,
                            );
                            const isSelected = selectedAssignment?.id === a.id;

                            return (
                              <button
                                key={a.id}
                                onClick={() => {
                                  setSelectedAssignment(a);
                                  setActiveTab("overview");
                                }}
                                className={`w-full flex flex-col items-start px-3 py-2 text-xs rounded-xl transition-all border ${
                                  isSelected
                                    ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-sm"
                                    : "border-transparent text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <Users size={12} />
                                  {turma?.name}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate w-full pl-5">
                                  {subject?.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ),
                )
              )}
            </div>
          }
        />
      }
    >
      <div className="p-6 md:p-8 bg-slate-50 h-full overflow-y-auto">
        {activeTab === "overview" ? (
          renderMainContent()
        ) : activeTab === "calendar" ? (
          <AcademicCalendarComponent />
        ) : activeTab === "signature" ? (
          <SignatureManager />
        ) : activeTab === "messages" || activeTab === "chat" ? (
          <OfficialMessages />
        ) : (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col items-center justify-center text-center py-32 bg-white rounded-3xl border border-slate-200 shadow-sm">
              {activeTab === "messages" && (
                <MessageSquare size={64} className="text-slate-200 mb-6" />
              )}
              {activeTab === "reports" && (
                <FileText size={64} className="text-slate-200 mb-6" />
              )}
              {activeTab === "statistics" && (
                <BarChart2 size={64} className="text-slate-200 mb-6" />
              )}
              {activeTab === "signature" && (
                <FileSignature size={64} className="text-slate-200 mb-6" />
              )}

              <h2 className="text-2xl font-black text-slate-800">
                {activeTab === "messages"
                  ? "Mensagens e Avisos"
                  : activeTab === "reports"
                    ? "Relatórios de Conteúdo"
                    : activeTab === "statistics"
                      ? "Indicadores de Rendimento"
                      : "Assinatura de Cadernetas"}
              </h2>
              <p className="text-slate-500 mt-2">
                Esta funcionalidade está a ser integrada com o Sistema Nacional
                de Gestão Escolar.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pauta Print Configuration Modal for Teachers */}
      <PautaPrintConfigModal
        isOpen={isTeacherPrintModalOpen}
        onClose={() => setIsTeacherPrintModalOpen(false)}
        pautaType={teacherPrintType}
        academicYear={new Date().getFullYear().toString()}
        turmaLabel={selectedAssignment ? classes.find(c => c.id === selectedAssignment.classId)?.name : 'Oficial'}
      />
    </CollapsibleSidebar>
  );
}
