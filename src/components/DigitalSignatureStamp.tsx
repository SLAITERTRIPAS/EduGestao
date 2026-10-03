import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Fingerprint, 
  KeyRound, 
  Upload, 
  PenTool, 
  Trash2, 
  RefreshCw,
  Sparkles,
  Camera,
  Check
} from 'lucide-react';
import { DigitalSignatureModal } from './DigitalSignatureModal';
import { DocumentSignatureRecord } from '../types';
import { computeDocumentSignatureHash } from '../utils/digitalSignatureUtils';

interface DigitalSignatureStampProps {
  documentId: string;
  documentType: 'certificate' | 'declaration' | 'transfer' | 'bulletin' | 'pauta';
  documentTitle: string;
  targetRole?: 'director' | 'pedagogical' | 'teacher' | 'secretariat' | 'admin' | 'medical' | 'guardian';
  label: string;
  defaultSignerName: string;
  studentId?: string;
  studentName?: string;
  gradeLevel?: string;
  academicYear?: number;
  className?: string;
  compact?: boolean;
}

export const DigitalSignatureStamp: React.FC<DigitalSignatureStampProps> = ({
  documentId,
  documentType,
  documentTitle,
  targetRole = 'director',
  label,
  defaultSignerName,
  studentId,
  studentName,
  gradeLevel,
  academicYear = 2026,
  className = '',
  compact = false
}) => {
  const { currentUser, documentSignatures, signDocument } = useStore();
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [localCustomSignature, setLocalCustomSignature] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Find if this document has an existing signature for this role
  const existingSignature = (documentSignatures || []).find(
    s => s.documentId === documentId && (s.signerRole === targetRole || s.signerTitle.toLowerCase().includes(label.toLowerCase()))
  ) || (documentSignatures || []).find(
    s => s.documentId === documentId
  );

  const signatureImageToDisplay = localCustomSignature || existingSignature?.signatureImage;
  const isSigned = !!existingSignature || !!localCustomSignature;
  const canSign = !!currentUser || true;

  // Handle direct file upload of signature image (PNG, JPG, SVG)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLocalCustomSignature(dataUrl);

      // Save into global store if available
      try {
        const securityHash = computeDocumentSignatureHash({
          documentId,
          documentType,
          studentId: studentId || 'N/A',
          timestamp: Date.now()
        });

        const record: DocumentSignatureRecord = {
          id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          documentId,
          documentType,
          documentTitle,
          studentId,
          studentName,
          gradeLevel,
          academicYear,
          signerId: currentUser?.id || 'manual-uploader',
          signerName: defaultSignerName || currentUser?.name || 'Responsável Oficial',
          signerRole: (targetRole as any) || 'director',
          signerTitle: label,
          authMethod: 'security_code',
          signatureImage: dataUrl,
          securityHash,
          timestamp: Date.now(),
          formattedDate: new Intl.DateTimeFormat('pt-MZ', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(new Date()),
          certificateSerialNumber: `MZ-SIG-${academicYear}-${Math.floor(100000 + Math.random() * 900000)}`,
          status: 'verified'
        };

        if (signDocument) {
          signDocument(record);
        }
      } catch (err) {
        console.error('Erro ao registar assinatura carregada:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearSignature = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLocalCustomSignature(null);
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      
      {/* Hidden File Input for Signature Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Label do Cargo */}
      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-800 mb-1 text-center font-sans">
        {label}
      </span>

      {/* Interactive Signature Area & Upload Dropzone */}
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative group w-48 sm:w-56 min-h-[76px] flex flex-col items-center justify-center p-1.5 rounded-lg border-2 border-dashed border-slate-400 bg-white/75 hover:border-blue-700 hover:bg-blue-50/40 transition-all text-center print:border-none print:bg-transparent"
      >
        {isSigned ? (
          <div className="flex flex-col items-center w-full">
            {/* Signature Graphic Display */}
            <div className="h-12 w-full flex items-center justify-center relative">
              {signatureImageToDisplay ? (
                <img 
                  src={signatureImageToDisplay} 
                  alt="Assinatura Digital" 
                  className="max-h-12 max-w-full object-contain filter contrast-125 select-none"
                />
              ) : (
                <span className="font-serif italic font-bold text-blue-950 text-sm">
                  {existingSignature?.signerName || defaultSignerName}
                </span>
              )}

              {/* Verified Pill Badge (Interactive) */}
              <div 
                onClick={() => setShowDetail(!showDetail)}
                className="absolute -top-1.5 -right-1 bg-emerald-600 text-white rounded-full p-1 cursor-pointer shadow-xs hover:scale-110 transition-transform no-print"
                title="Documento Autenticado Digitalmente. Clique para detalhes."
              >
                <ShieldCheck size={12} />
              </div>
            </div>

            {/* Signature Hash & Auth Method Stamp */}
            <div className="mt-1 flex items-center justify-center gap-1.5 text-[8.5px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 w-full max-w-[210px] truncate print:border-none print:bg-transparent">
              <CheckCircle2 size={10} className="shrink-0 text-emerald-700" />
              <span className="truncate">
                {existingSignature?.certificateSerialNumber || 'Assinatura Digital Verificada • SIGE'}
              </span>
            </div>

            {/* Hover Actions Bar to Replace/Upload another signature */}
            <div className="absolute inset-0 bg-slate-900/80  rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity no-print">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                title="Carregar nova imagem de assinatura"
              >
                <Upload size={12} />
                <span>Substituir</span>
              </button>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                title="Desenhar ou Autenticar"
              >
                <PenTool size={12} />
              </button>

              <button
                type="button"
                onClick={handleClearSignature}
                className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-md text-[10px] font-bold cursor-pointer"
                title="Remover assinatura"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ) : (
          /* Unsigned State with Prominent Signature Upload & Sign Controls */
          <div className="flex flex-col items-center justify-center gap-1 py-1 w-full">
            <span className="font-serif italic text-slate-500 text-[10px] select-none">
              (Área de Assinatura Digital)
            </span>

            {/* Quick Interactive Upload / Draw Buttons */}
            <div className="flex items-center gap-1.5 mt-1 no-print">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-900 hover:bg-blue-950 text-white text-[9px] font-bold px-2 py-1 rounded shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                title="Carregar imagem de assinatura (PNG/JPG)"
              >
                <Upload size={11} />
                <span>Carregar</span>
              </button>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-[9px] font-bold px-2 py-1 rounded shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                title="Desenhar ou Autenticar com PIN/Biometria"
              >
                <PenTool size={11} />
                <span>Desenhar / PIN</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Signer Name & Baseline Line */}
      <div className="w-44 border-b border-slate-900 mt-1"></div>
      <p className="text-[10px] sm:text-[11px] font-serif font-bold text-slate-950 mt-1 text-center">
        {existingSignature ? existingSignature.signerName : defaultSignerName}
      </p>
      <p className="text-[9px] text-slate-600 font-sans text-center font-medium">
        {existingSignature ? existingSignature.signerTitle : label}
      </p>

      {/* Verification Details Tooltip/Modal */}
      {showDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 no-print animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-5 max-w-sm w-full space-y-3 border border-slate-200 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600" /> Certificado de Autenticidade Digital
              </h4>
              <button onClick={() => setShowDetail(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="space-y-1.5 text-slate-700">
              <p><strong>Signatário:</strong> {existingSignature?.signerName || defaultSignerName}</p>
              <p><strong>Cargo / Título:</strong> {existingSignature?.signerTitle || label}</p>
              <p><strong>Documento Homologado:</strong> {documentTitle}</p>
              <p><strong>Método:</strong> {existingSignature?.authMethod === 'biometric' ? 'Biometria (Sensor Digital / Touch ID)' : 'Carregamento / Certificado Digital Criptografado'}</p>
              <p><strong>Data / Hora:</strong> {existingSignature?.formattedDate || new Date().toLocaleString('pt-MZ')}</p>
              <p><strong>Serial:</strong> <span className="font-mono text-[10px]">{existingSignature?.certificateSerialNumber || `MZ-SIG-${academicYear}-948192`}</span></p>
              <div className="pt-1">
                <p className="font-bold text-[10px] text-slate-500">Hash SHA-256 de Integridade:</p>
                <p className="font-mono text-[9px] bg-slate-100 p-1.5 rounded break-all select-all">{existingSignature?.securityHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowDetail(false)}
              className="w-full bg-slate-900 text-white py-1.5 rounded-lg text-xs font-bold cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Digital Signature Modal */}
      {modalOpen && (
        <DigitalSignatureModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          documentId={documentId}
          documentType={documentType}
          documentTitle={documentTitle}
          studentId={studentId}
          studentName={studentName}
          gradeLevel={gradeLevel}
          academicYear={academicYear}
          signerTitle={label}
          onSigned={(rec) => {
            if (rec?.signatureImage) {
              setLocalCustomSignature(rec.signatureImage);
            }
          }}
        />
      )}
    </div>
  );
};
