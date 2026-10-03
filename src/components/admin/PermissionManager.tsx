import React, { useState } from 'react';
import { useStore } from '../../store';
import { Card, Button } from '../ui';

const modules = {
  secretariat: ['atendimento', 'arquivo', 'financeiro', 'peticoes'],
  pedagogia: ['turmas', 'pautas', 'notas', 'relatorios']
};

export const PermissionManager: React.FC<{ userId: string }> = ({ userId }) => {
  const { users, updateUserPermissions } = useStore();
  const user = users.find(u => u.id === userId);
  
  const [permissions, setPermissions] = useState(user?.permissions || { secretariat: [], pedagogia: [] });

  const togglePermission = (module: 'secretariat' | 'pedagogia', subModule: string) => {
    setPermissions(prev => {
      const current = prev[module];
      const updated = current.includes(subModule)
        ? current.filter(p => p !== subModule)
        : [...current, subModule];
      return { ...prev, [module]: updated };
    });
  };

  const handleSave = () => {
    updateUserPermissions(userId, permissions);
    alert('Permissões atualizadas com sucesso!');
  };

  if (!user) return null;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold mb-4">Gestão de Permissões: {user.name}</h3>
      <div className="grid grid-cols-2 gap-6">
        {Object.entries(modules).map(([module, subModules]) => (
          <div key={module}>
            <h4 className="font-bold capitalize mb-2">{module}</h4>
            {subModules.map(sm => (
              <label key={sm} className="flex items-center gap-2 mb-1">
                <input 
                  type="checkbox" 
                  checked={permissions[module as 'secretariat' | 'pedagogia'].includes(sm)}
                  onChange={() => togglePermission(module as 'secretariat' | 'pedagogia', sm)}
                />
                {sm}
              </label>
            ))}
          </div>
        ))}
      </div>
      <Button onClick={handleSave} className="mt-6">Salvar Permissões</Button>
    </Card>
  );
};
