/*
 * Gera public/js/demo-metricas.js: métricas calculadas sobre respostas FICTÍCIAS,
 * pela mesma função agregar_ do Apps Script. Serve só para desenvolver e testar o
 * painel (metricas.html?demo=1) antes da coleta. Nunca usar em figura do trabalho.
 *
 * Uso: node ferramentas/gerar-demo.js
 */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const raiz = path.join(__dirname, "..");
const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(raiz, "public/js/dados.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(raiz, "apps-script/Agregacao.gs"), "utf8"), ctx);
const D = ctx.window.DADOS;

// Gerador pseudoaleatório com semente fixa: o arquivo sai igual a cada execução.
let s = 20261110;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
const escolher = (xs, pesos) => {
  if (!pesos) return xs[Math.floor(rnd() * xs.length)];
  const t = pesos.reduce((a, b) => a + b, 0);
  let x = rnd() * t;
  for (let i = 0; i < xs.length; i++) { x -= pesos[i]; if (x <= 0) return xs[i]; }
  return xs[xs.length - 1];
};
const likert = (centro) => Math.max(1, Math.min(5, Math.round(centro + (rnd() - 0.5) * 2.4)));

// Gabarito FICTÍCIO (não é o real, que fica só no Apps Script).
const gabarito = [];
["A", "B"].forEach((j) => D.perguntas[j].forEach((q) => {
  const n = (q.comum ? D.comuns[q.comum] : q).opcoes.length;
  gabarito.push({ JULGAMENTO: j, PERGUNTA: q.id, RESPOSTA: String(1 + Math.floor(rnd() * n)) });
}));
const gab = Object.fromEntries(gabarito.map((g) => [g.JULGAMENTO + "_" + g.PERGUNTA, g.RESPOSTA]));

const comentarios7 = ["Os nomes dos juízes pareciam estranhos.", "Não entendi o que é prequestionamento.", "Achei o número do processo confuso.",
  "Nada, estava claro.", "A parte de \"por que o tribunal decidiu assim\" era longa.", "Termo 'embargos' só ficou claro no fim."];
const comentarios8 = ["Quem eram as partes do processo.", "Qual seria o próximo passo do processo.", "Data em que a decisão foi publicada.",
  "Um resumo de uma frase no início.", "Se ainda cabe recurso."];

const respostas = [];
for (let i = 0; i < 24; i++) {
  const versao = (i % 4) + 1;
  const r = { MODALIDADE: i < 20 ? "presencial" : "online", VERSAO: versao };
  D.perfil.forEach((p) => { if (p.id !== "P3") r[p.id] = escolher(p.opcoes, p.opcoes.map((_, k) => (p.id === "P1" ? [1, 3, 4, 3, 1][k] : 1 + (k % 3)))); });
  r.P3 = "Não";
  const v = D.versoes[versao];
  r.ORDEM = v[0][0] + "-" + v[1][0];
  v.forEach(([j, mat]) => {
    r[j + "_MATERIAL"] = mat;
    r[j + "_TEMPO"] = Math.round(mat === "plenaria" ? 150 + rnd() * 120 : 110 + rnd() * 140);
    D.perguntas[j].forEach((q, qi) => {
      const n = (q.comum ? D.comuns[q.comum] : q).opcoes.length;
      const pAcerto = mat === "plenaria" ? [0.92, 0.95, 0.7, 0.8][qi] : [0.7, 0.85, 0.4, 0.45][qi];
      let resp;
      if (rnd() < pAcerto) resp = gab[j + "_" + q.id];
      else if (rnd() < 0.3) resp = "NS";
      else { do { resp = String(1 + Math.floor(rnd() * n)); } while (resp === gab[j + "_" + q.id] && n > 1); }
      r[j + "_" + q.id] = resp;
      const certo = resp === gab[j + "_" + q.id];
      r[j + "_C" + (qi + 1)] = resp === "NS" ? 1 : likert(certo ? 4 : 2.8);
    });
  });
  ["R1", "R2", "R3", "R4", "R5"].forEach((k, ix) => { r[k] = likert([4.3, 4.2, 3.6, 3.9, 4.1][ix]); });
  r.R6 = escolher(D.r6.opcoes, [3, 15, 4, 2]);
  r.R7 = rnd() < 0.5 ? escolher(comentarios7) : "";
  r.R8 = rnd() < 0.4 ? escolher(comentarios8) : "";
  r.TAREFA = i >= 20 ? "nao_aplicada" : escolher(["sim", "parcial", "nao", "pulada"], [12, 4, 1, 1]);
  if (["sim", "parcial", "nao"].includes(r.TAREFA)) {
    r.TAREFA_LOCALIZAR = r.TAREFA === "nao" ? "nao" : "sim";
    r.TAREFA_RESUMO = r.TAREFA === "nao" ? "nao" : "sim";
    r.TAREFA_PAUTA = r.TAREFA === "sim" ? "sim" : "nao";
    if (rnd() < 0.9) {
      let soma = 0;
      for (let k = 1; k <= 10; k++) {
        const x = likert(k % 2 ? 4 : 2);
        r["SUS" + k] = x;
        soma += k % 2 ? x - 1 : 5 - x;
      }
      r.SUS_ESCORE = soma * 2.5;
    }
  }
  respostas.push(r);
}
// duas linhas de piloto, que a agregação deve ignorar
respostas.push({ MODALIDADE: "piloto", VERSAO: 1, A_MATERIAL: "oficial", B_MATERIAL: "plenaria" });

const problemas = { A: [0, 16], B: [0, 5, 14] }; // afirmações com erro conhecido (ALINHAMENTO §3)
const avaliadores = [];
["AV01", "AV02", "AV03"].forEach((cod, ai) => {
  ["A", "B"].forEach((j) => {
    const l = { MODALIDADE: "presencial", CODIGO: cod, FORMACAO: ["Servidor(a) do tribunal", "Advogado(a)", "Servidor(a) do tribunal"][ai], JULGAMENTO: j, TEMPO: Math.round(600 + rnd() * 600) };
    D.afirmacoes[j].forEach((_, k) => {
      const nome = "AF" + (k < 9 ? "0" : "") + (k + 1);
      l[nome] = problemas[j].includes(k) ? escolher(["Contraditória", "Não sustentada"], [4, 1])
        : escolher(["Sustentada", "Não sustentada"], [19, 1]);
    });
    l.B1 = "Correto"; l.B2 = "Correta";
    l.B3 = escolher(["Algum incorreto", "Todos corretos"], [4, 1]);
    l.B4 = escolher(["Clara", "Confusa"], [5, 1]);
    l.B5 = escolher(["Não se aplica", "Sinalização adequada", "Deveria ter sinalizado"], [3, 1, 1]);
    l.C1 = likert(4.2); l.C2 = likert(3.8); l.C3 = likert(4.4);
    l.OMISSOES = j === "B" && rnd() < 0.7 ? "Item 1 da pauta (processo retirado por falta de quórum) não aparece." : "nenhuma";
    l.AF_EXTRA = "";
    avaliadores.push(l);
  });
});

const m = ctx.agregar_(respostas, avaliadores, gabarito);
m.demo = true;
const saida = path.join(raiz, "public/js/demo-metricas.js");
fs.writeFileSync(saida,
  "/* GERADO por ferramentas/gerar-demo.js — DADOS FICTÍCIOS para testar o painel. Não usar no trabalho. */\n" +
  "window.DEMO_METRICAS = " + JSON.stringify(m, null, 1) + ";\n");
console.log("ok:", saida, "| leigos", m.n.leigos, "| acerto plenarIA", m.compreensao.porCondicao.plenaria.media,
  "| oficial", m.compreensao.porCondicao.oficial.media, "| SUS", m.usabilidade.sus.media, "| sustentadas", m.fidelidade.total.pctSustentada);
