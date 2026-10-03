import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Trash2, User, ShieldAlert } from 'lucide-react';
import { ConfirmDialog } from '../ConfirmDialog';

export function UserManagementManager() {
  const { users = [], deleteUserProfile, currentUser } = useStore();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Filter out the current user (owner)
  const testUsers = users.filter(user => user.id !== currentUser?.id);

  const handleDelete = async () => {
    if (userToDelete) {
      await deleteUserProfile(userToDelete);
      setIsConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
      if(confirm("Tem certeza que deseja excluir TODOS os utilizadores de teste? Esta ação é irreversível.")) {
          for (const user of testUsers) {
              await deleteUserProfile(user.id);
          }
      }
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">Gestão de Utilizadores</h3>
          <p className="text-sm text-slate-500">Excluir utilizadores de teste. A sua conta ({currentUser?.name}) está protegida.</p>
        </div>
        <button 
            onClick={handleBulkDelete}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
        >
            <Trash2 size={16} /> Excluir Todos os Utilizadores de Teste
        </button>
      </div>

      <div className="border border-slate-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider">
            <tr>
              <th className="px-6 py-4 text-left">Utilizador</th>
              <th className="px-6 py-4 text-left">E-mail</th>
              <th className="px-6 py-4 text-left">Papel</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {testUsers.map(user => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                  <User size={16} className="text-slate-400" />
                  {user.name}
                </td>
                <td className="px-6 py-4 text-slate-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] font-bold">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => { setUserToDelete(user.id); setIsConfirmOpen(true); }}
                    className="text-red-500 hover:text-red-700 font-bold text-xs"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {isConfirmOpen && (
        <ConfirmDialog 
            isOpen={isConfirmOpen} 
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={handleDelete}
            title="Excluir Utilizador"
            message="Tem certeza que deseja excluir este utilizador? Esta ação não pode ser revertida."
        />
      )}
    </div>
  );
}
