export interface TrimesterPeriodConfig {
  trimester: 1 | 2 | 3;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  isLocked: boolean;
}

export interface VacationPeriodConfig {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface NationalExamPeriodConfig {
  id: string;
  title: string;
  gradeLevels: string[];
  startDate: string;
  endDate: string;
  phase: '1ª Época' | '2ª Época';
}

export interface SchoolCalendarConfig {
  academicYear: number;
  trimesters: TrimesterPeriodConfig[];
  vacations: VacationPeriodConfig[];
  nationalExams: NationalExamPeriodConfig[];
  updatedAt?: string;
  updatedBy?: string;
}

const STORAGE_KEY = 'minedh_school_calendar_config_2026';

export const DEFAULT_SCHOOL_CALENDAR_CONFIG: SchoolCalendarConfig = {
  academicYear: 2026,
  trimesters: [
    {
      trimester: 1,
      startDate: '2026-02-01',
      endDate: '2026-05-08',
      isLocked: false,
    },
    {
      trimester: 2,
      startDate: '2026-05-25',
      endDate: '2026-08-28',
      isLocked: false,
    },
    {
      trimester: 3,
      startDate: '2026-09-14',
      endDate: '2026-11-27',
      isLocked: false,
    },
  ],
  vacations: [
    {
      id: 'vac-1',
      name: 'Férias do 1.º Trimestre',
      startDate: '2026-05-09',
      endDate: '2026-05-24',
    },
    {
      id: 'vac-2',
      name: 'Férias do 2.º Trimestre',
      startDate: '2026-08-29',
      endDate: '2026-09-13',
    },
    {
      id: 'vac-3',
      name: 'Férias Grandes de Fim do Ano',
      startDate: '2026-12-19',
      endDate: '2027-01-31',
    },
  ],
  nationalExams: [
    {
      id: 'exam-1',
      title: 'Exames Nacionais da 3ª, 6ª, 9ª e 12ª Classes (1ª Época)',
      gradeLevels: ['3ª Classe', '6ª Classe', '9ª Classe', '12ª Classe'],
      startDate: '2026-11-30',
      endDate: '2026-12-11',
      phase: '1ª Época',
    },
    {
      id: 'exam-2',
      title: 'Exames Nacionais & Recursos (2ª Época)',
      gradeLevels: ['3ª Classe', '6ª Classe', '9ª Classe', '12ª Classe'],
      startDate: '2026-12-14',
      endDate: '2026-12-18',
      phase: '2ª Época',
    },
  ],
  updatedAt: new Date().toISOString(),
  updatedBy: 'Diretor da Escola',
};

export function getStoredSchoolCalendarConfig(): SchoolCalendarConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SCHOOL_CALENDAR_CONFIG;
    const parsed = JSON.parse(raw);
    return parsed && parsed.trimesters ? parsed : DEFAULT_SCHOOL_CALENDAR_CONFIG;
  } catch (e) {
    return DEFAULT_SCHOOL_CALENDAR_CONFIG;
  }
}

export function saveSchoolCalendarConfig(config: SchoolCalendarConfig): void {
  try {
    const updated = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save school calendar config', e);
  }
}

export interface DateValidationResult {
  isValid: boolean;
  reason?: string;
  isVacation?: boolean;
  isLocked?: boolean;
  isOutRange?: boolean;
  vacationName?: string;
}

export function validateLessonDateInCalendar(
  dateStr: string,
  trimester: 1 | 2 | 3
): DateValidationResult {
  if (!dateStr) {
    return { isValid: true };
  }

  const config = getStoredSchoolCalendarConfig();
  const trimConfig = config.trimesters.find(t => t.trimester === trimester);

  // 1. Check if trimester is locked by Director
  if (trimConfig && trimConfig.isLocked) {
    return {
      isValid: false,
      isLocked: true,
      reason: `Lançamento Bloqueado: O ${trimester}º Trimestre encontra-se trancado e finalizado pelo Diretor da Escola.`
    };
  }

  // 2. Check if date falls in Vacation
  for (const vac of config.vacations) {
    if (vac.startDate && vac.endDate) {
      if (dateStr >= vac.startDate && dateStr <= vac.endDate) {
        return {
          isValid: false,
          isVacation: true,
          vacationName: vac.name,
          reason: `Lançamento Bloqueado: A data seleccionada (${dateStr}) insere-se no período de ${vac.name} (${vac.startDate} a ${vac.endDate}).`
        };
      }
    }
  }

  // 3. Check if date falls outside the trimester range
  if (trimConfig && trimConfig.startDate && trimConfig.endDate) {
    if (dateStr < trimConfig.startDate || dateStr > trimConfig.endDate) {
      return {
        isValid: false,
        isOutRange: true,
        reason: `Lançamento Bloqueado: A data (${dateStr}) está fora do intervalo letivo do ${trimester}º Trimestre (${trimConfig.startDate} a ${trimConfig.endDate}).`
      };
    }
  }

  return { isValid: true };
}

export function getActiveTrimester(): 1 | 2 | 3 {
  const config = getStoredSchoolCalendarConfig();
  const todayStr = new Date().toISOString().split('T')[0];

  for (const t of config.trimesters) {
    if (!t.isLocked && t.startDate && t.endDate) {
      if (todayStr >= t.startDate && todayStr <= t.endDate) {
        return t.trimester;
      }
    }
  }

  const firstUnlocked = config.trimesters.find(t => !t.isLocked);
  return firstUnlocked ? firstUnlocked.trimester : 1;
}

export function isTrimesterActiveForTeacher(trimesterNum: 1 | 2 | 3): boolean {
  const activeTrim = getActiveTrimester();
  return trimesterNum === activeTrim;
}
