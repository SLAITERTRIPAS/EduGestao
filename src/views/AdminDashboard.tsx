import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from '../store';
import { SchoolManagement } from '../components/SchoolManagement';
import { SmtpConfigManager } from '../components/SmtpConfigManager';
import { SmtpConfigModal } from '../components/SmtpConfigModal';
import { TeacherEmailNotifications } from '../components/TeacherEmailNotifications';
import { OfficialMessages } from '../components/OfficialMessages';
import { FirestoreBackupManager } from '../components/FirestoreBackupManager';
import { NationalHierarchyStatisticsWorkflow } from '../components/NationalHierarchyStatisticsWorkflow';
import { GovernanceManagerRegistration } from '../components/GovernanceManagerRegistration';
import { SystemHealthDashboard } from '../components/SystemHealthDashboard';
import { UserManagementManager } from '../components/admin/UserManagementManager';
import { AdminCredentialsView } from '../components/admin/AdminCredentialsView';
import { Settings, ShieldAlert } from 'lucide-react';

export function AdminDashboard() {
  const { currentUser } = useStore();
  const isSuperAdmin = currentUser?.id === 'ST849547771';
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
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
          <p className="text-xs text-slate-500 mt-1">Gestão da rede escolar, infraestrutura de e-mail SMTP e regras do sistema.</p>
        </div>
      </div>

      <Routes>
        <Route index element={<Navigate to="/admin/systemHealth" replace />} />
        <Route path="/" element={<Navigate to="/admin/systemHealth" replace />} />
        <Route path="systemHealth" element={<SystemHealthDashboard />} />
        <Route path="users" element={<UserManagementManager />} />
        <Route path="credentials" element={<AdminCredentialsView />} />
        <Route path="statistics" element={<div className="space-y-6"><NationalHierarchyStatisticsWorkflow initialLevel="provincia" /></div>} />
        <Route path="backup" element={<FirestoreBackupManager />} />
        <Route path="smtp" element={<SmtpConfigManager onOpenModal={() => setIsSmtpModalOpen(true)} />} />
        <Route path="schools" element={isSuperAdmin ? <SchoolManagement /> : <div className="p-8 text-center text-red-600 font-bold">Acesso restrito apenas ao Administrador Geral do Sistema.</div>} />
        <Route path="managers" element={<GovernanceManagerRegistration />} />
        <Route path="emailLogs" element={<TeacherEmailNotifications />} />
        <Route path="messages" element={<OfficialMessages />} />
        {/* Restrição explícita: Administrador Geral não tem acesso à Assinatura Digital */}
        <Route path="signature" element={
          <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-3">
            <div className="p-3 bg-amber-100 rounded-full inline-flex text-amber-700">
              <ShieldAlert size={28} />
            </div>
            <h3 className="text-base font-extrabold text-amber-900">Módulo Restrito</h3>
            <p className="text-xs text-amber-700 max-w-md mx-auto">
              O Administrador Geral não tem acesso à área do Módulo Oficial de Assinatura Digital de Documentos. O acesso é exclusivo à Direcção e Órgãos Pedagógicos competentes.
            </p>
          </div>
        } />
        <Route path="*" element={<Navigate to="/admin/systemHealth" replace />} />
      </Routes>

      <SmtpConfigModal
        isOpen={isSmtpModalOpen}
        onClose={() => setIsSmtpModalOpen(false)}
      />
    </div>
  );
}
