import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "../store";
import { Card, Button, Input } from "../components/ui";
import {
  Users,
  GraduationCap,
  FileText,
  UserPlus,
  FileSignature,
  Printer,
  BookOpen,
  CheckSquare,
  Square,
  MessageSquare,
  Plus,
  Inbox,
  Send,
  User,
  ChevronRight,
  ChevronLeft,
  Eye,
  LayoutList,
  RefreshCw,
  Receipt,
} from "lucide-react";
import { Student } from "../types";
import { isExamGradeLevel, buildOfficialPautaRoster } from "../utils/pautaCalculations";
import { getStoredSchoolCalendarConfig } from "../utils/schoolCalendarStore";
import { Award, Sparkles, Sliders, Calculator, CheckCircle2 } from "lucide-react";
import { EmployeeManagement } from "../components/EmployeeManagement";
import { StudentProcessDocument } from "../components/StudentProcessDocument";
import { CertificateDocument } from "../components/CertificateDocument";
import { DeclarationDocument } from "../components/DeclarationDocument";
import { EnrollmentReceiptDocument } from "../components/EnrollmentReceiptDocument";
import { MedicalCertificateDocument } from "../components/MedicalCertificateDocument";
import { SecretariatOverview } from "../components/SecretariatOverview";
import { CollectionFormView } from "../components/CollectionFormView";
import { OfficialMessages } from "../components/OfficialMessages";
import { SignatureManager } from "../components/SignatureManager";
import { AcademicCalendarComponent } from "../components/AcademicCalendarComponent";
import { AutoRenewalManagement } from "../components/AutoRenewalManagement";
import { InstitutionalAxesManager } from "../components/InstitutionalAxesManager";
import { UnifiedRoleStatisticsView } from "../components/UnifiedRoleStatisticsView";
import { DigitalClassBookManager } from "../components/DigitalClassBookManager";
import {
  Search,
  CheckCircle,
  AlertCircle,
  LayoutDashboard,
  Globe,
  Calendar,
  BarChart2,
  Clock,
} from "lucide-react";
import { CollapsibleSidebar } from "../components/CollapsibleSidebar";
import { SidebarMenu } from "../components/SidebarMenu";
import { MOZAMBIQUE_PROVINCES, getDistrictsForProvince } from "../data/mozambiqueLocations";
import { QuickSearchHeader } from "../components/QuickSearchHeader";
import { CollaboratorReportDispatcher } from "../components/CollaboratorReportDispatcher";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { GestaoCorpoDiscente } from "../components/GestaoCorpoDiscente";
import { QRCodeGenerator } from "../components/QRCodeGenerator";
import { 
  generateIUE, 
  generateNIM, 
  formatDocumentReference, 
  parseIUE, 
  extractInitials, 
  extractSchoolCode, 
  normalizeProvince, 
  extractDistrictCode, 
  normalizeDocumentNumber 
} from "../utils/iueGenerator";
import { computeAutoCurriculum, ALL_SCHOOL_LEVELS_MAPPING } from "../data/sigeRoles";
import { AlertTriangle } from "lucide-react";

