import React, { useState } from 'react';
import { useStore } from '../store';
import { Card, Button } from './ui';
import { ShieldCheck, UserPlus, Building2, MapPin, CheckCircle2 } from 'lucide-react';
import { MOZAMBIQUE_PROVINCES, getDistrictsForProvince } from '../data/mozambiqueLocations';
import { User, Role } from '../types';

export function GovernanceManagerRegistration() {
  const { users, saveUserProfile } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('provincial');
  const [province, setProvince] = useState(MOZAMBIQUE_PROVINCES[0]);
  const [district, setDistrict] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableDistricts = getDistrictsForProvince(province);

  const handleRegisterManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert('Por favor, preencha o nome e o email do gestor.');
      return;
    }

    setIsSubmitting(true);
    const userId = `gov-${Math.random().toString(36).substr(2, 6)}`;
    const roleTitle = role === 'national' ? 'Gestor Nacional (MINEDH)' :
                      role === 'provincial' ? `Diretor Provincial (${province})` :
                      `Diretor Distrital (${district || province})`;

    const newUser: User = {
      id: userId,
      name: name.trim(),
      email: email.trim(),
      role,
      roleTitle,
      department: 'Alta Direcção e Governação Educacional',
      provinceId: province,
      districtId: district || undefined,
    };

    try {
      await saveUserProfile(newUser);
      setSuccessMsg(`Gestor registado com sucesso! Credenciais geradas -> Perfil: ${roleTitle} | Email: ${email}`);
      setName('');
      setEmail('');
      setTimeout(() => setSuccessMsg(null), 8000);
    } catch (err) {
      console.error('Erro ao registar gestor:', err);
      alert('Erro ao registar gestor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const existingManagers = (users || []).filter(u => ['national', 'provincial', 'district'].includes(u.role));

  return (
    <div className="space-y-6">
      <Card className="p-6 border border-slate-200 rounded-3xl shadow-sm bg-white space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 font-serif flex items-center gap-2">
              <ShieldCheck className="text-blue-600" size={22} />
              Registo de Quadros Superiores (Gestor Nacional, Provincial e Distrital)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Área restrita ao Administrador Geral para atribuição de competências de governação hierárquica.
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegisterManager} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo do Gestor</label>
              <input
                type="text"
                required
                placeholder="Ex: Dr. Armando Guebuza"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Institucional</label>
              <input
                type="email"
                required
                placeholder="Ex: gestor.provincial@gov.mz"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nível de Governação (Perfil)</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="national">Gestor Nacional (Ministério)</option>
                <option value="provincial">Diretor Provincial</option>
                <option value="district">Diretor Distrital (SDEJT)</option>
              </select>
            </div>

            {role !== 'national' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Província de Jurisdição</label>
                <select
                  value={province}
                  onChange={e => {
                    setProvince(e.target.value);
                    const dists = getDistrictsForProvince(e.target.value);
                    setDistrict(dists[0] || '');
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {MOZAMBIQUE_PROVINCES.map(p => (
                    <option key={String(p)} value={String(p)}>{String(p)}</option>
                  ))}
                </select>
              </div>
            )}

            {role === 'district' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Distrito / SDEJT</label>
                <select
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {availableDistricts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-md cursor-pointer"
            >
              <UserPlus size={16} /> {isSubmitting ? 'A registar...' : 'Registar Gestor e Gerar Credenciais'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Lista de Gestores Registados */}
      <Card className="p-6 border border-slate-200 rounded-3xl shadow-sm bg-white space-y-4">
        <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
          <Building2 size={16} className="text-blue-600" />
          Quadros Superiores Ativos no Sistema ({existingManagers.length})
        </h4>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
          {existingManagers.length > 0 ? (
            existingManagers.map(mgr => (
              <div key={mgr.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">{mgr.name}</p>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                      {mgr.role === 'national' ? 'Nacional' : mgr.role === 'provincial' ? 'Provincial' : 'Distrital'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{mgr.email}</p>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  {mgr.provinceId || mgr.districtId ? `Jurisdição: ${mgr.provinceId || ''} ${mgr.districtId ? '• ' + mgr.districtId : ''}` : 'Âmbito Nacional'}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Nenhum gestor superior registado além dos administradores padrão.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
