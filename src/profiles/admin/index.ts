/**
 * Perfil: Administrador Geral do Sistema
 * Funcionalidades: Saúde do Sistema, Gestão de Utilizadores, Credenciais, SMTP,
 * Gestão de Escolas, Gestão de Gestores, Backups Firestore e Auditoria.
 *
 * RESTRIÇÃO OFICIAL: O Administrador Geral não tem acesso à Assinatura Digital de Documentos.
 */

export { AdminDashboard } from '../../views/AdminDashboard';
export { SystemHealthDashboard } from '../../components/SystemHealthDashboard';
export { UserManagementManager } from '../../components/admin/UserManagementManager';
export { AdminCredentialsView } from '../../components/admin/AdminCredentialsView';
export { SmtpConfigManager } from '../../components/SmtpConfigManager';
export { SmtpConfigModal } from '../../components/SmtpConfigModal';
export { SchoolManagement } from '../../components/SchoolManagement';
export { FirestoreBackupManager } from '../../components/FirestoreBackupManager';
export { GovernanceManagerRegistration } from '../../components/GovernanceManagerRegistration';
export { TeacherEmailNotifications } from '../../components/TeacherEmailNotifications';
export { AuditLogsManager } from '../../components/AuditLogsManager';
export { PermissionManager } from '../../components/admin/PermissionManager';
