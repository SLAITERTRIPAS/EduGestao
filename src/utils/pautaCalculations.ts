import { Student, Class, Grade, ExamGrade } from '../types';

/**
 * Abbreviates class name to official MINEDH format:
 * e.g., "Turma A" -> "T/A", "Turma B" -> "T/B", "10ª Turma A" -> "T/A"
 */
export function formatTurmaAbrev(classInput?: string | Class | null): string {
  if (!classInput) return 'T/A';
  const rawName = typeof classInput === 'string' ? classInput : classInput.name || '';
  
  // If already in T/X format
  const alreadyMatch = rawName.trim().match(/^T\/([A-Za-z0-9]+)$/i);
  if (alreadyMatch) {
    return `T/${alreadyMatch[1].toUpperCase()}`;
  }

  // Look for "Turma X" pattern
  const turmaMatch = rawName.match(/Turma\s+([A-Za-z0-9]+)/i);
  if (turmaMatch) {
    return `T/${turmaMatch[1].toUpperCase()}`;
  }

  // Look for trailing letter/code e.g. "10ª A" -> "A"
  const letterMatch = rawName.trim().match(/([A-Za-z0-9]+)$/);
  if (letterMatch) {
    return `T/${letterMatch[1].toUpperCase()}`;
  }

  return `T/${rawName.slice(0, 1).toUpperCase()}`;
}

/**
 * Checks if a class or period is Laboral (Diurno: Manhã / Tarde) vs. Pós-Laboral (Noturno / Noite)
 */
export function isLaboralPeriod(period?: string | null): boolean {
  if (!period) return true;
  const normalized = period.toLowerCase();
  if (normalized.includes('noite') || normalized.includes('noturno') || normalized.includes('pós') || normalized.includes('pos')) {
    return false;
  }
  return true;
}

/**
 * Checks if a class is an Exam class (3ª, 6ª, 9ª e 12ª Classe) vs Non-Exam class (1ª, 2ª, 4ª, 5ª, 7ª, 8ª, 10ª, 11ª Classe)
 */
export function isExamGradeLevel(gradeLevel?: string | null): boolean {
  if (!gradeLevel) return false;
  const g = gradeLevel.toLowerCase();
  const match = g.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    return num === 3 || num === 6 || num === 9 || num === 12;
  }
  return g.includes('3') || g.includes('6') || g.includes('9') || g.includes('12');
}

export interface StudentPautaData {
  student: Student;
  classObj?: Class;
  turmaAbrev: string; // e.g. "T/A"
  frequencyNumber: number; // Nº FREQU. - Fixo por ano letivo durante a frequência (não substituível)
  pautaNumber: number | null; // Nº PAUT - Apenas para alunos admitidos ao exame (1, 2, 3...)
  isAdmittedToExam: boolean;
  finalStatus: 'ADMITIDO' | 'DISPENSADO' | 'EXCLUÍDO' | 'TRANSITA' | 'NÃO TRANSITA';
  periodType: 'LABORAL' | 'POS_LABORAL';
  juriNumber: number | null; // Júri composto por 30 alunos (Júri 01, Júri 02...)
  mfOverall: number | null; // Média de Frequência Geral
  mcOverall: number | null; // Média de Ciclo (M.CICLO = M.FREQ)
}

/**
 * Helper to compute student status and grade averages
 */
export function calculateStudentMF(
  studentId: string,
  grades: Grade[],
  subjectIds: string[]
): number | null {
  const subjectAverages: number[] = [];

  subjectIds.forEach(subId => {
    const t1 = grades.find(g => g.studentId === studentId && g.subjectId === subId && g.trimester === 1)?.media;
    const t2 = grades.find(g => g.studentId === studentId && g.subjectId === subId && g.trimester === 2)?.media;
    const t3 = grades.find(g => g.studentId === studentId && g.subjectId === subId && g.trimester === 3)?.media;
    
    const valid = [t1, t2, t3].filter((v): v is number => v !== undefined && v !== null);
    if (valid.length > 0) {
      const avg = Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
      subjectAverages.push(avg);
    }
  });

  if (subjectAverages.length === 0) return null;
  return Math.round(subjectAverages.reduce((a, b) => a + b, 0) / subjectAverages.length);
}

