import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Card, Button, Input } from './ui';
import { Employee, Role, School } from '../types';
import { 
  Users, 
  Search, 
  MapPin, 
  ArrowRightLeft, 
  CheckCircle, 
  Clock, 
  Building2, 
  UserCheck,
  ShieldCheck,
  Briefcase,
  GraduationCap
} from 'lucide-react';

export const HRAllocationView: React.FC = () => {
  const { 
    currentUser, 
    allEmployees, 
    allSchools, 
    districts, 
    provinces,
    allocateEmployee,
    verifyEmployee 
  } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pendente' | 'validado'>('all');
  const [isAllocating, setIsAllocating] = useState<string | null>(null);
  const [targetSchoolId, setTargetSchoolId] = useState<string>('');

  if (!currentUser) return null;

  // Role-based visibility
  const visibleSchools = useMemo(() => {
    if (currentUser.role === 'national') return allSchools;
    if (currentUser.role === 'provincial') {
      const provDistricts = districts.filter(d => d.provinceId === currentUser.provinceId).map(d => d.id);
      return allSchools.filter(s => s.districtId && provDistricts.includes(s.districtId));
    }
    if (currentUser.role === 'district') {
      return allSchools.filter(s => s.districtId === currentUser.districtId);
    }
    return [];
  }, [currentUser, allSchools, districts]);

  const visibleSchoolIds = new Set(visibleSchools.map(s => s.id));

  const filteredEmployees = useMemo(() => {
    return (allEmployees || []).filter(emp => {
      const matchesSchoolScope = visibleSchoolIds.has(emp.schoolId);
      const matchesSearch = 
        !searchTerm.trim() || 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSchoolFilter = selectedSchoolId === 'all' || emp.schoolId === selectedSchoolId;
      const matchesStatus = selectedStatus === 'all' || emp.status === selectedStatus;
      
      return matchesSchoolScope && matchesSearch && matchesSchoolFilter && matchesStatus;
    });
  }, [allEmployees, visibleSchoolIds, searchTerm, selectedSchoolId, selectedStatus]);

  const handleAllocate = (employeeId: string) => {
    if (!targetSchoolId) return;
    allocateEmployee(employeeId, targetSchoolId, currentUser.role);
    setIsAllocating(null);
    setTargetSchoolId('');
  };

  const handleVerify = (employeeId: string) => {
    verifyEmployee(employeeId, currentUser.name);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Users className="w-7 h-7 text-blue-600" />
            Gestão de Alocação e Verificação de RH
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {currentUser.role === 'district' 
              ? `Supervisão de colaboradores nas escolas do distrito de ${districts.find(d => d.id === currentUser.districtId)?.name}.`
              : `Supervisão provincial de colaboradores nas escolas de ${provinces.find(p => p.id === currentUser.provinceId)?.name}.`
            }
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-blue-900 font-bold">
            (DocenteH, M, Total): ({filteredEmployees.filter(e => e.career === 'Docente' && e.gender === 'M').length}, {filteredEmployees.filter(e => e.career === 'Docente' && e.gender === 'F').length}, {filteredEmployees.filter(e => e.career === 'Docente').length})
          </div>
          <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-amber-900 font-bold">
            (CTA H, M, Total): ({filteredEmployees.filter(e => e.career === 'CTA' && e.gender === 'M').length}, {filteredEmployees.filter(e => e.career === 'CTA' && e.gender === 'F').length}, {filteredEmployees.filter(e => e.career === 'CTA').length})
          </div>
        </div>
      </div>

      <Card className="p-4 bg-white border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Pesquisar por nome ou ID..." 
            className="pl-10 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Escola:</span>
          <select 
            className="h-10 text-sm border-slate-200 rounded-lg bg-slate-50 focus:ring-blue-500"
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
          >
            <option value="all">Todas as Escolas</option>
            {visibleSchools.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
          <select 
            className="h-10 text-sm border-slate-200 rounded-lg bg-slate-50 focus:ring-blue-500"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
          >
            <option value="all">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="validado">Validados</option>
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {filteredEmployees.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhum colaborador encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          filteredEmployees.map(emp => (
            <Card key={emp.id} className="p-5 hover:shadow-md transition-all border-slate-200 group">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs border ${
                    emp.career === 'Docente' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-amber-50 border-amber-100 text-amber-600'
                  }`}>
                    {emp.career === 'Docente' ? <GraduationCap size={28} /> : <Briefcase size={28} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-slate-900 group-hover:text-blue-700 transition-colors">{emp.name}</h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        emp.status === 'validado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {emp.status || 'pendente'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Building2 size={14} className="text-slate-400" />
                        <span className="font-medium">{visibleSchools.find(s => s.id === emp.schoolId)?.name || 'Escola Desconhecida'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin size={14} className="text-slate-400" />
                        <span>{emp.birthDistrict}, {emp.birthProvince}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <ShieldCheck size={14} className="text-slate-400" />
                        <span>NUIT: {emp.nuit}</span>
                      </div>
                    </div>
                    {emp.verifiedBy && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                        <CheckCircle size={10} /> Validado por {emp.verifiedBy} em {new Date(emp.verifiedAt!).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t lg:border-t-0 pt-4 lg:pt-0">
                  {isAllocating === emp.id ? (
                    <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                      <select 
                        className="h-9 text-xs border-slate-200 rounded-lg bg-white min-w-[200px]"
                        value={targetSchoolId}
                        onChange={(e) => setTargetSchoolId(e.target.value)}
                      >
                        <option value="">Selecionar Escola Destino...</option>
                        {visibleSchools.filter(s => s.id !== emp.schoolId).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <Button 
                        size="sm" 
                        onClick={() => handleAllocate(emp.id)}
                        disabled={!targetSchoolId}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      >
                        Confirmar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setIsAllocating(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsAllocating(emp.id)}
                        className="border-slate-300 text-slate-700 font-bold gap-2"
                      >
                        <ArrowRightLeft size={14} />
                        Alocar para Escola
                      </Button>
                      
                      {emp.status !== 'validado' && (
                        <Button 
                          size="sm"
                          onClick={() => handleVerify(emp.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-sm"
                        >
                          <UserCheck size={14} />
                          Validar e Atualizar
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
