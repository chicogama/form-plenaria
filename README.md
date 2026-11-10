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
- `TAREFA`: `sim`, `parcial`, `nao` ou `indisponivel` (site não abriu; SUS não aplicada).
- `SUS_ESCORE`: já calculado (0–100).

## 7. Métricas

`metricas.html` pede a chave e mostra **apenas agregados** (acerto por condição e por
julgamento, erros com certeza alta, tempo de leitura, percepção, SUS, tarefa, fidelidade e
concordância entre avaliadores) com a situação de cada meta M1–M6. Linhas com
`MODALIDADE = piloto` são excluídas.

## 8. Pendências antes da aplicação

- [ ] Trocar a tradução de trabalho da SUS pela versão validada em PT-BR (`js/dados.js`, `sus`).
- [ ] Teste do gabarito com alguém que não leu os materiais.
- [ ] Teste piloto com 2–3 pessoas (`?piloto=1`).
- [ ] Confirmar CEP / Resolução CNS 510/2016.
