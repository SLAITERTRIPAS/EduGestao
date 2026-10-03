import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { MOZAMBIQUE_EMBLEM_URL } from '../types';
import { GraduationCap, BookOpen, Bell } from 'lucide-react';

interface WelcomeSplashScreenProps {
  onClose: () => void;
}

export const WelcomeSplashScreen: React.FC<WelcomeSplashScreenProps> = ({ onClose }) => {
  const { currentUser, schools, activeSchool } = useStore();
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);

  const currentSchool = activeSchool || schools.find(s => s.id === currentUser?.schoolId) || schools[0] || {
    name: 'Escola Secundária Josina Machel',
    province: 'Maputo Cidade'
  };

  // Find subjects taught if teacher
  const getTeacherSubjects = () => {
    if (currentUser?.role !== 'teacher') return null;
    
    // In our system, João teaches 'Matemática', 'Física'
    if (currentUser.name.includes('João') || currentUser.id === 'u4') {
      return ['Matemática', 'Física'];
    }
    return ['Língua Portuguesa'];
  };

  const subjects = getTeacherSubjects();

  useEffect(() => {
    const intervalTime = 50; 
    const totalDuration = 5000; // exactly 5 seconds
    const steps = totalDuration / intervalTime;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const newProgress = (currentStep / steps) * 100;
      setProgress(newProgress);
      
      const remainingSeconds = Math.ceil(5 - (currentStep * intervalTime) / 1000);
      setTimeLeft(remainingSeconds >= 0 ? remainingSeconds : 0);

      if (currentStep >= steps) {
        clearInterval(timer);
        onClose();
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onClose]);

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'teacher': return 'Docente / Professor';
      case 'director': return 'Director da Escola';
      case 'pedagogical': return 'Director Adjunto Pedagógico (DAP)';
      case 'secretariat': return 'Chefe de Secretaria';
      case 'admin': return 'Administrador do Sistema';
      case 'student': return 'Aluno';
      case 'guardian': return 'Encarregado de Educação';
      default: return role || 'Utilizador';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#05091e] via-[#091535] to-[#112456] text-white p-6 font-latex">
      <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in duration-500">
        
        {/* Flag of Mozambique Coat of Arms */}
        <div className="flex justify-center">
          <div className="h-24 w-24 flex items-center justify-center">
            <img 
              src={MOZAMBIQUE_EMBLEM_URL} 
              alt="República de Moçambique" 
              className="h-full w-full object-contain filter drop-shadow" 
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* School Welcome Card */}
        <div className="space-y-2">
          <span className="bg-amber-400 text-slate-950 text-[11px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg tracking-widest animate-pulse font-sans">
            SISTEMA DE GESTÃO ESCOLAR OFICIAL • MINEDH
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight pt-3 font-serif">
            Bem-vindo à
          </h1>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-serif drop-shadow-md">
            {currentSchool.name}
          </h2>
          <p className="text-xs text-slate-300 font-semibold uppercase tracking-wider font-sans">
            Província de {currentSchool.province || 'Maputo'} • República de Moçambique
          </p>
        </div>

        {/* User Specific Information Panel */}
        <div className="bg-[#0b1b40]/80 border-2 border-blue-500/30 rounded-3xl p-6 shadow-2xl space-y-4 max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-2 text-amber-400">
            <GraduationCap size={22} />
            <span className="text-xs font-bold uppercase tracking-wider font-sans">
              Autenticação Concluída com Sucesso
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-sans font-bold">
              {getRoleLabel(currentUser?.role)}
            </p>
            <h3 className="text-xl sm:text-2xl font-black text-white font-serif">
              {currentUser?.name}
            </h3>
          </div>

          {/* Subjects Taught Area (Only for Teachers) */}
          {currentUser?.role === 'teacher' && subjects && (
            <div className="pt-3 border-t border-slate-700/60 space-y-1.5">
              <p className="text-[11px] text-amber-200/90 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 font-sans">
                <BookOpen size={13} /> Disciplina(s) / Cadeira(s) Lecionada(s):
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-0.5">
                {subjects.map((sub, idx) => (
                  <span 
                    key={idx} 
                    className="bg-blue-600/50 border border-blue-400/40 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs"
                  >
                    📖 {sub}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Department Information (For Secretariat / Admins / Librarians) */}
          {currentUser?.role !== 'teacher' && currentUser?.department && (
            <div className="pt-3 border-t border-slate-700/60 text-xs">
              <span className="text-[11px] text-amber-200/90 font-bold uppercase tracking-wider font-sans block mb-1">
                Lotação / Gabinete:
              </span>
              <span className="bg-slate-800/60 border border-slate-700 text-slate-200 font-bold px-3 py-1 rounded-lg inline-block">
                🏢 {currentUser.department}
              </span>
            </div>
          )}
        </div>

        {/* Processing Loader / Timer Countdown */}
        <div className="max-w-md mx-auto space-y-3.5 pt-4">
          <div className="w-full bg-slate-900/80 rounded-full h-3.5 p-0.5 border border-slate-700 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 h-full rounded-full transition-all duration-75 shadow-md shadow-amber-400/50"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 font-sans px-1">
            <span>A carregar painel oficial...</span>
            <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-amber-300 font-black">
              {timeLeft}s
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
