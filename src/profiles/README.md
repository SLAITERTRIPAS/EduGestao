# 📁 Estrutura do Sistema Organizada por Perfis e Funcionalidades (SIGE - MINEDH)

Esta pasta (`src/profiles/`) contém a organização modular do código-fonte do **SIGE (Sistema Integrado de Gestão Escolar)**, estruturada por **Perfis de Utilizador** e subdividida pelas suas respectivas **Funcionalidades Oficiais**.

---

## 🏛️ Mapa de Perfis e Módulos Funcionais

### 1. `admin/` - Administrador Geral do Sistema (TI & Infraestrutura)
* **Finalidade:** Gestão global do sistema, infraestrutura e integridade dos dados.
* **Restrição Oficial:** **Sem acesso** ao Módulo de Assinatura Digital de Documentos Escolares.
* **Funcionalidades:**
  * 🩺 **Saúde do Sistema:** Monitoramento de latência, integridade Firestore e tráfego.
  * 👥 **Gestão de Utilizadores & Credenciais:** Criação de utilizadores, redefinição de senhas e auditoria.
  * 📧 **Configuração SMTP:** Servidores de email para envio de notificações automáticas.
  * 🏫 **Gestão de Escolas:** Cadastro institucional, códigos IUE, níveis de ensino e logótipos.
  * 💾 **Backups Firestore:** Exportação e restauração segura da base de dados.
  * 🛡️ **Logs de Auditoria & Permissões:** Trilha de auditoria e controlo granular de acesso.

---

### 2. `director/` - Direcção da Escola
* **Finalidade:** Gestão executiva, liderança institucional e relatórios oficiais.
* **Funcionalidades:**
  * 📊 **Visão Geral Executiva:** Indicadores-chave, pirâmide etária, taxas de aprovação e assiduidade.
  * 📜 **Relatórios Oficiais da Direcção:** Geração de termos de abertura, fecho e relatórios de desempenho.
  * 🖋️ **Assinatura Digital da Direcção:** Assinatura qualificada com carimbo institucional.
  * 🔄 **Renovações & Vagas:** Gestão automatizada do fluxo de renovação de matrículas.
  * 🖼️ **Identidade Visual Escolar:** Gestão do logótipo institucional e emblema da República.
  * 🔐 **Controlo de Acesso Granular:** Atribuição de permissões operacionais internas.

---

### 3. `pedagogical/` - Direcção Adjunta Pedagógica (1º Ciclo, 2º Ciclo ESG1 e ESG2)
* **Finalidade:** Coordenação académica, pautas oficiais, matriz curricular e calendário letivo.
* **Funcionalidades:**
  * 📑 **Pautas Oficiais:** Pautas de Frequência, Trimestrais, Exame Geral e Finais de Aproveitamento.
  * ⚙️ **Painel de Controlo de Pautas:** Parâmetros de arredondamento, fórmulas de média e trancamento de notas.
  * 🖨️ **Configurador de Impressão de Pautas:** Formatação A3/A4 em formato oficial do MINEDH.
  * 📚 **Gestão Curricular & Turmas:** Matriz de disciplinas, planos de estudo e distribuição de turmas.
  * 📅 **Calendário Académico & Avaliações:** Planeamento de ACS, APT, exames e conselhos de notas.
  * ✅ **Visto Pedagógico Oficial:** Validação e homologação digital dos resultados escolares.

---

### 4. `secretariat/` - Secretaria Escolar & Técnicos Administrativos
* **Finalidade:** Matrículas, gestão documental, corpo discente, colaboradores e emissão de certificados.
* **Funcionalidades:**
  * 📝 **Matrículas & Inscrições:** Inscrição de alunos novos, confirmações e atribuição de turmas.
  * 🎓 **Gestão do Corpo Discente:** Fichas cadastrais completas, dados biográficos e encarregados.
  * 👔 **Gestão de Funcionários & CTA:** Cadastro do corpo docente e pessoal de apoio (CTA).
  * 📄 **Emissão de Documentos Oficiais:**
    * *Processo Individual do Aluno* (Histórico completo)
    * *Processo Individual do Funcionário*
    * *Certificado de Habilitações Literárias* (com QR Code de autenticidade)
    * *Declarações com e sem Notas*
    * *Atestado Médico Escolar*
    * *Guia de Transferência Oficial*
    * *Recibo Oficial de Matrícula*
  * 📢 **Difusão de Circulares & Avisos:** Publicação de avisos gerais e comunicados da secretaria.

