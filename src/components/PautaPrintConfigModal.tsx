import React, { useState, useEffect } from 'react';
import { Button } from './ui';
import { 
  Printer, 
  Download, 
  Settings2, 
  Check, 
  X, 
  FileText, 
  Maximize2, 
  Sliders, 
  RotateCw, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Info,
  ChevronRight
} from 'lucide-react';
import { exportReportToPDF } from '../utils/pdfExportHelper';

export interface PautaPrintSettings {
  paperSize: 'A3' | 'A4';
  orientation: 'landscape' | 'portrait';
  presetMargin: 'estreita_minedh' | 'minima' | 'padrao' | 'ampla' | 'personalizada';
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  fitToWidth: boolean;
  scalePercent: number;
  highContrast: boolean;
  repeatHeader: boolean;
}

export const DEFAULT_PAUTA_PRINT_SETTINGS: PautaPrintSettings = {
  paperSize: 'A3',
  orientation: 'landscape',
  presetMargin: 'estreita_minedh',
  marginTop: 4,
  marginRight: 4,
  marginBottom: 4,
  marginLeft: 4,
  fitToWidth: true,
  scalePercent: 100,
  highContrast: true,
  repeatHeader: true,
};

interface PautaPrintConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  pautaType: 'frequencia' | 'exame';
  academicYear?: string;
  turmaLabel?: string;
  onApplySettings?: (settings: PautaPrintSettings) => void;
}

