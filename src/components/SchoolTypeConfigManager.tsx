import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Card, Button } from './ui';
import { 
  Building2, 
  GraduationCap, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Sparkles, 
  Award, 
  Users, 
  BookOpen, 
  AlertTriangle,
  Check,
  Filter
} from 'lucide-react';
import { SchoolLevelType } from '../types';
import { ALL_SCHOOL_LEVELS_MAPPING, computeAutoCurriculum } from '../data/sigeRoles';

export function SchoolTypeConfigManager() {
  const { schools, activeSchool, currentUser, updateSchoolProfile, classes, students, employees, assignments } = useStore();

  const currentSchool = schools.find(s => s.id === currentUser?.schoolId) || activeSchool || schools[0];

  const [selectedTypes, setSelectedTypes] = useState<SchoolLevelType[]>(
    currentSchool?.schoolTypes || ['ENSINO SECUNDÁRIO DO 1 CICLO', 'ENSINO SECUNDÁRIO DO 2 CICLO']
  );
  
  // Local state for class-to-cycle mapping overrides or persistence
  const schoolClasses = useMemo(() => {
    return classes.filter(c => c.schoolId === currentSchool?.id);
  }, [classes, currentSchool]);

  const [classCycleMap, setClassCycleMap] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    schoolClasses.forEach(c => {
      const g = c.gradeLevel.toLowerCase();
      const match = g.match(/(\d+)/);
      const num = match ? parseInt(match[1], 10) : 1;
      if (num >= 1 && num <= 3) initial[c.id] = '1.º Ciclo Primário (1ª–3ª)';
      else if (num >= 4 && num <= 6) initial[c.id] = '2.º Ciclo Primário (4ª–6ª)';
      else if (num >= 7 && num <= 9) initial[c.id] = '1.º Ciclo Secundário (7ª–9ª)';
      else initial[c.id] = '2.º Ciclo Secundário (10ª–12ª)';
    });
    return initial;
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'classes_link' | 'eligibility'>('config');

  const autoCurriculum = computeAutoCurriculum(selectedTypes);

  const handleSelectPreset = (preset: 'primaria' | 'basica' | 'secundaria') => {
    if (preset === 'primaria') {
      setSelectedTypes(['EP1', 'EP2']);
    } else if (preset === 'basica') {
      setSelectedTypes(['ENSINO BÁSICO']);
    } else if (preset === 'secundaria') {
      setSelectedTypes(['ENSINO SECUNDÁRIO DO 1 CICLO', 'ENSINO SECUNDÁRIO DO 2 CICLO']);
    }
  };

  const handleSaveConfig = async () => {
    if (!currentSchool) return;
    try {
      await updateSchoolProfile(currentSchool.id, {
        schoolTypes: selectedTypes
      });
      setSuccessMessage('Configuração administrativa, ciclos e vínculos atualizados com sucesso conforme o Diploma Ministerial de 2026!');
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err) {
      console.error(err);
    }
  };

  // Eligibility diagnostics
  const classEligibilityDiagnostics = useMemo(() => {
    return schoolClasses.map(cls => {
      const assignedCycle = classCycleMap[cls.id] || 'Não atribuído';
      const classStudents = students.filter(s => s.classId === cls.id);
      const classAssignments = assignments.filter(a => a.classId === cls.id);

      // Validate if grade level matches cycle
      const g = cls.gradeLevel.toLowerCase();
      const match = g.match(/(\d+)/);
      const num = match ? parseInt(match[1], 10) : 0;

      let isCycleValid = true;
      let cycleIssue = '';

      if (assignedCycle.includes('1.º Ciclo Primário') && (num < 1 || num > 3)) {
        isCycleValid = false;
        cycleIssue = 'Classe incompatível com 1.º Ciclo Primário (1ª-3ª)';
      } else if (assignedCycle.includes('2.º Ciclo Primário') && (num < 4 || num > 6)) {
        isCycleValid = false;
        cycleIssue = 'Classe incompatível com 2.º Ciclo Primário (4ª-6ª)';
      } else if (assignedCycle.includes('1.º Ciclo Secundário') && (num < 7 || num > 9)) {
        isCycleValid = false;
        cycleIssue = 'Classe incompatível com 1.º Ciclo Secundário (7ª-9ª)';
      } else if (assignedCycle.includes('2.º Ciclo Secundário') && (num < 10 || num > 12)) {
        isCycleValid = false;
        cycleIssue = 'Classe incompatível com 2.º Ciclo Secundário (10ª-12ª)';
      }

      return {
        cls,
        assignedCycle,
        studentCount: classStudents.length,
        teacherCount: classAssignments.length,
        isCycleValid,
        cycleIssue
      };
    });
  }, [schoolClasses, classCycleMap, students, assignments]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <Card className="p-6 md:p-8 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Módulo de Configuração Administrativa & Ciclos (MINEDH 2026)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Gestão oficial de estabelecimento, vinculação de turmas a ciclos letivos e validação de elegibilidade.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1">
              <ShieldCheck size={14} /> Diploma Ministerial Oficial
            </span>
          </div>
        </div>

        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Navigation Subtabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
          <button
            onClick={() => setActiveSubTab('config')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeSubTab === 'config'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building2 size={15} /> 1. Tipo de Estabelecimento & Ciclos
          </button>
          <button
            onClick={() => setActiveSubTab('classes_link')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeSubTab === 'classes_link'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers size={15} /> 2. Vinculação de Turmas aos Ciclos ({schoolClasses.length})
          </button>
          <button
            onClick={() => setActiveSubTab('eligibility')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              activeSubTab === 'eligibility'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck size={15} /> 3. Validação de Elegibilidade Global
          </button>
        </div>

        {/* SUBTAB 1: CONFIG & PRESETS */}
        {activeSubTab === 'config' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Preset Selector */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                Seleccionar Tipo de Estabelecimento de Ensino (Diploma Ministerial 2026):
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => handleSelectPreset('primaria')}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedTypes.includes('EP1') && selectedTypes.includes('EP2')
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-600/20'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-white/20">Tipo A</span>
                    <h4 className="font-extrabold text-sm mt-1">Escola Primária</h4>
                    <p className={`text-xs ${selectedTypes.includes('EP1') ? 'text-blue-100' : 'text-slate-500'}`}>
                      1.ª à 6.ª Classe (1.º Ciclo: 1ª-3ª | 2.º Ciclo: 4ª-6ª)
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono font-bold flex items-center gap-1">
                    <GraduationCap size={14} /> Classes 1ª a 6ª
                  </div>
                </button>

                <button
                  onClick={() => handleSelectPreset('basica')}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedTypes.includes('ENSINO BÁSICO')
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-600/20'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-white/20">Tipo B</span>
                    <h4 className="font-extrabold text-sm mt-1">Escola Básica</h4>
                    <p className={`text-xs ${selectedTypes.includes('ENSINO BÁSICO') ? 'text-blue-100' : 'text-slate-500'}`}>
                      1.ª à 9.ª Classe (Primário + 1.º Ciclo do Secundário)
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono font-bold flex items-center gap-1">
                    <GraduationCap size={14} /> Classes 1ª a 9ª
                  </div>
                </button>

                <button
                  onClick={() => handleSelectPreset('secundaria')}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedTypes.includes('ENSINO SECUNDÁRIO DO 1 CICLO') && selectedTypes.includes('ENSINO SECUNDÁRIO DO 2 CICLO')
                      ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-600/20'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-white/20">Tipo C</span>
                    <h4 className="font-extrabold text-sm mt-1">Escola Secundária</h4>
                    <p className={`text-xs ${selectedTypes.includes('ENSINO SECUNDÁRIO DO 1 CICLO') ? 'text-blue-100' : 'text-slate-500'}`}>
                      7.ª à 12.ª Classe (1.º Ciclo: 7ª-9ª | 2.º Ciclo: 10ª-12ª)
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono font-bold flex items-center gap-1">
                    <GraduationCap size={14} /> Classes 7ª a 12ª
                  </div>
                </button>
              </div>
            </div>

            {/* Detailed Levels Selection */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 block">
                Módulos Detalhados por Ciclo Oficial:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALL_SCHOOL_LEVELS_MAPPING.map(lvl => {
                  const isChecked = selectedTypes.includes(lvl.id);
                  return (
                    <div
                      key={lvl.id}
                      onClick={() => {
                        setSelectedTypes(prev =>
                          prev.includes(lvl.id) ? prev.filter(x => x !== lvl.id) : [...prev, lvl.id]
                        );
                      }}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                        isChecked ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="pt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs">{lvl.label}</h5>
                        <p className={`text-[11px] mt-1 ${isChecked ? 'text-slate-300' : 'text-slate-500'}`}>
                          {lvl.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Automatic Curriculum Summary */}
            <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-blue-900">
                <Sparkles size={18} className="text-blue-600" />
                <h4 className="font-black text-sm uppercase">Atribuição Automática Conforme Diploma Ministerial</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-blue-100 space-y-1.5 shadow-2xs">
                  <span className="font-extrabold text-blue-900 uppercase text-[10px] block">Classes Abrangidas:</span>
                  <div className="flex flex-wrap gap-1">
                    {autoCurriculum.classes.map(c => (
                      <span key={c} className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[11px]">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-blue-100 space-y-1.5 shadow-2xs">
                  <span className="font-extrabold text-blue-900 uppercase text-[10px] block">Disciplinas Curriculares Atribuídas:</span>
                  <p className="text-slate-600 font-medium text-[11px]">
                    {autoCurriculum.subjects.join(' • ')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: CLASSES TO CYCLE LINKAGE */}
        {activeSubTab === 'classes_link' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-3">
              <Layers size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-black">Vinculação Oficial de Turmas aos Ciclos Letivos:</strong>
                <p className="mt-0.5 text-blue-800">
                  Associe cada turma existente da escola ao seu respetivo ciclo de aprendizagem oficial (1.º ou 2.º Ciclo do Primário/Secundário) em conformidade com o regulamento de organização escolar.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-wider">
                    <th className="p-3.5">Turma / Nome</th>
                    <th className="p-3.5">Classe</th>
                    <th className="p-3.5">Regime / Turno</th>
                    <th className="p-3.5">Ciclo Letivo Vinculado (Diploma 2026)</th>
                    <th className="p-3.5 text-center">Alunos Inscritos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schoolClasses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                        Nenhuma turma registada nesta escola.
                      </td>
                    </tr>
                  ) : (
                    schoolClasses.map(cls => {
                      const currentAssignedCycle = classCycleMap[cls.id] || '1.º Ciclo Secundário (7ª–9ª)';
                      const enrolledCount = students.filter(s => s.classId === cls.id).length;
                      return (
                        <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg"><BookOpen size={14} /></span>
                            {cls.name}
                          </td>
                          <td className="p-3.5 font-extrabold text-blue-600">{cls.gradeLevel}</td>
                          <td className="p-3.5 text-slate-600">{cls.shift || cls.period || 'Diurno'}</td>
                          <td className="p-3.5">
                            <select
                              value={currentAssignedCycle}
                              onChange={(e) => {
                                setClassCycleMap(prev => ({ ...prev, [cls.id]: e.target.value }));
                              }}
                              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-slate-800 shadow-2xs focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="1.º Ciclo Primário (1ª–3ª)">1.º Ciclo Primário (1ª–3ª Classes)</option>
                              <option value="2.º Ciclo Primário (4ª–6ª)">2.º Ciclo Primário (4ª–6ª Classes)</option>
                              <option value="1.º Ciclo Secundário (7ª–9ª)">1.º Ciclo Secundário (7ª–9ª Classes)</option>
                              <option value="2.º Ciclo Secundário (10ª–12ª)">2.º Ciclo Secundário (10ª–12ª Classes)</option>
                            </select>
                          </td>
                          <td className="p-3.5 text-center font-mono font-bold text-slate-700">
                            {enrolledCount} alunos
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBTAB 3: ELIGIBILITY VALIDATION */}
        {activeSubTab === 'eligibility' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start gap-3">
              <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-black">Validação Global de Elegibilidade por Ciclo:</strong>
                <p className="mt-0.5 text-emerald-800">
                  O sistema analisa automaticamente a conformidade entre o nível curricular da turma, o ciclo vinculado e a elegibilidade dos alunos e professores alocados.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400">Total de Turmas Analisadas</span>
                <p className="text-2xl font-black text-slate-900">{schoolClasses.length}</p>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-600">Turmas Conformes</span>
                <p className="text-2xl font-black text-emerald-600">
                  {classEligibilityDiagnostics.filter(d => d.isCycleValid).length}
                </p>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
                <span className="text-[10px] font-black uppercase text-amber-600">Avisos de Incompatibilidade</span>
                <p className="text-2xl font-black text-amber-600">
                  {classEligibilityDiagnostics.filter(d => !d.isCycleValid).length}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {classEligibilityDiagnostics.map(diag => (
                <div 
                  key={diag.cls.id}
                  className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    diag.isCycleValid ? 'bg-white border-slate-200' : 'bg-amber-50/70 border-amber-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900">{diag.cls.name}</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                        {diag.cls.gradeLevel}
                      </span>
                      {diag.isCycleValid ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded flex items-center gap-1">
                          <Check size={12} /> Elegível & Conforme
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-bold rounded flex items-center gap-1">
                          <AlertTriangle size={12} /> {diag.cycleIssue}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      Ciclo Vinculado: <strong className="text-slate-900">{diag.assignedCycle}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold text-slate-700">
                    <div className="px-3 py-1.5 bg-slate-100 rounded-xl">
                      👥 {diag.studentCount} Alunos Matr.
                    </div>
                    <div className="px-3 py-1.5 bg-slate-100 rounded-xl">
                      👨‍🏫 {diag.teacherCount} Docentes
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button
            onClick={handleSaveConfig}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md flex items-center gap-2"
          >
            <Award size={16} /> Salvar Configuração Oficial & Vínculos de Ciclo
          </Button>
        </div>
      </Card>
    </div>
  );
}
