import { useState, useMemo } from "react";
import { useStore } from "../store";
import { Card, Button } from "./ui";
import { BookOpen, FileText, Lock, Archive, History, CheckCircle2, AlertTriangle, ShieldCheck, Mail } from "lucide-react";
import { OfficialPauta } from "./OfficialPautas";
import { TeacherEmailNotifications } from "./TeacherEmailNotifications";

export function AcademicManagement() {
  const { classes, grades, examGrades, lockClassGrades, archiveAcademicData, academicArchives } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'frequencia' | 'exame' | 'archives' | 'emails'>('overview');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [autoMonitorEnabled, setAutoMonitorEnabled] = useState<boolean>(true);
  const [autoClosedClasses, setAutoClosedClasses] = useState<Record<string, boolean>>({});

  // Cálculo memoizado de turmas elegíveis para fecho (sem efeitos colaterais de re-renderização)
  const pendingClasses = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return classes.filter(c => {
      if (autoClosedClasses[c.id]) return false;

      const alreadyArchived = academicArchives.some(a => a.classId === c.id && a.year === currentYear);
      if (alreadyArchived) return false;

      const classGrades = grades.filter(g => g.classId === c.id);
      const classExamGrades = examGrades.filter(eg => eg.classId === c.id);
      const totalCount = classGrades.length + classExamGrades.length;
      if (totalCount === 0) return false;

      const isAlreadyLocked = (classGrades.length === 0 || classGrades.every(g => g.isLocked)) &&
        (classExamGrades.length === 0 || classExamGrades.every(eg => eg.isLocked));
      if (isAlreadyLocked) return false;

      const t3Grades = classGrades.filter(g => g.trimester === 3);
      const hasExamGrades = classExamGrades.length > 0;

      return t3Grades.length > 5 || hasExamGrades;
    });
  }, [classes, grades, examGrades, academicArchives, autoClosedClasses]);

  const handleBatchLockAndArchive = () => {
    if (pendingClasses.length === 0) return;
    const currentYear = new Date().getFullYear();
    const updated = { ...autoClosedClasses };
    pendingClasses.forEach(c => {
      lockClassGrades(c.id);
      archiveAcademicData(currentYear, c.id);
      updated[c.id] = true;
    });
    setAutoClosedClasses(updated);
    alert(`Fecho trimestral processado para ${pendingClasses.length} turma(s) com sucesso!`);
  };

  const handleManualLockAndArchive = (classId: string) => {
    if (window.confirm("Esta ação irá trancar permanentemente as cadernetas (modo leitura), enviar cópia para a Secção Pedagógica, arquivar os dados no histórico institucional e disparar e-mails automáticos para os docentes. Confirmar fecho?")) {
        lockClassGrades(classId);
        archiveAcademicData(new Date().getFullYear(), classId);
        setAutoClosedClasses(prev => ({ ...prev, [classId]: true }));
        alert("Fecho de trimestre executado com sucesso! Cadernetas trancadas, dados arquivados e alertas por e-mail enviados.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Gestão Académica & Fecho Trimestral</h2>
          <p className="text-sm text-slate-500 mt-1">
            Monitorização automática da última avaliação, bloqueio de edições docentes, arquivo histórico oficial e notificações por e-mail (MINEDH).
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingClasses.length > 0 && (
            <button
              onClick={handleBatchLockAndArchive}
              className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 bg-blue-900 text-white hover:bg-blue-800 transition-all shadow-sm cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" />
              Fechar {pendingClasses.length} Turma(s) Pronta(s)
            </button>
          )}
          <button
            onClick={() => setAutoMonitorEnabled(!autoMonitorEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              autoMonitorEnabled 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm' 
                : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            {autoMonitorEnabled ? 'Monitor Automático Ativo' : 'Monitor Automático Pausado'}
          </button>
        </div>
      </div>

      {/* Sub-menu Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'overview' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Visão Geral das Turmas
        </button>
        <button
          onClick={() => setActiveTab('frequencia')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'frequencia' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Pautas de Frequência (Sem Nº Pauta)
        </button>
        <button
          onClick={() => setActiveTab('exame')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'exame' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Pautas de Exame & Júris (30 Alunos)
        </button>
        <button
          onClick={() => setActiveTab('archives')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'archives' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Arquivo Histórico ({academicArchives.length})
        </button>
        <button
          onClick={() => setActiveTab('emails')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'emails' ? 'bg-blue-900 text-white shadow' : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Mail size={15} /> Alertas de E-mail
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {classes.map(c => {
            const isClosed = autoClosedClasses[c.id] || grades.some(g => g.classId === c.id && g.isLocked);
            return (
              <Card key={c.id} className="p-6 space-y-4 border border-slate-200 bg-white shadow-sm hover:shadow transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900">{c.name} - {c.gradeLevel}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Período: {c.period || 'Diurno'} | Ano: {c.year}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    isClosed ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {isClosed ? <Lock size={12} /> : <CheckCircle2 size={12} />}
                    {isClosed ? 'Trancado / Modo Leitura' : 'Em Lançamento'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                  <Button 
                    variant="outline" 
                    onClick={() => { setSelectedClassId(c.id); setActiveTab('frequencia'); }}
                    className="text-xs gap-1.5 font-bold"
                  >
                    <FileText size={15}/> Pauta Frequência
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => { setSelectedClassId(c.id); setActiveTab('exame'); }}
                    className="text-xs gap-1.5 font-bold"
                  >
                    <FileText size={15}/> Pauta Exame
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => handleManualLockAndArchive(c.id)} 
                    className="text-xs gap-1.5 text-red-600 hover:text-red-700 font-bold ml-auto"
                  >
                    <Lock size={15}/> Forçar Fecho & Arquivo
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'frequencia' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center no-print">
            <h3 className="font-bold text-lg text-slate-800">Pauta de Frequência Oficial (Sem Nº de Pauta)</h3>
            <Button variant="outline" onClick={() => setActiveTab('overview')} className="text-xs">Voltar às Turmas</Button>
          </div>
          <OfficialPauta type="frequencia" selectedTurma={selectedClassId} />
        </div>
      )}

      {activeTab === 'exame' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center no-print">
            <h3 className="font-bold text-lg text-slate-800">Pauta de Exame & Júris de 30 Alunos</h3>
            <Button variant="outline" onClick={() => setActiveTab('overview')} className="text-xs">Voltar às Turmas</Button>
          </div>
          <OfficialPauta type="exame" selectedTurma={selectedClassId} />
        </div>
      )}

      {activeTab === 'archives' && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800">Arquivo Histórico Institucional (Anos Anteriores & Correntes)</h3>
          <div className="grid grid-cols-1 gap-4">
            {academicArchives.map(arch => (
              <Card key={arch.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 border border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <Archive className="text-blue-700 h-5 w-5" />
                    <span className="font-black text-slate-900">Ano de Referência: {arch.year}</span>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">Turma ID: {arch.classId}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Arquivado em: {new Date(arch.archivedAt).toLocaleString('pt-PT')}</p>
                  <p className="text-xs text-slate-700 font-semibold mt-2">Registos de notas guardados: {arch.grades.length} | Registos de exames: {arch.examGrades.length}</p>
                </div>
                <Button variant="outline" className="gap-2 text-xs font-bold bg-white">
                  <History size={15}/> Consultar Arquivo
                </Button>
              </Card>
            ))}
            {academicArchives.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Archive className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-bold">Nenhum arquivo histórico registado.</p>
                <p className="text-xs text-slate-400 mt-1">Os arquivos serão gerados automaticamente ao fechar os trimestres ou turmas.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'emails' && (
        <TeacherEmailNotifications />
      )}
    </div>
  );
}
