import React, { useState } from 'react';
import { useStore } from '../store';
import { TeacherReport } from './TeacherReport';
import { SecretariatOfficialReport } from './SecretariatOfficialReport';
import { DirectorOfficialReport } from './DirectorOfficialReport';
import { ErrorBoundary } from './ErrorBoundary';
import { 
  FileText, GraduationCap, Building2, Landmark, ShieldCheck, UserCheck, Layers 
} from 'lucide-react';

export const CollaboratorReportDispatcher: React.FC = () => {
  const { currentUser, employees } = useStore();

  const currentEmp = (employees || []).find(e => e.id === currentUser?.id || e.email === currentUser?.email);

  // Check collaborator role & leadership status
  const isChefia = 
    ['director', 'pedagogical', 'admin', 'national', 'provincial', 'district'].includes(currentUser?.role || '') ||
    Boolean(currentUser?.subRole?.toLowerCase().includes('chef')) ||
    Boolean(currentUser?.subRole?.toLowerCase().includes('diretor')) ||
    Boolean(currentUser?.subRole?.toLowerCase().includes('coordenador')) ||
    Boolean(currentEmp?.leadershipRole) ||
    Boolean(currentEmp?.isDiretorTurma) ||
    Boolean(currentEmp?.isDelegadoDisciplina) ||
    Boolean(currentEmp?.isDelegadoCiclo);

  const isDocente = currentUser?.role === 'teacher' || currentEmp?.career === 'Docente';

  const isCTA = 
    Boolean(currentUser?.role?.startsWith('secretariat')) || 
    currentUser?.role === 'librarian' ||
    Boolean(currentEmp?.department) ||
    Boolean(currentEmp?.category?.toLowerCase().includes('técnico'));

  // Default active report model based on collaborator profile
  const getDefaultModel = (): 'docente' | 'cta' | 'chefia' => {
    if (isChefia) return 'chefia';
    if (isDocente) return 'docente';
    if (isCTA) return 'cta';
    return 'docente';
  };

  const [selectedModel, setSelectedModel] = useState<'docente' | 'cta' | 'chefia'>(getDefaultModel());

  // Labels and badges for the collaborator
  const collaboratorTitle = 
    currentUser?.role === 'director' ? 'Director da Escola' :
    currentUser?.role === 'pedagogical' ? 'Director Adjunto Pedagógico (DAP)' :
    currentUser?.role === 'teacher' ? 'Docente / Professor do Ensino Geral' :
    currentUser?.role === 'admin' ? 'Administrador de Sistema' :
    currentUser?.role.startsWith('secretariat') ? 'Funcionário da Secretaria / CTA' :
    'Colaborador da Instituição';

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* Collaborator Role Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 mb-1">
            <ShieldCheck className="w-5 h-5 text-blue-700" />
            <span className="text-xs font-bold uppercase tracking-widest">Portal de Relatórios Oficiais • Colaboradores MINEDH</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Relatório de Atividades: {currentUser?.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Modelo otimizado e adequado ao seu perfil: <strong className="text-slate-800">{collaboratorTitle}</strong> ({currentUser?.name}).
          </p>
        </div>

        {/* Model Selector Tabs */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setSelectedModel('docente')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedModel === 'docente'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Modelo Docente</span>
          </button>

          <button
            onClick={() => setSelectedModel('cta')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedModel === 'cta'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Modelo CTA</span>
          </button>

          <button
            onClick={() => setSelectedModel('chefia')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedModel === 'chefia'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Modelo Chefia & Direção</span>
          </button>
        </div>
      </div>

      {/* Render Active Model */}
      <div className="transition-all">
        {selectedModel === 'docente' && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-900 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-700" />
                Relatório Trimestral Padrão MINEDH para Docentes do Ensino Geral (20 Capítulos Regulamentares).
              </span>
              <span className="text-[10px] bg-blue-200 text-blue-950 font-bold px-2 py-0.5 rounded font-mono">
                DOCENTE
              </span>
            </div>
            <ErrorBoundary fallbackTitle="Erro ao Carregar Relatório de Docente">
              <TeacherReport />
            </ErrorBoundary>
          </div>
        )}

        {selectedModel === 'cta' && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-700" />
                Relatório de Cadastro, Expediente e Serviços do Corpo Técnico-Administrativo (CTA).
              </span>
              <span className="text-[10px] bg-amber-200 text-amber-950 font-bold px-2 py-0.5 rounded font-mono">
                CORPO TÉCNICO-ADMINISTRATIVO (CTA)
              </span>
            </div>
            <ErrorBoundary fallbackTitle="Erro ao Carregar Relatório do CTA">
              <SecretariatOfficialReport />
            </ErrorBoundary>
          </div>
        )}

        {selectedModel === 'chefia' && (
          <div className="space-y-3">
            <div className="bg-purple-50 border border-purple-200 p-3 rounded-xl text-xs text-purple-900 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-purple-700" />
                Relatório Oficial da Direção Escolar, Supervisão Pedagógica e Cargos de Chefia.
              </span>
              <span className="text-[10px] bg-purple-200 text-purple-950 font-bold px-2 py-0.5 rounded font-mono">
                CARGOS DE CHEFIA / DIREÇÃO
              </span>
            </div>
            <ErrorBoundary fallbackTitle="Erro ao Carregar Relatório de Chefia/Direção">
              <DirectorOfficialReport />
            </ErrorBoundary>
          </div>
        )}
      </div>
    </div>
  );
};
