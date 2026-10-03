/**
 * Motor de Transição Escolar, Renovação Automática de Matrículas e Arquivo Digital
 * Implementação rigorosa de RF-MAT-002, RF-MAT-003 e RF-HIST-001
 * Sistema EduGestão / SIGE Moçambique
 */

import { Student, Class, School, Grade, ExamGrade, SchoolTransitionBatch, AutoRenewalSummary, IssuedDeclaration, IssuedCertificate, AcademicHistoryEntry } from '../types';
import { generateIUE, generateNIM, generateStudentQRCodePayload, formatDocumentReference } from './iueGenerator';

// Sequência oficial de classes em Moçambique
export const MOZAMBIQUE_GRADE_SEQUENCE = [
  '1.ª Classe', '2.ª Classe', '3.ª Classe', '4.ª Classe', '5.ª Classe', '6.ª Classe',
  '7.ª Classe', '8.ª Classe', '9.ª Classe', '10ª Classe', '11ª Classe', '12ª Classe'
];

/**
 * Converte a string de classe para um número de ordenação
 */
export function getGradeIndex(gradeLevel?: string): number {
  if (!gradeLevel) return 0;
  const num = parseInt(gradeLevel.replace(/[^0-9]/g, ''), 10);
  if (!isNaN(num) && num >= 1 && num <= 12) {
    return num;
  }
  return 10;
}

/**
 * Retorna a classe seguinte na cadeia formatada
 */
export function getNextGradeLevel(currentGrade: string): string | null {
  const currentNum = getGradeIndex(currentGrade);
  if (currentNum >= 12) return null;
  const nextNum = currentNum + 1;
  return nextNum >= 10 ? `${nextNum}ª Classe` : `${nextNum}.ª Classe`;
}

/**
 * Normaliza o nome da turma para manter a letra (ex: "Turma A", "9ª A" -> "A")
 */
export function extractClassLetter(className?: string): string {
  if (!className) return 'A';
  const match = className.match(/([A-Z])/i);
  return match ? match[1].toUpperCase() : 'A';
}

/**
 * Calcula se o aluno foi aprovado ou reprovado com base nas notas ou histórico
 */
export function evaluateStudentResult(
  student: Student,
  grades: Grade[],
  examGrades: ExamGrade[]
): { isApproved: boolean; average: number; isGraduatedLevel: boolean } {
  const studentGrades = grades.filter(g => g.studentId === student.id);
  const studentExamGrades = examGrades.filter(eg => eg.studentId === student.id);

  if (studentExamGrades.length > 0) {
    const totalExamCF = studentExamGrades.reduce((sum, eg) => sum + (eg.classificacaoFinal || eg.mediaFrequencia || 10), 0);
    const avg = Math.round(totalExamCF / studentExamGrades.length);
    const hasFail = studentExamGrades.some(eg => eg.resultado === 'Reprovado' || (eg.classificacaoFinal && eg.classificacaoFinal < 9.5));
    return {
      isApproved: !hasFail && avg >= 10,
      average: avg || 13,
      isGraduatedLevel: false
    };
  }

  if (studentGrades.length > 0) {
    const scores = studentGrades.map(g => g.media ?? g.apt ?? g.acs1 ?? 12).filter((s): s is number => typeof s === 'number');
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 13;
    return {
      isApproved: avg >= 10,
      average: avg,
      isGraduatedLevel: false
    };
  }

  // Fallback padrão se não houver notas lançadas: considera aprovado com média 13
  return {
    isApproved: true,
    average: 13,
    isGraduatedLevel: false
  };
}

/**
 * Determina a classe máxima lecionada por uma escola
 */
