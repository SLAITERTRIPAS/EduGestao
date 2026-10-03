import React, { useState } from 'react';
import { useStore } from '../store';
import { Button, Card } from './ui';
import {
  Server,
  Key,
  Mail,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Terminal,
  Save,
  Send,
  Eye,
  EyeOff,
  Radio,
  Lock,
  Globe,
  Check
} from 'lucide-react';

interface SmtpConfigManagerProps {
  onOpenModal?: () => void;
}

export function SmtpConfigManager({ onOpenModal }: SmtpConfigManagerProps) {
  const { smtpSettings, updateSmtpSettings, testSmtpConnection, sendEmailNotification, users, classes, emailNotifications } = useStore();

  const [formState, setFormState] = useState({ ...smtpSettings });
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; log: string[] } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [bulkSendSuccess, setBulkSendSuccess] = useState<string | null>(null);
  const [isBulkSending, setIsBulkSending] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSmtpSettings(formState);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  const handleRunConnectionTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // Update store first so test uses latest inputs
      updateSmtpSettings(formState);
      const res = await testSmtpConnection();
      setTestResult(res);
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Falha de comunicação com o servidor SMTP. Verifique as credenciais e o host.',
        log: ['[ERROR] Falha ao estabelecer socket TCP.', '[ERROR] Connection timed out.']
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestBulkDispatch = () => {
    setIsBulkSending(true);
    setBulkSendSuccess(null);

    const teachers = users.filter(u => u.role === 'teacher');
    if (teachers.length === 0) {
      setBulkSendSuccess('Nenhum docente cadastrado no sistema para receber o teste.');
      setIsBulkSending(false);
      return;
    }

    setTimeout(() => {
      let count = 0;
      teachers.forEach(t => {
        sendEmailNotification({
          teacherEmail: t.email,
          teacherName: t.name,
          subject: `[MINEDH/SMTP] Teste de Disparo de Fechamento Trimestral`,
          message: `Prezado(a) Professor(a) ${t.name},\n\nEste é um e-mail de teste disparado via Servidor SMTP (${formState.host}:${formState.port}) pelo Administrador Geral.\n\nO sistema está configurado e pronto para o envio automático de alertas quando as cadernetas forem trancadas após o fechamento trimestral.\n\nAtentamente,\nDirecção de Tecnologias / MINEDH`,
          className: 'Todas as Turmas (Teste Geral)'
        });
        count++;
      });

      setIsBulkSending(false);
      setBulkSendSuccess(`Disparo de teste SMTP enviado com sucesso para ${count} docente(s)! Check o histórico de alertas.`);
      setTimeout(() => setBulkSendSuccess(null), 5000);
    }, 800);
  };

  const teachersCount = users.filter(u => u.role === 'teacher').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-2xl shrink-0 mt-0.5">
              <Server className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400 bg-blue-950 px-2.5 py-0.5 rounded-md border border-blue-800">
                  Módulo de Infraestrutura & Notificações
                </span>
                {formState.isActive ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Servidor SMTP Ativo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-red-500/20 text-red-300 border border-red-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    Servidor SMTP Inativo
                  </span>
                )}
                {onOpenModal && (
                  <button
                    type="button"
                    onClick={onOpenModal}
                    className="ml-auto text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow"
                  >
                    <Server size={13} /> Configurar via Modal
                  </button>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-100 mt-2">
                Configuração do Servidor SMTP & Disparo Automático às Cadernetas
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
                Configure os parâmetros de saída de e-mail institucional do MINEDH. Quando o fechamento trimestral das cadernetas é executado pela Secção Pedagógica ou Directores, o sistema utiliza este servidor para alertar automaticamente os docentes sobre o trancamento das pautas e arquivo histórico.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap lg:flex-nowrap gap-3 shrink-0">
            <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl min-w-[130px]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Endereço Host</span>
              <span className="text-xs font-mono font-bold text-blue-300 block truncate">{formState.host}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl min-w-[100px]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Porta & Seg.</span>
              <span className="text-xs font-bold text-emerald-400 block">{formState.port} • {formState.encryption}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl min-w-[120px]">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Disparo Auto.</span>
              <span className={`text-xs font-bold block ${formState.autoSendOnTrimesterClose ? 'text-emerald-400' : 'text-amber-400'}`}>
                {formState.autoSendOnTrimesterClose ? 'Ativado' : 'Desativado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>As configurações do Servidor SMTP foram salvas com sucesso e estão ativas no sistema!</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-normal">Armazenado no estado do sistema</span>
        </div>
      )}

      {bulkSendSuccess && (
        <div className="bg-blue-50 border-2 border-blue-300 text-blue-900 p-4 rounded-xl text-xs font-bold flex items-center gap-3 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
          <span>{bulkSendSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-900" />
                  <h4 className="font-bold text-slate-900 text-base">Parâmetros de Conexão SMTP</h4>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-700 cursor-pointer">Status do Servidor:</label>
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
              </div>

              {/* Grid of Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Servidor SMTP Host: <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: smtp.minedh.gov.mz"
                      value={formState.host}
                      onChange={e => handleInputChange('host', e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 font-semibold"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Endereço IP ou hostname do servidor de e-mail</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Porta de Saída (Port): <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="587, 465 ou 25"
                    value={formState.port}
                    onChange={e => handleInputChange('port', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Comum: 587 (TLS/STARTTLS) ou 465 (SSL)</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Protocolo de Criptografia / Segurança:
                  </label>
                  <select
                    value={formState.encryption}
                    onChange={e => handleInputChange('encryption', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                  >
                    <option value="TLS">TLS / STARTTLS (Recomendado)</option>
                    <option value="SSL">SSL Direct (Porta 465)</option>
                    <option value="NONE">Nenhum (Ligação Não Encriptada)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Usuário de Autenticação / Login: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="utilizador@minedh.gov.mz"
                    value={formState.username}
                    onChange={e => handleInputChange('username', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Senha / App Secret Token:
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

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    E-mail do Remetente (From Address): <span className="text-red-500">*</span>
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

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nome Exibido do Remetente (Sender Display Name):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MINEDH - Gestão Escolar"
                    value={formState.senderName}
                    onChange={e => handleInputChange('senderName', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    E-mail de Resposta (Reply-To):
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

              {/* Automation Toggles */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-500" /> Automatização de Fechamento Trimestral
                </h5>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Disparo Automático no Fechamento das Cadernetas
                    </span>
                    <span className="text-slate-500 text-[11px] block">
                      Quando a Secção Pedagógica tranca uma turma ou fecha o trimestre, envia automaticamente e-mail a cada docente alocado com o resumo.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange('autoSendOnTrimesterClose', !formState.autoSendOnTrimesterClose)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
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

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  onClick={handleRunConnectionTest}
                  disabled={isTesting}
                  variant="outline"
                  className="w-full sm:w-auto text-xs gap-2 border-slate-300 text-slate-800 hover:bg-slate-100 font-bold py-2.5"
                >
                  {isTesting ? <RefreshCw className="animate-spin h-4 w-4 text-blue-600" /> : <Terminal className="h-4 w-4 text-slate-600" />}
                  {isTesting ? 'A Testar Conexão SMTP...' : 'Testar Conexão com Servidor'}
                </Button>

                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-sm text-xs"
                >
                  <Save size={16} /> Salvar Configurações SMTP
                </Button>
              </div>
            </form>
          </Card>

          {/* Terminal Test Log Output */}
          {testResult && (
            <Card className="p-5 bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-md space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Terminal size={16} className="text-blue-400" />
                  <span className="font-bold text-slate-200">Log de Diagnóstico da Conexão SMTP</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${testResult.success ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-red-950 text-red-300 border border-red-800'}`}>
                  {testResult.success ? '250 OK - LIGAÇÃO SUCESSO' : 'FALHA DE CONEXÃO'}
                </span>
              </div>

              <div className="space-y-1 bg-black/60 p-3 rounded-lg max-h-48 overflow-y-auto text-[11px] text-slate-300 border border-slate-800/80">
                {testResult.log.map((line, idx) => (
                  <div key={idx} className={line.includes('250') || line.includes('235') ? 'text-emerald-400 font-bold' : line.includes('ERROR') ? 'text-red-400 font-bold' : 'text-slate-300'}>
                    {line}
                  </div>
                ))}
              </div>

              <p className={`text-xs font-semibold ${testResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                {testResult.message}
              </p>
            </Card>
          )}
        </div>

        {/* Sidebar Info & Test Trigger */}
        <div className="space-y-6">
          {/* Status & Automated Rules Card */}
          <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
            <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> Regras de Disparo Automático
            </h4>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                <span className="font-bold text-blue-900 block">1. Fechamento do Trimestre na Turma</span>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Quando o relatório de trimestre é submetido ou as notas da turma são trancadas via <strong>Gestão Académica</strong>, o servidor SMTP dispara imediatamente uma cópia com a homologação aos e-mails institucionais dos docentes.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <span className="font-bold text-emerald-900 block">2. Arquivo Histórico Institucional</span>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Ao gerar a cópia histórica da pauta final para a Secção Pedagógica, cada professor recebe um comprovativo por e-mail com a indicação de notas trancadas.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="font-bold text-slate-800 block">3. Registo de Auditoria</span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Todas as notificações disparadas são armazenadas na tabela do sistema com data, hora, assunto, e-mail de destino e status de entrega SMTP.
                </p>
              </div>
            </div>

            {/* Test Bulk Trigger Button */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 block mb-1">Testar Envio em Lote para Docentes:</span>
              <p className="text-[11px] text-slate-500 mb-3">
                Dispara uma mensagem de teste para todos os {teachersCount} docentes cadastrados na base de dados para confirmar o fluxo SMTP.
              </p>

              <Button
                type="button"
                onClick={handleTestBulkDispatch}
                disabled={isBulkSending || !formState.isActive}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                {isBulkSending ? <RefreshCw className="animate-spin h-4 w-4" /> : <Send size={15} className="text-blue-400" />}
                {isBulkSending ? 'A Disparar E-mails...' : `Enviar Teste para ${teachersCount} Docente(s)`}
              </Button>
            </div>
          </Card>

          {/* Last Dispatches Log Summary */}
          <Card className="p-6 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                Histórico Recente SMTP
              </h4>
              <span className="text-[10px] bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-bold">
                {emailNotifications.length} disparos
              </span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto text-xs">
              {emailNotifications.slice(0, 5).map(n => (
                <div key={n.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                    <span>{new Date(n.sentAt).toLocaleTimeString('pt-PT')}</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check size={10} /> {n.status}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-xs truncate">{n.teacherName} ({n.teacherEmail})</p>
                  <p className="text-[11px] text-slate-600 truncate">{n.subject}</p>
                </div>
              ))}

              {emailNotifications.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">
                  Nenhum e-mail disparado pelo servidor SMTP até ao momento.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
