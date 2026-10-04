import { ProfileManifest } from '../admin/profileManifest';

export const TEACHER_PROFILE_MANIFEST: ProfileManifest = {
  profileId: 'teacher',
  name: 'Corpo Docente / Professores',
  category: 'Atividade Letiva & Avaliação Pedagógica',
  description: 'Lançamento de avaliações contínuas (ACS), testes parciais (APT), sumários de aula, faltas e comunicação com encarregados.',
  canSignOfficialDocuments: true,
  features: [
    {
      id: 'gradebook',
      name: 'Caderneta de Notas & Avaliações',
      path: '/teacher/grades',
      icon: 'Edit3',
      description: 'Registo de ACS1, ACS2, ACS3, APT e cálculo automático da Média Trimestral (MT).'
    },
    {
      id: 'attendance',
      name: 'Livro de Faltas & Presenças',
      path: '/teacher/attendance',
      icon: 'UserCheck',
      description: 'Registo biométrico/manual de presenças e faltas justificadas/injustificadas por aula.'
    },
    {
      id: 'summaries',
      name: 'Livro de Sumários',
      path: '/teacher/summaries',
      icon: 'BookOpen',
      description: 'Lançamento do conteúdo programático lecionado e número de lição.'
    },
    {
      id: 'homework',
      name: 'Gestão de TPC & Trabalhos',
      path: '/teacher/homework',
      icon: 'FolderPlus',
      description: 'Criação de tarefas para a turma com anexos e prazos de entrega.'
    },
    {
      id: 'teacherReport',
      name: 'Relatório de Rendimento da Turma',
      path: '/teacher/report',
      icon: 'FileBarChart',
      description: 'Visão estatística de aprovados e reprovados por disciplina e turma.'
    },
    {
      id: 'signature',
      name: 'Assinatura Digital do Docente',
      path: '/teacher/signature',
      icon: 'FileSignature',
      description: 'Validação e assinatura digital da caderneta de frequência e aproveitamento.'
    }
  ]
};
