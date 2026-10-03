export const MOZAMBIQUE_EMBLEM_URL = "https://upload.wikimedia.org/wikipedia/commons/1/14/Emblem_of_Mozambique.svg";

export interface AcademicArchive {
  id: string;
  year: number;
  classId: string;
  grades: Grade[];
  examGrades: ExamGrade[];
  archivedAt: string;
}

export type Role = 
  | 'admin' 
  | 'director' 
  | 'pedagogical' 
  | 'teacher' 
  | 'secretariat' 
  | 'secretariat_rh' 
  | 'secretariat_patrimonio' 
  | 'secretariat_recepcao' 
  | 'secretariat_arquivo' 
  | 'secretariat_financas' 
  | 'librarian' 
  | 'guardian' 
  | 'national' 
  | 'provincial' 
  | 'district' 
  | 'student';

export interface GranularPermissions {
  secretariat?: {
    enrollment_create?: boolean;
    enrollment_edit?: boolean;
    certificates_issue?: boolean;
    declarations_issue?: boolean;
    student_process_manage?: boolean;
    transfers_manage?: boolean;
    medical_board_manage?: boolean;
    tuition_fees_manage?: boolean;
    archive_access?: boolean;
  };
  pedagogia?: {
    pautas_approve?: boolean;
    exam_lists_publish?: boolean;
    class_schedule_manage?: boolean;
    academic_curriculum_manage?: boolean;
    grade_lock_override?: boolean;
    teacher_assignment_manage?: boolean;
    statistical_reports_view?: boolean;
  };
  teacher?: {
    grades_launch_trimester?: boolean;
    exam_grades_launch?: boolean;
    lesson_summaries_manage?: boolean;
    class_attendance_manage?: boolean;
    student_tasks_create?: boolean;
    pedagogical_reports_submit?: boolean;
    grade_export_print?: boolean;
  };
}

export interface User {
  id: string;
  name: string;
  area?: "CS" | "MCN" | "APTP";
  email: string;
  role: Role;
  subRole?: string;
  department?: string;
  roleTitle?: string;
  schoolId?: string;
  districtId?: string;
  provinceId?: string;
  signature?: string;
  signatureImage?: string;
  securityPin?: string;
  biometricRegistered?: boolean;
  biometricRegisteredAt?: string;
  studentId?: string;
  guardianStudentIds?: string[];
  avatarUrl?: string;
  permissions?: {
    secretariat?: string[];
    pedagogia?: string[];
    teacher?: string[];
    granular?: GranularPermissions;
  };
}

export interface Province {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
  provinceId: string;
}

export type SchoolManagementType = 'estatal' | 'privado';

export type SchoolLevelType = 
  | 'EP1'
  | 'EP2'
  | 'ENSINO BÁSICO'
  | 'ENSINO SECUNDÁRIO DO 1 CICLO'
  | 'ENSINO SECUNDÁRIO DO 2 CICLO'
  | 'ENSINO PRÉ-UNIVERSITÁRIO'
  | 'ENSINO TÉCNICO PROFISSIONAL'
  | 'ENSINO MÉDIO PROFISSIONAL';

export interface School {
  id: string;
  name: string;
  code?: string;
  logoUrl?: string;
  managementType?: SchoolManagementType;
  province?: string;
  provinceId?: string;
  district?: string;
  districtId?: string;
  locality?: string;
  administrativePost?: string;
  address: string;
  schoolTypes?: SchoolLevelType[];
  directorName?: string;
  dapName?: string;
  pedagogicalDirectorName?: string;
  secretariatChiefName?: string;
  phone?: string;
  email?: string;
  shifts?: string[];
  area?: "CS" | "MCN" | "APTP";
  studentCapacity?: number;
  autoAssignedClasses?: string[];
  autoAssignedSubjects?: string[];
}

// Data Collection and Scheduling
export interface CollectionPeriod {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'published' | 'closed';
  createdByRole: Role;
  targetLevel: 'provincial' | 'district' | 'school';
  createdAt: string;
}

