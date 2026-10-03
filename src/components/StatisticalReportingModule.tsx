import React, { useState, useMemo } from 'react';
import { useCensusData, ProvinceCensus } from '../hooks/useCensusData';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import { Card } from './ui';
import { TrendingUp, Users, Briefcase } from 'lucide-react';

export const StatisticalReportingModule: React.FC = () => {
  const censusData: Record<string, ProvinceCensus> = useCensusData();
  const [startYear, setStartYear] = useState<number>(2022);
  const [endYear, setEndYear] = useState<number>(2024);

  const data = Object.values(censusData || {}).map(p => ({
    name: p?.provinceName || 'Província',
    Docentes: p?.docentsGender?.total || 0,
    CTA: p?.ctaGender?.total || 0,
    Alunos: p?.studentsGender?.total || 0
  }));

  const ageData = [
    { name: '< 6', value: Object.values(censusData || {}).reduce((acc, p) => acc + (p?.studentsAgeGroup?.lessThan6?.total || 0), 0) },
    { name: '6-11', value: Object.values(censusData || {}).reduce((acc, p) => acc + (p?.studentsAgeGroup?.age6to11?.total || 0), 0) },
    { name: '12-14', value: Object.values(censusData || {}).reduce((acc, p) => acc + (p?.studentsAgeGroup?.age12to14?.total || 0), 0) },
    { name: '15-18', value: Object.values(censusData || {}).reduce((acc, p) => acc + (p?.studentsAgeGroup?.age15to18?.total || 0), 0) },
    { name: '> 18', value: Object.values(censusData || {}).reduce((acc, p) => acc + (p?.studentsAgeGroup?.moreThan18?.total || 0), 0) },
  ];

  const filteredHistoricalData = useMemo(() => {
    const allData = Object.values(censusData)[0]?.historicalData || [];
    return allData.filter(d => d.year >= startYear && d.year <= endYear);
  }, [censusData, startYear, endYear]);

  const kpiData = useMemo(() => {
    if (filteredHistoricalData.length < 2) return { studentVar: 0, staffVar: 0 };
    const first = filteredHistoricalData[0];
    const last = filteredHistoricalData[filteredHistoricalData.length - 1];
    
    const firstStudents = first.students || 1;
    const firstStaff = first.staff || 1;
    return {
      studentVar: ((last.students - first.students) / firstStudents) * 100,
      staffVar: ((last.staff - first.staff) / firstStaff) * 100
    };
  }, [filteredHistoricalData]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Users /></div>
          <div>
            <p className="text-sm text-gray-500">Variação Matrículas</p>
            <p className={`text-2xl font-bold ${kpiData.studentVar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpiData.studentVar.toFixed(1)}%
            </p>
          </div>
        </Card>
        <Card className="p-6 flex items-center gap-4">
          <div className="p-3 bg-green-100 rounded-full text-green-600"><Briefcase /></div>
          <div>
            <p className="text-sm text-gray-500">Variação Contratações</p>
            <p className={`text-2xl font-bold ${kpiData.staffVar >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpiData.staffVar.toFixed(1)}%
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold mb-4">Total por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Docentes" fill="#8884d8" />
              <Bar dataKey="CTA" fill="#82ca9d" />
              <Bar dataKey="Alunos" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4">Distribuição por Faixa Etária (Alunos)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={ageData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                {ageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Crescimento Histórico (Matrículas e Contratações)</h3>
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium">De:</label>
              <input type="number" value={startYear} onChange={e => setStartYear(Number(e.target.value))} className="w-20 p-1 border rounded" />
              <label className="text-sm font-medium">Até:</label>
              <input type="number" value={endYear} onChange={e => setEndYear(Number(e.target.value))} className="w-20 p-1 border rounded" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={filteredHistoricalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="students" name="Matrículas" stroke="#8884d8" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="staff" name="Contratações" stroke="#82ca9d" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
