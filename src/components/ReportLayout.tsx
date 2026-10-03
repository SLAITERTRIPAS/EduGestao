import React from 'react';
import { BookOpen, Printer, X, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { MOZAMBIQUE_EMBLEM_URL } from '../types';

export interface Chapter {
  num: number;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
}

interface ReportLayoutProps {
  institution: string;
  subInstitution: string;
  directorate: string;
  title: string;
  subtitle: string;
  resumo: string;
  abstract: string;
  chapters: Chapter[];
  author: string;
  homologadoBy: string;
  docCode: string;
  onClose?: () => void;
  onPrint?: () => void;
}

export const ReportLayout: React.FC<ReportLayoutProps> = ({
  institution,
  subInstitution,
  directorate,
  title,
  subtitle,
  resumo,
  abstract,
  chapters,
  author,
  homologadoBy,
  docCode,
  onClose,
  onPrint
}) => {

  // Dynamic Index calculation:
  // Page 1: Capa
  // Page 2: Contracapa
  // Page 3: Índice Geral
  // Page 4: Resumo & Abstract
  // Page 5+: Chapters (sequential pages)
  
  const getPageNumberForChapter = (index: number) => {
    return 5 + index; // Chapter 1 starts on Page 5
  };

  const renderPageFooter = (currentPage: number, totalPages: number) => (
    <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] font-sans text-slate-400 uppercase tracking-widest no-print">
      <span>EduGestão • MINEDH Moçambique</span>
      <span>Página {currentPage} de {totalPages}</span>
      <span>Documento Técnico Oficial</span>
    </div>
  );

  const totalPages = 4 + chapters.length + 1; // Capa(1), Contracapa(2), Índice(3), Resumo(4), Chapters, Homologação(1)

  return (
    <div className="w-full flex flex-col items-center justify-start print:p-0 print:bg-white text-justify font-latex leading-loose">
      
      {/* ========================================== */}
      {/* PÁGINA 1: CAPA                             */}
      {/* ========================================== */}
      <div 
        className="a4-portrait-document font-latex relative bg-white p-12 md:p-16 border border-slate-300 shadow-2xl w-full min-h-[297mm] flex flex-col justify-between overflow-hidden print:shadow-none print:border-none print:my-0 print:p-8 my-4"
        style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
      >
        {/* National Watermark background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 opacity-[0.03]">
          <img 
            src={MOZAMBIQUE_EMBLEM_URL} 
            alt="Emblema Nacional" 
            className="w-[120mm]" 
          />
        </div>

        <div className="relative z-10 text-center space-y-4">
          <img 
            src={MOZAMBIQUE_EMBLEM_URL} 
            alt="República de Moçambique" 
            className="h-24 w-24 object-contain mx-auto mb-4" 
            referrerPolicy="no-referrer"
          />
          <h1 className="text-sm font-bold tracking-[0.3em] uppercase font-sans text-slate-900">
            {institution}
          </h1>
          <h2 className="text-sm font-black uppercase tracking-wider font-sans text-slate-800">
            {subInstitution}
          </h2>
          <div className="h-0.5 w-24 bg-[#0b2545] mx-auto my-3"></div>
          <p className="text-xs font-bold text-slate-700 uppercase tracking-widest font-sans">
            {directorate}
          </p>
        </div>

        <div className="relative z-10 text-center my-12 space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-amber-800 font-sans">
            Documento de Especificação Pedagógica e Técnica
          </h2>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 uppercase font-serif leading-tight">
            {title}
          </h1>
          <div className="h-1 w-32 bg-amber-500 mx-auto my-4"></div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest max-w-2xl mx-auto font-sans leading-relaxed">
            {subtitle}
          </h3>
        </div>

        <div className="relative z-10 text-center space-y-4 font-sans text-xs">
          <p className="font-extrabold text-[#0b2545] uppercase tracking-wider">
            {author}
          </p>
          <div className="text-slate-600 font-medium">
            <p>Comissão Técnica de Normalização Tecnológica e Automação de Processos Pedagógicos</p>
            <p>Acordo de Cooperação Técnica • DNTIC • MINEDH</p>
          </div>
          <div className="pt-6 text-[11px] font-bold text-slate-800 uppercase tracking-widest">
            MAPUTO, MOÇAMBIQUE • {new Date().getFullYear()}
          </div>
        </div>

        {renderPageFooter(1, totalPages)}
      </div>

      {/* ========================================== */}
      {/* PÁGINA 2: CONTRACAPA                       */}
      {/* ========================================== */}
      <div 
        className="a4-portrait-document font-latex relative bg-white p-12 md:p-16 border border-slate-300 shadow-2xl w-full min-h-[297mm] flex flex-col justify-between overflow-hidden print:shadow-none print:border-none print:my-0 print:p-8 my-4"
        style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
      >
        <div className="space-y-8 relative z-10">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">Ficha de Catalogação e Propriedade</p>
          </div>

          <div className="space-y-6 pt-8">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest font-sans">Especificação do Sistema e Direitos Autorais:</p>
            
            <div className="text-xs space-y-4 leading-relaxed text-slate-700 font-sans">
              <div>
                <strong className="block text-slate-900 font-black">Homologado por:</strong>
                <span>{homologadoBy}</span>
              </div>
              <div>
                <strong className="block text-slate-900 font-black">Orgão Regulador:</strong>
                <span>{directorate}</span>
              </div>
              <div>
                <strong className="block text-slate-900 font-black">Autoria e Cooperação Técnica:</strong>
                <span>{author} • Direcção Nacional de Tecnologias de Informação e Comunicação (DNTIC)</span>
              </div>
              <div>
                <strong className="block text-slate-900 font-black">Código de Protocolo e Homologação:</strong>
                <span className="font-mono">{docCode}</span>
              </div>
              <div>
                <strong className="block text-slate-900 font-black">Versão e Compatibilidade:</strong>
                <span>Versão v4.0.0-PRO • Homologado para Ensino Geral Geral e Técnico-Profissional de Moçambique</span>
              </div>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-100 space-y-4">
            <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wide font-sans">Aviso Legal de Uso e Distribuição:</p>
            <p className="text-xs text-slate-600 leading-relaxed text-justify">
              Esta obra e todas as suas especificações técnicas, modelos de banco de dados NoSQL Firestore, chancelas eletrónicas e algoritmos de cálculo pedagógico integrados são protegidos pela legislação de direitos de autor em vigor na República de Moçambique. Qualquer reprodução, tradução, adaptação, transferência escolar sem verificação por QR Code ou uso indevido deste documento em sistemas externos de gestão escolar sem a prévia autorização ministerial resultará nas devidas sanções cíveis e criminais.
            </p>
          </div>
        </div>

        {renderPageFooter(2, totalPages)}
      </div>

      {/* ========================================== */}
      {/* PÁGINA 3: ÍNDICE GERAL DINÂMICO            */}
      {/* ========================================== */}
      <div 
        className="a4-portrait-document font-latex relative bg-white p-12 md:p-16 border border-slate-300 shadow-2xl w-full min-h-[297mm] flex flex-col justify-between overflow-hidden print:shadow-none print:border-none print:my-0 print:p-8 my-4"
        style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
      >
        <div className="space-y-6 relative z-10 font-sans text-xs">
          <h2 className="text-lg font-black text-[#0b2545] border-b-2 border-slate-900 pb-3 uppercase font-serif tracking-wide">
            ÍNDICE GERAL DE CONTEÚDOS
          </h2>

          <div className="space-y-4 pt-6">
            <div className="flex justify-between items-baseline gap-2">
              <span className="font-extrabold uppercase text-slate-900">CAPA PRINCIPAL DO DOCUMENTO</span>
              <span className="grow border-b border-dotted border-slate-400"></span>
              <span className="font-bold">1</span>
            </div>

            <div className="flex justify-between items-baseline gap-2">
              <span className="font-extrabold uppercase text-slate-900">FICHA TÉCNICA E EXPEDIENTE REGULAMENTAR</span>
              <span className="grow border-b border-dotted border-slate-400"></span>
              <span className="font-bold">2</span>
            </div>

            <div className="flex justify-between items-baseline gap-2">
              <span className="font-extrabold uppercase text-slate-900">ÍNDICE GERAL DE CONTEÚDOS (DINÂMICO)</span>
              <span className="grow border-b border-dotted border-slate-400"></span>
              <span className="font-bold">3</span>
            </div>

            <div className="flex justify-between items-baseline gap-2">
              <span className="font-extrabold uppercase text-slate-900">RESUMO CRÍTICO & EXECUTIVE ABSTRACT</span>
              <span className="grow border-b border-dotted border-slate-400"></span>
              <span className="font-bold">4</span>
            </div>

            <div className="h-4"></div>

            {chapters.map((ch, idx) => (
              <div key={ch.num} className="space-y-2">
                <div className="flex justify-between items-baseline gap-2">
                  <span className="font-extrabold uppercase text-slate-900">
                    CAPÍTULO {ch.num}. {ch.title}
                  </span>
                  <span className="grow border-b border-dotted border-slate-400"></span>
                  <span className="font-bold">{getPageNumberForChapter(idx)}</span>
                </div>
                {ch.subtitle && (
                  <div className="flex justify-between items-baseline gap-2 pl-4 text-[11px] text-slate-600">
                    <span>{ch.subtitle}</span>
                    <span className="grow border-b border-dotted border-slate-300"></span>
                    <span>{getPageNumberForChapter(idx)}</span>
                  </div>
                )}
              </div>
            ))}

            <div className="h-4"></div>

            <div className="flex justify-between items-baseline gap-2">
              <span className="font-extrabold uppercase text-slate-900">CAPÍTULO FINAL • HOMOLOGAÇÃO E VISTOS</span>
              <span className="grow border-b border-dotted border-slate-400"></span>
              <span className="font-bold">{5 + chapters.length}</span>
            </div>
          </div>
        </div>

        {renderPageFooter(3, totalPages)}
      </div>

      {/* ========================================== */}
      {/* PÁGINA 4: RESUMO & ABSTRACT                 */}
      {/* ========================================== */}
      <div 
        className="a4-portrait-document font-latex relative bg-white p-12 md:p-16 border border-slate-300 shadow-2xl w-full min-h-[297mm] flex flex-col justify-between overflow-hidden print:shadow-none print:border-none print:my-0 print:p-8 my-4"
        style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
      >
        <div className="space-y-8 relative z-10">
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#0b2545] font-sans">
              RESUMO CRÍTICO DO SISTEMA
            </h3>
            <p className="italic text-justify">
              {resumo}
            </p>
            <p className="font-sans font-normal">
              <strong>Palavras-chave:</strong> SIGE, Cadernetas Eletrónicas, Multi-Inquilino, Sincronização NoSQL, Certificação QR Code.
            </p>
          </div>

          <div className="space-y-3 pt-8 border-t border-slate-100">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#0b2545] font-sans">
              EXECUTIVE ABSTRACT
            </h3>
            <p className="italic text-justify">
              {abstract}
            </p>
            <p className="font-sans font-normal">
              <strong>Keywords:</strong> SIGE, Electronic Gradebook, Multi-Tenant Database, NoSQL Synchronization, QR Certification.
            </p>
          </div>
        </div>

        {renderPageFooter(4, totalPages)}
      </div>

      {/* ========================================== */}
      {/* PÁGINAS SEQUENCIAIS DE CAPÍTULOS             */}
      {/* ========================================== */}
      {chapters.map((ch, idx) => (
        <div 
          key={ch.num}
          className="a4-portrait-document font-latex relative bg-white p-12 md:p-16 border border-slate-300 shadow-2xl w-full min-h-[297mm] flex flex-col justify-between overflow-hidden print:shadow-none print:border-none print:my-0 print:p-8 my-4"
          style={{ pageBreakAfter: 'always', breakAfter: 'page' }}
        >
          <div className="space-y-6 relative z-10 text-xs text-justify">
            <h2 className="text-sm font-black text-[#0b2545] border-b-2 border-slate-900 pb-2 uppercase tracking-wide">
              CAPÍTULO {ch.num} • {ch.title}
            </h2>
            {ch.subtitle && (
              <h3 className="text-[11px] font-extrabold text-amber-800 uppercase tracking-widest font-sans">
                {ch.subtitle}
              </h3>
            )}
            <div className="text-slate-800 leading-loose space-y-4">
              {ch.content}
            </div>
          </div>

          {renderPageFooter(getPageNumberForChapter(idx), totalPages)}
        </div>
      ))}

      {/* ========================================== */}
      {/* PÁGINA FINAL: HOMOLOGAÇÃO & VISTO          */}
      {/* ========================================== */}
      <div 
        className="a4-portrait-document font-latex relative bg-white p-12 md:p-16 border border-slate-300 shadow-2xl w-full min-h-[297mm] flex flex-col justify-between overflow-hidden print:shadow-none print:border-none print:my-0 print:p-8 my-4"
      >
        <div className="space-y-8 relative z-10 text-xs">
          <h2 className="text-sm font-black text-[#0b2545] border-b-2 border-slate-900 pb-2 uppercase tracking-wide">
            HOMOLOGAÇÃO PEDAGÓGICA E ENCERRAMENTO
          </h2>

          <p className="text-slate-800 leading-relaxed text-justify">
            Esta Memória Descritiva constitui o referencial técnico e regulamentar imutável da plataforma EduGestão. A conformidade do software com as regras do Ensino Geral do Ministério da Educação e Desenvolvimento Humano de Moçambique foi auditada e homologada por comissão técnica para implementação e substituição progressiva do papel.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-sans">
            <p className="font-bold text-[#0b2545] uppercase text-[11px] tracking-wider">Parecer de Requisitos Técnicos:</p>
            <div className="grid grid-cols-2 gap-4 text-slate-700 text-[11px]">
              <div>
                <span className="block font-bold text-slate-900">1. Desempenho em Tempo Real:</span>
                <span>Sincronização reativa via NoSQL sockets Firestore em menos de 0.5s.</span>
              </div>
              <div>
                <span className="block font-bold text-slate-900">2. Segurança de Perfis (RBAC):</span>
                <span>Validação declarativa de permissões integrada ao Firebase Auth.</span>
              </div>
              <div>
                <span className="block font-bold text-slate-900">3. Conformidade Pedagógica:</span>
                <span>Cálculo exato de notas, progressões e pautas regulamentares em formatos A4/A3.</span>
              </div>
              <div>
                <span className="block font-bold text-slate-900">4. Autenticidade Criptográfica:</span>
                <span>Assinaturas eletrónicas certificadas com Hash SHA-256 e código QR público.</span>
              </div>
            </div>
          </div>

          {/* SIGNATURE SECTIONS */}
          <div className="pt-12 grid grid-cols-2 gap-8 text-center text-[11px] font-sans font-extrabold uppercase text-slate-800">
            <div className="space-y-12">
              <p>A Equipa Técnica de Engenharia</p>
              <div className="w-48 border-b border-slate-400 mx-auto"></div>
              <p className="text-slate-500 font-mono text-[10px]">DNTIC • MINEDH Moçambique</p>
            </div>

            <div className="space-y-12">
              <p>Homologado Institucionalmente</p>
              <div className="w-48 border-b border-slate-400 mx-auto"></div>
              <p className="text-slate-500 font-mono text-[10px]">{subInstitution}</p>
            </div>
          </div>

          <div className="pt-8 text-center space-y-1">
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">REGISTO DE HOMOLOGAÇÃO: {docCode}</p>
            <p className="text-[9px] text-slate-400 font-mono">CHANCELA DE AUTENTICIDADE DIGITAL • SISTEMA INTEGRADO DE GESTÃO ESCOLAR</p>
          </div>
        </div>

        {renderPageFooter(totalPages, totalPages)}
      </div>

    </div>
  );
};