export interface CollectionForm {
  id: string;
  periodId: string;
  responderId: string; // User ID
  responderRole: Role;
  responderLevelId: string; // provinceId, districtId, or schoolId
  data: any; // Flexible JSON for form responses
  status: 'draft' | 'submitted';
  submittedAt?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  receiverLevel: 'national' | 'provincial' | 'district' | 'school' | 'admin' | 'all';
  receiverId?: string; // specific provinceId, districtId, etc.
  receiverName?: string;
  subject?: string;
  text: string;
  timestamp: string;
  read?: boolean;
  category?: 'suporte' | 'oficial' | 'geral';
}

export interface PreviousSchool {
  entryDate: string;
  exitDate: string;
  schoolName: string;
  district: string;
  province: string;
  grade: string;
  className: string;
}

export interface AttachedDocuments {
  birthCertificate?: boolean;
  idCard?: boolean;
  qualificationsCertificate?: boolean;
  medicalCertificate?: boolean;
  passPhotos?: boolean;
  residenceDeclaration?: boolean;
  paymentProof?: boolean;
  declarationOfGrades?: boolean;
}

export interface GradeSnapshotItem {
  subjectId: string;
  subjectName: string;
  acs1?: number;
  acs2?: number;
  acs3?: number;
  apt?: number;
  media: number;
  words?: string;
}

export interface DocumentSignatureRecord {
  id: string;
  documentId: string;
  documentType: 'certificate' | 'declaration' | 'transfer' | 'bulletin' | 'pauta';
  documentTitle?: string;
  studentId?: string;
  studentName?: string;
  gradeLevel?: string;
  academicYear?: number;
  signerId: string;
  signerName: string;
  signerRole: Role | string;
  signerTitle: string; // e.g. "Director da Escola", "Secretária Académica", "Director de Turma / Professor"
  signatureImage?: string; // base64 / data URL
  authMethod: 'biometric' | 'security_code';
  biometricType?: 'fingerprint' | 'face_id' | 'touch_id' | 'webauthn_passkey';
  securityHash: string; // Cryptographic hash
  timestamp: string | number; // ISO string or timestamp number
  formattedDate: string; // Formatted date string
  certificateSerialNumber: string;
  isValid?: boolean;
  status?: 'verified' | 'revoked' | 'pending';
}

export interface IssuedDeclaration {
  id: string;
  schoolId?: string;
  studentId: string;
  academicYear: number;
  gradeLevel: string;
  className?: string;
  schoolName?: string;
  issuedAt: string;
  directorName: string;
  secretaryName: string;
  status: 'Transitou' | 'Não Transitou';
  finalAverage: number;
  digitalSignatureHash: string;
  verificationCode: string;
  stamped: boolean;
  electronicallySigned: boolean;
  gradesSnapshot: GradeSnapshotItem[];
  exemplar?: string;
  signatures?: DocumentSignatureRecord[];
}

export interface AcademicHistoryEntry {
  year: string | number;
  grade: string;
  school: string;
  result: string;
}

export interface StudentOccurrence {
  date: string;
  description: string;
  responsible: string;
}

export interface StudentAttendance {
  month: string;
  presences: number;
  justifiedAbsences: number;
  unjustifiedAbsences: number;
}

export interface Student {
  id: string;
  studentCode?: string; // Código Único do Estudante (ex: EST-2026-001 / IUE)
  loginId?: string; // ID gerado para login do estudante (ex: ALU-2026-001 / IUE)
  iue?: string; // Identificador Único do Estudante (Padrão MINEDH: [INICIAIS]-[DOC]-[ESCOLA]/[PROV]/[DIST]/[ANO])
  nim?: string; // Número Interno de Matrícula (Padrão Diário: [ANO]-[DIST]-[SEQ])
  schoolId: string;
  name: string;
  fullName?: string;
  gradeLevel?: string;
  frequencyNumber?: number; // Número fixo de identificação por ano letivo durante a frequência (não substituível)
  studentNumber?: string; // Número do Aluno
  processCode?: string; // Código do Processo
  processNumber?: string;
  updatedAt?: string;
  course?: string; // Curso (ex: Ensino Secundário Geral)
  academicYear?: number; // Ano Lectivo
  openingDate?: string; // Data de Abertura do Processo
  area?: "CS" | "MCN" | "APTP";
  birthDate: string; // YYYY-MM-DD
  enrollmentDate: string;
  classId?: string;
  status: 'active' | 'graduated' | 'transferred';
  
