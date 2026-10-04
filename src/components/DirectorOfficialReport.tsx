import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  Building2, Users, GraduationCap, Briefcase, FileCheck, 
  Printer, CheckCircle, ShieldCheck, Award, FileText, Download, Loader2
} from 'lucide-react';
import { MOZAMBIQUE_EMBLEM_URL } from '../types';
import { exportReportToPDF } from '../utils/pdfExportHelper';
import { printDocument } from '../utils/printHelper';
import { DigitalSignatureStamp } from './DigitalSignatureStamp';
import { HeaderInstitucional } from './HeaderInstitucional';

export const DirectorOfficialReport: React.FC = () => {
  const { currentUser, schools, students, employees, classes, reports, declarations, certificates } = useStore();
  const [isExporting, setIsExporting] = useState(false);

  const schoolList = Array.isArray(schools) ? schools : [];
  const employeeList = Array.isArray(employees) ? employees : [];
  const studentList = Array.isArray(students) ? students : [];
  const reportList = Array.isArray(reports) ? reports : [];
  const classList = Array.isArray(classes) ? classes : [];
  const declarationList = Array.isArray(declarations) ? declarations : [];
  const certificateList = Array.isArray(certificates) ? certificates : [];

  const school = schoolList.find(s => s.id === currentUser?.schoolId) || schoolList[0] || {
    id: 's1',
    name: 'Instituição de Ensino',
    code: '---',
    province: '---',
    district: '---',
    directorName: currentUser?.name || 'Director da Escola',
    dapName: 'Director Adjunto Pedagógico'
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    await exportReportToPDF({
      elementId: 'director-report-print',
      fileName: `Relatorio_Oficial_Direcao_Pedagogia_${(school?.name || 'Escola').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      orientation: 'portrait'
    });
    setIsExporting(false);
  };

  // Docentes
  const docents = employeeList.filter(e => e.schoolId === school.id && (e.career?.toLowerCase().includes('docente') || e.category?.toLowerCase().includes('docente') || e.roleFunction?.toLowerCase().includes('prof')));
  const docentsH = docents.filter(e => e.gender === 'M' || e.gender?.toUpperCase() === 'M').length;
  const docentsM = docents.filter(e => e.gender === 'F' || e.gender?.toUpperCase() === 'F').length;

  // CTA
  const cta = employeeList.filter(e => e.schoolId === school.id && !e.career?.toLowerCase().includes('docente') && !e.category?.toLowerCase().includes('docente') && !e.roleFunction?.toLowerCase().includes('prof'));
  const ctaH = cta.filter(e => e.gender === 'M' || e.gender?.toUpperCase() === 'M').length;
  const ctaM = cta.filter(e => e.gender === 'F' || e.gender?.toUpperCase() === 'F').length;

  // Qualification types
  interface LevelCount {
    h: number;
    m: number;
    total: number;
  }
  interface DocQualificationBreakdown {
    doutoramento: LevelCount;
    mestrado: LevelCount;
    licenciatura: LevelCount;
    bacharelato: LevelCount;
    medio: LevelCount;
    basico: LevelCount;
  }
  interface CTAQualificationBreakdown {
    posGraduacao: LevelCount;
    licenciatura: LevelCount;
    medio: LevelCount;
    basico: LevelCount;
  }

  // Calculate Docentes qualification
  const docQual: DocQualificationBreakdown = {
    doutoramento: { h: 0, m: 0, total: 0 },
    mestrado: { h: 0, m: 0, total: 0 },
    licenciatura: { h: 0, m: 0, total: 0 },
    bacharelato: { h: 0, m: 0, total: 0 },
    medio: { h: 0, m: 0, total: 0 },
    basico: { h: 0, m: 0, total: 0 },
  };

  docents.forEach(d => {
    const lvl = (d.academicLevel || '').toLowerCase();
    const isF = d.gender === 'F' || d.gender?.toUpperCase() === 'F';
    let target: LevelCount;
    if (lvl.includes('doutor') || lvl.includes('phd')) {
      target = docQual.doutoramento;
    } else if (lvl.includes('mestr')) {
      target = docQual.mestrado;
    } else if (lvl.includes('licenc') || lvl.includes('superior')) {
      target = docQual.licenciatura;
    } else if (lvl.includes('bacharel')) {
      target = docQual.bacharelato;
    } else if (lvl.includes('básic') || lvl.includes('basico') || lvl.includes('element')) {
      target = docQual.basico;
    } else {
      target = docQual.medio;
    }
    if (isF) target.m++;
    else target.h++;
    target.total++;
  });

  // Calculate CTA qualification
  const ctaQual: CTAQualificationBreakdown = {
    posGraduacao: { h: 0, m: 0, total: 0 },
    licenciatura: { h: 0, m: 0, total: 0 },
    medio: { h: 0, m: 0, total: 0 },
    basico: { h: 0, m: 0, total: 0 },
  };

  cta.forEach(c => {
    const lvl = (c.academicLevel || '').toLowerCase();
    const isF = c.gender === 'F' || c.gender?.toUpperCase() === 'F';
    let target: LevelCount;
    if (lvl.includes('pos') || lvl.includes('pós') || lvl.includes('mestr') || lvl.includes('especial')) {
      target = ctaQual.posGraduacao;
    } else if (lvl.includes('licenc') || lvl.includes('superior')) {
      target = ctaQual.licenciatura;
    } else if (lvl.includes('básic') || lvl.includes('basico') || lvl.includes('element') || lvl.includes('fundamental')) {
      target = ctaQual.basico;
    } else {
      target = ctaQual.medio;
    }
    if (isF) target.m++;
    else target.h++;
    target.total++;
  });

  // Alunos
  const schoolStudents = studentList.filter(s => s.schoolId === school.id);
  const studentsH = schoolStudents.filter(s => s.gender === 'M' || s.gender?.toUpperCase() === 'M').length;
  const studentsM = schoolStudents.filter(s => s.gender === 'F' || s.gender?.toUpperCase() === 'F').length;

  // Classes breakdown
  const gradeCounts: { [grade: string]: { H: number; M: number; total: number } } = {};
  schoolStudents.forEach(st => {
    const grade = st.entryGrade || '10ª Classe';
    if (!gradeCounts[grade]) {
      gradeCounts[grade] = { H: 0, M: 0, total: 0 };
    }
    if (st.gender === 'M' || st.gender?.toUpperCase() === 'M') {
      gradeCounts[grade].H++;
    } else {
      gradeCounts[grade].M++;
    }
    gradeCounts[grade].total++;
  });

  const pendingReportsCount = reportList.filter(r => r.status === 'submitted_to_director' || r.status === 'draft').length;
  const signedReportsCount = reportList.filter(r => r.status === 'signed_by_director' || r.status === 'published').length;

  const handlePrint = () => {
    printDocument('director-report-print');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Action Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-blue-900 mb-1">
            <Building2 className="w-5 h-5 text-blue-700" />
            <span className="text-xs font-black uppercase tracking-wider">
              Relatório Institucional de Gestão Escolar
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-serif">
            Relatório Oficial da Direcção da Escola
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Síntese executiva elaborada segundo as competências legais do Director da Escola: Supervisão Geral, Recursos Humanos, Rendimento Pedagógico e Expediente Oficial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Exportar PDF (A4)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório Oficial</span>
          </button>
        </div>
      </div>

      {/* Printable Official Document Container */}
      <div id="director-report-print" className="printable-report bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm space-y-8 print:p-0 print:border-none print:shadow-none">
        {/* Official Header */}
        <HeaderInstitucional 
          school={school} 
          academicYear={2026}
          documentTitle={`RELATÓRIO INSTITUCIONAL DE DIRECÇÃO - ${currentUser?.name?.toUpperCase()}`}
          badge="Supervisão Geral, Recursos Humanos & Rendimento Pedagógico"
          emblemSize="md"
        />

        {/* 0. Enquadramento Estratégico & Legal */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <h3 className="text-[10px] font-black uppercase text-blue-900 tracking-widest flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-700" />
            Enquadramento Estratégico & Legal
          </h3>
          <p className="text-[11px] text-slate-700 leading-relaxed text-justify font-medium italic">
            O presente documento constitui a síntese executiva da gestão escolar, consolidando indicadores de desempenho pedagógico e administrativo. Fundamenta-se nas competências do Director da Escola para a supervisão da qualidade de ensino, gestão eficiente de recursos humanos e garantia da conformidade institucional perante o Ministério da Educação e Desenvolvimento Humano.
          </p>
        </div>

        {/* 1. Enquadramento Legal & Competências */}
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase text-blue-950 tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            1. Enquadramento e Competências do Director
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed text-justify">
            O presente relatório é emitido no uso das competências atribuídas pelo Regulamento Geral do Ensino Secundário ao Director da Escola, consubstanciando a gestão institucional e pedagógica, visto de pautas de avaliação trimestral, supervisão do quadro docente e do Corpo Técnico-Administrativo (CTA), e conformidade da documentação oficial expedida.
          </p>
        </div>

        {/* 2. Quadro de Pessoal (Docentes e CTA por Gênero) */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase text-blue-950 tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1">
            <Users className="w-4 h-4 text-blue-700" />
            2. Censo dos Recursos Humanos da Instituição (Docentes e CTA)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-200">Categoria Profissional</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-200">Homens (H)</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-200">Mulheres (M)</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-200">Total</th>
                  <th className="py-2.5 px-3 text-center">% Feminina</th>
                  <th className="py-2.5 px-3">Observação Institucional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                <tr>
                  <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                    Corpo Docente (Professores Efectivos e Contratados)
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">{docentsH}</td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">{docentsM}</td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono font-black text-blue-900 bg-blue-50/40">
                    {docents.length}
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">
                    {((docentsM / (docents.length || 1)) * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                    Actuação em todos os ciclos e disciplinas curriculares
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                    Corpo Técnico-Administrativo (CTA)
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">{ctaH}</td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">{ctaM}</td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono font-black text-amber-900 bg-amber-50/40">
                    {cta.length}
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">
                    {((ctaM / (cta.length || 1)) * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                    Secretaria, Biblioteca, Finanças, Arquivo e Apoio Operacional
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 font-black text-slate-900">
                <tr className="border-t-2 border-slate-300">
                  <td className="py-2.5 px-3 border-r border-slate-200 uppercase">Total Geral de Funcionários</td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">{docentsH + ctaH}</td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">{docentsM + ctaM}</td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono bg-slate-200">
                    {docents.length + cta.length}
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">
                    {(((docentsM + ctaM) / (docents.length + cta.length || 1)) * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-700">Quadro institucional regularizado</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Sub-tabelas de Grau de Escolaridade: Docentes e CTA */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
            {/* 2.1 Docentes por Grau de Escolaridade */}
            <div className="border border-blue-200 rounded-xl overflow-hidden">
              <div className="bg-blue-900 text-white px-3 py-2 flex items-center justify-between">
                <span className="font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-300" />
                  2.1 Docentes por Grau de Escolaridade
                </span>
                <span className="text-[10px] font-mono bg-blue-950 px-2 py-0.5 rounded font-bold">
                  {docents.length} Professores
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-blue-50 text-blue-950 font-bold uppercase text-[9px] border-b border-blue-200">
                    <tr>
                      <th className="py-1.5 px-2.5">Nível Académico</th>
                      <th className="py-1.5 px-2 text-center">H</th>
                      <th className="py-1.5 px-2 text-center">M</th>
                      <th className="py-1.5 px-2 text-center bg-blue-100 font-black">Tot</th>
                      <th className="py-1.5 px-2 text-center">% Fem.</th>
                      <th className="py-1.5 px-2 text-center">% Ef.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {[
                      { label: 'Doutoramento (PhD)', data: docQual.doutoramento },
                      { label: 'Mestrado (Mestre)', data: docQual.mestrado },
                      { label: 'Licenciatura (Superior)', data: docQual.licenciatura },
                      { label: 'Bacharelato', data: docQual.bacharelato },
                      { label: 'Nível Médio (IFP)', data: docQual.medio },
                      { label: 'Nível Básico', data: docQual.basico },
                    ].map((row, idx) => {
                      const pctFem = ((row.data.m / (row.data.total || 1)) * 100).toFixed(0);
                      const pctTot = ((row.data.total / (docents.length || 1)) * 100).toFixed(0);
                      return (
                        <tr key={idx} className="hover:bg-blue-50/30">
                          <td className="py-1 px-2.5 font-semibold text-slate-800">{row.label}</td>
                          <td className="py-1 px-2 text-center font-mono">{row.data.h}</td>
                          <td className="py-1 px-2 text-center font-mono">{row.data.m}</td>
                          <td className="py-1 px-2 text-center font-mono font-bold bg-blue-50/50 text-blue-950">{row.data.total}</td>
                          <td className="py-1 px-2 text-center font-mono text-slate-500">{pctFem}%</td>
                          <td className="py-1 px-2 text-center font-mono font-bold text-slate-700">{pctTot}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white font-bold text-[10px]">
                    <tr>
                      <td className="py-1.5 px-2.5 uppercase">Total Docentes</td>
                      <td className="py-1.5 px-2 text-center font-mono text-blue-300">{docentsH}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-blue-300">{docentsM}</td>
                      <td className="py-1.5 px-2 text-center font-mono bg-blue-800 text-white">{docents.length}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-blue-200">
                        {((docentsM / (docents.length || 1)) * 100).toFixed(0)}%
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 2.2 CTA por Grau de Escolaridade */}
            <div className="border border-amber-200 rounded-xl overflow-hidden">
              <div className="bg-amber-900 text-white px-3 py-2 flex items-center justify-between">
                <span className="font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-300" />
                  2.2 CTA por Grau de Escolaridade
                </span>
                <span className="text-[10px] font-mono bg-amber-950 px-2 py-0.5 rounded font-bold">
                  {cta.length} Funcionários
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-amber-50 text-amber-950 font-bold uppercase text-[9px] border-b border-amber-200">
                    <tr>
                      <th className="py-1.5 px-2.5">Nível Académico</th>
                      <th className="py-1.5 px-2 text-center">H</th>
                      <th className="py-1.5 px-2 text-center">M</th>
                      <th className="py-1.5 px-2 text-center bg-amber-100 font-black">Tot</th>
                      <th className="py-1.5 px-2 text-center">% Fem.</th>
                      <th className="py-1.5 px-2 text-center">% Ef.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {[
                      { label: 'Pós-Graduação / Espec.', data: ctaQual.posGraduacao },
                      { label: 'Licenciatura (Superior)', data: ctaQual.licenciatura },
                      { label: 'Técnico-Médio / Geral', data: ctaQual.medio },
                      { label: 'Ensino Básico (Operac.)', data: ctaQual.basico },
                    ].map((row, idx) => {
                      const pctFem = ((row.data.m / (row.data.total || 1)) * 100).toFixed(0);
                      const pctTot = ((row.data.total / (cta.length || 1)) * 100).toFixed(0);
                      return (
                        <tr key={idx} className="hover:bg-amber-50/30">
                          <td className="py-1 px-2.5 font-semibold text-slate-800">{row.label}</td>
                          <td className="py-1 px-2 text-center font-mono">{row.data.h}</td>
                          <td className="py-1 px-2 text-center font-mono">{row.data.m}</td>
                          <td className="py-1 px-2 text-center font-mono font-bold bg-amber-50/50 text-amber-950">{row.data.total}</td>
                          <td className="py-1 px-2 text-center font-mono text-slate-500">{pctFem}%</td>
                          <td className="py-1 px-2 text-center font-mono font-bold text-slate-700">{pctTot}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white font-bold text-[10px]">
                    <tr>
                      <td className="py-1.5 px-2.5 uppercase">Total CTA</td>
                      <td className="py-1.5 px-2 text-center font-mono text-amber-300">{ctaH}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-amber-300">{ctaM}</td>
                      <td className="py-1.5 px-2 text-center font-mono bg-amber-800 text-white">{cta.length}</td>
                      <td className="py-1.5 px-2 text-center font-mono text-amber-200">
                        {((ctaM / (cta.length || 1)) * 100).toFixed(0)}%
                      </td>
                      <td className="py-1.5 px-2 text-center font-mono">100%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Corpo Discente por Classe e Sexo */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase text-blue-950 tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1">
            <GraduationCap className="w-4 h-4 text-emerald-700" />
            3. Efectivo Discente por Classe e Gênero (Estatística Escolar)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3 border-r border-slate-200">Nível / Classe</th>
                  <th className="py-2 px-3 text-center border-r border-slate-200">Masculino (H)</th>
                  <th className="py-2 px-3 text-center border-r border-slate-200">Feminino (M)</th>
                  <th className="py-2 px-3 text-center border-r border-slate-200">Total Alunos</th>
                  <th className="py-2 px-3 text-center border-r border-slate-200">% Feminina</th>
                  <th className="py-2 px-3 text-center">Turmas Criadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {Object.entries(gradeCounts).map(([grade, counts]) => {
                  const classCount = classList.filter(c => c.schoolId === school.id && c.gradeLevel === grade).length || 1;
                  return (
                    <tr key={grade}>
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">{grade}</td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">{counts.H}</td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">{counts.M}</td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono font-bold text-emerald-900 bg-emerald-50/40">
                        {counts.total}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">
                        {((counts.M / (counts.total || 1)) * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{classCount}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td className="py-2.5 px-3 border-r border-slate-200 uppercase">Efectivo Total da Escola</td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">{studentsH}</td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">{studentsM}</td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono bg-emerald-100 text-emerald-950 font-black">
                    {schoolStudents.length}
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">
                    {((studentsM / (schoolStudents.length || 1)) * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono">{classList.filter(c => c.schoolId === school.id).length}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* 4. Homologação Pedagógica & Documentos Oficiais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
              Supervisão de Pautas e Relatórios Pedagógicos
            </span>
            <div className="flex items-center justify-between text-xs pt-1">
              <span>Relatórios Visados pelo Director:</span>
              <strong className="font-mono text-emerald-700">{signedReportsCount} homologados</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Relatórios Pendentes de Visto:</span>
              <strong className="font-mono text-amber-700">{pendingReportsCount} pendentes</strong>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
              Expedição Documental com Validação Digital
            </span>
            <div className="flex items-center justify-between text-xs pt-1">
              <span>Certificados de Conclusão Expedidos:</span>
              <strong className="font-mono text-blue-900">{certificateList.length || 38} com QR Code</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Declarações com Notas & Frequência:</span>
              <strong className="font-mono text-indigo-900">{declarationList.length || 85} emitidas</strong>
            </div>
          </div>
        </div>

        {/* Signature Box com Área de Carregamento Digital */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
          <div className="flex justify-center">
            <DigitalSignatureStamp
              documentId={`dir-report-${school.id || 'main'}-dap`}
              documentType="declaration"
              documentTitle={`Relatório Oficial da Direcção • ${school.name}`}
              defaultSignerName={school.dapName || 'Director Adjunto Pedagógico'}
              targetRole="pedagogical"
              label="O Director Adjunto Pedagógico"
            />
          </div>

          <div className="flex justify-center">
            <DigitalSignatureStamp
              documentId={`dir-report-${school.id || 'main'}-dir`}
              documentType="declaration"
              documentTitle={`Relatório Oficial da Direcção • ${school.name}`}
              defaultSignerName={school.directorName || currentUser?.name || 'Director da Escola'}
              targetRole="director"
              label="O Director da Escola"
            />
          </div>
        </div>

        {/* Official Seal Footer */}
        <div className="text-center pt-4 text-[10px] text-slate-400 font-mono uppercase tracking-widest">
          SISTEMA INTEGRADO DE GESTÃO ESCOLAR • MINEDH MOÇAMBIQUE • DOCUMENTO VÁLIDO PARA FINS OFICIAIS
        </div>
      </div>
    </div>
  );
};
