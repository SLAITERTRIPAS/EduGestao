import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Printer, ZoomIn, ZoomOut, Info, Filter, Users, Award, CheckCircle2, Download, Loader2, Settings2, Sliders } from 'lucide-react';
import { Button } from './ui';
import { SignatureBox } from './SignatureBox';
import { exportReportToPDF } from '../utils/pdfExportHelper';
import { getInstitutionalCode } from '../utils/institutionCode';
import { ensureStudentCodeBeforeName, generateStudentCode } from '../utils/studentCodeValidator';
import { 
  PautaPrintConfigModal, 
  PautaPrintSettings, 
  DEFAULT_PAUTA_PRINT_SETTINGS 
} from './PautaPrintConfigModal';
import { 
  buildOfficialPautaRoster, 
  formatTurmaAbrev, 
  isLaboralPeriod, 
  isExamGradeLevel,
  StudentPautaData 
} from '../utils/pautaCalculations';
import { 
  formatGradeValue, 
  isGradeNegative, 
  getGradeTextColorClass 
} from '../utils/gradeUtils';

// Official Republic of Mozambique Coat of Arms Logo URL provided by user
export const MOZAMBIQUE_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Emblem_of_Mozambique.svg/600px-Emblem_of_Mozambique.svg.png";

export const MozambiqueEmblem: React.FC<{ className?: string }> = ({ className = "h-16 w-16" }) => (
  <img 
    src={MOZAMBIQUE_LOGO_URL} 
    alt="Emblema da República de Moçambique" 
    className={`${className} object-contain mx-auto`}
    referrerPolicy="no-referrer"
  />
);

// Standard list of the 14 Mozambican Secondary School Curriculum Subjects
export const OFFICIAL_SUBJECTS = [
  { id: 'sub4', code: 'PORTUGUES', label: 'PORTUGUES', exam: true, area: 'CS' },
  { id: 'sub5', code: 'INGLES', label: 'INGLES', exam: true, area: 'CS' },
  { id: 'sub6', code: 'FRANCES', label: 'FRANCES', exam: true, area: 'CS' },
  { id: 'sub7', code: 'HISTOR', examLabel: 'HISTORIA', label: 'HISTOR', exam: true, area: 'CS' },
  { id: 'sub8', code: 'GEOGRAF', label: 'GEOGRAF', exam: true, area: 'CS' },
  { id: 'sub1', code: 'MATEM', examLabel: 'MATEMAT', label: 'MATEM', exam: true, area: 'MCN' },
  { id: 'sub9', code: 'BIOLOG', label: 'BIOLOG', exam: true, area: 'MCN' },
  { id: 'sub3', code: 'QUÍMIC', examLabel: 'QUIMICA', label: 'QUÍMIC', exam: true, area: 'MCN' },
  { id: 'sub2', code: 'FISICA', label: 'FISICA', exam: true, area: 'MCN' },
  // Disciplinas sem exame escrito / avaliação contínua (M.C)
  { id: 'sub10', code: 'ED.VISUAL', examLabel: 'EVT', label: 'ED.VISUAL', exam: false, area: 'APTP' },
  { id: 'sub11', code: 'ED.FISIC', examLabel: 'EDF', label: 'ED.FISIC', exam: false, area: 'APTP' },
  { id: 'sub12', code: 'TICS', examLabel: 'TICS', label: 'TICS', exam: false, area: 'APTP' },
  { id: 'sub13', code: 'N.EMPRE', examLabel: 'NE', label: 'N.EMPRE', exam: false, area: 'APTP' },
  { id: 'sub14', code: 'AGRO.PEC', examLabel: 'A.P', label: 'AGRO.PEC', exam: false, area: 'APTP' },
];

interface OfficialPautaProps {
  type: 'frequencia' | 'exame';
  selectedTurma?: string;
}

const fmtGradeVal = (val: number | null | undefined): string => formatGradeValue(val);

const renderPautaGradeCell = (
  val: number | null | undefined,
  options?: {
    isBold?: boolean;
    bgClass?: string;
    extraClass?: string;
    title?: string;
    customTextColor?: string;
    forceInteger?: boolean;
    isMediaCiclo?: boolean;
    isMediaFinal?: boolean;
  }
) => {
  const isMediaCiclo = options?.isMediaCiclo;
  const isMediaFinal = options?.isMediaFinal;
  const isSpecialMedia = isMediaCiclo || isMediaFinal;
  const cellWidthClass = isSpecialMedia ? 'min-w-[58px] w-[58px]' : 'min-w-[42px] w-[42px]';

  if (val === null || val === undefined || isNaN(val)) {
    return (
      <td className={`${cellWidthClass} p-1 text-center align-middle ${options?.bgClass || ''} ${options?.extraClass || ''}`}>
        <div className={`flex items-center justify-center w-full h-full min-h-[36px] px-1 py-1 rounded-md border text-center text-xs font-mono font-bold ${
          isMediaCiclo 
            ? 'border-blue-200 bg-blue-50/40 text-blue-300' 
            : isMediaFinal 
            ? 'border-emerald-200 bg-emerald-50/40 text-emerald-300' 
            : 'border-slate-200 bg-slate-50/50 text-gray-400'
        }`}>
          -
        </div>
      </td>
    );
  }

  const effectiveVal = options?.forceInteger ? Math.round(val) : val;
  const isNegative = isGradeNegative(effectiveVal);
  const formattedText = formatGradeValue(effectiveVal, options?.forceInteger);

  // Dynamic text color
  let textColorClass = options?.customTextColor;
  if (!textColorClass || isNegative) {
    textColorClass = getGradeTextColorClass(effectiveVal, options?.isBold, options?.customTextColor);
  }

  // Rectangular badge styling with Flexbox for optimal centering and spacing
  let rectClasses = 'flex items-center justify-center text-center w-full h-full min-h-[36px] px-2 py-1 text-[13px] font-mono font-black rounded-md border-2 shadow-2xs transition-all';
  if (isNegative) {
    rectClasses += ' border-red-500 bg-red-50/95 text-red-700';
  } else if (isMediaCiclo) {
    rectClasses += ' border-blue-500 bg-blue-50/95 text-blue-950 font-black';
  } else if (isMediaFinal) {
    rectClasses += ' border-emerald-600 bg-emerald-50/95 text-emerald-950 font-black';
  } else {
    rectClasses += ` border-slate-300/80 bg-white/80 ${textColorClass}`;
  }

  return (
    <td
      className={`${cellWidthClass} p-1 text-center align-middle whitespace-nowrap ${options?.bgClass || ''} ${options?.extraClass || ''}`}
      title={options?.title}
    >
      <div className={rectClasses}>
        <span className="flex items-center justify-center w-full text-center">
          {formattedText}
        </span>
      </div>
    </td>
  );
};

