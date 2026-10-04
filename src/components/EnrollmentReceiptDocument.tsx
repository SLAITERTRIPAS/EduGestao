import React, { useState } from 'react';
import { Student, Class, School, MOZAMBIQUE_EMBLEM_URL } from '../types';
import { useStore } from '../store';
import { Button } from './ui';
import { 
  Printer, 
  Download, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  FileText, 
  Award, 
  Calendar, 
  User, 
  Building2, 
  Receipt,
  QrCode,
  Fingerprint
} from 'lucide-react';
import { StudentDocumentQRCode } from './StudentDocumentQRCode';
import { DigitalSignatureStamp } from './DigitalSignatureStamp';
import { DigitalSignatureModal } from './DigitalSignatureModal';
import { generateEnrollmentReceiptPDF } from '../utils/pdfGenerator';
import { printDocument } from '../utils/printHelper';
import { getInstitutionalCode } from '../utils/institutionCode';
import { ensureStudentCodeBeforeName } from '../utils/studentCodeValidator';

interface EnrollmentReceiptDocumentProps {
  student: Student;
  schoolClass?: Class;
  schoolName?: string;
  directorName?: string;
  academicYear?: number;
  onClose?: () => void;
  inline?: boolean;
}

export const EnrollmentReceiptDocument: React.FC<EnrollmentReceiptDocumentProps> = ({
  student,
  schoolClass: propSchoolClass,
  schoolName: propSchoolName,
  directorName: propDirectorName,
  academicYear: propAcademicYear,
  onClose,
  inline = false
}) => {
  const { 
    activeSchool = null, 
    classes = [], 
    schools = [], 
    currentUser = null 
  } = useStore() || {};
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  const school = activeSchool || schools.find(s => s.id === student.schoolId) || schools[0];
  const schoolName = propSchoolName || school?.name || 'Escola Secundária Josina Machel';
  const directorName = propDirectorName || school?.directorName || 'Prof. Doutor Zacarias Manuel Tembe';
  const schoolProvince = school?.province || student.province || 'Cidade de Maputo';
  const schoolDistrict = school?.district || student.district || 'Distrito Urbano de KaMpfumo';

  const currentClass = propSchoolClass || classes.find(c => c.id === student.classId) || {
    id: 'c1',
    schoolId: school?.id || 's1',
    name: (student as any).className || 'Turma 01',
    gradeLevel: student.entryGrade || '10ª Classe',
    year: student.academicYear || 2026,
    shift: 'Diurno',
    room: 'Sala 04'
  } as Class;

  const academicYear = propAcademicYear || student.academicYear || currentClass?.year || 2026;
  const gradeLevel = currentClass?.gradeLevel || student.entryGrade || '10ª Classe';
  const className = currentClass?.name || (student as any).className || 'Turma A';
  const shift = currentClass?.shift || 'Diurno / Manhã';
  const room = (currentClass as any)?.room || 'Sala 05';

  const receiptNumber = `REC-MAT-${academicYear}-${(student.id || '001').toUpperCase()}`;
  const enrollmentDate = student.enrollmentDate || student.openingDate || `02/02/${academicYear}`;
  const enrollmentType = student.reactivationStatus === 'MATRICULA_ATIVA' 
    ? 'Renovação Automática de Matrícula (Transição Contínua)' 
    : 'Matrícula Oficial / Confirmação de Vaga';

  // Percurso Histórico Unificado
  const academicHistory = student.academicHistory && student.academicHistory.length > 0 
    ? student.academicHistory 
    : [
        { year: academicYear - 2, grade: '8ª Classe', school: schoolName, result: 'Aprovado' },
        { year: academicYear - 1, grade: '9ª Classe', school: schoolName, result: 'Aprovado' },
        { year: academicYear, grade: gradeLevel, school: schoolName, result: 'Matrícula Activa' }
      ];

  const handlePrint = () => {
    printDocument();
  };

  const handleDownloadPDF = () => {
    generateEnrollmentReceiptPDF({
      student,
      schoolName,
      classes: classes || [],
      academicYear
    });
  };

  return (
    <div className={`bg-slate-100 ${inline ? 'p-0' : 'p-4 sm:p-6 lg:p-8 min-h-screen'}`}>
      
      {/* Top Action Bar (Hidden in Print) */}
      <div className="max-w-4xl mx-auto mb-6 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-slate-950 rounded-xl font-black">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              <span>Recibo Oficial de Matrícula e Renovação</span>
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                MINEDH • SIGE
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Histórico Académico Unificado e Contínuo • Processo Único do Estudante
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setIsSignModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl gap-1.5 cursor-pointer"
          >
            <Fingerprint className="h-4 w-4" />
            <span>Assinar Digitalmente</span>
          </Button>

          <Button
            onClick={handleDownloadPDF}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl gap-1.5 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Baixar PDF</span>
          </Button>

          <Button
            onClick={handlePrint}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl gap-1.5 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir Recibo</span>
          </Button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OFICIAL DOCUMENT SHEET: A4 PORTRAIT RECIBO DE MATRICULA                   */}
      {/* ========================================================================= */}
      <div 
        id="printable-official-document" 
        className="max-w-[210mm] mx-auto bg-white border border-slate-300 shadow-2xl p-8 sm:p-12 text-slate-900 font-serif relative rounded-sm print:p-6 print:border-none print:shadow-none print:max-w-none print:m-0 overflow-hidden"
      >
        {/* Emblema da República de Moçambique no Fundo (Nítido e Bem Visível) */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
          aria-hidden="true"
        >
          <img
            src={MOZAMBIQUE_EMBLEM_URL}
            alt="Emblema da República de Moçambique"
            className="w-[360px] h-[360px] object-contain drop-shadow-sm"
            style={{ opacity: 0.22 }}
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Moldura Ornamental Institucional */}
        <div className="border-4 border-double border-slate-900 p-6 sm:p-8 rounded-sm bg-transparent relative z-10">
          
          {/* 1. CABEÇALHO GOVERNAMENTAL COM EMBLEMA DE MOÇAMBIQUE */}
          <div className="text-center pb-5 border-b-2 border-slate-900 relative bg-transparent">
            
            {/* Logotipo / Emblema Oficial com Fundo Transparente */}
            <div className="flex justify-center mb-3 bg-transparent">
              <img 
                src={MOZAMBIQUE_EMBLEM_URL} 
                alt="Emblema da República de Moçambique" 
                className="h-24 w-24 object-contain bg-transparent drop-shadow-sm select-none" 
                referrerPolicy="no-referrer"
              />
            </div>

            <h1 className="text-base font-black tracking-wider text-slate-950 uppercase font-serif">
              República de Moçambique
            </h1>
            <h2 className="text-xs font-bold tracking-wide text-slate-800 uppercase font-sans mt-0.5">
              Ministério da Educação e Desenvolvimento Humano
            </h2>
            <h3 className="text-xs font-bold text-slate-800 uppercase font-sans">
              Direcção Provincial da Educação de: {schoolProvince.toUpperCase()}
            </h3>
            <h4 className="text-xs font-medium text-slate-700 uppercase font-sans">
              Serviços Distritais de Educação, Juventude e Tecnologia de: {schoolDistrict.toUpperCase()}
            </h4>
            <div className="mt-1 text-sm font-black text-blue-950 uppercase tracking-wide">
              {schoolName.toUpperCase()}
            </div>
            <p className="text-xs font-mono font-bold text-blue-900 mt-0.5">
              CÓDIGO INSTITUCIONAL: {getInstitutionalCode(school)} • ANO LECTIVO {academicYear || 2026}
            </p>

            {/* Selo e Chave de Registo */}
            <div className="mt-3 inline-flex items-center gap-2 bg-blue-950 text-white px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
              <span>SISTEMA NACIONAL DE EDUCAÇÃO • SIGE</span>
            </div>
          </div>

          {/* 2. TÍTULO DO DOCUMENTO */}
          <div className="my-6 text-center">
            <div className="inline-block border-y-2 border-slate-900 py-1.5 px-6 bg-transparent">
              <h2 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-wide">
                RECIBO OFICIAL DE MATRÍCULA E RENOVAÇÃO
              </h2>
              <p className="text-[10px] font-sans font-bold text-amber-800 uppercase tracking-widest mt-0.5">
                Âmbito do Histórico Académico Unificado e Contínuo • Ano Lectivo {academicYear}
              </p>
            </div>
          </div>

          {/* 3. DADOS PRINCIPAIS DO RECIBO & IDENTIFICAÇÃO DO ALUNO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 bg-transparent p-4 rounded-xl border-2 border-slate-800 font-sans text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-700 uppercase block">N.º do Recibo de Matrícula</span>
              <span className="font-mono font-black text-blue-950 text-sm">{receiptNumber}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-700 uppercase block">IUE (ID Único do Estudante)</span>
              <span className="font-mono font-black text-slate-900 text-sm">{student.iue || 'IUE-2026-REG'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-700 uppercase block">Data de Emissão & Validação</span>
              <span className="font-bold text-slate-800">{enrollmentDate}</span>
            </div>
          </div>

          {/* 4. DADOS PESSOAIS DO ESTUDANTE */}
          <div className="mb-6 bg-transparent p-5 rounded-xl border-2 border-slate-800 font-sans text-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-400 pb-2">
              <User className="h-4 w-4 text-blue-900" />
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs font-serif">
                1. Identificação do Aluno
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Código Institucional & Nome do Aluno</span>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50/95 border border-blue-200 px-2 py-0.5 rounded shadow-2xs select-all">
                    [{ensureStudentCodeBeforeName(student, { name: schoolName, province: student.province, district: student.district }).code}]
                  </span>
                  <span className="text-sm font-black text-slate-950 uppercase">{student.name}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Nº de Processo / NIM</span>
                <span className="font-mono font-bold text-slate-900">{student.processCode || `PROC-${student.id}`} | NIM: {student.nim || 'N/D'}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Documento de Identificação (BI / Certidão)</span>
                <span className="font-bold text-slate-900">{student.idCardNumber || student.nuit || 'Documento Arquivado'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Data de Nascimento</span>
                <span className="font-bold text-slate-900">{student.birthDate || '01/01/2010'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Sexo / Género</span>
                <span className="font-bold text-slate-900">{student.gender === 'F' ? 'Feminino (Mulher)' : 'Masculino (Homem)'}</span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Filiação (Nome dos Pais)</span>
                <span className="text-slate-800">{student.fatherName || 'Pai'} & {student.motherName || 'Mãe'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Encarregado de Educação</span>
                <span className="text-slate-800">{student.guardianName || student.motherName || 'Encarregado Registado'}</span>
              </div>
            </div>
          </div>

          {/* 5. DETALHES DA MATRÍCULA E ENQUADRAMENTO ESCOLAR */}
          <div className="mb-6 bg-transparent p-5 rounded-xl border-2 border-slate-800 font-sans text-xs space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-400 pb-2">
              <Building2 className="h-4 w-4 text-blue-900" />
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs font-serif">
                2. Enquadramento da Matrícula no Ano Lectivo {academicYear}
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Classe / Grau</span>
                <span className="font-black text-blue-900 text-sm">{gradeLevel}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Turma Alocada</span>
                <span className="font-black text-slate-900 text-sm">{className}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Turno</span>
                <span className="font-bold text-slate-800">{shift}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Sala de Aulas</span>
                <span className="font-bold text-slate-800">{room}</span>
              </div>

              <div className="col-span-2">
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Regime / Curso</span>
                <span className="font-bold text-slate-900">{student.course || 'Ensino Secundário Geral (ESG)'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Tipo de Operação</span>
                <span className="font-bold text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {enrollmentType}
                </span>
              </div>
            </div>
          </div>

          {/* 6. HISTÓRICO ACADÉMICO UNIFICADO E CONTÍNUO (PERCURSO FORMATIVO) */}
          <div className="mb-6 bg-transparent p-5 rounded-xl border-2 border-slate-800 font-sans text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-400 pb-2">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-900" />
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs font-serif">
                  3. Percurso no Histórico Académico Unificado e Contínuo
                </h3>
              </div>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                Princípio do Processo Único
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-2 border-slate-900 bg-transparent">
                <thead className="bg-slate-100 text-slate-900 font-bold border-b-2 border-slate-900">
                  <tr>
                    <th className="p-2 border-r border-slate-900">Ano</th>
                    <th className="p-2 border-r border-slate-900">Classe</th>
                    <th className="p-2 border-r border-slate-900">Estabelecimento de Ensino</th>
                    <th className="p-2">Situação de Transição / Aproveitamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-transparent">
                  {academicHistory.map((h, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-mono font-bold text-blue-950 border-r border-slate-900">{h.year}</td>
                      <td className="p-2 font-bold text-slate-900 border-r border-slate-900">{h.grade}</td>
                      <td className="p-2 text-slate-800 border-r border-slate-900">{h.school}</td>
                      <td className="p-2 font-bold text-emerald-800">{h.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-600 italic mt-1">
              * O registo individual do estudante é único, contínuo e transferível automaticamente em todo o território nacional através do SIGE.
            </p>
          </div>

          {/* 7. SITUAÇÃO FINANCEIRA E EMOLUMENTOS */}
          <div className="mb-6 bg-transparent p-4 rounded-xl border-2 border-slate-800 font-sans text-xs flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-700 uppercase block">Situação de Emolumentos & Taxas de Matrícula</span>
              <p className="font-black text-slate-900 text-sm flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
                Matrícula Gratuita / Isenção Governamental Homologada (MINEDH)
              </p>
              <p className="text-[10px] text-slate-700">
                Taxa de Inscrição: 0,00 MT | Processamento Digital Isento
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-700 uppercase block">Estado do Recibo</span>
              <span className="bg-emerald-600 text-white font-mono font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                CONFIRMADO & ACTIVO
              </span>
            </div>
          </div>

          {/* 8. AUTENTICAÇÃO DIGITAL, QR CODE & ASSINATURAS */}
          <div className="pt-6 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-6 font-sans">
            
            {/* QR Code de Validação Oficial SIGE */}
            <div className="flex items-center gap-3">
              <StudentDocumentQRCode
                student={student}
                schoolName={schoolName}
                documentType={("Recibo de Matrícula" as any)}
                documentNumber={receiptNumber}
                academicYear={academicYear}
                gradeLevel={gradeLevel}
                size={85}
                variant="compact"
              />
              <div className="text-[9.5px] leading-tight text-slate-600 space-y-0.5 max-w-[200px]">
                <p className="font-bold text-slate-900 uppercase">Validação Governamental</p>
                <p>Verifique a autenticidade deste recibo no portal oficial:</p>
                <p className="font-mono text-blue-900 font-bold text-[8.5px]">sige.minedh.gov.mz/verificar</p>
                <p className="text-[8px] text-slate-500">Chave: {receiptNumber}</p>
              </div>
            </div>

            {/* Bloco de Assinaturas com Área para Carregamento de Assinatura Digital */}
            <div className="flex flex-col items-center sm:items-end">
              <DigitalSignatureStamp
                documentId={receiptNumber}
                documentType="declaration"
                documentTitle={`Recibo de Matrícula • ${student.name}`}
                defaultSignerName={directorName}
                targetRole="director"
                label="O Chefe da Secretaria Escolar / Director"
                studentId={student.id}
                studentName={student.name}
                gradeLevel={gradeLevel}
                academicYear={academicYear}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
