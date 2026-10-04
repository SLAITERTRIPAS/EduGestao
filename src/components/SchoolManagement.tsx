import React, { useState, useMemo }
 from 'react';
import { useStore }
 from '../store';
import { Card, Button, Input }
 from './ui';
import { ConfirmDialog }
 from './ConfirmDialog';
import { LocationSelector }
 from './LocationSelector';
import { 
  Building2, 
  MapPin, 
  GraduationCap, 
  User, 
  Phone, 
  Mail, 
  Plus, 
  CheckCircle2, 
  Search, 
  Filter, 
  CheckSquare, 
  Square,
  Eye,
  Trash2,
  Edit2,
  Shield,
  Briefcase,
  Image,
  BookOpen,
  UserCheck,
  Sparkles,
  Link as LinkIcon,
  Copy,
  Check,
  ExternalLink,
  FileText,
  Wallet
}
 from 'lucide-react';
import { School, SchoolLevelType, SchoolManagementType }
 from '../types';
import { computeAutoCurriculum, ALL_SCHOOL_LEVELS_MAPPING, SCHOOL_PRESET_LOGOS }
 from '../data/sigeRoles';
import { removeImageBackground } from '../utils/digitalSignatureUtils';
import { validateInstitutionalCode, suggestInstitutionalCode, ValidationResult } from '../utils/institutionalCodeValidator';
import { AlertCircle } from 'lucide-react';

const PROVINCES_MOZAMBIQUE = [
  'Maputo Cidade',
  'Maputo Província',
  'Gaza',
  'Inhambane',
  'Sofala',
  'Manica',
  'Tete',
  'Zambézia',
  'Nampula',
  'Cabo Delgado',
  'Niassa'
];

