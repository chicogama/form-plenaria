# Formulário de validação do plenarIA

Aplicação estática (HTML, CSS e JavaScript, sem build) para a atividade extensionista do TCC.
Substitui o Google Forms previsto no guia, conforme `VALIDACAO/ALINHAMENTO.md`.

```
formulario-validacao/
├── public/                 ← é isto que vai para o Netlify/Vercel
│   ├── index.html          formulário (rota leiga e rota de avaliadores)
│   ├── copia.html          cópia local de segurança e reenvio (uso do aplicador)
│   ├── metricas.html       métricas agregadas, protegidas por chave
│   ├── css/style.css
│   ├── js/config.js        ← colar aqui o endereço do Apps Script
│   ├── js/dados.js         textos, perguntas, instrumentos, afirmações dos avaliadores
│   ├── js/app.js           fluxo
│   └── materiais/          acórdãos 8868 e 8873 (lidos pelos avaliadores)
├── apps-script/
│   ├── Code.gs             backend (doPost/doGet) ligado à planilha
│   └── Gabarito.gs         gabarito; fica fora de public/ para não ser visto pelo participante
├── netlify.toml / vercel.json   publicam só a pasta public/
└── README.md
```

## 1. Testar no próprio computador

Com `APPS_SCRIPT_URL` vazio, a aplicação roda em **modo local**: a versão é sorteada e as
respostas ficam só no navegador (exportáveis em `copia.html`).

```
cd public
python -m http.server 8000
```

Abra http://localhost:8000. Para repetir, use o botão **Iniciar novo participante** na tela final.

## 2. Criar a planilha e o Apps Script

1. No Google Drive, crie uma planilha (ex.: *plenarIA – validação*).
2. Menu **Extensões → Apps Script**.
3. Substitua o conteúdo de `Code.gs` pelo arquivo `apps-script/Code.gs`.
4. Clique em **+ → Script**, crie um arquivo chamado `Gabarito` e cole `apps-script/Gabarito.gs`.
5. Salve. Selecione a função `configurar` e clique em **Executar**. Autorize o acesso.
   - Cria as abas `respostas`, `avaliadores`, `presenca` e `gabarito` com os cabeçalhos.
   - Mostra no **Registro de execução** a *chave das métricas* (anote; também fica em
     Configurações do projeto → Propriedades do script → `CHAVE_METRICAS`).
6. **Implantar → Nova implantação → Tipo: App da Web**
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
7. Copie o URL que termina em `/exec` e cole em `public/js/config.js` (`APPS_SCRIPT_URL`).

> Ao mudar o código do Apps Script depois, use **Implantar → Gerenciar implantações → editar →
> Nova versão**, para manter o mesmo URL.

## 3. Publicar

- **Netlify:** https://app.netlify.com/drop → arraste a pasta `public/`.
- **Vercel:** importe o repositório (o `vercel.json` já aponta para `public/`) ou use `vercel deploy`.

Teste, **de dentro da rede do TRE**, se abrem: o endereço publicado, `script.google.com` e
`plenaria.tre-ap.jus.br`.

## 4. Endereços de uso

| Situação | Endereço |
|---|---|
| Aplicação presencial (padrão) | `https://SEU-SITE/` |
| Aplicação online | `https://SEU-SITE/?modalidade=online` |
| Teste piloto (marca como piloto, IDs `T01`…, não mexe no rodízio) | `https://SEU-SITE/?piloto=1` |
| Convite direto para avaliador | `https://SEU-SITE/?rota=avaliador` |
| Fora da rede do TRE (sem tarefa no site e sem SUS) | `https://SEU-SITE/?semtarefa=1` (combina com os outros, ex.: `?modalidade=online&semtarefa=1`) |
| Forçar uma versão (emergência) | `https://SEU-SITE/?versao=3` |
| Cópia local / reenvio | `https://SEU-SITE/copia.html` |
| Métricas | `https://SEU-SITE/metricas.html` |

Depois do piloto, rode `zerarContadorVersao()` no Apps Script.

## 5. Como funciona

**Público leigo:** boas-vindas → TCLE (aceite + opção de imagem) → lista de presença → perfil
(P1–P6) → instruções → leitura 1 → Q1–Q4 com certeza → leitura 2 → Q1–Q4 → tarefa no site do
plenarIA → SUS (se o site abriu) → percepção R1–R8 → envio.

- **Versão:** atribuída pelo Apps Script em rodízio 1→2→3→4 pela ordem de chegada (com trava
  contra acessos simultâneos). Sem conexão, é sorteada.
- **Sem voltar:** não há botão de voltar; o "voltar" do navegador é bloqueado; ao recarregar a
  página, o participante continua da etapa em que estava (o texto já lido não reaparece).
- **Tempo de leitura:** `A_TEMPO` e `B_TEMPO` em **segundos**, do aparecimento do texto até o
  clique em "Terminei a leitura".
- **Materiais:** o texto não informa qual é o registro oficial e qual é o plenarIA; isso só é
  revelado na tarefa, depois das perguntas.
