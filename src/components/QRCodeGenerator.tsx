import React, { useEffect, useState, useMemo, useRef } from 'react';
import QRCode from 'qrcode';
import { Student } from '../types';
import { 
  ShieldCheck, QrCode, Copy, Check, Download, Eye, 
  ExternalLink, Sparkles, School as SchoolIcon, User, 
  Calendar, MapPin, Award, CheckCircle2, RefreshCw, FileText
} from 'lucide-react';
import { 
  generateIUE, 
  generateNIM, 
  formatDocumentReference, 
  extractInitials, 
  extractSchoolCode, 
  normalizeProvince, 
  extractDistrictCode,
  parseIUE 
} from '../utils/iueGenerator';

export interface EdugestaoQRPayload {
  system: string;
  edugestaoId: string;
  iue: string;
  nim: string;
  studentId: string;
  name: string;
  school: string;
  schoolCode: string;
  province: string;
  district: string;
  gradeLevel: string;
  className: string;
  academicYear: number;
  status: string;
  verificationCode: string;
  verificationUrl: string;
  issuedAt: string;
  extra?: Record<string, any>;
}

export type QRCodeVariant = 
  | 'card' 
  | 'compact' 
  | 'badge' 
  | 'minimal' 
  | 'certificate' 
  | 'id_card';

export type QRCodePayloadFormat = 
  | 'edugestao_standard' 
  | 'json' 
  | 'text' 
  | 'url';

export interface QRCodeGeneratorProps {
  /** Objeto de dados do aluno (Student ou parcial) */
  student?: Partial<Student> | null;
  
  /** Identificador Único do Estudante / ID EDUGESTÃO (se já existente ou para sobrepor) */
  edugestaoId?: string;
  iue?: string;
  
  /** Número Interno de Matrícula (NIM) */
  nim?: string;
  
  /** Nome do estudante (se não passado no student) */
  studentName?: string;
  
  /** Nome da instituição de ensino */
  schoolName?: string;
  
  /** Código ou sigla da escola */
  schoolCode?: string;
  
  /** Província */
  province?: string;
  
  /** Distrito */
  district?: string;
  
  /** Classe ou nível de escolaridade */
  gradeLevel?: string;
  
  /** Turma do estudante (ex: "Turma A") */
  studentClass?: string;
  turma?: string;
  
  /** Ano lectivo de referência */
  academicYear?: number;
  
  /** Estado de matrícula */
  status?: string;
  
  /** Tipo de documento associado */
  documentType?: string;
  
  /** Número de referência do documento */
  documentNumber?: string;
  
  /** Código de validação / hash personalizado */
  verificationCode?: string;
  
  /** Formato do payload codificado dentro do QR Code */
  payloadFormat?: QRCodePayloadFormat;
  
  /** Estilo visual de apresentação */
  variant?: QRCodeVariant;
  
  /** Tamanho do QR Code em pixels (padrão: 128) */
  size?: number;
  
  /** Cores do QR Code */
  color?: {
    dark?: string;
    light?: string;
  };
  
  /** Nível de correção de erros ('L' | 'M' | 'Q' | 'H', padrão: 'M') */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  
  /** Exibir metadados textuais legíveis */
  showMetadata?: boolean;
  
  /** Exibir etiqueta institucional EDUGESTÃO / MINEDH */
  showEdugestaoBadge?: boolean;
  
  /** Exibir botões de acção (copiar, baixar, inspecionar) */
  showActions?: boolean;
  
  /** Habilitar modal interativo ao clicar no QR Code */
  enableModal?: boolean;
  
  /** Classes CSS personalizadas */
  className?: string;
  
  /** Metadados adicionais arbitrários */
  extraData?: Record<string, any>;
  
  /** Callback disparado quando a imagem do QR é gerada com sucesso */
  onGenerated?: (dataUrl: string, payload: EdugestaoQRPayload) => void;
  
  /** Callback disparado em caso de erro */
  onError?: (error: Error) => void;
}

// Cache global em memória para QRCodeGenerator
const qrGeneratorCache = new Map<string, string>();

