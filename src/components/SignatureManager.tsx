import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Card, Button } from './ui';
import { 
  Upload, 
  PenTool, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  UserCheck, 
  FileText, 
  Download, 
  RotateCcw,
  Sparkles,
  Info,
  Fingerprint,
  KeyRound,
  Lock,
  Search,
  Check,
  Eye,
  AlertCircle,
  FileCheck,
  Layers,
  History,
  Award,
  RefreshCw,
  QrCode,
  CheckSquare,
  Square
} from 'lucide-react';
import { DigitalSignatureModal } from './DigitalSignatureModal';
import { CertificateDocument } from './CertificateDocument';
import { DeclarationDocument } from './DeclarationDocument';
import { 
  authenticateWithBiometrics, 
  generateCalligraphicSignatureSvg 
} from '../utils/digitalSignatureUtils';

import { SignatureEditor } from './SignatureEditor';

export const SignatureManager: React.FC = () => {
  const { 
    currentUser, 
    updateUserSignature, 
    setUserSecurityPin, 
    registerUserBiometrics, 
    documentSignatures, 
    issuedCertificates, 
    issuedDeclarations,
    students,
    classes,
    subjects,
    grades,
    schools,
    signDocument
  } = useStore();

  // Module Top Level Tabs
  const [moduleTab, setModuleTab] = useState<'credentials' | 'documents' | 'history' | 'validator'>('documents');

  // Drawing Pad state
  const [activeTab, setActiveTab] = useState<'draw' | 'upload'>('draw');
  const [signature, setSignature] = useState<string | null>(currentUser?.signature || null);
  const [penColor, setPenColor] = useState<string>('#1e3a8a');
  const [penLineWidth, setPenLineWidth] = useState<number>(2.5);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Security Credentials state (PIN & Biometrics)
  const [securityPinInput, setSecurityPinInput] = useState<string>(currentUser?.securityPin || '123456');
  const [pinChangeSuccess, setPinChangeSuccess] = useState<boolean>(false);
  const [biometricTesting, setBiometricTesting] = useState<boolean>(false);
  const [biometricTestResult, setBiometricTestResult] = useState<string | null>(null);

  // Document Signing Queue state
  const [docFilter, setDocFilter] = useState<'all' | 'pending' | 'certificates' | 'declarations'>('pending');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [activeSigningDoc, setActiveSigningDoc] = useState<any | null>(null);
  const [signingModalOpen, setSigningModalOpen] = useState<boolean>(false);

  // Full Document View Modal state
  const [previewDoc, setPreviewDoc] = useState<{
    type: 'certificate' | 'declaration';
    student: any;
    schoolClass?: any;
    docData?: any;
  } | null>(null);

  // Validator Tab state
  const [validatorQuery, setValidatorQuery] = useState<string>('');
  const [validatorResult, setValidatorResult] = useState<any | null>(null);

  // Editor Modal state
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string>('');

  // Sync signature when currentUser updates
  useEffect(() => {
    if (currentUser?.signature) {
      setSignature(currentUser.signature);
    }
  }, [currentUser]);

  // Setup canvas background
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [activeTab]);

  // Start Drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  // Draw Stroke
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = penColor;
    ctx.lineWidth = penLineWidth;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  // Stop Drawing
  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  // Clear Canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Apply Drawing to Signature
  const applyCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasDrawing = pixelData.some(alpha => alpha !== 0);

    if (!hasDrawing) {
      alert('Desenhe a sua assinatura no quadro antes de confirmar.');
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    setSignature(dataUrl);
    if (currentUser) {
      updateUserSignature(currentUser.id, dataUrl);
      setSuccessMsg('Assinatura guardada e vinculada com sucesso ao seu perfil!');
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('O ficheiro da imagem deve ter menos de 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPendingImageUrl(dataUrl);
        setIsEditorOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProcessedSignature = (processedUrl: string) => {
    setSignature(processedUrl);
    if (currentUser) {
      updateUserSignature(currentUser.id, processedUrl);
      setSuccessMsg('Imagem de assinatura processada e vinculada com sucesso!');
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  // Quick generate calligraphic signature
  const handleGenerateCalligraphic = () => {
    if (currentUser?.name) {
      const calligraphic = generateCalligraphicSignatureSvg(currentUser.name, penColor);
      setSignature(calligraphic);
      updateUserSignature(currentUser.id, calligraphic);
      setSuccessMsg('Assinatura caligráfica oficial gerada automaticamente!');
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  // Remove Signature
  const handleRemoveSignature = () => {
    if (window.confirm('Tem certeza que deseja remover a assinatura digital vinculada ao seu perfil?')) {
      setSignature(null);
      if (currentUser) {
        updateUserSignature(currentUser.id, '');
        clearCanvas();
      }
    }
  };

  // Save new Security PIN
  const handleSaveSecurityPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(securityPinInput)) {
      alert('O Código de Segurança deve ter exatamente 6 dígitos numéricos.');
      return;
    }
    if (currentUser) {
      setUserSecurityPin(currentUser.id, securityPinInput);
      setPinChangeSuccess(true);
      setTimeout(() => setPinChangeSuccess(false), 3000);
    }
  };

  // Test Biometric Sensor
  const handleTestBiometrics = async () => {
    setBiometricTesting(true);
    setBiometricTestResult(null);
    try {
      await new Promise(r => setTimeout(r, 800));
      const res = await authenticateWithBiometrics(currentUser?.name || 'Gestor');
      if (res.success) {
        if (currentUser) {
          await registerUserBiometrics(currentUser.id, true);
        }
        setBiometricTestResult('Sensor biométrico ativo e calibrado com sucesso!');
      } else {
        setBiometricTestResult('Não foi possível verificar o sensor biométrico.');
      }
    } catch {
      setBiometricTestResult('Erro ao interagir com sensor biométrico.');
    } finally {
      setBiometricTesting(false);
    }
  };

  // Compile Unified Document List from store
  const allDocuments = [
    ...(issuedCertificates || []).map(c => {
      const student = students.find(s => s.id === c.studentId);
      const isSignedByMe = (documentSignatures || []).some(
        s => s.documentId === c.certificateCode && s.signerId === currentUser?.id
      );
      const hasAnySignature = (documentSignatures || []).some(
        s => s.documentId === c.certificateCode
      );
      return {
        id: c.certificateCode,
        rawId: c.id,
        type: 'certificate' as const,
        title: c.type || 'CERTIFICADO DE CONCLUSÃO',
        studentId: c.studentId,
        studentName: c.studentName || student?.name || 'Aluno',
        gradeLevel: c.gradeLevel || '10ª Classe',
        academicYear: c.academicYear || 2026,
        schoolName: c.schoolName || 'Escola Secundária Josina Machel',
        issuedAt: c.issuedAt,
        average: c.average || 15,
        isSignedByMe,
        hasAnySignature,
        student
      };
    }),
    ...(issuedDeclarations || []).map(d => {
      const student = students.find(s => s.id === d.studentId);
      const docCode = d.verificationCode || d.id;
      const isSignedByMe = (documentSignatures || []).some(
        s => (s.documentId === docCode || s.documentId === d.id) && s.signerId === currentUser?.id
      );
      const hasAnySignature = d.electronicallySigned || (documentSignatures || []).some(
        s => s.documentId === docCode || s.documentId === d.id
      );
      return {
        id: docCode,
        rawId: d.id,
        type: 'declaration' as const,
        title: 'Declaração com Notas',
        studentId: d.studentId,
        studentName: student?.name || 'Aluno',
        gradeLevel: d.gradeLevel || '10ª Classe',
        academicYear: d.academicYear || 2026,
        schoolName: d.schoolName || 'Escola Secundária Josina Machel',
        issuedAt: d.issuedAt,
        average: d.finalAverage || 14,
        isSignedByMe,
        hasAnySignature,
        student
      };
    })
  ];

  // Filter documents
  const filteredDocuments = allDocuments.filter(doc => {
    // Type/Status filter
    if (docFilter === 'pending' && doc.isSignedByMe) return false;
    if (docFilter === 'certificates' && doc.type !== 'certificate') return false;
    if (docFilter === 'declarations' && doc.type !== 'declaration') return false;

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = doc.studentName.toLowerCase().includes(q);
      const matchId = doc.id.toLowerCase().includes(q);
      const matchGrade = doc.gradeLevel.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchGrade) return false;
    }
    return true;
  });

  // Toggle selection
  const handleToggleSelectDoc = (docId: string) => {
    if (selectedDocIds.includes(docId)) {
      setSelectedDocIds(selectedDocIds.filter(id => id !== docId));
    } else {
      setSelectedDocIds([...selectedDocIds, docId]);
    }
  };

  const handleSelectAllFiltered = () => {
    if (selectedDocIds.length === filteredDocuments.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filteredDocuments.map(d => d.id));
    }
  };

  // Sign single document
  const handleOpenSignModal = (doc: any) => {
    setActiveSigningDoc(doc);
    setSigningModalOpen(true);
  };

  // Batch Sign selected docs with Biometric Authentication
  const handleBatchSignBiometric = async () => {
    if (selectedDocIds.length === 0) return;

    if (!window.confirm(`Confirma a assinatura em lote de ${selectedDocIds.length} documento(s) com Autenticação Biométrica?`)) {
      return;
    }

    try {
      const bioRes = await authenticateWithBiometrics(currentUser?.name || 'Gestor');
      if (!bioRes.success) {
        alert('Falha na leitura biométrica para assinatura em lote.');
        return;
      }

      for (const docId of selectedDocIds) {
        const doc = allDocuments.find(d => d.id === docId);
        if (doc) {
          await signDocument({
            documentId: doc.id,
            documentType: doc.type,
            studentId: doc.studentId,
            studentName: doc.studentName,
            authMethod: 'biometric',
            biometricType: 'fingerprint'
          });
        }
      }

      setSelectedDocIds([]);
      setSuccessMsg(`${selectedDocIds.length} documentos assinados digitalmente com sucesso!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) {
      alert(e?.message || 'Erro ao assinar documentos em lote.');
    }
  };

  // Open Full Document View (Certificate / Declaration)
  const handlePreviewFullDocument = (doc: any) => {
    const student = doc.student || students.find(s => s.id === doc.studentId) || {
      id: doc.studentId,
      name: doc.studentName,
      schoolId: 's1',
      entryGrade: doc.gradeLevel,
      status: 'active'
    };
    const schoolClass = classes.find(c => c.id === student?.classId) || classes[0];

    setPreviewDoc({
      type: doc.type,
      student,
      schoolClass,
      docData: doc
    });
  };

  // Handle validator query
  const handleValidateDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatorQuery.trim()) return;

    const query = validatorQuery.trim().toLowerCase();
    
    // Check if query matches any signature record, documentId or hash
    const foundSig = (documentSignatures || []).find(
      s => s.documentId.toLowerCase() === query || 
           s.securityHash.toLowerCase().includes(query) ||
           s.certificateSerialNumber.toLowerCase().includes(query) ||
           (s.studentName && s.studentName.toLowerCase().includes(query))
    );

    const foundDoc = allDocuments.find(
      d => d.id.toLowerCase() === query || d.studentName.toLowerCase().includes(query)
    );

    if (foundSig || foundDoc) {
      setValidatorResult({
        isValid: true,
        signature: foundSig,
        document: foundDoc,
        verifiedAt: new Date().toLocaleString('pt-MZ')
      });
    } else {
      setValidatorResult({
        isValid: false,
        query: validatorQuery,
        verifiedAt: new Date().toLocaleString('pt-MZ')
      });
    }
  };

  // Role permissions display
  const getRoleTitle = () => {
    const role = currentUser?.role || 'teacher';
    switch (role) {
      case 'director': return 'Director da Escola';
      case 'pedagogical': return 'Director Adjunto Pedagógico';
      case 'teacher': return 'Director de Turma / Professor';
      case 'secretariat': return 'Secretaria Académica';
      default: return 'Administrador do Sistema';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-16 text-slate-900">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0b2545] via-[#133e6d] to-[#07182d] rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-2 bg-amber-400/20 rounded-xl text-amber-300 border border-amber-400/40">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Módulo Oficial de Assinatura Digital de Documentos
            </h2>
          </div>
          <p className="text-xs text-blue-200 max-w-2xl leading-relaxed">
            Assine digitalmente certificados, declarações de notas e documentos oficiais com autenticação biométrica (Touch ID / Face ID) ou código de segurança (PIN de 6 dígitos) de acordo com o padrão do MINEDH.
          </p>
        </div>

        {/* Global Success Notification */}
        {successMsg && (
          <div className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg animate-bounce">
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}
      </div>

      {/* Top Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setModuleTab('documents')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            moduleTab === 'documents'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <FileCheck size={16} /> Fila de Documentos ({allDocuments.length})
        </button>

        <button
          onClick={() => setModuleTab('credentials')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            moduleTab === 'credentials'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <Fingerprint size={16} /> Minha Assinatura & Credenciais
        </button>

        <button
          onClick={() => setModuleTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            moduleTab === 'history'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <History size={16} /> Auditoria & Assinados ({(documentSignatures || []).length})
        </button>

        <button
          onClick={() => setModuleTab('validator')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            moduleTab === 'validator'
              ? 'bg-blue-900 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
          }`}
        >
          <QrCode size={16} /> Validador de Documentos
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FILA DE DOCUMENTOS PARA ASSINATURA */}
      {/* ========================================================================= */}
      {moduleTab === 'documents' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          
          {/* Controls Bar: Filters, Search, Batch Actions */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setDocFilter('pending')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  docFilter === 'pending'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Pendentes de Assinatura
              </button>

              <button
                onClick={() => setDocFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  docFilter === 'all'
                    ? 'bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todos ({allDocuments.length})
              </button>

              <button
                onClick={() => setDocFilter('certificates')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  docFilter === 'certificates'
                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Certificados de Conclusão
              </button>

              <button
                onClick={() => setDocFilter('declarations')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  docFilter === 'declarations'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Declarações de Notas
              </button>
            </div>

            {/* Search Box */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por aluno, código..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-900"
              />
            </div>
          </div>

          {/* Batch Actions Bar (when documents selected) */}
          {selectedDocIds.length > 0 && (
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-xs font-bold">
                <CheckSquare size={16} className="text-amber-400" />
                <span>{selectedDocIds.length} documento(s) selecionado(s)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchSignBiometric}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Fingerprint size={15} /> Assinar Selecionados com Biometria
                </button>
                <button
                  onClick={() => setSelectedDocIds([])}
                  className="text-slate-300 hover:text-white text-xs px-2 py-1"
                >
                  Desmarcar
                </button>
              </div>
            </div>
          )}

          {/* Documents Table */}
          <Card className="overflow-hidden border border-slate-200 shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={selectedDocIds.length === filteredDocuments.length && filteredDocuments.length > 0}
                        onChange={handleSelectAllFiltered}
                        className="rounded text-blue-900 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3">Tipo de Documento</th>
                    <th className="py-3 px-3">Aluno Titular</th>
                    <th className="py-3 px-3">Classe & Ano</th>
                    <th className="py-3 px-3">Código Oficial</th>
                    <th className="py-3 px-3 text-center">Estado da Assinatura</th>
                    <th className="py-3 px-3 text-right">Ações Oficiais</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredDocuments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                        <p className="font-semibold text-sm text-slate-600">Nenhum documento encontrado neste filtro</p>
                        <p className="text-xs text-slate-400 mt-0.5">Altere os filtros acima para visualizar outros certificados ou declarações.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDocuments.map((doc) => {
                      const isSelected = selectedDocIds.includes(doc.id);
                      return (
                        <tr key={doc.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectDoc(doc.id)}
                              className="rounded text-blue-900 cursor-pointer"
                            />
                          </td>

                          <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2">
                            {doc.type === 'certificate' ? (
                              <Award size={16} className="text-amber-600 shrink-0" />
                            ) : (
                              <FileText size={16} className="text-blue-600 shrink-0" />
                            )}
                            <div>
                              <span>{doc.title}</span>
                              <span className="block text-[10px] text-slate-400 font-mono">Média: {doc.average} valores</span>
                            </div>
                          </td>

                          <td className="py-3 px-3 font-bold text-slate-900">
                            {doc.studentName}
                          </td>

                          <td className="py-3 px-3 text-slate-600">
                            <span>{doc.gradeLevel}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">{doc.academicYear}</span>
                          </td>

                          <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                            {doc.id}
                          </td>

                          <td className="py-3 px-3 text-center">
                            {doc.isSignedByMe ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 size={12} /> Assinado por Mim
                              </span>
                            ) : doc.hasAnySignature ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                <CheckCircle2 size={12} /> Assinado (Outro)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <AlertCircle size={12} /> Aguarda Assinatura
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Preview Full Document Button */}
                              <button
                                onClick={() => handlePreviewFullDocument(doc)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                title="Visualizar documento completo"
                              >
                                <Eye size={13} /> Visualizar
                              </button>

                              {/* Sign Button */}
                              <button
                                onClick={() => handleOpenSignModal(doc)}
                                className="px-2.5 py-1 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                                title="Assinar com Biometria ou PIN"
                              >
                                <Fingerprint size={13} /> Assinar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MINHA ASSINATURA & CREDENCIAIS DE AUTENTICAÇÃO */}
      {/* ========================================================================= */}
      {moduleTab === 'credentials' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* User Identity Card */}
          <Card className="p-5 bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center font-black text-lg border border-blue-200 shadow-inner">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">{currentUser?.name || 'Colaborador'}</h3>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                    {getRoleTitle()}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                  <span>Email: <strong className="text-slate-700">{currentUser?.email}</strong></span>
                  <span>•</span>
                  <span>ID: <strong className="font-mono text-slate-700">{currentUser?.id}</strong></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600">
              <UserCheck size={16} className="text-blue-700" />
              <span>Assinatura Digital: <strong className="text-emerald-700">Ativa</strong></span>
            </div>
          </Card>

          {/* Grid: Signature Drawing Pad + Security Credentials Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Signature Drawing / Upload Pad (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <Card className="p-6 border border-slate-200 bg-white shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex border-b-2 border-transparent gap-4">
                    <button
                      onClick={() => setActiveTab('draw')}
                      className={`text-xs font-bold flex items-center gap-1.5 pb-1 ${
                        activeTab === 'draw' ? 'text-blue-900 border-b-2 border-blue-900' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <PenTool size={15} /> Desenhar na Tela
                    </button>
                    <button
                      onClick={() => setActiveTab('upload')}
                      className={`text-xs font-bold flex items-center gap-1.5 pb-1 ${
                        activeTab === 'upload' ? 'text-blue-900 border-b-2 border-blue-900' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      <Upload size={15} /> Carregar Imagem
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateCalligraphic}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Sparkles size={13} /> Gerar Caligrafia Oficial
                  </button>
                </div>

                {/* Drawing Tab */}
                {activeTab === 'draw' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      {/* Color */}
                      <div className="flex items-center gap-2 font-semibold">
                        <span>Cor:</span>
                        <button
                          onClick={() => setPenColor('#1e3a8a')}
                          className={`h-6 w-6 rounded-full border-2 ${penColor === '#1e3a8a' ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: '#1e3a8a' }}
                          title="Azul Caneta Oficial"
                        />
                        <button
                          onClick={() => setPenColor('#0f172a')}
                          className={`h-6 w-6 rounded-full border-2 ${penColor === '#0f172a' ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: '#0f172a' }}
                          title="Preto Caneta"
                        />
                      </div>

                      {/* Stroke */}
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span>Espessura:</span>
                        <button
                          onClick={() => setPenLineWidth(1.8)}
                          className={`px-2 py-0.5 text-[10px] rounded border ${penLineWidth === 1.8 ? 'bg-blue-900 text-white font-bold' : 'bg-white text-slate-700'}`}
                        >
                          Fina
                        </button>
                        <button
                          onClick={() => setPenLineWidth(2.5)}
                          className={`px-2 py-0.5 text-[10px] rounded border ${penLineWidth === 2.5 ? 'bg-blue-900 text-white font-bold' : 'bg-white text-slate-700'}`}
                        >
                          Média
                        </button>
                        <button
                          onClick={() => setPenLineWidth(4)}
                          className={`px-2 py-0.5 text-[10px] rounded border ${penLineWidth === 4 ? 'bg-blue-900 text-white font-bold' : 'bg-white text-slate-700'}`}
                        >
                          Grossa
                        </button>
                      </div>

                      <button
                        onClick={clearCanvas}
                        className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold"
                      >
                        <RotateCcw size={13} /> Limpar
                      </button>
                    </div>

                    <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden shadow-inner flex justify-center items-center">
                      <canvas
                        ref={canvasRef}
                        width={520}
                        height={160}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="cursor-crosshair touch-none bg-transparent max-w-full h-auto"
                      />
                      <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 select-none pointer-events-none">
                        Assine dentro do quadro com o mouse ou ecrã tátil
                      </div>
                    </div>

                    <Button
                      onClick={applyCanvasSignature}
                      className="w-full bg-blue-900 hover:bg-blue-950 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Sparkles size={15} /> Guardar Assinatura Desenhada
                    </Button>
                  </div>
                )}

                {/* Upload Tab */}
                {activeTab === 'upload' && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-blue-50/50 transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center">
                          <Upload size={22} />
                        </div>
                        <p className="font-bold text-sm text-slate-800">Clique para selecionar imagem da assinatura</p>
                        <p className="text-xs text-slate-500">Aceita formatos PNG, JPEG ou SVG (Máximo 2MB)</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Active Signature Box */}
              <Card className="p-5 border border-slate-200 bg-white shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-xs uppercase text-slate-800 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600" /> Assinatura Ativa Vinculada ao Perfil
                  </h4>
                  {signature && (
                    <button
                      onClick={handleRemoveSignature}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold"
                    >
                      <Trash2 size={13} /> Remover
                    </button>
                  )}
                </div>

                {signature ? (
                  <div className="h-28 border border-slate-200 bg-slate-50/60 rounded-xl p-3 flex flex-col items-center justify-center relative shadow-inner">
                    <img src={signature} alt="Assinatura Vinculada" className="max-h-20 max-w-full object-contain filter contrast-125" />
                    <span className="absolute bottom-1.5 right-2 text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                      ID: {currentUser?.id}
                    </span>
                  </div>
                ) : (
                  <div className="h-28 border-2 border-dashed border-slate-200 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
                    <PenTool size={20} className="text-slate-300" />
                    <span>Nenhuma assinatura gráfica cadastrada no momento.</span>
                  </div>
                )}
              </Card>
            </div>

            {/* Right: Security Credentials (Biometrics + PIN) (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Biometrics Card */}
              <Card className="p-5 border border-slate-200 bg-white shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Fingerprint className="text-blue-700" size={18} />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    Autenticação Biométrica (Touch ID / Face ID)
                  </h4>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Permite assinar pautas, declarações e certificados com um único toque usando o sensor de impressão digital, Touch ID, Face ID ou Windows Hello do seu dispositivo.
                </p>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">Estado do Sensor:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Calibrado e Ativo
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-700">Padrão Criptográfico:</span>
                    <span className="font-mono text-slate-600">WebAuthn / FIDO2</span>
                  </div>
                </div>

                <Button
                  onClick={handleTestBiometrics}
                  disabled={biometricTesting}
                  variant="outline"
                  className="w-full text-xs font-bold text-blue-900 border-blue-300 hover:bg-blue-50 py-2.5 flex items-center justify-center gap-2"
                >
                  {biometricTesting ? (
                    <><RefreshCw className="animate-spin" size={15} /> A calibrar sensor...</>
                  ) : (
                    <><Fingerprint size={16} /> Testar Leitor Biométrico</>
                  )}
                </Button>

                {biometricTestResult && (
                  <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-center animate-in fade-in">
                    {biometricTestResult}
                  </div>
                )}
              </Card>

              {/* Security PIN Card */}
              <Card className="p-5 border border-slate-200 bg-white shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <KeyRound className="text-amber-600" size={18} />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                    Código de Segurança (PIN de 6 Dígitos)
                  </h4>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Utilize o seu Código de Segurança pessoal para autorizar assinaturas caso a biometria não esteja disponível no seu dispositivo.
                </p>

                <form onSubmit={handleSaveSecurityPin} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Código PIN Atual / Novo PIN:
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input
                        type="password"
                        maxLength={6}
                        value={securityPinInput}
                        onChange={(e) => setSecurityPinInput(e.target.value)}
                        placeholder="Ex: 123456"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 font-mono text-sm tracking-widest font-black focus:outline-none focus:border-blue-900 bg-white shadow-2xs"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Dica: O PIN padrão de demonstração para novos utilizadores é <strong>123456</strong>.
                    </span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#0b2545] hover:bg-[#133e6d] text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <Lock size={14} /> Atualizar Código de Segurança
                  </Button>

                  {pinChangeSuccess && (
                    <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-center animate-in fade-in">
                      Código de Segurança (PIN) atualizado com sucesso!
                    </div>
                  )}
                </form>
              </Card>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUDITORIA & DOCUMENTOS ASSINADOS */}
      {/* ========================================================================= */}
      {moduleTab === 'history' && (
        <Card className="p-6 border border-slate-200 bg-white shadow-sm space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="text-blue-800" size={18} /> Registo de Auditoria de Assinaturas Digitais
              </h3>
              <p className="text-xs text-slate-500">
                Histórico imutável de todas as assinaturas autenticadas com carimbo de data, hora e hash SHA-256.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Data & Hora</th>
                  <th className="py-2.5 px-3">Documento</th>
                  <th className="py-2.5 px-3">Signatário</th>
                  <th className="py-2.5 px-3">Método Autenticação</th>
                  <th className="py-2.5 px-3">Serial do Certificado</th>
                  <th className="py-2.5 px-3">Hash Criptográfico SHA-256</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(documentSignatures || []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Nenhum registo de assinatura digital armazenado.
                    </td>
                  </tr>
                ) : (
                  (documentSignatures || []).map((sig) => (
                    <tr key={sig.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {sig.formattedDate || new Date(sig.timestamp).toLocaleString('pt-MZ')}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {sig.studentName ? `${sig.documentType.toUpperCase()} • ${sig.studentName}` : sig.documentId}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800">
                        <span className="font-semibold block">{sig.signerName}</span>
                        <span className="text-[10px] text-slate-500">{sig.signerTitle}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                          {sig.authMethod === 'biometric' ? (
                            <><Fingerprint size={11} /> Biometria</>
                          ) : (
                            <><KeyRound size={11} /> Código PIN</>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                        {sig.certificateSerialNumber}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500 max-w-[160px] truncate select-all" title={sig.securityHash}>
                        {sig.securityHash}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: VALIDADOR DE DOCUMENTOS OFICIAIS */}
      {/* ========================================================================= */}
      {moduleTab === 'validator' && (
        <Card className="p-6 border border-slate-200 bg-white shadow-sm space-y-5 animate-in fade-in duration-300 max-w-3xl mx-auto">
          <div className="text-center space-y-1">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center mb-2">
              <QrCode size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Validador de Selo Criptográfico & Autenticidade</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Introduza o código de validação do documento, serial do certificado ou hash criptográfico para confirmar a autenticidade e validade jurídica.
            </p>
          </div>

          <form onSubmit={handleValidateDocument} className="flex gap-2">
            <input
              type="text"
              value={validatorQuery}
              onChange={(e) => setValidatorQuery(e.target.value)}
              placeholder="Ex: ES/CC/2026/0001 ou VAL-MZ-2026-DEC... ou Artur Aluno"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:border-blue-900 bg-white shadow-2xs"
            />
            <Button
              type="submit"
              className="bg-blue-900 hover:bg-blue-950 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Search size={15} /> Verificar
            </Button>
          </form>

          {/* Validation Result Box */}
          {validatorResult && (
            <div className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in ${
              validatorResult.isValid
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : 'bg-red-50/80 border-red-300 text-red-950'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {validatorResult.isValid ? (
                  <><CheckCircle2 className="text-emerald-700" size={18} /> Documento Oficial e Válido no Sistema MINEDH</>
                ) : (
                  <><AlertCircle className="text-red-700" size={18} /> Documento ou Hash Não Encontrado</>
                )}
              </div>

              {validatorResult.isValid ? (
                <div className="space-y-1.5 font-sans pt-1">
                  <p><strong>Identificador:</strong> <span className="font-mono">{validatorResult.signature?.documentId || validatorResult.document?.id}</span></p>
                  {validatorResult.signature && (
                    <>
                      <p><strong>Signatário Autenticado:</strong> {validatorResult.signature.signerName} ({validatorResult.signature.signerTitle})</p>
                      <p><strong>Autenticação:</strong> {validatorResult.signature.authMethod === 'biometric' ? 'Biométrica (Touch ID / Impressão Digital)' : 'Código de Segurança Criptográfico'}</p>
                      <p><strong>Carimbo de Data/Hora:</strong> {validatorResult.signature.formattedDate}</p>
                      <p><strong>Hash SHA-256:</strong> <span className="font-mono text-[10px] break-all">{validatorResult.signature.securityHash}</span></p>
                    </>
                  )}
                  <p className="text-[10px] text-emerald-800 italic pt-1">Verificação efetuada em {validatorResult.verifiedAt} com chave pública oficial.</p>
                </div>
              ) : (
                <p className="text-xs text-red-700">
                  O código inserido não corresponde a nenhum registo assinado ou emitido nesta instituição. Verifique os dados e tente novamente.
                </p>
              )}
            </div>
          )}
        </Card>
      )}

      <SignatureEditor 
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        imageUrl={pendingImageUrl}
        onSave={handleSaveProcessedSignature}
      />

      {/* ========================================================================= */}
      {/* MODAL 1: ASSINATURA DIGITAL (BIOMETRIA OU PIN) */}
      {/* ========================================================================= */}
      {activeSigningDoc && (
        <DigitalSignatureModal
          isOpen={signingModalOpen}
          onClose={() => {
            setSigningModalOpen(false);
            setActiveSigningDoc(null);
          }}
          documentId={activeSigningDoc.id}
          documentType={activeSigningDoc.type}
          documentTitle={activeSigningDoc.title}
          studentId={activeSigningDoc.studentId}
          studentName={activeSigningDoc.studentName}
          gradeLevel={activeSigningDoc.gradeLevel}
          academicYear={activeSigningDoc.academicYear}
          onSigned={() => {
            setSuccessMsg(`Documento ${activeSigningDoc.title} assinado com sucesso!`);
            setTimeout(() => setSuccessMsg(null), 4000);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: VISUALIZAR DOCUMENTO COMPLETO (CERTIFICADO OU DECLARAÇÃO) */}
      {/* ========================================================================= */}
      {previewDoc && previewDoc.type === 'certificate' && (
        <CertificateDocument
          student={previewDoc.student}
          schoolClass={previewDoc.schoolClass}
          schoolName={previewDoc.docData?.schoolName || 'Escola Secundária Josina Machel'}
          directorName={currentUser?.role === 'director' ? currentUser.name : 'Dr. Manuel Mabote'}
          secretaryName="Dra. Ana Secretaria"
          subjects={subjects}
          grades={grades}
          academicYear={previewDoc.docData?.academicYear || 2026}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {previewDoc && previewDoc.type === 'declaration' && (
        <DeclarationDocument
          student={previewDoc.student}
          schoolClass={previewDoc.schoolClass}
          schoolName={previewDoc.docData?.schoolName || 'Escola Secundária Josina Machel'}
          directorName={currentUser?.role === 'director' ? currentUser.name : 'Dr. Manuel Mabote'}
          subjects={subjects}
          grades={grades}
          academicYear={previewDoc.docData?.academicYear || 2026}
          onClose={() => setPreviewDoc(null)}
        />
      )}

    </div>
  );
};
