import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Student, Class, Subject, Grade, MOZAMBIQUE_EMBLEM_URL } from '../types';
import { 
  Printer, Save, Edit3, Plus, Trash2, Check, 
  User, GraduationCap, HeartPulse, Award, CheckSquare, Paperclip,
  Upload, Eye, ChevronLeft, ChevronRight, Code, ShieldCheck, FileText, Calendar, FileSpreadsheet
} from 'lucide-react';
import { Button } from './ui';

interface StudentProcessDocumentProps {
  student: Student;
  schoolName?: string;
  classes?: Class[];
  subjects?: Subject[];
  grades?: Grade[];
  onClose?: () => void;
}

const OFFICIAL_SUBJECTS = [
  "Comportamento", "Língua Português", "2.ª Língua", "Adm. Escolar", "Língua Moçamb.", 
  "Português", "Gramática", "Oficinas", "Religião", "Cultura e Sociedade", 
  "Matemática", "Ciências Nat.", "Biologia", "Física", "Química", 
  "Geografia", "História", "Trab. Manuais", "Desenho", "Ed. Musical", 
  "Ed. Visual", "Ed. Física", "Inglês", "Ed. Cívica+", "Estatística", 
  "Ed. Moral e Cívica", "Cidadania"
];

export function StudentProcessDocument({
  student,
  schoolName: initialSchoolName,
  classes = [],
  subjects = [],
  grades = [],
  onClose,
}: StudentProcessDocumentProps) {
  const { activeSchool, updateStudentDetails } = useStore();
  const schoolName = initialSchoolName || activeSchool?.name || 'Escola Secundária Central';

  const [isEditMode, setIsEditMode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Form State matching the images precisely
  const [formData, setFormData] = useState({
    name: student.name || '',
    gender: student.gender || 'M',
    nationality: student.nationality || 'Moçambicana',
    birthDate: student.birthDate || '',
    birthPlace: student.birthPlace || '',
    district: student.district || '',
    province: student.province || '',
    address: student.address || '',
    city: student.city || '',
    quarteirao: student.quarteirao || '',
    casa: student.casa || '',
    phone: student.phone || '',
    cedulaNumber: student.cedulaNumber || '',
    cedulaYear: student.cedulaYear || '',
    idCardNumber: student.idCardNumber || '',
    
    fatherName: student.fatherName || '',
    fatherProfession: student.fatherProfession || '',
    fatherWorkplace: student.fatherWorkplace || '',
    fatherAddress: student.fatherAddress || '',
    
    motherName: student.motherName || '',
    motherProfession: student.motherProfession || '',
    motherWorkplace: student.motherWorkplace || '',
    motherAddress: student.motherAddress || '',
    
    guardianName: student.guardianName || '',
    guardianProfession: student.guardianProfession || '',
    guardianWorkplace: student.guardianWorkplace || '',
    guardianAddress: student.guardianAddress || '',
    
    academicYear: student.academicYear || 2026,
    regime: student.regime || '',
    photoUrl: student.photoUrl || '',
    
    healthObservations: student.healthObservations || '',
    futureProfessionChoice: student.futureProfessionChoice || '',
    vocationalObservations: student.vocationalObservations || '',
    GeneralObservations: student.GeneralObservations || '',

    // New fields for extended structure
    careerOrientation: student.careerOrientation || '',
    transferHistory: student.transferHistory || '',

    // Identification for headers
    studentCode: student.studentCode || student.id,
    processCode: student.processCode || student.id,
    studentNumber: student.studentNumber || '',
  });

  // Attachments
  const [uploadedDocs, setUploadedDocs] = useState<any[]>(student.digitalProcessFiles || []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newDocs = Array.from(files).map((file, index) => ({
        id: `doc-${Date.now()}-${index}`,
        name: file.name,
        type: file.type || 'application/pdf',
        uploadDate: new Date().toLocaleDateString(),
        url: URL.createObjectURL(file),
        verified: true
      }));
      setUploadedDocs([...uploadedDocs, ...newDocs]);
    }
  };

  const studentClass = classes.find(c => c.id === student.classId);
  const studentGrade = studentClass?.gradeLevel || student.gradeLevel || '10ª Classe';
  const studentArea = studentClass?.area || student.area;

  // Filter subjects based on student class/grade/area
  const filteredSubjects = useMemo(() => {
    if (subjects.length > 0) {
      return subjects.filter(s => {
        // Simple logic: if subject has area, it must match student area
        if (s.area && studentArea && s.area !== studentArea) return false;
        // In a real system, we'd have a grade-subject mapping. For now, we use the provided list or fallback.
        return true;
      });
    }
    
    // Fallback logic for Mozambique curriculum if no subjects prop
    const isPrimary = ['1ª', '2ª', '3ª', '4ª', '5ª', '6ª'].some(g => studentGrade.includes(g));
    const isSec1 = ['7ª', '8ª', '9ª'].some(g => studentGrade.includes(g));
    
    if (isPrimary) {
      return ["Português", "Matemática", "Ciências Nat.", "Ciências Sociais", "Ed. Visual", "Ed. Musical", "Ed. Física", "Oficinas"];
    }
    if (isSec1) {
      return ["Português", "Inglês", "Matemática", "Biologia", "Física", "Química", "Geografia", "História", "Ed. Visual", "Ed. Física"];
    }
    
    // ESG 2nd Cycle (10-12)
    const base = ["Português", "Inglês", "Matemática", "Filosofia", "Ed. Física"];
    if (studentArea === 'CS') return [...base, "História", "Geografia", "Francês"];
    if (studentArea === 'MCN') return [...base, "Biologia", "Física", "Química"];
    return OFFICIAL_SUBJECTS; // Default
  }, [subjects, studentGrade, studentArea]);

  const addFrequencyYear = () => {
    setFrequencyHistory([...frequencyHistory, { entryDate: '', exitDate: '', schoolName: '', district: '', province: '', gradeAndClass: '', obs: '' }]);
  };

  const addAchievementYear = () => {
    setAchievementData([...achievementData, { year: 2026, grade: '', class: '', subjects: {} }]);
  };

  const addAbsenceYear = () => {
    setAbsencesData([...absencesData, { year: 2026, t1_just: '', t1_unjust: '', t2_just: '', t2_unjust: '', t3_just: '', t3_unjust: '', total: '' }]);
  };

  const addEnrollmentYear = () => {
    setEnrollmentHistory([...enrollmentHistory, { year: '', grade: '', className: '', responsibleSignature: '', dateStamp: '' }]);
  };

  const handleSaveProcess = () => {
    if (updateStudentDetails) {
      updateStudentDetails(student.id, {
        ...formData,
        schoolFrequencyHistory: frequencyHistory,
        vaccinesTuberculosis: vaccinesTB,
        vaccinesTetanus: vaccinesTetanus,
        enrollmentHistory,
        pedagogicalAchievement: achievementData,
        committedAbsences: absencesData as any,
        digitalProcessFiles: uploadedDocs as any
      });
    }
    setSaveSuccess(true);
    setIsEditMode(false);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  // State for children
  const [children, setChildren] = useState(student.children || []);
  const addChild = () => setChildren([...children, { name: '', age: '' }]);

  // Restoring missing state variables
  const [frequencyHistory, setFrequencyHistory] = useState<any[]>(student.schoolFrequencyHistory || []);
  const [vaccinesTB, setVaccinesTB] = useState<any>(student.vaccinesTuberculosis || { dose1: '', dose2: '', dose3: '' });
  const [vaccinesTetanus, setVaccinesTetanus] = useState<any>(student.vaccinesTetanus || { dose1: '', dose2: '', dose3: '' });
  const [achievementData, setAchievementData] = useState<any[]>(student.pedagogicalAchievement || []);
  const [absencesData, setAbsencesData] = useState<any[]>(student.committedAbsences || []);
  const [enrollmentHistory, setEnrollmentHistory] = useState<any[]>(student.enrollmentHistory || []);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, photoUrl: url }));
    }
  };

  const DottedLine = ({ label, value, field, className = "", onChange }: { label: string, value: string, field?: string, className?: string, onChange?: (val: string) => void }) => (
    <div className={`flex items-baseline gap-2 text-[11px] ${className}`}>
      <span className="font-bold whitespace-nowrap">{label}:</span>
      <div className="flex-1 border-b border-black border-dotted min-h-[1.2rem] px-1 overflow-hidden">
        {isEditMode ? (
          <input 
            value={value} 
            onChange={(e) => onChange ? onChange(e.target.value) : setFormData(prev => ({ ...prev, [field!]: e.target.value }))}
            className="w-full bg-transparent outline-none uppercase font-semibold"
          />
        ) : (
          <span className="font-semibold uppercase">{value}</span>
        )}
      </div>
    </div>
  );

  const PhotoSquare = ({ size = "w-32 h-40", label = "FOTO" }) => (
    <div className={`${size} border-2 border-black bg-gray-50 flex-shrink-0 relative group overflow-hidden shadow-sm self-start print:border-black flex flex-col items-center justify-center`}>
      {formData.photoUrl ? (
        <img src={formData.photoUrl} alt="Foto" className="w-full h-full object-cover" />
      ) : (
        <div className="text-center p-2 text-slate-400">
          <User className="h-8 w-8 mx-auto mb-1" />
          <span className="text-[10px] font-bold uppercase">{label}</span>
        </div>
      )}
      {isEditMode && (
        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs font-black">
          <Upload className="h-5 w-5 mb-1" />
          <span>UPLOAD</span>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
        </label>
      )}
    </div>
  );

  return (
    <div className="bg-white text-slate-950 font-serif min-h-screen">
      
      {/* Navigation Header */}
      <div className="print:hidden p-4 bg-slate-900 text-white flex flex-col gap-4 sticky top-0 z-40 shadow-xl border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-xs"><GraduationCap className="h-5 w-5" /></div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-sans font-black text-sm uppercase">Processo Individual do Aluno (Digital)</h3>
                <span className="font-mono text-xs bg-amber-400 text-slate-950 font-bold px-2.5 py-0.5 rounded">
                  Página {currentPage} de 4
                </span>
              </div>
              <p className="font-sans text-xs text-slate-300">Replicação fiel do Prontuário Escolar MINEDH</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isEditMode ? (
              <Button onClick={handleSaveProcess} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5 py-2 px-4 rounded-lg shadow-sm">
                <Save className="h-4 w-4" /> Salvar Alterações
              </Button>
            ) : (
              <Button onClick={() => setIsEditMode(true)} className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black gap-1.5 py-2 px-3.5 rounded-lg shadow-sm">
                <Edit3 className="h-4 w-4" /> Modo de Edição
              </Button>
            )}
            <Button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold gap-1.5 py-2 px-3 rounded-lg shadow-sm"><Printer className="h-4 w-4" /> Imprimir (A4)</Button>
            {onClose && <Button variant="outline" onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 text-xs py-2 px-3.5 rounded-lg">Fechar</Button>}
          </div>
        </div>

        {/* Tab-based Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: 1, label: 'Capa', icon: User },
            { id: 2, label: 'Dados Biográficos', icon: User },
            { id: 3, label: 'Frequência Escolar', icon: Calendar },
            { id: 4, label: 'Saúde Escolar', icon: HeartPulse },
            { id: 5, label: 'Aproveitamento Pedagógico', icon: Award },
            { id: 6, label: 'Faltas Cometidas', icon: CheckSquare },
            { id: 7, label: 'Matrícula, Apreciação e Transferências', icon: FileSpreadsheet },
            { id: 8, label: 'Documentos Anexos', icon: Paperclip }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentPage(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
                currentPage === tab.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="uppercase tracking-tighter">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-700 text-white text-center py-2.5 px-4 font-sans text-xs font-bold flex items-center justify-center gap-2 print:hidden shadow-inner">
          <ShieldCheck className="h-4 w-4" />
          <span>Processo do Aluno atualizado com sucesso!</span>
        </div>
      )}

      {/* Main Process Container */}
      <div className="p-4 md:p-8 max-w-[210mm] mx-auto space-y-8 print:p-0 print:max-w-none print:space-y-0">
        
        {/* PAGE 1: CAPA */}
        {(currentPage === 1 || typeof window === 'undefined') && (
           <div className="border border-black p-8 bg-white min-h-[297mm] flex flex-col print:shadow-none shadow-lg mb-8 print:mb-0 space-y-6">
             <div className="text-center space-y-2">
               <img src={MOZAMBIQUE_EMBLEM_URL} alt="Emblema da República" className="h-24 w-24 mx-auto object-contain" />
               <h1 className="text-xl font-black uppercase text-slate-900 pt-2">República de Moçambique</h1>
               <h2 className="text-lg font-bold uppercase text-slate-800">Ministério da Educação e Desenvolvimento Humano</h2>
               <div className="pt-8 text-left font-bold text-sm">Escola: ________________________________________________</div>
             </div>
             
             <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DottedLine label="Morada" value={formData.address} field="address" />
                  <DottedLine label="Cidade" value={formData.city || ''} onChange={(val) => setFormData(prev => ({...prev, city: val}))} />
                  <DottedLine label="Quarteirão N.º" value={formData.quarteirao || ''} onChange={(val) => setFormData(prev => ({...prev, quarteirao: val}))} />
                  <DottedLine label="Casa N.º" value={formData.casa || ''} onChange={(val) => setFormData(prev => ({...prev, casa: val}))} />
                  <DottedLine label="Telefone" value={formData.phone || ''} onChange={(val) => setFormData(prev => ({...prev, phone: val}))} />
                </div>
                
                <div className="pt-4">
                  <div className="flex items-center gap-2 font-bold text-[11px] mb-2">
                    <span>N.º de Filhos: {children.length}</span>
                    {isEditMode && <button onClick={addChild} className="p-1 bg-slate-900 text-white rounded-full"><Plus size={12} /></button>}
                  </div>
                  {children.map((child, idx) => (
                    <div key={idx} className="flex gap-4 mb-2">
                      <div className="flex-1"><DottedLine label={`Filho ${idx+1}`} value={child.name} onChange={(val) => { const n = [...children]; n[idx].name = val; setChildren(n); }} /></div>
                      <div className="w-20"><DottedLine label="Idade" value={child.age} onChange={(val) => { const n = [...children]; n[idx].age = val; setChildren(n); }} /></div>
                    </div>
                  ))}
                </div>
             </div>

             <div className="text-center pt-8 font-bold text-xs">
               "Educação é a chave do desenvolvimento"<br/>1/5
             </div>
           </div>
        )}

        {/* PAGE 2: DADOS BIOGRÁFICOS + FREQUÊNCIA */}
        {(currentPage === 2 || typeof window === 'undefined') && (
           <div className="border border-black p-8 bg-white min-h-[297mm] flex flex-col print:shadow-none shadow-lg mb-8 print:mb-0 space-y-6">
             <h3 className="text-lg font-black uppercase border-b-2 border-black pb-1">1. DADOS BIOGRÁFICOS</h3>
             {/* ... */}
             <h3 className="text-lg font-black uppercase border-b-2 border-black pb-1 pt-8">2. FREQUÊNCIA ESCOLAR</h3>
             {/* ... */}
             <div className="text-right text-xs font-bold pt-4">2/5</div>
           </div>
        )}

        {/* PAGE 3: SAÚDE ESCOLAR + APROVEITAMENTO PEDAGÓGICO */}
        {(currentPage === 3 || typeof window === 'undefined') && (
           <div className="border border-black p-8 bg-white min-h-[297mm] flex flex-col print:shadow-none shadow-lg mb-8 print:mb-0 space-y-6">
             <h3 className="text-lg font-black uppercase border-b-2 border-black pb-1">3. SAÚDE ESCOLAR</h3>
             {/* ... */}
             <h3 className="text-lg font-black uppercase border-b-2 border-black pb-1 pt-8">4. APROVEITAMENTO PEDAGÓGICO</h3>
             {/* ... */}
             <div className="text-right text-xs font-bold pt-4">3/5</div>
           </div>
        )}

        {/* PAGE 4: FALTAS + APRECIAÇÃO */}
        {(currentPage === 4 || typeof window === 'undefined') && (
           <div className="border border-black p-8 bg-white min-h-[297mm] flex flex-col print:shadow-none shadow-lg mb-8 print:mb-0 space-y-6">
             <h3 className="text-lg font-black uppercase border-b-2 border-black pb-1">5. FALTAS COMETIDAS</h3>
             {/* ... */}
             <h3 className="text-lg font-black uppercase border-b-2 border-black pb-1 pt-8">6. APRECIAÇÃO GERAL E TRANSFERÊNCIAS</h3>
             {/* ... */}
             <div className="text-right text-xs font-bold pt-4">4/5</div>
           </div>
        )}

        {/* PAGE 5: MATRÍCULA AND ORIENTAÇÃO */}
        {(currentPage === 5 || typeof window === 'undefined') && (
           <div className="border border-black p-8 bg-white min-h-[297mm] flex flex-col print:shadow-none shadow-lg mb-8 print:mb-0 space-y-6">
             <h3 className="text-lg font-black uppercase border-b-2 border-black pb-1">7. MATRÍCULA E INSCRIÇÕES</h3>
             {/* ... */}
             <h3 className="text-lg font-black uppercase border-b-2 border-black pb-1 pt-8">B. ORIENTAÇÃO PROFISSIONAL</h3>
             {/* ... */}
             <div className="text-right text-xs font-bold pt-4">5/5</div>
           </div>
        )}

        {/* PAGE 2: SAÚDE E APROVEITAMENTO - MATCHING IMAGE 2 */}
        {(currentPage === 2 || typeof window === 'undefined') && (
          <div className="border border-black p-8 bg-white min-h-[297mm] flex flex-col print:shadow-none shadow-lg mb-8 print:mb-0 space-y-6">
            
            <div className="flex justify-between gap-6 items-start">
               {/* SECTION 3: SAÚDE ESCOLAR */}
               <div className="flex-1 space-y-4">
                  <h4 className="font-black text-sm uppercase">3. SAÚDE ESCOLAR</h4>
                  <div className="space-y-1">
                     <span className="font-bold text-[11px]">a) Vacinas</span>
                     <table className="w-full border-collapse border border-black text-[10px] text-center">
                        <thead>
                           <tr className="bg-gray-50 font-bold">
                              <th className="border border-black p-1 w-20">Data</th>
                              <th className="border border-black p-1">Vacinação</th>
                              <th className="border border-black p-1">Tuberculose</th>
                              <th className="border border-black p-1">Anti - Tétano</th>
                           </tr>
                        </thead>
                        <tbody>
                           {['1ª Dose', '2ª Dose', '3ª Dose'].map((dose, i) => (
                             <tr key={i} className="h-8">
                               <td className="border border-black p-1"></td>
                               <td className="border border-black p-1 font-bold">{dose}</td>
                               <td className="border border-black p-1">{isEditMode ? <input value={i === 0 ? vaccinesTB.dose1 : i === 1 ? vaccinesTB.dose2 : vaccinesTB.dose3} onChange={e => {
                                 const next = {...vaccinesTB};
                                 if (i === 0) next.dose1 = e.target.value; else if (i === 1) next.dose2 = e.target.value; else next.dose3 = e.target.value;
                                 setVaccinesTB(next);
                               }} className="w-full text-center outline-none bg-transparent" /> : (i === 0 ? vaccinesTB.dose1 : i === 1 ? vaccinesTB.dose2 : vaccinesTB.dose3)}</td>
                               <td className="border border-black p-1">{isEditMode ? <input value={i === 0 ? vaccinesTetanus.dose1 : i === 1 ? vaccinesTetanus.dose2 : vaccinesTetanus.dose3} onChange={e => {
                                 const next = {...vaccinesTetanus};
                                 if (i === 0) next.dose1 = e.target.value; else if (i === 1) next.dose2 = e.target.value; else next.dose3 = e.target.value;
                                 setVaccinesTetanus(next);
                               }} className="w-full text-center outline-none bg-transparent" /> : (i === 0 ? vaccinesTetanus.dose1 : i === 1 ? vaccinesTetanus.dose2 : vaccinesTetanus.dose3)}</td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>

               {/* b) Caixa Escolar exactly like Image 2 */}
               <div className="w-80 space-y-4">
                  <div className="border border-black p-3 relative h-48 flex flex-col">
                     <span className="font-bold text-[11px] block mb-2">b) <span className="ml-4 uppercase">Caixa Escolar</span></span>
                     <p className="text-[10px] leading-relaxed">
                       O aluno inscrito neste Processo e na Caixa Escolar, conforme o documento de passagem pela estrutura da (o) ____________________________________________________________________________________________________________, sendo efetivo.
                     </p>
                     <div className="mt-auto text-center space-y-6">
                        <span className="block text-[10px] font-black uppercase">O DIRECTOR</span>
                        <div className="border-t border-black mx-8"></div>
                        <span className="text-[9px] block">Assinatura / Carimbo</span>
                     </div>
                  </div>
                  <div className="flex justify-end">
                     <PhotoSquare size="w-32 h-40" />
                  </div>
               </div>
            </div>
            
            {/* c) Observações Saúde */}
            <div className="space-y-2">
               <span className="font-bold text-[11px]">c) Observações sobre a saúde do (a) aluno (a):</span>
               <div className="border border-black p-2 min-h-[4rem]">
                 {isEditMode ? <textarea value={formData.healthObservations} onChange={e => setFormData({...formData, healthObservations: e.target.value})} className="w-full bg-transparent outline-none resize-none text-[11px]" /> : <span className="text-[11px]">{formData.healthObservations}</span>}
                 <div className="border-b border-black border-dotted h-4 mt-2"></div>
                 <div className="border-b border-black border-dotted h-4"></div>
               </div>
            </div>

            {/* SECTION 4: APROVEITAMENTO PEDAGÓGICO - MATCHING IMAGE 2 (Large Grid) */}
            <div className="space-y-3 pt-4">
               <div className="flex justify-between items-end">
                  <div className="flex items-center gap-4">
                    <h4 className="font-black text-base uppercase">4. APROVEITAMENTO PEDAGÓGICO</h4>
                    {isEditMode && <Button onClick={addAchievementYear} className="bg-slate-900 text-white text-[10px] h-6 px-3 rounded-full flex items-center gap-1"><Plus size={12} /> Adicionar Ano</Button>}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                     <span>(Regime</span>
                     {isEditMode ? <input value={formData.regime} onChange={e => setFormData({...formData, regime: e.target.value})} className="border-b border-black w-32 outline-none text-center bg-transparent" placeholder="DIURNO/NOTURNO" /> : <span className="border-b border-black px-4 min-w-[80px] text-center">{formData.regime || '_________________'}</span>}
                     <span>)</span>
                     <span className="ml-6 font-black">NF= Nota Final</span>
                  </div>
               </div>

               <div className="overflow-x-auto border border-black">
                  <table className="w-full border-collapse text-[8px]">
                     <thead>
                        <tr className="bg-gray-50 font-bold border-b border-black">
                           <th className="border-r border-black p-1 text-left w-36">Ano Lectivo</th>
                           {achievementData.map((yearData: any, i: number) => (
                             <th key={i} className="border-r border-black p-1 w-20 text-center font-mono" colSpan={4}>
                               {isEditMode ? (
                                 <input value={yearData.year} onChange={e => { const n = [...achievementData]; n[i] = {...n[i], year: parseInt(e.target.value)}; setAchievementData(n); }} className="w-full text-center bg-transparent outline-none" />
                               ) : (yearData.year || '20__')}
                             </th>
                           ))}
                        </tr>
                        <tr className="bg-gray-50 font-bold border-b border-black">
                           <th className="border-r border-black p-1 text-left">Classe</th>
                           {achievementData.map((yearData: any, i: number) => (
                             <th key={i} className="border-r border-black p-1" colSpan={4}>
                               {isEditMode ? <input value={yearData.grade} onChange={e => { const n = [...achievementData]; n[i] = {...n[i], grade: e.target.value}; setAchievementData(n); }} className="w-full text-center bg-transparent outline-none" /> : yearData.grade}
                             </th>
                           ))}
                        </tr>
                        <tr className="bg-gray-50 font-bold border-b border-black">
                           <th className="border-r border-black p-1 text-left">Turma</th>
                           {achievementData.map((yearData: any, i: number) => (
                             <th key={i} className="border-r border-black p-1" colSpan={4}>
                               {isEditMode ? <input value={yearData.class} onChange={e => { const n = [...achievementData]; n[i] = {...n[i], class: e.target.value}; setAchievementData(n); }} className="w-full text-center bg-transparent outline-none" /> : yearData.class}
                             </th>
                           ))}
                        </tr>
                        <tr className="bg-gray-50 font-black text-[7px] text-center border-b border-black">
                           <th className="border-r border-black p-1 text-left uppercase">TRIMESTRE</th>
                           {achievementData.map((_, i) => (
                             <React.Fragment key={i}>
                               <th className="border-r border-black p-0.5 w-4">1</th>
                               <th className="border-r border-black p-0.5 w-4">2</th>
                               <th className="border-r border-black p-0.5 w-4">3</th>
                               <th className="border-r border-black p-0.5 w-5 bg-gray-200">NF</th>
                             </React.Fragment>
                           ))}
                        </tr>
                     </thead>
                     <tbody>
                        {filteredSubjects.map((subj, sIdx) => (
                           <tr key={sIdx} className="h-5 border-b border-black/50">
                              <td className="border-r border-black p-1 font-bold uppercase truncate">{typeof subj === 'string' ? subj : (subj as any).name}</td>
                              {achievementData.map((yearData: any, yIdx: number) => {
                                 const subjId = typeof subj === 'string' ? subj : (subj as any).id;
                                 const currentGrades = yearData.subjects?.[subjId] || {};
                                 return (
                                    <React.Fragment key={yIdx}>
                                       <td className="border-r border-black p-0.5 text-center font-mono">{isEditMode ? <input value={currentGrades.t1 || ''} onChange={e => { const n = [...achievementData]; n[yIdx].subjects = {...n[yIdx].subjects, [subjId]: {...currentGrades, t1: e.target.value}}; setAchievementData(n); }} className="w-full text-center bg-transparent" /> : (currentGrades.t1 || '')}</td>
                                       <td className="border-r border-black p-0.5 text-center font-mono">{isEditMode ? <input value={currentGrades.t2 || ''} onChange={e => { const n = [...achievementData]; n[yIdx].subjects = {...n[yIdx].subjects, [subjId]: {...currentGrades, t2: e.target.value}}; setAchievementData(n); }} className="w-full text-center bg-transparent" /> : (currentGrades.t2 || '')}</td>
                                       <td className="border-r border-black p-0.5 text-center font-mono">{isEditMode ? <input value={currentGrades.t3 || ''} onChange={e => { const n = [...achievementData]; n[yIdx].subjects = {...n[yIdx].subjects, [subjId]: {...currentGrades, t3: e.target.value}}; setAchievementData(n); }} className="w-full text-center bg-transparent" /> : (currentGrades.t3 || '')}</td>
                                       <td className="border-r border-black p-0.5 text-center bg-gray-200 font-bold">{isEditMode ? <input value={currentGrades.final || ''} onChange={e => { const n = [...achievementData]; n[yIdx].subjects = {...n[yIdx].subjects, [subjId]: {...currentGrades, final: e.target.value}}; setAchievementData(n); }} className="w-full text-center bg-transparent" /> : (currentGrades.final || '')}</td>
                                    </React.Fragment>
                                 );
                              })}
                           </tr>
                        ))}
                        <tr className="h-12 border-t border-black">
                           <td className="border-r border-black p-1 font-black uppercase text-[7px] leading-tight flex flex-col justify-center h-full">
                              <span>Assinatura</span>
                              <span>do Director da Turma</span>
                           </td>
                           {achievementData.map((_, i) => <td key={i} className="border-r border-black p-1" colSpan={4}></td>)}
                        </tr>
                        <tr className="h-6 border-t border-black">
                           <td className="border-r border-black p-1 font-bold text-center">Data</td>
                           {achievementData.map((_, i) => <td key={i} className="border-r border-black p-1 text-center text-[7px]" colSpan={4}>____ /____ / 20____</td>)}
                        </tr>
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {/* PAGE 3: FALTAS, APRECIAÇÃO E MATRÍCULA - MATCHING IMAGE 3 */}
        {(currentPage === 3 || typeof window === 'undefined') && (
          <div className="border border-black p-8 bg-white min-h-[297mm] flex flex-col print:shadow-none shadow-lg mb-8 print:mb-0 space-y-6">
            
            {/* SECTION 5: FALTAS COMETIDAS */}
            <div className="space-y-2">
               <div className="flex justify-between items-end">
                  <div className="flex items-center gap-4">
                    <h4 className="font-black text-base uppercase">5. FALTAS COMETIDAS</h4>
                    {isEditMode && <Button onClick={addAbsenceYear} className="bg-slate-900 text-white text-[10px] h-6 px-3 rounded-full flex items-center gap-1"><Plus size={12} /> Adicionar Ano</Button>}
                  </div>
                  <span className="text-[11px] font-black">S = SOMA</span>
               </div>
               <table className="w-full border-collapse border border-black text-[10px] text-center">
                  <thead>
                     <tr className="bg-gray-50 font-bold border-b border-black">
                        <th className="border-r border-black p-2 text-left w-40">Ano Lectivo</th>
                        {absencesData.map((row: any, i: number) => (
                          <th key={i} className="border-r border-black p-2 w-20 font-mono" colSpan={4}>
                            {isEditMode ? <input value={row.year} onChange={e => { const n = [...absencesData]; n[i] = {...n[i], year: parseInt(e.target.value) || 2026}; setAbsencesData(n); }} className="w-full text-center bg-transparent outline-none" /> : (row.year || '20____')}
                          </th>
                        ))}
                     </tr>
                     <tr className="bg-gray-50 font-black text-[8px] border-b border-black">
                        <th className="border-r border-black p-1 text-left uppercase tracking-tighter">TRIMESTRE</th>
                        {absencesData.map((_, i) => (
                          <React.Fragment key={i}>
                            <th className="border-r border-black p-1">1</th>
                            <th className="border-r border-black p-1">2</th>
                            <th className="border-r border-black p-1">3</th>
                            <th className="border-r border-black p-1 bg-gray-200">S</th>
                          </React.Fragment>
                        ))}
                     </tr>
                  </thead>
                  <tbody>
                     <tr className="h-8 border-b border-black">
                        <td className="border-r border-black p-1 font-bold text-left uppercase">Faltas Justificadas</td>
                        {absencesData.map((row: any, i: number) => (
                          <React.Fragment key={i}>
                            <td className="border-r border-black p-0.5">{isEditMode ? <input value={row.t1_just || ''} onChange={e => { const n = [...absencesData]; n[i] = {...n[i], t1_just: e.target.value}; setAbsencesData(n); }} className="w-full text-center bg-transparent" /> : row.t1_just}</td>
                            <td className="border-r border-black p-0.5">{isEditMode ? <input value={row.t2_just || ''} onChange={e => { const n = [...absencesData]; n[i] = {...n[i], t2_just: e.target.value}; setAbsencesData(n); }} className="w-full text-center bg-transparent" /> : row.t2_just}</td>
                            <td className="border-r border-black p-0.5">{isEditMode ? <input value={row.t3_just || ''} onChange={e => { const n = [...absencesData]; n[i] = {...n[i], t3_just: e.target.value}; setAbsencesData(n); }} className="w-full text-center bg-transparent" /> : row.t3_just}</td>
                            <td className="border-r border-black p-0.5 bg-gray-100 font-bold">{(parseInt(row.t1_just)||0)+(parseInt(row.t2_just)||0)+(parseInt(row.t3_just)||0)}</td>
                          </React.Fragment>
                        ))}
                     </tr>
                     <tr className="h-8 border-b border-black">
                        <td className="border-r border-black p-1 font-bold text-left uppercase">Faltas Injustificadas</td>
                        {absencesData.map((row: any, i: number) => (
                          <React.Fragment key={i}>
                            <td className="border-r border-black p-0.5">{isEditMode ? <input value={row.t1_unjust || ''} onChange={e => { const n = [...absencesData]; n[i] = {...n[i], t1_unjust: e.target.value}; setAbsencesData(n); }} className="w-full text-center bg-transparent" /> : row.t1_unjust}</td>
                            <td className="border-r border-black p-0.5">{isEditMode ? <input value={row.t2_unjust || ''} onChange={e => { const n = [...absencesData]; n[i] = {...n[i], t2_unjust: e.target.value}; setAbsencesData(n); }} className="w-full text-center bg-transparent" /> : row.t2_unjust}</td>
                            <td className="border-r border-black p-0.5">{isEditMode ? <input value={row.t3_unjust || ''} onChange={e => { const n = [...absencesData]; n[i] = {...n[i], t3_unjust: e.target.value}; setAbsencesData(n); }} className="w-full text-center bg-transparent" /> : row.t3_unjust}</td>
                            <td className="border-r border-black p-0.5 bg-gray-100 font-bold">{(parseInt(row.t1_unjust)||0)+(parseInt(row.t2_unjust)||0)+(parseInt(row.t3_unjust)||0)}</td>
                          </React.Fragment>
                        ))}
                     </tr>
                  </tbody>
               </table>
            </div>

            {/* SECTION 6: APRECIAÇÃO GERAL E TRANSFERÊNCIAS - MATCHING IMAGE 3 */}
            <div className="space-y-4 pt-4">
               <h4 className="font-black text-base uppercase border-b-2 border-black pb-1">6. APRECIAÇÃO GERAL E TRANSFERÊNCIAS</h4>
               
               <div className="grid grid-cols-12 gap-6">
                  {/* Left Column: Annual Appreciations */}
                  <div className="col-span-7 space-y-6">
                     {[1, 2, 3, 4].map(i => (
                        <div key={i} className="border border-black p-3 flex gap-6 h-36">
                           <div className="w-32 space-y-4 text-[10px]">
                              <div className="flex flex-col border-b border-black pb-1">
                                 <span className="font-bold uppercase text-[9px]">Ano Lectivo</span>
                                 <span className="h-5"></span>
                              </div>
                              <div className="flex flex-col border-b border-black pb-1">
                                 <span className="font-bold uppercase text-[9px]">Classe</span>
                                 <span className="h-5"></span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="font-bold uppercase text-[9px]">Turma</span>
                                 <span className="h-5"></span>
                              </div>
                           </div>
                           <div className="flex-1 grid grid-cols-2 gap-4 text-center text-[9px] font-bold">
                              <div className="flex flex-col justify-between">
                                 <div className="text-left">Data: ____/____/20____</div>
                                 <div className="border-t border-black pt-2">Director da Turma<br/>(Assinatura)</div>
                              </div>
                              <div className="flex flex-col justify-between">
                                 <div className="text-left">Data: ____/____/20____</div>
                                 <div className="border-t border-black pt-2">Director da Escola<br/>(Ass./Carimbo)</div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* Right Column: Transfers exactly like Image 3 */}
                  <div className="col-span-5 space-y-4">
                     {/* 6.1 Transferencia Saida */}
                     <div className="border border-black p-3 h-52 text-[10px] relative flex flex-col bg-[#fafafa]">
                        <h5 className="font-black text-[11px] border-b border-black mb-2 text-center bg-gray-100 -m-3 p-1 uppercase">6.1 TRANSFERÊNCIA (Saída)</h5>
                        <p className="leading-relaxed mt-2">
                          Em ____ / ____ / 20____, foi transferido deste estabelecimento para a de ____________________________________________________________________ Província de ___________________________________, tendo levado consigo o seguinte documento(s):
                        </p>
                        <ul className="list-none space-y-1 mt-2 font-bold">
                           <li>1. ___________________________________________________________</li>
                           <li>2. ___________________________________________________________</li>
                           <li>3. ___________________________________________________________</li>
                        </ul>
                        <div className="mt-auto flex justify-between items-end border-t border-black pt-2">
                           <div className="text-left">Data<br/>____ / ____ / 20____</div>
                           <div className="text-center">Director da Escola<br/>(Assinatura)</div>
                        </div>
                     </div>

                     {/* 6.2 Transferencia Chegada */}
                     <div className="border border-black p-3 h-44 text-[10px] relative flex flex-col bg-[#fafafa]">
                        <h5 className="font-black text-[11px] border-b border-black mb-2 text-center bg-gray-100 -m-3 p-1 uppercase">6.2 TRANSFERÊNCIA (Chegada)</h5>
                        <p className="leading-relaxed mt-2">
                          Em ____ / ____ / 20____, veio transferido para esta escola, tendo-se apresentado do (a) qual n.º _______________________________ proveniente da ________________________________________________________ da ____________________________________ Província.
                        </p>
                        <div className="mt-auto flex justify-between items-end border-t border-black pt-2">
                           <div className="text-left">Data<br/>____ / ____ / 20____</div>
                           <div className="text-center">Director da Escola<br/>(Assinatura)</div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* SECTION 7: MATRÍCULA E INSCRIÇÕES - MATCHING IMAGE 3 */}
            <div className="space-y-2 pt-6">
               <div className="flex items-center justify-between">
                  <h4 className="font-black text-base uppercase">7. MATRÍCULA E INSCRIÇÕES</h4>
                  {isEditMode && <Button onClick={addEnrollmentYear} className="bg-slate-900 text-white text-[10px] h-6 px-3 rounded-full flex items-center gap-1"><Plus size={12} /> Adicionar Ano</Button>}
               </div>
               <table className="w-full border-collapse border border-black text-[10px] text-center">
                  <thead>
                     <tr className="bg-gray-50 font-bold border-b border-black">
                        <th className="border-r border-black p-2 text-left w-52">Ano Lectivo</th>
                        {enrollmentHistory.map((row: any, i: number) => (
                          <th key={i} className="border-r border-black p-2 w-32 font-mono">
                             {isEditMode ? <input value={row.year} onChange={e => { const n = [...enrollmentHistory]; n[i] = {...n[i], year: e.target.value}; setEnrollmentHistory(n); }} className="w-full text-center bg-transparent outline-none" /> : (row.year || '20__________')}
                          </th>
                        ))}
                     </tr>
                  </thead>
                  <tbody>
                     <tr className="h-8 border-b border-black">
                        <td className="border-r border-black p-2 font-bold text-left uppercase">Classe</td>
                        {enrollmentHistory.map((row: any, i: number) => <td key={i} className="border-r border-black p-1">{isEditMode ? <input value={row.grade || ''} onChange={e => { const n = [...enrollmentHistory]; n[i] = {...n[i], grade: e.target.value}; setEnrollmentHistory(n); }} className="w-full text-center bg-transparent" /> : row.grade}</td>)}
                     </tr>
                     <tr className="h-8 border-b border-black">
                        <td className="border-r border-black p-2 font-bold text-left uppercase">Turma</td>
                        {enrollmentHistory.map((row: any, i: number) => <td key={i} className="border-r border-black p-1">{isEditMode ? <input value={row.className || ''} onChange={e => { const n = [...enrollmentHistory]; n[i] = {...n[i], className: e.target.value}; setEnrollmentHistory(n); }} className="w-full text-center bg-transparent" /> : row.className}</td>)}
                     </tr>
                     <tr className="h-16 border-b border-black">
                        <td className="border-r border-black p-2 font-bold text-left uppercase leading-tight">Assinatura<br/>do responsável<br/>pela Matrícula</td>
                        {enrollmentHistory.map((row: any, i: number) => <td key={i} className="border-r border-black p-1">{isEditMode ? <input value={row.responsibleSignature || ''} onChange={e => { const n = [...enrollmentHistory]; n[i] = {...n[i], responsibleSignature: e.target.value}; setEnrollmentHistory(n); }} className="w-full text-center bg-transparent" /> : row.responsibleSignature}</td>)}
                     </tr>
                     <tr className="h-8 border-b border-black">
                        <td className="border-r border-black p-2 font-bold text-left uppercase">Data / Carimbo</td>
                        {enrollmentHistory.map((row: any, i: number) => <td key={i} className="border-r border-black p-1 text-center font-mono">{isEditMode ? <input value={row.dateStamp || ''} onChange={e => { const n = [...enrollmentHistory]; n[i] = {...n[i], dateStamp: e.target.value}; setEnrollmentHistory(n); }} className="w-full text-center bg-transparent" /> : (row.dateStamp || '____ / ____ / 20____')}</td>)}
                     </tr>
                  </tbody>
               </table>
            </div>

            {/* SECTION B: ORIENTAÇÃO PROFISSIONAL - MATCHING IMAGE 3 */}
            <div className="pt-8 border-t-2 border-black space-y-4 flex-1">
               <h4 className="font-black text-base uppercase tracking-wider">B. ORIENTAÇÃO PROFISSIONAL</h4>
               <div className="space-y-6 text-[12px]">
                  <div className="space-y-2">
                     <span className="font-bold">Desejo manifestado pelo aluno quanto à profissão futura:</span>
                     <div className="border-b border-black border-dotted h-7 w-full flex items-end px-2">
                       {isEditMode ? <input value={formData.futureProfessionChoice} onChange={e => setFormData({...formData, futureProfessionChoice: e.target.value})} className="w-full bg-transparent outline-none font-bold uppercase" /> : <span className="font-bold uppercase">{formData.futureProfessionChoice}</span>}
                     </div>
                     <div className="border-b border-black border-dotted h-7 w-full"></div>
                  </div>
                  <div className="space-y-2">
                     <span className="font-bold">Observações complementares:</span>
                     <div className="space-y-2">
                        {isEditMode ? (
                          <textarea 
                            value={formData.vocationalObservations} 
                            onChange={e => setFormData({...formData, vocationalObservations: e.target.value})} 
                            className="w-full bg-transparent border border-black/10 rounded p-2 outline-none resize-none h-24" 
                          />
                        ) : (
                          <>
                            <div className="border-b border-black border-dotted h-7 w-full flex items-end px-2">{formData.vocationalObservations}</div>
                            <div className="border-b border-black border-dotted h-7 w-full"></div>
                            <div className="border-b border-black border-dotted h-7 w-full"></div>
                          </>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* PAGE 4: ANEXOS DIGITAIS */}
        {(currentPage === 4 || typeof window === 'undefined') && (
          <div className="border border-black p-12 bg-white min-h-[297mm] print:shadow-none shadow-lg mb-8 print:mb-0 flex flex-col space-y-10">
            <div className="text-center space-y-2">
               <h2 className="text-3xl font-black tracking-[0.4em] uppercase border-b-4 border-black pb-4 inline-block">RELAÇÃO DE DOCUMENTOS ANEXOS</h2>
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">(ARQUIVO DIGITALIZADO)</p>
            </div>
            
            <div className="flex-1 space-y-6 pt-10">
               {isEditMode && (
                 <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl no-print flex items-center justify-between group border border-slate-700">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-blue-600 rounded-xl group-hover:scale-110 transition-transform"><Paperclip className="h-6 w-6" /></div>
                       <div>
                          <span className="text-sm font-black uppercase tracking-tight block">Gestor de Documentação Digital</span>
                          <span className="text-[11px] text-slate-400">Anexe PDFs de Certidões, IDs ou Comprovativos</span>
                       </div>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-6 h-10 rounded-xl shadow-lg shadow-blue-900/20"><Upload size={16} className="mr-2" /> ANEXAR NOVO PDF</Button>
                 </div>
               )}

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {uploadedDocs.length === 0 ? (
                    <div className="col-span-2 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center space-y-4">
                       <Paperclip className="h-12 w-12 text-slate-300 mx-auto" />
                       <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nenhum documento digitalizado anexado</p>
                    </div>
                  ) : (
                    uploadedDocs.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-5 border-2 border-slate-100 rounded-2xl hover:border-blue-400 hover:bg-blue-50/30 transition-all group shadow-sm">
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                               <CheckSquare size={24} />
                            </div>
                            <div>
                               <p className="text-xs font-black uppercase text-slate-900 tracking-tight">{doc.name}</p>
                               <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                                 <span className="bg-slate-200 px-1.5 py-0.2 rounded text-[9px] font-bold">{doc.type}</span>
                                 <span>•</span>
                                 <span>{doc.uploadDate}</span>
                               </p>
                            </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors shadow-xs" title="Visualizar Documento"><Eye size={18} /></button>
                            {isEditMode && <button onClick={() => setUploadedDocs(uploadedDocs.filter(d => d.id !== doc.id))} className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-colors" title="Remover Anexo"><Trash2 size={18} /></button>}
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>

            <div className="mt-auto pt-12">
               <div className="p-8 bg-[#faf8f0] border-2 border-black rounded-xs space-y-4 relative overflow-hidden shadow-inner">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><GraduationCap size={120} /></div>
                  <h4 className="flex items-center gap-3 font-black text-base text-slate-900 uppercase tracking-widest">
                    <ShieldCheck size={24} className="text-emerald-600" /> 
                    CERTIFICAÇÃO OFICIAL DO PRONTUÁRIO DIGITAL
                  </h4>
                  <div className="h-1 w-20 bg-black"></div>
                  <p className="text-[11px] text-slate-800 leading-relaxed font-bold">
                    O SIGE MINEDH certifica que este arquivo digital é o espelhamento eletrônico legal do Prontuário Individual Físico. 
                    A integridade dos dados biográficos, pedagógicos e disciplinares aqui contidos é protegida por criptografia de ponta 
                    e histórico de auditoria imutável, servindo como base para a emissão de Certificados e Declarações Oficiais da República de Moçambique.
                  </p>
                  <div className="flex justify-between items-center pt-4">
                     <span className="text-[10px] font-mono text-slate-500 uppercase">Sistema SIGE • EDUGESTÃO • ANO 2026</span>
                     <div className="flex items-center gap-2">
                        <Code size={14} className="text-slate-400" />
                        <span className="text-[10px] font-mono font-black text-slate-900">{student.id}</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Footer Navigation (Mobile/Standard only) */}
        <div className="flex justify-between items-center print:hidden pt-6 border-t border-slate-200 font-sans">
           <Button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} variant="outline" className="flex items-center gap-3 h-11 px-6 rounded-xl font-bold border-slate-300 hover:bg-slate-50 transition-all"><ChevronLeft className="h-5 w-5" /> Anterior</Button>
           <div className="flex flex-col items-center">
             <span className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Página {currentPage} de 4</span>
             <div className="flex gap-1 mt-1.5">
                {[1,2,3,4].map(i => <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${currentPage === i ? 'bg-amber-500 w-10' : 'bg-slate-200'}`}></div>)}
             </div>
           </div>
           <Button disabled={currentPage === 4} onClick={() => setCurrentPage(prev => prev + 1)} variant="outline" className="flex items-center gap-3 h-11 px-6 rounded-xl font-bold border-slate-300 hover:bg-slate-50 transition-all">Próxima <ChevronRight className="h-5 w-5" /></Button>
        </div>
      </div>
    </div>
  );
}