  // 1. Identificação e Cédula
  cedulaNumber?: string;
  cedulaYear?: string;
  gender?: string;
  isNewAdmission?: boolean; // Novo Ingresso no ano letivo
  entryType?: 'novo_ingresso' | 'continuacao' | 'repetente';
  nationality?: string;
  birthPlace?: string;
  birthProvince?: string;
  maritalStatus?: string; // Estado Civil
  idCardNumber?: string;
  idCardIssuedAt?: string; // Emitido em
  nuit?: string; // NUIT
  children?: Array<{ name: string; age: string }>;
  careerOrientation?: string;
  transferHistory?: string;
  city?: string;
  quarteirao?: string;
  casa?: string;
  
  // Endereço
  province?: string;
  district?: string;
  administrativePost?: string; // Posto Administrativo
  neighborhood?: string; // Bairro
  address?: string;
  phone?: string;
  email?: string;
  
  // 2. Filiação
  fatherName?: string;
  fatherProfession?: string;
  fatherPhone?: string;
  fatherWorkplace?: string;
  fatherAddress?: string;
  
  motherName?: string;
  motherProfession?: string;
  motherPhone?: string;
  motherWorkplace?: string;
  motherAddress?: string;
  
  guardianName?: string;
  guardianProfession?: string;
  guardianPhone?: string;
  guardianKinship?: string;
  guardianAddress?: string;
  guardianWorkplace?: string;

  // 3. Frequência Escolar e Saúde Escolar (Padrão MINEDH)
  schoolFrequencyHistory?: {
    entryDate?: string;
    exitDate?: string;
    schoolName?: string;
    district?: string;
    province?: string;
    gradeAndClass?: string;
    obs?: string;
  }[];
  vaccinesTuberculosis?: { dose1?: string; dose2?: string; dose3?: string; date?: string };
  vaccinesTetanus?: { dose1?: string; dose2?: string; dose3?: string; date?: string };
  schoolBoxMember?: boolean;
  schoolBoxDetails?: string;
  healthObservations?: string;

  // 8. Orientação Profissional
  futureProfessionChoice?: string;
  guidedProfession?: string;
  vocationalObservations?: string;
  
  // 3. Documentos Anexos
  attachedDocuments?: AttachedDocuments;
  
  // 4. Histórico Académico
  academicHistory?: AcademicHistoryEntry[];
  previousSchools?: PreviousSchool[];

  // 5. Matrícula
  regime?: string; // Diurno / Nocturno / Geral
  shift?: string; // Manhã / Tarde / Noite
  entryGrade?: string; // Classe de Ingresso
  enrollmentStatus?: 'Activo' | 'Transferido' | 'Desistente' | 'Concluído';

  // 7. Registo de Ocorrências
  occurrences?: StudentOccurrence[];

  // 8. Assiduidade
  attendance?: StudentAttendance[];

  // 9. Transferência ou Conclusão
  transferDate?: string;
  transferReason?: string;
  transferDestination?: string;
  
  // 7. Matrícula e Inscrições (Padrão Imagem 3)
  enrollmentHistory?: Array<{
    year: string;
    grade: string;
    className: string;
    responsibleSignature?: string;
    dateStamp?: string;
  }>;

  // 10. Observações Gerais
  GeneralObservations?: string;
  photoUrl?: string;