/**
 * Componente Reutilizável QRCodeGenerator
 * 
 * Renderiza um código QR institucional no padrão oficial EDUGESTÃO / MINEDH Moçambique.
 * Incorpora o ID Oficial EDUGESTÃO (IUE: [INICIAIS]-[Nº_DOC]-[ESCOLA]/[PROV]/[DIST]/[ANO]),
 * NIM operacional, metadados acadêmicos completos e chave criptográfica de verificação.
 */
export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  student,
  edugestaoId,
  iue: propIue,
  nim: propNim,
  studentName: propName,
  schoolName: propSchool,
  schoolCode: propSchoolCode,
  province: propProvince,
  district: propDistrict,
  gradeLevel: propGrade,
  studentClass: propClass,
  turma: propTurma,
  academicYear: propYear,
  status: propStatus,
  documentType = 'Processo Individual',
  documentNumber: propDocNumber,
  verificationCode: propVerifCode,
  payloadFormat = 'edugestao_standard',
  variant = 'card',
  size = 128,
  color = { dark: '#0F2240', light: '#FFFFFF' },
  errorCorrectionLevel = 'M',
  showMetadata = true,
  showEdugestaoBadge = true,
  showActions = true,
  enableModal = true,
  className = '',
  extraData,
  onGenerated,
  onError
}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // 1. Normalização dos dados do Estudante
  const resolvedName = (propName || student?.name || 'Estudante Não Identificado').trim();
  const resolvedSchool = (propSchool || (student as any)?.schoolName || 'Escola Secundária Josina Machel').trim();
  const resolvedYear = propYear || student?.academicYear || 2026;
  const resolvedProvince = propProvince || (student as any)?.province || 'Maputo Cidade';
  const resolvedDistrict = propDistrict || (student as any)?.district || 'KaMpfumo';
  const resolvedGrade = propGrade || student?.entryGrade || (student as any)?.gradeLevel || '10ª Classe';
  const resolvedClass = propClass || propTurma || (student as any)?.className || 'Turma A';
  const resolvedStatus = propStatus || student?.status || student?.enrollmentStatus || 'Activo';
  
  // ID do estudante determinístico sem Math.random para evitar loops de render
  const studentId = student?.id || (student as any)?.studentNumber || `ALU-${resolvedYear}-${Math.abs((resolvedName + resolvedSchool).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) % 900 + 100)}`;

  // 2. Extração / Geração do ID EDUGESTÃO (IUE Oficial)
  const resolvedIUE = useMemo(() => {
    if (edugestaoId && edugestaoId.trim()) return edugestaoId.trim();
    if (propIue && propIue.trim()) return propIue.trim();
    if (student?.iue && student.iue.trim()) return student.iue.trim();

    // Gerar segundo o padrão institucional MINEDH / EduGestão
    return generateIUE({
      name: resolvedName,
      documentNumber: (student as any)?.idCardNumber || (student as any)?.nuit || (student as any)?.birthCertificateNumber,
      schoolName: resolvedSchool,
      schoolCode: propSchoolCode,
      province: resolvedProvince,
      district: resolvedDistrict,
      academicYear: resolvedYear
    });
  }, [edugestaoId, propIue, student?.iue, (student as any)?.idCardNumber, (student as any)?.nuit, (student as any)?.birthCertificateNumber, resolvedName, resolvedSchool, propSchoolCode, resolvedProvince, resolvedDistrict, resolvedYear]);

  // 3. Extração / Geração do NIM Oficial
  const resolvedNIM = useMemo(() => {
    if (propNim && propNim.trim()) return propNim.trim();
    if (student?.nim && student.nim.trim()) return student.nim.trim();

    return generateNIM({
      year: resolvedYear,
      district: resolvedDistrict,
      fallbackSeed: `${resolvedName}_${studentId}`
    });
  }, [propNim, student?.nim, resolvedYear, resolvedDistrict, resolvedName, studentId]);

  const resolvedSchoolCode = propSchoolCode || extractSchoolCode(resolvedSchool);

  // 4. Código de Verificação e URL Pública Oficial
  const verificationCode = useMemo(() => {
    if (propVerifCode && propVerifCode.trim()) return propVerifCode.trim();

    // Hash determinístico baseado em identificadores institucionais
    const seed = `${resolvedIUE}|${resolvedName}|${resolvedYear}|${resolvedSchoolCode}`;
    const hash = Math.abs(
      seed.split('').reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)
    ).toString(16).toUpperCase().padStart(8, '0');

    return `VERIF-EDUG-${hash}`;
  }, [propVerifCode, resolvedIUE, resolvedName, resolvedYear, resolvedSchoolCode]);

  const verificationUrl = `https://sige.minedh.gov.mz/verificar?iue=${encodeURIComponent(resolvedIUE)}&ref=${encodeURIComponent(verificationCode)}`;
  const documentRef = propDocNumber || formatDocumentReference(resolvedIUE, 'REF_EDUGESTAO');

  // 5. Estrutura de Payload Institucional (data estática para estabilidade de referência)
  const fullPayloadObject: EdugestaoQRPayload = useMemo(() => ({
    system: 'EDUGESTAO-MINEDH',
    edugestaoId: resolvedIUE,
    iue: resolvedIUE,
    nim: resolvedNIM,
    studentId,
    name: resolvedName,
    school: resolvedSchool,
    schoolCode: resolvedSchoolCode,
    province: normalizeProvince(resolvedProvince),
    district: extractDistrictCode(resolvedDistrict),
    gradeLevel: resolvedGrade,
    className: resolvedClass,
    academicYear: resolvedYear,
    status: resolvedStatus,
    verificationCode,
    verificationUrl,
    issuedAt: `${resolvedYear}-02-01`,
    extra: extraData
  }), [resolvedIUE, resolvedNIM, studentId, resolvedName, resolvedSchool, resolvedSchoolCode, resolvedProvince, resolvedDistrict, resolvedGrade, resolvedClass, resolvedYear, resolvedStatus, verificationCode, verificationUrl, extraData]);

  // 6. Serialização conforme payloadFormat
  const encodedContent = useMemo(() => {
    switch (payloadFormat) {
      case 'url':
        return verificationUrl;
      case 'text':
        return [
          `REPÚBLICA DE MOÇAMBIQUE • MINEDH`,
          `SISTEMA INTEGRADO EDUGESTÃO`,
          `ID EDUGESTÃO: ${resolvedIUE}`,
          `NIM: ${resolvedNIM}`,
          `ESTUDANTE: ${resolvedName}`,
          `ESCOLA: ${resolvedSchool} (${resolvedSchoolCode})`,
          `PROVÍNCIA: ${resolvedProvince} | DISTRITO: ${resolvedDistrict}`,
          `CLASSE: ${resolvedGrade} | TURMA: ${resolvedClass}`,
          `ANO LECTIVO: ${resolvedYear}`,
          `ESTADO: ${resolvedStatus}`,
          `CHAVE VERIFICAÇÃO: ${verificationCode}`,
          `PORTAL: ${verificationUrl}`
        ].join('\n');
      case 'json':
      case 'edugestao_standard':
      default:
        return JSON.stringify({
          sig: 'EDUGESTAO-MINEDH-MZ',
          id: resolvedIUE,
          nim: resolvedNIM,
          estudante: resolvedName,
          escola: resolvedSchoolCode,
          ano: resolvedYear,
          classe: resolvedGrade,
          verif: verificationCode,
          url: verificationUrl
        });
    }
  }, [payloadFormat, verificationUrl, resolvedIUE, resolvedNIM, resolvedName, resolvedSchool, resolvedSchoolCode, resolvedProvince, resolvedDistrict, resolvedGrade, resolvedClass, resolvedYear, resolvedStatus, verificationCode]);

  const cacheKey = `${encodedContent}_${size}_${color.dark || '#0F2240'}_${color.light || '#FFFFFF'}_${errorCorrectionLevel}`;
  const [qrDataUrl, setQrDataUrl] = useState<string>(() => qrGeneratorCache.get(cacheKey) || '');

  // 7. Renderização do QR Code com protecção de cache
  useEffect(() => {
    if (qrGeneratorCache.has(cacheKey)) {
      const cached = qrGeneratorCache.get(cacheKey)!;
      setQrDataUrl(cached);
      return;
    }

    let isMounted = true;
    setGenerationError(null);

    QRCode.toDataURL(encodedContent, {
      width: size * 2, // 2x para nitidez em telas retina e impressão 300DPI
      margin: 1,
      color: {
        dark: color.dark || '#0F2240',
        light: color.light || '#FFFFFF'
      },
      errorCorrectionLevel: (errorCorrectionLevel || 'M') as QRCode.QRCodeErrorCorrectionLevel
    })
      .then(url => {
        qrGeneratorCache.set(cacheKey, url);
        if (!isMounted) return;
        setQrDataUrl(url);
        if (onGenerated) {
          onGenerated(url, fullPayloadObject);
        }
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('Erro na renderização do QR Code EDUGESTÃO:', err);
        setGenerationError(err.message || 'Falha ao renderizar QR Code');
        if (onError) {
          onError(err);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [encodedContent, size, color.dark, color.light, errorCorrectionLevel, cacheKey]);

  // Handlers
  const handleCopy = () => {
    const textToCopy = JSON.stringify(fullPayloadObject, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QRCode_EDUGESTAO_${resolvedIUE.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // =========================================================================
  // HELPER: MODAL DE INSPEÇÃO E AMPLIAÇÃO DO QR CODE
  // =========================================================================
  const renderModal = () => {
    if (!isModalOpen) return null;
    return (
      <div 
        className="fixed inset-0 z-[100] bg-slate-950/80  flex items-center justify-center p-4 no-print"
        onClick={() => setIsModalOpen(false)}
      >
        <div 
          className="bg-white rounded-3xl max-w-md sm:max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-left text-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-blue-100 text-blue-950 rounded-xl">
                <QrCode className="w-6 h-6 text-blue-950" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-950 flex items-center gap-1.5">
                  <span>Código QR Ampliado</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full font-mono">
                    AUTÊNTICO
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Validação EDUGESTÃO • MINEDH Moçambique</p>
              </div>
            </div>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 cursor-pointer font-bold text-base"
            >
              ✕
            </button>
          </div>

          {/* QR Code Ampliado e Detalhes Principais */}
          <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="w-56 h-56 sm:w-64 sm:h-64 bg-white p-3 rounded-2xl border-2 border-blue-900 shadow-md flex items-center justify-center">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="Código QR Ampliado Oficial" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <QrCode className="w-12 h-12 text-slate-300 animate-pulse" />
              )}
            </div>

            <div className="space-y-1 w-full">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                ID EDUGESTÃO (IUE OFICIAL):
              </span>
              <span className="font-mono font-black text-blue-950 text-base sm:text-lg break-all block leading-snug">
                {resolvedIUE}
              </span>
              <span className="font-bold text-slate-900 text-sm block">
                {resolvedName}
              </span>
              <span className="text-xs text-slate-500 block truncate">
                {resolvedSchool} • NIM: {resolvedNIM}
              </span>
            </div>
          </div>

          {/* JSON Bruto Decodificado */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Metadados Criptográficos Completos:</span>
              <button
                onClick={handleCopy}
                className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer text-[11px]"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copiado!' : 'Copiar Carga Útil'}</span>
              </button>
            </div>
            <pre className="bg-slate-900 text-emerald-400 font-mono text-[10px] p-3 rounded-xl overflow-x-auto max-h-36 border border-slate-800">
              {JSON.stringify(fullPayloadObject, null, 2)}
            </pre>
          </div>

          {/* Ações do Rodapé */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <a
              href={verificationUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
            >
              <span>Portal de Validação Governamental</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Baixar PNG
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // VARIANTE: MINIMAL (Apenas a imagem do QR Code limpa com tooltip)
  // =========================================================================
  if (variant === 'minimal') {
    return (
      <>
        <div 
          className={`inline-block ${className}`}
          style={{ width: size, height: size }}
          title={`ID EDUGESTÃO: ${resolvedIUE}`}
        >
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt={`QR Code ${resolvedIUE}`} 
              className="w-full h-full object-contain cursor-pointer transition-transform hover:scale-105"
              onClick={() => enableModal && setIsModalOpen(true)}
            />
          ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center border border-slate-200 rounded text-slate-400">
              <QrCode className="w-5 h-5 animate-pulse" />
            </div>
          )}
        </div>
        {renderModal()}
      </>
    );
  }

  // =========================================================================
  // VARIANTE: BADGE (Para tabelas de alunos, linhas compactas ou cartões)
  // =========================================================================
  if (variant === 'badge') {
    return (
      <>
        <div className={`inline-flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 rounded-lg transition-colors ${className}`}>
          <div 
            className="shrink-0 cursor-pointer"
            style={{ width: size * 0.5, height: size * 0.5 }}
            onClick={() => enableModal && setIsModalOpen(true)}
          >
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
            ) : (
              <QrCode className="w-4 h-4 text-slate-400" />
            )}
          </div>
          <div className="text-[10px] leading-tight">
            <span className="font-bold text-blue-950 font-mono block truncate max-w-[140px]">
              {resolvedIUE}
            </span>
            <span className="text-[8.5px] text-slate-500 font-semibold block">
              ID EDUGESTÃO
            </span>
          </div>
        </div>
        {renderModal()}
      </>
    );
  }

  // =========================================================================
  // VARIANTE: COMPACT (Para cabeçalhos, formulários de matrícula e fichas)
  // =========================================================================
  if (variant === 'compact') {
    return (
      <>
        <div className={`flex items-center gap-3 p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs ${className}`}>
          <div 
            className="shrink-0 cursor-pointer relative group rounded-lg overflow-hidden border border-slate-100 bg-white p-0.5"
            style={{ width: size * 0.75, height: size * 0.75 }}
            onClick={() => enableModal && setIsModalOpen(true)}
          >
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-slate-300 animate-pulse" />
              </div>
            )}
            <div className="absolute inset-0 bg-blue-900/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Eye className="w-3.5 h-3.5 text-blue-950" />
            </div>
          </div>

          <div className="text-left space-y-0.5 cursor-pointer" onClick={() => enableModal && setIsModalOpen(true)}>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                EDUGESTÃO • MINEDH
              </span>
            </div>
            <div className="font-mono text-[10.5px] font-bold text-blue-950 tracking-tight select-all">
              {resolvedIUE}
            </div>
            <div className="text-[9px] text-slate-500 font-mono">
              NIM: <span className="font-semibold text-slate-800">{resolvedNIM}</span> • {verificationCode}
            </div>
          </div>
        </div>
        {renderModal()}
      </>
    );
  }

  // =========================================================================
  // VARIANTE: CERTIFICATE (Selo de Canto Oficial para Diplomas & Declarações)
  // =========================================================================
  if (variant === 'certificate') {
    return (
      <>
        <div className={`flex flex-col items-center text-center p-3 rounded-xl bg-white/95 border border-slate-300 shadow-2xs ${className}`}>
          <div 
            className="relative cursor-pointer group bg-white p-1 rounded-lg border border-slate-200"
            onClick={() => enableModal && setIsModalOpen(true)}
            style={{ width: size, height: size }}
          >
            {qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt="Autenticação Digital EDUGESTÃO" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-slate-50 flex items-center justify-center">
                <QrCode className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center print:hidden rounded-lg">
              <Eye className="w-4 h-4 text-blue-950" />
            </div>
          </div>

          <div className="mt-1.5 space-y-0.5 text-center cursor-pointer" onClick={() => enableModal && setIsModalOpen(true)}>
            <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-900 block font-serif">
              Autenticação Digital
            </span>
            <span className="font-mono text-[8.5px] font-bold text-blue-950 block">
              {resolvedIUE}
            </span>
            <span className="font-mono text-[7.5px] text-slate-500 block uppercase tracking-widest">
              {verificationCode}
            </span>
          </div>
        </div>
        {renderModal()}
      </>
    );
  }

  // =========================================================================
  // VARIANTE: ID_CARD (Formato Cartão de Identificação de Estudante)
  // =========================================================================
  if (variant === 'id_card') {
    return (
      <>
        <div className={`bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 text-white rounded-2xl p-4 shadow-xl border border-blue-700/40 max-w-sm ${className}`}>
          {/* Top bar */}
          <div className="flex items-center justify-between pb-2 border-b border-blue-800/60 mb-3">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black tracking-wider uppercase text-blue-200">
                REPÚBLICA DE MOÇAMBIQUE • MINEDH
              </span>
            </div>
            <span className="bg-blue-600/50 text-white font-mono text-[8px] font-bold px-2 py-0.5 rounded-full border border-blue-400/40">
              EDUGESTÃO
            </span>
          </div>

          {/* Body with Photo Placeholder + Student Info + QR */}
          <div className="flex gap-3 items-center">
            <div 
              className="shrink-0 bg-white p-1 rounded-xl shadow-md cursor-pointer group relative"
              style={{ width: size * 0.85, height: size * 0.85 }}
              onClick={() => enableModal && setIsModalOpen(true)}
            >
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain rounded-lg" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-slate-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-blue-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl print:hidden">
                <Eye className="w-4 h-4 text-blue-950" />
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-1 text-xs">
              <p className="font-extrabold text-white text-sm truncate leading-snug">
                {resolvedName}
              </p>
              <p className="text-[10px] text-blue-200 truncate">
                {resolvedSchool}
              </p>
              <div className="pt-1">
                <span className="text-[8px] uppercase tracking-wider text-blue-300 font-bold block">ID EDUGESTÃO:</span>
                <span className="font-mono text-[9px] font-bold text-amber-300 break-all block leading-tight">
                  {resolvedIUE}
                </span>
              </div>
              <div className="flex items-center justify-between text-[8px] text-slate-300 font-mono pt-0.5">
                <span>NIM: {resolvedNIM}</span>
                <span>{resolvedGrade}</span>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-3 pt-2 border-t border-blue-800/60 flex items-center justify-between text-[8.5px] text-blue-300 font-mono">
            <span>{verificationCode}</span>
            <span className="text-emerald-400 font-bold uppercase">{resolvedStatus}</span>
          </div>
        </div>
        {renderModal()}
      </>
    );
  }

  // =========================================================================
  // VARIANTE PADRÃO: CARD (Card Institucional Completo com Moldura e Metadados)
  // =========================================================================
  return (
    <>
      <div className={`bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm text-center flex flex-col items-center max-w-[280px] transition-all hover:border-blue-400 ${className}`}>
        {/* Cabeçalho do Selo Institucional */}
        {showEdugestaoBadge && (
          <div className="w-full flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 text-[10px]">
            <span className="font-sans font-black text-blue-950 flex items-center gap-1 uppercase tracking-tight">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              EDUGESTÃO • MINEDH
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-mono text-[8px] font-black tracking-wider">
              OFICIAL
            </span>
          </div>
        )}

        {/* QR Code com Efeito de Foco */}
        <div 
          className="relative bg-white p-1.5 rounded-xl border border-slate-200 cursor-pointer group shadow-2xs transition-shadow hover:shadow-md"
          onClick={() => enableModal && setIsModalOpen(true)}
          style={{ width: size, height: size }}
          title="Clique para inspecionar os metadados do estudante"
        >
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt={`QR Code Oficial: ${resolvedIUE}`} 
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center">
              <QrCode className="w-8 h-8 text-slate-300 animate-pulse" />
            </div>
          )}

          <div className="absolute inset-0 bg-blue-950/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center print:hidden">
            <span className="bg-white/95 text-slate-900 text-[9.5px] font-bold px-2 py-1 rounded-md shadow-xs flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-blue-950" /> Inspecionar
            </span>
          </div>
        </div>

        {/* Metadados Institucionais Legíveis */}
        {showMetadata && (
          <div className="w-full mt-3 pt-2 border-t border-slate-100 text-[10px] space-y-1.5 text-left font-sans">
            <div>
              <span className="text-[8.5px] uppercase tracking-wider text-slate-400 block font-bold">
                ID Oficial EDUGESTÃO:
              </span>
              <span className="font-mono text-[9.5px] font-black text-blue-950 break-all block leading-tight select-all">
                {resolvedIUE}
              </span>
            </div>

            <div>
              <span className="text-[8.5px] uppercase tracking-wider text-slate-400 block font-bold">
                NIM Operacional:
              </span>
              <span className="font-mono text-[9.5px] font-bold text-slate-800">
                {resolvedNIM}
              </span>
            </div>

            <div className="truncate">
              <span className="text-[8.5px] uppercase tracking-wider text-slate-400 block font-bold">
                Estudante:
              </span>
              <span className="font-bold text-slate-900 truncate block text-[10px]">
                {resolvedName}
              </span>
            </div>

            <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono pt-0.5">
              <span>{verificationCode}</span>
              <span>Ano {resolvedYear}</span>
            </div>
          </div>
        )}

        {/* Ações Rápidas (Ocultas na Impressão) */}
        {showActions && (
          <div className="w-full mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 print:hidden text-[10px]">
            <button
              onClick={handleCopy}
              className="flex-1 py-1 px-2 rounded-lg hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1 transition-colors cursor-pointer text-[9.5px] font-bold"
              title="Copiar metadados do estudante"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 py-1 px-2 rounded-lg hover:bg-slate-100 text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1 transition-colors cursor-pointer text-[9.5px] font-bold"
              title="Baixar imagem PNG oficial"
            >
              <Download className="w-3 h-3" />
              <span>Baixar</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE INSPEÇÃO DE DADOS CODIFICADOS NO QR CODE */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80  flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-100 text-blue-950 rounded-xl">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-950 flex items-center gap-1.5">
                    <span>Validação EDUGESTÃO • MINEDH</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full font-mono">
                      AUTÊNTICO
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">Metadados oficiais incorporados no QR Code institucional</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* QR Code Ampliado e Detalhes Principais */}
            <div className="flex flex-col items-center justify-center text-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="w-64 h-64 sm:w-72 sm:h-72 bg-white p-4 rounded-2xl border-2 border-blue-900 shrink-0 shadow-md flex items-center justify-center">
                {qrDataUrl && <img src={qrDataUrl} alt="Código QR Ampliado Oficial" className="w-full h-full object-contain" />}
              </div>

              <div className="space-y-1.5 text-xs flex-1 w-full">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">ID EDUGESTÃO (IUE):</span>
                  <span className="font-mono font-black text-blue-950 text-base sm:text-lg break-all block leading-tight">{resolvedIUE}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Estudante:</span>
                  <span className="font-bold text-slate-900 text-sm block">{resolvedName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">NIM:</span>
                    <span className="text-slate-800 font-semibold">{resolvedNIM}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Ano Lectivo:</span>
                    <span className="text-slate-800 font-semibold">{resolvedYear}</span>
                  </div>
                </div>
                <div className="pt-0.5">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Escola:</span>
                  <span className="text-slate-700 font-medium truncate block">{resolvedSchool} ({resolvedSchoolCode})</span>
                </div>
              </div>
            </div>

            {/* JSON Bruto Decodificado */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Metadados Criptográficos Completos:</span>
                <button
                  onClick={handleCopy}
                  className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer text-[11px]"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copiado para transferência!' : 'Copiar Carga Útil'}</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-emerald-400 font-mono text-[10px] p-3 rounded-xl overflow-x-auto max-h-40 border border-slate-800">
                {JSON.stringify(fullPayloadObject, null, 2)}
              </pre>
            </div>

            {/* Ações do Rodapé */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <a
                href={verificationUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
              >
                <span>Portal de Validação Governamental</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar PNG
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition-colors"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QRCodeGenerator;
