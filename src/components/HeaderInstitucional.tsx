import React from 'react';
import { School, MOZAMBIQUE_EMBLEM_URL } from '../types';
import { getInstitutionalCode } from '../utils/institutionCode';

export const MOZAMBIQUE_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/1/14/Emblem_of_Mozambique.svg";

export interface HeaderInstitucionalProps {
  school?: Partial<School> | null;
  province?: string;
  district?: string;
  schoolName?: string;
  institutionCode?: string;
  academicYear?: number | string;
  documentTitle?: string;
  documentSubtitle?: string;
  badge?: string;
  showEmblem?: boolean;
  emblemSize?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'formal' | 'document' | 'report' | 'pauta' | 'compact';
  rightContent?: React.ReactNode;
  className?: string;
  showBorderBottom?: boolean;
}

export const HeaderInstitucional: React.FC<HeaderInstitucionalProps> = ({
  school,
  province,
  district,
  schoolName,
  institutionCode,
  academicYear = 2026,
  documentTitle,
  documentSubtitle,
  badge,
  showEmblem = true,
  emblemSize = 'md',
  variant = 'document',
  rightContent,
  className = '',
  showBorderBottom = true,
}) => {
  const displayProvince = (province || school?.province || 'MAPUTO CIDADE').toUpperCase();
  const displayDistrict = (district || (school as any)?.district || 'KAMPFUMO').toUpperCase();
  const displaySchoolName = (schoolName || school?.name || 'ESCOLA SECUNDÁRIA JOSINA MACHEL').toUpperCase();
  const displayCode = institutionCode || getInstitutionalCode(school, { 
    province: displayProvince, 
    district: displayDistrict, 
    schoolName: displaySchoolName 
  });
  const displayYear = academicYear || 2026;

  const sizeClasses = {
    sm: 'h-20 w-20',
    md: 'h-28 w-28',
    lg: 'h-36 w-36',
    xl: 'h-48 w-48',
  };

  return (
    <div className={`institutional-header text-center relative ${showBorderBottom ? 'pb-4 mb-4 border-b-2 border-slate-900' : ''} ${className}`}>
      {/* Optional Top Right Content (e.g. Signature Box, Stamp, or Serial Number) */}
      {rightContent && (
        <div className="absolute top-0 right-0 z-20">
          {rightContent}
        </div>
      )}

      {/* 1. Emblema Oficial da República de Moçambique & Logótipo Oficial da Escola */}
      {showEmblem && (
        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-2">
          {/* Emblema Nacional de Moçambique */}
          <img
            src={MOZAMBIQUE_LOGO_URL}
            alt="Emblema da República de Moçambique"
            className={`${sizeClasses[emblemSize]} object-contain select-none`}
            style={{ filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.2))' }}
            referrerPolicy="no-referrer"
          />
          {/* Logótipo Oficial da Escola (Injetado dinamicamente pela Direção) */}
          {(school?.logoUrl || (school as any)?.logo) && (
            <img
              src={school?.logoUrl || (school as any)?.logo}
              alt={`Logótipo da Escola - ${displaySchoolName}`}
              className={`${sizeClasses[emblemSize]} object-contain select-none`}
              style={{ filter: 'drop-shadow(0 0 1px rgba(0,0,0,0.2))' }}
              referrerPolicy="no-referrer"
              title={`Logótipo Oficial da ${displaySchoolName}`}
            />
          )}
        </div>
      )}

      {/* 2. Hierarquia Ministerial Oficial do MINEDH */}
      <h1 className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-slate-950 font-serif leading-tight">
        REPÚBLICA DE MOÇAMBIQUE
      </h1>
      <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-slate-800 font-sans mt-0.5">
        MINISTÉRIO DA EDUCAÇÃO E DESENVOLVIMENTO HUMANO
      </h2>
      <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wide text-slate-800 font-sans mt-0.5">
        DIRECÇÃO PROVINCIAL DA EDUCAÇÃO DE: {displayProvince}
      </h3>
      <h4 className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wide text-slate-700 font-sans mt-0.5">
        SERVIÇOS DISTRITAIS DE EDUCAÇÃO, JUVENTUDE E TECNOLOGIA DE: {displayDistrict}
      </h4>

      {/* 3. Nome da Instituição de Ensino */}
      <div className="mt-1 inline-block">
        <h5 className="text-sm sm:text-base font-black uppercase tracking-wide text-blue-950 font-serif bg-amber-50/80 px-3.5 py-0.5 rounded border border-slate-300 shadow-2xs">
          {displaySchoolName}
        </h5>
      </div>

      {/* 4. Código Institucional Padronizado e Ano Lectivo */}
      <p className="text-xs font-mono font-bold text-blue-900 mt-1">
        CÓDIGO INSTITUCIONAL: {displayCode} • ANO LECTIVO {displayYear}
      </p>

      {/* 5. Título do Documento e Badge (Se fornecido) */}
      {documentTitle && (
        <div className="mt-2.5 space-y-1">
          <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-950 font-serif">
            {documentTitle}
          </h4>
          {documentSubtitle && (
            <p className="text-xs font-semibold text-slate-600 font-sans">
              {documentSubtitle}
            </p>
          )}
          {badge && (
            <div className="mt-1.5 inline-block bg-blue-900 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-xs">
              {badge}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
