import React, { useState } from 'react';
import { useStore } from '../store';
import { Card, Button } from '../components/ui';
import { 
  Users, BookOpen, Calendar, DollarSign, MessageSquare, 
  Award, AlertTriangle, CheckCircle, Clock, FileText, 
  PhoneCall, ShieldCheck, ChevronRight, Download
} from 'lucide-react';
import { AcademicCalendarComponent } from '../components/AcademicCalendarComponent';

export function GuardianDashboard() {
  const store = useStore();
  const students = store.students || [];
  const grades = store.grades || [];
  const attendances = (store as any).attendances || [];
  const financialTransactions = store.financialTransactions || [];
  const currentUser = store.currentUser;

  // Find student associated with guardian or take the first student
  const student = students.find(s => s.guardianName?.toLowerCase().includes(currentUser?.name.toLowerCase() || '')) || students[0];

  const studentGrades = grades.filter(g => g.studentId === student?.id);
  const studentAttendances = attendances.filter((a: any) => a.studentId === student?.id);
  const studentPayments = financialTransactions.filter(f => f.studentId === student?.id || f.studentName?.includes(student?.name || ''));

  const [activeTab, setActiveTab] = useState<'overview' | 'grades' | 'attendance' | 'payments' | 'calendar'>('overview');

  const avgGrade = studentGrades.length > 0 
    ? (studentGrades.reduce((acc, g: any) => acc + (g.score || g.finalGrade || g.value || 0), 0) / studentGrades.length).toFixed(1)
    : '14.5';

  const absencesCount = studentAttendances.filter((a: any) => a.status === 'Falta').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-teal-300 text-xs font-bold uppercase tracking-wider block mb-1">
            EduGestão • Portal do Encarregado de Educação
          </span>
          <h1 className="text-2xl font-bold">Bem-vindo(a), {currentUser?.name || 'Sr(a). Encarregado(a)'}</h1>
          <p className="text-teal-100/80 text-sm mt-1">
            Acompanhamento escolar em tempo real do seu educando: <strong>{student?.name}</strong> (Turma {(student as any)?.className || '10ª A'})
          </p>
        </div>

        <div className="bg-white/10  border border-white/20 px-4 py-2.5 rounded-xl text-right">
          <p className="text-xs text-teal-200">Ano Lectivo 2026</p>
          <p className="font-bold text-sm text-white">{(student as any)?.schoolName || 'Escola Secundária Josina Machel'}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Média Geral Actual</p>
              <p className="text-2xl font-black text-teal-700">{avgGrade} <span className="text-xs font-normal text-slate-400">/ 20</span></p>
            </div>
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-semibold mt-2">Aproveitamento Positivo</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Faltas no Trimestre</p>
              <p className="text-2xl font-bold text-amber-600">{absencesCount}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">96% de Assiduidade</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Situação das Propinas</p>
              <p className="text-lg font-bold text-emerald-700">Regularizada</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 mt-2 font-medium">Mês de Maio Liquidado</p>
        </Card>

        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Comunicações da Escola</p>
              <p className="text-2xl font-bold text-indigo-700">2 novas</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-indigo-600 mt-2 font-medium">Reunião de Pais Agendada</p>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'overview' 
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg' 
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Visão Geral</span>
        </button>

        <button
          onClick={() => setActiveTab('grades')}
          className={`px-4 py-2.5 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'grades' 
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg' 
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Boletim de Notas</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2.5 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'attendance' 
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg' 
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Faltas e Assiduidade</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'payments' 
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg' 
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Propinas & Recibos</span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2.5 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
            activeTab === 'calendar' 
              ? 'border-teal-600 text-teal-700 bg-teal-50/50 rounded-t-lg' 
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Calendário Académico</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Desempenho por Disciplina</h3>
            
            <div className="space-y-3">
              {[
                { subj: 'Matemática', teacher: 'Prof. João Silva', grade: 14, status: 'Positiva' },
                { subj: 'Português', teacher: 'Profª. Maria Machava', grade: 16, status: 'Excelente' },
                { subj: 'Física', teacher: 'Prof. Sérgio Cossa', grade: 13, status: 'Positiva' },
                { subj: 'Química', teacher: 'Profª. Beatriz Sitoe', grade: 15, status: 'Muito Bom' },
                { subj: 'História', teacher: 'Prof. Carlos Tembe', grade: 17, status: 'Excelente' },
                { subj: 'Inglês', teacher: 'Profª. Sara Mondlane', grade: 16, status: 'Excelente' }
              ].map((sub, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{sub.subj}</h4>
                    <p className="text-xs text-slate-500">{sub.teacher}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-lg text-teal-800">{sub.grade} v.</span>
                    <span className="block text-[11px] font-bold text-emerald-600">{sub.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6 border-slate-200 bg-indigo-50/40">
              <h3 className="font-bold text-slate-900 text-base mb-2">Director de Turma</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-base">
                  DT
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Prof. António Matusse</h4>
                  <p className="text-xs text-slate-500">Contacto: +258 84 123 4567</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-indigo-100">
                "O aluno demonstra excelente comportamento cívico e dedicação nas tarefas em grupo."
              </p>
            </Card>

            <Card className="p-6 border-slate-200">
              <h3 className="font-bold text-slate-900 text-base mb-3">Avisos e Convocatórias</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <span className="font-bold text-teal-900 block">Reunião Geral de Encarregados</span>
                  <p className="text-slate-600 mt-1">Sábado, 30 de Maio às 09:00 no Anfiteatro Principal.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Grades */}
      {activeTab === 'grades' && (
        <Card className="p-6 border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-900 text-lg">Boletim Trimestral de Aproveitamento</h3>
            <Button onClick={() => window.print()} variant="outline" className="text-xs font-medium flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Imprimir Boletim Oficial
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Disciplina</th>
                  <th className="px-4 py-3 text-center">ACS 1</th>
                  <th className="px-4 py-3 text-center">ACS 2</th>
                  <th className="px-4 py-3 text-center">APT / Teste Trimestral</th>
                  <th className="px-4 py-3 text-center">Média Final</th>
                  <th className="px-4 py-3 text-right">Apreciação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { d: 'Língua Portuguesa', acs1: 15, acs2: 16, apt: 17, mf: 16 },
                  { d: 'Matemática', acs1: 13, acs2: 14, apt: 15, mf: 14 },
                  { d: 'Física', acs1: 12, acs2: 13, apt: 14, mf: 13 },
                  { d: 'Química', acs1: 14, acs2: 15, apt: 16, mf: 15 },
                  { d: 'Biologia', acs1: 16, acs2: 16, apt: 17, mf: 16.3 },
                  { d: 'História', acs1: 17, acs2: 16, apt: 18, mf: 17 },
                  { d: 'Geografia', acs1: 15, acs2: 15, apt: 16, mf: 15.3 },
                  { d: 'Inglês', acs1: 16, acs2: 17, apt: 16, mf: 16.3 }
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-800">{row.d}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{row.acs1}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{row.acs2}</td>
                    <td className="px-4 py-3 text-center text-slate-600 font-semibold">{row.apt}</td>
                    <td className="px-4 py-3 text-center font-black text-teal-800 text-base">{row.mf}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                        Aprovado
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Attendance */}
      {activeTab === 'attendance' && (
        <Card className="p-6 border-slate-200">
          <h3 className="font-bold text-slate-900 text-lg mb-4">Registo de Presenças e Pontualidade</h3>
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-4 text-xs text-emerald-800">
            O educando possui uma taxa global de assiduidade de <strong>96.8%</strong>, cumprindo integralmente os requisitos do Regulamento Escolar.
          </div>

          <div className="space-y-2">
            <div className="flex justify-between p-3 bg-slate-50 rounded-lg text-xs">
              <span className="font-bold text-slate-700">12 de Maio de 2026</span>
              <span className="text-emerald-700 font-bold">Presente em todas as 6 aulas</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-lg text-xs">
              <span className="font-bold text-slate-700">11 de Maio de 2026</span>
              <span className="text-emerald-700 font-bold">Presente em todas as 6 aulas</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 rounded-lg text-xs">
              <span className="font-bold text-slate-700">08 de Maio de 2026</span>
              <span className="text-amber-700 font-bold">Falta Justificada (Consulta Médica)</span>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Payments */}
      {activeTab === 'payments' && (
        <Card className="p-6 border-slate-200">
          <h3 className="font-bold text-slate-900 text-lg mb-4">Histórico de Pagamentos e Mensalidades</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
                <tr>
                  <th className="px-4 py-3">Mês / Descrição</th>
                  <th className="px-4 py-3">Data de Pagamento</th>
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Recibo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { m: 'Mensalidade de Maio / 2026', d: '04/05/2026', c: 'M-Pesa', v: '1.500 MZN', s: 'Pago' },
                  { m: 'Mensalidade de Abril / 2026', d: '02/04/2026', c: 'M-Pesa', v: '1.500 MZN', s: 'Pago' },
                  { m: 'Mensalidade de Março / 2026', d: '05/03/2026', c: 'BIM POS', v: '1.500 MZN', s: 'Pago' },
                  { m: 'Taxa de Matrícula 2026', d: '15/01/2026', c: 'BIM Transferência', v: '2.000 MZN', s: 'Pago' }
                ].map((pay, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-800">{pay.m}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{pay.d}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-semibold">{pay.c}</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">{pay.v}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {pay.s}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" onClick={() => window.print()} className="text-xs">
                        Recibo
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 5: Academic Calendar */}
      {activeTab === 'calendar' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AcademicCalendarComponent />
        </div>
      )}
    </div>
  );
}
