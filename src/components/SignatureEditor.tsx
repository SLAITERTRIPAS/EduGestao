import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Check, RefreshCw, Eraser, Move, Maximize, 
  Sparkles, Save, Info, AlertCircle, RotateCcw, MousePointer2
} from 'lucide-react';
import { removeImageBackground } from '../utils/digitalSignatureUtils';

interface SignatureEditorProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (processedImageUrl: string) => void;
}

export const SignatureEditor: React.FC<SignatureEditorProps> = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  onSave 
}) => {
  const [processedUrl, setProcessedUrl] = useState<string>(imageUrl);
  const [threshold, setThreshold] = useState<number>(220);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [originalUrl, setOriginalUrl] = useState<string>(imageUrl);
  const [editMode, setEditMode] = useState<'view' | 'erase'>('view');
  const [brushSize, setBrushSize] = useState<number>(20);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef<boolean>(false);

  // Update when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      setOriginalUrl(imageUrl);
      setProcessedUrl(imageUrl);
      setEditMode('view');
    }
  }, [imageUrl]);

  // Load image into canvas for editing
  useEffect(() => {
    if (isOpen && processedUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // Set canvas size based on image but maintain aspect ratio in container
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        ctx?.drawImage(img, 0, 0);
      };
      img.src = processedUrl;
    }
  }, [isOpen, processedUrl, editMode]);

  const handleRemoveBackground = async () => {
    setIsProcessing(true);
    try {
      const result = await removeImageBackground(originalUrl, threshold);
      setProcessedUrl(result);
      setEditMode('view');
    } catch (err) {
      console.error('Erro ao remover fundo:', err);
      alert('Não foi possível processar a imagem.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (editMode !== 'erase') return;
    isDrawing.current = true;
    draw(e);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    if (canvasRef.current) {
      setProcessedUrl(canvasRef.current.toDataURL('image/png'));
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !canvasRef.current || editMode !== 'erase') return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleReset = () => {
    setProcessedUrl(originalUrl);
    setEditMode('view');
  };

  const handleSave = () => {
    // If we're in erase mode, use the current canvas content
    if (canvasRef.current && editMode === 'erase') {
      onSave(canvasRef.current.toDataURL('image/png'));
    } else {
      onSave(processedUrl);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80  p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-wider">Canva de Assinatura Digital</h3>
              <p className="text-[10px] text-slate-400">Remoção de fundo inteligente e retoque manual</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Main Editing Area */}
          <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-100/50 overflow-auto">
            <div className="space-y-2 w-full max-w-2xl">
              <div className="flex items-center justify-between px-1">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                  {editMode === 'erase' ? 'Modo de Limpeza Manual' : 'Pré-visualização do Resultado'}
                </p>
                {editMode === 'erase' && (
                  <span className="text-[10px] text-slate-500 italic">Arraste o rato para apagar áreas indesejadas</span>
                )}
              </div>
              
              <div 
                className={`relative bg-[url('https://www.transparenttextures.com/patterns/checkerboard.png')] bg-slate-200 rounded-2xl border-2 shadow-inner overflow-hidden flex items-center justify-center min-h-[300px] ${
                  editMode === 'erase' ? 'border-blue-400 cursor-crosshair' : 'border-slate-300'
                }`}
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="animate-spin text-blue-600" size={32} />
                    <span className="text-xs font-bold text-slate-500">A processar fundo...</span>
                  </div>
                ) : (
                  <>
                    {editMode === 'erase' ? (
                      <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <img 
                        src={processedUrl} 
                        alt="Processada" 
                        className="max-h-full max-w-full object-contain shadow-sm" 
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Controls */}
          <div className="w-full md:w-80 bg-slate-50 border-l border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto">
            
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <RefreshCw size={14} /> Ferramentas IA
              </h4>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Sensibilidade</label>
                  <span className="text-xs font-mono font-bold text-blue-700">{threshold}</span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="255" 
                  value={threshold} 
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <button
                  onClick={handleRemoveBackground}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20"
                >
                  <Sparkles size={14} /> Remover Fundo Automático
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Eraser size={14} /> Edição Manual
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setEditMode('view')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                    editMode === 'view' 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MousePointer2 size={18} />
                  <span className="text-[10px] font-bold">Ver</span>
                </button>
                <button
                  onClick={() => setEditMode('erase')}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                    editMode === 'erase' 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Eraser size={18} />
                  <span className="text-[10px] font-bold">Apagar</span>
                </button>
              </div>

              {editMode === 'erase' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tamanho do Pincel</label>
                    <span className="text-xs font-mono font-bold text-blue-700">{brushSize}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="100" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              )}

              <button
                onClick={handleReset}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw size={14} /> Restaurar Original
              </button>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-200">
              <button
                onClick={handleSave}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl"
              >
                <Save size={16} /> Salvar Assinatura
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