export function SecretariatDashboard() {
  const {
    students = [],
    classes = [],
    enrollStudent,
    assignClasses,
    subjects = [],
    grades = [],
    collectionPeriods = [],
    currentUser,
    activeSchool,
    schools = [],
    examGrades = [],
    addExamGrade,
    reorganizeClasses,
  } = useStore();

  const isGradeExamInCalendar = (gradeLevel?: string | null): boolean => {
    if (!gradeLevel) return false;
    const config = getStoredSchoolCalendarConfig();
    const cleanGrade = gradeLevel.toLowerCase().trim();
    return config.nationalExams.some(exam =>
      exam.gradeLevels.some(gl => {
        const cleanGl = gl.toLowerCase().trim();
        return cleanGrade.includes(cleanGl) || cleanGl.includes(cleanGrade);
      })
    );
  };

  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "livro_turma"
    | "enrollment"
    | "auto_renewal"
    | "certificates"
    | "declarations"
    | "pautas_exames"
    | "employees"
    | "collection"
    | "messages"
    | "calendar"
    | "reports"
    | "axes"
  >("overview");

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
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Pautas de Exames & Formação de Turmas States
  const [pautasExamesTab, setPautasExamesTab] = useState<'pautas' | 'turmas'>('pautas');
  const [selectedExamClassId, setSelectedExamClassId] = useState<string>('');
  const [selectedGradeForReorg, setSelectedGradeForReorg] = useState<string>('10ª Classe');
  const [maxStudentsPerClass, setMaxStudentsPerClass] = useState<number>(6);
  const [examGradesInput, setExamGradesInput] = useState<Record<string, string>>({});
  const [reorgSuccessMsg, setReorgSuccessMsg] = useState<string | null>(null);
  
  const [selectedReceiptStudent, setSelectedReceiptStudent] = useState<Student | null>(null);
  const [selectedMedicalStudent, setSelectedMedicalStudent] = useState<Student | null>(null);
  const [selectedListClassId, setSelectedListClassId] = useState<string | null>(
    null,
  );
  const [enrollmentSubView, setEnrollmentSubView] = useState<'hub' | 'form'>('hub');
  const [selectedCycleFilter, setSelectedCycleFilter] = useState<string>('all');

  // Filters for Certificates & Declarations
  const [certYear, setCertYear] = useState<number>(2026);
  const [certGradeFilter, setCertGradeFilter] = useState<string>("all");
  const [certStudentSearch, setCertStudentSearch] = useState<string>("");
  const [certViewMode, setCertViewMode] = useState<'open-doc' | 'list'>('open-doc');
  const [selectedCertStudentId, setSelectedCertStudentId] = useState<string>('');

  const [declYear, setDeclYear] = useState<number>(2026);
  const [declGradeFilter, setDeclGradeFilter] = useState<string>("all");
  const [declStudentSearch, setDeclStudentSearch] = useState<string>("");
  const [declViewMode, setDeclViewMode] = useState<'open-doc' | 'list'>('open-doc');
  const [selectedDeclStudentId, setSelectedDeclStudentId] = useState<string>('');

  // New Student State aligned with official Processo Individual
  const [newStudent, setNewStudent] = useState({
    processCode: "",
    studentNumber: "",
    name: "",
    entryGrade: "10ª Classe",
    course: "Ensino Secundário Geral (ESG)",
    academicYear: 2026,
    openingDate: new Date().toISOString().split("T")[0],

    // 1. Identificação do Aluno
    gender: "M",
    birthDate: "",
    birthPlace: "",
    nationality: "Moçambicana",
    maritalStatus: "Solteiro(a)",
    idCardNumber: "",
    idCardIssuedAt: "Maputo",
    nuit: "",

    // Endereço
    province: "Maputo Cidade",
    district: "Kamavota",
    administrativePost: "Posto Central",
    neighborhood: "",
    address: "",
    phone: "",
    email: "",

    // 2. Filiação
    fatherName: "",
    fatherProfession: "",
    fatherPhone: "",
    motherName: "",
    motherProfession: "",
    motherPhone: "",
    guardianName: "",
    guardianKinship: "Pai/Mãe",
    guardianProfession: "",
    guardianPhone: "",
    guardianAddress: "",

    // 3. Documentos Anexos
    attachedDocuments: {
      birthCertificate: true,
      idCard: true,
      qualificationsCertificate: true,
      medicalCertificate: true,
      passPhotos: true,
      residenceDeclaration: true,
      paymentProof: true,
    },

    // 4. Histórico Académico
    academicHistory: [],

    // 5. Matrícula
    enrollmentDate: new Date().toISOString().split("T")[0],
    regime: "Diurno",
    shift: "Manhã",
    enrollmentStatus: "Activo" as const,

    // 10. Observações Gerais
    generalObservations: "",
  });

  const currentSchool = activeSchool || (schools || []).find(s => s.id === currentUser?.schoolId) || (schools || [])[0];
  const schoolTypes = currentSchool?.schoolTypes || ['ENSINO SECUNDÁRIO DO 1 CICLO', 'ENSINO SECUNDÁRIO DO 2 CICLO'];
  const autoCurriculum = useMemo(() => computeAutoCurriculum(schoolTypes), [schoolTypes]);

  const availableLevels = useMemo(() => 
    ALL_SCHOOL_LEVELS_MAPPING.filter(m => schoolTypes.includes(m.id)), 
    [schoolTypes]
  );

  const isEntryGradeAllowed = useMemo(() => {
    if (!newStudent.entryGrade) return true;
    if (!autoCurriculum.classes || autoCurriculum.classes.length === 0) return true;
    const normalizedEntry = newStudent.entryGrade.replace('ª', '.ª');
    return autoCurriculum.classes.some(ac => ac === normalizedEntry || ac.includes(newStudent.entryGrade.split(' ')[0]));
  }, [newStudent.entryGrade, autoCurriculum]);

  // Ensure entryGrade is valid for the current school type
  useEffect(() => {
    if (autoCurriculum.classes.length > 0) {
      const normalizedCurrent = newStudent.entryGrade.replace('ª', '.ª');
      const isValid = autoCurriculum.classes.some(ac => ac === normalizedCurrent);
      if (!isValid) {
        setNewStudent(prev => ({ 
          ...prev, 
          entryGrade: autoCurriculum.classes[0].replace('.ª', 'ª') 
        }));
      }
    }
  }, [autoCurriculum, newStudent.entryGrade]);

  // Live IUE and NIM calculations for real-time visualization and enrollment
  const liveIUE = useMemo(() => generateIUE({
    name: newStudent.name || "NOME DO ESTUDANTE",
    documentNumber: newStudent.idCardNumber || newStudent.nuit,
    idCardNumber: newStudent.idCardNumber,
    nuit: newStudent.nuit,
    schoolName: "Escola Secundária Josina Machel",
    schoolCode: "ESJM",
    province: newStudent.province || "Maputo Cidade",
    district: newStudent.district || "Kamavota",
    academicYear: newStudent.academicYear || 2026,
  }), [newStudent.name, newStudent.idCardNumber, newStudent.nuit, newStudent.province, newStudent.district, newStudent.academicYear]);

  const liveNIM = useMemo(() => generateNIM({
    year: newStudent.academicYear || 2026,
    district: newStudent.district || "Kamavota",
    sequenceNumber: ((students || []).length || 0) + 1,
    fallbackSeed: `${newStudent.name || 'ESTUDANTE'}_${newStudent.idCardNumber || 'DOC'}`
  }), [newStudent.academicYear, newStudent.district, (students || []).length, newStudent.name, newStudent.idCardNumber]);

  const parsedLiveIUE = useMemo(() => parseIUE(liveIUE), [liveIUE]);

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEntryGradeAllowed) {
      alert(`⚠️ Regra de Negócio Impeditiva: A classe "${newStudent.entryGrade}" não é leccionada por este tipo de estabelecimento de ensino (${schoolTypes.join(', ')}). A Secretaria está impedida de efetuar esta matrícula.`);
      return;
    }
    const calculatedIUE = generateIUE({
      name: newStudent.name,
      documentNumber: newStudent.idCardNumber || newStudent.nuit,
      idCardNumber: newStudent.idCardNumber,
      nuit: newStudent.nuit,
      schoolName: "Escola Secundária Josina Machel",
      schoolCode: "ESJM",
      province: newStudent.province,
      district: newStudent.district,
      academicYear: newStudent.academicYear,
    });

    const calculatedNIM = generateNIM({
      year: newStudent.academicYear,
      district: newStudent.district,
      sequenceNumber: ((students || []).length || 0) + 1,
    });

    const newEnrolledStudent = {
      schoolId: "s1",
      ...newStudent,
      iue: calculatedIUE,
      nim: calculatedNIM,
      id: calculatedIUE,
      processCode: newStudent.processCode.trim() || calculatedIUE,
      studentNumber: newStudent.studentNumber.trim() || calculatedIUE,
      studentCode: `EST-2026-${calculatedIUE.slice(-5)}`,
    };

    enrollStudent(newEnrolledStudent as any);

    // Open Student Process Form immediately!
    setSelectedStudent(newEnrolledStudent as any);

    // Reset form
    setNewStudent({
      processCode: "",
      studentNumber: "",
      name: "",
      entryGrade: "10ª Classe",
      course: "Ensino Secundário Geral (ESG)",
      academicYear: 2026,
      openingDate: new Date().toISOString().split("T")[0],
      gender: "M",
      birthDate: "",
      birthPlace: "",
      nationality: "Moçambicana",
      maritalStatus: "Solteiro(a)",
      idCardNumber: "",
      idCardIssuedAt: "Maputo",
      nuit: "",
      province: "Maputo Cidade",
      district: "Kamavota",
      administrativePost: "Posto Central",
      neighborhood: "",
      address: "",
      phone: "",
      email: "",
      fatherName: "",
      fatherProfession: "",
      fatherPhone: "",
      motherName: "",
      motherProfession: "",
      motherPhone: "",
      guardianName: "",
      guardianKinship: "Pai/Mãe",
      guardianProfession: "",
      guardianPhone: "",
      guardianAddress: "",
      attachedDocuments: {
        birthCertificate: true,
        idCard: true,
        qualificationsCertificate: true,
        medicalCertificate: true,
        passPhotos: true,
        residenceDeclaration: true,
        paymentProof: true,
      },
      academicHistory: [
        {
          year: 2024,
          grade: "8ª Classe",
          school: "Escola Comunitária São Pedro",
          result: "Aprovado",
        },
        {
          year: 2025,
          grade: "9ª Classe",
          school: "Escola Secundária Josina Machel",
          result: "Aprovado",
        },
      ],
      enrollmentDate: new Date().toISOString().split("T")[0],
      regime: "Diurno",
      shift: "Manhã",
      enrollmentStatus: "Activo",
      generalObservations: "",
    });

    assignClasses();
  };

  const getFinalGrade = (studentId: string, subjectId: string) => {
    const sGrades = grades.filter(
      (g) => g.studentId === studentId && g.subjectId === subjectId,
    );
    if (sGrades.length === 0) return 0;

    let sum = 0;
    sGrades.forEach((g) => {
      sum += g.media || 0;
    });

    const average = sum / 3; // Média Final over 3 trimesters
    if (average >= 9.5) {
      return Math.max(10, Math.round(average));
    }
    return Math.round(average);
  };

  const isApproved = (studentId: string) => {
    // simple logic: average of all subjects >= 9.5
    const averages = subjects.map((s) => getFinalGrade(studentId, s.id));
    const total = averages.reduce((a, b) => a + b, 0);
    const finalScore = total / (subjects.length || 1);
    return finalScore >= 9.5;
  };

  return (
    <CollapsibleSidebar
      sidebarContent={
        <SidebarMenu
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setSelectedStudent(null);
            setActiveTab(tab as any);
          }}
        />
      }
    >
      <div className="p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Portal da Secretaria Geral</h1>
            <p className="text-xs text-slate-500">Sistema de Gestão Escolar e Processos Individuais</p>
          </div>
          <QuickSearchHeader
            onSelectStudent={(s) => {
              setActiveTab("enrollment");
              setSelectedStudent(s);
            }}
            onSelectClass={(c) => {
              setActiveTab("overview");
              setSelectedListClassId(c.id);
            }}
            onSelectTeacher={(e) => {
              setActiveTab("employees");
            }}
          />
        </div>

        {activeTab === "auto_renewal" && (
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
            <AutoRenewalManagement
              currentSchoolId={currentUser?.schoolId}
              onViewStudentProcess={(s) => {
                setSelectedStudent(s);
                setActiveTab("enrollment");
              }}
              onViewCertificate={(s) => {
                setSelectedStudent(s);
                setActiveTab("certificates");
              }}
            />
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
            <AcademicCalendarComponent />
          </div>
        )}

        {activeTab === "livro_turma" && (
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
            <DigitalClassBookManager overrideRole="secretariat" />
          </div>
        )}

        {(activeTab as string) === "statistics" && <UnifiedRoleStatisticsView overrideRole="gestao" />}
        
        {(activeTab as string) === "signature" && <SignatureManager />}

        {activeTab === "overview" && <SecretariatOverview />}

        {activeTab === "collection" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Recolha de Dados Estatísticos
                </h2>
                <p className="text-sm text-slate-500">
                  Sincronização oficial com a Direção Distrital e Provincial
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {collectionPeriods.filter((p) => p.status === "published")
                .length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">
                    Não existem períodos de recolha ativos no momento.
                  </p>
                </Card>
              ) : (
                collectionPeriods
                  .filter((p) => p.status === "published")
                  .map((period) => (
                    <CollectionFormView key={period.id} period={period} />
                  ))
              )}
            </div>
          </div>
        )}

        {activeTab === "messages" && <OfficialMessages />}

        {activeTab === "enrollment" && (
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gestão de Matrículas e Processos</h2>
                <p className="text-xs text-slate-500">Selecione o ciclo ou turma com 1 clique para listar alunos, ou abra um novo processo individual.</p>
              </div>
              <Button
                onClick={() => setEnrollmentSubView(enrollmentSubView === 'hub' ? 'form' : 'hub')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 text-xs py-2 px-4 rounded-xl shadow-md"
              >
                <UserPlus size={16} />
                {enrollmentSubView === 'hub' ? '+ Nova Matrícula / Processo Individual' : '← Voltar à Seleção de Turmas'}
              </Button>
            </div>

            {enrollmentSubView === 'hub' ? (
              <div className="space-y-6">
                {/* Cycle Filter Buttons */}
                <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtrar por Ciclo:</span>
                  <button
                    onClick={() => setSelectedCycleFilter('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedCycleFilter === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todos os Ciclos ({classes.filter(c => c.schoolId === currentSchool?.id).length})
                  </button>
                  {availableLevels.map(level => (
                    <button
                      key={level.id}
                      onClick={() => setSelectedCycleFilter(level.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        selectedCycleFilter === level.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {level.id.replace('ENSINO ', '').replace(' DO ', ' ')}
                    </button>
                  ))}
                </div>

                {/* Class List Cards (1-Click Selection) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes
                    .filter((c) => c.schoolId === currentSchool?.id)
                    .filter((c) => {
                      if (selectedCycleFilter === 'all') return true;
                      const levelDef = ALL_SCHOOL_LEVELS_MAPPING.find(l => l.id === selectedCycleFilter);
                      if (!levelDef) return true;
                      const normalizedGrade = c.gradeLevel.replace('ª', '.ª');
                      return levelDef.classes.some(lc => lc === normalizedGrade || lc.includes(c.gradeLevel.split(' ')[0]));
                    })
                    .map((cls) => {
                      const classStudents = students.filter((s) => s.classId === cls.id);
                      return (
                        <Card
                          key={cls.id}
                          className="p-5 border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer bg-white rounded-2xl flex flex-col justify-between group"
                          onClick={() => {
                            setSelectedListClassId(cls.id);
                            setActiveTab("overview");
                          }}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="bg-blue-50 text-blue-700 text-[11px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                {cls.gradeLevel}
                              </span>
                              <span className="text-xs font-bold text-slate-400">
                                {cls.year}
                              </span>
                            </div>
                            <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                              {cls.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                              Período: {cls.period || 'Diurno'} • Alunos: {classStudents.length}
                            </p>
                          </div>
                          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                              Ver Lista de Alunos <ChevronRight size={14} />
                            </span>
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                              Activa
                            </span>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              </div>
            ) : (
              <Card className="p-0 overflow-hidden border-2 border-[#1e293b] shadow-xl bg-[#fdfbf7]">
                <div className="p-8 text-black">
                  <div className="text-center mb-8 border-b-2 border-black pb-6 relative flex flex-col items-center">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Emblem_of_Mozambique.svg/600px-Emblem_of_Mozambique.svg.png"
                      alt="Logotipo da República"
                      className="h-16 w-16 mb-2 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <h4 className="font-bold text-sm tracking-wider">
                      REPÚBLICA DE MOÇAMBIQUE
                    </h4>
                    <h4 className="font-bold text-xs uppercase text-gray-800">
                      MINISTÉRIO DA EDUCAÇÃO E DESENVOLVIMENTO HUMANO
                    </h4>
                    <div className="mt-2 font-bold text-base text-blue-950 underline underline-offset-4">
                      ESCOLA SECUNDÁRIA CENTRAL
                    </div>

                    <div className="mt-4 bg-slate-900 text-white px-6 py-1.5 rounded text-sm font-bold tracking-widest uppercase">
                      PROCESSO INDIVIDUAL DO ALUNO — FICHA DE CADASTRO E MATRÍCULA
                    </div>
                  </div>

                <form onSubmit={handleEnroll} className="space-y-8">
                  {/* IDENTIFICADOR ÚNICO DO ESTUDANTE (IUE) - PADRÃO OFICIAL MINEDH / EDUGESTÃO */}
                  <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-xl border border-blue-700/50">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-blue-800/60">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-500/30 text-blue-200 border border-blue-400/40 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                            Padrão Oficial MINEDH / EduGestão
                          </span>
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Geração Automática Ativa
                          </span>
                        </div>
                        <h3 className="text-lg font-black tracking-tight text-white mt-1">
                          Identificador Único do Estudante (IUE)
                        </h3>
                        <p className="text-xs text-blue-200/80">
                          Estrutura Padronizada: <code className="bg-blue-950/80 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[11px]">[INICIAIS]-[Nº_DOC]-[ESCOLA]/[PROVÍNCIA]/[DISTRITO]/[ANO]</code>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">NIM (Uso Diário)</span>
                        <code className="text-sm font-mono font-black text-emerald-400 bg-slate-950 px-2.5 py-1 rounded border border-emerald-500/30">
                          {liveNIM}
                        </code>
                      </div>
                    </div>

                    {/* LIVE GENERATED IUE DISPLAY BADGE */}
                    <div className="mt-4 bg-slate-950/80 p-4 rounded-xl border border-blue-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="w-full md:w-auto">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Código Gerado em Tempo Real (IUE)
                        </span>
                        <div className="text-base sm:text-lg md:text-xl font-mono font-black text-amber-400 tracking-wider break-all select-all">
                          {liveIUE}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 font-mono">
                          {formatDocumentReference(liveIUE, 'REF_EDUGESTAO')}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-sm">
                          <span className="px-2 py-1 bg-blue-950 border border-blue-700/50 rounded text-[11px] font-mono text-blue-300">
                            <strong className="text-slate-400 font-normal">Iniciais:</strong> {parsedLiveIUE.initials || '...'}
                          </span>
                          <span className="px-2 py-1 bg-blue-950 border border-blue-700/50 rounded text-[11px] font-mono text-blue-300">
                            <strong className="text-slate-400 font-normal">Doc:</strong> {parsedLiveIUE.documentNumber || '...'}
                          </span>
                          <span className="px-2 py-1 bg-blue-950 border border-blue-700/50 rounded text-[11px] font-mono text-blue-300">
                            <strong className="text-slate-400 font-normal">Escola:</strong> {parsedLiveIUE.schoolCode || '...'}
                          </span>
                          <span className="px-2 py-1 bg-blue-950 border border-blue-700/50 rounded text-[11px] font-mono text-blue-300">
                            <strong className="text-slate-400 font-normal">Prov:</strong> {parsedLiveIUE.province || '...'}
                          </span>
                          <span className="px-2 py-1 bg-blue-950 border border-blue-700/50 rounded text-[11px] font-mono text-blue-300">
                            <strong className="text-slate-400 font-normal">Dist:</strong> {parsedLiveIUE.district || '...'}
                          </span>
                          <span className="px-2 py-1 bg-blue-950 border border-blue-700/50 rounded text-[11px] font-mono text-blue-300">
                            <strong className="text-slate-400 font-normal">Ano:</strong> {parsedLiveIUE.year || '...'}
                          </span>
                        </div>
                        <div className="shrink-0 bg-white p-1 rounded-lg shadow-sm border border-blue-400/40" title="QR Code Oficial EDUGESTÃO (Clique para inspecionar)">
                          <QRCodeGenerator
                            edugestaoId={liveIUE}
                            nim={liveNIM}
                            studentName={newStudent.name || 'Novo Aluno'}
                            schoolName="Escola Secundária Josina Machel"
                            schoolCode={parsedLiveIUE.schoolCode}
                            province={newStudent.province}
                            district={newStudent.district}
                            gradeLevel={newStudent.entryGrade}
                            variant="minimal"
                            size={56}
                            enableModal={true}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-blue-200/90 pt-2 border-t border-blue-800/40">
                      <div>✓ ID Oficial do Aluno</div>
                      <div>✓ Código do Processo</div>
                      <div>✓ Chave de Pesquisa Universal</div>
                      <div>✓ Payload QR Code & Certificados</div>
                    </div>
                  </div>

                  {/* CAPA DO PROCESSO */}
                  <div className="bg-amber-50/60 p-4 border border-amber-200 rounded-md">
                    <h3 className="font-bold text-sm uppercase text-amber-950 border-b border-amber-300 pb-1 mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-amber-800" /> Capa do Processo
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        IUE: {liveIUE}
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Código do Processo / IUE (Auto)
                        </label>
                        <input
                          type="text"
                          placeholder={liveIUE}
                          value={newStudent.processCode || liveIUE}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              processCode: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm font-mono outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Número do Aluno / NIM (Auto)
                        </label>
                        <input
                          type="text"
                          placeholder={liveNIM}
                          value={newStudent.studentNumber || liveNIM}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              studentNumber: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm font-mono outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Ano Lectivo
                        </label>
                        <input
                          type="number"
                          value={newStudent.academicYear}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              academicYear: parseInt(e.target.value) || 2026,
                            })
                          }
                          className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Classe de Ingresso *
                        </label>
                        <select
                          value={newStudent.entryGrade}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              entryGrade: e.target.value,
                            })
                          }
                          className={`w-full bg-white border rounded px-3 py-1.5 text-sm outline-none font-bold ${
                            !isEntryGradeAllowed 
                              ? 'border-red-500 text-red-900 bg-red-50' 
                              : 'border-gray-300 text-slate-800 focus:border-blue-600'
                          }`}
                        >
                          <option value="">Selecione a Classe...</option>
                          {autoCurriculum.classes.map(grade => {
                            const normalizedGrade = grade.replace('.ª', 'ª');
                            const levelInfo = ALL_SCHOOL_LEVELS_MAPPING.find(l => l.classes.includes(grade));
                            const isExam = isExamGradeLevel(normalizedGrade);
                            return (
                              <option key={grade} value={normalizedGrade}>
                                {normalizedGrade} ({levelInfo?.id.replace('ENSINO ', '').replace(' DO ', ' ')}{isExam ? ' - Exame' : ''})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {!isEntryGradeAllowed && (
                        <div className="col-span-1 md:col-span-4 p-4 bg-red-50 border-2 border-red-500 rounded-2xl text-red-900 flex items-start gap-3 my-2 shadow-sm animate-fadeIn">
                          <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-black text-xs uppercase tracking-wide">
                              ALERTA DA SECRETARIA: INCOMPATIBILIDADE COM TIPO DE ESCOLA
                            </h4>
                            <p className="text-xs font-semibold mt-1">
                              A classe seleccionada (<strong>{newStudent.entryGrade}</strong>) não é leccionada nesta instituição (Tipo: <strong>{schoolTypes.join(', ')}</strong>). O sistema impede a realização da matrícula nesta classe.
                            </p>
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Curso
                        </label>
                        <input
                          type="text"
                          value={newStudent.course}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              course: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Data de Abertura do Processo
                        </label>
                        <input
                          type="date"
                          value={newStudent.openingDate}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              openingDate: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 1. IDENTIFICAÇÃO DO ALUNO */}
                  <div className="border-t border-gray-300 pt-4">
                    <h3 className="font-bold text-base text-gray-900 mb-3 uppercase tracking-wide">
                      1. IDENTIFICAÇÃO DO ALUNO
                    </h3>

                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 border border-gray-200 rounded">
                        <h4 className="font-bold text-xs uppercase text-gray-600 mb-3">
                          Dados Pessoais
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-sm">
                          <div className="md:col-span-8">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Nome Completo *
                            </label>
                            <input
                              required
                              value={newStudent.name}
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Nome completo do estudante"
                              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                            />
                          </div>
                          <div className="md:col-span-4">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Sexo *
                            </label>
                            <select
                              value={newStudent.gender}
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  gender: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                            >
                              <option value="M">Masculino (H)</option>
                              <option value="F">Feminino (M)</option>
                            </select>
                          </div>

                          <div className="md:col-span-4">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Data de Nascimento *
                            </label>
                            <input
                              type="date"
                              required
                              value={newStudent.birthDate}
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  birthDate: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                            />
                          </div>
                          <div className="md:col-span-4">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Naturalidade
                            </label>
                            <input
                              value={newStudent.birthPlace}
                              placeholder="Cidade / Local de Nasc."
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  birthPlace: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                            />
                          </div>
                          <div className="md:col-span-4">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Nacionalidade
                            </label>
                            <input
                              value={newStudent.nationality}
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  nationality: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                            />
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Estado Civil
                            </label>
                            <input
                              value={newStudent.maritalStatus}
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  maritalStatus: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              BI / Documento n.º
                            </label>
                            <input
                              value={newStudent.idCardNumber}
                              placeholder="110100234567M"
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  idCardNumber: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Emitido em
                            </label>
                            <input
                              value={newStudent.idCardIssuedAt}
                              placeholder="Maputo"
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  idCardIssuedAt: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              NUIT
                            </label>
                            <input
                              value={newStudent.nuit}
                              placeholder="123456789"
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  nuit: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 border border-gray-200 rounded">
                        <h4 className="font-bold text-xs uppercase text-gray-600 mb-3">
                          Endereço e Contactos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-sm">
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Província
                            </label>
                            <select
                              value={newStudent.province}
                              onChange={(e) => {
                                const prov = e.target.value;
                                const dList = getDistrictsForProvince(prov);
                                setNewStudent({
                                  ...newStudent,
                                  province: prov,
                                  district: dList[0] || "",
                                });
                              }}
                              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                            >
                              {MOZAMBIQUE_PROVINCES.map((p) => (
                                <option key={p.province} value={p.province}>{p.province}</option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Distrito
                            </label>
                            <select
                              value={newStudent.district}
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  district: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                            >
                              {getDistrictsForProvince(newStudent.province).map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Posto Administrativo
                            </label>
                            <select
                              value={newStudent.administrativePost}
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  administrativePost: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                            >
                              <option value="Posto Central">Posto Central</option>
                              <option value="Posto Urbano 1">Posto Urbano 1</option>
                              <option value="Posto Urbano 2">Posto Urbano 2</option>
                              <option value="Posto Periférico">Posto Periférico</option>
                              <option value="Posto Sede">Posto Sede</option>
                            </select>
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Bairro
                            </label>
                            <select
                              value={newStudent.neighborhood}
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  neighborhood: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                            >
                              <option value="">Selecione o Bairro...</option>
                              <option value="Central">Central</option>
                              <option value="Polana Cimento">Polana Cimento</option>
                              <option value="Alto Maé">Alto Maé</option>
                              <option value="Malhangalene">Malhangalene</option>
                              <option value="Sommerschield">Sommerschield</option>
                              <option value="Mavalane">Mavalane</option>
                              <option value="Chamanculo">Chamanculo</option>
                              <option value="Aeroporto">Aeroporto</option>
                              <option value="Zimpeto">Zimpeto</option>
                              <option value="Costa do Sol">Costa do Sol</option>
                              <option value="Fomento">Fomento</option>
                              <option value="Matola-Gare">Matola-Gare</option>
                              <option value="Outro">Outro</option>
                            </select>
                          </div>

                          <div className="md:col-span-6">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Morada / Rua / Q.
                            </label>
                            <input
                              value={newStudent.address}
                              placeholder="Av. Julius Nyerere, Quarteirão 12"
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  address: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Contacto Telefónico
                            </label>
                            <input
                              value={newStudent.phone}
                              placeholder="+258 84 123 4567"
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  phone: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              E-mail
                            </label>
                            <input
                              type="email"
                              value={newStudent.email}
                              placeholder="estudante@email.com"
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  email: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. FILIAÇÃO */}
                  <div className="border-t border-gray-300 pt-4">
                    <h3 className="font-bold text-base text-gray-900 mb-3 uppercase tracking-wide">
                      2. FILIAÇÃO
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {/* Pai */}
                      <div className="bg-gray-50 p-3.5 border border-gray-200 rounded space-y-2.5">
                        <h4 className="font-bold text-xs uppercase text-gray-800">
                          Pai
                        </h4>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            Nome do Pai
                          </label>
                          <input
                            value={newStudent.fatherName}
                            onChange={(e) =>
                              setNewStudent({
                                ...newStudent,
                                fatherName: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 text-sm outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            Profissão
                          </label>
                          <input
                            value={newStudent.fatherProfession}
                            onChange={(e) =>
                              setNewStudent({
                                ...newStudent,
                                fatherProfession: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 text-sm outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            Contacto Telefónico
                          </label>
                          <input
                            value={newStudent.fatherPhone}
                            placeholder="+258 82 000 0000"
                            onChange={(e) =>
                              setNewStudent({
                                ...newStudent,
                                fatherPhone: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 text-sm outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>

                      {/* Mãe */}
                      <div className="bg-gray-50 p-3.5 border border-gray-200 rounded space-y-2.5">
                        <h4 className="font-bold text-xs uppercase text-gray-800">
                          Mãe
                        </h4>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            Nome da Mãe
                          </label>
                          <input
                            value={newStudent.motherName}
                            onChange={(e) =>
                              setNewStudent({
                                ...newStudent,
                                motherName: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 text-sm outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            Profissão
                          </label>
                          <input
                            value={newStudent.motherProfession}
                            onChange={(e) =>
                              setNewStudent({
                                ...newStudent,
                                motherProfession: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 text-sm outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            Contacto Telefónico
                          </label>
                          <input
                            value={newStudent.motherPhone}
                            placeholder="+258 84 000 0000"
                            onChange={(e) =>
                              setNewStudent({
                                ...newStudent,
                                motherPhone: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 text-sm outline-none focus:border-blue-600"
                          />
                        </div>
                      </div>

                      {/* Encarregado */}
                      <div className="bg-blue-50/50 p-3.5 border border-blue-200 rounded space-y-2.5">
                        <h4 className="font-bold text-xs uppercase text-blue-900">
                          Encarregado de Educação
                        </h4>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            Nome do Encarregado
                          </label>
                          <input
                            value={newStudent.guardianName}
                            onChange={(e) =>
                              setNewStudent({
                                ...newStudent,
                                guardianName: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 text-sm outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            Grau de Parentesco
                          </label>
                          <input
                            value={newStudent.guardianKinship}
                            placeholder="Pai, Mãe, Tio(a), etc."
                            onChange={(e) =>
                              setNewStudent({
                                ...newStudent,
                                guardianKinship: e.target.value,
                              })
                            }
                            className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 text-sm outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            Profissão / Contacto
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              placeholder="Profissão"
                              value={newStudent.guardianProfession}
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  guardianProfession: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-blue-600"
                            />
                            <input
                              placeholder="Telefone"
                              value={newStudent.guardianPhone}
                              onChange={(e) =>
                                setNewStudent({
                                  ...newStudent,
                                  guardianPhone: e.target.value,
                                })
                              }
                              className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-blue-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. DOCUMENTOS ANEXOS */}
                  <div className="border-t border-gray-300 pt-4">
                    <h3 className="font-bold text-base text-gray-900 mb-3 uppercase tracking-wide">
                      3. DOCUMENTOS ANEXOS
                    </h3>
                    <div className="border border-gray-300 rounded overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-700 border-b border-gray-300">
                          <tr>
                            <th className="py-2 px-3 text-left w-12 font-bold">
                              N.º
                            </th>
                            <th className="py-2 px-3 text-left font-bold">
                              Documento
                            </th>
                            <th className="py-2 px-3 text-center w-24 font-bold">
                              Entregue
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {[
                            {
                              key: "birthCertificate",
                              name: "Cópia da Certidão de Nascimento / Assento de Nascimento",
                              num: 1,
                            },
                            {
                              key: "idCard",
                              name: "Cópia do Bilhete de Identidade (BI) / Passaporte / DIRE",
                              num: 2,
                            },
                            {
                              key: "qualificationsCertificate",
                              name: "Certificado de Habilitações Literárias da classe anterior",
                              num: 3,
                            },
                            {
                              key: "medicalCertificate",
                              name: "Atestado Médico de Sanidade Mental e Física",
                              num: 4,
                            },
                            {
                              key: "passPhotos",
                              name: "2 Fotografias tipo passe",
                              num: 5,
                            },
                            {
                              key: "residenceDeclaration",
                              name: "Declaração de Residência / Comprovativo de Bairro",
                              num: 6,
                            },
                            {
                              key: "paymentProof",
                              name: "Comprovativo de Pagamento de Taxa de Matrícula",
                              num: 7,
                            },
                          ].map((doc) => (
                            <tr key={doc.key} className="hover:bg-gray-50">
                              <td className="py-2 px-3 text-gray-500 font-mono text-center">
                                {doc.num}
                              </td>
                              <td className="py-2 px-3 text-gray-800">
                                {doc.name}
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={
                                    !!newStudent.attachedDocuments[
                                      doc.key as keyof typeof newStudent.attachedDocuments
                                    ]
                                  }
                                  onChange={(e) =>
                                    setNewStudent({
                                      ...newStudent,
                                      attachedDocuments: {
                                        ...newStudent.attachedDocuments,
                                        [doc.key]: e.target.checked,
                                      },
                                    })
                                  }
                                  className="h-4 w-4 text-blue-600 rounded cursor-pointer"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 4. HISTÓRICO ACADÉMICO */}
                  <div className="border-t border-gray-300 pt-4">
                    <h3 className="font-bold text-base text-gray-900 mb-3 uppercase tracking-wide">
                      4. HISTÓRICO ACADÉMICO
                    </h3>
                    <div className="border border-gray-300 rounded overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 text-gray-700 border-b border-gray-300">
                          <tr>
                            <th className="py-2 px-3 text-center w-28 font-bold">
                              Ano
                            </th>
                            <th className="py-2 px-3 text-center w-32 font-bold">
                              Classe
                            </th>
                            <th className="py-2 px-3 text-left font-bold">
                              Escola
                            </th>
                            <th className="py-2 px-3 text-center w-32 font-bold">
                              Resultado
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {newStudent.academicHistory.map((hist, idx) => (
                            <tr key={idx}>
                              <td className="py-2 px-2">
                                <input
                                  type="number"
                                  value={hist.year}
                                  onChange={(e) => {
                                    const updated = [
                                      ...newStudent.academicHistory,
                                    ];
                                    updated[idx].year =
                                      parseInt(e.target.value) || 2024;
                                    setNewStudent({
                                      ...newStudent,
                                      academicHistory: updated,
                                    });
                                  }}
                                  className="w-full text-center border border-gray-300 rounded py-1 text-sm"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  value={hist.grade}
                                  onChange={(e) => {
                                    const updated = [
                                      ...newStudent.academicHistory,
                                    ];
                                    updated[idx].grade = e.target.value;
                                    setNewStudent({
                                      ...newStudent,
                                      academicHistory: updated,
                                    });
                                  }}
                                  className="w-full text-center border border-gray-300 rounded py-1 text-sm"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <input
                                  value={hist.school}
                                  onChange={(e) => {
                                    const updated = [
                                      ...newStudent.academicHistory,
                                    ];
                                    updated[idx].school = e.target.value;
                                    setNewStudent({
                                      ...newStudent,
                                      academicHistory: updated,
                                    });
                                  }}
                                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                />
                              </td>
                              <td className="py-2 px-2">
                                <select
                                  value={hist.result}
                                  onChange={(e) => {
                                    const updated = [
                                      ...newStudent.academicHistory,
                                    ];
                                    updated[idx].result = e.target.value;
                                    setNewStudent({
                                      ...newStudent,
                                      academicHistory: updated,
                                    });
                                  }}
                                  className="w-full text-center border border-gray-300 rounded py-1 text-sm"
                                >
                                  <option value="Aprovado">Aprovado</option>
                                  <option value="Reprovado">Reprovado</option>
                                  <option value="Transferido">
                                    Transferido
                                  </option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 5. MATRÍCULA */}
                  <div className="border-t border-gray-300 pt-4">
                    <h3 className="font-bold text-base text-gray-900 mb-3 uppercase tracking-wide">
                      5. MATRÍCULA
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm bg-gray-50 p-4 border border-gray-200 rounded">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Data da Matrícula
                        </label>
                        <input
                          type="date"
                          value={newStudent.enrollmentDate}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              enrollmentDate: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Regime
                        </label>
                        <select
                          value={newStudent.regime}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              regime: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                        >
                          <option value="Diurno">Diurno</option>
                          <option value="Nocturno">Nocturno</option>
                          <option value="EaD (À Distância)">
                            EaD (À Distância)
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Turno
                        </label>
                        <select
                          value={newStudent.shift}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              shift: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600"
                        >
                          <option value="Manhã">Manhã (1º Turno)</option>
                          <option value="Tarde">Tarde (2º Turno)</option>
                          <option value="Noite">Noite (3º Turno)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Situação Inicial
                        </label>
                        <select
                          value={newStudent.enrollmentStatus}
                          onChange={(e) =>
                            setNewStudent({
                              ...newStudent,
                              enrollmentStatus: e.target.value as any,
                            })
                          }
                          className="w-full bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none focus:border-blue-600 font-semibold text-green-700"
                        >
                          <option value="Activo">Activo</option>
                          <option value="Transferido">Transferido</option>
                          <option value="Desistente">Desistente</option>
                          <option value="Concluído">Concluído</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 10. OBSERVAÇÕES GERAIS */}
                  <div className="border-t border-gray-300 pt-4">
                    <h3 className="font-bold text-base text-gray-900 mb-2 uppercase tracking-wide">
                      10. OBSERVAÇÕES GERAIS
                    </h3>
                    <textarea
                      rows={3}
                      value={newStudent.generalObservations}
                      onChange={(e) =>
                        setNewStudent({
                          ...newStudent,
                          generalObservations: e.target.value,
                        })
                      }
                      placeholder="Registo de observações adicionais relativas à matrícula, saúde, acompanhamento psicopedagógico ou transferências..."
                      className="w-full bg-white border border-gray-300 rounded p-3 text-sm outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="pt-6 flex justify-end border-t border-gray-300">
                    <Button
                      type="submit"
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-8 py-3 text-base rounded shadow-md flex items-center gap-2"
                    >
                      <UserPlus className="h-5 w-5" /> Registar e Abrir Processo
                      Individual
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
            )}

            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                Lista de Alunos (Processos)
              </h3>
              {!selectedListClassId ? (
                <div className="space-y-6">
                  {Object.entries(
                    classes.reduce(
                      (acc, c) => {
                        if (!acc[c.year]) acc[c.year] = {};
                        if (!acc[c.year][c.gradeLevel])
                          acc[c.year][c.gradeLevel] = [];
                        acc[c.year][c.gradeLevel].push(c);
                        return acc;
                      },
                      {} as Record<number, Record<string, typeof classes>>,
                    ),
                  )
                    .sort((a, b) => Number(b[0]) - Number(a[0]))
                    .map(([year, grades]) => (
                      <div key={year}>
                        <h4 className="font-bold text-gray-800 text-lg mb-3">
                          Ano Letivo: {year}
                        </h4>
                        <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                          {Object.entries(grades).map(
                            ([gradeLevel, turmas]) => (
                              <div key={gradeLevel}>
                                <h5 className="font-semibold text-gray-700 mb-2">
                                  Classe: {gradeLevel}
                                </h5>
                                <div className="flex flex-wrap gap-3">
                                  {turmas.map((t) => (
                                    <button
                                      key={t.id}
                                      onClick={() =>
                                        setSelectedListClassId(t.id)
                                      }
                                      className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-blue-50 hover:border-blue-300 text-sm font-medium text-gray-800 transition-colors"
                                    >
                                      {t.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ))}

                  {students.some((s) => !s.classId) && (
                    <div className="mt-8">
                      <h4 className="font-bold text-red-600 text-lg mb-3">
                        Alunos Pendentes de Turma
                      </h4>
                      <button
                        onClick={() => setSelectedListClassId("pending")}
                        className="px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-md shadow-sm hover:bg-red-100 text-sm font-medium transition-colors"
                      >
                        Ver Alunos Pendentes (
                        {students.filter((s) => !s.classId).length})
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-900 text-lg">
                      {selectedListClassId === "pending"
                        ? "Alunos Pendentes de Turma"
                        : `Alunos: ${classes.find((c) => c.id === selectedListClassId)?.name} (${classes.find((c) => c.id === selectedListClassId)?.gradeLevel} - ${classes.find((c) => c.id === selectedListClassId)?.year})`}
                    </h4>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedListClassId(null)}
                    >
                      Voltar aos Grupos
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Nome / Identificação
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Nascimento
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Data de Matrícula
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Emissão de Documentos
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {students
                          .filter((s) =>
                            selectedListClassId === "pending"
                              ? !s.classId
                              : s.classId === selectedListClassId,
                          )
                          .map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span 
                                    className="text-blue-600 hover:underline cursor-pointer font-bold block"
                                    onClick={() => setSelectedStudent(s)}
                                  >
                                    {s.name}
                                  </span>
                                  {s.entryType === 'repetente' && (
                                    <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-amber-300 shadow-2xs">
                                      Repetente
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {s.processCode || `PROC-${s.id}`}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {s.birthDate}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {s.enrollmentDate}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedReceiptStudent(s)}
                                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                                    title="Emitir Recibo Oficial de Matrícula e Renovação"
                                  >
                                    <Receipt size={13} className="text-purple-600" />
                                    <span>Recibo</span>
                                  </button>
                                  <button
                                    onClick={() => setSelectedMedicalStudent(s)}
                                    className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                                    title="Emitir Certificado / Atestado Médico Oficial (Com Emblema de Moçambique)"
                                  >
                                    <FileText size={13} className="text-teal-600" />
                                    <span>Médico</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedStudent(s);
                                      setActiveTab("certificates");
                                    }}
                                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                                    title="Gerar Certificado de Conclusão / Habilitações"
                                  >
                                    <Award size={13} className="text-amber-600" />
                                    <span>Certificado</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedStudent(s);
                                      setActiveTab("declarations");
                                    }}
                                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                                    title="Emitir Declaração com Notas"
                                  >
                                    <FileText size={13} className="text-blue-600" />
                                    <span>Declaração</span>
                                  </button>
                                  <button
                                    onClick={() => setSelectedStudent(s)}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-all"
                                    title="Ver Processo Individual"
                                  >
                                    Processo
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        {students.filter((s) =>
                          selectedListClassId === "pending"
                            ? !s.classId
                            : s.classId === selectedListClassId,
                        ).length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-6 py-8 text-center text-sm text-gray-500"
                            >
                              Nenhum aluno encontrado nesta turma.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>

            {/* STUDENT PROCESSO INDIVIDUAL VIEW MODAL */}
            {selectedStudent && activeTab === "enrollment" && (
              <StudentProcessDocument
                student={selectedStudent}
                schoolName="Escola Secundária Central"
                classes={classes}
                subjects={subjects}
                grades={grades}
                onClose={() => setSelectedStudent(null)}
              />
            )}

            {/* RECIBO OFICIAL DE MATRICULA MODAL */}
            {selectedReceiptStudent && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 ">
                <EnrollmentReceiptDocument
                  student={selectedReceiptStudent}
                  schoolName={activeSchool?.name || "Escola Secundária Josina Machel"}
                  directorName={activeSchool?.directorName || "Prof. Doutor Zacarias Manuel Tembe"}
                  academicYear={2026}
                  onClose={() => setSelectedReceiptStudent(null)}
                />
              </div>
            )}

            {/* ATESTADO / CERTIFICADO MÉDICO MODAL */}
            {selectedMedicalStudent && (
              <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 ">
                <MedicalCertificateDocument
                  student={selectedMedicalStudent}
                  schoolName={activeSchool?.name || "Escola Secundária Josina Machel"}
                  academicYear={2026}
                  onClose={() => setSelectedMedicalStudent(null)}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === "employees" && <EmployeeManagement />}

        {(activeTab as string) === "signature" && (
          <div className="max-w-5xl mx-auto pb-12">
            <SignatureManager />
          </div>
        )}

        {activeTab === "certificates" && (() => {
          const activeCertStudent = students.find((s) => s.id === selectedCertStudentId) || (students.length > 0 ? students[0] : null);
          const activeCertStudentIdx = activeCertStudent ? students.findIndex((s) => s.id === activeCertStudent.id) : -1;

          return (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Award className="h-6 w-6 text-amber-600" />
                    Certificados Oficiais • Documento Aberto
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Matriz Oficial MINEDH • Visualização de Página Completa com Certificação Digital
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-300 text-xs">
                    <button
                      type="button"
                      onClick={() => setCertViewMode('open-doc')}
                      className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        certViewMode === 'open-doc'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" /> Documento Aberto
                    </button>
                    <button
                      type="button"
                      onClick={() => setCertViewMode('list')}
                      className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        certViewMode === 'list'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LayoutList className="h-3.5 w-3.5" /> Tabela de Alunos ({students.length})
                    </button>
                  </div>
                </div>
              </div>

              {certViewMode === 'open-doc' && activeCertStudent ? (
                <div className="space-y-4">
                  {/* Barra de Navegação Rápida entre Alunos */}
                  <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                          Aluno em Exibição:
                        </p>
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                          {activeCertStudent.name}
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                            {classes.find(c => c.id === activeCertStudent.classId)?.name || activeCertStudent.entryGrade || 'Sem Turma'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={activeCertStudent.id}
                        onChange={(e) => setSelectedCertStudentId(e.target.value)}
                        className="bg-slate-800 text-xs text-white border border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-amber-500 cursor-pointer"
                      >
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({classes.find(c => c.id === s.classId)?.name || s.entryGrade || 'Turma'})
                          </option>
                        ))}
                      </select>

                      <div className="inline-flex rounded-lg bg-slate-800 border border-slate-700 p-0.5 text-xs">
                        <button
                          type="button"
                          disabled={activeCertStudentIdx <= 0}
                          onClick={() => {
                            if (activeCertStudentIdx > 0) {
                              setSelectedCertStudentId(students[activeCertStudentIdx - 1].id);
                            }
                          }}
                          className="px-2 py-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Aluno Anterior"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="px-2 py-1 text-slate-400 font-mono text-[11px] border-x border-slate-700">
                          {activeCertStudentIdx + 1} / {students.length}
                        </span>
                        <button
                          type="button"
                          disabled={activeCertStudentIdx >= students.length - 1}
                          onClick={() => {
                            if (activeCertStudentIdx < students.length - 1) {
                              setSelectedCertStudentId(students[activeCertStudentIdx + 1].id);
                            }
                          }}
                          className="px-2 py-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Próximo Aluno"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCertViewMode('list')}
                        className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
                      >
                        Ver Tabela
                      </Button>
                    </div>
                  </div>

                  {/* Documento Totalmente Aberto e Visível */}
                  <CertificateDocument
                    inline={true}
                    student={activeCertStudent}
                    schoolClass={classes.find(
                      (c) => c.id === activeCertStudent.classId,
                    )}
                    schoolName={activeSchool?.name || "Escola Secundária Central"}
                    subjects={subjects || []}
                    grades={grades || []}
                    academicYear={certYear}
                  />
                </div>
              ) : (
                <Card className="p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <h3 className="font-bold text-gray-900 text-sm">Filtros & Seleção de Estudantes para Certificação</h3>
                    {activeCertStudent && (
                      <Button
                        onClick={() => setCertViewMode('open-doc')}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 shadow-sm"
                      >
                        <Eye className="h-4 w-4" /> Voltar ao Certificado Aberto
                      </Button>
                    )}
                  </div>

                  {/* Filtros Superiores conforme imagem da solicitação */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ano Letivo / Conclusão
                      </label>
                      <select
                        value={certYear}
                        onChange={(e) => setCertYear(Number(e.target.value))}
                        className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-amber-500 focus:ring-amber-500 bg-white"
                      >
                        <option value={2026}>2026</option>
                        <option value={2025}>2025</option>
                        <option value={2024}>2024</option>
                        <option value={2023}>2023</option>
                        <option value={2022}>2022</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Classe
                      </label>
                      <select
                        value={certGradeFilter}
                        onChange={(e) => {
                          setCertGradeFilter(e.target.value);
                          setSelectedClass("");
                        }}
                        className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-amber-500 focus:ring-amber-500 bg-white"
                      >
                        <option value="all">
                          Todas as Classes de Certificado
                        </option>
                        <option value="3.ª Classe">
                          3.ª Classe (Ensino Primário 1º Ciclo)
                        </option>
                        <option value="6.ª Classe">
                          6.ª Classe (Ensino Primário 2º Ciclo)
                        </option>
                        <option value="9.ª Classe">
                          9.ª Classe (Ensino Básico / 1º Ciclo ESG)
                        </option>
                        <option value="10ª Classe">10ª Classe (ESG Geral)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Turma
                      </label>
                      <select
                        className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-amber-500 focus:ring-amber-500 bg-white"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {classes
                          .filter(
                            (c) =>
                              certGradeFilter === "all" ||
                              c.gradeLevel === certGradeFilter,
                          )
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.gradeLevel})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Campo "Nome do Aluno" com pesquisa em tempo real conforme destacado na imagem */}
                  <div className="mb-6 pt-2">
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Nome do Aluno
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={certStudentSearch}
                        onChange={(e) => setCertStudentSearch(e.target.value)}
                        placeholder="Pesquisar o nome do aluno"
                        className="block w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white"
                      />
                    </div>
                  </div>

                  {/* Lista de Alunos Filtrada para Certificado */}
                  {(() => {
                    const filtered = students.filter((s) => {
                      if (selectedClass && s.classId !== selectedClass)
                        return false;
                      if (!selectedClass && certGradeFilter !== "all") {
                        const studentClass = classes.find(
                          (c) => c.id === s.classId,
                        );
                        if (
                          studentClass?.gradeLevel !== certGradeFilter &&
                          s.entryGrade !== certGradeFilter
                        )
                          return false;
                      }
                      if (certStudentSearch.trim()) {
                        const q = certStudentSearch.toLowerCase();
                        const matchName = s.name.toLowerCase().includes(q);
                        const matchId = s.id.toLowerCase().includes(q);
                        const matchProcess = s.processCode
                          ?.toLowerCase()
                          .includes(q);
                        if (!matchName && !matchId && !matchProcess) return false;
                      }
                      return true;
                    });

                    return (
                      <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200 bg-white">
                        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <span>Aluno / Identificação</span>
                          <span>Classe & Turma</span>
                          <span className="text-right">Ação / Certificação</span>
                        </div>

                        {filtered.length > 0 ? (
                          filtered.map((student) => {
                            const studentClass = classes.find(
                              (c) => c.id === student.classId,
                            );
                            const approved = isApproved(student.id);

                            return (
                              <div
                                key={student.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-amber-50/40 transition-colors gap-3"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900">
                                      {student.name}
                                    </p>
                                    {approved ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                        Apto / Concluído
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                        Em Avaliação
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 font-mono">
                                    Nº Aluno:{" "}
                                    {student.studentNumber || student.id} |
                                    Processo:{" "}
                                    {student.processCode || `PROC-${student.id}`}
                                  </p>
                                </div>

                                <div className="text-xs text-gray-600 font-medium">
                                  {studentClass
                                    ? `${studentClass.gradeLevel} - ${studentClass.name}`
                                    : student.entryGrade || "Sem Turma"}
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="primary"
                                    onClick={() => {
                                      setSelectedCertStudentId(student.id);
                                      setCertViewMode('open-doc');
                                    }}
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 shadow-sm"
                                  >
                                    <Award className="h-4 w-4" /> Abrir Certificado Completo
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-8 text-center text-sm text-gray-500">
                            Nenhum aluno encontrado para os filtros selecionados.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </Card>
              )}
            </div>
          );
        })()}

        {activeTab === "declarations" && (() => {
          const activeDeclStudent = students.find((s) => s.id === selectedDeclStudentId) || (students.length > 0 ? students[0] : null);
          const activeDeclStudentIdx = activeDeclStudent ? students.findIndex((s) => s.id === activeDeclStudent.id) : -1;

          return (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-blue-600" />
                    Declarações com Notas • Documento Aberto
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Matriz Oficial MINEDH • Visualização de Página Completa com Classificações e Selo
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-300 text-xs">
                    <button
                      type="button"
                      onClick={() => setDeclViewMode('open-doc')}
                      className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        declViewMode === 'open-doc'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5" /> Documento Aberto
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeclViewMode('list')}
                      className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        declViewMode === 'list'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LayoutList className="h-3.5 w-3.5" /> Tabela de Alunos ({students.length})
                    </button>
                  </div>
                </div>
              </div>

              {declViewMode === 'open-doc' && activeDeclStudent ? (
                <div className="space-y-4">
                  {/* Barra de Navegação Rápida entre Alunos */}
                  <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                          Aluno em Exibição:
                        </p>
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                          {activeDeclStudent.name}
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                            {classes.find(c => c.id === activeDeclStudent.classId)?.name || activeDeclStudent.entryGrade || 'Sem Turma'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={activeDeclStudent.id}
                        onChange={(e) => setSelectedDeclStudentId(e.target.value)}
                        className="bg-slate-800 text-xs text-white border border-slate-700 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({classes.find(c => c.id === s.classId)?.name || s.entryGrade || 'Turma'})
                          </option>
                        ))}
                      </select>

                      <div className="inline-flex rounded-lg bg-slate-800 border border-slate-700 p-0.5 text-xs">
                        <button
                          type="button"
                          disabled={activeDeclStudentIdx <= 0}
                          onClick={() => {
                            if (activeDeclStudentIdx > 0) {
                              setSelectedDeclStudentId(students[activeDeclStudentIdx - 1].id);
                            }
                          }}
                          className="px-2 py-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Aluno Anterior"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="px-2 py-1 text-slate-400 font-mono text-[11px] border-x border-slate-700">
                          {activeDeclStudentIdx + 1} / {students.length}
                        </span>
                        <button
                          type="button"
                          disabled={activeDeclStudentIdx >= students.length - 1}
                          onClick={() => {
                            if (activeDeclStudentIdx < students.length - 1) {
                              setSelectedDeclStudentId(students[activeDeclStudentIdx + 1].id);
                            }
                          }}
                          className="px-2 py-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          title="Próximo Aluno"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDeclViewMode('list')}
                        className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white"
                      >
                        Ver Tabela
                      </Button>
                    </div>
                  </div>

                  {/* Documento Totalmente Aberto e Visível */}
                  <DeclarationDocument
                    inline={true}
                    student={activeDeclStudent}
                    schoolClass={classes.find(
                      (c) => c.id === activeDeclStudent.classId,
                    )}
                    schoolName={activeSchool?.name || "Escola Secundária Central"}
                    subjects={subjects || []}
                    grades={grades || []}
                    academicYear={declYear}
                  />
                </div>
              ) : (
                <Card className="p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <h3 className="font-bold text-gray-900 text-sm">Filtros & Seleção de Estudantes para Declaração</h3>
                    {activeDeclStudent && (
                      <Button
                        onClick={() => setDeclViewMode('open-doc')}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm"
                      >
                        <Eye className="h-4 w-4" /> Voltar à Declaração Aberta
                      </Button>
                    )}
                  </div>

                  {/* Filtros Superiores conforme padrão oficial */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ano Letivo
                      </label>
                      <select
                        value={declYear}
                        onChange={(e) => setDeclYear(Number(e.target.value))}
                        className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                      >
                        <option value={2026}>2026</option>
                        <option value={2025}>2025</option>
                        <option value={2024}>2024</option>
                        <option value={2023}>2023</option>
                        <option value={2022}>2022</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Classe
                      </label>
                      <select
                        value={declGradeFilter}
                        onChange={(e) => {
                          setDeclGradeFilter(e.target.value);
                          setSelectedClass("");
                        }}
                        className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                      >
                        <option value="all">Todas as Classes de Transição</option>
                        <optgroup label="1º Ciclo Primário (Azul Safira)">
                          <option value="1.ª Classe">1.ª Classe</option>
                          <option value="2.ª Classe">2.ª Classe</option>
                        </optgroup>
                        <optgroup label="2º Ciclo Primário (Verde Esmeralda)">
                          <option value="4.ª Classe">4.ª Classe</option>
                          <option value="5.ª Classe">5.ª Classe</option>
                        </optgroup>
                        <optgroup label="3º Ciclo Básico (Bordô / Vinho)">
                          <option value="7.ª Classe">7.ª Classe</option>
                          <option value="8.ª Classe">8.ª Classe</option>
                        </optgroup>
                        <optgroup label="2º Ciclo ESG (Índigo Real)">
                          <option value="10ª Classe">10ª Classe</option>
                          <option value="11.ª Classe">11.ª Classe</option>
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Turma
                      </label>
                      <select
                        className="block w-full rounded-md border-gray-300 border px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                      >
                        <option value="">Selecione uma turma...</option>
                        {classes
                          .filter(
                            (c) =>
                              declGradeFilter === "all" ||
                              c.gradeLevel === declGradeFilter,
                          )
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.gradeLevel})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {/* Campo "Nome do Aluno" com pesquisa em tempo real */}
                  <div className="mb-6 pt-2">
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Nome do Aluno
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Search className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={declStudentSearch}
                        onChange={(e) => setDeclStudentSearch(e.target.value)}
                        placeholder="Pesquisar o nome do aluno"
                        className="block w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                      />
                    </div>
                  </div>

                  {/* Lista de Alunos para Declaração */}
                  {(() => {
                    const filtered = students.filter((s) => {
                      if (selectedClass && s.classId !== selectedClass)
                        return false;
                      if (!selectedClass && declGradeFilter !== "all") {
                        const studentClass = classes.find(
                          (c) => c.id === s.classId,
                        );
                        if (
                          studentClass?.gradeLevel !== declGradeFilter &&
                          s.entryGrade !== declGradeFilter
                        )
                          return false;
                      }
                      if (declStudentSearch.trim()) {
                        const q = declStudentSearch.toLowerCase();
                        const matchName = s.name.toLowerCase().includes(q);
                        const matchId = s.id.toLowerCase().includes(q);
                        const matchProcess = s.processCode
                          ?.toLowerCase()
                          .includes(q);
                        if (!matchName && !matchId && !matchProcess) return false;
                      }
                      return true;
                    });

                    return (
                      <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200 bg-white">
                        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          <span>Aluno / Processo</span>
                          <span>Classe & Turma</span>
                          <span className="text-right">Ação / Declaração</span>
                        </div>

                        {filtered.length > 0 ? (
                          filtered.map((student) => {
                            const studentClass = classes.find(
                              (c) => c.id === student.classId,
                            );
                            const approved = isApproved(student.id);

                            return (
                              <div
                                key={student.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-blue-50/40 transition-colors gap-3"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-gray-900">
                                      {student.name}
                                    </p>
                                    {approved ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                        Transitou
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                        Não Transitou
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 font-mono">
                                    Nº Processo:{" "}
                                    {student.processCode || student.id}
                                  </p>
                                </div>

                                <div className="text-xs text-gray-600 font-medium">
                                  {studentClass
                                    ? `${studentClass.gradeLevel} - ${studentClass.name}`
                                    : student.entryGrade || "Sem Turma"}
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="primary"
                                    onClick={() => {
                                      setSelectedDeclStudentId(student.id);
                                      setDeclViewMode('open-doc');
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-sm"
                                  >
                                    <FileText className="h-4 w-4" /> Abrir Declaração Completa
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-8 text-center text-sm text-gray-500">
                            Nenhum aluno registado com os critérios selecionados.
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </Card>
              )}
            </div>
          );
        })()}
        {activeTab === "pautas_exames" && (
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 font-serif flex items-center gap-2">
                    <Award className="text-blue-600" size={24} />
                    Gestão Integrada de Exames e Distribuição de Turmas
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Geração de pautas de exame, digitação de notas e distribuição inteligente de turmas por idade e mérito regimental.
                  </p>
                </div>

                {/* Sub-tab Selectors */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    onClick={() => setPautasExamesTab('pautas')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      pautasExamesTab === 'pautas' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calculator size={14} className="inline mr-1" />
                    Pautas de Exame
                  </button>
                  <button
                    onClick={() => setPautasExamesTab('turmas')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      pautasExamesTab === 'turmas' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sliders size={14} className="inline mr-1" />
                    Formação de Turmas
                  </button>
                </div>
              </div>

              {pautasExamesTab === 'pautas' ? (
                <div className="space-y-6">
                  {/* Pauta Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Selecione a Turma de Exame:</label>
                      <select
                        value={selectedExamClassId}
                        onChange={e => setSelectedExamClassId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione uma turma de exame</option>
                        {classes
                          .filter(c => isGradeExamInCalendar(c.gradeLevel) && c.schoolId === activeSchool?.id)
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.gradeLevel} - {c.name} ({c.period || 'Diurno'})</option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Disciplina do Exame:</label>
                      <select
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {subjects.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        onClick={() => {
                          let count = 0;
                          Object.entries(examGradesInput).forEach(([stId, value]) => {
                            if (value !== '') {
                              const val = parseFloat(value);
                              if (!isNaN(val) && val >= 0 && val <= 20) {
                                count++;
                                const rosters = buildOfficialPautaRoster(students, classes, grades, subjects.map(sb => sb.id)).roster;
                                const rRecord = rosters.find(r => r.student.id === stId);
                                const mediaFrequencia = rRecord?.mfOverall || 10;
                                const classificacaoFinal = Math.round(0.6 * mediaFrequencia + 0.4 * val);
                                addExamGrade({
                                  studentId: stId,
                                  classId: selectedExamClassId,
                                  subjectId: subjects[0]?.id || 'sub1',
                                  teacherId: 'prof-1',
                                  mediaFrequencia,
                                  notaExame: val,
                                  classificacaoFinal,
                                  resultado: classificacaoFinal >= 9.5 ? 'Aprovado' : 'Reprovado'
                                });
                              }
                            }
                          });
                          alert(`${count} notas de exame salvas e processadas na pauta com sucesso!`);
                        }}
                        disabled={!selectedExamClassId}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md cursor-pointer"
                      >
                        Gravar Notas de Exame digitadas
                      </Button>
                    </div>
                  </div>

                  {selectedExamClassId ? (() => {
                    const selectedClassObj = classes.find(c => c.id === selectedExamClassId);
                    const { roster } = buildOfficialPautaRoster(students, classes, grades, subjects.map(s => s.id));
                    
                    const admittedStudents = roster.filter(
                      r => r.classObj?.id === selectedExamClassId && r.finalStatus === 'ADMITIDO'
                    );

                    if (admittedStudents.length === 0) {
                      return (
                        <div className="p-8 text-center text-xs text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                          Nenhum estudante foi admitido ao exame nesta turma ou todas as frequências ainda estão pendentes.
                          <p className="mt-1 text-[11px] text-amber-600">Lembre-se: os alunos devem obter uma média de frequência maior ou igual a 9.5 para serem admitidos.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-600">
                            Exibindo <span className="text-blue-900 font-extrabold">{admittedStudents.length}</span> alunos ADMITIDOS para o exame final de <span className="font-bold text-slate-800">{selectedClassObj?.gradeLevel}</span>:
                          </p>
                          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 rounded px-2.5 py-0.5">
                            Regra de Exames MINEDH Aplicada
                          </span>
                        </div>

                        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-900 text-white font-extrabold">
                                <th className="p-3 text-center w-16">Nº Paut</th>
                                <th className="p-3">Estudante (Ordem Alfabética)</th>
                                <th className="p-3">Nº Processo</th>
                                <th className="p-3 text-center">Média Freq. (60%)</th>
                                <th className="p-3 text-center w-36">Nota de Exame (40%)</th>
                                <th className="p-3 text-center">Classific. Final</th>
                                <th className="p-3 text-center">Resultado</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                              {admittedStudents
                                .sort((a, b) => a.student.name.localeCompare(b.student.name, 'pt-PT'))
                                .map((st, idx) => {
                                  const savedExam = examGrades.find(eg => eg.studentId === st.student.id && eg.classId === selectedExamClassId);
                                  const tempValue = examGradesInput[st.student.id] ?? (savedExam ? String(savedExam.notaExame) : '');
                                  const currentNE = parseFloat(tempValue);
                                  const mediaFreq = st.mfOverall || 10;
                                  const currentCF = !isNaN(currentNE) ? Math.round(0.6 * mediaFreq + 0.4 * currentNE) : (savedExam ? savedExam.classificacaoFinal : null);
                                  const currentResult = currentCF !== null ? (currentCF >= 9.5 ? 'APROVADO' : 'REPROVADO') : (savedExam ? (savedExam.resultado === 'Aprovado' ? 'APROVADO' : 'REPROVADO') : '---');

                                  return (
                                    <tr key={st.student.id} className="hover:bg-slate-50/80 transition-colors">
                                      <td className="p-3 text-center font-mono font-bold text-blue-900 bg-slate-50/50">{idx + 1}</td>
                                      <td className="p-3">
                                        <p className="font-extrabold text-slate-900">{st.student.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">{st.student.iue || 'Sem IUE'}</p>
                                      </td>
                                      <td className="p-3 font-mono text-slate-600">{st.student.processCode || '---'}</td>
                                      <td className="p-3 text-center font-mono font-extrabold text-slate-800">{mediaFreq}</td>
                                      <td className="p-3 text-center">
                                        <input
                                          type="number"
                                          min={0}
                                          max={20}
                                          step={0.5}
                                          placeholder="Ex: 14.5"
                                          value={tempValue}
                                          onChange={e => setExamGradesInput({ ...examGradesInput, [st.student.id]: e.target.value })}
                                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                      </td>
                                      <td className="p-3 text-center font-mono font-black text-slate-950">
                                        {currentCF !== null ? currentCF : '---'}
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                          currentResult === 'APROVADO' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                          currentResult === 'REPROVADO' ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                          {currentResult}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="p-12 text-center text-xs text-slate-500 border border-slate-200 bg-slate-50 rounded-2xl">
                      Por favor, selecione uma das turmas de exame autorizadas no calendário para visualizar os candidatos admitidos.
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Reorganization Section */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                      <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Sliders size={15} /> Parâmetros de Formação de Novas Turmas
                      </h4>
                      <span className="text-[10px] bg-blue-100 text-blue-800 rounded px-2.5 py-0.5 font-black uppercase">Algoritmo de Idades e Mérito</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nível de Ensino (Classe):</label>
                        <select
                          value={selectedGradeForReorg}
                          onChange={e => setSelectedGradeForReorg(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {['3ª Classe', '6ª Classe', '8ª Classe', '9ª Classe', '10ª Classe', '11ª Classe', '12ª Classe']
                            .map(grade => {
                              const hasExam = isGradeExamInCalendar(grade);
                              return (
                                <option key={grade} value={grade}>
                                  {grade} {hasExam ? '★ (Exame Definido no Calendário)' : '(Sem Exame)'}
                                </option>
                              );
                            })
                          }
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Máximo de Alunos por Turma:</label>
                        <input
                          type="number"
                          min={2}
                          max={50}
                          value={maxStudentsPerClass}
                          onChange={e => setMaxStudentsPerClass(parseInt(e.target.value, 10) || 6)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-[9px] text-slate-400 mt-1">Ex: 6 para testes rápidos, 30 ou 45 para turmas regulamentares.</p>
                      </div>

                      <div className="flex items-end">
                        <Button
                          onClick={() => {
                            reorganizeClasses(activeSchool?.id || 's1', selectedGradeForReorg, maxStudentsPerClass);
                            setReorgSuccessMsg(`Turmas da ${selectedGradeForReorg} formadas com sucesso baseando-se em idade (mais novos primeiro) e ordem alfabética.`);
                            setTimeout(() => setReorgSuccessMsg(null), 6000);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw size={14} /> Executar Ordenação e Formação
                        </Button>
                      </div>
                    </div>

                    {reorgSuccessMsg && (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-[11px] font-bold flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>{reorgSuccessMsg}</span>
                      </div>
                    )}
                  </div>

                  {/* Formed Classes Preview list */}
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Users size={16} className="text-blue-600" />
                      Visualização de Turmas Formadas na {selectedGradeForReorg}
                    </h4>

                    {(() => {
                      const gradeClasses = classes.filter(
                        c => c.gradeLevel === selectedGradeForReorg && c.schoolId === activeSchool?.id
                      );

                      if (gradeClasses.length === 0) {
                        return (
                          <div className="p-12 text-center text-xs text-slate-500 border border-slate-200 bg-slate-50 rounded-2xl">
                            Nenhuma turma ativa ou formada para a {selectedGradeForReorg}. Clique no botão acima para formar as turmas automaticamente!
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {gradeClasses
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(cls => {
                              const classStudents = students.filter(s => s.classId === cls.id);
                              
                              const birthYears = classStudents.map(s => {
                                const y = parseInt(s.birthDate?.substring(0, 4) || '2010', 10);
                                return isNaN(y) ? 2010 : y;
                              });
                              const avgBirthYear = birthYears.length > 0 ? Math.round(birthYears.reduce((a, b) => a + b, 0) / birthYears.length) : '---';

                              return (
                                <Card key={cls.id} className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4 shadow-xs">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 bg-slate-50/50 -m-5 p-5 rounded-t-2xl">
                                    <div>
                                      <h5 className="font-black text-slate-900 text-sm">{cls.name}</h5>
                                      <p className="text-[10px] text-slate-500">Média Ano de Nasc.: <strong className="font-mono text-blue-900">{avgBirthYear}</strong></p>
                                      {classStudents.length > 0 && (() => {
                                        const firstLetters = Array.from(new Set(classStudents.map(s => s.name.trim().charAt(0).toUpperCase())))
                                          .sort((a, b) => a.localeCompare(b, 'pt-PT'));
                                        const lettersRangeStr = firstLetters.length > 0 
                                          ? (firstLetters.length === 1 ? firstLetters[0] : `${firstLetters[0]} - ${firstLetters[firstLetters.length - 1]}`)
                                          : 'Vazio';
                                        return (
                                          <p className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/40 rounded px-1.5 py-0.5 mt-1 inline-block">
                                            Letras: <span className="font-mono font-black">{firstLetters.join(', ')} ({lettersRangeStr})</span>
                                          </p>
                                        );
                                      })()}
                                    </div>
                                    <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                                      {classStudents.length} Alunos
                                    </span>
                                  </div>

                                  <div className="divide-y divide-slate-100 text-xs">
                                    {classStudents.length > 0 ? (
                                      classStudents
                                        .sort((a, b) => a.name.localeCompare(b.name, 'pt-PT'))
                                        .map((st, sIdx) => {
                                          const bYear = st.birthDate?.substring(0, 4) || '2010';
                                          const isRep = st.entryType === 'repetente';
                                          return (
                                            <div key={st.id} className="py-2.5 flex items-center justify-between gap-3">
                                              <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono text-slate-400 w-4">{sIdx + 1}</span>
                                                <div>
                                                  <p className="font-bold text-slate-900">{st.name}</p>
                                                  <p className="text-[9px] text-slate-400 font-mono">Nasc.: {st.birthDate} ({bYear})</p>
                                                </div>
                                              </div>
                                              
                                              {isRep ? (
                                                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                                                  Repetente
                                                </span>
                                              ) : (
                                                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                                                  Mais Novo
                                                </span>
                                              )}
                                            </div>
                                          );
                                        })
                                    ) : (
                                      <div className="p-4 text-center text-[10px] text-slate-400">
                                        Nenhum aluno alocado a esta turma.
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              );
                            })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "reports" && (
          <div className="w-full animate-in fade-in">
            <ErrorBoundary fallbackTitle="Erro ao Carregar Relatório da Secretaria">
              <CollaboratorReportDispatcher />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </CollapsibleSidebar>
  );
}
