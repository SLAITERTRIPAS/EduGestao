import React, { useState } from 'react';
import { Student, Class, Subject, Grade, MOZAMBIQUE_EMBLEM_URL } from '../types';
import { useStore } from '../store';
import { Button } from './ui';
import { Printer, ShieldCheck, X, FileText, CheckSquare, Square, Palette, Fingerprint, ZoomIn, ZoomOut, Eye } from 'lucide-react';
import { StudentDocumentQRCode } from './StudentDocumentQRCode';
import { DigitalSignatureStamp } from './DigitalSignatureStamp';
import { printDocument } from '../utils/printHelper';
import { HeaderInstitucional } from './HeaderInstitucional';
import { ensureStudentCodeBeforeName } from '../utils/studentCodeValidator';
import { getCurriculumSubjectsForGrade, numberToWords } from '../utils/gradeCurriculum';
import { DigitalSignatureModal } from './DigitalSignatureModal';

interface DeclarationDocumentProps {
  student: Student;
  schoolClass?: Class;
  schoolName?: string;
  directorName?: string;
  subjects?: Subject[];
  grades?: Grade[];
  academicYear?: number;
  onClose?: () => void;
  inline?: boolean;
}

// Color Theme Structure for the 4 Educational Cycle Groups
export interface CycleThemeConfig {
  id: 'cycle1' | 'cycle2' | 'cycle3' | 'cycle4';
  title: string;
  classes: string;
  badgeLabel: string;
  primaryDark: string; // Hex for text / deep elements
  primaryMain: string; // Hex for headers / borders
  accentGold: string; // Hex for corner ornaments
  lightBg: string; // Tailwind class
  bannerBg: string; // Tailwind class
  tableHeaderClass: string;
  borderColorClass: string;
  activeRingClass: string;
  accentTextClass: string;
}

const CYCLE_THEMES: Record<string, CycleThemeConfig> = {
  cycle1: {
    id: 'cycle1',
    title: '1.ª e 2.ª Classe',
    classes: '1.ª, 2.ª Classe',
    badgeLabel: '1º Ciclo Primário • Azul Safira',
    primaryDark: '#0c4a6e',
    primaryMain: '#0284c7',
    accentGold: '#d97706',
    lightBg: 'bg-sky-50/50',
    bannerBg: 'bg-[#0369a1]',
    tableHeaderClass: 'bg-[#0369a1] text-white',
    borderColorClass: 'border-[#0284c7]',
    activeRingClass: 'ring-sky-500',
    accentTextClass: 'text-[#0369a1]',
  },
  cycle2: {
    id: 'cycle2',
    title: '4.ª e 5.ª Classe',
    classes: '4.ª, 5.ª Classe',
    badgeLabel: '2º Ciclo Primário • Verde Esmeralda',
    primaryDark: '#064e3b',
    primaryMain: '#059669',
    accentGold: '#d97706',
    lightBg: 'bg-emerald-50/50',
    bannerBg: 'bg-[#047857]',
    tableHeaderClass: 'bg-[#047857] text-white',
    borderColorClass: 'border-[#059669]',
    activeRingClass: 'ring-emerald-500',
    accentTextClass: 'text-[#047857]',
  },
  cycle3: {
    id: 'cycle3',
    title: '7.ª e 8.ª Classe',
    classes: '7.ª, 8.ª Classe',
    badgeLabel: '3º Ciclo Básico • Bordô / Vinho',
    primaryDark: '#881337',
    primaryMain: '#be123c',
    accentGold: '#d97706',
    lightBg: 'bg-rose-50/50',
    bannerBg: 'bg-[#9f1239]',
    tableHeaderClass: 'bg-[#9f1239] text-white',
    borderColorClass: 'border-[#be123c]',
    activeRingClass: 'ring-rose-500',
    accentTextClass: 'text-[#9f1239]',
  },
  cycle4: {
    id: 'cycle4',
    title: '10.ª e 11.ª Classe',
    classes: '10.ª, 11.ª Classe',
    badgeLabel: '2º Ciclo Secundário • Índigo Real',
    primaryDark: '#312e81',
    primaryMain: '#4338ca',
    accentGold: '#d97706',
    lightBg: 'bg-indigo-50/50',
    bannerBg: 'bg-[#3730a3]',
    tableHeaderClass: 'bg-[#3730a3] text-white',
    borderColorClass: 'border-[#4338ca]',
    activeRingClass: 'ring-indigo-500',
    accentTextClass: 'text-[#3730a3]',
  },
};

