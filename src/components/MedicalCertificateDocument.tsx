import React, { useState } from 'react';
import { Student, Class, School, MOZAMBIQUE_EMBLEM_URL } from '../types';
import { useStore } from '../store';
import { Button } from './ui';
import { 
  Printer, 
  Download, 
  ShieldCheck, 
  X, 
  CheckCircle, 
  FileText, 
  Stethoscope, 
  Heart, 
  Activity, 
  Calendar, 
  User, 
  Sparkles,
  Fingerprint,
  Award
} from 'lucide-react';
import { printDocument } from '../utils/printHelper';
import { StudentDocumentQRCode } from './StudentDocumentQRCode';
import { DigitalSignatureStamp } from './DigitalSignatureStamp';
import { DigitalSignatureModal } from './DigitalSignatureModal';
import { HeaderInstitucional } from './HeaderInstitucional';
import { ensureStudentCodeBeforeName } from '../utils/studentCodeValidator';

interface MedicalCertificateDocumentProps {
  student: Student;
  schoolClass?: Class;
  schoolName?: string;
  doctorName?: string;
  crmNumber?: string;
  healthCenterName?: string;
  academicYear?: number;
  onClose?: () => void;
  inline?: boolean;
}

export function MedicalCertificateDocument({
  student,
  schoolClass,
  schoolName: propSchoolName,
  doctorName = 'Dra. Luísa Celeste Mondlane',
  crmNumber = 'CRM-MZ-4892/2024',
  healthCenterName = 'Centro de Saúde Urbano Central de Maputo • MISAU',
  academicYear = 2026,
  onClose,
  inline = false
}: MedicalCertificateDocumentProps) {
  const { activeSchool } = useStore();
  const schoolName = propSchoolName || activeSchool?.name || 'Escola Secundária Central';
  const schoolProvince = activeSchool?.province || student?.province || 'Maputo Cidade';
  const schoolDistrict = activeSchool?.district || student?.district || 'KaMpfumo';

  const [signatureModalOpen, setSignatureModalOpen] = useState<boolean>(false);
  const [aptitudeType, setAptitudeType] = useState<'fit_general' | 'fit_sports' | 'restricted'>('fit_sports');
  const [bloodType, setBloodType] = useState<string>('O+');
  const [vaccineStatus, setVaccineStatus] = useState<string>('Plano Nacional de Vacinação Completo e Atualizado (PAV/MISAU)');
  const [observations, setObservations] = useState<string>(
    'O(A) examinando(a) não apresenta sinais clínicos de doenças infecto-contagiosas, défices sensoriais impeditivos, cardiopatias ou contra-indicações físicas/psíquicas para a frequência das actividades lectivas e de Educação Física escolar.'
  );

  const gradeLevel = schoolClass?.gradeLevel || student?.entryGrade || '10ª Classe';
  const className = schoolClass?.name || 'Turma A';
  const processNumber = student?.processCode || `PROC-${academicYear}-${(student?.id || '001').toUpperCase()}`;
  const certificateCode = `CERT-MED/MISAU-MINEDH/${academicYear}/${(student?.id || '001').toUpperCase()}`;
  const currentDateFormatted = new Intl.DateTimeFormat('pt-MZ', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  const handlePrint = () => {
    printDocument('medical-certificate-print-area');
  };

  return (
    <div className={
      inline
        ? "w-full py-2 flex flex-col items-center justify-start print:p-0 print:bg-white print:static"
        : "fixed inset-0 z-50 overflow-y-auto bg-slate-900/80  flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static"
    }>
      {/* Dynamic Print Rule */}
      <style>{`@media print { @page { size: A4 portrait !important; margin: 0 !important; } html, body { width: 210mm !important; height: 297mm !important; } }`}</style>

      {/* Top Action Bar */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 text-white rounded-t-xl p-4 flex flex-wrap items-center justify-between gap-3 sticky top-2 z-30 shadow-2xl print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Certificado Médico Escolar • Atestado de Sanidade
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 font-bold">
                Aptidão Física & Mental
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Documento Obrigatório para Matrícula, Renovação Escolar e Prática de Educação Física (MINEDH / MISAU)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setSignatureModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5 py-2 px-3.5 rounded-lg shadow-sm cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            Assinar Digitalmente
          </Button>

          <Button
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 py-2 px-4 rounded-lg shadow-md cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Imprimir A4
          </Button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main A4 Document Sheet */}
      <div 
        id="medical-certificate-print-area"
        className="w-full max-w-4xl bg-white border border-slate-300 shadow-2xl p-6 sm:p-10 text-slate-900 font-latex relative rounded-b-xl print:rounded-none print:border-none print:shadow-none print:max-w-none print:m-0 overflow-hidden box-border"
      >
        {/* ========================================================================= */}
        {/* EMBLEMA NACIONAL DE MOÇAMBIQUE NO FUNDO (WATERMARK BEM VISÍVEL SEM DESFOCAR) */}
        {/* ========================================================================= */}
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

        {/* Moldura Oficial Institucional com Fundo 100% Transparente */}
        <div className="relative z-10 border-4 border-[#064e3b] p-2 bg-transparent rounded-sm h-full flex flex-col justify-between">
          <div className="border border-[#059669] p-5 sm:p-7 bg-transparent rounded-xs flex-1 flex flex-col justify-between">
            
            {/* 1. CABEÇALHO OFICIAL GOVERNAMENTAL */}
            <HeaderInstitucional
              province={schoolProvince}
              district="KAMPFUMO"
              schoolName={schoolName}
              academicYear={academicYear || 2026}
              documentTitle="CERTIFICADO MÉDICO DE APTIDÃO ESCOLAR"
              documentSubtitle="(Atestado de Sanidade Física, Mental e Aptidão Desportiva)"
              emblemSize="lg"
              showBorderBottom={true}
            />

            {/* 2. CORPO DO CERTIFICADO / DECLARAÇÃO MÉDICA */}
            <div className="my-5 space-y-4 text-xs sm:text-sm leading-relaxed text-slate-950 font-sans bg-transparent">
              <p className="text-justify indent-6">
                Eu, abaixo-assinado, <strong className="font-bold text-[#064e3b]">{doctorName}</strong>, Médico de Clínica Geral com inscrição no Conselho Médico sob o n.º <strong className="font-mono font-bold text-slate-950">{crmNumber}</strong>, 
                exercendo funções no <strong className="font-bold text-slate-950">{healthCenterName}</strong>, certifico nos termos da legislação sanitária e educativa em vigor que examinei clinicamente o(a) seguinte cidadão(ã):
              </p>

              {/* TABELA DE IDENTIFICAÇÃO DO ESTUDANTE COM FUNDO TRANSPARENTE */}
              <div className="border-2 border-slate-900 rounded p-3.5 bg-transparent my-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-400 pb-1 flex-wrap gap-1">
                    <span className="text-slate-800 font-semibold">Nome Completo:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.5 rounded shadow-2xs select-all">
                        [{ensureStudentCodeBeforeName(student, { name: schoolName, province: student.province || schoolProvince, district: student.district }).code}]
                      </span>
                      <strong className="text-red-700 font-bold uppercase font-serif text-sm">{student.name}</strong>
                    </div>
                  </div>

                  <div className="flex justify-between border-b border-slate-400 pb-1">
                    <span className="text-slate-800 font-semibold">IUE (Identificação Única):</span>
                    <strong className="text-[#064e3b] font-mono font-bold">{student.iue || 'IUE-2026-0042'}</strong>
                  </div>

                  <div className="flex justify-between border-b border-slate-400 pb-1">
                    <span className="text-slate-800 font-semibold">Filiação:</span>
                    <strong className="text-slate-950">{student.fatherName || 'Pai'} e {student.motherName || 'Mãe'}</strong>
                  </div>

                  <div className="flex justify-between border-b border-slate-400 pb-1">
                    <span className="text-slate-800 font-semibold">Data de Nascimento:</span>
                    <strong className="text-slate-950">{student.birthDate || '12/04/2008'}</strong>
                  </div>

                  <div className="flex justify-between border-b border-slate-400 pb-1">
                    <span className="text-slate-800 font-semibold">Documento de Identificação:</span>
                    <strong className="text-slate-950 font-mono">{student.idCardNumber || student.nuit || (student as any).birthCertificateNumber || 'BI / Registo Civil Provisório'}</strong>
                  </div>

                  <div className="flex justify-between border-b border-slate-400 pb-1">
                    <span className="text-slate-800 font-semibold">Escola e Nível:</span>
                    <strong className="text-slate-950">{schoolName} ({gradeLevel} - {className})</strong>
                  </div>
                </div>
              </div>

              {/* 3. AVALIAÇÃO CLÍNICA E PARÂMETROS BIOMÉTRICOS (TABELA COM FUNDO TRANSPARENTE) */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-[#064e3b] tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-[#059669]" />
                  Resultados da Avaliação Clínica & Biometria:
                </h4>

                <table className="w-full border-collapse border-2 border-slate-900 text-xs font-sans bg-transparent">
                  <thead>
                    <tr className="bg-[#064e3b] text-white">
                      <th className="border border-slate-900 p-2 text-left font-bold w-1/3">Parâmetro de Saúde</th>
                      <th className="border border-slate-900 p-2 text-left font-bold w-1/3">Resultado Observado</th>
                      <th className="border border-slate-900 p-2 text-center font-bold w-1/3">Parecer Clínico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-transparent">
                    <tr>
                      <td className="border border-slate-900 p-2 font-semibold text-slate-900">Aparelho Cardiovascular & Tensão</td>
                      <td className="border border-slate-900 p-2 font-mono text-slate-950">Normal • Sem sopros ou arritmias</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-emerald-800">APTO</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 font-semibold text-slate-900">Aparelho Respiratório & Pulmonar</td>
                      <td className="border border-slate-900 p-2 font-mono text-slate-950">Murmúrio vesicular presente e limpo</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-emerald-800">APTO</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 font-semibold text-slate-900">Acuidade Visual e Auditiva</td>
                      <td className="border border-slate-900 p-2 font-mono text-slate-950">Conservada bilateralmente</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-emerald-800">APTO</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 font-semibold text-slate-900">Grupo Sanguíneo & Fator Rh</td>
                      <td className="border border-slate-900 p-2 font-mono font-bold text-blue-900">{bloodType}</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-emerald-800">CONFIRMADO</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 font-semibold text-slate-900">Estado Vacinal (PAV/MISAU)</td>
                      <td className="border border-slate-900 p-2 font-mono text-slate-950" colSpan={2}>{vaccineStatus}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4. PARECER CONCLUSIVO E APTIDÃO */}
              <div className="border-2 border-[#064e3b] p-4 rounded bg-transparent space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-full bg-emerald-800 text-white">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-black uppercase text-[#064e3b] tracking-wide">
                    CONCLUSÃO MÉDICA DE APTIDÃO ESCOLAR E DESPORTIVA:
                  </span>
                </div>
                
                <p className="text-xs text-slate-950 leading-relaxed font-serif">
                  {observations}
                </p>

                <div className="pt-1 flex items-center justify-between text-xs font-bold text-[#064e3b]">
                  <span>Classificação Final: <strong>APTO PARA O ANO LECTIVO {academicYear}</strong></span>
                  <span className="font-mono text-[11px]">Código: {certificateCode}</span>
                </div>
              </div>
            </div>

            {/* 5. VALIDAÇÃO DIGITAL, CARIMBOS E ASSINATURAS */}
            <div className="pt-4 border-t-2 border-[#064e3b] bg-transparent">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                
                {/* Código QR Oficial de Validação */}
                <div className="flex flex-col items-center justify-center p-2 rounded bg-transparent">
                  <StudentDocumentQRCode
                    student={student}
                    documentType="Certificado de Conclusão"
                    documentNumber={certificateCode}
                    academicYear={academicYear}
                    verificationUrl={`https://sige.minedh.gov.mz/verificar?iue=${encodeURIComponent(student.iue || student.id)}&tipo=MEDICO`}
                  />
                  <span className="text-[9px] text-slate-700 font-mono mt-1 text-center font-bold">
                    Homologação SIGE • MISAU
                  </span>
                </div>

                {/* Carimbo da Unidade Sanitária */}
                <div className="text-center space-y-1">
                  <div className="h-14 border border-dashed border-slate-400 rounded flex items-center justify-center text-[10px] text-slate-600 uppercase font-mono bg-transparent">
                    [ Carimbo em Óleo da Unidade Sanitária ]
                  </div>
                  <p className="text-[10px] text-slate-800 font-medium">
                    {schoolProvince}, {currentDateFormatted}
                  </p>
                </div>

                {/* Assinatura do Médico com Área para Carregamento de Assinatura Digital */}
                <div className="flex justify-center">
                  <DigitalSignatureStamp
                    documentId={certificateCode}
                    documentType="certificate"
                    documentTitle={`Certificado Médico • ${student.name}`}
                    defaultSignerName={doctorName}
                    targetRole="medical"
                    label={`Médico Examinador / ${crmNumber}`}
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
      </div>

      {/* Modal de Assinatura Digital */}
      {signatureModalOpen && (
        <DigitalSignatureModal
          isOpen={signatureModalOpen}
          onClose={() => setSignatureModalOpen(false)}
          onSignSuccess={() => {
            setSignatureModalOpen(false);
          }}
          documentId={student.id}
          documentType="certificate"
          documentTitle={`Certificado Médico • ${student.name}`}
          studentId={student.id}
          studentName={student.name}
          academicYear={academicYear}
        />
      )}
    </div>
  );
}