export function getSchoolMaxGrade(school: School, classes: Class[]): string {
  const schoolClasses = classes.filter(c => c.schoolId === school.id);
  if (schoolClasses.length > 0) {
    let maxIdx = 0;
    let maxGrade = '10ª Classe';
    schoolClasses.forEach(c => {
      const idx = getGradeIndex(c.gradeLevel);
      if (idx > maxIdx) {
        maxIdx = idx;
        maxGrade = c.gradeLevel;
      }
    });
    return maxGrade;
  }

  if (school.autoAssignedClasses && school.autoAssignedClasses.length > 0) {
    let maxIdx = 0;
    let maxGrade = school.autoAssignedClasses[0];
    school.autoAssignedClasses.forEach(g => {
      const idx = getGradeIndex(g);
      if (idx > maxIdx) {
        maxIdx = idx;
        maxGrade = g;
      }
    });
    return maxGrade;
  }

  // Fallback por tipo de escola
  if (school.schoolTypes?.includes('EP1')) return '5.ª Classe';
  if (school.schoolTypes?.includes('EP2') || school.schoolTypes?.includes('ENSINO BÁSICO')) return '9.ª Classe';
  if (school.schoolTypes?.includes('ENSINO SECUNDÁRIO DO 1 CICLO')) return '10ª Classe';
  return '12ª Classe';
}

/**
 * Localiza a escola ativa mais próxima que leciona a classe pretendida (RF-MAT-002 ponto 6 & RF-MAT-003 ponto 3)
 */
export function findNearestContinuationSchool(
  originSchool: School,
  targetGrade: string,
  allSchools: School[],
  allClasses: Class[],
  excludedSchoolIds: string[] = []
): School | null {
  const targetGradeNum = getGradeIndex(targetGrade);

  const candidateSchools = allSchools.filter(s => {
    if (s.id === originSchool.id) return false;
    if (excludedSchoolIds.includes(s.id)) return false;

    // Verificar se leciona a classe pretendida
    const teachesTarget = allClasses.some(c => c.schoolId === s.id && getGradeIndex(c.gradeLevel) === targetGradeNum) ||
      (s.autoAssignedClasses && s.autoAssignedClasses.some(g => getGradeIndex(g) === targetGradeNum)) ||
      (targetGradeNum >= 11 && s.schoolTypes?.some(st => st.includes('2 CICLO') || st.includes('PRÉ-UNIVERSITÁRIO') || st.includes('TÉCNICO'))) ||
      (targetGradeNum >= 6 && targetGradeNum <= 10 && s.schoolTypes?.some(st => st.includes('SECUNDÁRIO') || st.includes('BÁSICO')));

    return teachesTarget;
  });

  if (candidateSchools.length === 0) {
    // Retorna qualquer outra escola disponível como fallback
    return allSchools.find(s => s.id !== originSchool.id && !excludedSchoolIds.includes(s.id)) || null;
  }

  // Priorizar escolas no mesmo distrito
  const sameDistrict = candidateSchools.filter(s => s.district === originSchool.district || s.districtId === originSchool.districtId);
  if (sameDistrict.length > 0) return sameDistrict[0];

  // Priorizar escolas na mesma província
  const sameProvince = candidateSchools.filter(s => s.province === originSchool.province);
  if (sameProvince.length > 0) return sameProvince[0];

  return candidateSchools[0];
}

/**
 * Executa o Processo Anual de Renovação Automática e Transição Escolar
 * Implementa integralmente RF-MAT-002 e RF-HIST-001
 */