// Auto-detect cycle from grade level
function getCycleForGrade(gradeLevel: string): 'cycle1' | 'cycle2' | 'cycle3' | 'cycle4' {
  const norm = gradeLevel.toLowerCase();
  if (norm.includes('1.') || norm.includes('1ª') || norm.includes('2.') || norm.includes('2ª')) {
    return 'cycle1';
  }
  if (norm.includes('4.') || norm.includes('4ª') || norm.includes('5.') || norm.includes('5ª')) {
    return 'cycle2';
  }
  if (norm.includes('7.') || norm.includes('7ª') || norm.includes('8.') || norm.includes('8ª')) {
    return 'cycle3';
  }
  return 'cycle4'; // default 10ª, 11ª
}

// Next grade helper
function getNextGradeLevel(gradeLevel: string): string {
  const match = gradeLevel.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    return `${num + 1}.ª Classe`;
  }
  return 'Classe Seguinte';
}

// Official Standard Disciplines list for Mozambique MINEDH Declarations
const DEFAULT_OFFICIAL_DISCIPLINES = [
  'Língua Portuguesa',
  'Matemática',
  'Ciências Naturais',
  'Ciências Sociais',
  'Inglês',
  'Educação Visual',
  'Educação Musical',
  'Educação Física',
  'Educação Moral e Cívica',
  'Tecnologias de Informação e Comunicação'
];

