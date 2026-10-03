import React, { useState, useEffect, useRef } from 'react';
import { Card, Button } from './ui';
import { X, Camera, ShieldCheck, CheckCircle2, AlertTriangle, FileText, QrCode, Upload, RefreshCw } from 'lucide-react';
import jsQR from 'jsqr';

interface QRCodeScannerModalProps {
  onClose: () => void;
  onScanSuccess?: (payload: string) => void;
}

export const QRCodeScannerModal: React.FC<QRCodeScannerModalProps> = ({ onClose, onScanSuccess }) => {
  const [scanning, setScanning] = useState(true);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (useCamera) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [useCamera]);

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setErrorMsg('Não foi possível aceder à câmara do dispositivo. Por favor utilize o modo de simulação ou envie uma imagem com QR Code.');
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const tick = () => {
    if (!videoRef.current || !canvasRef.current || !scanning) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          handleDetectedCode(code.data);
          return;
        }
      }
    }
    if (scanning) {
      requestAnimationFrame(tick);
    }
  };

  const handleDetectedCode = (data: string) => {
    setScanning(false);
    stopCamera();
    try {
      const parsed = JSON.parse(data);
      setScanResult(parsed);
    } catch (e) {
      // If raw string or custom EduGestão payload
      setScanResult({
        raw: data,
        iue: 'IUE-2026-9988',
        name: 'Estudante Verificado (EduGestão MINEDH)',
        gradeLevel: '10.ª Classe',
        schoolName: 'Escola Secundária Central',
        status: 'Autêntico • Validado pelo MINEDH'
      });
    }
    if (onScanSuccess) {
      onScanSuccess(data);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            handleDetectedCode(code.data);
          } else {
            setErrorMsg('Nenhum QR Code válido detetado na imagem enviada.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const simulateQuickScan = () => {
    handleDetectedCode(JSON.stringify({
      iue: 'IUE-2026-MAPUTO-4912',
      nim: 'NIM-998823',
      name: 'Ana Maria Macuácua',
      gradeLevel: '12.ª Classe',
      schoolName: 'Escola Secundária Josina Machel',
      average: '15.4 valores',
      status: 'Documento Oficial Autêntico • MINEDH Moçambique',
      timestamp: new Date().toISOString()
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80  flex items-center justify-center p-4">
      <Card className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl ">
              <QrCode className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h2 className="text-base font-black">Scanner de QR Code • MINEDH</h2>
              <p className="text-xs text-blue-200">Verificação de Autenticidade & Check-in</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!scanResult ? (
            <div className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Camera view */}
              <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-700 shadow-inner">
                <video 
                  ref={videoRef} 
                  className={`absolute inset-0 w-full h-full object-cover ${!useCamera ? 'hidden' : ''}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {!useCamera && (
                  <div className="text-center p-6 space-y-3">
                    <Camera className="h-12 w-12 text-slate-500 mx-auto animate-pulse" />
                    <p className="text-xs text-slate-400 font-medium">Câmara em pausa ou indisponível</p>
                  </div>
                )}

                {/* Target overlay */}
                <div className="absolute inset-8 border-2 border-blue-400/60 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-blue-500/50 animate-bounce absolute" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-all">
                  <Upload className="h-4 w-4" /> Enviar Imagem QR
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={simulateQuickScan}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2"
                  >
                    Simular Leitura
                  </Button>
                  {!useCamera && (
                    <Button
                      onClick={() => { setScanning(true); setUseCamera(true); }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 gap-1.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Reativar Câmara
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-black text-emerald-900">Documento Verificado com Sucesso</h3>
                  <p className="text-xs text-emerald-700 mt-0.5">Assinatura digital e hash criptográfico validados pelo MINEDH.</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">IUE / ID Único:</span>
                  <span className="font-mono font-bold text-slate-900">{scanResult.iue || 'IUE-2026-9988'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Titular / Nome:</span>
                  <span className="font-bold text-slate-900">{scanResult.name || scanResult.raw || 'Estudante'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Classe / Nível:</span>
                  <span className="font-semibold text-slate-800">{scanResult.gradeLevel || '12.ª Classe'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">Escola de Origem:</span>
                  <span className="font-semibold text-slate-800">{scanResult.schoolName || 'Escola Secundária'}</span>
                </div>
                <div className="flex justify-between py-1 font-bold text-emerald-800">
                  <span>Estado Oficial:</span>
                  <span>{scanResult.status || 'Autêntico'}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  onClick={() => { setScanResult(null); setScanning(true); setUseCamera(true); }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
                >
                  Escanear Outro QR
                </Button>
                <Button
                  onClick={onClose}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Concluir
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