/**
 * Core Mozambican Exam Roster Processor:
 * 1. Nº FREQUÊNCIA: Número fixo de identificação na frequência da turma (não é substituído).
 * 2. Nº DE PAUTA: Atribuído ÚNICA e EXCLUSIVAMENTE aos alunos ADMITIDOS aos exames, começando em 1.
 * 3. LABORAL (Diurno): Alunos admitidos ordenados em ORDEM ALFABÉTICA contínua no geral (A-Z).
 *    Recebem Nº de Pauta de 1 a N_laboral.
 * 4. PÓS-LABORAL (Noturno): Alunos admitidos ordenados com a sua ORDEM ALFABÉTICA INDEPENDENTE (A-Z).
 *    A contagem do Nº de Pauta CONTINUA exatamente de onde terminou o Laboral (começa em N_laboral + 1).
 * 5. CADA JÚRI É COMPOSTO POR 30 ALUNOS (Júri 01 = 1..30, Júri 02 = 31..60, etc.).
 * 6. MÉDIA DO CICLO = MÉDIA DE FREQUÊNCIA (M.CICLO = M.FREQ).
 * 7. TURMA abreviada para T/A, T/B, etc.
 */
export function buildOfficialPautaRoster(
  allStudents: Student[],
  allClasses: Class[],
  allGrades: Grade[],
  subjectIds: string[]
): {
  roster: StudentPautaData[];
  admittedLaboral: StudentPautaData[];
  admittedPosLaboral: StudentPautaData[];
  juris: { juriNumber: number; label: string; period: 'DIURNO' | 'NOTURNO'; studentCount: number; startPauta: number; endPauta: number }[];
  totalAdmitted: number;
  totalDispensados: number;
  totalExcluidos: number;
} {
  // 1. Group students by class to establish their immutable Nº de Frequência (Nº FREQU.)
  const studentMap = new Map<string, StudentPautaData>();

  // Map each class's students by registration/index order to give a fixed frequency number
  allClasses.forEach(cls => {
    const classStudents = allStudents
      .filter(s => s.classId === cls.id)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-PT', { sensitivity: 'base' }));

    const isLaboral = isLaboralPeriod(cls.period);

    classStudents.forEach((st, idx) => {
      const fixedFreqNumber = st.frequencyNumber ?? (idx + 1);
      
      // Calculate individual subject final grades and check for failing subjects
      let hasFailingSubject = false;
      const subjectFinalGrades: number[] = [];

      subjectIds.forEach(subId => {
        const t1 = allGrades.find(g => g.studentId === st.id && g.subjectId === subId && g.trimester === 1)?.media;
        const t2 = allGrades.find(g => g.studentId === st.id && g.subjectId === subId && g.trimester === 2)?.media;
        const t3 = allGrades.find(g => g.studentId === st.id && g.subjectId === subId && g.trimester === 3)?.media;
        
        const valid = [t1, t2, t3].filter((v): v is number => v !== undefined && v !== null);
        if (valid.length > 0) {
          const avg = Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
          subjectFinalGrades.push(avg);
          if (avg < 9.5) {
            hasFailingSubject = true;
          }
        }
      });

      const mf = subjectFinalGrades.length > 0 
        ? Math.round(subjectFinalGrades.reduce((a, b) => a + b, 0) / subjectFinalGrades.length) 
        : null;
      
      // Determination of final status according to Mozambican regulations:
      // Student TRANSITA/ADMITIDO only if ALL subjects >= 9.5 and overall MF >= 9.5
      // If ANY subject < 9.5 -> Não transita / Excluído
      const isExamClass = isExamGradeLevel(cls.gradeLevel);

      let status: 'ADMITIDO' | 'DISPENSADO' | 'EXCLUÍDO' | 'TRANSITA' | 'NÃO TRANSITA' = isExamClass ? 'ADMITIDO' : 'TRANSITA';
      if (mf !== null) {
        if (hasFailingSubject || mf < 9.5) {
          status = isExamClass ? 'EXCLUÍDO' : 'NÃO TRANSITA';
        } else {
          if (isExamClass) {
            if (mf >= 13.5) status = 'DISPENSADO';
            else status = 'ADMITIDO';
          } else {
            status = 'TRANSITA';
          }
        }
      }

      studentMap.set(st.id, {
        student: st,
        classObj: cls,
        turmaAbrev: formatTurmaAbrev(cls),
        frequencyNumber: fixedFreqNumber,
        pautaNumber: null, // Will be assigned only to admitted students below
        isAdmittedToExam: isExamClass && status === 'ADMITIDO',
        finalStatus: status,
        periodType: isLaboral ? 'LABORAL' : 'POS_LABORAL',
        juriNumber: null,
        mfOverall: mf,
        mcOverall: mf // M.CICLO = M.FREQ
      });
    });
  });

  // Collect all processed items
  const allProcessed = Array.from(studentMap.values());

  // 2. Filter Admitted students from LABORAL (Diurno)
  // Strict alphabetical order A-Z continuous in general
  const admittedLaboral = allProcessed
    .filter(p => p.periodType === 'LABORAL' && p.isAdmittedToExam)
    .sort((a, b) => a.student.name.localeCompare(b.student.name, 'pt-PT'));

  // 3. Assign sequential Nº de Pauta starting from 1 for Laboral
  let currentPautaNumber = 1;
  admittedLaboral.forEach(record => {
    record.pautaNumber = currentPautaNumber;
    // Each Júri is composed of exactly 30 students:
    record.juriNumber = Math.ceil(currentPautaNumber / 30);
    currentPautaNumber++;
  });

  // 4. Filter Admitted students from PÓS-LABORAL (Noturno)
  // Have independent alphabetical order (A-Z entre os do pós-laboral)
  const admittedPosLaboral = allProcessed
    .filter(p => p.periodType === 'POS_LABORAL' && p.isAdmittedToExam)
    .sort((a, b) => a.student.name.localeCompare(b.student.name, 'pt-PT'));

  // 5. Continuation of Nº de Pauta for Pós-Laboral:
  // "a contagem continua, mais a ordem de pós laboral dos alunos começa onde termina os laboral"
  admittedPosLaboral.forEach(record => {
    record.pautaNumber = currentPautaNumber;
    // Júri continuation or calculation with 30 students per Júri:
    record.juriNumber = Math.ceil(currentPautaNumber / 30);
    currentPautaNumber++;
  });

  // 6. Build the list of Júris (composta por 30 alunos cada)
  const totalAdmittedCount = currentPautaNumber - 1;
  const totalJuris = Math.max(1, Math.ceil(totalAdmittedCount / 30));
  const juris: { juriNumber: number; label: string; period: 'DIURNO' | 'NOTURNO'; studentCount: number; startPauta: number; endPauta: number }[] = [];

  for (let j = 1; j <= totalJuris; j++) {
    const startP = (j - 1) * 30 + 1;
    const endP = Math.min(totalAdmittedCount, j * 30);
    const countInJuri = Math.max(0, endP - startP + 1);
    
    // Check which period this Júri predominantly belongs to
    const juriStudents = [...admittedLaboral, ...admittedPosLaboral].filter(s => s.juriNumber === j);
    const posLaboralCount = juriStudents.filter(s => s.periodType === 'POS_LABORAL').length;
    const isMainlyPosLaboral = posLaboralCount > juriStudents.length / 2;

    juris.push({
      juriNumber: j,
      label: `Júri Nº ${String(j).padStart(2, '0')} (Alunos ${startP} a ${endP})`,
      period: isMainlyPosLaboral ? 'NOTURNO' : 'DIURNO',
      studentCount: countInJuri,
      startPauta: startP,
      endPauta: endP
    });
  }

  return {
    roster: allProcessed,
    admittedLaboral,
    admittedPosLaboral,
    juris,
    totalAdmitted: admittedLaboral.length + admittedPosLaboral.length,
    totalDispensados: allProcessed.filter(p => p.finalStatus === 'DISPENSADO').length,
    totalExcluidos: allProcessed.filter(p => p.finalStatus === 'EXCLUÍDO').length
  };
}
