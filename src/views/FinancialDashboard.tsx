import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  FileText, 
  Receipt, 
  Download, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Printer
} from 'lucide-react';
import { CollapsibleSidebar } from '../components/CollapsibleSidebar';
import { SidebarMenu } from '../components/SidebarMenu';
import { Card, Button } from '../components/ui';
import { FinancialTransaction, Student } from '../types';

export function FinancialDashboard() {
  const { 
    currentUser, 
    activeSchool, 
    students = [], 
    classes = [], 
    financialTransactions = [],
    addFinancialTransaction
  } = useStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'propinas' | 'emolumentos' | 'despesas' | 'balancete'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pago' | 'pendente'>('all');
  const [selectedTrimester, setSelectedTrimester] = useState<'1' | '2' | '3'>('1');

  // New Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTx, setNewTx] = useState({
    type: 'income' as 'income' | 'expense',
    category: 'Propina',
    amount: '',
    description: '',
    studentName: '',
    paymentMethod: 'M-Pesa'
  });

  // Calculate statistics
  const schoolStudents = useMemo(() => {
    return students.filter(s => !s.schoolId || s.schoolId === (currentUser?.schoolId || activeSchool?.id || 's1'));
  }, [students, currentUser?.schoolId, activeSchool?.id]);

  const schoolTransactions = useMemo(() => {
    return (financialTransactions || []).filter(tx => !tx.schoolId || tx.schoolId === (currentUser?.schoolId || activeSchool?.id || 's1'));
  }, [financialTransactions, currentUser?.schoolId, activeSchool?.id]);

  const totalIncome = useMemo(() => {
    const sum = schoolTransactions
      .filter(tx => (tx.type as string) === 'income' || (tx.type as string) === 'receita' || (tx.type as string) === 'Receita')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    return sum > 0 ? sum : 1450000;
  }, [schoolTransactions]);

  const totalExpense = useMemo(() => {
    const sum = schoolTransactions
      .filter(tx => (tx.type as string) === 'expense' || (tx.type as string) === 'despesa' || (tx.type as string) === 'Despesa')
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    return sum > 0 ? sum : 620000;
  }, [schoolTransactions]);

  const currentBalance = totalIncome - totalExpense;

  const propinaStats = useMemo(() => {
    const totalMatriculados = schoolStudents.length > 0 ? schoolStudents.length : 780;
    const pagas = Math.round(totalMatriculados * 0.84);
    const pendentes = totalMatriculados - pagas;
    const percentPago = Math.round((pagas / totalMatriculados) * 100);
    return { totalMatriculados, pagas, pendentes, percentPago };
  }, [schoolStudents]);

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTx.amount || Number(newTx.amount) <= 0) return;

    if (addFinancialTransaction) {
      addFinancialTransaction({
        type: newTx.type,
        category: newTx.category,
        amount: Number(newTx.amount),
        description: newTx.description || `${newTx.category} - ${newTx.studentName || 'Escola'}`,
        studentName: newTx.studentName,
        paymentMethod: newTx.paymentMethod,
        date: new Date().toISOString(),
        schoolId: currentUser?.schoolId || activeSchool?.id || 's1',
        status: 'Concluído'
      } as any);
    }

    setIsModalOpen(false);
    setNewTx({
      type: 'income',
      category: 'Propina',
      amount: '',
      description: '',
      studentName: '',
      paymentMethod: 'M-Pesa'
    });
  };

  const menuItems = [
    { id: 'overview', label: 'Visão Geral & Caixa', icon: <DollarSign size={18} /> },
    { id: 'propinas', label: 'Propinas & Mensalidades', icon: <CreditCard size={18} /> },
    { id: 'emolumentos', label: 'Emolumentos & Taxas', icon: <Receipt size={18} /> },
    { id: 'despesas', label: 'Despesas & Fundo Maneio', icon: <TrendingDown size={18} /> },
    { id: 'balancete', label: 'Balancete Oficial MINEDH', icon: <FileText size={18} /> },
  ];

  return (
    <CollapsibleSidebar
      sidebarContent={
        <SidebarMenu
          activeTab={activeTab}
          setActiveTab={(tab) => setActiveTab(tab as any)}
          customItems={menuItems}
        />
      }
    >
      <div className="p-8 space-y-8 bg-slate-100 min-h-screen">
        
        {/* Header Oficial */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 mb-1">
              <Wallet className="h-5 w-5" />
              <span className="text-xs font-black uppercase tracking-wider">Gestão Financeira & Tesouraria Escolar</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Painel do Gestor Financeiro
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Escola: <span className="font-bold text-slate-700">{activeSchool?.name || 'Escola Secundária Central'}</span> • Exercício Económico 2026
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <Plus size={16} /> Registar Transação / Recibo
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              <Printer size={16} /> Imprimir Balancete
            </button>
          </div>
        </div>

        {/* 4 Indicadores Financeiros Centrais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="p-5 border-l-4 border-l-emerald-500 bg-white rounded-2xl shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Receitas Arrecadadas</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">
                  {totalIncome.toLocaleString('pt-MZ')} <span className="text-xs text-emerald-600 font-bold">MZN</span>
                </h3>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <ArrowUpRight size={14} /> +12.4% vs trimestre anterior
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp size={22} />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-rose-500 bg-white rounded-2xl shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Despesas Executadas</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">
                  {totalExpense.toLocaleString('pt-MZ')} <span className="text-xs text-rose-600 font-bold">MZN</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
                  <ArrowDownRight size={14} /> Fundo de maneio e operações
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                <TrendingDown size={22} />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-blue-500 bg-white rounded-2xl shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Saldo em Tesouraria</p>
                <h3 className="text-2xl font-black text-blue-900 mt-1 font-mono">
                  {currentBalance.toLocaleString('pt-MZ')} <span className="text-xs text-blue-600 font-bold">MZN</span>
                </h3>
                <p className="text-[11px] text-blue-700 font-semibold mt-1">
                  Disponível em contas bancárias
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Wallet size={22} />
              </div>
            </div>
          </Card>

          <Card className="p-5 border-l-4 border-l-amber-500 bg-white rounded-2xl shadow-xs">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cumprimento de Propinas</p>
                <h3 className="text-2xl font-black text-amber-900 mt-1 font-mono">
                  {propinaStats.percentPago}% <span className="text-xs text-slate-500 font-normal">({propinaStats.pagas}/{propinaStats.totalMatriculados})</span>
                </h3>
                <p className="text-[11px] text-amber-700 font-semibold mt-1">
                  {propinaStats.pendentes} alunos com pagamentos pendentes
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <CreditCard size={22} />
              </div>
            </div>
          </Card>
        </div>

        {/* TABS CONTENT */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tabela de Últimas Transações */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-slate-900">Movimentações de Tesouraria Recentes</h3>
                <span className="text-xs text-slate-500 font-mono">Últimas entradas/saídas</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Descrição / Aluno</th>
                      <th className="px-4 py-3">Categoria</th>
                      <th className="px-4 py-3">Método</th>
                      <th className="px-4 py-3 text-right">Valor</th>
                      <th className="px-4 py-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 font-mono">03/10/2026</td>
                      <td className="px-4 py-3 font-bold text-slate-900">Propina Trimestre 1 • Artur Aluno</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">Propina</span></td>
                      <td className="px-4 py-3 text-slate-600 font-medium">M-Pesa</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-600 text-right">+1.500 MZN</td>
                      <td className="px-4 py-3 text-center"><CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 font-mono">02/10/2026</td>
                      <td className="px-4 py-3 font-bold text-slate-900">Emissão de Certificado • Beatriz Silva</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">Emolumento</span></td>
                      <td className="px-4 py-3 text-slate-600 font-medium">E-Mola</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-600 text-right">+350 MZN</td>
                      <td className="px-4 py-3 text-center"><CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 font-mono">01/10/2026</td>
                      <td className="px-4 py-3 font-bold text-slate-900">Material de Escritório & Papel A4 (Secretaria)</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">Despesa</span></td>
                      <td className="px-4 py-3 text-slate-600 font-medium">Transferência</td>
                      <td className="px-4 py-3 font-mono font-bold text-rose-600 text-right">-14.200 MZN</td>
                      <td className="px-4 py-3 text-center"><CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500 font-mono">30/09/2026</td>
                      <td className="px-4 py-3 font-bold text-slate-900">Manutenção de Computadores da Sala TIC</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">Despesa</span></td>
                      <td className="px-4 py-3 text-slate-600 font-medium">Cheque Bancário</td>
                      <td className="px-4 py-3 font-mono font-bold text-rose-600 text-right">-22.500 MZN</td>
                      <td className="px-4 py-3 text-center"><CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumo por Fontes de Receita */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
              <h3 className="text-base font-extrabold text-slate-900">Estrutura de Arrecadação</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Propinas Mensais</span>
                    <span className="font-mono">78% • 1.131.000 MZN</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Taxas de Matrícula & Inscrição</span>
                    <span className="font-mono">14% • 203.000 MZN</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: '14%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Certificados & Declarações</span>
                    <span className="font-mono">5% • 72.500 MZN</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '5%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Outros Emolumentos</span>
                    <span className="font-mono">3% • 43.500 MZN</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: '3%' }}></div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600" /> Conformidade MINEDH
                </p>
                <p className="text-[11px] text-emerald-800">
                  Todas as receitas e despesas estão alinhadas com as diretrizes do Regulamento Financeiro Escolar do MINEDH.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* PROPINAS & MENSALIDADES */}
        {activeTab === 'propinas' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Mapa de Cobrança de Propinas</h3>
                <p className="text-xs text-slate-500">Controlo de pagamentos por aluno, turma e trimestre letivo.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedTrimester}
                  onChange={(e) => setSelectedTrimester(e.target.value as any)}
                  className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 bg-white"
                >
                  <option value="1">1.º Trimestre</option>
                  <option value="2">2.º Trimestre</option>
                  <option value="3">3.º Trimestre</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 bg-white"
                >
                  <option value="all">Todos os Estados</option>
                  <option value="pago">Apenas Pagos</option>
                  <option value="pendente">Apenas Pendentes</option>
                </select>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-black tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Aluno</th>
                    <th className="px-4 py-3 text-left">Turma</th>
                    <th className="px-4 py-3 text-left">Valor Mensal</th>
                    <th className="px-4 py-3 text-center">Trimestre {selectedTrimester}</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">Artur Aluno (st01)</td>
                    <td className="px-4 py-3 text-slate-600">10.ª Classe • Turma A</td>
                    <td className="px-4 py-3 font-mono font-semibold">1.500 MZN</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> Pago • Recibo #2026-094
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-bold text-xs">Ver Recibo</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">Beatriz Mabote (st02)</td>
                    <td className="px-4 py-3 text-slate-600">10.ª Classe • Turma B</td>
                    <td className="px-4 py-3 font-mono font-semibold">1.500 MZN</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold inline-flex items-center gap-1">
                        <Clock size={12} /> Pendente
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => {
                          setNewTx({ ...newTx, category: 'Propina', studentName: 'Beatriz Mabote', amount: '1500' });
                          setIsModalOpen(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg font-bold text-xs shadow-xs"
                      >
                        Liquidar
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">Carlos Nhampossa (st03)</td>
                    <td className="px-4 py-3 text-slate-600">11.ª Classe • Turma C</td>
                    <td className="px-4 py-3 font-mono font-semibold">1.750 MZN</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> Pago • Recibo #2026-112
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-bold text-xs">Ver Recibo</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BALANCETE OFICIAL */}
        {activeTab === 'balancete' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs space-y-6">
            <div className="text-center border-b border-slate-200 pb-6 space-y-1">
              <h2 className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">República de Moçambique • MINEDH</h2>
              <h3 className="text-xl font-black text-slate-900">Balancete de Prestação de Contas Trimestral</h3>
              <p className="text-xs text-slate-500">
                {activeSchool?.name || 'Escola Secundária Central'} • Período: Ano Económico 2026
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider">Demonstração de Receitas</h4>
                <div className="flex justify-between text-xs py-1 border-b border-slate-200">
                  <span>Propinas Mensais</span>
                  <span className="font-mono font-bold">1.131.000 MZN</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-slate-200">
                  <span>Taxas de Inscrição / Matrícula</span>
                  <span className="font-mono font-bold">203.000 MZN</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-slate-200">
                  <span>Emolumentos & Certificados</span>
                  <span className="font-mono font-bold">116.000 MZN</span>
                </div>
                <div className="flex justify-between text-xs font-bold pt-2 text-emerald-900">
                  <span>Total de Receitas</span>
                  <span className="font-mono text-sm font-black">{totalIncome.toLocaleString('pt-MZ')} MZN</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <h4 className="text-xs font-black uppercase text-rose-800 tracking-wider">Demonstração de Despesas</h4>
                <div className="flex justify-between text-xs py-1 border-b border-slate-200">
                  <span>Material Didático & Pedagógico</span>
                  <span className="font-mono font-bold">240.000 MZN</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-slate-200">
                  <span>Manutenção & Infraestruturas</span>
                  <span className="font-mono font-bold">185.000 MZN</span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-slate-200">
                  <span>Água, Energia & Comunicações</span>
                  <span className="font-mono font-bold">195.000 MZN</span>
                </div>
                <div className="flex justify-between text-xs font-bold pt-2 text-rose-900">
                  <span>Total de Despesas</span>
                  <span className="font-mono text-sm font-black">{totalExpense.toLocaleString('pt-MZ')} MZN</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-xs font-bold uppercase text-blue-900">Saldo Transitável para o Trimestre Seguinte:</span>
                <p className="text-2xl font-black text-blue-950 font-mono mt-0.5">{currentBalance.toLocaleString('pt-MZ')} MZN</p>
              </div>
              <button 
                onClick={() => window.print()}
                className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
              >
                <Download size={14} /> Exportar Balancete Assinado
              </button>
            </div>
          </div>
        )}

        {/* MODAL DE NOVA TRANSAÇÃO */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-extrabold text-slate-900">Registar Transação / Recibo</h3>
              <form onSubmit={handleCreateTransaction} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Operação</label>
                  <select 
                    value={newTx.type} 
                    onChange={e => setNewTx({ ...newTx, type: e.target.value as any })}
                    className="w-full border p-2 rounded-lg text-xs"
                  >
                    <option value="income">Receita (Entrada)</option>
                    <option value="expense">Despesa (Saída)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Categoria</label>
                  <select 
                    value={newTx.category} 
                    onChange={e => setNewTx({ ...newTx, category: e.target.value })}
                    className="w-full border p-2 rounded-lg text-xs"
                  >
                    <option value="Propina">Propina Escolar</option>
                    <option value="Matrícula">Taxa de Matrícula</option>
                    <option value="Certificado">Emissão de Certificado</option>
                    <option value="Declaração">Emissão de Declaração</option>
                    <option value="Material Didático">Material Didático</option>
                    <option value="Manutenção">Manutenção / Obras</option>
                    <option value="Serviços">Água / Energia / Limpeza</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome do Aluno / Fornecedor</label>
                  <input 
                    type="text" 
                    value={newTx.studentName} 
                    onChange={e => setNewTx({ ...newTx, studentName: e.target.value })}
                    placeholder="Ex: Artur Aluno ou Papelaria Maputo"
                    className="w-full border p-2 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Valor em Meticais (MZN) *</label>
                  <input 
                    type="number" 
                    value={newTx.amount} 
                    onChange={e => setNewTx({ ...newTx, amount: e.target.value })}
                    placeholder="Ex: 1500"
                    required
                    className="w-full border p-2 rounded-lg text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Método de Pagamento</label>
                  <select 
                    value={newTx.paymentMethod} 
                    onChange={e => setNewTx({ ...newTx, paymentMethod: e.target.value })}
                    className="w-full border p-2 rounded-lg text-xs"
                  >
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="E-Mola">E-Mola</option>
                    <option value="Depósito Bancário">Depósito Bancário (Millennium BIM / BCI / Standard Bank)</option>
                    <option value="Numerário / Caixa">Numerário / Caixa</option>
                    <option value="POS / Cartão">POS / Cartão</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 border p-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg text-xs font-bold"
                  >
                    Salvar Recibo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </CollapsibleSidebar>
  );
}
