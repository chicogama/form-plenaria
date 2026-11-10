/*
 * Conteúdo do formulário: materiais de leitura, perguntas e instrumentos.
 *
 * O GABARITO NÃO FICA AQUI. Ele está em apps-script/Gabarito.gs, fora da pasta
 * publicada, para que o participante não consiga vê-lo pelo navegador.
 *
 * Valores gravados na planilha:
 *   - perguntas de múltipla escolha: posição da alternativa (1, 2, 3...) ou "NS" (Não sei);
 *   - escalas: 1 a 5.
 * Se mudar a ORDEM de alguma alternativa, atualize também o Gabarito.gs.
 */
window.DADOS = {
  plenariaInicio: "https://plenaria.tre-ap.jus.br/",

  julgamentos: {
    A: {
      rotulo: "Julgamento A",
      sessao: "58ª Sessão Judiciária Ordinária, de 5 de agosto de 2026",
      plenariaUrl: "https://plenaria.tre-ap.jus.br/sessoes/d9e63c64-27ce-42ba-bf34-6a5600d68360?mes=2026-08",
      acordaoPdf: "materiais/acordao-8868-2026.pdf",
      acordaoNome: "Acórdão nº 8868/2026",

      // Registro oficial: ementa e dispositivo do Acórdão nº 8868/2026.
      // Recorte: omitida apenas a lista de advogados do cabeçalho.
      oficial: `
<p class="doc-centro"><strong>TRIBUNAL REGIONAL ELEITORAL DO AMAPÁ</strong><br><strong>ACÓRDÃO Nº 8868/2026</strong></p>
<p>EMBARGOS DE DECLARAÇÃO NO RECURSO CRIMINAL ELEITORAL Nº 0600108-22.2021.6.03.0011<br>
EMBARGANTE: FAUSTO JOSÉ DOS SANTOS<br>
EMBARGADO: MINISTÉRIO PÚBLICO ELEITORAL<br>
RELATORA: JUÍZA PAOLA SANTOS</p>
<p class="doc-ementa">EMBARGOS DE DECLARAÇÃO EM RECURSO CRIMINAL ELEITORAL. CORRUPÇÃO ELEITORAL. ART. 299 DO CÓDIGO ELEITORAL. CORRUPÇÃO DE MENORES. ART. 244-B DO ESTATUTO DA CRIANÇA E DO ADOLESCENTE. ALEGADAS OMISSÕES. ENFRENTAMENTO INTEGRAL DAS TESES DEFENSIVAS NO ACÓRDÃO EMBARGADO. PRETENSÃO DE REDISCUSSÃO DO MÉRITO. INVIABILIDADE. RECURSO DESPROVIDO.</p>
<p><strong>I. CASO EM EXAME</strong></p>
<p>1. Embargos de declaração opostos contra acórdão que negou provimento a recurso criminal eleitoral e manteve condenação pelos crimes de corrupção eleitoral (art. 299 do Código Eleitoral) e corrupção de menores (art. 244-B do ECA), em razão do oferecimento de vantagens econômicas a estudantes, inclusive menores de idade, em troca de votos. O embargante sustentou omissões quanto à autonomia da ação penal em relação à representação eleitoral, ao acesso integral às provas telemáticas, à validade da busca domiciliar, à ausência do denominado "aviso de Miranda", à atipicidade das condutas e à participação dos corréus nos delitos imputados.</p>
<p><strong>II. QUESTÃO EM DISCUSSÃO</strong></p>
<p>2. A questão em discussão consiste em verificar se o acórdão embargado incorreu em omissão apta a justificar sua integração, nos termos do art. 275 do Código Eleitoral.</p>
<p><strong>III. RAZÕES DE DECIDIR</strong></p>
<p>3. A circunstância de a corré não ter integrado a representação eleitoral de cassação de diploma não constitui questão juridicamente relevante para a ação penal, cuja responsabilidade possui autonomia em relação às demandas eleitorais de natureza cível. 4. O acórdão enfrentou expressamente as alegações relativas à cadeia de custódia, à extração dos dados telemáticos, ao acesso da defesa ao material probatório e à desnecessidade de transcrição integral das conversas, concluindo pela regularidade das provas e pela observância do contraditório e da ampla defesa. 5. Também foram expressamente apreciadas as teses referentes à busca domiciliar, ao consentimento do morador, à existência de fundadas razões para o ingresso no imóvel e à desnecessidade do denominado "aviso de Miranda" durante a abordagem policial, inexistindo omissão sobre tais matérias. 6. O reconhecimento da tipicidade dos delitos, da participação dos corréus e da demonstração do dolo específico constitui o núcleo da fundamentação do acórdão recorrido, que analisou detidamente o conjunto probatório documental, testemunhal, pericial e telemático produzido sob o crivo do contraditório. 7. Os embargos de declaração não se prestam à reapreciação das provas nem à rediscussão dos fundamentos adotados pelo colegiado, sendo incabíveis quando ausentes omissão, obscuridade, contradição ou erro material.</p>
<p><strong>IV. DISPOSITIVO E TESE</strong></p>
<p>8. Embargos de declaração conhecidos e desprovidos, mantendo-se integralmente o acórdão recorrido.</p>
<p>Tese de julgamento: “1. Os embargos de declaração destinam-se exclusivamente ao saneamento de omissão, obscuridade, contradição ou erro material, sendo inadmissível sua utilização para rediscutir o mérito da decisão. 2. Não há omissão quando o acórdão enfrenta, de forma expressa e fundamentada, todas as teses relevantes deduzidas pela defesa, ainda que em sentido contrário à pretensão da parte. 3. A autonomia da responsabilidade penal em relação às ações eleitorais de natureza cível afasta a relevância da composição subjetiva da demanda eleitoral para o julgamento da ação penal”.</p>
<p>Acordam os Juízes do Tribunal Regional Eleitoral do Amapá, por unanimidade, em conhecer dos embargos de declaração e, no mérito, rejeitá-los, nos termos do voto da Juíza Relatora.</p>
<p>Sala de Sessões do Tribunal Regional Eleitoral do Amapá, 5 de agosto de 2026.</p>
<p>Juíza PAOLA SANTOS<br>Relatora</p>`,

      // Resumo do plenarIA, transcrito sem correções (os erros são dado da pesquisa).
      plenaria: `
<h3>Resumo da sessão</h3>
<p><strong>Processo 1 — Embargos de declaração no Recurso Eleitoral nº 06118-2021, origem Serra do Navio</strong></p>
<h4>O que foi decidido</h4>
<p>O Tribunal rejeitou os embargos de declaração e manteve integralmente a decisão anterior que havia condenado os recorrentes por captação ilícita de sufrágio e corrupção de menores.</p>
<h4>O que estava sendo julgado</h4>
<p>O tribunal analisou um pedido para esclarecer supostas omissões no acórdão anterior. O embargante alegava, em resumo, que o julgamento não teria enfrentado pontos como: a exclusividade da ação anterior em face do titular do mandato, o acesso incompleto aos diálogos extraídos de celular, a legalidade do ingresso no domicílio de uma pessoa citada no processo, a falta de advertência sobre o direito ao silêncio, a atipicidade das condutas e a participação de Márcia Serra e do próprio embargante nos fatos.</p>
<h4>Por que o tribunal decidiu assim</h4>
<p>A relatora entendeu que não havia omissão, contradição, obscuridade ou erro material a corrigir.</p>
<p>Segundo o voto, os pontos apontados pela defesa já tinham sido enfrentados no acórdão anterior ou eram irrelevantes para a solução do caso. A relatora destacou, entre outros pontos, que:</p>
<ul>
<li>a discussão sobre a ação anterior de cassação não era relevante para a condenação penal;</li>
<li>a prova telemática foi considerada regular, com autorização judicial e acesso da defesa ao material probatório;</li>
<li>a entrada no domicílio foi entendida como justificada por diligências prévias e por consentimento voluntário;</li>
<li>a ausência de advertência sobre o direito ao silêncio já havia sido tratada;</li>
<li>a condenação por compra de votos foi sustentada por conjunto de provas documentais, periciais, telemáticas e testemunhais;</li>
<li>a menoridade dos envolvidos e a participação na prática do crime do ECA estariam comprovadas;</li>
<li>o pedido dos embargos buscava, na prática, novo exame das provas, o que não é admitido nessa via processual.</li>
</ul>
<h4>Como foi a votação</h4>
<p>A decisão foi unânime.</p>
<h4>Quem votou e como votou</h4>
<ul>
<li>Juíza Paola Santos, relatora: votou pelo não provimento dos embargos, mantendo a decisão anterior.</li>
<li>Juiz Galeano Sei: acompanhou a relatora.</li>
<li>Desembargador Rômeo Araújo: acompanhou a relatora.</li>
<li>Juiz Alex Lamy: acompanhou a relatora.</li>
<li>Juiz Normandes Souza: acompanhou a relatora.</li>
<li>Juíza Keila Utzig: acompanhou a relatora.</li>
</ul>
<h4>O que isso significa</h4>
<p>Com essa decisão, continua válida a condenação já definida anteriormente pelo Tribunal, sem qualquer alteração no resultado do julgamento anterior.</p>
<h4>Entenda os termos</h4>
<p><strong>Embargos de declaração:</strong> pedido feito para que o tribunal esclareça, corrija ou complete uma decisão quando houver omissão, contradição, obscuridade ou erro material.<br>
<strong>Captação ilícita de sufrágio:</strong> compra de votos.<br>
<strong>Corrupção de menores:</strong> crime que envolve a participação de adolescente em prática criminosa.</p>`
    },

    B: {
      rotulo: "Julgamento B",
      sessao: "61ª Sessão Judiciária Ordinária, de 13 de agosto de 2026",
      plenariaUrl: "https://plenaria.tre-ap.jus.br/sessoes/0d1b4338-ce62-4dca-8dad-23a9dff75a50?mes=2026-08",
      acordaoPdf: "materiais/acordao-8873-2026.pdf",
      acordaoNome: "Acórdão nº 8873/2026",

      // Registro oficial: ementa e dispositivo do Acórdão nº 8873/2026.
      // Recorte: omitida apenas a lista de advogados do cabeçalho.
      oficial: `
<p class="doc-centro"><strong>TRIBUNAL REGIONAL ELEITORAL DO AMAPÁ</strong><br><strong>ACÓRDÃO Nº 8873/2026</strong></p>
<p>EMBARGOS DE DECLARAÇÃO NA REPRESENTAÇÃO Nº 0600162-79.2025.6.03.0000<br>
EMBARGANTE: FEDERAÇÃO PSOL-REDE<br>
EMBARGADOS: KARLYSON DA SILVA REBOLÇA; FACEBOOK SERVIÇOS ONLINE DO BRASIL LTDA.; RAYSSA CADENA FURLAN<br>
RELATOR: JUIZ ALEX LAMY</p>
<p class="doc-ementa">DIREITO ELEITORAL. EMBARGOS DE DECLARAÇÃO. ELEIÇÕES 2026. REPRESENTAÇÃO. PROPAGANDA ELEITORAL ANTECIPADA. ILEGITIMIDADE ATIVA. EXTINÇÃO SEM RESOLUÇÃO DO MÉRITO. PRETENSÃO DE REDISCUSSÃO DA CAUSA. EMBARGOS REJEITADOS.</p>
<p><strong>I. CASO EM EXAME</strong></p>
<p>1. Embargos de declaração opostos contra acórdão que acolheu a preliminar de ilegitimidade ativa da Federação e extinguiu, sem resolução do mérito, representação por propaganda eleitoral antecipada. A embargante sustenta omissão no julgado por ausência de registro expresso de todos os fatos narrados na petição inicial e requer manifestação sobre alegadas condutas caracterizadoras de propaganda eleitoral antecipada para fins de prequestionamento, com pedido de efeitos infringentes.</p>
<p><strong>II. QUESTÃO EM DISCUSSÃO</strong></p>
<p>2. Verificar se o acórdão incorreu em omissão ao deixar de examinar os fatos narrados na petição inicial e as alegações de propaganda eleitoral antecipada, apesar do reconhecimento da ilegitimidade ativa da autora e da extinção do processo sem resolução do mérito.</p>
<p><strong>III. RAZÕES DE DECIDIR</strong></p>
<p>3. O acórdão enfrentou adequadamente a questão processual controvertida ao reconhecer a ilegitimidade ativa da Federação autora, fundamento suficiente para extinguir o processo sem resolução do mérito. 4. O reconhecimento da ausência de legitimidade ativa prejudica o exame das alegações de propaganda eleitoral antecipada e afasta a necessidade de manifestação sobre todos os fatos narrados na petição inicial, inclusive para fins de prequestionamento.</p>
<p><strong>IV. DISPOSITIVO E TESE</strong></p>
<p>5. Embargos de declaração rejeitados. Tese de julgamento: "O reconhecimento da ilegitimidade ativa, com a consequente extinção do processo sem resolução do mérito, torna prejudicado o exame das alegações de mérito e afasta a existência de omissão pela ausência de manifestação sobre questões cuja apreciação se tornou processualmente inviável".</p>
<p>Acordam os juízes do Tribunal Regional Eleitoral do Amapá, por unanimidade, em conhecer dos embargos de declaração e, no mérito, rejeitá-los, nos termos do voto do Juiz Relator.</p>
<p>Sala de Sessões do Tribunal Regional Eleitoral do Amapá, 13 de agosto de 2026.</p>
<p>Juiz ALEX LAMY<br>Relator</p>`,

      plenaria: `
<h3>Resumo da sessão</h3>
<p><strong>Processo 1 — Embargos de declaração na representação eleitoral nº 0600-162-79.2025.6030001</strong></p>
<h4>O que foi decidido</h4>
<p>O tribunal rejeitou os embargos de declaração e manteve a decisão anterior, que havia extinguido a representação sem análise do mérito por reconhecer que a federação autora não tinha legitimidade para atuar no caso.</p>
<h4>O que estava sendo julgado</h4>
<p>A Federação Pessoal Rede pediu que o tribunal esclarecesse ou complementasse o acórdão anterior. Segundo a embargante, a decisão teria deixado de enfrentar todos os fatos apontados na petição inicial e isso seria importante para permitir futuros recursos.</p>
<p>O ponto central era saber se havia omissão na decisão anterior.</p>
<h4>Por que o tribunal decidiu assim</h4>
<p>O relator explicou que a decisão anterior já tinha resolvido a questão principal ao reconhecer a ilegitimidade da federação para propor a representação, porque ela não teria pertinência para defender interesses ligados a agentes políticos que não integravam seus quadros.</p>
<p>Com isso, o tribunal não precisava examinar as acusações de propaganda eleitoral antecipada, já que a falta de legitimidade processual impedia entrar no mérito.</p>
<p>O relator também afirmou que não havia omissão, pois o fundamento determinante do julgamento tinha sido justamente a ausência de legitimidade ativa e de interesse processual. Por esse motivo, o pedido de prequestionamento também ficou prejudicado.</p>
<h4>Como foi a votação</h4>
<p>A decisão foi unânime.</p>
<h4>Quem votou e como votou</h4>
<ul>
<li>Juiz Alex Lamy (relator): votou pela rejeição dos embargos.</li>
<li>Juiz Normandy Souza: acompanhou o relator.</li>
<li>Juíza Keylou Utzig: acompanhou o relator.</li>
<li>Juíza Paola Santos: acompanhou o relator.</li>
<li>Juiz Galeano Cei: acompanhou o relator.</li>
</ul>
<h4>O que isso significa</h4>
<p>Na prática, continua valendo a decisão anterior que encerrou a representação sem analisar se houve ou não propaganda eleitoral antecipada.</p>
<h4>Entenda os termos</h4>
<p><strong>Embargos de declaração:</strong> pedido feito para esclarecer, corrigir ou completar uma decisão quando a parte entende que houve omissão, contradição, obscuridade ou erro material.<br>
<strong>Legitimidade ativa:</strong> autorização jurídica para alguém entrar com a ação.<br>
<strong>Prequestionamento:</strong> pedido para que a decisão trate expressamente de determinado ponto, facilitando a discussão em instâncias superiores.</p>`
    }
  },

  // Instrumento 1, Quadro 2. Cada leitura: [julgamento, material].
  versoes: {
    1: [["A", "oficial"], ["B", "plenaria"]],
    2: [["A", "plenaria"], ["B", "oficial"]],
    3: [["B", "oficial"], ["A", "plenaria"]],
    4: [["B", "plenaria"], ["A", "oficial"]]
  },

  // Instrumento 4. Alternativas revisadas em 10/11/2026 (ver VALIDACAO/ALINHAMENTO.md §4).
  perguntas: {
    A: [
      { id: "Q1", texto: "O que o tribunal decidiu neste julgamento?", opcoes: [
        "Aceitou o pedido da defesa e anulou a condenação.",
        "Recusou o pedido da defesa, e a condenação anterior ficou como estava.",
        "Recusou o pedido da defesa, mas diminuiu a pena dos condenados.",
        "Mandou o caso voltar para ser julgado de novo pelo juiz da cidade."
      ]},
      { id: "Q2", comum: "votacao" },
      { id: "Q3", texto: "O que estava em disputa neste julgamento?", opcoes: [
        "Se o candidato deveria perder o mandato por ter oferecido vantagens a eleitores.",
        "Se a pena dada na decisão anterior tinha sido dura demais.",
        "Se a decisão anterior tinha deixado de analisar argumentos apresentados pela defesa."
      ]},
      { id: "Q4", texto: "O que muda na prática depois desta decisão?", opcoes: [
        "A condenação continua valendo do mesmo jeito, inclusive para o candidato.",
        "A condenação continua só para quem entregava o dinheiro, e o candidato fica livre.",
        "A condenação é anulada, e as provas do processo deixam de valer."
      ]}
    ],
    B: [
      { id: "Q1", texto: "O que o tribunal decidiu neste julgamento?", opcoes: [
        "Aceitou o pedido da federação e passou a analisar as acusações de propaganda fora de época.",
        "Aceitou o pedido em parte e mandou o caso ser julgado de novo.",
        "Recusou o pedido da federação de partidos, e a decisão anterior ficou como estava.",
        "Recusou o pedido da federação, mas multou a pessoa acusada por propaganda fora de época."
      ]},
      { id: "Q2", comum: "votacao" },
      { id: "Q3", texto: "O que estava em disputa neste julgamento?", opcoes: [
        "Se a decisão anterior tinha deixado de analisar fatos apontados pela federação.",
        "Se a pessoa acusada fez propaganda eleitoral antes do prazo permitido.",
        "Se a decisão anterior acertou ao mandar retirar publicações do Facebook."
      ]},
      { id: "Q4", texto: "O que muda na prática depois desta decisão?", opcoes: [
        "A pessoa acusada passa a ser considerada culpada e terá de apagar as publicações.",
        "O caso continua encerrado sem que o tribunal diga se houve ou não propaganda irregular.",
        "A federação terá de pagar multa por ter feito uma acusação sem fundamento."
      ]}
    ]
  },

  comuns: {
    votacao: { texto: "Como foi a votação?", opcoes: [
      "Todos os integrantes votaram no mesmo sentido (unanimidade)",
      "Houve votos divergentes, e a decisão foi tomada pela maioria",
      "O julgamento não foi concluído nesta sessão"
    ]}
  },

  // Instrumento 3. P3 adaptada (ALINHAMENTO §6).
  perfil: [
    { id: "P1", texto: "Qual a sua faixa de idade?", opcoes: ["18 a 24 anos", "25 a 34 anos", "35 a 44 anos", "45 a 59 anos", "60 anos ou mais"] },
    { id: "P2", texto: "Qual a sua escolaridade?", opcoes: ["Ensino fundamental", "Ensino médio", "Ensino superior incompleto", "Ensino superior completo", "Pós-graduação"] },
    { id: "P3", texto: "Você tem formação em Direito (ou estuda Direito) ou trabalha na área judicial do tribunal?", opcoes: ["Não", "Sim"] },
    { id: "P4", texto: "Qual a sua principal ocupação?", opcoes: ["Estudante", "Trabalhador(a) do setor público", "Trabalhador(a) do setor privado ou autônomo(a)", "Outra"], outra: "Outra" },
    { id: "P5", texto: "Você já assistiu, ao vivo ou gravada, a alguma sessão de julgamento de um tribunal?", opcoes: ["Nunca", "Uma vez", "Algumas vezes", "Com frequência"] },
    { id: "P6", texto: "Como você costuma se informar sobre decisões da Justiça Eleitoral?", opcoes: ["Não costumo me informar", "Notícias em jornais, sites ou televisão", "Redes sociais", "Canais oficiais do tribunal", "Outro"], outra: "Outro" }
  ],

  escala: ["Discordo totalmente", "Discordo", "Nem concordo nem discordo", "Concordo", "Concordo totalmente"],

  // Instrumento 5.
  percepcao: [
    "O resumo foi fácil de entender.",
    "Consegui identificar com clareza o que o tribunal decidiu.",
    "Os termos jurídicos que apareceram foram explicados de forma suficiente.",
    "Confio que o resumo representa corretamente o que foi decidido na sessão.",
    "Eu usaria este tipo de resumo para acompanhar outros julgamentos do tribunal."
  ],
  r6: { texto: "Comparando os dois textos que você leu, qual foi mais fácil de entender?", opcoes: [
    "O registro oficial do tribunal", "O resumo do plenarIA", "Os dois foram igualmente fáceis", "Os dois foram igualmente difíceis"
  ]},
  r7: "O que ficou confuso ou difícil de entender no resumo do plenarIA?",
  r8: "Que informação você gostaria de encontrar no resumo e não encontrou?",

  // Instrumento 6. [VERIFICAR] tradução de trabalho; trocar pela versão validada em PT-BR e citar a fonte.
  sus: [
    "Eu acho que gostaria de usar este sistema com frequência.",
    "Achei o sistema desnecessariamente complexo.",
    "Achei o sistema fácil de usar.",
    "Acho que precisaria da ajuda de uma pessoa com conhecimentos técnicos para usar este sistema.",
    "Achei que as diversas funções deste sistema estão bem integradas.",
    "Achei que o sistema apresenta muita inconsistência.",
    "Imagino que a maioria das pessoas aprenderia a usar este sistema rapidamente.",
    "Achei o sistema muito complicado de usar.",
    "Eu me senti muito confiante ao usar o sistema.",
    "Precisei aprender muitas coisas antes de conseguir usar este sistema."
  ],

  // Instrumento 7, Parte A: afirmações de fato pré-extraídas de cada resumo, na ordem em que aparecem.
  // O glossário ("Entenda os termos") é avaliado na Parte C, item 2.
  afirmacoes: {
    A: [
      "O processo são embargos de declaração no Recurso Eleitoral nº 06118-2021.",
      "O processo tem origem em Serra do Navio.",
      "O Tribunal rejeitou os embargos de declaração.",
      "O Tribunal manteve integralmente a decisão anterior.",
      "A decisão anterior havia condenado os recorrentes por captação ilícita de sufrágio e corrupção de menores.",
      "O embargante alegou omissões sobre: exclusividade da ação anterior em face do titular do mandato; acesso incompleto aos diálogos extraídos de celular; legalidade do ingresso no domicílio; falta de advertência sobre o direito ao silêncio; atipicidade das condutas; participação de Márcia Serra e do próprio embargante.",
      "A relatora entendeu que não havia omissão, contradição, obscuridade ou erro material a corrigir.",
      "A discussão sobre a ação anterior de cassação não era relevante para a condenação penal.",
      "A prova telemática foi considerada regular, com autorização judicial e acesso da defesa ao material probatório.",
      "A entrada no domicílio foi considerada justificada por diligências prévias e por consentimento voluntário.",
      "A ausência de advertência sobre o direito ao silêncio já havia sido tratada no acórdão anterior.",
      "A condenação por compra de votos foi sustentada por provas documentais, periciais, telemáticas e testemunhais.",
      "A menoridade dos envolvidos e a participação no crime do ECA estariam comprovadas.",
      "Os embargos buscavam, na prática, novo exame das provas, o que não é admitido nessa via processual.",
      "A decisão foi unânime.",
      "A relatora, Juíza Paola Santos, votou pelo não provimento dos embargos.",
      "Acompanharam a relatora: Juiz Galeano Sei, Desembargador Rômeo Araújo, Juiz Alex Lamy, Juiz Normandes Souza e Juíza Keila Utzig.",
      "Com a decisão, continua válida a condenação anterior, sem alteração no resultado."
    ],
    B: [
      "O processo são embargos de declaração na representação eleitoral nº 0600-162-79.2025.6030001.",
      "O tribunal rejeitou os embargos de declaração.",
      "O tribunal manteve a decisão anterior.",
      "A decisão anterior havia extinguido a representação sem análise do mérito.",
      "A extinção se deu porque a federação autora não tinha legitimidade para atuar no caso.",
      "A embargante é a \"Federação Pessoal Rede\".",
      "A embargante alegou que a decisão deixou de enfrentar todos os fatos da petição inicial, o que seria importante para futuros recursos.",
      "O ponto central era saber se havia omissão na decisão anterior.",
      "A ilegitimidade foi reconhecida porque a federação não teria pertinência para defender interesses de agentes políticos que não integravam seus quadros.",
      "O tribunal não precisava examinar as acusações de propaganda eleitoral antecipada, pois a falta de legitimidade impedia entrar no mérito.",
      "Não havia omissão, pois o fundamento determinante foi a ausência de legitimidade ativa e de interesse processual.",
      "O pedido de prequestionamento ficou prejudicado.",
      "A decisão foi unânime.",
      "O relator, Juiz Alex Lamy, votou pela rejeição dos embargos.",
      "Acompanharam o relator: Juiz Normandy Souza, Juíza Keylou Utzig, Juíza Paola Santos e Juiz Galeano Cei.",
      "Na prática, continua valendo a decisão anterior que encerrou a representação sem analisar se houve propaganda antecipada."
    ]
  },

  // Instrumento 7, Parte B.
  elementos: [
    { id: "B1", texto: "Resultado do julgamento", opcoes: ["Correto", "Incorreto", "Omitido"] },
    { id: "B2", texto: "Forma da votação (unanimidade ou maioria)", opcoes: ["Correta", "Incorreta", "Omitida"] },
    { id: "B3", texto: "Voto atribuído a cada integrante", opcoes: ["Todos corretos", "Algum incorreto", "Não informado"] },
    { id: "B4", texto: "Distinção entre pedido da parte e decisão do tribunal", opcoes: ["Clara", "Confusa"] },
    { id: "B5", texto: "Trechos incertos sinalizados pelo resumo", opcoes: ["Sinalização adequada", "Deveria ter sinalizado", "Não se aplica"] }
  ],

  // Instrumento 7, Parte C.
  parteC: [
    "O resumo pode ser compreendido por alguém sem formação jurídica.",
    "Os termos técnicos mantidos no resumo foram explicados corretamente.",
    "A simplificação não alterou o sentido jurídico da decisão."
  ],

  formacoes: ["Estudante de Direito", "Advogado(a)", "Servidor(a) do tribunal", "Outra"]
};
