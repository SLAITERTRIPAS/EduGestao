import React, { useState, useEffect } from "react";
import { useStore } from "../store";
import {
  Clock,
  CheckCircle,
  MessageSquare,
  LayoutDashboard,
  Calendar,
  FileText,
  BarChart2,
  BookOpen,
  RefreshCw,
  GraduationCap,
  Send,
  Mail
} from "lucide-react";
import { OfficialMessages } from "../components/OfficialMessages";
import { CollapsibleSidebar } from "../components/CollapsibleSidebar";
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
import { UnifiedRoleStatisticsView } from "../components/UnifiedRoleStatisticsView";
import { GranularAccessControlManager } from "../components/GranularAccessControlManager";
import { SchoolLogoManager } from "../components/SchoolLogoManager";
import { DigitalClassBookManager } from "../components/DigitalClassBookManager";
import { SchoolTypeConfigManager } from "../components/SchoolTypeConfigManager";
import { Database, ShieldCheck, Building2 } from "lucide-react";

type Tab = "overview" | "school_type" | "livro_turma" | "permissions" | "logo" | "school_statistics" | "academic" | "transitions" | "calendar" | "reports" | "statistics" | "signature" | "messages" | "emails" | "backup";

export function DirectorDashboard() {
  const { transitionBatches, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

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

  return (
    <CollapsibleSidebar
      sidebarContent={
        <SidebarMenu 
          activeTab={activeTab} 
          setActiveTab={(tab) => setActiveTab(tab as Tab)} 
        />
      }
    >
      <main className="p-8 overflow-y-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Painel da Direcção da Escola</h1>
            <p className="text-sm text-slate-500 mt-1">Gestão institucional, visto de relatórios pedagógicos e arquivos oficiais (MINEDH).</p>
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <DirectorOverviewStats />
          </div>
        )}

        {activeTab === "school_type" && (
          <div className="space-y-6">
            <SchoolTypeConfigManager />
          </div>
        )}

        {activeTab === "livro_turma" && (
          <div className="space-y-6">
            <DigitalClassBookManager overrideRole="director" />
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
            <NationalHierarchyStatisticsWorkflow initialLevel="escola" />
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
            <NationalHierarchyStatisticsWorkflow initialLevel="escola" />
          </div>
        )}
        {activeTab === "signature" && <SignatureManager />}
        {activeTab === "emails" && <TeacherEmailNotifications />}
        {activeTab === "messages" && <OfficialMessages />}
      </main>
    </CollapsibleSidebar>
  );
}
