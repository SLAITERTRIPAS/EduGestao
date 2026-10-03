import React, { useState, useRef, useEffect } from 'react';
import { Search, GraduationCap, Users, BookOpen, X } from 'lucide-react';
import { useStore } from '../store';

interface QuickSearchHeaderProps {
  onSelectStudent?: (student: any) => void;
  onSelectClass?: (classObj: any) => void;
  onSelectTeacher?: (employee: any) => void;
}

export const QuickSearchHeader: React.FC<QuickSearchHeaderProps> = ({
  onSelectStudent,
  onSelectClass,
  onSelectTeacher,
}) => {
  const { students, classes, employees } = useStore();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const cleanQuery = query.trim().toLowerCase();

  const matchingStudents = cleanQuery
    ? students.filter(
        s =>
          s.name.toLowerCase().includes(cleanQuery) ||
          (s.processCode && s.processCode.toLowerCase().includes(cleanQuery)) ||
          (s.studentNumber && s.studentNumber.toLowerCase().includes(cleanQuery))
      ).slice(0, 5)
    : [];

  const matchingClasses = cleanQuery
    ? classes.filter(
        c =>
          c.name.toLowerCase().includes(cleanQuery) ||
          c.gradeLevel.toLowerCase().includes(cleanQuery)
      ).slice(0, 5)
    : [];

  const matchingEmployees = cleanQuery
    ? employees.filter(
        e =>
          e.name.toLowerCase().includes(cleanQuery) ||
          (e.id && e.id.toLowerCase().includes(cleanQuery)) ||
          (e.role && e.role.toLowerCase().includes(cleanQuery))
      ).slice(0, 5)
    : [];

  const hasResults =
    matchingStudents.length > 0 ||
    matchingClasses.length > 0 ||
    matchingEmployees.length > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Busca rápida: Aluno, Turma ou Professor (Nome ou Código)..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && cleanQuery.length > 0 && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 max-h-96 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2">
          {!hasResults ? (
            <div className="p-4 text-center text-xs text-slate-500">
              Nenhum resultado encontrado para "{query}".
            </div>
          ) : (
            <>
              {matchingStudents.length > 0 && (
                <div className="p-2">
                  <div className="text-[10px] font-black uppercase text-slate-400 px-3 py-1 tracking-wider">
                    Alunos ({matchingStudents.length})
                  </div>
                  {matchingStudents.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setIsOpen(false);
                        setQuery('');
                        if (onSelectStudent) onSelectStudent(s);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="bg-blue-100 text-blue-700 p-1.5 rounded-lg">
                          <GraduationCap size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                            {s.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {s.processCode || s.studentNumber || `ID: ${s.id}`} • {s.entryGrade || 'Estudante'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver Ficha
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {matchingClasses.length > 0 && (
                <div className="p-2">
                  <div className="text-[10px] font-black uppercase text-slate-400 px-3 py-1 tracking-wider">
                    Turmas ({matchingClasses.length})
                  </div>
                  {matchingClasses.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setIsOpen(false);
                        setQuery('');
                        if (onSelectClass) onSelectClass(c);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                            {c.gradeLevel} — {c.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Ano: {c.year} • Período: {c.shift || 'Diurno'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver Turma
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {matchingEmployees.length > 0 && (
                <div className="p-2">
                  <div className="text-[10px] font-black uppercase text-slate-400 px-3 py-1 tracking-wider">
                    Professores / Funcionários ({matchingEmployees.length})
                  </div>
                  {matchingEmployees.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        setIsOpen(false);
                        setQuery('');
                        if (onSelectTeacher) onSelectTeacher(e);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 flex items-center justify-between group transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg">
                          <Users size={16} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                            {e.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {e.id} • {e.role || 'Docente/Funcionário'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver Registo
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
