import { ProfileManifest } from '../admin/profileManifest';

export const FINANCIAL_PROFILE_MANIFEST: ProfileManifest = {
  profileId: 'financial',
  name: 'Gestão Financeira & Tesouraria Escolar',
  category: 'Finanças, Contabilidade & Tesouraria',
  description: 'Controlo de propinas, taxas de secretaria, fundo de maneio, despesas operacionais e prestação de contas.',
  canSignOfficialDocuments: true,
  features: [
    {
      id: 'tuition',
      name: 'Controlo de Propinas & Mensalidades',
      path: '/financial/tuition',
      icon: 'CreditCard',
      description: 'Gestão dos pagamentos mensais por aluno e turma com relatórios de devedores.'
    },
    {
      id: 'cashflow',
      name: 'Caixa Diário & Tesouraria',
      path: '/financial/cashflow',
      icon: 'Wallet',
      description: 'Registo e reconciliação diária de entradas em dinheiro, POS e transferências bancárias.'
    },
    {
      id: 'expenses',
      name: 'Despesas & Fundo de Maneio',
      path: '/financial/expenses',
      icon: 'TrendingDown',
      description: 'Autorização e registo de despesas operacionais com comprovativos anexados.'
    },
    {
      id: 'balanceSheet',
      name: 'Balancete Financeiro Oficial',
      path: '/financial/balance',
      icon: 'PieChart',
      description: 'Balancete trimestral e anual para prestação de contas aos órgãos de tutela.'
    }
  ]
};