  // detailed MINEDH sections
  pedagogicalAchievement?: Array<{
    year: number;
    grade: string;
    class: string;
    subjects: Record<string, { t1?: number; t2?: number; t3?: number; final?: number }>;
    directorSignature?: string;
    date?: string;
  }>;
  committedAbsences?: Array<{
    year: number;
    absences: Array<{ t1_just?: number; t1_unjust?: number; t2_just?: number; t2_unjust?: number; t3_just?: number; t3_unjust?: number; total?: number }>;
  }>;
  transfersAndAppreciation?: Array<{
    year: number;
    grade: string;
    class: string;
    appreciationDate?: string;
    directorSignature?: string;
    schoolDirectorSignature?: string;
    transferOut?: { date?: string; destination?: string; province?: string; docs?: string[]; directorSignature?: string };
    transferIn?: { date?: string; source?: string; guideNo?: string; province?: string; directorSignature?: string };
  }>;

  // 11. Declarações e Documentos Oficiais Emitidos
  issuedDeclarations?: IssuedDeclaration[];
  issuedCertificates?: IssuedCertificate[];
  nextSchoolId?: string;

  // 12. RF-MAT-002 & RF-MAT-003: Renovação Automática e Transição Escolar
  reactivationStatus?: 'PENDENTE DE REATIVAÇÃO' | 'AGUARDANDO REATIVAÇÃO' | 'VALIDADO' | 'MATRICULA_ATIVA';
  transitionStatus?: 'none' | 'eligible' | 'awaiting_vacancy_confirmation' | 'vacancy_confirmed' | 'rejected' | 'enrolled';
  transitionTargetSchoolId?: string;
  transitionSuggestedSchoolId?: string;
  transitionSourceSchoolId?: string;
  transitionGrade?: string;
  digitalProcessFiles?: { id: string; name: string; type: string; uploadDate: string; url?: string; verified: boolean }[];
}

export interface IssuedCertificate {
  id: string;
  schoolId?: string;
  studentId: string;
  studentName: string;
  iue: string;
  nim?: string;
  certificateCode: string;
  type: 'CERTIFICADO DE CONCLUSÃO' | 'DECLARAÇÃO DE CONCLUSÃO' | 'DECLARAÇÃO DE APROVEITAMENTO' | 'DECLARAÇÃO DE FREQUÊNCIA';
  gradeLevel: string;
  academicYear: number;
  schoolName: string;
  average: number;
  issuedAt: string;
  verificationCode: string;
  qrPayload: string;
  directorName?: string;
  secretaryName?: string;
  signatures?: DocumentSignatureRecord[];
}

export interface SchoolTransitionBatch {
  id: string;
  sourceSchoolId: string;
  sourceSchoolName: string;
  targetSchoolId: string;
  targetSchoolName: string;
  completedGrade: string;
  targetGrade: string;
  academicYear: number;
  totalStudents: number;
  status: 'Aguardando confirmação de vagas' | 'Vaga confirmada' | 'Rejeitado' | 'Matrículas confirmadas';
  createdAt: string;
  updatedAt: string;
  approvedByDirectorName?: string;
  students: {
    studentId: string;
    studentIue: string;
    studentNim?: string;
    studentName: string;
    finalAverage: number;
    result: 'Aprovado' | 'Graduado';
    status: 'AGUARDANDO CONFIRMAÇÃO DE VAGA' | 'VAGA CONFIRMADA' | 'REJEITADO' | 'MATRICULADO';
  }[];
}

export interface AutoRenewalSummary {
  year: number;
  schoolId: string;
  totalProcessed: number;
  promotedCount: number;
  retainedCount: number;
  graduatedCount: number;
  transitionBatchesCreated: number;
  executedAt: string;
}

export interface Class {
  id: string;
  schoolId: string;
  name: string;
  shift?: string;
  area?: "CS" | "MCN" | "APTP"; // e.g. "Turma A"
  gradeLevel: string; // e.g. "10ª Classe"
  year: number;
  period?: "Manhã" | "Tarde" | "Noite";
}