---

### 5. `financial/` - Gestão Financeira & Tesouraria Escolar
* **Finalidade:** Arrecadação de receitas, gestão de propinas, despesas e balancetes.
* **Funcionalidades:**
  * 💳 **Controlo de Propinas & Mensalidades:** Mapa de pagamentos, devedores e cobranças.
  * 🏷️ **Emolumentos & Taxas de Secretaria:** Cobrança de certificados, declarações e exames.
  * 💵 **Caixa Diário & Tesouraria:** Registo de entradas e saídas em tempo real.
  * 📦 **Fundo de Maneio & Despesas:** Controlo de despesas operacionais da escola.
  * 📈 **Balancetes & Prestação de Contas:** Relatórios financeiros padronizados para o MINEDH/SDEJT.

---

### 6. `governance/` - Governação da Educação (MINEDH, DPE, SDEJT)
* **Finalidade:** Monitoria estatística em 6 níveis hierárquicos e planeamento nacional.
* **Funcionalidades:**
  * 🌐 **Fluxo Estatístico Hierárquico:** Nacional ➔ Provincial ➔ Distrital ➔ Zonal ➔ Escolar ➔ Turma.
  * 🏢 **Diretório Nacional de Escolas:** Consulta cadastral georreferenciada de todas as instituições.
  * 🗺️ **Gestão Territorial (Províncias & Distritos):** Parâmetros geográficos de Moçambique.
  * 👥 **Alocação de Recursos Humanos:** Distribuição de professores e gestores por distrito/escola.
  * 📊 **Módulo de Relatórios Estatísticos Consolidados:** Censo escolar e indicadores de aproveitamento.

---

### 7. `teacher/` - Corpo Docente / Professores
* **Finalidade:** Gestão de turmas lecionadas, lançamento de avaliações, faltas e sumários.
* **Funcionalidades:**
  * 📝 **Caderneta de Notas:** Lançamento de ACS (Avaliações Contínuas) e APT (Avaliações Periódicas).
  * 📋 **Livro de Sumários & Presenças:** Registo de conteúdos lecionados e controlo de assiduidade.
  * 📌 **Gestão de Tarefas & TPC:** Atribuição de trabalhos com prazos e anexos.
  * 📊 **Relatórios de Desempenho da Turma:** Análise gráfica de médias por disciplina e período.
  * ✍️ **Assinatura Digital do Docente:** Validação digital das cadernetas e pautas trimestrais.

---

### 8. `student/` - Corpo Discente / Alunos
* **Finalidade:** Consulta de notas, acompanhamento letivo e serviços escolares digitais.
* **Funcionalidades:**
  * 📈 **Boletim de Notas Online:** Visualização de notas parciais, médias trimestrais e anuais.
  * 📱 **Cartão Digital & QR Code do Estudante:** Identidade escolar verificável por telemóvel.
  * 📥 **Trabalhos de Casa (TPC):** Download de enunciados e submissão digital.
  * 📩 **Reclamações & Pedidos de Revisão:** Submissão formal de dúvidas de avaliação.
  * ✈️ **Solicitação de Transferência:** Requerimento digital de transferência escolar.

---

### 9. `guardian/` - Encarregados de Educação
* **Finalidade:** Acompanhamento parental do percurso escolar dos educandos.
* **Funcionalidades:**
  * 👨‍👩‍👧 **Painel do Educando:** Visão integrada do aproveitamento de cada filho/educando.
  * 📊 **Relatório de Faltas & Comportamento:** Notificações em tempo real sobre assiduidade.
  * 💰 **Situação Financeira & Propinas:** Consulta de recibos e saldo de mensalidades.
  * 💬 **Canal Direto com a Direcção de Turma:** Mensagens e agendamento de reuniões.
