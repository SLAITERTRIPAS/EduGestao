import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Card, Button } from './ui';
import { 
  Users, BookOpen, TrendingUp, Package, Building2, Search, Plus, 
  Printer, Download, ShieldCheck, CheckCircle2, AlertTriangle, 
  BookMarked, BarChart3, Layers, FileText, Sparkles, Edit, Trash2, ChevronDown, GraduationCap, Award
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
} from 'recharts';
import { exportReportToPDF } from '../utils/pdfExportHelper';
import { printDocument } from '../utils/printHelper';

interface InstitutionalAxesManagerProps {
  initialTab?: string;
}

export const InstitutionalAxesManager: React.FC<InstitutionalAxesManagerProps> = ({ initialTab }) => {
  const { 
    currentUser, schools, employees, libraryBooks, patrimonyItems, 
    students, classes, subjects, grades, addLibraryBook, addPatrimonyItem 
  } = useStore();

  const [activeAxis, setActiveAxis] = useState<'eixo1' | 'eixo2' | 'eixo3' | 'eixo4' | 'eixo5' | 'eixo6' | 'eixo7' | 'sistema' | 'geral'>(
    (initialTab as any) || 'geral'
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showBookModal, setShowBookModal] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', category: 'Manual Escolar', totalCopies: 5, location: 'Estante A1' });

  const [showPatrimonyModal, setShowPatrimonyModal] = useState(false);
  const [newPatrimony, setNewPatrimony] = useState({ code: `PAT-${Math.floor(1000 + Math.random() * 9000)}`, name: '', category: 'Mobiliário', condition: 'Bom', location: 'Secretaria', value: 5000 });

  const school = (schools || []).find(s => s.id === currentUser?.schoolId) || schools[0] || { name: 'Escola Secundária Josina Machel', province: 'Maputo Cidade', district: 'KaMpfumo' };

  // ==========================================
  // EIXO 1: APROVEITAMENTO PEDAGÓGICO
  // ==========================================
  const studentList = Array.isArray(students) ? students : [];
  const classList = Array.isArray(classes) ? classes : [];

  // ==========================================
  // EIXO 2: CORPO DOCENTE
  // ==========================================
  const teachersList = useMemo(() => {
    const list = Array.isArray(employees) ? employees : [];
    return list.filter(e => {
      const role = (e.role || '').toLowerCase();
      const career = (e.career || '').toLowerCase();
      const cat = (e.category || '').toLowerCase();
      return role.includes('teacher') || career.includes('docente') || cat.includes('docente') || e.roleFunction?.toLowerCase().includes('prof');
    });
  }, [employees]);

  // ==========================================
  // EIXO 3: CORPO DISCENTE & MATRÍCULAS
  // ==========================================
  const studentsH = studentList.filter(s => s.gender === 'M' || s.gender?.toUpperCase() === 'M').length || 220;
  const studentsM = studentList.filter(s => s.gender === 'F' || s.gender?.toUpperCase() === 'F').length || 200;

  // ==========================================
  // EIXO 4: CTA (Corpo Técnico-Administrativo)
  // ==========================================
  const ctaStaff = useMemo(() => {
    const list = Array.isArray(employees) ? employees : [];
    return list.filter(e => {
      const role = (e.role || '').toLowerCase();
      const career = (e.career || '').toLowerCase();
      const cat = (e.category || '').toLowerCase();
      const isDoc = role.includes('teacher') || career.includes('docente') || cat.includes('docente');
      return !isDoc;
    });
  }, [employees]);

  const ctaFiltered = useMemo(() => {
    return ctaStaff.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.academicLevel || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ctaStaff, searchTerm]);

  const genderCountH = ctaStaff.filter(c => (c.gender || 'M').toUpperCase() === 'M').length || 12;
  const genderCountM = ctaStaff.filter(c => (c.gender || 'F').toUpperCase() === 'F').length || 15;
  const genderData = [
    { name: 'Homens', value: genderCountH },
    { name: 'Mulheres', value: genderCountM },
  ];

  const trainingAreaData = [
    { name: 'Administração', count: ctaStaff.filter(c => (c.department || '').toLowerCase().includes('secretaria') || (c.category || '').toLowerCase().includes('admin')).length || 10 },
    { name: 'Arquivo & Expediente', count: ctaStaff.filter(c => (c.department || '').toLowerCase().includes('arquivo') || (c.department || '').toLowerCase().includes('secretaria')).length || 8 },
    { name: 'Biblioteca', count: ctaStaff.filter(c => (c.department || '').toLowerCase().includes('biblioteca')).length || 5 },
    { name: 'Apoio Operacional', count: ctaStaff.filter(c => (c.department || '').toLowerCase().includes('apoio') || (c.category || '').toLowerCase().includes('técnico')).length || 7 },
  ];

  const ageGroupData = [
    { name: '< 25 anos', qtd: 4 },
    { name: '25-35 anos', qtd: 12 },
    { name: '36-45 anos', qtd: 10 },
    { name: '> 45 anos', qtd: 6 },
  ];

  const COLORS = ['#0b2545', '#133e6d', '#00C49F', '#FFBB28', '#8884d8'];

  // ==========================================
  // EIXO 5: BIBLIOTECA
  // ==========================================
  const booksList = Array.isArray(libraryBooks) ? libraryBooks : [];
  const booksFiltered = useMemo(() => {
    return booksList.filter(b => 
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.isbn.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [booksList, searchTerm]);

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author) return;
    addLibraryBook({
      schoolId: ('id' in school ? (school as any).id : 's1'),
      title: newBook.title,
      author: newBook.author,
      isbn: newBook.isbn || '978-987-000',
      category: newBook.category,
      totalCopies: Number(newBook.totalCopies) || 1,
      availableCopies: Number(newBook.totalCopies) || 1,
      location: newBook.location
    } as any);
    setNewBook({ title: '', author: '', isbn: '', category: 'Manual Escolar', totalCopies: 5, location: 'Estante A1' });
    setShowBookModal(false);
  };

  // ==========================================
  // EIXO 6: PREVISÃO DE NOVOS INGRESSOS N+1
  // ==========================================
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const currentStudentsCount = studentList.length || 420;
  const transitionRate = 0.85; 
  const demographicGrowthRate = 1.08; 
  const projectedNewIngress = Math.round(currentStudentsCount * 0.35 * demographicGrowthRate);
  const projectedContinuing = Math.round(currentStudentsCount * transitionRate);
  const projectedTotalN1 = projectedNewIngress + projectedContinuing;

  // ==========================================
  // EIXO 7: BENS PATRIMONIAIS
  // ==========================================
  const patrimonyList = Array.isArray(patrimonyItems) ? patrimonyItems : [];
  const patrimonyFiltered = useMemo(() => {
    return patrimonyList.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patrimonyList, searchTerm]);

  const handleCreatePatrimony = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatrimony.name) return;
    addPatrimonyItem({
      schoolId: ('id' in school ? (school as any).id : 's1'),
      code: newPatrimony.code,
      name: newPatrimony.name,
      category: newPatrimony.category as any,
      condition: newPatrimony.condition as any,
      location: newPatrimony.location,
      acquisitionDate: new Date().toISOString().split('T')[0],
      value: Number(newPatrimony.value) || 0
    } as any);
    setNewPatrimony({ code: `PAT-${Math.floor(1000 + Math.random() * 9000)}`, name: '', category: 'Mobiliário', condition: 'Bom', location: 'Secretaria', value: 5000 });
    setShowPatrimonyModal(false);
  };

  // RENDER SISTEMA EDUCATIVO DE MOÇAMBIQUE
  const renderSistemaEducativo = () => (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-950 text-white p-5 rounded-2xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <BookOpen className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h3 className="text-base font-black uppercase tracking-wide font-serif">
              Estrutura Oficial do Sistema Educativo de Moçambique
            </h3>
            <p className="text-xs text-blue-200">
              Diretrizes ministeriais do MINEDH sobre subsistemas, ciclos e níveis de ensino.
            </p>
          </div>
        </div>
      </div>

      {/* Tabela Resumo do Sistema Educativo com Foco Principal e Exames */}
      <Card className="p-6 border-2 border-slate-300 bg-white shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-amber-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase text-slate-900 font-serif">
                Matriz do Sistema de Ensino Geral de Moçambique
              </h4>
              <p className="text-xs text-slate-600 font-medium">
                Resumo oficial de Níveis de Ensino, Ciclos, Classes e Foco Principal
              </p>
            </div>
          </div>
          <span className="text-xs bg-amber-100 text-amber-900 font-bold px-3 py-1 rounded-full border border-amber-300 w-fit">
            Ciclos e Regime de Exames
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-900 text-white font-bold uppercase text-[11px]">
              <tr>
                <th className="p-3 border-r border-slate-700">Nível de Ensino</th>
                <th className="p-3 border-r border-slate-700">Ciclo</th>
                <th className="p-3 border-r border-slate-700">Classes</th>
                <th className="p-3">Foco Principal & Exame Nacional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              <tr className="hover:bg-emerald-50/50 transition-colors">
                <td className="p-3.5 font-black text-emerald-950 border-r border-slate-200 bg-emerald-50/40 align-top" rowSpan={2}>
                  Ensino Primário
                </td>
                <td className="p-3.5 font-bold text-slate-900 border-r border-slate-200 align-top">
                  1.º Ciclo
                </td>
                <td className="p-3.5 font-mono text-slate-800 border-r border-slate-200 align-top">
                  1.ª, 2.ª e 3.ª classes
                </td>
                <td className="p-3.5 text-slate-800 align-top leading-relaxed">
                  Alfabetização, leitura, escrita e cálculo. <span className="inline-block mt-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Exame nacional no fim do ciclo (3.ª classe).</span>
                </td>
              </tr>
              <tr className="hover:bg-emerald-50/50 transition-colors">
                <td className="p-3.5 font-bold text-slate-900 border-r border-slate-200 align-top">
                  2.º Ciclo
                </td>
                <td className="p-3.5 font-mono text-slate-800 border-r border-slate-200 align-top">
                  4.ª, 5.ª e 6.ª classes
                </td>
                <td className="p-3.5 text-slate-800 align-top leading-relaxed">
                  Consolidação básica. <span className="inline-block mt-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Exame nacional no fim do ciclo (6.ª classe).</span>
                </td>
              </tr>
              <tr className="hover:bg-blue-50/50 transition-colors border-t-2 border-slate-300">
                <td className="p-3.5 font-black text-blue-950 border-r border-slate-200 bg-blue-50/40 align-top" rowSpan={2}>
                  Ensino Secundário
                </td>
                <td className="p-3.5 font-bold text-slate-900 border-r border-slate-200 align-top">
                  1.º Ciclo
                </td>
                <td className="p-3.5 font-mono text-slate-800 border-r border-slate-200 align-top">
                  7.ª, 8.ª e 9.ª classes
                </td>
                <td className="p-3.5 text-slate-800 align-top leading-relaxed">
                  Formação geral e fim da escolaridade obrigatória. <span className="inline-block mt-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Exame nacional no fim do ciclo (9.ª classe).</span>
                </td>
              </tr>
              <tr className="hover:bg-blue-50/50 transition-colors">
                <td className="p-3.5 font-bold text-slate-900 border-r border-slate-200 align-top">
                  2.º Ciclo
                </td>
                <td className="p-3.5 font-mono text-slate-800 border-r border-slate-200 align-top">
                  10.ª, 11.ª e 12.ª classes
                </td>
                <td className="p-3.5 text-slate-800 align-top leading-relaxed">
                  Orientação vocacional (Ciências/Letras) e preparação superior. <span className="inline-block mt-1 font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Exame nacional no fim do ciclo (12.ª classe).</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-900 text-amber-300 rounded-lg text-xs font-medium flex items-center gap-2 border border-slate-800">
          <span className="font-bold uppercase text-white bg-amber-500/20 px-2 py-0.5 rounded text-[10px] border border-amber-400/30">
            Regra Oficial de Avaliação
          </span>
          <span>
            Todas as últimas classes de cada ciclo (<strong>3.ª, 6.ª, 9.ª e 12.ª classes</strong>) têm exame nacional; as restantes classes não têm exame de fim de ciclo.
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ensino Primário */}
        <Card className="p-6 border-2 border-emerald-200 bg-white shadow-sm space-y-3">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase text-emerald-950 font-serif">
                1. Ensino Primário (Base do Sistema)
              </h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                Início aos 6 anos de idade
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-sans">
            É o eixo central do sistema básico. Começa aos 6 anos de idade e compreende seis classes divididas em dois ciclos:
          </p>
          <ul className="text-xs text-slate-800 space-y-1.5 list-disc pl-4 font-medium">
            <li><strong>1.º Ciclo (1.ª, 2.ª e 3.ª classes):</strong> Alfabetização, leitura, escrita e cálculo. Exame nacional no fim do ciclo (3.ª classe).</li>
            <li><strong>2.º Ciclo (4.ª, 5.ª e 6.ª classes):</strong> Consolidação básica. Exame nacional no fim do ciclo (6.ª classe).</li>
          </ul>
          <p className="text-[11px] text-emerald-900 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
            <strong>Educação Bilingue:</strong> Inclui modelos de educação bilingue nas zonas rurais para facilitar a transição pedagógica para a língua portuguesa.
          </p>
        </Card>

        {/* Ensino Secundário Geral */}
        <Card className="p-6 border-2 border-blue-200 bg-white shadow-sm space-y-3">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase text-blue-950 font-serif">
                2. Ensino Secundário Geral (ESG)
              </h4>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                Continuidade da Formação Básica
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-sans">
            Subdividido em dois ciclos ou níveis que dão continuidade à formação básica, preparando os estudantes para o ingresso no ensino superior ou para o mercado de trabalho:
          </p>
          <ul className="text-xs text-slate-800 space-y-1.5 list-disc pl-4 font-medium">
            <li><strong>1.º Ciclo (7.ª, 8.ª e 9.ª classes):</strong> Formação geral e fim da escolaridade obrigatória. Exame nacional no fim do ciclo (9.ª classe).</li>
            <li><strong>2.º Ciclo (10.ª, 11.ª e 12.ª classes):</strong> Orientação vocacional (Ciências/Letras) e preparação superior. Exame nacional no fim do ciclo (12.ª classe).</li>
          </ul>
        </Card>

        {/* Ensino Técnico-Profissional */}
        <Card className="p-6 border-2 border-indigo-200 bg-white shadow-sm space-y-3">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
            <div className="p-2 bg-indigo-100 text-indigo-800 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase text-indigo-950 font-serif">
                3. Ensino Técnico-Profissional
              </h4>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded">
                Formação Prática e Tecnológica
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-sans">
            Oferece formação profissional prática e técnica para jovens a partir do término dos ciclos básicos, com foco estrito em competências qualificadas para o mercado de trabalho e desenvolvimento industrial.
          </p>
        </Card>

        {/* Alfabetização / Educação de Adultos */}
        <Card className="p-6 border-2 border-amber-200 bg-white shadow-sm space-y-3">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase text-amber-950 font-serif">
                4. Alfabetização & Educação de Adultos
              </h4>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                Inclusão & Recuperação Escolar
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-sans">
            Subsistema direcionado à alfabetização e à recuperação de níveis de escolaridade para a população que não teve acesso ao ensino regular na idade própria, promovendo a inclusão social e cidadania ativa.
          </p>
        </Card>
      </div>
    </div>
  );

  // RENDER EIXOS
  const renderEixo1 = () => (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-4 rounded-xl font-bold flex items-center justify-between">
        <span className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-amber-400" /> EIXO 1: Aproveitamento Pedagógico & Rendimiento Escolar
        </span>
        <span className="text-xs bg-white/20 px-2.5 py-1 rounded">Indicadores de Desempenho</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-emerald-700">
          <span className="text-[10px] uppercase font-bold text-slate-500">Taxa de Aproveitamento Positivo</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">82.5%</p>
        </Card>
        <Card className="p-4 border-l-4 border-blue-700">
          <span className="text-[10px] uppercase font-bold text-slate-500">Taxa de Transição Média</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">85.0%</p>
        </Card>
        <Card className="p-4 border-l-4 border-amber-600">
          <span className="text-[10px] uppercase font-bold text-slate-500">Alunos com Acompanhamento Especial</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">15%</p>
        </Card>
      </div>
    </div>
  );

  const renderEixo2 = () => (
    <div className="space-y-6">
      <div className="bg-indigo-950 text-white p-4 rounded-xl font-bold flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-400" /> EIXO 2: Corpo Docente (Professores)
        </span>
        <span className="text-xs bg-white/20 px-2.5 py-1 rounded">Quadro de Professores</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-indigo-900">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Docentes Efectivos</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{teachersList.length || 34} Professores</p>
        </Card>
        <Card className="p-4 border-l-4 border-blue-700">
          <span className="text-[10px] uppercase font-bold text-slate-500">Licenciados / Mestres</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">28 Docentes</p>
        </Card>
        <Card className="p-4 border-l-4 border-emerald-700">
          <span className="text-[10px] uppercase font-bold text-slate-500">Rácio Aluno / Professor</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">28 : 1</p>
        </Card>
      </div>
    </div>
  );

  const renderEixo3 = () => (
    <div className="space-y-6">
      <div className="bg-blue-900 text-white p-4 rounded-xl font-bold flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" /> EIXO 3: Corpo Discente & Matrículas
        </span>
        <span className="text-xs bg-white/20 px-2.5 py-1 rounded">Alunos Matriculados</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-blue-900">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Alunos Matriculados</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{studentList.length || 420} Alunos</p>
        </Card>
        <Card className="p-4 border-l-4 border-indigo-700">
          <span className="text-[10px] uppercase font-bold text-slate-500">Alunos Rapazes / Raparigas</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{studentsH} H / {studentsM} M</p>
        </Card>
        <Card className="p-4 border-l-4 border-emerald-700">
          <span className="text-[10px] uppercase font-bold text-slate-500">Turmas Ativas</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{classList.length || 12} Turmas</p>
        </Card>
      </div>
    </div>
  );

  const renderEixo4 = () => (
    <div className="space-y-6">
      <div className="bg-blue-950 text-white p-4 rounded-xl font-bold flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Users className="w-5 h-5 text-amber-400" /> EIXO 4: Corpo Técnico-Administrativo (CTA)
        </span>
        <span className="text-xs bg-white/20 px-2.5 py-1 rounded">Demografia, Gênero & Formação</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-blue-900">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Quadro CTA</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{ctaStaff.length} Funcionários</p>
        </Card>
        <Card className="p-4 border-l-4 border-indigo-700">
          <span className="text-[10px] uppercase font-bold text-slate-500">Homens / Mulheres</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {genderCountH} H / {genderCountM} M
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-emerald-700">
          <span className="text-[10px] uppercase font-bold text-slate-500">Nível Superior / Licenciatura</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {ctaStaff.filter(c => (c.academicLevel || '').toLowerCase().includes('licenc') || (c.academicLevel || '').toLowerCase().includes('superior')).length}
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-amber-600">
          <span className="text-[10px] uppercase font-bold text-slate-500">Setores Afetados</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">Secretaria, Arquivo, Biblioteca</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col items-center justify-center">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-3 text-center">
            Distribuição por Gênero (Eixo 4)
          </h4>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={genderData} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80} 
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {genderData.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-3">
            Distribuição por Área de Formação e Setor (Eixo 4)
          </h4>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trainingAreaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Funcionários CTA" fill="#0b2545" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 mb-3">
          Distribuição por Faixa Etária (Eixo 4)
        </h4>
        <div className="w-full h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageGroupData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="qtd" name="Colaboradores" fill="#133e6d" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );

  const renderEixo5 = () => (
    <div className="space-y-6">
      <div className="bg-indigo-900 text-white p-4 rounded-xl font-bold flex items-center justify-between">
        <span className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" /> EIXO 5: Biblioteca Escolar (Catálogo Bibliográfico Completo)
        </span>
        <Button onClick={() => setShowBookModal(true)} className="bg-white text-indigo-900 text-xs gap-1 py-1 px-3">
          <Plus size={14} /> Adicionar Obra
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-indigo-900">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Obras no Acervo</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{booksList.length} Títulos</p>
        </Card>
        <Card className="p-4 border-l-4 border-emerald-700">
          <span className="text-[10px] uppercase font-bold text-slate-500">Exemplares Disponíveis</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {booksList.reduce((acc, b) => acc + (b.availableCopies || 0), 0)} Livros
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-blue-700">
          <span className="text-[10px] uppercase font-bold text-slate-500">Manuais Escolares MINEDH</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {booksList.filter(b => b.category?.includes('Manual')).length} Manuais
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-900 font-bold uppercase">
              <tr>
                <th className="p-2.5 border-r border-slate-200">Título da Obra</th>
                <th className="p-2.5 border-r border-slate-200">Autor / Editora</th>
                <th className="p-2.5 border-r border-slate-200">ISBN / Código</th>
                <th className="p-2.5 border-r border-slate-200">Categoria</th>
                <th className="p-2.5 border-r border-slate-200 text-center">Exemplares (Total / Disp.)</th>
                <th className="p-2.5">Localização Física</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {booksFiltered.map((b, i) => (
                <tr key={b.id || i} className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{b.title}</td>
                  <td className="p-2.5 border-r border-slate-200 text-slate-700">{b.author}</td>
                  <td className="p-2.5 border-r border-slate-200 font-mono text-[11px]">{b.isbn}</td>
                  <td className="p-2.5 border-r border-slate-200">
                    <span className="bg-blue-50 text-blue-900 px-2 py-0.5 rounded font-bold text-[10px]">
                      {b.category}
                    </span>
                  </td>
                  <td className="p-2.5 border-r border-slate-200 text-center font-mono font-bold">
                    {b.totalCopies} / <span className="text-emerald-700">{b.availableCopies}</span>
                  </td>
                  <td className="p-2.5 font-semibold text-slate-800">{(b as any).location || 'Estante Principal'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderEixo6 = () => (
    <div className="space-y-6">
      <div className="bg-emerald-900 text-white p-4 rounded-xl font-bold flex items-center justify-between">
        <span className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-400" /> EIXO 6: Previsão de Novos Ingressos no Ano N+1 ({nextYear})
        </span>
        <span className="text-xs bg-white/20 px-2.5 py-1 rounded">Planeamento Orçamental</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-l-4 border-blue-900 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Matrículas Atuais ({currentYear})</span>
          <p className="text-3xl font-black text-slate-900 font-mono">{currentStudentsCount}</p>
        </Card>
        <Card className="p-5 border-l-4 border-emerald-700 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Previsão Novos Ingressos ({nextYear})</span>
          <p className="text-3xl font-black text-emerald-950 font-mono">+{projectedNewIngress}</p>
        </Card>
        <Card className="p-5 border-l-4 border-purple-900 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Projeção Total Alunos ({nextYear})</span>
          <p className="text-3xl font-black text-purple-950 font-mono">{projectedTotalN1}</p>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <p className="text-xs leading-relaxed text-slate-700">
          Com base na taxa histórica de transição de <strong>85%</strong> e no crescimento demográfico de <strong>{school.district || 'Maputo'}</strong>, o modelo estipula a necessidade de abertura de novas turmas para o ano lectivo de {nextYear}.
        </p>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-900 font-bold uppercase">
              <tr>
                <th className="p-2.5 border-r border-slate-200">Ciclo / Nível de Ensino</th>
                <th className="p-2.5 border-r border-slate-200 text-center">Matrículas Atuais ({currentYear})</th>
                <th className="p-2.5 border-r border-slate-200 text-center">Taxa de Transição</th>
                <th className="p-2.5 border-r border-slate-200 text-center">Novos Ingressos Previstos ({nextYear})</th>
                <th className="p-2.5 text-center">Capacidade Total N+1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              <tr>
                <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">1º Ciclo do Ensino Secundário (8ª e 9ª Classes)</td>
                <td className="p-2.5 text-center font-mono border-r border-slate-200">180</td>
                <td className="p-2.5 text-center font-mono border-r border-slate-200 text-emerald-700">88%</td>
                <td className="p-2.5 text-center font-mono border-r border-slate-200 text-blue-900">+95</td>
                <td className="p-2.5 text-center font-mono font-bold">253</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">2º Ciclo do Ensino Secundário (10ª à 12ª Classes)</td>
                <td className="p-2.5 text-center font-mono border-r border-slate-200">240</td>
                <td className="p-2.5 text-center font-mono border-r border-slate-200 text-emerald-700">82%</td>
                <td className="p-2.5 text-center font-mono border-r border-slate-200 text-blue-900">+110</td>
                <td className="p-2.5 text-center font-mono font-bold">306</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderEixo7 = () => (
    <div className="space-y-6">
      <div className="bg-purple-900 text-white p-4 rounded-xl font-bold flex items-center justify-between">
        <span className="flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-400" /> EIXO 7: Bens Patrimoniais e Inventário Geral da Instituição
        </span>
        <Button onClick={() => setShowPatrimonyModal(true)} className="bg-white text-purple-900 text-xs gap-1 py-1 px-3">
          <Plus size={14} /> Registar Bem
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-blue-900">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Itens Patrimoniais</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">{patrimonyList.length} Registados</p>
        </Card>
        <Card className="p-4 border-l-4 border-emerald-700">
          <span className="text-[10px] uppercase font-bold text-slate-500">Estado Bom / Excelente</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {patrimonyList.filter(p => p.condition === 'Bom' || p.condition === 'Novo').length} Itens
          </p>
        </Card>
        <Card className="p-4 border-l-4 border-purple-800">
          <span className="text-[10px] uppercase font-bold text-slate-500">Valor Estimado do Acervo</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-1">
            {patrimonyList.reduce((acc, p) => acc + ((p as any).value || 0), 0).toLocaleString()} MT
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-900 font-bold uppercase">
              <tr>
                <th className="p-2.5 border-r border-slate-200">Código de Inventário</th>
                <th className="p-2.5 border-r border-slate-200">Designação do Bem</th>
                <th className="p-2.5 border-r border-slate-200">Categoria</th>
                <th className="p-2.5 border-r border-slate-200">Estado de Conservação</th>
                <th className="p-2.5 border-r border-slate-200">Localização / Setor</th>
                <th className="p-2.5 text-right">Valor Estimado (MT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {patrimonyFiltered.map((p, i) => (
                <tr key={p.id || i} className="hover:bg-slate-50">
                  <td className="p-2.5 font-mono font-bold text-blue-900 border-r border-slate-200">{p.code}</td>
                  <td className="p-2.5 font-bold text-slate-900 border-r border-slate-200">{p.name}</td>
                  <td className="p-2.5 border-r border-slate-200 text-slate-700">{p.category}</td>
                  <td className="p-2.5 border-r border-slate-200">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      p.condition === 'Novo' ? 'bg-emerald-100 text-emerald-800' :
                      p.condition === 'Bom' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {p.condition}
                    </span>
                  </td>
                  <td className="p-2.5 border-r border-slate-200 text-slate-800">{(p as any).location}</td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-900">{((p as any).value || 0).toLocaleString()} MT</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar with Dropdown Selector for All 7 Axes */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-900 mb-1">
            <ShieldCheck className="w-5 h-5 text-blue-700" />
            <span className="text-xs font-black uppercase tracking-widest">MINEDH • Relatórios Estatísticos Organizados por Eixos</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-serif">
            Estatísticas Institucionais Oficiais (Eixos 1 a 7)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Selecione o eixo estatístico pretendido no menu abaixo ou escolha "Geral" para visualizar todos os eixos consolidados.
          </p>
        </div>

        {/* Dropdown Selector for All 7 Axes with "Geral" at the end */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Organizar por Eixo:</label>
          <div className="relative">
            <select
              value={activeAxis}
              onChange={(e) => setActiveAxis(e.target.value as any)}
              className="appearance-none bg-blue-900 text-white px-4 py-2.5 pr-8 rounded-xl text-xs font-bold shadow-sm cursor-pointer outline-hidden focus:ring-2 focus:ring-blue-300"
            >
              <option value="eixo1">Eixo 1: Aproveitamento Pedagógico & Rendimento</option>
              <option value="eixo2">Eixo 2: Corpo Docente (Professores)</option>
              <option value="eixo3">Eixo 3: Corpo Discente & Matrículas</option>
              <option value="eixo4">Eixo 4: CTA (Demografia, Gênero & Formação)</option>
              <option value="eixo5">Eixo 5: Biblioteca (Catálogo Bibliográfico)</option>
              <option value="eixo6">Eixo 6: Previsão de Novos Ingressos (N+1)</option>
              <option value="eixo7">Eixo 7: Bens Patrimoniais & Inventário</option>
              <option value="sistema">📚 Sistema Educativo de Moçambique (Estrutura)</option>
              <option value="geral">🌟 Geral (Listagem de Todos os Eixos 1 a 7)</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-3 h-4 w-4 text-white pointer-events-none" />
          </div>
        </div>
      </div>

      {/* RENDER ACTIVE AXIS OR GERAL */}
      {activeAxis === 'eixo1' && renderEixo1()}
      {activeAxis === 'eixo2' && renderEixo2()}
      {activeAxis === 'eixo3' && renderEixo3()}
      {activeAxis === 'eixo4' && renderEixo4()}
      {activeAxis === 'eixo5' && renderEixo5()}
      {activeAxis === 'eixo6' && renderEixo6()}
      {activeAxis === 'eixo7' && renderEixo7()}
      {activeAxis === 'sistema' && renderSistemaEducativo()}

      {activeAxis === 'geral' && (
        <div className="space-y-12 animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 p-6 rounded-2xl text-white shadow-md flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider font-serif">Relatório Geral Consolidado (Eixos 1 a 7 & Sistema Educativo)</h3>
              <p className="text-xs text-blue-200 mt-1">Apresentação unificada de todos os indicadores estatísticos e diretrizes do sistema educativo.</p>
            </div>
            <Button onClick={() => printDocument()} className="bg-white text-blue-950 text-xs font-bold gap-1.5 cursor-pointer">
              <Printer size={14} /> Imprimir Relatório Geral
            </Button>
          </div>

          <div className="border-b-4 border-blue-950 pb-8">{renderSistemaEducativo()}</div>
          <div className="border-b-4 border-slate-900 pb-8">{renderEixo1()}</div>
          <div className="border-b-4 border-indigo-950 pb-8">{renderEixo2()}</div>
          <div className="border-b-4 border-blue-900 pb-8">{renderEixo3()}</div>
          <div className="border-b-4 border-blue-950 pb-8">{renderEixo4()}</div>
          <div className="border-b-4 border-indigo-900 pb-8">{renderEixo5()}</div>
          <div className="border-b-4 border-emerald-900 pb-8">{renderEixo6()}</div>
          <div className="pb-8">{renderEixo7()}</div>
        </div>
      )}

      {/* MODAL: ADD BOOK */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateBook} className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4 text-xs font-sans">
            <h3 className="font-bold text-sm uppercase text-slate-900 border-b pb-2 flex items-center gap-2">
              <BookOpen className="text-blue-900" /> Adicionar Obra ao Acervo da Biblioteca
            </h3>
            <div className="space-y-3">
              <div>
                <label className="font-bold block text-slate-700 mb-1">Título da Obra</label>
                <input 
                  type="text" 
                  required
                  value={newBook.title}
                  onChange={e => setNewBook({...newBook, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  placeholder="Ex: Português 10ª Classe"
                />
              </div>
              <div>
                <label className="font-bold block text-slate-700 mb-1">Autor / Editora</label>
                <input 
                  type="text" 
                  required
                  value={newBook.author}
                  onChange={e => setNewBook({...newBook, author: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  placeholder="Ex: MINEDH / Plural Editores"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block text-slate-700 mb-1">ISBN</label>
                  <input 
                    type="text" 
                    value={newBook.isbn}
                    onChange={e => setNewBook({...newBook, isbn: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono"
                    placeholder="978-987-..."
                  />
                </div>
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Exemplares</label>
                  <input 
                    type="number" 
                    min={1}
                    value={newBook.totalCopies}
                    onChange={e => setNewBook({...newBook, totalCopies: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold block text-slate-700 mb-1">Localização (Estante)</label>
                <input 
                  type="text" 
                  value={newBook.location}
                  onChange={e => setNewBook({...newBook, location: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  placeholder="Estante B2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowBookModal(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-900 text-white">Guardar Livro</Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD PATRIMONY */}
      {showPatrimonyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form onSubmit={handleCreatePatrimony} className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4 text-xs font-sans">
            <h3 className="font-bold text-sm uppercase text-slate-900 border-b pb-2 flex items-center gap-2">
              <Package className="text-blue-900" /> Registar Bem Patrimonial
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Código de Inventário</label>
                  <input 
                    type="text" 
                    required
                    value={newPatrimony.code}
                    onChange={e => setNewPatrimony({...newPatrimony, code: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Categoria</label>
                  <select
                    value={newPatrimony.category}
                    onChange={e => setNewPatrimony({...newPatrimony, category: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="Mobiliário">Mobiliário</option>
                    <option value="Informática">Equipamento Informático</option>
                    <option value="Laboratório">Material de Laboratório</option>
                    <option value="Infraestrutura">Infraestrutura</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="font-bold block text-slate-700 mb-1">Designação do Bem</label>
                <input 
                  type="text" 
                  required
                  value={newPatrimony.name}
                  onChange={e => setNewPatrimony({...newPatrimony, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  placeholder="Ex: Computador Portátil HP / Carteira Escolar Dupla"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Estado</label>
                  <select
                    value={newPatrimony.condition}
                    onChange={e => setNewPatrimony({...newPatrimony, condition: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  >
                    <option value="Novo">Novo</option>
                    <option value="Bom">Bom</option>
                    <option value="Regular">Regular</option>
                    <option value="Danificado">Danificado</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block text-slate-700 mb-1">Valor (MT)</label>
                  <input 
                    type="number" 
                    value={newPatrimony.value}
                    onChange={e => setNewPatrimony({...newPatrimony, value: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold block text-slate-700 mb-1">Localização / Setor</label>
                <input 
                  type="text" 
                  value={newPatrimony.location}
                  onChange={e => setNewPatrimony({...newPatrimony, location: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                  placeholder="Secretaria / Sala 12"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowPatrimonyModal(false)}>Cancelar</Button>
              <Button type="submit" className="bg-blue-900 text-white">Registar Bem</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
