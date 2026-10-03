import React, { useState } from 'react';
import { Employee } from '../types';
import { useStore } from '../store';
import { 
  FileText, Save, Printer, X, Paperclip, Plus, Trash2, Check, Eye, 
  FolderOpen, UserCheck, Upload, Edit3, ChevronLeft, ChevronRight,
  User, Briefcase, Award, Calendar, FileCheck, ShieldCheck
} from 'lucide-react';
import { Button } from './ui';

interface EmployeeProcessDocumentProps {
  employee: Employee;
  onClose?: () => void;
  onSaveSuccess?: () => void;
  isNewRegistration?: boolean;
}

export function EmployeeProcessDocument({
  employee,
  onClose,
  onSaveSuccess,
  isNewRegistration = false
}: EmployeeProcessDocumentProps) {
  const { updateEmployee, addEmployee, activeSchool } = useStore();
  const schoolName = activeSchool?.name || 'Escola Secundária Central';

  const [isEditMode, setIsEditMode] = useState<boolean>(isNewRegistration);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Form State matching the images
  const [formData, setFormData] = useState({
    id: employee.id || `EMP-${Date.now()}`,
    processNumber: employee.processNumber || '',
    section: employee.section || '',
    name: employee.name || '',
    sector: (employee as any).sector || '',
    entryDate: (employee as any).entryDate || '',
    birthPlace: employee.birthPlace || '',
    birthDate: employee.birthDate || '',
    idCardNumber: employee.idCardNumber || '',
    idCardIssuedAt: employee.idCardIssuedAt || '',
    literaryQualifications: (employee as any).literaryQualifications || '',
    professionalQualifications: (employee as any).professionalQualifications || '',
    career: employee.career || '',
    nationalitySector: (employee as any).nationalitySector || '',
    address: employee.address || '',
    city: (employee as any).city || '',
    blockNumber: (employee as any).blockNumber || '',
    houseNumber: (employee as any).houseNumber || '',
    phone: employee.phone || '',
    admissionDate: (employee as any).admissionDate || '',
    category: employee.category || '',
    observations: employee.observations || '',
    photoUrl: employee.photoUrl || '',
  });

  // History tables
  const [previousJobs, setPreviousJobs] = useState(employee.previousWorkHistory && employee.previousWorkHistory.length > 0 ? employee.previousWorkHistory : Array(5).fill({ year: '', companyOrService: '', obs: '' }));
  const [children, setChildren] = useState(employee.minorChildrenList && employee.minorChildrenList.length > 0 ? employee.minorChildrenList : Array(4).fill({ birthDate: '', name: '', birthDate2: '', name2: '' }));
  const [evolutionProf, setEvolutionProf] = useState(employee.professionalQualificationsEvolution && employee.professionalQualificationsEvolution.length > 0 ? employee.professionalQualificationsEvolution : Array(5).fill({ date: '', description: '' }));
  const [evolutionLit, setEvolutionLiterary] = useState(employee.literaryQualificationsEvolution && employee.literaryQualificationsEvolution.length > 0 ? employee.literaryQualificationsEvolution : Array(5).fill({ date: '', description: '' }));
  
  // Page 3 tables
  const [variations, setVariations] = useState(employee.categoryAndSalaryVariations && employee.categoryAndSalaryVariations.length > 0 ? employee.categoryAndSalaryVariations : Array(5).fill({ date: '', category: '', salary: '', date2: '', category2: '', salary2: '' }));
  const [vacations, setVacations] = useState(employee.vacationMovement && employee.vacationMovement.length > 0 ? employee.vacationMovement : Array(10).fill({ period: '', days: '', justifiedAbsences: '', unjustifiedDays: '', daysToEnjoy: '', startDate: '', endDate: '', rubric: '' }));
  const [annualAbsences, setAnnualAbsences] = useState(employee.annualAbsences && employee.annualAbsences.length > 0 ? employee.annualAbsences : Array(5).fill({ date: '', category: '', salary: '', date2: '', category2: '', salary2: '' }));

  // Page 4 tables
  const [annexList, setAnnexList] = useState(employee.attachedDocuments && employee.attachedDocuments.length > 0 ? employee.attachedDocuments : Array(20).fill({ date: '', title: '' }));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => setFormData({ ...formData, photoUrl: event.target?.result as string });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveProcess = () => {
    const payload = {
      ...formData,
      previousWorkHistory: previousJobs,
      minorChildrenList: children,
      professionalQualificationsEvolution: evolutionProf,
      literaryQualificationsEvolution: evolutionLit,
      categoryAndSalaryVariations: variations,
      vacationMovement: vacations,
      annualAbsences,
      attachedDocuments: annexList
    };
    if (employee.id && updateEmployee) updateEmployee(employee.id, payload as any);
    else if (addEmployee) addEmployee(payload as any);
    setSaveSuccess(true);
    setIsEditMode(false);
    if (onSaveSuccess) onSaveSuccess();
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const PhotoSquare = ({ size = "w-32 h-40", label = "FOTO" }) => (
    <div className={`${size} border-2 border-black bg-gray-50 flex-shrink-0 relative group overflow-hidden shadow-sm self-start print:border-black flex flex-col items-center justify-center`}>
      {formData.photoUrl ? (
        <img src={formData.photoUrl} alt="Foto" className="w-full h-full object-cover" />
      ) : (
        <div className="text-center p-2 text-slate-400">
          <UserCheck className="h-8 w-8 mx-auto mb-1" />
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
            <div className="p-2.5 rounded-xl bg-blue-600 text-white font-bold shadow-xs"><FolderOpen className="h-5 w-5" /></div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-sans font-black text-sm uppercase">Processo Individual do Funcionário</h3>
                <span className="font-mono text-xs bg-amber-400 text-slate-950 font-bold px-2.5 py-0.5 rounded">
                  Página {currentPage} de 4
                </span>
              </div>
              <p className="font-sans text-xs text-slate-300">Estrutura oficial de prontuário escolar</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isEditMode ? (
              <Button onClick={handleSaveProcess} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5 py-2 px-4 rounded-lg shadow-sm">
                <Save className="h-4 w-4" /> Salvar Processo
              </Button>
            ) : (
              <Button onClick={() => setIsEditMode(true)} className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black gap-1.5 py-2 px-3.5 rounded-lg shadow-sm">
                <Edit3 className="h-4 w-4" /> Editar
              </Button>
            )}
            <Button onClick={() => window.print()} className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold gap-1.5 py-2 px-3 rounded-lg shadow-sm"><Printer className="h-4 w-4" /> Imprimir</Button>
            {onClose && <Button variant="outline" onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 text-xs py-2 px-3.5 rounded-lg">Fechar</Button>}
          </div>
        </div>

        {/* Tab-based Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: 1, label: 'Capa / Identificação', icon: User },
            { id: 2, label: 'Histórico / Família', icon: Briefcase },
            { id: 3, label: 'Carreira / Férias', icon: Award },
            { id: 4, label: 'Documentos Anexos', icon: Paperclip }
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
          <Check className="h-4 w-4" />
          <span>Processo Individual atualizado com sucesso!</span>
        </div>
      )}

      {/* Main Process Container */}
      <div className="p-4 md:p-8 max-w-[210mm] mx-auto space-y-8 print:p-0 print:max-w-none print:space-y-0">
        
        {/* PAGE 1: CAPA */}
        {(currentPage === 1 || typeof window === 'undefined') && (
          <div className="border-[1.5px] border-black p-0 bg-white relative min-h-[297mm] flex print:shadow-none shadow-lg mb-8 print:mb-0">
            
            {/* Left Spine / Vertical Sidebar */}
            <div className="w-16 border-r-[1.5px] border-black flex flex-col items-center justify-between py-12 px-2 h-full absolute top-0 left-0">
               <div className="flex flex-col items-center gap-2" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                  <span className="text-[12px] font-black tracking-[0.4em] uppercase">SECÇÃO</span>
                  <div className="h-24 w-[1px] bg-black my-2"></div>
               </div>
               
               <div className="flex flex-col items-center gap-2" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                  <span className="text-[14px] font-black tracking-[0.5em] uppercase">NOME</span>
                  <div className="h-48 w-[1px] bg-black my-2"></div>
               </div>

               <div className="flex flex-col items-center gap-2 mt-12" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                  <span className="text-[11px] font-black tracking-widest uppercase">PROCESSO INDIVIDUAL N.º —</span>
                  <div className="h-40 w-[1px] bg-black mt-2"></div>
               </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 ml-16 p-8 flex flex-col relative h-full">
               
               {/* Institutional Header (Dados Institucionais) */}
               <div className="text-center space-y-1 mb-8 pt-4">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Emblem_of_Mozambique.svg/600px-Emblem_of_Mozambique.svg.png" 
                    alt="Emblema da República" 
                    className="h-16 w-16 mx-auto mb-2 object-contain"
                  />
                  <h3 className="font-black text-[10px] uppercase tracking-widest">REPÚBLICA DE MOÇAMBIQUE</h3>
                  <h3 className="font-bold text-[9px] uppercase tracking-wider text-slate-800">MINISTÉRIO DA EDUCAÇÃO E DESENVOLVIMENTO HUMANO</h3>
                  <div className="flex items-center justify-center gap-2 pt-2">
                     <span className="font-black text-[11px] uppercase">ESCOLA:</span>
                     <div className="border-b border-black border-dotted px-2 min-w-[300px]">
                        {isEditMode ? (
                           <input 
                              value={schoolName} 
                              className="w-full bg-transparent text-center font-bold uppercase text-[11px] outline-none"
                              readOnly // Currently controlled by store
                           />
                        ) : (
                           <span className="font-bold uppercase text-[11px]">{schoolName}</span>
                        )}
                     </div>
                  </div>
               </div>

               {/* Header Row: Process No and Photo */}
               <div className="flex justify-between items-start mb-12">
                  {/* Top Left Process Box */}
                  <div className="border-[1.5px] border-black p-3 min-w-[140px] text-center bg-white shadow-sm">
                     <span className="block text-[10px] font-black mb-1 font-sans">PROCESSO</span>
                     <div className="flex items-center justify-center gap-1 font-black text-[12px]">
                        <span>N.º</span>
                        <div className="border-[1.5px] border-black w-24 h-6 flex items-center justify-center">
                           {isEditMode ? (
                             <input 
                               value={formData.processNumber} 
                               onChange={e => setFormData({...formData, processNumber: e.target.value})}
                               className="w-full h-full text-center outline-none bg-transparent font-bold text-xs"
                             />
                           ) : (
                             <span className="font-bold text-xs">{formData.processNumber}</span>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Top Right Photo */}
                  <PhotoSquare size="w-36 h-48" label="FOTO" />
               </div>

               {/* Center Title and Fields */}
               <div className="flex-1 flex flex-col items-center pt-10 space-y-12">
                  <h1 className="text-5xl md:text-6xl font-black tracking-[0.25em] leading-tight text-center font-serif">
                     PROCESSO<br/>INDIVIDUAL
                  </h1>
                  
                  <div className="w-full max-w-2xl space-y-8 flex flex-col items-center">
                     <h2 className="text-2xl font-black tracking-[0.6em] font-serif">D E</h2>
                     
                     {/* Horizontal Input Box */}
                     <div className="w-full border-[1.5px] border-black h-12 flex items-center px-4 shadow-sm bg-white">
                        {isEditMode ? (
                          <input 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full text-xl font-black text-center outline-none bg-transparent font-serif"
                          />
                        ) : (
                          <span className="w-full text-xl font-black text-center uppercase font-serif">{formData.name}</span>
                        )}
                     </div>

                     {/* Extra Lines */}
                     <div className="w-full space-y-4 pt-4">
                        <div className="border-b-[1.5px] border-black w-full h-1"></div>
                        <div className="border-b-[1.5px] border-black w-full h-1"></div>
                        <div className="border-b-[1.5px] border-black w-full h-1"></div>
                     </div>

                     {/* Bottom Double Box Structure */}
                     <div className="mt-12 w-full flex justify-center pt-8">
                        <div className="border-[1.5px] border-black p-6 w-[80%] h-32 flex flex-col items-center justify-center relative">
                           <span className="absolute top-2 left-6 text-[10px] font-black uppercase">SECÇÃO</span>
                           <div className="border-[1.5px] border-black w-full h-10 flex items-center px-4 mt-4">
                              {isEditMode ? (
                                <input 
                                  value={formData.section} 
                                  onChange={e => setFormData({...formData, section: e.target.value})}
                                  className="w-full text-center outline-none bg-transparent font-bold text-sm"
                                />
                              ) : (
                                <span className="w-full text-center font-bold text-sm uppercase tracking-widest">{formData.section}</span>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Page number indicator in footer (match physical footer) */}
               <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center">
                  <div className="text-[10px] font-black tracking-[0.3em] uppercase opacity-60">
                     PÁGINA 1 DE 4
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* PAGE 2: IDENTIFICAÇÃO E HISTÓRICO */}
        {(currentPage === 2 || typeof window === 'undefined') && (
          <div className="border border-black p-8 bg-white min-h-[297mm] text-[11px] print:shadow-none shadow-lg mb-8 print:mb-0 space-y-6">
            <div className="flex justify-between gap-6">
               <div className="flex-1 space-y-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold">NOME:</span>
                    <span className="flex-1 border-b border-black border-dotted px-2 uppercase font-bold min-h-[1.2rem]">{formData.name}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold">Nº DO PROCESSO INDIVIDUAL:</span>
                    <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.processNumber}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex items-baseline gap-2">
                       <span className="font-bold">SECTOR:</span>
                       {isEditMode ? (
                         <input value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})} className="flex-1 border-b border-black outline-none bg-transparent" />
                       ) : (
                         <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.sector}</span>
                       )}
                     </div>
                     <div className="flex items-baseline gap-2">
                       <span className="font-bold">DATA DE INGRESSO:</span>
                       {isEditMode ? (
                         <input type="date" value={formData.entryDate} onChange={e => setFormData({...formData, entryDate: e.target.value})} className="flex-1 border-b border-black outline-none bg-transparent" />
                       ) : (
                         <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.entryDate}</span>
                       )}
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex items-baseline gap-2">
                       <span className="font-bold">NATURALIDADE:</span>
                       {isEditMode ? (
                         <input value={formData.birthPlace} onChange={e => setFormData({...formData, birthPlace: e.target.value})} className="flex-1 border-b border-black outline-none bg-transparent" />
                       ) : (
                         <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.birthPlace}</span>
                       )}
                     </div>
                     <div className="flex items-baseline gap-2">
                       <span className="font-bold">DATA DE NASCIMENTO:</span>
                       {isEditMode ? (
                         <input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="flex-1 border-b border-black outline-none bg-transparent" />
                       ) : (
                         <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.birthDate}</span>
                       )}
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="flex items-baseline gap-2">
                       <span className="font-bold">BI Nº:</span>
                       {isEditMode ? (
                         <input value={formData.idCardNumber} onChange={e => setFormData({...formData, idCardNumber: e.target.value})} className="flex-1 border-b border-black outline-none bg-transparent" />
                       ) : (
                         <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.idCardNumber}</span>
                       )}
                     </div>
                     <div className="flex items-baseline gap-2">
                       <span className="font-bold">EMITIDO A:</span>
                       {isEditMode ? (
                         <input value={formData.idCardIssuedAt} onChange={e => setFormData({...formData, idCardIssuedAt: e.target.value})} className="flex-1 border-b border-black outline-none bg-transparent" />
                       ) : (
                         <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.idCardIssuedAt}</span>
                       )}
                     </div>
                  </div>
               </div>
               <PhotoSquare size="w-32 h-40" />
            </div>

            <div className="space-y-4">
               <div className="flex items-baseline gap-2">
                 <span className="font-bold whitespace-nowrap">Habilitações Literárias:</span>
                 {isEditMode ? (
                   <input value={formData.literaryQualifications} onChange={e => setFormData({...formData, literaryQualifications: e.target.value})} className="flex-1 border-b border-black outline-none bg-transparent" />
                 ) : (
                   <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.literaryQualifications}</span>
                 )}
               </div>
               <div className="flex items-baseline gap-2">
                 <span className="font-bold whitespace-nowrap">Habilitações Profissionais:</span>
                 {isEditMode ? (
                   <input value={formData.professionalQualifications} onChange={e => setFormData({...formData, professionalQualifications: e.target.value})} className="flex-1 border-b border-black outline-none bg-transparent" />
                 ) : (
                   <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.professionalQualifications}</span>
                 )}
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold whitespace-nowrap">Carreira Profissional:</span>
                    {isEditMode ? (
                      <input value={formData.career} onChange={e => setFormData({...formData, career: e.target.value})} className="flex-1 border-b border-black outline-none bg-transparent" />
                    ) : (
                      <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.career}</span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold whitespace-nowrap">Sector de Nacionalidade:</span>
                    {isEditMode ? (
                      <input value={formData.nationalitySector} onChange={e => setFormData({...formData, nationalitySector: e.target.value})} className="flex-1 border-b border-black outline-none bg-transparent" />
                    ) : (
                      <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.nationalitySector}</span>
                    )}
                  </div>
               </div>
            </div>

            <div className="space-y-2">
               <h4 className="text-center font-bold uppercase border-y border-black py-1">EMPREGOS/SERVIÇOS TRABALHADOS ANTERIORMENTE</h4>
               <table className="w-full border-collapse border border-black">
                  <thead>
                     <tr className="bg-gray-50 text-center font-bold">
                        <th className="border border-black p-1 w-20">Ano</th>
                        <th className="border border-black p-1">Empresa ou Serviço</th>
                        <th className="border border-black p-1 w-40">Observações</th>
                     </tr>
                  </thead>
                  <tbody>
                     {previousJobs.map((job: any, idx: number) => (
                        <tr key={idx}>
                           <td className="border border-black p-1 text-center">
                              {isEditMode ? <input value={job.year} onChange={e => {
                                const next = [...previousJobs]; next[idx] = {...next[idx], year: e.target.value}; setPreviousJobs(next);
                              }} className="w-full text-center outline-none bg-transparent" /> : job.year}
                           </td>
                           <td className="border border-black p-1">
                              {isEditMode ? <input value={job.companyOrService} onChange={e => {
                                const next = [...previousJobs]; next[idx] = {...next[idx], companyOrService: e.target.value}; setPreviousJobs(next);
                              }} className="w-full outline-none bg-transparent" /> : job.companyOrService}
                           </td>
                           <td className="border border-black p-1">
                              {isEditMode ? <input value={job.obs} onChange={e => {
                                const next = [...previousJobs]; next[idx] = {...next[idx], obs: e.target.value}; setPreviousJobs(next);
                              }} className="w-full outline-none bg-transparent" /> : job.obs}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2">
               <div className="flex items-baseline gap-2">
                 <span className="font-bold">Morada:</span>
                 {isEditMode ? (
                   <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="flex-1 border-b border-black outline-none bg-transparent" />
                 ) : (
                   <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.address}</span>
                 )}
               </div>
               <div className="grid grid-cols-4 gap-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold">Cidade:</span>
                    {isEditMode ? (
                      <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="flex-1 border-b border-black outline-none bg-transparent" />
                    ) : (
                      <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.city}</span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold whitespace-nowrap">Quarteirão Nº:</span>
                    {isEditMode ? (
                      <input value={formData.blockNumber} onChange={e => setFormData({...formData, blockNumber: e.target.value})} className="flex-1 border-b border-black outline-none bg-transparent" />
                    ) : (
                      <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.blockNumber}</span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold whitespace-nowrap">Casa Nº:</span>
                    {isEditMode ? (
                      <input value={formData.houseNumber} onChange={e => setFormData({...formData, houseNumber: e.target.value})} className="flex-1 border-b border-black outline-none bg-transparent" />
                    ) : (
                      <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.houseNumber}</span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold">Telefone:</span>
                    {isEditMode ? (
                      <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="flex-1 border-b border-black outline-none bg-transparent" />
                    ) : (
                      <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.phone}</span>
                    )}
                  </div>
               </div>
            </div>

            <div className="space-y-2">
               <h4 className="font-bold">Filhos menores</h4>
               <table className="w-full border-collapse border border-black">
                  <thead>
                     <tr className="bg-gray-50 text-center font-bold">
                        <th className="border border-black p-1 w-32">Data de Nascimento</th>
                        <th className="border border-black p-1">Nome</th>
                        <th className="border border-black p-1 w-32">Data de Nascimento</th>
                        <th className="border border-black p-1">Nome</th>
                     </tr>
                  </thead>
                  <tbody>
                     {children.map((child: any, idx: number) => (
                        <tr key={idx}>
                           <td className="border border-black p-1 text-center font-mono">
                              {isEditMode ? <input type="date" value={child.birthDate} onChange={e => {
                                const next = [...children]; next[idx] = {...next[idx], birthDate: e.target.value}; setChildren(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : child.birthDate}
                           </td>
                           <td className="border border-black p-1">
                              {isEditMode ? <input value={child.name} onChange={e => {
                                const next = [...children]; next[idx] = {...next[idx], name: e.target.value}; setChildren(next);
                              }} className="w-full outline-none bg-transparent" /> : child.name}
                           </td>
                           <td className="border border-black p-1 text-center font-mono">
                              {isEditMode ? <input type="date" value={child.birthDate2} onChange={e => {
                                const next = [...children]; next[idx] = {...next[idx], birthDate2: e.target.value}; setChildren(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : child.birthDate2}
                           </td>
                           <td className="border border-black p-1">
                              {isEditMode ? <input value={child.name2} onChange={e => {
                                const next = [...children]; next[idx] = {...next[idx], name2: e.target.value}; setChildren(next);
                              }} className="w-full outline-none bg-transparent" /> : child.name2}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="flex items-baseline gap-2">
                 <span className="font-bold">Data de Admissão:</span>
                 {isEditMode ? (
                   <input type="date" value={formData.admissionDate} onChange={e => setFormData({...formData, admissionDate: e.target.value})} className="flex-1 border-b border-black outline-none bg-transparent" />
                 ) : (
                   <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.admissionDate}</span>
                 )}
               </div>
               <div className="flex items-baseline gap-2">
                 <span className="font-bold">Categoria:</span>
                 {isEditMode ? (
                   <input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="flex-1 border-b border-black outline-none bg-transparent" />
                 ) : (
                   <span className="flex-1 border-b border-black border-dotted px-2 min-h-[1.2rem]">{formData.category}</span>
                 )}
               </div>
            </div>

            <div className="space-y-4">
               <div className="space-y-1">
                  <h4 className="text-center font-bold uppercase border-y border-black py-1">EVOLUÇÃO DE HABILITAÇÕES PROFISSIONAIS</h4>
                  <table className="w-full border-collapse border border-black">
                     <thead>
                        <tr className="bg-gray-50 text-center font-bold">
                           <th className="border border-black p-1 w-32">DATA</th>
                           <th className="border border-black p-1">DESCRIÇÃO</th>
                        </tr>
                     </thead>
                     <tbody>
                        {evolutionProf.map((ev: any, idx: number) => (
                           <tr key={idx}>
                              <td className="border border-black p-1 text-center font-mono">
                                 {isEditMode ? <input type="date" value={ev.date} onChange={e => {
                                   const next = [...evolutionProf]; next[idx] = {...next[idx], date: e.target.value}; setEvolutionProf(next);
                                 }} className="w-full outline-none bg-transparent text-center" /> : ev.date}
                              </td>
                              <td className="border border-black p-1">
                                 {isEditMode ? <input value={ev.description} onChange={e => {
                                   const next = [...evolutionProf]; next[idx] = {...next[idx], description: e.target.value}; setEvolutionProf(next);
                                 }} className="w-full outline-none bg-transparent" /> : ev.description}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               <div className="space-y-1">
                  <h4 className="text-center font-bold uppercase border-y border-black py-1">EVOLUÇÃO DE HABILITAÇÕES LITERÁRIAS</h4>
                  <table className="w-full border-collapse border border-black">
                     <thead>
                        <tr className="bg-gray-50 text-center font-bold">
                           <th className="border border-black p-1 w-32">DATA</th>
                           <th className="border border-black p-1">DESCRIÇÃO</th>
                        </tr>
                     </thead>
                     <tbody>
                        {evolutionLit.map((ev: any, idx: number) => (
                           <tr key={idx}>
                              <td className="border border-black p-1 text-center font-mono">
                                 {isEditMode ? <input type="date" value={ev.date} onChange={e => {
                                   const next = [...evolutionLit]; next[idx] = {...next[idx], date: e.target.value}; setEvolutionLiterary(next);
                                 }} className="w-full outline-none bg-transparent text-center" /> : ev.date}
                              </td>
                              <td className="border border-black p-1">
                                 {isEditMode ? <input value={ev.description} onChange={e => {
                                   const next = [...evolutionLit]; next[idx] = {...next[idx], description: e.target.value}; setEvolutionLiterary(next);
                                 }} className="w-full outline-none bg-transparent" /> : ev.description}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {/* PAGE 3: VARIAÇÕES, FÉRIAS E FALTAS */}
        {(currentPage === 3 || typeof window === 'undefined') && (
          <div className="border border-black p-8 bg-white min-h-[297mm] text-[10px] print:shadow-none shadow-lg mb-8 print:mb-0 space-y-6">
            <div className="space-y-2">
               <h4 className="text-center font-bold uppercase border-y border-black py-1">VARIAÇÕES DE CATEGORIAS E VENCIMENTOS</h4>
               <table className="w-full border-collapse border border-black text-center">
                  <thead>
                     <tr className="bg-gray-50 font-bold">
                        <th className="border border-black p-1 w-20">DATA</th>
                        <th className="border border-black p-1">CATEGORIA</th>
                        <th className="border border-black p-1 w-24">VENCIMENTO</th>
                        <th className="border border-black p-1 w-20">DATA</th>
                        <th className="border border-black p-1">CATEGORIA</th>
                        <th className="border border-black p-1 w-24">VENCIMENTO</th>
                     </tr>
                  </thead>
                  <tbody>
                     {variations.map((v: any, idx: number) => (
                        <tr key={idx}>
                           <td className="border border-black p-1 font-mono">
                              {isEditMode ? <input value={v.date} onChange={e => {
                                const next = [...variations]; next[idx] = {...next[idx], date: e.target.value}; setVariations(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : v.date}
                           </td>
                           <td className="border border-black p-1">
                              {isEditMode ? <input value={v.category} onChange={e => {
                                const next = [...variations]; next[idx] = {...next[idx], category: e.target.value}; setVariations(next);
                              }} className="w-full outline-none bg-transparent" /> : v.category}
                           </td>
                           <td className="border border-black p-1 font-mono">
                              {isEditMode ? <input value={v.salary} onChange={e => {
                                const next = [...variations]; next[idx] = {...next[idx], salary: e.target.value}; setVariations(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : v.salary}
                           </td>
                           <td className="border border-black p-1 font-mono">
                              {isEditMode ? <input value={v.date2} onChange={e => {
                                const next = [...variations]; next[idx] = {...next[idx], date2: e.target.value}; setVariations(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : v.date2}
                           </td>
                           <td className="border border-black p-1">
                              {isEditMode ? <input value={v.category2} onChange={e => {
                                const next = [...variations]; next[idx] = {...next[idx], category2: e.target.value}; setVariations(next);
                              }} className="w-full outline-none bg-transparent" /> : v.category2}
                           </td>
                           <td className="border border-black p-1 font-mono">
                              {isEditMode ? <input value={v.salary2} onChange={e => {
                                const next = [...variations]; next[idx] = {...next[idx], salary2: e.target.value}; setVariations(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : v.salary2}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <div className="space-y-2">
               <h4 className="text-center font-bold uppercase border-y border-black py-1">MOVIMENTO DE FÉRIAS</h4>
               <table className="w-full border-collapse border border-black text-center text-[9px]">
                  <thead>
                     <tr className="bg-gray-50 font-bold">
                        <th rowSpan={2} className="border border-black p-1">Férias relativas ao Período de:</th>
                        <th rowSpan={2} className="border border-black p-1 w-12">Dias</th>
                        <th colSpan={2} className="border border-black p-1">FALTAS AO SERVIÇO</th>
                        <th rowSpan={2} className="border border-black p-1 w-14">Dia a gozar</th>
                        <th colSpan={2} className="border border-black p-1">GOZO DE FÉRIAS</th>
                        <th rowSpan={2} className="border border-black p-1 w-20">Rubrica</th>
                     </tr>
                     <tr className="bg-gray-50 font-bold text-[8px]">
                        <th className="border border-black p-1 w-14">Injustificadas</th>
                        <th className="border border-black p-1 w-14">Não Justificadas</th>
                        <th className="border border-black p-1 w-20">Início</th>
                        <th className="border border-black p-1 w-20">Término</th>
                     </tr>
                  </thead>
                  <tbody>
                     {vacations.map((vac: any, idx: number) => (
                        <tr key={idx} className="h-6">
                           <td className="border border-black p-0.5">
                              {isEditMode ? <input value={vac.period} onChange={e => {
                                const next = [...vacations]; next[idx] = {...next[idx], period: e.target.value}; setVacations(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : vac.period}
                           </td>
                           <td className="border border-black p-0.5">
                              {isEditMode ? <input value={vac.days} onChange={e => {
                                const next = [...vacations]; next[idx] = {...next[idx], days: e.target.value}; setVacations(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : vac.days}
                           </td>
                           <td className="border border-black p-0.5">
                              {isEditMode ? <input value={vac.justifiedAbsences} onChange={e => {
                                const next = [...vacations]; next[idx] = {...next[idx], justifiedAbsences: e.target.value}; setVacations(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : vac.justifiedAbsences}
                           </td>
                           <td className="border border-black p-0.5">
                              {isEditMode ? <input value={vac.unjustifiedDays} onChange={e => {
                                const next = [...vacations]; next[idx] = {...next[idx], unjustifiedDays: e.target.value}; setVacations(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : vac.unjustifiedDays}
                           </td>
                           <td className="border border-black p-0.5">
                              {isEditMode ? <input value={vac.daysToEnjoy} onChange={e => {
                                const next = [...vacations]; next[idx] = {...next[idx], daysToEnjoy: e.target.value}; setVacations(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : vac.daysToEnjoy}
                           </td>
                           <td className="border border-black p-0.5 font-mono">
                              {isEditMode ? <input value={vac.startDate} onChange={e => {
                                const next = [...vacations]; next[idx] = {...next[idx], startDate: e.target.value}; setVacations(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : vac.startDate}
                           </td>
                           <td className="border border-black p-0.5 font-mono">
                              {isEditMode ? <input value={vac.endDate} onChange={e => {
                                const next = [...vacations]; next[idx] = {...next[idx], endDate: e.target.value}; setVacations(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : vac.endDate}
                           </td>
                           <td className="border border-black p-0.5">
                              {isEditMode ? <input value={vac.rubric} onChange={e => {
                                const next = [...vacations]; next[idx] = {...next[idx], rubric: e.target.value}; setVacations(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : vac.rubric}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <div className="space-y-2">
               <h4 className="text-center font-bold uppercase border-y border-black py-1">FALTAS ANUAIS</h4>
               <table className="w-full border-collapse border border-black text-center">
                  <thead>
                     <tr className="bg-gray-50 font-bold">
                        <th className="border border-black p-1 w-20">DATA</th>
                        <th className="border border-black p-1">CATEGORIA</th>
                        <th className="border border-black p-1 w-24">VENCIMENTO</th>
                        <th className="border border-black p-1 w-20">DATA</th>
                        <th className="border border-black p-1">CATEGORIA</th>
                        <th className="border border-black p-1 w-24">VENCIMENTO</th>
                     </tr>
                  </thead>
                  <tbody>
                     {annualAbsences.map((v: any, idx: number) => (
                        <tr key={idx}>
                           <td className="border border-black p-1 font-mono">
                              {isEditMode ? <input value={v.date} onChange={e => {
                                const next = [...annualAbsences]; next[idx] = {...next[idx], date: e.target.value}; setAnnualAbsences(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : v.date}
                           </td>
                           <td className="border border-black p-1">
                              {isEditMode ? <input value={v.category} onChange={e => {
                                const next = [...annualAbsences]; next[idx] = {...next[idx], category: e.target.value}; setAnnualAbsences(next);
                              }} className="w-full outline-none bg-transparent" /> : v.category}
                           </td>
                           <td className="border border-black p-1 font-mono">
                              {isEditMode ? <input value={v.salary} onChange={e => {
                                const next = [...annualAbsences]; next[idx] = {...next[idx], salary: e.target.value}; setAnnualAbsences(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : v.salary}
                           </td>
                           <td className="border border-black p-1 font-mono">
                              {isEditMode ? <input value={v.date2} onChange={e => {
                                const next = [...annualAbsences]; next[idx] = {...next[idx], date2: e.target.value}; setAnnualAbsences(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : v.date2}
                           </td>
                           <td className="border border-black p-1">
                              {isEditMode ? <input value={v.category2} onChange={e => {
                                const next = [...annualAbsences]; next[idx] = {...next[idx], category2: e.target.value}; setAnnualAbsences(next);
                              }} className="w-full outline-none bg-transparent" /> : v.category2}
                           </td>
                           <td className="border border-black p-1 font-mono">
                              {isEditMode ? <input value={v.salary2} onChange={e => {
                                const next = [...annualAbsences]; next[idx] = {...next[idx], salary2: e.target.value}; setAnnualAbsences(next);
                              }} className="w-full outline-none bg-transparent text-center" /> : v.salary2}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

            <div className="border border-black p-4 min-h-[150px]">
               <span className="font-bold block mb-2">Observações:</span>
               {isEditMode ? (
                 <textarea 
                   value={formData.observations} 
                   onChange={e => setFormData({...formData, observations: e.target.value})} 
                   className="w-full h-32 outline-none bg-transparent border-none resize-none font-sans"
                   placeholder="Anotações adicionais, elogios ou penalizações..."
                 />
               ) : (
                 <p className="whitespace-pre-wrap">{formData.observations}</p>
               )}
            </div>
          </div>
        )}

        {/* PAGE 4: ANEXOS */}
        {(currentPage === 4 || typeof window === 'undefined') && (
          <div className="border border-black p-10 bg-white min-h-[297mm] print:shadow-none shadow-lg mb-8 print:mb-0 space-y-6">
            <h2 className="text-center text-xl font-black tracking-widest border-b-2 border-black pb-2">RELAÇÃO DE DOCUMENTOS ANEXOS</h2>
            
            <table className="w-full border-collapse border border-black">
               <thead>
                  <tr className="bg-gray-50 text-center font-bold">
                     <th className="border border-black p-2 w-32">DATA</th>
                     <th className="border border-black p-2 text-left">DESCRIÇÃO DO DOCUMENTO</th>
                  </tr>
               </thead>
               <tbody>
                  {annexList.map((annex: any, idx: number) => (
                     <tr key={idx} className="h-8">
                        <td className="border border-black p-1 text-center font-mono">
                           {isEditMode ? <input value={annex.date} onChange={e => {
                             const next = [...annexList]; next[idx] = {...next[idx], date: e.target.value}; setAnnexList(next);
                           }} className="w-full outline-none bg-transparent text-center" /> : annex.date}
                        </td>
                        <td className="border border-black p-1">
                           {isEditMode ? <input value={annex.title} onChange={e => {
                             const next = [...annexList]; next[idx] = {...next[idx], title: e.target.value}; setAnnexList(next);
                           }} className="w-full outline-none bg-transparent" /> : annex.title}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>

            {isEditMode && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-blue-800 text-xs font-bold no-print">
                 Preencha as linhas da tabela acima para registar a entrega física de documentos no prontuário.
              </div>
            )}
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex justify-between items-center print:hidden pt-4 border-t border-slate-200 font-sans">
           <Button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} variant="outline" className="flex items-center gap-2"><ChevronLeft className="h-4 w-4" /> Anterior</Button>
           <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Página {currentPage} de 4</span>
           <Button disabled={currentPage === 4} onClick={() => setCurrentPage(prev => prev + 1)} variant="outline" className="flex items-center gap-2">Próxima <ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
