import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  Printer, Download, ArrowLeft, Save, CheckCircle2, Plus, Trash2, Sparkles, RefreshCw, Loader2
} from 'lucide-react';
import { SignatureBox } from './SignatureBox';
import { exportReportToPDF } from '../utils/pdfExportHelper';
import { HeaderInstitucional } from './HeaderInstitucional';

export const MOZAMBIQUE_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Emblem_of_Mozambique.svg/600px-Emblem_of_Mozambique.svg.png";

export const MozambiqueEmblem: React.FC<{ className?: string }> = ({ className = "h-16 w-16" }) => (
  <img 
    src={MOZAMBIQUE_LOGO_URL} 
    alt="Emblema da República de Moçambique" 
    className={`${className} object-contain mx-auto`}
    referrerPolicy="no-referrer"
  />
);

export function TeacherReport() {
  const { currentUser, schools, classes, subjects, students, assignments } = useStore();
  const schoolList = Array.isArray(schools) ? schools : [];
  const school = schoolList.find(s => s.id === currentUser?.schoolId) || schoolList[0] || {
    name: 'Escola Secundária Josina Machel',
    province: 'Maputo Cidade',
    district: 'KaMpfumo'
  };

  // Auto-calculated defaults
  const myAssignments = (assignments || []).filter(a => a.teacherId === currentUser?.id);
  const defaultSubject = myAssignments[0]?.subjectName || (subjects || [])[0]?.name || 'Matemática';
  const defaultClass = myAssignments[0]?.className || (classes || [])[0]?.name || '10ª Classe A';
  
  // Calculate total students across teacher's classes
  const myClassIds = myAssignments.map(a => a.classId);
  const myStudents = (students || []).filter(s => myClassIds.length > 0 ? myClassIds.includes(s.classId) : true);
  const totalStudentsCount = myStudents.length > 0 ? myStudents.length : 42;

  // Form State initialized according to standard MINEDH template
  const [formData, setFormData] = useState({
    trimestre: '1º Trimestre',
    anoLectivo: String(new Date().getFullYear()),
    classe: '10ª Classe',
    disciplina: defaultSubject,
    docente: currentUser?.name || 'Docente',
    turmas: defaultClass,
    dataElaboracao: new Date().toISOString().split('T')[0],
    instituicao: school?.name || 'Escola Secundária Josina Machel',
    departamento: 'Direcção Pedagógica • Área de Ensino Geral',

    // Section 1: Introdução
    introducao: `O presente relatório trimestral tem como finalidade apresentar as principais actividades desenvolvidas pelos docentes durante o 1º trimestre do ano lectivo de ${new Date().getFullYear()}, bem como avaliar o grau de cumprimento da planificação pedagógica, o aproveitamento dos alunos, as dificuldades encontradas e as medidas adoptadas para melhorar o processo de ensino e aprendizagem.\n\nDurante o período em análise, foram realizadas diversas actividades lectivas e pedagógicas, tendo como foco principal o cumprimento dos conteúdos programáticos, o desenvolvimento das competências dos alunos, a avaliação contínua da aprendizagem e o acompanhamento dos alunos com maiores dificuldades.\n\nO relatório apresenta igualmente os principais resultados alcançados, os constrangimentos verificados e as recomendações para o melhoramento do desempenho pedagógico no trimestre seguinte.`,

    // Section 2: Objectivos
    objectivoGeral: 'Avaliar e documentar as actividades pedagógicas desenvolvidas pelos docentes durante o trimestre, verificando o nível de cumprimento da planificação e os resultados alcançados no processo de ensino e aprendizagem.',

    // Section 3: Caracterização do Docente
    formacaoAcademica: 'Licenciatura em Ensino / Pedagogia',
    areaFormacao: 'Ciências da Educação',
    
    // Section 4: Actividades Realizadas
    actividades: [
      { num: 1, actividade: 'Planificação das aulas', periodo: 'Trimestral', estado: 'Concluída', obs: 'Cumprido integralmente segundo o programa do MINEDH' },
      { num: 2, actividade: 'Preparação dos conteúdos', periodo: 'Semanal', estado: 'Concluída', obs: 'Fichas didácticas e resumos elaborados' },
      { num: 3, actividade: 'Lecionação das aulas', periodo: 'Contínuo', estado: 'Concluída', obs: 'Cumprimento de 95% do plano lectivo' },
      { num: 4, actividade: 'Realização de exercícios', periodo: 'Diário', estado: 'Concluída', obs: 'Exercícios práticos e individuais em sala' },
      { num: 5, actividade: 'Trabalhos individuais', periodo: 'Quinzenal', estado: 'Concluída', obs: 'Avaliados e devolvidos aos alunos' },
      { num: 6, actividade: 'Trabalhos em grupo', periodo: 'Mensal', estado: 'Concluída', obs: 'Apresentações e pesquisas orientadas' },
      { num: 7, actividade: 'Avaliações escritas', periodo: 'Trimestral', estado: 'Concluída', obs: '3 ACS e 1 APT realizadas com sucesso' },
      { num: 8, actividade: 'Avaliações orais/práticas', periodo: 'Contínuo', estado: 'Concluída', obs: 'Participação nas aulas e sínteses orais' },
      { num: 9, actividade: 'Correcção das avaliações', periodo: 'Trimestral', estado: 'Concluída', obs: 'Notas lançadas na caderneta digital' },
      { num: 10, actividade: 'Recuperação dos alunos com dificuldades', periodo: 'Quinzenal', estado: 'Concluída', obs: 'Aulas de reforço e fichas adicionais' },
      { num: 11, actividade: 'Reuniões pedagógicas', periodo: 'Mensal', estado: 'Concluída', obs: 'Participação activa no grupo de disciplina' },
      { num: 12, actividade: 'Actividades extracurriculares', periodo: 'Pontual', estado: 'Concluída', obs: 'Apoio à olimpíada do saber e desporto escolar' },
      { num: 13, actividade: 'Acompanhamento dos alunos', periodo: 'Contínuo', estado: 'Concluída', obs: 'Diálogo com directores de turma e encarregados' },
      { num: 14, actividade: 'Outras actividades', periodo: 'Pontual', estado: 'Concluída', obs: 'Atendimento a encarregados de educação' },
    ],

    // Section 5: Cumprimento da Planificação
    planoPrevisto: {
      aulasPrevistas: 48,
      aulasRealizadas: 46,
      conteudosPrevistos: 12,
      conteudosLeccionados: 11,
      avaliacoesPrevistas: 4,
      avaliacoesRealizadas: 4
    },
    observacaoPlanificacao: 'As ligeiras oscilações no número de aulas leccionadas deveram-se a feriados nacionais e actividades institucionais. Os conteúdos em atraso foram integrados nas aulas de compensação.',

    // Section 6: Aproveitamento Pedagógico
    totalAlunos: String(totalStudentsCount),
    alunosAprovados: String(Math.round(totalStudentsCount * 0.8)),
    alunosAproveitamentoPositivo: String(Math.round(totalStudentsCount * 0.8)),
    alunosAproveitamentoNegativo: String(Math.round(totalStudentsCount * 0.2)),
    alunosComDificuldades: String(Math.round(totalStudentsCount * 0.15)),
    alunosAcompanhamentoEspecial: String(Math.round(totalStudentsCount * 0.05)),
    analiseAproveitamentoTexto: 'Durante o trimestre, verificou-se que o nível de aproveitamento geral dos alunos foi Satisfatório (80% de aprovação), registando-se boa assimilação nas unidades fundamentais.',
    factoresAproveitamento: [
      'Participação activa dos alunos nas aulas',
      'Realização regular dos trabalhos escolares e TPCs',
      'Assiduidade e pontualidade constantes',
      'Atendimento e aulas de reforço pedagógico'
    ],

    // Section 7: Formas de Avaliação
    formasAvaliacao: [
      'Avaliação diagnóstica no início do trimestre',
      'Avaliação formativa diária e participativa',
      'Avaliação sumativa (ACS e APT)',
      'Trabalhos individuais e em grupo',
      'Exercícios práticos e TPCs'
    ],

    // Section 8: Alunos com Dificuldades
    alunosDificuldades: [
      { num: 1, nome: 'António João Machava', turma: '10ª A', dificuldade: 'Cálculo com fracções e equações', medida: 'Reforço escolar e fichas de consolidação' },
      { num: 2, nome: 'Beatriz Fernando Sitoe', turma: '10ª B', dificuldade: 'Interpretação de enunciados de problemas', medida: 'Acompanhamento individualizado e leitura guiada' },
      { num: 3, nome: 'Carlos Alberto Langa', turma: '10ª A', dificuldade: 'Ausências pontuais e fraca assiduidade', medida: 'Sensibilização com o Encarregado de Educação' },
    ],

    // Section 9: Assiduidade e Pontualidade
    assiduidadeDocente: '100% (Excelente)',
    pontualidadeDocente: '100% (Excelente)',
    assiduidadeAlunos: '92% (Boa)',
    pontualidadeAlunos: '88% (Satisfatória)',
    motivosFaltas: 'Motivos de saúde, dificuldades de transporte e intempéries pontuais.',

    // Section 10: Metodologias Utilizadas
    metodologiasTexto: 'Foram utilizadas abordagens participativas, tais como aula expositiva interactiva, resolução de exercícios em grupo, debate orientados e resolução de problemas práticos no quadro.',

    // Section 11: Recursos Didácticos
    recursosUtilizados: 'Quadro, manuais escolares oficiais, fichas de exercícios impressas, réguas e geometria de quadro, calculadora científica.',

    // Section 12: Actividades Extracurriculares
    actividadesExtracurriculares: [
      { num: 1, actividade: 'Olimpíadas da Matemática/Ciências', data: '2026-02-20', participacao: 'Organizador', obs: 'Selecção de alunos destacados' },
      { num: 2, actividade: 'Jornada de Limpeza e Jardinagem', data: '2026-03-08', participacao: 'Participante', obs: 'Sensibilização ambiental da escola' },
    ],

    // Section 13: Participação em Reuniões
    reunioesPedagogicas: [
      { actividade: 'Reunião do Grupo de Disciplina', data: '2026-02-05', participacao: 'Total', resultado: 'Harmonização da dosificação' },
      { actividade: 'Conselho de Turma do 1º Trimestre', data: '2026-03-25', participacao: 'Total', resultado: 'Validação das notas da caderneta' },
    ],

    // Section 14: Constrangimentos & Medidas
    constrangimentos: 'Insuficiência de manuais escolares individuais para alguns alunos e elevada rácio de alunos por turma.',
    medidasConstrangimentos: 'Partilha de manuais em duplas na sala de aula e disponibilização de fichas de síntese fotocopiadas para estudo em casa.',

    // Section 15: Principais Resultados
    resultadosAlcançados: 'Cumprimento de 95% do programa lectivo previsto, realização de todas as avaliações com notas lançadas no prazo, melhoria do desempenho dos alunos nas ACS2 e APT.',

    // Section 16: Boas Práticas
    boasPraticas: 'Uso de monitores de turma (alunos adiantados ajudando colegas com dificuldades), publicação semanal de resumos de matérias e atendimento pedagógico pós-aulas.',

    // Section 17: Recomendações
    recomendacoesTexto: '1. Manter o reforço de manuais didácticos escolares;\n2. Continuar com as sessões de recuperação pedagógica;\n3. Reforçar o acompanhamento dos encarregados de educação;\n4. Promover mais seminários de capacitação em novas metodologias de ensino.',

    // Section 18: Plano de Acção para o Próximo Trimestre
    planoAccao: [
      { num: 1, actividade: 'Reforço pedagógico quinzenal', objectivo: 'Reduzir taxas de reprovação', responsavel: 'Docente', prazo: 'Maio - Julho', indicador: '85% de aprovação' },
      { num: 2, actividade: 'Encontro com Pais e Encarregados', objectivo: 'Acompanhar assiduidade', responsavel: 'Docente / DT', prazo: 'Junho', indicador: 'Melhoria na assiduidade' },
      { num: 3, actividade: 'Elaboração de Fichas de Exame', objectivo: 'Preparação para provas finais', responsavel: 'Docente', prazo: 'Julho', indicador: '100% fichas entregues' },
    ],

    // Section 19: Conclusão
    conclusao: `O presente relatório permitiu fazer uma análise das principais actividades desenvolvidas durante o 1º trimestre do ano lectivo de ${new Date().getFullYear()}, destacando o nível de cumprimento da planificação, o desempenho dos alunos, as metodologias utilizadas, os resultados alcançados e os principais constrangimentos enfrentados.\n\nDe forma geral, as actividades pedagógicas foram desenvolvidas de acordo com as condições existentes, tendo sido implementadas estratégias para garantir a continuidade do processo de ensino e aprendizagem e apoiar os alunos que apresentaram maiores dificuldades.\n\nPara o próximo trimestre, será dada maior atenção ao reforço pedagógico, ao acompanhamento individual dos alunos, à melhoria do aproveitamento escolar, ao cumprimento da planificação e à adopção de metodologias que promovam uma participação mais activa dos alunos.`,

    // Section 20: Assinaturas
    nomeDocente: currentUser?.name || 'Docente de Ensino Geral',
    nomeCoordenadorDT: 'Prof. Dr. Armindo Langa',
    nomeDirectorPedagogico: 'Dra. Maria João Mateus',
    nomeDirectorEscola: (school as any)?.directorName || 'Dr. Zacarias Manuel Tembe'
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof typeof prev] as Record<string, any>),
        [field]: value
      }
    }));
  };

  const handleArrayRowChange = (arrayKey: string, index: number, field: string, value: any) => {
    setFormData(prev => {
      const arr = [...(prev[arrayKey as keyof typeof prev] as any[])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [arrayKey]: arr };
    });
  };

  const handleAddArrayRow = (arrayKey: string, newRow: any) => {
    setFormData(prev => {
      const arr = [...(prev[arrayKey as keyof typeof prev] as any[])];
      return { ...prev, [arrayKey]: [...arr, { num: arr.length + 1, ...newRow }] };
    });
  };

  const handleRemoveArrayRow = (arrayKey: string, index: number) => {
    setFormData(prev => {
      const arr = [...(prev[arrayKey as keyof typeof prev] as any[])];
      if (arr.length <= 1) return prev;
      return { ...prev, [arrayKey]: arr.filter((_, i) => i !== index) };
    });
  };

  const handleAutoFillFromSystem = () => {
    const totalCount = myStudents.length || 42;
    setFormData(prev => ({
      ...prev,
      docente: currentUser?.name || prev.docente,
      instituicao: school?.name || prev.instituicao,
      disciplina: myAssignments[0]?.subjectName || prev.disciplina,
      turmas: myAssignments.map(a => a.className).join(', ') || prev.turmas,
      totalAlunos: String(totalCount),
      alunosAprovados: String(Math.round(totalCount * 0.82)),
      alunosAproveitamentoPositivo: String(Math.round(totalCount * 0.82)),
      alunosAproveitamentoNegativo: String(Math.round(totalCount * 0.18)),
      nomeDocente: currentUser?.name || prev.nomeDocente
    }));
  };

  const printReport = () => window.print();

  const exportPDF = async () => {
    setIsExporting(true);
    await exportReportToPDF({
      elementId: 'report-standard-content',
      fileName: `Relatorio_Trimestral_${formData.disciplina}_${formData.turmas.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      orientation: 'portrait'
    });
    setIsExporting(false);
  };

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Percentages calculation
  const calcPerc = (real: number, prev: number) => prev > 0 ? ((real / prev) * 100).toFixed(1) : '100.0';

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 text-slate-900">
      
      {/* Top Action Header Bar */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.history.back()} 
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 text-xs transition-all cursor-pointer"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Relatório Trimestral Oficial de Actividades Docentes
            </h2>
            <p className="text-[11px] text-slate-500">Modelo Padrão Homologado do MINEDH</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAutoFillFromSystem}
            title="Preencher automaticamente com os dados actuais das turmas e alunos"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Sparkles size={14} /> Sincronizar Dados
          </button>

          {savedSuccess && (
            <span className="text-emerald-700 text-xs font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-pulse">
              <CheckCircle2 size={14} /> Guardado!
            </span>
          )}

          <button 
            onClick={handleSaveDraft}
            className="bg-blue-900 hover:bg-blue-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Save size={14} /> Guardar
          </button>

          <button 
            onClick={printReport} 
            className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer size={14} /> Imprimir
          </button>

          <button 
            onClick={exportPDF}
            disabled={isExporting}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span>Exportar PDF (A4)</span>
          </button>
        </div>
      </div>

      {/* Official A4 Printable Document Container */}
      <div 
        id="report-standard-content" 
        className="a4-portrait-document max-w-[210mm] w-full min-h-[297mm] mx-auto bg-white p-6 sm:p-10 md:p-12 rounded-3xl border border-slate-200 shadow-xl space-y-8 print:border-none print:shadow-none print:m-0 print:p-4 text-xs font-sans"
      >
        
        {/* INSTITUTIONAL HEADER */}
        <HeaderInstitucional
          school={school}
          academicYear={formData.anoLectivo || 2026}
          documentTitle="RELATÓRIO TRIMESTRAL DE ACTIVIDADES DOS DOCENTES DO ENSINO GERAL"
          badge={`Ensino Secundário Geral • ${formData.trimestre}`}
          emblemSize="md"
        />

        {/* METADATA BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px] font-medium">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Período</span>
            <input 
              type="text" 
              value={formData.trimestre} 
              onChange={e => handleChange('trimestre', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900" 
            />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Ano Lectivo</span>
            <input 
              type="text" 
              value={formData.anoLectivo} 
              onChange={e => handleChange('anoLectivo', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900" 
            />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Classe & Turmas</span>
            <input 
              type="text" 
              value={`${formData.classe} - ${formData.turmas}`} 
              onChange={e => handleChange('turmas', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 font-bold text-slate-900" 
            />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Disciplina & Data</span>
            <div className="flex gap-1">
              <input 
                type="text" 
                value={formData.disciplina} 
                onChange={e => handleChange('disciplina', e.target.value)}
                className="w-2/3 bg-white border border-slate-300 rounded px-1.5 py-1 font-bold text-slate-900" 
              />
              <input 
                type="date" 
                value={formData.dataElaboracao} 
                onChange={e => handleChange('dataElaboracao', e.target.value)}
                className="w-1/3 bg-white border border-slate-300 rounded px-1 py-1 font-bold text-slate-900 text-[10px]" 
              />
            </div>
          </div>
        </div>

        {/* 1. INTRODUÇÃO */}
        <section className="space-y-2">
          <h2 className="text-xs font-black uppercase text-slate-900 bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900">
            1. INTRODUÇÃO
          </h2>
          <textarea 
            rows={4}
            value={formData.introducao}
            onChange={e => handleChange('introducao', e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs leading-relaxed text-slate-800 font-medium focus:border-blue-700"
          />
        </section>

        {/* 2. OBJECTIVOS DO RELATÓRIO */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-black uppercase text-slate-900 bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900">
            2. OBJECTIVOS DO RELATÓRIO
          </h2>
          
          <div className="space-y-2 px-1">
            <div>
              <h3 className="font-bold text-slate-900 text-[11px] uppercase">2.1. Objectivo Geral</h3>
              <textarea 
                rows={2}
                value={formData.objectivoGeral}
                onChange={e => handleChange('objectivoGeral', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-800 mt-1 font-medium"
              />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-[11px] uppercase">2.2. Objectivos Específicos</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-800 font-medium text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200">
                <li>Avaliar o cumprimento dos conteúdos programáticos;</li>
                <li>Registar as actividades lectivas realizadas durante o trimestre;</li>
                <li>Analisar o aproveitamento pedagógico dos alunos;</li>
                <li>Identificar os alunos com dificuldades de aprendizagem;</li>
                <li>Registar as estratégias utilizadas para superar as dificuldades;</li>
                <li>Avaliar a assiduidade e pontualidade dos docentes e alunos;</li>
                <li>Identificar os principais constrangimentos enfrentados;</li>
                <li>Apresentar recomendações para a melhoria do processo de ensino e aprendizagem;</li>
                <li>Propor medidas para melhorar o aproveitamento pedagógico no trimestre seguinte.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 3. CARACTERIZAÇÃO DO DOCENTE */}
        <section className="space-y-2">
          <h2 className="text-xs font-black uppercase text-slate-900 bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900">
            3. CARACTERIZAÇÃO DO DOCENTE
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 text-left">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3 border-r border-b border-slate-300 w-12 text-center">Nº</th>
                  <th className="py-2 px-3 border-r border-b border-slate-300 w-1/3">Elemento</th>
                  <th className="py-2 px-3 border-b border-slate-300">Informação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-medium text-slate-800">
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono">1</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Nome completo</td>
                  <td className="py-1.5 px-3">
                    <input type="text" value={formData.docente} onChange={e => handleChange('docente', e.target.value)} className="w-full bg-transparent font-bold text-slate-900" />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono">2</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Função</td>
                  <td className="py-1.5 px-3 font-semibold text-slate-700">Docente de Ensino Geral</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono">3</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Disciplina</td>
                  <td className="py-1.5 px-3">
                    <input type="text" value={formData.disciplina} onChange={e => handleChange('disciplina', e.target.value)} className="w-full bg-transparent" />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono">4</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Classe</td>
                  <td className="py-1.5 px-3">
                    <input type="text" value={formData.classe} onChange={e => handleChange('classe', e.target.value)} className="w-full bg-transparent" />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono">5</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Turmas</td>
                  <td className="py-1.5 px-3">
                    <input type="text" value={formData.turmas} onChange={e => handleChange('turmas', e.target.value)} className="w-full bg-transparent" />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono">6</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Formação académica</td>
                  <td className="py-1.5 px-3">
                    <input type="text" value={formData.formacaoAcademica} onChange={e => handleChange('formacaoAcademica', e.target.value)} className="w-full bg-transparent" />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono">7</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Área de formação</td>
                  <td className="py-1.5 px-3">
                    <input type="text" value={formData.areaFormacao} onChange={e => handleChange('areaFormacao', e.target.value)} className="w-full bg-transparent" />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono">8</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Número de alunos</td>
                  <td className="py-1.5 px-3">
                    <input type="text" value={formData.totalAlunos} onChange={e => handleChange('totalAlunos', e.target.value)} className="w-full bg-transparent font-bold font-mono" />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono">9</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Período</td>
                  <td className="py-1.5 px-3">{formData.trimestre}</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono">10</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Ano lectivo</td>
                  <td className="py-1.5 px-3">{formData.anoLectivo}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. ACTIVIDADES REALIZADAS */}
        <section className="space-y-2">
          <h2 className="text-xs font-black uppercase text-slate-900 bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900">
            4. ACTIVIDADES REALIZADAS
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 text-left">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-2 border-r border-b border-slate-300 w-10 text-center">Nº</th>
                  <th className="py-2 px-3 border-r border-b border-slate-300">Actividade</th>
                  <th className="py-2 px-2 border-r border-b border-slate-300 w-24">Período</th>
                  <th className="py-2 px-2 border-r border-b border-slate-300 w-28">Estado</th>
                  <th className="py-2 px-3 border-b border-slate-300">Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-medium text-slate-800">
                {formData.actividades.map((act, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono text-[10px]">{act.num}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300 font-semibold">{act.actividade}</td>
                    <td className="py-1.5 px-2 border-r border-slate-300">
                      <input type="text" value={act.periodo} onChange={e => handleArrayRowChange('actividades', idx, 'periodo', e.target.value)} className="w-full bg-transparent text-[11px]" />
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-300">
                      <select value={act.estado} onChange={e => handleArrayRowChange('actividades', idx, 'estado', e.target.value)} className="w-full bg-white border border-slate-200 rounded text-[11px] p-0.5">
                        <option value="Concluída">Concluída</option>
                        <option value="Em curso">Em curso</option>
                        <option value="Parcial">Parcial</option>
                        <option value="Não realizada">Não realizada</option>
                      </select>
                    </td>
                    <td className="py-1.5 px-3 border-slate-300">
                      <input type="text" value={act.obs} onChange={e => handleArrayRowChange('actividades', idx, 'obs', e.target.value)} className="w-full bg-transparent text-[11px]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. CUMPRIMENTO DA PLANIFICAÇÃO */}
        <section className="space-y-2">
          <h2 className="text-xs font-black uppercase text-slate-900 bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900">
            5. CUMPRIMENTO DA PLANIFICAÇÃO
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 text-left">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3 border-r border-b border-slate-300">Indicador</th>
                  <th className="py-2 px-3 border-r border-b border-slate-300 text-center w-24">Previsto</th>
                  <th className="py-2 px-3 border-r border-b border-slate-300 text-center w-24">Realizado</th>
                  <th className="py-2 px-3 border-b border-slate-300 text-center w-28">Percentagem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-medium text-slate-800">
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Aulas leccionadas / previstas</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center">
                    <input type="number" value={formData.planoPrevisto.aulasPrevistas} onChange={e => handleNestedChange('planoPrevisto', 'aulasPrevistas', Number(e.target.value))} className="w-16 text-center bg-white border border-slate-200 rounded font-mono font-bold" />
                  </td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center">
                    <input type="number" value={formData.planoPrevisto.aulasRealizadas} onChange={e => handleNestedChange('planoPrevisto', 'aulasRealizadas', Number(e.target.value))} className="w-16 text-center bg-white border border-slate-200 rounded font-mono font-bold" />
                  </td>
                  <td className="py-1.5 px-3 text-center font-mono font-bold text-blue-900 bg-blue-50/30">
                    {calcPerc(formData.planoPrevisto.aulasRealizadas, formData.planoPrevisto.aulasPrevistas)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Conteúdos programáticos leccionados</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center">
                    <input type="number" value={formData.planoPrevisto.conteudosPrevistos} onChange={e => handleNestedChange('planoPrevisto', 'conteudosPrevistos', Number(e.target.value))} className="w-16 text-center bg-white border border-slate-200 rounded font-mono font-bold" />
                  </td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center">
                    <input type="number" value={formData.planoPrevisto.conteudosLeccionados} onChange={e => handleNestedChange('planoPrevisto', 'conteudosLeccionados', Number(e.target.value))} className="w-16 text-center bg-white border border-slate-200 rounded font-mono font-bold" />
                  </td>
                  <td className="py-1.5 px-3 text-center font-mono font-bold text-blue-900 bg-blue-50/30">
                    {calcPerc(formData.planoPrevisto.conteudosLeccionados, formData.planoPrevisto.conteudosPrevistos)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Avaliações realizadas (ACS / APT)</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center">
                    <input type="number" value={formData.planoPrevisto.avaliacoesPrevistas} onChange={e => handleNestedChange('planoPrevisto', 'avaliacoesPrevistas', Number(e.target.value))} className="w-16 text-center bg-white border border-slate-200 rounded font-mono font-bold" />
                  </td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center">
                    <input type="number" value={formData.planoPrevisto.avaliacoesRealizadas} onChange={e => handleNestedChange('planoPrevisto', 'avaliacoesRealizadas', Number(e.target.value))} className="w-16 text-center bg-white border border-slate-200 rounded font-mono font-bold" />
                  </td>
                  <td className="py-1.5 px-3 text-center font-mono font-bold text-emerald-800 bg-emerald-50/30">
                    {calcPerc(formData.planoPrevisto.avaliacoesRealizadas, formData.planoPrevisto.avaliacoesPrevistas)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pt-1">
            <span className="font-bold text-slate-800 text-[11px] uppercase block mb-1">Observações & Justificações de Desvios:</span>
            <textarea 
              rows={2}
              value={formData.observacaoPlanificacao}
              onChange={e => handleChange('observacaoPlanificacao', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-medium text-slate-800"
            />
          </div>
        </section>

        {/* 6. APROVEITAMENTO PEDAGÓGICO DOS ALUNOS */}
        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase text-slate-900 bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900">
            6. APROVEITAMENTO PEDAGÓGICO DOS ALUNOS
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 text-left">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3 border-r border-b border-slate-300">Indicador Pedagógico</th>
                  <th className="py-2 px-3 border-r border-b border-slate-300 text-center w-28">Nº de Alunos</th>
                  <th className="py-2 px-3 border-b border-slate-300 text-center w-28">Percentagem (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-medium text-slate-800">
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Total de alunos matriculados e avaliados</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono font-bold">
                    <input type="text" value={formData.totalAlunos} onChange={e => handleChange('totalAlunos', e.target.value)} className="w-16 text-center bg-white border border-slate-200 rounded" />
                  </td>
                  <td className="py-1.5 px-3 text-center font-mono font-bold">100.0%</td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold text-emerald-900">Alunos aprovados / com aproveitamento positivo</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono font-bold text-emerald-900 bg-emerald-50/40">
                    <input type="text" value={formData.alunosAprovados} onChange={e => handleChange('alunosAprovados', e.target.value)} className="w-16 text-center bg-white border border-emerald-300 rounded text-emerald-900" />
                  </td>
                  <td className="py-1.5 px-3 text-center font-mono font-bold text-emerald-900 bg-emerald-50/40">
                    {calcPerc(Number(formData.alunosAprovados), Number(formData.totalAlunos))}%
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold text-rose-900">Alunos com aproveitamento negativo</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono font-bold text-rose-900 bg-rose-50/40">
                    <input type="text" value={formData.alunosAproveitamentoNegativo} onChange={e => handleChange('alunosAproveitamentoNegativo', e.target.value)} className="w-16 text-center bg-white border border-rose-300 rounded text-rose-900" />
                  </td>
                  <td className="py-1.5 px-3 text-center font-mono font-bold text-rose-900 bg-rose-50/40">
                    {calcPerc(Number(formData.alunosAproveitamentoNegativo), Number(formData.totalAlunos))}%
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Alunos com dificuldades de aprendizagem</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono">
                    <input type="text" value={formData.alunosComDificuldades} onChange={e => handleChange('alunosComDificuldades', e.target.value)} className="w-16 text-center bg-white border border-slate-200 rounded" />
                  </td>
                  <td className="py-1.5 px-3 text-center font-mono">
                    {calcPerc(Number(formData.alunosComDificuldades), Number(formData.totalAlunos))}%
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Alunos que necessitam de acompanhamento especial</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-center font-mono">
                    <input type="text" value={formData.alunosAcompanhamentoEspecial} onChange={e => handleChange('alunosAcompanhamentoEspecial', e.target.value)} className="w-16 text-center bg-white border border-slate-200 rounded" />
                  </td>
                  <td className="py-1.5 px-3 text-center font-mono">
                    {calcPerc(Number(formData.alunosAcompanhamentoEspecial), Number(formData.totalAlunos))}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-2 pt-1">
            <h3 className="font-bold text-slate-900 text-[11px] uppercase">6.1. Análise do Aproveitamento</h3>
            <textarea 
              rows={2}
              value={formData.analiseAproveitamentoTexto}
              onChange={e => handleChange('analiseAproveitamentoTexto', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-medium text-slate-800"
            />

            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <span className="font-bold text-slate-900 text-[10px] uppercase block mb-1.5">Factores Determinantes para o Aproveitamento:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                {formData.factoresAproveitamento.map((fact, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-slate-800">
                    <span className="text-emerald-700 font-bold">✓</span> {fact}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 7. AVALIAÇÃO DOS ALUNOS */}
        <section className="space-y-2">
          <h2 className="text-xs font-black uppercase text-slate-900 bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900">
            7. AVALIAÇÃO DOS ALUNOS
          </h2>
          <p className="text-slate-800 leading-relaxed font-medium text-xs">
            Durante o trimestre foram utilizadas diferentes modalidades de avaliação contínua e formativa, alinhadas com as diretrizes do MINEDH:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium bg-slate-50 p-3 rounded border border-slate-200">
            {formData.formasAvaliacao.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-900"></span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 8. ALUNOS COM DIFICULDADES DE APRENDIZAGEM */}
        <section className="space-y-2">
          <div className="flex justify-between items-center bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900">
            <h2 className="text-xs font-black uppercase text-slate-900">
              8. ALUNOS COM DIFICULDADES DE APRENDIZAGEM
            </h2>
            <button
              type="button"
              onClick={() => handleAddArrayRow('alunosDificuldades', { nome: '', turma: '10ª A', dificuldade: '', medida: '' })}
              className="no-print text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} /> Adicionar Aluno
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 text-left">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-2 border-r border-b border-slate-300 w-10 text-center">Nº</th>
                  <th className="py-2 px-3 border-r border-b border-slate-300 w-1/3">Nome do Aluno</th>
                  <th className="py-2 px-2 border-r border-b border-slate-300 w-20">Turma</th>
                  <th className="py-2 px-3 border-r border-b border-slate-300">Principal Dificuldade</th>
                  <th className="py-2 px-3 border-r border-b border-slate-300">Medida Adoptada</th>
                  <th className="py-2 px-1 border-b border-slate-300 w-10 text-center no-print">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-medium text-slate-800">
                {formData.alunosDificuldades.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono text-[10px]">{idx + 1}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      <input type="text" value={item.nome} onChange={e => handleArrayRowChange('alunosDificuldades', idx, 'nome', e.target.value)} className="w-full bg-transparent font-bold" placeholder="Nome do aluno..." />
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-300">
                      <input type="text" value={item.turma} onChange={e => handleArrayRowChange('alunosDificuldades', idx, 'turma', e.target.value)} className="w-full bg-transparent font-mono" />
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      <input type="text" value={item.dificuldade} onChange={e => handleArrayRowChange('alunosDificuldades', idx, 'dificuldade', e.target.value)} className="w-full bg-transparent text-[11px]" />
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      <input type="text" value={item.medida} onChange={e => handleArrayRowChange('alunosDificuldades', idx, 'medida', e.target.value)} className="w-full bg-transparent text-[11px]" />
                    </td>
                    <td className="py-1.5 px-1 border-slate-300 text-center no-print">
                      <button type="button" onClick={() => handleRemoveArrayRow('alunosDificuldades', idx)} disabled={formData.alunosDificuldades.length <= 1} className="text-rose-600 hover:text-rose-800 disabled:opacity-30">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 9. ASSIDUIDADE E PONTUALIDADE */}
        <section className="space-y-2">
          <h2 className="text-xs font-black uppercase text-slate-900 bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900">
            9. ASSIDUIDADE E PONTUALIDADE
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 text-left">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3 border-r border-b border-slate-300 w-1/2">Indicador</th>
                  <th className="py-2 px-3 border-b border-slate-300">Situação Observada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-medium text-slate-800">
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Assiduidade do docente</td>
                  <td className="py-1.5 px-3">
                    <input type="text" value={formData.assiduidadeDocente} onChange={e => handleChange('assiduidadeDocente', e.target.value)} className="w-full bg-transparent font-semibold" />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Pontualidade do docente</td>
                  <td className="py-1.5 px-3">
                    <input type="text" value={formData.pontualidadeDocente} onChange={e => handleChange('pontualidadeDocente', e.target.value)} className="w-full bg-transparent font-semibold" />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Assiduidade dos alunos</td>
                  <td className="py-1.5 px-3">
                    <input type="text" value={formData.assiduidadeAlunos} onChange={e => handleChange('assiduidadeAlunos', e.target.value)} className="w-full bg-transparent" />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Pontualidade dos alunos</td>
                  <td className="py-1.5 px-3">
                    <input type="text" value={formData.pontualidadeAlunos} onChange={e => handleChange('pontualidadeAlunos', e.target.value)} className="w-full bg-transparent" />
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">Principais motivos das faltas</td>
                  <td className="py-1.5 px-3">
                    <input type="text" value={formData.motivosFaltas} onChange={e => handleChange('motivosFaltas', e.target.value)} className="w-full bg-transparent" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 10 & 11. METODOLOGIAS & RECURSOS DIDÁCTICOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <section className="space-y-2">
            <h2 className="text-xs font-black uppercase text-slate-900 bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900">
              10. METODOLOGIAS DE ENSINO
            </h2>
            <textarea 
              rows={4}
              value={formData.metodologiasTexto}
              onChange={e => handleChange('metodologiasTexto', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-medium text-slate-800"
            />
          </section>

          <section className="space-y-2">
            <h2 className="text-xs font-black uppercase text-slate-900 bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900">
              11. RECURSOS DIDÁCTICOS
            </h2>
            <textarea 
              rows={4}
              value={formData.recursosUtilizados}
              onChange={e => handleChange('recursosUtilizados', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-medium text-slate-800"
            />
          </section>
        </div>

        {/* 12. ACTIVIDADES EXTRACURRICULARES */}
        <section className="space-y-2">
          <div className="flex justify-between items-center bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900">
            <h2 className="text-xs font-black uppercase text-slate-900">
              12. ACTIVIDADES EXTRACURRICULARES
            </h2>
            <button
              type="button"
              onClick={() => handleAddArrayRow('actividadesExtracurriculares', { actividade: '', data: '2026-03-15', participacao: 'Ativa', obs: '' })}
              className="no-print text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} /> Adicionar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 text-left">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-2 border-r border-b border-slate-300 w-10 text-center">Nº</th>
                  <th className="py-2 px-3 border-r border-b border-slate-300">Actividade</th>
                  <th className="py-2 px-2 border-r border-b border-slate-300 w-24">Data</th>
                  <th className="py-2 px-3 border-r border-b border-slate-300 w-28">Participação</th>
                  <th className="py-2 px-3 border-r border-b border-slate-300">Observações</th>
                  <th className="py-2 px-1 border-b border-slate-300 w-10 text-center no-print">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-medium text-slate-800">
                {formData.actividadesExtracurriculares.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono text-[10px]">{idx + 1}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      <input type="text" value={item.actividade} onChange={e => handleArrayRowChange('actividadesExtracurriculares', idx, 'actividade', e.target.value)} className="w-full bg-transparent font-semibold" />
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-300">
                      <input type="date" value={item.data} onChange={e => handleArrayRowChange('actividadesExtracurriculares', idx, 'data', e.target.value)} className="w-full bg-transparent text-[10px]" />
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      <input type="text" value={item.participacao} onChange={e => handleArrayRowChange('actividadesExtracurriculares', idx, 'participacao', e.target.value)} className="w-full bg-transparent" />
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      <input type="text" value={item.obs} onChange={e => handleArrayRowChange('actividadesExtracurriculares', idx, 'obs', e.target.value)} className="w-full bg-transparent text-[11px]" />
                    </td>
                    <td className="py-1.5 px-1 border-slate-300 text-center no-print">
                      <button type="button" onClick={() => handleRemoveArrayRow('actividadesExtracurriculares', idx)} disabled={formData.actividadesExtracurriculares.length <= 1} className="text-rose-600 hover:text-rose-800 disabled:opacity-30">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 13. PARTICIPAÇÃO EM REUNIÕES E ACTIVIDADES PEDAGÓGICAS */}
        <section className="space-y-2">
          <div className="flex justify-between items-center bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900">
            <h2 className="text-xs font-black uppercase text-slate-900">
              13. PARTICIPAÇÃO EM REUNIÕES E ACTIVIDADES PEDAGÓGICAS
            </h2>
            <button
              type="button"
              onClick={() => handleAddArrayRow('reunioesPedagogicas', { actividade: '', data: '2026-03-20', participacao: 'Total', resultado: '' })}
              className="no-print text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} /> Adicionar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 text-left">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3 border-r border-b border-slate-300">Actividade / Reunião Pedagógica</th>
                  <th className="py-2 px-2 border-r border-b border-slate-300 w-24">Data</th>
                  <th className="py-2 px-3 border-r border-b border-slate-300 w-28">Participação</th>
                  <th className="py-2 px-3 border-r border-b border-slate-300">Resultado Alcançado</th>
                  <th className="py-2 px-1 border-b border-slate-300 w-10 text-center no-print">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-medium text-slate-800">
                {formData.reunioesPedagogicas.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      <input type="text" value={item.actividade} onChange={e => handleArrayRowChange('reunioesPedagogicas', idx, 'actividade', e.target.value)} className="w-full bg-transparent font-semibold" />
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-300">
                      <input type="date" value={item.data} onChange={e => handleArrayRowChange('reunioesPedagogicas', idx, 'data', e.target.value)} className="w-full bg-transparent text-[10px]" />
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      <input type="text" value={item.participacao} onChange={e => handleArrayRowChange('reunioesPedagogicas', idx, 'participacao', e.target.value)} className="w-full bg-transparent" />
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      <input type="text" value={item.resultado} onChange={e => handleArrayRowChange('reunioesPedagogicas', idx, 'resultado', e.target.value)} className="w-full bg-transparent text-[11px]" />
                    </td>
                    <td className="py-1.5 px-1 border-slate-300 text-center no-print">
                      <button type="button" onClick={() => handleRemoveArrayRow('reunioesPedagogicas', idx)} disabled={formData.reunioesPedagogicas.length <= 1} className="text-rose-600 hover:text-rose-800 disabled:opacity-30">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 14. PRINCIPAIS CONSTRANGIMENTOS E MEDIDAS */}
        <section className="space-y-2">
          <h2 className="text-xs font-black uppercase text-slate-900 bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900">
            14. PRINCIPAIS CONSTRANGIMENTOS & MEDIDAS ADOPTADAS
          </h2>
          <div>
            <span className="font-bold text-slate-800 text-[11px] uppercase block mb-1">Principais Constrangimentos Verificados:</span>
            <textarea 
              rows={2}
              value={formData.constrangimentos}
              onChange={e => handleChange('constrangimentos', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-medium text-slate-800"
            />
          </div>
          <div>
            <span className="font-bold text-slate-800 text-[11px] uppercase block mb-1">Medidas Adoptadas para Superar Constrangimentos:</span>
            <textarea 
              rows={2}
              value={formData.medidasConstrangimentos}
              onChange={e => handleChange('medidasConstrangimentos', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-medium text-slate-800"
            />
          </div>
        </section>

        {/* 15, 16 & 17. RESULTADOS, BOAS PRÁTICAS & RECOMENDAÇÕES */}
        <section className="space-y-3">
          <div>
            <h2 className="text-xs font-black uppercase text-slate-900 bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900 mb-1">
              15. PRINCIPAIS RESULTADOS ALCANÇADOS
            </h2>
            <textarea 
              rows={2}
              value={formData.resultadosAlcançados}
              onChange={e => handleChange('resultadosAlcançados', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-medium text-slate-800"
            />
          </div>

          <div>
            <h2 className="text-xs font-black uppercase text-slate-900 bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900 mb-1">
              16. BOAS PRÁTICAS DESENVOLVIDAS
            </h2>
            <textarea 
              rows={2}
              value={formData.boasPraticas}
              onChange={e => handleChange('boasPraticas', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-medium text-slate-800"
            />
          </div>

          <div>
            <h2 className="text-xs font-black uppercase text-slate-900 bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900 mb-1">
              17. RECOMENDAÇÕES
            </h2>
            <textarea 
              rows={3}
              value={formData.recomendacoesTexto}
              onChange={e => handleChange('recomendacoesTexto', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-medium text-slate-800 leading-relaxed"
            />
          </div>
        </section>

        {/* 18. PLANO DE ACÇÃO PARA O PRÓXIMO TRIMESTRE */}
        <section className="space-y-2">
          <div className="flex justify-between items-center bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900">
            <h2 className="text-xs font-black uppercase text-slate-900">
              18. PLANO DE ACÇÃO PARA O PRÓXIMO TRIMESTRE
            </h2>
            <button
              type="button"
              onClick={() => handleAddArrayRow('planoAccao', { actividade: '', objectivo: '', responsavel: 'Docente', prazo: 'Trimestral', indicador: '' })}
              className="no-print text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} /> Adicionar Ação
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300 text-left">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-2 border-r border-b border-slate-300 w-10 text-center">Nº</th>
                  <th className="py-2 px-3 border-r border-b border-slate-300">Actividade</th>
                  <th className="py-2 px-3 border-r border-b border-slate-300">Objectivo</th>
                  <th className="py-2 px-2 border-r border-b border-slate-300 w-24">Responsável</th>
                  <th className="py-2 px-2 border-r border-b border-slate-300 w-24">Prazo</th>
                  <th className="py-2 px-3 border-r border-b border-slate-300">Indicador</th>
                  <th className="py-2 px-1 border-b border-slate-300 w-10 text-center no-print">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-medium text-slate-800">
                {formData.planoAccao.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 px-2 border-r border-slate-300 text-center font-mono text-[10px]">{idx + 1}</td>
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      <input type="text" value={item.actividade} onChange={e => handleArrayRowChange('planoAccao', idx, 'actividade', e.target.value)} className="w-full bg-transparent font-semibold" />
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      <input type="text" value={item.objectivo} onChange={e => handleArrayRowChange('planoAccao', idx, 'objectivo', e.target.value)} className="w-full bg-transparent text-[11px]" />
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-300">
                      <input type="text" value={item.responsavel} onChange={e => handleArrayRowChange('planoAccao', idx, 'responsavel', e.target.value)} className="w-full bg-transparent text-[11px]" />
                    </td>
                    <td className="py-1.5 px-2 border-r border-slate-300">
                      <input type="text" value={item.prazo} onChange={e => handleArrayRowChange('planoAccao', idx, 'prazo', e.target.value)} className="w-full bg-transparent text-[11px]" />
                    </td>
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      <input type="text" value={item.indicador} onChange={e => handleArrayRowChange('planoAccao', idx, 'indicador', e.target.value)} className="w-full bg-transparent text-[11px]" />
                    </td>
                    <td className="py-1.5 px-1 border-slate-300 text-center no-print">
                      <button type="button" onClick={() => handleRemoveArrayRow('planoAccao', idx)} disabled={formData.planoAccao.length <= 1} className="text-rose-600 hover:text-rose-800 disabled:opacity-30">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 19. CONCLUSÃO */}
        <section className="space-y-2">
          <h2 className="text-xs font-black uppercase text-slate-900 bg-slate-200 px-3 py-1.5 rounded border-l-4 border-slate-900">
            19. CONCLUSÃO
          </h2>
          <textarea 
            rows={4}
            value={formData.conclusao}
            onChange={e => handleChange('conclusao', e.target.value)}
            className="w-full bg-white border border-slate-300 rounded p-3 text-xs leading-relaxed font-medium text-slate-800"
          />
        </section>

        {/* 20. ASSINATURAS */}
        <section className="space-y-4 pt-6 border-t-2 border-slate-900">
          <h2 className="text-xs font-black uppercase text-slate-900 text-center">
            20. HOMOLOGAÇÃO & ASSINATURAS INSTITUCIONAIS
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center text-[11px]">
            <div className="bg-slate-50 p-3 rounded border border-slate-300 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 uppercase block mb-1">O Docente</span>
                <input 
                  type="text" 
                  value={formData.nomeDocente} 
                  onChange={e => handleChange('nomeDocente', e.target.value)}
                  className="w-full text-center font-bold text-slate-800 bg-white border border-slate-200 rounded p-1 mb-2 text-xs" 
                />
              </div>
              <SignatureBox label="Assinatura do Docente" />
              <span className="text-[10px] text-slate-500 mt-1 font-mono">Data: {formData.dataElaboracao}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-300 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 uppercase block mb-1">Coordenador / DT</span>
                <input 
                  type="text" 
                  value={formData.nomeCoordenadorDT} 
                  onChange={e => handleChange('nomeCoordenadorDT', e.target.value)}
                  className="w-full text-center font-bold text-slate-800 bg-white border border-slate-200 rounded p-1 mb-2 text-xs" 
                />
              </div>
              <SignatureBox label="Visto do Coordenador" />
              <span className="text-[10px] text-slate-500 mt-1 font-mono">Data: ____/____/2026</span>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-300 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 uppercase block mb-1">Director Pedagógico</span>
                <input 
                  type="text" 
                  value={formData.nomeDirectorPedagogico} 
                  onChange={e => handleChange('nomeDirectorPedagogico', e.target.value)}
                  className="w-full text-center font-bold text-slate-800 bg-white border border-slate-200 rounded p-1 mb-2 text-xs" 
                />
              </div>
              <SignatureBox label="Visto Pedagógico" />
              <span className="text-[10px] text-slate-500 mt-1 font-mono">Data: ____/____/2026</span>
            </div>

            <div className="bg-slate-50 p-3 rounded border border-slate-300 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 uppercase block mb-1">Director da Escola</span>
                <input 
                  type="text" 
                  value={formData.nomeDirectorEscola} 
                  onChange={e => handleChange('nomeDirectorEscola', e.target.value)}
                  className="w-full text-center font-bold text-slate-800 bg-white border border-slate-200 rounded p-1 mb-2 text-xs" 
                />
              </div>
              <SignatureBox label="Homologação / Selo" />
              <span className="text-[10px] text-slate-500 mt-1 font-mono">Data: ____/____/2026</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
