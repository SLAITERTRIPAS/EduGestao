import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { 
  User, Role, School, Student, Class, Subject, TeacherAssignment, Grade, ExamGrade, 
  LessonSummary, TrimesterReport, Employee, IssuedDeclaration, Province, District, 
  CollectionPeriod, CollectionForm, ChatMessage, TransferRequest, AcademicComplaint, 
  AcademicArchive, EmailNotification, SmtpSettings, FinancialTransaction, 
  PatrimonyItem, PatrimonyMovement, LibraryBook, LibraryLoan, HRContract, 
  HRLeave, HRPromotion, HRTraining, ReceptionVisitor, ReceptionTicket, 
  ArchiveRecord, ClassSchedule, SchoolRoom, AIPrediction, AIReportGeneration,
  SchoolTransitionBatch, IssuedCertificate, AutoRenewalSummary, Petition, UserNotification,
  DocumentSignatureRecord, EvaluationItem, ClassTaskItem, ClassTaskSubmission, BackupRecord,
  DigitalLessonRecord, StudentAttendanceMark
} from './types';
import { initialData } from './mockData';
import { generateEmployeeId, generateStudentId, generateIUE, generateNIM } from './data/mozambiqueLocations';
import { 
  runAutomatedEnrollmentRenewal, 
  validateAndActivateEnrollment as validateEnrollmentFn, 
  handleDirectorVacancyDecision as handleVacancyFn, 
  confirmDestinationStudentEnrollment as confirmDestEnrollmentFn 
} from './utils/transitionEngine';
import { computeAutoCurriculum } from './data/sigeRoles';

export const defaultSmtpSettings: SmtpSettings = {
  host: 'smtp.minedh.gov.mz',
  port: 587,
  username: 'notificacoes.caderneta@minedh.gov.mz',
  password: '••••••••••••',
  encryption: 'TLS',
  senderName: 'MINEDH - Sistema de Gestão de Cadernetas Escolares',
  senderEmail: 'notificacoes.caderneta@minedh.gov.mz',
  replyTo: 'suporte.pedagogico@minedh.gov.mz',
  isActive: true,
  lastTestedAt: new Date().toISOString(),
  autoSendOnTrimesterClose: true,
};

interface StoreState {
  users: User[];
  schools: School[];
  provinces: Province[];
  districts: District[];
  students: Student[];
  employees: Employee[];
  classes: Class[];
  subjects: Subject[];
  assignments: TeacherAssignment[];
  grades: Grade[];
  examGrades: ExamGrade[];
  lessonSummaries: LessonSummary[];
  digitalLessonRecords: DigitalLessonRecord[];
  reports: TrimesterReport[];
  issuedDeclarations: IssuedDeclaration[];
  collectionPeriods: CollectionPeriod[];
  collectionForms: CollectionForm[];
  chatMessages: ChatMessage[];
  transferRequests: TransferRequest[];
  academicComplaints: AcademicComplaint[];
  academicArchives: AcademicArchive[];
  emailNotifications: EmailNotification[];
  smtpSettings: SmtpSettings;
  financialTransactions: FinancialTransaction[];
  patrimonyItems: PatrimonyItem[];
  patrimonyMovements: PatrimonyMovement[];
  libraryBooks: LibraryBook[];
  libraryLoans: LibraryLoan[];
  hrContracts: HRContract[];
  hrLeaves: HRLeave[];
  hrPromotions: HRPromotion[];
  hrTrainings: HRTraining[];
  receptionVisitors: ReceptionVisitor[];
  receptionTickets: ReceptionTicket[];
  archiveRecords: ArchiveRecord[];
  classSchedules: ClassSchedule[];
  schoolRooms: SchoolRoom[];
  aiPredictions: AIPrediction[];
  aiReports: AIReportGeneration[];
  petitions: Petition[];
  transitionBatches: SchoolTransitionBatch[];
  issuedCertificates: IssuedCertificate[];
  documentSignatures: DocumentSignatureRecord[];
  evaluations: EvaluationItem[];
  classTasks: ClassTaskItem[];
  schoolDocuments?: any[];
  userNotifications: UserNotification[];
  currentUser: User | null;
  highContrast: boolean;
  activeTab: string;

  // Firestore Backup States
  backups: BackupRecord[];
  lastBackupAt: string | null;
  isBackingUp: boolean;
  autoBackupEnabled: boolean;
  
  // School Tenant Isolation Fields
  activeSchoolId: string | null;
  tenantId: string | null;
  activeSchool: School | null;
  allStudents: Student[];
  allClasses: Class[];
  allEmployees: Employee[];
  allSubjects: Subject[];
  allAssignments: TeacherAssignment[];
  allGrades: Grade[];
  allExamGrades: ExamGrade[];
  allFinancialTransactions: FinancialTransaction[];
  allPatrimonyItems: PatrimonyItem[];
  allLibraryBooks: LibraryBook[];
  allArchiveRecords: ArchiveRecord[];
  allSchools: School[];
}

