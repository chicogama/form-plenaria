/*
 * Painel de resultados da validação (metricas.html).
 *
 * Fonte dos dados: Apps Script ?acao=metricas&chave=... (só agregados; ver apps-script/Agregacao.gs).
 * ?demo=1 carrega js/demo-metricas.js (dados FICTÍCIOS) para testar o layout.
 *
 * As figuras seguem o formato do trabalho (título numerado acima, fonte abaixo),
 * para serem capturadas e coladas no artigo e no relatório extensionista.
 */
(function () {
  "use strict";

  var D = window.DADOS;
  var C = window.CONFIG;
  var params = new URLSearchParams(location.search);
  var saida = document.getElementById("saida");
  var statusEl = document.getElementById("status");
  var form = document.getElementById("controle");
  var campoChave = document.getElementById("chave");
  var btnAtualizar = document.getElementById("atualizar");
  var CH_CHAVE = "plenaria-painel:chave";

  // Metas do relatório extensionista (ALINHAMENTO.md §5).
  var METAS = { leigos: 20, avaliadores: 2, acertoPlenaria: 70, clareza: 4, sus: 68, sustentadas: 90 };

  var COND = [
    { id: "oficial", nome: "Registro oficial (ementa)", cor: "var(--s-oficial)" },
    { id: "plenaria", nome: "Resumo do plenarIA", cor: "var(--s-plenaria)" }
  ];
  var PERGUNTAS = { Q1: "Decisão", Q2: "Forma da votação", Q3: "Questão em disputa", Q4: "Consequência prática" };

  // ------------------------------------------------------------ formatação

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmt(x, casas) {
    if (x === null || x === undefined || isNaN(x)) return "—";
    return Number(x).toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: casas === undefined ? 1 : casas });
  }
  function pct(x) { return x === null || x === undefined ? "—" : fmt(x) + "%"; }
  function tempo(seg) {
    if (seg === null || seg === undefined) return "—";
    var m = Math.floor(seg / 60), s = Math.round(seg % 60);
    return m ? m + " min " + (s < 10 ? "0" : "") + s + " s" : s + " s";
  }
  function soma(obj) { return Object.keys(obj || {}).reduce(function (a, k) { return a + obj[k]; }, 0); }
  function share(v, total) { return total ? v / total * 100 : 0; }

  // ------------------------------------------------------------ peças

  var nFig = 0, nTab = 0, fonte = "";

  function figura(titulo, corpo, op) {
    op = op || {};
    nFig++;
    return '<figure class="fig' + (op.largo ? " largura-total" : "") + '">' +
      '<figcaption class="fig-titulo"><span class="num">Figura ' + nFig + "</span> – " + titulo + "</figcaption>" +
      '<div class="fig-corpo">' + corpo + "</div>" +
      (op.nota ? '<p class="fig-nota">' + op.nota + "</p>" : "") +
      '<p class="fig-fonte">' + fonte + "</p>" +
      (op.dados ? '<details class="fig-dados"><summary>Ver os dados da figura</summary><div class="tabela-rolagem">' + op.dados + "</div></details>" : "") +
      "</figure>";
  }

  function tabela(titulo, cab, linhas, op) {
    op = op || {};
    var rot = op.quadro ? "Quadro" : "Tabela";
    if (!op.quadro) nTab++;
    var html = '<div class="tabela-rolagem"><table class="tabela"><thead><tr>' +
      cab.map(function (c) { return '<th class="' + (c.n ? "n" : "") + '">' + c.t + "</th>"; }).join("") + "</tr></thead><tbody>" +
      linhas.map(function (l) {
        return "<tr>" + l.map(function (v, i) { return '<td class="' + (cab[i].n ? "n" : "") + '">' + v + "</td>"; }).join("") + "</tr>";
      }).join("") + "</tbody></table></div>";
    return '<figure class="fig' + (op.largo === false ? "" : " largura-total") + '">' +
      '<figcaption class="fig-titulo"><span class="num">' + rot + " " + (op.quadro ? op.quadro : nTab) + "</span> – " + titulo + "</figcaption>" +
      html + (op.nota ? '<p class="fig-nota">' + op.nota + "</p>" : "") + '<p class="fig-fonte">' + fonte + "</p></figure>";
  }

  function tabelaSimples(cab, linhas) {
    return '<table class="tabela"><thead><tr>' + cab.map(function (c) { return "<th>" + c + "</th>"; }).join("") +
      "</tr></thead><tbody>" + linhas.map(function (l) { return "<tr><td>" + l.join("</td><td>") + "</td></tr>"; }).join("") + "</tbody></table>";
  }

  function legenda(itens) {
    return '<ul class="legenda">' + itens.map(function (s) {
      return '<li><span class="amostra" style="background:' + s.cor + '"></span>' + esc(s.nome) + "</li>";
    }).join("") + "</ul>";
  }

  function escalaX(max, sufixo, passos) {
    var t = [];
    for (var i = 0; i <= passos; i++) t.push("<span>" + fmt(max / passos * i) + (sufixo || "") + "</span>");
    return '<div class="escala-x" aria-hidden="true"><div></div><div><div class="ticks">' + t.join("") + "</div><span></span></div></div>";
  }

  // Barras horizontais agrupadas: uma linha por série dentro de cada categoria.
  function barrasAgrupadas(grupos, series, op) {
    op = op || {};
    var max = op.max || 100;
    var f = op.fmt || pct;
    var html = legenda(series) + '<div class="barras">';
    grupos.forEach(function (g) {
      html += '<div class="barra-grupo"><div class="barra-cat">' + esc(g.cat) + (g.sub ? "<small>" + esc(g.sub) + "</small>" : "") + "</div>";
      series.forEach(function (s) {
        var v = g.valores[s.id];
        var w = v === null || v === undefined ? 0 : Math.max(0, Math.min(100, v / max * 100));
        var dica = g.cat + " · " + s.nome + ": " + f(v) + (g.dicas && g.dicas[s.id] ? " (" + g.dicas[s.id] + ")" : "");
        html += '<div class="barra-linha"><div class="barra-trilho"><div class="barra" style="width:' + w + "%;background:" + s.cor +
          '" data-dica="' + esc(dica) + '"></div></div><span class="barra-val">' + f(v) + "</span></div>";
      });
      html += "</div>";
    });
    return html + "</div>" + (op.semEscala ? "" : escalaX(max, op.sufixoEscala === undefined ? "%" : op.sufixoEscala, 4));
  }

  // Barras horizontais de série única.
  function barrasSimples(itens, op) {
    op = op || {};
    var max = op.max || Math.max.apply(null, itens.map(function (i) { return i.v; }).concat([1]));
    var cor = op.cor || "var(--s-unica)";
    return '<div class="barras simples">' + itens.map(function (i) {
      var w = Math.max(0, i.v / max * 100);
      return '<div class="barra-grupo"><div class="barra-cat">' + esc(i.rot) + '</div><div class="barra-linha"><div class="barra-trilho"><div class="barra" style="width:' +
        w + "%;background:" + cor + '" data-dica="' + esc(i.dica || i.rot + ": " + i.txt) + '"></div></div><span class="barra-val">' + i.txt + "</span></div></div>";
    }).join("") + "</div>";
  }

  // Barra segmentada alta (partes de um todo).
  function segmentada(partes, op) {
    op = op || {};
    var total = partes.reduce(function (a, p) { return a + p.v; }, 0);
    if (!total) return '<p class="abertas-vazio">Sem dados.</p>';
    return '<div class="segmentada" role="img" aria-label="' + esc(partes.map(function (p) { return p.nome + " " + pct(share(p.v, total)); }).join("; ")) + '">' +
      partes.filter(function (p) { return p.v > 0; }).map(function (p) {
        var s = share(p.v, total);
        var rotulo = s >= (op.minRotulo || 9) ? pct(s) : "";
        return '<div class="' + (p.escuro ? "escuro" : "") + (rotulo ? "" : " sem-rotulo") + '" style="flex:' + p.v + " 1 0;background:" + p.cor +
          '" data-dica="' + esc(p.nome + ": " + p.v + " (" + pct(s) + ")") + '">' + rotulo + "</div>";
      }).join("") + "</div>";
  }

  // ------------------------------------------------------------ gráficos SVG

  // Linhas: x categórico (1..5), y 0–100 %. Pontos sem dados interrompem a linha.
  function svgCalibracao(cal) {
    var W = 560, H = 270, m = { e: 48, d: 16, t: 14, b: 46 };
    var iw = W - m.e - m.d, ih = H - m.t - m.b;
    var x = function (k) { return m.e + (k - 1) / 4 * iw; };
    var y = function (v) { return m.t + ih - v / 100 * ih; };
    var g = '<svg class="grafico" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Acerto por nível de certeza declarada">';
    [0, 25, 50, 75, 100].forEach(function (v) {
      g += '<line class="' + (v ? "grade-l" : "eixo-l") + '" x1="' + m.e + '" x2="' + (W - m.d) + '" y1="' + y(v) + '" y2="' + y(v) + '"/>' +
        '<text x="' + (m.e - 10) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="12">' + v + "%</text>";
    });
    for (var k = 1; k <= 5; k++) {
      g += '<text x="' + x(k) + '" y="' + (H - m.b + 20) + '" text-anchor="middle" font-size="12">' + k + "</text>";
    }
    g += '<text x="' + (m.e + iw / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="12">Certeza declarada (1 = nenhuma · 5 = total)</text>';
    COND.forEach(function (c) {
      var d = "", pts = "";
      for (var k = 1; k <= 5; k++) {
        var o = cal[c.id][k];
        if (!o || !o.n) { d += " "; continue; }
        d += (d.trim() === "" || d.slice(-1) === " " ? "M" : "L") + x(k) + "," + y(o.pct);
        pts += '<circle cx="' + x(k) + '" cy="' + y(o.pct) + '" r="5" fill="' + c.cor + '" stroke="#fff" stroke-width="2" data-dica="' +
          esc(c.nome + " · certeza " + k + ": " + pct(o.pct) + " de acerto (" + o.acertos + " de " + o.n + " respostas)") + '"/>';
      }
      g += '<path d="' + d.trim() + '" fill="none" stroke="' + c.cor + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' + pts;
    });
    return g + "</svg>";
  }

  // Pontos empilhados de 0 a 100 com média e linha de referência.
  function svgPontos(valores, op) {
    var W = 640, m = { e: 16, d: 16 };
    var iw = W - m.e - m.d;
    var x = function (v) { return m.e + v / 100 * iw; };
    var pilha = {}, maxPilha = 1;
    valores.forEach(function (v) { pilha[v] = (pilha[v] || 0) + 1; maxPilha = Math.max(maxPilha, pilha[v]); });
    var r = 6, passo = 2 * r + 2;
    var base = 30 + maxPilha * passo;
    var H = base + 50;
    var g = '<svg class="grafico" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="' + esc(op.rotulo) + '">';
    [0, 25, 50, 75, 100].forEach(function (v) {
      g += '<line class="grade-l" x1="' + x(v) + '" x2="' + x(v) + '" y1="18" y2="' + base + '"/>' +
        '<text x="' + x(v) + '" y="' + (base + 20) + '" text-anchor="middle" font-size="12">' + v + "</text>";
    });
    g += '<line class="eixo-l" x1="' + m.e + '" x2="' + (W - m.d) + '" y1="' + base + '" y2="' + base + '"/>';
    if (op.referencia !== undefined) {
      g += '<line x1="' + x(op.referencia) + '" x2="' + x(op.referencia) + '" y1="12" y2="' + base + '" stroke="#0f172a" stroke-width="1.5" stroke-dasharray="4 3"/>' +
        '<text x="' + (x(op.referencia) + 6) + '" y="22" font-size="12" style="fill:#0f172a">' + esc(op.rotuloReferencia) + "</text>";
    }
    var feitos = {};
    valores.forEach(function (v) {
      feitos[v] = (feitos[v] || 0) + 1;
      var cy = base - r - 2 - (feitos[v] - 1) * passo;
      g += '<circle cx="' + x(v) + '" cy="' + cy + '" r="' + r + '" fill="' + op.cor + '" stroke="#fff" stroke-width="2" data-dica="' + esc(op.nomeValor + ": " + fmt(v)) + '"/>';
    });
    if (op.media !== null && op.media !== undefined) {
      g += '<line x1="' + x(op.media) + '" x2="' + x(op.media) + '" y1="18" y2="' + base + '" stroke="' + op.cor + '" stroke-width="2" stroke-opacity=".55"/>' +
        '<text x="' + x(op.media) + '" y="' + (base + 40) + '" text-anchor="middle" font-size="12" font-weight="600" style="fill:#0f172a">média ' + fmt(op.media) + "</text>";
    }
    return g + "</svg>";
  }

  // Likert divergente: discordância à esquerda, concordância à direita, neutro centrado.
  function likertDivergente(itens) {
    var cores = ["var(--lk-1)", "var(--lk-2)", "var(--lk-3)", "var(--lk-4)", "var(--lk-5)"];
    var html = legenda(D.escala.map(function (n, i) { return { nome: (i + 1) + " · " + n, cor: cores[i] }; })) + '<div class="barras">';
    itens.forEach(function (it) {
      var tot = soma(it.dist);
      var p = [1, 2, 3, 4, 5].map(function (k) { return share(it.dist[k] || 0, tot); });
      var esquerda = p[0] + p[1] + p[2] / 2;
      var inicio = 50 - esquerda / 2;
      var segs = "", acc = inicio;
      p.forEach(function (v, i) {
        if (v > 0) {
          segs += '<div class="barra" style="position:absolute;left:' + acc + "%;width:calc(" + (v / 2) + "% - 2px);border-radius:3px;background:" + cores[i] +
            '" data-dica="' + esc(it.rot + " · " + D.escala[i] + ": " + (it.dist[i + 1] || 0) + " (" + pct(v) + ")") + '"></div>';
        }
        acc += v / 2;
      });
      html += '<div class="barra-grupo"><div class="barra-cat">' + esc(it.rot) + "<small>média " + fmt(it.media, 2) + " · concordam " + pct(p[3] + p[4]) + "</small></div>" +
        '<div class="barra-linha"><div class="barra-trilho" style="height:22px"><span style="position:absolute;left:50%;top:-4px;bottom:-4px;width:1px;background:var(--eixo)"></span>' +
        segs + '</div><span class="barra-val">' + pct(p[3] + p[4]) + "</span></div></div>";
    });
    return html + '</div><div class="escala-x" aria-hidden="true"><div></div><div><div class="ticks"><span>100%</span><span>50%</span><span>0</span><span>50%</span><span>100%</span></div><span></span></div></div>';
  }

  // ------------------------------------------------------------ seções

  function situacao(ok, texto) {
    if (ok === null) return '<span class="situacao pendente">' + (texto || "Sem dados") + "</span>";
    return '<span class="situacao ' + (ok ? "ok" : "falha") + '">' + (texto || (ok ? "Alcançada" : "Não alcançada")) + "</span>";
  }

  function secao(id, titulo, intro, corpo) {
    return '<section class="secao-painel" id="' + id + '"><h2>' + titulo + "</h2>" +
      (intro ? '<p class="secao-intro">' + intro + "</p>" : "") + '<div class="grade-figs">' + corpo + "</div></section>";
  }

  function indicador(rot, val, sub, cor) {
    return '<div class="indicador"><div class="indicador-rot">' + (cor ? '<span class="marca-serie" style="background:' + cor + '"></span>' : "") + rot +
      '</div><div class="indicador-val">' + val + "</div>" + (sub ? '<div class="indicador-sub">' + sub + "</div>" : "") + "</div>";
  }

  function render(m) {
    nFig = 0; nTab = 0;
    fonte = m.demo ? "Fonte: dados fictícios de demonstração." : "Fonte: dados da pesquisa (" + new Date(m.geradoEm).getFullYear() + ").";
    var cp = m.compreensao, pc = cp.porCondicao, sus = m.usabilidade.sus, fid = m.fidelidade;
    var html = "";

    if (m.demo) {
      html += '<div class="faixa-demo"><strong>Dados fictícios.</strong> Esta é a demonstração do painel, gerada por ferramentas/gerar-demo.js. Não use estas figuras no trabalho.</div>';
    }

    // ---------------- visão geral e metas
    var m1 = m.n.leigos >= METAS.leigos && m.n.avaliadores >= METAS.avaliadores;
    var m2 = pc.plenaria.n ? pc.plenaria.media >= METAS.acertoPlenaria : null;
    var m3 = pc.plenaria.n && pc.oficial.n ? pc.plenaria.media > pc.oficial.media : null;
    var m4 = m.percepcao.clareza.n ? m.percepcao.clareza.media >= METAS.clareza : null;
    var m5 = sus.n ? sus.media >= METAS.sus : null;
    var m6 = fid.total.total ? fid.total.resultadoDivergente === 0 && fid.total.pctSustentada >= METAS.sustentadas : null;

    var visao = '<div class="indicadores largura-total">' +
      indicador("Participantes leigos", fmt(m.n.leigos, 0), "meta: " + METAS.leigos) +
      indicador("Avaliadores", fmt(m.n.avaliadores, 0), m.n.fichas + " fichas · meta: " + METAS.avaliadores) +
      indicador("Acerto com o registro oficial", pct(pc.oficial.media), "DP " + fmt(pc.oficial.dp) + " · n = " + pc.oficial.n, "var(--s-oficial)") +
      indicador("Acerto com o plenarIA", pct(pc.plenaria.media), "DP " + fmt(pc.plenaria.dp) + " · n = " + pc.plenaria.n, "var(--s-plenaria)") +
      indicador("SUS médio", fmt(sus.media), sus.n ? "DP " + fmt(sus.dp) + " · n = " + sus.n : "não aplicada") +
      indicador("Afirmações sustentadas", pct(fid.total.pctSustentada), fid.total.total + " afirmações classificadas") +
      "</div>";

    visao += tabela("Resultados em relação às metas", [{ t: "Meta" }, { t: "Indicador" }, { t: "Resultado obtido" }, { t: "Situação" }], [
      ["M1", "≥ " + METAS.leigos + " participantes leigos e ≥ " + METAS.avaliadores + " avaliadores", m.n.leigos + " leigos; " + m.n.avaliadores + " avaliadores (" + m.n.fichas + " fichas)", situacao(m1)],
      ["M2", "Acerto médio ≥ " + METAS.acertoPlenaria + "% após a leitura do plenarIA", pct(pc.plenaria.media) + " (DP " + fmt(pc.plenaria.dp) + ")", situacao(m2)],
      ["M3", "Acerto com o plenarIA superior ao acerto com o registro oficial", "plenarIA " + pct(pc.plenaria.media) + " · registro oficial " + pct(pc.oficial.media), situacao(m3)],
      ["M4", "Média ≥ " + METAS.clareza + " nos itens de clareza (R1–R3)", fmt(m.percepcao.clareza.media, 2) + " (DP " + fmt(m.percepcao.clareza.dp, 2) + ")", situacao(m4)],
      ["M5", "SUS médio ≥ " + METAS.sus, sus.n ? fmt(sus.media) + " (DP " + fmt(sus.dp) + "; n = " + sus.n + ")" : "não aplicada", situacao(m5, sus.n ? null : "Não aplicada")],
      ["M6", "Nenhum resultado divergente e ≥ " + METAS.sustentadas + "% das afirmações sustentadas",
        fid.total.resultadoDivergente + " divergência(s); " + pct(fid.total.pctSustentada) + " sustentadas", situacao(m6)]
    ], { quadro: "2", nota: "Numeração do Quadro 2 conforme o relatório extensionista. M1 segue o tamanho ajustado com o orientador (ALINHAMENTO.md)." });
    html += secao("visao", "Visão geral", "Indicadores principais e situação de cada meta definida antes da aplicação.", visao);

    // ---------------- participantes
    var perfil = '<div class="multiplos">' + D.perfil.filter(function (p) { return p.id !== "P3"; }).map(function (p) {
      var cont = m.perfil[p.id] || {};
      var tot = soma(cont);
      var ordem = p.opcoes.slice();
      Object.keys(cont).forEach(function (k) { if (ordem.indexOf(k) < 0) ordem.push(k); });
      return '<div class="multiplo"><h3>' + esc(p.texto) + "</h3>" + barrasSimples(ordem.map(function (o) {
        var v = cont[o] || 0;
        return { rot: o, v: v, txt: v + " (" + pct(share(v, tot)) + ")" };
      }), { max: Math.max(1, tot) }) + "</div>";
    }).join("") + "</div>";
    var part = figura("Perfil dos participantes leigos", perfil, { largo: true, nota: "n = " + m.n.leigos + ". Escala das barras: proporção do total de participantes." });
    var versoes = [1, 2, 3, 4].map(function (v) { return ["Versão " + v, D.versoes[v].map(function (p) { return D.julgamentos[p[0]].rotulo.replace("Julgamento ", "") + " · " + (p[1] === "plenaria" ? "plenarIA" : "registro oficial"); }).join(" → "), fmt(m.n.porVersao[v] || 0, 0)]; });
    part += tabela("Distribuição dos participantes pelas versões do formulário", [{ t: "Versão" }, { t: "Leituras (julgamento · material)" }, { t: "Participantes", n: true }], versoes, {
      largo: false, nota: "Modalidade: " + Object.keys(m.n.porModalidade).map(function (k) { return k + " " + m.n.porModalidade[k]; }).join("; ") + "."
    });
    part += tabela("Avaliadores com formação jurídica", [{ t: "Formação" }, { t: "Avaliadores", n: true }],
      Object.keys(m.n.avaliadoresPorFormacao).map(function (k) { return [esc(k), m.n.avaliadoresPorFormacao[k]]; }).concat([["<strong>Total</strong>", "<strong>" + m.n.avaliadores + "</strong>"]]),
      { largo: false, nota: "Cada avaliador classificou os dois resumos (" + m.n.fichas + " fichas)." });
    html += secao("participantes", "Participantes", "Caracterização do público leigo e dos avaliadores.", part);

    // ---------------- compreensão
    var grupos = ["Q1", "Q2", "Q3", "Q4"].map(function (q) {
      var o = cp.porPergunta[q];
      return { cat: q, sub: PERGUNTAS[q], valores: { oficial: o.oficial.pct, plenaria: o.plenaria.pct },
        dicas: { oficial: o.oficial.acertos + " de " + o.oficial.n, plenaria: o.plenaria.acertos + " de " + o.plenaria.n } };
    });
    var maiorDif = grupos.slice().sort(function (a, b) {
      return Math.abs((b.valores.plenaria || 0) - (b.valores.oficial || 0)) - Math.abs((a.valores.plenaria || 0) - (a.valores.oficial || 0));
    })[0];
    var comp = figura("Proporção de acertos por pergunta, segundo o material lido", barrasAgrupadas(grupos, COND), {
      nota: "Respostas “Não sei” contam como não acerto. Maior diferença entre as condições: " + maiorDif.cat + " (" + maiorDif.sub.toLowerCase() + ").",
      dados: tabelaSimples(["Pergunta", "Registro oficial", "plenarIA"], grupos.map(function (g) {
        return [g.cat + " · " + g.sub, pct(g.valores.oficial) + " (" + g.dicas.oficial + ")", pct(g.valores.plenaria) + " (" + g.dicas.plenaria + ")"];
      }))
    });
    var gj = ["A", "B"].map(function (j) {
      var o = cp.porJulgamento[j];
      return { cat: D.julgamentos[j].rotulo, sub: D.julgamentos[j].sessao.split(",")[0], valores: { oficial: o.oficial.media, plenaria: o.plenaria.media },
        dicas: { oficial: "n = " + o.oficial.n, plenaria: "n = " + o.plenaria.n } };
    });
    gj.push({ cat: "Geral", sub: "média por participante", valores: { oficial: pc.oficial.media, plenaria: pc.plenaria.media }, dicas: { oficial: "n = " + pc.oficial.n, plenaria: "n = " + pc.plenaria.n } });
    comp += figura("Acerto médio por julgamento e material lido", barrasAgrupadas(gj, COND), {
      nota: "Controle do delineamento: se um julgamento for muito mais difícil que o outro, a diferença aparece aqui.",
      dados: tabelaSimples(["", "Registro oficial", "plenarIA"], ["A", "B"].map(function (j) {
        var o = cp.porJulgamento[j];
        return [D.julgamentos[j].rotulo, pct(o.oficial.media) + " (DP " + fmt(o.oficial.dp) + "; n = " + o.oficial.n + ")", pct(o.plenaria.media) + " (DP " + fmt(o.plenaria.dp) + "; n = " + o.plenaria.n + ")"];
      }))
    });
    var pa = cp.pareado;
    var figPareado = function () { return figura("Comparação dentro do mesmo participante",
      '<div class="segmentada-linha"><div class="rot">Participantes<small>n = ' + pa.n + "</small></div>" + segmentada([
        { nome: "Acertou mais com o plenarIA", v: pa.melhorPlenaria, cor: "var(--s-plenaria)" },
        { nome: "Acertou igual nas duas leituras", v: pa.igual, cor: "var(--lk-3)", escuro: true },
        { nome: "Acertou mais com o registro oficial", v: pa.melhorOficial, cor: "var(--s-oficial)" }
      ]) + "</div>" + legenda([
        { nome: "Acertou mais com o plenarIA (" + pa.melhorPlenaria + ")", cor: "var(--s-plenaria)" },
        { nome: "Igual (" + pa.igual + ")", cor: "var(--lk-3)" },
        { nome: "Acertou mais com o registro oficial (" + pa.melhorOficial + ")", cor: "var(--s-oficial)" }
      ]), { nota: "Diferença média (plenarIA − registro oficial): " + fmt(pa.media) + " pontos percentuais (DP " + fmt(pa.dp) + "; mediana " + fmt(pa.mediana) + ")." }); };
    comp += figura("Acerto segundo a certeza declarada", legenda(COND) + svgCalibracao(cp.calibracao), {
      nota: "Respostas erradas com certeza 4 ou 5 — registro oficial: " + cp.certezaAlta.oficial.erradasAltaCerteza + " (" + pct(cp.certezaAlta.oficial.pctDasErradas) +
        " das erradas); plenarIA: " + cp.certezaAlta.plenaria.erradasAltaCerteza + " (" + pct(cp.certezaAlta.plenaria.pctDasErradas) + " das erradas).",
      dados: tabelaSimples(["Certeza", "Registro oficial", "plenarIA"], [1, 2, 3, 4, 5].map(function (k) {
        var o = cp.calibracao.oficial[k], p = cp.calibracao.plenaria[k];
        return [k, pct(o.pct) + " (" + o.acertos + "/" + o.n + ")", pct(p.pct) + " (" + p.acertos + "/" + p.n + ")"];
      }))
    });
    comp += figura("Respostas erradas dadas com certeza alta e respostas “Não sei”", barrasAgrupadas([
      { cat: "Erradas com certeza 4–5", sub: "% de todas as respostas", valores: { oficial: cp.certezaAlta.oficial.pctDasRespostas, plenaria: cp.certezaAlta.plenaria.pctDasRespostas },
        dicas: { oficial: cp.certezaAlta.oficial.erradasAltaCerteza + " de " + cp.certezaAlta.oficial.respostas, plenaria: cp.certezaAlta.plenaria.erradasAltaCerteza + " de " + cp.certezaAlta.plenaria.respostas } },
      { cat: "“Não sei”", sub: "% de todas as respostas", valores: { oficial: cp.naoSei.oficial.pct, plenaria: cp.naoSei.plenaria.pct },
        dicas: { oficial: cp.naoSei.oficial.naoSei + " de " + cp.naoSei.oficial.respostas, plenaria: cp.naoSei.plenaria.naoSei + " de " + cp.naoSei.plenaria.respostas } }
    ], COND, { max: Math.max(20, Math.ceil(Math.max(cp.certezaAlta.oficial.pctDasRespostas || 0, cp.certezaAlta.plenaria.pctDasRespostas || 0, cp.naoSei.oficial.pct || 0, cp.naoSei.plenaria.pct || 0) / 20) * 20) }),
    { nota: "Uma resposta errada dada com segurança é o pior caso para um produto de transparência." });
    var ts = cp.tempoSegundos;
    var maxT = Math.max(60, Math.ceil(Math.max(ts.oficial.media || 0, ts.plenaria.media || 0) / 60) * 60);
    comp += figPareado();
    comp += figura("Tempo médio de leitura, segundo o material", barrasAgrupadas([
      { cat: "Tempo de leitura", sub: "média por leitura", valores: { oficial: ts.oficial.media, plenaria: ts.plenaria.media },
        dicas: { oficial: "mediana " + tempo(ts.oficial.mediana), plenaria: "mediana " + tempo(ts.plenaria.mediana) } }
    ], COND, { max: maxT, fmt: tempo, semEscala: true }), {
      nota: "Registro oficial: mediana " + tempo(ts.oficial.mediana) + " (mín. " + tempo(ts.oficial.min) + ", máx. " + tempo(ts.oficial.max) + "). plenarIA: mediana " +
        tempo(ts.plenaria.mediana) + " (mín. " + tempo(ts.plenaria.min) + ", máx. " + tempo(ts.plenaria.max) + "). Medido do aparecimento do texto ao clique em “Terminei a leitura”."
    });
    comp += tabela("Acerto nas perguntas objetivas por condição", [{ t: "Condição" }, { t: "n", n: true }, { t: "Média", n: true }, { t: "DP", n: true }, { t: "Mediana", n: true }, { t: "Mín.–máx.", n: true }],
      COND.map(function (c) { var e = pc[c.id]; return [c.nome, e.n, pct(e.media), fmt(e.dp), pct(e.mediana), pct(e.min) + " – " + pct(e.max)]; })
        .concat([["Diferença pareada (plenarIA − oficial)", pa.n, fmt(pa.media) + " p.p.", fmt(pa.dp), fmt(pa.mediana) + " p.p.", fmt(pa.min) + " – " + fmt(pa.max)]]),
      { nota: "Acerto por participante = acertos ÷ 4 perguntas do julgamento lido naquela condição. Análise descritiva, sem teste de hipótese (n ≈ 20)." });
    comp += tabelaDistribuicao(cp.distribuicao);
    html += secao("compreensao", "Compreensão (RQ3)", "Cada participante leu um julgamento pelo registro oficial e o outro pelo resumo do plenarIA, e respondeu sem consultar o texto.", comp);

    // ---------------- percepção
    var it = m.percepcao.itens;
    var perc = figura("Percepção sobre o resumo do plenarIA", likertDivergente(D.percepcao.map(function (t, i) {
      var o = it["R" + (i + 1)];
      return { rot: "R" + (i + 1) + ". " + t, dist: o.dist, media: o.media };
    })), {
      largo: true, nota: "Escala de 1 (discordo totalmente) a 5 (concordo totalmente). À direita, proporção que concorda (4 ou 5). Clareza (R1–R3): média " + fmt(m.percepcao.clareza.media, 2) + " (DP " + fmt(m.percepcao.clareza.dp, 2) + ").",
      dados: tabelaSimples(["Item", "n", "Média", "DP", "1", "2", "3", "4", "5"], D.percepcao.map(function (t, i) {
        var o = it["R" + (i + 1)];
        return ["R" + (i + 1), o.n, fmt(o.media, 2), fmt(o.dp, 2), o.dist[1], o.dist[2], o.dist[3], o.dist[4], o.dist[5]];
      }))
    });
    var r6 = m.percepcao.R6, totR6 = soma(r6);
    perc += figura("Qual dos dois textos foi mais fácil de entender", barrasSimples(D.r6.opcoes.map(function (o) {
      var v = r6[o] || 0;
      return { rot: o, v: v, txt: v + " (" + pct(share(v, totR6)) + ")" };
    }), { max: Math.max(1, totR6) }), { nota: "n = " + totR6 + "." });
    perc += tabela("Itens do questionário de percepção", [{ t: "Item" }, { t: "n", n: true }, { t: "Média", n: true }, { t: "DP", n: true }, { t: "Mediana", n: true }],
      D.percepcao.map(function (t, i) { var o = it["R" + (i + 1)]; return ["R" + (i + 1) + ". " + esc(t), o.n, fmt(o.media, 2), fmt(o.dp, 2), fmt(o.mediana)]; })
        .concat([["<strong>Clareza (média de R1–R3)</strong>", m.percepcao.clareza.n, "<strong>" + fmt(m.percepcao.clareza.media, 2) + "</strong>", fmt(m.percepcao.clareza.dp, 2), fmt(m.percepcao.clareza.mediana)]]),
      { largo: false });
    perc += listaAbertas("R7. " + D.r7, m.abertas.R7) + listaAbertas("R8. " + D.r8, m.abertas.R8);
    html += secao("percepcao", "Percepção do resumo", "Respostas do questionário de percepção (Instrumento 5). As respostas abertas aparecem em ordem aleatória, para a análise temática.", perc);

    // ---------------- usabilidade
    var tar = m.usabilidade.tarefa, totTar = soma(tar);
    var rotTarefa = { sim: "Concluiu", parcial: "Concluiu em parte", nao: "Não concluiu", pulada: "Pulou a etapa", indisponivel: "Site não abriu", nao_aplicada: "Não aplicada (fora da rede)", sem_registro: "Sem registro" };
    var corTarefa = { sim: "var(--st-bom)", parcial: "var(--st-alerta)", nao: "var(--st-critico)", pulada: "var(--st-neutro)", indisponivel: "#8f9bb0", nao_aplicada: "#d5dbe4", sem_registro: "#e8ecf2" };
    var ordemTar = ["sim", "parcial", "nao", "pulada", "indisponivel", "nao_aplicada", "sem_registro"];
    var partesTar = ordemTar.filter(function (k) { return tar[k]; }).map(function (k) {
      return { nome: rotTarefa[k], v: tar[k], cor: corTarefa[k], escuro: k === "parcial" || k === "nao_aplicada" || k === "sem_registro" || k === "pulada" };
    });
    var us = figura("Escore SUS por participante", svgPontos(sus.valores, {
      cor: "var(--s-plenaria)", referencia: METAS.sus, rotuloReferencia: "referência " + METAS.sus, media: sus.media, nomeValor: "Escore SUS", rotulo: "Escores SUS individuais"
    }), { nota: sus.n ? "n = " + sus.n + "; média " + fmt(sus.media) + " (DP " + fmt(sus.dp) + "; mediana " + fmt(sus.mediana) + "). Só quem fez a tarefa e respondeu a SUS." : "SUS não aplicada." });
    us += figura("Tarefa na área pública do plenarIA", '<div class="segmentada-linha"><div class="rot">Participantes<small>n = ' + totTar + "</small></div>" +
      segmentada(partesTar) + "</div>" + legenda(partesTar.map(function (p) { return { nome: p.nome + " (" + p.v + ")", cor: p.cor }; })) +
      tabelaSimples(["Parte da tarefa", "Conseguiu", "Não conseguiu"], [["Localizar a sessão", "localizar"], ["Abrir o resumo", "resumo"], ["Baixar a pauta", "pauta"]].map(function (e) {
        var o = m.usabilidade.etapas[e[1]] || {};
        return [e[0], o.sim || 0, o.nao || 0];
      })), { nota: "Autodeclaração do participante. “Pulou a etapa” e “Não aplicada” não respondem a SUS." });
    html += secao("usabilidade", "Usabilidade da área pública", "Tarefa no site do plenarIA (localizar a sessão, abrir o resumo e baixar a pauta) e System Usability Scale.", us);

    // ---------------- fidelidade
    var corFid = { "Sustentada": "var(--st-bom)", "Não sustentada": "var(--st-alerta)", "Contraditória": "var(--st-critico)" };
    var linhaFid = function (rot, sub, af) {
      return '<div class="segmentada-linha"><div class="rot">' + rot + "<small>" + sub + "</small></div>" + segmentada(["Sustentada", "Não sustentada", "Contraditória"].map(function (k) {
        return { nome: k, v: af[k] || 0, cor: corFid[k], escuro: k === "Não sustentada" };
      })) + "</div>";
    };
    var fd = figura("Classificação das afirmações dos resumos pelos avaliadores",
      linhaFid(D.julgamentos.A.rotulo, fid.A.total + " classificações", fid.A.afirmacoes) +
      linhaFid(D.julgamentos.B.rotulo, fid.B.total + " classificações", fid.B.afirmacoes) +
      linhaFid("Total", fid.total.total + " classificações", fid.total.afirmacoes) +
      legenda(["Sustentada", "Não sustentada", "Contraditória"].map(function (k) { return { nome: k, cor: corFid[k] }; })), {
        largo: true,
        nota: "Cada avaliador classificou todas as afirmações pré-extraídas de cada resumo. Resultado do julgamento divergente: " + fid.total.resultadoDivergente + " ficha(s).",
        dados: tabelaSimples(["Resumo", "Sustentadas", "Não sustentadas", "Contraditórias", "Total"], ["A", "B"].map(function (j) {
          var a = fid[j].afirmacoes;
          return [D.julgamentos[j].rotulo, a["Sustentada"] + " (" + pct(fid[j].pct.sustentada) + ")", a["Não sustentada"] + " (" + pct(fid[j].pct.naoSustentada) + ")", a["Contraditória"] + " (" + pct(fid[j].pct.contraditoria) + ")", fid[j].total];
        }))
      });
    fd += tabela("Elementos essenciais e linguagem dos resumos (avaliadores)", [{ t: "Item" }, { t: D.julgamentos.A.rotulo }, { t: D.julgamentos.B.rotulo }],
      D.elementos.map(function (e) {
        var f = function (j) { var c = fid[j].parteB[e.id] || {}; return e.opcoes.map(function (o) { return o + ": " + (c[o] || 0); }).join("<br>"); };
        return [e.id + ". " + esc(e.texto), f("A"), f("B")];
      }).concat(D.parteC.map(function (t, i) {
        var f = function (j) { var c = fid[j].parteC["C" + (i + 1)]; return "média " + fmt(c.media, 2) + " (DP " + fmt(c.dp, 2) + ")"; };
        return ["C" + (i + 1) + ". " + esc(t), f("A"), f("B")];
      })).concat([["Concordância entre avaliadores", pct(fid.A.concordancia.pct.media) + " (" + fid.A.concordancia.pares + " pares)", pct(fid.B.concordancia.pct.media) + " (" + fid.B.concordancia.pares + " pares)"],
        ["Tempo médio de avaliação", tempo(fid.A.tempoSegundos.media), tempo(fid.B.tempoSegundos.media)]]),
      { nota: "Concordância = proporção de afirmações classificadas da mesma forma por dois avaliadores, média entre os pares." });
    fd += tabelaProblemas(fid);
    fd += listaAbertas("Omissões relevantes apontadas — " + D.julgamentos.A.rotulo, fid.A.omissoes) + listaAbertas("Omissões relevantes apontadas — " + D.julgamentos.B.rotulo, fid.B.omissoes);
    if (fid.A.afirmacoesExtras.length || fid.B.afirmacoesExtras.length) {
      fd += listaAbertas("Afirmações acrescentadas pelos avaliadores", fid.A.afirmacoesExtras.concat(fid.B.afirmacoesExtras));
    }
    html += secao("fidelidade", "Fidelidade dos resumos (RQ2)", "Avaliação dos resumos por servidores da área judicial, comparando cada afirmação com o acórdão (Instrumento 7).", fd);

    saida.innerHTML = html;
    statusEl.classList.remove("erro");
    statusEl.textContent = (m.demo ? "Demonstração (dados fictícios). " : "") + "Atualizado em " + new Date(m.geradoEm).toLocaleString("pt-BR") + ".";
  }

  function tabelaDistribuicao(dist) {
    var linhas = [];
    ["A", "B"].forEach(function (j) {
      D.perguntas[j].forEach(function (q) {
        var base = q.comum ? D.comuns[q.comum] : q;
        var d = dist[j + "_" + q.id];
        var ops = base.opcoes.map(function (t, i) { return { v: String(i + 1), t: t }; }).concat([{ v: "NS", t: "Não sei" }]);
        ops.forEach(function (o, i) {
          var cel = '<span class="' + (d.correta === o.v ? "correta" : "") + '">' + o.v + ". " + esc(o.t) + "</span>";
          linhas.push([i === 0 ? "<strong>" + D.julgamentos[j].rotulo.replace("Julgamento ", "") + "-" + q.id + "</strong>" : "", cel, d.oficial[o.v] || 0, d.plenaria[o.v] || 0]);
        });
      });
    });
    return tabela("Distribuição das respostas por alternativa", [{ t: "Pergunta" }, { t: "Alternativa" }, { t: "Registro oficial", n: true }, { t: "plenarIA", n: true }], linhas,
      { nota: "Base para conferir, contra o resumo lido, se os erros na condição plenarIA foram induzidos pelo próprio resumo (guia, seção 6.2)." });
  }

  function tabelaProblemas(fid) {
    var linhas = [];
    ["A", "B"].forEach(function (j) {
      fid[j].porAfirmacao.forEach(function (o) {
        if (!o["Não sustentada"] && !o["Contraditória"]) return;
        linhas.push([D.julgamentos[j].rotulo.replace("Julgamento ", "") + "-" + o.n, esc(D.afirmacoes[j][o.n - 1] || ""), o["Sustentada"], o["Não sustentada"], o["Contraditória"]]);
      });
    });
    if (!linhas.length) linhas.push(["—", "Nenhuma afirmação classificada como não sustentada ou contraditória.", "", "", ""]);
    return tabela("Afirmações classificadas como não sustentadas ou contraditórias por ao menos um avaliador",
      [{ t: "Nº" }, { t: "Afirmação do resumo" }, { t: "Sust.", n: true }, { t: "Não sust.", n: true }, { t: "Contrad.", n: true }], linhas);
  }

  function listaAbertas(titulo, itens) {
    return '<div class="fig"><h3 class="fig-titulo" style="margin-bottom:.875rem">' + esc(titulo) + ' <span style="font-weight:400;color:var(--conteudo-suave)">(' + itens.length + " resposta" + (itens.length === 1 ? "" : "s") + ")</span></h3>" +
      (itens.length ? '<ul class="abertas">' + itens.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>" : '<p class="abertas-vazio">Nenhuma resposta.</p>') + "</div>";
  }

  // ------------------------------------------------------------ carregamento

  function vazio(msg) {
    saida.innerHTML = '<div class="vazio-painel"><h2>Nenhum resultado carregado</h2><p>' + msg + "</p></div>";
  }

  function carregar() {
    if (params.get("demo") === "1") {
      var s = document.createElement("script");
      s.src = "js/demo-metricas.js";
      s.onload = function () { render(window.DEMO_METRICAS); };
      s.onerror = function () { erro("Não foi possível carregar os dados de demonstração. Rode: node ferramentas/gerar-demo.js"); };
      document.body.appendChild(s);
      return;
    }
    var chave = campoChave.value.trim();
    if (!C.APPS_SCRIPT_URL) { erro("APPS_SCRIPT_URL não configurado em js/config.js."); return; }
    if (!chave) { erro("Informe a chave das métricas."); campoChave.focus(); return; }
    statusEl.classList.remove("erro");
    statusEl.textContent = "Carregando…";
    fetch(C.APPS_SCRIPT_URL + "?acao=metricas&chave=" + encodeURIComponent(chave))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) throw new Error(j.erro === "chave inválida" ? "Chave inválida." : j.erro);
        if (!j.metricas || !j.metricas.compreensao) throw new Error("O Apps Script publicado ainda é a versão antiga. Publique uma nova versão com Agregacao.gs (README §2).");
        try { sessionStorage.setItem(CH_CHAVE, chave); } catch (e) { /* sem armazenamento */ }
        btnAtualizar.hidden = false;
        render(j.metricas);
      })
      .catch(function (e) { erro(e.message || String(e)); });
  }

  function erro(msg) {
    statusEl.classList.add("erro");
    statusEl.textContent = msg;
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); carregar(); });
  btnAtualizar.addEventListener("click", carregar);

  // Dica flutuante para qualquer elemento com data-dica.
  var dica = document.getElementById("dica");
  document.addEventListener("mousemove", function (e) {
    var alvo = e.target.closest && e.target.closest("[data-dica]");
    if (!alvo) { dica.hidden = true; return; }
    dica.textContent = alvo.getAttribute("data-dica");
    dica.hidden = false;
    var x = Math.min(e.clientX + 14, innerWidth - dica.offsetWidth - 8);
    var y = e.clientY + 16 + dica.offsetHeight > innerHeight ? e.clientY - dica.offsetHeight - 12 : e.clientY + 16;
    dica.style.left = x + "px";
    dica.style.top = y + "px";
  });

  try { campoChave.value = sessionStorage.getItem(CH_CHAVE) || ""; } catch (e) { /* idem */ }
  if (params.get("demo") === "1") {
    form.hidden = true;
    carregar();
  } else if (campoChave.value) {
    carregar();
  } else {
    vazio("Informe a chave das métricas (Apps Script → Propriedades do script → CHAVE_METRICAS). Para ver o layout com dados fictícios, abra <a href=\"?demo=1\">metricas.html?demo=1</a>.");
  }
})();