export function SchoolManagement() {
  const { schools, addSchool, removeSchool, removeClass, updateSchoolProfile, classes = [], getSchoolTenantUrl, setActiveSchoolId, activeSchoolId } = useStore();
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterManagement, setFilterManagement] = useState<string>('all');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [selectedSchoolModal, setSelectedSchoolModal] = useState<School | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [schoolToDelete, setSchoolToDelete] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  
  const [validationError, setValidationError] = useState<ValidationResult | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [managementType, setManagementType] = useState<SchoolManagementType>('estatal');
  const [province, setProvince] = useState('Maputo Cidade');
  const [district, setDistrict] = useState('');
  const [locality, setLocality] = useState('');
  const [administrativePost, setAdministrativePost] = useState('');
  const [address, setAddress] = useState('');
  
  // Corpo Directivo (Com Perfis de Acesso & Credenciais Individuais)
  const [directorName, setDirectorName] = useState('');
  const [directorNip, setDirectorNip] = useState('');
  const [directorPhone, setDirectorPhone] = useState('');
  const [directorEmail, setDirectorEmail] = useState('');
  const [directorPassword, setDirectorPassword] = useState('');

  const [dapName, setDapName] = useState('');
  const [dapNip, setDapNip] = useState('');
  const [dapPhone, setDapPhone] = useState('');
  const [dapEmail, setDapEmail] = useState('');
  const [dapPassword, setDapPassword] = useState('');

  const [secretariatChiefName, setSecretariatChiefName] = useState('');
  const [secretariatNip, setSecretariatNip] = useState('');
  const [secretariatPhone, setSecretariatPhone] = useState('');
  const [secretariatEmail, setSecretariatEmail] = useState('');
  const [secretariatPassword, setSecretariatPassword] = useState('');

  const [financialChiefName, setFinancialChiefName] = useState('');
  const [financialNip, setFinancialNip] = useState('');
  const [financialPhone, setFinancialPhone] = useState('');
  const [financialEmail, setFinancialEmail] = useState('');
  const [financialPassword, setFinancialPassword] = useState('');

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [studentCapacity, setStudentCapacity] = useState<number>(1000);

  const handleCopyLink = (schoolId: string) => {
    const url = getSchoolTenantUrl(schoolId);
    navigator.clipboard.writeText(url);
    setCopiedId(schoolId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const [emblemProgress, setEmblemProgress] = useState<number | null>(null);

  const handleProcessEmblem = async () => {
    if (!logoUrl) return;
    setEmblemProgress(0);
    try {
      const processed = await removeImageBackground(logoUrl, 215, (pct) => {
        setEmblemProgress(pct);
      });
      setLogoUrl(processed);
      setTimeout(() => setEmblemProgress(null), 1200);
    } catch {
      setEmblemProgress(null);
      console.warn('Erro ao processar fundo branco do emblema.');
    }
  };

  const handleProcessEditEmblem = async () => {
    if (!editForm.logoUrl) return;
    setEmblemProgress(0);
    try {
      const processed = await removeImageBackground(editForm.logoUrl, 215, (pct) => {
        setEmblemProgress(pct);
      });
      setEditForm((prev: any) => ({ ...prev, logoUrl: processed }));
      setTimeout(() => setEmblemProgress(null), 1200);
    } catch {
      setEmblemProgress(null);
      console.warn('Erro ao processar fundo branco do emblema.');
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedSchoolModal || !editForm.name) return;

    // Global Validation for Institutional Code on Edit
    const validation = validateInstitutionalCode(editForm.code || '', editForm.province || '', editForm.district || '', editForm.name || '');
    if (!validation.isValid) {
      setValidationError(validation);
      return;
    }

    try {
      if (updateSchoolProfile) {
        await updateSchoolProfile(selectedSchoolModal.id, editForm);
      }
      setSelectedSchoolModal(null);
      setIsEditing(false);
      setSuccessMessage('Dados da escola e do corpo directivo atualizados com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const [selectedTypes, setSelectedTypes] = useState<SchoolLevelType[]>(['ENSINO SECUNDÁRIO DO 1 CICLO']);
  const [shifts, setShifts] = useState<string[]>(['Diurno']);

  // Dynamic Auto Curriculum Calculation
  const autoCurriculum = useMemo(() => {
    return computeAutoCurriculum(selectedTypes);
  }, [selectedTypes]);

  const schoolClasses = useMemo(() => {
    if (!Array.isArray(classes)) return [];
    return classes.filter(c => c.schoolId === selectedSchoolModal?.id);
  }, [classes, selectedSchoolModal]);

  const toggleSchoolLevel = (level: SchoolLevelType) => {
    setSelectedTypes(prev => 
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const toggleShift = (shift: string) => {
    setShifts(prev =>
      prev.includes(shift) ? prev.filter(s => s !== shift) : [...prev, shift]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Global Validation for Institutional Code
    const validation = validateInstitutionalCode(code, province, district, name);
    if (!validation.isValid) {
      setValidationError(validation);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationError(null);

    addSchool({
      name: name.trim(),
      code: code.trim() || `ESC-${Math.floor(100 + Math.random() * 900)}`,
      logoUrl: logoUrl.trim(),
      managementType,
      province,
      district: district.trim() || 'Sede',
      locality: locality.trim(),
      administrativePost: administrativePost.trim(),
      address: address.trim() || 'Localidade Sede',
      schoolTypes: selectedTypes,
      directorName: directorName.trim(),
      directorNip: directorNip.trim(),
      directorEmail: directorEmail.trim(),
      directorPassword: directorPassword.trim(),
      directorPhone: directorPhone.trim(),
      dapName: dapName.trim(),
      dapNip: dapNip.trim(),
      dapEmail: dapEmail.trim(),
      dapPassword: dapPassword.trim(),
      dapPhone: dapPhone.trim(),
      secretariatChiefName: secretariatChiefName.trim(),
      secretariatNip: secretariatNip.trim(),
      secretariatEmail: secretariatEmail.trim(),
      secretariatPassword: secretariatPassword.trim(),
      secretariatPhone: secretariatPhone.trim(),
      financialChiefName: financialChiefName.trim(),
      financialNip: financialNip.trim(),
      financialEmail: financialEmail.trim(),
      financialPassword: financialPassword.trim(),
      financialPhone: financialPhone.trim(),
      phone: phone.trim(),
      email: email.trim(),
      shifts,
      studentCapacity: Number(studentCapacity) || 500,
      autoAssignedClasses: autoCurriculum.classes,
      autoAssignedSubjects: autoCurriculum.subjects
    });

    setSuccessMessage(`Escola "${name}" e as contas individuais do Corpo Directivo (Diretor, DAP, Secretaria e Finanças) foram registadas com sucesso!`);
    
    // Reset Form
    setName('');
    setCode('');
    setLogoUrl('');
    setDistrict('');
    setLocality('');
    setAdministrativePost('');
    setAddress('');
    setDirectorName('');
    setDirectorNip('');
    setDirectorPhone('');
    setDirectorEmail('');
    setDirectorPassword('');
    setDapName('');
    setDapNip('');
    setDapPhone('');
    setDapEmail('');
    setDapPassword('');
    setSecretariatChiefName('');
    setSecretariatNip('');
    setSecretariatPhone('');
    setSecretariatEmail('');
    setSecretariatPassword('');
    setFinancialChiefName('');
    setFinancialNip('');
    setFinancialPhone('');
    setFinancialEmail('');
    setFinancialPassword('');
    setPhone('');
    setEmail('');
    setSelectedTypes(['ENSINO SECUNDÁRIO DO 1 CICLO']);
    setShifts(['Diurno']);

    setTimeout(() => {
      setSuccessMessage('');
      setIsFormOpen(false);
    }, 2500);
  };

  const filteredSchools = schools.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.district && s.district.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesManagement = 
      filterManagement === 'all' || s.managementType === filterManagement;

    const matchesProvince = 
      filterProvince === 'all' || s.province === filterProvince;

    return matchesSearch && matchesManagement && matchesProvince;
  });

  const handleSuggestCode = () => {
    const suggested = suggestInstitutionalCode(province, district, name);
    setCode(suggested);
    setValidationError(null);
  };

  const handleSuggestEditCode = () => {
    const suggested = suggestInstitutionalCode(editForm.province || '', editForm.district || '', editForm.name || '');
    setEditForm((prev: any) => ({ ...prev, code: suggested }));
    setValidationError(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans">
      
      {/* Header Banner */}

      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-600/30 border border-blue-500/40 text-blue-400 rounded-2xl shrink-0">
            <Building2 size={28}
 />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
              Gestão da Rede Escolar (MINEDH)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Cadastro oficial e mapeamento de escolas estatais e privadas em todo o território nacional.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}

          className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-xs px-5 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
        >
          {isFormOpen ? <Building2 size={16}
 /> : <Plus size={16}
 />}

          <span>{isFormOpen ? 'Fechar Formulário' : 'Registar Nova Escola'}
</span>
        </button>
      </div>

      {/* SUCCESS NOTIFICATION */}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl font-bold text-xs flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 size={20}
 className="text-emerald-600 shrink-0" />
          <span>{successMessage}
</span>
        </div>
      )}

      {/* VALIDATION ERROR ALERTS */}
      {validationError && (
        <div className="p-5 bg-red-50 border-2 border-red-200 text-red-900 rounded-2xl space-y-3 animate-in slide-in-from-top duration-500 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertCircle size={24} className="text-red-600 shrink-0" />
            <div>
              <h4 className="font-black text-sm uppercase tracking-tight">Erro de Integridade Institucional</h4>
              <p className="text-[11px] font-bold text-red-700">{validationError.message}</p>
            </div>
          </div>
          <div className="pl-9 space-y-2">
            <ul className="list-disc list-inside text-[10px] font-bold text-red-600 space-y-1">
              {validationError.errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
            <div className="pt-2 flex items-center gap-3">
               <div className="bg-white border border-red-200 px-3 py-1.5 rounded-xl text-[10px]">
                  <span className="text-slate-500 font-bold block uppercase mb-0.5">Sugestão Correta:</span>
                  <code className="text-blue-700 font-mono font-black text-xs tracking-wider">{validationError.expectedStructure}</code>
               </div>
               <Button 
                onClick={handleSuggestCode}
                className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black h-8 px-4 rounded-xl shadow-sm"
               >
                 Aplicar Sugestão Automática
               </Button>
            </div>
          </div>
        </div>
      )}


      {/* FORMULARIO COMPLETO DE REGISTO DE ESCOLA */}

      {isFormOpen && (
        <Card className="p-6 md:p-8 bg-white border border-slate-200 rounded-3xl shadow-xl space-y-6">
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Plus className="text-blue-600" size={20}
 /> Formato Oficial de Registo de Escola
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Preencha todos os dados administrativos, de localização territorial e os níveis de ensino leccionados.
              </p>
            </div>
            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-black uppercase">
              MINEDH Form R-01
            </span>
          </div>

          <form onSubmit={handleSubmit}
 className="space-y-6 text-xs font-sans">
            
            {/* SEÇÃO 1: TIPO DE GESTÃO & IDENTIFICAÇÃO INSTITUCIONAL & LOGOTIPO */}

            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 border-l-4 border-blue-600 pl-2.5 flex items-center gap-2">
                <Briefcase size={15}
 /> 1. Identificação Institucional, Gestão & Logotipo
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                
                {/* Nome da Escola */}

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nome Oficial da Escola: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Escola Secundária Josina Machel ou Instituto Politécnico..."
                    value={name}

                    onChange={e => setName(e.target.value)}

                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Código / NUIT */}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Código Institucional: <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      placeholder="PV-DT-ESCOLA (ex: MP-KM-ESJM)"
                      value={code}

                      onChange={e => {
                        setCode(e.target.value.toUpperCase());
                        if (validationError) setValidationError(null);
                      }}

                      className={`w-full px-3.5 py-2.5 bg-white border ${validationError ? 'border-red-500 bg-red-50' : 'border-slate-300'} rounded-xl font-mono text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none`}
                    />
                    <button
                      type="button"
                      onClick={handleSuggestCode}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-lg text-[9px] font-black border border-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      GERAR AUTO
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1 font-bold italic">Integridade: [PROV]-[DIST]-[SIGLA_ESCOLA]</p>
                </div>

                {/* Logotipo da Escola */}

                <div className="md:col-span-3 space-y-2">
                  <label className="block font-bold text-slate-700 flex items-center gap-2">
                    <Image size={15}
 className="text-blue-600" /> Logotipo / Emblema da Escola:
                  </label>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {logoUrl ? (
                      <img 
                        src={logoUrl}
                        alt="Logotipo" 
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shadow-sm shrink-0 bg-white"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-100 flex flex-col items-center justify-center text-slate-400 shrink-0">
                        <Building2 size={20} />
                        <span className="text-[9px] font-bold">Sem Logo</span>
                      </div>
                    )}
                    <div className="flex-1 w-full space-y-2">
                      <input
                        type="url"
                        placeholder="https://exemplo.com/logotipo-escola.png"
                        value={logoUrl}

                        onChange={e => setLogoUrl(e.target.value)}

                        className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <div className="space-y-2 pt-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={handleProcessEmblem}
                            disabled={emblemProgress !== null}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[11px] flex items-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                          >
                            <Sparkles size={13} />
                            <span>{emblemProgress !== null ? `Processando Emblema (${emblemProgress}%)...` : 'Remover Fundo Branco do Emblema'}</span>
                          </button>
                        </div>
                        {emblemProgress !== null && (
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden animate-pulse">
                            <div 
                              className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${emblemProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <span className="text-[10px] text-slate-500 font-bold shrink-0">Modelos de Emblema:</span>
                        {SCHOOL_PRESET_LOGOS.map((preset, idx) => (
                          <button
                            key={idx}

                            type="button"
                            onClick={() => setLogoUrl(preset)}

                            className={`w-7 h-7 rounded-lg border overflow-hidden shrink-0 ${logoUrl === preset ? 'ring-2 ring-blue-600 border-blue-600' : 'border-slate-300'}
`}

                          >
                            <img src={preset}
 alt="preset" className="w-full h-full object-cover" />
                          </button>
                        ))}

                      </div>
                    </div>
                  </div>
                </div>

                {/* Tipo de Gestão: Estatal ou Privado */}

                <div className="md:col-span-3">
                  <label className="block font-bold text-slate-700 mb-2">
                    Tipo de Gestão (Regime Proprietário): <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label
                      onClick={() => setManagementType('estatal')}

                      className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                        managementType === 'estatal'
                          ? 'bg-blue-50 border-blue-600 text-blue-900 font-black shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/60 font-semibold'
                      }
`}

                    >
                      <input
                        type="radio"
                        name="managementType"
                        checked={managementType === 'estatal'}

                        onChange={() => setManagementType('estatal')}

                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <div className="text-xs font-black">Escola Estatal / Pública</div>
                        <div className="text-[10px] text-slate-500 font-normal">Financiada e gerida pelo Governo de Moçambique (MINEDH).</div>
                      </div>
                    </label>

                    <label
                      onClick={() => setManagementType('privado')}

                      className={`p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition-all ${
                        managementType === 'privado'
                          ? 'bg-purple-50 border-purple-600 text-purple-900 font-black shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/60 font-semibold'
                      }
`}

                    >
                      <input
                        type="radio"
                        name="managementType"
                        checked={managementType === 'privado'}

                        onChange={() => setManagementType('privado')}

                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <div className="text-xs font-black">Escola Privada / Comunitária / Confessional</div>
                        <div className="text-[10px] text-slate-500 font-normal">Instituição de ensino particular ou sob gestão comunitária/religiosa.</div>
                      </div>
                    </label>
                  </div>
                </div>

              </div>
            </div>

            {/* SEÇÃO 2: LOCALIZAÇÃO TERRITORIAL COMPLETA */}

            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 border-l-4 border-blue-600 pl-2.5 flex items-center gap-2">
                <MapPin size={15}
 /> 2. Localização Territorial & Endereço
              </h4>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <LocationSelector
                  province={province}

                  setProvince={setProvince}

                  district={district}

                  setDistrict={setDistrict}

                  administrativePost={administrativePost}

                  setAdministrativePost={setAdministrativePost}

                  locality={locality}

                  setLocality={setLocality}

                />
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Endereço Completo (Rua, Avenida, Número ou Referência):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Av. Eduardo Mondlane, nº 450, próximo ao Hospital Geral..."
                    value={address}

                    onChange={e => setAddress(e.target.value)}

                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: TIPO DE ESCOLA / NÍVEIS DE ENSINO LECCIONADOS & ATRIBUIÇÃO AUTOMÁTICA */}

            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 border-l-4 border-blue-600 pl-2.5 flex items-center gap-2">
                <GraduationCap size={15}
 /> 3. Nível de Ensino Leccionado (Atribuição Automática de Classes & Disciplinas)
              </h4>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <p className="text-slate-700 font-bold text-xs">
                  Selecione o Nível de Ensino Leccionado. O sistema atribui <span className="text-blue-700 underline font-black">automaticamente</span> as disciplinas e as classes correspondentes para esta escola:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ALL_SCHOOL_LEVELS_MAPPING.map(lvl => {
                    const isChecked = selectedTypes.includes(lvl.id);
                    return (
                      <div
                        key={lvl.id}

                        onClick={() => toggleSchoolLevel(lvl.id)}

                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                          isChecked
                            ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }
`}

                      >
                        <div className="pt-0.5 shrink-0">
                          {isChecked ? <CheckSquare size={18}
 /> : <Square size={18}
 className="text-slate-400" />}

                        </div>
                        <div>
                          <div className="font-extrabold text-xs">{lvl.label}
</div>
                          <div className={`text-[10px] mt-0.5 leading-tight ${isChecked ? 'text-blue-100' : 'text-slate-500'}
`}
>
                            {lvl.desc}

                          </div>
                        </div>
                      </div>
                    );
                  }
)}

                </div>

                {/* BANNER DE ATRIBUIÇÃO AUTOMÁTICA EM TEMPO REAL */}

                <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs">
                    <Sparkles size={16}
 className="text-blue-600" />
                    <span>Currículo Atribuído Automaticamente pelo Sistema SIGE:</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Classes Atribuídas */}

                    <div>
                      <span className="text-[11px] font-extrabold text-slate-700 block mb-1 flex items-center gap-1">
                        <GraduationCap size={13}
 className="text-blue-600" /> Classes Atribuídas ({autoCurriculum.classes.length}
):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {autoCurriculum.classes.map(c => (
                          <span key={c}
 className="text-[10px] font-bold bg-white text-blue-900 border border-blue-200 px-2 py-0.5 rounded-lg shadow-2xs">
                            {c}

                          </span>
                        ))}

                      </div>
                    </div>

                    {/* Disciplinas Atribuídas */}

                    <div>
                      <span className="text-[11px] font-extrabold text-slate-700 block mb-1 flex items-center gap-1">
                        <BookOpen size={13}
 className="text-blue-600" /> Disciplinas Atribuídas ({autoCurriculum.subjects.length}
):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {autoCurriculum.subjects.map(s => (
                          <span key={s}
 className="text-[10px] font-semibold bg-white text-slate-800 border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
                            {s}

                          </span>
                        ))}

                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* SEÇÃO 4: CORPO DIRECTIVO (CRIAÇÃO DE CONTAS & CREDENCIAIS POR PERFIL) */}

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-l-4 border-blue-600 pl-2.5">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-2">
                    <UserCheck size={16} className="text-blue-600" /> 4. Registo do Corpo Directivo (Criação de Contas & Credenciais)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cada perfil tem os seus campos específicos de registo e credenciais individuais de acesso. Ao registar, o utilizador é alocado diretamente à sua área de gestão.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* CARD 1: DIRETORES DA ESCOLA / DIRETOR GERAL */}
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-blue-950 flex items-center gap-1.5">
                      <Building2 size={14} className="text-blue-700" /> 1. Director da Escola (Geral)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-900 font-bold text-[10px]">
                      Perfil: Direção Escolar
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                        Nome Completo do Director: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nome Completo do Director"
                        value={directorName}
                        onChange={e => setDirectorName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        NIP / NUIT / BI:
                      </label>
                      <input
                        type="text"
                        placeholder="NIP ou BI do Director"
                        value={directorNip}
                        onChange={e => setDirectorNip(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Telefone Direto:
                      </label>
                      <input
                        type="text"
                        placeholder="+258 84 000 0000"
                        value={directorPhone}
                        onChange={e => setDirectorPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-blue-900 uppercase mb-0.5">
                        Credencial: E-mail de Acesso
                      </label>
                      <input
                        type="email"
                        placeholder="diretor@escola.com"
                        value={directorEmail}
                        onChange={e => setDirectorEmail(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-xl font-mono text-xs font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-blue-900 uppercase mb-0.5">
                        Credencial: Senha Inicial
                      </label>
                      <input
                        type="password"
                        placeholder="Senha de acesso"
                        value={directorPassword}
                        onChange={e => setDirectorPassword(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* CARD 2: DIRECTOR ADJUNTO PEDAGÓGICO (DAP) */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                      <BookOpen size={14} className="text-indigo-700" /> 2. Director Adjunto Pedagógico (DAP)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900 font-bold text-[10px]">
                      Perfil: Pedagógico
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                        Nome Completo do DAP: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nome do Director Pedagógico"
                        value={dapName}
                        onChange={e => setDapName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        NIP / NUIT / BI:
                      </label>
                      <input
                        type="text"
                        placeholder="NIP ou BI do DAP"
                        value={dapNip}
                        onChange={e => setDapNip(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Telefone Direto:
                      </label>
                      <input
                        type="text"
                        placeholder="+258 84 000 0000"
                        value={dapPhone}
                        onChange={e => setDapPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-indigo-900 uppercase mb-0.5">
                        Credencial: E-mail de Acesso
                      </label>
                      <input
                        type="email"
                        placeholder="pedagogico@escola.com"
                        value={dapEmail}
                        onChange={e => setDapEmail(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-xl font-mono text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-indigo-900 uppercase mb-0.5">
                        Credencial: Senha Inicial
                      </label>
                      <input
                        type="password"
                        placeholder="Senha de acesso"
                        value={dapPassword}
                        onChange={e => setDapPassword(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* CARD 3: CHEFE DA SECRETARIA */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                      <FileText size={14} className="text-amber-800" /> 3. Chefe da Secretaria Geral
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px]">
                      Perfil: Secretaria
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                        Nome Completo do Chefe de Secretaria: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Nome do Chefe da Secretaria"
                        value={secretariatChiefName}
                        onChange={e => setSecretariatChiefName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        NIP / NUIT / BI:
                      </label>
                      <input
                        type="text"
                        placeholder="NIP ou BI"
                        value={secretariatNip}
                        onChange={e => setSecretariatNip(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Telefone Direto:
                      </label>
                      <input
                        type="text"
                        placeholder="+258 84 000 0000"
                        value={secretariatPhone}
                        onChange={e => setSecretariatPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase mb-0.5">
                        Credencial: E-mail de Acesso
                      </label>
                      <input
                        type="email"
                        placeholder="secretaria@escola.com"
                        value={secretariatEmail}
                        onChange={e => setSecretariatEmail(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-mono text-xs font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-amber-900 uppercase mb-0.5">
                        Credencial: Senha Inicial
                      </label>
                      <input
                        type="password"
                        placeholder="Senha de acesso"
                        value={secretariatPassword}
                        onChange={e => setSecretariatPassword(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* CARD 4: GESTOR FINANCEIRO / TESOUREIRO */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                      <Wallet size={14} className="text-emerald-800" /> 4. Gestor Financeiro & Tesouraria
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                      Perfil: Finanças
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-0.5">
                        Nome Completo do Gestor Financeiro:
                      </label>
                      <input
                        type="text"
                        placeholder="Nome do Responsável Financeiro"
                        value={financialChiefName}
                        onChange={e => setFinancialChiefName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        NIP / NUIT / BI:
                      </label>
                      <input
                        type="text"
                        placeholder="NIP ou BI"
                        value={financialNip}
                        onChange={e => setFinancialNip(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                        Telefone Direto:
                      </label>
                      <input
                        type="text"
                        placeholder="+258 84 000 0000"
                        value={financialPhone}
                        onChange={e => setFinancialPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-emerald-900 uppercase mb-0.5">
                        Credencial: E-mail de Acesso
                      </label>
                      <input
                        type="email"
                        placeholder="financas@escola.com"
                        value={financialEmail}
                        onChange={e => setFinancialEmail(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-xl font-mono text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-emerald-900 uppercase mb-0.5">
                        Credencial: Senha Inicial
                      </label>
                      <input
                        type="password"
                        placeholder="Senha de acesso"
                        value={financialPassword}
                        onChange={e => setFinancialPassword(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-xl font-mono text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Informação Geral da Instituição */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Telefone Geral Institucional:
                  </label>
                  <input
                    type="text"
                    placeholder="+258 84 000 0000"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    E-mail Oficial Institucional:
                  </label>
                  <input
                    type="email"
                    placeholder="escola@minedh.gov.mz"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                    Capacidade Prevista de Alunos:
                  </label>
                  <input
                    type="number"
                    value={studentCapacity}
                    onChange={e => setStudentCapacity(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* Turnos */}
                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">
                    Turnos em Funcionamento:
                  </label>
                  <div className="flex items-center gap-4 pt-1">
                    {['Diurno', 'Nocturno', 'Integral'].map(s => (
                      <label key={s}
                        className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={shifts.includes(s)}
                          onChange={() => toggleShift(s)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{s}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* BOTÕES DE AÇÃO */}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}

                className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-blue-900 hover:bg-blue-800 text-white font-extrabold text-xs px-8 py-3 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Building2 size={16}
 /> Submeter Registo de Escola
              </button>
            </div>

          </form>
        </Card>
      )}


      {/* LISTAGEM DE ESCOLAS CADASTRADAS */}

      <Card className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-5">
        
        {/* Controls Bar */}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="text-blue-900" size={20}
 />
              Rede de Escolas Cadastradas ({filteredSchools.length}
)
            </h3>
            <p className="text-xs text-slate-500">
              Mapeamento de unidades de ensino cadastradas no sistema.
            </p>
          </div>

          {/* Search & Filters */}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Search Input */}

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar escola, código ou distrito..."
                value={searchTerm}

                onChange={e => setSearchTerm(e.target.value)}

                className="pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-medium text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none w-56"
              />
            </div>

            {/* Filter Tipo Gestao */}

            <select
              value={filterManagement}

              onChange={e => setFilterManagement(e.target.value)}

              className="px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 bg-white"
            >
              <option value="all">Todos os Tipos (Estatal / Privado)</option>
              <option value="estatal">Apenas Estatais</option>
              <option value="privado">Apenas Privadas</option>
            </select>

            {/* Filter Provincia */}

            <select
              value={filterProvince}

              onChange={e => setFilterProvince(e.target.value)}

              className="px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 bg-white"
            >
              <option value="all">Todas as Províncias</option>
              {PROVINCES_MOZAMBIQUE.map(p => (
                <option key={p}
 value={p}
>{p}
</option>
              ))}

            </select>
          </div>
        </div>

        {/* Table / Cards Grid */}

        <div className="space-y-3">
          {filteredSchools.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2">
              <Building2 className="mx-auto h-10 w-10 text-slate-300" />
              <p className="font-bold">Nenhuma escola encontrada com os filtros selecionados.</p>
            </div>
          ) : (
            filteredSchools.map(sch => (
              <div
                key={sch.id}

                className="p-5 border border-slate-200 rounded-2xl bg-slate-50/70 hover:bg-white hover:border-blue-300 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                {/* Logo + Info */}

                <div className="flex items-start gap-4 max-w-3xl">
                  {sch.logoUrl ? (
                    <img
                      src={sch.logoUrl}

                      alt={sch.name}

                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0 bg-white mt-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = SCHOOL_PRESET_LOGOS[0];
                      }
}

                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 border border-blue-200 flex items-center justify-center shrink-0 font-extrabold text-sm">
                      <Building2 size={22}
 />
                    </div>
                  )}


                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-extrabold text-slate-900 text-sm">
                        {sch.name}

                      </h4>

                      {/* Management Type Badge */}

                      {sch.managementType === 'privado' ? (
                        <span className="text-[10px] font-black uppercase bg-purple-100 text-purple-900 border border-purple-300 px-2.5 py-0.5 rounded-full">
                          Privada
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-900 border border-blue-300 px-2.5 py-0.5 rounded-full">
                          Estatal / Pública
                        </span>
                      )}


                      {sch.code && (
                        <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                          {sch.code}

                        </span>
                      )}

                    </div>

                    {/* Localização completa */}

                    <div className="text-xs text-slate-600 font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1 font-bold text-slate-800">
                        <MapPin size={13}
 className="text-blue-600 shrink-0" />
                        {sch.province || 'Maputo Cidade'}
 • {sch.district || 'Distrito Central'}

                      </span>
                      {sch.administrativePost && (
                        <span>Posto: <strong>{sch.administrativePost}
</strong></span>
                      )}

                      {sch.locality && (
                        <span>Loc: <strong>{sch.locality}
</strong></span>
                      )}

                      <span>({sch.address}
)</span>
                    </div>

                    {/* Corpo Directivo Résumé */}

                    <div className="text-[11px] text-slate-600 font-medium flex flex-wrap items-center gap-x-3 gap-y-0.5 bg-slate-100/80 p-1.5 rounded-lg border border-slate-200/60">
                      <span><strong>Director:</strong> {sch.directorName || 'N/A'}
</span>
                      {sch.dapName && <span>| <strong>DAP:</strong> {sch.dapName}
</span>}

                      {sch.secretariatChiefName && <span>| <strong>Chefe Sec.:</strong> {sch.secretariatChiefName}
</span>}

                    </div>

                    {/* Níveis oferecidos badges */}

                    {sch.schoolTypes && sch.schoolTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {sch.schoolTypes.map(st => (
                          <span key={st}
 className="text-[9px] font-extrabold bg-blue-50 text-blue-900 px-2 py-0.5 rounded-md border border-blue-200">
                            {st}

                          </span>
                        ))}

                      </div>
                    )}

                  </div>
                </div>

                {/* Actions */}

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Copy Dedicated Tenant Link Button */}

                  <button
                    onClick={() => handleCopyLink(sch.id)}

                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    title={`Link de Acesso Único: ${getSchoolTenantUrl(sch.id)}
`}

                  >
                    {copiedId === sch.id ? (
                      <>
                        <Check size={14}
 className="text-emerald-600" />
                        <span>Link Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14}
 className="text-emerald-700" />
                        <span>Copiar Link Exclusivo</span>
                      </>
                    )}

                  </button>

                  {/* Switch Tenant Context Button */}

                  <button
                    onClick={() => setActiveSchoolId(sch.id)}

                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                      activeSchoolId === sch.id
                        ? 'bg-blue-600 text-white border border-blue-700'
                        : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-300 hover:border-blue-300'
                    }
`}

                  >
                    <ExternalLink size={14}
 />
                    <span>{activeSchoolId === sch.id ? 'Área Ativa' : 'Aceder Área'}
</span>
                  </button>

                  <button
                    onClick={() => setSelectedSchoolModal(sch)}

                    className="p-2 bg-white border border-slate-300 hover:border-blue-500 text-slate-700 hover:text-blue-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Eye size={14}
 /> Ficha
                  </button>

                  <button
                    onClick={() => setSchoolToDelete(sch.id)}

                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                    title="Remover Escola"
                  >
                    <Trash2 size={16}
 className="pointer-events-none" />
                  </button>
                </div>

              </div>
            ))
          )}

        </div>
        
        <ConfirmDialog
          isOpen={!!schoolToDelete}

          title="Excluir Escola"
          message="TEM A CERTEZA DE QUE PRETENDE EXCLUIR A ESCOLA? Esta ação é irreversível."
          onConfirm={() => {
            if (schoolToDelete) {
              removeSchool(schoolToDelete);
              setSchoolToDelete(null);
            }

          }
}

          onCancel={() => setSchoolToDelete(null)}

        />

      </Card>

      {/* MODAL FICHA COMPLETA DA ESCOLA */}
      {selectedSchoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60  animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                {selectedSchoolModal.logoUrl ? (
                  <img src={selectedSchoolModal.logoUrl} alt="Logo" className="w-12 h-12 rounded-xl object-cover bg-white border-2 border-blue-500 shrink-0" />
                ) : (
                  <div className="p-2.5 bg-blue-600/30 border border-blue-500/40 text-blue-400 rounded-xl">
                    <Building2 size={24} />
                  </div>
                )}
                <div>
                  <h3 className="font-extrabold text-base text-slate-100">{selectedSchoolModal.name}</h3>
                  <p className="text-xs text-slate-400">Código: {selectedSchoolModal.code || 'MINEDH-REG'}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedSchoolModal(null); setIsEditing(false); }} className="text-slate-400 hover:text-white p-2 rounded-xl font-bold">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800 leading-relaxed font-sans">
              {isEditing ? (
                <div className="space-y-4">
                  {validationError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                      <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                      <div className="text-[10px] font-bold text-red-700">
                        {validationError.message}
                        <div className="mt-1 flex items-center gap-2">
                           <span className="text-slate-500 uppercase">Sugestão:</span>
                           <code className="text-blue-700 bg-white px-1.5 py-0.5 rounded border border-red-100">{validationError.expectedStructure}</code>
                           <button 
                            onClick={handleSuggestEditCode}
                            className="bg-red-600 text-white px-2 py-0.5 rounded-lg hover:bg-red-700 transition-colors"
                           >
                             Aplicar
                           </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <Input label="Nome da Escola" value={editForm.name || ''} onChange={e => { setEditForm({...editForm, name: e.target.value}); if(validationError) setValidationError(null); }} />
                  <div className="relative group">
                    <Input label="Código Institucional" value={editForm.code || ''} onChange={e => { setEditForm({...editForm, code: e.target.value.toUpperCase()}); if(validationError) setValidationError(null); }} />
                    <button
                      type="button"
                      onClick={handleSuggestEditCode}
                      className="absolute right-2 bottom-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-lg text-[9px] font-black border border-blue-200"
                    >
                      AUTO
                    </button>
                  </div>
                  <Input label="Província" value={editForm.province || ''} onChange={e => { setEditForm({...editForm, province: e.target.value}); if(validationError) setValidationError(null); }} />
                  <Input label="Distrito" value={editForm.district || ''} onChange={e => { setEditForm({...editForm, district: e.target.value}); if(validationError) setValidationError(null); }} />
                  <Input label="Endereço" value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                  <Input label="Director da Escola" value={editForm.directorName || ''} onChange={e => setEditForm({...editForm, directorName: e.target.value})} />
                  <Input label="Director Adjunto Pedagógico (DAP)" value={editForm.dapName || ''} onChange={e => setEditForm({...editForm, dapName: e.target.value})} />
                  <Input label="Chefe da Secretaria" value={editForm.secretariatChiefName || ''} onChange={e => setEditForm({...editForm, secretariatChiefName: e.target.value})} />
                  
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-slate-700">Logotipo / Emblema da Escola (URL)</label>
                    <div className="flex gap-2">
                      <input 
                        type="url" 
                        value={editForm.logoUrl || ''} 
                        onChange={e => setEditForm({...editForm, logoUrl: e.target.value})}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                        placeholder="https://..."
                      />
                      <button
                        type="button"
                        onClick={handleProcessEditEmblem}
                        disabled={emblemProgress !== null}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <Sparkles size={13} />
                        <span>{emblemProgress !== null ? `${emblemProgress}%` : 'Remover Fundo'}</span>
                      </button>
                    </div>
                    {emblemProgress !== null && (
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden animate-pulse">
                        <div 
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${emblemProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div><strong>Província:</strong> {selectedSchoolModal.province}</div>
                    <div><strong>Distrito:</strong> {selectedSchoolModal.district}</div>
                    <div className="col-span-2"><strong>Endereço:</strong> {selectedSchoolModal.address}</div>
                    <div><strong>Director:</strong> {selectedSchoolModal.directorName}</div>
                  </div>

                  {/* Classes management as requested */}
                  <div className="space-y-2">
                    <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px] text-blue-900">Turmas da Escola</h4>
                    <div className="space-y-2">
                      {schoolClasses.length === 0 ? (
                        <p className="text-slate-500 italic">Nenhuma turma registada.</p>
                      ) : (
                        schoolClasses.map(c => (
                          <div key={c.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div>
                              <span className="font-bold text-slate-900">{c.name}</span>
                              <span className="text-[10px] text-slate-500 block">{c.gradeLevel} - {c.period}</span>
                            </div>
                            <button 
                              onClick={() => {
                                if (window.confirm('Tem a certeza que pretende excluir esta turma?')) {
                                  removeClass(c.id);
                                }
                              }} 
                              className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="bg-slate-200 text-slate-800 font-bold px-6 py-2 rounded-xl text-xs">Cancelar</button>
                  <button onClick={handleSaveEdit} className="bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl text-xs">Guardar Alterações</button>
                </>
              ) : (
                <>
                  <button onClick={() => setSelectedSchoolModal(null)} className="bg-slate-200 text-slate-800 font-bold px-6 py-2 rounded-xl text-xs">Fechar</button>
                  <button onClick={() => { setEditForm({ ...selectedSchoolModal }); setIsEditing(true); }} className="bg-blue-900 text-white font-bold px-6 py-2 rounded-xl text-xs flex items-center gap-2">
                    <Edit2 size={14} /> Editar Escola
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
