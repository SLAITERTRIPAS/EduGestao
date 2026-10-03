import React, { useState } from 'react';
import { useStore } from '../store';
import { MOZAMBIQUE_EMBLEM_URL } from '../types';
import { Card, Button } from '../components/ui';
import { GraduationCap, ArrowRight, ShieldCheck, KeyRound, School } from 'lucide-react';

export function LoginView() {
  const { login } = useStore();
  const [studentIdInput, setStudentIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [studentLoginError, setStudentLoginError] = useState<string | null>(null);

  const handleStudentIdLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = studentIdInput.trim().toUpperCase();
    if (!cleanId || !passwordInput) {
        setStudentLoginError('Por favor, preencha o ID e a Senha.');
        return;
    }

    // Temporary logic: the system currently only handles ID/Email.
    // We'll proceed with ID login and simulate password validation.
    const success = login(cleanId);
    if (!success) {
      setStudentLoginError('ID ou Senha inválidos.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
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
          
          <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-950">
                  Portal de Acesso
                </h3>
                <p className="text-[11px] text-blue-700">
                  Insira o seu ID e Senha
                </p>
              </div>
            </div>

            <form onSubmit={handleStudentIdLogin} className="space-y-3">
              <input
                type="text"
                placeholder="ID de Acesso"
                value={studentIdInput}
                onChange={e => {
                  setStudentIdInput(e.target.value);
                  setStudentLoginError(null);
                }}
                className="w-full bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-800 uppercase focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="Senha"
                value={passwordInput}
                onChange={e => {
                  setPasswordInput(e.target.value);
                  setStudentLoginError(null);
                }}
                className="w-full bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Entrar <ArrowRight className="h-3 w-3 ml-1" />
              </Button>

              {studentLoginError && (
                <p className="text-[10.5px] text-red-600 font-medium text-center">{studentLoginError}</p>
              )}
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
