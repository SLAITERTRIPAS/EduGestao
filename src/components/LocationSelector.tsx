import React, { useMemo } from 'react';
import { getDistrictsForProvince, MOZAMBIQUE_PROVINCES } from '../data/mozambiqueLocations';

interface LocationSelectorProps {
  province: string;
  setProvince: (p: string) => void;
  district: string;
  setDistrict: (d: string) => void;
  
  // Optional for finer granularity (text inputs for now)
  administrativePost?: string;
  setAdministrativePost?: (a: string) => void;
  locality?: string;
  setLocality?: (l: string) => void;
  
  className?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  province, setProvince,
  district, setDistrict,
  administrativePost, setAdministrativePost,
  locality, setLocality,
  className = ''
}) => {
  const districts = useMemo(() => getDistrictsForProvince(province), [province]);

  // Reset district if it's no longer in the selected province
  React.useEffect(() => {
    if (district && !districts.includes(district)) {
      setDistrict('');
    }
  }, [province, district, districts, setDistrict]);

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      {/* Province */}
      <div>
        <label className="block font-bold text-slate-700 mb-1">
          Província: <span className="text-red-500">*</span>
        </label>
        <select
          value={province}
          onChange={e => setProvince(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Selecione a Província</option>
          {MOZAMBIQUE_PROVINCES.map(p => (
            <option key={p.province} value={p.province}>{p.province}</option>
          ))}
        </select>
      </div>

      {/* District */}
      <div>
        <label className="block font-bold text-slate-700 mb-1">
          Distrito: <span className="text-red-500">*</span>
        </label>
        <select
          value={district}
          onChange={e => setDistrict(e.target.value)}
          disabled={!province}
          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-100"
        >
          <option value="">{province ? 'Selecione o Distrito' : 'Selecione primeiro a Província'}</option>
          {districts.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Posto Administrativo (Text input as fallback) */}
      {setAdministrativePost && (
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Posto Administrativo: <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Urbanização, Matola Sede..."
            value={administrativePost || ''}
            onChange={e => setAdministrativePost(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      )}

      {/* Localidade (Text input as fallback) */}
      {setLocality && (
        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Localidade / Bairro: <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Malangalene, Bairro Central..."
            value={locality || ''}
            onChange={e => setLocality(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      )}
    </div>
  );
};
