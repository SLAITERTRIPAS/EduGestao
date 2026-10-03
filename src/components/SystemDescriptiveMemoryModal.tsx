import React, { useState } from 'react';
import { BookOpen, Printer, X, Layers } from 'lucide-react';
import { printDocument } from '../utils/printHelper';
import { ReportLayout, Chapter } from './ReportLayout';

interface SystemDescriptiveMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemDescriptiveMemoryModal: React.FC<SystemDescriptiveMemoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrintMemory = () => {
    printDocument('memoria-descritiva-print-area');
  };

  const docChapters: Chapter[] = [
    {
      num: 1,
      title: "Enquadramento Geral e Objetivos do EduGestão",
      subtitle: "Contexto Tecnológico, SNE Moçambique e Regulamentos MINEDH",
      content: (
        <>
          <p className="text-justify leading-loose">
            A modernização e digitalização dos fluxos administrativos e pedagógicos nas instituições de ensino constituem um pilar estratégico da Estratégia de Governação Eletrónica da República de Moçambique. O sistema <strong>EduGestão</strong> surge como uma resposta direta a este desafio, tendo sido meticulosamente desenhado para servir as escolas secundárias, gerais e técnicas profissionais de todo o país. O seu propósito primordial é garantir total conformidade com as diretrizes curriculares do <strong>Sistema Nacional de Educação (SNE)</strong> e os regulamentos de avaliação emanados pelo <strong>Ministério da Educação e Desenvolvimento Humano (MINEDH)</strong>.
          </p>
          <p className="text-justify leading-loose">
            Historicamente, o acompanhamento do percurso escolar em Moçambique tem sido afetado por vulnerabilidades inerentes ao suporte analógico (papel). Entre estas, destacam-se os elevados tempos de processamento para a emissão de certidões, o risco constante de extravio ou degradação física dos livros de pautas e cadernetas de notas, e eventuais erros aritméticos humanos no cálculo e arredondamento das médias trimestrais e anuais. O EduGestão erradica estas falhas de forma definitiva através da automação algorítmica e da descentralização segura dos registos.
          </p>
          <p className="text-justify leading-loose">
            Os principais objetivos do sistema consistem em estabelecer uma plataforma reativa capaz de processar matrículas e enturmações de forma automatizada, lançar notas contínuas de forma horizontal com salvamento instantâneo, e calcular as progressões de classe de acordo com as fórmulas oficiais moçambicanas de transição escolar. Além disso, o sistema agiliza o fluxo de transferência de estudantes entre diferentes escolas de diferentes províncias, reduzindo um processo que outrora demorava semanas para uma operação digital instantânea e segura.
          </p>
          <p className="text-justify leading-loose">
            Desta forma, o EduGestão funciona como um canal dinâmico e fidedigno de comunicação entre os diversos agentes da comunidade educativa: o MINEDH, as Direções Provinciais de Educação (DPE), os Serviços Distritais de Educação, Juventude e Tecnologia (SDEJT), as Direções Escolares, as Direções Adjuntas Pedagógicas (DAP), o corpo docente, o corpo discente e os encarregados de educação, elevando a transparência pública e a eficiência operacional a níveis de excelência internacional.
          </p>
        </>
      )
    },
    {
      num: 2,
      title: "Arquitetura Tecnológica e Modelo de Nuvem",
      subtitle: "Stack Frontend, Sincronização Cloud Firestore NoSQL e Resiliência",
      content: (
        <>
          <p className="text-justify leading-loose">
            A engenharia de software subjacente ao ecossistema EduGestão assenta numa arquitetura de nuvem moderna e robusta, projetada para assegurar máxima reatividade e disponibilidade contínua dos serviços. A camada do cliente (frontend) é desenvolvida utilizando <strong>React 18</strong> em conjunto com o superset <strong>TypeScript</strong>, garantindo tipagem estática e detecção precoce de inconsistências lógicas em tempo de compilação, o que resulta num código livre de erros comuns de propriedade no ambiente de produção.
          </p>
          <p className="text-justify leading-loose">
            No nível de persistência de dados, a plataforma utiliza o **Google Cloud Firestore**, um banco de dados NoSQL altamente escalável. O grande diferencial desta escolha arquitetural reside no modelo de comunicação baseado em WebSocket ativado pelo SDK do Firestore via subscrições dinâmicas <code>onSnapshot()</code>. Ao contrário das requisições tradicionais HTTP do tipo REST (que dependem de atualizações manuais do utilizador), o Firestore estabelece uma conexão bidirecional ativa que replica qualquer alteração na base de dados de forma sub-segundo para todos os dispositivos conectados.
          </p>
          <p className="text-justify leading-loose">
            Para acomodar as realidades da infraestrutura de telecomunicações em Moçambique — frequentemente caracterizada por flutuações de sinal e limitações de largura de banda nos distritos mais remotos —, o EduGestão integra mecanismos avançados de **sincronização offline**. Através da ativação de persistência em cache local (LocalStorage e IndexedDB), o utilizador pode continuar a lançar notas, preencher sumários ou registar assiduidade mesmo sem internet. Assim que a conectividade é restabelecida, o sistema reconcilia os dados pendentes de forma assíncrona, resolvendo conflitos de escrita de forma transparente.
          </p>
          <p className="text-justify leading-loose">
            Além disso, os pacotes de dados transmitidos pelo WebSocket são otimizados de forma compacta, reduzindo drasticamente o consumo de dados móveis do corpo docente. A interface é renderizada de forma estática com Tailwind CSS de alta performance, eliminando blurs de renderização e garantindo uma experiência fluida com tempos de resposta inferiores a 120ms para qualquer micro-interação, inclusive em dispositivos móveis e computadores de baixa especificação técnica.
          </p>
        </>
      )
    },
    {
      num: 3,
      title: "Especificação do Portal do Estudante",
      subtitle: "As 6 Opções Obrigatórias de Navegação e Cartão de Identificação Ampliado",
      content: (
        <>
          <p className="text-justify leading-loose">
            Em estrito cumprimento das diretrizes de inclusão digital e transparência de dados do MINEDH, o **Portal do Estudante** foi estruturado em torno de uma experiência de utilizador limpa e intuitiva, organizada especificamente em seis abas obrigatórias de navegação interativa e reativa:
          </p>
          <ul className="list-decimal pl-6 space-y-3 text-[11px] leading-relaxed">
            <li>
              <strong>1. Consultar o Meu Resultado:</strong> Exibição cronológica e estruturada de avaliações contínuas (ACS1, ACS2, ACS3) e de fim de trimestre (APT). O painel realiza o cálculo automático das médias e apresenta alertas de desempenho em tempo real, permitindo a exportação do Histórico Académico Oficial em formato PDF A4 com carimbo de verificação eletrónica.
            </li>
            <li>
              <strong>2. Atividades da Turma:</strong> Listagem interativa de lições de casa, sumários de apoio e avaliações formativas publicadas pelos docentes. Os alunos podem realizar a submissão direta das suas respostas por escrito ou por anexo nos formatos PDF e imagem, acompanhando a correção, notas e comentários dirigidos de forma imediata.
            </li>
            <li>
              <strong>3. Mensagens:</strong> Canal interno seguro de correspondência escolar. Permite o contacto direto com o Diretor de Turma, professores das disciplinas e funcionários administrativos da secretaria, promovendo a resolução célere de dúvidas e o agendamento de atendimentos pedagógicos.
            </li>
            <li>
              <strong>4. Relatórios:</strong> Apresentação de dashboards analíticos com a percentagem de presenças nas aulas, mapas detalhados de faltas justificadas e injustificadas, e gráficos de radar que mapeiam o progresso cognitivo e comportamental do aluno ao longo do ano letivo corrente.
            </li>
            <li>
              <strong>5. Reclamação:</strong> Sistema formal para contestação de notas, erros de transcrição de avaliações ou requisição de revisão de provas. Cada reclamação submetida gera um código de rastreamento único de acompanhamento que transita pelos estados "Pendente", "Em Análise", "Deferida" ou "Indeferida".
            </li>
            <li>
              <strong>6. Pedido de Transferência:</strong> Formulário automatizado para solicitação de mudança de turma, curso ou escola. O preenchimento dos dados gera instantaneamente uma minuta oficial de transferência parametrizada de acordo com as normas da secretaria da escola de destino.
            </li>
          </ul>
          <p className="text-justify leading-loose mt-4">
            Como elemento central de identificação e validação da cidadania escolar, o portal destaca o **Cartão do Estudante Digital**. Este exibe de forma proeminente a foto do aluno, o seu Nome Completo, o Número de Identificação de Matrícula (NIM) e o Identificador Único do Estudante (IUE) de 12 dígitos. Ao clicar sobre o QR Code integrado no cartão, ativa-se um modal de ampliação em alta definição, permitindo que fiscais ou inspetores da Direção Pedagógica confirmem a regularidade do aluno em exames de forma instantânea através do cruzamento de dados civis e académicos na nuvem.
          </p>
        </>
      )
    },
    {
      num: 4,
      title: "Especificação do Portal do Docente",
      subtitle: "Caderneta Pedagógica, Arredondamentos, Sumários e Correção de Tarefas",
      content: (
        <>
          <p className="text-justify leading-loose">
            O **Portal do Docente** constitui a principal ferramenta de intervenção pedagógica e controlo de notas da escola. A sua arquitetura foi desenhada para aliviar a sobrecarga de trabalho administrativo dos professores, convertendo tarefas repetitivas em processos digitais simplificados e integrados à base de dados.
          </p>
          <p className="text-justify leading-loose">
            A **Caderneta Digital Reativa** opera por meio de uma matriz bidimensional de alta densidade onde os docentes lançam notas de ACS (Avaliação Contínua Sistemática) e APT (Avaliação Parcial Trimestral). O sistema calcula instantaneamente as médias trimestrais parciais utilizando a fórmula regulamentar: <code>MT = (ACS1 + ACS2 + ACS3 + APT) / 4</code>. Nos trimestres e classes com regime de exames nacionais, o sistema executa automaticamente a média de frequência <code>MF</code>, e cruza com a nota do exame escrito <code>NE</code> para determinar a classificação final do aluno através da fórmula oficial do SNE de Moçambique: <code>CF = 40% MF + 60% NE</code>.
          </p>
          <p className="text-justify leading-loose">
            Todas as médias e notas finais sofrem arredondamentos aritméticos automáticos estritos na camada da regra de negócio (por exemplo, médias iguais ou superiores a 9.5 valores são arredondadas para 10 valores, enquanto médias inferiores a 9.5 valores decaem para 9 valores), eliminando qualquer margem para arbitrariedades ou erros manuais que possam prejudicar o percurso do estudante ou originar disputas pedagógicas.
          </p>
          <p className="text-justify leading-loose">
            O portal engloba também o preenchimento digital do **Livro de Sumários**, o controlo de assiduidade em tempo real (lançamento de faltas justificadas e injustificadas com sincronização instantânea com o portal do aluno) e o **Módulo de Gestão de Tarefas**. Neste último, o professor pode redigir orientações de trabalhos práticos, anexar fichas de leitura digitais e receber de volta as submissões dos estudantes, atribuindo avaliações e comentários num ecossistema fechado de feedback reativo e sem consumo desnecessário de papel.
          </p>
        </>
      )
    },
    {
      num: 5,
      title: "Especificação de Portais de Secretaria, Direção e Pautas",
      subtitle: "Secretaria Geral (IUE/NIM, Certidões Modelos 1-4) e Pautas A3/A4 Regulamentares",
      content: (
        <>
          <p className="text-justify leading-loose">
            O controlo governativo e a legalidade das operações institucionais no EduGestão são operacionalizados através de três painéis robustos concebidos especificamente para as funções de liderança e suporte administrativo escolar:
          </p>
          <p className="text-justify leading-loose">
            A **Secretaria Geral** detém o registo biográfico master de todo o corpo discente. É este departamento que insere novos alunos no sistema, validando a documentação civil, gerando o NIM e processando o algoritmo do Identificador Único do Estudante (IUE) de 12 dígitos. A secretaria tem o poder de emitir de forma célere certidões e certidões literárias de habilitações nos Modelos Oficiais de 1 a 4 regulamentados pelo MINEDH, bem como certificados de conclusão de ciclos educativos. Estes documentos são dotados de assinaturas eletrónicas dinâmicas, chancelas automáticas e códigos QR para conferência rápida de dados biográficos diretamente a partir da nuvem.
          </p>
          <p className="text-justify leading-loose">
            A **Direção Escolar e a Direção Adjunta Pedagógica (DAP)** detêm a visão macroestatística da unidade. Através do seu portal, os diretores podem alocar turmas a professores, designar diretores de turma para cada grupo, assinar relatórios comportamentais de colaboradores, publicar avisos e calendários de atividades académicas, e auditar os logs de lançamentos de notas.
          </p>
          <p className="text-justify leading-loose">
            Por fim, o módulo de **Pautas Regulamentares** permite a geração e impressão de Pautas Gerais de Frequência e Exames em formatos físicos padronizados pelo MINEDH (incluindo o layout horizontal alargado A3 e A4 de alta densidade). O sistema processa automaticamente a hierarquização dos resultados das turmas, aplica as regras oficiais de desempate por médias e idade, destaca alunos aprovados em cor esmeralda e reprovados em cor rubi, e gera quebras automáticas de página por número de estudantes, asseverando que a impressão física siga rigorosamente os padrões das inspeções pedagógicas nacionais.
          </p>
        </>
      )
    },
    {
      num: 6,
      title: "Notificações Reativas, 'Abrir Local' e Chancelas Digitais",
      subtitle: "Sinalização Instantânea, Redirecionamento de Interface e Autenticidade QR SHA-256",
      content: (
        <>
          <p className="text-justify leading-loose">
            O dinamismo e a agilidade na troca de informações dentro do EduGestão são asseverados por dois mecanismos proprietários integrados de comunicação e segurança documental: o motor de **Notificações Reativas baseadas em Ações** e a verificação criptográfica pública.
          </p>
          <p className="text-justify leading-loose">
            O sistema de notificações unificadas (configurado na gaveta reativa do cliente) monitoriza continuamente as alterações de estado no Firestore. Sempre que ocorre um evento relevante (como a publicação de uma nova tarefa pelo docente, a submissão de uma reclamação de notas pela secretaria ou o pedido de transferência de um estudante), o sistema despacha um aviso em tempo real para os perfis afetados. Cada aviso inclui o botão funcional **"Abrir Local"**. Ao clicar, em vez de exigir uma navegação manual frustrante, a plataforma despacha um evento global reativo que redireciona a interface do utilizador diretamente para a aba e ecrã específico correspondente à ação (por exemplo, abrindo o modal de correção da tarefa em causa), otimizando radicalmente o tempo de expediente administrativo.
          </p>
          <p className="text-justify leading-loose">
            Para prover segurança documental absoluta e impedir qualquer falsificação de relatórios académicos impressos, todos os certificados, certidões e declarações de notas gerados pela plataforma incluem uma assinatura eletrónica autenticada e um código **QR Code criptográfico**. Ao digitalizar o QR Code através de um telemóvel ou scanner distrital, a plataforma gera dinamicamente uma verificação comparando o hash de segurança (SHA-256 que cruza o NIM, as classificações das disciplinas, o ano letivo e o identificador do estudante) diretamente com os dados imutáveis salvos na nuvem escolar do SGE, fornecendo uma validação fiável da autenticidade daquele papel em poucos segundos.
          </p>
        </>
      )
    },
    {
      num: 7,
      title: "Modelo de Dados Firestore NoSQL & Regras de Acesso",
      subtitle: "Estrutura de Coleções, Segurança Declarativa e Zero-Trust",
      content: (
        <>
          <p className="text-justify leading-loose">
            O pilar de armazenamento e isolamento lógico de dados do EduGestão é modelado sob uma estrutura NoSQL de alta performance no Google Cloud Firestore, seguindo rigorosamente a definição contida no arquivo global <code>firebase-blueprint.json</code>. As entidades principais são organizadas em coleções raiz de alta coerência de dados: <code>/users</code> (autenticação e controlo de papéis), <code>/schools</code> (identificadores e chancelas de cada unidade), <code>/students</code> (registos biográficos escolares), <code>/employees</code> (corpo docente e CTA), <code>/classes</code> (turmas, salas e anos), <code>/grades</code> (caderneta de notas contínuas), <code>/examGrades</code> (registos de exames nacionais do SNE) e <code>/notifications</code>.
          </p>
          <p className="text-justify leading-loose">
            A proteção contra acessos indevidos e manipulação fraudulenta de pautas e registos escolares é aplicada ao nível do servidor por meio de políticas estritas no arquivo **Firestore Security Rules (`firestore.rules`)**. Operando sob um paradigma de privilégio mínimo (Zero-Trust), o sistema proíbe qualquer leitura ou escrita aberta sem autenticação prévia (<code>request.auth != null</code>).
          </p>
          <p className="text-justify leading-loose">
            A alteração de notas de caderneta é restrita unicamente ao professor alocado àquela turma e disciplina específica por meio de verificações cruzadas baseadas na leitura do documento da classe. Para blindar o sistema contra ataques de negação de serviço e sobrecarga financeira de infraestrutura ("Denial of Wallet"), as regras de segurança validam o tamanho dos IDs inseridos, restringem o tamanho de arrays e strings (impedindo o upload de payloads massivos ou shadow-fields), e obrigam o uso de carimbos de data/hora oficiais do servidor (<code>request.time</code>) para toda e qualquer transação de dados pedagógicos, asseverando a auditabilidade inquebrável do SIGE moçambicano.
          </p>
        </>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80  flex flex-col items-center justify-start p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:static animate-in fade-in duration-200">
      
      {/* Action Header Bar (Hidden in Print) */}
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 text-white rounded-t-2xl p-4 flex flex-wrap items-center justify-between gap-3 sticky top-2 z-30 shadow-2xl print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl font-bold shadow-md">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2 font-serif">
              Memória Descritiva Oficial do Sistema EduGestão MINEDH
            </h2>
            <p className="text-xs text-amber-200/90 font-medium">
              Especificação Técnica • Modelo Reativo Firestore • Reutilização via ReportLayout
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintMemory}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl shadow flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="h-4 w-4" /> Imprimir Documento (A4)
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <X className="h-4 w-4" /> Fechar
          </button>
        </div>
      </div>

      {/* Embedded ReportLayout Container */}
      <div className="w-full max-w-5xl bg-slate-100 p-2 sm:p-4 md:p-6 rounded-b-2xl border-x border-b border-slate-700/80 shadow-2xl overflow-y-auto no-scrollbar print:p-0 print:bg-white print:border-none print:shadow-none print:static flex flex-col items-center">
        <div id="memoria-descritiva-print-area" className="w-full flex justify-center">
          <ReportLayout
            institution="REPÚBLICA DE MOÇAMBIQUE"
            subInstitution="MINISTÉRIO DA EDUCAÇÃO E DESENVOLVIMENTO HUMANO (MINEDH)"
            directorate="DIRECÇÃO NACIONAL DE TECNOLOGIAS DE INFORMAÇÃO E COMUNICAÇÃO (DNTIC)"
            title="MEMÓRIA DESCRITIVA DO SISTEMA"
            subtitle="ESPECIFICAÇÃO TÉCNICA E FUNCIONAL DA PLATAFORMA INTEGRADA DE CADERNETAS E EXPEDIENTE ACADÉMICO (EDUDESTÃO MOÇAMBIQUE)"
            resumo="Esta memória descritiva apresenta os fundamentos de engenharia, arquitetura de dados e lógica pedagógica aplicados na plataforma EduGestão. O sistema consolida num único ecossistema cloud-native reativo a gestão de pautas de frequência, pautas gerais de exames escritos, registos biográficos de alunos (com geração automática de IUE de 12 dígitos e NIM), expediente de secretaria, assinatura digital e homologação institucional. Utilizando o Google Cloud Firestore em tempo real combinado com React 18 e TypeScript, o sistema elimina as vulnerabilidades de manipulação de dados, reduz o tempo de transferência de alunos de semanas para segundos e estabelece canais de avisos instantâneos com redirecionamento automático direto ('Abrir Local') para optimização do fluxo de trabalho do corpo docente e técnico-administrativo (CTA)."
            abstract="This technical and pedagogical specification document outlines the engineering architecture, data model, and administrative processes integrated within the EduGestão platform. Developed to harmonize secondary and general education administration across Mozambique, the system unifies continuous assessments (ACS), end-of-term exams (APT), and national exams under Mozambique's legal rounding standards. Empowered by a real-time Google Cloud Firestore backend and a React 18 frontend, the platform guarantees immediate data replication across school levels. It introduces automated Student Unique Identifier (IUE) generation, instant inter-school student transfer workflow with secured QR code validation, and a real-time notification framework with direct modal deep-linking ('Abrir Local'), successfully eliminating administrative bottlenecks and data tampering risks."
            chapters={docChapters}
            author="Equipa Técnica de Desenvolvimento • DNTIC • MINEDH Moçambique"
            homologadoBy="Ministério da Educação e Desenvolvimento Humano"
            docCode="MZ-MINEDH-EDUG-2026-V4"
            onClose={onClose}
            onPrint={handlePrintMemory}
          />
        </div>
      </div>

    </div>
  );
};