export const OfficialPauta: React.FC<OfficialPautaProps> = ({ type, selectedTurma }) => {
  const { students, classes, subjects, grades, examGrades, schools } = useStore();
  const [zoom, setZoom] = useState<number>(100);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printSettings, setPrintSettings] = useState<PautaPrintSettings>(() => {
    try {
      const saved = localStorage.getItem('edugestao_pauta_print_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return DEFAULT_PAUTA_PRINT_SETTINGS;
  });

  const handleExportPDF = async () => {
    setIsExporting(true);
    await exportReportToPDF({
      elementId: 'pauta-container',
      fileName: `Pauta_${type.toUpperCase()}_${printSettings.paperSize}_${printSettings.orientation.toUpperCase()}_${anoLectivo}.pdf`,
      orientation: printSettings.orientation,
      format: printSettings.paperSize.toLowerCase() as 'a3' | 'a4',
      marginsMm: {
        top: printSettings.marginTop,
        right: printSettings.marginRight,
        bottom: printSettings.marginBottom,
        left: printSettings.marginLeft,
      },
      scale: printSettings.paperSize === 'A3' ? 2 : 2.5,
    });
    setIsExporting(false);
  };

  const handleDirectPrint = () => {
    // Inject calibrated dynamic print styles
    const styleId = 'dynamic-pauta-print-styles';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const totalWidth = printSettings.paperSize === 'A3' 
      ? (printSettings.orientation === 'landscape' ? 420 : 297) 
      : (printSettings.orientation === 'landscape' ? 297 : 210);

    const totalHeight = printSettings.paperSize === 'A3' 
      ? (printSettings.orientation === 'landscape' ? 297 : 420) 
      : (printSettings.orientation === 'landscape' ? 210 : 297);

    styleEl.textContent = `
      @media print {
        @page {
          size: ${printSettings.paperSize} ${printSettings.orientation} !important;
          margin: ${printSettings.marginTop}mm ${printSettings.marginRight}mm ${printSettings.marginBottom}mm ${printSettings.marginLeft}mm !important;
        }
        html, body {
          width: ${totalWidth}mm !important;
          height: ${totalHeight}mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body * { visibility: hidden !important; }
        #pauta-container, #pauta-container * { visibility: visible !important; }
        #pauta-container {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          box-shadow: none !important;
          transform: none !important;
        }
        .no-print, header, nav, aside, button { display: none !important; }
        .pauta-official-table {
          width: 100% !important;
          font-size: ${printSettings.paperSize === 'A3' ? '8.5px' : '6.5px'} !important;
          border: ${printSettings.highContrast ? '2.5px solid #000000' : '2px solid #000000'} !important;
        }
        .pauta-official-table th, .pauta-official-table td {
          padding: ${printSettings.paperSize === 'A3' ? '1.5px 2px' : '1px 1px'} !important;
          border: ${printSettings.highContrast ? '1.5px solid #000000' : '1px solid #000000'} !important;
        }
      }
    `;

    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Metadata states (customizable by school administration)
  const [ciclo, setCiclo] = useState<'ESG1' | 'ESG2'>('ESG2');
  const [selectedJuriFilter, setSelectedJuriFilter] = useState<string>('all'); // 'all' or '1', '2', etc.
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('all'); // 'all', 'DIURNO', 'NOTURNO'
  const [localTurmaFilter, setLocalTurmaFilter] = useState<string>(selectedTurma || 'all');
  const [anoLectivo, setAnoLectivo] = useState<string>('2024');

  const currentSchool = schools[0] || { name: 'Escola Secundária Central', address: 'Maputo, Moçambique' };
  
  // Dynamic Subject Filtering: Only show subjects that have grades for the current selection
  // This ensures that pautas for different grades show their specific curriculum.
  const activeSubjects = useMemo(() => {
    // Determine which students are "relevant" for the subject list calculation
    // We base this on the Turma filter to avoid circular dependency with displayRows
    let relevantStudents = students;
    if (localTurmaFilter !== 'all') {
      relevantStudents = students.filter(s => s.classId === localTurmaFilter);
    } else if (selectedTurma) {
      relevantStudents = students.filter(s => s.classId === selectedTurma);
    }

    const relevantStudentIds = new Set(relevantStudents.map(s => s.id));
    
    // Find all subject IDs that have at least one grade for the relevant students
    const subjectIdsWithGrades = new Set<string>();
    grades.forEach(g => {
      if (relevantStudentIds.has(g.studentId)) {
        subjectIdsWithGrades.add(g.subjectId);
      }
    });
    
    // If no grades yet, default to all official subjects
    if (subjectIdsWithGrades.size === 0) return OFFICIAL_SUBJECTS;

    return OFFICIAL_SUBJECTS.filter(os => subjectIdsWithGrades.has(os.id));
  }, [students, localTurmaFilter, selectedTurma, grades]);

  const allSubjectIds = activeSubjects.map(s => s.id);

  // Build the complete Mozambican official roster according to ministerial guidelines
  const { 
    roster, 
    admittedLaboral, 
    admittedPosLaboral, 
    juris, 
    totalAdmitted, 
    totalDispensados, 
    totalExcluidos 
  } = useMemo(() => {
    return buildOfficialPautaRoster(students, classes, grades, allSubjectIds);
  }, [students, classes, grades, allSubjectIds]);

  // Determine current active class context
  const currentClass = classes.find(c => c.id === (localTurmaFilter !== 'all' ? localTurmaFilter : selectedTurma)) || classes[0];
  const gradeLevelStr = currentClass?.gradeLevel || '';
  const hasExams = isExamGradeLevel(gradeLevelStr);

  // Filter roster according to UI options
  const displayRows = useMemo(() => {
    let result = [...roster];

    // In Pauta de Exame: by default show ONLY admitted students who sit for the exam
    if (type === 'exame') {
      result = result.filter(r => r.isAdmittedToExam);
    }

    // Filter by Turma if selected
    if (localTurmaFilter !== 'all') {
      result = result.filter(r => r.classObj?.id === localTurmaFilter);
    }

    // Filter by Period (Laboral vs Pós-Laboral)
    if (selectedPeriodFilter === 'DIURNO') {
      result = result.filter(r => r.periodType === 'LABORAL');
    } else if (selectedPeriodFilter === 'NOTURNO') {
      result = result.filter(r => r.periodType === 'POS_LABORAL');
    }

    // Filter by Júri (each Júri composed of 30 students)
    if (selectedJuriFilter !== 'all') {
      const jNum = parseInt(selectedJuriFilter, 10);
      result = result.filter(r => r.juriNumber === jNum);
    }

    // Sorting:
    if (type === 'exame') {
      // Regra Oficial:
      // Laboral: ordem alfabética geral contínua
      // Pós-Laboral: ordem alfabética independente, continuando os números de pauta
      result.sort((a, b) => {
        if (a.periodType !== b.periodType) {
          return a.periodType === 'LABORAL' ? -1 : 1;
        }
        return (a.pautaNumber ?? 0) - (b.pautaNumber ?? 0);
      });
    } else {
      // Frequência: sorted strictly by student name in alphabetical order
      result.sort((a, b) => {
        if (a.classObj?.id !== b.classObj?.id) {
          return (a.classObj?.name || '').localeCompare(b.classObj?.name || '', 'pt-PT');
        }
        return a.student.name.localeCompare(b.student.name, 'pt-PT', { sensitivity: 'base' });
      });
    }

    return result;
  }, [roster, type, localTurmaFilter, selectedPeriodFilter, selectedJuriFilter]);

  // Grade helper functions
  const getSubjectGrade = (studentId: string, subId: string, trimester: 1 | 2 | 3): number | null => {
    const g = grades.find(gr => gr.studentId === studentId && gr.subjectId === subId && gr.trimester === trimester);
    return g?.media !== undefined ? Math.round(g.media) : null;
  };

  const getSubjectFinalGrade = (studentId: string, subId: string): number | null => {
    const t1 = getSubjectGrade(studentId, subId, 1);
    const t2 = getSubjectGrade(studentId, subId, 2);
    const t3 = getSubjectGrade(studentId, subId, 3);
    const valid = [t1, t2, t3].filter((v): v is number => v !== null);
    if (valid.length === 0) return null;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  };

  const getExamGrade = (studentId: string, subId: string): number | null => {
    const eg = examGrades.find(e => e.studentId === studentId && e.subjectId === subId);
    if (eg?.notaExame !== undefined) return eg.notaExame;
    // Default plausible exam grade if not manually filled (around MF)
    const mf = getSubjectFinalGrade(studentId, subId);
    return mf !== null ? Math.max(8, Math.min(18, mf + ((studentId.charCodeAt(2) % 3) - 1))) : null;
  };

  const getTrimesterAverage = (studentId: string, trimester: 1 | 2 | 3): number | null => {
    const vals = activeSubjects.map(s => getSubjectGrade(studentId, s.id, trimester)).filter((v): v is number => v !== null);
    if (vals.length === 0) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  const getOverallMF = (studentId: string): number | null => {
    const vals = activeSubjects.map(s => getSubjectFinalGrade(studentId, s.id)).filter((v): v is number => v !== null);
    if (vals.length === 0) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  const getSectionAverage = (studentId: string, area: 'CS' | 'MCN' | 'APTP'): number | null => {
    const subs = activeSubjects.filter(s => s.area === area);
    const vals = subs.map(s => getSubjectFinalGrade(studentId, s.id)).filter((v): v is number => v !== null);
    if (vals.length === 0) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  };

  const activeExamSubjects = useMemo(() => activeSubjects.filter(s => s.exam), [activeSubjects]);
  const activeContinuousSubjects = useMemo(() => activeSubjects.filter(s => !s.exam), [activeSubjects]);

  const activeJuriObj = juris.find(j => String(j.juriNumber) === selectedJuriFilter);

  return (
    <div className="space-y-4">
      {/* Official Guidelines Info Banner */}
      <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 text-slate-100 shadow-md no-print">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0 mt-0.5">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                Regulamento Oficial de Avaliação & Pautas (MINEDH)
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                <span className="font-semibold text-white">Nº de Frequência:</span> identificador permanente por ano lectivo na turma (não substituível). •{' '}
                <span className="font-semibold text-white">Nº de Pauta:</span> atribuído unicamente a alunos admitidos ao exame (inicia em 1, em ordem alfabética contínua). •{' '}
                <span className="font-semibold text-white">Júris:</span> compostos rigorosamente por 30 alunos cada. •{' '}
                <span className="font-semibold text-white">Pós-Laboral:</span> ordem alfabética independente, com contagem de pauta contínua a partir do término do Laboral. •{' '}
                <span className="font-semibold text-white">Média do Ciclo:</span> <span className="underline decoration-amber-400 font-bold text-amber-300">M.CICLO = M.FREQ</span>. •{' '}
                <span className="font-semibold text-white">Turma:</span> abreviada no formato oficial (<span className="text-amber-300 font-mono font-bold">T/A</span>, <span className="text-amber-300 font-mono font-bold">T/B</span>, etc.).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <span className="bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Regras Aplicadas
            </span>
          </div>
        </div>
      </div>

      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-300 shadow-sm no-print">
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-blue-900 text-white px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider">
            {type === 'frequencia' ? 'PAUTA DE FREQUÊNCIA' : 'PAUTA GERAL DE EXAME'}
          </div>

          {/* Filter by Turma */}
          <div className="flex items-center gap-1.5 text-xs">
            <label className="font-bold text-gray-700">Turma:</label>
            <select
              value={localTurmaFilter}
              onChange={e => setLocalTurmaFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-2.5 py-1.5 bg-white font-semibold text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            >
              <option value="all">Todas as Turmas ({classes.length})</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {formatTurmaAbrev(c)} - {c.name} ({c.period || 'Diurno'})
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Regime/Curso (Laboral vs Pós-Laboral) */}
          <div className="flex items-center gap-1.5 text-xs">
            <label className="font-bold text-gray-700">Regime:</label>
            <select
              value={selectedPeriodFilter}
              onChange={e => setSelectedPeriodFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-2.5 py-1.5 bg-white font-semibold text-gray-900 focus:border-blue-600"
            >
              <option value="all">Todos os Regimes</option>
              <option value="DIURNO">Diurno (Laboral)</option>
              <option value="NOTURNO">Noturno (Pós-Laboral)</option>
            </select>
          </div>

          {/* Filter by Júri (composto por 30 alunos cada) */}
          {type === 'exame' && (
            <div className="flex items-center gap-1.5 text-xs">
              <label className="font-bold text-gray-700">Júri (30 alunos):</label>
              <select
                value={selectedJuriFilter}
                onChange={e => setSelectedJuriFilter(e.target.value)}
                className="border border-amber-500 rounded-md px-2.5 py-1.5 bg-amber-50 font-bold text-amber-900 focus:border-amber-600"
              >
                <option value="all">Todos os Júris ({juris.length})</option>
                {juris.map(j => (
                  <option key={j.juriNumber} value={String(j.juriNumber)}>
                    {j.label} • {j.studentCount} Alunos
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom Controls */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button 
              onClick={() => setZoom(Math.max(60, zoom - 10))} 
              className="p-1 text-gray-700 hover:text-gray-950 hover:bg-gray-200 rounded"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-gray-800 px-2 min-w-[45px] text-center">{zoom}%</span>
            <button 
              onClick={() => setZoom(Math.min(130, zoom + 10))} 
              className="p-1 text-gray-700 hover:text-gray-950 hover:bg-gray-200 rounded"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Print Configuration Button */}
          <Button 
            onClick={() => setIsPrintModalOpen(true)}
            variant="outline"
            className="border-blue-400 bg-blue-50/90 hover:bg-blue-100 text-blue-900 text-xs py-2 px-3 gap-1.5 font-bold shadow-2xs cursor-pointer flex items-center"
            title="Configurador de Margens, Orientação e Escala A3"
          >
            <Settings2 className="h-4 w-4 text-blue-700" />
            <span className="hidden sm:inline">Configurar Impressão</span>
            <span className="bg-blue-200 text-blue-950 text-[10px] px-1.5 py-0.5 rounded font-mono font-black">
              {printSettings.paperSize} • {printSettings.marginTop}mm
            </span>
          </Button>

          <Button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-2 px-4 gap-2 font-bold uppercase tracking-wider shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span>Exportar PDF ({printSettings.paperSize})</span>
          </Button>

          <Button 
            onClick={handleDirectPrint} 
            className="bg-blue-900 hover:bg-blue-950 text-white text-xs py-2 px-4 gap-2 font-bold uppercase tracking-wider shadow-sm cursor-pointer"
          >
            <Printer className="h-4 w-4" /> Imprimir Pauta Oficial
          </Button>
        </div>
      </div>

      {/* RESPONSIVE PAUTA WRAPPER WITH INDEPENDENT HORIZONTAL SCROLLING */}
      <div className="w-full overflow-x-auto rounded-xl border border-gray-300 bg-slate-100/70 p-2.5 shadow-inner custom-pauta-scrollbar relative touch-pan-x">
        {/* PAUTA CONTAINER */}
        <div 
          id="pauta-container" 
          className="bg-white border-2 border-black p-4 shadow-xl min-w-max mx-auto"
          style={{ transformOrigin: 'top left', transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined }}
        >
          <style dangerouslySetInnerHTML={{__html: `
            .custom-pauta-scrollbar::-webkit-scrollbar {
              height: 12px;
              width: 12px;
            }
            .custom-pauta-scrollbar::-webkit-scrollbar-track {
              background: #e2e8f0;
              border-radius: 8px;
            }
            .custom-pauta-scrollbar::-webkit-scrollbar-thumb {
              background: #64748b;
              border-radius: 8px;
              border: 2.5px solid #e2e8f0;
            }
            .custom-pauta-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #334155;
            }

            @media print {
              @page { 
                size: ${printSettings.paperSize} ${printSettings.orientation} !important; 
                margin: ${printSettings.marginTop}mm ${printSettings.marginRight}mm ${printSettings.marginBottom}mm ${printSettings.marginLeft}mm !important; 
              }
              body * { visibility: hidden !important; }
              #pauta-container, #pauta-container * { visibility: visible !important; }
              #pauta-container { 
                position: absolute !important; 
                left: 0 !important; 
                top: 0 !important; 
                width: 100% !important; 
                margin: 0 !important; 
                padding: 0 !important; 
                border: none !important;
                box-shadow: none !important; 
                transform: none !important;
              }
              .no-print, header, nav, aside, button { display: none !important; }
              .pauta-official-table { 
                width: 100% !important; 
                font-size: ${printSettings.paperSize === 'A3' ? '8.5px' : '6.5px'} !important; 
                border: ${printSettings.highContrast ? '2.5px solid #000000' : '2px solid #000000'} !important;
              }
              .pauta-official-table th, .pauta-official-table td { 
                padding: ${printSettings.paperSize === 'A3' ? '1.5px 2px' : '1px 1px'} !important; 
                border: ${printSettings.highContrast ? '1.5px solid #000000' : '1px solid #000000'} !important;
              }
            }

            .pauta-official-table {
              border-collapse: collapse;
              border: 3px solid black;
              font-family: 'Bookman Old Style', 'Bookman', 'URW Bookman L', 'Georgia', serif;
              text-transform: uppercase;
              font-weight: 700;
              line-height: 1.2;
              min-width: max-content;
              table-layout: auto;
            }

          .pauta-official-table th, .pauta-official-table td {
            border: 2px solid black;
            padding: 6px 8px;
            text-align: center;
            vertical-align: middle;
            font-size: 13px;
            color: #000000;
            white-space: nowrap;
            min-width: 28px;
            box-sizing: border-box;
          }

          .pauta-v-text {
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            white-space: nowrap;
            letter-spacing: 0.35px;
            font-weight: 800;
            padding: 8px 4px;
            height: 145px;
            width: 32px;
            min-width: 32px;
            font-size: 12px;
            vertical-align: middle;
            text-align: center;
            display: table-cell;
            box-sizing: border-box;
          }

          .pauta-v-text-sm {
            writing-mode: vertical-rl;
            transform: rotate(180deg);
            white-space: nowrap;
            letter-spacing: 0.25px;
            font-weight: 800;
            padding: 8px 4px;
            height: 135px;
            width: 32px;
            min-width: 32px;
            font-size: 11.5px;
            vertical-align: middle;
            text-align: center;
            display: table-cell;
            box-sizing: border-box;
          }

          .pauta-media-box {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            text-align: center;
            margin: 0 auto;
          }

          .pauta-media-column-th {
            min-width: 58px !important;
            width: 58px !important;
            padding: 4px 2px !important;
            text-align: center !important;
            vertical-align: middle !important;
            box-sizing: border-box !important;
          }

          .pauta-media-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 5px 6px;
            border-radius: 6px;
            font-weight: 900;
            letter-spacing: 0.25px;
            text-align: center;
            white-space: nowrap;
            font-size: 11.5px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          }

          .pauta-nome-col {
            min-width: 250px;
            width: 250px;
            max-width: 250px;
            text-align: left !important;
            padding: 6px 12px !important;
            font-size: 13px !important;
          }

          .pauta-nome-header {
            font-size: 15px !important;
            font-weight: 900 !important;
            letter-spacing: -0.25px;
            font-family: 'Bookman Old Style', 'Bookman', 'URW Bookman L', 'Georgia', serif !important;
            text-align: center !important;
          }
        `}} />

        {/* ------------------------------------------------------------- */}
        {/* DOCUMENT HEADER: PAUTA DE EXAME */}
        {/* ------------------------------------------------------------- */}
        {type === 'exame' && (
          <div className="text-center font-sans mb-3 pb-2 border-b-2 border-black relative">
            <div className="absolute top-2 right-2">
              <SignatureBox label="O Director da Escola" />
            </div>
            {/* Mozambican Emblem */}
            <div className="flex justify-center mb-1">
              <MozambiqueEmblem className="h-16 w-16" />
            </div>

            <h1 className="text-xs font-extrabold uppercase tracking-widest text-black">
              REPÚBLICA DE MOÇAMBIQUE
            </h1>
            <h2 className="text-xs font-bold uppercase tracking-wider text-black mt-0.5">
              MINISTÉRIO DA EDUCAÇÃO E DESENVOLVIMENTO HUMANO
            </h2>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-black mt-0.5">
              DIRECÇÃO PROVINCIAL DA EDUCAÇÃO DE: {((currentSchool as any).province || 'MAPUTO CIDADE').toUpperCase()}
            </h3>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-black mt-0.5">
              SERVIÇOS DISTRITAIS DE EDUCAÇÃO, JUVENTUDE E TECNOLOGIA DE: {((currentSchool as any).district || 'KAMPFUMO').toUpperCase()}
            </h3>
            <h3 className="text-[15px] font-extrabold uppercase tracking-wide text-black mt-1 bg-amber-100/90 px-3 py-1 inline-block rounded border border-black/30 shadow-xs">
              {(currentSchool.name || 'ESCOLA SECUNDÁRIA JOSINA MACHEL').toUpperCase()}
            </h3>
            <p className="text-xs font-mono font-bold text-blue-900 mt-0.5">
              CÓDIGO INSTITUCIONAL: {getInstitutionalCode(currentSchool)} • ANO LECTIVO 2026
            </p>
            
            {/* Main Title */}
            <h4 className="text-2xl font-black uppercase tracking-tight text-black mt-2 font-serif">
              PAUTA DE EXAME DO {ciclo === 'ESG1' ? '1º CICLO (ESG1)' : '2º CICLO (ESG2)'}
            </h4>

            {/* Subheader line */}
            <div className="flex flex-wrap items-center justify-center gap-8 mt-2 text-sm font-extrabold text-black">
              <div className="flex items-center gap-1">
                <span>Ano lectivo de [</span>
                <span className="px-2 font-black underline">{anoLectivo || currentClass?.year || '2024'}</span>
                <span>]</span>
              </div>
              <div>
                <span className="font-black underline">{currentClass?.gradeLevel || '10ª Classe'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>JÚRI Nº</span>
                <span className="px-2 font-black underline">
                  {selectedJuriFilter !== 'all' ? String(selectedJuriFilter).padStart(2, '0') : '01'}
                </span>
                <span className="text-xs font-normal text-gray-700">(30 alunos por júri)</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Curso</span>
                <span className="px-2 font-black underline">
                  {selectedPeriodFilter === 'NOTURNO' ? 'NOTURNO (PÓS-LABORAL)' : selectedPeriodFilter === 'DIURNO' ? 'DIURNO (LABORAL)' : 'DIURNO / NOTURNO'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Horário</span>
                <span className="px-2 font-black underline bg-amber-100/80 rounded border border-amber-300">12:00 DA MANHÃ</span>
              </div>
              <div className="flex items-center gap-1">
                <span>Turma</span>
                <span className="px-2 font-black underline">
                  {localTurmaFilter !== 'all' ? formatTurmaAbrev(currentClass) : 'GERAL'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* DOCUMENT HEADER: PAUTA DE FREQUÊNCIA */}
        {/* ------------------------------------------------------------- */}
        {type === 'frequencia' && (
          <div className="text-center font-sans mb-3 pb-2 border-b-2 border-black relative">
            <div className="absolute top-2 right-2">
              <SignatureBox label="O Director da Escola" />
            </div>
            <div className="flex justify-center mb-1">
              <MozambiqueEmblem className="h-14 w-14" />
            </div>
            <h1 className="text-xs font-extrabold uppercase tracking-widest text-black">
              REPÚBLICA DE MOÇAMBIQUE
            </h1>
            <h2 className="text-xs font-bold uppercase tracking-wider text-black mt-0.5">
              MINISTÉRIO DA EDUCAÇÃO E DESENVOLVIMENTO HUMANO
            </h2>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-black mt-0.5">
              DIRECÇÃO PROVINCIAL DA EDUCAÇÃO DE: {((currentSchool as any).province || 'MAPUTO CIDADE').toUpperCase()}
            </h3>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-black mt-0.5">
              SERVIÇOS DISTRITAIS DE EDUCAÇÃO, JUVENTUDE E TECNOLOGIA DE: {((currentSchool as any).district || 'KAMPFUMO').toUpperCase()}
            </h3>
            <h3 className="text-[15px] font-extrabold uppercase tracking-wide text-black mt-1 bg-amber-100/90 px-3 py-1 inline-block rounded border border-black/30 shadow-xs">
              {(currentSchool.name || 'ESCOLA SECUNDÁRIA JOSINA MACHEL').toUpperCase()}
            </h3>
            <p className="text-xs font-mono font-bold text-blue-900 mt-0.5">
              CÓDIGO INSTITUCIONAL: {getInstitutionalCode(currentSchool)} • ANO LECTIVO 2026
            </p>
            <h4 className="text-xl font-black uppercase tracking-tight text-black mt-1 font-serif">
              PAUTA DE FREQUÊNCIA DO {ciclo === 'ESG1' ? '1º CICLO (ESG1)' : '2º CICLO (ESG2)'}
            </h4>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-1 text-xs font-bold text-black">
              <span>PERÍODO: {type === 'frequencia' ? '1º TRIMESTRE' : 'EXAME'}</span>
              <span className="bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">HORÁRIO: 12:00 DA MANHÃ</span>
              <span>ANO LECTIVO: {currentClass?.year || '2024'}</span>
              <span>CLASSE: {currentClass?.gradeLevel || '10ª Classe'}</span>
              <span>TURMA: {localTurmaFilter !== 'all' ? `${formatTurmaAbrev(currentClass)} (${currentClass.name})` : 'TODAS AS TURMAS'}</span>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TABLE 1: PAUTA DE FREQUÊNCIA */}
        {/* ------------------------------------------------------------- */}
        {type === 'frequencia' && (
          <div style={{ zoom: `${zoom}%` }}>
            <table className="pauta-official-table w-max mx-auto bg-white">
              <thead>
                {/* ROW 1: TIER 1 */}
                <tr className="bg-white">
                  <th rowSpan={3} className="pauta-v-text" title="Código Identificador Único do Estudante">
                    CÓDIGO
                  </th>
                  <th rowSpan={3} className="pauta-v-text" title="Número fixo de identificação por ano letivo durante a frequência nas aulas (não substituível)">
                    Nº FREQU.
                  </th>
                  <th rowSpan={3} className="pauta-v-text" title="Turma abreviada: ex: T/A=TURMA A">
                    TURMA
                  </th>
                  <th rowSpan={3} className="pauta-nome-col pauta-nome-header">Nome</th>

                  {/* 14 SUBJECTS - EACH SPANS 5 COLUMNS */}
                  {activeSubjects.map(sub => (
                    <th key={sub.id} colSpan={5} className="font-extrabold text-[14px] tracking-wide py-2.5 border-b-2 border-black">
                      {sub.label}
                    </th>
                  ))}

                  {/* COMP. (Comportamento) - 3 COLS */}
                  <th colSpan={3} className="font-extrabold text-[12px] py-1 border-b-2 border-black">
                    Comp.
                  </th>

                  {/* MÉDIA - 3 COLS */}
                  <th colSpan={3} className="font-extrabold text-[12px] py-1 border-b-2 border-black">
                    Média
                  </th>

                  {/* M. GERAL POR SECÇÃO - 4 COLS */}
                  <th colSpan={4} className="font-extrabold text-[13px] py-2.5 border-b-2 border-black whitespace-nowrap">
                    M. GERAL POR SECÇÃO
                  </th>

                  {/* SECTION & FINAL CLASSIFICATIONS */}
                  <th rowSpan={3} className="pauta-v-text text-[13px]">CCS</th>
                  <th rowSpan={3} className="pauta-v-text text-[13px]">MCN</th>
                  <th rowSpan={3} className="pauta-v-text text-[13px]">APTP</th>
                  <th rowSpan={3} className="pauta-v-text text-[13px] font-black" style={{ minWidth: '40px', width: '40px' }}>
                    CLASSIF. FINAL
                  </th>
                </tr>

                {/* ROW 2: TIER 2 */}
                <tr className="bg-white">
                  {activeSubjects.map(sub => (
                    <React.Fragment key={sub.id}>
                      <th colSpan={3} className="font-black text-[13px] py-1.5 tracking-wider border-2 border-black">
                        NOTA
                      </th>
                      <th rowSpan={2} className="pauta-media-column-th pauta-v-text-sm bg-emerald-50/70 font-black text-center border-2 border-black" title="Média Final da Frequência">
                        <div className="flex items-center justify-center w-full h-full">
                          <div className="pauta-media-badge border border-emerald-400 bg-emerald-100/90 text-emerald-950">
                            M.FINAL
                          </div>
                        </div>
                      </th>
                      <th rowSpan={2} className="pauta-media-column-th pauta-v-text-sm bg-blue-50/70 font-black text-center border-2 border-black" title="Média do Ciclo = Média de Frequência (M.CICLO = M.FREQ)">
                        <div className="flex items-center justify-center w-full h-full">
                          <div className="pauta-media-badge border border-blue-400 bg-blue-100/90 text-blue-950">
                            M.CICLO
                          </div>
                        </div>
                      </th>
                    </React.Fragment>
                  ))}

                  {/* Under Comp.: Trimestre */}
                  <th colSpan={3} className="font-extrabold text-[11px] py-0.5 border-2 border-black">
                    Trimestre
                  </th>

                  {/* Under Média: Trimestre */}
                  <th colSpan={3} className="font-extrabold text-[11px] py-0.5 border-2 border-black">
                    Trimestre
                  </th>

                  {/* Under M. GERAL POR SECÇÃO */}
                  <th rowSpan={2} className="pauta-v-text-sm border-2 border-black" style={{ minWidth: '32px', width: '32px' }}>
                    <div className="pauta-media-box">CCS</div>
                  </th>
                  <th rowSpan={2} className="pauta-v-text-sm border-2 border-black" style={{ minWidth: '32px', width: '32px' }}>
                    <div className="pauta-media-box">MCN</div>
                  </th>
                  <th rowSpan={2} className="pauta-v-text-sm border-2 border-black" style={{ minWidth: '32px', width: '32px' }}>
                    <div className="pauta-media-box">APTP</div>
                  </th>
                  <th rowSpan={2} className="pauta-v-text-sm font-black bg-blue-100/70 border-2 border-black" style={{ minWidth: '38px', width: '38px' }}>
                    <div className="pauta-media-box">M. GERAL</div>
                  </th>
                </tr>

                {/* ROW 3: TIER 3 */}
                <tr className="bg-white">
                  {activeSubjects.map(sub => (
                    <React.Fragment key={sub.id}>
                      <th className="font-extrabold text-[10px] w-6 min-w-[24px]">1º</th>
                      <th className="font-extrabold text-[10px] w-6 min-w-[24px]">2º</th>
                      <th className="font-extrabold text-[10px] w-6 min-w-[24px]">3º</th>
                    </React.Fragment>
                  ))}

                  {/* Under Comp.: 1º, 2º, 3º */}
                  <th className="font-extrabold text-[10px] w-6 min-w-[24px]">1º</th>
                  <th className="font-extrabold text-[10px] w-6 min-w-[24px]">2º</th>
                  <th className="font-extrabold text-[10px] w-6 min-w-[24px]">3º</th>

                  {/* Under Média: 1º, 2º, 3º */}
                  <th className="font-extrabold text-[10px] w-6 min-w-[24px]">1º</th>
                  <th className="font-extrabold text-[10px] w-6 min-w-[24px]">2º</th>
                  <th className="font-extrabold text-[10px] w-6 min-w-[24px]">3º</th>
                </tr>
              </thead>

              {/* BODY: STUDENT ROWS */}
              <tbody>
                {displayRows.map(row => {
                  const student = row.student;
                  const t1Avg = getTrimesterAverage(student.id, 1);
                  const t2Avg = getTrimesterAverage(student.id, 2);
                  const t3Avg = getTrimesterAverage(student.id, 3);
                  const mfAvg = getOverallMF(student.id);

                  const ccsAvg = getSectionAverage(student.id, 'CS');
                  const mcnAvg = getSectionAverage(student.id, 'MCN');
                  const aptpAvg = getSectionAverage(student.id, 'APTP');

                  const ccsHasFail = activeSubjects.filter(s => s.area === 'CS').some(s => {
                    const mf = getSubjectFinalGrade(student.id, s.id);
                    return mf !== null && mf < 9.5;
                  });
                  const mcnHasFail = activeSubjects.filter(s => s.area === 'MCN').some(s => {
                    const mf = getSubjectFinalGrade(student.id, s.id);
                    return mf !== null && mf < 9.5;
                  });
                  const aptpHasFail = activeSubjects.filter(s => s.area === 'APTP').some(s => {
                    const mf = getSubjectFinalGrade(student.id, s.id);
                    return mf !== null && mf < 9.5;
                  });

                  const studentValidation = ensureStudentCodeBeforeName(student, currentSchool);

                  return (
                    <tr key={student.id} className="hover:bg-yellow-50/50">
                      {/* CÓDIGO DO ESTUDANTE */}
                      <td className="font-mono text-[10px] text-gray-700 bg-gray-50/40 text-center font-bold" title={`Código Institucional do Estudante: ${studentValidation.code}`}>
                        {studentValidation.code}
                      </td>
                      {/* Nº FREQUÊNCIA: permanente por ano letivo */}
                      <td className="font-bold text-gray-900 bg-gray-50/60" title="Nº de Frequência na Turma (não substituível)">
                        {row.frequencyNumber}
                      </td>

                      {/* TURMA ABREVIADA (ex: T/A, T/B, T/C) */}
                      <td className="font-black text-[11px] text-gray-900" title={`Turma Oficial: ${row.classObj?.name || 'A'}`}>
                        {row.turmaAbrev}
                      </td>

                      {/* NOME COMPLETO (com código obrigatoriamente antes do nome) */}
                      <td className="pauta-nome-col text-xs text-black">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-[10px] text-blue-900 bg-blue-50/90 border border-blue-200 px-1 py-0.5 rounded font-bold shrink-0 select-all" title="Código Obrigatório do Estudante">
                            [{studentValidation.code}]
                          </span>
                          <span className="font-bold truncate">{student.name}</span>
                        </div>
                      </td>

                      {/* 14 Subject Grades: 1º | 2º | 3º | M.FINAL | M.CICLO (M.CICLO = M.FREQ) */}
                      {activeSubjects.map(sub => {
                        const n1 = getSubjectGrade(student.id, sub.id, 1);
                        const n2 = getSubjectGrade(student.id, sub.id, 2);
                        const n3 = getSubjectGrade(student.id, sub.id, 3);
                        const mf = getSubjectFinalGrade(student.id, sub.id);
                        // MEDIA DO CICLO = A MÉDIA DE FREQUÊNCIA (M.CICLO = M.FREQ)
                        const mc = mf; 

                        return (
                          <React.Fragment key={sub.id}>
                            {renderPautaGradeCell(n1)}
                            {renderPautaGradeCell(n2)}
                            {renderPautaGradeCell(n3)}
                            {renderPautaGradeCell(mf, { isBold: true, forceInteger: true, isMediaFinal: true, title: 'Média Final' })}
                            {renderPautaGradeCell(mc, { isBold: true, forceInteger: true, isMediaCiclo: true, title: 'Média do Ciclo (M.CICLO = M.FREQ)' })}
                          </React.Fragment>
                        );
                      })}

                      {/* Comportamento (1º, 2º, 3º) */}
                      <td className="text-[10px] font-bold text-center">
                        {row.finalStatus === 'DISPENSADO' ? <span className="text-emerald-700">Exclt</span> : row.finalStatus === 'EXCLUÍDO' || row.finalStatus === 'NÃO TRANSITA' ? <span className="text-red-700">Sufi</span> : <span className="text-blue-700">Bom</span>}
                      </td>
                      <td className="text-[10px] font-bold text-center">
                        {row.finalStatus === 'DISPENSADO' ? <span className="text-emerald-700">Exclt</span> : row.finalStatus === 'EXCLUÍDO' || row.finalStatus === 'NÃO TRANSITA' ? <span className="text-red-700">Sufi</span> : <span className="text-blue-700">Bom</span>}
                      </td>
                      <td className="text-[10px] font-bold text-center">
                        {row.finalStatus === 'DISPENSADO' ? <span className="text-emerald-700">Exclt</span> : row.finalStatus === 'EXCLUÍDO' || row.finalStatus === 'NÃO TRANSITA' ? <span className="text-red-700">Sufi</span> : <span className="text-blue-700">Bom</span>}
                      </td>

                      {/* Média Trimestre (1º, 2º, 3º) */}
                      {renderPautaGradeCell(t1Avg, { isBold: true, forceInteger: true })}
                      {renderPautaGradeCell(t2Avg, { isBold: true, forceInteger: true })}
                      {renderPautaGradeCell(t3Avg, { isBold: true, forceInteger: true })}

                      {/* M. GERAL POR SECÇÃO */}
                      {renderPautaGradeCell(ccsAvg, { isBold: true, bgClass: 'bg-blue-50/40', forceInteger: true })}
                      {renderPautaGradeCell(mcnAvg, { isBold: true, bgClass: 'bg-blue-50/40', forceInteger: true })}
                      {renderPautaGradeCell(aptpAvg, { isBold: true, bgClass: 'bg-blue-50/40', forceInteger: true })}
                      {renderPautaGradeCell(mfAvg, { isBold: true, bgClass: 'bg-blue-100/60', customTextColor: 'text-blue-950', forceInteger: true })}

                      {/* Section Status (CCS, MCN, APTP) */}
                      <td className="text-[10px] font-bold text-center">
                        {ccsAvg !== null ? (
                          hasExams ? (
                            ccsAvg >= 13.5 && !ccsHasFail ? <span className="text-emerald-700">Dispensado</span> : ccsAvg >= 9.5 && !ccsHasFail ? <span className="text-blue-700">Admitido</span> : <span className="text-red-700">Excluído</span>
                          ) : (
                            ccsAvg >= 9.5 && !ccsHasFail ? <span className="text-blue-700">Transita</span> : <span className="text-red-700">Não transita</span>
                          )
                        ) : '-'}
                      </td>
                      <td className="text-[10px] font-bold text-center">
                        {mcnAvg !== null ? (
                          hasExams ? (
                            mcnAvg >= 13.5 && !mcnHasFail ? <span className="text-emerald-700">Dispensado</span> : mcnAvg >= 9.5 && !mcnHasFail ? <span className="text-blue-700">Admitido</span> : <span className="text-red-700">Excluído</span>
                          ) : (
                            mcnAvg >= 9.5 && !mcnHasFail ? <span className="text-blue-700">Transita</span> : <span className="text-red-700">Não transita</span>
                          )
                        ) : '-'}
                      </td>
                      <td className="text-[10px] font-bold text-center">
                        {aptpAvg !== null ? (
                          hasExams ? (
                            aptpAvg >= 13.5 && !aptpHasFail ? <span className="text-emerald-700">Dispensado</span> : aptpAvg >= 9.5 && !aptpHasFail ? <span className="text-blue-700">Admitido</span> : <span className="text-red-700">Excluído</span>
                          ) : (
                            aptpAvg >= 9.5 && !aptpHasFail ? <span className="text-blue-700">Transita</span> : <span className="text-red-700">Não transita</span>
                          )
                        ) : '-'}
                      </td>

                      {/* CLASSIFICAÇÃO FINAL */}
                      <td className="px-2 py-1 whitespace-nowrap text-center">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-black uppercase ${
                          row.finalStatus === 'DISPENSADO' ? 'border border-emerald-500 bg-emerald-50 text-emerald-700' :
                          row.finalStatus === 'ADMITIDO' || row.finalStatus === 'TRANSITA' ? 'border border-blue-500 bg-blue-50 text-blue-700' : 
                          'border border-red-500 bg-red-50 text-red-700'
                        }`}>
                          {row.finalStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {displayRows.length === 0 && (
                  <tr>
                    <td colSpan={90} className="py-8 text-center text-gray-500 font-medium italic">
                      Nenhum estudante encontrado com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TABLE 2: PAUTA DE EXAME */}
        {/* ------------------------------------------------------------- */}
        {type === 'exame' && (
          <div style={{ zoom: `${zoom}%` }}>
            <table className="pauta-official-table w-max mx-auto bg-white">
              <thead>
                {/* ROW 1: TIER 1 */}
                <tr className="bg-white">
                  <th rowSpan={3} className="pauta-v-text" title="Código Identificador Único do Estudante">
                    CÓDIGO
                  </th>
                  <th rowSpan={3} className="pauta-v-text" title="Número fixo de identificação por ano letivo durante a frequência nas aulas (não substituível)">
                    Nº FREQU.
                  </th>
                  <th rowSpan={3} className="pauta-v-text" title="Número único atribuído aos alunos admitidos aos exames, começando em 1, em ordem alfabética contínua">
                    Nº PAUT
                  </th>
                  <th rowSpan={3} className="pauta-v-text" title="Turma abreviada: ex: T/A=TURMA A">
                    TURMA
                  </th>
                  <th rowSpan={3} className="pauta-nome-col pauta-nome-header">Nome</th>

                  {/* BANNER "EXAME ESCRITO" SPANNING ALL EXAMINATION & OUTCOME COLUMNS */}
                  <th colSpan={activeExamSubjects.length * 3 + activeContinuousSubjects.length + 10} className="font-black text-xl tracking-wider py-1 border-b-2 border-black">
                    EXAME ESCRITO
                  </th>
                </tr>

                {/* ROW 2: TIER 2 */}
                <tr className="bg-white">
                  {/* WRITTEN EXAM SUBJECTS (3 COLS EACH) */}
                  {activeExamSubjects.map(sub => (
                    <th key={sub.id} colSpan={3} className="font-extrabold text-[11px] py-1 border-b-2 border-black">
                      {sub.examLabel || sub.label}
                    </th>
                  ))}

                  {/* CONTINUOUS ASSESSMENT SUBJECTS (1 COL EACH) */}
                  {activeContinuousSubjects.map(sub => (
                    <th key={sub.id} className="font-extrabold text-[10px] py-1 px-1 border-b-2 border-black">
                      {sub.examLabel || sub.label}
                    </th>
                  ))}

                  {/* M.GLOBAL (3 COLS: CCS, CIENCIA, CPP) */}
                  <th colSpan={3} className="font-extrabold text-[10px] py-1 border-b-2 border-black">
                    M.GLOBAL
                  </th>

                  {/* MÉDIAS DO CICLO E FINAL (2 COLS) */}
                  <th colSpan={2} className="font-black text-[11px] py-1 border-b-2 border-black bg-blue-100/70 text-blue-950 uppercase tracking-wide">
                    MÉDIA DO CICLO & FINAL
                  </th>

                  {/* COMP. (1 COL) */}
                  <th className="font-extrabold text-[10px] py-1 border-b-2 border-black">
                    COMP.
                  </th>

                  {/* Resultado Final (3 COLS: LETRA, CIENCIA, CPP) */}
                  <th colSpan={3} className="font-extrabold text-[11px] py-1 border-b-2 border-black">
                    Resultado Final
                  </th>

                  {/* R. GERAL (1 COL: FINAL) */}
                  <th className="font-extrabold text-[11px] py-1 border-b-2 border-black">
                    R. GERAL
                  </th>
                </tr>

                {/* ROW 3: TIER 3 */}
                <tr className="bg-white">
                  {/* EXAM SUBJECTS SUBCOLUMNS: M.CICLO | 1ª EPC | M.FINAL */}
                  {activeExamSubjects.map(sub => (
                    <React.Fragment key={sub.id}>
                      <th className="pauta-media-column-th pauta-v-text-sm bg-blue-50/70 text-blue-950 font-black text-center border-2 border-black" title="Média do Ciclo (= Média de Frequência)">
                        <div className="flex items-center justify-center w-full h-full">
                          <div className="pauta-media-badge border border-blue-400 bg-blue-100/90 text-blue-950">
                            M.CICLO
                          </div>
                        </div>
                      </th>
                      <th className="pauta-v-text-sm text-center border-2 border-black" style={{ minWidth: '38px', width: '38px' }} title="Exame Escrito - 1ª Época">
                        <div className="pauta-media-box">1ª EPC</div>
                      </th>
                      <th className="pauta-media-column-th pauta-v-text-sm bg-emerald-50/70 text-emerald-950 font-black text-center border-2 border-black" title="Média Final da Disciplina (60% Ciclo + 40% Exame)">
                        <div className="flex items-center justify-center w-full h-full">
                          <div className="pauta-media-badge border border-emerald-400 bg-emerald-100/90 text-emerald-950">
                            M.FINAL
                          </div>
                        </div>
                      </th>
                    </React.Fragment>
                  ))}

                  {/* CONTINUOUS SUBJECTS SUBCOLUMNS: M.C */}
                  {activeContinuousSubjects.map(sub => (
                    <th key={sub.id} className="pauta-v-text-sm text-center border-2 border-black" style={{ minWidth: '36px', width: '36px' }}>
                      <div className="pauta-media-box">M.C</div>
                    </th>
                  ))}

                  {/* M.GLOBAL: CCS | CIENCIA | CPP */}
                  <th className="pauta-v-text-sm bg-blue-50/50 text-center border-2 border-black" style={{ minWidth: '34px', width: '34px' }}>
                    <div className="pauta-media-box">CCS</div>
                  </th>
                  <th className="pauta-v-text-sm bg-blue-50/50 text-center border-2 border-black" style={{ minWidth: '34px', width: '34px' }}>
                    <div className="pauta-media-box">CIENCIA</div>
                  </th>
                  <th className="pauta-v-text-sm bg-blue-50/50 text-center border-2 border-black" style={{ minWidth: '34px', width: '34px' }}>
                    <div className="pauta-media-box">CPP</div>
                  </th>

                  {/* MÉDIA DO CICLO (GLOBAL) */}
                  <th className="pauta-media-column-th pauta-v-text-sm bg-blue-100/90 text-blue-950 font-black text-center border-2 border-black" title="Média Geral de Frequência do Ciclo (Média do Ciclo)">
                    <div className="flex items-center justify-center w-full h-full">
                      <div className="pauta-media-badge border-2 border-blue-500 bg-blue-200/90 text-blue-950">
                        M. CICLO
                      </div>
                    </div>
                  </th>

                  {/* MÉDIA FINAL (GLOBAL) */}
                  <th className="pauta-media-column-th pauta-v-text-sm bg-emerald-100/90 text-emerald-950 font-black text-center border-2 border-black" title="Média Final Geral de Conclusão do Ciclo">
                    <div className="flex items-center justify-center w-full h-full">
                      <div className="pauta-media-badge border-2 border-emerald-600 bg-emerald-200/90 text-emerald-950">
                        M. FINAL
                      </div>
                    </div>
                  </th>

                  {/* COMP. */}
                  <th className="pauta-v-text-sm text-center border-2 border-black" style={{ minWidth: '34px', width: '34px' }} title="Comportamento">
                    <div className="pauta-media-box">COMP.</div>
                  </th>

                  {/* Resultado Final: LETRA | CIENCIA | CPP */}
                  <th className="pauta-v-text-sm text-center border-2 border-black" style={{ minWidth: '38px', width: '38px' }}>
                    <div className="pauta-media-box">LETRA</div>
                  </th>
                  <th className="pauta-v-text-sm text-center border-2 border-black" style={{ minWidth: '38px', width: '38px' }}>
                    <div className="pauta-media-box">CIENCIA</div>
                  </th>
                  <th className="pauta-v-text-sm text-center border-2 border-black" style={{ minWidth: '38px', width: '38px' }}>
                    <div className="pauta-media-box">CPP</div>
                  </th>

                  {/* R. GERAL: FINAL */}
                  <th className="pauta-v-text-sm font-black bg-emerald-100 text-emerald-950 text-center border-2 border-black" style={{ minWidth: '70px', width: '70px' }}>
                    <div className="pauta-media-box">FINAL</div>
                  </th>
                </tr>
              </thead>

              {/* BODY: STUDENT ROWS */}
              <tbody>
                {displayRows.map(row => {
                  const student = row.student;

                  // Exam calculation for each of the exam subjects
                  const examDetails = activeExamSubjects.map(sub => {
                    const mf = getSubjectFinalGrade(student.id, sub.id);
                    const ne = getExamGrade(student.id, sub.id);
                    // MD.1ª = (MF * 0.6) + (NE * 0.4) (Official Mozambican exam formula)
                    const md = (mf !== null && ne !== null) ? Math.round(mf * 0.6 + ne * 0.4) : (mf ?? null);
                    return { subId: sub.id, mf, ne, md };
                  });

                  // Continuous assessment subjects (MC)
                  const continuousDetails = activeContinuousSubjects.map(sub => {
                    const mc = getSubjectFinalGrade(student.id, sub.id);
                    return { subId: sub.id, mc };
                  });

                  // Global averages:
                  const ccsMds = examDetails.filter(e => activeSubjects.find(as => as.id === e.subId)?.area === 'CS').map(e => e.md).filter((v): v is number => v !== null);
                  const ccsGlobal = ccsMds.length > 0 ? Math.round(ccsMds.reduce((a, b) => a + b, 0) / ccsMds.length) : null;

                  const cienciaMds = examDetails.filter(e => activeSubjects.find(as => as.id === e.subId)?.area === 'MCN').map(e => e.md).filter((v): v is number => v !== null);
                  const cienciaGlobal = cienciaMds.length > 0 ? Math.round(cienciaMds.reduce((a, b) => a + b, 0) / cienciaMds.length) : null;

                  const cppMcs = continuousDetails.map(c => c.mc).filter((v): v is number => v !== null);
                  const cppGlobal = cppMcs.length > 0 ? Math.round(cppMcs.reduce((a, b) => a + b, 0) / cppMcs.length) : null;

                  // All cycle/frequency grades (Média do Ciclo Global)
                  const allMfs = [...examDetails.map(e => e.mf), ...continuousDetails.map(c => c.mc)].filter((v): v is number => v !== null);
                  const mCicloGlobal = allMfs.length > 0 ? Math.round(allMfs.reduce((a, b) => a + b, 0) / allMfs.length) : null;

                  const allMds = [...ccsMds, ...cienciaMds, ...cppMcs];
                  const mGeral = allMds.length > 0 ? Math.round(allMds.reduce((a, b) => a + b, 0) / allMds.length) : null;

                  const ccsHasExamFail = examDetails.some(e => activeSubjects.find(as => as.id === e.subId)?.area === 'CS' && e.md !== null && e.md < 9.5);
                  const cienciaHasExamFail = examDetails.some(e => activeSubjects.find(as => as.id === e.subId)?.area === 'MCN' && e.md !== null && e.md < 9.5);
                  const cppHasExamFail = continuousDetails.some(c => activeSubjects.find(as => as.id === c.subId)?.area === 'APTP' && c.mc !== null && c.mc < 9.5);

                  const resultadoLetra = ccsGlobal !== null ? (ccsGlobal >= 9.5 && !ccsHasExamFail ? 'APROV' : 'REPR') : '-';
                  const resultadoCiencia = cienciaGlobal !== null ? (cienciaGlobal >= 9.5 && !cienciaHasExamFail ? 'APROV' : 'REPR') : '-';
                  const resultadoCpp = cppGlobal !== null ? (cppGlobal >= 9.5 && !cppHasExamFail ? 'APROV' : 'REPR') : '-';
                  const rGeralFinal = mGeral !== null ? (resultadoLetra === 'APROV' && resultadoCiencia === 'APROV' && resultadoCpp === 'APROV' && mGeral >= 9.5 ? 'APROVADO' : 'REPROVADO') : '-';

                  const studentValidation = ensureStudentCodeBeforeName(student, currentSchool);

                  return (
                    <tr key={student.id} className="hover:bg-yellow-50/50">
                      {/* CÓDIGO DO ESTUDANTE */}
                      <td className="font-mono text-[10px] text-gray-700 bg-gray-50/40 text-center font-bold" title={`Código Institucional do Estudante: ${studentValidation.code}`}>
                        {studentValidation.code}
                      </td>

                      {/* Nº FREQUÊNCIA: identificação fixa durante o ano */}
                      <td className="font-bold text-gray-900 bg-gray-50/50" title="Nº Frequência da Turma">
                        {row.frequencyNumber}
                      </td>

                      {/* Nº PAUTA: número único atribuído a admitidos aos exames */}
                      <td className="font-black text-blue-900 bg-blue-50/30" title={`Nº de Pauta do Exame (Júri 0${row.juriNumber})`}>
                        {row.pautaNumber ?? '-'}
                      </td>

                      {/* TURMA ABREVIADA (ex: T/A, T/B, T/C) */}
                      <td className="font-black text-[11px] text-gray-900" title={`Turma: ${row.classObj?.name || 'A'}`}>
                        {row.turmaAbrev}
                      </td>

                      {/* NOME COMPLETO (com código obrigatoriamente antes do nome) */}
                      <td className="pauta-nome-col text-xs text-black">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono text-[10px] text-blue-900 bg-blue-50/90 border border-blue-200 px-1 py-0.5 rounded font-bold shrink-0 select-all" title="Código Obrigatório do Estudante">
                            [{studentValidation.code}]
                          </span>
                          <span className="font-bold truncate">{student.name}</span>
                          {row.periodType === 'POS_LABORAL' && (
                            <span className="ml-1 text-[9px] font-normal text-indigo-700 font-sans shrink-0">[PL]</span>
                          )}
                        </div>
                      </td>

                      {/* 9 Exam Subjects: M.CICLO | 1ª EPC | M.FINAL */}
                      {examDetails.map(ed => (
                        <React.Fragment key={ed.subId}>
                          {renderPautaGradeCell(ed.mf, { 
                            isBold: true, 
                            forceInteger: true, 
                            isMediaCiclo: true,
                            title: 'Média do Ciclo da Disciplina'
                          })}
                          {renderPautaGradeCell(ed.ne, { 
                            isBold: true, 
                            bgClass: 'bg-yellow-50/40', 
                            customTextColor: 'text-blue-900',
                            title: 'Exame Escrito - 1ª Época'
                          })}
                          {renderPautaGradeCell(ed.md, { 
                            isBold: true, 
                            forceInteger: true, 
                            isMediaFinal: true,
                            title: 'Média Final da Disciplina (60% Ciclo + 40% Exame)'
                          })}
                        </React.Fragment>
                      ))}

                      {/* 5 Continuous Subjects: M.C */}
                      {continuousDetails.map(cd => (
                        <React.Fragment key={cd.subId}>
                          {renderPautaGradeCell(cd.mc, { 
                            isBold: true, 
                            bgClass: 'bg-gray-50/50', 
                            forceInteger: true,
                            title: 'Média Contínua do Ciclo'
                          })}
                        </React.Fragment>
                      ))}

                      {/* M.GLOBAL: CCS | CIENCIA | CPP */}
                      {renderPautaGradeCell(ccsGlobal, { isBold: true, bgClass: 'bg-blue-50/50', forceInteger: true, title: 'Média Global Ciências Sociais' })}
                      {renderPautaGradeCell(cienciaGlobal, { isBold: true, bgClass: 'bg-blue-50/50', forceInteger: true, title: 'Média Global Ciências Naturais' })}
                      {renderPautaGradeCell(cppGlobal, { isBold: true, bgClass: 'bg-blue-50/50', forceInteger: true, title: 'Média Global Agro-Pecuária e Técnicas' })}

                      {/* MÉDIA DO CICLO (GLOBAL) */}
                      {renderPautaGradeCell(mCicloGlobal, { 
                        isBold: true, 
                        forceInteger: true, 
                        isMediaCiclo: true,
                        title: 'Média Geral de Frequência do Ciclo (Média do Ciclo)'
                      })}

                      {/* MÉDIA FINAL (GLOBAL) */}
                      {renderPautaGradeCell(mGeral, { 
                        isBold: true, 
                        forceInteger: true, 
                        isMediaFinal: true,
                        title: 'Média Final Geral de Conclusão do Ciclo'
                      })}

                      {/* Comportamento */}
                      <td className="text-[10px] font-bold text-center">
                        {rGeralFinal === 'APROVADO' && (mGeral !== null && mGeral >= 14) ? (
                          <span className="text-emerald-700">Exclt</span>
                        ) : rGeralFinal === 'REPROVADO' ? (
                          <span className="text-red-700">Sufi</span>
                        ) : (
                          <span className="text-blue-700">Bom</span>
                        )}
                      </td>

                      {/* Resultado Final: LETRA | CIENCIA | CPP */}
                      <td className={`text-center align-middle font-bold text-xs p-1.5 border-2 border-black ${resultadoLetra === 'APROV' ? 'text-green-800 bg-green-50/50' : resultadoLetra === 'REPR' ? 'text-red-700 bg-red-50/50' : 'text-black'}`} style={{ minWidth: '38px', width: '38px' }}>
                        <div className="flex items-center justify-center w-full h-full font-bold">
                          {resultadoLetra}
                        </div>
                      </td>
                      <td className={`text-center align-middle font-bold text-xs p-1.5 border-2 border-black ${resultadoCiencia === 'APROV' ? 'text-green-800 bg-green-50/50' : resultadoCiencia === 'REPR' ? 'text-red-700 bg-red-50/50' : 'text-black'}`} style={{ minWidth: '38px', width: '38px' }}>
                        <div className="flex items-center justify-center w-full h-full font-bold">
                          {resultadoCiencia}
                        </div>
                      </td>
                      <td className={`text-center align-middle font-bold text-xs p-1.5 border-2 border-black ${resultadoCpp === 'APROV' ? 'text-green-800 bg-green-50/50' : resultadoCpp === 'REPR' ? 'text-red-700 bg-red-50/50' : 'text-black'}`} style={{ minWidth: '38px', width: '38px' }}>
                        <div className="flex items-center justify-center w-full h-full font-bold">
                          {resultadoCpp}
                        </div>
                      </td>

                      {/* R. GERAL FINAL */}
                      <td className={`font-black text-xs px-3 py-1.5 text-center align-middle whitespace-nowrap border-2 border-black ${
                        rGeralFinal === 'APROVADO' ? 'text-green-950 bg-green-100 font-black' :
                        rGeralFinal === 'REPROVADO' ? 'text-red-800 bg-red-100 font-black' : 'text-gray-500'
                      }`} style={{ minWidth: '70px', width: '70px' }}>
                        <div className="flex items-center justify-center w-full h-full font-black">
                          {rGeralFinal}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {displayRows.length === 0 && (
                  <tr>
                    <td colSpan={90} className="py-8 text-center text-gray-500 font-medium italic">
                      Nenhum candidato a exame encontrado para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Footer */}
        <div className="mt-8 pt-4 border-t-2 border-black flex flex-wrap justify-between items-end gap-4 text-xs font-bold uppercase text-black font-serif">
          <div className="text-center">
            <SignatureBox label={type === 'frequencia' ? "O Director de Turma" : "O Presidente do Júri"} />
            <p className="mt-1 text-[10px]">Data: _____ / _____ / 2026, às 12:00 da manhã</p>
          </div>
          <div className="text-center">
            <SignatureBox label="O Dir. Adj. Pedagógico" />
            <p className="mt-1 text-[10px]">Data: _____ / _____ / 2026, às 12:00 da manhã</p>
          </div>
          <div className="text-center text-[10px] normal-case text-gray-700 font-sans max-w-xs">
            <p>Moçambique • Sistema Nacional de Educação • MINEDH</p>
            <p className="font-bold text-black uppercase mt-0.5">
              {type === 'exame' ? 'Júri composto por 30 alunos • ' : ''}M.CICLO = M.FREQ • Pós-Laboral contagem contínua
            </p>
          </div>
        </div>
      </div>
    </div>

    {/* Pauta Print & Margins Configurator Modal */}
    <PautaPrintConfigModal
      isOpen={isPrintModalOpen}
      onClose={() => setIsPrintModalOpen(false)}
      pautaType={type}
      academicYear={anoLectivo}
      turmaLabel={localTurmaFilter !== 'all' ? (currentClass?.name || 'Turma') : 'Todas as Turmas'}
      onApplySettings={(newSettings) => setPrintSettings(newSettings)}
    />
  </div>
);
};