export interface Subject {
  id: string;
  code?: string;
  schoolId?: string;
  name: string;
  area?: "CS" | "MCN" | "APTP";
}

export interface TransferRequest {
  id: string;
  studentId: string;
  currentSchoolId: string;
  targetSchoolId: string;
  targetDistrictId: string;
  targetProvinceId: string;
  reason: string;
  proofOfPaymentUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
}

export interface AcademicComplaint {
  id: string;
  studentId: string;
  subjectId: string;
  trimester: number;
  description: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export interface TeacherAssignment {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  className?: string;
  subjectName?: string;
  teacherName?: string;
  schoolId?: string;
}

export interface LessonSummary {
  id: string;
  assignmentId: string;
  date: string;
  lessonNumber: number;
  topic: string;
  objectives: string;
  status: 'planned' | 'completed';
}

export interface Grade {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  trimester: 1 | 2 | 3;
  acs1?: number;
  acs2?: number;
  acs3?: number;
  mediaAcs?: number;
  trabalho1?: number;
  trabalho2?: number;
  mediaTrabalho?: number;
  apt?: number;
  media?: number;
  isLocked: boolean; // Once launched, cannot be altered
}

export interface ExamGrade {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  mediaFrequencia: number; // MF
  notaExame: number; // NE (0 a 20)
  classificacaoFinal: number; // CF
  resultado: 'Aprovado' | 'Reprovado' | 'Dispensado' | 'Excluído';
  isLocked: boolean;
  launchedAt?: string;
}

export interface TrimesterReport {
  id: string;
  schoolId: string;
  classId: string;
  trimester: 1 | 2 | 3;
  status: 'draft' | 'submitted_to_director' | 'signed_by_director' | 'published';
}

export interface PedagogicalCompetencyRole {
  roleType: 'diretor_turma' | 'delegado_disciplina' | 'delegado_ciclo';
  classId?: string; // Para Diretor de Turma
  className?: string;
  subjectId?: string; // Para Delegado de Disciplina
  subjectName?: string;
  ciclo?: '1º Ciclo' | '2º Ciclo' | '3º Ciclo'; // Para Delegado de Ciclo
  assignedAt?: string;
  assignedBy?: string;
}

export interface Employee {
  id: string;
  schoolId: string;
  name: string;
  role?: string;
  area?: "CS" | "MCN" | "APTP";
  gender: string;
  nuit: string;
  email: string;
  phone: string;
  maritalStatus: string;
  fatherName: string;
  motherName: string;
  idCardNumber: string;
  idCardIssuedAt: string;
  idCardIssuedDate: string;
  
  nationality: string;
  birthProvince: string;
  birthDistrict: string;
  birthDate: string;
  address: string;
  neighborhood: string;
  residenceDistrict: string;
  cell: string;
  blockNo: string;
  houseNo: string;
  childrenCount: number;

  career: string;
  category: string;
  roleFunction: string;
  isEffective: string;
  contractType: string;
  contractLink: string;
  admissionDate: string;
  academicLevel: string;
  trainingArea: string;
  leadershipRole?: string; // Cargo de Chefia
  department?: string; // Alocação: Secretaria, Biblioteca, etc.

  taughtSubjects: string[];

  // Competências Atribuídas pela Direcção Pedagógica
  competencies?: any;
  competencyRoles?: PedagogicalCompetencyRole[];
  isDiretorTurma?: boolean;
  diretorTurmaClassId?: string;
  diretorTurmaClassName?: string;
  isDelegadoDisciplina?: boolean;
  delegadoDisciplinaSubjectId?: string;
  delegadoDisciplinaSubjectName?: string;
  isDelegadoCiclo?: boolean;
  delegadoCicloType?: '1º Ciclo' | '2º Ciclo' | '3º Ciclo';
  status?: 'pendente' | 'validado';
  allocatedBy?: Role;
  allocationDate?: string;
  verifiedBy?: string;
  verifiedAt?: string;

