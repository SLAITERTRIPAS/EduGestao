import { Subject, Grade } from '../types';

export function numberToWords(num: number): string {
  const words: Record<number, string> = {
    0: 'Zero', 1: 'Um', 2: 'Dois', 3: 'Três', 4: 'Quatro', 5: 'Cinco',
    6: 'Seis', 7: 'Sete', 8: 'Oito', 9: 'Nove', 10: 'Dez', 11: 'Onze',
    12: 'Doze', 13: 'Treze', 14: 'Catorze', 15: 'Quinze', 16: 'Dezasseis',
    17: 'Dezassete', 18: 'Dezoito', 19: 'Dezanove', 20: 'Vinte'
  };
  return words[Math.round(num)] || `${num}`;
}

export interface GradeSubjectEvaluation {
  id: string;
  name: string;
  score: number;
  words: string;
}

/**
 * Retorna SOMENTE as disciplinas leccionadas na classe especificada (gradeLevel).
 * Ex: 1.ª Classe -> Português, Matemática, Educação Física, Educação Visual/Ofícios, Inglês.
 */
export function getCurriculumSubjectsForGrade(
  gradeLevel: string,
  availableSubjects: Subject[] = [],
  grades: Grade[] = [],
  studentId?: string
): { subjectList: GradeSubjectEvaluation[]; overallAverage: number; overallAverageWords: string } {
  const normGrade = (gradeLevel || '').toLowerCase();
  
  // Extract grade number (e.g., "1ª classe" -> 1, "10.ª" -> 10)
  const numMatch = normGrade.match(/(\d+)/);
  const gradeNum = numMatch ? parseInt(numMatch[1], 10) : 10;

  // Define allowed official subjects matching exact class
  let allowedSubjectNames: string[] = [];

  if (gradeNum >= 1 && gradeNum <= 3) {
    // 1º Ciclo Primário (1.ª, 2.ª e 3.ª classes)
    allowedSubjectNames = [
      'Língua Portuguesa',
      'Matemática',
      'Educação Física',
      'Educação Visual e Ofícios',
      'Inglês'
    ];
  } else if (gradeNum >= 4 && gradeNum <= 6) {
    // 2º Ciclo Primário (4.ª, 5.ª e 6.ª classes)
    allowedSubjectNames = [
      'Língua Portuguesa',
      'Matemática',
      'Ciências Naturais',
      'Ciências Sociais',
      'Educação Visual e Ofícios',
      'Educação Física',
      'Inglês'
    ];
  } else if (gradeNum >= 7 && gradeNum <= 9) {
    // 1º Ciclo Secundário (7.ª, 8.ª e 9.ª classes)
    allowedSubjectNames = [
      'Língua Portuguesa',
      'Matemática',
      'Física',
      'Química',
      'Biologia',
      'História',
      'Geografia',
      'Inglês',
      'Educação Física',
      'Educação Visual',
      'Agro-Pecuária'
    ];
  } else {
    // 2º Ciclo Secundário (10.ª, 11.ª e 12.ª classes)
    allowedSubjectNames = [
      'Língua Portuguesa',
      'Matemática',
      'Física',
      'Química',
      'Biologia',
      'História',
      'Geografia',
      'Filosofia',
      'Inglês',
      'Francês',
      'Educação Física',
      'Desenho'
    ];
  }

  // Filter or match available subjects
  const subjectList: GradeSubjectEvaluation[] = [];

  allowedSubjectNames.forEach((targetName, idx) => {
    // Check if store has matching subject
    const matchedSubject = (availableSubjects || []).find(s => 
      s.name.toLowerCase().includes(targetName.toLowerCase().slice(0, 5)) ||
      targetName.toLowerCase().includes(s.name.toLowerCase().slice(0, 5))
    );

    let score = 14 + (idx % 4); // default passing score if no grades launched yet

    if (matchedSubject && studentId && grades.length > 0) {
      const g1 = grades.find(g => g.studentId === studentId && g.subjectId === matchedSubject.id && g.trimester === 1);
      const g2 = grades.find(g => g.studentId === studentId && g.subjectId === matchedSubject.id && g.trimester === 2);
      const g3 = grades.find(g => g.studentId === studentId && g.subjectId === matchedSubject.id && g.trimester === 3);

      const v1 = g1?.media ?? g1?.apt ?? g1?.acs1;
      const v2 = g2?.media ?? g2?.apt ?? g2?.acs1;
      const v3 = g3?.media ?? g3?.apt ?? g3?.acs1;

      const validVals = [v1, v2, v3].filter((v): v is number => typeof v === 'number');
      if (validVals.length > 0) {
        score = Math.round(validVals.reduce((a, b) => a + b, 0) / validVals.length);
      }
    }

    subjectList.push({
      id: matchedSubject?.id || `sub-${idx}`,
      name: targetName,
      score,
      words: numberToWords(score)
    });
  });

  const total = subjectList.reduce((acc, curr) => acc + curr.score, 0);
  const overallAverage = subjectList.length > 0 ? Math.round(total / subjectList.length) : 14;
  const overallAverageWords = numberToWords(overallAverage);

  return {
    subjectList,
    overallAverage,
    overallAverageWords
  };
}
