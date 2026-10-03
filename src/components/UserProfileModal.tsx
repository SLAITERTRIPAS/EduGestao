import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  User as UserIcon, Camera, Shield, CheckCircle2, Lock, Key, 
  Mail, Phone, Building2, MapPin, Award, FileText, Check, X, 
  Sparkles, Save, ShieldCheck, Fingerprint, RefreshCw, AlertCircle
} from 'lucide-react';
import { User } from '../types';
import { SignatureEditor } from './SignatureEditor';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper for role names
function getRoleLabel(role: string): string {
  switch (role) {
    case 'admin': return 'Administrador do Sistema';
    case 'director': return 'Director da Escola';
    case 'pedagogical': return 'Director Adjunto Pedagógico (DAP)';
    case 'teacher': return 'Docente / Professor';
    case 'secretariat': return 'Chefe da Secretaria Geral';
    case 'secretariat_rh': return 'Técnico de Recursos Humanos';
    case 'secretariat_patrimonio': return 'Gestor de Património';
    case 'secretariat_financas': return 'Gestor Financeiro / Tesouraria';
    case 'national': return 'Ministério da Educação (Nacional)';
    case 'provincial': return 'Direcção Provincial de Educação';
    case 'district': return 'Direcção Distrital de Educação';
    case 'student': return 'Aluno';
    case 'guardian': return 'Encarregado de Educação';
    default: return role;
  }
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile, saveUserProfile, activeSchool, updateUserSignature, registerUserBiometrics } = useStore();

  const [activeTab, setActiveTab] = useState<'info' | 'permissions' | 'signature' | 'audit'>('info');

  // Form State
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: (currentUser as any)?.phone || '+258 84 123 4567',
    nuit: (currentUser as any)?.nuit || '102938475',
    department: currentUser?.department || 'Direcção Geral / Secretaria',
    roleTitle: currentUser?.roleTitle || (currentUser ? getRoleLabel(currentUser.role) : ''),
    address: (currentUser as any)?.address || 'Av. Mao Tse Tung, Maputo',
    avatarUrl: currentUser?.avatarUrl || ''
  });

  const [signatureImage, setSignatureImage] = useState<string>(currentUser?.signatureImage || '');
  const [isBiometricsActive, setIsBiometricsActive] = useState<boolean>(currentUser?.biometricRegistered ?? true);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Editor state
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [pendingImageUrl, setPendingImageUrl] = useState<string>('');

  // Sync state if currentUser changes when mounted
  React.useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: (currentUser as any).phone || '+258 84 123 4567',
        nuit: (currentUser as any).nuit || '102938475',
        department: currentUser.department || 'Direcção Geral / Secretaria',
        roleTitle: currentUser.roleTitle || getRoleLabel(currentUser.role),
        address: (currentUser as any).address || 'Av. Mao Tse Tung, Maputo',
        avatarUrl: currentUser.avatarUrl || ''
      });
      setSignatureImage(currentUser.signatureImage || '');
      setIsBiometricsActive(currentUser.biometricRegistered ?? true);
    }
  }, [currentUser]);

  if (!isOpen || !currentUser) return null;


  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setFormData(prev => ({ ...prev, avatarUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Signature Upload
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPendingImageUrl(result);
        setIsEditorOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProcessedSignature = (processedUrl: string) => {
    setSignatureImage(processedUrl);
  };

  // Save changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedUser = {
      ...currentUser,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      nuit: formData.nuit,
      department: formData.department,
      roleTitle: formData.roleTitle,
      address: formData.address,
      avatarUrl: formData.avatarUrl,
      signatureImage: signatureImage,
      biometricRegistered: isBiometricsActive
    } as User;

    try {
      await saveUserProfile(updatedUser);
      if (signatureImage) {
        updateUserSignature(currentUser.id, signatureImage);
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Erro ao guardar perfil no Firestore:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Permission Matrix List
  const permissionList = [
    { key: 'pautas', name: 'Consulta & Lançamento de Pautas', enabled: ['admin', 'director', 'pedagogical', 'teacher', 'secretariat'].includes(currentUser.role) },
    { key: 'certificados', name: 'Emissão de Certificados & Declarações', enabled: ['admin', 'director', 'secretariat', 'national', 'provincial', 'district'].includes(currentUser.role) },
    { key: 'assinatura', name: 'Assinatura Digital & Autenticação Biométrica', enabled: ['admin', 'director', 'pedagogical', 'teacher', 'secretariat', 'national', 'provincial', 'district'].includes(currentUser.role) },
    { key: 'mensagens', name: 'Envio & Recepção de Comunicados Oficiais', enabled: true },
    { key: 'calendario', name: 'Gestão de Calendário & Agendamento de Exames', enabled: ['admin', 'director', 'pedagogical', 'teacher', 'secretariat'].includes(currentUser.role) },
    { key: 'patrimonio', name: 'Gestão de Património & Recursos', enabled: ['admin', 'director', 'secretariat', 'secretariat_patrimonio'].includes(currentUser.role) },
    { key: 'relatorios_ia', name: 'Relatórios Estatísticos e Diagnóstico IA Preditivo', enabled: ['admin', 'director', 'pedagogical', 'national', 'provincial', 'district'].includes(currentUser.role) },
    { key: 'renovacao', name: 'Renovação Automática e Processamento de Vagas', enabled: ['admin', 'director', 'secretariat', 'national'].includes(currentUser.role) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60  p-4 overflow-y-auto animate-in fade-in duration-200 no-print">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden font-sans">
        
        {/* 1. INSTITUTIONAL HEADER & BANNER */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 text-white p-6 relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            
            {/* Avatar / Photo Upload Container */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border-4 border-amber-400 overflow-hidden shadow-xl flex items-center justify-center shrink-0">
                {formData.avatarUrl ? (
                  <img src={formData.avatarUrl} alt={formData.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-100 text-blue-900 flex items-center justify-center font-black text-3xl">
                    {formData.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Photo Upload Overlay Button */}
              <label 
                htmlFor="profile-photo-upload"
                className="absolute bottom-1 right-1 bg-amber-400 hover:bg-amber-300 text-slate-950 p-2 rounded-xl shadow-md cursor-pointer transition-transform group-hover:scale-105"
                title="Carregar nova foto de perfil"
              >
                <Camera size={16} className="font-bold" />
                <input 
                  id="profile-photo-upload" 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                  className="hidden" 
                />
              </label>
            </div>

            {/* User Badges & Name Info */}
            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded shadow-xs tracking-wider">
                  {getRoleLabel(currentUser.role)}
                </span>
                <span className="bg-emerald-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                  <CheckCircle2 size={12} /> Utilizador Ativo
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-tight text-white font-serif">
                {formData.name}
              </h2>

              <p className="text-xs text-amber-200/90 font-semibold flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <span className="flex items-center gap-1"><Mail size={13} /> {formData.email}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Building2 size={13} /> {activeSchool?.name || 'MINEDH • Moçambique'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* 2. TAB NAVIGATION */}
        <div className="bg-slate-100/80 border-b border-slate-200 px-6 pt-2 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'info'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon size={16} /> Dados Pessoais & Profissionais
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'permissions'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield size={16} /> Permissões no Sistema
          </button>

          <button
            onClick={() => setActiveTab('signature')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'signature'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Fingerprint size={16} /> Biometria & Assinatura
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={16} /> Histórico de Auditoria
          </button>
        </div>

        {/* 3. MODAL CONTENT BODY */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto bg-white">

          {/* TAB 1: EDIT PERSONAL DATA */}
          {activeTab === 'info' && (
            <form onSubmit={handleSaveProfile} className="space-y-6 animate-in fade-in duration-200">
              
              {saveSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-3 animate-fadeIn">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <span>Dados do perfil atualizados e sincronizados com sucesso no Firestore!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo do Profissional:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Endereço de Correio Eletrónico (Email):
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contacto Telefónico Principall:
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Identificação Fiscal (NUIT):
                  </label>
                  <input
                    type="text"
                    value={formData.nuit}
                    onChange={e => setFormData({ ...formData, nuit: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gabinete / Departamento de Lotação:
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cargo / Função Institucional:
                  </label>
                  <input
                    type="text"
                    value={formData.roleTitle}
                    onChange={e => setFormData({ ...formData, roleTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Morada / Residência Oficial:
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Save size={16} /> {isSaving ? 'A guardar...' : 'Guardar Alterações'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SYSTEM PERMISSIONS MATRIX */}
          {activeTab === 'permissions' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 leading-relaxed font-medium flex items-center gap-3">
                <ShieldCheck size={20} className="text-blue-600 shrink-0" />
                <div>
                  <p className="font-extrabold text-blue-950">Matriz de Permissões de Acesso</p>
                  <p>As suas credenciais foram atribuídas com base na sua função institucional no portal EduGestão MINEDH.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {permissionList.map(perm => (
                  <div 
                    key={perm.key}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      perm.enabled 
                        ? 'bg-emerald-50/50 border-emerald-200/90 text-emerald-950' 
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <span className="text-xs font-bold">{perm.name}</span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      perm.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {perm.enabled ? <Check size={12} /> : <Lock size={12} />}
                      {perm.enabled ? 'Ativo' : 'Restrito'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BIOMETRICS & DIGITAL SIGNATURE */}
          {activeTab === 'signature' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Digital Signature Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Award size={16} className="text-blue-600" />
                    Chancela & Assinatura Digital
                  </h4>

                  <div className="h-32 bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-center relative overflow-hidden shadow-inner">
                    {signatureImage ? (
                      <img src={signatureImage} alt="Assinatura Digital" className="max-h-full object-contain" />
                    ) : (
                      <div className="text-center text-slate-400 text-xs space-y-1">
                        <p className="font-bold">Nenhuma assinatura carregada.</p>
                        <p className="text-[10px]">Carregue uma imagem transparente da sua rubrica oficial.</p>
                      </div>
                    )}
                  </div>

                  <label className="w-full bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all">
                    <Camera size={16} /> Carregar Nova Rubrica
                    <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                  </label>
                </div>

                {/* Biometrics Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                  <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                    <Fingerprint size={16} className="text-emerald-600" />
                    Autenticação Biométrica
                  </h4>

                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-emerald-950">
                      <span>Estado do Sensor:</span>
                      <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px]">Registado</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      A sua impressão digital está associada às assinaturas de Pautas, Certificados e Declarações.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      registerUserBiometrics(currentUser.id, true);
                      setIsBiometricsActive(true);
                      alert('Impressão digital validada e re-sincronizada no sistema!');
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <RefreshCw size={15} /> Recalibrar Impressão Digital
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* TAB 4: ACTIVITY AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Registo Recente de Atividades no Sistema
              </h4>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                <div className="p-3.5 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Autenticação no Portal EduGestão</p>
                    <p className="text-[10px] text-slate-500">Sessão iniciada com validação biométrica</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">Hoje, 08:30</span>
                </div>

                <div className="p-3.5 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Consulta de Pautas & Lançamento</p>
                    <p className="text-[10px] text-slate-500">Acesso autorizado ao módulo pedagógico</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">Hoje, 09:15</span>
                </div>

                <div className="p-3.5 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Emissão de Declaração de Aproveitamento</p>
                    <p className="text-[10px] text-slate-500">Chancela digital e selo QR validados</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">Ontem, 14:20</span>
                </div>
              </div>
            </div>
          )}

        </div>

        <SignatureEditor 
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          imageUrl={pendingImageUrl}
          onSave={handleSaveProcessedSignature}
        />
      </div>
    </div>
  );
};
