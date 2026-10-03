import React, { useMemo } from 'react';
import { useStore } from '../store';
import { Card, Button } from './ui';
import { Bell, AlertTriangle, UserMinus, ArrowRight, CheckCircle2, ShieldAlert, TrendingUp } from 'lucide-react';

interface SchoolNotificationAlertsProps {
  onNavigateTab?: (tab: string) => void;
}

export function SchoolNotificationAlerts({ onNavigateTab }: SchoolNotificationAlertsProps) {
  const { students, chatMessages, markNotificationAsRead, classes } = useStore();

  // Filter or detect transferred students & critical Eixo 4 demographic metrics
  const transferredStudents = useMemo(() => {
    return (students || []).filter(s => (s as any).status === 'transferred' || (s as any).status === 'transferido' || (s as any).status === 'desistente');
  }, [students]);

  // Calculate Eixo 4 critical indicators (e.g., total active vs transferred/desistentes ratio)
  const totalStudents = students.length || 1;
  const dropoutCount = students.filter(s => (s as any).status === 'desistente').length;
  const transferCount = students.filter(s => (s as any).status === 'transferred' || (s as any).status === 'transferido').length;
  const criticalDropoutRate = (dropoutCount / totalStudents) > 0.05; // >5% dropout is critical
  const criticalTransferRate = (transferCount / totalStudents) > 0.10; // >10% transfer is critical

  // Combine system user notifications + dynamic transfer/Eixo 4 alerts
  const allAlerts = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      message: string;
      type: 'transfer' | 'eixo4_critical' | 'general';
      createdAt: string;
      isRead: boolean;
      actionTab?: string;
    }> = [];

    // Add recent transfer/desistente alerts from student records
    transferredStudents.forEach((st, idx) => {
      const cls = classes.find(c => c.id === st.classId);
      list.push({
        id: `transfer-alert-${st.id}-${idx}`,
        title: (st as any).status === 'transferred' || (st as any).status === 'transferido' ? `Aluno Transferido: ${st.fullName}` : `Aluno Desistente: ${st.fullName}`,
        message: `O aluno ${st.fullName} (Processo: ${st.processNumber || 'N/A'}, Turma: ${cls ? cls.name : 'N/A'}) foi registado como ${(st as any).status}. Estatísticas do Eixo 4 atualizadas automaticamente.`,
        type: 'transfer',
        createdAt: st.updatedAt || new Date().toISOString().split('T')[0],
        isRead: false,
        actionTab: 'transitions'
      });
    });

    // Add Eixo 4 critical statistical alerts if thresholds are met
    if (criticalDropoutRate) {
      list.push({
        id: `eixo4-crit-dropout`,
        title: `Alerta Crítico Eixo 4: Taxa de Desistência Elevação`,
        message: `A taxa de desistência institucional atingiu ${( (dropoutCount / totalStudents) * 100).toFixed(1)}% (${dropoutCount} alunos). Requer intervenção pedagógica urgente.`,
        type: 'eixo4_critical',
        createdAt: new Date().toISOString().split('T')[0],
        isRead: false,
        actionTab: 'school_statistics'
      });
    }

    if (criticalTransferRate) {
      list.push({
        id: `eixo4-crit-transfer`,
        title: `Alerta Crítico Eixo 4: Volume Elevado de Transferências`,
        message: `Foram registadas ${transferCount} transferências de alunos. O impacto demográfico foi refletido no CTA e estatísticas gerais.`,
        type: 'eixo4_critical',
        createdAt: new Date().toISOString().split('T')[0],
        isRead: false,
        actionTab: 'school_statistics'
      });
    }

    // Merge with chatMessages from store
    (chatMessages || []).forEach(n => {
      list.push({
        id: n.id,
        title: n.subject || 'Notificação Oficial',
        message: n.text,
        type: 'general',
        createdAt: n.timestamp,
        isRead: !!n.read,
        actionTab: 'overview'
      });
    });

    return list;
  }, [transferredStudents, criticalDropoutRate, criticalTransferRate, dropoutCount, transferCount, totalStudents, classes, chatMessages]);

  return (
    <Card className="p-6 border-l-4 border-l-blue-600 bg-gradient-to-br from-blue-50/40 via-white to-slate-50/50 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 shadow-inner">
            <Bell className="h-5 w-5 animate-bounce" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">Central de Alertas e Notificações (Direção & Pedagógico)</h3>
            <p className="text-xs text-slate-500">Monitorização em tempo real de transferências, desistências e alterações críticas do Eixo 4.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm">
            {allAlerts.filter(a => !a.isRead).length} Novos Alertas
          </span>
        </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {allAlerts.length === 0 ? (
          <div className="text-center py-8 text-slate-400 space-y-2">
            <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500" />
            <p className="text-sm font-semibold text-slate-600">Nenhum alerta crítico ou transferência pendente no momento.</p>
            <p className="text-xs text-slate-400">As estatísticas do Eixo 4 e transferências encontram-se estáveis.</p>
          </div>
        ) : (
          allAlerts.map((alert) => (
            <div 
              key={alert.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                alert.type === 'eixo4_critical' 
                  ? 'bg-red-50/80 border-red-200 shadow-sm' 
                  : alert.type === 'transfer'
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-white border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {alert.type === 'eixo4_critical' ? (
                    <ShieldAlert className="h-5 w-5 text-red-600 animate-pulse" />
                  ) : alert.type === 'transfer' ? (
                    <UserMinus className="h-5 w-5 text-amber-600" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{alert.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{alert.createdAt}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{alert.message}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {alert.actionTab && onNavigateTab && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (alert.id.startsWith('transfer-alert') || alert.id.includes('crit')) {
                        markNotificationAsRead(alert.id);
                      }
                      onNavigateTab(alert.actionTab!);
                    }}
                    className="text-xs font-bold gap-1 text-blue-700 border-blue-200 hover:bg-blue-50"
                  >
                    Ver <ArrowRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
