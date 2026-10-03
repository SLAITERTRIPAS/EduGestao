import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { PenTool, CheckCircle2, Fingerprint, KeyRound, ShieldCheck, Upload, Trash2, Check } from 'lucide-react';
import { DigitalSignatureModal } from './DigitalSignatureModal';
import { computeDocumentSignatureHash } from '../utils/digitalSignatureUtils';
import { DocumentSignatureRecord } from '../types';

interface SignatureBoxProps {
  label?: string;
  className?: string;
  targetRole?: 'director' | 'pedagogical' | 'teacher' | 'secretariat' | 'admin';
  forcedSignature?: string;
  forcedSignerName?: string;
  documentId?: string;
  documentType?: 'certificate' | 'declaration' | 'transfer' | 'bulletin' | 'pauta';
  documentTitle?: string;
  studentId?: string;
  studentName?: string;
  gradeLevel?: string;
  academicYear?: number;
}

export const SignatureBox: React.FC<SignatureBoxProps> = ({ 
  label = "O Director da Escola", 
  className = "",
  targetRole,
  forcedSignature,
  forcedSignerName,
  documentId = `sig-${Date.now()}`,
  documentType = 'declaration',
  documentTitle = 'Documento Oficial MINEDH',
  studentId,
  studentName,
  gradeLevel,
  academicYear = 2026
}) => {
  const { currentUser, users, documentSignatures, signDocument, updateUserSignature } = useStore();
  const [signature, setSignature] = useState<string | null>(forcedSignature || null);
  const [signerName, setSignerName] = useState<string>(forcedSignerName || '');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if there is an official signature record in store
  const docSignatureRecord = documentId ? (documentSignatures || []).find(
    s => s.documentId === documentId && (!targetRole || s.signerRole === targetRole || s.signerTitle.toLowerCase().includes(label.toLowerCase()))
  ) : null;

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'director': return 'Director da Escola';
      case 'pedagogical': return 'Director Adjunto Pedagógico (DAP)';
      case 'teacher': return 'Docente / Professor';
      case 'secretariat': return 'Chefe da Secretaria Geral';
      case 'admin': return 'Administrador do Sistema';
      default: return r;
    }
  };

  // Auto-detect matching signature based on label or targetRole
  useEffect(() => {
    if (docSignatureRecord) {
      if (docSignatureRecord.signatureImage) {
        setSignature(docSignatureRecord.signatureImage);
      }
      setSignerName(docSignatureRecord.signerName);
      return;
    }

    if (forcedSignature) {
      setSignature(forcedSignature);
      if (forcedSignerName) setSignerName(forcedSignerName);
      return;
    }

    // Determine target role from label if not explicitly provided
    let derivedRole = targetRole;
    if (!derivedRole) {
      const lowerLabel = label.toLowerCase();
      if (lowerLabel.includes('director da escola') || lowerLabel.includes('diretor')) derivedRole = 'director';
      else if (lowerLabel.includes('pedagógico') || lowerLabel.includes('pedagogico')) derivedRole = 'pedagogical';
      else if (lowerLabel.includes('turma') || lowerLabel.includes('júri') || lowerLabel.includes('juri') || lowerLabel.includes('professor') || lowerLabel.includes('docente')) derivedRole = 'teacher';
      else if (lowerLabel.includes('secretár') || lowerLabel.includes('secretar') || lowerLabel.includes('secretario') || lowerLabel.includes('secretaria')) derivedRole = 'secretariat';
    }

    // 1. Check currentUser first if their role matches the derivedRole
    if (currentUser?.signature && (!derivedRole || currentUser.role === derivedRole || currentUser.role === 'admin')) {
      setSignature(currentUser.signature);
      setSignerName(currentUser.name);
      return;
    }

    // 2. Check users array for a user with the matching role and signature
    if (derivedRole) {
      const matchingUser = users.find(u => u.role === derivedRole && (u.signature || u.signatureImage));
      if (matchingUser) {
        setSignature(matchingUser.signature || matchingUser.signatureImage || null);
        setSignerName(matchingUser.name);
        return;
      }
    }

    // Default fallback
    setSignature(null);
    setSignerName('');
  }, [currentUser, users, label, targetRole, forcedSignature, forcedSignerName, docSignatureRecord]);

  // Handle direct file upload from the signature box
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSignature(dataUrl);
      const chosenSigner = forcedSignerName || currentUser?.name || 'Responsável';
      setSignerName(chosenSigner);

      if (currentUser?.id) {
        updateUserSignature(currentUser.id, dataUrl);
      }

      // Save into global store if documentId exists
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
          documentType: (documentType as any) || 'pauta',
          documentTitle,
          studentId,
          studentName,
          gradeLevel,
          academicYear,
          signerId: currentUser?.id || 'manual-upload',
          signerName: chosenSigner,
          signerRole: (targetRole as any) || currentUser?.role || 'teacher',
          signerTitle: label,
          authMethod: 'security_code',
          signatureImage: dataUrl,
          securityHash,
          timestamp: Date.now(),
          formattedDate: new Intl.DateTimeFormat('pt-MZ', { 
            day: '2-digit', 
            month: 'long', 
            year: 'numeric'
          }).format(new Date()),
          certificateSerialNumber: `MZ-SIG-${academicYear}-${Math.floor(100000 + Math.random() * 900000)}`,
          status: 'verified'
        };

        if (signDocument) {
          signDocument(record);
        }
      } catch (err) {
        console.error('Erro ao registar assinatura:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSignature(null);
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileUpload}
      />

      <span className="text-[10px] font-bold uppercase tracking-wide text-black mb-1 text-center font-sans">
        {label}
      </span>

      {/* Signature Dropzone & Area */}
      <div 
        className="border-2 border-dashed border-black/40 p-1 rounded bg-white hover:bg-blue-50/40 hover:border-blue-700 transition-all text-center w-52 h-20 flex flex-col items-center justify-center relative print:border-none group shadow-2xs"
      >
        {signature ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            <img src={signature} alt="Assinatura Digital" className="max-h-12 max-w-full object-contain filter contrast-125 select-none" />
            
            <div 
              className="absolute top-0.5 right-0.5 bg-emerald-100 text-emerald-800 rounded-full p-0.5 no-print flex items-center gap-0.5 px-1 text-[8px] font-bold"
              title="Assinatura Digital Autenticada"
            >
              {docSignatureRecord?.authMethod === 'biometric' ? (
                <><Fingerprint size={9} /> <span className="hidden sm:inline">Bio</span></>
              ) : (
                <><CheckCircle2 size={9} /> <span className="hidden sm:inline">Válida</span></>
              )}
            </div>

            {/* Hover actions */}
            <div className="absolute inset-0 bg-slate-900/80  rounded flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity no-print">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                title="Carregar imagem"
              >
                <Upload size={10} />
                <span>Trocar</span>
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded text-[9px] font-bold flex items-center gap-0.5 cursor-pointer"
                title="Desenhar / PIN"
              >
                <PenTool size={10} />
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="bg-red-600 hover:bg-red-700 text-white p-1 rounded text-[9px] font-bold cursor-pointer"
                title="Remover"
              >
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 py-1 w-full no-print select-none">
            <span className="font-serif italic text-slate-500 text-[9px]">
              (Área de Assinatura Digital)
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-900 hover:bg-blue-800 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1 cursor-pointer"
                title="Carregar ficheiro de assinatura (PNG/JPG)"
              >
                <Upload size={10} />
                <span>Carregar</span>
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1 cursor-pointer"
                title="Desenhar ou Autenticar"
              >
                <PenTool size={10} />
                <span>Opções</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Signer Name & Underline */}
      <div className="w-44 border-b border-black mt-1"></div>
      <span className="text-[9px] text-slate-800 mt-0.5 font-serif font-bold text-center truncate max-w-[200px]">
        {signerName || currentUser?.name || 'Sem Assinatura Vinculada'}
      </span>

      {/* Modal */}
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
        onSigned={(record) => {
          if (record.signatureImage) setSignature(record.signatureImage);
          setSignerName(record.signerName);
        }}
      />
    </div>
  );
};
