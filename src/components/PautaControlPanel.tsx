import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Columns, 
  Eye, 
  EyeOff, 
  Printer, 
  Maximize2, 
  Settings2, 
  Check, 
  RotateCcw, 
  LayoutGrid, 
  Sparkles, 
  Table, 
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Button, Card } from './ui';

export interface PautaColumnVisibility {
  orderNumber: boolean;      // N/O
  studentCode: boolean;      // Código Institucional
  studentName: boolean;      // Nome Completo
  acs1: boolean;             // ACS 1
  acs2: boolean;             // ACS 2
  acs3: boolean;             // ACS 3
  mediaACS: boolean;         // Média Parcial ACS
  trabalho1: boolean;        // Trabalho 1
  trabalho2: boolean;        // Trabalho 2
  mediaTrabalho: boolean;    // Média Parcial Trabalhos
  apt: boolean;              // APT
  mediaFinal: boolean;       // Média Final
  comportamento: boolean;    // Comportamento
  classificacao: boolean;    // Classificação (Transita / Reprova)
  // For exam pautas
  mediaFreq: boolean;        // Média de Frequência / Ciclo
  notaExame: boolean;        // 1ª EPC / Nota de Exame
}

export const DEFAULT_COLUMN_VISIBILITY: PautaColumnVisibility = {
  orderNumber: true,
  studentCode: true,
  studentName: true,
  acs1: true,
  acs2: true,
  acs3: true,
  mediaACS: true,
  trabalho1: true,
  trabalho2: true,
  mediaTrabalho: true,
  apt: true,
  mediaFinal: true,
  comportamento: true,
  classificacao: true,
  mediaFreq: true,
  notaExame: true,
};

export interface PautaCellPaddingConfig {
  preset: 'ultra_compacta' | 'estreita' | 'padrao' | 'ampla' | 'personalizada';
  paddingY: number; // in pixels
  paddingX: number; // in pixels
  fontSize: number; // in pixels
  borderWidth: number; // in pixels
  headerHeight: number; // in pixels
}

export const DEFAULT_CELL_PADDING_CONFIG: PautaCellPaddingConfig = {
  preset: 'estreita',
  paddingY: 3,
  paddingX: 5,
  fontSize: 11,
  borderWidth: 1.5,
  headerHeight: 95,
};

export interface PautaPartialAveragesConfig {
  showMediaACS: boolean;
  showMediaTrabalho: boolean;
  showMediaFreq: boolean;
  showCycleMedias: boolean;
  highlightMediasWithBadges: boolean;
}

export const DEFAULT_PARTIAL_AVERAGES_CONFIG: PautaPartialAveragesConfig = {
  showMediaACS: true,
  showMediaTrabalho: true,
  showMediaFreq: true,
  showCycleMedias: true,
  highlightMediasWithBadges: true,
};

interface PautaControlPanelProps {
  columns: PautaColumnVisibility;
  onChangeColumns: (cols: PautaColumnVisibility) => void;
  cellPadding: PautaCellPaddingConfig;
  onChangeCellPadding: (padding: PautaCellPaddingConfig) => void;
  partialAverages: PautaPartialAveragesConfig;
  onChangePartialAverages: (averages: PautaPartialAveragesConfig) => void;
  onOpenPrintConfigModal?: () => void;
  mode?: 'caderneta' | 'exame' | 'geral';
  turmaLabel?: string;
  subjectLabel?: string;
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
}

