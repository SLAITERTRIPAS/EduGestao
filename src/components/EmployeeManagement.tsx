import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Card, Button, Input } from './ui';
import { Employee } from '../types';
import { EmployeeProcessDocument } from './EmployeeProcessDocument';
import { 
  MOZAMBIQUE_PROVINCES, 
  getDistrictsForProvince, 
  generateEmployeeId,
  ACADEMIC_LEVELS,
  COMMON_TRAINING_AREAS
} from '../data/mozambiqueLocations';
import { 
  UserPlus, 
  Users, 
  Search, 
  Eye, 
  Trash2, 
  Printer, 
  FileText, 
  X, 
  CheckCircle2, 
  Filter, 
  Sparkles,
  Award,
  BookOpen,
  MapPin,
  IdCard,
  Building2,
  FolderOpen,
  FileSpreadsheet,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  CheckCircle,
  Phone,
  Calendar,
  UserCheck,
  ChevronRight,
  Download
} from 'lucide-react';

export function EmployeeManagement() {
  const { employees = [], addEmployee, deleteEmployee, schools = [], currentUser } = useStore();
  const school = schools.find(s => s.id === currentUser?.schoolId) || schools[0];

  // Active view: 'processos' (default), 'tabela', 'novo'
  const [activeView, setActiveView] = useState<'processos' | 'tabela' | 'novo'>('processos');

  // Refs for scrolling and focusing
  const formRef = React.useRef<HTMLDivElement>(null);
  const nameInputRef = React.useRef<HTMLInputElement>(null);
  const [isFormHighlighted, setIsFormHighlighted] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCareer, setFilterCareer] = useState<string>('all');
  const [filterProvince, setFilterProvince] = useState<string>('all');

  // Selected Employee for Dossier/Modal View
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [openNewProcessForm, setOpenNewProcessForm] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleScrollToRegister = () => {
    setOpenNewProcessForm(true);
  };

  // Form State
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    gender: '',
    nuit: '',
    email: '',
    phone: '',
    maritalStatus: '',
    fatherName: '',
    motherName: '',
    idCardNumber: '',
    idCardIssuedAt: '',
    idCardIssuedDate: '',
    nationality: 'Moçambicana',
    birthProvince: '',
    birthDistrict: '',
    birthDate: '',
    address: '',
    neighborhood: '',
    residenceDistrict: '',
    cell: '',
    blockNo: '',
    houseNo: '',
    childrenCount: 0,
    career: 'Docente',
    category: '',
    roleFunction: '',
    isEffective: 'Sim',
    contractType: 'Nomeação Definitiva',
    contractLink: 'Quadro de Nomeação',
    admissionDate: new Date().toISOString().split('T')[0],
    academicLevel: 'Licenciatura',
    trainingArea: '',
    leadershipRole: '',
    department: '',
    taughtSubjects: ['', '', '', ''],
  });

  // Dynamic automatic Unique ID calculation based on Name Initials + NUIT
  const liveGeneratedId = useMemo(() => {
    return generateEmployeeId(newEmployee.name, newEmployee.nuit);
  }, [newEmployee.name, newEmployee.nuit]);

  // Distritos disponíveis conforme a província de nascimento selecionada
  const birthDistricts = useMemo(() => {
    return getDistrictsForProvince(newEmployee.birthProvince);
  }, [newEmployee.birthProvince]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prov = e.target.value;
    const availableDistricts = getDistrictsForProvince(prov);
    setNewEmployee(prev => ({
      ...prev,
      birthProvince: prov,
      birthDistrict: availableDistricts.length > 0 ? availableDistricts[0] : ''
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEmployee.name.trim()) {
      alert('Por favor, introduza o Nome Completo do colaborador.');
      return;
    }

    const assignedId = liveGeneratedId || generateEmployeeId(newEmployee.name, newEmployee.nuit) || `COL-${Date.now().toString().slice(-6)}`;

    const createdEmployeePayload: Employee = {
      id: assignedId,
      schoolId: school?.id || 's1',
      name: newEmployee.name.trim(),
      gender: newEmployee.gender || 'M',
      nuit: newEmployee.nuit.trim(),
      email: newEmployee.email.trim(),
      phone: newEmployee.phone.trim(),
      maritalStatus: newEmployee.maritalStatus || 'Solteiro(a)',
      fatherName: newEmployee.fatherName.trim(),
      motherName: newEmployee.motherName.trim(),
      idCardNumber: newEmployee.idCardNumber.trim(),
      idCardIssuedAt: newEmployee.idCardIssuedAt.trim(),
      idCardIssuedDate: newEmployee.idCardIssuedDate,
      nationality: newEmployee.nationality || 'Moçambicana',
      birthProvince: newEmployee.birthProvince,
      birthDistrict: newEmployee.birthDistrict,
      birthDate: newEmployee.birthDate,
      address: newEmployee.address.trim(),
      neighborhood: newEmployee.neighborhood.trim(),
      residenceDistrict: newEmployee.residenceDistrict.trim(),
      cell: newEmployee.cell.trim(),
      blockNo: newEmployee.blockNo.trim(),
      houseNo: newEmployee.houseNo.trim(),
      childrenCount: Number(newEmployee.childrenCount) || 0,
      career: newEmployee.career || 'Docente',
      category: newEmployee.category.trim(),
      roleFunction: newEmployee.roleFunction.trim(),
      isEffective: newEmployee.isEffective || 'Sim',
      contractType: newEmployee.contractType.trim(),
      contractLink: newEmployee.contractLink.trim(),
      admissionDate: newEmployee.admissionDate,
      academicLevel: newEmployee.academicLevel || 'Licenciatura',
      trainingArea: newEmployee.trainingArea.trim(),
      leadershipRole: newEmployee.leadershipRole.trim(),
      department: newEmployee.department,
      taughtSubjects: newEmployee.taughtSubjects.filter(s => s.trim() !== '')
    };

    addEmployee(createdEmployeePayload);

    // Open the Processo Individual form immediately for the newly registered employee
    setSelectedEmployee(createdEmployeePayload);

    const generatedEmail = newEmployee.email.trim() || `${assignedId.toLowerCase()}@escola.mz`;
    setSuccessMessage(`Colaborador registado com sucesso! O Formulário do Processo Individual foi aberto. Credenciais: ${generatedEmail} | ID: ${assignedId}`);
    setTimeout(() => setSuccessMessage(null), 10000);

    // Reset Form
    setNewEmployee({
      name: '',
      gender: '',
      nuit: '',
      email: '',
      phone: '',
      maritalStatus: '',
      fatherName: '',
      motherName: '',
      idCardNumber: '',
      idCardIssuedAt: '',
      idCardIssuedDate: '',
      nationality: 'Moçambicana',
      birthProvince: '',
      birthDistrict: '',
      birthDate: '',
      address: '',
      neighborhood: '',
      residenceDistrict: '',
      cell: '',
      blockNo: '',
      houseNo: '',
      childrenCount: 0,
      career: 'Docente',
      category: '',
      roleFunction: '',
      isEffective: 'Sim',
      contractType: 'Nomeação Definitiva',
      contractLink: 'Quadro de Nomeação',
      admissionDate: new Date().toISOString().split('T')[0],
      academicLevel: 'Licenciatura',
      trainingArea: '',
      leadershipRole: '',
      department: '',
      taughtSubjects: ['', '', '', ''],
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem a certeza que deseja eliminar o registo do colaborador "${name}" (ID: ${id})?`)) {
      deleteEmployee(id);
    }
  };

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return (employees || []).filter(emp => {
      const matchesSearch = 
        !searchTerm.trim() ||
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.nuit.includes(searchTerm) ||
        emp.idCardNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.category && emp.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp.birthProvince && emp.birthProvince.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (emp.birthDistrict && emp.birthDistrict.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCareer = filterCareer === 'all' || emp.career === filterCareer;
      const matchesProvince = filterProvince === 'all' || emp.birthProvince === filterProvince;

      return matchesSearch && matchesCareer && matchesProvince;
    });
  }, [employees, searchTerm, filterCareer, filterProvince]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
              MINEDH · Recursos Humanos
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {school?.name || 'Escola Secundária Central'}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3 mt-1">
            <FolderOpen className="h-7 w-7 text-blue-700" />
            Gestão dos Colaboradores • Processos Individuais
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Arquivo e Gestão de Processos Individuais, Fichas Cadastrais e Enquadramento dos Docentes e Corpo Técnico-Administrativo (CTA).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-2xs">
            <span className="font-semibold text-blue-900">Total de Processos:</span>
            <span className="bg-blue-700 text-white font-bold px-2 py-0.5 rounded-full text-xs">
              {(employees || []).length}
            </span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.print()}
            className="flex items-center gap-2 text-xs py-2 border-gray-300 hover:bg-gray-100"
          >
            <Printer className="h-4 w-4 text-gray-600" />
            <span>Imprimir Relação</span>
          </Button>
          <Button 
            onClick={handleScrollToRegister}
            className="bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-2 text-xs py-2 shadow-sm font-bold cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Abrir Novo Processo</span>
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-lg flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-semibold">{successMessage}</p>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-1"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Navegação de Abas do Módulo de Colaboradores */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveView('processos')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeView === 'processos'
              ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <FolderOpen className="h-4 w-4" />
          <span>Processos Individuais</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
            activeView === 'processos' ? 'bg-blue-900 text-blue-100' : 'bg-gray-100 text-gray-700'
          }`}>
            {(employees || []).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('tabela')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeView === 'tabela'
              ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Relação Nominal & Estatística (18 Colunas)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('novo')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeView === 'novo'
              ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          <span>+ Abertura de Novo Processo Individual</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: PROCESSOS INDIVIDUAIS (DOSSIERS E FICHAS CADASTRAIS) */}
      {/* ========================================================================= */}
      {activeView === 'processos' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Estatísticas Rápidas dos Processos Individuais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total de Processos</p>
                  <p className="text-2xl font-black text-gray-900 mt-1 font-serif">{(employees || []).length}</p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
                  <FolderOpen className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 text-[11px] text-gray-500 font-medium">
                Dossiers activos arquivados no SIGE
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-2xs bg-gradient-to-br from-white to-blue-50/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Corpo Docente</p>
                  <p className="text-2xl font-black text-blue-900 mt-1 font-serif">
                    {(employees || []).filter(e => e.career === 'Docente').length}
                  </p>
                </div>
                <div className="p-3 bg-blue-600 text-white rounded-xl shadow-xs">
                  <GraduationCap className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 text-[11px] text-blue-700 font-medium">
                (DocenteH, M, Total): ({(employees || []).filter(e => e.career === 'Docente' && e.gender === 'M').length}, {(employees || []).filter(e => e.career === 'Docente' && e.gender === 'F').length}, {(employees || []).filter(e => e.career === 'Docente').length})
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs bg-gradient-to-br from-white to-amber-50/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Corpo CTA</p>
                  <p className="text-2xl font-black text-amber-950 mt-1 font-serif">
                    {(employees || []).filter(e => e.career === 'CTA').length}
                  </p>
                </div>
                <div className="p-3 bg-amber-500 text-white rounded-xl shadow-xs">
                  <Briefcase className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 text-[11px] text-amber-800 font-medium">
                (CTA H, M, Total): ({(employees || []).filter(e => e.career === 'CTA' && e.gender === 'M').length}, {(employees || []).filter(e => e.career === 'CTA' && e.gender === 'F').length}, {(employees || []).filter(e => e.career === 'CTA').length})
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs bg-gradient-to-br from-white to-emerald-50/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Quadro de Nomeação</p>
                  <p className="text-2xl font-black text-emerald-950 mt-1 font-serif">
                    {(employees || []).filter(e => (e.contractLink || '').includes('Nomeação')).length}
                  </p>
                </div>
                <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-3 text-[11px] text-emerald-700 font-medium">
                Funcionários do Aparelho do Estado
              </div>
            </div>
          </div>

          {/* Barra de Filtros e Pesquisa */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Pesquisar processo por Nome, ID Único, NUIT, B.I., Categoria ou Especialidade..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3.5 top-3 text-xs text-gray-400 hover:text-gray-600"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold">Carreira:</span>
                <select
                  value={filterCareer}
                  onChange={e => setFilterCareer(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg py-2 px-3 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas as Carreiras</option>
                  <option value="Docente">Docente (Professores)</option>
                  <option value="CTA">CTA (Administrativo)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-bold">Província:</span>
                <select
                  value={filterProvince}
                  onChange={e => setFilterProvince(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg py-2 px-3 bg-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas as Províncias</option>
                  {MOZAMBIQUE_PROVINCES.map(p => (
                    <option key={p.province} value={p.province}>{p.province}</option>
                  ))}
                </select>
              </div>

              <div className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-2 rounded-lg border border-gray-200">
                {filteredEmployees.length} de {(employees || []).length} processos
              </div>
            </div>
          </div>

          {/* Grelha de Processos Individuais */}
          {filteredEmployees.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-2xs">
              <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-700">Nenhum processo individual encontrado</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                Não foram encontrados registos que correspondam aos filtros seleccionados. Tente ajustar os termos de pesquisa ou abrir um novo processo individual.
              </p>
              <Button 
                onClick={handleScrollToRegister}
                className="mt-4 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold cursor-pointer"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                + Abrir Novo Processo Individual
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEmployees.map((emp) => (
                <div 
                  key={emp.id} 
                  className="bg-white rounded-2xl border border-gray-200 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group hover:border-blue-300"
                >
                  {/* Top Header Card */}
                  <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-blue-50/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0 border border-blue-400/30 font-serif">
                          {(emp?.name || 'Func').split(' ').filter(Boolean).map(n => n[0] || '').slice(0, 2).join('').toUpperCase() || 'FU'}
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                            {emp.id}
                          </span>
                          <h4 className="font-bold text-gray-900 font-serif text-base mt-1 line-clamp-1 group-hover:text-blue-700 transition-colors">
                            {emp.name}
                          </h4>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              emp.status === 'validado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {emp.status || 'pendente'}
                            </span>
                            {emp.allocatedBy && (
                              <span className="text-[9px] text-blue-600 font-bold uppercase tracking-tight flex items-center gap-1">
                                <Building2 size={10} /> Alocado por {emp.allocatedBy}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shrink-0 ${
                        emp.career === 'Docente' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-amber-500 text-slate-950 font-black'
                      }`}>
                        {emp.career}
                      </span>
                    </div>
                  </div>

                  {/* Body Card */}
                  <div className="p-5 space-y-3 flex-1 text-xs text-gray-600">
                    {emp.leadershipRole && (
                      <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 font-bold flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-purple-700">Cargo de Chefia:</span>
                        <span className="text-xs">{emp.leadershipRole}</span>
                      </div>
                    )}

                    {emp.department && (
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-emerald-700">Alocação:</span>
                        <span className="text-xs">{emp.department}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">NUIT</span>
                        <span className="font-mono font-semibold text-gray-900">{emp.nuit}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Nº B.I.</span>
                        <span className="font-mono font-semibold text-gray-900">{emp.idCardNumber || '---'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Habilitação</span>
                        <span className="font-semibold text-gray-900 line-clamp-1">{emp.academicLevel || 'Licenciatura'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Categoria</span>
                        <span className="font-semibold text-gray-900 line-clamp-1">{emp.category || 'Quadro Geral'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">Naturalidade & Vínculo</span>
                        <span className="font-medium text-gray-800">
                          {emp.birthDistrict ? `${emp.birthDistrict}, ` : ''}{emp.birthProvince || 'Moçambique'} • {emp.contractLink || 'Quadro de Nomeação'}
                        </span>
                      </div>
                    </div>

                    {emp.career === 'Docente' && emp.taughtSubjects && emp.taughtSubjects.filter(Boolean).length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-gray-400 block text-[10px] uppercase font-bold mb-1">Disciplinas:</span>
                        <div className="flex flex-wrap gap-1">
                          {emp.taughtSubjects.filter(Boolean).map((sub, i) => (
                            <span key={i} className="bg-slate-100 text-slate-800 text-[10px] px-2 py-0.5 rounded font-medium">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Card with Action Button */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedEmployee(emp)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <FolderOpen className="h-4 w-4" />
                      <span>Abrir Processo Individual</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setTimeout(() => window.print(), 300);
                      }}
                      title="Imprimir Ficha Cadastral"
                      className="p-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      <Printer className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(emp.id, emp.name)}
                      title="Eliminar Registo"
                      className="p-2.5 rounded-xl text-red-600 hover:text-red-800 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rodapé com botão para registar novo processo individual */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-5 border border-blue-800">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="p-3.5 bg-blue-600/40 text-blue-200 rounded-2xl border border-blue-400/30 shrink-0 hidden sm:block">
                <FolderOpen className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-base font-bold font-serif text-white flex items-center justify-center md:justify-start gap-2">
                  <span>Admissão de Colaboradores & Abertura de Processo</span>
                  <span className="text-[10px] font-mono bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30 uppercase font-semibold">MINEDH</span>
                </h4>
                <p className="text-xs text-blue-200/90 mt-1 max-w-2xl">
                  Registe um novo Docente ou funcionário do Corpo Técnico-Administrativo (CTA) para gerar o ID Único oficial e inicializar o Processo Individual do Estado.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-abrir-novo-processo-fim-lista"
              onClick={handleScrollToRegister}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            >
              <UserPlus className="h-5 w-5 text-slate-950 stroke-[2.5]" />
              <span>+ Registar Novo Colaborador</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: FORMULÁRIO DE REGISTO DE COLABORADOR (NOVO PROCESSO) */}
      {/* ========================================================================= */}
      {(activeView === 'novo' || activeView === 'tabela') && (
        <div ref={formRef} id="form-novo-colaborador" className={`scroll-mt-6 ${activeView === 'tabela' ? 'hidden' : ''}`}>
        <Card className={`p-8 shadow-sm border transition-all duration-500 bg-white ${
          isFormHighlighted 
            ? 'border-blue-600 ring-4 ring-blue-200 scale-[1.008] shadow-lg' 
            : 'border-gray-200'
        }`}>
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-50 border-2 border-dashed border-blue-300 rounded-2xl mx-auto flex flex-col items-center justify-center text-blue-600 mb-3 shadow-xs">
              <UserPlus className="h-7 w-7" />
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1">Registo</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-serif">Registar Novo Colaborador • Abertura de Processo Individual</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Preencha os dados abaixo. O ID único é gerado em tempo real com as iniciais do nome e o NUIT.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* 1. DADOS PESSOAIS */}
            <div className="border border-gray-300 rounded-xl p-6 pt-7 relative shadow-2xs bg-white">
              <h4 className="absolute -top-3 left-5 bg-white px-3 text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2 border border-blue-200 rounded-md">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span> 
                1. Dados Pessoais
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {/* ID ÚNICO GERADO AUTOMATICAMENTE */}
                <div className="md:col-span-1 bg-blue-50/60 p-3 rounded-lg border border-blue-200">
                  <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center justify-between">
                    <span>ID Único (Automático)</span>
                    <span className="text-[10px] text-blue-600 bg-blue-100 font-semibold px-1.5 py-0.2 rounded">Iniciais + NUIT</span>
                  </label>
                  <div className="relative">
                    <Input 
                      readOnly 
                      value={liveGeneratedId || 'Aguardando dados...'} 
                      placeholder="Ex: CAL-102938475" 
                      className="bg-white border-blue-300 font-mono font-bold text-blue-900 text-sm h-10 shadow-2xs"
                    />
                    {liveGeneratedId && (
                      <div className="absolute right-2.5 top-2.5">
                        <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-blue-700/80 mt-1 leading-tight">
                    {liveGeneratedId 
                      ? `Gerado com sucesso para "${newEmployee.name.trim()}"`
                      : 'Preencha o Nome Completo e o NUIT para gerar o ID'}
                  </p>
                </div>

                {/* NOME COMPLETO */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-800 mb-1">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <Input 
                    ref={nameInputRef}
                    required 
                    placeholder="Ex: Carlos Alberto Langa" 
                    value={newEmployee.name} 
                    onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} 
                    className="h-10"
                  />
                </div>

              {/* GÉNERO */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Género <span className="text-red-500">*</span>
                </label>
                <select 
                  required
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  value={newEmployee.gender} 
                  onChange={e => setNewEmployee({ ...newEmployee, gender: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  <option value="M">Masculino (M)</option>
                  <option value="F">Feminino (F)</option>
                </select>
              </div>

              {/* NUIT */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  NUIT <span className="text-red-500">*</span>
                </label>
                <Input 
                  required
                  placeholder="Ex: 102938475" 
                  value={newEmployee.nuit} 
                  onChange={e => setNewEmployee({ ...newEmployee, nuit: e.target.value })} 
                  className="h-10 font-mono"
                />
              </div>

              {/* Nº B.I. */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Nº do B.I. / Passaporte <span className="text-red-500">*</span>
                </label>
                <Input 
                  required
                  placeholder="Ex: 110100482910M" 
                  value={newEmployee.idCardNumber} 
                  onChange={e => setNewEmployee({ ...newEmployee, idCardNumber: e.target.value })} 
                  className="h-10 uppercase"
                />
              </div>

              {/* ESTADO CIVIL */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Estado Civil <span className="text-red-500">*</span>
                </label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  value={newEmployee.maritalStatus} 
                  onChange={e => setNewEmployee({ ...newEmployee, maritalStatus: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  <option value="Solteiro">Solteiro(a)</option>
                  <option value="Casado">Casado(a)</option>
                  <option value="Divorciado">Divorciado(a)</option>
                  <option value="Viúvo">Viúvo(a)</option>
                </select>
              </div>

              {/* DATA DE NASCIMENTO */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Data de Nascimento <span className="text-red-500">*</span>
                </label>
                <Input 
                  required
                  type="date" 
                  value={newEmployee.birthDate} 
                  onChange={e => setNewEmployee({ ...newEmployee, birthDate: e.target.value })} 
                  className="h-10"
                />
              </div>

              {/* TELEFONE */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">Telefone Principal</label>
                <Input 
                  placeholder="Ex: +258 84 123 4567" 
                  value={newEmployee.phone} 
                  onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })} 
                  className="h-10"
                />
              </div>

              {/* EMAIL */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                <Input 
                  type="email" 
                  placeholder="Ex: docente@mined.gov.mz" 
                  value={newEmployee.email} 
                  onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} 
                  className="h-10"
                />
              </div>

              {/* NOME DO PAI */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Pai</label>
                <Input 
                  placeholder="Nome do pai" 
                  value={newEmployee.fatherName} 
                  onChange={e => setNewEmployee({ ...newEmployee, fatherName: e.target.value })} 
                  className="h-10"
                />
              </div>

              {/* NOME DA MÃE */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome da Mãe</label>
                <Input 
                  placeholder="Nome da mãe" 
                  value={newEmployee.motherName} 
                  onChange={e => setNewEmployee({ ...newEmployee, motherName: e.target.value })} 
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* 2. LOCAL DE NASCIMENTO (COM DROPDOWNS EM CASCATA DE MOÇAMBIQUE) */}
          <div className="border border-gray-300 rounded-xl p-6 pt-7 relative shadow-2xs bg-white">
            <h4 className="absolute -top-3 left-5 bg-white px-3 text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2 border border-blue-200 rounded-md">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span> 
              2. Local de Nascimento
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* PAÍS */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-800 mb-1">País</label>
                <Input 
                  value={newEmployee.nationality} 
                  onChange={e => setNewEmployee({ ...newEmployee, nationality: e.target.value })} 
                  className="h-10 bg-gray-50"
                />
              </div>

              {/* PROVÍNCIA DE NASCIMENTO (DROPDOWN COMPLETO DE MOÇAMBIQUE) */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center justify-between">
                  <span>Província de Nascimento <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-gray-400">11 Províncias</span>
                </label>
                <select 
                  required
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  value={newEmployee.birthProvince} 
                  onChange={handleProvinceChange}
                >
                  <option value="">Selecione a Província...</option>
                  {MOZAMBIQUE_PROVINCES.map(p => (
                    <option key={p.province} value={p.province}>
                      {p.province}
                    </option>
                  ))}
                </select>
              </div>

              {/* DISTRITO DE NASCIMENTO (DROPDOWN DINÂMICO BASEADO NA PROVÍNCIA) */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center justify-between">
                  <span>Distrito de Nascimento <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-blue-600 font-normal">
                    {newEmployee.birthProvince ? `${birthDistricts.length} Distritos disponíveis` : 'Selecione primeiro a Província'}
                  </span>
                </label>
                <select 
                  required
                  disabled={!newEmployee.birthProvince}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  value={newEmployee.birthDistrict} 
                  onChange={e => setNewEmployee({ ...newEmployee, birthDistrict: e.target.value })}
                >
                  <option value="">
                    {newEmployee.birthProvince ? 'Selecione o Distrito...' : 'Selecione primeiro a Província'}
                  </option>
                  {birthDistricts.map(dist => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                </select>
              </div>

              {/* MORADA / RESIDÊNCIA */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">Morada Actual (Rua / Bairro / Distrito)</label>
                <Input 
                  placeholder="Ex: Bairro da Liberdade, Av. das Indústrias" 
                  value={newEmployee.address} 
                  onChange={e => setNewEmployee({ ...newEmployee, address: e.target.value })} 
                  className="h-10"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">Bairro</label>
                <Input 
                  placeholder="Bairro" 
                  value={newEmployee.neighborhood} 
                  onChange={e => setNewEmployee({ ...newEmployee, neighborhood: e.target.value })} 
                  className="h-10"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-700 mb-1">Nº de Filhos</label>
                <Input 
                  type="number" 
                  min="0" 
                  value={newEmployee.childrenCount} 
                  onChange={e => setNewEmployee({ ...newEmployee, childrenCount: parseInt(e.target.value) || 0 })} 
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* 3. ENQUADRAMENTO INSTITUCIONAL & CARGO DE CHEFIA */}
          <div className="border border-gray-300 rounded-xl p-6 pt-7 relative shadow-2xs bg-white">
            <h4 className="absolute -top-3 left-5 bg-white px-3 text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2 border border-blue-200 rounded-md">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span> 
              3. Enquadramento Institucional & Cargo de Chefia
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* NÍVEL ACADÉMICO */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-800 mb-1">Nível Académico <span className="text-red-500">*</span></label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  value={newEmployee.academicLevel} 
                  onChange={e => setNewEmployee({ ...newEmployee, academicLevel: e.target.value })}
                >
                  {ACADEMIC_LEVELS.map(lvl => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              {/* ÁREA DE FORMAÇÃO */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-800 mb-1">Área de Formação <span className="text-red-500">*</span></label>
                <Input 
                  list="employee-training-areas"
                  required
                  placeholder="Ex: Ensino de Matemática" 
                  value={newEmployee.trainingArea} 
                  onChange={e => setNewEmployee({ ...newEmployee, trainingArea: e.target.value })} 
                  className="h-10"
                />
                <datalist id="employee-training-areas">
                  {COMMON_TRAINING_AREAS.map(area => (
                    <option key={area} value={area} />
                  ))}
                </datalist>
              </div>

              {/* CATEGORIA */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-800 mb-1">Categoria Profissional <span className="text-red-500">*</span></label>
                <Input 
                  placeholder="Ex: Docente N1, Técnico N1" 
                  value={newEmployee.category} 
                  onChange={e => setNewEmployee({ ...newEmployee, category: e.target.value })} 
                  className="h-10"
                />
              </div>

              {/* TIPO DE CONTRATO */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-800 mb-1">Tipo de Contrato</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  value={newEmployee.contractType} 
                  onChange={e => setNewEmployee({ ...newEmployee, contractType: e.target.value })}
                >
                  <option value="Nomeação Definitiva">Nomeação Definitiva</option>
                  <option value="Nomeação Provisória">Nomeação Provisória</option>
                  <option value="Contrato a Termo Certo">Contrato a Termo Certo</option>
                  <option value="Prestação de Serviços">Prestação de Serviços</option>
                </select>
              </div>

              {/* VÍNCULO CONTRACTUAL */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-800 mb-1">Vínculo Contractual</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  value={newEmployee.contractLink} 
                  onChange={e => setNewEmployee({ ...newEmployee, contractLink: e.target.value })}
                >
                  <option value="Quadro de Nomeação">Quadro de Nomeação</option>
                  <option value="Contratado do Estado">Contratado do Estado</option>
                  <option value="Contratado Local">Contratado Local</option>
                  <option value="Destacamento">Destacamento</option>
                </select>
              </div>

              {/* CARREIRA */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-800 mb-1">Carreira</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  value={newEmployee.career} 
                  onChange={e => setNewEmployee({ ...newEmployee, career: e.target.value })}
                >
                  <option value="Docente">Docente (Professor)</option>
                  <option value="CTA">CTA (Corpo Técnico Administrativo)</option>
                </select>
              </div>

              {/* ALOCAÇÃO / DEPARTAMENTO (PARA CTA) */}
              {newEmployee.career === 'CTA' && (
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-emerald-900 mb-1 flex items-center justify-between">
                    <span>Alocação / Departamento</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 font-semibold px-1.5 py-0.2 rounded">Sector</span>
                  </label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-emerald-300 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                    value={newEmployee.department} 
                    onChange={e => setNewEmployee({ ...newEmployee, department: e.target.value })}
                  >
                    <option value="">Selecione o Sector...</option>
                    <option value="Secretaria">Secretaria</option>
                    <option value="Biblioteca">Biblioteca</option>
                    <option value="Pedagógico">Pedagógico</option>
                    <option value="Direcção">Direcção</option>
                    <option value="Serviços Gerais">Serviços Gerais</option>
                  </select>
                </div>
              )}

              {/* CARGO DE CHEFIA (DESTACADO CONFORME CABEÇALHO DO UTILIZADOR) */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-indigo-900 mb-1 flex items-center justify-between">
                  <span>Cargo de Chefia</span>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 font-semibold px-1.5 py-0.2 rounded">Liderança</span>
                </label>
                <select 
                  className="flex h-10 w-full rounded-md border border-indigo-300 bg-white px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                  value={newEmployee.leadershipRole} 
                  onChange={e => setNewEmployee({ ...newEmployee, leadershipRole: e.target.value })}
                >
                  <option value="">Nenhum (Sem Chefia / Função Padrão)</option>
                  
                  <optgroup label="Gestão">
                    <option value="Director da Escola">Director da Escola</option>
                    <option value="Director Pedagógico">Director Pedagógico</option>
                    <option value="Director Administrativo">Director Administrativo</option>
                  </optgroup>

                  <optgroup label="Secretaria">
                    <option value="Chefe da Secretaria">Chefe da Secretaria</option>
                    <option value="Técnico Administrativo">Técnico Administrativo</option>
                    <option value="Arquivista">Arquivista</option>
                  </optgroup>

                  <optgroup label="Pedagógico">
                    <option value="Coordenador de Ciclo">Coordenador de Ciclo</option>
                    <option value="Chefe de Grupo de Disciplina">Chefe de Grupo de Disciplina</option>
                    <option value="Professor">Professor</option>
                  </optgroup>

                  <optgroup label="Apoio">
                    <option value="Bibliotecário">Bibliotecário</option>
                    <option value="Técnico de Informática">Técnico de Informática</option>
                    <option value="Laboratorista">Laboratorista</option>
                    <option value="Guarda">Guarda</option>
                    <option value="Servente">Servente</option>
                  </optgroup>

                  <optgroup label="Órgãos Participativos">
                    <option value="Conselho da Escola">Conselho da Escola</option>
                    <option value="Associação de Pais e Encarregados de Educação">Associação de Pais e Encarregados de Educação</option>
                  </optgroup>
                </select>
              </div>

              {/* DATA DE ADMISSÃO */}
              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-gray-800 mb-1">Data de Admissão</label>
                <Input 
                  type="date" 
                  value={newEmployee.admissionDate} 
                  onChange={e => setNewEmployee({ ...newEmployee, admissionDate: e.target.value })} 
                  className="h-10"
                />
              </div>
            </div>

            {/* SE FOR DOCENTE: DISCIPLINAS */}
            {newEmployee.career === 'Docente' && (
              <div className="mt-6 pt-5 border-t border-gray-200">
                <h5 className="text-xs font-bold text-blue-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  Disciplinas Leccionadas
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Disciplina {i + 1}</label>
                      <Input 
                        placeholder={`Ex: Matemática, Física...`} 
                        value={newEmployee.taughtSubjects[i]} 
                        onChange={e => {
                          const newArr = [...newEmployee.taughtSubjects];
                          newArr[i] = e.target.value;
                          setNewEmployee({ ...newEmployee, taughtSubjects: newArr });
                        }}
                        className="h-9 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* BOTÃO DE SUBMISSÃO */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-gray-500">
              <span className="font-semibold text-gray-700">Nota:</span> Todos os dados serão sincronizados na Relação Oficial de Colaboradores.
            </div>
            <Button 
              type="submit" 
              className="w-full sm:w-auto px-10 py-3 text-base font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-md flex items-center justify-center gap-2"
            >
              <UserPlus className="h-5 w-5" />
              <span>Registar Colaborador</span>
            </Button>
          </div>
        </form>
      </Card>
      </div>
      )}


      {/* ========================================================================= */}
      {/* ABA 2: TABELA OFICIAL DE COLABORADORES REGISTADOS (18 COLUNAS) */}
      {/* ========================================================================= */}
      {activeView === 'tabela' && (
      <div className="space-y-4 pt-2 animate-in fade-in">
        
        {/* Barra de Filtros e Pesquisa */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Pesquisar por Nome, ID Único, NUIT, B.I., Categoria ou Distrito..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Carreira:</span>
              <select
                value={filterCareer}
                onChange={e => setFilterCareer(e.target.value)}
                className="text-xs border border-gray-300 rounded-md py-1.5 px-2 bg-white focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">Todas as Carreiras</option>
                <option value="Docente">Docente</option>
                <option value="CTA">CTA</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Província:</span>
              <select
                value={filterProvince}
                onChange={e => setFilterProvince(e.target.value)}
                className="text-xs border border-gray-300 rounded-md py-1.5 px-2 bg-white focus:ring-1 focus:ring-sky-500"
              >
                <option value="all">Todas as Províncias</option>
                {MOZAMBIQUE_PROVINCES.map(p => (
                  <option key={p.province} value={p.province}>{p.province}</option>
                ))}
              </select>
            </div>

            <div className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">
              {filteredEmployees.length} de {(employees || []).length} encontrados
            </div>
          </div>
        </div>

        {/* Tabela Oficial com o Cabeçalho Ciano (#00a2e8) conforme a Imagem */}
        <div className="bg-white rounded-xl shadow-md border border-sky-600/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                {/* LINHA 1 DO CABEÇALHO: GRUPOS PRINCIPAIS */}
                <tr className="bg-[#00a8e8] text-gray-950">
                  <th 
                    colSpan={7} 
                    className="border border-[#0090cc] py-2.5 px-3 text-center text-sm font-bold tracking-tight font-serif"
                  >
                    Dados Pessoais
                  </th>
                  <th 
                    colSpan={3} 
                    className="border border-[#0090cc] py-2.5 px-3 text-center text-sm font-bold tracking-tight font-serif"
                  >
                    Local de Nascimento
                  </th>
                  <th 
                    colSpan={7} 
                    className="border border-[#0090cc] py-2.5 px-3 text-center text-sm font-bold tracking-tight font-serif"
                  >
                    Enquadramento Institucional
                  </th>
                  <th 
                    rowSpan={2} 
                    className="border border-[#0090cc] py-2.5 px-3 text-center text-sm font-bold tracking-tight font-serif align-middle bg-[#00a8e8] min-w-[130px]"
                  >
                    Cargo de Chefia
                  </th>
                  <th 
                    rowSpan={2} 
                    className="border border-[#0090cc] py-2.5 px-3 text-center text-sm font-bold tracking-tight font-serif align-middle bg-[#00a8e8] min-w-[90px]"
                  >
                    Ações
                  </th>
                </tr>

                {/* LINHA 2 DO CABEÇALHO: SUB-COLUNAS INDIVIDUAIS */}
                <tr className="bg-[#00a8e8] text-gray-950 text-xs font-bold">
                  {/* Dados Pessoais (7 sub-colunas) */}
                  <th className="border border-[#0090cc] py-2 px-2 text-center whitespace-nowrap min-w-[44px]">Ord.</th>
                  <th className="border border-[#0090cc] py-2 px-3 text-left whitespace-nowrap min-w-[200px]">Nome Completo</th>
                  <th className="border border-[#0090cc] py-2 px-2 text-center whitespace-nowrap min-w-[60px]">Género</th>
                  <th className="border border-[#0090cc] py-2 px-2 text-center whitespace-nowrap min-w-[90px]">NUIT</th>
                  <th className="border border-[#0090cc] py-2 px-2 text-center whitespace-nowrap min-w-[120px]">Nº B.I.</th>
                  <th className="border border-[#0090cc] py-2 px-2 text-center whitespace-nowrap min-w-[100px]">Data de Nascimento</th>
                  <th className="border border-[#0090cc] py-2 px-2 text-center whitespace-nowrap min-w-[80px]">Estado</th>

                  {/* Local de Nascimento (3 sub-colunas) */}
                  <th className="border border-[#0090cc] py-2 px-2 text-center whitespace-nowrap min-w-[80px]">País</th>
                  <th className="border border-[#0090cc] py-2 px-3 text-left whitespace-nowrap min-w-[130px]">Província</th>
                  <th className="border border-[#0090cc] py-2 px-3 text-left whitespace-nowrap min-w-[130px]">Distrito</th>

                  {/* Enquadramento Institucional (6 sub-colunas) */}
                  <th className="border border-[#0090cc] py-2 px-2 text-center whitespace-nowrap min-w-[110px]">Nível Académico</th>
                  <th className="border border-[#0090cc] py-2 px-3 text-left whitespace-nowrap min-w-[140px]">Área de Formação</th>
                  <th className="border border-[#0090cc] py-2 px-2 text-center whitespace-nowrap min-w-[110px]">Categoria</th>
                  <th className="border border-[#0090cc] py-2 px-2 text-center whitespace-nowrap min-w-[120px]">Tipo de Contrato</th>
                  <th className="border border-[#0090cc] py-2 px-2 text-center whitespace-nowrap min-w-[120px]">Vínculo Contractual</th>
                  <th className="border border-[#0090cc] py-2 px-2 text-center whitespace-nowrap min-w-[100px]">Alocação</th>
                  <th className="border border-[#0090cc] py-2 px-2 text-center whitespace-nowrap min-w-[80px]">Carreira</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200 text-xs">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={19} className="py-12 text-center text-gray-500 italic bg-gray-50">
                      Nenhum colaborador encontrado com os critérios de pesquisa.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp, index) => {
                    return (
                      <tr 
                        key={emp.id} 
                        className={`hover:bg-sky-50/50 transition-colors ${index % 2 === 1 ? 'bg-gray-50/60' : 'bg-white'}`}
                      >
                        {/* 1. Ord. */}
                        <td className="border border-gray-200 py-2.5 px-2 text-center font-bold text-gray-700">
                          {index + 1}
                        </td>

                        {/* 2. Nome Completo & ID Único */}
                        <td className="border border-gray-200 py-2.5 px-3">
                          <div className="font-bold text-gray-900">{emp.name}</div>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span 
                              className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-800 border border-blue-200"
                              title="ID Único do Colaborador (Iniciais + NUIT)"
                            >
                              ID: {emp.id}
                            </span>
                            {emp.phone && <span className="text-[10px] text-gray-500">· {emp.phone}</span>}
                          </div>
                        </td>

                        {/* 3. Género */}
                        <td className="border border-gray-200 py-2.5 px-2 text-center font-medium text-gray-800">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold ${emp.gender === 'F' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'}`}>
                            {emp.gender || '-'}
                          </span>
                        </td>

                        {/* 4. NUIT */}
                        <td className="border border-gray-200 py-2.5 px-2 text-center font-mono text-gray-800">
                          {emp.nuit || '-'}
                        </td>

                        {/* 5. Nº B.I. */}
                        <td className="border border-gray-200 py-2.5 px-2 text-center font-mono text-gray-800">
                          {emp.idCardNumber || '-'}
                        </td>

                        {/* 6. Data de Nascimento */}
                        <td className="border border-gray-200 py-2.5 px-2 text-center text-gray-700 whitespace-nowrap">
                          {emp.birthDate ? emp.birthDate.split('-').reverse().join('/') : '-'}
                        </td>

                        {/* 7. Estado (Civil) */}
                        <td className="border border-gray-200 py-2.5 px-2 text-center text-gray-700">
                          {emp.maritalStatus || '-'}
                        </td>

                        {/* 8. País */}
                        <td className="border border-gray-200 py-2.5 px-2 text-center text-gray-700">
                          {emp.nationality || 'Moçambique'}
                        </td>

                        {/* 9. Província */}
                        <td className="border border-gray-200 py-2.5 px-3 text-left font-medium text-gray-900">
                          {emp.birthProvince || '-'}
                        </td>

                        {/* 10. Distrito */}
                        <td className="border border-gray-200 py-2.5 px-3 text-left text-gray-800">
                          {emp.birthDistrict || '-'}
                        </td>

                        {/* 11. Nível Académico */}
                        <td className="border border-gray-200 py-2.5 px-2 text-center text-gray-800">
                          {emp.academicLevel || '-'}
                        </td>

                        {/* 12. Área de Formação */}
                        <td className="border border-gray-200 py-2.5 px-3 text-left text-gray-800">
                          {emp.trainingArea || '-'}
                        </td>

                        {/* 13. Categoria */}
                        <td className="border border-gray-200 py-2.5 px-2 text-center text-gray-800">
                          {emp.category || '-'}
                        </td>

                        {/* 14. Tipo de Contrato */}
                        <td className="border border-gray-200 py-2.5 px-2 text-center text-gray-700">
                          {emp.contractType || '-'}
                        </td>

                        {/* 15. Vínculo Contractual */}
                        <td className="border border-gray-200 py-2.5 px-2 text-center text-gray-700">
                          {emp.contractLink || '-'}
                        </td>

                        {/* 15.2 Alocação / Departamento */}
                        <td className="border border-gray-200 py-2.5 px-2 text-center font-bold text-emerald-800">
                          {emp.department || '-'}
                        </td>

                        {/* 16. Carreira */}
                        <td className="border border-gray-200 py-2.5 px-2 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${emp.career === 'Docente' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                            {emp.career || '-'}
                          </span>
                        </td>

                        {/* 17. Cargo de Chefia */}
                        <td className="border border-gray-200 py-2.5 px-3 text-center">
                          {emp.leadershipRole ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200">
                              {emp.leadershipRole}
                            </span>
                          ) : (
                            <span className="text-gray-400">---</span>
                          )}
                        </td>

                        {/* 18. Ações */}
                        <td className="border border-gray-200 py-2.5 px-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedEmployee(emp)}
                              title="Ver Ficha Cadastral Completa"
                              className="p-1.5 rounded text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(emp.id, emp.name)}
                              title="Eliminar Registo"
                              className="p-1.5 rounded text-red-600 hover:bg-red-100 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Rodapé da tabela com botão para registar novo */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3.5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-center sm:text-left">
              <span className="font-bold text-gray-800">
                Registos activos: {filteredEmployees.length} de {(employees || []).length} colaboradores
              </span>
              <span className="hidden sm:inline text-gray-400">•</span>
              <span>Conforme o quadro do Ministério da Educação e Desenvolvimento Humano</span>
            </div>
            
            <button
              type="button"
              id="btn-registar-novo-tabela"
              onClick={handleScrollToRegister}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 active:scale-95 text-white font-bold rounded-lg shadow-sm transition-all text-xs cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Registar Novo Colaborador</span>
            </button>
          </div>
        </div>

        {/* Painel de Ação Destacado no Final da Lista dos Colaboradores */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-5 shadow-md flex flex-col md:flex-row items-center justify-between gap-4 border border-blue-800">
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="p-3 bg-blue-600/40 text-blue-200 rounded-xl border border-blue-400/30 shrink-0 hidden sm:block">
              <UserPlus className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-base font-bold font-serif text-white flex items-center justify-center md:justify-start gap-2">
                <span>Admissão & Cadastro de Colaboradores</span>
                <span className="text-[10px] font-mono bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30 uppercase font-semibold">MINEDH</span>
              </h4>
              <p className="text-xs text-blue-200/90 mt-0.5 max-w-xl">
                Preencha o formulário para registar um novo Docente ou funcionário do Corpo Técnico-Administrativo (CTA) com ID Único gerado instantaneamente.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-registar-novo-final-lista"
            onClick={handleScrollToRegister}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            <UserPlus className="h-4 w-4 text-slate-950 stroke-[2.5]" />
            <span>+ Registar Novo Colaborador</span>
          </button>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PROCESSO INDIVIDUAL DO COLABORADOR (PROCESSO COMPLETO & UPLOADS)   */}
      {/* ========================================================================= */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-black/70  flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[96vh] overflow-y-auto border border-gray-300">
            <EmployeeProcessDocument
              employee={selectedEmployee}
              onClose={() => setSelectedEmployee(null)}
              onSaveSuccess={() => setSelectedEmployee(null)}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FORMULÁRIO DO PROCESSO INDIVIDUAL PARA NOVO COLABORADOR                   */}
      {/* ========================================================================= */}
      {openNewProcessForm && (
        <div className="fixed inset-0 z-50 bg-black/70  flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[96vh] overflow-y-auto border border-gray-300">
            <EmployeeProcessDocument
              employee={{
                id: `COL-${Math.floor(1000 + Math.random() * 9000)}`,
                schoolId: school.id,
                name: '',
                gender: 'M',
                nuit: '',
                email: '',
                phone: '',
                maritalStatus: 'Solteiro(a)',
                fatherName: '',
                motherName: '',
                idCardNumber: '',
                idCardIssuedAt: 'Maputo',
                idCardIssuedDate: '',
                nationality: 'Moçambicana',
                birthProvince: 'Maputo Cidade',
                birthDistrict: 'KaMpfumo',
                birthDate: '',
                address: '',
                neighborhood: '',
                residenceDistrict: 'KaMpfumo',
                cell: '01',
                blockNo: '01',
                houseNo: '10',
                childrenCount: 0,
                career: 'Docente',
                category: 'DN1 - Professor do Ensino Secundário',
                roleFunction: 'Docente de Disciplina',
                isEffective: 'Sim',
                contractType: 'Nomeação Definitiva',
                contractLink: 'Quadro Permanente',
                admissionDate: new Date().toISOString().split('T')[0],
                academicLevel: 'Licenciatura',
                trainingArea: 'Educação / Ensino',
                taughtSubjects: []
              }}
              isNewRegistration={true}
              onClose={() => setOpenNewProcessForm(false)}
              onSaveSuccess={() => setOpenNewProcessForm(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
