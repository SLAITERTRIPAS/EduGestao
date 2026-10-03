import { useState } from 'react';
import { useStore } from '../store';
import { Card } from '../components/ui';
import { Building2, Server, Mail, Settings, MessageSquare, Fingerprint, Database, BarChart3, ShieldCheck, Activity, User } from 'lucide-react';
import { SchoolManagement } from '../components/SchoolManagement';
import { SmtpConfigManager } from '../components/SmtpConfigManager';
import { SmtpConfigModal } from '../components/SmtpConfigModal';
import { TeacherEmailNotifications } from '../components/TeacherEmailNotifications';
import { OfficialMessages } from '../components/OfficialMessages';
import { SignatureManager } from '../components/SignatureManager';
import { FirestoreBackupManager } from '../components/FirestoreBackupManager';
import { NationalHierarchyStatisticsWorkflow } from '../components/NationalHierarchyStatisticsWorkflow';
import { GovernanceManagerRegistration } from '../components/GovernanceManagerRegistration';
import { SystemHealthDashboard } from '../components/SystemHealthDashboard';
import { UserManagementManager } from '../components/admin/UserManagementManager';
import { AdminCredentialsView } from '../components/admin/AdminCredentialsView';

export function AdminDashboard() {
  const { schools, smtpSettings, backups } = useStore();
  const [activeTab, setActiveTab] = useState<'systemHealth' | 'schools' | 'managers' | 'smtp' | 'emailLogs' | 'messages' | 'signature' | 'backup' | 'statistics' | 'users' | 'credentials'>('systemHealth');
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Painel do Administrador Geral</h2>
            <button
              onClick={() => setIsSmtpModalOpen(true)}
              className="bg-blue-900 hover:bg-blue-800 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Settings size={14} /> Abrir Modal SMTP
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestão da rede escolar, infraestrutura de e-mail SMTP e regras do sistema.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('systemHealth')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'systemHealth'
                ? 'bg-blue-900 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Activity size={15} className="text-emerald-400 animate-pulse" /> Saúde do Sistema & Logs
          </button>

          <button
            onClick={() => setActiveTab('smtp')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'smtp'
                ? 'bg-blue-900 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Server size={15} /> Servidor SMTP
            {smtpSettings.isActive && (
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('schools')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'schools'
                ? 'bg-blue-900 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Building2 size={15} /> Gestão de Escolas ({schools.length})
          </button>

          <button
            onClick={() => setActiveTab('managers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'managers'
                ? 'bg-blue-900 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck size={15} /> Gestão de Gestores (Nacional, Prov, Dist)
          </button>

          <button
            onClick={() => setActiveTab('emailLogs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'emailLogs'
                ? 'bg-blue-900 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Mail size={15} /> Notificações Disparadas
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'messages'
                ? 'bg-blue-900 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <MessageSquare size={15} /> Mensagens
          </button>

          <button
            onClick={() => setActiveTab('signature')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'signature'
                ? 'bg-blue-900 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Fingerprint size={15} /> Assinatura Digital
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'users'
                ? 'bg-red-900 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <User size={15} /> Gestão de Utilizadores
          </button>

          <button
            onClick={() => setActiveTab('credentials')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'credentials'
                ? 'bg-blue-900 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Key size={15} /> Minhas Credenciais
          </button>

          <button
            onClick={() => setActiveTab('statistics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'statistics'
                ? 'bg-blue-900 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BarChart3 size={15} /> Estatísticas (Escola, Distrito, Província)
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
              activeTab === 'backup'
                ? 'bg-blue-900 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Database size={15} /> Backup Firestore ({backups.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'systemHealth' && <SystemHealthDashboard />}

      {activeTab === 'users' && <UserManagementManager />}

      {activeTab === 'credentials' && <AdminCredentialsView />}

      {activeTab === 'statistics' && (
        <div className="space-y-6">
          <NationalHierarchyStatisticsWorkflow initialLevel="provincia" />
        </div>
      )}

      {activeTab === 'backup' && <FirestoreBackupManager />}

      {activeTab === 'smtp' && <SmtpConfigManager onOpenModal={() => setIsSmtpModalOpen(true)} />}

      {activeTab === 'schools' && <SchoolManagement />}

      {activeTab === 'managers' && <GovernanceManagerRegistration />}

      {activeTab === 'emailLogs' && <TeacherEmailNotifications />}

      {activeTab === 'messages' && <OfficialMessages />}

      {activeTab === 'signature' && <SignatureManager />}

      {/* Global SMTP Modal */}
      <SmtpConfigModal
        isOpen={isSmtpModalOpen}
        onClose={() => setIsSmtpModalOpen(false)}
      />
    </div>
  );
}