  // Processo Individual do Colaborador (Campos Oficiais Estado/MINEDH)
  section?: string;
  processNumber?: string;
  sector?: string;
  entryDate?: string;
  birthPlace?: string;
  literaryQualifications?: string;
  professionalQualifications?: string;
  nationalitySector?: string;
  city?: string;
  blockNumber?: string;
  houseNumber?: string;
  
  professionalSkills?: string;
  professionalCardNo?: string;
  unionMemberNo?: string;
  previousWorkHistory?: Array<{ year: string; companyOrService: string; obs: string }>;
  minorChildrenList?: Array<{ birthDate: string; name: string; birthDate2?: string; name2?: string }>;
  professionalQualificationsEvolution?: Array<{ date: string; description: string }>;
  literaryQualificationsEvolution?: Array<{ date: string; description: string }>;
  categoryAndSalaryVariations?: Array<{ date: string; category: string; salary: string; date2?: string; category2?: string; salary2?: string }>;
  vacationMovement?: Array<{ period: string; days: string; justifiedAbsences: string; unjustifiedDays: string; daysToEnjoy: string; startDate: string; endDate: string; rubric: string }>;
  annualAbsences?: Array<{ date: string; category: string; salary: string; date2?: string; category2?: string; salary2?: string }>;
  observations?: string;
  photoUrl?: string;
  attachedDocuments?: Array<{ id: string; date: string; title: string; fileName?: string; fileUrl?: string; type?: string; uploadedAt?: string }>;
}

export interface AcademicEvent {
  id: string;
  title: string;
  description?: string;
  message?: string;
  date: string; // YYYY-MM-DD (compatibilidade)
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  location: string; // Lugar
  roomNumber: string; // Número da sala
  targetAudience: string; // Público-alvo
  category: 'feriado' | 'prazo' | 'evento' | 'reuniao';
  recipients?: { id: string; name: string; role: string; email?: string }[];
  creatorName: string;
  creatorRole: string;
  schoolId?: string;
  createdAt?: string;
}

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  eventId?: string;
  eventDetails?: AcademicEvent;
  senderName: string;
  senderRole: string;
  recipientId?: string;
  recipientName?: string;
  targetLocation?: string;
  isRead?: boolean;
  createdAt: string;
  schoolId?: string;
  targetAudience?: 'todos' | 'professores' | 'alunos' | 'pais';
  priority?: 'urgente' | 'importante' | 'normal';
  category?: 'Académico' | 'Exames' | 'Administrativo' | 'Financeiro' | 'Geral';
}

export interface EmailNotification {
  id: string;
  teacherEmail: string;
  teacherName: string;
  subject: string;
  message: string;
  classId?: string;
  className?: string;
  sentAt: string;
  status: 'SENT' | 'FAILED';
}

export interface SmtpSettings {
  host: string;
  port: number;
  username: string;
  password?: string;
  encryption: 'TLS' | 'SSL' | 'NONE';
  senderName: string;
  senderEmail: string;
  replyTo?: string;
  isActive: boolean;
  lastTestedAt?: string;
  autoSendOnTrimesterClose: boolean;
}

// 7. Gestão Financeira
export interface FinancialTransaction {
  id: string;
  schoolId: string;
  type: 'receita' | 'despesa';
  category: 'Propinas' | 'Taxas' | 'Multas' | 'Outros Serviços' | 'Salários' | 'Material Escolar' | 'Água' | 'Energia' | 'Manutenção' | 'Investimento';
  amount: number;
  date: string;
  description: string;
  referenceNumber: string;
  studentId?: string;
  studentName?: string;
  employeeId?: string;
  payerBeneficiary: string;
  paymentMethod: 'M-Pesa' | 'e-Mola' | 'Transferência Bancária' | 'POS' | 'Numerário' | 'Cheque';
  status: 'pago' | 'pendente' | 'cancelado';
  receiptUrl?: string;
  month?: string;
  year: number;
}

