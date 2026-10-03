import React, { useState } from 'react';
import { useStore } from '../store';
import { Card, Button } from './ui';
import { 
  Database, ShieldCheck, RefreshCw, CheckCircle2, Clock, 
  Download, FileSpreadsheet, HardDrive, AlertCircle, ArrowUpRight, 
  Calendar, Layers, Users, GraduationCap, Check, Sparkles, Server
} from 'lucide-react';
import { BackupRecord } from '../types';

export const FirestoreBackupManager: React.FC = () => {
  const { 
    backups, 
    lastBackupAt, 
    isBackingUp, 
    autoBackupEnabled, 
    triggerAutomatedBackup, 
    toggleAutoBackup,
    currentUser,
    students,
    classes,
    grades,
    schools,
    employees,
    schoolDocuments,
    financialTransactions,
    patrimonyItems
  } = useStore();

  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleManualBackup = async () => {
    try {
      const bkp = await triggerAutomatedBackup('manual', currentUser?.name || 'Gestor do Sistema');
      setSuccessToast(`Backup manual #${bkp.id.slice(-6)} concluído e registado com sucesso no Firestore! Notificação enviada ao gestor.`);
      setTimeout(() => setSuccessToast(null), 6000);
    } catch (e: any) {
      alert(`Erro ao executar backup: ${e?.message || e}`);
    }
  };

  const handleDownloadBackupJson = (bkp: BackupRecord) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bkp, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `eduGestao-backup-${bkp.id}-${bkp.createdAt.split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const totalPedagogicalNow = (students?.length || 0) + (classes?.length || 0) + (grades?.length || 0);
  const totalAdministrativeNow = (schools?.length || 0) + (employees?.length || 0) + (schoolDocuments?.length || 0) + (financialTransactions?.length || 0) + (patrimonyItems?.length || 0);

  return (
    <div className="space-y-6">
      {/* Banner de Feedback */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex items-center justify-between text-emerald-900 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-emerald-950">Notificação Disparada ao Gestor</p>
              <p className="text-xs text-emerald-800">{successToast}</p>
            </div>
          </div>
          <button 
            onClick={() => setSuccessToast(null)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 px-3 py-1 bg-emerald-100/60 rounded-lg"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Header com Ação Principal */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-blue-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 opacity-10 pointer-events-none">
          <Database size={280} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Sincronização & Persistência Cloud Firestore
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Backup Automático de Dados Pedagógicos & Administrativos
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Preservação redundante em tempo real de estudantes, notas, turmas, pautas, docentes, património e documentos oficiais em coleções dedicadas do Google Cloud Firestore com alerta imediato ao gestor.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Button
              onClick={handleManualBackup}
              disabled={isBackingUp}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isBackingUp ? 'animate-spin' : ''}`} />
              {isBackingUp ? 'Salvaguardando no Firestore...' : 'Executar Backup Agora'}
            </Button>
          </div>
        </div>
      </div>

      {/* Indicadores de Estado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Estado do Sistema</span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-lg font-black text-slate-900 mt-2 flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-blue-600" /> Firestore Ativo
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Rotina Automática:</span>
            <button
              onClick={() => toggleAutoBackup(!autoBackupEnabled)}
              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] transition-all cursor-pointer ${
                autoBackupEnabled 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {autoBackupEnabled ? 'Ativada (Diária)' : 'Desativada'}
            </button>
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Último Backup</span>
          <p className="text-sm font-black text-slate-900 mt-2 flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-amber-500" />
            {lastBackupAt ? new Date(lastBackupAt).toLocaleString('pt-MZ') : 'Aguardando 1ª execução'}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Destino: <span className="font-mono font-bold text-slate-700">/backups/</span> no Firestore
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Dados Pedagógicos Atuais</span>
          <p className="text-xl font-black text-blue-900 font-mono mt-2">
            {totalPedagogicalNow.toLocaleString()} <span className="text-xs font-sans text-slate-500 font-bold">registos</span>
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Alunos, Turmas, Notas, Tarefas e Pautas
          </div>
        </Card>

        <Card className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Dados Administrativos Atuais</span>
          <p className="text-xl font-black text-purple-900 font-mono mt-2">
            {totalAdministrativeNow.toLocaleString()} <span className="text-xs font-sans text-slate-500 font-bold">registos</span>
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Escolas, Pessoal (Docentes/CTA), Finanças
          </div>
        </Card>
      </div>

      {/* Histórico de Backups Registados */}
      <Card className="p-6 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-700" />
              Histórico de Snapshots de Backup no Firestore ({backups.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cada snapshot inclui os metadados de integridade e notificação automática despachada ao Gestor.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-xl font-mono font-bold border border-slate-200">
              Coleção: backups
            </span>
          </div>
        </div>

        {backups.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Database className="h-8 w-8 animate-pulse" />
            </div>
            <p className="text-sm font-bold text-slate-700">Nenhum backup arquivado na coleção ainda.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Clique no botão "Executar Backup Agora" para criar o primeiro snapshot persistente com notificação ao gestor.
            </p>
            <Button onClick={handleManualBackup} className="text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white mt-2">
              Criar Snapshot Inicial
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">ID do Backup</th>
                  <th className="py-3 px-3">Data & Hora</th>
                  <th className="py-3 px-3">Disparador / Origem</th>
                  <th className="py-3 px-3 text-center">Tipo</th>
                  <th className="py-3 px-3 text-center">Pedagógico</th>
                  <th className="py-3 px-3 text-center">Administrativo</th>
                  <th className="py-3 px-3 text-center">Tamanho</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {backups.map((bkp) => (
                  <tr key={bkp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-blue-900">
                      {bkp.id}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {new Date(bkp.createdAt).toLocaleString('pt-MZ')}
                    </td>
                    <td className="py-3 px-3 text-slate-800 font-bold">
                      {bkp.triggeredBy}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                        bkp.type === 'automático' 
                          ? 'bg-purple-100 text-purple-800 border-purple-200' 
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}>
                        {bkp.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-blue-700">
                      {bkp.pedagogicalCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-purple-700">
                      {bkp.administrativeCount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">
                      ~{bkp.sizeKb} KB
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px] border border-emerald-200">
                        <Check className="h-3 w-3" /> {bkp.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedBackup(bkp)}
                          className="px-2.5 py-1 text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all"
                        >
                          Ver Resumo
                        </button>
                        <button
                          onClick={() => handleDownloadBackupJson(bkp)}
                          title="Descarregar Snapshot JSON"
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Detalhes do Snapshot */}
      {selectedBackup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70  p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                <h4 className="font-extrabold text-slate-900 text-base">
                  Detalhes do Snapshot #{selectedBackup.id}
                </h4>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                Concluído no Firestore
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium text-slate-800 leading-relaxed">
                {selectedBackup.summary}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-900 block">Dados Pedagógicos</span>
                  <span className="text-base font-black font-mono text-blue-950">
                    {selectedBackup.pedagogicalCount}
                  </span>
                  <span className="text-[10px] text-blue-700 block">Estudantes, Notas, Tarefas</span>
                </div>

                <div className="p-2.5 bg-purple-50/60 rounded-xl border border-purple-100">
                  <span className="font-bold text-purple-900 block">Dados Administrativos</span>
                  <span className="text-base font-black font-mono text-purple-950">
                    {selectedBackup.administrativeCount}
                  </span>
                  <span className="text-[10px] text-purple-700 block">Escolas, RH, Documentos</span>
                </div>
              </div>

              {selectedBackup.details && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 font-mono text-[11px]">
                  <p className="font-bold font-sans text-slate-800 text-xs mb-1">Discriminação de Entidades:</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div>Estudantes: <strong>{selectedBackup.details.studentsCount}</strong></div>
                    <div>Turmas: <strong>{selectedBackup.details.classesCount}</strong></div>
                    <div>Notas/Pautas: <strong>{selectedBackup.details.gradesCount}</strong></div>
                    <div>Tarefas/Avaliações: <strong>{selectedBackup.details.evaluationsCount + selectedBackup.details.tasksCount}</strong></div>
                    <div>Escolas: <strong>{selectedBackup.details.schoolsCount}</strong></div>
                    <div>Funcionários: <strong>{selectedBackup.details.employeesCount}</strong></div>
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-500 flex justify-between pt-1">
                <span>Criado em: {new Date(selectedBackup.createdAt).toLocaleString('pt-MZ')}</span>
                <span>Tamanho: ~{selectedBackup.sizeKb} KB</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => handleDownloadBackupJson(selectedBackup)}
                className="text-xs font-bold gap-1.5"
              >
                <Download size={14} /> Descarregar JSON
              </Button>
              <Button
                onClick={() => setSelectedBackup(null)}
                className="text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
