import React, { useState, useEffect } from "react";
import { useStore } from "../store";
import { Card, Button } from "../components/ui";
import {
  FileCheck,
  Clock,
  CheckCircle,
  MessageSquare,
  LayoutDashboard,
  Calendar,
  FileText,
  BarChart2,
  FileSignature,
  BookOpen,
  RefreshCw,
  GraduationCap,
  Send,
  Mail
} from "lucide-react";
import { OfficialMessages } from "../components/OfficialMessages";
import { SidebarMenu } from "../components/SidebarMenu";
import { DirectorOverviewStats } from "../components/DirectorOverviewStats";
import { AcademicManagement } from "../components/AcademicManagement";
import { SignatureManager } from "../components/SignatureManager";
import { TeacherEmailNotifications } from "../components/TeacherEmailNotifications";
import { AcademicCalendarComponent } from "../components/AcademicCalendarComponent";
import { AutoRenewalManagement } from "../components/AutoRenewalManagement";
import { CollaboratorReportDispatcher } from "../components/CollaboratorReportDispatcher";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { GestaoCorpoDiscente } from "../components/GestaoCorpoDiscente";
import { NationalHierarchyStatisticsWorkflow } from "../components/NationalHierarchyStatisticsWorkflow";
import { SchoolStatisticsView } from "../components/SchoolStatisticsView";
import { FirestoreBackupManager } from "../components/FirestoreBackupManager";
import { SchoolNotificationAlerts } from "../components/SchoolNotificationAlerts";
import { UserWorkSummary } from "../components/UserWorkSummary";
import { UnifiedRoleStatisticsView } from "../components/UnifiedRoleStatisticsView";
import { GranularAccessControlManager } from "../components/GranularAccessControlManager";
import { SchoolLogoManager } from "../components/SchoolLogoManager";
import { Database, ShieldCheck, Building2 } from "lucide-react";

type Tab = "overview" | "permissions" | "logo" | "school_statistics" | "academic" | "transitions" | "calendar" | "reports" | "statistics" | "signature" | "messages" | "emails" | "backup";

export function DirectorDashboard() {
  const { reports, classes, signReport, transitionBatches, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  useEffect(() => {
    const handleNav = (e: any) => {
      const loc = e.detail?.targetLocation || e.detail?.targetTab;
      if (loc === "messages") setActiveTab("messages");
      else if (loc === "reports") setActiveTab("reports");
      else if (loc === "calendar") setActiveTab("calendar");
      else if (loc === "overview") setActiveTab("overview");
    };
    window.addEventListener("navigate-applet", handleNav);
    return () => window.removeEventListener("navigate-applet", handleNav);
  }, []);

  const pendingBatchesCount = (transitionBatches || []).filter(
    b => b && b.targetSchoolId === (currentUser?.schoolId || 's1') && b.status === 'Aguardando confirmação de vagas'
  ).length;

  const pendingReports = (reports || []).filter(r => r && (r.status === 'submitted_to_director' || r.status === 'draft' || (r.status as string) === 'submitted'));

  const handleSign = (reportId: string) => {
    signReport(reportId);
    alert("Relatório visado com sucesso pelo Director da Escola!");
  };

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans">
      <SidebarMenu 
        activeTab={activeTab} 
        setActiveTab={(tab) => setActiveTab(tab as Tab)} 
        additionalContent={
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("permissions")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "permissions" ? "bg-blue-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50 font-bold"
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-amber-400" /> Permissões & Acesso
            </button>
            <button
              onClick={() => setActiveTab("logo")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "logo" ? "bg-blue-900 text-white shadow-sm" : "text-slate-700 hover:bg-slate-50 font-bold"
              }`}
            >
              <Building2 className="h-4 w-4 text-amber-400" /> Logótipo da Escola
            </button>
            <button
              onClick={() => setActiveTab("school_statistics")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "school_statistics" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <BarChart2 className="h-4 w-4" /> Estatística da Escola
            </button>
            <button
              onClick={() => setActiveTab("academic")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "academic" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <GraduationCap className="h-4 w-4" /> Gestão Pedagógica
            </button>
            <button
              onClick={() => setActiveTab("transitions")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "transitions" 
                  ? "bg-amber-50 text-amber-900 border border-amber-200" 
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-amber-600" />
                <span>Renovação & Vagas</span>
              </div>
              {pendingBatchesCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white font-mono text-[10px] animate-pulse">
                  {pendingBatchesCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("emails")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "emails" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Mail className="h-4 w-4" /> Notificações SMTP
            </button>
            <button
              onClick={() => setActiveTab("backup")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === "backup" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Database className="h-4 w-4 text-blue-600" /> Backup Firestore
            </button>
          </div>
        }
      />
      
      <main className="flex-1 p-8 overflow-y-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Painel da Direcção da Escola</h1>
            <p className="text-sm text-slate-500 mt-1">Gestão institucional, visto de relatórios pedagógicos e arquivos oficiais (MINEDH).</p>
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <SchoolNotificationAlerts onNavigateTab={(tab) => setActiveTab(tab as any)} />
            <UserWorkSummary role="diretor" />
            <DirectorOverviewStats />
            
            <Card className="p-6 space-y-4">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FileCheck className="text-blue-700" /> Relatórios Trimestrais Pendentes de Visto
              </h3>
              <div className="space-y-3">
                {pendingReports.map(rep => (
                  <div key={rep.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900">Turma ID: {rep.classId} — {rep.trimester}º Trimestre</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Estado: <span className="font-semibold uppercase text-amber-700">{rep.status}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setSelectedReportId(rep.id)} className="text-xs font-bold">Ver Relatório</Button>
                      <Button onClick={() => handleSign(rep.id)} className="text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white gap-1.5">
                        <FileSignature size={14} /> Vistar Relatório
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingReports.length === 0 && (
                  <p className="text-xs text-slate-400 py-6 text-center font-medium">Nenhum relatório pendente de visto neste momento.</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "permissions" && (
          <div className="space-y-6">
            <GranularAccessControlManager />
          </div>
        )}

        {activeTab === "logo" && (
          <div className="space-y-6">
            <SchoolLogoManager />
          </div>
        )}

        {activeTab === "school_statistics" && (
          <div className="space-y-6">
            <UnifiedRoleStatisticsView overrideRole="gestao" />
          </div>
        )}

        {activeTab === "backup" && (
          <div className="space-y-6">
            <FirestoreBackupManager />
          </div>
        )}

        {activeTab === "academic" && <AcademicManagement />}
        {activeTab === "transitions" && (
          <div className="space-y-6">
            <AutoRenewalManagement currentSchoolId={currentUser?.schoolId} />
          </div>
        )}
        {activeTab === "calendar" && <AcademicCalendarComponent />}
        {activeTab === "reports" && (
          <ErrorBoundary fallbackTitle="Erro ao Carregar Relatório de Atividades">
            <CollaboratorReportDispatcher />
          </ErrorBoundary>
        )}
        {activeTab === "statistics" && (
          <div className="space-y-6">
            <UnifiedRoleStatisticsView overrideRole="gestao" />
          </div>
        )}
        {activeTab === "signature" && <SignatureManager />}
        {activeTab === "emails" && <TeacherEmailNotifications />}
        {activeTab === "messages" && <OfficialMessages />}
      </main>
    </div>
  );
}