// 8. Gestão Patrimonial
export interface PatrimonyItem {
  id: string;
  schoolId: string;
  code: string;
  name: string;
  category: 'Computadores' | 'Mobiliário' | 'Equipamentos' | 'Viaturas' | 'Laboratórios';
  status: 'Bom' | 'Regular' | 'Danificado' | 'Em Manutenção' | 'Abatido';
  condition?: string;
  locationRoom: string;
  acquisitionDate: string;
  acquisitionValue: number;
  serialNumber?: string;
  responsiblePerson: string;
  notes?: string;
  lastMaintenanceDate?: string;
}

export interface PatrimonyMovement {
  id: string;
  schoolId: string;
  itemId: string;
  itemName: string;
  type: 'Aquisição' | 'Movimentação' | 'Manutenção' | 'Abate';
  date: string;
  fromLocation?: string;
  toLocation?: string;
  reason: string;
  registeredBy: string;
  documentRef?: string;
}

// 9. Biblioteca Escolar
export interface LibraryBook {
  id: string;
  schoolId: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  gradeLevel?: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  yearPublished?: number;
  publisher?: string;
}

export interface LibraryLoan {
  id: string;
  schoolId: string;
  bookId: string;
  bookTitle: string;
  userType: 'aluno' | 'professor' | 'funcionario';
  userId: string;
  userName: string;
  loanDate: string;
  expectedReturnDate: string;
  returnDate?: string;
  status: 'Activo' | 'Devolvido' | 'Atrasado';
  penaltyAmount?: number;
  notes?: string;
}

// 10. Recursos Humanos (RH)
export interface HRContract {
  id: string;
  employeeId: string;
  employeeName: string;
  schoolId: string;
  contractType: 'Nomeação Definitiva' | 'Contrato de Trabalho a Termo Certo' | 'Eventual' | 'Prestação de Serviços';
  startDate: string;
  endDate?: string;
  salaryGrade: string;
  status: 'Activo' | 'Renovado' | 'Cessado' | 'Em Avaliação';
  position: string;
}

export interface HRLeave {
  id: string;
  employeeId: string;
  employeeName: string;
  schoolId: string;
  type: 'Férias' | 'Licença de Doença' | 'Licença de Maternidade/Paternidade' | 'Casamento' | 'Luto' | 'Formação' | 'Assuntos Pessoais';
  startDate: string;
  endDate: string;
  totalDays: number;
  status: 'Pendente' | 'Aprovada' | 'Rejeitada' | 'Rejeitado' | 'Aprovado';
  approvedBy?: string;
  documentProofUrl?: string;
  reason?: string;
}

export interface HRPromotion {
  id: string;
  employeeId: string;
  employeeName: string;
  schoolId: string;
  previousCategory: string;
  newCategory: string;
  date: string;
  officialBulletinNumber?: string;
  approvedBy: string;
}

export interface HRTraining {
  id: string;
  employeeId: string;
  employeeName: string;
  schoolId: string;
  courseTitle: string;
  institution: string;
  hours: number;
  completionDate: string;
  certificateStatus: 'Concluído' | 'Em Curso' | 'Agendado';
}

// Secretaria: Atendimento / Recepção
export interface ReceptionVisitor {
  id: string;
  schoolId: string;
  visitorName: string;
  idCard: string;
  phone: string;
  reason: 'Matrículas/Secretaria' | 'Reunião com Direcção' | 'Contacto com Professor' | 'Levantamento de Documentos' | 'Informações Gerais' | 'Outro';
  departmentTarget: string;
  entryTime: string;
  exitTime?: string;
  status: 'Em Atendimento' | 'Concluído' | 'Aguardando';
  attendantName: string;
  notes?: string;
}

export interface ReceptionTicket {
  id: string;
  schoolId: string;
  ticketNumber: string;
  serviceType: 'Secretaria Geral' | 'Tesouraria' | 'Matrículas' | 'Declarações e Certificados' | 'Gabinete do Director';
  service?: string;
  priority?: string;
  requestedAt: string;
  calledAt?: string;
  completedAt?: string;
  status: 'waiting' | 'in_service' | 'done' | 'Chamado';
}