export const PautaControlPanel: React.FC<PautaControlPanelProps> = ({
  columns,
  onChangeColumns,
  cellPadding,
  onChangeCellPadding,
  partialAverages,
  onChangePartialAverages,
  onOpenPrintConfigModal,
  mode = 'caderneta',
  turmaLabel,
  subjectLabel,
  isCollapsible = true,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState<'columns' | 'cells' | 'averages' | 'print' | 'preview'>('columns');

  // Count active columns
  const activeColumnsCount = Object.entries(columns).filter(([key, val]) => {
    if (mode === 'exame' && ['acs1', 'acs2', 'acs3', 'trabalho1', 'trabalho2', 'mediaTrabalho', 'apt'].includes(key)) {
      return false;
    }
    if (mode === 'caderneta' && ['mediaFreq', 'notaExame'].includes(key)) {
      return false;
    }
    return Boolean(val);
  }).length;

  const totalPossibleColumns = mode === 'exame' ? 7 : 14;

  // Toggle single column
  const toggleColumn = (key: keyof PautaColumnVisibility) => {
    const updated = { ...columns, [key]: !columns[key] };
    // Synchronize partial averages if mediaACS or mediaTrabalho is toggled
    if (key === 'mediaACS') {
      onChangePartialAverages({ ...partialAverages, showMediaACS: !columns.mediaACS });
    }
    if (key === 'mediaTrabalho') {
      onChangePartialAverages({ ...partialAverages, showMediaTrabalho: !columns.mediaTrabalho });
    }
    onChangeColumns(updated);
  };

  // Presets for columns
  const applyColumnPreset = (preset: 'all' | 'minimal' | 'exams_only' | 'standard') => {
    if (preset === 'all') {
      onChangeColumns(DEFAULT_COLUMN_VISIBILITY);
      onChangePartialAverages({
        ...partialAverages,
        showMediaACS: true,
        showMediaTrabalho: true,
        showMediaFreq: true,
      });
    } else if (preset === 'minimal') {
      // Hide partial averages and extra info for compact printing
      onChangeColumns({
        ...columns,
        orderNumber: true,
        studentCode: true,
        studentName: true,
        acs1: true,
        acs2: true,
        acs3: true,
        mediaACS: false,
        trabalho1: false,
        trabalho2: false,
        mediaTrabalho: false,
        apt: true,
        mediaFinal: true,
        comportamento: false,
        classificacao: true,
      });
      onChangePartialAverages({
        ...partialAverages,
        showMediaACS: false,
        showMediaTrabalho: false,
      });
    } else if (preset === 'standard') {
      onChangeColumns({
        ...DEFAULT_COLUMN_VISIBILITY,
        comportamento: true,
        classificacao: true,
      });
      onChangePartialAverages({
        ...partialAverages,
        showMediaACS: true,
        showMediaTrabalho: true,
      });
    }
  };

  // Presets for cell padding
  const applyPaddingPreset = (preset: PautaCellPaddingConfig['preset']) => {
    let py = 3;
    let px = 5;
    let font = 11;
    let border = 1.5;
    let headerH = 95;

    switch (preset) {
      case 'ultra_compacta':
        py = 1;
        px = 2;
        font = 9.5;
        border = 1;
        headerH = 80;
        break;
      case 'estreita':
        py = 2.5;
        px = 4;
        font = 10.5;
        border = 1.5;
        headerH = 90;
        break;
      case 'padrao':
        py = 4;
        px = 6;
        font = 11.5;
        border = 1.5;
        headerH = 105;
        break;
      case 'ampla':
        py = 6;
        px = 8;
        font = 12.5;
        border = 2;
        headerH = 120;
        break;
      case 'personalizada':
        py = cellPadding.paddingY;
        px = cellPadding.paddingX;
        font = cellPadding.fontSize;
        border = cellPadding.borderWidth;
        headerH = cellPadding.headerHeight;
        break;
    }

    onChangeCellPadding({
      preset,
      paddingY: py,
      paddingX: px,
      fontSize: font,
      borderWidth: border,
      headerHeight: headerH,
    });
  };

  // Toggle partial average setting
  const togglePartialAverage = (key: keyof PautaPartialAveragesConfig) => {
    const updated = { ...partialAverages, [key]: !partialAverages[key] };
    if (key === 'showMediaACS') {
      onChangeColumns({ ...columns, mediaACS: updated.showMediaACS });
    }
    if (key === 'showMediaTrabalho') {
      onChangeColumns({ ...columns, mediaTrabalho: updated.showMediaTrabalho });
    }
    onChangePartialAverages(updated);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden mb-6 no-print transition-all">
      {/* Header Banner */}
      <div 
        className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
        onClick={() => isCollapsible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black uppercase tracking-wider font-serif">
                Painel de Controle de Pautas & Layout de Impressão
              </h3>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded font-sans">
                A3 Landscape MINEDH
              </span>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-0.5">
              {turmaLabel ? `Turma: ${turmaLabel}` : 'Gestão Oficial'} • {subjectLabel ? `Disciplina: ${subjectLabel}` : 'Geral'} • {activeColumnsCount} colunas activas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPrintConfigModal && (
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenPrintConfigModal();
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-1.5 shadow-sm py-1.5 px-3 rounded-lg"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Configurar & Imprimir A3</span>
            </Button>
          )}

          {isCollapsible && (
            <button
              type="button"
              aria-label={isExpanded ? 'Recolher painel' : 'Expandir painel'}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Controls Body */}
      {isExpanded && (
        <div className="p-5 bg-slate-50/70 border-t border-slate-200 space-y-4">
          {/* Quick Sub-navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('columns')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'columns'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Alternar Colunas ({activeColumnsCount}/{totalPossibleColumns})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cells')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'cells'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Margens de Células ({cellPadding.paddingY}px × {cellPadding.paddingX}px)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('averages')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'averages'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Médias Parciais {partialAverages.showMediaACS ? '✓ Ativas' : '✗ Ocultas'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'preview'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Pré-visualização A3 (Landscape)</span>
            </button>

            {onOpenPrintConfigModal && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('print');
                  onOpenPrintConfigModal();
                }}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ml-auto ${
                  activeTab === 'print'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                }`}
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Calibrador de Impressão A3</span>
              </button>
            )}
          </div>

          {/* TAB 1: COLUNAS DINÂMICAS */}
          {activeTab === 'columns' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-600 font-medium">
                  <strong>Controlo de Colunas:</strong> Active ou desactive colunas para otimizar o espaço da folha A3 antes da impressão escolar.
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyColumnPreset('all')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors"
                  >
                    Mostrar Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => applyColumnPreset('minimal')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 rounded border border-amber-300 transition-colors"
                  >
                    Modo Enxuto (Sem Parciais)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyColumnPreset('standard')}
                    className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 rounded border border-blue-300 transition-colors"
                  >
                    Padrão Oficial
                  </button>
                </div>
              </div>

              {/* Grid of Toggle Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {/* 1. N/O */}
                <button
                  type="button"
                  onClick={() => toggleColumn('orderNumber')}
                  className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                    columns.orderNumber
                      ? 'bg-blue-50/80 border-blue-400 text-blue-950 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="text-xs">N/O</span>
                  {columns.orderNumber ? <Eye className="h-3.5 w-3.5 text-blue-600" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                </button>

                {/* 2. Código */}
                <button
                  type="button"
                  onClick={() => toggleColumn('studentCode')}
                  className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                    columns.studentCode
                      ? 'bg-blue-50/80 border-blue-400 text-blue-950 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="text-xs">Cód. Aluno</span>
                  {columns.studentCode ? <Eye className="h-3.5 w-3.5 text-blue-600" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                </button>

                {/* 3. Nome */}
                <button
                  type="button"
                  onClick={() => toggleColumn('studentName')}
                  className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                    columns.studentName
                      ? 'bg-blue-50/80 border-blue-400 text-blue-950 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="text-xs">Nome Aluno</span>
                  {columns.studentName ? <Eye className="h-3.5 w-3.5 text-blue-600" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                </button>

                {mode !== 'exame' && (
                  <>
                    {/* 4. ACS 1 */}
                    <button
                      type="button"
                      onClick={() => toggleColumn('acs1')}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                        columns.acs1
                          ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span className="text-xs">ACS 1</span>
                      {columns.acs1 ? <Eye className="h-3.5 w-3.5 text-indigo-600" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                    </button>

                    {/* 5. ACS 2 */}
                    <button
                      type="button"
                      onClick={() => toggleColumn('acs2')}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                        columns.acs2
                          ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span className="text-xs">ACS 2</span>
                      {columns.acs2 ? <Eye className="h-3.5 w-3.5 text-indigo-600" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                    </button>

                    {/* 6. ACS 3 */}
                    <button
                      type="button"
                      onClick={() => toggleColumn('acs3')}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                        columns.acs3
                          ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span className="text-xs">ACS 3</span>
                      {columns.acs3 ? <Eye className="h-3.5 w-3.5 text-indigo-600" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                    </button>

                    {/* 7. Média ACS (Parcial) */}
                    <button
                      type="button"
                      onClick={() => toggleColumn('mediaACS')}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                        columns.mediaACS
                          ? 'bg-blue-100 border-blue-500 text-blue-950 font-extrabold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span className="text-xs">Média ACS</span>
                      {columns.mediaACS ? <Eye className="h-3.5 w-3.5 text-blue-700" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                    </button>

                    {/* 8. Trab 1 */}
                    <button
                      type="button"
                      onClick={() => toggleColumn('trabalho1')}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                        columns.trabalho1
                          ? 'bg-amber-50/80 border-amber-400 text-amber-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span className="text-xs">Trabalho 1</span>
                      {columns.trabalho1 ? <Eye className="h-3.5 w-3.5 text-amber-600" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                    </button>

                    {/* 9. Trab 2 */}
                    <button
                      type="button"
                      onClick={() => toggleColumn('trabalho2')}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                        columns.trabalho2
                          ? 'bg-amber-50/80 border-amber-400 text-amber-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span className="text-xs">Trabalho 2</span>
                      {columns.trabalho2 ? <Eye className="h-3.5 w-3.5 text-amber-600" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                    </button>

                    {/* 10. Média Trab (Parcial) */}
                    <button
                      type="button"
                      onClick={() => toggleColumn('mediaTrabalho')}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                        columns.mediaTrabalho
                          ? 'bg-amber-100 border-amber-500 text-amber-950 font-extrabold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span className="text-xs">Média Trab.</span>
                      {columns.mediaTrabalho ? <Eye className="h-3.5 w-3.5 text-amber-700" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                    </button>

                    {/* 11. APT */}
                    <button
                      type="button"
                      onClick={() => toggleColumn('apt')}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                        columns.apt
                          ? 'bg-purple-50/80 border-purple-400 text-purple-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span className="text-xs">APT</span>
                      {columns.apt ? <Eye className="h-3.5 w-3.5 text-purple-600" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                    </button>
                  </>
                )}

                {mode === 'exame' && (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleColumn('mediaFreq')}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                        columns.mediaFreq
                          ? 'bg-blue-100 border-blue-500 text-blue-950 font-extrabold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span className="text-xs">M. Freq. / Ciclo</span>
                      {columns.mediaFreq ? <Eye className="h-3.5 w-3.5 text-blue-700" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleColumn('notaExame')}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                        columns.notaExame
                          ? 'bg-indigo-100 border-indigo-500 text-indigo-950 font-extrabold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-400 line-through'
                      }`}
                    >
                      <span className="text-xs">Nota Exame</span>
                      {columns.notaExame ? <Eye className="h-3.5 w-3.5 text-indigo-700" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                    </button>
                  </>
                )}

                {/* 12. Média Final */}
                <button
                  type="button"
                  onClick={() => toggleColumn('mediaFinal')}
                  className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                    columns.mediaFinal
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-black shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="text-xs">Média Final</span>
                  {columns.mediaFinal ? <Eye className="h-3.5 w-3.5 text-emerald-700" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                </button>

                {/* 13. Comportamento */}
                <button
                  type="button"
                  onClick={() => toggleColumn('comportamento')}
                  className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                    columns.comportamento
                      ? 'bg-slate-100 border-slate-400 text-slate-900 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="text-xs">Comport.</span>
                  {columns.comportamento ? <Eye className="h-3.5 w-3.5 text-slate-700" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                </button>

                {/* 14. Classificação */}
                <button
                  type="button"
                  onClick={() => toggleColumn('classificacao')}
                  className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                    columns.classificacao
                      ? 'bg-slate-100 border-slate-400 text-slate-900 font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-400 line-through'
                  }`}
                >
                  <span className="text-xs">Classif.</span>
                  {columns.classificacao ? <Eye className="h-3.5 w-3.5 text-slate-700" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: MARGENS DE CÉLULAS & TIPOGRAFIA */}
          {activeTab === 'cells' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => applyPaddingPreset('ultra_compacta')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    cellPadding.preset === 'ultra_compacta'
                      ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">Ultra-Compacta</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Padding 1px × 2px • Fonte 9.5px</div>
                  <span className="text-[9px] font-black uppercase text-blue-700 block mt-1">Máxima Densidade</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPaddingPreset('estreita')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    cellPadding.preset === 'estreita'
                      ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">Estreita (MINEDH)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Padding 2.5px × 4px • Fonte 10.5px</div>
                  <span className="text-[9px] font-black uppercase text-emerald-700 block mt-1">Recomendado A3</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPaddingPreset('padrao')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    cellPadding.preset === 'padrao'
                      ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">Padrão Escolar</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Padding 4px × 6px • Fonte 11.5px</div>
                  <span className="text-[9px] font-medium text-slate-500 block mt-1">Equilibrado</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyPaddingPreset('ampla')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    cellPadding.preset === 'ampla'
                      ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold">Ampla / Confortável</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Padding 6px × 8px • Fonte 12.5px</div>
                  <span className="text-[9px] font-medium text-slate-500 block mt-1">Pautas Menores</span>
                </button>
              </div>

              {/* Sliders for Custom Tuning */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Vertical Cell Padding */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Padding Vertical de Célula:</span>
                    <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{cellPadding.paddingY} px</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={0.5}
                    value={cellPadding.paddingY}
                    onChange={(e) => onChangeCellPadding({
                      ...cellPadding,
                      preset: 'personalizada',
                      paddingY: parseFloat(e.target.value)
                    })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>1px (Rente)</span>
                    <span>10px (Espaçoso)</span>
                  </div>
                </div>

                {/* Horizontal Cell Padding */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Padding Horizontal de Célula:</span>
                    <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{cellPadding.paddingX} px</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={14}
                    step={0.5}
                    value={cellPadding.paddingX}
                    onChange={(e) => onChangeCellPadding({
                      ...cellPadding,
                      preset: 'personalizada',
                      paddingX: parseFloat(e.target.value)
                    })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>1px (Compacto)</span>
                    <span>14px (Largo)</span>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Tamanho da Fonte da Tabela:</span>
                    <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{cellPadding.fontSize} px</span>
                  </div>
                  <input
                    type="range"
                    min={8.5}
                    max={14}
                    step={0.5}
                    value={cellPadding.fontSize}
                    onChange={(e) => onChangeCellPadding({
                      ...cellPadding,
                      preset: 'personalizada',
                      fontSize: parseFloat(e.target.value)
                    })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>8.5px</span>
                    <span>14px</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MÉDIAS PARCIAIS */}
          {activeTab === 'averages' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
                <HelpCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-bold">
                    O que é a ocultação de médias parciais?
                  </p>
                  <p className="text-amber-800">
                    O Ministério da Educação permite que cadernetas e pautas impressas exibam apenas as avaliações elementares (ACS1, ACS2, ACS3, Trabalhos, APT) e a <strong>Média Final</strong>, suprimindo colunas intermediárias para caber perfeitamente na folha sem quebra.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* Toggle Média ACS */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Média Parcial de ACS</h4>
                    <p className="text-[10px] text-slate-500">(ACS1 + ACS2 + ACS3) / N</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePartialAverage('showMediaACS')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      partialAverages.showMediaACS ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        partialAverages.showMediaACS ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle Média Trabalhos */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Média Parcial de Trabalhos</h4>
                    <p className="text-[10px] text-slate-500">(Trabalho 1 + Trabalho 2) / N</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePartialAverage('showMediaTrabalho')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      partialAverages.showMediaTrabalho ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        partialAverages.showMediaTrabalho ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle Média Frequência / Ciclo */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Média de Frequência / Ciclo</h4>
                    <p className="text-[10px] text-slate-500">M.FREQ e M.CICLO em Exames</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePartialAverage('showMediaFreq')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      partialAverages.showMediaFreq ? 'bg-blue-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        partialAverages.showMediaFreq ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Toggle Badges Retangulares */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between sm:col-span-2 md:col-span-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Destaque Oficial de Médias em Moldura / Retângulo</h4>
                    <p className="text-[10px] text-slate-500">Aplica estilo visual de alto contraste e fundo sombreado conforme modelo ministerial</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePartialAverage('highlightMediasWithBadges')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      partialAverages.highlightMediasWithBadges ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        partialAverages.highlightMediasWithBadges ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRÉ-VISUALIZAÇÃO A3 LANDSCAPE */}
          {activeTab === 'preview' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 text-white rounded-lg">
                    <Maximize2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                      Modo de Pré-visualização de Impressão A3 Landscape (1:1)
                    </h4>
                    <p className="text-[11px] text-blue-800">
                      Simulação fiel das margens ({cellPadding.paddingY}px/{cellPadding.paddingX}px) e do tamanho de fonte ({cellPadding.fontSize}px) com colunas seleccionadas ({activeColumnsCount}).
                    </p>
                  </div>
                </div>
                {onOpenPrintConfigModal && (
                  <Button
                    type="button"
                    onClick={onOpenPrintConfigModal}
                    className="bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold gap-1.5 shadow-sm"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Enviar para Impressora Oficial</span>
                  </Button>
                )}
              </div>

              {/* Simulated A3 Landscape Paper Container */}
              <div className="bg-slate-300 p-6 rounded-2xl overflow-x-auto shadow-inner border border-slate-400">
                <div className="bg-white text-slate-900 mx-auto rounded-md shadow-2xl border border-slate-300 p-8 min-w-[950px] max-w-[1150px] space-y-5 font-serif">
                  {/* Institutional Header Simulation */}
                  <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-900">
                      REPÚBLICA DE MOÇAMBIQUE
                    </p>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-800">
                      MINISTÉRIO DA EDUCAÇÃO E DESENVOLVIMENTO HUMANO
                    </p>
                    <h2 className="text-sm font-black uppercase tracking-wider text-blue-950 pt-1">
                      PAUTA OFICIAL DE AVALIAÇÃO E APROVEITAMENTO PEDAGÓGICO — A3 LANDSCAPE
                    </h2>
                    <div className="flex justify-center items-center gap-6 text-[10px] font-sans font-medium text-slate-600 pt-1">
                      <span><strong>Turma:</strong> {turmaLabel || '10ª Classe - Turma A'}</span>
                      <span><strong>Disciplina:</strong> {subjectLabel || 'Matemática'}</span>
                      <span><strong>Ano Lectivo:</strong> 2026</span>
                    </div>
                  </div>

                  {/* Simulated Table using user's padding config */}
                  <div className="overflow-x-auto">
                    <table 
                      className="w-full border-collapse text-center"
                      style={{ fontSize: `${cellPadding.fontSize}px` }}
                    >
                      <thead>
                        <tr className="bg-slate-900 text-white font-bold uppercase">
                          {columns.orderNumber && <th className="border border-slate-700" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>N/O</th>}
                          {columns.studentCode && <th className="border border-slate-700" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>Código / IUE</th>}
                          {columns.studentName && <th className="border border-slate-700 text-left" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>Nome Completo do Estudante</th>}
                          {columns.acs1 && <th className="border border-slate-700" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>ACS 1</th>}
                          {columns.acs2 && <th className="border border-slate-700" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>ACS 2</th>}
                          {columns.acs3 && <th className="border border-slate-700" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>ACS 3</th>}
                          {columns.mediaACS && partialAverages.showMediaACS && <th className="border border-slate-700 bg-blue-900" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>M.ACS</th>}
                          {columns.trabalho1 && <th className="border border-slate-700" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>Trab 1</th>}
                          {columns.trabalho2 && <th className="border border-slate-700" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>Trab 2</th>}
                          {columns.mediaTrabalho && partialAverages.showMediaTrabalho && <th className="border border-slate-700 bg-blue-900" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>M.Trab</th>}
                          {columns.apt && <th className="border border-slate-700" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>APT</th>}
                          {columns.mediaFinal && <th className="border border-slate-700 bg-emerald-900 font-black" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>M. Final</th>}
                          {columns.classificacao && <th className="border border-slate-700" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>Resultado</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 font-sans">
                        {[
                          { num: 1, code: 'EST-2026-001', name: 'Ana Beatriz Cossa', acs1: 14, acs2: 15, acs3: 16, mAcids: 15, t1: 16, t2: 17, mTrab: 16, apt: 15, mf: 15, res: 'Transita' },
                          { num: 2, code: 'EST-2026-002', name: 'Carlos Manuel Mondlane', acs1: 12, acs2: 13, acs3: 11, mAcids: 12, t1: 14, t2: 13, mTrab: 13, apt: 12, mf: 12, res: 'Transita' },
                          { num: 3, code: 'EST-2026-003', name: 'Débora Lúcia Tembe', acs1: 16, acs2: 17, acs3: 18, mAcids: 17, t1: 18, t2: 17, mTrab: 17.5, apt: 17, mf: 17, res: 'Transita (Disp.)' },
                          { num: 4, code: 'EST-2026-004', name: 'Etson Valdo Simango', acs1: 9, acs2: 10, acs3: 8, mAcids: 9, t1: 10, t2: 11, mTrab: 10.5, apt: 9, mf: 9.5, res: 'Exame' },
                        ].map((row, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            {columns.orderNumber && <td className="border border-slate-300 font-bold" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>{row.num}</td>}
                            {columns.studentCode && <td className="border border-slate-300 font-mono text-[9px]" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>{row.code}</td>}
                            {columns.studentName && <td className="border border-slate-300 text-left font-medium" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>{row.name}</td>}
                            {columns.acs1 && <td className="border border-slate-300" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>{row.acs1}</td>}
                            {columns.acs2 && <td className="border border-slate-300" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>{row.acs2}</td>}
                            {columns.acs3 && <td className="border border-slate-300" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>{row.acs3}</td>}
                            {columns.mediaACS && partialAverages.showMediaACS && <td className="border border-slate-300 font-bold bg-blue-50" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>{row.mAcids}</td>}
                            {columns.trabalho1 && <td className="border border-slate-300" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>{row.t1}</td>}
                            {columns.trabalho2 && <td className="border border-slate-300" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>{row.t2}</td>}
                            {columns.mediaTrabalho && partialAverages.showMediaTrabalho && <td className="border border-slate-300 font-bold bg-blue-50" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>{row.mTrab}</td>}
                            {columns.apt && <td className="border border-slate-300 font-bold" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>{row.apt}</td>}
                            {columns.mediaFinal && (
                              <td 
                                className={`border border-slate-300 font-black ${partialAverages.highlightMediasWithBadges ? 'bg-emerald-100 text-emerald-950 border-emerald-400' : ''}`}
                                style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}
                              >
                                {row.mf}
                              </td>
                            )}
                            {columns.classificacao && <td className="border border-slate-300 text-[9px] font-bold" style={{ padding: `${cellPadding.paddingY}px ${cellPadding.paddingX}px` }}>{row.res}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer Signatures Simulation */}
                  <div className="grid grid-cols-3 gap-8 pt-10 text-center text-xs font-sans">
                    <div>
                      <div className="border-t border-slate-800 pt-1 font-bold">O(A) Professor(a) da Disciplina</div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Assinatura e Carimbo</p>
                    </div>
                    <div>
                      <div className="border-t border-slate-800 pt-1 font-bold">O(A) Director(a) de Turma</div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Assinatura e Carimbo</p>
                    </div>
                    <div>
                      <div className="border-t border-slate-800 pt-1 font-bold">O(A) Director(a) Pedagógico(a)</div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Assinatura Oficial e Selo Branco</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Live Summary & Actions */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span><strong>Configuração Ativa:</strong> {activeColumnsCount} colunas • Margem {cellPadding.paddingY}px vert / {cellPadding.paddingX}px horiz • Fonte {cellPadding.fontSize}px</span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => {
                  onChangeColumns(DEFAULT_COLUMN_VISIBILITY);
                  onChangeCellPadding(DEFAULT_CELL_PADDING_CONFIG);
                  onChangePartialAverages(DEFAULT_PARTIAL_AVERAGES_CONFIG);
                }}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 font-bold px-2 py-1 rounded hover:bg-slate-200 transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> Restaurar Padrões
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
