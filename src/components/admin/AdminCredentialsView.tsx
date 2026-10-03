import React from 'react';
import { useStore } from '../../store';
import { Card } from '../ui';
import { User, Lock, Mail, Key } from 'lucide-react';

export const AdminCredentialsView = () => {
  const { users } = useStore();
  const admin = users.find(u => u.role === 'admin' && u.email === 'slaitertripas@gmail.com');

  if (!admin) return <div className="p-6">Administrador não encontrado.</div>;

  return (
    <Card className="p-6 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-4 border-b pb-4">
        <User className="text-blue-600" size={32} />
        <h2 className="text-xl font-bold">Credenciais do Administrador</h2>
      </div>

      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded-xl border">
          <p className="text-xs font-bold text-slate-500 uppercase">Nome</p>
          <p className="font-bold">{admin.name}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border">
          <p className="text-xs font-bold text-slate-500 uppercase">E-mail</p>
          <p className="font-mono">{admin.email}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border">
          <p className="text-xs font-bold text-slate-500 uppercase">ID de Sistema</p>
          <p className="font-mono font-bold text-blue-700">{admin.id}</p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border">
          <p className="text-xs font-bold text-slate-500 uppercase">Senha</p>
          <p className="font-mono">{(admin as any).password || 'Não definida'}</p>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Lock size={16}/> Dados de Recuperação</h3>
        <div className="space-y-3">
          <div className="bg-slate-50 p-3 rounded border">
             <p className="text-[10px] font-bold text-slate-500 uppercase">Pergunta de Recuperação</p>
             <p className="text-sm">{(admin as any).recoveryQuestion || 'Não definida'}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded border">
             <p className="text-[10px] font-bold text-slate-500 uppercase">Resposta de Recuperação</p>
             <p className="text-sm">{(admin as any).recoveryAnswer || 'Não definida'}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded border">
             <p className="text-[10px] font-bold text-slate-500 uppercase">E-mail de Recuperação</p>
             <p className="text-sm font-mono">{(admin as any).recoveryEmail || 'Não definido'}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
