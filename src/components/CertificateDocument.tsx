import React, { useState } from 'react';
import { Student, Class, Subject, Grade, MOZAMBIQUE_EMBLEM_URL } from '../types';
import { useStore } from '../store';
import { Button } from './ui';
import { Printer, ShieldCheck, X, Award, BookOpen, GraduationCap, FileSpreadsheet, Download, Fingerprint, ZoomIn, ZoomOut, Eye, FileText } from 'lucide-react';
import { generateOfficialCertificatePDF } from '../utils/pdfGenerator';
import { StudentDocumentQRCode } from './StudentDocumentQRCode';
import { DigitalSignatureStamp } from './DigitalSignatureStamp';
import { printDocument } from '../utils/printHelper';
import { ensureStudentCodeBeforeName } from '../utils/studentCodeValidator';
import { getCurriculumSubjectsForGrade } from '../utils/gradeCurriculum';
import { DigitalSignatureModal } from './DigitalSignatureModal';

interface CertificateDocumentProps {
  student: Student;
  schoolClass?: Class;
  schoolName?: string;
  directorName?: string;
  pedagogicalDirectorName?: string;
  secretaryName?: string;
  subjects?: Subject[];
  grades?: Grade[];
  academicYear?: number;
  onClose?: () => void;
  inline?: boolean;
}

function numberToWords(num: number): string {
  const words: Record<number, string> = {
    0: 'Zero', 1: 'Um', 2: 'Dois', 3: 'Três', 4: 'Quatro', 5: 'Cinco',
    6: 'Seis', 7: 'Sete', 8: 'Oito', 9: 'Nove', 10: 'Dez', 11: 'Onze',
    12: 'Doze', 13: 'Treze', 14: 'Catorze', 15: 'Quinze', 16: 'Dezasseis',
    17: 'Dezassete', 18: 'Dezoito', 19: 'Dezanove', 20: 'Vinte'
  };
  return words[Math.round(num)] || `${num}`;
}

