import React, { useEffect, useState, useMemo } from 'react';
import QRCode from 'qrcode';
import { Student } from '../types';
import { ShieldCheck, QrCode, Copy, Check, Download, Eye, ExternalLink } from 'lucide-react';
import { formatDocumentReference, generateIUE, generateNIM } from '../utils/iueGenerator';

export interface StudentQRData {
  iue: string;
  nim?: string;
  studentId: string;
  studentName: string;
  province: string;
  district?: string;
  documentType: string;
  documentNumber?: string;
  schoolName: string;
  schoolCode?: string;
  gradeLevel?: string;
  academicYear: number;
  verificationCode: string;
  verificationUrl: string;
  issuedAt: string;
  status?: string;
  extra?: Record<string, any>;
}

export interface StudentDocumentQRCodeProps {
  /** Dados do estudante ou objeto completo */
  student?: Partial<Student> | null;
  /** Identificador único do estudante (IUE) se não fornecido no student */
  iue?: string;
  /** Nome do estudante */
  studentName?: string;
  /** Nome do estabelecimento de ensino */
  schoolName?: string;
  /** Província */
  province?: string;
  /** Distrito */
  district?: string;
  /** Tipo de documento oficial */
  documentType?: string;
  /** Número / Referência oficial do documento */
  documentNumber?: string;
  /** Ano lectivo de referência */
  academicYear?: number;
  /** Classe / Nível */
  gradeLevel?: string;
  /** Código de verificação (ex: HASH/VERIF) */
  verificationCode?: string;
  /** URL de verificação opcional */
  verificationUrl?: string;
  /** Tamanho em pixels (padrão: 110) */
  size?: number;
  /** Formato de apresentação */
  variant?: 'full_block' | 'compact' | 'badge' | 'minimal' | 'certificate_corner';
  /** Exibir metadados textuais legíveis abaixo do QR */
  showMetadata?: boolean;
  /** Exibir etiqueta institucional MINEDH */
  showLabel?: boolean;
  /** Habilitar modal de inspeção ao clicar */
  enableModal?: boolean;
  /** Classes CSS adicionais */
  className?: string;
  /** Dados adicionais a incorporar */
  extraData?: Record<string, any>;
}

/**
 * Componente oficial e reutilizável de QR Code com dados do aluno
 * Compatível com Processo Individual, Certificados, Declarações e Histórico Escolar
 */
// Cache global em memória para QR Codes gerados (evita reprocessamento repetitivo de canvas)
const qrDataUrlCache = new Map<string, string>();

