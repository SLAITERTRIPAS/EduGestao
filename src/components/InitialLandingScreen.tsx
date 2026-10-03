import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { MOZAMBIQUE_EMBLEM_URL } from '../types';

interface InitialLandingScreenProps {
  onContinue: () => void;
}

export const InitialLandingScreen: React.FC<InitialLandingScreenProps> = ({ onContinue }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#05091e] via-[#091535] to-[#112456] flex flex-col items-center justify-center text-white p-6 font-sans">
      <div className="max-w-xl w-full text-center space-y-8 animate-in fade-in duration-500">
        
        {/* Emblema Nacional de Moçambique */}
        <div className="flex justify-center">
          <div className="h-32 w-32 flex items-center justify-center p-2 bg-white/5 rounded-3xl border border-white/10 shadow-2xl ">
            <img 
              src={MOZAMBIQUE_EMBLEM_URL} 
              alt="República de Moçambique • Emblema Oficial" 
              className="h-full w-full object-contain drop-shadow-xl" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Sistema Nome & República */}
        <div className="space-y-3">
          <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg tracking-widest font-sans inline-block">
            REPÚBLICA DE MOÇAMBIQUE • MINEDH
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight font-serif drop-shadow-md">
            EduGestão • Sistema Integrado
          </h1>
          <p className="text-sm text-amber-200/90 font-medium max-w-md mx-auto leading-relaxed">
            Plataforma Oficial de Gestão Escolar, Pautas, Certificação e Recursos Humanos do Ministério da Educação e Desenvolvimento Humano.
          </p>
        </div>

        {/* Botão de Entrada / Clique para Continuar */}
        <div className="pt-4">
          <button
            onClick={onContinue}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-2xl shadow-amber-500/30 transform hover:-translate-y-0.5 transition-all cursor-pointer border border-amber-300"
          >
            <span>Clique para Continuar</span>
            <div className="p-1 bg-slate-950 text-amber-400 rounded-lg group-hover:translate-x-1 transition-transform">
              <ArrowRight size={16} />
            </div>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono pt-8">
          Versão Oficial 4.2 • Segurança Baseada em Zero-Trust & Biometria
        </div>

      </div>
    </div>
  );
};