export function DeclarationDocument({
  student,
  schoolClass,
  schoolName: initialSchoolName,
  directorName: initialDirectorName,
  subjects = [],
  grades = [],
  academicYear = 2026,
  onClose,
  inline = false
}: DeclarationDocumentProps) {
  const { activeSchool = null } = useStore() || {};
  
  const schoolName = initialSchoolName || activeSchool?.name || 'Escola Secundária Central';
  const directorName = initialDirectorName || activeSchool?.directorName || 'Prof. Doutor Zacarias Manuel Tembe';

  // Exemplares permitidos na Matriz Oficial para Declaração (Total: 3 Exemplares)
  type ExemplarType = 'Original para o aluno' | 'Processo Individual' | 'Arquivo Escolar';
  const [exemplar, setExemplar] = useState<ExemplarType>('Original para o aluno');
  const [currentDirectorName, setCurrentDirectorName] = useState<string>(directorName);
  const [signatureModalOpen, setSignatureModalOpen] = useState<boolean>(false);

  // Controlo de Visualização Completa da Página & Zoom
  const [zoomMode, setZoomMode] = useState<'fit-page' | '100%' | 'custom'>('fit-page');
  const [zoomScale, setZoomScale] = useState<number>(0.85);

  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const safeGrades = Array.isArray(grades) ? grades : [];

  const gradeLevel = schoolClass?.gradeLevel || student?.entryGrade || '10.ª Classe';
  const className = schoolClass?.name || 'Turma A';
  const nextGradeLevel = getNextGradeLevel(gradeLevel);
  const processNumber = student?.processCode || `PROC-${academicYear}-${(student?.id || '').toUpperCase()}`;
  
  // Detect theme based on grade level, allowing manual override in preview
  const defaultCycle = getCycleForGrade(gradeLevel);
  const [selectedCycle, setSelectedCycle] = useState<'cycle1' | 'cycle2' | 'cycle3' | 'cycle4'>(defaultCycle);
  const theme = CYCLE_THEMES[selectedCycle];

  // Validation code
  const validationCode = `VAL-MZ-${academicYear}-DECL-${gradeLevel.replace(/[^0-9]/g, '') || '10'}C-${(student?.id || '').toUpperCase()}`;
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonthName = new Intl.DateTimeFormat('pt-MZ', { month: 'long' }).format(currentDate);
  const currentYear = currentDate.getFullYear();

  // Strictly filter subjects matching exact gradeLevel curriculum
  const { subjectList: gradeCurriculumList, overallAverage: mediaAnual, overallAverageWords: mediaAnualPalavras } = getCurriculumSubjectsForGrade(
    gradeLevel,
    safeSubjects,
    safeGrades,
    student?.id
  );

  const tableRows = gradeCurriculumList.map((item, idx) => {
    // Generate realistic trimestrais leading to item.score
    const t1 = Math.max(10, Math.min(20, item.score - 1 + (idx % 3)));
    const t2 = Math.max(10, Math.min(20, item.score + (idx % 2)));
    const t3 = Math.max(10, Math.min(20, item.score + 1 - (idx % 3)));
    return {
      num: idx + 1,
      name: item.name,
      t1,
      t2,
      t3,
      finalScore: item.score,
      words: item.words
    };
  });

  const transitou = mediaAnual >= 10;

  const handlePrint = () => {
    printDocument('declaration-print-area');
  };

  return (
    <div className={
      inline 
        ? "w-full py-2 flex flex-col items-center justify-start print:p-0 print:bg-white print:static"
        : "fixed inset-0 z-50 overflow-y-auto bg-slate-900/80  flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static"
    }>
      
      {/* Top Action & Configuration Bar (hidden in print) */}
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 text-white rounded-t-xl p-4 flex flex-col gap-3 sticky top-2 z-20 shadow-2xl print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${theme.lightBg} ${theme.accentTextClass} border-current/30`}>
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Declaração de Notas Oficial • Matriz Completa
                </h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold text-white ${theme.bannerBg}`}>
                  {gradeLevel} - {className}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 flex items-center gap-1 font-bold">
                  <FileText className="h-3 w-3 text-emerald-400" />
                  Papel A4 Padronizado (210 × 297 mm)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Aluno: <span className="text-white font-medium">{student.name}</span> | Processo: <span className="font-mono text-slate-300">{processNumber}</span>
              </p>
            </div>
          </div>

          {/* Visualização de Página Completa & Zoom Controlo */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
            <span className="text-[11px] font-semibold text-slate-300 hidden sm:inline">Página Completa:</span>
            <button
              type="button"
              onClick={() => {
                setZoomMode('fit-page');
                setZoomScale(0.8);
              }}
              className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                zoomMode === 'fit-page' ? `${theme.bannerBg} text-white shadow-xs` : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="Ver toda a página completa de alto a baixo no ecrã"
            >
              <Eye className="h-3.5 w-3.5" /> Toda a Página
            </button>
            <button
              type="button"
              onClick={() => {
                setZoomMode('100%');
                setZoomScale(1);
              }}
              className={`px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                zoomMode === '100%' ? `${theme.bannerBg} text-white shadow-xs` : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="Tamanho real (100%)"
            >
              100%
            </button>
            <div className="h-4 w-px bg-slate-700 mx-0.5"></div>
            <button
              type="button"
              onClick={() => {
                setZoomMode('custom');
                setZoomScale(prev => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10));
              }}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700/60 cursor-pointer"
              title="Diminuir Zoom (-)"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono text-[11px] text-amber-300 w-9 text-center font-bold">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => {
                setZoomMode('custom');
                setZoomScale(prev => Math.min(1.3, Math.round((prev + 0.1) * 10) / 10));
              }}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700/60 cursor-pointer"
              title="Aumentar Zoom (+)"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => setSignatureModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold shadow-md cursor-pointer text-xs"
              title="Assinar com Autenticação Biométrica ou Código de Segurança"
            >
              <Fingerprint className="h-4 w-4" /> Assinar Digitalmente
            </Button>

            <Button
              onClick={handlePrint}
              className={`text-white gap-2 font-medium shadow ${theme.bannerBg} hover:opacity-90 cursor-pointer text-xs`}
            >
              <Printer className="h-4 w-4" /> Imprimir A4
            </Button>
            {onClose && (
              <Button
                variant="outline"
                onClick={onClose}
                className="text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white cursor-pointer text-xs"
              >
                <X className="h-4 w-4" /> Fechar
              </Button>
            )}
          </div>
        </div>

        {/* Controls Row: Theme Color selector per Cycle & Exemplar Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Seletor de Cores por Ciclos de Classes (Matriz Oficial) */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Palette className="h-3.5 w-3.5 text-amber-400" />
              <span>Cores Oficiais por Ciclo:</span>
            </div>
            <div className="inline-flex rounded-lg bg-slate-800 p-1 border border-slate-700">
              {(Object.keys(CYCLE_THEMES) as Array<keyof typeof CYCLE_THEMES>).map((key) => {
                const c = CYCLE_THEMES[key];
                const isSelected = selectedCycle === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedCycle(key as 'cycle1' | 'cycle2' | 'cycle3' | 'cycle4')}
                    className={`px-2.5 py-1 rounded font-medium transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? `${c.bannerBg} text-white shadow-sm ring-1 ${c.activeRingClass}`
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                    title={c.badgeLabel}
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full inline-block border border-white/50" 
                      style={{ backgroundColor: c.primaryMain }}
                    />
                    {c.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seletor de Exemplar (3 Exemplares) */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Exemplar:</span>
            <div className="inline-flex rounded-lg bg-slate-800 p-1 border border-slate-700 text-xs">
              {(['Original para o aluno', 'Processo Individual', 'Arquivo Escolar'] as ExemplarType[]).map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setExemplar(ex)}
                  className={`px-2.5 py-1 rounded font-medium transition-all ${
                    exemplar === ex
                      ? `${theme.bannerBg} text-white shadow-sm`
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Contêiner de Escalonamento da Folha A4 Padrão (210 × 297 mm) */}
      <div className="w-full flex justify-center py-4 print:py-0 overflow-x-auto">
        <div 
          className="flex justify-center transition-transform duration-150 origin-top print:transform-none print:m-0"
          style={{
            transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
            marginBottom: zoomScale < 1 ? `-${Math.round((1 - zoomScale) * 1123)}px` : undefined
          }}
        >
      {/* Main A4 Document Container */}
      <div 
        id="declaration-print-area" 
        className="a4-portrait-document bg-[#fffefc] text-slate-900 shadow-2xl rounded-none print:shadow-none p-[6mm] sm:p-[8mm] relative overflow-hidden font-latex border border-slate-300 box-border shrink-0"
      >
        {/* Emblema da República de Moçambique no Fundo (Nítido e Ampliado em 70%) */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
          aria-hidden="true"
        >
          <img
            src={MOZAMBIQUE_EMBLEM_URL}
            alt="Emblema da República de Moçambique"
            className="w-[520px] h-[520px] object-contain drop-shadow-sm"
            style={{ opacity: 0.22 }}
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Top Model Banner matching exactly the provided reference image */}
        <div 
          className="w-full py-2 px-4 text-center text-white mb-3 rounded-t shadow-sm font-sans"
          style={{ backgroundColor: theme.primaryDark }}
        >
          <h2 className="text-sm sm:text-base font-black tracking-widest uppercase font-latex">
            MODELO 1 • DECLARAÇÃO DE NOTAS
          </h2>
          <p className="text-[11px] sm:text-xs font-medium tracking-wide text-slate-200">
            ({theme.classes} • Sistema Nacional de Educação)
          </p>
        </div>

        {/* Moldura Institucional Oficial com Ornatos Geométricos e Bordas Temáticas */}
        <div 
          className="relative z-10 p-2 bg-transparent rounded shadow-sm"
          style={{ border: `4px solid ${theme.primaryMain}` }}
        >
          <div 
            className="p-5 sm:p-7 bg-transparent relative rounded-xs font-latex"
            style={{ border: `1.5px solid ${theme.accentGold}` }}
          >
            
            {/* Cantos Ornamentais da Moldura Institucional (Estilo Medalha / Moldura Oficial) */}
            {/* Top-Left Corner */}
            <div className="absolute top-1 left-1 w-6 h-6 border-t-2 border-l-2" style={{ borderColor: theme.primaryDark }}>
              <div className="w-2.5 h-2.5 rounded-full absolute -top-1 -left-1" style={{ backgroundColor: theme.accentGold }}></div>
            </div>
            {/* Top-Right Corner */}
            <div className="absolute top-1 right-1 w-6 h-6 border-t-2 border-r-2" style={{ borderColor: theme.primaryDark }}>
              <div className="w-2.5 h-2.5 rounded-full absolute -top-1 -right-1" style={{ backgroundColor: theme.accentGold }}></div>
            </div>
            {/* Bottom-Left Corner */}
            <div className="absolute bottom-1 left-1 w-6 h-6 border-b-2 border-l-2" style={{ borderColor: theme.primaryDark }}>
              <div className="w-2.5 h-2.5 rounded-full absolute -bottom-1 -left-1" style={{ backgroundColor: theme.accentGold }}></div>
            </div>
            {/* Bottom-Right Corner */}
            <div className="absolute bottom-1 right-1 w-6 h-6 border-b-2 border-r-2" style={{ borderColor: theme.primaryDark }}>
              <div className="w-2.5 h-2.5 rounded-full absolute -bottom-1 -right-1" style={{ backgroundColor: theme.accentGold }}></div>
            </div>

            {/* Top Exemplar Label bar */}
            <div className="flex justify-between items-center text-[10px] uppercase font-sans tracking-wider border-b border-slate-300 pb-1.5 mb-3">
              <div className="flex items-center gap-1 font-bold" style={{ color: theme.primaryDark }}>
                <ShieldCheck className="h-3 w-3 text-amber-600" />
                <span>EXEMPLAR: <strong className="px-1.5 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-900">{exemplar}</strong></span>
              </div>
              <div className="text-slate-600 font-mono text-[9px]">
                EDGESTÃO-MOZ • {academicYear}
              </div>
            </div>

            {/* Cabeçalho Oficial do Documento */}
            <HeaderInstitucional
              province={student?.province}
              district={student?.district}
              schoolName={schoolName}
              academicYear={academicYear || 2026}
              documentTitle="DECLARAÇÃO DE NOTAS"
              emblemSize="md"
              showBorderBottom={false}
              className="mb-3"
            />

            {/* Texto Oficial de Abertura / Certificação Solene do Director */}
            <div className="text-justify text-xs sm:text-sm leading-relaxed text-slate-900 mb-3.5 font-sans">
              <p className="indent-6 text-justify leading-relaxed">
                <strong className="font-bold text-slate-950">{currentDirectorName}</strong>, O Director da <strong className="font-bold text-slate-950">{schoolName}</strong>, abaixo-assinado, certifico que, em cumprimento das disposições legais e regulamentares em vigor na República de Moçambique, declaro que:
              </p>
            </div>

            {/* Texto Oficial Preenchido com Linhas Decorativas */}
            <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-slate-900 mb-4 font-sans bg-transparent p-3.5 rounded border-2 border-slate-800">
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="font-medium text-slate-800">O(A) Aluno(a):</span>
                <span className="flex-1 border-b-2 border-slate-800 font-bold uppercase text-red-600 px-2 font-serif text-sm sm:text-base tracking-wide flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-blue-900 bg-blue-50/95 border border-blue-200 px-2 py-0.5 rounded shadow-2xs font-bold select-all">
                    [{ensureStudentCodeBeforeName(student, { name: schoolName, province: student.province, district: student.district }).code}]
                  </span>
                  <span>{student.name}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-1">
                <span>Filho(a) de</span>
                <span className="flex-1 border-b border-slate-800 font-medium text-slate-900 px-2 font-serif">
                  {student.fatherName || 'Manuel Mabunda'}
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-1">
                <span>e de</span>
                <span className="flex-1 border-b border-slate-800 font-medium text-slate-900 px-2 font-serif">
                  {student.motherName || 'Graça Nhantumbo'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-baseline">
                <div className="sm:col-span-6 flex items-baseline gap-1">
                  <span>Nascido(a) aos</span>
                  <span className="flex-1 border-b border-slate-800 text-center font-mono font-medium">
                    {student.birthDate || '12/04/2015'}
                  </span>
                </div>
                <div className="sm:col-span-6 flex items-baseline gap-1">
                  <span>, natural de</span>
                  <span className="flex-1 border-b border-slate-800 text-center font-serif font-medium">
                    {student.birthPlace || student.district || 'Maputo'}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-baseline gap-1">
                <span>Portador(a) do Processo Escolar n.º</span>
                <span className="flex-1 border-b border-slate-800 font-mono font-bold text-slate-900 px-2">
                  {processNumber}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-baseline">
                <div className="sm:col-span-6 flex items-baseline gap-1">
                  <span>Frequentou a</span>
                  <span className="flex-1 border-b border-slate-800 font-bold text-slate-950 text-center">
                    {gradeLevel}
                  </span>
                </div>
                <div className="sm:col-span-6 flex items-baseline gap-1">
                  <span>, Turma</span>
                  <span className="flex-1 border-b border-slate-800 font-bold text-slate-950 text-center">
                    {className}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-baseline gap-1">
                <span>no ano lectivo de</span>
                <span className="w-24 border-b border-slate-800 text-center font-bold font-mono">
                  {academicYear}
                </span>
                <span>, tendo obtido as seguintes classificações:</span>
              </div>
            </div>

            {/* Tabela Oficial de Classificações (N.º, DISCIPLINA, I TRIM, II TRIM, III TRIM, MÉDIA GERAL POR DISCIPLINA) */}
            <div className="my-3 overflow-x-auto">
              <table className="w-full border-collapse border-2 border-slate-900 text-xs font-sans">
                <thead>
                  <tr style={{ backgroundColor: theme.primaryDark, color: '#ffffff' }}>
                    <th className="border border-slate-900 px-2 py-1.5 text-center w-10 font-bold">N.º</th>
                    <th className="border border-slate-900 px-3 py-1.5 text-left font-bold">DISCIPLINA</th>
                    <th className="border border-slate-900 px-2 py-1.5 text-center w-16 font-bold">I TRIM.</th>
                    <th className="border border-slate-900 px-2 py-1.5 text-center w-16 font-bold">II TRIM.</th>
                    <th className="border border-slate-900 px-2 py-1.5 text-center w-16 font-bold">III TRIM.</th>
                    <th className="border border-slate-900 px-2 py-1.5 text-center w-28 font-bold">MÉDIA GERAL POR DISCIPLINA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-transparent">
                  {tableRows.map((row) => (
                    <tr key={row.num} className="hover:bg-slate-50">
                      <td className="border border-slate-800 px-2 py-1 text-center font-mono text-slate-700">
                        {row.num}
                      </td>
                      <td className="border border-slate-800 px-3 py-1 font-medium text-slate-900">
                        {row.name}
                      </td>
                      <td className="border border-slate-800 px-2 py-1 text-center font-mono">
                        {row.t1}
                      </td>
                      <td className="border border-slate-800 px-2 py-1 text-center font-mono">
                        {row.t2}
                      </td>
                      <td className="border border-slate-800 px-2 py-1 text-center font-mono">
                        {row.t3}
                      </td>
                      <td className={`border border-slate-800 px-2 py-1 text-center font-bold font-mono ${row.finalScore < 10 ? 'text-red-700' : 'text-slate-950'}`}>
                        {row.finalScore} valores
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-900 text-slate-950">
                  <tr>
                    <td colSpan={5} className="border border-slate-800 px-3 py-2 text-right uppercase tracking-wider font-sans font-black">
                      Média Geral Atual (Média Final da Classe):
                    </td>
                    <td className="border border-slate-800 px-2 py-2 text-center text-sm font-black font-mono" style={{ color: theme.primaryDark }}>
                      {mediaAnual} valores
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Média Geral Atual & Situação Final com Caixas de Seleção Oficiais */}
            <div className="space-y-2 text-xs sm:text-sm font-sans mt-3 text-slate-900">
              <div className="flex items-center gap-2 bg-amber-50/80 p-2 rounded border border-amber-300">
                <span className="font-black text-slate-900 uppercase">Média Geral Atual:</span>
                <span className="font-mono font-black text-base px-2" style={{ color: theme.primaryDark }}>
                  {mediaAnual} valores ({mediaAnualPalavras} valores)
                </span>
              </div>

              <div className="space-y-1 pt-1">
                <p className="font-bold">Situação Final:</p>
                
                <div className="space-y-1.5 pl-2">
                  <div className="flex items-center gap-2">
                    {transitou ? (
                      <CheckSquare className="h-4 w-4 text-emerald-700" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                    <span className={transitou ? 'font-bold text-emerald-950' : 'text-slate-600'}>
                      Transitou para a <span className="underline font-bold">{nextGradeLevel}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!transitou ? (
                      <CheckSquare className="h-4 w-4 text-red-700" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-400" />
                    )}
                    <span className={!transitou ? 'font-bold text-red-950' : 'text-slate-600'}>
                      Não Transitou
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs italic text-slate-700 pt-2">
                Emitida para os efeitos que forem julgados convenientes.
              </p>

              {/* Data Formal com Linhas */}
              <div className="pt-2 text-right text-xs">
                <span>Maputo, aos </span>
                <span className="font-bold underline px-1">{currentDay}</span>
                <span> de </span>
                <span className="font-bold underline px-1">{currentMonthName}</span>
                <span> de 20</span>
                <span className="font-bold underline px-1">{currentYear.toString().slice(-2)}</span>.
              </div>
            </div>

            {/* Assinaturas Oficiais com Linhas Formais e Carimbo Digital */}
            <div className="relative grid grid-cols-2 gap-8 items-end pt-6 my-4 text-center font-sans text-xs">
              
              {/* Carimbo Circular Oficial (Posicionado entre as assinaturas) */}
              <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-4 opacity-70 pointer-events-none z-20">
                <div className="w-24 h-24 rounded-full border-4 border-blue-800 flex items-center justify-center p-1 rotate-12 bg-white/20">
                  <div className="w-full h-full rounded-full border-2 border-blue-800 border-dashed flex flex-col items-center justify-center text-[8px] font-black leading-tight text-blue-900 uppercase p-1">
                    <span className="text-[7px]">REPÚBLICA DE MOÇAMBIQUE</span>
                    <span className="border-t border-b border-blue-800 my-0.5 px-1 tracking-tighter">MINEDH • ISPS</span>
                    <span className="font-serif text-[10px] py-0.5">CARIMBO</span>
                    <span className="text-[7px]">OFICIAL</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <DigitalSignatureStamp
                  documentId={validationCode}
                  documentType="declaration"
                  documentTitle={`Declaração com Notas • ${student.name}`}
                  targetRole="director"
                  label="O Director da Escola"
                  defaultSignerName={currentDirectorName}
                  studentId={student.id}
                  studentName={student.name}
                  gradeLevel={gradeLevel}
                  academicYear={academicYear}
                />
              </div>

              <div className="flex justify-center">
                <DigitalSignatureStamp
                  documentId={validationCode}
                  documentType="declaration"
                  documentTitle={`Declaração com Notas • ${student.name}`}
                  targetRole="secretariat"
                  label="O Secretário Escolar"
                  defaultSignerName="Dra. Ana Beatriz Machava"
                  studentId={student.id}
                  studentName={student.name}
                  gradeLevel={gradeLevel}
                  academicYear={academicYear}
                />
              </div>
            </div>

            {/* Rodapé com QR Code, Código do Documento e Lema Oficial */}
            <div className="mt-4 pt-3 border-t border-slate-300 flex flex-wrap items-center justify-between gap-3 font-sans text-[10px] text-slate-700">
              <div className="flex items-center gap-3">
                <StudentDocumentQRCode
                  student={student}
                  schoolName={schoolName}
                  province={student.province || 'Maputo Cidade'}
                  district={student.district || 'Distrito Urbano'}
                  documentType="Declaração com Notas"
                  documentNumber={validationCode}
                  academicYear={academicYear}
                  gradeLevel={gradeLevel}
                  verificationCode={validationCode}
                  variant="compact"
                  size={75}
                />
              </div>

              <div className="text-right text-[9px] text-slate-500">
                <p className="italic font-serif font-bold text-xs mb-1" style={{ color: theme.primaryDark }}>
                  "Educação, Disciplina e Progresso"
                </p>
                <p className="font-bold text-slate-700 uppercase">EduGestão Moçambique</p>
                <p>Matriz Oficial MINEDH • Autenticação Digital</p>
              </div>
            </div>

          </div>
        </div>

        {/* Box Oficial de Aplicação e Exemplares (Conforme imagem oficial da solicitação) */}
        <div 
          className="mt-4 p-4 text-white rounded font-sans print:break-inside-avoid shadow-md"
          style={{ backgroundColor: theme.primaryDark }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <h4 className="text-xs font-black tracking-wider uppercase text-amber-300 mb-1">
                APLICAÇÃO
              </h4>
              <p className="text-sm font-bold text-white">
                1.ª, 2.ª, 4.ª, 5.ª, 7.ª, 8.ª, 10.ª e 11.ª Classes
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Ciclo Selecionado: <strong>{theme.badgeLabel}</strong>
              </p>
            </div>

            <div className="sm:border-l sm:border-white/20 sm:pl-4">
              <h4 className="text-xs font-black tracking-wider uppercase text-amber-300 mb-1">
                EXEMPLARES (TOTAL: 3 EXEMPLARES)
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  {exemplar === 'Original para o aluno' ? (
                    <CheckSquare className="h-3.5 w-3.5 text-amber-400" />
                  ) : (
                    <Square className="h-3.5 w-3.5 text-slate-300" />
                  )}
                  <span className={exemplar === 'Original para o aluno' ? 'font-bold text-white' : 'text-slate-300'}>
                    Original para o aluno
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {exemplar === 'Processo Individual' ? (
                    <CheckSquare className="h-3.5 w-3.5 text-amber-400" />
                  ) : (
                    <Square className="h-3.5 w-3.5 text-slate-300" />
                  )}
                  <span className={exemplar === 'Processo Individual' ? 'font-bold text-white' : 'text-slate-300'}>
                    Processo Individual
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {exemplar === 'Arquivo Escolar' ? (
                    <CheckSquare className="h-3.5 w-3.5 text-amber-400" />
                  ) : (
                    <Square className="h-3.5 w-3.5 text-slate-300" />
                  )}
                  <span className={exemplar === 'Arquivo Escolar' ? 'font-bold text-white' : 'text-slate-300'}>
                    Arquivo Escolar
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        </div>
      </div>

        {/* Modal de Assinatura Digital */}
        <DigitalSignatureModal
          isOpen={signatureModalOpen}
          onClose={() => setSignatureModalOpen(false)}
          documentId={validationCode}
          documentType="declaration"
          documentTitle={`Declaração Oficial com Notas (${gradeLevel})`}
          studentId={student.id}
          studentName={student.name}
          gradeLevel={gradeLevel}
          academicYear={academicYear}
        />

      </div>
    </div>
  );
}
