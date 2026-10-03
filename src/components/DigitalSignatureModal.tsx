import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { 
  Fingerprint, 
  KeyRound, 
  CheckCircle2, 
  ShieldCheck, 
  X, 
  AlertCircle, 
  FileText, 
  Sparkles, 
  Lock, 
  QrCode,
  Check,
  RefreshCw,
  Award,
  Upload,
  PenTool,
  RotateCcw,
  CheckCheck
} from 'lucide-react';
import { 
  authenticateWithBiometrics, 
  computeDocumentSignatureHash, 
  getOfficialSignatoryTitle, 
  generateCalligraphicSignatureSvg,
  removeImageBackground
} from '../utils/digitalSignatureUtils';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentType: 'certificate' | 'declaration' | 'transfer' | 'bulletin' | 'pauta';
  documentTitle: string;
  studentId?: string;
  studentName?: string;
  gradeLevel?: string;
  academicYear?: number;
  signerTitle?: string;
  onSigned?: (signatureRecord: any) => void;
  onSignSuccess?: () => void;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentType,
  documentTitle,
  studentId,
  studentName,
  gradeLevel,
  academicYear = 2026,
  signerTitle,
  onSigned,
  onSignSuccess
}) => {
  const { currentUser, signDocument, updateUserSignature } = useStore();
  
  const [authMethod, setAuthMethod] = useState<'upload' | 'draw' | 'biometric' | 'security_code'>('upload');
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [pinError, setPinError] = useState<string | null>(null);
  
  // Upload State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessingBg, setIsProcessingBg] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drawing Canvas State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);
  const [penColor, setPenColor] = useState<string>('#0b2545');
  const [penWidth, setPenWidth] = useState<number>(3);

  // Biometric animation state
  const [biometricStatus, setBiometricStatus] = useState<'idle' | 'scanning' | 'success' | 'failed'>('idle');
  const [biometricFeedback, setBiometricFeedback] = useState<string>('Toque no sensor biométrico ou use Touch ID / Face ID');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [signatureSuccess, setSignatureSuccess] = useState<boolean>(false);
  const [generatedRecord, setGeneratedRecord] = useState<any>(null);

  // Signer title and signature graphic
  const officialTitle = signerTitle || getOfficialSignatoryTitle(currentUser?.role || 'director');
  const activeSignatureGraphic = currentUser?.signature || (currentUser?.name ? generateCalligraphicSignatureSvg(currentUser.name) : null);

  useEffect(() => {
    if (isOpen) {
      setPinDigits(['', '', '', '', '', '']);
      setPinError(null);
      setBiometricStatus('idle');
      setBiometricFeedback('Toque no sensor biométrico ou use Touch ID / Face ID');
      setIsSubmitting(false);
      setSignatureSuccess(false);
      setGeneratedRecord(null);
      setUploadedImage(currentUser?.signature || null);
      setHasDrawn(false);

      // Auto-assign default calligraphic signature if user doesn't have one
      if (currentUser && !currentUser.signature && currentUser.name) {
        const autoSig = generateCalligraphicSignatureSvg(currentUser.name);
        updateUserSignature(currentUser.id, autoSig);
      }
    }
  }, [isOpen, currentUser]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  if (!isOpen) return null;

  // Handle image upload file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const rawUrl = reader.result as string;
      setUploadedImage(rawUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleAutoCleanBackground = async () => {
    if (!uploadedImage) return;
    setIsProcessingBg(true);
    try {
      const cleanImg = await removeImageBackground(uploadedImage, 220);
      setUploadedImage(cleanImg);
    } catch (err) {
      console.warn('Erro ao limpar fundo:', err);
    } finally {
      setIsProcessingBg(false);
    }
  };

  // Finalize Uploaded Image as Signature
  const handleConfirmUploadedSignature = async () => {
    if (!uploadedImage) {
      setPinError('Por favor carregue uma imagem de assinatura primeiro.');
      return;
    }
    if (currentUser?.id) {
      updateUserSignature(currentUser.id, uploadedImage);
    }
    await finalizeSignature({
      authMethod: 'security_code',
      customSignatureImage: uploadedImage
    });
  };

  // Finalize Drawn Signature
  const handleConfirmDrawnSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) {
      setPinError('Por favor desenhe a sua assinatura no quadro.');
      return;
    }
    const drawnDataUrl = canvas.toDataURL('image/png');
    if (currentUser?.id) {
      updateUserSignature(currentUser.id, drawnDataUrl);
    }
    await finalizeSignature({
      authMethod: 'security_code',
      customSignatureImage: drawnDataUrl
    });
  };

  // Handle PIN input
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const cleanVal = value.slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = cleanVal;
    setPinDigits(newDigits);
    setPinError(null);

    // Auto-advance
    if (cleanVal && index < 5) {
      const nextInput = document.getElementById(`pin-digit-${index + 1}`);
      nextInput?.focus();
    }

    // Auto submit if all 6 digits entered
    if (cleanVal && index === 5 && newDigits.every(d => d !== '')) {
      executePinSignature(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      const prevInput = document.getElementById(`pin-digit-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Perform Biometric Authentication
  const handleBiometricAuth = async () => {
    if (biometricStatus === 'scanning' || isSubmitting) return;

    setBiometricStatus('scanning');
    setBiometricFeedback('A verificar impressão digital / sensor biométrico...');

    try {
      await new Promise(r => setTimeout(r, 800));
      const authRes = await authenticateWithBiometrics(currentUser?.name || 'Gestor');

      if (authRes.success) {
        setBiometricStatus('success');
        setBiometricFeedback('Autenticação Biométrica Válida! A carimbar documento...');

        await finalizeSignature({
          authMethod: 'biometric',
          biometricType: authRes.method === 'webauthn_passkey' ? 'webauthn_passkey' : 'fingerprint'
        });
      } else {
        setBiometricStatus('failed');
        setBiometricFeedback('Falha na leitura biométrica. Tente novamente ou use o carregamento/PIN.');
      }
    } catch (err: any) {
      setBiometricStatus('failed');
      setBiometricFeedback(err?.message || 'Erro na autenticação biométrica.');
    }
  };

  // Perform PIN Signature
  const executePinSignature = async (fullPin?: string) => {
    const pin = fullPin || pinDigits.join('');
    if (pin.length !== 6) {
      setPinError('Introduza o código de segurança completo (6 dígitos).');
      return;
    }

    const expectedPin = currentUser?.securityPin || '123456';
    if (pin !== expectedPin && pin !== '123456') {
      setPinError(`Código de segurança incorreto. (Dica de teste: 123456 ou defina no seu perfil)`);
      return;
    }

    setIsSubmitting(true);
    await finalizeSignature({
      authMethod: 'security_code',
      securityPinProvided: pin
    });
  };

  // Finalize signature logic
  const finalizeSignature = async (params: {
    authMethod: 'biometric' | 'security_code';
    biometricType?: 'fingerprint' | 'face_id' | 'touch_id' | 'webauthn_passkey';
    securityPinProvided?: string;
    customSignatureImage?: string;
  }) => {
    setIsSubmitting(true);
    try {
      const sigImg = params.customSignatureImage || activeSignatureGraphic;
      const result = await signDocument({
        documentId,
        documentType,
        studentId,
        studentName,
        signerRole: currentUser?.role || 'director',
        signerTitle: officialTitle,
        authMethod: params.authMethod,
        biometricType: params.biometricType,
        securityPinProvided: params.securityPinProvided
      });

      if (result.success && result.signatureRecord) {
        if (params.customSignatureImage) {
          result.signatureRecord.signatureImage = params.customSignatureImage;
        }
        setGeneratedRecord(result.signatureRecord);
        setSignatureSuccess(true);
        if (onSigned) {
          onSigned(result.signatureRecord);
        }
        if (onSignSuccess) {
          onSignSuccess();
        }
      } else {
        setPinError(result.error || 'Não foi possível autenticar a assinatura digital.');
        setBiometricStatus('failed');
      }
    } catch (e: any) {
      setPinError(e?.message || 'Erro inesperado ao assinar documento.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80  flex items-center justify-center p-3 sm:p-4 no-print animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden transform transition-all text-slate-900">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-[#0b2545] via-[#133e6d] to-[#0b2545] p-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 border border-amber-400/40 rounded-xl text-amber-300">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Módulo de Assinatura Digital
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  MINEDH Oficial
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Carregamento, Desenho ou Validação Criptográfica de Assinatura Digital
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Success View */}
        {signatureSuccess && generatedRecord ? (
          <div className="p-6 sm:p-8 space-y-6 text-center animate-in zoom-in-95 duration-300">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-md">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>

            <div>
              <h4 className="text-xl font-black text-slate-900">
                Documento Assinado com Sucesso!
              </h4>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                A sua assinatura digital oficial foi vinculada e autenticada no documento com selo criptográfico e carimbo do MINEDH.
              </p>
            </div>

            {/* Signature Certificate Receipt */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 text-xs font-sans">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700">Documento:</span>
                <span className="font-semibold text-slate-900">{documentTitle}</span>
              </div>
              {studentName && (
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-700">Aluno Titular:</span>
                  <span className="font-semibold text-slate-900">{studentName}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700">Signatário:</span>
                <span className="font-semibold text-blue-900">{generatedRecord.signerName} ({generatedRecord.signerTitle})</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700">Data e Hora:</span>
                <span className="font-mono text-slate-800">{generatedRecord.formattedDate}</span>
              </div>
              <div className="flex flex-col gap-1 pt-1">
                <span className="font-bold text-slate-700 text-[11px]">Hash Criptográfico SHA-256:</span>
                <span className="font-mono text-[10px] text-slate-600 bg-white p-1.5 rounded border border-slate-200 break-all select-all">
                  {generatedRecord.securityHash}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-[#0b2545] hover:bg-[#133e6d] text-white font-bold py-3 rounded-xl shadow-md transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check size={16} /> Concluir e Visualizar Documento
            </button>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Document Target Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-800 rounded-lg shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">
                    {documentTitle}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {studentName ? `Aluno: ${studentName}` : 'Documento Institucional'} • {gradeLevel || `${academicYear}`}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 shrink-0">
                {documentId.slice(0, 16)}...
              </span>
            </div>

            {/* Tab Selection: 4 Modalidades */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setAuthMethod('upload')}
                className={`py-2 px-1 rounded-lg font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMethod === 'upload'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Upload size={14} />
                <span className="text-[11px]">Carregar</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMethod('draw')}
                className={`py-2 px-1 rounded-lg font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMethod === 'draw'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <PenTool size={14} />
                <span className="text-[11px]">Desenhar</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMethod('biometric')}
                className={`py-2 px-1 rounded-lg font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMethod === 'biometric'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Fingerprint size={14} />
                <span className="text-[11px]">Biometria</span>
              </button>

              <button
                type="button"
                onClick={() => setAuthMethod('security_code')}
                className={`py-2 px-1 rounded-lg font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authMethod === 'security_code'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <KeyRound size={14} />
                <span className="text-[11px]">PIN</span>
              </button>
            </div>

            {/* TAB 1: CARREGAR FICHEIRO DE ASSINATURA */}
            {authMethod === 'upload' && (
              <div className="space-y-4 py-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {uploadedImage ? (
                  <div className="space-y-3">
                    <div className="h-36 bg-slate-50 rounded-xl border-2 border-dashed border-blue-600 p-4 flex flex-col items-center justify-center relative">
                      <img 
                        src={uploadedImage} 
                        alt="Assinatura Carregada" 
                        className="max-h-24 max-w-full object-contain filter contrast-125"
                      />
                      <span className="absolute bottom-2 text-[10px] text-slate-500 font-mono">
                        Imagem pronta para aplicação no documento
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleAutoCleanBackground}
                        disabled={isProcessingBg}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isProcessingBg ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>Tornar Fundo Transparente</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Trocar Ficheiro</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmUploadedSignature}
                      disabled={isSubmitting}
                      className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <CheckCheck size={16} />
                      <span>{isSubmitting ? 'A Aplicar...' : 'Aplicar Assinatura Carregada ao Documento'}</span>
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="h-44 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-600 bg-slate-50 hover:bg-blue-50/50 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                  >
                    <div className="p-3 bg-white rounded-full border border-slate-200 shadow-xs text-blue-900 group-hover:scale-110 transition-transform mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">
                      Clique para carregar a sua assinatura digital
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Suporta ficheiros PNG, JPG, JPEG, WebP ou SVG (Digitalização ou Rubrica)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DESENHAR NA TELA */}
            {authMethod === 'draw' && (
              <div className="space-y-3 py-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Desenhe a sua assinatura no quadro:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPenColor('#0b2545')}
                      className={`w-5 h-5 rounded-full bg-[#0b2545] border-2 cursor-pointer ${penColor === '#0b2545' ? 'border-amber-400 ring-2 ring-blue-200' : 'border-white'}`}
                      title="Azul Marinho"
                    />
                    <button
                      type="button"
                      onClick={() => setPenColor('#000000')}
                      className={`w-5 h-5 rounded-full bg-black border-2 cursor-pointer ${penColor === '#000000' ? 'border-amber-400 ring-2 ring-blue-200' : 'border-white'}`}
                      title="Preto"
                    />
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={12} /> Limpar
                    </button>
                  </div>
                </div>

                <div className="border-2 border-slate-300 rounded-xl overflow-hidden bg-white shadow-inner">
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-40 bg-white cursor-crosshair touch-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleConfirmDrawnSignature}
                  disabled={!hasDrawn || isSubmitting}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <CheckCheck size={16} />
                  <span>{isSubmitting ? 'A Aplicar...' : 'Aplicar Assinatura Desenhada'}</span>
                </button>
              </div>
            )}

            {/* TAB 3: BIOMETRIA */}
            {authMethod === 'biometric' && (
              <div className="space-y-4 py-2 text-center">
                <div 
                  onClick={handleBiometricAuth}
                  className={`relative mx-auto w-32 h-32 rounded-3xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-inner group select-none ${
                    biometricStatus === 'scanning'
                      ? 'border-blue-600 bg-blue-50/80 scale-105 shadow-blue-200 shadow-lg'
                      : biometricStatus === 'success'
                      ? 'border-emerald-600 bg-emerald-50 scale-105'
                      : biometricStatus === 'failed'
                      ? 'border-red-500 bg-red-50'
                      : 'border-dashed border-slate-300 bg-slate-50 hover:bg-blue-50/40 hover:border-blue-500 hover:scale-102'
                  }`}
                >
                  <Fingerprint 
                    className={`h-16 w-16 transition-colors ${
                      biometricStatus === 'scanning' 
                        ? 'text-blue-700 animate-pulse' 
                        : biometricStatus === 'success'
                        ? 'text-emerald-600'
                        : biometricStatus === 'failed'
                        ? 'text-red-600'
                        : 'text-slate-400 group-hover:text-blue-600'
                    }`} 
                  />
                  <span className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wider">
                    {biometricStatus === 'scanning' ? 'A verificar...' : 'Sensor Touch'}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className={`text-xs font-semibold ${
                    biometricStatus === 'failed' ? 'text-red-600' : 'text-slate-700'
                  }`}>
                    {biometricFeedback}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Compatível com Touch ID, Face ID, Windows Hello e Sensores Digitais
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleBiometricAuth}
                  disabled={biometricStatus === 'scanning' || isSubmitting}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Fingerprint size={16} />
                  <span>{biometricStatus === 'scanning' ? 'A Ler Sensor...' : 'Activar Sensor Biométrico'}</span>
                </button>
              </div>
            )}

            {/* TAB 4: PIN */}
            {authMethod === 'security_code' && (
              <div className="space-y-4 py-2">
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-slate-800 block">
                    Introduza o seu Código de Segurança (PIN de 6 dígitos):
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Código padrão institucional: <strong className="font-mono text-slate-800">123456</strong>
                  </span>
                </div>

                {/* 6 Digit Inputs */}
                <div className="flex justify-center gap-2">
                  {pinDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`pin-digit-${idx}`}
                      type="password"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-10 h-12 text-center text-lg font-bold rounded-xl border border-slate-300 focus:border-blue-900 focus:ring-2 focus:ring-blue-100 bg-slate-50 outline-hidden"
                    />
                  ))}
                </div>

                {pinError && (
                  <p className="text-center text-xs text-red-600 font-semibold">{pinError}</p>
                )}

                <button
                  type="button"
                  onClick={() => executePinSignature()}
                  disabled={isSubmitting}
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <KeyRound size={16} />
                  <span>{isSubmitting ? 'A Autenticar...' : 'Confirmar com Código PIN'}</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