export function CertificateDocument({
  student,
  schoolClass,
  schoolName: initialSchoolName,
  directorName: initialDirectorName,
  pedagogicalDirectorName: initialPedagogicalDirectorName,
  secretaryName: initialSecretaryName,
  subjects = [],
  grades = [],
  academicYear = 2026,
  onClose,
  inline = false
}: CertificateDocumentProps) {
  const { activeSchool = null } = useStore() || {};
  
  const schoolName = initialSchoolName || activeSchool?.name || 'Escola Secundária Central';
  const directorName = initialDirectorName || activeSchool?.directorName || 'Prof. Doutor Zacarias Manuel Tembe';
  const pedagogicalDirectorName = initialPedagogicalDirectorName || activeSchool?.pedagogicalDirectorName || 'Dr. Mateus Armando Cuna';
  const secretaryName = initialSecretaryName || activeSchool?.secretariatChiefName || 'Dra. Ana Beatriz Machava';

  type ExemplarType = 'Original do Aluno' | 'Processo Individual' | 'Arquivo Escolar' | 'Secretaria Académica';
  const [exemplar, setExemplar] = useState<ExemplarType>('Original do Aluno');
  const [viewMode, setViewMode] = useState<'diploma_portrait' | 'diploma_landscape' | 'transcript_portrait'>('diploma_landscape');
  const [certType, setCertType] = useState<'DE CONCLUSÃO DO CURSO' | 'DE HABILITAÇÕES LITERÁRIAS'>('DE CONCLUSÃO DO CURSO');
  const [signatureModalOpen, setSignatureModalOpen] = useState<boolean>(false);

  // Controlo de Visualização Completa da Página & Zoom em Papel A4 Padrão (210 × 297 mm)
  const [zoomMode, setZoomMode] = useState<'fit-page' | '100%' | 'custom'>('fit-page');
  const [zoomScale, setZoomScale] = useState<number>(0.85);
  const [isFullWidth, setIsFullWidth] = useState<boolean>(false);

  const gradeLevel = schoolClass?.gradeLevel || student?.entryGrade || '10ª Classe';
  const processNumber = student?.processCode || `PROC-${academicYear}-${(student?.id || '001').toUpperCase()}`;
  const studentNum = student?.studentNumber || (student?.frequencyNumber ? `ALU-${student.frequencyNumber.toString().padStart(4, '0')}` : `ALU-1042`);
  const certificateCode = `ES/CC/${academicYear}/${student?.frequencyNumber ? String(student.frequencyNumber).padStart(4, '0') : '0042'}`;
  const validationCode = `VAL-MZ-${academicYear}-CERT-${(gradeLevel || '10').replace(/[^0-9]/g, '') || '10'}C-${(student?.id || '001').toUpperCase()}`;
  
  const currentDateFormatted = new Intl.DateTimeFormat('pt-MZ', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  // Subject Grades Calculation strictly matching gradeLevel curriculum
  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const safeGrades = Array.isArray(grades) ? grades : [];

  const { subjectList: gradeCurriculumList, overallAverage: averageScore, overallAverageWords: averageWords } = getCurriculumSubjectsForGrade(
    gradeLevel,
    safeSubjects,
    safeGrades,
    student?.id
  );

  const subjectGradeList = gradeCurriculumList.map(item => ({
    subject: { id: item.id, name: item.name },
    score: item.score,
    words: item.words
  }));

  const isApproved = averageScore >= 10;

  const courseTitle = gradeLevel.includes('10') || gradeLevel.includes('11') || gradeLevel.includes('12') 
    ? 'Ensino Secundário Geral (2º Ciclo)' 
    : gradeLevel.includes('7') || gradeLevel.includes('8') || gradeLevel.includes('9')
    ? 'Ensino Básico / Secundário Geral (1º Ciclo)'
    : 'Ensino Primário Completo';

  const handlePrint = () => {
    printDocument('certificate-print-area');
  };

  return (
    <div className={
      inline
        ? "w-full py-2 flex flex-col items-center justify-start print:p-0 print:bg-white print:static"
        : "fixed inset-0 z-50 overflow-y-auto bg-slate-900/80  flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static"
    }>
      
      {/* Regra de Impressão Dinâmica para Orientação A4 (Retrato vs Paisagem) */}
      {viewMode === 'diploma_landscape' ? (
        <style>{`@media print { @page { size: A4 landscape !important; margin: 0 !important; } html, body { width: 297mm !important; height: 210mm !important; } }`}</style>
      ) : (
        <style>{`@media print { @page { size: A4 portrait !important; margin: 0 !important; } html, body { width: 210mm !important; height: 297mm !important; } }`}</style>
      )}

      {/* Barra de Controlo e Ações Superiores (Oculta na Impressão) */}
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 text-white rounded-t-xl p-4 flex flex-wrap items-center justify-between gap-3 sticky top-2 z-30 shadow-2xl print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Diploma de Honra do Melhor Aluno • Matriz MINEDH
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono border border-amber-400/30">
                {gradeLevel}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30 flex items-center gap-1 font-bold">
                <FileText className="h-3 w-3 text-blue-400" />
                Papel A4 Padronizado ({viewMode === 'diploma_landscape' ? '297 × 210 mm' : '210 × 297 mm'})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Aluno: <span className="text-white font-medium">{student.name}</span> | Matrícula: {studentNum}
            </p>
          </div>
        </div>

        {/* Formato Único Obrigatório: Diploma de Honra Horizontal */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 hidden md:inline">Formato A4:</span>
          <div className="inline-flex rounded-lg bg-slate-800 px-3.5 py-1.5 border border-slate-700 text-xs font-bold text-amber-300 items-center gap-1.5 shadow-sm select-none">
            <Award className="h-4 w-4 text-amber-400" /> Diploma de Honra Horizontal (A4 Paisagem)
          </div>
        </div>

        {/* Tipo de Título & Exemplar */}
        <div className="flex items-center gap-2">
          <select
            value={certType}
            onChange={(e) => setCertType(e.target.value as any)}
            className="bg-slate-800 text-xs text-amber-300 border border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="DE CONCLUSÃO DO CURSO">De Conclusão do Curso</option>
            <option value="DE HABILITAÇÕES LITERÁRIAS">De Habilitações Literárias</option>
          </select>

          <select
            value={exemplar}
            onChange={(e) => setExemplar(e.target.value as any)}
            className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="Original do Aluno">Original do Aluno</option>
            <option value="Processo Individual">Processo Individual</option>
            <option value="Arquivo Escolar">Arquivo Escolar</option>
            <option value="Secretaria Académica">Secretaria Académica</option>
          </select>
        </div>

        {/* Visualização de Página Completa & Zoom Controlo */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
          <span className="text-[11px] font-semibold text-slate-300 hidden sm:inline">Página A4:</span>
          <button
            type="button"
            onClick={() => {
              setZoomMode('fit-page');
              setZoomScale(viewMode === 'diploma_landscape' ? 0.85 : 0.72);
            }}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              zoomMode === 'fit-page' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
            title="Ver toda a folha A4 completa de alto a baixo no ecrã"
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
              zoomMode === '100%' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
            title="Tamanho real do papel A4 (100%)"
          >
            100% (A4 Real)
          </button>
          <div className="h-4 w-px bg-slate-700 mx-0.5"></div>
          <button
            type="button"
            onClick={() => {
              setZoomMode('custom');
              setZoomScale(prev => Math.max(0.4, Math.round((prev - 0.1) * 10) / 10));
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
              setZoomScale(prev => Math.min(1.4, Math.round((prev + 0.1) * 10) / 10));
            }}
            className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700/60 cursor-pointer"
            title="Aumentar Zoom (+)"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              generateOfficialCertificatePDF({
                student,
                certificate: {
                  id: `cert-${Date.now()}`,
                  studentId: student.id,
                  studentName: student.name,
                  iue: student.iue || 'IUE-PENDENTE',
                  nim: student.nim,
                  certificateCode,
                  type: certType === 'DE CONCLUSÃO DO CURSO' ? 'CERTIFICADO DE CONCLUSÃO' : 'DECLARAÇÃO DE CONCLUSÃO',
                  gradeLevel,
                  academicYear,
                  schoolName,
                  average: averageScore,
                  issuedAt: currentDateFormatted,
                  verificationCode: validationCode,
                  qrPayload: `IUE:${student.iue || ''}|NOME:${student.name}|ESCOLA:${schoolName}|ANO:${academicYear}|CERT:${certificateCode}`,
                  directorName,
                  secretaryName
                },
                school: {
                  id: student.schoolId || 's1',
                  name: schoolName,
                  address: 'Moçambique',
                  directorName,
                  secretariatChiefName: secretaryName,
                  pedagogicalDirectorName,
                  province: student.province || 'Tete',
                  district: student.district || 'Cahora Bassa'
                }
              });
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium shadow cursor-pointer text-xs"
          >
            <Download className="h-4 w-4" /> Baixar PDF A4
          </Button>

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
            className="bg-amber-600 hover:bg-amber-700 text-white gap-2 font-medium shadow cursor-pointer text-xs"
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

      {/* Contêiner de Escalonamento da Folha A4 Padrão (210 × 297 mm) */}
      <div className="w-full flex justify-center py-4 print:py-0 overflow-x-auto">
        <div 
          className="flex justify-center transition-transform duration-150 origin-top print:transform-none print:m-0"
          style={{
            transform: zoomScale !== 1 ? `scale(${zoomScale})` : undefined,
            marginBottom: zoomScale < 1 
              ? `-${Math.round((1 - zoomScale) * (viewMode === 'diploma_landscape' ? 794 : 1123))}px` 
              : undefined
          }}
        >
      {/* ========================================================================= */}
      {/* MODELO 1: DIPLOMA EM PAPEL A4 VERTICAL (210 mm × 297 mm)                  */}
      {/* ========================================================================= */}
      {viewMode === 'diploma_portrait' ? (
        <div 
          id="certificate-print-area"
          className="a4-portrait-document bg-[#fcfbf7] text-[#0f172a] shadow-2xl rounded-none print:shadow-none p-[6mm] sm:p-[8mm] relative overflow-hidden font-latex select-none border border-slate-300 box-border shrink-0"
        >
          {/* Fundo de Segurança com Padrão Guilhoché Fino */}
          <div className="absolute inset-0 pointer-events-none select-none z-0 opacity-15 overflow-hidden">
            <svg className="w-full h-full text-blue-900" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="guilloche-pat" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 0 30 Q 15 0, 30 30 T 60 30" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
                  <path d="M 0 30 Q 15 60, 30 30 T 60 30" fill="none" stroke="#b45309" strokeWidth="0.5" opacity="0.4" />
                  <circle cx="30" cy="30" r="18" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#guilloche-pat)" />
            </svg>
          </div>

          {/* Emblema da República de Moçambique no Fundo (Nítido e Ampliado em 70%) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0" aria-hidden="true">
            <img
              src={MOZAMBIQUE_EMBLEM_URL}
              alt="Emblema da República de Moçambique"
              className="w-[520px] h-[520px] object-contain drop-shadow-sm"
              style={{ opacity: 0.22 }}
              referrerPolicy="no-referrer"
            />
          </div>

          {/* ========================================================================= */}
          {/* MOLDURA EXTERIOR E INTERIOR COM FAIXAS LATERAIS E CANTOS ORNAMENTAIS       */}
          {/* ========================================================================= */}
          <div className="relative z-10 border-[6px] border-[#0b2545] p-1 bg-transparent shadow-inner h-full flex flex-col box-border">
            <div className="border-[2px] border-[#c59b27] p-1 bg-transparent relative flex-1 flex flex-col box-border">
              <div className="border-[1.5px] border-[#0b2545] p-4 sm:p-6 bg-transparent relative flex-1 flex flex-col justify-between box-border font-latex">
                
                {/* 4 Cantos Triangulares Geométricos Azul Marinho & Dourado (Exact Image Style) */}
                {/* Canto Superior Esquerdo */}
                <div className="absolute -top-1 -left-1 w-16 h-16 overflow-hidden pointer-events-none z-30">
                  <div className="w-20 h-20 bg-[#0b2545] border-2 border-[#c59b27] -rotate-45 -translate-x-10 -translate-y-10 flex items-end justify-center pb-2">
                    <div className="w-4 h-4 border-2 border-[#d4af37] rotate-45"></div>
                  </div>
                </div>
                {/* Canto Superior Direito */}
                <div className="absolute -top-1 -right-1 w-16 h-16 overflow-hidden pointer-events-none z-30">
                  <div className="w-20 h-20 bg-[#0b2545] border-2 border-[#c59b27] rotate-45 translate-x-10 -translate-y-10 flex items-end justify-center pb-2">
                    <div className="w-4 h-4 border-2 border-[#d4af37] -rotate-45"></div>
                  </div>
                </div>
                {/* Canto Inferior Esquerdo */}
                <div className="absolute -bottom-1 -left-1 w-16 h-16 overflow-hidden pointer-events-none z-30">
                  <div className="w-20 h-20 bg-[#0b2545] border-2 border-[#c59b27] rotate-45 -translate-x-10 translate-y-10 flex items-start justify-center pt-2">
                    <div className="w-4 h-4 border-2 border-[#d4af37] -rotate-45"></div>
                  </div>
                </div>
                {/* Canto Inferior Direito */}
                <div className="absolute -bottom-1 -right-1 w-16 h-16 overflow-hidden pointer-events-none z-30">
                  <div className="w-20 h-20 bg-[#0b2545] border-2 border-[#c59b27] -rotate-45 translate-x-10 translate-y-10 flex items-start justify-center pt-2">
                    <div className="w-4 h-4 border-2 border-[#d4af37] rotate-45"></div>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* FAIXA LATERAL ESQUERDA (AZUL MARINHO + DOURADO + DISCIPLINA/CIÊNCIA...)   */}
                {/* ========================================================================= */}
                <div className="absolute left-4 top-10 bottom-10 w-12 bg-[#0b2545] border-2 border-[#c59b27] rounded-sm shadow-xl flex flex-col items-center justify-between py-4 text-[#d4af37] z-20 hidden md:flex">
                  {/* Selo com Ícone do Livro Aberto no Topo */}
                  <div className="w-9 h-9 rounded-full border-2 border-[#d4af37] bg-[#08182b] flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                    <BookOpen className="h-5 w-5 text-[#e6ca65]" />
                  </div>
                  
                  {/* Texto Vertical: DISCIPLINA • CIÊNCIA • TRABALHO • PROGRESSO */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 my-4">
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-black tracking-[0.3em] uppercase text-[#e6ca65] font-sans drop-shadow-sm">
                      DISCIPLINA
                    </span>
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-black tracking-[0.3em] uppercase text-[#e6ca65] font-sans drop-shadow-sm">
                      CIÊNCIA
                    </span>
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-black tracking-[0.3em] uppercase text-[#e6ca65] font-sans drop-shadow-sm">
                      TRABALHO
                    </span>
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-black tracking-[0.3em] uppercase text-[#e6ca65] font-sans drop-shadow-sm">
                      PROGRESSO
                    </span>
                  </div>

                  {/* Ornamento Dourado na Base */}
                  <div className="w-8 h-8 flex items-center justify-center">
                    <div className="w-4 h-4 rotate-45 border border-[#d4af37] bg-[#e6ca65]/20"></div>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* FAIXA LATERAL DIREITA (AZUL MARINHO + DOURADO + FORMAR HOJE LÍDERES...)    */}
                {/* ========================================================================= */}
                <div className="absolute right-4 top-10 bottom-10 w-12 bg-[#0b2545] border-2 border-[#c59b27] rounded-sm shadow-xl flex flex-col items-center justify-between py-4 text-[#d4af37] z-20 hidden md:flex">
                  {/* Selo com Ícone do Chapéu de Formatura / Graduação no Topo */}
                  <div className="w-9 h-9 rounded-full border-2 border-[#d4af37] bg-[#08182b] flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                    <GraduationCap className="h-5 w-5 text-[#e6ca65]" />
                  </div>

                  {/* Texto Vertical: FORMAR • HOJE • LÍDERES • PARA AMANHÃ */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 my-4">
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-black tracking-[0.3em] uppercase text-[#e6ca65] font-sans drop-shadow-sm">
                      FORMAR
                    </span>
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-black tracking-[0.3em] uppercase text-[#e6ca65] font-sans drop-shadow-sm">
                      HOJE
                    </span>
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-black tracking-[0.3em] uppercase text-[#e6ca65] font-sans drop-shadow-sm">
                      LÍDERES
                    </span>
                    <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-black tracking-[0.3em] uppercase text-[#e6ca65] font-sans drop-shadow-sm">
                      PARA AMANHÃ
                    </span>
                  </div>

                  {/* Ornamento Dourado na Base */}
                  <div className="w-8 h-8 flex items-center justify-center">
                    <div className="w-4 h-4 rotate-45 border border-[#d4af37] bg-[#e6ca65]/20"></div>
                  </div>
                </div>

                {/* Conteúdo Central do Certificado (Margens Laterais para Acomodar as Faixas) */}
                <div className="md:px-14 flex flex-col justify-between flex-1 space-y-5">
                  
                  {/* Linha Superior com Indicador de Exemplar & Registro */}
                  <div className="flex justify-between items-center text-[9px] uppercase font-sans tracking-widest text-slate-500 border-b border-slate-200 pb-1">
                    <span className="font-semibold text-amber-900">
                      REPÚBLICA DE MOÇAMBIQUE • DOCUMENTO PÚBLICO OFICIAL [{(exemplar || 'Original do Aluno').toUpperCase()}]
                    </span>
                    <span className="font-mono text-slate-600 font-bold">
                      PROCESSO N.º: {processNumber}
                    </span>
                  </div>

                  {/* Cabeçalho Oficial (3 Colunas: Esquerda Minedh, Centro Emblema, Direita Escola) */}
                  <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 text-center md:text-left">
                    {/* Esquerda: Ministério */}
                    <div className="md:col-span-4 space-y-0.5">
                      <p className="text-xs font-black uppercase text-[#0b2545] tracking-wider leading-tight">
                        REPÚBLICA DE MOÇAMBIQUE
                      </p>
                      <p className="text-[11px] font-bold uppercase text-slate-800 leading-tight">
                        MINISTÉRIO DA EDUCAÇÃO E DESENVOLVIMENTO HUMANO
                      </p>
                      <p className="text-[10px] font-bold uppercase text-slate-700">
                        DIRECÇÃO PROVINCIAL DA EDUCAÇÃO DE: {(student?.province || 'MAPUTO CIDADE').toUpperCase()}
                      </p>
                      <p className="text-[9.5px] font-medium text-slate-600 uppercase">
                        SERVIÇOS DISTRITAIS DE EDUCAÇÃO, JUVENTUDE E TECNOLOGIA DE: {(student?.district || 'KAMPFUMO').toUpperCase()}
                      </p>
                    </div>

                    {/* Centro: Emblema Nacional Colorido Ampliado (+70%) */}
                    <div className="md:col-span-4 flex justify-center py-1">
                      <div className="relative">
                        <img
                          src={MOZAMBIQUE_EMBLEM_URL}
                          alt="Brasão da República de Moçambique"
                          className="h-32 w-32 object-contain drop-shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                    {/* Direita: Escola e Lema Institucional */}
                    <div className="md:col-span-4 text-center md:text-right space-y-0.5">
                      <p className="text-xs font-black uppercase text-[#0b2545] tracking-wide leading-tight">
                        {(schoolName || 'ESCOLA SECUNDÁRIA JOSINA MACHEL').toUpperCase()}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-blue-900">
                        CÓDIGO INSTITUCIONAL: PT/DCB/EBCHN/SONGO • ANO LECTIVO {academicYear || '2026'}
                      </p>
                      <p className="text-[9px] font-semibold text-slate-600 uppercase tracking-wider">
                        Educação, Disciplina e Progresso
                      </p>
                    </div>
                  </div>

                  {/* Título Monumental do Certificado */}
                  <div className="text-center my-1">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0b2545] tracking-[0.15em] uppercase font-serif">
                      CERTIFICADO
                    </h1>
                    
                    {/* Linhas Douradas com Ornamento Central */}
                    <div className="flex items-center justify-center gap-3 my-1">
                      <div className="h-[1.5px] w-24 sm:w-36 bg-gradient-to-r from-transparent via-[#c59b27] to-[#c59b27]"></div>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rotate-45 bg-[#c59b27]"></span>
                        <span className="text-[11px] sm:text-xs font-bold tracking-[0.2em] text-[#8c6d1f] uppercase font-sans">
                          {certType}
                        </span>
                        <span className="w-1.5 h-1.5 rotate-45 bg-[#c59b27]"></span>
                      </div>
                      <div className="h-[1.5px] w-24 sm:w-36 bg-gradient-to-l from-transparent via-[#c59b27] to-[#c59b27]"></div>
                    </div>
                  </div>

                  {/* Corpo do Certificado / Texto Solene */}
                  <div className="text-center space-y-3 px-2 sm:px-6">
                    <p className="text-xs sm:text-sm italic font-serif text-slate-700">
                      Certifica-se que
                    </p>

                    {/* Nome Completo do Aluno precedido obrigatoriamente pelo Código Institucional */}
                    <div className="py-1 flex flex-col sm:flex-row items-center justify-center gap-2">
                      <span className="font-mono text-xs sm:text-sm font-bold text-blue-950 bg-blue-100/90 border border-blue-300 px-3 py-1 rounded shadow-2xs select-all">
                        CÓDIGO: {ensureStudentCodeBeforeName(student, { name: schoolName, province: student.province, district: student.district }).code}
                      </span>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-red-600 uppercase tracking-wider font-serif inline-block px-4 py-1 border-b-2 border-red-600/60 shadow-xs">
                        {student.name}
                      </h2>
                    </div>

                    {/* Texto de Conclusão */}
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed max-w-3xl mx-auto text-justify sm:text-center">
                      concluiu com aproveitamento o Curso de <strong className="font-bold text-[#0b2545]">{courseTitle}</strong> ({gradeLevel}), 
                      ministrado por este Estabelecimento de Ensino, no ano lectivo de <strong className="font-bold text-[#0b2545]">{academicYear}</strong>, 
                      tendo obtido a classificação final de <strong className="font-bold text-slate-950">{averageScore} ({averageWords}) valores</strong> ({isApproved ? 'Aprovado' : 'Não Aprovado'}), 
                      cumprindo integralmente todas as exigências curriculares e regulamentares do Sistema Nacional de Educação.
                    </p>
                  </div>

                  {/* Tabela de Dados e Identificação do Aluno em Grid 2 Colunas */}
                  <div className="bg-transparent border-2 border-slate-800 rounded p-3 text-[11px] sm:text-xs font-sans max-w-4xl mx-auto w-full shadow-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
                      <div className="flex justify-between border-b border-slate-400 pb-0.5">
                        <span className="text-slate-700 font-medium">N.º de Estudante / Matrícula:</span>
                        <strong className="text-slate-950 font-mono">{studentNum}</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-400 pb-0.5">
                        <span className="text-slate-700 font-medium">Data de Nascimento:</span>
                        <strong className="text-slate-950">{student.birthDate || '12/04/2007'}</strong>
                      </div>

                      <div className="flex justify-between border-b border-slate-400 pb-0.5">
                        <span className="text-slate-700 font-medium">Documento de Identificação (BI/DIRE):</span>
                        <strong className="text-slate-950 font-mono">{student.idCardNumber || '110100984523B'}</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-400 pb-0.5">
                        <span className="text-slate-700 font-medium">Naturalidade / Província:</span>
                        <strong className="text-slate-950">{student.birthPlace || student.district || 'Maputo'}</strong>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-700 font-medium">NUIT / Registo Fiscal:</span>
                        <strong className="text-slate-950 font-mono">148291042</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-700 font-medium">Data de Conclusão:</span>
                        <strong className="text-slate-950">30 de Novembro de {academicYear}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Local e Data de Emissão */}
                  <div className="text-center sm:text-right text-xs font-medium text-slate-800 font-sans pr-4">
                    Maputo, aos {currentDateFormatted}
                  </div>

                  {/* Bloco das 3 Assinaturas com Selo Branco e Carimbo Circular (Idêntico ao Documento da Imagem) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-3 border-t border-slate-300 font-sans text-xs">
                    
                    {/* Assinatura 1: O Director Geral / Director da Escola */}
                    <div className="flex justify-center">
                      <DigitalSignatureStamp
                        documentId={certificateCode}
                        documentType="certificate"
                        documentTitle={`Certificado • ${student.name}`}
                        targetRole="director"
                        label="O Director da Escola"
                        defaultSignerName={directorName}
                        studentId={student.id}
                        studentName={student.name}
                        gradeLevel={gradeLevel}
                        academicYear={academicYear}
                      />
                    </div>

                    {/* Assinatura 2: Carimbo Circular a Óleo e Selo Branco */}
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#0b2545]/70 flex flex-col items-center justify-center p-1 text-center bg-blue-50/40 shadow-xs">
                        <span className="text-[7px] font-bold text-[#0b2545] tracking-tighter uppercase leading-none">
                          REPÚBLICA DE MOÇAMBIQUE
                        </span>
                        <Award className="h-4 w-4 text-[#c59b27] my-0.5" />
                        <span className="text-[7px] font-bold text-[#0b2545] uppercase leading-none">
                          SELO BRANCO EM USO
                        </span>
                      </div>
                      <span className="text-[8px] text-slate-500 uppercase tracking-widest">Autenticado com Selo Branco</span>
                    </div>

                    {/* Assinatura 3: O Secretário Académico */}
                    <div className="flex justify-center">
                      <DigitalSignatureStamp
                        documentId={certificateCode}
                        documentType="certificate"
                        documentTitle={`Certificado • ${student.name}`}
                        targetRole="secretariat"
                        label="A Secretária Académica"
                        defaultSignerName={secretaryName}
                        studentId={student.id}
                        studentName={student.name}
                        gradeLevel={gradeLevel}
                        academicYear={academicYear}
                      />
                    </div>
                  </div>

                  {/* Rodapé com QR Code, Lema Institucional e Código Oficial do Certificado */}
                  <div className="mt-4 pt-3 border-t border-slate-300 flex flex-wrap items-center justify-between gap-3 font-sans text-[10px] text-slate-600">
                    
                    {/* QR Code Oficial com Dados do Estudante */}
                    <div className="flex items-center gap-2.5">
                      <StudentDocumentQRCode
                        student={student}
                        schoolName={schoolName}
                        province={student.province || 'Maputo Cidade'}
                        district={student.district || 'Distrito Urbano'}
                        documentType={certType === 'DE CONCLUSÃO DO CURSO' ? 'Certificado de Conclusão' : 'Declaração com Notas'}
                        documentNumber={certificateCode}
                        academicYear={academicYear}
                        gradeLevel={gradeLevel}
                        verificationCode={validationCode}
                        variant="compact"
                        size={75}
                      />
                    </div>

                    {/* Lema Central */}
                    <div className="text-center italic text-[#8c6d1f] font-serif text-[11px]">
                      "Educação, Inovação e Compromisso com o Futuro"
                    </div>

                    {/* Caixa com o Código do Certificado */}
                    <div className="border border-[#0b2545] bg-[#f8fafc] px-3 py-1.5 rounded text-right shadow-xs">
                      <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-medium">Código do Certificado:</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{certificateCode}</span>
                    </div>

                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>
      ) : viewMode === 'diploma_landscape' ? (
        /* ========================================================================= */
        /* MODELO 2: DIPLOMA EM PAPEL A4 HORIZONTAL / PAISAGEM (297 mm × 210 mm)     */
        /* ========================================================================= */
        <div 
          id="certificate-print-area"
          className="a4-landscape-document bg-[#fcfbf7] text-[#0f172a] shadow-2xl rounded-none print:shadow-none p-[5mm] sm:p-[6mm] relative overflow-hidden font-latex select-none border border-slate-300 box-border shrink-0"
        >
          {/* Fundo de Segurança com Padrão Guilhoché Fino */}
          <div className="absolute inset-0 pointer-events-none select-none z-0 opacity-15 overflow-hidden">
            <svg className="w-full h-full text-blue-900" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="guilloche-pat-landscape" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 0 30 Q 15 0, 30 30 T 60 30" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
                  <path d="M 0 30 Q 15 60, 30 30 T 60 30" fill="none" stroke="#b45309" strokeWidth="0.5" opacity="0.4" />
                  <circle cx="30" cy="30" r="18" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#guilloche-pat-landscape)" />
            </svg>
          </div>

          {/* Emblema da República de Moçambique no Fundo (Ampliado +70%) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0" aria-hidden="true">
            <img
              src={MOZAMBIQUE_EMBLEM_URL}
              alt="Emblema da República de Moçambique"
              className="w-[480px] h-[480px] object-contain drop-shadow-sm"
              style={{ opacity: 0.22 }}
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Moldura Monumental Horizontal A4 Padronizada */}
          <div className="relative z-10 border-[6px] border-[#0b2545] p-1 bg-transparent shadow-inner h-full flex flex-col box-border">
            <div className="border-[2px] border-[#c59b27] p-1 bg-transparent relative flex-1 flex flex-col box-border">
              <div className="border-[1.5px] border-[#0b2545] p-4 bg-transparent relative flex-1 flex flex-col justify-between box-border font-latex">
                
                {/* Linha Superior: Registo Oficial & Via */}
                <div className="flex justify-between items-center text-[9px] uppercase font-sans tracking-widest text-slate-500 border-b border-slate-200 pb-1">
                  <span className="font-semibold text-amber-900">
                    REPÚBLICA DE MOÇAMBIQUE • DOCUMENTO PÚBLICO OFICIAL [{(exemplar || 'Original do Aluno').toUpperCase()}]
                  </span>
                  <span className="font-mono text-slate-700 font-bold">
                    PROCESSO N.º: {processNumber} • MATRÍCULA: {studentNum}
                  </span>
                </div>

                {/* Cabeçalho Horizontal em 3 Colunas */}
                <div className="grid grid-cols-12 items-center gap-2 text-center pt-1">
                  <div className="col-span-4 text-left space-y-0.5">
                    <p className="text-[11px] font-black uppercase text-[#0b2545] tracking-wider leading-tight">
                      REPÚBLICA DE MOÇAMBIQUE
                    </p>
                    <p className="text-[10px] font-bold uppercase text-slate-800 leading-tight">
                      MINISTÉRIO DA EDUCAÇÃO E DESENVOLVIMENTO HUMANO
                    </p>
                    <p className="text-[9px] font-medium text-slate-600">
                      DIRECÇÃO PROVINCIAL DE EDUCAÇÃO
                    </p>
                  </div>

                  <div className="col-span-4 flex justify-center">
                    <img
                      src={MOZAMBIQUE_EMBLEM_URL}
                      alt="Brasão Nacional"
                      className="h-24 w-24 object-contain drop-shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="col-span-4 text-right space-y-0.5">
                    <p className="text-[11px] font-black uppercase text-[#0b2545] tracking-wide leading-tight">
                      {(schoolName || 'Escola Secundária Central').toUpperCase()}
                    </p>
                    <p className="text-[9px] italic text-[#996515] font-serif">
                      "Conhecimento para o Desenvolvimento Sustentável"
                    </p>
                    <p className="text-[8.5px] font-semibold text-slate-600 uppercase tracking-wider">
                      Educação, Disciplina e Progresso
                    </p>
                  </div>
                </div>

                {/* Título Monumental do Certificado */}
                <div className="text-center my-0.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0b2545] tracking-[0.15em] uppercase font-serif">
                    DIPLOMA DE HONRA
                  </h1>
                  <div className="flex items-center justify-center gap-3 my-0.5">
                    <div className="h-[1.5px] w-28 bg-gradient-to-r from-transparent via-[#c59b27] to-[#c59b27]"></div>
                    <span className="text-[10.5px] font-bold tracking-[0.15em] text-[#8c6d1f] uppercase font-sans">
                      DO MELHOR ALUNO DA ESCOLA
                    </span>
                    <div className="h-[1.5px] w-28 bg-gradient-to-l from-transparent via-[#c59b27] to-[#c59b27]"></div>
                  </div>
                </div>

                {/* Corpo do Texto Solene */}
                <div className="text-center space-y-1 px-4">
                  <p className="text-xs italic font-serif text-slate-700">
                    O Director da {schoolName || 'Escola Secundária Central'}, confere a
                  </p>
                  <h2 className="text-xl sm:text-2xl font-black text-red-600 uppercase tracking-wider font-serif inline-block px-4 py-0.5 border-b-2 border-red-600/60 shadow-xs">
                    {student.name}
                  </h2>
                  <p className="text-xs text-slate-800 leading-relaxed max-w-4xl mx-auto text-center font-serif">
                    o presente <strong className="font-bold text-[#0b2545]">Diploma de Honra</strong> em reconhecimento ao mérito académico excecional como o melhor aluno da escola, tendo concluído com aproveitamento o Curso de <strong className="font-bold text-[#0b2545]">{courseTitle}</strong> ({gradeLevel}), no ano lectivo de <strong className="font-bold text-[#0b2545]">{academicYear}</strong>, com a classificação final extraordinária de <strong className="font-bold text-slate-950">{averageScore} ({averageWords}) valores</strong>, cumprindo com distinção todas as exigências do Sistema Nacional de Educação.
                  </p>
                </div>

                {/* Identificação em Linha Quádrupla */}
                <div className="bg-transparent border-2 border-slate-800 rounded px-3 py-1.5 text-[10.5px] font-sans mx-auto w-full shadow-xs">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <span className="text-slate-600 block text-[9px] uppercase font-bold">N.º Matrícula:</span>
                      <strong className="text-slate-950 font-mono font-bold">{studentNum}</strong>
                    </div>
                    <div>
                      <span className="text-slate-600 block text-[9px] uppercase font-bold">BI / Passaporte:</span>
                      <strong className="text-slate-950 font-mono font-bold">{student.idCardNumber || '110100984523B'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-600 block text-[9px] uppercase font-bold">Data de Nascimento:</span>
                      <strong className="text-slate-950 font-bold">{student.birthDate || '12/04/2007'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-600 block text-[9px] uppercase font-bold">Data de Emissão:</span>
                      <strong className="text-slate-950 font-bold">Maputo, {currentDateFormatted}</strong>
                    </div>
                  </div>
                </div>

                {/* 3 Assinaturas Oficiais */}
                <div className="grid grid-cols-3 gap-3 items-end pt-1.5 border-t border-slate-300 font-sans text-xs">
                  <div className="flex justify-center">
                    <DigitalSignatureStamp
                      documentId={certificateCode}
                      documentType="certificate"
                      documentTitle={`Certificado • ${student.name}`}
                      targetRole="director"
                      label="O Director da Escola"
                      defaultSignerName={directorName}
                      studentId={student.id}
                      studentName={student.name}
                      gradeLevel={gradeLevel}
                      academicYear={academicYear}
                    />
                  </div>

                  <div className="flex flex-col items-center justify-center space-y-0.5">
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-[#0b2545]/70 flex flex-col items-center justify-center p-1 text-center bg-blue-50/40 shadow-xs">
                      <span className="text-[6px] font-bold text-[#0b2545] tracking-tighter uppercase leading-none">
                        REPÚBLICA DE MOÇAMBIQUE
                      </span>
                      <Award className="h-3 w-3 text-[#c59b27] my-0.5" />
                      <span className="text-[6px] font-bold text-[#0b2545] uppercase leading-none">
                        SELO BRANCO OFICIAL
                      </span>
                    </div>
                    <span className="text-[7.5px] text-slate-500 uppercase tracking-widest">Selo Branco Institucional</span>
                  </div>

                  <div className="flex justify-center">
                    <DigitalSignatureStamp
                      documentId={certificateCode}
                      documentType="certificate"
                      documentTitle={`Certificado • ${student.name}`}
                      targetRole="secretariat"
                      label="A Secretária Académica"
                      defaultSignerName={secretaryName}
                      studentId={student.id}
                      studentName={student.name}
                      gradeLevel={gradeLevel}
                      academicYear={academicYear}
                    />
                  </div>
                </div>

                {/* Rodapé com QR Code e Código do Diploma */}
                <div className="pt-1.5 border-t border-slate-300 flex items-center justify-between font-sans text-[9px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <StudentDocumentQRCode
                      student={student}
                      schoolName={schoolName}
                      province={student.province || 'Maputo Cidade'}
                      district={student.district || 'Distrito Urbano'}
                      documentType="Diploma de Honra do Melhor Aluno"
                      documentNumber={certificateCode}
                      academicYear={academicYear}
                      gradeLevel={gradeLevel}
                      verificationCode={validationCode}
                      variant="compact"
                      size={60}
                    />
                    <div>
                      <p className="font-semibold text-slate-700">EduGestão Moçambique • Ministério da Educação</p>
                      <p className="text-slate-500">Documento com Certificação Digital e Verificação QR</p>
                    </div>
                  </div>

                  <div className="text-center italic text-[#8c6d1f] font-serif text-[10px]">
                    "Educação, Inovação e Compromisso com o Futuro"
                  </div>

                  <div className="border border-[#0b2545] bg-[#f8fafc] px-2.5 py-1 rounded text-right shadow-xs">
                    <span className="block text-[7.5px] uppercase tracking-wider text-slate-500 font-medium">Código do Diploma:</span>
                    <span className="font-mono font-bold text-slate-900 text-[11px]">{certificateCode}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* MODELO 3: PAUTA / TRANSCRIÇÃO DE DISCIPLINAS EM PAPEL A4 VERTICAL (210×297) */
        /* ========================================================================= */
        <div 
          id="certificate-print-area"
          className="a4-portrait-document bg-[#fffefc] text-slate-900 shadow-2xl rounded-none print:shadow-none p-[6mm] sm:p-[8mm] relative overflow-hidden font-latex border border-slate-300 box-border shrink-0"
        >
          {/* Emblema da República de Moçambique no Fundo (Nítido e Ampliado em 70%) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0" aria-hidden="true">
            <img
              src={MOZAMBIQUE_EMBLEM_URL}
              alt="Emblema da República de Moçambique"
              className="w-[520px] h-[520px] object-contain drop-shadow-sm"
              style={{ opacity: 0.22 }}
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="relative z-10 border-[3.5px] border-[#0b2545] p-2 bg-transparent">
            <div className="border-[1.5px] border-[#c59b27] p-6 sm:p-8 bg-transparent relative font-latex">
              
              {/* Indicador de Topo */}
              <div className="flex justify-between items-start text-[10px] uppercase font-sans tracking-wider border-b border-slate-300 pb-2 mb-4">
                <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
                  <span>VIA OFICIAL: <strong className="text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">{exemplar}</strong></span>
                </div>
                <div className="text-right text-slate-600 font-mono">
                  REGISTO NACIONAL: {processNumber}
                </div>
              </div>

              {/* Cabeçalho Oficial com Emblema Ampliado (+70%) */}
              <div className="text-center space-y-1.5 mb-6">
                <img
                  src={MOZAMBIQUE_EMBLEM_URL}
                  alt="Brasão da República de Moçambique"
                  className="mx-auto h-28 w-28 object-contain mb-1"
                  referrerPolicy="no-referrer"
                />
                <h2 className="text-sm sm:text-base font-bold tracking-widest text-[#0b2545] uppercase">
                  REPÚBLICA DE MOÇAMBIQUE
                </h2>
                <h3 className="text-xs sm:text-sm font-semibold tracking-wider text-slate-800 uppercase">
                  MINISTÉRIO DA EDUCAÇÃO E DESENVOLVIMENTO HUMANO
                </h3>
                <h4 className="text-[11px] sm:text-xs font-semibold tracking-wide text-slate-700 uppercase">
                  DIRECÇÃO PROVINCIAL DE EDUCAÇÃO DE {student?.province?.toUpperCase() || 'MAPUTO CIDADE'}
                </h4>
                <div className="pt-1">
                  <span className="inline-block font-sans font-bold text-xs uppercase px-3 py-1 bg-slate-100 text-slate-900 border border-slate-400 rounded">
                    {(schoolName || 'Escola Secundária Central').toUpperCase()}
                  </span>
                </div>

                <div className="pt-3 pb-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0b2545] tracking-wider uppercase underline underline-offset-8 decoration-1 decoration-[#c59b27]">
                    CERTIFICADO DE HABILITAÇÕES
                  </h1>
                </div>
              </div>

              {/* Texto de Abertura Solene com o Director */}
              <div className="space-y-4 text-justify text-sm leading-relaxed text-slate-900 mb-6">
                <p className="indent-8 leading-relaxed">
                  <strong className="font-bold text-slate-950">{directorName}</strong>, O Director da <strong className="font-bold text-slate-950">{schoolName}</strong>, abaixo-assinado, certifico que, em cumprimento das disposições legais e regulamentares em vigor na República de Moçambique, declaro que:
                </p>

                {/* Box de Identificação */}
                <div className="bg-transparent border-2 border-slate-800 rounded p-4 font-sans text-xs sm:text-sm space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-8">
                      <span className="text-slate-700 font-medium">Nome Completo: </span>
                      <strong className="text-red-600 font-black uppercase tracking-wide text-base">{student.name}</strong>
                    </div>
                    <div className="sm:col-span-4 text-left sm:text-right">
                      <span className="text-slate-700 font-medium">Sexo: </span>
                      <strong className="text-slate-950 font-bold">{student.gender === 'M' ? 'Masculino' : 'Feminino'}</strong>
                    </div>

                    <div className="sm:col-span-6">
                      <span className="text-slate-700 font-medium">Filho(a) de: </span>
                      <strong className="text-slate-950">{student.fatherName || 'Pai não declarado'}</strong>
                    </div>
                    <div className="sm:col-span-6">
                      <span className="text-slate-700 font-medium">e de: </span>
                      <strong className="text-slate-950">{student.motherName || 'Mãe não declarada'}</strong>
                    </div>

                    <div className="sm:col-span-4">
                      <span className="text-slate-700 font-medium">Nascido(a) aos: </span>
                      <strong className="text-slate-950">{student.birthDate || '—'}</strong>
                    </div>
                    <div className="sm:col-span-4">
                      <span className="text-slate-700 font-medium">Naturalidade: </span>
                      <strong className="text-slate-950">{student.birthPlace || student.district || 'Maputo'}</strong>
                    </div>
                    <div className="sm:col-span-4">
                      <span className="text-slate-700 font-medium">Nacionalidade: </span>
                      <strong className="text-slate-950">{student.nationality || 'Moçambicana'}</strong>
                    </div>

                    <div className="sm:col-span-6">
                      <span className="text-slate-700 font-medium">BI / Passaporte / DIRE N.º: </span>
                      <strong className="text-slate-950 font-mono">{student.idCardNumber || '110100984523B'}</strong>
                    </div>
                    <div className="sm:col-span-6">
                      <span className="text-slate-700 font-medium">Processo Individual N.º: </span>
                      <strong className="text-slate-950 font-mono">{processNumber}</strong> (Nº Aluno: {studentNum})
                    </div>
                  </div>
                </div>

                <p className="indent-8">
                  Concluiu com aproveitamento no Ano Lectivo de <strong className="font-bold">{academicYear}</strong> a{' '}
                  <strong className="font-bold text-[#0b2545] underline underline-offset-4">{gradeLevel}</strong>{' '}
                  do Sistema Nacional de Educação, tendo obtido no respectivo plano curricular as seguintes classificações:
                </p>

                {/* Tabela de Notas e Disciplinas */}
                <div className="my-4">
                  <table className="w-full border-collapse border-2 border-slate-900 text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-slate-900 uppercase font-sans font-bold border-b-2 border-slate-900">
                      <tr>
                        <th className="border border-slate-800 px-3 py-2 text-center w-12">N.º</th>
                        <th className="border border-slate-800 px-3 py-2 text-left">Disciplina Curricular</th>
                        <th className="border border-slate-800 px-3 py-2 text-center w-36">Média Geral por Disciplina</th>
                        <th className="border border-slate-800 px-3 py-2 text-left w-48">Por Extenso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-transparent">
                      {subjectGradeList.map((item, idx) => (
                        <tr key={item.subject.id} className="hover:bg-amber-50/40">
                          <td className="border border-slate-800 px-3 py-1.5 text-center font-mono text-slate-600">
                            {idx + 1}
                          </td>
                          <td className="border border-slate-800 px-3 py-1.5 font-medium text-slate-900">
                            {item.subject.name}
                          </td>
                          <td className={`border border-slate-800 px-3 py-1.5 text-center font-bold font-mono ${item.score < 10 ? 'text-red-700' : 'text-slate-950'}`}>
                            {item.score} valores
                          </td>
                          <td className="border border-slate-800 px-3 py-1.5 italic text-slate-800 capitalize">
                            {item.words} valores
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-900 text-slate-950">
                      <tr>
                        <td colSpan={2} className="border border-slate-800 px-3 py-2 text-right uppercase tracking-wider font-sans font-black">
                          Média Geral Atual (Média Final):
                        </td>
                        <td className="border border-slate-800 px-3 py-2 text-center text-base font-black text-amber-950 font-mono">
                          {averageScore} valores
                        </td>
                        <td className="border border-slate-800 px-3 py-2 italic font-serif">
                          {averageWords} valores
                        </td>
                      </tr>
                      <tr className="bg-amber-50/80">
                        <td colSpan={2} className="border border-slate-800 px-3 py-2 text-right uppercase tracking-wider font-sans font-black">
                          Resultado Final:
                        </td>
                        <td colSpan={2} className="border border-slate-800 px-3 py-2 font-sans font-black text-emerald-800 uppercase tracking-wide">
                          {isApproved ? `Aprovado(a) com Média Geral de ${averageScore} valores (${averageWords} valores)` : 'Não Aprovado(a)'}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <p className="indent-8 text-justify text-xs sm:text-sm italic text-slate-800">
                  E, por ser verdade e constar dos livros de registo desta secretaria académica, mandou-se passar o presente Certificado de Habilitações que vai assinado pelas entidades competentes e autenticado com o selo branco e carimbo a óleo em uso nesta instituição de ensino.
                </p>
              </div>

              {/* Data e Local */}
              <div className="text-right text-xs sm:text-sm font-medium text-slate-800 mb-8 font-sans">
                Maputo, aos {currentDateFormatted}
              </div>

              {/* Bloco de Assinaturas */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end pt-4 border-t border-slate-300 font-sans text-xs">
                <div className="sm:col-span-4 flex justify-center">
                  <DigitalSignatureStamp
                    documentId={certificateCode}
                    documentType="certificate"
                    documentTitle={`Certificado • ${student.name}`}
                    targetRole="secretariat"
                    label="A Secretária Académica"
                    defaultSignerName={secretaryName}
                    studentId={student.id}
                    studentName={student.name}
                    gradeLevel={gradeLevel}
                    academicYear={academicYear}
                  />
                </div>

                <div className="sm:col-span-4 flex flex-col items-center justify-center space-y-2">
                  <div className="w-22 h-22 rounded-full border-2 border-dashed border-[#0b2545]/70 flex flex-col items-center justify-center p-1 text-center bg-amber-50/30">
                    <span className="text-[7.5px] font-bold text-[#0b2545] tracking-tighter uppercase leading-tight">
                      REPÚBLICA DE MOÇAMBIQUE
                    </span>
                    <Award className="h-4 w-4 text-[#c59b27] my-0.5" />
                    <span className="text-[7.5px] font-bold text-amber-950 uppercase">
                      SELO BRANCO
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest">Carimbo e Selo Branco</span>
                </div>

                <div className="sm:col-span-4 flex justify-center">
                  <DigitalSignatureStamp
                    documentId={certificateCode}
                    documentType="certificate"
                    documentTitle={`Certificado • ${student.name}`}
                    targetRole="director"
                    label="O Director da Escola"
                    defaultSignerName={directorName}
                    studentId={student.id}
                    studentName={student.name}
                    gradeLevel={gradeLevel}
                    academicYear={academicYear}
                  />
                </div>
              </div>

              {/* Rodapé com QR Code */}
              <div className="mt-8 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 font-sans text-[10px] text-slate-600">
                <div className="flex items-center gap-3">
                  <StudentDocumentQRCode
                    student={student}
                    schoolName={schoolName}
                    province={student.province || 'Maputo Cidade'}
                    district={student.district || 'Distrito Urbano'}
                    documentType="Certificado de Conclusão"
                    documentNumber={certificateCode}
                    academicYear={academicYear}
                    gradeLevel={gradeLevel}
                    verificationCode={validationCode}
                    variant="compact"
                    size={75}
                  />
                </div>

                <div className="text-right">
                  <p className="font-semibold text-slate-700">EduGestão Moçambique • Matriz Oficial MINEDH</p>
                  <p className="text-slate-500">Documento Oficial de Habilitações com Certificação Digital</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

        </div>
      </div>

      {/* Modal de Assinatura Digital com Biometria ou PIN */}
      <DigitalSignatureModal
        isOpen={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        documentId={certificateCode}
        documentType="certificate"
        documentTitle={`Certificado Oficial de Conclusão (${gradeLevel})`}
        studentId={student.id}
        studentName={student.name}
        gradeLevel={gradeLevel}
        academicYear={academicYear}
      />

    </div>
  );
}