- **Presença separada:** nome, telefone e e-mail vão para a aba `presenca`, com data (sem hora)
  e a aba é reordenada por nome a cada registro, para que a ordem das linhas não permita ligar
  presença a respostas.
- **Segurança dos dados:** cada envio fica numa fila local até a planilha confirmar e é
  reenviado automaticamente na próxima abertura. Uma cópia das respostas (sem nomes) fica no
  aparelho e pode ser exportada em `copia.html`. Envios repetidos são ignorados pelo `UUID`.

**Avaliadores** (P3 = Sim, ou `?rota=avaliador`): código e formação → para cada julgamento
(ordem sorteada): resumo e acórdão lado a lado → Parte A (afirmações pré-extraídas: sustentada /
não sustentada / contraditória, mais campo para afirmação faltante) → Parte B → Parte C e
omissões. Uma linha por avaliador × julgamento na aba `avaliadores`.

## 6. Valores gravados

- `A_Q1`…`B_Q4`: posição da alternativa marcada (`1`, `2`…) ou `NS` (Não sei). A posição segue a
  ordem em `js/dados.js`. **Se reordenar alternativas, atualize `Gabarito.gs` e rode `configurar()`.**
- `A_*`/`B_*` referem-se sempre ao Julgamento A (58ª) e B (61ª), independentemente da ordem;
  `ORDEM` indica qual foi lido primeiro (`A-B` ou `B-A`).
- `TAREFA`: `sim`, `parcial`, `nao`, `indisponivel` (site não abriu; SUS não aplicada), `pulada` (participante clicou em "Pular esta etapa"; SUS não aplicada) ou `nao_aplicada` (link com `?semtarefa=1`).
- SUS em branco com `TAREFA` = `sim`/`parcial`/`nao`: o participante fez a tarefa e clicou em "Pular este questionário". A média da SUS considera só quem respondeu.
- `SUS_ESCORE`: já calculado (0–100).

## 7. Painel de resultados (`metricas.html`)

Painel com as figuras e tabelas pedidas no artigo (seção 5, RQ2 e RQ3) e no relatório
extensionista (Quadro 2 e parágrafos de resultados). Cada figura já sai no formato do trabalho
(título numerado acima, "Fonte: dados da pesquisa (ano)." abaixo), pronta para captura de tela.

- **Uso:** abra `https://SEU-SITE/metricas.html`, informe a chave (`CHAVE_METRICAS`) e clique em
  *Carregar resultados*. A chave fica só nesta aba do navegador.
- **Demonstração:** `metricas.html?demo=1` mostra o painel com **dados fictícios** gerados por
  `node ferramentas/gerar-demo.js` (rode de novo se mudar `Agregacao.gs` ou `dados.js`). Nunca use
  essas figuras no trabalho; a página avisa no topo e a fonte das figuras diz "dados fictícios".
- **Impressão:** Ctrl+P esconde o cabeçalho e os controles e evita quebrar figuras entre páginas.
- **Cálculo:** `apps-script/Agregacao.gs` (função pura `agregar_`, a mesma usada pelo gerador de
  demonstração). Linhas `MODALIDADE = piloto` são excluídas. O endpoint devolve só agregados, com duas
  exceções deliberadas para a análise: respostas abertas (R7, R8, omissões) em ordem embaralhada e
  sem nenhum outro campo, e os escores SUS individuais ordenados, sem vínculo com o participante.
- **Depois de atualizar o Apps Script:** no editor, crie o arquivo `Agregacao` (+ → Script), cole
  `apps-script/Agregacao.gs`, substitua `Code.gs` e publique uma **nova versão** da implantação
  (Implantar → Gerenciar implantações → editar → Nova versão). Sem isso o painel avisa que o Apps
  Script publicado é a versão antiga.

| Seção do painel | Figuras e tabelas | Onde entra |
|---|---|---|
| Visão geral | indicadores; Quadro 2 (metas M1–M6) | Relatório, Quadro 2 |
| Participantes | perfil P1, P2, P4–P6; versões; formação dos avaliadores | Artigo, metodologia/resultados |
| Compreensão (RQ3) | acerto por pergunta e condição; por julgamento; comparação pareada; acerto × certeza; erros com certeza alta e "Não sei"; tempo de leitura; tabela de acerto; distribuição por alternativa | Artigo 5.3; relatório (compreensão, confiança, erros atribuíveis ao resumo) |
| Percepção | Likert R1–R5; R6; tabela de médias; respostas abertas R7/R8 | Artigo 5.3; relatório (M4, respostas abertas) |
| Usabilidade | escores SUS; tarefa e suas partes | Relatório (M5) |
| Fidelidade (RQ2) | classificação das afirmações; Partes B e C; concordância; afirmações problemáticas; omissões | Artigo 5.2; relatório (M6, fidelidade) |

## 8. Pendências antes da aplicação

- [ ] Trocar a tradução de trabalho da SUS pela versão validada em PT-BR (`js/dados.js`, `sus`).
- [ ] Teste do gabarito com alguém que não leu os materiais.
- [ ] Teste piloto com 2–3 pessoas (`?piloto=1`).
- [ ] Confirmar CEP / Resolução CNS 510/2016.
