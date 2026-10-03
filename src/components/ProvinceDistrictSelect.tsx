import React, { useMemo } from 'react';
import { MOZAMBIQUE_PROVINCES, getDistrictsForProvince } from '../data/mozambiqueLocations';

interface ProvinceDistrictSelectProps {
  province: string;
  district: string;
  onProvinceChange: (province: string) => void;
  onDistrictChange: (district: string) => void;
  labelProvince?: string;
  labelDistrict?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  selectClassName?: string;
  labelClassName?: string;
  horizontal?: boolean;
  idPrefix?: string;
}

export const ProvinceDistrictSelect: React.FC<ProvinceDistrictSelectProps> = ({
  province,
  district,
  onProvinceChange,
  onDistrictChange,
  labelProvince = 'Província',
  labelDistrict = 'Distrito',
  required = false,
  disabled = false,
  className = '',
  selectClassName = 'w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors',
  labelClassName = 'block text-xs font-bold text-slate-700 mb-1',
  horizontal = false,
  idPrefix = 'loc'
}) => {
  const availableDistricts = useMemo(() => {
    if (!province) return [];
    return getDistrictsForProvince(province);
  }, [province]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProv = e.target.value;
    onProvinceChange(newProv);
    const districts = getDistrictsForProvince(newProv);
    // Auto-select first district if available
    onDistrictChange(districts.length > 0 ? districts[0] : '');
  };

  return (
    <div className={`${horizontal ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'} ${className}`}>
      <div>
        <label htmlFor={`${idPrefix}-province`} className={labelClassName}>
          {labelProvince} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id={`${idPrefix}-province`}
          value={province}
          onChange={handleProvinceChange}
          required={required}
          disabled={disabled}
          className={selectClassName}
        >
          <option value="">Selecione a Província...</option>
          {MOZAMBIQUE_PROVINCES.map(p => (
            <option key={p.province} value={p.province}>
              {p.province}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-district`} className={labelClassName}>
          {labelDistrict} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          id={`${idPrefix}-district`}
          value={district}
          onChange={e => onDistrictChange(e.target.value)}
          required={required}
          disabled={disabled || !province || availableDistricts.length === 0}
          className={`${selectClassName} disabled:opacity-50 disabled:bg-slate-100`}
        >
          <option value="">
            {!province 
              ? 'Selecione primeiro a província' 
              : availableDistricts.length === 0 
              ? 'Nenhum distrito registado' 
              : 'Selecione o Distrito...'}
          </option>
          {availableDistricts.map(d => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
