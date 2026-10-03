import React from 'react';
import { Printer, X, FileText, CheckCircle2, Building2, User, Calendar, ShieldCheck } from 'lucide-react';
import { Student } from '../types';
import { printDocument } from '../utils/printHelper';
import { DigitalSignatureStamp } from './DigitalSignatureStamp';

interface TransferDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  originSchoolName?: string;
  targetProvinceName?: string;
  targetDistrictName?: string;
  targetSchoolName?: string;
  reason?: string;
  requestDate?: string;
}

export const TransferDocumentModal: React.FC<TransferDocumentModalProps> = ({
  isOpen,
  onClose,
  student,
  originSchoolName = 'Escola Secundária Josina Machel',
  targetProvinceName = 'Maputo Província',
  targetDistrictName = 'Matola',
  targetSchoolName = 'Escola Secundária da Matola',
  reason = 'Mudança de residência do agregado familiar para outro município/distrito',
  requestDate = new Date().toLocaleDateString('pt-PT')
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    printDocument('transfer-minuta-print');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80  flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static">
      
      {/* Top Action Bar (Hidden in Print) */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 text-white rounded-t-xl p-4 flex items-center justify-between shadow-2xl sticky top-2 z-30 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Minuta Oficial de Pedido de Transferência • Papel A4 Vertical
            </h2>
            <p className="text-xs text-slate-400">
              Aluno: <strong className="text-white">{student.name}</strong> • Processo: <span className="font-mono text-slate-300">{student.processCode || student.iue}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4" /> Imprimir Documento A4
          </button>
          <button
            onClick={onClose}
            className="px-3 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
          >
            <X className="h-4 w-4" /> Fechar
          </button>
        </div>
      </div>

      {/* Main A4 Document Container (Vertical 210mm x 297mm) */}
      <div 
        id="transfer-minuta-print"
        className="a4-portrait-document max-w-[210mm] w-full min-h-[297mm] mx-auto bg-white p-8 sm:p-12 border border-slate-300 shadow-2xl print:shadow-none print:border-none print:p-6 print:m-0 relative font-serif text-slate-900"
      >
        {/* Marca d'Água do Brasão Nacional */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Emblem_of_Mozambique.svg/600px-Emblem_of_Mozambique.svg.png"
            alt=""
            className="w-80 h-80 object-contain opacity-5 filter grayscale"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="relative z-10 space-y-6">
          
          {/* Cabeçalho Oficial */}
          <div className="text-center space-y-1 border-b-2 border-slate-900 pb-4">
            <div className="flex justify-center mb-2">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Emblem_of_Mozambique.svg/600px-Emblem_of_Mozambique.svg.png"
                alt="República de Moçambique"
                className="h-16 w-16 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-xs font-bold tracking-[0.25em] uppercase">
              República de Moçambique
            </h2>
            <h3 className="text-xs font-black uppercase tracking-wider">
              Ministério da Educação e Desenvolvimento Humano
            </h3>
            <p className="text-[11px] font-bold uppercase text-slate-700">
              {originSchoolName}
            </p>
            <div className="inline-block bg-slate-900 text-white text-[10.5px] font-bold uppercase tracking-widest px-4 py-1 mt-2 rounded">
              Requerimento Oficial & Minuta de Pedido de Transferência
            </div>
          </div>

          {/* Destinatário */}
          <div className="text-xs font-sans space-y-1">
            <p className="font-bold text-slate-900">
              Exmo(a). Senhor(a) Director(a) da {originSchoolName}
            </p>
            <p className="text-slate-700">
              {student.province || 'Maputo'} — República de Moçambique
            </p>
          </div>

          {/* Corpo da Minuta */}
          <div className="text-xs leading-relaxed text-justify space-y-3 font-serif">
            <p>
              Eu, abaixo-assinado, <strong className="uppercase font-sans">{student.guardianName || student.fatherName || 'Encarregado de Educação'}</strong>, 
              na qualidade de Encarregado(a) de Educação do(a) aluno(a) <strong className="uppercase font-sans">{student.name}</strong>, 
              nascido(a) a <strong>{student.birthDate || '12/05/2009'}</strong>, 
              natural de <strong>{student.birthPlace || student.district || 'Kamavota'}</strong>, 
              província de <strong>{student.birthProvince || student.province || 'Maputo Cidade'}</strong>, 
              portador(a) do B.I. nº <strong>{student.idCardNumber || '110100234567M'}</strong>, 
              titular do IUE nº <strong className="font-mono">{student.iue}</strong> e Processo Individual nº <strong className="font-mono">{student.processCode || student.studentNumber}</strong>, 
              frequentando presentemente a <strong>{student.entryGrade || '10ª Classe'}</strong>, turma regular desta instituição de ensino;
            </p>

            <p>
              Vem mui respeitosamente requerer a V. Excia. se digne conceder a <strong>TRANSFERÊNCIA ESCOLAR</strong> do(a) referido(a) educando(a) com destino ao seguinte estabelecimento de ensino:
            </p>

            {/* Caixa com Dados da Escola de Destino */}
            <div className="border border-slate-300 bg-slate-50 p-3.5 rounded font-sans text-xs space-y-1.5 my-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 text-[11px] block">Província de Destino:</span>
                  <strong className="text-slate-900">{targetProvinceName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Distrito de Destino:</span>
                  <strong className="text-slate-900">{targetDistrictName}</strong>
                </div>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Escola Pretendida:</span>
                <strong className="text-blue-900">{targetSchoolName}</strong>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Motivo Fundamentado:</span>
                <span className="text-slate-800 italic">"{reason}"</span>
              </div>
            </div>

            <p>
              Mais declara sob compromisso de honra que o educando se encontra em dia com os seus deveres escolares e que junta a este requerimento os comprovativos necessários para a devida instrução processual.
            </p>

            <p className="text-right pt-2 font-sans text-xs">
              Pede Deferimento.
            </p>

            <p className="text-right font-sans text-xs">
              {student.province || 'Maputo'}, aos {requestDate}.
            </p>
          </div>

          {/* Assinatura do Requerente */}
          <div className="pt-4 flex justify-center">
            <DigitalSignatureStamp
              documentId={`transf-req-${student.id}`}
              documentType="transfer"
              documentTitle={`Minuta de Transferência • ${student.name}`}
              defaultSignerName={student.guardianName || student.fatherName || 'Encarregado(a) de Educação'}
              targetRole="guardian"
              label="Assinatura do(a) Requerente"
              studentId={student.id}
              studentName={student.name}
            />
          </div>

          {/* Parecer da Secretaria & Despacho do Diretor */}
          <div className="border-t-2 border-slate-900 pt-4 space-y-3 font-sans text-xs">
            <div className="bg-slate-100 p-2.5 rounded border border-slate-200">
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-700 block mb-1">
                Informação da Secretaria Geral:
              </span>
              <p className="text-[11px] text-slate-700">
                O(A) aluno(a) possui o processo regularizado, tendo aproveitamento averbado até ao presente trimestre lectivo. Não constam pendências materiais ou de propinas na Tesouraria.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3 text-center">
              <div className="flex justify-center">
                <DigitalSignatureStamp
                  documentId={`transf-sec-${student.id}`}
                  documentType="transfer"
                  documentTitle={`Minuta de Transferência • ${student.name}`}
                  defaultSignerName="Chefe da Secretaria Geral"
                  targetRole="secretariat"
                  label="O/A Chefe da Secretaria"
                  studentId={student.id}
                  studentName={student.name}
                />
              </div>

              <div className="flex justify-center">
                <DigitalSignatureStamp
                  documentId={`transf-dir-${student.id}`}
                  documentType="transfer"
                  documentTitle={`Minuta de Transferência • ${student.name}`}
                  defaultSignerName="Director da Escola"
                  targetRole="director"
                  label="Despacho da Direcção (Autorizado)"
                  studentId={student.id}
                  studentName={student.name}
                />
              </div>
            </div>
          </div>

          {/* Rodapé A4 */}
          <div className="pt-4 text-center text-[9px] text-slate-400 font-sans border-t border-slate-200 flex justify-between">
            <span>SIGE Moçambique • Modelo MINEDH/DINES-04-TR</span>
            <span>Folha A4 Vertical Regulamentar • Válido com carimbo e selo</span>
          </div>

        </div>
      </div>

    </div>
  );
};
