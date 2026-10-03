import React, { useState } from 'react';
import { useStore } from '../store';
import { MOZAMBIQUE_EMBLEM_URL } from '../types';
import { Card, Button } from '../components/ui';
import { GraduationCap, ArrowRight, ShieldCheck, KeyRound, School } from 'lucide-react';

export function LoginView() {
  const { login, students } = useStore();
  const [studentIdInput, setStudentIdInput] = useState('');
  const [studentLoginError, setStudentLoginError] = useState<string | null>(null);

  const handleQuickLogin = (quickEmail: string) => {
    login(quickEmail);
  };

  const handleStudentIdLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = studentIdInput.trim().toUpperCase();
    if (!cleanId) return;

    const success = login(cleanId);
    if (!success) {
      setStudentLoginError('ID de Aluno não encontrado. Tente por exemplo: ALU-2026-001 ou selecione o perfil abaixo.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Emblema Nacional de Moçambique aumentado em +60% */}
        <img 
          src={MOZAMBIQUE_EMBLEM_URL} 
          alt="República de Moçambique • Emblema Oficial" 
          className="mx-auto h-32 w-32 mb-4 object-contain drop-shadow-md transition-transform hover:scale-105" 
          referrerPolicy="no-referrer"
        />
        <h1 className="text-center text-3xl font-black text-slate-900 tracking-tight">
          EduGestão • MINEDH
        </h1>
        <p className="mt-1 text-center text-xs font-semibold text-slate-600">
          República de Moçambique • Ministério da Educação e Desenvolvimento Humano
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="px-4 py-6 sm:px-8 space-y-5">
          
          {/* SECÇÃO: ACESSO DO ALUNO POR ID DE LOGIN GERADO */}
          <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-950">
                  Portal do Aluno (Login com ID)
                </h3>
                <p className="text-[11px] text-blue-700">
                  Insira o ID único gerado pelo sistema (Ex: <strong>ALU-2026-001</strong>)
                </p>
              </div>
            </div>

            <form onSubmit={handleStudentIdLogin} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: ALU-2026-001"
                  value={studentIdInput}
                  onChange={e => {
                    setStudentIdInput(e.target.value);
                    setStudentLoginError(null);
                  }}
                  className="flex-1 bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-800 uppercase focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0"
                >
                  Entrar <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>

              {studentLoginError && (
                <p className="text-[10.5px] text-red-600 font-medium">{studentLoginError}</p>
              )}
            </form>
          </div>

          <div className="border-b border-gray-200 pb-3">
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider text-center">
              Ativar Contas de Teste • Selecione o Perfil para Entrada Imediata:
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@escola.com')}
              className="col-span-full px-3 py-2 text-xs rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all font-bold flex items-center justify-between shadow-md border-2 border-amber-400"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-400" />
                <span className="text-amber-400">Administrador Geral do Sistema</span>
              </div>
              <span className="text-[10px] bg-amber-400/20 px-2 py-0.5 rounded font-mono font-bold text-amber-300">Acesso Total</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('aluno@escola.com')}
              className="px-3 py-2 text-xs rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-all font-bold flex items-center justify-between shadow-xs border border-cyan-700"
            >
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4" />
                <span>Aluno (Estudante)</span>
              </div>
              <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold">ALU-2026-001</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('encarregado@escola.com')}
              className="px-3 py-2 text-xs rounded-lg bg-purple-50 text-purple-900 hover:bg-purple-100 transition-all border border-purple-300 font-bold flex items-center justify-between"
            >
              <span>👨‍👩‍👧 Encarregado de Educação</span>
              <span className="text-[9px] bg-purple-200 text-purple-900 px-1 rounded">Portal Pais</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('professor@escola.com')}
              className="px-3 py-2 text-xs rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 transition-all border border-amber-300 font-bold flex items-center justify-between"
            >
              <span>👨‍🏫 Professor & Cargos</span>
              <span className="text-[9px] bg-amber-200 text-amber-900 px-1 rounded">Competências</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('pedagogico@escola.com')}
              className="px-3 py-2 text-xs rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-100 transition-all border border-blue-300 font-bold flex items-center justify-between"
            >
              <span>🎓 Director Pedagógico</span>
              <span className="text-[9px] bg-blue-200 text-blue-900 px-1 rounded">Gestão Docentes</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('diretor@escola.com')}
              className="px-3 py-2 text-xs rounded-lg bg-indigo-50 text-indigo-900 hover:bg-indigo-100 transition-all border border-indigo-300 font-bold flex items-center gap-1.5"
            >
              <span>🏛️ Director de Escola</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('secretaria@escola.com')}
              className="px-3 py-2 text-xs rounded-lg bg-emerald-50 text-emerald-900 hover:bg-emerald-100 transition-all border border-emerald-300 font-bold flex items-center gap-1.5"
            >
              <span>📋 Chefe de Secretaria</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('rh@escola.com')}
              className="px-3 py-2 text-xs rounded-lg bg-rose-50 text-rose-900 hover:bg-rose-100 transition-all border border-rose-300 font-bold flex items-center gap-1.5"
            >
              <span>👔 Secretaria • RH</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('patrimonio@escola.com')}
              className="px-3 py-2 text-xs rounded-lg bg-orange-50 text-orange-900 hover:bg-orange-100 transition-all border border-orange-300 font-bold flex items-center gap-1.5"
            >
              <span>📦 Secretaria • Património</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('financas@escola.com')}
              className="px-3 py-2 text-xs rounded-lg bg-teal-50 text-teal-900 hover:bg-teal-100 transition-all border border-teal-300 font-bold flex items-center gap-1.5"
            >
              <span>💰 Secretaria • Finanças</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('recepcao@escola.com')}
              className="px-3 py-2 text-xs rounded-lg bg-lime-50 text-lime-900 hover:bg-lime-100 transition-all border border-lime-300 font-bold flex items-center gap-1.5"
            >
              <span>🛎️ Recepção / Atendimento</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('arquivo@escola.com')}
              className="px-3 py-2 text-xs rounded-lg bg-stone-100 text-stone-900 hover:bg-stone-200 transition-all border border-stone-300 font-bold flex items-center gap-1.5"
            >
              <span>📁 Arquivo Escolar</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('biblioteca@escola.com')}
              className="px-3 py-2 text-xs rounded-lg bg-violet-50 text-violet-900 hover:bg-violet-100 transition-all border border-violet-300 font-bold flex items-center gap-1.5"
            >
              <span>📚 Bibliotecário</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('distrital@gov.mz')}
              className="px-3 py-2 text-xs rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 transition-all border border-slate-300 font-bold flex items-center gap-1.5"
            >
              <span>🏘️ SDEJT Distrito</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('provincial@gov.mz')}
              className="px-3 py-2 text-xs rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 transition-all border border-slate-300 font-bold flex items-center gap-1.5"
            >
              <span>📍 DPE Província</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('ministro@gov.mz')}
              className="col-span-full px-3 py-2 text-xs rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all font-bold flex items-center justify-center gap-2 border border-slate-700 shadow-xs"
            >
              <span>🌍 MINEDH Nacional (Todas as 11 Províncias)</span>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