// Secretaria: Arquivo Escolar
export interface ArchiveRecord {
  id: string;
  schoolId?: string;
  code: string;
  title: string;
  recordType?: string;
  type?: string;
  numberOrMonth?: string; // Nº/Mês
  year: number;
  subject?: string; // Assunto
  recipient?: string; // Destinatário que recebeu
  boxNumber?: string;
  shelfNumber?: string;
  room?: string;
  roomNumber?: string;
  digitalFileUrl?: string;
  status: 'Arquivado' | 'Em Consulta' | 'Transferido';
  notes?: string;
  archivedAt?: string;
}

// Horários e Salas
export interface ClassSchedule {
  id: string;
  schoolId: string;
  classId: string;
  className: string;
  dayOfWeek: 'Segunda-feira' | 'Terça-feira' | 'Quarta-feira' | 'Quinta-feira' | 'Sexta-feira' | 'Sábado';
  timeSlot: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  room: string;
}

export interface SchoolRoom {
  id: string;
  schoolId: string;
  name: string;
  capacity: number;
  type: 'Sala Normal' | 'Laboratório de Informática' | 'Laboratório de Ciências' | 'Biblioteca' | 'Ginásio/Polidesportivo' | 'Oficina';
  status: 'Disponível' | 'Ocupada' | 'Em Manutenção';
}

// 14. Inteligência Artificial Educacional
export interface AIPrediction {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  dropOutRiskScore: number; // 0-100%
  riskLevel: 'Baixo' | 'Médio' | 'Alto';
  riskFactors: string[];
  recommendedInterventions: string[];
  predictedFinalAverage: number;
  attendanceRate: number;
  generatedAt: string;
}

export interface Petition {
  id: string;
  studentId: string;
  studentName: string;
  description: string;
  status: 'Recepção' | 'Triagem' | 'Secretaria-Geral' | 'Direcção' | 'Concluído';
  history: {
    role: string;
    action: string;
    timestamp: string;
  }[];
  createdAt: string;
}

export interface AIReportGeneration {
  id: string;
  title: string;
  type: string;
  content: string;
  metrics?: Record<string, any>;
  generatedAt: string;
  schoolId?: string;
}

export type AIReport = AIReportGeneration;

export interface EvaluationItem {
  id: string;
  schoolId: string;
  classId: string;
  className: string;
  subjectName: string;
  type: 'ACS' | 'APT' | 'Exame';
  title: string;
  date: string;
  time: string;
  room?: string;
  teacherName: string;
}

export interface ClassTaskSubmission {
  id: string;
  taskId: string;
  studentId: string;
  studentName: string;
  classId: string;
  subjectName: string;
  submittedAt: string;
  answerText: string;
  fileName?: string;
  fileUrl?: string;
  grade?: number; // Nota atribuída pelo docente (ex: 0 a 20)
  feedback?: string; // Comentários do docente
}

export interface ClassTaskItem {
  id: string;
  schoolId: string;
  classId: string;
  className?: string;
  subjectId?: string;
  subjectName?: string; // Organizado por disciplina
  teacherId?: string;
  teacherName: string;
  title: string;
  description: string;
  dueDate: string;
  fileName?: string;
  fileUrl?: string;
  createdAt: string;
  submissions?: ClassTaskSubmission[];
}

export interface BackupRecord {
  id: string;
  createdAt: string;
  triggeredBy: string;
  type: 'automático' | 'manual';
  status: 'concluído' | 'em_progresso' | 'falha';
  pedagogicalCount: number;
  administrativeCount: number;
  summary: string;
  sizeKb: number;
  details?: {
    studentsCount: number;
    classesCount: number;
    gradesCount: number;
    evaluationsCount: number;
    tasksCount: number;
    reportsCount: number;
    schoolsCount: number;
    usersCount: number;
    employeesCount: number;
    documentsCount: number;
    financialTransactionsCount: number;
    patrimonyCount: number;
  };
}


