import React, { useState } from 'react';
import { useStore } from '../store';
import { Button } from './ui';
import {
  Server,
  Globe,
  Key,
  Mail,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Terminal,
  Save,
  Eye,
  EyeOff,
  X,
  RefreshCw,
  Send
} from 'lucide-react';

interface SmtpConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SmtpConfigModal({ isOpen, onClose }: SmtpConfigModalProps) {
  const { smtpSettings, updateSmtpSettings, testSmtpConnection, sendEmailNotification, users } = useStore();

  const [formState, setFormState] = useState({ ...smtpSettings });
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; log: string[] } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSmtpSettings(formState);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1500);
  };

  const handleRunConnectionTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      updateSmtpSettings(formState);
      const res = await testSmtpConnection();
      setTestResult(res);
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Erro ao conectar com o servidor SMTP.',
        log: ['[ERROR] Falha TCP Handshake.', '[ERROR] Timeout na conexão.']
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60  animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-500/40 text-blue-400 rounded-xl">
              <Server size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-100 flex items-center gap-2">
                Configurações do Servidor SMTP
                {formState.isActive ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    Ativo
                  </span>
                ) : (
                  <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                    Inativo
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Disparo automático de notificações de fecho trimestral e alertas do sistema.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content / Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>Configurações SMTP salvas com sucesso no sistema!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Host */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Servidor Host (SMTP): <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="smtp.minedh.gov.mz"
                  value={formState.host}
                  onChange={e => handleInputChange('host', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>
            </div>

            {/* Porta */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Porta (Port): <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                placeholder="587 ou 465"
                value={formState.port}
                onChange={e => handleInputChange('port', Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            {/* Criptografia */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Segurança / Criptografia:
              </label>
              <select
                value={formState.encryption}
                onChange={e => handleInputChange('encryption', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
              >
                <option value="TLS">TLS / STARTTLS (Recomendado - Porta 587)</option>
                <option value="SSL">SSL Direct (Porta 465)</option>
                <option value="NONE">Sem Criptografia</option>
              </select>
            </div>

            {/* Usuário */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Usuário / Login: <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="notificacoes@minedh.gov.mz"
                value={formState.username}
                onChange={e => handleInputChange('username', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Senha / Token SMTP:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={formState.password || ''}
                  onChange={e => handleInputChange('password', e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* E-mail do Remetente */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                E-mail do Remetente (From): <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="notificacoes@minedh.gov.mz"
                  value={formState.senderEmail}
                  onChange={e => handleInputChange('senderEmail', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Nome Exibido & Reply-To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nome do Remetente:
              </label>
              <input
                type="text"
                required
                placeholder="MINEDH - Gestão de Cadernetas"
                value={formState.senderName}
                onChange={e => handleInputChange('senderName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                E-mail para Resposta (Reply-To):
              </label>
              <input
                type="email"
                placeholder="suporte.pedagogico@minedh.gov.mz"
                value={formState.replyTo || ''}
                onChange={e => handleInputChange('replyTo', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs font-semibold"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Ativar Servidor SMTP</span>
                <span className="text-slate-500 text-[11px]">Habilita o disparo de e-mails em todo o sistema.</span>
              </div>
              <button
                type="button"
                onClick={() => handleInputChange('isActive', !formState.isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formState.isActive ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formState.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block">Disparo Automático no Fechamento Trimestral</span>
                <span className="text-slate-500 text-[11px]">Envia e-mail automático aos docentes quando as cadernetas são trancadas.</span>
              </div>
              <button
                type="button"
                onClick={() => handleInputChange('autoSendOnTrimesterClose', !formState.autoSendOnTrimesterClose)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formState.autoSendOnTrimesterClose ? 'bg-blue-900' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formState.autoSendOnTrimesterClose ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Diagnostic Log Output */}
          {testResult && (
            <div className="p-4 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-blue-400 flex items-center gap-2">
                  <Terminal size={14} /> Log Handshake SMTP
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${testResult.success ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'}`}>
                  {testResult.success ? '250 OK' : 'ERRO'}
                </span>
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto text-[11px] text-slate-300">
                {testResult.log.map((line, idx) => (
                  <div key={idx} className={line.includes('250') || line.includes('235') ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <Button
              type="button"
              onClick={handleRunConnectionTest}
              disabled={isTesting}
              variant="outline"
              className="w-full sm:w-auto text-xs font-bold gap-2 py-2.5 border-slate-300"
            >
              {isTesting ? <RefreshCw className="animate-spin h-4 w-4 text-blue-600" /> : <Terminal size={15} />}
              {isTesting ? 'A Testar Conexão...' : 'Testar Conexão SMTP'}
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="text-xs font-bold py-2.5 px-4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 text-xs shadow-sm"
              >
                <Save size={15} /> Salvar Configurações
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
