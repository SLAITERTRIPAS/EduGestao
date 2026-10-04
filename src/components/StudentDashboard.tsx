import React, { useState } from 'react';
import { useStore } from '../store';
import { Card, Button } from './ui';
import { 
  GraduationCap, BookOpen, MessageSquare, ArrowRightLeft, 
  Search, MapPin, School, CheckCircle, AlertCircle, FileText,
  Upload, Send, Info, ShieldCheck, Printer, Award, Camera, Paperclip, Download, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CollapsibleSidebar } from './CollapsibleSidebar';
import { SidebarMenu } from './SidebarMenu';
import { generateStudentHistoryPDF } from '../utils/pdfGenerator';
import { QRCodeGenerator } from './QRCodeGenerator';
import { TransferDocumentModal } from './TransferDocumentModal';
import { CertificateDocument } from './CertificateDocument';
import { DeclarationDocument } from './DeclarationDocument';
import { EnrollmentReceiptDocument } from './EnrollmentReceiptDocument';
import { QRCodeScannerModal } from './QRCodeScannerModal';
import { Student, ClassTaskItem, ClassTaskSubmission } from '../types';
import { AcademicCalendarComponent } from './AcademicCalendarComponent';
import { OfficialMessages } from './OfficialMessages';
import { SecretariatOfficialReport } from './SecretariatOfficialReport';
import { SignatureManager } from './SignatureManager';
import { UserWorkSummary } from './UserWorkSummary';
import { Receipt } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { currentUser, students, schools, districts, provinces, grades, subjects, classes, submitTransferRequest, submitComplaint, updateSchoolChoice } = useStore();
  const [activeTab, setActiveTab] = useState<'grades' | 'tasks' | 'messages' | 'complaint' | 'transfer'>('grades');
  const [activeDoc, setActiveDoc] = useState<'certificate' | 'declaration' | 'receipt' | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  React.useEffect(() => {
    const handleNav = (e: any) => {
      const loc = e.detail?.targetLocation || e.detail?.targetTab;
      if (loc === 'messages') setActiveTab('messages');
      else if (loc === 'tasks' || loc === 'atividades') setActiveTab('tasks');
      else if (loc === 'grades') setActiveTab('grades');
      else if (loc === 'complaint') setActiveTab('complaint');
      else if (loc === 'transfer') setActiveTab('transfer');
    };
    window.addEventListener('navigate-applet', handleNav);
    return () => window.removeEventListener('navigate-applet', handleNav);
  }, []);

  const studentList = Array.isArray(students) ? students : [];
  const classList = Array.isArray(classes) ? classes : [];
  
  if (!currentUser) return null;
  
  const student = studentList.find(s => s.id === currentUser.studentId) || studentList[0];
  if (!student) return null;

  // Check if student is at the end of a cycle (e.g., 7th, 10th, 12th)
  const isEndOfCycle = ['7.ª Classe', '10.ª Classe', '12.ª Classe'].includes(student.gradeLevel);

  return (
    <CollapsibleSidebar
      sidebarContent={<SidebarMenu activeTab={activeTab} setActiveTab={setActiveTab} />}
    >
      <div className="p-8 space-y-8 w-full max-w-none pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <GraduationCap className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Painel do Aluno • MINEDH</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Olá, {student.name}!
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <p className="text-slate-500 text-sm">
                Competência: Acesso a Resultados, Gestão de Vagas e Processos de Transferência.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-4">
            <Button
              onClick={() => setShowScanner(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 shadow-sm"
            >
              <Camera className="w-4 h-4" /> Ler QR Code (Câmara)
            </Button>
            <QRCodeGenerator 
              student={student} 
              variant="compact"
              size={84}
            />
          </div>
        </div>

        {showScanner && (
          <QRCodeScannerModal onClose={() => setShowScanner(false)} />
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'grades' && (
            <motion.div key="grades" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <GradesView studentId={student.id} onOpenDoc={(doc) => setActiveDoc(doc)} />
            </motion.div>
          )}
          {activeTab === 'tasks' && (
            <motion.div key="tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ClassTasksView student={student} />
            </motion.div>
          )}
          {activeTab === 'messages' && (
            <motion.div key="messages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <OfficialMessages />
            </motion.div>
          )}
          {activeTab === 'complaint' && (
            <motion.div key="complaint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ComplaintView student={student} />
            </motion.div>
          )}
          {activeTab === 'transfer' && (
            <motion.div key="transfer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TransferView student={student} />
            </motion.div>
          )}
        </AnimatePresence>

        {activeDoc === 'receipt' && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 ">
            <EnrollmentReceiptDocument
              student={student}
              schoolClass={classes.find(c => c.id === student.classId)}
              schoolName="Escola Secundária Central"
              academicYear={2026}
              onClose={() => setActiveDoc(null)}
            />
          </div>
        )}

        {activeDoc === 'certificate' && (
          <CertificateDocument
            student={student}
            schoolClass={classes.find(c => c.id === student.classId)}
            schoolName="Escola Secundária Central"
            subjects={subjects}
            grades={grades}
            academicYear={2026}
            onClose={() => setActiveDoc(null)}
          />
        )}

        {activeDoc === 'declaration' && (
          <DeclarationDocument
            student={student}
            schoolClass={classes.find(c => c.id === student.classId)}
            schoolName="Escola Secundária Central"
            subjects={subjects}
            grades={grades}
            academicYear={2026}
            onClose={() => setActiveDoc(null)}
          />
        )}
      </div>
    </CollapsibleSidebar>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
      active ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
    }`}
  >
    {icon}
    {label}
  </button>
);

const GradesView = ({ studentId, onOpenDoc }: { studentId: string; onOpenDoc?: (doc: 'certificate' | 'declaration' | 'receipt') => void }) => {
  const { grades, subjects, students, classes } = useStore();
  const gradeList = Array.isArray(grades) ? grades : [];
  const subjectList = Array.isArray(subjects) ? subjects : [];
  const studentList = Array.isArray(students) ? students : [];

  const studentGrades = gradeList.filter(g => g.studentId === studentId);
  const student = studentList.find(s => s.id === studentId);
  const [selectedTrimester, setSelectedTrimester] = useState<number>(1);

  if (!student) return null;

  const handleExportHistory = () => {
    generateStudentHistoryPDF(student, studentGrades, subjectList, classes || []);
  };

  const trimesters = [
    { num: 1, name: '1º Trimestre' },
    { num: 2, name: '2º Trimestre' },
    { num: 3, name: '3º Trimestre' },
  ];

  // Helper deterministic attendance & behavior generator per subject and trimester
  const getSubjectMetrics = (subjectId: string, trimester: number) => {
    const sId = student.id || 'std';
    const subId = subjectId || 'sub';
    const seed = ((sId.charCodeAt(sId.length - 1) || 0) + (subId.charCodeAt(0) || 0) + trimester * 7);
    const justified = seed % 3 === 0 ? 1 : seed % 7 === 0 ? 2 : 0;
    const unjustified = seed % 5 === 0 ? 1 : 0;
    const totalAbsences = justified + unjustified;
    
    // Comportamento
    const behaviors = ['Excelente', 'Muito Bom', 'Bom', 'Satisfatório'];
    const behavior = behaviors[seed % behaviors.length];

    return { justified, unjustified, totalAbsences, behavior };
  };

  // Compute overall averages
  const getTrimesterAverage = (t: number) => {
    const tGrades = subjectList.map(s => {
      const g = studentGrades.find(gr => gr.subjectId === s.id && gr.trimester === t);
      return g?.media ?? null;
    }).filter((v): v is number => v !== null);

    if (tGrades.length === 0) return null;
    return Number((tGrades.reduce((a, b) => a + b, 0) / tGrades.length).toFixed(1));
  };

  const avgT1 = getTrimesterAverage(1);
  const avgT2 = getTrimesterAverage(2);
  const avgT3 = getTrimesterAverage(3);
  const validAvgs = [avgT1, avgT2, avgT3].filter((v): v is number => v !== null);
  const annualAverage = validAvgs.length > 0 
    ? Number((validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length).toFixed(1)) 
    : 14.0;

  const finalClassification = annualAverage >= 9.5 ? 'Transita' : 'Não Transita';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <UserWorkSummary role="aluno" />

      {/* Top Banner with Annual Result */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-blue-800/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30">
              Ano Lectivo: {student.academicYear || 2026}
            </span>
            <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
              Classe: {student.entryGrade || '10ª Classe'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white font-serif">
            Boletim de Resultados e Desempenho
          </h2>
          <p className="text-xs text-blue-200/80">
            Acompanhe o rendimento disciplinar, assiduidade, comportamento e a sua classificação de transição escolar.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10  p-4 rounded-xl border border-white/20">
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold block">
              Classificação Final
            </span>
            <span className={`text-xl font-black ${finalClassification === 'Transita' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {finalClassification.toUpperCase()}
            </span>
            <span className="text-[11px] text-slate-300 block font-mono">
              Média Anual: <strong>{annualAverage.toFixed(1)}</strong> v
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onOpenDoc && (
              <button 
                onClick={() => onOpenDoc('receipt')} 
                className="bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                title="Visualizar e Imprimir Recibo Oficial de Matrícula com Emblema de Moçambique"
              >
                <Receipt className="w-4 h-4" />
                Recibo de Matrícula
              </button>
            )}
            <button 
              onClick={handleExportHistory} 
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Histórico PDF
            </button>
          </div>
        </div>
      </div>

      {/* Trimester Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {trimesters.map(t => {
          const tAvg = getTrimesterAverage(t.num);
          const isSelected = selectedTrimester === t.num;
          return (
            <button
              key={t.num}
              onClick={() => setSelectedTrimester(t.num)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 border ${
                isSelected 
                  ? 'bg-blue-900 text-white border-blue-950 shadow-sm' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <span>{t.name}</span>
              {tAvg !== null && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-700'
                }`}>
                  {tAvg.toFixed(1)}v
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Trimester Table */}
      {(() => {
        const currentTrimester = trimesters.find(t => t.num === selectedTrimester) || trimesters[0];
        const tAvg = getTrimesterAverage(selectedTrimester);
        const tStatus = (tAvg ?? annualAverage) >= 9.5 ? 'Transita' : 'Não Transita';

        let sumJustified = 0;
        let sumUnjustified = 0;

        return (
          <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    {currentTrimester.name} • Detalhes por Disciplina
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Notas de avaliação, registo de faltas cívicas e comportamento trimestral
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Média Trimestral</span>
                  <span className={`text-sm font-black font-mono ${(tAvg || 0) >= 9.5 ? 'text-blue-700' : 'text-rose-600'}`}>
                    {tAvg !== null ? `${tAvg.toFixed(1)}v` : 'Pendente'}
                  </span>
                </div>

                <div className="text-center px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Classificação</span>
                  <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${
                    tStatus === 'Transita' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {tStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wider border-y border-slate-200">
                    <th className="py-3 px-4">Nome do Trimestre</th>
                    <th className="py-3 px-4">Disciplina</th>
                    <th className="py-3 px-3 text-center">Nota (Média)</th>
                    <th className="py-3 px-3 text-center">Faltas Justificadas</th>
                    <th className="py-3 px-3 text-center">Faltas Não Justificadas</th>
                    <th className="py-3 px-3 text-center">Total Faltas</th>
                    <th className="py-3 px-3 text-center">Comportamento</th>
                    <th className="py-3 px-4 text-center">Classificação Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subjects.map(sub => {
                    const grade = studentGrades.find(g => g.subjectId === sub.id && g.trimester === selectedTrimester);
                    const score = grade?.media ?? grade?.apt ?? grade?.acs1 ?? null;
                    const metrics = getSubjectMetrics(sub.id, selectedTrimester);
                    sumJustified += metrics.justified;
                    sumUnjustified += metrics.unjustified;

                    const subjectStatus = score !== null ? (score >= 9.5 ? 'Transita' : 'Não Transita') : 'Em Avaliação';

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap text-xs">
                          {currentTrimester.name}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {sub.name}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            score !== null && score >= 10 
                              ? 'bg-emerald-50 text-emerald-700 font-black' 
                              : score !== null 
                                ? 'bg-rose-50 text-rose-700 font-black' 
                                : 'text-slate-400'
                          }`}>
                            {score !== null ? score.toFixed(1) : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-xs font-mono text-slate-600">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-bold">
                            {metrics.justified}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-xs font-mono">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            metrics.unjustified > 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {metrics.unjustified}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-xs font-mono font-black text-slate-800">
                          {metrics.totalAbsences}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                            {metrics.behavior}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            subjectStatus === 'Transita'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : subjectStatus === 'Não Transita'
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}>
                            {subjectStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Trimester Footer Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Total de Faltas no Trimestre</span>
                <p className="text-base font-bold text-slate-800 mt-0.5">
                  {sumJustified + sumUnjustified} faltas <span className="text-xs font-normal text-slate-500">({sumJustified} justificadas, {sumUnjustified} injustificadas)</span>
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Comportamento Geral</span>
                <p className="text-base font-bold text-blue-900 mt-0.5">
                  Muito Bom (Sem sanções disciplinares)
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Situação de Transição</span>
                <p className={`text-base font-black mt-0.5 ${tStatus === 'Transita' ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {tStatus} • {student.entryGrade || '10ª Classe'}
                </p>
              </div>
            </div>
          </Card>
        );
      })()}

      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 leading-relaxed">
            Estes resultados são actualizados periodicamente de acordo com as pautas oficiais validadas pela Direcção Pedagógica. Pode emitir pré-visualizações oficiais do seu Certificado ou Declaração com Notas abaixo.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button
            onClick={() => onOpenDoc?.('certificate')}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5 py-2 px-3 rounded-lg shadow-xs cursor-pointer w-full sm:w-auto justify-center"
          >
            <Award size={14} /> Gerar Certificado
          </Button>
          <Button
            onClick={() => onOpenDoc?.('declaration')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-1.5 py-2 px-3 rounded-lg shadow-xs cursor-pointer w-full sm:w-auto justify-center"
          >
            <FileText size={14} /> Emitir Declaração
          </Button>
        </div>
      </div>

      {/* Calendar of evaluations visible immediately on login */}
      <div className="pt-8 border-t-2 border-slate-200 space-y-3">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2.5 font-serif">
            📅 Calendário de Avaliações & Atividades Escolares
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Consulte em tempo real as datas de avaliações programadas (ACS, APT, Exames) e outros eventos publicados pelo corpo docente.
          </p>
        </div>
        <AcademicCalendarComponent />
      </div>
    </motion.div>
  );
};

const CycleSelectionView = ({ student }: { student: any }) => {
  const { provinces, districts, schools, updateSchoolChoice } = useStore();
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const filteredDistricts = districts.filter(d => d.provinceId === selectedProvince);
  const filteredSchools = schools.filter(s => s.districtId === selectedDistrict);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolChoice(student.id, selectedSchool);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="p-12 text-center border-emerald-200 bg-emerald-50 max-w-2xl mx-auto">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-emerald-900">Escolha Confirmada!</h2>
        <p className="text-emerald-700 mt-2">
          A vaga para a nova escola foi reservada com sucesso. Receberá uma notificação quando o processo de matrícula for concluído.
        </p>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <Card className="p-8 bg-white border border-slate-200 shadow-lg rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <ArrowRightLeft className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Transição de Ciclo</h2>
            <p className="text-sm text-slate-500">Escolha a escola para o próximo nível de ensino</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">1. Escolha a Província</label>
              <select 
                required
                value={selectedProvince}
                onChange={e => { setSelectedProvince(e.target.value); setSelectedDistrict(''); setSelectedSchool(''); }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="">Selecione uma província...</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">2. Escolha o Distrito</label>
              <select 
                required
                disabled={!selectedProvince}
                value={selectedDistrict}
                onChange={e => { setSelectedDistrict(e.target.value); setSelectedSchool(''); }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
              >
                <option value="">Selecione um distrito...</option>
                {filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">3. Escolha a Escola (Disponíveis)</label>
              <select 
                required
                disabled={!selectedDistrict}
                value={selectedSchool}
                onChange={e => setSelectedSchool(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
              >
                <option value="">Selecione uma escola...</option>
                {filteredSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            Confirmar Escolha de Vaga
          </button>
        </form>
      </Card>
    </motion.div>
  );
};

const TransferView = ({ student }: { student: any }) => {
  const { provinces, districts, schools, submitTransferRequest } = useStore();
  const [formData, setFormData] = useState({
    provinceId: '',
    districtId: '',
    schoolId: '',
    reason: '',
    proof: null as File | null
  });
  const [submitted, setSubmitted] = useState(false);
  const [showMinutaModal, setShowMinutaModal] = useState(false);

  const selectedProvince = provinces.find(p => p.id === formData.provinceId);
  const selectedDistrict = districts.find(d => d.id === formData.districtId);
  const selectedSchool = schools.find(s => s.id === formData.schoolId);

  const filteredDistricts = districts.filter(d => d.provinceId === formData.provinceId);
  const filteredSchools = schools.filter(s => s.districtId === formData.districtId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitTransferRequest({
      studentId: student.id,
      currentSchoolId: student.schoolId,
      targetSchoolId: formData.schoolId,
      targetDistrictId: formData.districtId,
      targetProvinceId: formData.provinceId,
      reason: formData.reason,
      proofOfPaymentUrl: 'dummy_url_proof.pdf'
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <>
        <Card className="p-10 text-center border-amber-200 bg-amber-50 max-w-2xl mx-auto shadow-md">
          <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto mb-3" />
          <h2 className="text-2xl font-black text-slate-900">Pedido de Transferência Submetido com Sucesso!</h2>
          <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto">
            O seu requerimento foi registado no sistema nacional. Pode agora visualizar e imprimir a <strong>Minuta Oficial A4 Vertical</strong> para entrega ou arquivamento.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setShowMinutaModal(true)}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-300" />
              Imprimir Minuta Oficial A4 Vertical
            </button>
            <button
              onClick={() => setSubmitted(false)}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Novo Pedido
            </button>
          </div>
        </Card>

        <TransferDocumentModal
          isOpen={showMinutaModal}
          onClose={() => setShowMinutaModal(false)}
          student={student}
          originSchoolName={schools.find(s => s.id === student.schoolId)?.name}
          targetProvinceName={selectedProvince?.name}
          targetDistrictName={selectedDistrict?.name}
          targetSchoolName={selectedSchool?.name}
          reason={formData.reason}
        />
      </>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <Card className="p-8 bg-white border border-slate-200 shadow-lg rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <School className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Solicitar Transferência</h2>
            <p className="text-sm text-slate-500">Mudar de escola durante o ano lectivo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Província Destino</label>
              <select 
                required
                value={formData.provinceId}
                onChange={e => setFormData(prev => ({ ...prev, provinceId: e.target.value, districtId: '', schoolId: '' }))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">Selecione...</option>
                {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Distrito Destino</label>
              <select 
                required
                disabled={!formData.provinceId}
                value={formData.districtId}
                onChange={e => setFormData(prev => ({ ...prev, districtId: e.target.value, schoolId: '' }))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">Selecione...</option>
                {filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Escola Destino</label>
            <select 
              required
              disabled={!formData.districtId}
              value={formData.schoolId}
              onChange={e => setFormData(prev => ({ ...prev, schoolId: e.target.value }))}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">Selecione a escola...</option>
              {filteredSchools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Motivo da Transferência</label>
            <textarea 
              required
              rows={3}
              value={formData.reason}
              onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none"
              placeholder="Ex: Mudança de residência..."
            />
          </div>

          <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group text-center">
            <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2 group-hover:text-blue-500" />
            <p className="text-xs font-bold text-slate-500 mb-1">Comprovativo de Depósito (Taxas)</p>
            <p className="text-[10px] text-slate-400">PDF ou JPG (Máx 2MB)</p>
            <input type="file" className="hidden" />
          </div>

          <button 
            type="submit"
            className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg"
          >
            Submeter Pedido de Transferência
          </button>
        </form>
      </Card>
    </motion.div>
  );
};

const ComplaintView = ({ student }: { student: any }) => {
  const { subjects, submitComplaint } = useStore();
  const [formData, setFormData] = useState({
    type: 'justificacao_falta' as 'reclamacao_nota' | 'justificacao_falta' | 'reposicao_teste',
    subjectId: '',
    trimester: 1,
    description: '',
    proofRef: '',
    proofFile: null as File | null
  });
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check proof document requirement for justification and test retake requests
    if (['justificacao_falta', 'reposicao_teste'].includes(formData.type)) {
      if (!formData.proofRef.trim() && !formData.proofFile) {
        setErrorMsg('⚠️ Comprovativo Obrigatório: É obrigatório anexar/indicar o documento comprovativo (Atestado Médico, Declaração, etc.) para submeter um pedido de justificação de falta ou reposição de teste.');
        return;
      }
    }

    setErrorMsg('');
    submitComplaint({
      studentId: student.id,
      subjectId: formData.subjectId,
      trimester: formData.trimester,
      description: `[TIPO: ${formData.type.toUpperCase()}] [COMPROVATIVO: ${formData.proofRef || formData.proofFile?.name || 'SIM'}] ${formData.description}`
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Card className="p-12 text-center border-blue-200 bg-blue-50 max-w-2xl mx-auto">
        <Send className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-blue-900">Pedido Submetido com Sucesso!</h2>
        <p className="text-blue-700 mt-2">
          O seu pedido com comprovativo em anexo foi encaminhado para o Docente e Direção Pedagógica.
        </p>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <Card className="p-8 bg-white border border-slate-200 shadow-lg rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Requerimento Académico (Faltas / Reposição de Testes)</h2>
            <p className="text-sm text-slate-500">Submeta justificações de faltas, pedidos de reposição de testes ou reclamações</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 mb-4 bg-rose-50 border-2 border-rose-400 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Tipo de Requerimento *</label>
            <select
              value={formData.type}
              onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
            >
              <option value="justificacao_falta">Justificação de Falta (Anexo de Comprovativo Obrigatório)</option>
              <option value="reposicao_teste">Pedido de Reposição de Teste / Avaliação (Comprovativo Obrigatório)</option>
              <option value="reclamacao_nota">Reclamação de Nota / Esclarecimento Académico</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Disciplina *</label>
              <select 
                required
                value={formData.subjectId}
                onChange={e => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">Selecione...</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Trimestre</label>
              <select 
                value={formData.trimester}
                onChange={e => setFormData(prev => ({ ...prev, trimester: Number(e.target.value) }))}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              >
                <option value={1}>1º Trimestre</option>
                <option value={2}>2º Trimestre</option>
                <option value={3}>3º Trimestre</option>
              </select>
            </div>
          </div>

          {['justificacao_falta', 'reposicao_teste'].includes(formData.type) && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-3">
              <label className="block text-xs font-black text-amber-950 uppercase flex items-center justify-between">
                <span>Documento Comprovativo (Obrigatório) *</span>
                <span className="text-amber-800 text-[10px] lowercase font-semibold font-sans">Atestado Médico, Declaração, etc.</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required={['justificacao_falta', 'reposicao_teste'].includes(formData.type)}
                  value={formData.proofRef}
                  onChange={e => setFormData(prev => ({ ...prev, proofRef: e.target.value }))}
                  placeholder="N.º / Referência do Atestado ou Declaração (ex: ATEST-2026-99)"
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                />

                <label className="cursor-pointer px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-xs">
                  <Paperclip size={14} />
                  <span>Anexar Ficheiro</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0] || null;
                      setFormData(prev => ({ ...prev, proofFile: f, proofRef: f ? f.name : prev.proofRef }));
                    }}
                  />
                </label>
              </div>
              {formData.proofFile && (
                <p className="text-[11px] font-mono font-bold text-amber-900 flex items-center gap-1">
                  <FileText size={13} /> Ficheiro selecionado: {formData.proofFile.name}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descrição do Problema / Motivo *</label>
            <textarea 
              required
              rows={4}
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none"
              placeholder="Descreva detalhadamente o motivo da sua solicitação..."
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-950 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send size={16} /> Submeter Requerimento Académico
          </button>
        </form>
      </Card>
    </motion.div>
  );
};

const EvaluationsView: React.FC<{ student: Student }> = ({ student }) => {
  const { evaluations } = useStore();
  const classEvals = evaluations.filter(e => e.classId === student.classId || !e.classId);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black text-slate-800 mb-1">Calendário & Horários de Avaliações</h2>
        <p className="text-xs text-slate-500">Consulte o calendário oficial de Avaliações Contínuas (ACS), Parciais (APT) e Exames da sua turma.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classEvals.map(ev => (
          <div key={ev.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex justify-between items-start">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                ev.type === 'ACS' ? 'bg-blue-100 text-blue-800' :
                ev.type === 'APT' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
              }`}>
                {ev.type} • {ev.subjectName}
              </span>
              <span className="text-xs font-mono font-bold text-slate-600">{ev.date} às {ev.time}</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">{ev.title}</h3>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Docente: {ev.teacherName}</span>
              {ev.room && <span className="font-semibold text-slate-700">Sala: {ev.room}</span>}
            </div>
          </div>
        ))}
        {classEvals.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500">
            Nenhuma avaliação agendada de momento para a sua turma.
          </div>
        )}
      </div>
    </div>
  );
};

const ClassTasksView: React.FC<{ student: Student }> = ({ student }) => {
  const { classTasks, subjects, submitTaskAnswer } = useStore();
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [activeTaskResponseId, setActiveTaskResponseId] = useState<string | null>(null);
  const [responseText, setAnswerText] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachedStudentFile, setAttachedStudentFile] = useState<{ name: string; url: string; size?: string } | null>(null);
  const [submitFeedback, setSubmitFeedback] = useState<string | null>(null);

  const handleStudentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${Math.round(file.size / 1024)} KB`;
    setAttachedStudentFile({
      name: file.name,
      url,
      size: sizeFormatted
    });
    setAttachmentName(file.name);
  };

  const tasks = (classTasks || []).filter(t => t && (!t.classId || t.classId === student.classId));

  // Extract list of subjects present in tasks or default list
  const availableSubjects = Array.from(new Set((tasks || []).map(t => t.subjectName || 'Geral')));
  const filterSubjectList = availableSubjects.length > 0 ? availableSubjects : (subjects || []).map(s => s && s.name);

  const filteredTasks = selectedSubjectFilter === 'all' 
    ? (tasks || []) 
    : (tasks || []).filter(t => t && (t.subjectName || 'Geral').toLowerCase() === selectedSubjectFilter.toLowerCase());

  // Group filtered tasks by subjectName
  const groupedTasksBySubject = (filteredTasks || []).reduce((acc, task) => {
    if (!task) return acc;
    const sub = task.subjectName || 'Geral';
    if (!acc[sub]) acc[sub] = [];
    acc[sub].push(task);
    return acc;
  }, {} as Record<string, ClassTaskItem[]>);

  const handleSubmitResponse = (e: React.FormEvent, taskId: string, subjectName: string) => {
    e.preventDefault();
    if (!responseText.trim()) return;

    submitTaskAnswer({
      taskId,
      studentId: student.id,
      studentName: student.name,
      classId: student.classId || 'c1',
      subjectName: subjectName || 'Geral',
      answerText: responseText.trim(),
      fileName: attachedStudentFile?.name || attachmentName.trim() || undefined,
      fileUrl: attachedStudentFile?.url || undefined
    });

    setSubmitFeedback(`Atividade submetida com sucesso para o docente de ${subjectName}!`);
    setActiveTaskResponseId(null);
    setAnswerText('');
    setAttachmentName('');
    setAttachedStudentFile(null);
    setTimeout(() => setSubmitFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <FileText className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Portal do Aluno • Atividades da Turma</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800">Atividades e Exercícios da Turma</h2>
          <p className="text-xs text-slate-500 mt-1">
            Exercícios organizados por disciplina. Responda e submeta os seus trabalhos diretamente para o portal do docente.
          </p>
        </div>

        {/* Feedback Alert */}
        {submitFeedback && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2 rounded-xl text-xs font-bold animate-bounce flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {submitFeedback}
          </div>
        )}
      </div>

      {/* Discipline / Subject Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedSubjectFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
            selectedSubjectFilter === 'all' 
              ? 'bg-blue-900 text-white shadow-xs' 
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todas as Disciplinas ({tasks.length})
        </button>

        {filterSubjectList.map(subName => {
          const count = tasks.filter(t => (t.subjectName || 'Geral').toLowerCase() === subName.toLowerCase()).length;
          return (
            <button
              key={subName}
              onClick={() => setSelectedSubjectFilter(subName)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedSubjectFilter.toLowerCase() === subName.toLowerCase()
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{subName}</span>
              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full text-[10px] font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grouped Tasks Container */}
      <div className="space-y-8">
        {Object.keys(groupedTasksBySubject).length > 0 ? (
          Object.entries(groupedTasksBySubject).map(([subjectName, rawTasks]) => {
            const subjectTasks = rawTasks as ClassTaskItem[];
            return (
              <div key={subjectName} className="space-y-4">
                {/* Discipline Section Title */}
                <div className="flex items-center gap-2 border-b-2 border-blue-900 pb-2">
                  <BookOpen className="w-5 h-5 text-blue-900" />
                  <h3 className="text-base font-black text-slate-900 uppercase font-serif">
                    Disciplina: {subjectName}
                  </h3>
                  <span className="text-xs font-bold bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full font-mono">
                    {subjectTasks.length} {subjectTasks.length === 1 ? 'atividade' : 'atividades'}
                  </span>
                </div>

                {/* Subject Tasks List */}
                <div className="grid grid-cols-1 gap-4">
                  {subjectTasks.map(task => {
                  const studentSubmissions = task.submissions || [];
                  const mySubmission = studentSubmissions.find(s => s.studentId === student.id);
                  const isResponding = activeTaskResponseId === task.id;

                  return (
                    <div key={task.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 transition-all hover:border-slate-300">
                      {/* Task Header */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              {task.subjectName || subjectName}
                            </span>
                            {mySubmission ? (
                              mySubmission.grade !== undefined ? (
                                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full uppercase">
                                  Avaliado: {mySubmission.grade}/20
                                </span>
                              ) : (
                                <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full uppercase">
                                  Entregue em {new Date(mySubmission.submittedAt).toLocaleDateString('pt-MZ')}
                                </span>
                              )
                            ) : (
                              <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full uppercase">
                                Pendente de Resposta
                              </span>
                            )}
                          </div>
                          <h4 className="text-lg font-black text-slate-900 mt-1">{task.title}</h4>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200 block">
                            Prazo: {task.dueDate}
                          </span>
                        </div>
                      </div>

                      {/* Task Description */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-sm text-slate-800 leading-relaxed font-medium">
                        {task.description}
                      </div>

                      {/* Info & Download Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 font-medium">
                          Docente: <strong className="text-slate-800">{task.teacherName || 'Professor da Cadeira'}</strong>
                        </span>

                        {task.fileName && (
                          <a 
                            href={task.fileUrl || '#'} 
                            onClick={(e) => {
                              if (!task.fileUrl || task.fileUrl === '#') {
                                e.preventDefault();
                                alert(`A descarregar material de apoio anexado pelo professor: ${task.fileName}`);
                              }
                            }}
                            download={task.fileName}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-blue-800 font-bold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-all cursor-pointer"
                          >
                            <Paperclip className="w-4 h-4 text-blue-700" />
                            <span>Material do Professor: {task.fileName}</span>
                            <Download className="w-3.5 h-3.5 text-blue-700 ml-1" />
                          </a>
                        )}
                      </div>

                      {/* Submission / Response Section */}
                      {mySubmission ? (
                        <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-xl space-y-2 mt-2">
                          <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                            <span>A Sua Resposta Submetida:</span>
                            <span className="font-mono text-[11px] text-slate-500">
                              {new Date(mySubmission.submittedAt).toLocaleString('pt-MZ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-800 font-medium bg-white p-3 rounded-lg border border-blue-100 whitespace-pre-wrap">
                            {mySubmission.answerText}
                          </p>
                          {mySubmission.fileName && (
                            <a
                              href={mySubmission.fileUrl || '#'}
                              onClick={(e) => {
                                if (!mySubmission.fileUrl || mySubmission.fileUrl === '#') {
                                  e.preventDefault();
                                  alert(`A descarregar o seu ficheiro anexo: ${mySubmission.fileName}`);
                                }
                              }}
                              download={mySubmission.fileName}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100/80 border border-blue-300 text-blue-950 rounded-lg text-xs font-bold hover:bg-blue-200 transition-all mt-1 cursor-pointer"
                            >
                              <Paperclip className="w-4 h-4 text-blue-800" />
                              <span>O Seu Ficheiro Anexo: {mySubmission.fileName}</span>
                              <Download className="w-3.5 h-3.5 text-blue-800 ml-1" />
                            </a>
                          )}
                          {mySubmission.feedback && (
                            <div className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                              <strong className="block font-bold">Feedback / Comentário do Docente:</strong>
                              <p className="mt-0.5">{mySubmission.feedback}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="pt-2">
                          {!isResponding ? (
                            <Button
                              onClick={() => { setActiveTaskResponseId(task.id); setAnswerText(''); setAttachedStudentFile(null); }}
                              className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold gap-1.5 py-2 px-4 rounded-xl shadow-xs cursor-pointer"
                            >
                              <Send size={14} /> Responder / Enviar Atividade ao Docente
                            </Button>
                          ) : (
                            <form onSubmit={(e) => handleSubmitResponse(e, task.id, task.subjectName || subjectName)} className="bg-slate-50 p-4 rounded-xl border border-blue-200 space-y-3 animate-in fade-in duration-150">
                              <div className="flex justify-between items-center">
                                <h5 className="text-xs font-black text-blue-950 uppercase tracking-wider">
                                  Responder à Atividade de {task.subjectName || subjectName}
                                </h5>
                                <button
                                  type="button"
                                  onClick={() => setActiveTaskResponseId(null)}
                                  className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>

                              <textarea
                                required
                                rows={4}
                                value={responseText}
                                onChange={e => setAnswerText(e.target.value)}
                                placeholder="Escreva aqui a resolução do exercício ou a sua resposta..."
                                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-800 font-medium focus:border-blue-700 outline-none"
                              />

                              {/* CAMPO DE UPLOAD DE FICHEIRO DO ALUNO */}
                              <div className="space-y-2 pt-1">
                                <label className="block text-xs font-bold text-slate-700">Anexar Ficheiro da Resolução (PDF, DOCX, Imagem...):</label>
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                  <input
                                    type="file"
                                    id={`student-file-input-${task.id}`}
                                    className="hidden"
                                    onChange={handleStudentFileSelect}
                                  />
                                  <label
                                    htmlFor={`student-file-input-${task.id}`}
                                    className="cursor-pointer bg-white border border-blue-300 hover:bg-blue-50 text-blue-900 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs shrink-0"
                                  >
                                    <Paperclip className="w-4 h-4 text-blue-700" />
                                    <span>Anexar Ficheiro do Computador</span>
                                  </label>

                                  <input
                                    type="text"
                                    value={attachmentName}
                                    onChange={e => setAttachmentName(e.target.value)}
                                    placeholder="ou nome do anexo (ex: resolucao.pdf)"
                                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium"
                                  />

                                  <Button
                                    type="submit"
                                    className="w-full sm:w-auto bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2 px-5 gap-1.5 justify-center shadow-xs cursor-pointer shrink-0"
                                  >
                                    <Send size={14} /> Submeter Resposta
                                  </Button>
                                </div>

                                {attachedStudentFile && (
                                  <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-950">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                                      <span className="truncate max-w-xs">{attachedStudentFile.name}</span>
                                      {attachedStudentFile.size && (
                                        <span className="text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-mono">
                                          {attachedStudentFile.size}
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAttachedStudentFile(null);
                                        setAttachmentName('');
                                      }}
                                      className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                                      title="Remover anexo"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Nenhuma atividade de momento</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Não existem exercícios ou tarefas publicadas para a sua turma nesta seleção de disciplinas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
