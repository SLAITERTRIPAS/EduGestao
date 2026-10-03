import React, { useState, useMemo } from 'react';
import { useHierarchicalStatistics, getCicloGrades } from '../hooks/useHierarchicalStatistics';
import { CicloType, ClassStatisticRecord, CicloStatisticRecord } from '../types/statisticalHierarchy';
import { Card, Button } from './ui';
import { 
  Building2, School, Users, GraduationCap, ArrowRight, CheckCircle2, 
  Clock, AlertCircle, FileSpreadsheet, Send, RefreshCw, BarChart3, 
  PieChart, ChevronRight, ShieldCheck, MapPin, Award, FileSignature, 
  Eye, CheckCheck, TrendingUp, Layers, Globe, Filter, Sparkles, Printer, Search
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart as RePieChart, Pie, AreaChart, Area, Legend 
} from 'recharts';
import { triggerPrint } from '../utils/printHelper';

interface Props {
  initialLevel?: 'turma' | 'ciclo' | 'escola' | 'distrito' | 'provincia' | 'nacional';
  lockedCiclo?: CicloType;
  showStepperOnly?: boolean;
}

export const NationalHierarchyStatisticsWorkflow: React.FC<Props> = ({ 
  initialLevel = 'ciclo',
  lockedCiclo
}) => {
  const {
    nationalData,
    activeSchool,
    currentYear,
    selectedProvinceName,
    setSelectedProvinceName,
    selectedDistrictName,
    setSelectedDistrictName,
    selectedSchoolId,
    setSelectedSchoolId,
    currentProvince,
    currentDistrict,
    submitClassToCiclo,
    consolidateAndSubmitCicloToSchool,
    consolidateAndSubmitSchoolToDistrict,
    consolidateAndSubmitDistrictToProvince,
    consolidateAndSubmitProvinceToNational,
    consolidateNationalData,
    resetWorkflow
  } = useHierarchicalStatistics();

  // Active level in the 6-tier hierarchy
  const [currentLevel, setCurrentLevel] = useState<'turma' | 'ciclo' | 'escola' | 'distrito' | 'provincia' | 'nacional'>(initialLevel);
  
  // Selected Ciclo for Level 2 (1º Ciclo, 2º Ciclo, 3º Ciclo)
  const [selectedCiclo, setSelectedCiclo] = useState<CicloType>(lockedCiclo || '1º Ciclo');
  
  // Selected Class for Level 1 (Diretor de Turma)
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [classNotes, setClassNotes] = useState<string>('');

  // Search filters
  const [districtSchoolSearch, setDistrictSchoolSearch] = useState('');
  const [provinceDistrictSearch, setProvinceDistrictSearch] = useState('');
  
  // Feedback Banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'info' | 'warning'; msg: string } | null>(null);

  const showNotification = (msg: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Find the currently selected ciclo object in the active school
  const currentCicloData = useMemo<CicloStatisticRecord | undefined>(() => {
    if (!activeSchool) return undefined;
    return activeSchool.ciclos?.find(c => c.ciclo === selectedCiclo);
  }, [activeSchool, selectedCiclo]);

  // Find all classes across all ciclos in active school
  const allClasses = useMemo<ClassStatisticRecord[]>(() => {
    if (!activeSchool || !activeSchool.ciclos) return [];
    return activeSchool.ciclos.flatMap(c => c.classes);
  }, [activeSchool]);

  // Set default selected class on mount or switch
  const activeClassRecord = useMemo<ClassStatisticRecord | undefined>(() => {
    if (selectedClassId) {
      return allClasses.find(c => c.classId === selectedClassId);
    }
    return allClasses[0];
  }, [allClasses, selectedClassId]);

  // Level Progression Calculation
  const levelsSummary = useMemo(() => {
    const totalCls = allClasses.length || 1;
    const submittedCls = allClasses.filter(c => c.status !== 'Pendente').length;
    const clsProgress = Math.round((submittedCls / totalCls) * 100);

    const ciclos = activeSchool?.ciclos || [];
    const submittedCiclos = ciclos.filter(c => c.status === 'Submetido à Direcção' || c.status === 'Consolidado').length;
    const cicloProgress = Math.round((submittedCiclos / (ciclos.length || 1)) * 100);

    const schoolSubmitted = activeSchool?.status === 'Submetido ao Distrito' || activeSchool?.status === 'Validado pelo SDEJT';
    const districtSubmitted = currentDistrict?.status === 'Submetido à Província' || currentDistrict?.status === 'Validado pela DPE';
    const provinceSubmitted = currentProvince?.status === 'Submetido ao Ministério' || currentProvince?.status === 'Homologado pelo MINEDH';
    const nationalConsolidated = nationalData.status === 'Homologado & Publicado';

    return {
      clsProgress,
      submittedCls,
      totalCls,
      cicloProgress,
      submittedCiclos,
      totalCiclos: ciclos.length,
      schoolSubmitted,
      districtSubmitted,
      provinceSubmitted,
      nationalConsolidated
    };
  }, [allClasses, activeSchool, currentDistrict, currentProvince, nationalData]);

  // Handle Level 1 Action: Diretor de Turma submete
  const handleTeacherSubmit = (classId: string) => {
    submitClassToCiclo(classId, classNotes);
    const cls = allClasses.find(c => c.classId === classId);
    showNotification(`Dados estatísticos da ${cls?.className || 'Turma'} submetidos com sucesso ao Pedagógico do ${cls?.ciclo || 'Ciclo'}!`, 'success');
  };

  // Handle Level 2 Action: Pedagógico do Ciclo consolida e submete à Direcção
  const handleCicloSubmit = (ciclo: CicloType) => {
    consolidateAndSubmitCicloToSchool(ciclo);
    showNotification(`Estatística do ${ciclo} consolidada e submetida com sucesso ao Director da Escola!`, 'success');
  };

  // Handle Level 3 Action: Director da Escola consolida e submete ao Distrito
  const handleSchoolSubmit = () => {
    if (!activeSchool) return;
    consolidateAndSubmitSchoolToDistrict(activeSchool.id);
    showNotification(`Estatística Consolidada da Escola submetida com sucesso aos Serviços Distritais de Educação (SDEJT)!`, 'success');
  };

  // Handle Level 4 Action: Distrito submete à Província
  const handleDistrictSubmit = () => {
    if (!currentDistrict) return;
    consolidateAndSubmitDistrictToProvince(currentDistrict.id);
    showNotification(`Estatística Distrital consolidada e submetida com sucesso à Direcção Provincial de Educação (DPE)!`, 'success');
  };

  // Handle Level 5 Action: Província submete ao Ministério
  const handleProvinceSubmit = () => {
    if (!currentProvince) return;
    consolidateAndSubmitProvinceToNational(currentProvince.provinceName);
    showNotification(`Estatística Provincial da ${currentProvince.provinceName} submetida com sucesso ao Ministério da Educação (MINEDH)!`, 'success');
  };

  // Handle Level 6 Action: Ministério homologa nacionalmente
  const handleNationalConsolidate = () => {
    consolidateNationalData();
    showNotification(`Estatística Nacional Consolidada e Homologada para todas as 11 Províncias de Moçambique!`, 'success');
  };

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-4 max-w-7xl mx-auto text-slate-800 text-xs">
      
      {/* ========================================================================= */}
      {/* BANNER DE FLUXO HIERÁRQUICO NACIONAL (PIPELINE STEPPER)                   */}
      {/* ========================================================================= */}
      <div className="bg-white border-2 border-slate-200 rounded-xl p-3.5 shadow-sm">
        
        {/* Cabeçalho do Pipeline */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-900 text-amber-400 rounded-lg shadow-xs">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                Sistema Nacional de Agregação e Submissão Estatística
                <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                  MINEDH {currentYear}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Fluxo Hierárquico: <strong>Diretor de Turma</strong> ➔ <strong>Pedagógicos (1º, 2º, 3º Ciclo)</strong> ➔ <strong>Diretor da Escola</strong> ➔ <strong>Distrito (SDEJT)</strong> ➔ <strong>Província (DPE)</strong> ➔ <strong>Ministério (Nacional)</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <Button
              variant="outline"
              onClick={resetWorkflow}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 border-slate-300 gap-1 py-1 px-2.5"
              title="Reiniciar fluxo de demonstração"
            >
              <RefreshCw className="h-3 w-3" /> Reiniciar
            </Button>
            <Button
              onClick={() => triggerPrint({ title: `Estatistica_Nacional_MINEDH_${currentYear}` })}
              className="text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white gap-1 py-1 px-2.5"
            >
              <Printer className="h-3 w-3" /> Imprimir Relatório
            </Button>
          </div>
        </div>

        {/* FEEDBACK TOAST / ALERT */}
        {feedback && (
          <div className={`mt-2.5 p-2.5 rounded-lg flex items-center justify-between text-xs font-semibold ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' : 'bg-blue-50 text-blue-900 border border-blue-300'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{feedback.msg}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 font-bold px-1">✕</button>
          </div>
        )}

        {/* 6-TIER STEPPER BUTTONS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-3">
          
          {/* NÍVEL 1: DIRETOR DE TURMA */}
          <button
            onClick={() => setCurrentLevel('turma')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
              currentLevel === 'turma' 
                ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 shadow-xs' 
                : 'bg-slate-50 border-slate-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">1. Turma</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                levelsSummary.clsProgress === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {levelsSummary.submittedCls}/{levelsSummary.totalCls}
              </span>
            </div>
            <p className="font-bold text-slate-900 text-xs truncate">Diretor de Turma</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Coleta & Análise</p>
          </button>

          {/* NÍVEL 2: PEDAGÓGICOS (1º, 2º E 3º CICLO) */}
          <button
            onClick={() => setCurrentLevel('ciclo')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
              currentLevel === 'ciclo' 
                ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 shadow-xs' 
                : 'bg-slate-50 border-slate-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">2. Ciclos</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                levelsSummary.cicloProgress === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {levelsSummary.submittedCiclos}/3 Ciclos
              </span>
            </div>
            <p className="font-bold text-slate-900 text-xs truncate">Pedagógicos (DAP)</p>
            <p className="text-[10px] text-slate-500 mt-0.5">1º, 2º e 3º Ciclo</p>
          </button>

          {/* NÍVEL 3: DIRETOR DA ESCOLA */}
          <button
            onClick={() => setCurrentLevel('escola')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
              currentLevel === 'escola' 
                ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 shadow-xs' 
                : 'bg-slate-50 border-slate-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">3. Escola</span>
              {levelsSummary.schoolSubmitted ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Clock className="h-3.5 w-3.5 text-amber-500" />
              )}
            </div>
            <p className="font-bold text-slate-900 text-xs truncate">Diretor da Escola</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Consolidação Geral</p>
          </button>

          {/* NÍVEL 4: DISTRITO (SDEJT) */}
          <button
            onClick={() => setCurrentLevel('distrito')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
              currentLevel === 'distrito' 
                ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 shadow-xs' 
                : 'bg-slate-50 border-slate-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">4. Distrito</span>
              {levelsSummary.districtSubmitted ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Clock className="h-3.5 w-3.5 text-amber-500" />
              )}
            </div>
            <p className="font-bold text-slate-900 text-xs truncate">Distrito (SDEJT)</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Rede Distrital</p>
          </button>

          {/* NÍVEL 5: PROVÍNCIA (DPE) */}
          <button
            onClick={() => setCurrentLevel('provincia')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
              currentLevel === 'provincia' 
                ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 shadow-xs' 
                : 'bg-slate-50 border-slate-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">5. Província</span>
              {levelsSummary.provinceSubmitted ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Clock className="h-3.5 w-3.5 text-amber-500" />
              )}
            </div>
            <p className="font-bold text-slate-900 text-xs truncate">Província (DPE)</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Estatística Provincial</p>
          </button>

          {/* NÍVEL 6: MINISTÉRIO (MINEDH - NACIONAL) */}
          <button
            onClick={() => setCurrentLevel('nacional')}
            className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
              currentLevel === 'nacional' 
                ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-500/20 shadow-xs' 
                : 'bg-slate-50 border-slate-200 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">6. Ministério</span>
              <span className="text-[9px] bg-red-100 text-red-800 px-1 rounded font-bold font-mono">11 Provs</span>
            </div>
            <p className="font-bold text-slate-900 text-xs truncate">MINEDH Nacional</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Todos os Alunos do País</p>
          </button>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: DIRETOR DE TURMA (COLETA E SUBMISSÃO AO CICLO)                   */}
      {/* ========================================================================= */}
      {currentLevel === 'turma' && (
        <div className="space-y-3">
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Módulo do Diretor de Turma • Coleta & Análise Estatística
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Preencha ou valide os dados estatísticos da sua turma e submeta diretamente ao Pedagógico do seu Ciclo.
                  </p>
                </div>
              </div>

              {/* Seletor de Turma */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600">Turma:</span>
                <select
                  value={activeClassRecord?.classId || ''}
                  onChange={e => setSelectedClassId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-800"
                >
                  {allClasses.map(cls => (
                    <option key={cls.classId} value={cls.classId}>
                      {cls.className} ({cls.gradeLevel}) • {cls.ciclo} [{cls.status}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeClassRecord && (
              <div className="mt-3.5 space-y-3">
                
                {/* Status da Turma */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      Turma: <strong className="text-blue-700">{activeClassRecord.className}</strong>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-xs text-slate-600">
                      Ciclo: <strong className="text-indigo-700">{activeClassRecord.ciclo}</strong>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-xs text-slate-600">
                      Prof. Diretor: <strong className="text-slate-800">{activeClassRecord.teacherName}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      activeClassRecord.status === 'Submetido ao Ciclo' 
                        ? 'bg-blue-100 text-blue-800 border-blue-300' 
                        : activeClassRecord.status === 'Homologado pelo Ciclo'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {activeClassRecord.status}
                    </span>
                    {activeClassRecord.submittedAt && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({activeClassRecord.submittedAt})
                      </span>
                    )}
                  </div>
                </div>

                {/* Métricas da Turma */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-blue-700">Total Alunos</p>
                    <p className="text-base font-black text-blue-950 font-mono mt-0.5">{activeClassRecord.totalStudents}</p>
                    <p className="text-[9.5px] text-blue-600">100% inscritos</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-600">Masculino (M)</p>
                    <p className="text-base font-black text-slate-900 font-mono mt-0.5">{activeClassRecord.maleStudents}</p>
                    <p className="text-[9.5px] text-slate-500">{Math.round((activeClassRecord.maleStudents/activeClassRecord.totalStudents)*100)}%</p>
                  </div>
                  <div className="p-2.5 bg-pink-50/70 border border-pink-200 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-pink-700">Feminino (F)</p>
                    <p className="text-base font-black text-pink-950 font-mono mt-0.5">{activeClassRecord.femaleStudents}</p>
                    <p className="text-[9.5px] text-pink-600">{Math.round((activeClassRecord.femaleStudents/activeClassRecord.totalStudents)*100)}%</p>
                  </div>
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-emerald-700">Aprovados</p>
                    <p className="text-base font-black text-emerald-950 font-mono mt-0.5">{activeClassRecord.approvedCount}</p>
                    <p className="text-[9.5px] text-emerald-600 font-bold">{Math.round((activeClassRecord.approvedCount/activeClassRecord.totalStudents)*100)}%</p>
                  </div>
                  <div className="p-2.5 bg-red-50/70 border border-red-200 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-red-700">Reprovados</p>
                    <p className="text-base font-black text-red-950 font-mono mt-0.5">{activeClassRecord.reprovedCount}</p>
                    <p className="text-[9.5px] text-red-600">{Math.round((activeClassRecord.reprovedCount/activeClassRecord.totalStudents)*100)}%</p>
                  </div>
                  <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-amber-700">Desistentes</p>
                    <p className="text-base font-black text-amber-950 font-mono mt-0.5">{activeClassRecord.droppedCount}</p>
                    <p className="text-[9.5px] text-amber-600">{Math.round((activeClassRecord.droppedCount/activeClassRecord.totalStudents)*100)}%</p>
                  </div>
                </div>

                {/* Submissão com Notas do Diretor de Turma */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3">
                  <div className="w-full sm:w-2/3">
                    <label className="text-[11px] font-bold text-slate-700 mb-1 block">
                      Observações Pedagógicas da Turma para o Pedagógico do {activeClassRecord.ciclo}:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Turma com alto rendimento em Ciências; 2 casos de apoio pedagógico especial."
                      value={classNotes}
                      onChange={e => setClassNotes(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>

                  <Button
                    onClick={() => handleTeacherSubmit(activeClassRecord.classId)}
                    disabled={activeClassRecord.status === 'Submetido ao Ciclo' || activeClassRecord.status === 'Homologado pelo Ciclo'}
                    className={`font-bold text-xs gap-1.5 px-4 py-2 text-white shrink-0 ${
                      activeClassRecord.status === 'Pendente' 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                    {activeClassRecord.status === 'Pendente' ? 'Submeter ao Pedagógico do Ciclo' : 'Dados Já Submetidos ao Ciclo'}
                  </Button>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: PEDAGÓGICOS (1º CICLO, 2º CICLO, 3º CICLO)                       */}
      {/* ========================================================================= */}
      {currentLevel === 'ciclo' && (
        <div className="space-y-3">
          
          {/* SELETOR DE CICLOS PEDAGÓGICOS (1º CICLO, 2º CICLO, 3º CICLO) */}
          <div className="bg-white border-2 border-indigo-200 rounded-xl p-3.5 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Direcção Pedagógica • Consolidação por Ciclos de Ensino
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cada Pedagógico gere a estatística exclusiva do seu ciclo, agrega as turmas e submete ao Director da Escola.
                  </p>
                </div>
              </div>

              {/* ABAS EXCLUSIVAS DE CICLO */}
              <div className="flex items-center gap-1 bg-indigo-50 p-1 rounded-lg border border-indigo-200">
                {(['1º Ciclo', '2º Ciclo', '3º Ciclo'] as CicloType[]).map((ciclo) => {
                  const cicloObj = activeSchool?.ciclos.find(c => c.ciclo === ciclo);
                  const isSubmitted = cicloObj?.status === 'Submetido à Direcção';

                  return (
                    <button
                      key={ciclo}
                      onClick={() => setSelectedCiclo(ciclo)}
                      className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        selectedCiclo === ciclo
                          ? 'bg-indigo-700 text-white shadow-xs'
                          : 'text-indigo-900 hover:bg-indigo-100'
                      }`}
                    >
                      <span>{ciclo}</span>
                      {isSubmitted ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                      ) : (
                        <span className="text-[9.5px] opacity-80">({cicloObj?.submittedClassesCount || 0}/{cicloObj?.totalClasses || 0})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PAINEL DO CICLO SELECIONADO */}
            {currentCicloData && (
              <div className="mt-3.5 space-y-3.5">
                
                {/* Header de Identificação do Ciclo */}
                <div className="p-3 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      {currentCicloData.cicloLabel}
                      <span className="bg-indigo-500/40 text-indigo-200 text-[10px] px-2 py-0.5 rounded font-mono font-bold border border-indigo-400/30">
                        {currentCicloData.gradesIncluded.join(', ')}
                      </span>
                    </h4>
                    <p className="text-[10.5px] text-indigo-200 mt-0.5">
                      Responsável Pedagógico: <strong>{currentCicloData.pedagogicalName}</strong> • {currentCicloData.schoolName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10.5px] px-2.5 py-1 rounded font-bold border ${
                      currentCicloData.status === 'Submetido à Direcção'
                        ? 'bg-emerald-500 text-white border-emerald-400'
                        : 'bg-amber-500 text-slate-900 border-amber-400'
                    }`}>
                      {currentCicloData.status}
                    </span>

                    <Button
                      onClick={() => handleCicloSubmit(currentCicloData.ciclo)}
                      className={`text-xs font-bold gap-1.5 px-3 py-1.5 shadow-sm text-white ${
                        currentCicloData.status === 'Submetido à Direcção'
                          ? 'bg-emerald-700 hover:bg-emerald-600'
                          : 'bg-indigo-600 hover:bg-indigo-500'
                      }`}
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      {currentCicloData.status === 'Submetido à Direcção' 
                        ? 'Re-submeter à Direcção' 
                        : 'Transformar & Submeter à Direcção'}
                    </Button>
                  </div>
                </div>

                {/* Síntese Estatística do Ciclo */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-indigo-700">Total Alunos Ciclo</p>
                    <p className="text-base font-black text-indigo-950 font-mono mt-0.5">{currentCicloData.totalStudents}</p>
                    <p className="text-[9.5px] text-indigo-600">{currentCicloData.totalClasses} Turmas</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-slate-600">Masculino (M)</p>
                    <p className="text-base font-black text-slate-900 font-mono mt-0.5">{currentCicloData.maleStudents}</p>
                    <p className="text-[9.5px] text-slate-500">{Math.round((currentCicloData.maleStudents/currentCicloData.totalStudents)*100)}%</p>
                  </div>
                  <div className="p-2.5 bg-pink-50/70 border border-pink-200 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-pink-700">Feminino (F)</p>
                    <p className="text-base font-black text-pink-950 font-mono mt-0.5">{currentCicloData.femaleStudents}</p>
                    <p className="text-[9.5px] text-pink-600">{Math.round((currentCicloData.femaleStudents/currentCicloData.totalStudents)*100)}%</p>
                  </div>
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-emerald-700">Aprovados Ciclo</p>
                    <p className="text-base font-black text-emerald-950 font-mono mt-0.5">{currentCicloData.approvedCount}</p>
                    <p className="text-[9.5px] text-emerald-600 font-bold">{currentCicloData.passRate}% Taxa</p>
                  </div>
                  <div className="p-2.5 bg-red-50/70 border border-red-200 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-red-700">Reprovados</p>
                    <p className="text-base font-black text-red-950 font-mono mt-0.5">{currentCicloData.reprovedCount}</p>
                    <p className="text-[9.5px] text-red-600">{Math.round((currentCicloData.reprovedCount/currentCicloData.totalStudents)*100)}%</p>
                  </div>
                  <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-lg text-center">
                    <p className="text-[10px] uppercase font-bold text-purple-700">Média Global</p>
                    <p className="text-base font-black text-purple-950 font-mono mt-0.5">{currentCicloData.averageGrade} v</p>
                    <p className="text-[9.5px] text-purple-600">Assid: {currentCicloData.attendanceRate}%</p>
                  </div>
                </div>

                {/* Tabela das Turmas Integrantes do Ciclo */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="p-2.5 bg-slate-100 font-bold text-slate-800 text-xs flex justify-between items-center">
                    <span>Turmas do {currentCicloData.ciclo} ({currentCicloData.classes.length} Turmas)</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Submissões Concluídas: <strong>{currentCicloData.submittedClassesCount} / {currentCicloData.totalClasses}</strong>
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 text-[10.5px] border-b border-slate-200">
                        <tr>
                          <th className="p-2">Turma / Classe</th>
                          <th className="p-2">Prof. Director</th>
                          <th className="p-2 text-center">Total</th>
                          <th className="p-2 text-center">M / F</th>
                          <th className="p-2 text-center">Aprovados</th>
                          <th className="p-2 text-center">Média</th>
                          <th className="p-2 text-center">Estado</th>
                          <th className="p-2 text-right">Acção</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {currentCicloData.classes.map((c) => (
                          <tr key={c.classId} className="hover:bg-slate-50">
                            <td className="p-2 font-bold text-slate-900">{c.className} <span className="text-slate-400 font-normal">({c.gradeLevel})</span></td>
                            <td className="p-2 text-slate-600">{c.teacherName}</td>
                            <td className="p-2 text-center font-mono font-bold">{c.totalStudents}</td>
                            <td className="p-2 text-center font-mono text-[11px]">
                              <span className="text-blue-600">{c.maleStudents}</span> / <span className="text-pink-600">{c.femaleStudents}</span>
                            </td>
                            <td className="p-2 text-center font-mono font-bold text-emerald-700">
                              {c.approvedCount} <span className="text-[10px] text-slate-400 font-normal">({Math.round((c.approvedCount/c.totalStudents)*100)}%)</span>
                            </td>
                            <td className="p-2 text-center font-mono font-bold text-purple-700">{c.averageGrade} v</td>
                            <td className="p-2 text-center">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                c.status === 'Pendente' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="p-2 text-right">
                              {c.status === 'Pendente' ? (
                                <button
                                  onClick={() => handleTeacherSubmit(c.classId)}
                                  className="text-[10.5px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded"
                                >
                                  Forçar Validação
                                </button>
                              ) : (
                                <span className="text-[10.5px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Validado
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: DIRETOR DA ESCOLA (CONSOLIDAÇÃO DOS 3 CICLOS E ENVIO AO DISTRITO) */}
      {/* ========================================================================= */}
      {currentLevel === 'escola' && activeSchool && (
        <div className="space-y-4">
          <div id="print-school-stats" className="bg-white border-2 border-purple-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 text-purple-800 rounded-xl shadow-xs">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-800 border border-purple-200">
                    Direcção da Escola • Boletim Estatístico Oficial
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                    {activeSchool.schoolName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Director: <strong>{activeSchool.directorName}</strong> • {activeSchool.districtName} ({activeSchool.provinceName})
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto no-print">
                {currentDistrict?.schools && currentDistrict.schools.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-600 pl-2">Escola:</span>
                    <select
                      value={activeSchool.id}
                      onChange={(e) => setSelectedSchoolId(e.target.value)}
                      className="text-xs font-bold bg-white text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-purple-500 focus:outline-hidden max-w-[200px] truncate"
                    >
                      {currentDistrict.schools.map(s => (
                        <option key={s.id} value={s.id}>{s.schoolName}</option>
                      ))}
                    </select>
                  </div>
                )}

                <Button
                  onClick={() => triggerPrint({ elementId: 'print-school-stats', title: `Boletim Estatístico da Escola - ${activeSchool.schoolName}` })}
                  variant="outline"
                  className="text-xs font-bold border-purple-300 text-purple-800 hover:bg-purple-50 gap-1.5 py-2 px-3"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir Escola (A4)
                </Button>

                <Button
                  onClick={handleSchoolSubmit}
                  className="text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white gap-1.5 px-4 py-2 shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  {activeSchool.status === 'Submetido ao Distrito' ? 'Re-submeter ao SDEJT' : 'Submeter ao Distrito (SDEJT)'}
                </Button>
              </div>
            </div>

            {/* Cartões de Indicadores da Escola com Alunos Repetentes Destacados */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-purple-700">Total Alunos Escola</p>
                <p className="text-xl font-black text-purple-950 font-mono mt-0.5">{activeSchool.totalStudents.toLocaleString()}</p>
                <p className="text-[10px] text-purple-600 font-semibold">{activeSchool.totalClasses} Turmas</p>
              </div>

              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-blue-700">Por Sexo (M / F)</p>
                <p className="text-sm font-black text-blue-950 font-mono mt-1">
                  <span className="text-blue-700">{activeSchool.maleStudents} H</span> • <span className="text-pink-600">{activeSchool.femaleStudents} M</span>
                </p>
                <p className="text-[10px] text-blue-600 font-semibold">
                  {Math.round((activeSchool.maleStudents / (activeSchool.totalStudents || 1)) * 100)}% H • {Math.round((activeSchool.femaleStudents / (activeSchool.totalStudents || 1)) * 100)}% M
                </p>
              </div>

              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-amber-700">Alunos Repetentes</p>
                <p className="text-xl font-black text-amber-950 font-mono mt-0.5">{activeSchool.reprovedCount}</p>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-amber-200 text-amber-900 mt-0.5">
                  Taxa: {Math.round((activeSchool.reprovedCount / (activeSchool.totalStudents || 1)) * 100)}%
                </span>
              </div>

              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-emerald-700">Taxa de Aprovação</p>
                <p className="text-xl font-black text-emerald-950 font-mono mt-0.5">{activeSchool.passRate}%</p>
                <p className="text-[10px] text-emerald-600 font-semibold">{activeSchool.approvedCount} Aprovados</p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-slate-700">Corpo Docente</p>
                <p className="text-xl font-black text-slate-900 font-mono mt-0.5">{activeSchool.totalDocentes}</p>
                <p className="text-[10px] text-slate-500 font-semibold">Rácio: 1:{Math.round(activeSchool.totalStudents / (activeSchool.totalDocentes || 1))}</p>
              </div>

              <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-indigo-700">Média Geral</p>
                <p className="text-xl font-black text-indigo-950 font-mono mt-0.5">{activeSchool.averageGrade} v</p>
                <p className="text-[10px] text-indigo-600 font-semibold">{activeSchool.totalCTA} CTA</p>
              </div>
            </div>

            {/* Cartão de Consolidação da Escola */}
            <div className="mt-3.5 space-y-3">
              
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg flex flex-wrap justify-between items-center gap-2">
                <div>
                  <p className="font-bold text-purple-950 text-sm">{activeSchool.schoolName}</p>
                  <p className="text-[10.5px] text-purple-700">
                    Director: <strong>{activeSchool.directorName}</strong> • Distrito: <strong>{activeSchool.districtName}</strong> ({activeSchool.provinceName})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-purple-200 text-purple-900 px-2.5 py-0.5 rounded font-mono font-bold">
                    Estado: {activeSchool.status}
                  </span>
                  {activeSchool.signedByDirector && (
                    <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Assinado & Visado
                    </span>
                  )}
                </div>
              </div>

              {/* Tabela Consolidada dos 3 Ciclos */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 text-[11px]">
                    <tr>
                      <th className="p-2.5">Ciclo Pedagógico</th>
                      <th className="p-2.5">Responsável (DAP)</th>
                      <th className="p-2.5 text-center">Turmas</th>
                      <th className="p-2.5 text-center">Alunos Totais</th>
                      <th className="p-2.5 text-center">M / F</th>
                      <th className="p-2.5 text-center">Aprovados</th>
                      <th className="p-2.5 text-center">Taxa (%)</th>
                      <th className="p-2.5 text-center">Média</th>
                      <th className="p-2.5 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {activeSchool.ciclos.map(ciclo => (
                      <tr key={ciclo.id} className="hover:bg-purple-50/40">
                        <td className="p-2.5 font-bold text-indigo-900">{ciclo.ciclo}</td>
                        <td className="p-2.5 text-slate-700">{ciclo.pedagogicalName}</td>
                        <td className="p-2.5 text-center font-mono font-bold">{ciclo.totalClasses}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-blue-900">{ciclo.totalStudents}</td>
                        <td className="p-2.5 text-center font-mono text-[11px]">
                          <span className="text-blue-600">{ciclo.maleStudents}</span> / <span className="text-pink-600">{ciclo.femaleStudents}</span>
                        </td>
                        <td className="p-2.5 text-center font-mono font-bold text-emerald-700">{ciclo.approvedCount}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-emerald-800">{ciclo.passRate}%</td>
                        <td className="p-2.5 text-center font-mono font-bold text-purple-700">{ciclo.averageGrade} v</td>
                        <td className="p-2.5 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            ciclo.status === 'Submetido à Direcção' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ciclo.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Linha Total da Escola */}
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                      <td className="p-2.5 uppercase tracking-wider text-purple-900" colSpan={2}>Total Consolidado da Escola</td>
                      <td className="p-2.5 text-center font-mono">{activeSchool.totalClasses}</td>
                      <td className="p-2.5 text-center font-mono text-blue-950">{activeSchool.totalStudents}</td>
                      <td className="p-2.5 text-center font-mono">
                        <span className="text-blue-600">{activeSchool.maleStudents}</span> / <span className="text-pink-600">{activeSchool.femaleStudents}</span>
                      </td>
                      <td className="p-2.5 text-center font-mono text-emerald-700">{activeSchool.approvedCount}</td>
                      <td className="p-2.5 text-center font-mono text-emerald-900">{activeSchool.passRate}%</td>
                      <td className="p-2.5 text-center font-mono text-purple-900">{activeSchool.averageGrade} v</td>
                      <td className="p-2.5 text-center">
                        <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded font-bold">Consolidado</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 4: DISTRITO (SDEJT - ESTATÍSTICA DE TODAS AS ESCOLAS DO DISTRITO)   */}
      {/* ========================================================================= */}
      {currentLevel === 'distrito' && currentDistrict && (
        <div className="space-y-4">
          <div id="print-district-stats" className="bg-white border-2 border-teal-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            {/* Header & Seletores */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-teal-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-100 text-teal-800 rounded-xl shadow-xs">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
                    SDEJT • Serviços Distritais de Educação, Juventude e Tecnologia
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                    Estatística Distrital: Todas as Escolas de {currentDistrict.districtName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Província: <strong>{currentDistrict.provinceName}</strong> • Ano Lectivo {currentYear} • 1º Trimestre
                  </p>
                </div>
              </div>

              {/* Controles de Província, Distrito e Ações */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto no-print">
                <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 pl-2">Província:</span>
                  <select
                    value={selectedProvinceName}
                    onChange={(e) => {
                      setSelectedProvinceName(e.target.value);
                    }}
                    className="text-xs font-bold bg-white text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    {nationalData.provinces.map(p => (
                      <option key={p.id} value={p.provinceName}>{p.provinceName}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-teal-50/70 p-1.5 rounded-xl border border-teal-200">
                  <span className="text-[11px] font-bold text-teal-900 pl-2">Distrito:</span>
                  <select
                    value={currentDistrict.districtName}
                    onChange={(e) => setSelectedDistrictName(e.target.value)}
                    className="text-xs font-bold bg-white text-teal-950 border border-teal-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    {currentProvince?.districts.map(d => (
                      <option key={d.id} value={d.districtName}>{d.districtName}</option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={() => triggerPrint({ elementId: 'print-district-stats', title: `Estatística Distrital SDEJT - ${currentDistrict.districtName}` })}
                  variant="outline"
                  className="text-xs font-bold border-teal-300 text-teal-800 hover:bg-teal-50 gap-1.5 py-2 px-3"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir SDEJT (A4)
                </Button>

                <Button
                  onClick={handleDistrictSubmit}
                  className="text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white gap-1.5 px-4 py-2 shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  {currentDistrict.status === 'Submetido à Província' ? 'Re-submeter à Província' : 'Submeter à DPE (Província)'}
                </Button>
              </div>
            </div>

            {/* Cartões de Indicadores Agregados do Distrito */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-teal-700">Escolas no Distrito</p>
                <p className="text-xl font-black text-teal-950 font-mono mt-0.5">{currentDistrict.totalSchools}</p>
                <p className="text-[10px] text-teal-600 font-semibold">{currentDistrict.submittedSchoolsCount} Submetidas</p>
              </div>

              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-blue-700">Total Alunos Distrito</p>
                <p className="text-xl font-black text-blue-950 font-mono mt-0.5">{currentDistrict.totalStudents.toLocaleString()}</p>
                <p className="text-[10px] text-blue-600 font-semibold">
                  <span className="text-blue-700">{currentDistrict.maleStudents.toLocaleString()} M</span> • <span className="text-pink-600">{currentDistrict.femaleStudents.toLocaleString()} F</span>
                </p>
              </div>

              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-amber-700">Alunos Repetentes</p>
                <p className="text-xl font-black text-amber-950 font-mono mt-0.5">{currentDistrict.reprovedCount.toLocaleString()}</p>
                <p className="text-[10px] text-amber-700 font-semibold">
                  {Math.round((currentDistrict.reprovedCount / (currentDistrict.totalStudents || 1)) * 100)}% Retenção
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-emerald-700">Taxa de Aprovação</p>
                <p className="text-xl font-black text-emerald-950 font-mono mt-0.5">{currentDistrict.passRate}%</p>
                <p className="text-[10px] text-emerald-600 font-semibold">{currentDistrict.approvedCount.toLocaleString()} Aprovados</p>
              </div>

              <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-purple-700">Docentes Distritais</p>
                <p className="text-xl font-black text-purple-950 font-mono mt-0.5">{currentDistrict.totalDocentes.toLocaleString()}</p>
                <p className="text-[10px] text-purple-600 font-semibold">Rácio: 1:{Math.round(currentDistrict.totalStudents / (currentDistrict.totalDocentes || 1))}</p>
              </div>

              <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-indigo-700">Rede de Turmas</p>
                <p className="text-xl font-black text-indigo-950 font-mono mt-0.5">{currentDistrict.totalClasses}</p>
                <p className="text-[10px] text-indigo-600 font-semibold">{currentDistrict.totalCTA} CTA</p>
              </div>
            </div>

            {/* TABELA DE TODAS AS ESCOLAS DO DISTRITO */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <School className="h-4 w-4 text-teal-700" />
                    Lista de Todas as Escolas do Distrito de {currentDistrict.districtName} ({currentDistrict.schools?.length || 0})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Desempenho individual, população de alunos, repetentes, docentes e estado da submissão estatística de cada escola.
                  </p>
                </div>

                <div className="relative w-full sm:w-64 no-print">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar escola..."
                    value={districtSchoolSearch}
                    onChange={(e) => setDistrictSchoolSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 text-[11px] font-extrabold uppercase tracking-wider">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Escola do Distrito</th>
                        <th className="p-3 text-center">Código</th>
                        <th className="p-3 text-center">Turmas</th>
                        <th className="p-3 text-center">Alunos (H / M)</th>
                        <th className="p-3 text-center">Repetentes</th>
                        <th className="p-3 text-center">Docentes</th>
                        <th className="p-3 text-center">Aprovação (%)</th>
                        <th className="p-3 text-center">Média</th>
                        <th className="p-3 text-center">Estado SDEJT</th>
                        <th className="p-3 text-center no-print">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {(currentDistrict.schools || [])
                        .filter(s => 
                          s.schoolName.toLowerCase().includes(districtSchoolSearch.toLowerCase()) || 
                          s.schoolCode.toLowerCase().includes(districtSchoolSearch.toLowerCase())
                        )
                        .map((sch, idx) => (
                          <tr key={sch.id || idx} className="hover:bg-teal-50/40 transition-colors">
                            <td className="p-3 font-mono font-bold text-slate-400 text-center">{idx + 1}</td>
                            <td className="p-3">
                              <p className="font-extrabold text-slate-900">{sch.schoolName}</p>
                              <p className="text-[10px] text-slate-500">{sch.directorName}</p>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-600">{sch.schoolCode}</td>
                            <td className="p-3 text-center font-mono font-bold">{sch.totalClasses}</td>
                            <td className="p-3 text-center font-mono">
                              <div className="font-bold text-slate-900">{sch.totalStudents.toLocaleString()}</div>
                              <div className="text-[10px]">
                                <span className="text-blue-600 font-semibold">{sch.maleStudents} M</span> • <span className="text-pink-600 font-semibold">{sch.femaleStudents} F</span>
                              </div>
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                {sch.reprovedCount} Repet.
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="font-bold text-slate-800">{sch.totalDocentes}</span>
                              <span className="text-[10px] text-slate-400 block">1:{Math.round(sch.totalStudents / (sch.totalDocentes || 1))}</span>
                            </td>
                            <td className="p-3 text-center font-mono">
                              <div className="font-extrabold text-emerald-700">{sch.passRate}%</div>
                              <div className="w-16 bg-slate-100 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${sch.passRate >= 80 ? 'bg-emerald-500' : sch.passRate >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                  style={{ width: `${Math.min(100, sch.passRate)}%` }}
                                />
                              </div>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-indigo-700">
                              {sch.averageGrade} v
                            </td>
                            <td className="p-3 text-center">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                                sch.status === 'Validado pelo SDEJT' 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                  : sch.status === 'Submetido ao Distrito' 
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                {sch.status}
                              </span>
                            </td>
                            <td className="p-3 text-center no-print">
                              <Button
                                onClick={() => {
                                  setSelectedSchoolId(sch.id);
                                  setCurrentLevel('escola');
                                }}
                                variant="outline"
                                className="text-[11px] font-bold py-1 px-2.5 text-teal-700 border-teal-300 hover:bg-teal-50 gap-1"
                              >
                                <Eye className="h-3 w-3" /> Ver Escola
                              </Button>
                            </td>
                          </tr>
                        ))}

                      {/* Linha Totalizadora do Distrito */}
                      <tr className="bg-teal-900 text-white font-extrabold text-xs border-t-2 border-teal-950">
                        <td className="p-3 text-center" colSpan={3}>
                          TOTAL CONSOLIDADO DO DISTRITO DE {currentDistrict.districtName.toUpperCase()}
                        </td>
                        <td className="p-3 text-center font-mono">{currentDistrict.totalClasses}</td>
                        <td className="p-3 text-center font-mono">
                          {currentDistrict.totalStudents.toLocaleString()}
                          <span className="text-[10px] text-teal-200 block font-normal">
                            {currentDistrict.maleStudents.toLocaleString()} M • {currentDistrict.femaleStudents.toLocaleString()} F
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-amber-300">
                          {currentDistrict.reprovedCount.toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-mono">
                          {currentDistrict.totalDocentes.toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-mono text-emerald-300">
                          {currentDistrict.passRate}%
                        </td>
                        <td className="p-3 text-center font-mono text-teal-100">
                          {currentDistrict.averageGrade} v
                        </td>
                        <td className="p-3 text-center" colSpan={2}>
                          {currentDistrict.submittedSchoolsCount} de {currentDistrict.totalSchools} escolas validadas
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* GRÁFICOS COMPARATIVOS ENTRE AS ESCOLAS DO DISTRITO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <Card className="p-4 border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-teal-600" />
                    Comparativo de Taxa de Aprovação (%) por Escola
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">Média: {currentDistrict.passRate}%</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(currentDistrict.schools || []).map(s => ({
                        name: s.schoolName.replace('Escola Secundária ', 'ES ').replace('Escola Primária Completa ', 'EPC ').replace('Instituto ', 'Inst. '),
                        Taxa: s.passRate
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 9.5 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: any) => [`${value}%`, 'Taxa de Aprovação']} />
                      <Bar dataKey="Taxa" fill="#0d9488" radius={[4, 4, 0, 0]}>
                        {(currentDistrict.schools || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.passRate >= 80 ? '#10b981' : entry.passRate >= 70 ? '#0d9488' : '#f59e0b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-4 border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-blue-600" />
                    População Estudantil por Escola no Distrito
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">Total: {currentDistrict.totalStudents.toLocaleString()}</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(currentDistrict.schools || []).map(s => ({
                        name: s.schoolName.replace('Escola Secundária ', 'ES ').replace('Escola Primária Completa ', 'EPC ').replace('Instituto ', 'Inst. '),
                        Alunos: s.totalStudents
                      }))}
                      margin={{ top: 10, right: 10, left: -10, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 9.5 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: any) => [value.toLocaleString(), 'Total Alunos']} />
                      <Bar dataKey="Alunos" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 5: PROVÍNCIA (DPEDH - ESTATÍSTICA DE TODOS OS DISTRITOS)              */}
      {/* ========================================================================= */}
      {currentLevel === 'provincia' && currentProvince && (
        <div className="space-y-4">
          <div id="print-province-stats" className="bg-white border-2 border-amber-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            {/* Header & Seletores */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-amber-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-800 rounded-xl shadow-xs">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                    DPEDH • Direcção Provincial de Educação e Desenvolvimento Humano
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                    Estatística Provincial: Todos os Distritos de {currentProvince.provinceName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Capital Provincial: <strong>{currentProvince.capital}</strong> • Ano Lectivo {currentYear} • Consolidação Provincial
                  </p>
                </div>
              </div>

              {/* Controles de Província e Ações */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto no-print">
                <div className="flex items-center gap-1.5 bg-amber-50/70 p-1.5 rounded-xl border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-900 pl-2">Província:</span>
                  <select
                    value={selectedProvinceName}
                    onChange={(e) => setSelectedProvinceName(e.target.value)}
                    className="text-xs font-bold bg-white text-amber-950 border border-amber-300 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    {nationalData.provinces.map(p => (
                      <option key={p.id} value={p.provinceName}>{p.provinceName}</option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={() => triggerPrint({ elementId: 'print-province-stats', title: `Estatística Provincial DPEDH - ${currentProvince.provinceName}` })}
                  variant="outline"
                  className="text-xs font-bold border-amber-300 text-amber-800 hover:bg-amber-50 gap-1.5 py-2 px-3"
                >
                  <Printer className="h-4 w-4" />
                  Imprimir DPEDH (A4)
                </Button>

                <Button
                  onClick={handleProvinceSubmit}
                  className="text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white gap-1.5 px-4 py-2 shadow-xs"
                >
                  <Send className="h-3.5 w-3.5" />
                  {currentProvince.status === 'Submetido ao Ministério' ? 'Re-submeter ao MINEDH' : 'Submeter ao Ministério (MINEDH)'}
                </Button>
              </div>
            </div>

            {/* Cartões de Indicadores Agregados da Província */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-amber-700">Distritos na Província</p>
                <p className="text-xl font-black text-amber-950 font-mono mt-0.5">{currentProvince.totalDistricts}</p>
                <p className="text-[10px] text-amber-600 font-semibold">{currentProvince.submittedDistrictsCount} Submetidos</p>
              </div>

              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-blue-700">Alunos na Província</p>
                <p className="text-xl font-black text-blue-950 font-mono mt-0.5">{currentProvince.totalStudents.toLocaleString()}</p>
                <p className="text-[10px] text-blue-600 font-semibold">
                  <span className="text-blue-700">{currentProvince.maleStudents.toLocaleString()} M</span> • <span className="text-pink-600">{currentProvince.femaleStudents.toLocaleString()} F</span>
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-emerald-700">Taxa de Aprovação</p>
                <p className="text-xl font-black text-emerald-950 font-mono mt-0.5">{currentProvince.passRate}%</p>
                <p className="text-[10px] text-emerald-600 font-semibold">{currentProvince.approvedCount.toLocaleString()} Aprovados</p>
              </div>

              <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-purple-700">Rede de Escolas</p>
                <p className="text-xl font-black text-purple-950 font-mono mt-0.5">{currentProvince.totalSchools}</p>
                <p className="text-[10px] text-purple-600 font-semibold">{currentProvince.totalClasses} Turmas</p>
              </div>

              <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-indigo-700">Corpo Docente & CTA</p>
                <p className="text-xl font-black text-indigo-950 font-mono mt-0.5">{(currentProvince.totalDocentes + currentProvince.totalCTA).toLocaleString()}</p>
                <p className="text-[10px] text-indigo-600 font-semibold">{currentProvince.totalDocentes.toLocaleString()} Docentes</p>
              </div>

              <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl text-center">
                <p className="text-[10px] uppercase font-bold text-rose-700">Retenção Escolar</p>
                <p className="text-xl font-black text-rose-950 font-mono mt-0.5">{currentProvince.reprovedCount.toLocaleString()}</p>
                <p className="text-[10px] text-rose-600 font-semibold">Reprovados / Repetentes</p>
              </div>
            </div>

            {/* TABELA DE TODOS OS DISTRITOS DA PROVÍNCIA */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-700" />
                    Lista de Todos os Distritos da Província de {currentProvince.provinceName} ({currentProvince.districts?.length || 0})
                  </h4>
                  <p className="text-xs text-slate-500">
                    Acompanhamento integrado de escolas, alunos, professores e taxa de aproveitamento por distrito.
                  </p>
                </div>

                <div className="relative w-full sm:w-64 no-print">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar distrito..."
                    value={provinceDistrictSearch}
                    onChange={(e) => setProvinceDistrictSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 text-[11px] font-extrabold uppercase tracking-wider">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Distrito (SDEJT)</th>
                        <th className="p-3 text-center">Escolas</th>
                        <th className="p-3 text-center">Turmas</th>
                        <th className="p-3 text-center">Alunos Totais (H / M)</th>
                        <th className="p-3 text-center">Docentes</th>
                        <th className="p-3 text-center">Rácio</th>
                        <th className="p-3 text-center">Aprovação (%)</th>
                        <th className="p-3 text-center">Abandono (%)</th>
                        <th className="p-3 text-center">Estado DPE</th>
                        <th className="p-3 text-center no-print">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {(currentProvince.districts || [])
                        .filter(d => d.districtName.toLowerCase().includes(provinceDistrictSearch.toLowerCase()))
                        .map((dist, idx) => (
                          <tr key={dist.id || idx} className="hover:bg-amber-50/40 transition-colors">
                            <td className="p-3 font-mono font-bold text-slate-400 text-center">{idx + 1}</td>
                            <td className="p-3">
                              <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-amber-600" />
                                {dist.districtName}
                              </p>
                              <p className="text-[10px] text-slate-500">{dist.submittedSchoolsCount} de {dist.totalSchools} escolas submetidas</p>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-indigo-900">{dist.totalSchools}</td>
                            <td className="p-3 text-center font-mono font-bold">{dist.totalClasses}</td>
                            <td className="p-3 text-center font-mono">
                              <div className="font-bold text-slate-900">{dist.totalStudents.toLocaleString()}</div>
                              <div className="text-[10px]">
                                <span className="text-blue-600 font-semibold">{dist.maleStudents.toLocaleString()} M</span> • <span className="text-pink-600 font-semibold">{dist.femaleStudents.toLocaleString()} F</span>
                              </div>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-800">
                              {dist.totalDocentes.toLocaleString()}
                            </td>
                            <td className="p-3 text-center font-mono text-[11px] text-slate-600">
                              1:{Math.round(dist.totalStudents / (dist.totalDocentes || 1))}
                            </td>
                            <td className="p-3 text-center font-mono">
                              <div className="font-extrabold text-emerald-700">{dist.passRate}%</div>
                              <div className="w-16 bg-slate-100 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${dist.passRate >= 80 ? 'bg-emerald-500' : dist.passRate >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                  style={{ width: `${Math.min(100, dist.passRate)}%` }}
                                />
                              </div>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-rose-700">
                              {Math.round((dist.droppedCount / (dist.totalStudents || 1)) * 1000) / 10}%
                            </td>
                            <td className="p-3 text-center">
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                                dist.status === 'Validado pela DPE' 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                {dist.status}
                              </span>
                            </td>
                            <td className="p-3 text-center no-print">
                              <Button
                                onClick={() => {
                                  setSelectedDistrictName(dist.districtName);
                                  setCurrentLevel('distrito');
                                }}
                                variant="outline"
                                className="text-[11px] font-bold py-1 px-2.5 text-amber-800 border-amber-300 hover:bg-amber-50 gap-1"
                              >
                                <Eye className="h-3 w-3" /> Ver Escolas
                              </Button>
                            </td>
                          </tr>
                        ))}

                      {/* Linha Totalizadora da Província */}
                      <tr className="bg-amber-950 text-white font-extrabold text-xs border-t-2 border-amber-900">
                        <td className="p-3 text-center" colSpan={2}>
                          TOTAL CONSOLIDADO DA PROVÍNCIA DE {currentProvince.provinceName.toUpperCase()}
                        </td>
                        <td className="p-3 text-center font-mono text-amber-200">{currentProvince.totalSchools}</td>
                        <td className="p-3 text-center font-mono">{currentProvince.totalClasses}</td>
                        <td className="p-3 text-center font-mono">
                          {currentProvince.totalStudents.toLocaleString()}
                          <span className="text-[10px] text-amber-200 block font-normal">
                            {currentProvince.maleStudents.toLocaleString()} M • {currentProvince.femaleStudents.toLocaleString()} F
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono">
                          {currentProvince.totalDocentes.toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-mono text-[11px]">
                          1:{Math.round(currentProvince.totalStudents / (currentProvince.totalDocentes || 1))}
                        </td>
                        <td className="p-3 text-center font-mono text-emerald-300">
                          {currentProvince.passRate}%
                        </td>
                        <td className="p-3 text-center font-mono text-rose-300">
                          {Math.round((currentProvince.droppedCount / (currentProvince.totalStudents || 1)) * 1000) / 10}%
                        </td>
                        <td className="p-3 text-center" colSpan={2}>
                          {currentProvince.submittedDistrictsCount} de {currentProvince.totalDistricts} distritos validados
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* GRÁFICOS COMPARATIVOS ENTRE OS DISTRITOS DA PROVÍNCIA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
              <Card className="p-4 border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-amber-600" />
                    Taxa Média de Aprovação (%) por Distrito na Província
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">Média Prov.: {currentProvince.passRate}%</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(currentProvince.districts || []).map(d => ({
                        name: d.districtName.replace('Distrito ', '').replace('Municipal ', ''),
                        Taxa: d.passRate
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 9.5 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: any) => [`${value}%`, 'Taxa de Aprovação']} />
                      <Bar dataKey="Taxa" fill="#d97706" radius={[4, 4, 0, 0]}>
                        {(currentProvince.districts || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.passRate >= 80 ? '#10b981' : entry.passRate >= 75 ? '#d97706' : '#f59e0b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-4 border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-blue-600" />
                    População Escolar por Distrito
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">Total: {currentProvince.totalStudents.toLocaleString()}</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(currentProvince.districts || []).map(d => ({
                        name: d.districtName.replace('Distrito ', '').replace('Municipal ', ''),
                        Alunos: d.totalStudents
                      }))}
                      margin={{ top: 10, right: 10, left: -10, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" angle={-35} textAnchor="end" interval={0} tick={{ fontSize: 9.5 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: any) => [value.toLocaleString(), 'Total Alunos']} />
                      <Bar dataKey="Alunos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 6: MINISTÉRIO (MINEDH - ESTATÍSTICA NACIONAL CONSOLIDADA)            */}
      {/* ========================================================================= */}
      {currentLevel === 'nacional' && (
        <div className="space-y-3">
          
          <div className="bg-white border-2 border-red-200 rounded-xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-red-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-red-900 text-amber-400 rounded-lg">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Ministério da Educação e Desenvolvimento Humano (MINEDH)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Estatística Oficial Nacional • Agregação das 11 Províncias de Moçambique (Todos os Alunos do País)
                  </p>
                </div>
              </div>

              <Button
                onClick={handleNationalConsolidate}
                className="text-xs font-bold bg-red-900 hover:bg-red-800 text-white gap-1.5 px-4 py-2 shadow-sm"
              >
                <Award className="h-4 w-4 text-amber-300" />
                Homologar & Publicar Censo Nacional
              </Button>
            </div>

            {/* GRAND TOTAL NACIONAL */}
            <div className="mt-3.5 space-y-3">
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg text-center">
                  <p className="text-[10px] uppercase font-bold text-red-700">Total Nacional Alunos</p>
                  <p className="text-lg font-black text-red-950 font-mono mt-0.5">{nationalData.totalStudents.toLocaleString()}</p>
                  <p className="text-[9.5px] text-red-600">Todo o Território</p>
                </div>
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-center">
                  <p className="text-[10px] uppercase font-bold text-blue-700">Alunos (Masculino)</p>
                  <p className="text-lg font-black text-blue-950 font-mono mt-0.5">{nationalData.maleStudents.toLocaleString()}</p>
                  <p className="text-[9.5px] text-blue-600">{Math.round((nationalData.maleStudents/nationalData.totalStudents)*100)}% Nacional</p>
                </div>
                <div className="p-3 bg-pink-50/70 border border-pink-200 rounded-lg text-center">
                  <p className="text-[10px] uppercase font-bold text-pink-700">Alunas (Feminino)</p>
                  <p className="text-lg font-black text-pink-950 font-mono mt-0.5">{nationalData.femaleStudents.toLocaleString()}</p>
                  <p className="text-[9.5px] text-pink-600">{Math.round((nationalData.femaleStudents/nationalData.totalStudents)*100)}% Nacional</p>
                </div>
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-center">
                  <p className="text-[10px] uppercase font-bold text-emerald-700">Aprovados País</p>
                  <p className="text-lg font-black text-emerald-950 font-mono mt-0.5">{nationalData.approvedCount.toLocaleString()}</p>
                  <p className="text-[9.5px] text-emerald-600 font-bold">{nationalData.passRate}% Taxa Nacional</p>
                </div>
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-center">
                  <p className="text-[10px] uppercase font-bold text-purple-700">Rede de Escolas</p>
                  <p className="text-lg font-black text-purple-950 font-mono mt-0.5">{nationalData.totalSchools.toLocaleString()}</p>
                  <p className="text-[9.5px] text-purple-600">{nationalData.totalClasses.toLocaleString()} Turmas</p>
                </div>
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-center">
                  <p className="text-[10px] uppercase font-bold text-indigo-700">Efetivo Docente & CTA</p>
                  <p className="text-lg font-black text-indigo-950 font-mono mt-0.5">{(nationalData.totalDocentes + nationalData.totalCTA).toLocaleString()}</p>
                  <p className="text-[9.5px] text-indigo-600">{nationalData.totalDocentes.toLocaleString()} Professores</p>
                </div>
              </div>

              {/* Tabela de Todas as 11 Províncias */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="p-2.5 bg-slate-100 font-bold text-slate-800 text-xs flex justify-between items-center">
                  <span>Matriz de Submissão das 11 Províncias de Moçambique</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Províncias Integradas: <strong>{nationalData.submittedProvincesCount} / 11</strong>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 text-[10.5px]">
                      <tr>
                        <th className="p-2">Província</th>
                        <th className="p-2">Capital</th>
                        <th className="p-2 text-center">Distritos</th>
                        <th className="p-2 text-center">Escolas</th>
                        <th className="p-2 text-center">Total Alunos</th>
                        <th className="p-2 text-center">M / F</th>
                        <th className="p-2 text-center">Aprovados</th>
                        <th className="p-2 text-center">Taxa (%)</th>
                        <th className="p-2 text-center">Docentes</th>
                        <th className="p-2 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {nationalData.provinces.map((prov) => (
                        <tr key={prov.id} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-900">{prov.provinceName}</td>
                          <td className="p-2 text-slate-600">{prov.capital}</td>
                          <td className="p-2 text-center font-mono">{prov.totalDistricts}</td>
                          <td className="p-2 text-center font-mono">{prov.totalSchools}</td>
                          <td className="p-2 text-center font-mono font-bold text-blue-900">{prov.totalStudents.toLocaleString()}</td>
                          <td className="p-2 text-center font-mono text-[10.5px]">
                            <span className="text-blue-600">{prov.maleStudents.toLocaleString()}</span> / <span className="text-pink-600">{prov.femaleStudents.toLocaleString()}</span>
                          </td>
                          <td className="p-2 text-center font-mono font-bold text-emerald-700">{prov.approvedCount.toLocaleString()}</td>
                          <td className="p-2 text-center font-mono font-bold text-emerald-800">{prov.passRate}%</td>
                          <td className="p-2 text-center font-mono text-purple-800">{prov.totalDocentes.toLocaleString()}</td>
                          <td className="p-2 text-center">
                            <span className={`text-[9.5px] px-2 py-0.5 rounded font-bold ${
                              prov.status.includes('Ministério') || prov.status.includes('Homologado')
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {prov.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
