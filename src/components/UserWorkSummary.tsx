import React, { useState } from 'react';
import { useStore } from '../store';
import { Card } from './ui';
import { 
  Briefcase, 
  UserCheck, 
  BookOpen, 
  Award, 
  FileText, 
  Users, 
  Building2, 
  Clock, 
  CheckCircle2, 
  ShieldCheck,
  GraduationCap,
  Eye,
  EyeOff,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Lock,
  Check
} from 'lucide-react';

interface UserWorkSummaryProps {
  role?: 'diretor' | 'pedagogico' | 'secretaria' | 'professor' | 'aluno' | 'encarregado' | 'admin' | 'governance';
}

export function UserWorkSummary({ role }: UserWorkSummaryProps) {
  const { currentUser, classes, subjects, students, reports, employees } = useStore();
  const [showPermissions, setShowPermissions] = useState(true);

  const safeClasses = classes || [];
  const safeStudents = students || [];
  const safeSubjects = subjects || [];
  const safeReports = reports || [];

  const rawRole = role || currentUser?.role || 'secretaria';
  let normalizedKey = 'secretaria';
  if (rawRole === 'director' || rawRole === 'diretor') normalizedKey = 'diretor';
  else if (rawRole.startsWith('pedagogical') || rawRole === 'pedagogico') normalizedKey = 'pedagogico';
  else if (rawRole === 'teacher' || rawRole === 'professor') normalizedKey = 'professor';
  else if (rawRole === 'student' || rawRole === 'aluno') normalizedKey = 'aluno';
  else if (rawRole === 'guardian' || rawRole === 'encarregado') normalizedKey = 'encarregado';
  else if (rawRole === 'admin') normalizedKey = 'admin';
  else if (['national', 'provincial', 'district', 'governance'].includes(rawRole)) normalizedKey = 'governance';
  else if (rawRole.startsWith('financial') || rawRole.includes('financas')) normalizedKey = 'financial';

  const userRole = normalizedKey;

  // Role specific definitions
  const roleInfo: Record<string, {
    title: string;
    subtitle: string;
    responsibilities: string[];
    canAccess: string[];
    cannotAccess: string[];
    scope: string;
    icon: any;
    badgeColor: string;
  }> = {
    diretor: {
      title: "Direção da Escola (Gestão Executiva)",
      subtitle: "Responsável pela supervisão geral da instituição, visto de relatórios, homologação de pautas e conformidade com o MINEDH.",
      responsibilities: [
        "Homologação e visto de relatórios trimestrais dos professores e turmas",
        "Gestão de renovação de matrículas, vagas e transferências",
        "Acompanhamento das estatísticas globais da escola (Eixos 4 a 7)",
        "Coordenação de reuniões e diretrizes pedagógicas e administrativas"
      ],
      canAccess: [
        "Estatísticas globais e relatórios consolidados da escola",
        "Homologação final de pautas, exames e atas do MINEDH",
        "Painel financeiro, propinas, orçamento e património escolar",
        "Supervisão de todo o pessoal docente, administrativo e discente",
        "Emissão de avisos oficiais e comunicações aos encarregados"
      ],
      cannotAccess: [
        "Lançamento direto de notas de avaliações sem perfil de docente atribúido",
        "Alteração de sumários de aulas sem mediação do professor titular",
        "Eliminação não auditada de histórico do sistema sem protocolo TI"
      ],
      scope: `${safeClasses.length} Turmas • ${safeStudents.length} Alunos • ${safeReports.length} Relatórios`,
      icon: ShieldCheck,
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200"
    },
    pedagogico: {
      title: "Direção Adjunta Pedagógica",
      subtitle: "Gestão do processo de ensino-aprendizagem, pautas de exame, organização curricular e supervisão docente.",
      responsibilities: [
        "Validação de pautas oficiais de frequência e exames (10ª e 12ª Classes)",
        "Distribuição de turmas, disciplinas e horários letivos",
        "Acompanhamento do aproveitamento escolar e desempenho trimestral",
        "Mediação de suporte pedagógico aos professores e diretores de turma"
      ],
      canAccess: [
        "Visto pedagógico em pautas de frequência e exames gerais",
        "Atribuição de professores, turmas e carga horária semanal",
        "Mapa de aproveitamento acadêmico, retenção e estatísticas pedagógicas",
        "Calendário de avaliações, testes e provas extraordinárias"
      ],
      cannotAccess: [
        "Aprovação de contas e balanços financeiros de caixa",
        "Edição de dados de tesouraria ou pagamentos de propinas",
        "Lançamento de notas em disciplinas onde não leciona diretamente"
      ],
      scope: `${safeSubjects.length} Disciplinas • ${safeClasses.length} Turmas Ativas`,
      icon: GraduationCap,
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
    },
    secretaria: {
      title: "Secretaria Geral e Atendimento",
      subtitle: "Gestão do expediente escolar, registo de novos ingressos, validação de alunos internos e emissão de documentos oficiais.",
      responsibilities: [
        "Registo de matrículas de novos ingressos e validação de alunos internos",
        "Gestão do Eixo 4 (CTA demográfico), Eixo 5 (Biblioteca), Eixo 6 (Previsões N+1) e Eixo 7 (Património)",
        "Emissão de certificados, declarações, guias de transferência e cartões de estudante",
        "Atendimento a encarregados de educação e arquivo de processos discentes"
      ],
      canAccess: [
        "Fichas de alunos, cadastros de encarregados e matrículas",
        "Emissão de guia de transferência, certificados e cartões de estudante",
        "Módulos do Eixo 4 (CTA), Eixo 5 (Biblioteca), Eixo 6 e Eixo 7",
        "Registo de cobranças de propinas e recibos de tesouraria"
      ],
      cannotAccess: [
        "Alteração ou edição de notas de testes inseridas por professores",
        "Homologação pedagógica de pautas ministeriais de exame",
        "Acesso a relatórios confidenciais de avaliação docente"
      ],
      scope: `${safeStudents.length} Alunos Registados • Gestão de Processos`,
      icon: FileText,
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200"
    },
    professor: {
      title: "Corpo Docente / Professor da Turma",
      subtitle: "Lecionação de disciplinas, avaliação contínua de alunos, registo de presenças, sumários e relatórios trimestrais.",
      responsibilities: [
        "Lançamento de notas de avaliações, testes e médias trimestrais",
        "Registo de presenças e faltas dos alunos nas aulas",
        "Submissão de sumários e relatórios de progresso da turma",
        "Orientação pedagógica como Diretor de Turma (confronto de desistentes e transferidos)"
      ],
      canAccess: [
        "Lançamento de notas, testes e pautas das disciplinas atribuídas",
        "Marcação de faltas e registo de sumários diários de aula",
        "Pauta da turma e estatísticas específicas (se for Diretor de Turma)",
        "Submissão de relatórios trimestrais de aproveitamento"
      ],
      cannotAccess: [
        "Visualização ou alteração de notas das disciplinas de outros professores",
        "Acesso ao painel de receitas, pagamentos e propinas da escola",
        "Alteração dos dados cadastrais dos alunos (exclusivo Secretaria)",
        "Homologação final de relatórios globais da instituição"
      ],
      scope: `Docente Ativo • Acompanhamento de Turmas Atribuídas`,
      icon: BookOpen,
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200"
    },
    aluno: {
      title: "Estudante / Corpo Discente",
      subtitle: "Acompanhamento do percurso escolar, consulta de notas, pautas de aproveitamento e materiais de estudo.",
      responsibilities: [
        "Consulta de notas e médias trimestrais por disciplina",
        "Acesso a materiais de apoio, trabalhos de casa e tarefas enviadas pelos professores",
        "Verificação de horário de aulas, exames e calendário escolar",
        "Acompanhamento do estado da matrícula e documentos académicos"
      ],
      canAccess: [
        "Notas pessoais, médias trimestrais e histórico de faltas",
        "Boletim de notas individual e estado da matrícula escolar",
        "Horário semanal das aulas, exames e calendário do MINEDH",
        "Materiais pedagógicos e trabalhos disponibilizados pelos docentes"
      ],
      cannotAccess: [
        "Visualização de notas, dados ou pautas de outros estudantes",
        "Edição ou alteração de qualquer registo acadêmico no sistema",
        "Acesso a relatórios de gestão ou módulos de secretaria/docentes"
      ],
      scope: `Registo de Estudante Ativo no Sistema`,
      icon: Users,
      badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-200"
    },
    encarregado: {
      title: "Encarregado de Educação / Família",
      subtitle: "Acompanhamento do desempenho acadêmico, assiduidade, pagamentos de propinas e comunicação com a escola.",
      responsibilities: [
        "Monitorização de notas e faltas dos educandos em tempo real",
        "Gestão de pagamentos de propinas e mensalidades escolares",
        "Submissão de petições, pedidos de transferência e contacto direto com a direção",
        "Acompanhamento de avisos e calendário escolar oficial"
      ],
      canAccess: [
        "Acompanhamento de notas e assiduidade exclusiva dos seus educandos",
        "Histórico de pagamentos de propinas, taxas e emissão de faturas",
        "Comunicação com a Direção de Turma e submissão de justificações"
      ],
      cannotAccess: [
        "Acesso a fichas, notas ou contactos de outros alunos da escola",
        "Alteração de médias ou presenças lançadas pelos professores"
      ],
      scope: `Acompanhamento de Educandos Matriculados`,
      icon: UserCheck,
      badgeColor: "bg-teal-100 text-teal-800 border-teal-200"
    },
    admin: {
      title: "Administração do Sistema TI",
      subtitle: "Gestão técnica da plataforma, configuração de base de dados, segurança, backups do Firestore e logs do sistema.",
      responsibilities: [
        "Gestão de utilizadores, permissões e papéis de acesso",
        "Monitorização de backups do Firestore e integridade dos dados",
        "Configuração de parâmetros institucionais, SMTP e chaves de API",
        "Resolução de incidências técnicas e manutenção da plataforma"
      ],
      canAccess: [
        "Gestão total de contas de utilizador, permissões e redefinição de senhas",
        "Logs do sistema, integridade do Firestore e rotinas de backup",
        "Parâmetros globais do sistema e integrações ministeriais"
      ],
      cannotAccess: [
        "Alteração direta não auditada de pautas aprovadas sem despacho formal",
        "Assinatura em documentos oficiais em representação da Direção"
      ],
      scope: `Administração Global da Plataforma EduGestão`,
      icon: Briefcase,
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200"
    },
    governance: {
      title: "Supervisão Ministerial / MINEDH",
      subtitle: "Painel macro de governação, estatísticas provinciais e nacionais dos Eixos institucionais.",
      responsibilities: [
        "Acompanhamento de estatísticas consolidadas por província, distrito e escola",
        "Análise de desempenho do Eixo 4 (CTA), Eixo 5 (Biblioteca), Eixo 6 (Previsões) e Eixo 7 (Património)",
        "Auditoria de relatórios e conformidade com as diretrizes do MINEDH",
        "Emissão de diretrizes estratégicas para a rede escolar"
      ],
      canAccess: [
        "Indicadores estáticos globais e consolidados dos Eixos 4, 5, 6 e 7",
        "Atas ministeriais, taxas de aprovação, retenção e evasão escolar",
        "Auditoria de conformidade pedagógica das escolas registadas"
      ],
      cannotAccess: [
        "Lançamento de notas diárias ou edição de presenças locais de turmas",
        "Operações diretas de cobrança de balcão na secretaria escolar"
      ],
      scope: `Supervisão Macro Educativa Nacional`,
      icon: Building2,
      badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200"
    },
    financial: {
      title: "Gestão Financeira & Tesouraria Escolar",
      subtitle: "Responsável pelo controlo de receitas, propinas, taxas de matrícula, despesas de fundo de maneio e prestação de contas.",
      responsibilities: [
        "Registo e cobrança de propinas, mensalidades e emolumentos escolares",
        "Emissão de recibos oficiais e conciliação de pagamentos (M-Pesa, Banco)",
        "Controlo das despesas operacionais e fundo de maneio da escola",
        "Elaboração do balancete e relatórios de execução orçamental MINEDH"
      ],
      canAccess: [
        "Painel de tesouraria, caixa diário e balancete financeiro oficial",
        "Emissão de recibos de pagamento de propinas e taxas escolares",
        "Relatórios de receitas e despesas da instituição",
        "Módulo de cobranças e notificações de propinas em atraso"
      ],
      cannotAccess: [
        "Alteração de pautas ou notas pedagógicas dos estudantes",
        "Edição do cadastro escolar sem autorização da Direcção ou Secretaria",
        "Lançamento de sumários ou alterações em exames pedagógicos"
      ],
      scope: `Gestão Orçamental & Tesouraria Escolar`,
      icon: Briefcase,
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200"
    }
  };

  const info = roleInfo[userRole] || roleInfo['secretaria'];
  const IconComponent = info.icon;

  return (
    <Card className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl shadow-lg border border-slate-700/60 relative overflow-hidden transition-all duration-300">
      {/* Decorative background glow */}
      <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-600/30 border border-blue-400/30 text-blue-300 shadow-inner flex-shrink-0">
            <IconComponent className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${info.badgeColor}`}>
                {userRole.toUpperCase()}
              </span>
              <span className="text-xs text-blue-300 font-mono">({info.scope})</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
              {info.title}
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {info.subtitle}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowPermissions(!showPermissions)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-600/80 transition-all shadow-sm self-start md:self-auto"
        >
          {showPermissions ? (
            <>
              <EyeOff className="h-3.5 w-3.5 text-blue-400" /> Ocultar Nível de Acesso
              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5 text-emerald-400" /> Ver O que Pode/Não Pode Ver
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </>
          )}
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-700/60 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <h4 className="text-[11px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Atribuições e Responsabilidades Principais:
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {info.responsibilities.map((resp, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0"></span>
                <span>{resp}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 flex flex-col justify-between">
          <div>
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-400" /> Estado Atual do Perfil
            </h4>
            <p className="text-xs text-slate-300">
              Sessão ativa sob as normas do Ministério da Educação e Desenvolvimento Humano (MINEDH). Todos os dados e registos estatísticos encontram-se sincronizados em tempo real.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Utilizador: {currentUser?.name || 'Utilizador Oficial'}</span>
            <span className="text-emerald-400 font-bold">● Sistema Operacional</span>
          </div>
        </div>
      </div>

      {/* PERMISSIONS SECTION: O QUE PODE E NÃO PODE VER */}
      {showPermissions && (
        <div className="mt-6 pt-6 border-t border-slate-700/80 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Nível de Acesso e Permissões do Cargo na Visão Geral
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* O QUE PODE VER E REALIZAR */}
            <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wide">
                <div className="p-1 rounded bg-emerald-500/20 border border-emerald-500/40">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <span>O que ESTA POSIÇÃO PODE Ver e Aceder:</span>
              </div>
              <ul className="space-y-2 text-xs text-emerald-100/90">
                {info.canAccess.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* O QUE NÃO PODE VER OU ALTERAR */}
            <div className="bg-rose-950/40 p-4 rounded-xl border border-rose-500/30 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wide">
                <div className="p-1 rounded bg-rose-500/20 border border-rose-500/40">
                  <Lock className="h-3.5 w-3.5 text-rose-400" />
                </div>
                <span>O que ESTA POSIÇÃO NÃO PODE Ver ou Alterar (Restrições):</span>
              </div>
              <ul className="space-y-2 text-xs text-rose-100/90">
                {info.cannotAccess.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold mt-0.5">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
