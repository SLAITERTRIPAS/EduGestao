import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Employee } from '../types';
import { EmployeeProcessDocument } from './EmployeeProcessDocument';
import { 
  Users, 
  UserCheck, 
  GraduationCap, 
  Calendar, 
  School, 
  BookOpen, 
  Briefcase, 
  Printer, 
  ChevronRight, 
  PieChart as PieChartIcon, 
  BarChart3, 
  TrendingUp, 
  Building2, 
  Award, 
  ShieldCheck, 
  UserPlus, 
  FileSpreadsheet,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { ProvinceDistrictSelect } from './ProvinceDistrictSelect';
import { COMMON_TRAINING_AREAS } from '../data/mozambiqueLocations';

type SubSection = 'geral' | 'idade' | 'turmas' | 'docentes' | 'cta';

export function GestaoCorpoDiscente() {
  const { 
    students = [], 
    classes = [], 
    employees = [], 
    schools = [], 
    currentUser = null, 
    addEmployee = () => {} 
  } = useStore() || {};
  const [subSection, setSubSection] = useState<SubSection>('geral');
  const [selectedRegimeFilter, setSelectedRegimeFilter] = useState<'todos' | 'laboral' | 'pos-laboral'>('todos');

  // Modal de registo rápido de colaborador
  const [selectedEmployeeForDossier, setSelectedEmployeeForDossier] = useState<Employee | null>(null);
  const [modalCareer, setModalCareer] = useState<'Docente' | 'CTA' | null>(null);
  const [modalForm, setModalForm] = useState({
    name: '',
    gender: 'M',
    nuit: '',
    academicLevel: 'Licenciatura',
    trainingArea: '',
    category: 'Docente N1',
    roleFunction: '',
    contractType: 'Nomeação Definitiva',
    isEffective: 'Sim',
    leadershipRole: '',
    taughtSubjects: '',
    phone: '',
    birthProvince: 'Maputo Cidade',
    birthDistrict: 'KaMpfumo'
  });

  const handleOpenAddModal = (career: 'Docente' | 'CTA') => {
    setModalCareer(career);
    setModalForm({
      name: '',
      gender: 'M',
      nuit: '',
      academicLevel: career === 'Docente' ? 'Licenciatura' : 'Médio',
      trainingArea: career === 'Docente' ? 'Educação / Ensino' : 'Administração / Secretaria',
      category: career === 'Docente' ? 'Docente N1' : 'Técnico Profissional',
      roleFunction: career === 'Docente' ? 'Professor de Disciplina' : 'Oficial de Secretaria',
      contractType: 'Nomeação Definitiva',
      isEffective: 'Sim',
      leadershipRole: '',
      taughtSubjects: '',
      phone: '',
      birthProvince: 'Maputo Cidade',
      birthDistrict: 'KaMpfumo'
    });
  };

  const handleSaveModalEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCareer || !modalForm.name || !modalForm.nuit) return;

    const subjectsArr = modalForm.taughtSubjects 
      ? modalForm.taughtSubjects.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const newEmp: Employee = {
      id: `COL-${Date.now().toString().slice(-5)}`,
      schoolId: currentUser?.schoolId || 's1',
      name: modalForm.name,
      gender: modalForm.gender,
      nuit: modalForm.nuit,
      nationality: 'Moçambicana',
      birthProvince: modalForm.birthProvince,
      birthDistrict: modalForm.birthDistrict,
      phone: modalForm.phone,
      academicLevel: modalForm.academicLevel,
      trainingArea: modalForm.trainingArea,
      career: modalCareer,
      category: modalForm.category,
      roleFunction: modalForm.roleFunction,
      isEffective: modalForm.isEffective,
      contractType: modalForm.contractType,
      leadershipRole: modalForm.leadershipRole,
      taughtSubjects: subjectsArr
    };

    addEmployee(newEmp);
    setModalCareer(null);

    // Open the process form for the new employee immediately
    setSelectedEmployeeForDossier(newEmp);
  };

  const currentSchool = schools.find(s => s.id === currentUser?.schoolId) || schools[0] || {
    name: 'Escola Secundária Central',
    address: 'Av. das FPLM, Maputo'
  };

  const currentYear = 2024;

  // Filtragem dos alunos por regime se selecionado
  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      if (selectedRegimeFilter === 'todos') return true;
      const turma = classes.find(c => c.id === st.classId);
      const isPosLaboral = turma?.period === 'Noite';
      return selectedRegimeFilter === 'pos-laboral' ? isPosLaboral : !isPosLaboral;
    });
  }, [students, classes, selectedRegimeFilter]);

  // Estatísticas Gerais dos Alunos
  const studentStats = useMemo(() => {
    const total = filteredStudents.length;
    const homens = filteredStudents.filter(s => (s.gender || 'M').toUpperCase() === 'M').length;
    const mulheres = filteredStudents.filter(s => (s.gender || 'M').toUpperCase() === 'F').length;

    // Novos Ingressos
    const novosIngressosList = filteredStudents.filter(s => s.isNewAdmission || s.entryType === 'novo_ingresso');
    const novosTotal = novosIngressosList.length;
    const novosH = novosIngressosList.filter(s => (s.gender || 'M').toUpperCase() === 'M').length;
    const novosM = novosIngressosList.filter(s => (s.gender || 'M').toUpperCase() === 'F').length;

    // Continuação
    const continuacaoTotal = total - novosTotal;
    const continuacaoH = homens - novosH;
    const continuacaoM = mulheres - novosM;

    const percentMulheres = total > 0 ? ((mulheres / total) * 100).toFixed(1) : '0.0';
    const percentNovos = total > 0 ? ((novosTotal / total) * 100).toFixed(1) : '0.0';

    return {
      total,
      homens,
      mulheres,
      percentMulheres,
      novosTotal,
      novosH,
      novosM,
      percentNovos,
      continuacaoTotal,
      continuacaoH,
      continuacaoM
    };
  }, [filteredStudents]);

  // Estatística por Idade
  const ageStats = useMemo(() => {
    const map = new Map<number, { idade: number; h: number; m: number; total: number }>();

    filteredStudents.forEach(st => {
      let age = 16;
      if (st.birthDate) {
        const birthYear = parseInt(st.birthDate.split('-')[0], 10);
        if (!isNaN(birthYear)) {
          age = currentYear - birthYear;
        }
      }
      const gender = (st.gender || 'M').toUpperCase();
      const current = map.get(age) || { idade: age, h: 0, m: 0, total: 0 };
      if (gender === 'F') {
        current.m += 1;
      } else {
        current.h += 1;
      }
      current.total += 1;
      map.set(age, current);
    });

    const list = Array.from(map.values()).sort((a, b) => a.idade - b.idade);
    const totalAlunos = filteredStudents.length || 1;

    // Classificação de Idade Normal (15-16 anos para 10ª classe) vs Sobreidade
    return list.map(item => ({
      ...item,
      percentage: ((item.total / totalAlunos) * 100).toFixed(1),
      isNormalAge: item.idade <= 16,
    }));
  }, [filteredStudents, currentYear]);

  // Estatística por Turma
  const classStats = useMemo(() => {
    return classes.map(c => {
      const turmaStudents = students.filter(s => s.classId === c.id);
      const total = turmaStudents.length;
      const h = turmaStudents.filter(s => (s.gender || 'M').toUpperCase() === 'M').length;
      const m = turmaStudents.filter(s => (s.gender || 'M').toUpperCase() === 'F').length;

      const novos = turmaStudents.filter(s => s.isNewAdmission || s.entryType === 'novo_ingresso');
      const novosTotal = novos.length;
      const novosH = novos.filter(s => (s.gender || 'M').toUpperCase() === 'M').length;
      const novosM = novos.filter(s => (s.gender || 'M').toUpperCase() === 'F').length;

      const contTotal = total - novosTotal;
      const contH = h - novosH;
      const contM = m - novosM;

      // Média de idades
      const ages = turmaStudents.map(st => {
        if (!st.birthDate) return 16;
        const bYear = parseInt(st.birthDate.split('-')[0], 10);
        return isNaN(bYear) ? 16 : currentYear - bYear;
      });
      const avgAge = ages.length > 0 ? (ages.reduce((a, b) => a + b, 0) / ages.length).toFixed(1) : '-';

      const isPosLaboral = c.period === 'Noite';

      return {
        turma: c,
        total,
        h,
        m,
        novosTotal,
        novosH,
        novosM,
        contTotal,
        contH,
        contM,
        avgAge,
        isPosLaboral,
        regime: isPosLaboral ? 'Pós-Laboral (Noturno)' : `Laboral (${c.period || 'Manhã'})`
      };
    });
  }, [classes, students, currentYear]);

  // Estatística de Docentes
  const docentes = useMemo(() => {
    return (employees || []).filter(e => e.career === 'Docente');
  }, [employees]);

  const docenteStats = useMemo(() => {
    const total = docentes.length;
    const h = docentes.filter(d => (d.gender || 'M').toUpperCase() === 'M').length;
    const m = docentes.filter(d => (d.gender || 'M').toUpperCase() === 'F').length;

    // Habilitações
    const porNivel: Record<string, { h: number; m: number; total: number }> = {
      Mestrado: { h: 0, m: 0, total: 0 },
      Licenciatura: { h: 0, m: 0, total: 0 },
      Bacharelato: { h: 0, m: 0, total: 0 },
      Médio: { h: 0, m: 0, total: 0 },
    };

    // Vínculo
    const porVinculo: Record<string, { h: number; m: number; total: number }> = {
      Efectivo: { h: 0, m: 0, total: 0 },
      Contratado: { h: 0, m: 0, total: 0 }
    };

    // Categoria
    const porCategoria: Record<string, { h: number; m: number; total: number }> = {
      'Docente N1': { h: 0, m: 0, total: 0 },
      'Docente N2': { h: 0, m: 0, total: 0 },
      'Docente N3': { h: 0, m: 0, total: 0 },
    };

    docentes.forEach(d => {
      const g = (d.gender || 'M').toUpperCase() === 'F' ? 'm' : 'h';
      
      // Habilitação
      const nivel = d.academicLevel?.includes('Mestrado') ? 'Mestrado' :
                    d.academicLevel?.includes('Bacharel') ? 'Bacharelato' :
                    d.academicLevel?.includes('Médio') ? 'Médio' : 'Licenciatura';
      porNivel[nivel][g] += 1;
      porNivel[nivel].total += 1;

      // Vínculo
      const vinculo = (d.contractType?.includes('Nomeação') || d.isEffective === 'Sim') ? 'Efectivo' : 'Contratado';
      porVinculo[vinculo][g] += 1;
      porVinculo[vinculo].total += 1;

      // Categoria
      const cat = d.category?.includes('N1') ? 'Docente N1' :
                  d.category?.includes('N2') ? 'Docente N2' : 'Docente N3';
      porCategoria[cat][g] += 1;
      porCategoria[cat].total += 1;
    });

    const ratioAlunoDocente = total > 0 ? (filteredStudents.length / total).toFixed(1) : '0';

    return {
      total,
      h,
      m,
      percentM: total > 0 ? ((m / total) * 100).toFixed(1) : '0',
      porNivel,
      porVinculo,
      porCategoria,
      ratioAlunoDocente
    };
  }, [docentes, filteredStudents]);

  // Estatística de CTA (Corpo Técnico-Administrativo)
  const ctaStaff = useMemo(() => {
    return (employees || []).filter(e => e.career === 'CTA');
  }, [employees]);

  const ctaStats = useMemo(() => {
    const total = ctaStaff.length;
    const h = ctaStaff.filter(c => (c.gender || 'M').toUpperCase() === 'M').length;
    const m = ctaStaff.filter(c => (c.gender || 'M').toUpperCase() === 'F').length;

    // Setores
    const setoresMap = new Map<string, { h: number; m: number; total: number }>();
    
    // Nível de Escolaridade
    const porEscolaridade: Record<string, { h: number; m: number; total: number }> = {
      Superior: { h: 0, m: 0, total: 0 },
      Médio: { h: 0, m: 0, total: 0 },
      Básico: { h: 0, m: 0, total: 0 }
    };

    // Vínculo
    const porVinculo: Record<string, { h: number; m: number; total: number }> = {
      Efectivo: { h: 0, m: 0, total: 0 },
      Contratado: { h: 0, m: 0, total: 0 }
    };

    ctaStaff.forEach(c => {
      const g = (c.gender || 'M').toUpperCase() === 'F' ? 'm' : 'h';
      
      // Setor / Função
      let setor = 'Apoio Geral & Limpeza';
      const role = (c.roleFunction || '').toLowerCase();
      if (role.includes('secretaria') || role.includes('matrícula')) setor = 'Secretaria Geral & Matrículas';
      else if (role.includes('finança') || role.includes('tesour') || role.includes('contab')) setor = 'Administração & Finanças / Tesouraria';
      else if (role.includes('bibliot')) setor = 'Biblioteca & Centro de Recursos';
      else if (role.includes('informática') || role.includes('rede') || role.includes('ti')) setor = 'Tecnologias de Informação (TIC)';
      else if (role.includes('seguran') || role.includes('portaria')) setor = 'Segurança & Portaria';

      const sData = setoresMap.get(setor) || { h: 0, m: 0, total: 0 };
      sData[g] += 1;
      sData.total += 1;
      setoresMap.set(setor, sData);

      // Escolaridade
      const nivel = c.academicLevel?.includes('Licenciatura') || c.academicLevel?.includes('Superior') ? 'Superior' :
                    c.academicLevel?.includes('Médio') ? 'Médio' : 'Básico';
      porEscolaridade[nivel][g] += 1;
      porEscolaridade[nivel].total += 1;

      // Vínculo
      const vinculo = (c.contractType?.includes('Nomeação') || c.isEffective === 'Sim') ? 'Efectivo' : 'Contratado';
      porVinculo[vinculo][g] += 1;
      porVinculo[vinculo].total += 1;
    });

    const ratioAlunoCTA = total > 0 ? (filteredStudents.length / total).toFixed(1) : '0';

    return {
      total,
      h,
      m,
      percentM: total > 0 ? ((m / total) * 100).toFixed(1) : '0',
      setores: Array.from(setoresMap.entries()).map(([nome, data]) => ({ nome, ...data })),
      porEscolaridade,
      porVinculo,
      ratioAlunoCTA
    };
  }, [ctaStaff, filteredStudents]);

  return (
    <div className="space-y-6">
      {/* Top Banner Oficial */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-xl p-6 text-white shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-500/20 text-amber-300 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Direção Pedagógica • MINEDH
            </span>
            <span className="text-slate-400 text-xs font-medium">Ano Letivo {currentYear}</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-serif font-black text-white tracking-wide flex items-center gap-3">
            <Users className="h-7 w-7 text-amber-400" />
            GESTÃO DO CORPO DISCENTE
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl font-sans">
            Módulo oficial de Estatística Geral Escolar. Levantamento de dados censitários de Alunos (Novos Ingressos e Continuação por sexo H/M), Distribuição Etária, Estatística por Turma, Corpo Docente e CTA.
          </p>
        </div>

        {/* Ações de Impressão e Filtro */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            title="Imprimir Mapa Estatístico Oficial em formato A4"
          >
            <Printer className="h-4 w-4" /> Imprimir Relatório Oficial
          </button>
        </div>
      </div>

      {/* Navegação por Sub-Abas da Gestão do Corpo Discente */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm no-print">
        <button
          onClick={() => setSubSection('geral')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            subSection === 'geral'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="h-4 w-4" /> Estatística Geral & Resumo
        </button>

        <button
          onClick={() => setSubSection('idade')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            subSection === 'idade'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Calendar className="h-4 w-4" /> Estatística por Idade
        </button>

        <button
          onClick={() => setSubSection('turmas')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            subSection === 'turmas'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <School className="h-4 w-4" /> Estatística por Turma
        </button>

        <button
          onClick={() => setSubSection('docentes')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            subSection === 'docentes'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <GraduationCap className="h-4 w-4" /> Estatística de Docentes
        </button>

        <button
          onClick={() => setSubSection('cta')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
            subSection === 'cta'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Briefcase className="h-4 w-4" /> Estatística de CTA
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 1: ESTATÍSTICA GERAL & RESUMO EXECUTIVO                            */}
      {/* ========================================================================= */}
      {subSection === 'geral' && (
        <div className="space-y-6">
          {/* Cartões Estatísticos Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Geral de Alunos */}
            <div className="bg-white rounded-xl p-5 border border-blue-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-blue-600" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total de Alunos</span>
                <span className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                  <Users className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900 font-mono">{studentStats.total}</span>
                <span className="text-xs text-blue-700 font-semibold">100% matriculados</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 text-xs">
                <div>
                  <span className="text-gray-500 font-medium">Homens (H):</span>{' '}
                  <span className="font-bold text-blue-900 font-mono">{studentStats.homens}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Mulheres (M):</span>{' '}
                  <span className="font-bold text-pink-700 font-mono">{studentStats.mulheres}</span>
                </div>
              </div>
            </div>

            {/* Novos Ingressos */}
            <div className="bg-white rounded-xl p-5 border border-emerald-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-emerald-600" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Novos Ingressos</span>
                <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                  <UserPlus className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-900 font-mono">{studentStats.novosTotal}</span>
                <span className="text-xs text-emerald-700 font-semibold">{studentStats.percentNovos}% do total</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 text-xs">
                <div>
                  <span className="text-gray-500 font-medium">H:</span>{' '}
                  <span className="font-bold text-emerald-900 font-mono">{studentStats.novosH}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">M:</span>{' '}
                  <span className="font-bold text-pink-700 font-mono">{studentStats.novosM}</span>
                </div>
              </div>
            </div>

            {/* Total de Docentes */}
            <div className="bg-white rounded-xl p-5 border border-purple-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-purple-600" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Corpo Docente</span>
                <span className="p-2 bg-purple-50 text-purple-700 rounded-lg">
                  <GraduationCap className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-purple-900 font-mono">{docenteStats.total}</span>
                <span className="text-xs text-purple-700 font-semibold">{docenteStats.ratioAlunoDocente} alunos/prof</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 text-xs">
                <div>
                  <span className="text-gray-500 font-medium">H:</span>{' '}
                  <span className="font-bold text-purple-900 font-mono">{docenteStats.h}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">M:</span>{' '}
                  <span className="font-bold text-pink-700 font-mono">{docenteStats.m}</span>
                </div>
              </div>
            </div>

            {/* Total CTA */}
            <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-amber-600" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Funcionários CTA</span>
                <span className="p-2 bg-amber-50 text-amber-700 rounded-lg">
                  <Briefcase className="h-5 w-5" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-900 font-mono">{ctaStats.total}</span>
                <span className="text-xs text-amber-800 font-semibold">{ctaStats.percentM}% mulheres</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 text-xs">
                <div>
                  <span className="text-gray-500 font-medium">H:</span>{' '}
                  <span className="font-bold text-slate-900 font-mono">{ctaStats.h}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">M:</span>{' '}
                  <span className="font-bold text-pink-700 font-mono">{ctaStats.m}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela Comparativa Oficial: Alunos por Tipo de Ingresso e Género */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold font-serif text-sm tracking-wide flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-amber-400" />
                  QUADRO CENSITÁRIO OFICIAL DO CORPO DISCENTE (MINEDH)
                </h3>
                <p className="text-xs text-slate-400">Distribuição por Categoria de Ingresso, Género (H/M) e Continuação Escolar</p>
              </div>
              <span className="text-xs bg-slate-800 text-amber-300 font-mono font-bold px-3 py-1 rounded">
                Total Geral: {studentStats.total} Alunos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-100 text-gray-700 uppercase font-serif">
                  <tr>
                    <th className="px-4 py-3 text-left border-r border-gray-200">Categoria de Ingresso</th>
                    <th className="px-4 py-3 text-center border-r border-gray-200 w-32 bg-blue-50/60 text-blue-900">
                      Homens (H)
                    </th>
                    <th className="px-4 py-3 text-center border-r border-gray-200 w-32 bg-pink-50/60 text-pink-900">
                      Mulheres (M)
                    </th>
                    <th className="px-4 py-3 text-center border-r border-gray-200 w-36 bg-gray-200 text-gray-900 font-bold">
                      TOTAL GERAL
                    </th>
                    <th className="px-4 py-3 text-center w-40">% Representatividade</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 font-sans">
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900 border-r border-gray-200 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      Novos Ingressos (1ª Matrícula no Ciclo / Classe)
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-blue-900 bg-blue-50/30 border-r border-gray-200 font-mono text-sm">
                      {studentStats.novosH}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-pink-700 bg-pink-50/30 border-r border-gray-200 font-mono text-sm">
                      {studentStats.novosM}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-emerald-900 bg-emerald-50/50 border-r border-gray-200 font-mono text-sm">
                      {studentStats.novosTotal}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-700">
                      {studentStats.percentNovos}%
                    </td>
                  </tr>

                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900 border-r border-gray-200 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                      Alunos de Continuação (Renovação / Transição)
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-blue-900 bg-blue-50/30 border-r border-gray-200 font-mono text-sm">
                      {studentStats.continuacaoH}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-pink-700 bg-pink-50/30 border-r border-gray-200 font-mono text-sm">
                      {studentStats.continuacaoM}
                    </td>
                    <td className="px-4 py-3 text-center font-black text-blue-950 bg-blue-50/50 border-r border-gray-200 font-mono text-sm">
                      {studentStats.continuacaoTotal}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-700">
                      {(100 - parseFloat(studentStats.percentNovos)).toFixed(1)}%
                    </td>
                  </tr>

                  {/* Linha de Total Geral */}
                  <tr className="bg-slate-900 text-white font-bold">
                    <td className="px-4 py-3 uppercase tracking-wider font-serif border-r border-slate-700">
                      TOTAL GERAL DO CORPO DISCENTE
                    </td>
                    <td className="px-4 py-3 text-center text-amber-300 font-mono text-base border-r border-slate-700 font-black">
                      {studentStats.homens}
                    </td>
                    <td className="px-4 py-3 text-center text-pink-300 font-mono text-base border-r border-slate-700 font-black">
                      {studentStats.mulheres}
                    </td>
                    <td className="px-4 py-3 text-center text-white bg-slate-950 font-mono text-base border-r border-slate-700 font-black">
                      {studentStats.total}
                    </td>
                    <td className="px-4 py-3 text-center text-amber-400 font-mono font-bold">
                      100.0%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráfico Visual / Resumo de Indicadores Estruturais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Paridade de Género */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <h4 className="text-sm font-bold text-gray-900 uppercase font-serif mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Índice de Paridade de Género dos Estudantes
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-blue-900">Rapazes / Homens (H)</span>
                    <span className="font-mono text-blue-900">
                      {studentStats.homens} ({((studentStats.homens / (studentStats.total || 1)) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${((studentStats.homens / (studentStats.total || 1)) * 100)}%` }} 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-pink-800">Meninas / Mulheres (M)</span>
                    <span className="font-mono text-pink-800">
                      {studentStats.mulheres} ({studentStats.percentMulheres}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-pink-500 rounded-full" 
                      style={{ width: `${studentStats.percentMulheres}%` }} 
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-200">
                • <strong>Meta MINEDH:</strong> Paridade aproximada de 50% entre ambos os sexos. A atual taxa feminina situa-se em <strong>{studentStats.percentMulheres}%</strong>.
              </p>
            </div>

            {/* Resumo da Equipa Pedagógica & Administrativa */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <h4 className="text-sm font-bold text-gray-900 uppercase font-serif mb-4 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-600" />
                Rácio Institucional de Apoio Pedagógico
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <span className="text-[11px] font-bold text-purple-900 uppercase block">Rácio Aluno / Docente</span>
                  <span className="text-2xl font-black text-purple-950 font-mono">{docenteStats.ratioAlunoDocente} : 1</span>
                  <span className="text-[11px] text-purple-700 block mt-1">Alunos por cada docente em funções</span>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                  <span className="text-[11px] font-bold text-amber-900 uppercase block">Rácio Aluno / CTA</span>
                  <span className="text-2xl font-black text-amber-950 font-mono">{ctaStats.ratioAlunoCTA} : 1</span>
                  <span className="text-[11px] text-amber-800 block mt-1">Alunos por funcionário administrativo</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1">
                <div>• Total Geral de Recursos Humanos: <strong>{docenteStats.total + ctaStats.total} funcionários</strong></div>
                <div>• Quadro Docente Efectivo: <strong>{docenteStats.porVinculo.Efectivo.total} docentes</strong></div>
                <div>• Quadro CTA Efectivo: <strong>{ctaStats.porVinculo.Efectivo.total} funcionários</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 2: ESTATÍSTICA POR IDADE                                           */}
      {/* ========================================================================= */}
      {subSection === 'idade' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold font-serif text-sm tracking-wide flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  MAPA OFICIAL DE DISTRIBUIÇÃO ETÁRIA DOS ALUNOS
                </h3>
                <p className="text-xs text-slate-400">Estatística 3 de Março: Levantamento por ano de idade, sexo (H/M) e indicador de sobreidade escolar</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-emerald-950 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded font-bold">
                  Idade Oficial: ≤ 16 Anos
                </span>
                <span className="bg-amber-950 border border-amber-500/40 text-amber-300 px-2.5 py-1 rounded font-bold">
                  Sobreidade: &gt; 16 Anos
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-100 text-gray-700 uppercase font-serif">
                  <tr>
                    <th className="px-4 py-3 text-center border-r border-gray-200 w-24">Idade</th>
                    <th className="px-4 py-3 text-left border-r border-gray-200">Classificação Censitária</th>
                    <th className="px-4 py-3 text-center border-r border-gray-200 w-28 bg-blue-50/60 text-blue-900">
                      Homens (H)
                    </th>
                    <th className="px-4 py-3 text-center border-r border-gray-200 w-28 bg-pink-50/60 text-pink-900">
                      Mulheres (M)
                    </th>
                    <th className="px-4 py-3 text-center border-r border-gray-200 w-32 bg-gray-200 text-gray-900 font-bold">
                      TOTAL
                    </th>
                    <th className="px-4 py-3 text-center border-r border-gray-200 w-28">% do Total</th>
                    <th className="px-4 py-3 text-left w-56">Distribuição Proporcional</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 font-sans">
                  {ageStats.map(item => (
                    <tr key={item.idade} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-4 py-3 text-center font-black text-gray-900 border-r border-gray-200 font-mono text-sm bg-gray-50/40">
                        {item.idade} anos
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200">
                        {item.isNormalAge ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <UserCheck className="w-3 h-3" /> Idade Própria / Teórica
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Sobreidade Escolar
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-blue-900 bg-blue-50/20 border-r border-gray-200 font-mono text-sm">
                        {item.h}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-pink-700 bg-pink-50/20 border-r border-gray-200 font-mono text-sm">
                        {item.m}
                      </td>
                      <td className="px-4 py-3 text-center font-black text-gray-900 bg-gray-100/50 border-r border-gray-200 font-mono text-sm">
                        {item.total}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-700 border-r border-gray-200 font-mono">
                        {item.percentage}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-blue-600 h-full" 
                            style={{ width: `${item.total > 0 ? (item.h / item.total) * 100 : 0}%` }}
                            title={`H: ${item.h}`}
                          />
                          <div 
                            className="bg-pink-500 h-full" 
                            style={{ width: `${item.total > 0 ? (item.m / item.total) * 100 : 0}%` }}
                            title={`M: ${item.m}`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Linha de Total */}
                  <tr className="bg-slate-900 text-white font-bold">
                    <td colSpan={2} className="px-4 py-3 uppercase tracking-wider font-serif border-r border-slate-700">
                      SOMATÓRIO TOTAL CENSITÁRIO
                    </td>
                    <td className="px-4 py-3 text-center text-amber-300 font-mono text-base border-r border-slate-700 font-black">
                      {studentStats.homens}
                    </td>
                    <td className="px-4 py-3 text-center text-pink-300 font-mono text-base border-r border-slate-700 font-black">
                      {studentStats.mulheres}
                    </td>
                    <td className="px-4 py-3 text-center text-white bg-slate-950 font-mono text-base border-r border-slate-700 font-black">
                      {studentStats.total}
                    </td>
                    <td className="px-4 py-3 text-center text-amber-400 font-mono font-bold border-r border-slate-700">
                      100.0%
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-400 font-mono">
                      Azul: H | Rosa: M
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 3: ESTATÍSTICA POR TURMA                                            */}
      {/* ========================================================================= */}
      {subSection === 'turmas' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold font-serif text-sm tracking-wide flex items-center gap-2">
                  <School className="h-4 w-4 text-amber-400" />
                  MAPA ESTATÍSTICO TURMA A TURMA (DIURNO & NOTURNO)
                </h3>
                <p className="text-xs text-slate-400">Alunos Novos Ingressos, Continuação e Totais discriminados por Sexo (H/M) em cada turma</p>
              </div>
              <span className="text-xs bg-slate-800 text-amber-300 font-mono font-bold px-3 py-1 rounded">
                {classes.length} Turmas Cadastradas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-100 text-gray-700 uppercase font-serif">
                  <tr>
                    <th rowSpan={2} className="px-4 py-2 text-left border-r border-gray-300">Turma / Classe</th>
                    <th rowSpan={2} className="px-3 py-2 text-center border-r border-gray-300 w-32">Regime / Turno</th>
                    <th colSpan={3} className="px-3 py-1 text-center border-r border-gray-300 bg-emerald-100/70 text-emerald-950 font-bold">
                      Novos Ingressos
                    </th>
                    <th colSpan={3} className="px-3 py-1 text-center border-r border-gray-300 bg-blue-100/70 text-blue-950 font-bold">
                      Alunos de Continuação
                    </th>
                    <th colSpan={3} className="px-3 py-1 text-center border-r border-gray-300 bg-gray-200 text-gray-900 font-bold">
                      TOTAL GERAL DA TURMA
                    </th>
                    <th rowSpan={2} className="px-3 py-2 text-center w-24">Idade Média</th>
                  </tr>
                  <tr className="bg-gray-50 text-[11px] text-gray-600">
                    <th className="px-2 py-1 text-center border-r border-gray-200 bg-emerald-50 text-blue-900 font-bold">H</th>
                    <th className="px-2 py-1 text-center border-r border-gray-200 bg-emerald-50 text-pink-700 font-bold">M</th>
                    <th className="px-2 py-1 text-center border-r border-gray-300 bg-emerald-100 font-bold text-emerald-900">Total</th>

                    <th className="px-2 py-1 text-center border-r border-gray-200 bg-blue-50 text-blue-900 font-bold">H</th>
                    <th className="px-2 py-1 text-center border-r border-gray-200 bg-blue-50 text-pink-700 font-bold">M</th>
                    <th className="px-2 py-1 text-center border-r border-gray-300 bg-blue-100 font-bold text-blue-900">Total</th>

                    <th className="px-2 py-1 text-center border-r border-gray-200 bg-gray-100 text-blue-900 font-bold">H</th>
                    <th className="px-2 py-1 text-center border-r border-gray-200 bg-gray-100 text-pink-700 font-bold">M</th>
                    <th className="px-3 py-1 text-center border-r border-gray-300 bg-gray-300 font-black text-gray-900">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 font-sans">
                  {classStats.map(cs => (
                    <tr key={cs.turma.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-900 border-r border-gray-200">
                        <div className="font-bold text-sm text-blue-950">{cs.turma.name}</div>
                        <div className="text-[11px] text-gray-500">{cs.turma.gradeLevel} • Ano {cs.turma.year}</div>
                      </td>
                      <td className="px-3 py-3 text-center border-r border-gray-200">
                        <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                          cs.isPosLaboral 
                            ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                            : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}>
                          {cs.isPosLaboral ? 'Pós-Laboral' : 'Laboral'}
                        </span>
                      </td>

                      {/* Novos Ingressos */}
                      <td className="px-2 py-3 text-center font-bold text-blue-900 border-r border-gray-200 font-mono">
                        {cs.novosH}
                      </td>
                      <td className="px-2 py-3 text-center font-bold text-pink-700 border-r border-gray-200 font-mono">
                        {cs.novosM}
                      </td>
                      <td className="px-2 py-3 text-center font-black text-emerald-900 bg-emerald-50/50 border-r border-gray-300 font-mono">
                        {cs.novosTotal}
                      </td>

                      {/* Continuação */}
                      <td className="px-2 py-3 text-center font-bold text-blue-900 border-r border-gray-200 font-mono">
                        {cs.contH}
                      </td>
                      <td className="px-2 py-3 text-center font-bold text-pink-700 border-r border-gray-200 font-mono">
                        {cs.contM}
                      </td>
                      <td className="px-2 py-3 text-center font-black text-blue-900 bg-blue-50/50 border-r border-gray-300 font-mono">
                        {cs.contTotal}
                      </td>

                      {/* Total da Turma */}
                      <td className="px-2 py-3 text-center font-black text-blue-950 border-r border-gray-200 font-mono bg-gray-50">
                        {cs.h}
                      </td>
                      <td className="px-2 py-3 text-center font-black text-pink-800 border-r border-gray-200 font-mono bg-gray-50">
                        {cs.m}
                      </td>
                      <td className="px-3 py-3 text-center font-black text-gray-900 bg-amber-50/60 border-r border-gray-300 font-mono text-sm">
                        {cs.total}
                      </td>

                      <td className="px-3 py-3 text-center font-bold text-gray-700 font-mono">
                        {cs.avgAge} anos
                      </td>
                    </tr>
                  ))}

                  {/* Linha de Totalizador Geral */}
                  <tr className="bg-slate-900 text-white font-bold">
                    <td colSpan={2} className="px-4 py-3 uppercase tracking-wider font-serif border-r border-slate-700">
                      TOTALIZAÇÃO GERAL DE TODAS AS TURMAS
                    </td>
                    <td className="px-2 py-3 text-center text-amber-300 font-mono border-r border-slate-700">
                      {studentStats.novosH}
                    </td>
                    <td className="px-2 py-3 text-center text-pink-300 font-mono border-r border-slate-700">
                      {studentStats.novosM}
                    </td>
                    <td className="px-2 py-3 text-center text-emerald-400 font-mono border-r border-slate-700 font-black">
                      {studentStats.novosTotal}
                    </td>

                    <td className="px-2 py-3 text-center text-amber-300 font-mono border-r border-slate-700">
                      {studentStats.continuacaoH}
                    </td>
                    <td className="px-2 py-3 text-center text-pink-300 font-mono border-r border-slate-700">
                      {studentStats.continuacaoM}
                    </td>
                    <td className="px-2 py-3 text-center text-blue-400 font-mono border-r border-slate-700 font-black">
                      {studentStats.continuacaoTotal}
                    </td>

                    <td className="px-2 py-3 text-center text-amber-300 font-mono border-r border-slate-700 font-black text-base">
                      {studentStats.homens}
                    </td>
                    <td className="px-2 py-3 text-center text-pink-300 font-mono border-r border-slate-700 font-black text-base">
                      {studentStats.mulheres}
                    </td>
                    <td className="px-3 py-3 text-center text-white bg-slate-950 font-mono border-r border-slate-700 font-black text-base">
                      {studentStats.total}
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-slate-400 text-xs">
                      Geral
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 4: ESTATÍSTICA DE DOCENTES                                         */}
      {/* ========================================================================= */}
      {subSection === 'docentes' && (
        <div className="space-y-6">
          {/* Cartões do Corpo Docente */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-purple-200 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase">Total do Corpo Docente</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-purple-950 font-mono">{docenteStats.total}</span>
                <span className="text-xs text-purple-700 font-semibold">Professores em Actividade</span>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Homens: <strong className="text-blue-900">{docenteStats.h}</strong> | Mulheres: <strong className="text-pink-700">{docenteStats.m}</strong> ({docenteStats.percentM}%)
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-blue-200 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase">Quadro de Nomeação (Efectivos)</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-blue-950 font-mono">{docenteStats.porVinculo.Efectivo.total}</span>
                <span className="text-xs text-blue-700 font-semibold">
                  {docenteStats.total > 0 ? ((docenteStats.porVinculo.Efectivo.total / docenteStats.total) * 100).toFixed(0) : 0}% do corpo
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                H: <strong>{docenteStats.porVinculo.Efectivo.h}</strong> | M: <strong>{docenteStats.porVinculo.Efectivo.m}</strong>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase">Professores Contratados</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-950 font-mono">{docenteStats.porVinculo.Contratado.total}</span>
                <span className="text-xs text-amber-800 font-semibold">Contrato a Termo Certo</span>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                H: <strong>{docenteStats.porVinculo.Contratado.h}</strong> | M: <strong>{docenteStats.porVinculo.Contratado.m}</strong>
              </div>
            </div>
          </div>

          {/* Tabela de Habilitações Académicas dos Docentes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold font-serif text-sm tracking-wide flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-400" />
                  QUADRO DE HABILITAÇÕES ACADÉMICAS E CATEGORIAS DOS DOCENTES
                </h3>
                <p className="text-xs text-slate-400">Distribuição do Corpo Docente por Grau Académico, Categoria e Sexo (H/M)</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-100 text-gray-700 uppercase font-serif">
                  <tr>
                    <th className="px-4 py-3 text-left border-r border-gray-200">Grau Académico / Habilitações</th>
                    <th className="px-4 py-3 text-center border-r border-gray-200 w-32 bg-blue-50/60 text-blue-900">Homens (H)</th>
                    <th className="px-4 py-3 text-center border-r border-gray-200 w-32 bg-pink-50/60 text-pink-900">Mulheres (M)</th>
                    <th className="px-4 py-3 text-center border-r border-gray-200 w-36 bg-gray-200 text-gray-900 font-bold">TOTAL</th>
                    <th className="px-4 py-3 text-center w-36">% do Corpo Docente</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 font-sans">
                  {(Object.entries(docenteStats.porNivel) as [string, { h: number; m: number; total: number }][]).map(([nivel, data]) => (
                    <tr key={nivel} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-900 border-r border-gray-200 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-purple-600" />
                        {nivel}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-blue-900 bg-blue-50/20 border-r border-gray-200 font-mono text-sm">
                        {data.h}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-pink-700 bg-pink-50/20 border-r border-gray-200 font-mono text-sm">
                        {data.m}
                      </td>
                      <td className="px-4 py-3 text-center font-black text-purple-950 bg-purple-50/40 border-r border-gray-200 font-mono text-sm">
                        {data.total}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-700 font-mono">
                        {docenteStats.total > 0 ? ((data.total / docenteStats.total) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-slate-900 text-white font-bold">
                    <td className="px-4 py-3 uppercase tracking-wider font-serif border-r border-slate-700">
                      TOTAL GERAL DO CORPO DOCENTE
                    </td>
                    <td className="px-4 py-3 text-center text-amber-300 font-mono text-base border-r border-slate-700 font-black">
                      {docenteStats.h}
                    </td>
                    <td className="px-4 py-3 text-center text-pink-300 font-mono text-base border-r border-slate-700 font-black">
                      {docenteStats.m}
                    </td>
                    <td className="px-4 py-3 text-center text-white bg-slate-950 font-mono text-base border-r border-slate-700 font-black">
                      {docenteStats.total}
                    </td>
                    <td className="px-4 py-3 text-center text-amber-400 font-mono font-bold">
                      100.0%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Relação Nominal e Cargas dos Docentes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-800">
                Lista de Docentes Cadastrados & Disciplinas Lecionadas
              </h4>
              <span className="text-xs text-gray-500 font-mono">Total: {docentes.length} Docentes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-100 text-gray-700 font-serif uppercase">
                  <tr>
                    <th className="px-3 py-2 text-center w-12 border-r border-gray-200">Nº</th>
                    <th className="px-4 py-2 text-left border-r border-gray-200">Nome Completo do Docente</th>
                    <th className="px-3 py-2 text-center border-r border-gray-200 w-20">Sexo</th>
                    <th className="px-4 py-2 text-left border-r border-gray-200">Habilitações Literárias</th>
                    <th className="px-3 py-2 text-center border-r border-gray-200 w-28">Categoria</th>
                    <th className="px-3 py-2 text-center border-r border-gray-200 w-32">Vínculo</th>
                    <th className="px-4 py-2 text-left">Disciplinas / Cargos</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {docentes.map((doc, idx) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-center font-bold text-gray-500 border-r border-gray-200">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-gray-900 border-r border-gray-200">
                        {doc.name}
                      </td>
                      <td className="px-3 py-2.5 text-center border-r border-gray-200 font-bold">
                        {doc.gender === 'F' ? (
                          <span className="text-pink-700 bg-pink-50 px-2 py-0.5 rounded">F</span>
                        ) : (
                          <span className="text-blue-900 bg-blue-50 px-2 py-0.5 rounded">M</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 border-r border-gray-200">
                        {doc.academicLevel} ({doc.trainingArea})
                      </td>
                      <td className="px-3 py-2.5 text-center font-semibold text-gray-800 border-r border-gray-200">
                        {doc.category}
                      </td>
                      <td className="px-3 py-2.5 text-center border-r border-gray-200">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          doc.isEffective === 'Sim' || doc.contractType?.includes('Nomeação')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {doc.contractType || 'Nomeação Definitiva'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-800">
                        <span className="font-bold text-blue-950">{doc.taughtSubjects?.join(', ') || 'Geral'}</span>
                        {doc.leadershipRole && (
                          <span className="ml-2 text-[10px] bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded">
                            {doc.leadershipRole}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rodapé da tabela com botão para registar novo docente */}
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
              <div>
                Total de <strong>{docentes.length}</strong> professores cadastrados no sistema.
              </div>
              <button
                type="button"
                id="btn-registar-novo-docente-discente"
                onClick={() => handleOpenAddModal('Docente')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white font-bold rounded-lg shadow-sm transition-all text-xs cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>+ Registar Novo Docente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 5: ESTATÍSTICA DE CTA (CORPO TÉCNICO-ADMINISTRATIVO)                */}
      {/* ========================================================================= */}
      {subSection === 'cta' && (
        <div className="space-y-6">
          {/* Cartões CTA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase">Total de Funcionários CTA</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-950 font-mono">{ctaStats.total}</span>
                <span className="text-xs text-amber-800 font-semibold">Corpo Técnico-Administrativo</span>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Homens: <strong className="text-blue-900">{ctaStats.h}</strong> | Mulheres: <strong className="text-pink-700">{ctaStats.m}</strong> ({ctaStats.percentM}%)
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-emerald-200 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase">Quadro Efectivo (Nomeação)</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-950 font-mono">{ctaStats.porVinculo.Efectivo.total}</span>
                <span className="text-xs text-emerald-700 font-semibold">
                  {ctaStats.total > 0 ? ((ctaStats.porVinculo.Efectivo.total / ctaStats.total) * 100).toFixed(0) : 0}% do corpo CTA
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                H: <strong>{ctaStats.porVinculo.Efectivo.h}</strong> | M: <strong>{ctaStats.porVinculo.Efectivo.m}</strong>
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase">Funcionários Contratados</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 font-mono">{ctaStats.porVinculo.Contratado.total}</span>
                <span className="text-xs text-slate-600 font-semibold">Regime de Contrato</span>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                H: <strong>{ctaStats.porVinculo.Contratado.h}</strong> | M: <strong>{ctaStats.porVinculo.Contratado.m}</strong>
              </div>
            </div>
          </div>

          {/* Tabela de Setores e Áreas do CTA */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold font-serif text-sm tracking-wide flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-amber-400" />
                  MAPA DE DISTRIBUIÇÃO DO CORPO TÉCNICO-ADMINISTRATIVO POR SECTOR
                </h3>
                <p className="text-xs text-slate-400">Secretaria Escolar, Tesouraria, Biblioteca, TIC, Apoio Operacional e Portaria</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-100 text-gray-700 uppercase font-serif">
                  <tr>
                    <th className="px-4 py-3 text-left border-r border-gray-200">Sector / Repartição de Actividade</th>
                    <th className="px-4 py-3 text-center border-r border-gray-200 w-32 bg-blue-50/60 text-blue-900">Homens (H)</th>
                    <th className="px-4 py-3 text-center border-r border-gray-200 w-32 bg-pink-50/60 text-pink-900">Mulheres (M)</th>
                    <th className="px-4 py-3 text-center border-r border-gray-200 w-36 bg-gray-200 text-gray-900 font-bold">TOTAL</th>
                    <th className="px-4 py-3 text-center w-36">% do Corpo CTA</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 font-sans">
                  {ctaStats.setores.map(sec => (
                    <tr key={sec.nome} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-900 border-r border-gray-200 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                        {sec.nome}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-blue-900 bg-blue-50/20 border-r border-gray-200 font-mono text-sm">
                        {sec.h}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-pink-700 bg-pink-50/20 border-r border-gray-200 font-mono text-sm">
                        {sec.m}
                      </td>
                      <td className="px-4 py-3 text-center font-black text-amber-950 bg-amber-50/40 border-r border-gray-200 font-mono text-sm">
                        {sec.total}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-700 font-mono">
                        {ctaStats.total > 0 ? ((sec.total / ctaStats.total) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-slate-900 text-white font-bold">
                    <td className="px-4 py-3 uppercase tracking-wider font-serif border-r border-slate-700">
                      TOTAL GERAL DO CORPO TÉCNICO-ADMINISTRATIVO (CTA)
                    </td>
                    <td className="px-4 py-3 text-center text-amber-300 font-mono text-base border-r border-slate-700 font-black">
                      {ctaStats.h}
                    </td>
                    <td className="px-4 py-3 text-center text-pink-300 font-mono text-base border-r border-slate-700 font-black">
                      {ctaStats.m}
                    </td>
                    <td className="px-4 py-3 text-center text-white bg-slate-950 font-mono text-base border-r border-slate-700 font-black">
                      {ctaStats.total}
                    </td>
                    <td className="px-4 py-3 text-center text-amber-400 font-mono font-bold">
                      100.0%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Relação Nominal dos Funcionários do CTA */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-800">
                Lista Nominal do Corpo Técnico-Administrativo em Funções
              </h4>
              <span className="text-xs text-gray-500 font-mono">Total: {ctaStaff.length} Funcionários</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-100 text-gray-700 font-serif uppercase">
                  <tr>
                    <th className="px-3 py-2 text-center w-12 border-r border-gray-200">Nº</th>
                    <th className="px-4 py-2 text-left border-r border-gray-200">Nome Completo do Funcionário</th>
                    <th className="px-3 py-2 text-center border-r border-gray-200 w-20">Sexo</th>
                    <th className="px-4 py-2 text-left border-r border-gray-200">Função / Cargo no CTA</th>
                    <th className="px-3 py-2 text-center border-r border-gray-200 w-28">Nível</th>
                    <th className="px-3 py-2 text-center border-r border-gray-200 w-32">Vínculo</th>
                    <th className="px-4 py-2 text-left">Especialidade / Formação</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ctaStaff.map((emp, idx) => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-center font-bold text-gray-500 border-r border-gray-200">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-gray-900 border-r border-gray-200">
                        {emp.name}
                      </td>
                      <td className="px-3 py-2.5 text-center border-r border-gray-200 font-bold">
                        {emp.gender === 'F' ? (
                          <span className="text-pink-700 bg-pink-50 px-2 py-0.5 rounded">F</span>
                        ) : (
                          <span className="text-blue-900 bg-blue-50 px-2 py-0.5 rounded">M</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-blue-950 border-r border-gray-200">
                        {emp.roleFunction}
                      </td>
                      <td className="px-3 py-2.5 text-center font-semibold text-gray-800 border-r border-gray-200">
                        {emp.academicLevel}
                      </td>
                      <td className="px-3 py-2.5 text-center border-r border-gray-200">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          emp.isEffective === 'Sim' || emp.contractType?.includes('Nomeação')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {emp.contractType || 'Nomeação Definitiva'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-700">
                        {emp.trainingArea || 'Geral'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rodapé da tabela com botão para registar novo funcionário CTA */}
            <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
              <div>
                Total de <strong>{ctaStaff.length}</strong> funcionários do CTA cadastrados no sistema.
              </div>
              <button
                type="button"
                id="btn-registar-novo-cta-discente"
                onClick={() => handleOpenAddModal('CTA')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold rounded-lg shadow-sm transition-all text-xs cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>+ Registar Novo Funcionário CTA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO OFICIAL DE IMPRESSÃO (Formatada para papel A4 e MINEDH)             */}
      {/* ========================================================================= */}
      <div className="hidden print:block p-8 bg-white text-black font-serif">
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <img 
            src="/emblema_mocambique.png" 
            alt="República de Moçambique" 
            className="w-16 h-16 mx-auto mb-2 object-contain"
            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <h2 className="text-base font-bold uppercase tracking-wider">REPÚBLICA DE MOÇAMBIQUE</h2>
          <h3 className="text-sm font-bold uppercase tracking-wider">MINISTÉRIO DA EDUCAÇÃO E DESENVOLVIMENTO HUMANO</h3>
          <h4 className="text-sm font-bold uppercase">{currentSchool.name}</h4>
          <h5 className="text-xs font-bold uppercase tracking-widest mt-2">
            DIREÇÃO PEDAGÓGICA • MAPA ESTATÍSTICO GERAL DE EFECTIVOS (DISCENTES, DOCENTES E CTA)
          </h5>
          <p className="text-[11px] italic mt-1">Ano Lectivo {currentYear}</p>
        </div>

        {/* Resumo Impresso */}
        <div className="mb-6">
          <h6 className="font-bold text-xs uppercase mb-2">1. QUADRO RESUMO CENSITÁRIO DE ALUNOS</h6>
          <table className="w-full border-collapse border border-black text-[11px]">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-1.5 text-left">Categoria</th>
                <th className="border border-black p-1.5 text-center">Homens (H)</th>
                <th className="border border-black p-1.5 text-center">Mulheres (M)</th>
                <th className="border border-black p-1.5 text-center font-bold">TOTAL GERAL</th>
                <th className="border border-black p-1.5 text-center">% Representação</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1.5">Novos Ingressos</td>
                <td className="border border-black p-1.5 text-center">{studentStats.novosH}</td>
                <td className="border border-black p-1.5 text-center">{studentStats.novosM}</td>
                <td className="border border-black p-1.5 text-center font-bold">{studentStats.novosTotal}</td>
                <td className="border border-black p-1.5 text-center">{studentStats.percentNovos}%</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5">Alunos de Continuação</td>
                <td className="border border-black p-1.5 text-center">{studentStats.continuacaoH}</td>
                <td className="border border-black p-1.5 text-center">{studentStats.continuacaoM}</td>
                <td className="border border-black p-1.5 text-center font-bold">{studentStats.continuacaoTotal}</td>
                <td className="border border-black p-1.5 text-center">{(100 - parseFloat(studentStats.percentNovos)).toFixed(1)}%</td>
              </tr>
              <tr className="font-bold bg-gray-100">
                <td className="border border-black p-1.5 uppercase">TOTAL GERAL DE ESTUDANTES</td>
                <td className="border border-black p-1.5 text-center">{studentStats.homens}</td>
                <td className="border border-black p-1.5 text-center">{studentStats.mulheres}</td>
                <td className="border border-black p-1.5 text-center">{studentStats.total}</td>
                <td className="border border-black p-1.5 text-center">100%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Recursos Humanos Impresso */}
        <div className="mb-8">
          <h6 className="font-bold text-xs uppercase mb-2">2. RECURSOS HUMANOS: CORPO DOCENTE E CTA</h6>
          <table className="w-full border-collapse border border-black text-[11px]">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-1.5 text-left">Carreira</th>
                <th className="border border-black p-1.5 text-center">Homens (H)</th>
                <th className="border border-black p-1.5 text-center">Mulheres (M)</th>
                <th className="border border-black p-1.5 text-center font-bold">TOTAL</th>
                <th className="border border-black p-1.5 text-center">Efectivos</th>
                <th className="border border-black p-1.5 text-center">Contratados</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1.5 font-bold">Corpo Docente (Professores)</td>
                <td className="border border-black p-1.5 text-center">{docenteStats.h}</td>
                <td className="border border-black p-1.5 text-center">{docenteStats.m}</td>
                <td className="border border-black p-1.5 text-center font-bold">{docenteStats.total}</td>
                <td className="border border-black p-1.5 text-center">{docenteStats.porVinculo.Efectivo.total}</td>
                <td className="border border-black p-1.5 text-center">{docenteStats.porVinculo.Contratado.total}</td>
              </tr>
              <tr>
                <td className="border border-black p-1.5 font-bold">Corpo Técnico-Administrativo (CTA)</td>
                <td className="border border-black p-1.5 text-center">{ctaStats.h}</td>
                <td className="border border-black p-1.5 text-center">{ctaStats.m}</td>
                <td className="border border-black p-1.5 text-center font-bold">{ctaStats.total}</td>
                <td className="border border-black p-1.5 text-center">{ctaStats.porVinculo.Efectivo.total}</td>
                <td className="border border-black p-1.5 text-center">{ctaStats.porVinculo.Contratado.total}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Assinaturas Oficiais */}
        <div className="grid grid-cols-2 gap-12 pt-8 text-center text-xs">
          <div>
            <div className="border-t border-black pt-1 w-3/4 mx-auto font-bold">
              O Director Adjunto Pedagógico (DAP)
            </div>
            <div className="text-[10px] text-gray-600 mt-1">Tomas Estevao Cossa</div>
          </div>
          <div>
            <div className="border-t border-black pt-1 w-3/4 mx-auto font-bold">
              O Director da Escola
            </div>
            <div className="text-[10px] text-gray-600 mt-1">Carimbo e Assinatura</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: REGISTAR NOVO COLABORADOR (DOCENTE / CTA)                          */}
      {/* ========================================================================= */}
      {modalCareer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-blue-50/50">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl text-white ${modalCareer === 'Docente' ? 'bg-blue-700' : 'bg-amber-600'}`}>
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 font-serif">
                    Registar Novo {modalCareer === 'Docente' ? 'Docente' : 'Funcionário do CTA'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Preencha os dados do colaborador para inclusão imediata no mapa estatístico
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCareer(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Formulário */}
            <form onSubmit={handleSaveModalEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={modalCareer === 'Docente' ? "Ex: Alberto Mário Guambe" : "Ex: Rosa Daniel Tembe"}
                  value={modalForm.name}
                  onChange={e => setModalForm({ ...modalForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Género <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={modalForm.gender}
                    onChange={e => setModalForm({ ...modalForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="M">Masculino (H)</option>
                    <option value="F">Feminino (M)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    NUIT <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="9 dígitos"
                    maxLength={9}
                    value={modalForm.nuit}
                    onChange={e => setModalForm({ ...modalForm, nuit: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Nível Académico <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={modalForm.academicLevel}
                    onChange={e => setModalForm({ ...modalForm, academicLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Doutoramento">Doutoramento</option>
                    <option value="Mestrado">Mestrado</option>
                    <option value="Licenciatura">Licenciatura</option>
                    <option value="Bacharelato">Bacharelato</option>
                    <option value="Médio">Médio</option>
                    <option value="Básico">Básico</option>
                    <option value="Elementar">Elementar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    {modalCareer === 'Docente' ? 'Área de Formação / Especialidade' : 'Área de Atuação'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    list="training-areas-list-modal"
                    required
                    placeholder={modalCareer === 'Docente' ? "Ex: Ensino de Matemática" : "Ex: Contabilidade / Secretaria"}
                    value={modalForm.trainingArea}
                    onChange={e => setModalForm({ ...modalForm, trainingArea: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <datalist id="training-areas-list-modal">
                    {COMMON_TRAINING_AREAS.map(area => (
                      <option key={area} value={area} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Província e Distrito de Naturalidade */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Naturalidade do Colaborador (Moçambique)
                </span>
                <ProvinceDistrictSelect
                  province={modalForm.birthProvince}
                  district={modalForm.birthDistrict}
                  onProvinceChange={prov => setModalForm(prev => ({ ...prev, birthProvince: prov }))}
                  onDistrictChange={dist => setModalForm(prev => ({ ...prev, birthDistrict: dist }))}
                  labelProvince="Província de Naturalidade"
                  labelDistrict="Distrito de Naturalidade"
                  horizontal={true}
                  required={true}
                  idPrefix="modal-emp"
                />
              </div>

              {modalCareer === 'Docente' && (
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Disciplinas Ministradas (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Matemática, Física"
                    value={modalForm.taughtSubjects}
                    onChange={e => setModalForm({ ...modalForm, taughtSubjects: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Vínculo Laboral <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={modalForm.contractType}
                    onChange={e => {
                      const val = e.target.value;
                      setModalForm({ 
                        ...modalForm, 
                        contractType: val, 
                        isEffective: val.includes('Nomeação') ? 'Sim' : 'Não' 
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Nomeação Definitiva">Nomeação Definitiva (Efectivo)</option>
                    <option value="Nomeação Provisória">Nomeação Provisória</option>
                    <option value="Contratado">Contratado</option>
                    <option value="Destacado">Destacado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Contacto Telefónico
                  </label>
                  <input
                    type="text"
                    placeholder="84 / 82 / 85 / 86 / 87..."
                    value={modalForm.phone}
                    onChange={e => setModalForm({ ...modalForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setModalCareer(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-bold text-xs rounded-lg shadow-sm hover:opacity-95 cursor-pointer ${
                    modalCareer === 'Docente' ? 'bg-blue-700 hover:bg-blue-800' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  Registar {modalCareer === 'Docente' ? 'Docente' : 'Colaborador CTA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedEmployeeForDossier && (
        <div className="fixed inset-0 z-50 bg-black/70  flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[96vh] overflow-y-auto border border-gray-300">
            <EmployeeProcessDocument
              employee={selectedEmployeeForDossier}
              onClose={() => setSelectedEmployeeForDossier(null)}
              onSaveSuccess={() => setSelectedEmployeeForDossier(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