export function StudentDocumentQRCode({
  student,
  iue: customIue,
  studentName: customName,
  schoolName: customSchool,
  province: customProvince,
  district: customDistrict,
  documentType = 'Processo Individual',
  documentNumber,
  academicYear = 2026,
  gradeLevel: customGrade,
  verificationCode: customVerificationCode,
  size = 110,
  variant = 'full_block',
  showMetadata = true,
  showLabel = true,
  enableModal = true,
  className = '',
  extraData
}: StudentDocumentQRCodeProps) {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Normalização dos dados do estudante
  const name = customName || student?.name || 'Estudante Não Identificado';
  const school = customSchool || (student as any)?.schoolName || 'Escola Secundária Central';
  const province = customProvince || student?.province || (student as any)?.schoolProvince || 'Maputo Cidade';
  const district = customDistrict || student?.district || 'Distrito Urbano';
  const grade = customGrade || student?.entryGrade || (student as any)?.gradeLevel || '10ª Classe';
  const studentId = student?.id || 'ALU-001';

  const iue = useMemo(() => {
    return customIue || student?.iue || generateIUE({ name, schoolName: school, academicYear });
  }, [customIue, student?.iue, name, school, academicYear]);

  const nim = useMemo(() => {
    return student?.nim || generateNIM({ year: academicYear, fallbackSeed: `${name}_${studentId}` });
  }, [student?.nim, academicYear, name, studentId]);

  // Código oficial de verificação
  const verifCode = useMemo(() => {
    return customVerificationCode || `VERIF-MINEDH-${Math.abs(
      (name + iue + academicYear + documentType).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)
    ).toString(16).toUpperCase()}`;
  }, [customVerificationCode, name, iue, academicYear, documentType]);

  // URL pública de validação governamental
  const nationalVerificationUrl = useMemo(() => {
    return `https://sige.minedh.gov.mz/verificar?iue=${encodeURIComponent(iue)}&ref=${encodeURIComponent(documentNumber || verifCode)}`;
  }, [iue, documentNumber, verifCode]);

  // Objeto estruturado incorporado no QR Code (data estática para estabilidade de referência)
  const qrObject: StudentQRData = useMemo(() => ({
    iue,
    nim,
    studentId,
    studentName: name,
    province,
    district,
    documentType,
    documentNumber: documentNumber || `REF-${academicYear}/${studentId}`,
    schoolName: school,
    gradeLevel: grade,
    academicYear,
    verificationCode: verifCode,
    verificationUrl: nationalVerificationUrl,
    issuedAt: `${academicYear}-02-01`,
    status: student?.enrollmentStatus || student?.reactivationStatus || 'VALIDADO',
    extra: extraData
  }), [iue, nim, studentId, name, province, district, documentType, documentNumber, school, grade, academicYear, verifCode, nationalVerificationUrl, student?.enrollmentStatus, student?.reactivationStatus, extraData]);

  // Serialização do QR Code: Gera texto estruturado e legível por qualquer scanner
  const qrPayload = useMemo(() => {
    return `REPÚBLICA DE MOÇAMBIQUE • MINEDH
DOCUMENTO: ${qrObject.documentType.toUpperCase()}
ALUNO: ${qrObject.studentName}
IUE: ${qrObject.iue}
NIM: ${qrObject.nim || 'N/A'}
ESCOLA: ${qrObject.schoolName}
PROVÍNCIA: ${qrObject.province}
DISTRITO: ${qrObject.district || 'Sede'}
CLASSE: ${qrObject.gradeLevel} (${qrObject.academicYear})
CÓDIGO OFICIAL: ${qrObject.documentNumber}
VERIFICAÇÃO: ${qrObject.verificationCode}
VALIDAÇÃO ONLINE: ${qrObject.verificationUrl}`;
  }, [qrObject]);

  const cacheKey = `${qrPayload}_${size}`;
  const [qrDataUrl, setQrDataUrl] = useState<string>(() => qrDataUrlCache.get(cacheKey) || '');

  // Geração do QR Code visual com alta nitidez e contraste absoluto
  useEffect(() => {
    if (qrDataUrlCache.has(cacheKey)) {
      setQrDataUrl(qrDataUrlCache.get(cacheKey)!);
      return;
    }

    let isMounted = true;
    QRCode.toDataURL(qrPayload, {
      width: Math.max(size * 3, 240),
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => {
        qrDataUrlCache.set(cacheKey, url);
        if (isMounted) setQrDataUrl(url);
      })
      .catch(err => {
        console.error('Erro na geração de QR Code oficial:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [qrPayload, size, cacheKey]);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(qrObject, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QRCode_MINEDH_${iue.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    a.click();
  };

  // =========================================================================
  // VARIANTE: MINIMAL (Apenas a imagem do QR Code)
  // =========================================================================
  if (variant === 'minimal') {
    return (
      <div 
        className={`inline-block ${className}`}
        style={{ width: size, height: size }}
        title={`QR Code de Validação: ${iue}`}
      >
        {qrDataUrl ? (
          <img 
            src={qrDataUrl} 
            alt={`QR Code ${iue}`} 
            className="w-full h-full object-contain cursor-pointer"
            onClick={() => enableModal && setIsModalOpen(true)}
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center border border-slate-300 rounded text-slate-400">
            <QrCode className="w-6 h-6 animate-pulse" />
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VARIANTE: CERTIFICATE_CORNER (Para Diplomas e Certificados Verticais/Horizontais)
  // =========================================================================
  if (variant === 'certificate_corner') {
    return (
      <div className={`flex flex-col items-center text-center p-2 rounded-lg bg-white/95 border border-slate-300 shadow-2xs ${className}`}>
        <div 
          className="relative cursor-pointer group"
          onClick={() => enableModal && setIsModalOpen(true)}
          style={{ width: size, height: size }}
        >
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt="Autenticação Digital MINEDH" 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center border border-slate-200">
              <QrCode className="w-6 h-6 text-slate-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center print:hidden">
            <Eye className="w-4 h-4 text-blue-900" />
          </div>
        </div>

        {showLabel && (
          <div className="mt-1 space-y-0.5">
            <span className="text-[9px] font-sans font-black uppercase tracking-wider text-slate-900 block">
              Autenticação Digital
            </span>
            <span className="font-mono text-[8px] text-slate-600 block">
              {verifCode}
            </span>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VARIANTE: COMPACT (Para cabeçalhos ou barras laterais de pauta)
  // =========================================================================
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-lg ${className}`}>
        <div 
          className="shrink-0 cursor-pointer"
          style={{ width: size * 0.75, height: size * 0.75 }}
          onClick={() => enableModal && setIsModalOpen(true)}
        >
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-white flex items-center justify-center border border-slate-300">
              <QrCode className="w-4 h-4 text-slate-400" />
            </div>
          )}
        </div>

        <div className="text-[10px] leading-tight font-sans">
          <div className="font-bold text-slate-900 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Validação Oficial SIGE</span>
          </div>
          <div className="font-mono text-[9px] text-blue-950 font-bold truncate max-w-[150px] mt-0.5">
            {iue}
          </div>
          <div className="text-[8px] text-slate-500 font-mono">
            {verifCode}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VARIANTE: FULL_BLOCK (Bloco Oficial Completo com Moldura e Metadados)
  // =========================================================================
  return (
    <>
      <div className={`bg-white border-2 border-slate-300 rounded-xl p-3.5 shadow-xs text-center flex flex-col items-center max-w-[260px] ${className}`}>
        {/* Cabeçalho do Selo */}
        {showLabel && (
          <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-200 text-[10px]">
            <span className="font-sans font-bold text-blue-950 flex items-center gap-1 uppercase tracking-tight">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              MINEDH • SIGE
            </span>
            <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 font-mono text-[8px] font-bold">
              OFICIAL
            </span>
          </div>
        )}

        {/* QR Code com Efeito de Foco */}
        <div 
          className="relative bg-white p-1 rounded-lg border border-slate-200 cursor-pointer group shadow-2xs"
          onClick={() => enableModal && setIsModalOpen(true)}
          style={{ width: size, height: size }}
          title="Clique para ver os metadados do estudante"
        >
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt={`QR Code Oficial: ${iue}`} 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center">
              <QrCode className="w-8 h-8 text-slate-300 animate-pulse" />
            </div>
          )}

          <div className="absolute inset-0 bg-blue-950/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center print:hidden">
            <span className="bg-white/90 text-slate-900 text-[9px] font-bold px-2 py-1 rounded shadow-xs flex items-center gap-1">
              <Eye className="w-3 h-3" /> Inspecionar
            </span>
          </div>
        </div>

        {/* Metadados Institucionais Legíveis */}
        {showMetadata && (
          <div className="w-full mt-2.5 pt-2 border-t border-slate-100 text-[10px] space-y-1 text-left font-sans">
            <div>
              <span className="text-[8.5px] uppercase tracking-wider text-slate-400 block font-semibold">Identificador Único (IUE):</span>
              <span className="font-mono text-[9px] font-bold text-blue-950 break-all block leading-tight">{iue}</span>
            </div>

            {nim && (
              <div>
                <span className="text-[8.5px] uppercase tracking-wider text-slate-400 block font-semibold">NIM Operacional:</span>
                <span className="font-mono text-[9px] font-bold text-slate-800">{nim}</span>
              </div>
            )}

            <div className="truncate">
              <span className="text-[8.5px] uppercase tracking-wider text-slate-400 block font-semibold">Estudante:</span>
              <span className="font-bold text-slate-900 truncate block text-[9.5px]">{name}</span>
            </div>

            <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono pt-1">
              <span>{verifCode}</span>
              <span>Ano {academicYear}</span>
            </div>
          </div>
        )}

        {/* Ações Rápidas (Ocultas na Impressão) */}
        <div className="w-full mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 print:hidden text-[10px]">
          <button
            onClick={handleCopyPayload}
            className="flex-1 py-1 px-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 transition-colors cursor-pointer text-[9px] font-medium"
            title="Copiar dados codificados"
          >
            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
          </button>

          <button
            onClick={handleDownloadQR}
            className="flex-1 py-1 px-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1 transition-colors cursor-pointer text-[9px] font-medium"
            title="Baixar imagem PNG"
          >
            <Download className="w-3 h-3" />
            <span>Baixar</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE INSPEÇÃO DE DADOS CODIFICADOS NO QR CODE */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80  flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-900 rounded-lg">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-950">Autenticação Digital • MINEDH Moçambique</h3>
                  <p className="text-xs text-slate-500">Metadados oficiais criptográficos incorporados no documento</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Imagem Ampliada + Dados Centrais */}
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="w-32 h-32 bg-white p-2 rounded-lg border border-slate-200 shrink-0 shadow-xs">
                {qrDataUrl && <img src={qrDataUrl} alt="QR Code Ampliado" className="w-full h-full object-contain" />}
              </div>

              <div className="space-y-1.5 text-xs flex-1">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Estudante:</span>
                  <span className="font-bold text-slate-950 text-sm">{name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Código Único (IUE):</span>
                  <span className="font-mono text-blue-950 font-bold text-xs">{iue}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Estabelecimento de Ensino:</span>
                  <span className="text-slate-800">{school}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Documento:</span>
                  <span className="text-slate-800 font-semibold">{documentType} ({academicYear})</span>
                </div>
              </div>
            </div>

            {/* JSON Bruto Decodificado */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Carga Útil Completa (Payload JSON):</span>
                <button
                  onClick={handleCopyPayload}
                  className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer text-[11px]"
                >
                  {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopied ? 'Copiado para a área de transferência' : 'Copiar JSON'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-emerald-400 font-mono text-[10px] p-3 rounded-lg overflow-x-auto max-h-48 border border-slate-800">
                {JSON.stringify(qrObject, null, 2)}
              </pre>
            </div>

            {/* Rodapé com Fechar e Link */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <a
                href={nationalVerificationUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Portal Nacional de Validação</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-xl cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { QRCodeGenerator } from './QRCodeGenerator';
export type { QRCodeGeneratorProps, EdugestaoQRPayload, QRCodeVariant, QRCodePayloadFormat } from './QRCodeGenerator';
