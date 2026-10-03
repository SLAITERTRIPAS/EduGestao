import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { School, MOZAMBIQUE_EMBLEM_URL } from '../types';
import { HeaderInstitucional } from './HeaderInstitucional';
import { Button, Card } from './ui';
import { 
  Upload, 
  Image as ImageIcon, 
  Check, 
  Trash2, 
  Eye, 
  Shield, 
  Sparkles, 
  Info, 
  Building2,
  RefreshCw
} from 'lucide-react';

const PRESET_SCHOOL_LOGOS = [
  {
    name: 'Brasão Escolar Tradicional (Azul & Ouro)',
    url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=300&h=300&fit=crop&q=80',
  },
  {
    name: 'Insígnia Académica do Livro Aberto',
    url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=300&h=300&fit=crop&q=80',
  },
  {
    name: 'Emblema Moderno de Ciências e Educação',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=300&h=300&fit=crop&q=80',
  },
  {
    name: 'Brasão Heráldico de Ensino Secundário',
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=300&fit=crop&q=80',
  }
];

export const SchoolLogoManager: React.FC = () => {
  const { schools, updateSchoolProfile, activeSchoolId } = useStore();
  const activeSchool: School = schools.find(s => s.id === activeSchoolId) || schools[0] || {
    id: 'school-1',
    name: 'Escola Secundária Josina Machel',
    address: 'Av. Julius Nyerere, Maputo',
    province: 'Maputo Cidade',
    district: 'KaMpfumo',
  };

  const [currentLogo, setCurrentLogo] = useState<string>(activeSchool.logoUrl || '');
  const [previewLogo, setPreviewLogo] = useState<string>(activeSchool.logoUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 2MB
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('O arquivo de imagem deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPreviewLogo(result);
        setErrorMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = async () => {
    try {
      setIsSaving(true);
      setErrorMessage(null);
      await updateSchoolProfile(activeSchool.id, { logoUrl: previewLogo });
      setCurrentLogo(previewLogo);
      setSuccessMessage('Logótipo da escola atualizado com sucesso! O novo logótipo já está ativo em todos os cabeçalhos institucionais.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setErrorMessage('Erro ao salvar o logótipo: ' + (err.message || 'Falha de comunicação.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Tem a certeza que deseja remover o logótipo personalizado da escola? O cabeçalho exibirá apenas o Emblema Nacional.')) {
      return;
    }

    try {
      setIsSaving(true);
      await updateSchoolProfile(activeSchool.id, { logoUrl: '' });
      setPreviewLogo('');
      setCurrentLogo('');
      setSuccessMessage('Logótipo removido com sucesso. Os documentos exibirão o Emblema Nacional padrão.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage('Erro ao remover o logótipo: ' + (err.message || 'Falha.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl ">
              <Building2 className="h-8 w-8 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight font-serif">
                Identidade Visual & Logótipo Oficial da Escola
              </h2>
              <p className="text-xs text-blue-200 mt-0.5">
                Defina o logótipo oficial que será injetado dinamicamente no componente <code className="bg-white/20 px-1 py-0.5 rounded text-amber-200">HeaderInstitucional</code> em todas as pautas, relatórios, certidões e cadernetas.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] font-mono bg-blue-800/80 px-2.5 py-1 rounded-full border border-blue-400 text-blue-200">
              Escola Ativa: {activeSchool.name}
            </span>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center gap-2 text-sm font-medium animate-fadeIn">
          <Check className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-red-900 flex items-center gap-2 text-sm font-medium animate-fadeIn">
          <Info className="h-5 w-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Upload & Presets on Left, Live Document Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Upload & Presets (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-6 border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Upload className="h-4 w-4 text-blue-600" /> Fazer Upload do Logótipo
            </h3>

            {/* Drag & Drop / File Input Box */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer bg-blue-50/30 hover:bg-blue-50/60 transition-all space-y-3"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/png, image/jpeg, image/svg+xml, image/webp" 
                className="hidden" 
              />
              <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                <ImageIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  Clique para carregar ou arraste o ficheiro
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Formatos suportados: PNG, JPEG, SVG ou WebP (máx. 2MB)
                </p>
              </div>
            </div>

            {/* Direct URL Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Ou insira o URL direto da imagem:
              </label>
              <input
                type="text"
                placeholder="https://exemplo.com/logotipo-escola.png"
                value={previewLogo}
                onChange={(e) => setPreviewLogo(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* Presets Gallery */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Presets Heráldicos Oficiais:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_SCHOOL_LOGOS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPreviewLogo(preset.url)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                      previewLogo === preset.url
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20 font-bold text-blue-900'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <img 
                      src={preset.url} 
                      alt={preset.name} 
                      className="w-8 h-8 rounded-full object-cover border border-slate-300 shrink-0" 
                    />
                    <span className="truncate text-[11px] leading-tight">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              {currentLogo && (
                <Button
                  variant="outline"
                  onClick={handleRemoveLogo}
                  disabled={isSaving}
                  className="text-red-600 border-red-200 hover:bg-red-50 text-xs flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remover Logótipo
                </Button>
              )}
              <Button
                onClick={handleSaveLogo}
                disabled={isSaving || previewLogo === currentLogo}
                className="ml-auto bg-blue-900 hover:bg-blue-800 text-white text-xs px-4 py-2 font-bold flex items-center gap-2 shadow-xs"
              >
                {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Guardar Logótipo Oficial
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Side: Live Document Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 border border-slate-200 shadow-sm bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-600" /> Visualização em Tempo Real (Documentos Oficiais)
              </h3>
              <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                Injeção Automática no HeaderInstitucional
              </span>
            </div>

            {/* Simulated Document Sheet */}
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-300 shadow-xs space-y-4 font-sans">
              {/* Header preview with simulated school object containing updated logo */}
              <HeaderInstitucional
                school={{
                  ...activeSchool,
                  logoUrl: previewLogo,
                }}
                academicYear={2026}
                documentTitle="PAUTA GERAL DE FREQUÊNCIA E EXAME DO CICLO"
                documentSubtitle="Ministério da Educação e Desenvolvimento Humano • MINEDH"
              />

              <div className="text-center text-xs text-slate-400 py-6 border-2 border-dashed border-slate-200 rounded-lg">
                [Corpo do Documento: Tabela de Pauta / Certidão / Recibo de Matrícula]
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
              <Shield className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Garantia Heráldica Ministerial:</strong> Ao definir o logótipo da escola, ele será exibido de forma harmoniosa e emparelhada com o Emblema Oficial da República de Moçambique em todos os documentos oficiais gerados pelo sistema, incluindo exportações PDF e impressões.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
