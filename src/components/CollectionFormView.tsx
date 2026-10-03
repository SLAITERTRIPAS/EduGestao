import React, { useState } from 'react';
import { FileText, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store';
import { CollectionPeriod, CollectionForm } from '../types';
import { motion } from 'motion/react';

interface Props {
  period: CollectionPeriod;
  onSuccess?: () => void;
}

export const CollectionFormView: React.FC<Props> = ({ period, onSuccess }) => {
  const { currentUser, submitCollectionForm, collectionForms } = useStore();
  const [formData, setFormData] = useState({
    totalStudents: '',
    totalTeachers: '',
    approvedStudents: '',
    reprovedStudents: '',
    observations: ''
  });

  if (!currentUser) return null;

  const existingForm = collectionForms.find(f => f.periodId === period.id && f.responderLevelId === (currentUser.schoolId || currentUser.districtId || currentUser.provinceId));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    submitCollectionForm({
      periodId: period.id,
      responderId: currentUser.id,
      responderRole: currentUser.role,
      responderLevelId: (currentUser.schoolId || currentUser.districtId || currentUser.provinceId) || '',
      data: formData,
      status: 'submitted'
    });

    if (onSuccess) onSuccess();
  };

  if (existingForm) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-emerald-800 font-bold text-lg">Dados Submetidos com Sucesso</h3>
        <p className="text-emerald-600 text-sm mt-2">
          Os dados para o período <strong>{period.title}</strong> foram enviados em {new Date(existingForm.submittedAt!).toLocaleDateString('pt-MZ')}.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-6 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-bold text-slate-800">{period.title}</h3>
            <p className="text-xs text-slate-500">Prazo: {new Date(period.endDate).toLocaleDateString('pt-MZ')}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Efetivo Escolar</h4>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Total de Alunos Matriculados</label>
              <input 
                required
                type="number"
                value={formData.totalStudents}
                onChange={e => setFormData(prev => ({ ...prev, totalStudents: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Total de Professores no Ativo</label>
              <input 
                required
                type="number"
                value={formData.totalTeachers}
                onChange={e => setFormData(prev => ({ ...prev, totalTeachers: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aproveitamento Semestral</h4>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">N.º Alunos Aprovados</label>
              <input 
                required
                type="number"
                value={formData.approvedStudents}
                onChange={e => setFormData(prev => ({ ...prev, approvedStudents: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">N.º Alunos Reprovados</label>
              <input 
                required
                type="number"
                value={formData.reprovedStudents}
                onChange={e => setFormData(prev => ({ ...prev, reprovedStudents: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Observações Adicionais</label>
          <textarea 
            rows={3}
            value={formData.observations}
            onChange={e => setFormData(prev => ({ ...prev, observations: e.target.value }))}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
            placeholder="Relate constrangimentos ou notas importantes..."
          />
        </div>

        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>Ao submeter, os dados serão validados pela Direção Distrital e Provincial antes de serem integrados na estatística nacional.</p>
        </div>

        <button 
          type="submit"
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          Submeter Dados Estatísticos
        </button>
      </form>
    </div>
  );
};
