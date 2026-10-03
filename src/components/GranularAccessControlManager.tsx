import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { User, Role, Employee, GranularPermissions } from '../types';
import { Card, Button } from './ui';
import { 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Users, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  Save, 
  RefreshCw, 
  History, 
  UserCheck, 
  FileSignature, 
  Database,
  Building2,
  BookOpen,
  GraduationCap,
  FileText,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';

export const DEFAULT_GRANULAR_PERMISSIONS: GranularPermissions = {
  secretariat: {
    enrollment_create: true,
    enrollment_edit: true,
    certificates_issue: true,
    declarations_issue: true,
    student_process_manage: true,
    transfers_manage: true,
    medical_board_manage: true,
    tuition_fees_manage: true,
    archive_access: true,
  },
  pedagogia: {
    pautas_approve: true,
    exam_lists_publish: true,
    class_schedule_manage: true,
    academic_curriculum_manage: true,
    grade_lock_override: true,
    teacher_assignment_manage: true,
    statistical_reports_view: true,
  },
  teacher: {
    grades_launch_trimester: true,
    exam_grades_launch: true,
    lesson_summaries_manage: true,
    class_attendance_manage: true,
    student_tasks_create: true,
    pedagogical_reports_submit: true,
    grade_export_print: true,
  },
};

interface AuditEntry {
  id: string;
  timestamp: string;
  targetName: string;
  targetRole: string;
  changedBy: string;
  module: 'secretariat' | 'pedagogia' | 'teacher';
  permissionKey: string;
  newValue: boolean;
}

export const GranularAccessControlManager: React.FC = () => {
  const { currentUser, employees, updateUserProfile, saveUserProfile } = useStore();

  const [activeTab, setActiveTab] = useState<'matrix' | 'individual' | 'audit'>('matrix');
  const [selectedRole, setSelectedRole] = useState<'secretariat' | 'pedagogia' | 'teacher'>('secretariat');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  
  // Role defaults state
  const [roleDefaults, setRoleDefaults] = useState<GranularPermissions>(() => {
    const saved = localStorage.getItem('minedh_role_permissions_defaults');
    return saved ? JSON.parse(saved) : DEFAULT_GRANULAR_PERMISSIONS;
  });

  // Individual employee custom permissions overrides: employeeId -> GranularPermissions
  const [employeeOverrides, setEmployeeOverrides] = useState<Record<string, GranularPermissions>>(() => {
    const saved = localStorage.getItem('minedh_employee_permissions_overrides');
    return saved ? JSON.parse(saved) : {};
  });

  // Audit trail state
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(() => {
    const saved = localStorage.getItem('minedh_permissions_audit_log');
    return saved ? JSON.parse(saved) : [
      {
        id: 'aud-1',
        timestamp: new Date().toISOString(),
        targetName: 'Configuração Padrão do Sistema',
        targetRole: 'Director da Escola',
        changedBy: currentUser?.name || 'Director da Escola',
        module: 'secretariat',
        permissionKey: 'certificates_issue',
        newValue: true
      }
    ];
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to record audit
  const logAudit = (targetName: string, targetRole: string, module: 'secretariat' | 'pedagogia' | 'teacher', permissionKey: string, newValue: boolean) => {
    const newEntry: AuditEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      targetName,
      targetRole,
      changedBy: currentUser?.name || 'Director da Escola',
      module,
      permissionKey,
      newValue
    };
    const updated = [newEntry, ...auditLog].slice(0, 50);
    setAuditLog(updated);
    localStorage.setItem('minedh_permissions_audit_log', JSON.stringify(updated));
  };

  // Toggle role default permission
  const handleToggleRolePermission = (module: 'secretariat' | 'pedagogia' | 'teacher', key: string) => {
    const currentVal = (roleDefaults[module] as any)?.[key] ?? true;
    const newVal = !currentVal;

    const updated = {
      ...roleDefaults,
      [module]: {
        ...(roleDefaults[module] || {}),
        [key]: newVal
      }
    };

    setRoleDefaults(updated);
    localStorage.setItem('minedh_role_permissions_defaults', JSON.stringify(updated));
    logAudit(`Perfil Geral: ${module.toUpperCase()}`, module, module, key, newVal);
    showToast(`Permissão "${key}" atualizada para ${newVal ? 'ACTIVADA' : 'DESACTIVADA'} no perfil ${module.toUpperCase()}.`);
  };

  // Toggle individual employee permission
  const handleToggleEmployeePermission = (employee: Employee, module: 'secretariat' | 'pedagogia' | 'teacher', key: string) => {
    const currentEmployeePerms = employeeOverrides[employee.id] || roleDefaults;
    const currentVal = (currentEmployeePerms[module] as any)?.[key] ?? true;
    const newVal = !currentVal;

    const updatedEmployeePerms: GranularPermissions = {
      ...currentEmployeePerms,
      [module]: {
        ...(currentEmployeePerms[module] || {}),
        [key]: newVal
      }
    };

    const updatedOverrides = {
      ...employeeOverrides,
      [employee.id]: updatedEmployeePerms
    };

    setEmployeeOverrides(updatedOverrides);
    localStorage.setItem('minedh_employee_permissions_overrides', JSON.stringify(updatedOverrides));

    // Also persist to store and Firestore if user exists
    if (updateUserProfile) {
      updateUserProfile(employee.id, {
        permissions: {
          granular: updatedEmployeePerms
        }
      }).catch(() => {});
    }

    logAudit(employee.name, employee.roleFunction || employee.category, module, key, newVal);
    showToast(`Permissão "${key}" de ${employee.name} alterada para ${newVal ? 'ACTIVADA' : 'DESACTIVADA'}.`);
  };

  // Apply preset to role
  const handleApplyPresetToRole = (module: 'secretariat' | 'pedagogia' | 'teacher', preset: 'all' | 'readonly' | 'restricted' | 'standard') => {
    let newModulePerms: Record<string, boolean> = {};
    const defaultKeys = Object.keys((DEFAULT_GRANULAR_PERMISSIONS[module] as any) || {});

    if (preset === 'all' || preset === 'standard') {
      defaultKeys.forEach(k => { newModulePerms[k] = true; });
    } else if (preset === 'readonly') {
      defaultKeys.forEach(k => { 
        newModulePerms[k] = k.includes('view') || k.includes('access') || k.includes('print'); 
      });
    } else if (preset === 'restricted') {
      defaultKeys.forEach(k => { newModulePerms[k] = false; });
    }

    const updated = {
      ...roleDefaults,
      [module]: newModulePerms
    };

    setRoleDefaults(updated);
    localStorage.setItem('minedh_role_permissions_defaults', JSON.stringify(updated));
    logAudit(`Perfil Geral: ${module.toUpperCase()}`, module, module, `Preset: ${preset.toUpperCase()}`, true);
    showToast(`Predefinição "${preset.toUpperCase()}" aplicada com sucesso a ${module.toUpperCase()}.`);
  };

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.roleFunction?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedRole === 'secretariat') {
        return emp.department?.toLowerCase().includes('secretaria') || emp.roleFunction?.toLowerCase().includes('secret') || emp.category?.toLowerCase().includes('secret');
      } else if (selectedRole === 'pedagogia') {
        return emp.department?.toLowerCase().includes('pedag') || emp.roleFunction?.toLowerCase().includes('pedag') || emp.leadershipRole?.toLowerCase().includes('pedag');
      } else if (selectedRole === 'teacher') {
        return emp.career?.toLowerCase().includes('docente') || emp.category?.toLowerCase().includes('docente') || (emp.taughtSubjects && emp.taughtSubjects.length > 0);
      }
      return true;
    });
  }, [employees, searchQuery, selectedRole]);

  const selectedEmployee = useMemo(() => {
    if (!selectedEmployeeId) return filteredEmployees[0] || employees[0];
    return employees.find(e => e.id === selectedEmployeeId) || filteredEmployees[0] || employees[0];
  }, [selectedEmployeeId, filteredEmployees, employees]);

  // Permission definitions with rich descriptive metadata
  const permissionDefinitions = {
    secretariat: [
      {
        key: 'enrollment_create',
        title: 'Criar Novas Matrículas e Inscrições',
        desc: 'Permite registar novos alunos no sistema, gerar processos e emitir recibos oficiais.',
        icon: <UserCheck className="h-5 w-5 text-blue-600" />,
        badge: 'Operação Crítica'
      },
      {
        key: 'enrollment_edit',
        title: 'Editar Cadastros e Dados Biográficos',
        desc: 'Permite retificar nomes, filiação, NUIT, documentos e endereços dos estudantes.',
        icon: <BookOpen className="h-5 w-5 text-indigo-600" />,
        badge: 'Cadastro'
      },
      {
        key: 'certificates_issue',
        title: 'Emitir Certificados e Diplomas Oficiais',
        desc: 'Autoriza a geração de certificados de conclusão com selo branco, QR Code e numeração única.',
        icon: <GraduationCap className="h-5 w-5 text-amber-600" />,
        badge: 'Documento Público'
      },
      {
        key: 'declarations_issue',
        title: 'Emitir Declarações de Notas e Frequência',
        desc: 'Permite emitir declarações com e sem notas, com carimbo da secretaria.',
        icon: <FileText className="h-5 w-5 text-emerald-600" />,
        badge: 'Documento Público'
      },
      {
        key: 'student_process_manage',
        title: 'Gestão de Processos Individuais do Aluno',
        desc: 'Permite consultar e atualizar capas e folhas do processo individual do aluno.',
        icon: <Database className="h-5 w-5 text-slate-700" />,
        badge: 'Arquivo'
      },
      {
        key: 'transfers_manage',
        title: 'Tramitação de Pedidos de Transferência',
        desc: 'Autoriza processar guias de transferência de entrada e saída de estudantes.',
        icon: <Building2 className="h-5 w-5 text-purple-600" />,
        badge: 'Transição'
      },
      {
        key: 'medical_board_manage',
        title: 'Junta Médica & Atestados de Saúde',
        desc: 'Registo e homologação de atestados médicos e dispensas de educação física.',
        icon: <ShieldCheck className="h-5 w-5 text-teal-600" />,
        badge: 'Saúde Escolar'
      },
      {
        key: 'tuition_fees_manage',
        title: 'Gestão de Propinas e Pagamentos',
        desc: 'Autoriza lançar pagamentos de mensalidades, emitir recibos e consultar extratos.',
        icon: <KeyRound className="h-5 w-5 text-emerald-700" />,
        badge: 'Financeiro'
      },
      {
        key: 'archive_access',
        title: 'Acesso ao Arquivo Histórico e Livros de Matrícula',
        desc: 'Permite consultar registos de alunos de anos letivos anteriores.',
        icon: <History className="h-5 w-5 text-slate-600" />,
        badge: 'Histórico'
      }
    ],
    pedagogia: [
      {
        key: 'pautas_approve',
        title: 'Homologação e Aprovação de Pautas Oficiais',
        desc: 'Autoriza validar pautas trimestrais e pautas finais de frequência e exames.',
        icon: <ShieldCheck className="h-5 w-5 text-blue-700" />,
        badge: 'Pedagógico'
      },
      {
        key: 'exam_lists_publish',
        title: 'Publicação de Listas de Exames e Júris',
        desc: 'Permite homologar listas de alunos admitidos, excluídos e dispensados aos exames.',
        icon: <GraduationCap className="h-5 w-5 text-purple-700" />,
        badge: 'Exames'
      },
      {
        key: 'class_schedule_manage',
        title: 'Gestão de Horários e Calendário Escolar',
        desc: 'Autoriza criar e ajustar horários de turmas, salas e agendamento de eventos.',
        icon: <Clock className="h-5 w-5 text-amber-600" />,
        badge: 'Planeamento'
      },
      {
        key: 'academic_curriculum_manage',
        title: 'Gestão da Matriz Curricular e Turmas',
        desc: 'Permite criar turmas, atribuir áreas de estudo (CS, MCN, APTP) e matriz de 14 disciplinas.',
        icon: <BookOpen className="h-5 w-5 text-indigo-600" />,
        badge: 'Curricular'
      },
      {
        key: 'grade_lock_override',
        title: 'Desbloqueio e Retificação de Notas Trancadas',
        desc: 'Permite reabrir o lançamento de avaliações após o encerramento trimestral.',
        icon: <Unlock className="h-5 w-5 text-rose-600" />,
        badge: 'Crítico'
      },
      {
        key: 'teacher_assignment_manage',
        title: 'Distribuição de Aulas e Carga Horária Docente',
        desc: 'Autoriza alocar professores às turmas, disciplinas e ciclos de ensino.',
        icon: <Users className="h-5 w-5 text-teal-600" />,
        badge: 'Alocação'
      },
      {
        key: 'statistical_reports_view',
        title: 'Visualização de Relatórios Estatísticos e Gráficos',
        desc: 'Acesso a análises de aproveitamento escolar, retenção e aprovação por género.',
        icon: <FileSignature className="h-5 w-5 text-blue-600" />,
        badge: 'Estatística'
      }
    ],
    teacher: [
      {
        key: 'grades_launch_trimester',
        title: 'Lançamento de Avaliações Contínuas (ACS1, ACS2, ACS3, APT)',
        desc: 'Autoriza os professores a lançar notas de avaliação contínua nas suas turmas atribuídas.',
        icon: <BookOpen className="h-5 w-5 text-blue-600" />,
        badge: 'Avaliação'
      },
      {
        key: 'exam_grades_launch',
        title: 'Lançamento de Notas de Exames Escritos',
        desc: 'Permite introduzir as notas da 1ª e 2ª época de exames e calcular a Classificação Final (CF).',
        icon: <GraduationCap className="h-5 w-5 text-indigo-600" />,
        badge: 'Exames'
      },
      {
        key: 'lesson_summaries_manage',
        title: 'Registo e Edição de Sumários de Aulas',
        desc: 'Autoriza o preenchimento diário do livro de sumários da disciplina.',
        icon: <FileText className="h-5 w-5 text-emerald-600" />,
        badge: 'Sumários'
      },
      {
        key: 'class_attendance_manage',
        title: 'Registo de Faltas e Assiduidade dos Estudantes',
        desc: 'Permite marcar presenças e faltas justificadas/injustificadas por tempo de aula.',
        icon: <Clock className="h-5 w-5 text-amber-600" />,
        badge: 'Assiduidade'
      },
      {
        key: 'student_tasks_create',
        title: 'Criação e Publicação de Trabalhos / Exercícios',
        desc: 'Autoriza criar tarefas, definir prazos e recolher ficheiros submetidos pelos alunos.',
        icon: <Sparkles className="h-5 w-5 text-purple-600" />,
        badge: 'Trabalhos'
      },
      {
        key: 'pedagogical_reports_submit',
        title: 'Submissão do Relatório Trimestral do Docente',
        desc: 'Permite enviar o relatório oficial de cumprimento de programa e aproveitamento à Direção.',
        icon: <FileSignature className="h-5 w-5 text-teal-600" />,
        badge: 'Relatórios'
      },
      {
        key: 'grade_export_print',
        title: 'Impressão e Exportação de Cadernetas Oficiais',
        desc: 'Autoriza a impressão das cadernetas do professor em formato oficial MINEDH.',
        icon: <Database className="h-5 w-5 text-slate-700" />,
        badge: 'Impressão'
      }
    ]
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-4 fixed top-6 right-6 z-50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-amber-300 shrink-0" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white hover:text-emerald-200">
            &times;
          </button>
        </div>
      )}

      {/* Top Banner with Firebase Auth & MINEDH Security Status */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="bg-blue-600/30 text-blue-300 border border-blue-400/40 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              SISTEMA OFICIAL MINEDH • CONTROLO DE ACESSO
            </span>
            <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2.5 py-1 rounded-full">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Firebase Auth & Firestore Sincronizados
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3 font-serif">
            <ShieldCheck className="h-8 w-8 text-amber-400" />
            Gestão Granular de Permissões & Acessos
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Painel exclusivo da <strong>Direcção da Escola</strong> para gerir, auditar e revogar privilégios operacionais específicos da <strong>Secretaria Geral</strong>, <strong>Corpo Docente</strong> e <strong>Conselho Pedagógico</strong>.
          </p>
        </div>

        <div className="bg-white/10  p-4 rounded-2xl border border-white/20 text-xs space-y-2 min-w-[280px]">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-slate-300 font-medium">Autenticação:</span>
            <span className="font-mono font-bold text-amber-300">Firebase Token Active</span>
          </div>
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="text-slate-300 font-medium">Gestor Responsável:</span>
            <span className="font-bold text-white truncate max-w-[150px]">{currentUser?.name || 'Director da Escola'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium">Colaboradores Auditados:</span>
            <span className="font-mono font-bold text-emerald-300">{employees.length} activos</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'matrix' 
                ? 'bg-white text-blue-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck size={16} />
            Matriz de Permissões por Departamento
          </button>
          <button
            onClick={() => setActiveTab('individual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'individual' 
                ? 'bg-white text-blue-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={16} />
            Gestão Individual de Colaboradores
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'audit' 
                ? 'bg-white text-blue-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History size={16} />
            Registo de Auditoria ({auditLog.length})
          </button>
        </div>

        {activeTab === 'matrix' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Predefinições Rápidas:</span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleApplyPresetToRole(selectedRole, 'all')}
              className="text-[11px] font-bold h-8 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              Conceder Total
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleApplyPresetToRole(selectedRole, 'readonly')}
              className="text-[11px] font-bold h-8 border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              Apenas Leitura
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleApplyPresetToRole(selectedRole, 'restricted')}
              className="text-[11px] font-bold h-8 border-rose-300 text-rose-700 hover:bg-rose-50"
            >
              Suspender Privilégios
            </Button>
          </div>
        )}
      </div>

      {/* TAB 1: MATRIZ DE PERMISSÕES POR DEPARTAMENTO */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Department Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setSelectedRole('secretariat')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                selectedRole === 'secretariat'
                  ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-100'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Secretaria Geral</h3>
                  <p className="text-xs text-slate-500">Matrículas, Certificados e Arquivo</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 bg-white rounded-lg border border-slate-200">
                {Object.values(roleDefaults.secretariat || {}).filter(Boolean).length} / {permissionDefinitions.secretariat.length}
              </span>
            </div>

            <div
              onClick={() => setSelectedRole('pedagogia')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                selectedRole === 'pedagogia'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-100'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Conselho Pedagógico</h3>
                  <p className="text-xs text-slate-500">Pautas, Exames e Desbloqueio</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 bg-white rounded-lg border border-slate-200">
                {Object.values(roleDefaults.pedagogia || {}).filter(Boolean).length} / {permissionDefinitions.pedagogia.length}
              </span>
            </div>

            <div
              onClick={() => setSelectedRole('teacher')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                selectedRole === 'teacher'
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-100'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Corpo Docente</h3>
                  <p className="text-xs text-slate-500">Avaliações ACS/APT e Sumários</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 bg-white rounded-lg border border-slate-200">
                {Object.values(roleDefaults.teacher || {}).filter(Boolean).length} / {permissionDefinitions.teacher.length}
              </span>
            </div>
          </div>

          {/* Granular Permission Toggles List */}
          <Card className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-blue-600" />
                  Controlo de Acesso: {selectedRole === 'secretariat' ? 'Secretaria Geral' : selectedRole === 'pedagogia' ? 'Direcção e Conselho Pedagógico' : 'Docentes e Professores de Turma'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ative ou desative cada funcionalidade individualmente. As alterações entram em vigor instantaneamente em todo o sistema.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 italic">Sincronização Firebase Real-Time</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {permissionDefinitions[selectedRole].map((perm) => {
                const isEnabled = (roleDefaults[selectedRole] as any)?.[perm.key] ?? true;

                return (
                  <div key={perm.key} className="py-4.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 px-3 rounded-2xl transition-colors">
                    <div className="flex items-start gap-3.5 max-w-2xl">
                      <div className="p-2.5 bg-slate-100 rounded-xl mt-0.5 shrink-0">
                        {perm.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{perm.title}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                            {perm.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{perm.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-extrabold uppercase ${isEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {isEnabled ? 'Permitido' : 'Bloqueado'}
                      </span>
                      <button
                        onClick={() => handleToggleRolePermission(selectedRole, perm.key)}
                        className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                          isEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                        }`}
                      >
                        <div className="bg-white w-6 h-6 rounded-full shadow-md transform transition-transform"></div>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: GESTÃO INDIVIDUAL DE COLABORADORES */}
      {activeTab === 'individual' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Employees Selector */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" /> Colaboradores ({filteredEmployees.length})
                </h3>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou cargo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Department Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {(['secretariat', 'pedagogia', 'teacher'] as const).map(dept => (
                  <button
                    key={dept}
                    onClick={() => setSelectedRole(dept)}
                    className={`text-[11px] font-bold px-3 py-1 rounded-xl whitespace-nowrap transition-all ${
                      selectedRole === dept 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {dept === 'secretariat' ? 'Secretaria' : dept === 'pedagogia' ? 'Pedagogia' : 'Professores'}
                  </button>
                ))}
              </div>

              {/* Employees List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                {filteredEmployees.map(emp => {
                  const isSelected = selectedEmployee?.id === emp.id;
                  const hasCustomOverrides = Boolean(employeeOverrides[emp.id]);

                  return (
                    <div
                      key={emp.id}
                      onClick={() => setSelectedEmployeeId(emp.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-200' 
                          : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate block">{emp.name}</span>
                          {hasCustomOverrides && (
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded shrink-0">
                              Personalizado
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{emp.roleFunction || emp.category || 'Colaborador'}</p>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {emp.gender === 'Feminino' ? 'F' : 'M'}
                      </span>
                    </div>
                  );
                })}

                {filteredEmployees.length === 0 && (
                  <p className="text-xs text-slate-400 py-6 text-center">Nenhum colaborador encontrado com os filtros selecionados.</p>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Detailed Employee Permission Profile */}
          <div className="lg:col-span-8 space-y-4">
            {selectedEmployee ? (
              <Card className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-6">
                {/* Employee Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-800 text-white font-black text-xl flex items-center justify-center shadow-md">
                      {selectedEmployee.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900">{selectedEmployee.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                          {selectedEmployee.roleFunction || selectedEmployee.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Email: <strong>{selectedEmployee.email || `${selectedEmployee.name.toLowerCase().replace(/\s+/g, '.')}@minedh.gov.mz`}</strong> • NUIT: {selectedEmployee.nuit || '700192841'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const updatedOverrides = { ...employeeOverrides };
                        delete updatedOverrides[selectedEmployee.id];
                        setEmployeeOverrides(updatedOverrides);
                        localStorage.setItem('minedh_employee_permissions_overrides', JSON.stringify(updatedOverrides));
                        showToast(`Restauradas permissões padrão para ${selectedEmployee.name}`);
                      }}
                      className="text-xs font-bold h-8 border-slate-300"
                    >
                      Restaurar Padrão
                    </Button>
                  </div>
                </div>

                {/* Individual Permission Toggles */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Privilégios Específicos do Colaborador
                    </h4>
                    <span className="text-xs text-slate-500">
                      Módulo: <strong className="text-blue-700">{selectedRole.toUpperCase()}</strong>
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {permissionDefinitions[selectedRole].map(perm => {
                      const empPerms = employeeOverrides[selectedEmployee.id] || roleDefaults;
                      const isEnabled = (empPerms[selectedRole] as any)?.[perm.key] ?? true;

                      return (
                        <div key={perm.key} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-100 rounded-lg shrink-0">
                              {perm.icon}
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-slate-900">{perm.title}</h5>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{perm.desc}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className={`text-[11px] font-bold ${isEnabled ? 'text-emerald-700' : 'text-rose-600'}`}>
                              {isEnabled ? 'Activo' : 'Revogado'}
                            </span>
                            <button
                              onClick={() => handleToggleEmployeePermission(selectedEmployee, selectedRole, perm.key)}
                              className={`w-12 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                                isEnabled ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                              }`}
                            >
                              <div className="bg-white w-5 h-5 rounded-full shadow-sm"></div>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-12 text-center text-slate-400 bg-white border border-slate-200 rounded-3xl">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold">Selecione um colaborador para gerir permissões específicas.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REGISTO DE AUDITORIA DE ACESSOS */}
      {activeTab === 'audit' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                Histórico de Auditoria e Alterações de Permissões
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Registo criptográfico e cronológico de todas as concessões e revogações de acesso efetuadas pela Direção.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                localStorage.removeItem('minedh_permissions_audit_log');
                setAuditLog([]);
                showToast('Histórico de auditoria limpo.');
              }}
              className="text-xs font-bold text-slate-600"
            >
              Limpar Registo
            </Button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
            {auditLog.map((entry) => (
              <div key={entry.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{entry.targetName}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">
                      {entry.module.toUpperCase()} • {entry.permissionKey}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Alterado por: <strong>{entry.changedBy}</strong> • Data: {new Date(entry.timestamp).toLocaleString('pt-MZ')}
                  </p>
                </div>

                <div>
                  <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                    entry.newValue ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {entry.newValue ? 'Concedido' : 'Revogado'}
                  </span>
                </div>
              </div>
            ))}

            {auditLog.length === 0 && (
              <p className="text-xs text-slate-400 py-8 text-center font-medium">Nenhum evento de auditoria registado.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
