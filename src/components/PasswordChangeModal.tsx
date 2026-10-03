import React, { useState } from 'react';
import { useStore } from '../store';
import { Button, Card } from './ui';

export const PasswordChangeModal = ({ onClose }: { onClose: () => void }) => {
  const { currentUser, updatePassword } = useStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!currentUser) return;
    const result = await updatePassword(currentUser.id, newPassword);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'Erro ao atualizar senha.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="p-6 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold">Alterar Senha Obrigatória</h2>
        <p className="text-xs text-slate-600">Por favor, defina uma nova senha para continuar.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input 
            type="password" 
            placeholder="Nova Senha" 
            value={newPassword} 
            onChange={e => setNewPassword(e.target.value)} 
            className="w-full border p-2 rounded text-sm" 
            required
          />
          <input 
            type="password" 
            placeholder="Confirmar Nova Senha" 
            value={confirmPassword} 
            onChange={e => setConfirmPassword(e.target.value)} 
            className="w-full border p-2 rounded text-sm" 
            required
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <Button type="submit" className="w-full">Alterar Senha</Button>
        </form>
      </Card>
    </div>
  );
};