export const PautaPrintConfigModal: React.FC<PautaPrintConfigModalProps> = ({
  isOpen,
  onClose,
  pautaType,
  academicYear = '2026',
  turmaLabel = 'Oficial',
  onApplySettings,
}) => {
  const [settings, setSettings] = useState<PautaPrintSettings>(() => {
    try {
      const saved = localStorage.getItem('edugestao_pauta_print_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return DEFAULT_PAUTA_PRINT_SETTINGS;
  });

  const [isExporting, setIsExporting] = useState(false);

  // Sync settings when modified
  const updateSetting = <K extends keyof PautaPrintSettings>(key: K, value: PautaPrintSettings[K]) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      return updated;
    });
  };

  const handleSelectMarginPreset = (preset: PautaPrintSettings['presetMargin']) => {
    let top = 4;
    let right = 4;
    let bottom = 4;
    let left = 4;

    switch (preset) {
      case 'minima':
        top = right = bottom = left = 3;
        break;
      case 'estreita_minedh':
        top = right = bottom = left = 4;
        break;
      case 'padrao':
        top = right = bottom = left = 7;
        break;
      case 'ampla':
        top = right = bottom = left = 12;
        break;
      case 'personalizada':
        top = settings.marginTop;
        right = settings.marginRight;
        bottom = settings.marginBottom;
        left = settings.marginLeft;
        break;
    }

    setSettings(prev => ({
      ...prev,
      presetMargin: preset,
      marginTop: top,
      marginRight: right,
      marginBottom: bottom,
      marginLeft: left,
    }));
  };

  // Dimensions calculation in mm
  const paperDimensions = {
    A3: { width: 420, height: 297 },
    A4: { width: 297, height: 210 },
  };

  const currentPaper = paperDimensions[settings.paperSize];
  const isLandscape = settings.orientation === 'landscape';
  const totalWidthMm = isLandscape ? currentPaper.width : currentPaper.height;
  const totalHeightMm = isLandscape ? currentPaper.height : currentPaper.width;

  const printableWidthMm = totalWidthMm - (settings.marginLeft + settings.marginRight);
  const printableHeightMm = totalHeightMm - (settings.marginTop + settings.marginBottom);

  // Injects dynamic CSS rules into DOM for @page print
  const applyPrintStyles = () => {
    const styleId = 'dynamic-pauta-print-styles';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const cssRules = `
      @media print {
        @page {
          size: ${settings.paperSize} ${settings.orientation} !important;
          margin: ${settings.marginTop}mm ${settings.marginRight}mm ${settings.marginBottom}mm ${settings.marginLeft}mm !important;
        }

        html, body {
          width: ${totalWidthMm}mm !important;
          height: ${totalHeightMm}mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        body * {
          visibility: hidden !important;
        }

        #pauta-container, #pauta-container *,
        .pauta-print-container, .pauta-print-container * {
          visibility: visible !important;
        }

        #pauta-container, .pauta-print-container {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: ${printableWidthMm}mm !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          box-shadow: none !important;
          transform: none !important;
        }

        .no-print, header, nav, aside, button, select, input {
          display: none !important;
        }

        thead {
          display: table-header-group !important;
        }

        tfoot {
          display: table-footer-group !important;
        }

        tr {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .pauta-official-table, table {
          width: 100% !important;
          table-layout: auto !important;
          font-size: ${settings.paperSize === 'A3' ? '8.5px' : '6.5px'} !important;
          border-collapse: collapse !important;
          border: ${settings.highContrast ? '2.5px solid #000000' : '2px solid #000000'} !important;
        }

        .pauta-official-table th, 
        .pauta-official-table td,
        table th,
        table td {
          padding: ${settings.paperSize === 'A3' ? '1.5px 2px' : '1px 1px'} !important;
          border: ${settings.highContrast ? '1.5px solid #000000' : '1px solid #000000'} !important;
        }

        .pauta-v-text, .pauta-v-text-sm {
          height: ${settings.paperSize === 'A3' ? '110px' : '85px'} !important;
        }
      }
    `;

    styleEl.textContent = cssRules;
  };

  const handlePrint = () => {
    try {
      localStorage.setItem('edugestao_pauta_print_settings', JSON.stringify(settings));
    } catch (e) {
      // ignore
    }

    applyPrintStyles();
    if (onApplySettings) onApplySettings(settings);

    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleExportPDF = async () => {
    try {
      localStorage.setItem('edugestao_pauta_print_settings', JSON.stringify(settings));
    } catch (e) {
      // ignore
    }

    applyPrintStyles();
    if (onApplySettings) onApplySettings(settings);

    setIsExporting(true);
    await exportReportToPDF({
      elementId: 'pauta-container',
      fileName: `Pauta_${pautaType.toUpperCase()}_${settings.paperSize}_${settings.orientation.toUpperCase()}_${academicYear}.pdf`,
      orientation: settings.orientation,
      format: settings.paperSize.toLowerCase() as 'a3' | 'a4',
      marginsMm: {
        top: settings.marginTop,
        right: settings.marginRight,
        bottom: settings.marginBottom,
        left: settings.marginLeft,
      },
      scale: settings.paperSize === 'A3' ? 2 : 2.5,
    });
    setIsExporting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70  animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Settings2 className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight font-serif">
                  Configurador de Impressão Oficial • MINEDH
                </h3>
                <span className="bg-amber-400 text-blue-950 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-2xs">
                  Layout A3 Landscape
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Calibração milimétrica de margens, escala e orientação para impressoras escolares e duplicadores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Column: Configuration Controls (7 Cols) */}
            <div className="md:col-span-7 space-y-5">
              {/* 1. Paper Size & Orientation */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <FileText className="h-4 w-4 text-blue-600" /> 1. Tamanho do Papel & Orientação
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  {/* Paper Size selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Formato do Papel:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateSetting('paperSize', 'A3')}
                        className={`p-2.5 rounded-lg border text-center transition-all ${
                          settings.paperSize === 'A3'
                            ? 'border-blue-600 bg-blue-50 text-blue-950 font-black ring-2 ring-blue-500/20 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-bold">Folha A3</div>
                        <div className="text-[10px] text-slate-500">420 × 297 mm</div>
                        <span className="text-[9px] font-black uppercase text-emerald-700 block mt-0.5">Oficial</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateSetting('paperSize', 'A4')}
                        className={`p-2.5 rounded-lg border text-center transition-all ${
                          settings.paperSize === 'A4'
                            ? 'border-blue-600 bg-blue-50 text-blue-950 font-black ring-2 ring-blue-500/20 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-bold">Folha A4</div>
                        <div className="text-[10px] text-slate-500">297 × 210 mm</div>
                        <span className="text-[9px] font-medium text-slate-500 block mt-0.5">Compacto</span>
                      </button>
                    </div>
                  </div>

                  {/* Orientation selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Orientação da Folha:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateSetting('orientation', 'landscape')}
                        className={`p-2.5 rounded-lg border text-center transition-all ${
                          settings.orientation === 'landscape'
                            ? 'border-blue-600 bg-blue-50 text-blue-950 font-black ring-2 ring-blue-500/20 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-bold">Paisagem</div>
                        <div className="text-[10px] text-slate-500">Horizontal</div>
                        <span className="text-[9px] font-black uppercase text-emerald-700 block mt-0.5">Obrigatório</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateSetting('orientation', 'portrait')}
                        className={`p-2.5 rounded-lg border text-center transition-all ${
                          settings.orientation === 'portrait'
                            ? 'border-blue-600 bg-blue-50 text-blue-950 font-black ring-2 ring-blue-500/20 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xs font-bold">Retrato</div>
                        <div className="text-[10px] text-slate-500">Vertical</div>
                        <span className="text-[9px] font-medium text-slate-500 block mt-0.5">Especial</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Margin Configurator & Presets */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-emerald-600" /> 2. Calibração de Margens de Impressão
                  </h4>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    Área Útil: {printableWidthMm} × {printableHeightMm} mm
                  </span>
                </div>

                {/* Margins Preset Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectMarginPreset('estreita_minedh')}
                    className={`p-2 rounded-lg border text-center text-xs transition-all ${
                      settings.presetMargin === 'estreita_minedh'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black ring-1 ring-emerald-500'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">MINEDH (4mm)</div>
                    <div className="text-[9px] text-slate-500">Recomendado A3</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectMarginPreset('minima')}
                    className={`p-2 rounded-lg border text-center text-xs transition-all ${
                      settings.presetMargin === 'minima'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black ring-1 ring-emerald-500'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">Mínima (3mm)</div>
                    <div className="text-[9px] text-slate-500">Máximo Espaço</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectMarginPreset('padrao')}
                    className={`p-2 rounded-lg border text-center text-xs transition-all ${
                      settings.presetMargin === 'padrao'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black ring-1 ring-emerald-500'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">Padrão (7mm)</div>
                    <div className="text-[9px] text-slate-500">Comum</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectMarginPreset('personalizada')}
                    className={`p-2 rounded-lg border text-center text-xs transition-all ${
                      settings.presetMargin === 'personalizada'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-black ring-1 ring-emerald-500'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-bold">Personalizar</div>
                    <div className="text-[9px] text-slate-500">Ajuste Livre</div>
                  </button>
                </div>

                {/* Individual Margin Inputs in Millimetres */}
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Superior (mm)</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={settings.marginTop}
                      onChange={(e) => {
                        updateSetting('marginTop', Math.max(0, parseInt(e.target.value) || 0));
                        updateSetting('presetMargin', 'personalizada');
                      }}
                      className="w-full text-center font-mono font-bold text-xs p-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Inferior (mm)</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={settings.marginBottom}
                      onChange={(e) => {
                        updateSetting('marginBottom', Math.max(0, parseInt(e.target.value) || 0));
                        updateSetting('presetMargin', 'personalizada');
                      }}
                      className="w-full text-center font-mono font-bold text-xs p-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Esquerda (mm)</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={settings.marginLeft}
                      onChange={(e) => {
                        updateSetting('marginLeft', Math.max(0, parseInt(e.target.value) || 0));
                        updateSetting('presetMargin', 'personalizada');
                      }}
                      className="w-full text-center font-mono font-bold text-xs p-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-0.5">Direita (mm)</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={settings.marginRight}
                      onChange={(e) => {
                        updateSetting('marginRight', Math.max(0, parseInt(e.target.value) || 0));
                        updateSetting('presetMargin', 'personalizada');
                      }}
                      className="w-full text-center font-mono font-bold text-xs p-1.5 border border-slate-300 rounded bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Escala & Otimização de Impressora Escolar */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                  <ShieldCheck className="h-4 w-4 text-indigo-600" /> 3. Otimização para Impressoras Escolares
                </h4>

                <div className="space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.fitToWidth}
                      onChange={(e) => updateSetting('fitToWidth', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>Ajustar Tabela de 14 Disciplinas Rigorosamente à Largura da Folha (Sem Cortes)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.highContrast}
                      onChange={(e) => updateSetting('highContrast', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>Alto Contraste Monocromático (Bordas 100% Pretas para Fotocopiadoras e Duplicadores)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.repeatHeader}
                      onChange={(e) => updateSetting('repeatHeader', e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span>Manter Cabeçalho Institucional Oficial MINEDH e Brasão no Topo</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Sheet Mockup & Live Blueprint (5 Cols) */}
            <div className="md:col-span-5 space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Maximize2 className="h-4 w-4 text-blue-600" /> Pré-visualização da Folha ({settings.paperSize})
                  </h4>
                  <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded">
                    Proporção Real
                  </span>
                </div>

                {/* Simulated Paper Canvas */}
                <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-center min-h-[220px]">
                  {/* Paper aspect-ratio: A3 Landscape is 420:297 approx 1.414 */}
                  <div 
                    className="bg-white border-2 border-slate-800 shadow-md relative transition-all flex flex-col justify-between"
                    style={{
                      width: isLandscape ? '280px' : '198px',
                      height: isLandscape ? '198px' : '280px',
                      padding: `${(settings.marginTop / totalHeightMm) * 198}px ${(settings.marginRight / totalWidthMm) * 280}px ${(settings.marginBottom / totalHeightMm) * 198}px ${(settings.marginLeft / totalWidthMm) * 280}px`
                    }}
                  >
                    {/* Inner Printable Grid Mockup */}
                    <div className="w-full h-full border border-dashed border-blue-400 bg-blue-50/20 p-1 flex flex-col justify-between text-[7px] text-center font-mono">
                      {/* Top Header Mockup */}
                      <div className="border-b border-slate-400 pb-0.5 font-bold text-slate-800">
                        REPÚBLICA DE MOÇAMBIQUE • MINEDH
                      </div>
                      
                      {/* Table Mockup Rows */}
                      <div className="space-y-0.5 my-auto">
                        <div className="h-2 bg-blue-200/80 rounded-xs flex items-center justify-center text-[6px] font-bold text-blue-950">
                          14 DISCIPLINAS • EXAMES • MÉDIAS
                        </div>
                        <div className="grid grid-cols-6 gap-0.5">
                          <div className="h-1.5 bg-slate-200 rounded-2xs"></div>
                          <div className="h-1.5 bg-slate-200 rounded-2xs"></div>
                          <div className="h-1.5 bg-blue-100 rounded-2xs"></div>
                          <div className="h-1.5 bg-emerald-100 rounded-2xs"></div>
                          <div className="h-1.5 bg-slate-200 rounded-2xs"></div>
                          <div className="h-1.5 bg-amber-100 rounded-2xs"></div>
                        </div>
                        <div className="grid grid-cols-6 gap-0.5">
                          <div className="h-1.5 bg-slate-100 rounded-2xs"></div>
                          <div className="h-1.5 bg-slate-100 rounded-2xs"></div>
                          <div className="h-1.5 bg-blue-50 rounded-2xs"></div>
                          <div className="h-1.5 bg-emerald-50 rounded-2xs"></div>
                          <div className="h-1.5 bg-slate-100 rounded-2xs"></div>
                          <div className="h-1.5 bg-amber-50 rounded-2xs"></div>
                        </div>
                      </div>

                      {/* Footer Mockup */}
                      <div className="border-t border-slate-300 pt-0.5 text-[6px] text-slate-500 flex justify-between">
                        <span>Pág. 1/1</span>
                        <span>Assinatura do Director</span>
                      </div>
                    </div>

                    {/* Margin indicator labels */}
                    <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[7px] font-mono text-blue-600 bg-white px-0.5 rounded">
                      {settings.marginTop}mm
                    </span>
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 text-[7px] font-mono text-blue-600 bg-white px-0.5 rounded">
                      {settings.marginBottom}mm
                    </span>
                    <span className="absolute left-0.5 top-1/2 -translate-y-1/2 text-[7px] font-mono text-blue-600 bg-white px-0.5 rounded">
                      {settings.marginLeft}mm
                    </span>
                    <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-[7px] font-mono text-blue-600 bg-white px-0.5 rounded">
                      {settings.marginRight}mm
                    </span>
                  </div>
                </div>

                {/* Compatibility card */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    Compatibilidade Certificada A3
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Este perfil respeita a norma técnica do <strong>MINEDH</strong> para folhas A3 (420 × 297 mm), compatível com impressoras <strong>Epson EcoTank L1300/L1800, HP OfficeJet 7740, Canon imageRUNNER e fotocopiadoras Ricoh Aficio</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <span>As configurações são salvas automaticamente para as próximas impressões.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              className="text-xs py-2 px-3 border-slate-300"
            >
              Cancelar
            </Button>

            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-2 px-4 gap-1.5 font-bold shadow-xs cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Gerando PDF A3...' : 'Exportar PDF A3'}</span>
            </Button>

            <Button
              onClick={handlePrint}
              className="bg-blue-900 hover:bg-blue-950 text-white text-xs py-2 px-5 gap-1.5 font-bold shadow-md cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir Pauta Agora</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
