import React, { useState } from 'react';
import { useStore } from '../store';
import { Building2, Search, Link as LinkIcon, Copy, Check, ExternalLink } from 'lucide-react';
import { Card, Input } from './ui';

export const NationalSchoolsDirectory: React.FC = () => {
  const { schools, districts, getSchoolTenantUrl, setActiveSchoolId, activeSchoolId } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (schoolId: string) => {
    const url = getSchoolTenantUrl(schoolId);
    navigator.clipboard.writeText(url);
    setCopiedId(schoolId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredDistricts = districts.filter(d => 
    schools.some(s => (s.districtId === d.id || s.district?.toLowerCase() === d.name.toLowerCase()) && (
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      d.name.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="text-blue-600" size={22} />
            Diretório Nacional de Escolas
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cada escola possui uma Área de Trabalho isolada acessível por link único.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Pesquisar escola ou distrito..." 
            className="pl-10"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {filteredDistricts.length === 0 ? (
          <Card className="p-8 text-center text-slate-500 text-sm">
            Nenhuma escola encontrada no diretório nacional com esses termos.
          </Card>
        ) : (
          filteredDistricts.map(d => {
            const districtSchools = schools.filter(s => 
              (s.districtId === d.id || s.district?.toLowerCase() === d.name.toLowerCase()) && 
              s.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            if (districtSchools.length === 0) return null;
            
            return (
              <Card key={d.id} className="p-6">
                <h3 className="font-bold text-lg mb-4 text-blue-900 border-b pb-2 flex items-center justify-between">
                  <span>{d.name}</span>
                  <span className="text-xs font-normal text-slate-500">
                    {districtSchools.length} {districtSchools.length === 1 ? 'escola' : 'escolas'}
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {districtSchools.map(s => (
                    <div key={s.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-bold text-slate-800 text-sm">{s.name}</p>
                          {s.code && (
                            <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                              {s.code}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{s.address || 'Moçambique'}</p>
                        {s.directorName && (
                          <p className="text-[11px] text-slate-600 mt-2 bg-slate-100 p-1.5 rounded">
                            <strong>Director:</strong> {s.directorName}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                        <button
                          onClick={() => handleCopyLink(s.id)}
                          className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                          title={`Copiar URL do Tenant: ${getSchoolTenantUrl(s.id)}`}
                        >
                          {copiedId === s.id ? (
                            <>
                              <Check size={12} className="text-emerald-600" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} className="text-emerald-700" />
                              <span>Copiar Link</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setActiveSchoolId(s.id)}
                          className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            activeSchoolId === s.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-300'
                          }`}
                        >
                          <ExternalLink size={12} />
                          <span>{activeSchoolId === s.id ? 'Ativa' : 'Aceder'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};
