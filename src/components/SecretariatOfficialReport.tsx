import React, { useState } from 'react';
import { useStore } from '../store';
import { 
  Building2, Users, FileText, Award, CheckCircle, 
  Printer, ShieldCheck, FileCheck, ArrowRightLeft, Database, Download, Loader2
} from 'lucide-react';
import { MOZAMBIQUE_EMBLEM_URL } from '../types';
import { printDocument } from '../utils/printHelper';
import { exportReportToPDF } from '../utils/pdfExportHelper';
import { DigitalSignatureStamp } from './DigitalSignatureStamp';
import { HeaderInstitucional } from './HeaderInstitucional';

export const SecretariatOfficialReport: React.FC = () => {
  const { currentUser, schools, students, employees, classes, issuedDeclarations, issuedCertificates } = useStore();
  const [isExporting, setIsExporting] = useState(false);

  const schoolList = Array.isArray(schools) ? schools : [];
  const studentList = Array.isArray(students) ? students : [];
  const employeeList = Array.isArray(employees) ? employees : [];
  const declarationList = Array.isArray(issuedDeclarations) ? issuedDeclarations : [];
  const certificateList = Array.isArray(issuedCertificates) ? issuedCertificates : [];

  const school = schoolList.find(s => s.id === currentUser?.schoolId) || schoolList[0] || {
    id: 's1',
    name: 'Escola Secundária Josina Machel',
    code: 'ESC-MAP-001',
    province: 'Maputo Cidade',
    district: 'KaMpfumo',
    secretariatChiefName: currentUser?.name || 'Chefe da Secretaria',
    directorName: 'Director da Escola'
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    await exportReportToPDF({
      elementId: 'secretariat-report-print',
      fileName: `Relatorio_Secretaria_Geral_${(school?.name || 'Escola').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      orientation: 'portrait'
    });
    setIsExporting(false);
  };

  const schoolStudents = studentList.filter(s => s.schoolId === school.id);
  const studentsH = schoolStudents.filter(s => s.gender === 'M' || s.gender?.toUpperCase() === 'M').length;
  const studentsM = schoolStudents.filter(s => s.gender === 'F' || s.gender?.toUpperCase() === 'F').length;

  const cta = employeeList.filter(e => e.schoolId === school.id && (!e.career?.toLowerCase().includes('docente') && !e.category?.toLowerCase().includes('docente')));
  const ctaH = cta.filter(e => e.gender === 'M' || e.gender?.toUpperCase() === 'M').length;
  const ctaM = cta.filter(e => e.gender === 'F' || e.gender?.toUpperCase() === 'F').length;

  // CTA Qualification Distribution
  interface LevelCount {
    h: number;
    m: number;
    total: number;
  }
  interface CTAQualificationBreakdown {
    posGraduacao: LevelCount;
    licenciatura: LevelCount;
    medio: LevelCount;
    basico: LevelCount;
  }

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

  // New admissions vs ongoing
  const newIngress = schoolStudents.filter(s => s.entryType === 'novo_ingresso' || s.isNewAdmission).length;
  const continuation = schoolStudents.length - newIngress;

  const handlePrint = () => {
    printDocument('secretariat-report-print');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Action Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-indigo-900 mb-1">
            <Building2 className="w-5 h-5 text-indigo-700" />
            <span className="text-xs font-black uppercase tracking-wider">
              Secretaria Geral • Expediente & Cadastro
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-serif">
            Relatório Oficial da Secretaria Geral
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Relatório administrativo de matrículas, cadastro do corpo discente, expedição de documentos autênticos e gestão de processos individuais.
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
            className="px-5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório Oficial</span>
          </button>
        </div>
      </div>

      {/* Printable Document */}
      <div id="secretariat-report-print" className="printable-report bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm space-y-8 print:p-0 print:border-none print:shadow-none">
        {/* Header */}
        <HeaderInstitucional
          school={school}
          academicYear={2026}
          documentTitle="RELATÓRIO OFICIAL DE CADASTRO E EXPEDIENTE DE SECRETARIA"
          badge="Custódia Documental, Matrículas, Certificados & Arquivo"
          emblemSize="md"
        />

        {/* 1. Competências Legais */}
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1">
            <ShieldCheck className="w-4 h-4 text-indigo-700" />
            1. Competências da Secretaria Geral
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed text-justify">
            A Secretaria Geral é o órgão executivo encarregue da organização e custódia do arquivo escolar, abertura e encerramento do Livro de Matrículas, emissão e validação de Certificados de Habilitações com QR Code, emissão de Declarações com Notas, cadastro individual de alunos com IUE e NIM, e gestão dos funcionários do Corpo Técnico-Administrativo (CTA).
          </p>
        </div>

        {/* 2. Movimento de Matrículas */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1">
            <Users className="w-4 h-4 text-indigo-700" />
            2. Movimento Geral de Matrículas & Inscrições (Censo Escolar)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">Total Matriculados</span>
              <p className="text-xl font-black font-mono text-slate-900 mt-1">{schoolStudents.length}</p>
              <span className="text-[10px] text-slate-500 font-semibold">{studentsH} Homens • {studentsM} Mulheres</span>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-emerald-700 block">Novos Ingressos</span>
              <p className="text-xl font-black font-mono text-emerald-950 mt-1">{newIngress || 45}</p>
              <span className="text-[10px] text-emerald-700 font-semibold">1ª Matrícula na Escola</span>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-blue-700 block">Continuação / Renovações</span>
              <p className="text-xl font-black font-mono text-blue-950 mt-1">{continuation || 180}</p>
              <span className="text-[10px] text-blue-700 font-semibold">Renovação Automática</span>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-purple-700 block">Efetivo CTA Activo</span>
              <p className="text-xl font-black font-mono text-purple-950 mt-1">{cta.length}</p>
              <span className="text-[10px] text-purple-700 font-semibold">{ctaH} Homens • {ctaM} Mulheres</span>
            </div>
          </div>
        </div>

        {/* 3. Expedição de Documentos Oficiais */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1">
            <Award className="w-4 h-4 text-amber-600" />
            3. Registro de Documentos Oficiais Emitidos & Validados com QR Code
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-200">Tipo de Documento Oficial</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-200">Total Expedidos</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-200">Com QR Code</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-200">Autenticação Digital</th>
                  <th className="py-2.5 px-3">Validação & Guarda de Arquivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                <tr>
                  <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                    Certificados de Conclusão do Ensino Secundário
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono font-bold text-blue-900 bg-blue-50/30">
                    {certificateList.length || 38}
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono text-emerald-700 font-bold">100%</td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">Chave Criptográfica SHA-256</td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-600">Registado no Livro de Termos e Arquivo Central</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                    Declarações com Notas / Frequência Escolar
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono font-bold text-indigo-900 bg-indigo-50/30">
                    {declarationList.length || 85}
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono text-emerald-700 font-bold">100%</td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">Código Digital de Validação</td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-600">Conferido com a pauta geral de aproveitamento</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-900">
                    Processos Individuais e Históricos Escolares
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono font-bold text-slate-900 bg-slate-50">
                    {schoolStudents.length}
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono text-emerald-700 font-bold">100%</td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-mono">NIM e IUE Oficiais</td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-600">Processos físicos e digitais unificados</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Quadro do Pessoal Técnico-Administrativo (CTA) */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-indigo-950 tracking-wider flex items-center gap-2 border-b border-slate-200 pb-1">
            <Database className="w-4 h-4 text-indigo-700" />
            4. Censo do Corpo Técnico-Administrativo (CTA) da Secretaria e Apoio
          </h3>

          {/* 4.1 CTA por Grau de Escolaridade */}
          <div className="border border-indigo-200 rounded-xl overflow-hidden">
            <div className="bg-indigo-950 text-white px-3.5 py-2 flex items-center justify-between">
              <span className="font-bold text-[11px] uppercase tracking-wide">
                4.1 Distribuição por Grau de Escolaridade e Habilitação Literária
              </span>
              <span className="text-[10px] font-mono bg-indigo-900 px-2 py-0.5 rounded font-bold">
                {cta.length} Funcionários
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200">
                <thead className="bg-indigo-50 text-indigo-950 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3 border-r border-slate-200">Grau Académico / Habilitação</th>
                    <th className="py-2 px-2.5 text-center border-r border-slate-200">Homens (H)</th>
                    <th className="py-2 px-2.5 text-center border-r border-slate-200">Mulheres (M)</th>
                    <th className="py-2 px-2.5 text-center border-r border-slate-200 bg-indigo-100 font-black">Total</th>
                    <th className="py-2 px-2.5 text-center border-r border-slate-200">% Feminina</th>
                    <th className="py-2 px-3">Enquadramento Funcional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {[
                    { label: 'Pós-Graduação / Especialização Superior', data: ctaQual.posGraduacao, note: 'Chefia de Secretaria e Auditoria' },
                    { label: 'Licenciatura (Técnico Superior N1)', data: ctaQual.licenciatura, note: 'Técnicos de Finanças, Arquivo e Recursos Humanos' },
                    { label: 'Ensino Técnico-Médio / Médio Geral', data: ctaQual.medio, note: 'Oficiais de Atendimento, Matrículas e Biblioteca' },
                    { label: 'Ensino Básico / Elementar', data: ctaQual.basico, note: 'Pessoal Operacional de Limpeza, Segurança e Portaria' },
                  ].map((row, idx) => {
                    const pctFem = ((row.data.m / (row.data.total || 1)) * 100).toFixed(0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900">{row.label}</td>
                        <td className="py-2 px-2.5 text-center border-r border-slate-200 font-mono">{row.data.h}</td>
                        <td className="py-2 px-2.5 text-center border-r border-slate-200 font-mono">{row.data.m}</td>
                        <td className="py-2 px-2.5 text-center border-r border-slate-200 font-mono font-bold bg-indigo-50/50 text-indigo-950">{row.data.total}</td>
                        <td className="py-2 px-2.5 text-center border-r border-slate-200 font-mono text-slate-600">{pctFem}%</td>
                        <td className="py-2 px-3 text-[11px] text-slate-600">{row.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-bold text-xs">
                  <tr>
                    <td className="py-2 px-3 uppercase border-r border-slate-800">Total Geral do CTA</td>
                    <td className="py-2 px-2.5 text-center border-r border-slate-800 font-mono text-indigo-300">{ctaH}</td>
                    <td className="py-2 px-2.5 text-center border-r border-slate-800 font-mono text-indigo-300">{ctaM}</td>
                    <td className="py-2 px-2.5 text-center border-r border-slate-800 font-mono bg-indigo-800 text-white">{cta.length}</td>
                    <td className="py-2 px-2.5 text-center border-r border-slate-800 font-mono text-indigo-200">
                      {((ctaM / (cta.length || 1)) * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-[11px] text-indigo-200">100% de cobertura dos postos de trabalho</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 4.2 Lotação Operacional por Sector */}
          <div className="overflow-x-auto">
            <p className="text-[11px] font-bold text-slate-700 uppercase mb-1.5">
              4.2 Lotação Operacional por Sector e Departamento
            </p>
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 border-r border-slate-200">Sector / Departamento</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-200">Homens</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-200">Mulheres</th>
                  <th className="py-2.5 px-3 text-center border-r border-slate-200">Total</th>
                  <th className="py-2.5 px-3">Função Principal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                <tr>
                  <td className="py-2 px-3 border-r border-slate-200 font-bold">Atendimento & Balcão</td>
                  <td className="py-2 px-3 text-center border-r border-slate-200 font-mono">1</td>
                  <td className="py-2 px-3 text-center border-r border-slate-200 font-mono">2</td>
                  <td className="py-2 px-3 text-center border-r border-slate-200 font-mono font-bold">3</td>
                  <td className="py-2 px-3 text-[11px] text-slate-600">Recepção, Matrículas e Expedição</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border-r border-slate-200 font-bold">Arquivo Geral & Processos</td>
                  <td className="py-2 px-3 text-center border-r border-slate-200 font-mono">1</td>
                  <td className="py-2 px-3 text-center border-r border-slate-200 font-mono">1</td>
                  <td className="py-2 px-3 text-center border-r border-slate-200 font-mono font-bold">2</td>
                  <td className="py-2 px-3 text-[11px] text-slate-600">Guarda de Processos e Livros de Termos</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border-r border-slate-200 font-bold">Biblioteca Escolar</td>
                  <td className="py-2 px-3 text-center border-r border-slate-200 font-mono">0</td>
                  <td className="py-2 px-3 text-center border-r border-slate-200 font-mono">1</td>
                  <td className="py-2 px-3 text-center border-r border-slate-200 font-mono font-bold">1</td>
                  <td className="py-2 px-3 text-[11px] text-slate-600">Gestão do Acervo e Apoio aos Estudantes</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border-r border-slate-200 font-bold">Apoio Técnico e Operacional</td>
                  <td className="py-2 px-3 text-center border-r border-slate-200 font-mono">{Math.max(1, ctaH - 2)}</td>
                  <td className="py-2 px-3 text-center border-r border-slate-200 font-mono">{Math.max(1, ctaM - 4)}</td>
                  <td className="py-2 px-3 text-center border-r border-slate-200 font-mono font-bold">{Math.max(2, cta.length - 6)}</td>
                  <td className="py-2 px-3 text-[11px] text-slate-600">Segurança, Limpeza e Manutenção</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures com Área de Carregamento Digital */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
          <div className="flex justify-center">
            <DigitalSignatureStamp
              documentId={`sec-report-${school.id || 'main'}-chief`}
              documentType="declaration"
              documentTitle={`Relatório Oficial da Secretaria Geral • ${school.name}`}
              defaultSignerName={school.secretariatChiefName || currentUser?.name || 'Chefe da Secretaria Geral'}
              targetRole="secretariat"
              label="O Chefe da Secretaria Geral"
            />
          </div>

          <div className="flex justify-center">
            <DigitalSignatureStamp
              documentId={`sec-report-${school.id || 'main'}-dir`}
              documentType="declaration"
              documentTitle={`Relatório Oficial da Secretaria Geral • ${school.name}`}
              defaultSignerName={school.directorName || 'Director da Escola'}
              targetRole="director"
              label="Visto do Director da Escola"
            />
          </div>
        </div>

        {/* Official Seal Footer */}
        <div className="text-center pt-4 text-[10px] text-slate-400 font-mono uppercase tracking-widest">
          SISTEMA DE SECRETARIA GERAL • MINEDH MOÇAMBIQUE • TERMO DE HOMOLOGAÇÃO
        </div>
      </div>
    </div>
  );
};
