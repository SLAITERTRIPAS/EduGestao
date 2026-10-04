import React, { useState, useEffect } from 'react';
import { 
  systemLogger, 
  SystemLogEntry, 
  SystemPerformanceMetrics 
} from '../services/systemLogger';
import { Card } from './ui';
import { 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Cpu, 
  Filter, 
  Search, 
  RefreshCw, 
  Sparkles, 
  Check, 
  Trash2, 
  Copy, 
  Zap, 
  Bug, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Gauge
} from 'lucide-react';

export const SystemHealthDashboard: React.FC = () => {
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [metrics, setMetrics] = useState<SystemPerformanceMetrics>(systemLogger.getSystemMetrics());
  
  // Filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Selected log for drawer/modal
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<SystemLogEntry | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [diagnosticReport, setDiagnosticReport] = useState<{
    score: number;
    issuesFound: number;
    recommendations: string[];
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refreshData = () => {
    const fetched = systemLogger.getLogs({
      severity: severityFilter,
      type: typeFilter,
      status: statusFilter,
      search: search
    });
    setLogs(fetched);
    setMetrics(systemLogger.getSystemMetrics());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = systemLogger.subscribe(() => {
      refreshData();
    });
    return unsubscribe;
  }, [search, severityFilter, typeFilter, statusFilter]);

  const handleResolve = (logId: string) => {
    systemLogger.resolveLog(logId, 'Administrador TI', resolutionNotes);
    setResolutionNotes('');
    setSelectedLog(null);
    showToast('Incidente marcado como Resolvido com sucesso!');
    refreshData();
  };

  const handleInvestigate = (logId: string) => {
    systemLogger.markInvestigating(logId);
    showToast('Estado alterado para "Em Investigação".');
    refreshData();
  };

  const handleClearResolved = () => {
    systemLogger.clearResolvedLogs();
    showToast('Registos resolvidos limpos com sucesso.');
    refreshData();
  };

  const handleRunDiagnostic = () => {
    const report = systemLogger.runDiagnosticScan();
    setDiagnosticReport(report);
    showToast('Diagnóstico em tempo real concluído!');
  };

  const handleSimulateError = () => {
    systemLogger.logWhiteScreenPrevented(
      'MóduloDeMatrículasSimulado',
      new TypeError("Cannot read properties of undefined (reading 'map')"),
      'in MóduloDeMatrículasSimulado\n    in SecretariatDashboard\n    in Layout'
    );
    showToast('Exceção simulada e registada no sistema!');
    refreshData();
  };

  const handleSimulateBottleneck = () => {
    systemLogger.logPerformanceBottleneck(
      'Cálculo de Médias Finais Pauta Geral',
      420,
      100,
      'Processamento de 150 alunos simulado levou 420ms para ser concluído.'
    );
    showToast('Gargalo de desempenho simulado registado!');
    refreshData();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copiado para a área de transferência!');
  };

  // Severity badges styling
  const getSeverityBadge = (sev: SystemLogEntry['severity']) => {
    switch (sev) {
      case 'critical':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold animate-pulse';
      case 'high':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300 font-medium';
      case 'low':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getTypeIcon = (type: SystemLogEntry['type']) => {
    switch (type) {
      case 'white_screen_prevented':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'error':
        return <Bug className="w-4 h-4 text-amber-600" />;
      case 'performance_bottleneck':
        return <Zap className="w-4 h-4 text-indigo-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'network':
      default:
        return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-lg border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none"></div>

        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2 text-emerald-400">
            <Activity className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-mono font-extrabold uppercase tracking-widest">
              Central de Diagnóstico & Saúde da Aplicação • MINEDH TI
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Monitor de Desempenho e Erros em Tempo Real
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Rastreamento centralizado de exceções de execução, impedimento de telas brancas (*ErrorBoundary*) e diagnóstico automatizado de gargalos com inteligência integrada.
          </p>
        </div>

        {/* Health Score Gauge Box */}
        <div className="bg-slate-900/90 border border-slate-700 p-4 rounded-2xl text-center shrink-0 min-w-[200px] z-10 shadow-inner">
          <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold uppercase mb-1">
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span>Índice de Saúde (Health)</span>
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">
            {metrics.healthScore}%
          </div>
          <p className="text-[11px] font-bold text-slate-300 mt-1">
            {metrics.healthScore >= 90 ? '🟢 Estável & Otimizado' : metrics.healthScore >= 70 ? '🟡 Requer Atenção' : '🔴 Crítico'}
          </p>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase">Telas Brancas Impedidas</span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-950 font-mono">
            {metrics.preventedWhiteScreensCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Salvas pelo ErrorBoundary
          </p>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase">Erros Ativos</span>
            <Bug className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900 font-mono">
            {metrics.activeErrorsCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Pendentes de resolução
          </p>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase">Gargalos de Rendeiro</span>
            <Zap className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-900 font-mono">
            {metrics.slowRenderCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Operações acima de 100ms
          </p>
        </Card>

        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase">Memória JS / Carregamento</span>
            <Cpu className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono">
            {metrics.memoryUsageMb ? `${metrics.memoryUsageMb} MB` : '38 MB'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Carga inicial: {metrics.loadTimeMs}ms
          </p>
        </Card>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunDiagnostic}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Executar Diagnóstico do Sistema</span>
          </button>

          <button
            onClick={handleSimulateError}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Bug className="w-3.5 h-3.5 text-rose-600" />
            <span>Simular Erro de Teste</span>
          </button>

          <button
            onClick={handleSimulateBottleneck}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Simular Gargalo</span>
          </button>
        </div>

        <button
          onClick={handleClearResolved}
          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Limpar Registos Resolvidos</span>
        </button>
      </div>

      {/* Diagnostic Scan Report Box if active */}
      {diagnosticReport && (
        <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 rounded-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-blue-700" />
              <span>Relatório de Verificação e Saúde em Tempo Real</span>
            </div>
            <button
              onClick={() => setDiagnosticReport(null)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Fechar
            </button>
          </div>
          <div className="space-y-1.5">
            {diagnosticReport.recommendations.map((rec, i) => (
              <p key={i} className="text-xs font-medium text-slate-800 flex items-center gap-2">
                <span>{rec}</span>
              </p>
            ))}
          </div>
        </Card>
      )}

      {/* Filters Toolbar and Logs Table - Hidden per request */}
      {false && (
        <>
          {/* Filters Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar por erro, mensagem, módulo ou utilizador..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">Gravidade:</span>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">Todas</option>
              <option value="critical">Crítico (Crítico)</option>
              <option value="high">Alto (High)</option>
              <option value="medium">Médio (Medium)</option>
              <option value="low">Baixo (Low)</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">Tipo:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">Todos os Tipos</option>
              <option value="white_screen_prevented">Tela Branca Impedida</option>
              <option value="error">Erro de Execução</option>
              <option value="performance_bottleneck">Gargalo de Desempenho</option>
              <option value="warning">Aviso do Sistema</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">Estado:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">Todos os Estados</option>
              <option value="active">Ativos</option>
              <option value="investigating">Em Investigação</option>
              <option value="resolved">Resolvidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-900" />
            Histórico Centralizado de Logs ({logs.length} registos)
          </h3>
          <span className="text-xs text-slate-500 font-mono">Sincronização em tempo real</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">Nenhum incidente encontrado</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Todos os módulos estão a funcionar normalmente sem registos que correspondam aos filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map(log => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div key={log.id} className="p-4 hover:bg-slate-50/80 transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-slate-100 rounded-xl shrink-0 mt-0.5">
                        {getTypeIcon(log.type)}
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono border ${getSeverityBadge(log.severity)}`}>
                            {log.severity}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          {log.userRole && (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded uppercase">
                              {log.userRole}
                            </span>
                          )}
                          {log.status === 'resolved' && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded flex items-center gap-1">
                              <Check className="w-3 h-3" /> Resolvido
                            </span>
                          )}
                          {log.status === 'investigating' && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded">
                              Em Investigação
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-slate-900 text-sm truncate">
                          {log.title}
                        </h4>
                        <p className="text-xs font-mono text-slate-600 truncate">
                          {log.message}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                        <span>Ver Diagnóstico AI</span>
                      </button>

                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer transition-all"
                        title="Expandir Detalhes"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content Drawer */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono animate-in fade-in">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>URL/Rota: <strong className="text-blue-400">{log.url || '/'}</strong></span>
                        <span>ID do Log: {log.id}</span>
                      </div>

                      {log.componentStack && (
                        <div>
                          <p className="text-slate-400 font-bold mb-1">Component Stack Trace:</p>
                          <pre className="bg-slate-950 p-2.5 rounded-lg text-[11px] text-amber-300 overflow-x-auto whitespace-pre-wrap">
                            {log.componentStack}
                          </pre>
                        </div>
                      )}

                      {log.stackTrace && (
                        <div>
                          <p className="text-slate-400 font-bold mb-1">Stack Trace Exato:</p>
                          <pre className="bg-slate-950 p-2.5 rounded-lg text-[11px] text-rose-300 overflow-x-auto max-h-36">
                            {log.stackTrace}
                          </pre>
                        </div>
                      )}

                      {/* AI Diagnosis box */}
                      {log.aiDiagnosis && (
                        <div className="p-3 bg-blue-950/80 border border-blue-700/50 rounded-lg text-blue-200">
                          <p className="font-bold text-blue-300 flex items-center gap-1.5 mb-1">
                            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Diagnóstico da Causa Raiz
                          </p>
                          <p className="whitespace-pre-line text-[11.5px] leading-relaxed">
                            {log.aiDiagnosis}
                          </p>
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between">
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(log, null, 2))}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" /> Copiar JSON
                        </button>

                        <div className="flex items-center gap-2">
                          {log.status !== 'resolved' && (
                            <>
                              <button
                                onClick={() => handleInvestigate(log.id)}
                                className="px-3 py-1 bg-indigo-800 hover:bg-indigo-700 text-white rounded text-[11px] font-bold cursor-pointer"
                              >
                                Marcar em Investigação
                              </button>
                              <button
                                onClick={() => handleResolve(log.id)}
                                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-bold cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Marcar como Resolvido
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      {/* Selected Log AI Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70  flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white max-w-2xl w-full rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 text-blue-900 font-extrabold text-base">
                <Sparkles className="w-5 h-5 text-blue-700" />
                <span>Análise de Causa Raiz & Resolução AI</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-100 rounded-xl font-mono space-y-1">
                <p className="font-bold text-slate-900">{selectedLog.title}</p>
                <p className="text-slate-600 text-[11px]">{selectedLog.message}</p>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-950 to-indigo-950 text-white rounded-xl space-y-2">
                <p className="font-bold text-blue-300 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-400" /> Diagnóstico Automatizado
                </p>
                <p className="whitespace-pre-line text-xs leading-relaxed font-sans text-slate-200">
                  {selectedLog.aiDiagnosis || systemLogger.generateAiDiagnosis(selectedLog)}
                </p>
              </div>

              {selectedLog.status !== 'resolved' && (
                <div className="space-y-2 pt-2">
                  <label className="font-bold text-slate-800 block">Notas de Resolução pelo Administrador:</label>
                  <textarea
                    rows={2}
                    value={resolutionNotes}
                    onChange={e => setResolutionNotes(e.target.value)}
                    placeholder="Especifique a correção aplicada no código..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  ></textarea>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              {selectedLog.status !== 'resolved' && (
                <button
                  onClick={() => handleResolve(selectedLog.id)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Marcar Incidente como Resolvido
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
