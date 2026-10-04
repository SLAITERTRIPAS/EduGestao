import React, { useState } from 'react';
import { useStore } from '../store';
import { MOZAMBIQUE_EMBLEM_URL } from '../types';
import { Card, Button } from '../components/ui';
import { 
  GraduationCap, 
  ArrowRight, 
  ShieldCheck, 
  Building2, 
  BookOpen, 
  FileText, 
  Landmark, 
  Sparkles,
  UserCheck,
  Wallet
} from 'lucide-react';

export function LoginView() {
  const { login } = useStore();
  const [studentIdInput, setStudentIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [studentLoginError, setStudentLoginError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = studentIdInput.trim();
    if (!cleanId) {
      setStudentLoginError('Por favor, preencha o ID ou E-mail.');
      return;
    }

    const success = login(cleanId, passwordInput);
    if (!success) {
      setStudentLoginError('Credenciais inválidas. Verifique o ID/E-mail e a Senha.');
    }
  };

  const handleQuickLogin = (identifier: string, pass: string = '') => {
    setStudentLoginError(null);
    login(identifier, pass);
  };

  const roleProfiles = [
    { label: 'Gestor do Ministério (MINEDH)', roleName: 'national', icon: Landmark, email: 'ministro@gov.mz', color: 'bg-rose-50 text-rose-700 border-rose-200', target: 'Governação (/governance)' },
    { label: 'Gestor Provincial (DPE)', roleName: 'provincial', icon: Landmark, email: 'provincial@gov.mz', color: 'bg-orange-50 text-orange-700 border-orange-200', target: 'Governação (/governance)' },
    { label: 'Gestor Distrital (SDEJT)', roleName: 'district', icon: Landmark, email: 'distrital@gov.mz', color: 'bg-teal-50 text-teal-700 border-teal-200', target: 'Governação (/governance)' },
    { label: 'Diretor da Escola', roleName: 'director', icon: Building2, email: 'diretor@escola.com', color: 'bg-blue-50 text-blue-700 border-blue-200', target: 'Direcção (/director)' },
    { label: 'Diretor Adjunto Pedagógico (Todos os Ciclos)', roleName: 'pedagogical', icon: BookOpen, email: 'pedagogico@escola.com', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', target: 'Pedagogia (/pedagogical)' },
    { label: 'Chefe da Secretaria', roleName: 'secretariat', icon: FileText, email: 'secretaria@escola.com', color: 'bg-amber-50 text-amber-800 border-amber-200', target: 'Secretaria (/secretariat)' },
    { label: 'Gestor Financeiro', roleName: 'financial', icon: Wallet, email: 'financas@escola.com', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', target: 'Finanças & Tesouraria (/financial)' },
    { label: 'Professor / Docente', roleName: 'teacher', icon: GraduationCap, email: 'professor@escola.com', color: 'bg-cyan-50 text-cyan-800 border-cyan-200', target: 'Portal Docente (/teacher)' },
    { label: 'Aluno / Estudante', roleName: 'student', icon: UserCheck, email: 'aluno@escola.com', color: 'bg-sky-50 text-sky-700 border-sky-200', target: 'Portal do Aluno (/student)' },
    { label: 'Administrador Geral', roleName: 'admin', icon: ShieldCheck, email: 'admin@escola.com', color: 'bg-purple-50 text-purple-700 border-purple-200', target: 'Painel Central (/admin)' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img 
          src={MOZAMBIQUE_EMBLEM_URL} 
          alt="República de Moçambique • Emblema Oficial" 
          className="mx-auto h-28 w-28 mb-3 object-contain drop-shadow-md transition-transform hover:scale-105" 
          referrerPolicy="no-referrer"
        />
        <h1 className="text-center text-3xl font-black text-slate-900 tracking-tight">
          EduGestão • MINEDH
        </h1>
        <p className="mt-1 text-center text-xs font-semibold text-slate-600">
          República de Moçambique • Ministério da Educação e Desenvolvimento Humano
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-[11px] font-bold">
          <Sparkles className="h-3 w-3 text-blue-600" />
          Redirecionamento Automático por Área de Atribuição
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <Card className="px-5 py-6 sm:px-8 space-y-6 shadow-xl border-slate-200 bg-white rounded-2xl">
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Portal de Acesso Oficial
                </h3>
                <p className="text-[11px] text-slate-500">
                  Insira o seu E-mail, ID institucional ou papel funcional
                </p>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Identificador / E-mail / Função
                </label>
                <input
                  type="text"
                  placeholder="Ex: professor@escola.com, diretor, admin"
                  value={studentIdInput}
                  onChange={e => {
                    setStudentIdInput(e.target.value);
                    setStudentLoginError(null);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Palavra-passe / Senha
                </label>
                <input
                  type="password"
                  placeholder="Insira a sua senha"
                  value={passwordInput}
                  onChange={e => {
                    setPasswordInput(e.target.value);
                    setStudentLoginError(null);
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2"
              >
                Entrar na Sua Área <ArrowRight className="h-3.5 w-3.5" />
              </Button>

              {studentLoginError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-600 text-center">
                  {studentLoginError}
                </div>
              )}
            </form>
          </div>

          {/* Quick Access by Assigned Area */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                Acesso Direto por Área de Atribuição (Demonstração)
              </span>
              <span className="text-[10px] text-slate-400">1 clique</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roleProfiles.map((p) => {
                const IconComponent = p.icon;
                return (
                  <button
                    key={p.roleName}
                    type="button"
                    onClick={() => handleQuickLogin(p.email)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${p.color}`}
                  >
                    <div className="p-1.5 rounded-lg bg-white/80 shadow-xs shrink-0">
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-extrabold truncate">{p.label}</div>
                      <div className="text-[10px] opacity-80 truncate">{p.target}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </Card>
      </div>
    </div>
  );
}