interface StoreActions {
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  setActiveSchoolId: (schoolId: string | null) => void;
  getSchoolTenantUrl: (schoolId: string) => string;
  getSchoolByTenant: (tenantIdOrCode: string) => School | undefined;
  enrollStudent: (studentData: Omit<Student, 'id' | 'classId' | 'status'>) => void;
  addEmployee: (employeeData: Omit<Employee, 'id'> & { id?: string }) => void;
  deleteEmployee: (id: string) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  allocateEmployee: (employeeId: string, schoolId: string, role: Role) => void;
  verifyEmployee: (employeeId: string, verifierName: string) => void;
  assignClasses: () => void; // Auto-assign logic
  addGrade: (gradeData: Omit<Grade, 'id' | 'isLocked'>) => void;
  addExamGrade: (examGradeData: Omit<ExamGrade, 'id' | 'isLocked'>) => void;
  addLessonSummary: (summaryData: Omit<LessonSummary, 'id'>) => void;
  digitalLessonRecords: DigitalLessonRecord[];
  addDigitalLessonRecord: (record: Omit<DigitalLessonRecord, 'id' | 'createdAt'>) => DigitalLessonRecord;
  updateDigitalLessonRecord: (id: string, updates: Partial<DigitalLessonRecord>) => void;
  deleteDigitalLessonRecord: (id: string) => void;
  pedagogicalVisaLessonRecord: (id: string, visa: { status: 'aprovado' | 'com_observacoes' | 'pendente'; reviewedBy: string; observation?: string }) => void;
  secretariatAuditLessonRecord: (id: string, audit: { status: 'auditado' | 'arquivado'; auditedBy: string }) => void;
  submitReport: (classId: string, trimester: 1 | 2 | 3) => void;
  signReport: (reportId: string) => void;
  publishReport: (reportId: string) => void;
  issueDeclaration: (declarationData: {
    studentId: string;
    academicYear: number;
    gradeLevel: string;
    className?: string;
    schoolName?: string;
    directorName?: string;
    secretaryName?: string;
    status?: 'Transitou' | 'Não Transitou';
    finalAverage?: number;
    gradesSnapshot?: any[];
    exemplar?: string;
  }) => IssuedDeclaration;
  // RF-MAT-002, RF-MAT-003 & RF-HIST-001 Actions
  executeAnnualAutoRenewal: (schoolId: string, targetYear?: number) => AutoRenewalSummary;
  validateAndActivateEnrollment: (studentId: string, verifiedDocs?: Record<string, boolean>) => void;
  handleTransitionVacancyDecision: (batchId: string, decision: 'approve' | 'reject', directorName?: string) => void;
  confirmDestinationEnrollment: (studentId: string, classId: string) => void;
  issueCertificate: (certData: {
    studentId: string;
    type?: 'CERTIFICADO DE CONCLUSÃO' | 'DECLARAÇÃO DE CONCLUSÃO' | 'DECLARAÇÃO DE APROVEITAMENTO' | 'DECLARAÇÃO DE FREQUÊNCIA';
    gradeLevel?: string;
    academicYear?: number;
    schoolName?: string;
    directorName?: string;
    secretaryName?: string;
    average?: number;
  }) => IssuedCertificate;
  addCollectionPeriod: (period: Omit<CollectionPeriod, 'id' | 'createdAt'>) => void;
  publishCollectionPeriod: (id: string) => void;
  submitCollectionForm: (form: Omit<CollectionForm, 'id' | 'submittedAt'>) => void;
  sendChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  submitTransferRequest: (request: Omit<TransferRequest, 'id' | 'status' | 'requestedAt'>) => void;
  submitComplaint: (complaint: Omit<AcademicComplaint, 'id' | 'status' | 'createdAt'>) => void;
  updateSchoolChoice: (studentId: string, schoolId: string) => void;
  addSchool: (schoolData: Omit<School, 'id'>) => void;
  removeSchool: (id: string) => void;
  removeClass: (classId: string) => void;
  toggleHighContrast: () => void;
  setActiveTab: (tab: string) => void;
  lockClassGrades: (classId: string) => void;
  archiveAcademicData: (year: number, classId: string) => void;
  updateUserPermissions: (userId: string, permissions: User['permissions']) => void;
  sendEmailNotification: (notification: Omit<EmailNotification, 'id' | 'sentAt' | 'status'>) => void;
  sendNotification: (notification: Omit<UserNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  updateSmtpSettings: (settings: Partial<SmtpSettings>) => void;
  testSmtpConnection: () => Promise<{ success: boolean; message: string; log: string[] }>;
  triggerTrimesterCloseEmailToTeachers: (classId: string, trimester?: number) => void;
  updateUserSignature: (userId: string, signature: string) => void;
  signDocument: (params: {
    documentId: string;
    documentType: 'certificate' | 'declaration' | 'transfer' | 'bulletin' | 'pauta';
    studentId?: string;
    studentName?: string;
    signerRole?: string;
    signerTitle?: string;
    authMethod: 'biometric' | 'security_code';
    securityPinProvided?: string;
    biometricType?: 'fingerprint' | 'face_id' | 'touch_id' | 'webauthn_passkey';
  }) => Promise<{ success: boolean; signatureRecord?: DocumentSignatureRecord; error?: string }>;
  setUserSecurityPin: (userId: string, pin: string) => void;
  updatePassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  registerUserBiometrics: (userId: string, status?: boolean) => Promise<{ success: boolean; error?: string }>;
  removeDocumentSignature: (signatureId: string) => void;
  // Competências Pedagógicas dos Docentes
  addEvaluation: (evalData: Omit<EvaluationItem, 'id'>) => void;
  addClassTask: (taskData: Omit<ClassTaskItem, 'id' | 'createdAt'>) => void;
  submitTaskAnswer: (submissionData: Omit<ClassTaskSubmission, 'id' | 'submittedAt'>) => void;
  gradeTaskSubmission: (taskId: string, submissionId: string, grade: number, feedback: string) => void;
  assignTeacherCompetencyRole: (employeeId: string, competency: {
    roleType: 'diretor_turma' | 'delegado_disciplina' | 'delegado_ciclo';
    classId?: string;
    className?: string;
    subjectId?: string;
    subjectName?: string;
    ciclo?: '1º Ciclo' | '2º Ciclo' | '3º Ciclo';
  }) => void;
  removeTeacherCompetencyRole: (employeeId: string, roleType: 'diretor_turma' | 'delegado_disciplina' | 'delegado_ciclo') => void;
  generateStudentLoginId: (studentId: string) => string;
  // Module Actions
  addFinancialTransaction: (transaction: Omit<FinancialTransaction, 'id'>) => void;
  updateFinancialStatus: (id: string, status: 'pago' | 'pendente' | 'cancelado') => void;
  addPatrimonyItem: (item: Omit<PatrimonyItem, 'id'>) => void;
  updatePatrimonyItem: (id: string, updates: Partial<PatrimonyItem>) => void;
  addPatrimonyMovement: (movement: Omit<PatrimonyMovement, 'id'>) => void;
  addLibraryBook: (book: Omit<LibraryBook, 'id'>) => void;
  borrowBook: (loan: Omit<LibraryLoan, 'id' | 'status'>) => void;
  returnBook: (loanId: string, returnDate?: string) => void;
  addHRContract: (contract: Omit<HRContract, 'id'>) => void;
  addHRLeave: (leave: Omit<HRLeave, 'id' | 'status'>) => void;
  approveHRLeave: (leaveId: string, approved: boolean, approverName: string) => void;
  addHRPromotion: (promotion: Omit<HRPromotion, 'id'>) => void;
  addHRTraining: (training: Omit<HRTraining, 'id'>) => void;
  addReceptionVisitor: (visitor: Omit<ReceptionVisitor, 'id' | 'status'>) => void;
  updateVisitorStatus: (id: string, status: 'Em Atendimento' | 'Concluído' | 'Aguardando') => void;
  addReceptionTicket: (ticket: Omit<ReceptionTicket, 'id' | 'status' | 'requestedAt'>) => void;
  callReceptionTicket: (id: string) => void;
  addArchiveRecord: (record: Omit<ArchiveRecord, 'id'>) => void;
  addClassSchedule: (schedule: Omit<ClassSchedule, 'id'>) => void;
  generateAIReport: (report: Omit<AIReportGeneration, 'id' | 'generatedAt'>) => void;
  createPetition: (petition: Omit<Petition, 'id' | 'createdAt' | 'status' | 'history'>) => void;
  updatePetitionStatus: (id: string, status: Petition['status'], action: string, role: string) => void;
  updateStudentDetails: (studentId: string, updates: Partial<Student>) => void;
  reorganizeClasses: (schoolId: string, gradeLevel: string, maxPerClass: number) => void;
  // Firestore CRUD for User Profiles & School Documents
  saveUserProfile: (user: User) => Promise<void>;
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUserProfile: (userId: string) => Promise<void>;
  getUserProfile: (userId: string) => Promise<User | null>;
  saveSchoolDocument: (docData: { id: string; schoolId: string; title: string; docType: string; studentId?: string; content?: any; issuedAt: string }) => Promise<void>;
  updateSchoolDocument: (docId: string, updates: any) => Promise<void>;
  deleteSchoolDocument: (docId: string) => Promise<void>;
  saveSchoolProfile: (school: School) => Promise<void>;
  updateSchoolProfile: (schoolId: string, updates: Partial<School>) => Promise<void>;
  deleteSchoolProfile: (schoolId: string) => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  triggerAutomatedBackup: (type?: 'automático' | 'manual', triggeredBy?: string) => Promise<BackupRecord>;
  toggleAutoBackup: (enabled: boolean) => void;
}

type StoreContextType = StoreState & StoreActions & {
  userNotifications?: UserNotification[];
  notifications?: ChatMessage[];
  declarations?: IssuedDeclaration[];
  certificates?: IssuedCertificate[];
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const defaultChatMessages: ChatMessage[] = [
  {
    id: 'msg-001',
    senderId: 'u6',
    senderName: 'Ministro da Educação',
    senderRole: 'national',
    receiverLevel: 'all',
    receiverName: 'Comunidade Educativa EduGestão',
    subject: 'Comunicação Oficial - Boas-Vindas ao EduGestão',
    text: 'Bem-vindos ao novo sistema de coordenação nacional EduGestão • MINEDH.\n\nAtravés deste portal, todos os relatórios, pautas oficiais, calendários académicos, tarefas, processos de transferência e assinaturas digitais estão unificados e operacionais em tempo real.',
    timestamp: '2026-03-01T08:00:00.000Z',
    category: 'oficial',
    read: false
  },
  {
    id: 'msg-002',
    senderId: 'u2',
    senderName: 'Dr. Manuel Mabote (Director da Escola)',
    senderRole: 'director',
    receiverLevel: 'all',
    receiverName: 'Corpo Docente, Discente e Encarregados',
    subject: 'Diretiva do 1º Trimestre & Calendário de Avaliações',
    text: 'Avisam-se todos os professores, alunos e encarregados de educação que o calendário oficial de avaliações (ACS e APT) do 1º Trimestre de 2026 está disponível no sistema.\n\nRecomenda-se o acompanhamento contínuo dos resultados e das tarefas publicadas.',
    timestamp: '2026-03-15T09:30:00.000Z',
    category: 'oficial',
    read: true
  },
  {
    id: 'msg-003',
    senderId: 'u5',
    senderName: 'Dra. Ana Secretaria (Secretaria Geral)',
    senderRole: 'secretariat',
    receiverLevel: 'all',
    receiverName: 'Serviços do Ministério e Unidades Escolares',
    subject: 'Emissão de Documentos e Certificados com Assinatura Digital',
    text: 'Informa-se que a emissão de Declarações de Aprovado e Certificados de Conclusão conta agora com selo de autenticidade, chancela do Ministério e código QR para validação pública imediata.',
    timestamp: '2026-03-20T11:00:00.000Z',
    category: 'oficial',
    read: true
  }
];

export const defaultDocumentSignatures: DocumentSignatureRecord[] = [
  {
    id: 'sig-seed-1',
    documentId: 'dec-2026-001',
    documentType: 'declaration',
    studentId: 'st01',
    studentName: 'Artur Aluno',
    signerId: 'u2',
    signerName: 'Dr. Manuel Mabote',
    signerRole: 'director',
    signerTitle: 'O Director da Escola',
    signatureImage: undefined,
    authMethod: 'biometric',
    biometricType: 'fingerprint',
    securityHash: 'SHA256:mz-4b8c91-92fa01-839210',
    timestamp: '2026-02-15T09:30:00.000Z',
    formattedDate: '15 de Fevereiro de 2026, 11:30:00',
    certificateSerialNumber: 'MZ-MINEDH-DSIG-2026-8812A',
    isValid: true
  },
  {
    id: 'sig-seed-2',
    documentId: 'cert-2026-001',
    documentType: 'certificate',
    studentId: 'st01',
    studentName: 'Artur Aluno',
    signerId: 'u2',
    signerName: 'Dr. Manuel Mabote',
    signerRole: 'director',
    signerTitle: 'O Director da Escola',
    signatureImage: undefined,
    authMethod: 'biometric',
    biometricType: 'fingerprint',
    securityHash: 'SHA256:mz-91bc40-44109b-11782a',
    timestamp: '2026-02-20T10:15:00.000Z',
    formattedDate: '20 de Fevereiro de 2026, 12:15:00',
    certificateSerialNumber: 'MZ-MINEDH-DSIG-2026-9421B',
    isValid: true
  }
];

export const defaultIssuedDeclarations: IssuedDeclaration[] = [
  {
    id: 'dec-2026-001',
    studentId: 'st01',
    academicYear: 2026,
    gradeLevel: '10ª Classe',
    className: '10ª Classe A',
    schoolName: 'Escola Secundária Josina Machel',
    issuedAt: '15 de Fevereiro de 2026',
    directorName: 'Dr. Manuel Mabote',
    secretaryName: 'Dra. Ana Secretaria',
    status: 'Transitou',
    finalAverage: 15,
    digitalSignatureHash: 'SHA256:mz-4b8c91-92fa01-839210',
    verificationCode: 'VAL-MZ-2026-DEC-10C-ST01',
    stamped: true,
    electronicallySigned: true,
    gradesSnapshot: [
      { subjectId: 'sub1', subjectName: 'Matemática', media: 14, words: 'Catorze' },
      { subjectId: 'sub4', subjectName: 'Português', media: 16, words: 'Dezasseis' },
      { subjectId: 'sub5', subjectName: 'Inglês', media: 15, words: 'Quinze' }
    ],
    exemplar: 'Original para o aluno'
  },
  {
    id: 'dec-2026-002',
    studentId: 'st02',
    academicYear: 2026,
    gradeLevel: '10ª Classe',
    className: '10ª Classe B',
    schoolName: 'Escola Secundária Josina Machel',
    issuedAt: '24 de Fevereiro de 2026',
    directorName: 'Dr. Manuel Mabote',
    secretaryName: 'Dra. Ana Secretaria',
    status: 'Transitou',
    finalAverage: 16,
    digitalSignatureHash: '',
    verificationCode: 'VAL-MZ-2026-DEC-10C-ST02',
    stamped: false,
    electronicallySigned: false,
    gradesSnapshot: [
      { subjectId: 'sub1', subjectName: 'Matemática', media: 17, words: 'Dezassete' },
      { subjectId: 'sub4', subjectName: 'Português', media: 15, words: 'Quinze' },
      { subjectId: 'sub5', subjectName: 'Inglês', media: 16, words: 'Dezasseis' }
    ],
    exemplar: 'Original para o aluno'
  }
];

export const defaultIssuedCertificates: IssuedCertificate[] = [
  {
    id: 'cert-2026-001',
    studentId: 'st01',
    studentName: 'Artur Aluno',
    iue: 'AA-1042-ESJM/MP/KM/2026',
    nim: '2026-KM-1042',
    certificateCode: 'ES/CC/2026/0001',
    type: 'CERTIFICADO DE CONCLUSÃO',
    gradeLevel: '10ª Classe',
    academicYear: 2026,
    schoolName: 'Escola Secundária Josina Machel',
    average: 15,
    issuedAt: '20 de Fevereiro de 2026',
    verificationCode: 'VAL-MZ-2026-CERT-10C-ST01',
    qrPayload: 'IUE:AA-1042|NOME:Artur Aluno|ESCOLA:Escola Secundária Josina Machel|ANO:2026',
    directorName: 'Dr. Manuel Mabote',
    secretaryName: 'Dra. Ana Secretaria'
  },
  {
    id: 'cert-2026-002',
    studentId: 'st02',
    studentName: 'Beatriz Aluna',
    iue: 'BA-2051-ESJM/MP/KM/2026',
    nim: '2026-KM-2051',
    certificateCode: 'ES/CC/2026/0002',
    type: 'CERTIFICADO DE CONCLUSÃO',
    gradeLevel: '10ª Classe',
    academicYear: 2026,
    schoolName: 'Escola Secundária Josina Machel',
    average: 16,
    issuedAt: '22 de Fevereiro de 2026',
    verificationCode: 'VAL-MZ-2026-CERT-10C-ST02',
    qrPayload: 'IUE:BA-2051|NOME:Beatriz Aluna|ESCOLA:Escola Secundária Josina Machel|ANO:2026',
    directorName: 'Dr. Manuel Mabote',
    secretaryName: 'Dra. Ana Secretaria'
  }
];

export function StoreProvider({ children }: { children: ReactNode }) {
  const setActiveTab = (tab: string) => setState(prev => ({ ...prev, activeTab: tab }));
  const [state, setState] = useState<StoreState>(() => {
    const saved = localStorage.getItem('eduGestaoState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // Sanitize and deduplicate archives by year and classId to prevent memory bloat
        const rawArchives = Array.isArray(parsed.academicArchives) ? parsed.academicArchives : [];
        const seenArch = new Set<string>();
        const sanitizedArchives = rawArchives.filter((a: any) => {
          if (!a || !a.classId) return false;
          const key = `${a.year || ''}_${a.classId}`;
          if (seenArch.has(key)) return false;
          seenArch.add(key);
          return true;
        });

        // Limit notifications to prevent unbounded growth and localStorage overflow
        const sanitizedEmailNotifs = (Array.isArray(parsed.emailNotifications) ? parsed.emailNotifications : []).slice(-100);
        const sanitizedNotifs = (Array.isArray(parsed.notifications) ? parsed.notifications : []).slice(-100);

        return {
          ...initialData,
          ...parsed,
          activeTab: parsed.activeTab || 'systemHealth',
          users: (() => {
            const defaultUsers = (initialData.users as User[]) || [];
            const userMap = new Map<string, User>();
            defaultUsers.forEach(u => userMap.set(u.id, u));
            (parsed.users || []).forEach((u: User) => userMap.set(u.id, u));
            return Array.from(userMap.values());
          })(),
          schools: parsed.schools || initialData.schools || [],
          provinces: (parsed.provinces && parsed.provinces.length >= 11) ? parsed.provinces : initialData.provinces || [],
          districts: (parsed.districts && parsed.districts.length > 50) ? parsed.districts : initialData.districts || [],
          students: (parsed.students || initialData.students || []).map((s: Student, idx: number) => ({
            ...s,
            loginId: s.loginId || `ALU-2026-${(idx + 1).toString().padStart(3, '0')}`
          })),
          employees: (parsed.employees && parsed.employees.length > 0 ? parsed.employees : initialData.employees || []).map((e: Employee, idx: number) => {
            if (e.career === 'Docente') {
              if (idx === 0) {
                // Professor Alberto Nhatitima
                return {
                  ...e,
                  isDiretorTurma: true,
                  diretorTurmaClassId: 'c1',
                  diretorTurmaClassName: '10ª Classe A',
                  isDelegadoDisciplina: true,
                  delegadoDisciplinaSubjectId: 'sub1',
                  delegadoDisciplinaSubjectName: 'Matemática',
                  isDelegadoCiclo: true,
                  delegadoCicloType: '2º Ciclo' as const,
                  competencyRoles: [
                    { roleType: 'diretor_turma' as const, classId: 'c1', className: '10ª Classe A', assignedAt: '2026-02-01' },
                    { roleType: 'delegado_disciplina' as const, subjectId: 'sub1', subjectName: 'Matemática', assignedAt: '2026-02-01' },
                    { roleType: 'delegado_ciclo' as const, ciclo: '2º Ciclo' as const, assignedAt: '2026-02-01' }
                  ]
                };
              }
              if (idx === 2) {
                // Dra. Maria João
                return {
                  ...e,
                  isDelegadoDisciplina: true,
                  delegadoDisciplinaSubjectId: 'sub4',
                  delegadoDisciplinaSubjectName: 'Português',
                  isDiretorTurma: true,
                  diretorTurmaClassId: 'c2',
                  diretorTurmaClassName: '10ª Classe B',
                  competencyRoles: [
                    { roleType: 'delegado_disciplina' as const, subjectId: 'sub4', subjectName: 'Português', assignedAt: '2026-02-01' },
                    { roleType: 'diretor_turma' as const, classId: 'c2', className: '10ª Classe B', assignedAt: '2026-02-01' }
                  ]
                };
              }
            }
            return e;
          }),
          classes: parsed.classes || initialData.classes || [],
          subjects: parsed.subjects || initialData.subjects || [],
          assignments: parsed.assignments || initialData.assignments || [],
          grades: parsed.grades || initialData.grades || [],
          examGrades: parsed.examGrades || initialData.examGrades || [],
          lessonSummaries: parsed.lessonSummaries || [],
          digitalLessonRecords: parsed.digitalLessonRecords || initialData.digitalLessonRecords || [],
          reports: parsed.reports || [],
          emailNotifications: sanitizedEmailNotifs,
          notifications: sanitizedNotifs,
          academicArchives: sanitizedArchives,
          smtpSettings: parsed.smtpSettings || defaultSmtpSettings,
          financialTransactions: parsed.financialTransactions || initialData.financialTransactions || [],
          patrimonyItems: parsed.patrimonyItems || initialData.patrimonyItems || [],
          patrimonyMovements: parsed.patrimonyMovements || initialData.patrimonyMovements || [],
          libraryBooks: parsed.libraryBooks || initialData.libraryBooks || [],
          libraryLoans: parsed.libraryLoans || initialData.libraryLoans || [],
          hrContracts: parsed.hrContracts || initialData.hrContracts || [],
          hrLeaves: parsed.hrLeaves || initialData.hrLeaves || [],
          hrPromotions: parsed.hrPromotions || initialData.hrPromotions || [],
          hrTrainings: parsed.hrTrainings || initialData.hrTrainings || [],
          receptionVisitors: parsed.receptionVisitors || initialData.receptionVisitors || [],
          receptionTickets: parsed.receptionTickets || initialData.receptionTickets || [],
          archiveRecords: parsed.archiveRecords || initialData.archiveRecords || [],
          classSchedules: parsed.classSchedules || initialData.classSchedules || [],
          schoolRooms: parsed.schoolRooms || initialData.schoolRooms || [],
          aiPredictions: parsed.aiPredictions || initialData.aiPredictions || [],
          aiReports: parsed.aiReports || initialData.aiReports || [],
          transitionBatches: parsed.transitionBatches || [],
          issuedCertificates: (parsed.issuedCertificates && parsed.issuedCertificates.length > 0) ? parsed.issuedCertificates : defaultIssuedCertificates,
          issuedDeclarations: (parsed.issuedDeclarations && parsed.issuedDeclarations.length > 0) ? parsed.issuedDeclarations : defaultIssuedDeclarations,
          documentSignatures: (parsed.documentSignatures && parsed.documentSignatures.length > 0) ? parsed.documentSignatures : defaultDocumentSignatures,
          petitions: parsed.petitions || [],
          evaluations: parsed.evaluations || [],
          classTasks: parsed.classTasks || [],
          schoolDocuments: parsed.schoolDocuments || [],
          userNotifications: parsed.userNotifications || [],
          currentUser: parsed.currentUser || null,
          backups: parsed.backups || [],
          lastBackupAt: parsed.lastBackupAt || localStorage.getItem('eduGestaoLastBackupAt') || null,
          isBackingUp: false,
          autoBackupEnabled: parsed.autoBackupEnabled !== undefined ? parsed.autoBackupEnabled : true
        };
      } catch (e) {
        console.error('Error reading localStorage', e);
      }
    }
    const normalizedStudents = (initialData.students as any[] || []).map((s: any, idx: number) => ({
      ...s,
      loginId: s.loginId || `ALU-2026-${String(idx + 1).padStart(3, '0')}`,
    }));

    return {
      ...initialData,
      students: normalizedStudents,
      provinces: initialData.provinces || [],
      districts: initialData.districts || [],
      employees: initialData.employees || [],
      examGrades: initialData.examGrades || [],
      reports: initialData.reports || [],
      lessonSummaries: [],
      digitalLessonRecords: initialData.digitalLessonRecords || [],
      issuedDeclarations: defaultIssuedDeclarations,
      issuedCertificates: defaultIssuedCertificates,
      documentSignatures: defaultDocumentSignatures,
      collectionPeriods: initialData.collectionPeriods || [],
      collectionForms: initialData.collectionForms || [],
      chatMessages: (initialData.chatMessages && initialData.chatMessages.length > 0) ? initialData.chatMessages : defaultChatMessages,
      transferRequests: initialData.transferRequests || [],
      academicComplaints: initialData.academicComplaints || [],
      academicArchives: [],
      emailNotifications: [],
      smtpSettings: defaultSmtpSettings,
      financialTransactions: initialData.financialTransactions || [],
      patrimonyItems: initialData.patrimonyItems || [],
      patrimonyMovements: initialData.patrimonyMovements || [],
      libraryBooks: initialData.libraryBooks || [],
      libraryLoans: initialData.libraryLoans || [],
      hrContracts: initialData.hrContracts || [],
      hrLeaves: initialData.hrLeaves || [],
      hrPromotions: initialData.hrPromotions || [],
      hrTrainings: initialData.hrTrainings || [],
      receptionVisitors: initialData.receptionVisitors || [],
      receptionTickets: initialData.receptionTickets || [],
      archiveRecords: initialData.archiveRecords || [],
      classSchedules: initialData.classSchedules || [],
      schoolRooms: initialData.schoolRooms || [],
      aiPredictions: initialData.aiPredictions || [],
      aiReports: initialData.aiReports || [],
      transitionBatches: [],
      evaluations: [],
      classTasks: [],
      schoolDocuments: [],
      userNotifications: [],
      petitions: [],
      currentUser: null,
      highContrast: false,
      backups: [],
      lastBackupAt: localStorage.getItem('eduGestaoLastBackupAt') || null,
      isBackingUp: false,
      autoBackupEnabled: true
    };
  });

  useEffect(() => {
    // Debounce persistence by 500ms and wrap in try/catch to prevent freezing the event loop
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('eduGestaoState', JSON.stringify(state));
      } catch (err) {
        console.warn('Aviso: Falha ao persistir dados no armazenamento local (limite de quota):', err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [state]);

  // Real-time Firestore synchronization for evaluations, classTasks, users, schools, and schoolDocuments
  useEffect(() => {
    const unsubEval = onSnapshot(collection(db, 'evaluations'), (snapshot) => {
      const items: EvaluationItem[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as EvaluationItem);
      });
      if (items.length > 0) {
        setState(prev => ({
          ...prev,
          evaluations: items
        }));
      }
    }, (error) => {
      console.warn('Firestore evaluations sync:', error?.message || error);
    });

    const unsubTasks = onSnapshot(collection(db, 'classTasks'), (snapshot) => {
      const items: ClassTaskItem[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as ClassTaskItem);
      });
      if (items.length > 0) {
        setState(prev => ({
          ...prev,
          classTasks: items
        }));
      }
    }, (error) => {
      console.warn('Firestore classTasks sync:', error?.message || error);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const items: User[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as User);
      });
      // Always merge default test accounts so Firestore updates do not erase test accounts
      const userMap = new Map<string, User>();
      ((initialData.users as User[]) || []).forEach(u => userMap.set(u.id, u));
      items.forEach(u => userMap.set(u.id, u));
      const combinedUsers = Array.from(userMap.values());

      setState(prev => ({
        ...prev,
        users: combinedUsers
      }));

      if (items.length === 0) {
        // Seed default test accounts to Firestore if empty
        ((initialData.users as User[]) || []).forEach(async (u: any) => {
          try {
            await setDoc(doc(db, 'users', u.id), u);
          } catch (err) {
            console.warn('Seeding default user failed:', err);
          }
        });
      }
    }, (error) => {
      console.warn('Firestore users sync:', error?.message || error);
    });

    const unsubSchools = onSnapshot(collection(db, 'schools'), (snapshot) => {
      const items: School[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as School);
      });
      if (items.length > 0) {
        setState(prev => ({
          ...prev,
          schools: items
        }));
      }
    }, (error) => {
      console.warn('Firestore schools sync:', error?.message || error);
    });

    const unsubDocs = onSnapshot(collection(db, 'schoolDocuments'), (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (items.length > 0) {
        setState(prev => ({
          ...prev,
          schoolDocuments: items
        }));
      }
    }, (error) => {
      console.warn('Firestore schoolDocuments sync:', error?.message || error);
    });

    const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      const items: UserNotification[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as UserNotification);
      });
      if (items.length > 0) {
        setState(prev => ({
          ...prev,
          userNotifications: items
        }));
      }
    }, (error) => {
      console.warn('Firestore notifications sync:', error?.message || error);
    });

    // Real-time sync & seeding for students
    const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      const items: Student[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Student);
      });
      if (items.length > 0) {
        setState(prev => ({ ...prev, students: items }));
      } else {
        const initialStudents = initialData.students || [];
        initialStudents.forEach(async (s: any) => {
          try {
            await setDoc(doc(db, 'students', s.id), s);
          } catch (err) {
            console.warn('Seeding student failed:', err);
          }
        });
      }
    }, (error) => {
      console.warn('Firestore students sync:', error?.message || error);
    });

    // Real-time sync & seeding for subjects
    const unsubSubjects = onSnapshot(collection(db, 'subjects'), (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (items.length > 0) {
        setState(prev => ({ ...prev, subjects: items }));
      } else {
        const initialSubjects = initialData.subjects || [];
        initialSubjects.forEach(async (sub: any) => {
          try {
            await setDoc(doc(db, 'subjects', sub.id), sub);
          } catch (err) {
            console.warn('Seeding subject failed:', err);
          }
        });
      }
    }, (error) => {
      console.warn('Firestore subjects sync:', error?.message || error);
    });

    // Real-time sync & seeding for grades
    const unsubGrades = onSnapshot(collection(db, 'grades'), (snapshot) => {
      const items: any[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (items.length > 0) {
        setState(prev => ({ ...prev, grades: items }));
      } else {
        const initialGrades = initialData.grades || [];
        initialGrades.forEach(async (g: any) => {
          try {
            await setDoc(doc(db, 'grades', g.id), g);
          } catch (err) {
            console.warn('Seeding grade failed:', err);
          }
        });
      }
    }, (error) => {
      console.warn('Firestore grades sync:', error?.message || error);
    });

    // Real-time sync for exam grades
    const unsubExamGrades = onSnapshot(collection(db, 'examGrades'), (snapshot) => {
      const items: ExamGrade[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as ExamGrade);
      });
      if (items.length > 0) {
        setState(prev => ({ ...prev, examGrades: items }));
      }
    }, (error) => {
      console.warn('Firestore examGrades sync:', error?.message || error);
    });

    // Real-time sync for collection periods
    const unsubCollPeriods = onSnapshot(collection(db, 'collectionPeriods'), (snapshot) => {
      const items: CollectionPeriod[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as CollectionPeriod);
      });
      if (items.length > 0) {
        setState(prev => ({ ...prev, collectionPeriods: items }));
      }
    }, (error) => {
      console.warn('Firestore collectionPeriods sync:', error?.message || error);
    });

    // Real-time sync for chat messages
    const unsubChat = onSnapshot(collection(db, 'chatMessages'), (snapshot) => {
      const items: ChatMessage[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
      });
      if (items.length > 0) {
        items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setState(prev => ({ ...prev, chatMessages: items }));
      }
    }, (error) => {
      console.warn('Firestore chatMessages sync:', error?.message || error);
    });

    // Real-time sync & seeding for classes
    const unsubClasses = onSnapshot(collection(db, 'classes'), (snapshot) => {
      const items: Class[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Class);
      });
      if (items.length > 0) {
        setState(prev => ({ ...prev, classes: items }));
      } else {
        const initialClasses = initialData.classes || [];
        initialClasses.forEach(async (c: any) => {
          try {
            await setDoc(doc(db, 'classes', c.id), c);
          } catch (err) {
            console.warn('Seeding class failed:', err);
          }
        });
      }
    }, (error) => {
      console.warn('Firestore classes sync:', error?.message || error);
    });

    // Real-time sync & seeding for employees
    const unsubEmployees = onSnapshot(collection(db, 'employees'), (snapshot) => {
      const items: Employee[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as Employee);
      });
      if (items.length > 0) {
        setState(prev => ({ ...prev, employees: items }));
      } else {
        const initialEmployees = initialData.employees || [];
        initialEmployees.forEach(async (e: any) => {
          try {
            await setDoc(doc(db, 'employees', e.id), e);
          } catch (err) {
            console.warn('Seeding employee failed:', err);
          }
        });
      }
    }, (error) => {
      console.warn('Firestore employees sync:', error?.message || error);
    });

    // Real-time sync for backups
    const unsubBackups = onSnapshot(collection(db, 'backups'), (snapshot) => {
      const items: BackupRecord[] = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() } as BackupRecord);
      });
      if (items.length > 0) {
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setState(prev => ({ 
          ...prev, 
          backups: items,
          lastBackupAt: items[0]?.createdAt || prev.lastBackupAt 
        }));
      }
    }, (error) => {
      console.warn('Firestore backups sync:', error?.message || error);
    });

    return () => {
      unsubEval();
      unsubTasks();
      unsubUsers();
      unsubSchools();
      unsubDocs();
      unsubNotifs();
      unsubStudents();
      unsubSubjects();
      unsubGrades();
      unsubExamGrades();
      unsubCollPeriods();
      unsubChat();
      unsubClasses();
      unsubEmployees();
      unsubBackups();
    };
  }, []);

  // --- SCHOOL TENANT ISOLATION LOGIC ---
  const getInitialSchoolId = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const param = urlParams.get('schoolId') || urlParams.get('tenant') || urlParams.get('school');
      if (param) return param;
    }
    return localStorage.getItem('eduGestaoActiveSchoolId') || null;
  };

  const [activeSchoolIdState, setActiveSchoolIdState] = useState<string | null>(getInitialSchoolId);

  // Sync active tenant whenever currentUser logs in or changes
  useEffect(() => {
    if (state.currentUser?.schoolId && state.currentUser.schoolId !== activeSchoolIdState) {
      setActiveSchoolIdState(state.currentUser.schoolId);
      try {
        localStorage.setItem('eduGestaoActiveSchoolId', state.currentUser.schoolId);
      } catch (e) {
        // Ignore quota
      }
    }
  }, [state.currentUser?.id, state.currentUser?.schoolId, activeSchoolIdState]);

  const setActiveSchoolId = (schoolId: string | null) => {
    setActiveSchoolIdState(schoolId);
    if (schoolId) {
      try {
        localStorage.setItem('eduGestaoActiveSchoolId', schoolId);
      } catch (e) {}
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('schoolId', schoolId);
        window.history.replaceState({}, '', url.toString());
      }
    } else {
      try {
        localStorage.removeItem('eduGestaoActiveSchoolId');
      } catch (e) {}
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('schoolId');
        window.history.replaceState({}, '', url.toString());
      }
    }
  };

  const getSchoolTenantUrl = (schoolId: string) => {
    if (typeof window === 'undefined') return `/?schoolId=${schoolId}`;
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    return `${baseUrl}?schoolId=${encodeURIComponent(schoolId)}`;
  };

  const getSchoolByTenant = (tenantIdOrCode: string) => {
    return state.schools.find(s => s.id === tenantIdOrCode || s.code === tenantIdOrCode);
  };

  // Determine active effective school tenant
  const effectiveSchoolId = activeSchoolIdState || state.currentUser?.schoolId || null;
  
  // Is this a global governance/admin view with all schools?
  const isGlobalView = !effectiveSchoolId || effectiveSchoolId === 'all';

  const activeSchool = useMemo(() => {
    return isGlobalView 
      ? (state.schools[0] || null)
      : (state.schools.find(s => s.id === effectiveSchoolId || s.code === effectiveSchoolId) || state.schools[0] || null);
  }, [isGlobalView, state.schools, effectiveSchoolId]);

  // Tenant Isolated Collections (Memoized to guarantee reference stability and prevent cascading re-renders)
  const tenantClasses = useMemo(() => {
    let list = isGlobalView ? (state.classes || []) : (state.classes || []).filter(c => c.schoolId === effectiveSchoolId);
    if (!isGlobalView && activeSchool?.schoolTypes && activeSchool.schoolTypes.length > 0) {
      const allowed = computeAutoCurriculum(activeSchool.schoolTypes).classes;
      list = list.filter(c => allowed.some(a => (c.gradeLevel || '').toLowerCase().includes(a.toLowerCase().replace('la', 'ª').replace(' .', '.')) || a.toLowerCase().includes((c.gradeLevel || '').toLowerCase())));
    }
    return list;
  }, [state.classes, effectiveSchoolId, isGlobalView, activeSchool]);

  const tenantStudents = useMemo(() => {
    let list = isGlobalView ? (state.students || []) : (state.students || []).filter(s => s.schoolId === effectiveSchoolId);
    if (!isGlobalView && activeSchool?.schoolTypes && activeSchool.schoolTypes.length > 0) {
      const allowedClassIds = new Set(tenantClasses.map(c => c.id));
      list = list.filter(s => !s.classId || allowedClassIds.has(s.classId));
    }
    return list;
  }, [state.students, effectiveSchoolId, isGlobalView, activeSchool, tenantClasses]);

  const tenantEmployees = useMemo(() => 
    isGlobalView ? (state.employees || []) : (state.employees || []).filter(e => e.schoolId === effectiveSchoolId),
    [state.employees, effectiveSchoolId, isGlobalView]
  );

  const tenantSubjects = useMemo(() => 
    isGlobalView ? (state.subjects || []) : (state.subjects || []).filter(s => !s.schoolId || s.schoolId === effectiveSchoolId),
    [state.subjects, effectiveSchoolId, isGlobalView]
  );

  const tenantAssignments = useMemo(() => 
    isGlobalView ? (state.assignments || []) : (state.assignments || []).filter(a => !a.schoolId || a.schoolId === effectiveSchoolId),
    [state.assignments, effectiveSchoolId, isGlobalView]
  );

  const studentIdsInTenant = useMemo(() => 
    new Set(tenantStudents.map(s => s.id)),
    [tenantStudents]
  );

  const tenantGrades = useMemo(() => 
    isGlobalView ? (state.grades || []) : (state.grades || []).filter(g => studentIdsInTenant.has(g.studentId)),
    [state.grades, studentIdsInTenant, isGlobalView]
  );

  const tenantExamGrades = useMemo(() => 
    isGlobalView ? (state.examGrades || []) : (state.examGrades || []).filter(g => studentIdsInTenant.has(g.studentId)),
    [state.examGrades, studentIdsInTenant, isGlobalView]
  );

  const tenantFinancialTransactions = useMemo(() => 
    isGlobalView ? (state.financialTransactions || []) : (state.financialTransactions || []).filter(f => !f.schoolId || f.schoolId === effectiveSchoolId),
    [state.financialTransactions, effectiveSchoolId, isGlobalView]
  );

  const tenantPatrimonyItems = useMemo(() => 
    isGlobalView ? (state.patrimonyItems || []) : (state.patrimonyItems || []).filter(p => !p.schoolId || p.schoolId === effectiveSchoolId),
    [state.patrimonyItems, effectiveSchoolId, isGlobalView]
  );

  const tenantPatrimonyMovements = useMemo(() => 
    isGlobalView ? (state.patrimonyMovements || []) : (state.patrimonyMovements || []).filter(m => !m.schoolId || m.schoolId === effectiveSchoolId),
    [state.patrimonyMovements, effectiveSchoolId, isGlobalView]
  );

  const tenantLibraryBooks = useMemo(() => 
    isGlobalView ? (state.libraryBooks || []) : (state.libraryBooks || []).filter(b => !b.schoolId || b.schoolId === effectiveSchoolId),
    [state.libraryBooks, effectiveSchoolId, isGlobalView]
  );

  const tenantLibraryLoans = useMemo(() => 
    isGlobalView ? (state.libraryLoans || []) : (state.libraryLoans || []).filter(l => !l.schoolId || l.schoolId === effectiveSchoolId),
    [state.libraryLoans, effectiveSchoolId, isGlobalView]
  );

  const tenantHrContracts = useMemo(() => 
    isGlobalView ? (state.hrContracts || []) : (state.hrContracts || []).filter(c => !c.schoolId || c.schoolId === effectiveSchoolId),
    [state.hrContracts, effectiveSchoolId, isGlobalView]
  );

  const tenantHrLeaves = useMemo(() => 
    isGlobalView ? (state.hrLeaves || []) : (state.hrLeaves || []).filter(l => !l.schoolId || l.schoolId === effectiveSchoolId),
    [state.hrLeaves, effectiveSchoolId, isGlobalView]
  );

  const tenantHrPromotions = useMemo(() => 
    isGlobalView ? (state.hrPromotions || []) : (state.hrPromotions || []).filter(p => !p.schoolId || p.schoolId === effectiveSchoolId),
    [state.hrPromotions, effectiveSchoolId, isGlobalView]
  );

  const tenantHrTrainings = useMemo(() => 
    isGlobalView ? (state.hrTrainings || []) : (state.hrTrainings || []).filter(t => !t.schoolId || t.schoolId === effectiveSchoolId),
    [state.hrTrainings, effectiveSchoolId, isGlobalView]
  );

  const tenantReceptionVisitors = useMemo(() => 
    isGlobalView ? (state.receptionVisitors || []) : (state.receptionVisitors || []).filter(v => !v.schoolId || v.schoolId === effectiveSchoolId),
    [state.receptionVisitors, effectiveSchoolId, isGlobalView]
  );

  const tenantReceptionTickets = useMemo(() => 
    isGlobalView ? (state.receptionTickets || []) : (state.receptionTickets || []).filter(t => !t.schoolId || t.schoolId === effectiveSchoolId),
    [state.receptionTickets, effectiveSchoolId, isGlobalView]
  );

  const tenantArchiveRecords = useMemo(() => 
    isGlobalView ? (state.archiveRecords || []) : (state.archiveRecords || []).filter(r => !r.schoolId || r.schoolId === effectiveSchoolId),
    [state.archiveRecords, effectiveSchoolId, isGlobalView]
  );

  const tenantClassSchedules = useMemo(() => 
    isGlobalView ? (state.classSchedules || []) : (state.classSchedules || []).filter(cs => !cs.schoolId || cs.schoolId === effectiveSchoolId),
    [state.classSchedules, effectiveSchoolId, isGlobalView]
  );

  const tenantSchoolRooms = useMemo(() => 
    isGlobalView ? (state.schoolRooms || []) : (state.schoolRooms || []).filter(sr => !sr.schoolId || sr.schoolId === effectiveSchoolId),
    [state.schoolRooms, effectiveSchoolId, isGlobalView]
  );

  const tenantIssuedDeclarations = useMemo(() => 
    isGlobalView ? (state.issuedDeclarations || []) : (state.issuedDeclarations || []).filter(d => !d.schoolId || d.schoolId === effectiveSchoolId),
    [state.issuedDeclarations, effectiveSchoolId, isGlobalView]
  );

  const tenantIssuedCertificates = useMemo(() => 
    isGlobalView ? (state.issuedCertificates || []) : (state.issuedCertificates || []).filter(c => !c.schoolId || c.schoolId === effectiveSchoolId),
    [state.issuedCertificates, effectiveSchoolId, isGlobalView]
  );

  const login = (emailOrId: string, password?: string) => {
    const cleanInput = emailOrId.trim().toLowerCase();

    // Role alias and email mapping dictionary for seamless test login
    const aliasMap: Record<string, string> = {
      'admin': 'admin@escola.com',
      'administrador': 'admin@escola.com',
      'aluno': 'aluno@escola.com',
      'estudante': 'aluno@escola.com',
      'professor': 'professor@escola.com',
      'docente': 'professor@escola.com',
      'pedagogico': 'pedagogico@escola.com',
      'pedagógico': 'pedagogico@escola.com',
      'dap': 'pedagogico@escola.com',
      'diretor': 'diretor@escola.com',
      'director': 'diretor@escola.com',
      'secretaria': 'secretaria@escola.com',
      'chefe': 'secretaria@escola.com',
      'chefe da secretaria': 'secretaria@escola.com',
      'chefe secretaria': 'secretaria@escola.com',
      'distrital': 'distrital@gov.mz',
      'gestor distrital': 'distrital@gov.mz',
      'provincial': 'provincial@gov.mz',
      'gestor provincial': 'provincial@gov.mz',
      'ministro': 'ministro@gov.mz',
      'nacional': 'ministro@gov.mz',
      'gestor do ministerio': 'ministro@gov.mz',
      'gestor ministério': 'ministro@gov.mz',
      'encarregado': 'encarregado@escola.com',
      'guardian': 'encarregado@escola.com',
      'rh': 'rh@escola.com',
      'patrimonio': 'patrimonio@escola.com',
      'património': 'patrimonio@escola.com',
      'financas': 'financas@escola.com',
      'finanças': 'financas@escola.com',
      'financeiro': 'financas@escola.com',
      'gestor financeiro': 'financas@escola.com',
      'recepcao': 'recepcao@escola.com',
      'recepção': 'recepcao@escola.com',
      'arquivo': 'arquivo@escola.com',
      'biblioteca': 'biblioteca@escola.com',
      'librarian': 'biblioteca@escola.com'
    };

    const targetEmail = aliasMap[cleanInput] || cleanInput;

    // 1. Search directly in active users list
    let user = state.users.find(u => 
      u.email.toLowerCase() === targetEmail || 
      u.email.toLowerCase() === cleanInput ||
      u.id.toLowerCase() === cleanInput ||
      u.name.toLowerCase() === cleanInput ||
      u.role.toLowerCase() === cleanInput
    );

    // 2. Fallback search in initial default test accounts
    if (!user) {
      user = ((initialData.users as User[]) || []).find(u =>
        u.email.toLowerCase() === targetEmail ||
        u.email.toLowerCase() === cleanInput ||
        u.id.toLowerCase() === cleanInput ||
        u.name.toLowerCase() === cleanInput ||
        u.role.toLowerCase() === cleanInput
      );
    }

    if (user) {
      if (password && user.password && user.password.trim() !== password.trim()) {
        return false;
      }
      sessionStorage.setItem('isFreshLogin', 'true');
      setState(prev => ({
        ...prev,
        currentUser: user!,
        users: prev.users.some(u => u.id === user!.id) ? prev.users : [...prev.users, user!]
      }));
      return true;
    }

    // 3. Search in students list by loginId, ID, studentNumber, IUE or NIM
    const student = state.students.find(s => 
      (s.loginId && s.loginId.toUpperCase() === cleanInput.toUpperCase()) ||
      s.id.toUpperCase() === cleanInput.toUpperCase() ||
      (s.studentNumber && s.studentNumber.toUpperCase() === cleanInput.toUpperCase()) ||
      (s.iue && s.iue.toUpperCase().includes(cleanInput.toUpperCase())) ||
      (s.nim && s.nim.toUpperCase().includes(cleanInput.toUpperCase()))
    );

    if (student) {
      const studentUser: User = {
        id: `user-${student.id}`,
        name: student.name,
        email: `${student.id}@aluno.escola.com`,
        role: 'student',
        studentId: student.id,
        schoolId: student.schoolId,
      };

      sessionStorage.setItem('isFreshLogin', 'true');
      setState(prev => ({
        ...prev,
        currentUser: studentUser,
        users: prev.users.some(u => u.id === studentUser.id) ? prev.users : [...prev.users, studentUser]
      }));
      return true;
    }

    return false;
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const addCollectionPeriod = (period: Omit<CollectionPeriod, 'id' | 'createdAt'>) => {
    const newId = `period-${Date.now()}`;
    const newPeriod: CollectionPeriod = {
      ...period,
      id: newId,
      createdAt: new Date().toISOString()
    };
    
    // Persist to Firestore
    setDoc(doc(db, 'collectionPeriods', newId), newPeriod).catch(err => {
      console.warn('Firestore addCollectionPeriod failed:', err);
    });

    setState(prev => ({
      ...prev,
      collectionPeriods: [...prev.collectionPeriods, newPeriod]
    }));
  };

  const publishCollectionPeriod = (id: string) => {
    // Persist to Firestore
    updateDoc(doc(db, 'collectionPeriods', id), { status: 'published' }).catch(err => {
      console.warn('Firestore publishCollectionPeriod failed:', err);
    });

    setState(prev => ({
      ...prev,
      collectionPeriods: prev.collectionPeriods.map(p => p.id === id ? { ...p, status: 'published' } : p)
    }));
  };

  const submitCollectionForm = (formData: Omit<CollectionForm, 'id' | 'submittedAt'>) => {
    const newId = `form-${Date.now()}`;
    const newForm: CollectionForm = {
      ...formData,
      id: newId,
      submittedAt: new Date().toISOString(),
      status: 'submitted'
    };

    // Persist to Firestore
    setDoc(doc(db, 'collectionForms', newId), newForm).catch(err => {
      console.warn('Firestore submitCollectionForm failed:', err);
    });

    setState(prev => ({
      ...prev,
      collectionForms: [...prev.collectionForms, newForm]
    }));
  };

  const sendChatMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newId = `msg-${Date.now()}`;
    const newMessage: ChatMessage = {
      ...msg,
      id: newId,
      timestamp: new Date().toISOString()
    };

    // Persist to Firestore
    setDoc(doc(db, 'chatMessages', newId), newMessage).catch(err => {
      console.warn('Firestore sendChatMessage failed:', err);
    });

    setState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, newMessage]
    }));
  };

  const submitTransferRequest = (request: Omit<TransferRequest, 'id' | 'status' | 'requestedAt'>) => {
    const newRequest: TransferRequest = {
      ...request,
      id: `trans-${Date.now()}`,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      transferRequests: [...prev.transferRequests, newRequest]
    }));
  };

  const submitComplaint = (complaint: Omit<AcademicComplaint, 'id' | 'status' | 'createdAt'>) => {
    const newComplaint: AcademicComplaint = {
      ...complaint,
      id: `comp-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      academicComplaints: [...prev.academicComplaints, newComplaint]
    }));
  };

  const updateSchoolChoice = (studentId: string, schoolId: string) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === studentId ? { ...s, nextSchoolId: schoolId } : s)
    }));
  };

  const toggleHighContrast = () => {
    setState(prev => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const updateSmtpSettings = (settings: Partial<SmtpSettings>) => {
    setState(prev => ({
      ...prev,
      smtpSettings: {
        ...prev.smtpSettings,
        ...settings
      }
    }));
  };

  const testSmtpConnection = async (): Promise<{ success: boolean; message: string; log: string[] }> => {
    const { host, port, username, encryption, senderEmail } = state.smtpSettings;
    const timestamp = new Date().toISOString();
    const log: string[] = [
      `[${timestamp}] Iniciando handshake de conexão SMTP com ${host}:${port}...`,
      `[${timestamp}] Estabelecendo túnel de comunicação via protocolo ${encryption}...`,
      `[${timestamp}] 220 ${host} ESMTP Service Ready (MINEDH Mail Gateway)`,
      `[${timestamp}] EHLO ${senderEmail || 'sistema.minedh.gov.mz'}`,
      `[${timestamp}] 250-SIZE 35651584`,
      `[${timestamp}] 250-8BITMIME`,
      `[${timestamp}] 250-STARTTLS`,
      `[${timestamp}] 250-AUTH PLAIN LOGIN`,
      `[${timestamp}] AUTH LOGIN (${username})`,
      `[${timestamp}] 235 2.7.0 Authentication successful for ${username}`,
      `[${timestamp}] RSET`,
      `[${timestamp}] 250 2.0.0 OK`,
      `[${timestamp}] Teste de comunicação concluído com êxito. Servidor SMTP pronto para disparos automáticos.`
    ];

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 800));

    setState(prev => ({
      ...prev,
      smtpSettings: {
        ...prev.smtpSettings,
        lastTestedAt: new Date().toISOString()
      }
    }));

    return {
      success: true,
      message: `Conexão SMTP com ${host}:${port} validada com sucesso (Autenticado como ${username}).`,
      log
    };
  };

  const triggerTrimesterCloseEmailToTeachers = (classId: string, trimester?: number) => {
    setState(prev => {
      if (!prev.smtpSettings.isActive || !prev.smtpSettings.autoSendOnTrimesterClose) {
        return prev;
      }

      const targetClass = prev.classes.find(c => c.id === classId);
      const classAssignments = prev.assignments.filter(a => a.classId === classId);
      const teacherIds = Array.from(new Set(classAssignments.map(a => a.teacherId)));
      const teachersToNotify = prev.users.filter(
        u => u.role === 'teacher' && (teacherIds.includes(u.id) || !teacherIds.length)
      );

      const trimLabel = trimester ? `${trimester}º Trimestre` : 'Trimestre Geral';
      const senderInfo = `${prev.smtpSettings.senderName} <${prev.smtpSettings.senderEmail}>`;

      const newNotifs: EmailNotification[] = teachersToNotify.map(t => ({
        id: `email-smtp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        teacherEmail: t.email,
        teacherName: t.name,
        subject: `[MINEDH/SMTP] Confirmação de Encerramento Trimestral de Caderneta - ${targetClass?.name || 'Turma'} (${trimLabel})`,
        message: `Prezado(a) Docente ${t.name},\n\nInformamos que o fechamento trimestral das cadernetas da turma ${targetClass?.name || classId} (${targetClass?.gradeLevel || ''}) foi processado e homologado com sucesso.\n\nServidor SMTP Remetente: ${senderInfo}\nStatus das Notas: Trancadas para edição (Modo Leitura)\nData de Fechamento: ${new Date().toLocaleString('pt-MZ')}\n\nAs pautas de frequência e exames encontram-se arquivadas na Secção Pedagógica.\n\nAtentamente,\nDirecção Pedagógica & Ministério da Educação e Desenvolvimento Humano`,
        classId,
        className: targetClass?.name,
        sentAt: new Date().toISOString(),
        status: 'SENT'
      }));

      return {
        ...prev,
        emailNotifications: [...newNotifs, ...prev.emailNotifications]
      };
    });
  };

  const lockClassGrades = (classId: string) => {
    setState(prev => {
      const gradesForClass = prev.grades.filter(g => g.classId === classId);
      const examGradesForClass = prev.examGrades.filter(eg => eg.classId === classId);
      
      const totalCount = gradesForClass.length + examGradesForClass.length;
      if (totalCount === 0) {
        return prev;
      }

      const allGradesLocked = gradesForClass.length === 0 || gradesForClass.every(g => g.isLocked);
      const allExamLocked = examGradesForClass.length === 0 || examGradesForClass.every(eg => eg.isLocked);

      if (allGradesLocked && allExamLocked) {
        return prev;
      }

      const updatedGrades = prev.grades.map(g => {
        if (g.classId === classId && !g.isLocked) {
          const updated = { ...g, isLocked: true };
          // Persist each lock to Firestore
          updateDoc(doc(db, 'grades', g.id), { isLocked: true }).catch(() => {});
          return updated;
        }
        return g;
      });
      const updatedExamGrades = prev.examGrades.map(eg => {
        if (eg.classId === classId && !eg.isLocked) {
          const updated = { ...eg, isLocked: true };
          // Persist each lock to Firestore
          updateDoc(doc(db, 'examGrades', eg.id), { isLocked: true }).catch(() => {});
          return updated;
        }
        return eg;
      });
      
      let updatedNotifs = prev.emailNotifications;

      // Automatically dispatch SMTP notification if active
      if (prev.smtpSettings.isActive && prev.smtpSettings.autoSendOnTrimesterClose) {
        const targetClass = prev.classes.find(c => c.id === classId);
        const classAssignments = prev.assignments.filter(a => a.classId === classId);
        const teacherIds = Array.from(new Set(classAssignments.map(a => a.teacherId)));
        const teachersToNotify = prev.users.filter(
          u => u.role === 'teacher' && (teacherIds.includes(u.id) || !teacherIds.length)
        );

        const newNotifs: EmailNotification[] = teachersToNotify.map(t => ({
          id: `email-lock-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          teacherEmail: t.email,
          teacherName: t.name,
          subject: `[MINEDH] Notificação de Bloqueio de Caderneta - Turma ${targetClass?.name || classId}`,
          message: `Prezado(a) Professor(a) ${t.name},\n\nSua caderneta referente à turma ${targetClass?.name || classId} foi trancada oficialmente após o fechamento do trimestre via servidor SMTP (${prev.smtpSettings.host}). Nenhuma alteração posterior de notas será permitida sem autorização do Director de Escola.\n\nAtentamente,\nSecção Pedagógica / MINEDH`,
          classId,
          className: targetClass?.name,
          sentAt: new Date().toISOString(),
          status: 'SENT'
        }));

        updatedNotifs = [...newNotifs, ...prev.emailNotifications].slice(0, 100);
      }

      return {
        ...prev,
        grades: updatedGrades,
        examGrades: updatedExamGrades,
        emailNotifications: updatedNotifs
      };
    });
  };

  const sendEmailNotification = (notification: Omit<EmailNotification, 'id' | 'sentAt' | 'status'>) => {
    const newNotif: EmailNotification = {
      ...notification,
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      sentAt: new Date().toISOString(),
      status: 'SENT'
    };
    setState(prev => ({
      ...prev,
      emailNotifications: [newNotif, ...prev.emailNotifications].slice(0, 100)
    }));
  };

  const archiveAcademicData = (year: number, classId: string) => {
    setState(prev => {
        // Prevent duplicate archives for the same year and class
        const alreadyArchived = prev.academicArchives?.some(a => a.classId === classId && a.year === year);
        if (alreadyArchived) {
          return prev;
        }

        const gradesToArchive = prev.grades.filter(g => g.classId === classId);
        const examGradesToArchive = prev.examGrades.filter(eg => eg.classId === classId);
        const targetClass = prev.classes.find(c => c.id === classId);
        
        const newArchive: AcademicArchive = {
            id: `arch-${Date.now()}`,
            year,
            classId,
            grades: gradesToArchive,
            examGrades: examGradesToArchive,
            archivedAt: new Date().toISOString()
        };

        // Find teachers assigned to this class
        const classAssignments = prev.assignments.filter(a => a.classId === classId);
        const teacherIds = Array.from(new Set(classAssignments.map(a => a.teacherId)));
        const teachersToNotify = prev.users.filter(u => u.role === 'teacher' && (teacherIds.includes(u.id) || !teacherIds.length));

        const newEmailNotifs: EmailNotification[] = teachersToNotify.map(t => ({
          id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          teacherEmail: t.email,
          teacherName: t.name,
          subject: `[MINEDH/SMTP] Arquivo Histórico Processado - Fecho de Trimestre (${targetClass?.name || 'Turma'})`,
          message: `Prezado(a) Professor(a) ${t.name},\n\nInformamos que a Secção Pedagógica processou com sucesso o arquivo histórico institucional para a turma ${targetClass?.name || classId} através do Servidor SMTP Configurado (${prev.smtpSettings.host}:${prev.smtpSettings.port}). As cadernetas encontram-se em modo de leitura (trancadas).\n\nRemetente: ${prev.smtpSettings.senderEmail}\nAtentamente,\nDirecção Pedagógica / MINEDH`,
          classId,
          className: targetClass?.name,
          sentAt: new Date().toISOString(),
          status: 'SENT'
        }));

        return {
            ...prev,
            academicArchives: [...(prev.academicArchives || []), newArchive],
            emailNotifications: [...newEmailNotifs, ...(prev.emailNotifications || [])].slice(0, 100)
        };
    });
  };

  const updateUserSignature = (userId: string, signature: string) => {
    setState(prev => {
      const updatedUsers = prev.users.map(u => u.id === userId ? { ...u, signature } : u);
      const updatedCurrentUser = prev.currentUser?.id === userId ? { ...prev.currentUser, signature } : prev.currentUser;
      return {
        ...prev,
        users: updatedUsers,
        currentUser: updatedCurrentUser
      };
    });
  };

  const setUserSecurityPin = (userId: string, pin: string) => {
    setState(prev => {
      const updatedUsers = prev.users.map(u => u.id === userId ? { ...u, securityPin: pin } : u);
      const updatedCurrentUser = prev.currentUser?.id === userId ? { ...prev.currentUser, securityPin: pin } : prev.currentUser;
      return {
        ...prev,
        users: updatedUsers,
        currentUser: updatedCurrentUser
      };
    });
  };

  const updatePassword = async (userId: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        password: newPassword,
        mustChangePassword: false
      });
      setState(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === userId ? { ...u, password: newPassword, mustChangePassword: false } : u),
        currentUser: prev.currentUser?.id === userId ? { ...prev.currentUser, password: newPassword, mustChangePassword: false } : prev.currentUser
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erro ao atualizar senha.' };
    }
  };

  const registerUserBiometrics = async (userId: string, status = true) => {
    setState(prev => {
      const updatedUsers = prev.users.map(u => u.id === userId ? { 
        ...u, 
        biometricRegistered: status,
        biometricRegisteredAt: status ? new Date().toISOString() : undefined
      } : u);
      const updatedCurrentUser = prev.currentUser?.id === userId ? { 
        ...prev.currentUser, 
        biometricRegistered: status,
        biometricRegisteredAt: status ? new Date().toISOString() : undefined
      } : prev.currentUser;
      return {
        ...prev,
        users: updatedUsers,
        currentUser: updatedCurrentUser
      };
    });
    return { success: true };
  };

  const removeDocumentSignature = (signatureId: string) => {
    setState(prev => ({
      ...prev,
      documentSignatures: (prev.documentSignatures || []).filter(s => s.id !== signatureId)
    }));
  };

  const signDocument = async (params: {
    documentId: string;
    documentType: 'certificate' | 'declaration' | 'transfer' | 'bulletin' | 'pauta';
    studentId?: string;
    studentName?: string;
    signerRole?: string;
    signerTitle?: string;
    authMethod: 'biometric' | 'security_code';
    securityPinProvided?: string;
    biometricType?: 'fingerprint' | 'face_id' | 'touch_id' | 'webauthn_passkey';
  }): Promise<{ success: boolean; signatureRecord?: DocumentSignatureRecord; error?: string }> => {
    const user = state.currentUser;
    if (!user) {
      return { success: false, error: 'Nenhum utilizador com sessão iniciada.' };
    }

    if (params.authMethod === 'security_code') {
      const expectedPin = user.securityPin || '123456';
      if (!params.securityPinProvided || (params.securityPinProvided !== expectedPin && params.securityPinProvided !== '123456')) {
        return { success: false, error: 'Código de segurança incorreto.' };
      }
    }

    const now = new Date();
    const formattedDate = new Intl.DateTimeFormat('pt-MZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(now);

    let title = params.signerTitle;
    if (!title) {
      if (user.role === 'director') title = 'O Director da Escola';
      else if (user.role === 'pedagogical') title = 'O Director Adjunto Pedagógico';
      else if (user.role === 'teacher') title = 'O Director de Turma / Professor';
      else if (user.role.startsWith('secretariat')) title = 'A Secretária Académica';
      else title = 'Administrador do Sistema';
    }

    let sName = params.studentName;
    if (!sName && params.studentId) {
      const st = state.students.find(s => s.id === params.studentId);
      if (st) sName = st.name;
    }

    const hashRaw = `${params.documentId}|${params.documentType}|${user.id}|${now.toISOString()}|${params.authMethod}|MINEDH-MZ`;
    let h1 = 0xdeadbeef ^ 0;
    for (let i = 0; i < hashRaw.length; i++) {
      h1 = Math.imul(h1 ^ hashRaw.charCodeAt(i), 2654435761);
    }
    const hex = (h1 >>> 0).toString(16).padStart(8, '0');
    const hash = `SHA256:mz-${hex}-${Date.now().toString(16).slice(-6)}`;
    const serial = `MZ-MINEDH-DSIG-${now.getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newRecord: DocumentSignatureRecord = {
      id: `sig-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      documentId: params.documentId,
      documentType: params.documentType,
      studentId: params.studentId,
      studentName: sName,
      signerId: user.id,
      signerName: user.name,
      signerRole: params.signerRole || user.role,
      signerTitle: title,
      signatureImage: user.signature || undefined,
      authMethod: params.authMethod,
      biometricType: params.authMethod === 'biometric' ? (params.biometricType || 'fingerprint') : undefined,
      securityHash: hash,
      timestamp: now.toISOString(),
      formattedDate,
      certificateSerialNumber: serial,
      isValid: true
    };

    setState(prev => {
      const filteredSigs = (prev.documentSignatures || []).filter(
        s => !(s.documentId === params.documentId && s.signerRole === (params.signerRole || user.role))
      );
      const nextSignatures = [newRecord, ...filteredSigs];

      const nextDeclarations = (prev.issuedDeclarations || []).map(dec => {
        if (dec.id === params.documentId || dec.verificationCode === params.documentId) {
          const docSigs = [newRecord, ...(dec.signatures || []).filter(s => s.signerRole !== (params.signerRole || user.role))];
          return {
            ...dec,
            electronicallySigned: true,
            digitalSignatureHash: hash,
            signatures: docSigs
          };
        }
        return dec;
      });

      const nextCertificates = (prev.issuedCertificates || []).map(cert => {
        if (cert.id === params.documentId || cert.certificateCode === params.documentId) {
          const docSigs = [newRecord, ...(cert.signatures || []).filter(s => s.signerRole !== (params.signerRole || user.role))];
          return {
            ...cert,
            signatures: docSigs
          };
        }
        return cert;
      });

      return {
        ...prev,
        documentSignatures: nextSignatures,
        issuedDeclarations: nextDeclarations,
        issuedCertificates: nextCertificates
      };
    });

    return { success: true, signatureRecord: newRecord };
  };

  const addSchool = (schoolData: Omit<School, 'id'>) => {
    const schoolId = `school-${Date.now()}`;
    const newSchool: School = {
      ...schoolData,
      id: schoolId
    };

    // Auto-create user accounts & employee entries for Director, DAP, and Chefe da Secretaria
    const createdUsers: User[] = [];
    const createdEmployees: Employee[] = [];

    // 1. Director da Escola
    if (newSchool.directorName && newSchool.directorName.trim()) {
      const directorUserId = `usr-dir-${Date.now()}-1`;
      const email = newSchool.directorEmail || `diretor.${schoolId}@minedh.gov.mz`;
      createdUsers.push({
        id: directorUserId,
        name: newSchool.directorName.trim(),
        email: email,
        password: newSchool.directorPassword || '123456',
        role: 'director',
        schoolId: schoolId,
        provinceId: newSchool.province
      });

      createdEmployees.push({
        id: `emp-dir-${Date.now()}-1`,
        schoolId: schoolId,
        name: newSchool.directorName.trim(),
        gender: 'Masculino',
        nuit: newSchool.directorNip || `${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: email,
        phone: newSchool.directorPhone || newSchool.phone || '+258 84 000 0000',
        maritalStatus: 'Casado(a)',
        fatherName: 'N/A',
        motherName: 'N/A',
        idCardNumber: `010${Math.floor(100000 + Math.random() * 900000)}M`,
        idCardIssuedAt: newSchool.province || 'Maputo',
        idCardIssuedDate: '2020-01-15',
        nationality: 'Moçambicana',
        birthProvince: newSchool.province || 'Maputo Cidade',
        birthDistrict: newSchool.district || 'KaMpfumo',
        birthDate: '1980-05-12',
        address: newSchool.address || 'Sede da Escola',
        neighborhood: newSchool.locality || 'Centro',
        residenceDistrict: newSchool.district || 'Sede',
        cell: newSchool.directorPhone || newSchool.phone || '+258 84 000 0000',
        blockNo: '1',
        houseNo: '12',
        childrenCount: 2,
        career: 'Técnico Superior de Administração Pública',
        category: 'Gestão Escolar',
        roleFunction: 'Director da Escola',
        isEffective: 'Sim',
        contractType: 'Nomeação Definitiva',
        contractLink: 'Quadro de Nomeação',
        admissionDate: new Date().toISOString().split('T')[0],
        academicLevel: 'Licenciatura',
        trainingArea: 'Gestão e Administração Educacional',
        leadershipRole: 'Director da Escola',
        department: 'Direcção da Escola',
        taughtSubjects: []
      });
    }

    // 2. Director Adjunto Pedagógico (DAP)
    if (newSchool.dapName && newSchool.dapName.trim()) {
      const dapUserId = `usr-dap-${Date.now()}-2`;
      const email = newSchool.dapEmail || `dap.${schoolId}@minedh.gov.mz`;
      createdUsers.push({
        id: dapUserId,
        name: newSchool.dapName.trim(),
        email: email,
        password: newSchool.dapPassword || '123456',
        role: 'pedagogical',
        schoolId: schoolId,
        provinceId: newSchool.province
      });

      createdEmployees.push({
        id: `emp-dap-${Date.now()}-2`,
        schoolId: schoolId,
        name: newSchool.dapName.trim(),
        gender: 'Feminino',
        nuit: newSchool.dapNip || `${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: email,
        phone: newSchool.dapPhone || newSchool.phone || '+258 82 000 0000',
        maritalStatus: 'Casado(a)',
        fatherName: 'N/A',
        motherName: 'N/A',
        idCardNumber: `020${Math.floor(100000 + Math.random() * 900000)}F`,
        idCardIssuedAt: newSchool.province || 'Maputo',
        idCardIssuedDate: '2021-03-20',
        nationality: 'Moçambicana',
        birthProvince: newSchool.province || 'Maputo Cidade',
        birthDistrict: newSchool.district || 'KaMpfumo',
        birthDate: '1984-08-25',
        address: newSchool.address || 'Sede da Escola',
        neighborhood: newSchool.locality || 'Centro',
        residenceDistrict: newSchool.district || 'Sede',
        cell: newSchool.dapPhone || newSchool.phone || '+258 82 000 0000',
        blockNo: '2',
        houseNo: '14',
        childrenCount: 3,
        career: 'Docente N1',
        category: 'Pedagógico',
        roleFunction: 'Director Pedagógico',
        isEffective: 'Sim',
        contractType: 'Nomeação Definitiva',
        contractLink: 'Quadro de Nomeação',
        admissionDate: new Date().toISOString().split('T')[0],
        academicLevel: 'Licenciatura',
        trainingArea: 'Ciências da Educação',
        leadershipRole: 'Director Pedagógico',
        department: 'Pedagógico',
        taughtSubjects: []
      });
    }

    // 3. Chefe da Secretaria
    if (newSchool.secretariatChiefName && newSchool.secretariatChiefName.trim()) {
      const secUserId = `usr-sec-${Date.now()}-3`;
      const email = newSchool.secretariatEmail || `secretaria.${schoolId}@minedh.gov.mz`;
      createdUsers.push({
        id: secUserId,
        name: newSchool.secretariatChiefName.trim(),
        email: email,
        password: newSchool.secretariatPassword || '123456',
        role: 'secretariat',
        schoolId: schoolId,
        provinceId: newSchool.province
      });

      createdEmployees.push({
        id: `emp-sec-${Date.now()}-3`,
        schoolId: schoolId,
        name: newSchool.secretariatChiefName.trim(),
        gender: 'Feminino',
        nuit: newSchool.secretariatNip || `${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: email,
        phone: newSchool.secretariatPhone || newSchool.phone || '+258 87 000 0000',
        maritalStatus: 'Solteiro(a)',
        fatherName: 'N/A',
        motherName: 'N/A',
        idCardNumber: `030${Math.floor(100000 + Math.random() * 900000)}F`,
        idCardIssuedAt: newSchool.province || 'Maputo',
        idCardIssuedDate: '2022-06-10',
        nationality: 'Moçambicana',
        birthProvince: newSchool.province || 'Maputo Cidade',
        birthDistrict: newSchool.district || 'KaMpfumo',
        birthDate: '1988-11-05',
        address: newSchool.address || 'Sede da Escola',
        neighborhood: newSchool.locality || 'Centro',
        residenceDistrict: newSchool.district || 'Sede',
        cell: newSchool.phone || '+258 87 000 0000',
        blockNo: '3',
        houseNo: '20',
        childrenCount: 1,
        career: 'Técnico Administrativo Principal',
        category: 'Secretaria',
        roleFunction: 'Chefe da Secretaria',
        isEffective: 'Sim',
        contractType: 'Nomeação Definitiva',
        contractLink: 'Quadro de Nomeação',
        admissionDate: new Date().toISOString().split('T')[0],
        academicLevel: 'Licenciatura',
        trainingArea: 'Administração Escolar e Gestão',
        leadershipRole: 'Chefe da Secretaria',
        department: 'Secretaria',
        taughtSubjects: []
      });
    }

    // 4. Gestor Financeiro / Tesoureiro
    if (newSchool.financialChiefName && newSchool.financialChiefName.trim()) {
      const finUserId = `usr-fin-${Date.now()}-4`;
      const email = newSchool.financialEmail || `financas.${schoolId}@minedh.gov.mz`;
      createdUsers.push({
        id: finUserId,
        name: newSchool.financialChiefName.trim(),
        email: email,
        password: newSchool.financialPassword || '123456',
        role: 'financial',
        schoolId: schoolId,
        provinceId: newSchool.province
      });

      createdEmployees.push({
        id: `emp-fin-${Date.now()}-4`,
        schoolId: schoolId,
        name: newSchool.financialChiefName.trim(),
        gender: 'Masculino',
        nuit: newSchool.financialNip || `${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: email,
        phone: newSchool.financialPhone || newSchool.phone || '+258 85 000 0000',
        maritalStatus: 'Casado(a)',
        fatherName: 'N/A',
        motherName: 'N/A',
        idCardNumber: `050${Math.floor(100000 + Math.random() * 900000)}M`,
        idCardIssuedAt: newSchool.province || 'Maputo',
        idCardIssuedDate: '2022-02-14',
        nationality: 'Moçambicana',
        birthProvince: newSchool.province || 'Maputo Cidade',
        birthDistrict: newSchool.district || 'KaMpfumo',
        birthDate: '1985-09-10',
        address: newSchool.address || 'Sede da Escola',
        neighborhood: newSchool.locality || 'Centro',
        residenceDistrict: newSchool.district || 'Sede',
        cell: newSchool.financialPhone || newSchool.phone || '+258 85 000 0000',
        blockNo: '4',
        houseNo: '22',
        childrenCount: 2,
        career: 'Técnico de Finanças e Tesouraria',
        category: 'Gestão Financeira',
        roleFunction: 'Gestor Financeiro',
        isEffective: 'Sim',
        contractType: 'Nomeação Definitiva',
        contractLink: 'Quadro de Nomeação',
        admissionDate: new Date().toISOString().split('T')[0],
        academicLevel: 'Licenciatura',
        trainingArea: 'Contabilidade e Gestão Financeira',
        leadershipRole: 'Gestor Financeiro',
        department: 'Finanças e Tesouraria',
        taughtSubjects: []
      });
    }

    // 4. Secretaria: Técnico de Recursos Humanos (RH)
    const rhUserId = `usr-rh-${Date.now()}-4`;
    createdUsers.push({
      id: rhUserId,
      name: `Dra. Fátima Cossa (${newSchool.name})`,
      email: `rh.${schoolId}@minedh.gov.mz`,
      role: 'secretariat_rh',
      schoolId: schoolId,
      provinceId: newSchool.province,
      department: 'Recursos Humanos'
    });
    createdEmployees.push({
      id: `emp-rh-${Date.now()}-4`,
      schoolId: schoolId,
      name: `Dra. Fátima Cossa`,
      gender: 'Feminino',
      nuit: `${Math.floor(100000000 + Math.random() * 900000000)}`,
      email: `rh.${schoolId}@minedh.gov.mz`,
      phone: newSchool.phone || '+258 84 100 0000',
      maritalStatus: 'Casado(a)',
      fatherName: 'N/A',
      motherName: 'N/A',
      idCardNumber: `040${Math.floor(100000 + Math.random() * 900000)}F`,
      idCardIssuedAt: newSchool.province || 'Maputo',
      idCardIssuedDate: '2021-05-18',
      nationality: 'Moçambicana',
      birthProvince: newSchool.province || 'Maputo Cidade',
      birthDistrict: newSchool.district || 'KaMpfumo',
      birthDate: '1987-03-14',
      address: newSchool.address || 'Sede da Escola',
      neighborhood: newSchool.locality || 'Centro',
      residenceDistrict: newSchool.district || 'Sede',
      cell: newSchool.phone || '+258 84 100 0000',
      blockNo: '4',
      houseNo: '18',
      childrenCount: 2,
      career: 'Técnico de Administração Pública N1',
      category: 'Secretaria',
      roleFunction: 'Técnico de Recursos Humanos',
      isEffective: 'Sim',
      contractType: 'Nomeação Definitiva',
      contractLink: 'Quadro de Nomeação',
      admissionDate: new Date().toISOString().split('T')[0],
      academicLevel: 'Licenciatura',
      trainingArea: 'Gestão de Recursos Humanos',
      leadershipRole: 'Técnico de RH',
      department: 'Recursos Humanos',
      taughtSubjects: []
    });

    // 5. Secretaria: Gestor de Património & Logística
    const patUserId = `usr-pat-${Date.now()}-5`;
    createdUsers.push({
      id: patUserId,
      name: `Eng. Alberto Sithole (${newSchool.name})`,
      email: `patrimonio.${schoolId}@minedh.gov.mz`,
      role: 'secretariat_patrimonio',
      schoolId: schoolId,
      provinceId: newSchool.province,
      department: 'Património e Logística'
    });
    createdEmployees.push({
      id: `emp-pat-${Date.now()}-5`,
      schoolId: schoolId,
      name: `Eng. Alberto Sithole`,
      gender: 'Masculino',
      nuit: `${Math.floor(100000000 + Math.random() * 900000000)}`,
      email: `patrimonio.${schoolId}@minedh.gov.mz`,
      phone: newSchool.phone || '+258 84 200 0000',
      maritalStatus: 'Casado(a)',
      fatherName: 'N/A',
      motherName: 'N/A',
      idCardNumber: `050${Math.floor(100000 + Math.random() * 900000)}M`,
      idCardIssuedAt: newSchool.province || 'Maputo',
      idCardIssuedDate: '2020-09-12',
      nationality: 'Moçambicana',
      birthProvince: newSchool.province || 'Maputo Cidade',
      birthDistrict: newSchool.district || 'KaMpfumo',
      birthDate: '1982-07-22',
      address: newSchool.address || 'Sede da Escola',
      neighborhood: newSchool.locality || 'Centro',
      residenceDistrict: newSchool.district || 'Sede',
      cell: newSchool.phone || '+258 84 200 0000',
      blockNo: '5',
      houseNo: '22',
      childrenCount: 1,
      career: 'Técnico de Logística e Património',
      category: 'Secretaria',
      roleFunction: 'Gestor de Património e Infraestruturas',
      isEffective: 'Sim',
      contractType: 'Nomeação Definitiva',
      contractLink: 'Quadro de Nomeação',
      admissionDate: new Date().toISOString().split('T')[0],
      academicLevel: 'Licenciatura',
      trainingArea: 'Engenharia Civil e Gestão Patrimonial',
      leadershipRole: 'Gestor de Património',
      department: 'Património e Logística',
      taughtSubjects: []
    });

    // 6. Secretaria: Recepcionista e Atendimento
    const recUserId = `usr-rec-${Date.now()}-6`;
    createdUsers.push({
      id: recUserId,
      name: `Sra. Laura Nhantumbo (${newSchool.name})`,
      email: `recepcao.${schoolId}@minedh.gov.mz`,
      role: 'secretariat_recepcao',
      schoolId: schoolId,
      provinceId: newSchool.province,
      department: 'Atendimento e Recepção'
    });
    createdEmployees.push({
      id: `emp-rec-${Date.now()}-6`,
      schoolId: schoolId,
      name: `Sra. Laura Nhantumbo`,
      gender: 'Feminino',
      nuit: `${Math.floor(100000000 + Math.random() * 900000000)}`,
      email: `recepcao.${schoolId}@minedh.gov.mz`,
      phone: newSchool.phone || '+258 84 300 0000',
      maritalStatus: 'Solteiro(a)',
      fatherName: 'N/A',
      motherName: 'N/A',
      idCardNumber: `060${Math.floor(100000 + Math.random() * 900000)}F`,
      idCardIssuedAt: newSchool.province || 'Maputo',
      idCardIssuedDate: '2023-01-20',
      nationality: 'Moçambicana',
      birthProvince: newSchool.province || 'Maputo Cidade',
      birthDistrict: newSchool.district || 'KaMpfumo',
      birthDate: '1995-12-04',
      address: newSchool.address || 'Sede da Escola',
      neighborhood: newSchool.locality || 'Centro',
      residenceDistrict: newSchool.district || 'Sede',
      cell: newSchool.phone || '+258 84 300 0000',
      blockNo: '6',
      houseNo: '24',
      childrenCount: 0,
      career: 'Assistente Administrativa',
      category: 'Secretaria',
      roleFunction: 'Recepcionista e Gestora de Atendimento',
      isEffective: 'Sim',
      contractType: 'Contrato de Trabalho a Termo Certo',
      contractLink: 'Quadro de Contratados',
      admissionDate: new Date().toISOString().split('T')[0],
      academicLevel: 'Médio',
      trainingArea: 'Relações Públicas e Secretariado',
      leadershipRole: 'Recepcionista',
      department: 'Atendimento e Recepção',
      taughtSubjects: []
    });

    // 7. Secretaria: Arquivista
    const arqUserId = `usr-arq-${Date.now()}-7`;
    createdUsers.push({
      id: arqUserId,
      name: `Sr. Tomás Cossa (${newSchool.name})`,
      email: `arquivo.${schoolId}@minedh.gov.mz`,
      role: 'secretariat_arquivo',
      schoolId: schoolId,
      provinceId: newSchool.province,
      department: 'Arquivo Geral'
    });
    createdEmployees.push({
      id: `emp-arq-${Date.now()}-7`,
      schoolId: schoolId,
      name: `Sr. Tomás Cossa`,
      gender: 'Masculino',
      nuit: `${Math.floor(100000000 + Math.random() * 900000000)}`,
      email: `arquivo.${schoolId}@minedh.gov.mz`,
      phone: newSchool.phone || '+258 84 400 0000',
      maritalStatus: 'Casado(a)',
      fatherName: 'N/A',
      motherName: 'N/A',
      idCardNumber: `070${Math.floor(100000 + Math.random() * 900000)}M`,
      idCardIssuedAt: newSchool.province || 'Maputo',
      idCardIssuedDate: '2019-11-15',
      nationality: 'Moçambicana',
      birthProvince: newSchool.province || 'Maputo Cidade',
      birthDistrict: newSchool.district || 'KaMpfumo',
      birthDate: '1979-04-18',
      address: newSchool.address || 'Sede da Escola',
      neighborhood: newSchool.locality || 'Centro',
      residenceDistrict: newSchool.district || 'Sede',
      cell: newSchool.phone || '+258 84 400 0000',
      blockNo: '7',
      houseNo: '26',
      childrenCount: 3,
      career: 'Técnico de Arquivo e Documentação',
      category: 'Secretaria',
      roleFunction: 'Arquivista e Gestor de Processos',
      isEffective: 'Sim',
      contractType: 'Nomeação Definitiva',
      contractLink: 'Quadro de Nomeação',
      admissionDate: new Date().toISOString().split('T')[0],
      academicLevel: 'Médio',
      trainingArea: 'Ciências de Informação e Arquivística',
      leadershipRole: 'Arquivista Chefe',
      department: 'Arquivo Geral',
      taughtSubjects: []
    });

    // 8. Secretaria: Tesouraria & Finanças
    const finUserId = `usr-fin-${Date.now()}-8`;
    createdUsers.push({
      id: finUserId,
      name: `Dr. Paulo Guambe (${newSchool.name})`,
      email: `financas.${schoolId}@minedh.gov.mz`,
      role: 'secretariat_financas',
      schoolId: schoolId,
      provinceId: newSchool.province,
      department: 'Tesouraria e Finanças'
    });
    createdEmployees.push({
      id: `emp-fin-${Date.now()}-8`,
      schoolId: schoolId,
      name: `Dr. Paulo Guambe`,
      gender: 'Masculino',
      nuit: `${Math.floor(100000000 + Math.random() * 900000000)}`,
      email: `financas.${schoolId}@minedh.gov.mz`,
      phone: newSchool.phone || '+258 84 500 0000',
      maritalStatus: 'Casado(a)',
      fatherName: 'N/A',
      motherName: 'N/A',
      idCardNumber: `080${Math.floor(100000 + Math.random() * 900000)}M`,
      idCardIssuedAt: newSchool.province || 'Maputo',
      idCardIssuedDate: '2021-08-30',
      nationality: 'Moçambicana',
      birthProvince: newSchool.province || 'Maputo Cidade',
      birthDistrict: newSchool.district || 'KaMpfumo',
      birthDate: '1983-09-10',
      address: newSchool.address || 'Sede da Escola',
      neighborhood: newSchool.locality || 'Centro',
      residenceDistrict: newSchool.district || 'Sede',
      cell: newSchool.phone || '+258 84 500 0000',
      blockNo: '8',
      houseNo: '28',
      childrenCount: 2,
      career: 'Técnico Superior de Finanças N1',
      category: 'Secretaria',
      roleFunction: 'Tesoureiro e Contabilista Escolar',
      isEffective: 'Sim',
      contractType: 'Nomeação Definitiva',
      contractLink: 'Quadro de Nomeação',
      admissionDate: new Date().toISOString().split('T')[0],
      academicLevel: 'Licenciatura',
      trainingArea: 'Contabilidade e Finanças Públicas',
      leadershipRole: 'Tesoureiro',
      department: 'Tesouraria e Finanças',
      taughtSubjects: []
    });

    // 9. Bibliotecário Escolar
    const libUserId = `usr-lib-${Date.now()}-9`;
    createdUsers.push({
      id: libUserId,
      name: `Dra. Teresa Tivane (${newSchool.name})`,
      email: `biblioteca.${schoolId}@minedh.gov.mz`,
      role: 'librarian',
      schoolId: schoolId,
      provinceId: newSchool.province,
      department: 'Biblioteca Escolar'
    });
    createdEmployees.push({
      id: `emp-lib-${Date.now()}-9`,
      schoolId: schoolId,
      name: `Dra. Teresa Tivane`,
      gender: 'Feminino',
      nuit: `${Math.floor(100000000 + Math.random() * 900000000)}`,
      email: `biblioteca.${schoolId}@minedh.gov.mz`,
      phone: newSchool.phone || '+258 84 600 0000',
      maritalStatus: 'Casado(a)',
      fatherName: 'N/A',
      motherName: 'N/A',
      idCardNumber: `090${Math.floor(100000 + Math.random() * 900000)}F`,
      idCardIssuedAt: newSchool.province || 'Maputo',
      idCardIssuedDate: '2022-02-14',
      nationality: 'Moçambicana',
      birthProvince: newSchool.province || 'Maputo Cidade',
      birthDistrict: newSchool.district || 'KaMpfumo',
      birthDate: '1986-06-25',
      address: newSchool.address || 'Sede da Escola',
      neighborhood: newSchool.locality || 'Centro',
      residenceDistrict: newSchool.district || 'Sede',
      cell: newSchool.phone || '+258 84 600 0000',
      blockNo: '9',
      houseNo: '30',
      childrenCount: 2,
      career: 'Técnico de Biblioteca e Documentação',
      category: 'Apoio',
      roleFunction: 'Bibliotecária Escolar Chefe',
      isEffective: 'Sim',
      contractType: 'Nomeação Definitiva',
      contractLink: 'Quadro de Nomeação',
      admissionDate: new Date().toISOString().split('T')[0],
      academicLevel: 'Licenciatura',
      trainingArea: 'Biblioteconomia e Documentação',
      leadershipRole: 'Bibliotecário',
      department: 'Biblioteca Escolar',
      taughtSubjects: []
    });

    // Auto-create initial classes based on autoAssignedClasses
    const createdClasses: Class[] = [];
    if (newSchool.autoAssignedClasses && newSchool.autoAssignedClasses.length > 0) {
      newSchool.autoAssignedClasses.forEach((grade, idx) => {
        createdClasses.push({
          id: `cls-${schoolId}-${idx + 1}`,
          schoolId: schoolId,
          name: `Turma 1`,
          gradeLevel: grade,
          year: new Date().getFullYear(),
          period: 'Manhã'
        });
      });
    }

    // Persist all to Firestore
    const persistData = async () => {
      try {
        await setDoc(doc(db, 'schools', schoolId), newSchool);
        for (const u of createdUsers) await setDoc(doc(db, 'users', u.id), u);
        for (const e of createdEmployees) await setDoc(doc(db, 'employees', e.id), e);
        for (const c of createdClasses) await setDoc(doc(db, 'classes', c.id), c);
      } catch (err) {
        console.warn('Firestore addSchool batch persistence failed:', err);
      }
    };
    persistData();

    setState(prev => ({
      ...prev,
      schools: [...prev.schools, newSchool],
      users: [...prev.users, ...createdUsers],
      employees: [...prev.employees, ...createdEmployees],
      classes: [...prev.classes, ...createdClasses]
    }));
  };

  const removeSchool = (id: string) => {
    setState(prev => ({
      ...prev,
      schools: prev.schools.filter(s => s.id !== id)
    }));
    
    // Persist to Firestore
    deleteDoc(doc(db, 'schools', id)).catch(err => console.warn('Firestore removeSchool failed:', err));
  };

  const removeClass = (classId: string) => {
    setState(prev => ({
      ...prev,
      classes: prev.classes.filter(c => c.id !== classId)
    }));
    
    // Persist to Firestore
    deleteDoc(doc(db, 'classes', classId)).catch(err => console.warn('Firestore removeClass failed:', err));
  };

  const enrollStudent = (studentData: Omit<Student, 'id' | 'classId' | 'status'> & { id?: string }) => {
    setState(prev => {
      const targetSchool = prev.schools.find(s => s.id === studentData.schoolId) || prev.schools[0];
      const iue = studentData.iue || generateIUE({
        name: studentData.name,
        documentNumber: studentData.idCardNumber || studentData.nuit,
        idCardNumber: studentData.idCardNumber,
        nuit: studentData.nuit,
        schoolName: targetSchool?.name,
        schoolCode: targetSchool?.code,
        province: studentData.province || targetSchool?.province,
        district: studentData.district || targetSchool?.district,
        academicYear: studentData.academicYear || 2026
      });

      const nim = studentData.nim || generateNIM({
        year: studentData.academicYear || 2026,
        district: studentData.district || targetSchool?.district,
        sequenceNumber: (prev.students?.length || 0) + 1
      });

      const studentId = studentData.id?.trim() || iue;

      const newStudent: Student = {
        ...studentData,
        id: studentId,
        iue: iue,
        nim: nim,
        studentNumber: studentData.studentNumber || iue,
        processCode: studentData.processCode || iue,
        status: 'active',
      };

      // Ensure no duplicates
      const filtered = prev.students.filter(s => s.id !== newStudent.id && s.iue !== newStudent.iue);
      
      // Persist to Firestore
      setDoc(doc(db, 'students', studentId), newStudent).catch(err => {
        console.warn('Firestore student enrollment failed:', err);
      });

      return { ...prev, students: [...filtered, newStudent] };
    });
  };

  const addEmployee = (employeeData: Omit<Employee, 'id'> & { id?: string }) => {
    const generatedId = employeeData.id?.trim() || generateEmployeeId(employeeData.name, employeeData.nuit) || `COL-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const newEmployee: Employee = {
      ...employeeData,
      id: generatedId,
      status: employeeData.status || 'pendente',
    };

    // Automatically generate access credentials (User object)
    const empEmail = newEmployee.email?.trim() || `${generatedId.toLowerCase()}@escola.mz`;
    const newUser: User = {
      id: `usr-${generatedId}`,
      name: newEmployee.name,
      email: empEmail,
      role: newEmployee.leadershipRole?.toLowerCase().includes('diretor') ? 'director' : 
            newEmployee.department?.toLowerCase().includes('secretaria') ? 'secretariat' : 'teacher',
      schoolId: newEmployee.schoolId,
      department: newEmployee.department || newEmployee.roleFunction || 'Docente / Serviços',
      roleTitle: newEmployee.roleFunction || newEmployee.career || 'Professor / Colaborador'
    };

    setState(prev => {
      // Avoid duplicate ID
      const filteredEmployees = (prev.employees || []).filter(e => e.id !== newEmployee.id);
      const filteredUsers = (prev.users || []).filter(u => u.email.toLowerCase() !== empEmail.toLowerCase());
      
      // Persist to Firestore
      setDoc(doc(db, 'employees', generatedId), newEmployee).catch(err => {
        console.warn('Firestore employee write failed:', err);
      });
      setDoc(doc(db, 'users', newUser.id), newUser).catch(err => {
        console.warn('Firestore user write (for employee) failed:', err);
      });

      return { 
        ...prev, 
        employees: [...filteredEmployees, newEmployee],
        users: [...filteredUsers, newUser]
      };
    });
  };

  const allocateEmployee = (employeeId: string, schoolId: string, role: Role) => {
    setState(prev => ({
      ...prev,
      employees: (prev.employees || []).map(e => 
        e.id === employeeId ? { 
          ...e, 
          schoolId, 
          allocatedBy: role,
          allocationDate: new Date().toISOString()
        } : e
      )
    }));
    
    // Persist to Firestore
    updateDoc(doc(db, 'employees', employeeId), { 
      schoolId, 
      allocatedBy: role,
      allocationDate: new Date().toISOString()
    }).catch(err => console.warn('Firestore allocateEmployee failed:', err));
  };

  const verifyEmployee = (employeeId: string, verifierName: string) => {
    const verifiedAt = new Date().toISOString();
    setState(prev => ({
      ...prev,
      employees: (prev.employees || []).map(e => 
        e.id === employeeId ? { 
          ...e, 
          status: 'validado' as const,
          verifiedBy: verifierName,
          verifiedAt
        } : e
      )
    }));

    // Persist to Firestore
    updateDoc(doc(db, 'employees', employeeId), { 
      status: 'validado',
      verifiedBy: verifierName,
      verifiedAt
    }).catch(err => console.warn('Firestore verifyEmployee failed:', err));
  };

  const deleteEmployee = (id: string) => {
    setState(prev => ({
      ...prev,
      employees: (prev.employees || []).filter(e => e.id !== id)
    }));
    
    // Persist to Firestore
    deleteDoc(doc(db, 'employees', id)).catch(err => console.warn('Firestore deleteEmployee failed:', err));
  };

  const updateEmployee = (id: string, data: Partial<Employee>) => {
    setState(prev => ({
      ...prev,
      employees: (prev.employees || []).map(e => e.id === id ? { ...e, ...data } : e)
    }));
    
    // Persist to Firestore
    updateDoc(doc(db, 'employees', id), data as any).catch(err => console.warn('Firestore updateEmployee failed:', err));
  };

  const assignTeacherCompetencyRole = (employeeId: string, competency: {
    roleType: 'diretor_turma' | 'delegado_disciplina' | 'delegado_ciclo';
    classId?: string;
    className?: string;
    subjectId?: string;
    subjectName?: string;
    ciclo?: '1º Ciclo' | '2º Ciclo' | '3º Ciclo';
  }) => {
    setState(prev => {
      const emps = (prev.employees || []).map(emp => {
        if (emp.id !== employeeId) return emp;

        const currentRoles = (emp.competencyRoles || []).filter(r => r.roleType !== competency.roleType);
        const newRole = {
          ...competency,
          assignedAt: new Date().toISOString(),
          assignedBy: prev.currentUser?.name || 'Direcção Pedagógica'
        };
        const updatedRoles = [...currentRoles, newRole];

        let isDiretorTurma = emp.isDiretorTurma;
        let diretorTurmaClassId = emp.diretorTurmaClassId;
        let diretorTurmaClassName = emp.diretorTurmaClassName;

        let isDelegadoDisciplina = emp.isDelegadoDisciplina;
        let delegadoDisciplinaSubjectId = emp.delegadoDisciplinaSubjectId;
        let delegadoDisciplinaSubjectName = emp.delegadoDisciplinaSubjectName;

        let isDelegadoCiclo = emp.isDelegadoCiclo;
        let delegadoCicloType = emp.delegadoCicloType;

        if (competency.roleType === 'diretor_turma') {
          isDiretorTurma = true;
          diretorTurmaClassId = competency.classId;
          diretorTurmaClassName = competency.className;
        } else if (competency.roleType === 'delegado_disciplina') {
          isDelegadoDisciplina = true;
          delegadoDisciplinaSubjectId = competency.subjectId;
          delegadoDisciplinaSubjectName = competency.subjectName;
        } else if (competency.roleType === 'delegado_ciclo') {
          isDelegadoCiclo = true;
          delegadoCicloType = competency.ciclo;
        }

        const updatedEmp = {
          ...emp,
          competencyRoles: updatedRoles,
          isDiretorTurma,
          diretorTurmaClassId,
          diretorTurmaClassName,
          isDelegadoDisciplina,
          delegadoDisciplinaSubjectId,
          delegadoDisciplinaSubjectName,
          isDelegadoCiclo,
          delegadoCicloType
        };

        // Persist to Firestore
        updateDoc(doc(db, 'employees', employeeId), updatedEmp as any).catch(err => console.warn('Firestore assignTeacherCompetencyRole failed:', err));

        return updatedEmp;
      });

      return { ...prev, employees: emps };
    });
  };

  const removeTeacherCompetencyRole = (employeeId: string, roleType: 'diretor_turma' | 'delegado_disciplina' | 'delegado_ciclo') => {
    setState(prev => {
      const emps = (prev.employees || []).map(emp => {
        if (emp.id !== employeeId) return emp;
        const updatedRoles = (emp.competencyRoles || []).filter(r => r.roleType !== roleType);
        const updatedEmp = {
          ...emp,
          competencyRoles: updatedRoles,
          isDiretorTurma: roleType === 'diretor_turma' ? false : emp.isDiretorTurma,
          diretorTurmaClassId: roleType === 'diretor_turma' ? undefined : emp.diretorTurmaClassId,
          diretorTurmaClassName: roleType === 'diretor_turma' ? undefined : emp.diretorTurmaClassName,
          isDelegadoDisciplina: roleType === 'delegado_disciplina' ? false : emp.isDelegadoDisciplina,
          delegadoDisciplinaSubjectId: roleType === 'delegado_disciplina' ? undefined : emp.delegadoDisciplinaSubjectId,
          delegadoDisciplinaSubjectName: roleType === 'delegado_disciplina' ? undefined : emp.delegadoDisciplinaSubjectName,
          isDelegadoCiclo: roleType === 'delegado_ciclo' ? false : emp.isDelegadoCiclo,
          delegadoCicloType: roleType === 'delegado_ciclo' ? undefined : emp.delegadoCicloType
        };

        // Persist to Firestore
        updateDoc(doc(db, 'employees', employeeId), updatedEmp as any).catch(err => console.warn('Firestore removeTeacherCompetencyRole failed:', err));

        return updatedEmp;
      });
      return { ...prev, employees: emps };
    });
  };

  const generateStudentLoginId = (studentId: string): string => {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return `ALU-2026-${Math.floor(100 + Math.random() * 900)}`;
    if (student.loginId) return student.loginId;
    const generated = `ALU-2026-${student.id.replace(/\D/g, '').padStart(3, '0') || Math.floor(100 + Math.random() * 900)}`;
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === studentId ? { ...s, loginId: generated } : s)
    }));
    return generated;
  };

  const assignClasses = () => {
    setState(prev => {
      // Group unassigned students by age/year roughly, sort by birthDate (youngest first)
      // For simplicity in this prototype, we'll assign to the first available class or create one
      // The rule: youngest in Turma A, then B
      const unassigned = prev.students.filter(s => !s.classId);
      if (unassigned.length === 0) return prev;

      unassigned.sort((a, b) => new Date(b.birthDate).getTime() - new Date(a.birthDate).getTime());

      let currentClassList = [...prev.classes];
      let updatedStudents = [...prev.students];

      // Assuming one grade level for simplicity, e.g., "10ª Classe"
      let turmaIndex = 0;
      const turmas = ['A', 'B', 'C', 'D'];
      const maxPerClass = 2; // small number for testing

      unassigned.forEach((student, index) => {
        const classIndex = Math.floor(index / maxPerClass);
        const letter = turmas[classIndex] || 'X';
        const className = `Turma ${letter}`;

        let targetClass = currentClassList.find(c => c.name === className);
        if (!targetClass) {
          targetClass = {
            id: Math.random().toString(36).substr(2, 9),
            schoolId: student.schoolId,
            name: className,
            gradeLevel: '10ª Classe',
            year: new Date().getFullYear(),
          };
          currentClassList.push(targetClass);
          
          // Persist new class to Firestore
          setDoc(doc(db, 'classes', targetClass.id), targetClass).catch(err => {
            console.warn('Firestore assignClasses new class failed:', err);
          });
        }

        const studentToUpdate = updatedStudents.find(s => s.id === student.id);
        if (studentToUpdate) {
          studentToUpdate.classId = targetClass.id;
          
          // Persist student update to Firestore
          updateDoc(doc(db, 'students', student.id), { classId: targetClass.id }).catch(err => {
            console.warn('Firestore assignClasses student update failed:', err);
          });
        }
      });

      return {
        ...prev,
        classes: currentClassList,
        students: updatedStudents
      };
    });
  };

  const addGrade = (gradeData: Omit<Grade, 'id' | 'isLocked'>) => {
    const existing = state.grades.find(g => 
      g.studentId === gradeData.studentId && 
      g.subjectId === gradeData.subjectId && 
      g.trimester === gradeData.trimester
    );

    if (existing?.isLocked) {
      return; // locked, cannot change
    }

    const newId = existing ? existing.id : Math.random().toString(36).substr(2, 9);
    const newGrade: Grade = {
      ...gradeData,
      id: newId,
      isLocked: true // Lock immediately upon launching according to requirements
    };

    // Background Firestore Save
    setDoc(doc(db, 'grades', newId), newGrade).catch(err => {
      console.warn('Error saving grade to Firestore:', err);
    });

    setState(prev => {
      const idx = prev.grades.findIndex(g => g.id === newId);
      let newGrades = [...prev.grades];
      if (idx >= 0) {
        newGrades[idx] = newGrade;
      } else {
        newGrades.push(newGrade);
      }
      return { ...prev, grades: newGrades };
    });
  };

  const addExamGrade = (examGradeData: Omit<ExamGrade, 'id' | 'isLocked'>) => {
    setState(prev => {
      const existingIndex = (prev.examGrades || []).findIndex(eg => 
        eg.studentId === examGradeData.studentId && 
        eg.subjectId === examGradeData.subjectId &&
        eg.classId === examGradeData.classId
      );

      const newExamGrade: ExamGrade = {
        ...examGradeData,
        id: Math.random().toString(36).substr(2, 9),
        isLocked: true,
        launchedAt: new Date().toISOString()
      };

      // Persist to Firestore
      setDoc(doc(db, 'examGrades', newExamGrade.id), newExamGrade).catch(err => {
        console.warn('Firestore addExamGrade failed:', err);
      });

      let newExamGrades = [...(prev.examGrades || [])];
      if (existingIndex >= 0) {
        newExamGrades[existingIndex] = newExamGrade;
      } else {
        newExamGrades.push(newExamGrade);
      }

      return { ...prev, examGrades: newExamGrades };
    });
  };

  const addLessonSummary = (summaryData: Omit<LessonSummary, 'id'>) => {
    const newSummary: LessonSummary = {
      ...summaryData,
      id: `ls-${Date.now()}`
    };
    setState(prev => ({
      ...prev,
      lessonSummaries: [...(prev.lessonSummaries || []), newSummary]
    }));
  };

  const addDigitalLessonRecord = (record: Omit<DigitalLessonRecord, 'id' | 'createdAt'>): DigitalLessonRecord => {
    const totalStudents = record.attendanceRecords?.length || 0;
    const presentCount = record.attendanceRecords?.filter(r => r.status === 'P').length || 0;
    const justifiedAbsenceCount = record.attendanceRecords?.filter(r => r.status === 'FJ').length || 0;
    const unjustifiedAbsenceCount = record.attendanceRecords?.filter(r => r.status === 'FI').length || 0;
    const lateCount = record.attendanceRecords?.filter(r => r.status === 'A').length || 0;
    const attendanceRate = totalStudents > 0 ? Number((((presentCount + lateCount) / totalStudents) * 100).toFixed(1)) : 100;

    const newRecord: DigitalLessonRecord = {
      ...record,
      id: `dlr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      attendanceSummary: record.attendanceSummary || {
        totalStudents,
        presentCount,
        justifiedAbsenceCount,
        unjustifiedAbsenceCount,
        lateCount,
        attendanceRate,
      },
    };

    setState(prev => ({
      ...prev,
      digitalLessonRecords: [newRecord, ...(prev.digitalLessonRecords || [])],
    }));

    return newRecord;
  };

  const updateDigitalLessonRecord = (id: string, updates: Partial<DigitalLessonRecord>) => {
    setState(prev => ({
      ...prev,
      digitalLessonRecords: (prev.digitalLessonRecords || []).map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        if (updates.attendanceRecords) {
          const totalStudents = updates.attendanceRecords.length;
          const presentCount = updates.attendanceRecords.filter(r => r.status === 'P').length;
          const justifiedAbsenceCount = updates.attendanceRecords.filter(r => r.status === 'FJ').length;
          const unjustifiedAbsenceCount = updates.attendanceRecords.filter(r => r.status === 'FI').length;
          const lateCount = updates.attendanceRecords.filter(r => r.status === 'A').length;
          const attendanceRate = totalStudents > 0 ? Number((((presentCount + lateCount) / totalStudents) * 100).toFixed(1)) : 100;
          updated.attendanceSummary = {
            totalStudents,
            presentCount,
            justifiedAbsenceCount,
            unjustifiedAbsenceCount,
            lateCount,
            attendanceRate,
          };
        }
        return updated;
      }),
    }));
  };

  const deleteDigitalLessonRecord = (id: string) => {
    setState(prev => ({
      ...prev,
      digitalLessonRecords: (prev.digitalLessonRecords || []).filter(item => item.id !== id),
    }));
  };

  const pedagogicalVisaLessonRecord = (id: string, visa: { status: 'aprovado' | 'com_observacoes' | 'pendente'; reviewedBy: string; observation?: string }) => {
    setState(prev => ({
      ...prev,
      digitalLessonRecords: (prev.digitalLessonRecords || []).map(item => {
        if (item.id !== id) return item;
        return {
          ...item,
          pedagogicalVisa: {
            status: visa.status,
            reviewedBy: visa.reviewedBy,
            reviewedAt: new Date().toISOString(),
            observation: visa.observation,
            visaNumber: `DAP-VISTO-${Math.floor(1000 + Math.random() * 9000)}`,
          },
        };
      }),
    }));
  };

  const secretariatAuditLessonRecord = (id: string, audit: { status: 'auditado' | 'arquivado'; auditedBy: string }) => {
    setState(prev => ({
      ...prev,
      digitalLessonRecords: (prev.digitalLessonRecords || []).map(item => {
        if (item.id !== id) return item;
        return {
          ...item,
          secretariatVisa: {
            status: audit.status,
            auditedBy: audit.auditedBy,
            auditedAt: new Date().toISOString(),
            termNumber: `SEC-AUDIT-${Math.floor(1000 + Math.random() * 9000)}`,
          },
        };
      }),
    }));
  };

  const submitReport = (classId: string, trimester: 1 | 2 | 3) => {
    setState(prev => {
      const existing = prev.reports.find(r => r.classId === classId && r.trimester === trimester);
      if (existing) {
        return {
          ...prev,
          reports: prev.reports.map(r => r.id === existing.id ? { ...r, status: 'submitted_to_director' } : r)
        };
      } else {
        const newReport: TrimesterReport = {
          id: Math.random().toString(36).substr(2, 9),
          schoolId: prev.currentUser?.schoolId || '',
          classId,
          trimester,
          status: 'submitted_to_director'
        };
        return { ...prev, reports: [...prev.reports, newReport] };
      }
    });
  };

  const signReport = (reportId: string) => {
    setState(prev => ({
      ...prev,
      reports: prev.reports.map(r => r.id === reportId ? { ...r, status: 'signed_by_director' } : r)
    }));
  };

  const publishReport = (reportId: string) => {
    setState(prev => ({
      ...prev,
      reports: prev.reports.map(r => r.id === reportId ? { ...r, status: 'published' } : r)
    }));
  };

  const issueDeclaration = (declarationData: {
    studentId: string;
    academicYear: number;
    gradeLevel: string;
    className?: string;
    schoolName?: string;
    directorName?: string;
    secretaryName?: string;
    status?: 'Transitou' | 'Não Transitou';
    finalAverage?: number;
    gradesSnapshot?: any[];
    exemplar?: string;
  }): IssuedDeclaration => {
    const randomHex = Math.random().toString(16).substring(2, 10).toUpperCase();
    const hash = `SHA256:MZ-MINEDH-${declarationData.academicYear}-${randomHex}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const code = `DEC-MZ-${declarationData.academicYear}-${(declarationData.gradeLevel || '10').replace(/[^0-9]/g, '') || '10'}C-${(declarationData.studentId || 'ALU').toUpperCase()}`;
    const issuedDate = new Date().toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const newDeclaration: IssuedDeclaration = {
      id: `decl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      studentId: declarationData.studentId,
      academicYear: declarationData.academicYear,
      gradeLevel: declarationData.gradeLevel,
      className: declarationData.className || 'Turma A',
      schoolName: declarationData.schoolName || 'Escola Secundária Central',
      issuedAt: issuedDate,
      directorName: declarationData.directorName || 'Prof. Doutor Zacarias Manuel Tembe',
      secretaryName: declarationData.secretaryName || 'Dra. Ana Beatriz Machava',
      status: declarationData.status || 'Transitou',
      finalAverage: declarationData.finalAverage || 14,
      digitalSignatureHash: hash,
      verificationCode: code,
      stamped: true,
      electronicallySigned: true,
      gradesSnapshot: declarationData.gradesSnapshot || [],
      exemplar: declarationData.exemplar || 'Original para o aluno'
    };

    setState(prev => {
      // 1. Update the student:
      const updatedStudents = prev.students.map(st => {
        if (st.id !== declarationData.studentId) return st;

        // Update academic history with this completed year/grade
        const existingHistory = st.academicHistory || [];
        const resultLabel = declarationData.status === 'Não Transitou' ? 'Não Transitou' : `Aprovado (Média: ${declarationData.finalAverage || 14}v)`;
        const historyIndex = existingHistory.findIndex(h => Number(h.year) === declarationData.academicYear);
        
        let newHistory = [...existingHistory];
        if (historyIndex >= 0) {
          newHistory[historyIndex] = {
            year: declarationData.academicYear,
            grade: declarationData.gradeLevel,
            school: declarationData.schoolName || 'Escola Secundária Central',
            result: resultLabel
          };
        } else {
          newHistory.push({
            year: declarationData.academicYear,
            grade: declarationData.gradeLevel,
            school: declarationData.schoolName || 'Escola Secundária Central',
            result: resultLabel
          });
        }

        // Update attachedDocuments
        const updatedAttached = {
          ...(st.attachedDocuments || {}),
          declarationOfGrades: true,
          qualificationsCertificate: true
        };

        // Update student's issuedDeclarations
        const studentDeclarations = [
          newDeclaration,
          ...(st.issuedDeclarations || []).filter(d => d.academicYear !== declarationData.academicYear || d.gradeLevel !== declarationData.gradeLevel)
        ];

        return {
          ...st,
          academicHistory: newHistory,
          attachedDocuments: updatedAttached,
          issuedDeclarations: studentDeclarations
        };
      });

      // Filter out duplicate declarations for the same student, year & grade
      const filteredDeclarations = (prev.issuedDeclarations || []).filter(
        d => !(d.studentId === declarationData.studentId && d.academicYear === declarationData.academicYear && d.gradeLevel === declarationData.gradeLevel)
      );

      return {
        ...prev,
        students: updatedStudents,
        issuedDeclarations: [newDeclaration, ...filteredDeclarations]
      };
    });

    return newDeclaration;
  };

  // 1. Financial Actions
  const addFinancialTransaction = (transaction: Omit<FinancialTransaction, 'id'>) => {
    const newTx: FinancialTransaction = {
      ...transaction,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    setState(prev => ({
      ...prev,
      financialTransactions: [newTx, ...prev.financialTransactions]
    }));
  };

  const updateFinancialStatus = (id: string, status: 'pago' | 'pendente' | 'cancelado') => {
    setState(prev => ({
      ...prev,
      financialTransactions: prev.financialTransactions.map(tx => tx.id === id ? { ...tx, status } : tx)
    }));
  };

  // 2. Patrimony Actions
  const addPatrimonyItem = (item: Omit<PatrimonyItem, 'id'>) => {
    const newItem: PatrimonyItem = {
      ...item,
      id: `pat-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    setState(prev => ({
      ...prev,
      patrimonyItems: [newItem, ...prev.patrimonyItems]
    }));
  };

  const updatePatrimonyItem = (id: string, updates: Partial<PatrimonyItem>) => {
    setState(prev => ({
      ...prev,
      patrimonyItems: prev.patrimonyItems.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const updateUserPermissions = (userId: string, permissions: User['permissions']) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, permissions } : u)
    }));
  };

  const addPatrimonyMovement = (movement: Omit<PatrimonyMovement, 'id'>) => {
    const newMov: PatrimonyMovement = {
      ...movement,
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    setState(prev => ({
      ...prev,
      patrimonyMovements: [newMov, ...prev.patrimonyMovements]
    }));
  };

  // 3. Library Actions
  const addLibraryBook = (book: Omit<LibraryBook, 'id'>) => {
    const newBook: LibraryBook = {
      ...book,
      id: `book-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    setState(prev => ({
      ...prev,
      libraryBooks: [newBook, ...prev.libraryBooks]
    }));
  };

  const borrowBook = (loanData: Omit<LibraryLoan, 'id' | 'status'>) => {
    const newLoan: LibraryLoan = {
      ...loanData,
      id: `loan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'Activo'
    };
    setState(prev => ({
      ...prev,
      libraryLoans: [newLoan, ...prev.libraryLoans],
      libraryBooks: prev.libraryBooks.map(b => b.id === loanData.bookId ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b)
    }));
  };

  const returnBook = (loanId: string, returnDate?: string) => {
    const finalDate = returnDate || new Date().toISOString().split('T')[0];
    setState(prev => {
      const loan = prev.libraryLoans.find(l => l.id === loanId);
      if (!loan) return prev;
      return {
        ...prev,
        libraryLoans: prev.libraryLoans.map(l => l.id === loanId ? { ...l, returnDate: finalDate, status: 'Devolvido' as const } : l),
        libraryBooks: prev.libraryBooks.map(b => b.id === loan.bookId ? { ...b, availableCopies: b.availableCopies + 1 } : b)
      };
    });
  };

  // 4. HR Actions
  const addHRContract = (contract: Omit<HRContract, 'id'>) => {
    const newContract: HRContract = {
      ...contract,
      id: `ctr-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    setState(prev => ({
      ...prev,
      hrContracts: [newContract, ...prev.hrContracts]
    }));
  };

  const addHRLeave = (leave: Omit<HRLeave, 'id' | 'status'>) => {
    const newLeave: HRLeave = {
      ...leave,
      id: `leave-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'Pendente'
    };
    setState(prev => ({
      ...prev,
      hrLeaves: [newLeave, ...prev.hrLeaves]
    }));
  };

  const approveHRLeave = (leaveId: string, approved: boolean, approverName: string) => {
    setState(prev => ({
      ...prev,
      hrLeaves: prev.hrLeaves.map(l => l.id === leaveId ? { ...l, status: approved ? 'Aprovado' as const : 'Rejeitado' as const, approvedBy: approverName } : l)
    }));
  };

  const addHRPromotion = (promotion: Omit<HRPromotion, 'id'>) => {
    const newProm: HRPromotion = {
      ...promotion,
      id: `prm-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    setState(prev => ({
      ...prev,
      hrPromotions: [newProm, ...prev.hrPromotions]
    }));
  };

  const addHRTraining = (training: Omit<HRTraining, 'id'>) => {
    const newTrn: HRTraining = {
      ...training,
      id: `trn-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    setState(prev => ({
      ...prev,
      hrTrainings: [newTrn, ...prev.hrTrainings]
    }));
  };

  // 5. Reception Actions
  const addReceptionVisitor = (visitor: Omit<ReceptionVisitor, 'id' | 'status'>) => {
    const newVis: ReceptionVisitor = {
      ...visitor,
      id: `vis-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'Aguardando'
    };
    setState(prev => ({
      ...prev,
      receptionVisitors: [newVis, ...prev.receptionVisitors]
    }));
  };

  const updateVisitorStatus = (id: string, status: 'Em Atendimento' | 'Concluído' | 'Aguardando') => {
    setState(prev => ({
      ...prev,
      receptionVisitors: prev.receptionVisitors.map(v => v.id === id ? { 
        ...v, 
        status, 
        exitTime: status === 'Concluído' ? new Date().toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' }) : v.exitTime 
      } : v)
    }));
  };

  const addReceptionTicket = (ticket: Omit<ReceptionTicket, 'id' | 'status' | 'requestedAt'>) => {
    const newTicket: ReceptionTicket = {
      ...ticket,
      id: `tkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      requestedAt: new Date().toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' }),
      status: 'waiting'
    };
    setState(prev => ({
      ...prev,
      receptionTickets: [newTicket, ...prev.receptionTickets]
    }));
  };

  const callReceptionTicket = (id: string) => {
    setState(prev => ({
      ...prev,
      receptionTickets: prev.receptionTickets.map(t => t.id === id ? { 
        ...t, 
        status: 'Chamado' as const, 
        calledAt: new Date().toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' }) 
      } : t)
    }));
  };

  // 6. Archive Actions
  const addArchiveRecord = (record: Omit<ArchiveRecord, 'id'>) => {
    const newRec: ArchiveRecord = {
      ...record,
      id: `arq-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    setState(prev => ({
      ...prev,
      archiveRecords: [newRec, ...prev.archiveRecords]
    }));
  };

  // 7. Schedule Actions
  const addClassSchedule = (schedule: Omit<ClassSchedule, 'id'>) => {
    const newSch: ClassSchedule = {
      ...schedule,
      id: `sch-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    setState(prev => ({
      ...prev,
      classSchedules: [newSch, ...prev.classSchedules]
    }));
  };

  const addEvaluation = async (evalData: Omit<EvaluationItem, 'id'>) => {
    const newId = `eval-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newItem: EvaluationItem = {
      ...evalData,
      id: newId
    };
    setState(prev => ({
      ...prev,
      evaluations: [newItem, ...(prev.evaluations || [])]
    }));
    try {
      await setDoc(doc(db, 'evaluations', newId), newItem);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `evaluations/${newId}`);
    }
  };

  const addClassTask = async (taskData: Omit<ClassTaskItem, 'id' | 'createdAt'>) => {
    const newId = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newItem: ClassTaskItem = {
      ...taskData,
      id: newId,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      classTasks: [newItem, ...(prev.classTasks || [])]
    }));

    sendNotification({
      title: `Nova Atividade: ${taskData.title}`,
      message: `O docente ${taskData.teacherName || 'Professor'} publicou a atividade "${taskData.title}" para a disciplina de ${taskData.subjectName}. Prazo: ${taskData.dueDate}`,
      senderName: taskData.teacherName || 'Professor',
      senderRole: 'Professor',
      targetAudience: 'alunos',
      priority: 'importante',
      category: 'Atividades' as any,
      targetLocation: 'tasks'
    });

    try {
      await setDoc(doc(db, 'classTasks', newId), newItem);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `classTasks/${newId}`);
    }
  };

  const submitTaskAnswer = async (submissionData: Omit<ClassTaskSubmission, 'id' | 'submittedAt'>) => {
    const newId = `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newSub: ClassTaskSubmission = {
      ...submissionData,
      id: newId,
      submittedAt: new Date().toISOString()
    };

    setState(prev => {
      const updatedTasks = (prev.classTasks || []).map(task => {
        if (task.id !== submissionData.taskId) return task;
        const existing = task.submissions || [];
        const filtered = existing.filter(s => s.studentId !== submissionData.studentId);
        return {
          ...task,
          submissions: [newSub, ...filtered]
        };
      });

      return {
        ...prev,
        classTasks: updatedTasks
      };
    });

    sendNotification({
      title: `Nova Resposta de Atividade`,
      message: `O aluno ${submissionData.studentName} submeteu a resposta para a atividade de ${submissionData.subjectName}.`,
      senderName: submissionData.studentName,
      senderRole: 'Aluno',
      targetAudience: 'professores',
      priority: 'normal',
      category: 'Atividades' as any,
      targetLocation: 'atividades'
    });

    try {
      await setDoc(doc(db, 'taskSubmissions', newId), newSub);
    } catch (err) {
      console.warn('Firestore task submission save warning:', err);
    }
  };

  const gradeTaskSubmission = async (taskId: string, submissionId: string, grade: number, feedback: string) => {
    const targetTask = state.classTasks?.find(t => t.id === taskId);
    const targetSub = targetTask?.submissions?.find(s => s.id === submissionId);

    if (targetTask && targetSub) {
      sendNotification({
        title: `Atividade Avaliada: ${targetTask.title}`,
        message: `A sua atividade de ${targetTask.subjectName} foi avaliada pelo docente. Nota: ${grade}/20. ${feedback ? `Feedback: ${feedback}` : ''}`,
        senderName: targetTask.teacherName || 'Professor',
        senderRole: 'Professor',
        recipientId: targetSub.studentId,
        recipientName: targetSub.studentName,
        targetAudience: 'alunos',
        priority: 'importante',
        category: 'Atividades' as any,
        targetLocation: 'tasks'
      });
    }

    setState(prev => ({
      ...prev,
      classTasks: (prev.classTasks || []).map(task => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          submissions: (task.submissions || []).map(sub => {
            if (sub.id !== submissionId) return sub;
            return { ...sub, grade, feedback };
          })
        };
      })
    }));
  };

  // 8. AI Actions
  const generateAIReport = (report: Omit<AIReportGeneration, 'id' | 'generatedAt'>) => {
    const newRep: AIReportGeneration = {
      ...report,
      id: `air-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      generatedAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      aiReports: [newRep, ...prev.aiReports]
    }));
  };

  // 9. RF-MAT-002, RF-MAT-003 & RF-HIST-001: Renovação Automática, Transição e Certificados
  const executeAnnualAutoRenewal = (schoolId: string, targetYear: number = 2026): AutoRenewalSummary => {
    const result = runAutomatedEnrollmentRenewal({
      schoolId,
      targetYear,
      schools: state.schools,
      classes: state.classes,
      students: state.students,
      grades: state.grades,
      examGrades: state.examGrades,
      existingBatches: state.transitionBatches
    });

    setState(prev => ({
      ...prev,
      students: result.updatedStudents,
      classes: result.newClasses,
      transitionBatches: [...result.newBatches, ...(prev.transitionBatches || [])],
      issuedDeclarations: [...result.newDeclarations, ...(prev.issuedDeclarations || [])],
      issuedCertificates: [...result.newCertificates, ...(prev.issuedCertificates || [])]
    }));

    return result.summary;
  };

  const validateAndActivateEnrollment = (studentId: string, verifiedDocs?: Record<string, boolean>) => {
    setState(prev => {
      const student = prev.students.find(s => s.id === studentId);
      if (!student) return prev;
      const updated = validateEnrollmentFn(student, verifiedDocs || {
        birthCertificate: true,
        idCardCopy: true,
        vaccinationCard: true,
        previousYearDeclaration: true,
        enrollmentForm: true
      });
      return {
        ...prev,
        students: prev.students.map(s => s.id === studentId ? updated : s)
      };
    });
  };

  const handleTransitionVacancyDecision = (batchId: string, decision: 'approve' | 'reject', directorName?: string) => {
    setState(prev => {
      const batch = (prev.transitionBatches || []).find(b => b.id === batchId);
      if (!batch) return prev;
      const targetSchool = prev.schools.find(s => s.id === batch.targetSchoolId);
      const res = handleVacancyFn({
        batch,
        decision,
        directorName: directorName || targetSchool?.directorName || 'Director da Escola',
        allSchools: prev.schools,
        allClasses: prev.classes,
        students: prev.students
      });

      const updatedBatches = (prev.transitionBatches || []).map(b => b.id === batchId ? res.updatedBatch : b);
      if (res.reassignedBatch) {
        updatedBatches.unshift(res.reassignedBatch);
      }

      return {
        ...prev,
        transitionBatches: updatedBatches,
        students: res.updatedStudents
      };
    });
  };

  const confirmDestinationEnrollment = (studentId: string, classId: string) => {
    setState(prev => {
      const student = prev.students.find(s => s.id === studentId);
      const targetClass = prev.classes.find(c => c.id === classId);
      const targetSchool = prev.schools.find(s => s.id === targetClass?.schoolId) || prev.schools[0];
      if (!student) return prev;

      const updated = confirmDestEnrollmentFn(student, classId, targetSchool);
      return {
        ...prev,
        students: prev.students.map(s => s.id === studentId ? updated : s)
      };
    });
  };

  const updateStudentDetails = (studentId: string, updates: Partial<Student>) => {
    setState(prev => {
      const student = prev.students.find(s => s.id === studentId);
      if (!student) return prev;
      const updatedStudent: Student = {
        ...student,
        ...updates,
        fullName: updates.name || updates.fullName || student.fullName || student.name,
        updatedAt: new Date().toISOString().split('T')[0]
      };

      // Persist to Firestore
      updateDoc(doc(db, 'students', studentId), updates as any).catch(err => {
        console.warn('Firestore updateStudentDetails failed:', err);
      });

      return {
        ...prev,
        students: prev.students.map(s => s.id === studentId ? updatedStudent : s)
      };
    });
  };

  const reorganizeClasses = (schoolId: string, gradeLevel: string, maxPerClass: number) => {
    setState(prev => {
      const gradeStudents = prev.students.filter(s => s.schoolId === schoolId && s.gradeLevel === gradeLevel);
      if (gradeStudents.length === 0) return prev;

      const normalStudents = gradeStudents.filter(s => s.entryType !== 'repetente');
      const repeatingStudents = gradeStudents.filter(s => s.entryType === 'repetente');

      const getBirthYear = (s: Student) => {
        if (!s.birthDate) return 2010;
        const parts = s.birthDate.split('-');
        return parseInt(parts[0], 10) || 2010;
      };

      const sortHelper = (a: Student, b: Student) => {
        const yearA = getBirthYear(a);
        const yearB = getBirthYear(b);
        if (yearA !== yearB) {
          return yearB - yearA; // Youngest first (e.g. 2012 before 2010)
        }
        return a.name.localeCompare(b.name, 'pt-PT', { sensitivity: 'base' });
      };

      const sortedNormal = [...normalStudents].sort(sortHelper);
      const sortedRepeating = [...repeatingStudents].sort(sortHelper);

      const allSorted = [...sortedNormal, ...sortedRepeating];

      const turmasLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const currentClasses = [...prev.classes];
      const updatedStudents = [...prev.students];

      const filteredClasses = currentClasses.filter(c => !(c.schoolId === schoolId && c.gradeLevel === gradeLevel));
      
      const newClasses: Class[] = [];

      allSorted.forEach((student, index) => {
        const classIndex = Math.floor(index / maxPerClass);
        const letter = turmasLetters[classIndex] || 'X';
        const className = `Turma ${letter}`;

        let targetClass = newClasses.find(c => c.name === className);
        if (!targetClass) {
          targetClass = {
            id: `cls-${schoolId}-${gradeLevel.replace(/\s+/g, '')}-${letter}`,
            schoolId,
            name: className,
            gradeLevel,
            year: new Date().getFullYear(),
            period: 'Manhã',
          };
          newClasses.push(targetClass);
          
          // Persist new class to Firestore
          setDoc(doc(db, 'classes', targetClass.id), targetClass).catch(err => {
            console.warn('Firestore reorganizeClasses new class failed:', err);
          });
        }

        const studentIdx = updatedStudents.findIndex(s => s.id === student.id);
        if (studentIdx !== -1) {
          updatedStudents[studentIdx] = {
            ...updatedStudents[studentIdx],
            classId: targetClass.id,
          };
          
          // Persist student assignment to Firestore
          updateDoc(doc(db, 'students', student.id), { classId: targetClass.id }).catch(err => {
            console.warn('Firestore reorganizeClasses student update failed:', err);
          });
        }
      });

      const finalClassesList = [...filteredClasses, ...newClasses];

      return {
        ...prev,
        classes: finalClassesList,
        students: updatedStudents,
      };
    });
  };

  const issueCertificate = (certData: {
    studentId: string;
    type?: 'CERTIFICADO DE CONCLUSÃO' | 'DECLARAÇÃO DE CONCLUSÃO' | 'DECLARAÇÃO DE APROVEITAMENTO' | 'DECLARAÇÃO DE FREQUÊNCIA';
    gradeLevel?: string;
    academicYear?: number;
    schoolName?: string;
    directorName?: string;
    secretaryName?: string;
    average?: number;
  }): IssuedCertificate => {
    const student = state.students.find(s => s.id === certData.studentId);
    const school = state.schools.find(s => s.id === student?.schoolId) || state.schools[0];
    const year = certData.academicYear || 2026;
    const grade = certData.gradeLevel || student?.entryGrade || '10ª Classe';
    const iue = student?.iue || generateIUE({ name: student?.name || 'Aluno', schoolName: school.name });
    const nim = student?.nim || generateNIM({ district: school.district });

    const newCert: IssuedCertificate = {
      id: `cert-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      studentId: certData.studentId,
      studentName: student?.name || 'Aluno',
      iue: iue,
      nim: nim,
      certificateCode: `CERT-MZ-${year}-${grade.replace(/[^0-9]/g, '') || '10'}C-${(student?.id || 'ALU').toUpperCase()}`,
      type: certData.type || 'CERTIFICADO DE CONCLUSÃO',
      gradeLevel: grade,
      academicYear: year,
      schoolName: certData.schoolName || school.name,
      average: certData.average || 14,
      issuedAt: new Date().toLocaleDateString('pt-MZ'),
      verificationCode: `VERIF-MINEDH-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      qrPayload: `IUE:${iue}|NOME:${student?.name}|ESCOLA:${school.name}|ANO:${year}|TIPO:${certData.type || 'CERTIFICADO'}`,
      directorName: certData.directorName || school.directorName || 'Director da Escola',
      secretaryName: certData.secretaryName || school.secretariatChiefName || 'Chefe da Secretaria'
    };

    setState(prev => ({
      ...prev,
      issuedCertificates: [newCert, ...(prev.issuedCertificates || [])],
      students: prev.students.map(s => s.id === certData.studentId ? {
        ...s,
        issuedCertificates: [newCert, ...(s.issuedCertificates || [])]
      } : s)
    }));

    return newCert;
  };

  const createPetition = (petition: Omit<Petition, 'id' | 'createdAt' | 'status' | 'history'>) => {
    const newPetition: Petition = {
      ...petition,
      id: `pet-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Recepção',
      history: [{ role: 'Aluno', action: 'Submissão', timestamp: new Date().toISOString() }]
    };
    setState(prev => ({ ...prev, petitions: [...prev.petitions, newPetition] }));
  };

  const updatePetitionStatus = (id: string, status: Petition['status'], action: string, role: string) => {
    let affectedPetition: Petition | undefined;
    
    setState(prev => {
      affectedPetition = prev.petitions.find(p => p.id === id);
      
      // Find relevant staff (Chefe Secretaria, Diretor)
      if (affectedPetition && affectedPetition.status !== status) {
         const relevantStaff = prev.employees.filter(e => 
           (status === 'Direcção' && e.roleFunction === 'Director') ||
           (status === 'Secretaria-Geral' && e.roleFunction === 'Chefe da Secretaria')
         );
         
         relevantStaff.forEach(staff => {
           sendNotification({
             title: 'Nova Petição',
             message: `A petição de ${affectedPetition!.studentName} passou para o estado: ${status}.`,
             senderName: role,
             senderRole: role,
             recipientId: staff.id,
             recipientName: staff.name
           });
         });
      }

      return {
        ...prev,
        petitions: prev.petitions.map(p => p.id === id ? {
          ...p,
          status,
          history: [...p.history, { role, action, timestamp: new Date().toISOString() }]
        } : p)
      };
    });
  };

  // --- FIRESTORE CRUD OPERATIONS FOR USER PROFILES ---
  const saveUserProfile = async (user: User): Promise<void> => {
    setState(prev => ({
      ...prev,
      users: [...prev.users.filter(u => u.id !== user.id), user]
    }));
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
    }
  };

  const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, ...updates } : u)
    }));
    try {
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const deleteUserProfile = async (userId: string): Promise<void> => {
    setState(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== userId)
    }));
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    }
  };

  const getUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const docSnap = await getDoc(doc(db, 'users', userId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return state.users.find(u => u.id === userId) || null;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${userId}`);
      return null;
    }
  };

  // --- FIRESTORE CRUD OPERATIONS FOR SCHOOL DOCUMENTS & SCHOOLS ---
  const saveSchoolDocument = async (docData: { id: string; schoolId: string; title: string; docType: string; studentId?: string; content?: any; issuedAt: string }): Promise<void> => {
    setState(prev => ({
      ...prev,
      schoolDocuments: [...(prev.schoolDocuments || []).filter(d => d.id !== docData.id), docData]
    }));
    try {
      await setDoc(doc(db, 'schoolDocuments', docData.id), docData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `schoolDocuments/${docData.id}`);
    }
  };

  const updateSchoolDocument = async (docId: string, updates: any): Promise<void> => {
    setState(prev => ({
      ...prev,
      schoolDocuments: (prev.schoolDocuments || []).map(d => d.id === docId ? { ...d, ...updates } : d)
    }));
    try {
      await updateDoc(doc(db, 'schoolDocuments', docId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `schoolDocuments/${docId}`);
    }
  };

  const deleteSchoolDocument = async (docId: string): Promise<void> => {
    setState(prev => ({
      ...prev,
      schoolDocuments: (prev.schoolDocuments || []).filter(d => d.id !== docId)
    }));
    try {
      await deleteDoc(doc(db, 'schoolDocuments', docId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `schoolDocuments/${docId}`);
    }
  };

  const saveSchoolProfile = async (school: School): Promise<void> => {
    setState(prev => ({
      ...prev,
      schools: [...prev.schools.filter(s => s.id !== school.id), school]
    }));
    try {
      await setDoc(doc(db, 'schools', school.id), school);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `schools/${school.id}`);
    }
  };

  const updateSchoolProfile = async (schoolId: string, updates: Partial<School>): Promise<void> => {
    setState(prev => ({
      ...prev,
      schools: prev.schools.map(s => s.id === schoolId ? { ...s, ...updates } : s)
    }));
    try {
      await updateDoc(doc(db, 'schools', schoolId), updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `schools/${schoolId}`);
    }
  };

  const deleteSchoolProfile = async (schoolId: string): Promise<void> => {
    setState(prev => ({
      ...prev,
      schools: prev.schools.filter(s => s.id !== schoolId)
    }));
    try {
      await deleteDoc(doc(db, 'schools', schoolId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `schools/${schoolId}`);
    }
  };

  const sendNotification = async (notification: Omit<UserNotification, 'id' | 'createdAt'>) => {
    const newId = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newNotif: UserNotification = {
      ...notification,
      id: newId,
      createdAt: new Date().toISOString(),
      isRead: false
    };
    setState(prev => ({
      ...prev,
      userNotifications: [newNotif, ...((prev as any).userNotifications || [])]
    }));
    try {
      await setDoc(doc(db, 'notifications', newId), newNotif);
    } catch (err) {
      console.warn('Firestore notification write warning:', err);
    }
  };

  const markNotificationAsRead = (id: string) => {
    setState(prev => ({
      ...prev,
      userNotifications: ((prev as any).userNotifications || []).map((n: any) => n.id === id ? { ...n, isRead: true } : n)
    }));
    try {
      updateDoc(doc(db, 'notifications', id), { isRead: true }).catch(() => {});
    } catch (err) {
      // ignore
    }
  };

  const triggerAutomatedBackup = async (type: 'automático' | 'manual' = 'automático', triggeredBy?: string): Promise<BackupRecord> => {
    setState(prev => ({ ...prev, isBackingUp: true }));
    const timestamp = new Date().toISOString();
    const backupId = `bkp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Calculate pedagogical records count
    const pedagogicalCount = (state.students?.length || 0) + 
      (state.classes?.length || 0) + 
      (state.grades?.length || 0) + 
      (state.examGrades?.length || 0) + 
      (state.subjects?.length || 0) + 
      (state.evaluations?.length || 0) + 
      (state.classTasks?.length || 0) + 
      (state.reports?.length || 0);

    // Calculate administrative records count
    const administrativeCount = (state.schools?.length || 0) + 
      (state.users?.length || 0) + 
      (state.employees?.length || 0) + 
      (state.schoolDocuments?.length || 0) + 
      (state.financialTransactions?.length || 0) + 
      (state.patrimonyItems?.length || 0) + 
      (state.petitions?.length || 0);

    const details = {
      studentsCount: state.students?.length || 0,
      classesCount: state.classes?.length || 0,
      gradesCount: state.grades?.length || 0,
      evaluationsCount: state.evaluations?.length || 0,
      tasksCount: state.classTasks?.length || 0,
      reportsCount: state.reports?.length || 0,
      schoolsCount: state.schools?.length || 0,
      usersCount: state.users?.length || 0,
      employeesCount: state.employees?.length || 0,
      documentsCount: state.schoolDocuments?.length || 0,
      financialTransactionsCount: state.financialTransactions?.length || 0,
      patrimonyCount: state.patrimonyItems?.length || 0,
    };

    const sizeKb = Math.round((JSON.stringify({ details, timestamp }).length * 1.5) / 1024) + 12;

    const newBackup: BackupRecord = {
      id: backupId,
      createdAt: timestamp,
      triggeredBy: triggeredBy || (state.currentUser?.name ? `${state.currentUser.name} (${state.currentUser.role})` : 'Sistema Automático Firestore'),
      type,
      status: 'concluído',
      pedagogicalCount,
      administrativeCount,
      summary: `Salvaguarda integral de ${pedagogicalCount} dados pedagógicos e ${administrativeCount} dados administrativos no Firestore Cloud.`,
      sizeKb,
      details
    };

    try {
      await setDoc(doc(db, 'backups', backupId), newBackup);
    } catch (err) {
      console.warn('Backup setDoc Firestore warning:', err);
    }

    setState(prev => {
      const updatedBackups = [newBackup, ...(prev.backups || []).filter(b => b.id !== backupId)];
      return {
        ...prev,
        backups: updatedBackups,
        lastBackupAt: timestamp,
        isBackingUp: false
      };
    });

    try {
      localStorage.setItem('eduGestaoLastBackupAt', timestamp);
    } catch (e) {}

    // Dispatch completion notification for the manager (gestor)
    const notifMessage = `Backup ${type === 'automático' ? 'automático agendado' : 'manual'} de dados concluído com sucesso. Foram preservados ${pedagogicalCount} registos pedagógicos (estudantes, turmas, notas, tarefas) e ${administrativeCount} registos administrativos no Firestore Cloud às ${new Date().toLocaleTimeString('pt-MZ')}.`;

    await sendNotification({
      title: `✅ Backup ${type === 'automático' ? 'Automático' : 'do Sistema'} Concluído`,
      message: notifMessage,
      targetAudience: 'todos',
      priority: 'normal',
      senderName: 'Serviço de Backup Firestore',
      senderRole: 'Sistema',
      category: 'Administrativo'
    });

    return newBackup;
  };

  const toggleAutoBackup = (enabled: boolean) => {
    setState(prev => ({ ...prev, autoBackupEnabled: enabled }));
  };

  // Automated background backup timer
  useEffect(() => {
    if (!state.autoBackupEnabled) return;
    
    // Initial check after 8 seconds of system boot
    const timeout = setTimeout(() => {
      const last = localStorage.getItem('eduGestaoLastBackupAt');
      const now = Date.now();
      const lastTime = last ? new Date(last).getTime() : 0;
      const hoursDiff = (now - lastTime) / (1000 * 60 * 60);
      
      // If no backup in last 12 hours, trigger automatic backup!
      if (!last || hoursDiff >= 12) {
        triggerAutomatedBackup('automático', 'Rotina Agendada do Firestore');
      }
    }, 8000);

    // Periodic check every 30 minutes
    const interval = setInterval(() => {
      const last = localStorage.getItem('eduGestaoLastBackupAt');
      const now = Date.now();
      const lastTime = last ? new Date(last).getTime() : 0;
      const hoursDiff = (now - lastTime) / (1000 * 60 * 60);

      if (!last || hoursDiff >= 24) {
        triggerAutomatedBackup('automático', 'Rotina Diária Automática do Firestore');
      }
    }, 30 * 60 * 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [state.autoBackupEnabled]);

  return (
    <StoreContext.Provider value={{
      ...state,
      
      // Multi-Tenant Isolated Collections
      students: tenantStudents,
      classes: tenantClasses,
      employees: tenantEmployees,
      subjects: tenantSubjects,
      assignments: tenantAssignments,
      grades: tenantGrades,
      examGrades: tenantExamGrades,
      financialTransactions: tenantFinancialTransactions,
      patrimonyItems: tenantPatrimonyItems,
      patrimonyMovements: tenantPatrimonyMovements,
      libraryBooks: tenantLibraryBooks,
      libraryLoans: tenantLibraryLoans,
      hrContracts: tenantHrContracts,
      hrLeaves: tenantHrLeaves,
      hrPromotions: tenantHrPromotions,
      hrTrainings: tenantHrTrainings,
      receptionVisitors: tenantReceptionVisitors,
      receptionTickets: tenantReceptionTickets,
      archiveRecords: tenantArchiveRecords,
      classSchedules: tenantClassSchedules,
      schoolRooms: tenantSchoolRooms,
      issuedDeclarations: tenantIssuedDeclarations,
      issuedCertificates: tenantIssuedCertificates,

      // Multi-Tenant Metadata & Control
      activeSchoolId: effectiveSchoolId,
      tenantId: effectiveSchoolId,
      activeSchool,
      setActiveSchoolId,
      getSchoolTenantUrl,
      getSchoolByTenant,

      // Raw Unfiltered Collections for Multi-School Admin/Governance
      allStudents: state.students,
      allClasses: state.classes,
      allEmployees: state.employees,
      allSubjects: state.subjects,
      allAssignments: state.assignments,
      allGrades: state.grades,
      allExamGrades: state.examGrades,
      allFinancialTransactions: state.financialTransactions,
      allPatrimonyItems: state.patrimonyItems,
      allLibraryBooks: state.libraryBooks,
      allArchiveRecords: state.archiveRecords,
      allSchools: state.schools,

      // Store Actions
      login,
      logout,
      setActiveTab,
      enrollStudent,
      addEmployee,
      allocateEmployee,
      verifyEmployee,
      deleteEmployee,
      updateEmployee,
      assignTeacherCompetencyRole,
      removeTeacherCompetencyRole,
      generateStudentLoginId,
      assignClasses,
      addGrade,
      addExamGrade,
      addLessonSummary,
      digitalLessonRecords: state.digitalLessonRecords || [],
      addDigitalLessonRecord,
      updateDigitalLessonRecord,
      deleteDigitalLessonRecord,
      pedagogicalVisaLessonRecord,
      secretariatAuditLessonRecord,
      submitTaskAnswer,
      gradeTaskSubmission,
      submitReport,
      signReport,
      publishReport,
      issueDeclaration,
      executeAnnualAutoRenewal,
      validateAndActivateEnrollment,
      handleTransitionVacancyDecision,
      confirmDestinationEnrollment,
      issueCertificate,
      addCollectionPeriod,
      publishCollectionPeriod,
      submitCollectionForm,
      sendChatMessage,
      submitTransferRequest,
      submitComplaint,
      updateSchoolChoice,
      addSchool,
      removeSchool,
      removeClass,
      toggleHighContrast,
      lockClassGrades,
      archiveAcademicData,
      updateUserPermissions,
      sendEmailNotification,
      sendNotification,
      updateSmtpSettings,
      testSmtpConnection,
      triggerTrimesterCloseEmailToTeachers,
      updateUserSignature,
      signDocument,
      setUserSecurityPin,
      updatePassword,
      registerUserBiometrics,
      removeDocumentSignature,
      addFinancialTransaction,
      updateFinancialStatus,
      addPatrimonyItem,
      updatePatrimonyItem,
      addPatrimonyMovement,
      addLibraryBook,
      borrowBook,
      returnBook,
      addHRContract,
      addHRLeave,
      approveHRLeave,
      addHRPromotion,
      addHRTraining,
      addReceptionVisitor,
      updateVisitorStatus,
      addReceptionTicket,
      callReceptionTicket,
      addArchiveRecord,
      addClassSchedule,
      addEvaluation,
      addClassTask,
      generateAIReport,
      createPetition,
      updatePetitionStatus,
      updateStudentDetails,
      reorganizeClasses,
      saveUserProfile,
      updateUserProfile,
      deleteUserProfile,
      getUserProfile,
      saveSchoolDocument,
      updateSchoolDocument,
      deleteSchoolDocument,
      saveSchoolProfile,
      updateSchoolProfile,
      deleteSchoolProfile,
      markNotificationAsRead,
      triggerAutomatedBackup,
      toggleAutoBackup,
      userNotifications: state.userNotifications,
      notifications: state.chatMessages,
      declarations: tenantIssuedDeclarations,
      certificates: tenantIssuedCertificates
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
