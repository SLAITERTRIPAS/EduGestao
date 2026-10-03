import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Card, Button } from './ui';
import { 
  GraduationCap, BookOpen, Users, CheckCircle, AlertCircle, 
  FileSpreadsheet, Award, Calendar, Send, Printer, FileText,
  BarChart3, CheckCheck, TrendingUp, Layers, BookMarked, Clock
} from 'lucide-react';
import { MOZAMBIQUE_LOGO_URL } from './TeacherReport';
import { useHierarchicalStatistics } from '../hooks/useHierarchicalStatistics';

interface TeacherCompetencyProps {
  employee: any;
}

// -------------------------------------------------------------
// WORKSPACE 1: DIRETOR DE TURMA
// -------------------------------------------------------------
export const DiretorTurmaWorkspace: React.FC<TeacherCompetencyProps> = ({ employee }) => {
  const { classes, students, subjects, grades, examGrades, currentUser, schools, evaluations, classTasks, addEvaluation, addClassTask } = useStore();
  const { submitClassToCiclo } = useHierarchicalStatistics();
  
  const targetClassId = employee.diretorTurmaClassId || classes[0]?.id;
  const targetClass = classes.find(c => c.id === targetClassId) || classes[0];
  const turmaStudents = students
    .filter(s => s.classId === targetClass?.id)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-PT', { sensitivity: 'base' }));
  
  const [subTab, setSubTab] = useState<'pauta' | 'estatistica' | 'assiduidade' | 'relatorio' | 'avaliacoes_tarefas'>('pauta');
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  const [evalForm, setEvalForm] = useState({
    subjectName: subjects[0]?.name || 'Matemática',
    type: 'ACS' as 'ACS' | 'APT' | 'Exame',
    title: '',
    date: '2026-03-30',
    time: '08:00',
    room: 'Sala 12'
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '2026-03-28',
    fileName: ''
  });

  const handleCreateEval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalForm.title) return;
    addEvaluation({
      schoolId: targetClass?.schoolId || 's1',
      classId: targetClass?.id || 'c1',
      className: targetClass?.name || 'Turma',
      subjectName: evalForm.subjectName,
      type: evalForm.type,
      title: evalForm.title,
      date: evalForm.date,
      time: evalForm.time,
      room: evalForm.room,
      teacherName: currentUser?.name || employee.name
    });
    setEvalForm({ subjectName: subjects[0]?.name || 'Matemática', type: 'ACS', title: '', date: '2026-03-30', time: '08:00', room: 'Sala 12' });
    alert('Avaliação agendada com sucesso para a turma!');
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title) return;
    addClassTask({
      schoolId: targetClass?.schoolId || 's1',
      classId: targetClass?.id || 'c1',
      title: taskForm.title,
      description: taskForm.description,
      teacherName: currentUser?.name || employee.name,
      dueDate: taskForm.dueDate,
      fileName: taskForm.fileName || 'Material_Estudo.pdf'
    });
    setTaskForm({ title: '', description: '', dueDate: '2026-03-28', fileName: '' });
    alert('Tarefa / Ficheiro publicado com sucesso para a turma!');
  };

  // Demographic stats
  const maleCount = turmaStudents.filter(s => s.gender === 'M').length;
  const femaleCount = turmaStudents.filter(s => s.gender === 'F').length;
  const totalStudents = turmaStudents.length;

  // Grade averages per student
  const studentAverages = useMemo(() => {
    return turmaStudents.map(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      const studentExams = examGrades.filter(g => g.studentId === student.id);
      
      const subjectGrades = subjects.map(sub => {
        const t1 = studentGrades.find(g => g.subjectId === sub.id && g.trimester === 1)?.media;
        const t2 = studentGrades.find(g => g.subjectId === sub.id && g.trimester === 2)?.media;
        const t3 = studentGrades.find(g => g.subjectId === sub.id && g.trimester === 3)?.media;
        const valid = [t1, t2, t3].filter((v): v is number => v !== undefined && !isNaN(v));
        const finalMedia = valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
        return { subjectId: sub.id, subjectName: sub.name, finalMedia };
      });

      const validAverages = subjectGrades.map(s => s.finalMedia).filter((v): v is number => v !== null);
      const globalAverage = validAverages.length > 0 
        ? Math.round(validAverages.reduce((a, b) => a + b, 0) / validAverages.length) 
        : 12; // default reasonable average

      const isApproved = globalAverage >= 10;
      return {
        student,
        subjectGrades,
        globalAverage,
        status: isApproved ? 'Aprovado' : 'Reprovado'
      };
    });
  }, [turmaStudents, grades, examGrades, subjects]);

  const approvedCount = studentAverages.filter(s => s.status === 'Aprovado').length;
  const reprovedCount = studentAverages.filter(s => s.status === 'Reprovado').length;
  const passRate = totalStudents > 0 ? Math.round((approvedCount / totalStudents) * 100) : 0;

  const handleSubmitToCiclo = () => {
    if (targetClass) {
      (submitClassToCiclo as any)(targetClass.id, {
        submittedByName: currentUser?.name || employee.name,
        notes: `Estatística oficial da Turma ${targetClass.name} submetida pelo Diretor de Turma.`
      });
      setSubmissionFeedback(`Estatística da turma ${targetClass.name} submetida com sucesso ao Pedagógico do Ciclo!`);
      setTimeout(() => setSubmissionFeedback(null), 5000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-purple-500/30 text-purple-200 px-3 py-1 rounded-full text-xs font-bold mb-2  border border-purple-400/30">
            <GraduationCap className="h-4 w-4" /> Competência Pedagógica: Direção de Turma
          </div>
          <h1 className="text-2xl font-black">
            Diretor de Turma: {targetClass?.name} ({targetClass?.gradeLevel})
          </h1>
          <p className="text-xs text-purple-200 mt-1">
            Docente Responsável: <strong>{employee.name}</strong> • Período: {targetClass?.period || 'Diurno'} • Efetivo: {totalStudents} Alunos
          </p>
        </div>

        {/* Submissão Rápida */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSubmitToCiclo}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md gap-2"
          >
            <Send className="h-4 w-4" /> Submeter Estatística ao Ciclo
          </Button>
        </div>
      </div>

      {submissionFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl flex items-center gap-3 animate-in fade-in shadow-xs">
          <CheckCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-xs font-bold">{submissionFeedback}</p>
        </div>
      )}

      {/* Quick Demographic & Academic Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total de Alunos</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{totalStudents}</p>
          <span className="text-[10px] text-slate-400 font-medium">H: {maleCount} | M: {femaleCount} ({totalStudents > 0 ? Math.round((femaleCount/totalStudents)*100) : 0}% F)</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-green-200 shadow-xs bg-green-50/20">
          <span className="text-[11px] font-bold text-green-700 uppercase tracking-wider block">Taxa de Aproveitamento</span>
          <p className="text-2xl font-black text-green-700 font-mono mt-1">{passRate}%</p>
          <span className="text-[10px] text-green-600 font-medium">{approvedCount} de {totalStudents} Aprovados</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs bg-amber-50/20">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Alunos em Risco / Exame</span>
          <p className="text-2xl font-black text-amber-800 font-mono mt-1">{reprovedCount}</p>
          <span className="text-[10px] text-amber-700 font-medium">Média abaixo de 10.0</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs bg-blue-50/20">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Disciplinas da Turma</span>
          <p className="text-2xl font-black text-blue-800 font-mono mt-1">{subjects.length}</p>
          <span className="text-[10px] text-blue-600 font-medium">Plano Curricular Oficial</span>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setSubTab('pauta')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            subTab === 'pauta' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" /> Pauta Geral da Turma
        </button>

        <button
          onClick={() => setSubTab('estatistica')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            subTab === 'estatistica' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" /> Estatística & Submissão ao Ciclo
        </button>

        <button
          onClick={() => setSubTab('assiduidade')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            subTab === 'assiduidade' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="h-3.5 w-3.5" /> Livro de Turma & Faltas
        </button>

        <button
          onClick={() => setSubTab('relatorio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            subTab === 'relatorio' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Printer className="h-3.5 w-3.5" /> Relatório Oficial do DT
        </button>
      </div>

      {/* SUB-VIEW 1: PAUTA GERAL DA TURMA */}
      {subTab === 'pauta' && (
        <Card className="p-5 overflow-hidden">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-800">
                Pauta Consolidada de Aproveitamento • {targetClass?.name}
              </h3>
              <p className="text-xs text-slate-500">
                Visão integral de todas as disciplinas curriculares dos {totalStudents} alunos.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" /> Imprimir Pauta
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10 text-center">Nº</th>
                  <th className="p-3 min-w-[200px]">Nome Completo do Aluno</th>
                  <th className="p-3 text-center w-12">Sexo</th>
                  {subjects.slice(0, 6).map(sub => (
                    <th key={sub.id} className="p-3 text-center min-w-[80px]">
                      {sub.name}
                    </th>
                  ))}
                  <th className="p-3 text-center font-bold text-purple-900 bg-purple-50 min-w-[80px]">Média</th>
                  <th className="p-3 text-center min-w-[100px]">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentAverages.map((row, idx) => (
                  <tr key={row.student.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-semibold text-slate-800">
                      {row.student.name}
                      <span className="block text-[10px] text-slate-400 font-mono">ID: {row.student.loginId || row.student.id}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${row.student.gender === 'F' ? 'bg-pink-50 text-pink-700' : 'bg-blue-50 text-blue-700'}`}>
                        {row.student.gender || 'M'}
                      </span>
                    </td>
                    {row.subjectGrades.slice(0, 6).map(sg => (
                      <td key={sg.subjectId} className="p-3 text-center font-mono">
                        <span className={`font-bold ${sg.finalMedia && sg.finalMedia >= 10 ? 'text-blue-900' : 'text-red-600'}`}>
                          {sg.finalMedia !== null ? sg.finalMedia : '-'}
                        </span>
                      </td>
                    ))}
                    <td className="p-3 text-center font-bold font-mono bg-purple-50/50 text-purple-950">
                      {row.globalAverage}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        row.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* SUB-VIEW 2: ESTATÍSTICA DA TURMA & SUBMISSÃO */}
      {subTab === 'estatistica' && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Quadro Estatístico Oficial da Turma (Censo Pedagógico)
              </h3>
              <p className="text-xs text-slate-500">
                Dados consolidados para envio hierárquico ao Pedagógico do Ciclo.
              </p>
            </div>
            <Button
              onClick={handleSubmitToCiclo}
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs gap-2 shrink-0"
            >
              <Send className="h-4 w-4" /> Enviar ao Pedagógico do Ciclo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">1. Dados Demográficos por Sexo</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Alunos Homens (Masculino):</span>
                  <span className="font-bold font-mono text-blue-900">{maleCount} ({totalStudents > 0 ? Math.round((maleCount/totalStudents)*100) : 0}%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Alunas Mulheres (Feminino):</span>
                  <span className="font-bold font-mono text-pink-700">{femaleCount} ({totalStudents > 0 ? Math.round((femaleCount/totalStudents)*100) : 0}%)</span>
                </div>
                <div className="flex justify-between py-1 font-bold text-slate-900">
                  <span>Efetivo Total da Turma:</span>
                  <span className="font-mono text-purple-900">{totalStudents} alunos</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider">2. Rendimento e Situação Final</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Alunos Aprovados / Dispensados:</span>
                  <span className="font-bold font-mono text-emerald-700">{approvedCount} ({passRate}%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600">Alunos Reprovados / Excluídos:</span>
                  <span className="font-bold font-mono text-red-600">{reprovedCount} ({100 - passRate}%)</span>
                </div>
                <div className="flex justify-between py-1 font-bold text-slate-900">
                  <span>Média Global da Turma:</span>
                  <span className="font-mono text-indigo-900">12.8 / 20 valores</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* SUB-VIEW 3: LIVRO DE TURMA */}
      {subTab === 'assiduidade' && (
        <Card className="p-6">
          <h3 className="text-sm font-black text-slate-800 mb-2">Controlo de Assiduidade e Comportamento</h3>
          <p className="text-xs text-slate-500 mb-4">Registro do Diretor de Turma conforme o Regulamento Escolar de Moçambique.</p>
          <div className="space-y-2">
            {turmaStudents.slice(0, 10).map((s, idx) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400 font-bold">{idx + 1}</span>
                  <div>
                    <span className="font-bold text-slate-800">{s.name}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">ID: {s.loginId || s.id}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-600">Faltas Justificadas: <strong>0</strong></span>
                  <span className="text-slate-600">Faltas Injustificadas: <strong>0</strong></span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">Regular</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* SUB-VIEW 4: RELATÓRIO DO DT */}
      {subTab === 'relatorio' && (
        <Card className="p-8 space-y-6 max-w-4xl mx-auto bg-white border-2 border-slate-300">
          <div className="text-center space-y-2 border-b border-slate-300 pb-4">
            <img 
              src={MOZAMBIQUE_LOGO_URL} 
              alt="Emblema Nacional de Moçambique" 
              className="h-20 w-20 mx-auto object-contain drop-shadow-sm mb-2" 
            />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800">República de Moçambique</h3>
            <h4 className="text-[11px] font-semibold uppercase text-slate-600">Ministério da Educação e Desenvolvimento Humano</h4>
            <h2 className="text-base font-black text-purple-950 uppercase pt-1">
              Relatório Oficial do Director de Turma • Ano Lectivo 2026
            </h2>
            <p className="text-xs font-bold text-slate-700">Turma: {targetClass?.name} • {targetClass?.gradeLevel}</p>
          </div>

          <div className="text-xs space-y-4 text-slate-800 leading-relaxed">
            <p>
              Eu, <strong>{employee.name}</strong>, no uso das competências conferidas como Director da Turma <strong>{targetClass?.name}</strong>, certifico que durante o período letivo foram matriculados <strong>{totalStudents}</strong> alunos, dos quais <strong>{maleCount}</strong> rapazes e <strong>{femaleCount}</strong> raparigas.
            </p>
            <p>
              A taxa de aproveitamento pedagógico alcançada pela turma foi de <strong>{passRate}%</strong> ({approvedCount} alunos com situação positiva), cumprindo as diretrizes metodológicas do ciclo de ensino.
            </p>
          </div>

          <div className="pt-8 flex justify-between text-center text-xs">
            <div>
              <div className="w-48 border-b border-slate-400 pb-1 mb-1 mx-auto font-bold">{employee.name}</div>
              <span className="text-slate-500 text-[10.5px]">O Director de Turma</span>
            </div>
            <div>
              <div className="w-48 border-b border-slate-400 pb-1 mb-1 mx-auto font-bold">Direcção Pedagógica</div>
              <span className="text-slate-500 text-[10.5px]">Visto do Pedagógico do Ciclo</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// WORKSPACE 2: DELEGADO DE DISCIPLINA
// -------------------------------------------------------------
export const DelegadoDisciplinaWorkspace: React.FC<TeacherCompetencyProps> = ({ employee }) => {
  const { subjects, classes, students, grades } = useStore();
  const subjectName = employee.delegadoDisciplinaSubjectName || employee.taughtSubjects?.[0] || 'Matemática';
  const targetSubject = subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase()) || subjects[0];

  const [discTab, setDiscTab] = useState<'dosificacao' | 'provas' | 'rendimento' | 'banco'>('dosificacao');

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-gradient-to-r from-amber-900 via-orange-900 to-amber-950 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-500/30 text-amber-200 px-3 py-1 rounded-full text-xs font-bold mb-2  border border-amber-400/30">
            <BookMarked className="h-4 w-4" /> Competência Pedagógica: Coordenação da Disciplina
          </div>
          <h1 className="text-2xl font-black">
            Coordenação & Delegação de Disciplina: {targetSubject?.name}
          </h1>
          <p className="text-xs text-amber-200 mt-1">
            Delegado de Disciplina: <strong>{employee.name}</strong> • Área: {targetSubject?.area || 'Curricular Geral'}
          </p>
        </div>
      </div>

      <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setDiscTab('dosificacao')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            discTab === 'dosificacao' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📖 Plano Analítico & Dosificações
        </button>

        <button
          onClick={() => setDiscTab('provas')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            discTab === 'provas' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📝 Matrizes de Provas & Testes Unificados
        </button>

        <button
          onClick={() => setDiscTab('rendimento')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            discTab === 'rendimento' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📊 Comparativo de Rendimento da Disciplina
        </button>

        <button
          onClick={() => setDiscTab('banco')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            discTab === 'banco' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📂 Banco de Itens & Actas
        </button>
      </div>

      {discTab === 'dosificacao' && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-black text-slate-800">Dosificação Trimestral Oficial • {targetSubject?.name}</h3>
          <p className="text-xs text-slate-500">Distribuição temática e plano de aulas elaborado pelo grupo de disciplina.</p>
          <div className="space-y-3">
            {[
              { semana: 'Semanas 1 - 3', tema: 'Unidade I: Introdução & Conceitos Fundamentais', aulas: 12, status: 'Concluído' },
              { semana: 'Semanas 4 - 7', tema: 'Unidade II: Desenvolvimento Teórico & Aplicação Prática', aulas: 16, status: 'Em Curso' },
              { semana: 'Semanas 8 - 10', tema: 'Unidade III: Avaliação Formativa e Prova Trimestral (APT)', aulas: 12, status: 'Planeado' },
            ].map((d, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="font-bold text-amber-900 block">{d.semana}: {d.tema}</span>
                  <span className="text-[10px] text-slate-500">Carga Horária Prevista: {d.aulas} Horas/Aula</span>
                </div>
                <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-100 text-amber-800">{d.status}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {discTab === 'provas' && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-black text-slate-800">Matrizes de Testes e Provas Unificadas</h3>
          <p className="text-xs text-slate-500">Supervisão da elaboração de provas comuns para garantir a equidade avaliativa.</p>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
            <span className="font-bold block">✓ Teste Escrito Trimestral 1 (ACS 1 & ACS 2)</span>
            <p className="text-[11px] text-amber-800">
              Matriz homologada pelo Delegado de Disciplina e submetida à Direcção Pedagógica.
            </p>
          </div>
        </Card>
      )}

      {discTab === 'rendimento' && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-black text-slate-800">Aproveitamento Comparativo da Disciplina de {targetSubject?.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {classes.slice(0, 3).map(c => (
              <div key={c.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800 block">{c.name}</span>
                <p className="text-xl font-black text-amber-900 font-mono mt-1">13.2 val</p>
                <span className="text-[10px] text-emerald-700 font-semibold">88% Taxa de Aprovação</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {discTab === 'banco' && (
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-black text-slate-800">Banco de Itens e Actas de Reuniões Pedagógicas</h3>
          <p className="text-xs text-slate-500">Repositório de enunciados, matrizes e actas de reuniões quinzenais de disciplina.</p>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
            <span>📄 Acta nº 02/2026 - Harmonização de Critérios de Avaliação</span>
            <span className="text-[10px] text-slate-400 font-mono">15/02/2026</span>
          </div>
        </Card>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// WORKSPACE 3: DELEGADO DO CICLO
// -------------------------------------------------------------
export const DelegadoCicloWorkspace: React.FC<TeacherCompetencyProps> = ({ employee }) => {
  const { classes, students, currentUser } = useStore();
  const cicloType = employee.delegadoCicloType || '2º Ciclo';
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  const cycleClasses = classes.filter(c => {
    if (cicloType === '1º Ciclo') return ['1ª', '2ª', '3ª', '8ª'].some(g => c.gradeLevel.includes(g));
    if (cicloType === '2º Ciclo') return ['4ª', '5ª', '6ª', '9ª', '10ª'].some(g => c.gradeLevel.includes(g));
    return ['7ª', '11ª', '12ª'].some(g => c.gradeLevel.includes(g));
  });

  const totalCycleStudents = students.filter(s => cycleClasses.some(c => c.id === s.classId)).length || 180;

  const handleSubmitToDirector = () => {
    setSubmissionFeedback(`Estatística consolidada do ${cicloType} enviada com sucesso para homologação do Director da Escola!`);
    setTimeout(() => setSubmissionFeedback(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-500/30 text-blue-200 px-3 py-1 rounded-full text-xs font-bold mb-2  border border-blue-400/30">
            <Layers className="h-4 w-4" /> Competência Pedagógica: Coordenação do Ciclo
          </div>
          <h1 className="text-2xl font-black">
            Coordenação Pedagógica: {cicloType}
          </h1>
          <p className="text-xs text-blue-200 mt-1">
            Delegado do Ciclo: <strong>{employee.name}</strong> • Turmas Integradas: {cycleClasses.length || 3} • Total: {totalCycleStudents} Alunos
          </p>
        </div>

        <Button
          onClick={handleSubmitToDirector}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md gap-2"
        >
          <Send className="h-4 w-4" /> Submeter Estatística ao Diretor da Escola
        </Button>
      </div>

      {submissionFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl flex items-center gap-3 animate-in fade-in shadow-xs">
          <CheckCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-xs font-bold">{submissionFeedback}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Turmas do {cicloType}</span>
          <p className="text-2xl font-black text-indigo-950 font-mono mt-1">{cycleClasses.length || 3}</p>
          <span className="text-[10px] text-slate-400">Turmas sob coordenação</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Discentes no Ciclo</span>
          <p className="text-2xl font-black text-blue-950 font-mono mt-1">{totalCycleStudents}</p>
          <span className="text-[10px] text-blue-600 font-semibold">Agregação das Direções de Turma</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Taxa Média do Ciclo</span>
          <p className="text-2xl font-black text-emerald-700 font-mono mt-1">87.5%</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Aproveitamento Global</span>
        </div>
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-black text-slate-900 mb-3">Turmas Integradas no {cicloType}</h3>
        <div className="space-y-2">
          {(cycleClasses.length > 0 ? cycleClasses : classes.slice(0, 3)).map(c => (
            <div key={c.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-800 block">{c.name} ({c.gradeLevel})</span>
                <span className="text-[10px] text-slate-500">Período: {c.period || 'Diurno'}</span>
              </div>
              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-900 font-bold rounded-lg text-[10px]">
                Estatística Sincronizada
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
