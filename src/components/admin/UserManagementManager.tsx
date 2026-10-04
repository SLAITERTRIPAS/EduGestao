import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Trash2, User, ShieldAlert } from 'lucide-react';
import { ConfirmDialog } from '../ConfirmDialog';

export function UserManagementManager() {
  const { users = [], deleteUserProfile, currentUser, schools = [], saveUserProfile } = useStore();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  // Registration form state
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'teacher' as any, schoolId: '', trainingArea: '', subject: '' });

  // Filter out current user and filter by school
  const testUsers = users.filter(user => {
      const matchesUser = user.id !== currentUser?.id;
      // ONLY show if school is selected
      const matchesSchool = selectedSchoolId !== 'all' && user.schoolId === selectedSchoolId;
      return matchesUser && matchesSchool;
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveUserProfile({
      id: Math.random().toString(36).substr(2, 9),
      ...newUser,
      schoolId: selectedSchoolId,
      permissions: {},
    });
    setNewUser({ name: '', email: '', password: '', role: 'teacher', schoolId: selectedSchoolId, trainingArea: '', subject: '' });
  };

  const handleDelete = async () => {
    if (userToDelete) {
      await deleteUserProfile(userToDelete);
      setIsConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

  const handleBulkDelete = async () => {
    for (const userId of selectedUserIds) {
      await deleteUserProfile(userId);
    }
    setSelectedUserIds([]);
    setIsBulkConfirmOpen(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">Gestão de Utilizadores</h3>
          <p className="text-sm text-slate-500">Selecione uma escola para gerir utilizadores ou registar novos.</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="border border-slate-300 rounded-xl px-4 py-2 text-sm font-medium"
          >
              <option value="all">-- Selecione uma Escola --</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {selectedSchoolId !== 'all' && (
            <button 
                onClick={() => setIsBulkConfirmOpen(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm"
            >
                <Trash2 size={16} /> Excluir Selecionados
            </button>
          )}
        </div>
      </div>

      {selectedSchoolId !== 'all' && (
        <form onSubmit={handleAddUser} className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Nome / Utilizador</label>
              <input className="w-full border p-2 rounded text-sm" placeholder="Nome" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">E-mail</label>
              <input className="w-full border p-2 rounded text-sm" placeholder="E-mail" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Função</label>
              <select className="w-full border p-2 rounded text-sm font-semibold" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})}>
                  <option value="national">Gestor do Ministério (MINEDH)</option>
                  <option value="provincial">Gestor Provincial (DPE)</option>
                  <option value="district">Gestor Distrital (SDEJT)</option>
                  <option value="director">Diretor da Escola</option>
                  <option value="pedagogical">DAP (Todos os Ciclos)</option>
                  <option value="pedagogical_c1">DAP (1.º Ciclo)</option>
                  <option value="pedagogical_c2">DAP (2.º Ciclo ESG1)</option>
                  <option value="pedagogical_c3">DAP (2.º Ciclo ESG2)</option>
                  <option value="secretariat">Chefe da Secretaria</option>
                  <option value="financial">Gestor Financeiro</option>
                  <option value="teacher">Professor</option>
                  <option value="student">Aluno</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Senha</label>
              <input className="w-full border p-2 rounded text-sm" placeholder="Senha" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Área de Formação</label>
              <input className="w-full border p-2 rounded text-sm" placeholder="Área de Formação (ex: Ciências Naturais)" value={newUser.trainingArea} onChange={e => setNewUser({...newUser, trainingArea: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Disciplina</label>
              <input className="w-full border p-2 rounded text-sm" placeholder="Disciplina (ex: Matemática)" value={newUser.subject} onChange={e => setNewUser({...newUser, subject: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-xl font-bold shadow-sm transition-all">Adicionar Utilizador</button>
          </div>
        </form>
      )}

      {isBulkConfirmOpen && (
        <ConfirmDialog 
            isOpen={isBulkConfirmOpen} 
            onCancel={() => setIsBulkConfirmOpen(false)}
            onConfirm={handleBulkDelete}
            title="Excluir Todos os Utilizadores"
            message="Tem certeza que deseja excluir TODOS os utilizadores de teste? Esta ação é irreversível."
        />
      )}

      {selectedSchoolId !== 'all' && (
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left">Utilizador</th>
                <th className="px-6 py-4 text-left">E-mail</th>
                <th className="px-6 py-4 text-left">Função</th>
                <th className="px-6 py-4 text-left">Senha</th>
                <th className="px-6 py-4 text-left">Área de Formação</th>
                <th className="px-6 py-4 text-left">Disciplina</th>
                <th className="px-6 py-4 text-center">Selecionar</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {testUsers.map(user => {
                return (
                  <tr key={user.id} className="hover:bg-slate-50 text-xs">
                    <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                      <User size={16} className="text-slate-400" />
                      {user.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200 text-[10px] font-bold whitespace-nowrap">
                        {user.role === 'national' ? 'Gestor do Ministério' :
                         user.role === 'provincial' ? 'Gestor Provincial' :
                         user.role === 'district' ? 'Gestor Distrital' :
                         user.role === 'director' ? 'Diretor da Escola' :
                         user.role === 'pedagogical' ? 'DAP (Todos os Ciclos)' :
                         user.role === 'pedagogical_c1' ? 'DAP (1.º Ciclo)' :
                         user.role === 'pedagogical_c2' ? 'DAP (2.º Ciclo ESG1)' :
                         user.role === 'pedagogical_c3' ? 'DAP (2.º Ciclo ESG2)' :
                         user.role === 'secretariat' ? 'Chefe da Secretaria' :
                         user.role === 'financial' ? 'Gestor Financeiro' :
                         user.role === 'teacher' ? 'Professor' :
                         user.role === 'student' ? 'Aluno' : user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono">{user.password || '******'}</td>
                    <td className="px-6 py-4 text-slate-600">{(user as any).trainingArea || '---'}</td>
                    <td className="px-6 py-4 text-slate-600">{(user as any).subject || '---'}</td>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedUserIds.includes(user.id)}
                        onChange={(e) => {
                            if (e.target.checked) setSelectedUserIds([...selectedUserIds, user.id]);
                            else setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                        }}
                        className="rounded text-red-600 focus:ring-red-500"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => { setUserToDelete(user.id); setIsConfirmOpen(true); }}
                        className="text-red-500 hover:text-red-700 font-bold"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {isConfirmOpen && (
        <ConfirmDialog 
            isOpen={isConfirmOpen} 
            onCancel={() => setIsConfirmOpen(false)}
            onConfirm={handleDelete}
            title="Excluir Utilizador"
            message="Tem certeza que deseja excluir este utilizador? Esta ação não pode ser revertida."
        />
      )}
    </div>
  );
}