export function runAutomatedEnrollmentRenewal(params: {
  schoolId: string;
  targetYear: number;
  schools: School[];
  classes: Class[];
  students: Student[];
  grades: Grade[];
  examGrades: ExamGrade[];
  existingBatches?: SchoolTransitionBatch[];
}): {
  updatedStudents: Student[];
  newClasses: Class[];
  newBatches: SchoolTransitionBatch[];
  newDeclarations: IssuedDeclaration[];
  newCertificates: IssuedCertificate[];
  summary: AutoRenewalSummary;
} {
  const { schoolId, targetYear, schools, classes, students, grades, examGrades, existingBatches = [] } = params;
  const currentSchool = schools.find(s => s.id === schoolId) || schools[0];
  const maxSchoolGrade = getSchoolMaxGrade(currentSchool, classes);
  const maxSchoolGradeNum = getGradeIndex(maxSchoolGrade);

  // Alunos ativos da escola a processar
  const schoolStudents = students.filter(s => s.schoolId === schoolId && s.status !== 'transferred');

  let updatedStudents = [...students];
  let updatedClasses = [...classes];
  let newBatches: SchoolTransitionBatch[] = [];
  let newDeclarations: IssuedDeclaration[] = [];
  let newCertificates: IssuedCertificate[] = [];

  let promotedCount = 0;
  let retainedCount = 0;
  let graduatedCount = 0;

  // Agrupamento para criação de lotes de transição de graduados
  const graduatedByTargetGrade: Record<string, { targetGrade: string; targetSchool: School; studentList: Student[]; avgMap: Record<string, number> }> = {};

  // Agrupamento de reprovados por classe para alocação nas últimas turmas (Turma D, C...)
  const retainedByGrade: Record<string, Student[]> = {};

  // 1. Processar cada aluno ativo
  schoolStudents.forEach(st => {
    const studentClass = classes.find(c => c.id === st.classId);
    const currentGrade = studentClass?.gradeLevel || st.entryGrade || '10ª Classe';
    const currentGradeNum = getGradeIndex(currentGrade);
    const className = studentClass?.name || 'Turma A';
    const classLetter = extractClassLetter(className);

    const { isApproved, average } = evaluateStudentResult(st, grades, examGrades);

    // Garantir IUE institucional oficial
    const officialIue = st.iue || generateIUE({
      name: st.name,
      documentNumber: st.idCardNumber || st.nuit,
      idCardNumber: st.idCardNumber,
      nuit: st.nuit,
      schoolName: currentSchool.name,
      schoolCode: currentSchool.code,
      province: currentSchool.province,
      district: currentSchool.district,
      academicYear: targetYear - 1
    });

    const officialNim = st.nim || generateNIM({
      year: targetYear,
      district: currentSchool.district,
      sequenceNumber: Math.floor(100 + Math.random() * 900)
    });

    // Caso A: Aluno Aprovado que Concluiu a Última Classe da Escola -> Graduado com Transição Inter-Escolar (RF-MAT-002 #5 & RF-MAT-003)
    if (isApproved && currentGradeNum >= maxSchoolGradeNum) {
      graduatedCount++;
      const nextGrade = getNextGradeLevel(currentGrade) || '11ª Classe';
      const targetSchool = findNearestContinuationSchool(currentSchool, nextGrade, schools, classes) || schools[1] || currentSchool;

      if (!graduatedByTargetGrade[nextGrade]) {
        graduatedByTargetGrade[nextGrade] = {
          targetGrade: nextGrade,
          targetSchool: targetSchool,
          studentList: [],
          avgMap: {}
        };
      }
      graduatedByTargetGrade[nextGrade].studentList.push(st);
      graduatedByTargetGrade[nextGrade].avgMap[st.id] = average;

      // Gerar Certificado de Conclusão Oficial (RF-HIST-001)
      const certId = `cert-${Date.now()}-${st.id}`;
      const certCode = `CERT-MZ-${targetYear - 1}-${currentGrade.replace(/[^0-9]/g, '') || '10'}C-${(st?.id || 'ALU').toUpperCase()}`;
      const certQr = generateStudentQRCodePayload({
        iue: officialIue,
        name: st.name,
        schoolName: currentSchool.name,
        province: currentSchool.province,
        district: currentSchool.district,
        gradeLevel: currentGrade,
        className: className,
        academicYear: targetYear - 1,
        status: 'Graduado do Nível'
      });

      const newCert: IssuedCertificate = {
        id: certId,
        studentId: st.id,
        studentName: st.name,
        iue: officialIue,
        nim: officialNim,
        certificateCode: certCode,
        type: 'CERTIFICADO DE CONCLUSÃO',
        gradeLevel: currentGrade,
        academicYear: targetYear - 1,
        schoolName: currentSchool.name,
        average: average,
        issuedAt: new Date().toLocaleDateString('pt-MZ'),
        verificationCode: `VERIF-MINEDH-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        qrPayload: certQr,
        directorName: currentSchool.directorName || 'Director da Escola',
        secretaryName: currentSchool.secretariatChiefName || 'Chefe da Secretaria'
      };
      newCertificates.push(newCert);

      // Gerar Declaração de Conclusão com Notas
      const declId = `decl-grad-${Date.now()}-${st.id}`;
      const newDecl: IssuedDeclaration = {
        id: declId,
        studentId: st.id,
        academicYear: targetYear - 1,
        gradeLevel: currentGrade,
        className: className,
        schoolName: currentSchool.name,
        issuedAt: new Date().toLocaleDateString('pt-MZ'),
        directorName: currentSchool.directorName || 'Director da Escola',
        secretaryName: currentSchool.secretariatChiefName || 'Chefe da Secretaria',
        status: 'Transitou',
        finalAverage: average,
        digitalSignatureHash: `SHA256:MZ-MINEDH-GRAD-${targetYear}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        verificationCode: `DEC-MZ-${targetYear - 1}-${currentGrade.replace(/[^0-9]/g, '') || '10'}C-${(st?.id || 'ALU').toUpperCase()}`,
        stamped: true,
        electronicallySigned: true,
        gradesSnapshot: []
      };
      newDeclarations.push(newDecl);

      // Atualizar Histórico Escolar Unificado Contínuo
      const historyEntry: AcademicHistoryEntry = {
        year: targetYear - 1,
        grade: currentGrade,
        school: currentSchool.name,
        result: `Aprovado / Graduado (Média: ${average}v)`
      };
      const existingHist = st.academicHistory || [];
      const updatedHist = [...existingHist.filter(h => String(h.year) !== String(targetYear - 1)), historyEntry];

      // Atualizar Aluno: Estado inicial de transição
      const studentIdx = updatedStudents.findIndex(s => s.id === st.id);
      if (studentIdx >= 0) {
        updatedStudents[studentIdx] = {
          ...st,
          iue: officialIue,
          nim: officialNim,
          status: 'active',
          enrollmentStatus: 'Concluído',
          reactivationStatus: 'AGUARDANDO REATIVAÇÃO',
          transitionStatus: 'awaiting_vacancy_confirmation',
          transitionTargetSchoolId: targetSchool.id,
          transitionSuggestedSchoolId: targetSchool.id,
          transitionSourceSchoolId: currentSchool.id,
          transitionGrade: nextGrade,
          academicHistory: updatedHist,
          issuedDeclarations: [newDecl, ...(st.issuedDeclarations || [])],
          issuedCertificates: [newCert, ...(st.issuedCertificates || [])]
        };
      }
    }
    // Caso B: Aluno Aprovado dentro da mesma escola -> Transita automaticamente para classe seguinte (RF-MAT-002 #1.1)
    else if (isApproved) {
      promotedCount++;
      const nextGrade = getNextGradeLevel(currentGrade) || currentGrade;

      // Procurar ou criar turma correspondente mantendo a mesma letra (ex: 8ª A -> 9ª A)
      let targetClass = updatedClasses.find(
        c => c.schoolId === schoolId && c.gradeLevel === nextGrade && extractClassLetter(c.name) === classLetter
      );

      if (!targetClass) {
        targetClass = {
          id: `cls-${schoolId}-${nextGrade.replace(/[^0-9]/g, '')}-${classLetter}-${targetYear}`,
          schoolId: schoolId,
          name: `Turma ${classLetter}`,
          gradeLevel: nextGrade,
          year: targetYear,
          period: studentClass?.period || 'Manhã'
        };
        updatedClasses.push(targetClass);
      }

      // Gerar Declaração de Aproveitamento e Frequência Automática (RF-HIST-001)
      const declId = `decl-auto-${Date.now()}-${st.id}`;
      const newDecl: IssuedDeclaration = {
        id: declId,
        studentId: st.id,
        academicYear: targetYear - 1,
        gradeLevel: currentGrade,
        className: className,
        schoolName: currentSchool.name,
        issuedAt: new Date().toLocaleDateString('pt-MZ'),
        directorName: currentSchool.directorName || 'Director da Escola',
        secretaryName: currentSchool.secretariatChiefName || 'Chefe da Secretaria',
        status: 'Transitou',
        finalAverage: average,
        digitalSignatureHash: `SHA256:MZ-MINEDH-TRANS-${targetYear}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        verificationCode: `DEC-MZ-${targetYear - 1}-${currentGrade.replace(/[^0-9]/g, '') || '10'}C-${(st?.id || 'ALU').toUpperCase()}`,
        stamped: true,
        electronicallySigned: true,
        gradesSnapshot: []
      };
      newDeclarations.push(newDecl);

      // Atualizar Histórico Contínuo
      const historyEntry: AcademicHistoryEntry = {
        year: targetYear - 1,
        grade: currentGrade,
        school: currentSchool.name,
        result: `Aprovado (Média: ${average}v)`
      };
      const existingHist = st.academicHistory || [];
      const updatedHist = [...existingHist.filter(h => String(h.year) !== String(targetYear - 1)), historyEntry];

      // Atualizar Aluno: Estado inicial PENDENTE DE REATIVAÇÃO
      const studentIdx = updatedStudents.findIndex(s => s.id === st.id);
      if (studentIdx >= 0) {
        updatedStudents[studentIdx] = {
          ...st,
          iue: officialIue,
          nim: officialNim,
          classId: targetClass.id,
          entryGrade: nextGrade,
          academicYear: targetYear,
          status: 'active',
          enrollmentStatus: 'Activo',
          reactivationStatus: 'PENDENTE DE REATIVAÇÃO',
          transitionStatus: 'none',
          academicHistory: updatedHist,
          issuedDeclarations: [newDecl, ...(st.issuedDeclarations || [])]
        };
      }
    }
    // Caso C: Aluno Reprovado -> Permanece na mesma classe, alocado nas últimas turmas disponíveis (RF-MAT-002 #2)
    else {
      retainedCount++;
      if (!retainedByGrade[currentGrade]) {
        retainedByGrade[currentGrade] = [];
      }
      retainedByGrade[currentGrade].push(st);

      // Gerar Declaração de Frequência / Não Transitou
      const declId = `decl-rep-${Date.now()}-${st.id}`;
      const newDecl: IssuedDeclaration = {
        id: declId,
        studentId: st.id,
        academicYear: targetYear - 1,
        gradeLevel: currentGrade,
        className: className,
        schoolName: currentSchool.name,
        issuedAt: new Date().toLocaleDateString('pt-MZ'),
        directorName: currentSchool.directorName || 'Director da Escola',
        secretaryName: currentSchool.secretariatChiefName || 'Chefe da Secretaria',
        status: 'Não Transitou',
        finalAverage: average,
        digitalSignatureHash: `SHA256:MZ-MINEDH-REP-${targetYear}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        verificationCode: `DEC-MZ-${targetYear - 1}-${currentGrade.replace(/[^0-9]/g, '') || '10'}C-${(st?.id || 'ALU').toUpperCase()}`,
        stamped: true,
        electronicallySigned: true,
        gradesSnapshot: []
      };
      newDeclarations.push(newDecl);

      const historyEntry: AcademicHistoryEntry = {
        year: targetYear - 1,
        grade: currentGrade,
        school: currentSchool.name,
        result: `Não Transitou (Média: ${average}v)`
      };
      const existingHist = st.academicHistory || [];
      const updatedHist = [...existingHist.filter(h => String(h.year) !== String(targetYear - 1)), historyEntry];

      const studentIdx = updatedStudents.findIndex(s => s.id === st.id);
      if (studentIdx >= 0) {
        updatedStudents[studentIdx] = {
          ...st,
          iue: officialIue,
          nim: officialNim,
          academicYear: targetYear,
          status: 'active',
          enrollmentStatus: 'Activo',
          reactivationStatus: 'PENDENTE DE REATIVAÇÃO',
          entryType: 'repetente',
          transitionStatus: 'none',
          academicHistory: updatedHist,
          issuedDeclarations: [newDecl, ...(st.issuedDeclarations || [])]
        };
      }
    }
  });

  // 2. Alocar Alunos Reprovados nas Últimas Turmas por Faixa Etária (RF-MAT-002 #2)
  Object.keys(retainedByGrade).forEach(gradeLevel => {
    const retainedList = retainedByGrade[gradeLevel];
    // Ordenar por idade (mais velhos primeiro para agrupar por faixa etária)
    retainedList.sort((a, b) => new Date(a.birthDate || '2008-01-01').getTime() - new Date(b.birthDate || '2008-01-01').getTime());

    // Turmas de trás para frente: Turma D, Turma C, Turma B
    const availableLetters = ['D', 'C', 'B', 'A'];
    const maxCapacityPerClass = 35;

    let letterIdx = 0;
    let currentCountInClass = 0;

    retainedList.forEach(st => {
      const classLetter = availableLetters[letterIdx] || 'D';
      let targetClass = updatedClasses.find(
        c => c.schoolId === schoolId && c.gradeLevel === gradeLevel && extractClassLetter(c.name) === classLetter
      );

      if (!targetClass) {
        targetClass = {
          id: `cls-${schoolId}-${gradeLevel.replace(/[^0-9]/g, '')}-${classLetter}-${targetYear}`,
          schoolId: schoolId,
          name: `Turma ${classLetter}`,
          gradeLevel: gradeLevel,
          year: targetYear,
          period: 'Tarde'
        };
        updatedClasses.push(targetClass);
      }

      const sIdx = updatedStudents.findIndex(s => s.id === st.id);
      if (sIdx >= 0) {
        updatedStudents[sIdx].classId = targetClass.id;
      }

      currentCountInClass++;
      if (currentCountInClass >= maxCapacityPerClass) {
        currentCountInClass = 0;
        letterIdx = Math.min(letterIdx + 1, availableLetters.length - 1);
      }
    });
  });

  // 3. Criar Lotes de Transição de Graduados (RF-MAT-002 #7, #8 & RF-MAT-003 #2)
  Object.keys(graduatedByTargetGrade).forEach(nextGrade => {
    const { targetGrade, targetSchool, studentList, avgMap } = graduatedByTargetGrade[nextGrade];
    if (studentList.length === 0) return;

    const batchId = `trans-batch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const batch: SchoolTransitionBatch = {
      id: batchId,
      sourceSchoolId: currentSchool.id,
      sourceSchoolName: currentSchool.name,
      targetSchoolId: targetSchool.id,
      targetSchoolName: targetSchool.name,
      completedGrade: maxSchoolGrade,
      targetGrade: targetGrade,
      academicYear: targetYear,
      totalStudents: studentList.length,
      status: 'Aguardando confirmação de vagas',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      students: studentList.map(st => ({
        studentId: st.id,
        studentIue: st.iue || '',
        studentNim: st.nim || '',
        studentName: st.name,
        finalAverage: avgMap[st.id] || 14,
        result: 'Graduado',
        status: 'AGUARDANDO CONFIRMAÇÃO DE VAGA'
      }))
    };

    newBatches.push(batch);
  });

  const summary: AutoRenewalSummary = {
    year: targetYear,
    schoolId: schoolId,
    totalProcessed: schoolStudents.length,
    promotedCount,
    retainedCount,
    graduatedCount,
    transitionBatchesCreated: newBatches.length,
    executedAt: new Date().toISOString()
  };

  return {
    updatedStudents,
    newClasses: updatedClasses,
    newBatches,
    newDeclarations,
    newCertificates,
    summary
  };
}

/**
 * Operador valida a documentação e reativa a matrícula (RF-MAT-002 #4)
 */
export function validateAndActivateEnrollment(
  student: Student,
  verifiedDocs: Record<string, boolean>
): Student {
  return {
    ...student,
    status: 'active',
    enrollmentStatus: 'Activo',
    reactivationStatus: 'MATRICULA_ATIVA',
    attachedDocuments: {
      ...(student.attachedDocuments || {}),
      ...verifiedDocs
    }
  };
}

/**
 * Confirmação de Vagas pelo Diretor da Escola de Destino (RF-MAT-002 #9 & RF-MAT-003 #5)
 */
export function handleDirectorVacancyDecision(params: {
  batch: SchoolTransitionBatch;
  decision: 'approve' | 'reject';
  directorName: string;
  allSchools: School[];
  allClasses: Class[];
  students: Student[];
}): {
  updatedBatch: SchoolTransitionBatch;
  updatedStudents: Student[];
  reassignedBatch?: SchoolTransitionBatch;
} {
  const { batch, decision, directorName, allSchools, allClasses, students } = params;

  if (decision === 'approve') {
    const updatedBatch: SchoolTransitionBatch = {
      ...batch,
      status: 'Vaga confirmada',
      approvedByDirectorName: directorName,
      updatedAt: new Date().toISOString(),
      students: batch.students.map(s => ({
        ...s,
        status: 'VAGA CONFIRMADA'
      }))
    };

    // Atualizar os alunos para figurarem em Novos Ingressos na escola de destino (RF-MAT-002 #10 & RF-MAT-003 #8)
    const updatedStudents = students.map(st => {
      const isCandidate = batch.students.some(bs => bs.studentId === st.id);
      if (!isCandidate) return st;

      return {
        ...st,
        schoolId: batch.targetSchoolId, // Passa a pertencer à escola de destino mantendo o mesmo IUE e histórico
        status: 'active' as const,
        enrollmentStatus: 'Activo' as const,
        isNewAdmission: true,
        entryType: 'novo_ingresso' as const,
        entryGrade: batch.targetGrade,
        transitionStatus: 'vacancy_confirmed' as const,
        reactivationStatus: 'AGUARDANDO REATIVAÇÃO' as const
      };
    });

    return { updatedBatch, updatedStudents };
  } else {
    // Rejeitar solicitação: buscar próxima escola mais próxima (RF-MAT-002 #9)
    const originSchool = allSchools.find(s => s.id === batch.sourceSchoolId) || allSchools[0];
    const nextNearestSchool = findNearestContinuationSchool(
      originSchool,
      batch.targetGrade,
      allSchools,
      allClasses,
      [batch.targetSchoolId] // excluir a que rejeitou
    );

    const updatedBatch: SchoolTransitionBatch = {
      ...batch,
      status: 'Rejeitado',
      updatedAt: new Date().toISOString(),
      students: batch.students.map(s => ({
        ...s,
        status: 'REJEITADO'
      }))
    };

    let reassignedBatch: SchoolTransitionBatch | undefined;
    if (nextNearestSchool) {
      reassignedBatch = {
        id: `trans-batch-reassign-${Date.now()}`,
        sourceSchoolId: batch.sourceSchoolId,
        sourceSchoolName: batch.sourceSchoolName,
        targetSchoolId: nextNearestSchool.id,
        targetSchoolName: nextNearestSchool.name,
        completedGrade: batch.completedGrade,
        targetGrade: batch.targetGrade,
        academicYear: batch.academicYear,
        totalStudents: batch.totalStudents,
        status: 'Aguardando confirmação de vagas',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        students: batch.students.map(s => ({
          ...s,
          status: 'AGUARDANDO CONFIRMAÇÃO DE VAGA'
        }))
      };
    }

    return { updatedBatch, updatedStudents: students, reassignedBatch };
  }
}

/**
 * Confirmação Final de Matrícula do Novo Ingresso pelo Operador de Matrícula na Escola de Destino (RF-MAT-003 #9)
 */
export function confirmDestinationStudentEnrollment(
  student: Student,
  targetClassId: string,
  targetSchool: School
): Student {
  return {
    ...student,
    schoolId: targetSchool.id,
    classId: targetClassId,
    status: 'active',
    enrollmentStatus: 'Activo',
    reactivationStatus: 'MATRICULA_ATIVA',
    transitionStatus: 'enrolled',
    isNewAdmission: false,
    enrollmentDate: new Date().toISOString().split('T')[0]
  };
}
