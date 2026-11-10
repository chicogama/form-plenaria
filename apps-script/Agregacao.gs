/**
 * Agregação das métricas da validação — função pura, sem SpreadsheetApp.
 *
 * Usada pelo doGet (?acao=metricas) e pelo gerador de dados de demonstração
 * (ferramentas/gerar-demo.js), para que o painel e a planilha calculem igual.
 *
 * Entrada: linhas das abas como objetos { COLUNA: valor }.
 * Saída: só agregados (contagens, médias, distribuições). Exceções deliberadas:
 *   - respostas abertas (R7, R8, omissões, afirmação extra) em listas embaralhadas,
 *     sem nenhum outro campo, para a análise temática;
 *   - escores SUS individuais ordenados, sem vínculo com o participante.
 */
function agregar_(respostas, avaliadores, gabarito) {
  var AF = [];
  for (var k = 1; k <= 20; k++) AF.push('AF' + (k < 10 ? '0' + k : k));
  var CONDICOES = ['oficial', 'plenaria'];
  var J = ['A', 'B'];

  function vazio(v) { return v === '' || v === null || v === undefined; }
  function txt(v) { return vazio(v) ? '' : String(v).trim(); }
  function num(v) { var n = Number(v); return vazio(v) || isNaN(n) ? null : n; }
  function r2(x) { return x === null ? null : Math.round(x * 100) / 100; }

  function est(xs) {
    var v = xs.map(num).filter(function (x) { return x !== null; }).sort(function (a, b) { return a - b; });
    if (!v.length) return { n: 0, media: null, dp: null, mediana: null, min: null, max: null };
    var m = v.reduce(function (a, b) { return a + b; }, 0) / v.length;
    var dp = v.length > 1 ? Math.sqrt(v.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / (v.length - 1)) : 0;
    var meio = Math.floor(v.length / 2);
    var med = v.length % 2 ? v[meio] : (v[meio - 1] + v[meio]) / 2;
    return { n: v.length, media: r2(m), dp: r2(dp), mediana: r2(med), min: v[0], max: v[v.length - 1] };
  }

  function contar(xs) {
    var c = {};
    xs.forEach(function (x) { x = txt(x); if (x) c[x] = (c[x] || 0) + 1; });
    return c;
  }

  // Embaralhamento determinístico: a ordem das linhas da planilha não é revelada.
  function embaralhar(xs) {
    var a = xs.slice(), s = 2166136261;
    a.forEach(function (t) { for (var i = 0; i < t.length; i++) s = (s ^ t.charCodeAt(i)) * 16777619 >>> 0; });
    for (var i = a.length - 1; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      var j = s % (i + 1), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  var gab = {};
  gabarito.forEach(function (g) { gab[txt(g.JULGAMENTO) + '_' + txt(g.PERGUNTA)] = txt(g.RESPOSTA); });

  var resp = respostas.filter(function (r) { return txt(r.MODALIDADE) !== 'piloto'; });
  var aval = avaliadores.filter(function (r) { return txt(r.MODALIDADE) !== 'piloto'; });

  // ------------------------------------------------------------ compreensão
  var pctPorCond = { oficial: [], plenaria: [] };
  var pctPorJC = {};
  J.forEach(function (j) { CONDICOES.forEach(function (c) { pctPorJC[j + '_' + c] = []; }); });
  var porPergunta = {};
  var distribuicao = {};
  var calib = {};
  var certezaAlta = {};
  var naoSei = {};
  var tempos = { oficial: [], plenaria: [] };
  var pares = [];

  CONDICOES.forEach(function (c) {
    calib[c] = {};
    for (var n = 1; n <= 5; n++) calib[c][n] = { n: 0, acertos: 0 };
    certezaAlta[c] = { respostas: 0, erradas: 0, erradasAltaCerteza: 0 };
    naoSei[c] = { respostas: 0, naoSei: 0 };
  });
  for (var q = 1; q <= 4; q++) {
    porPergunta['Q' + q] = { oficial: { n: 0, acertos: 0 }, plenaria: { n: 0, acertos: 0 } };
    J.forEach(function (j) {
      distribuicao[j + '_Q' + q] = { correta: gab[j + '_Q' + q] || null, oficial: {}, plenaria: {} };
    });
  }

  resp.forEach(function (r) {
    var pctDoParticipante = {};
    J.forEach(function (j) {
      var c = txt(r[j + '_MATERIAL']);
      if (CONDICOES.indexOf(c) < 0) return;
      var acertos = 0;
      for (var q = 1; q <= 4; q++) {
        var chave = j + '_Q' + q;
        var dada = txt(r[chave]);
        if (!dada) continue;
        var ok = dada === gab[chave];
        if (ok) acertos++;
        porPergunta['Q' + q][c].n++;
        if (ok) porPergunta['Q' + q][c].acertos++;
        distribuicao[chave][c][dada] = (distribuicao[chave][c][dada] || 0) + 1;
        var cert = num(r[j + '_C' + q]);
        if (cert >= 1 && cert <= 5) { calib[c][cert].n++; if (ok) calib[c][cert].acertos++; }
        certezaAlta[c].respostas++;
        if (!ok) { certezaAlta[c].erradas++; if (cert >= 4) certezaAlta[c].erradasAltaCerteza++; }
        naoSei[c].respostas++;
        if (dada === 'NS') naoSei[c].naoSei++;
      }
      var pct = acertos / 4 * 100;
      pctPorCond[c].push(pct);
      pctPorJC[j + '_' + c].push(pct);
      pctDoParticipante[c] = pct;
      tempos[c].push(r[j + '_TEMPO']);
    });
    if (pctDoParticipante.oficial !== undefined && pctDoParticipante.plenaria !== undefined) {
      pares.push(pctDoParticipante.plenaria - pctDoParticipante.oficial);
    }
  });

  Object.keys(porPergunta).forEach(function (q) {
    CONDICOES.forEach(function (c) {
      var o = porPergunta[q][c];
      o.pct = o.n ? r2(o.acertos / o.n * 100) : null;
    });
  });
  CONDICOES.forEach(function (c) {
    for (var n = 1; n <= 5; n++) {
      var o = calib[c][n];
      o.pct = o.n ? r2(o.acertos / o.n * 100) : null;
    }
    var ca = certezaAlta[c];
    ca.pctDasErradas = ca.erradas ? r2(ca.erradasAltaCerteza / ca.erradas * 100) : null;
    ca.pctDasRespostas = ca.respostas ? r2(ca.erradasAltaCerteza / ca.respostas * 100) : null;
    naoSei[c].pct = naoSei[c].respostas ? r2(naoSei[c].naoSei / naoSei[c].respostas * 100) : null;
  });

  var pareado = est(pares);
  pareado.melhorPlenaria = pares.filter(function (d) { return d > 0; }).length;
  pareado.igual = pares.filter(function (d) { return d === 0; }).length;
  pareado.melhorOficial = pares.filter(function (d) { return d < 0; }).length;

  var porJulgamento = {};
  J.forEach(function (j) {
    porJulgamento[j] = {};
    CONDICOES.forEach(function (c) { porJulgamento[j][c] = est(pctPorJC[j + '_' + c]); });
  });

  // ------------------------------------------------------------ percepção
  var percepcao = {};
  for (var i = 1; i <= 5; i++) {
    var col = 'R' + i;
    var e = est(resp.map(function (r) { return r[col]; }));
    e.dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    resp.forEach(function (r) { var x = num(r[col]); if (x >= 1 && x <= 5) e.dist[x]++; });
    percepcao[col] = e;
  }
  var clareza = est(resp.map(function (r) {
    var xs = [r.R1, r.R2, r.R3].map(num).filter(function (x) { return x !== null; });
    return xs.length ? xs.reduce(function (a, b) { return a + b; }, 0) / xs.length : '';
  }));

  function abertas(col, linhas) {
    return embaralhar(linhas.map(function (r) { return txt(r[col]); }).filter(function (t) { return t.length > 0; }));
  }

  // ------------------------------------------------------------ usabilidade
  var susValores = resp.map(function (r) { return num(r.SUS_ESCORE); }).filter(function (x) { return x !== null; })
    .sort(function (a, b) { return a - b; });
  var sus = est(susValores);
  sus.valores = susValores;

  // ------------------------------------------------------------ fidelidade
  function fidelidade(linhas) {
    var cont = { 'Sustentada': 0, 'Não sustentada': 0, 'Contraditória': 0 };
    var porAfirmacao = AF.map(function () { return { 'Sustentada': 0, 'Não sustentada': 0, 'Contraditória': 0 }; });
    linhas.forEach(function (r) {
      AF.forEach(function (c, idx) {
        var v = txt(r[c]);
        if (cont[v] !== undefined) { cont[v]++; porAfirmacao[idx][v]++; }
      });
    });
    var total = cont['Sustentada'] + cont['Não sustentada'] + cont['Contraditória'];
    var conc = [];
    for (var a = 0; a < linhas.length; a++) {
      for (var b = a + 1; b < linhas.length; b++) {
        var iguais = 0, n = 0;
        AF.forEach(function (c) {
          var x = txt(linhas[a][c]), y = txt(linhas[b][c]);
          if (x && y) { n++; if (x === y) iguais++; }
        });
        if (n) conc.push(iguais / n * 100);
      }
    }
    var parteB = {}, parteC = {};
    ['B1', 'B2', 'B3', 'B4', 'B5'].forEach(function (c) { parteB[c] = contar(linhas.map(function (r) { return r[c]; })); });
    ['C1', 'C2', 'C3'].forEach(function (c) { parteC[c] = est(linhas.map(function (r) { return r[c]; })); });
    return {
      fichas: linhas.length,
      afirmacoes: cont,
      total: total,
      pct: {
        sustentada: total ? r2(cont['Sustentada'] / total * 100) : null,
        naoSustentada: total ? r2(cont['Não sustentada'] / total * 100) : null,
        contraditoria: total ? r2(cont['Contraditória'] / total * 100) : null
      },
      // n = número da afirmação na ficha (1, 2, ...), para casar com o texto em dados.js
      porAfirmacao: porAfirmacao.map(function (o, i) { o.n = i + 1; return o; })
        .filter(function (o) { return o['Sustentada'] + o['Não sustentada'] + o['Contraditória'] > 0; }),
      resultadoDivergente: linhas.filter(function (r) { return txt(r.B1) === 'Incorreto'; }).length,
      parteB: parteB,
      parteC: parteC,
      concordancia: { pares: conc.length, pct: est(conc) },
      tempoSegundos: est(linhas.map(function (r) { return r.TEMPO; })),
      omissoes: abertas('OMISSOES', linhas),
      afirmacoesExtras: abertas('AF_EXTRA', linhas)
    };
  }

  var fid = {};
  J.forEach(function (j) { fid[j] = fidelidade(aval.filter(function (r) { return txt(r.JULGAMENTO) === j; })); });
  var totalF = { 'Sustentada': 0, 'Não sustentada': 0, 'Contraditória': 0 };
  J.forEach(function (j) { Object.keys(totalF).forEach(function (k) { totalF[k] += fid[j].afirmacoes[k]; }); });
  var somaF = totalF['Sustentada'] + totalF['Não sustentada'] + totalF['Contraditória'];
  fid.total = {
    afirmacoes: totalF,
    total: somaF,
    pctSustentada: somaF ? r2(totalF['Sustentada'] / somaF * 100) : null,
    resultadoDivergente: fid.A.resultadoDivergente + fid.B.resultadoDivergente,
    resumosComDivergencia: (fid.A.resultadoDivergente ? 1 : 0) + (fid.B.resultadoDivergente ? 1 : 0)
  };

  var codigos = contar(aval.map(function (r) { return r.CODIGO; }));

  return {
    geradoEm: new Date().toISOString(),
    n: {
      leigos: resp.length,
      avaliadores: Object.keys(codigos).length,
      fichas: aval.length,
      porVersao: contar(resp.map(function (r) { return r.VERSAO; })),
      porModalidade: contar(resp.map(function (r) { return r.MODALIDADE; })),
      porOrdem: contar(resp.map(function (r) { return r.ORDEM; })),
      avaliadoresPorFormacao: contar(aval.filter(function (r) { return txt(r.JULGAMENTO) === 'A'; }).map(function (r) { return r.FORMACAO; }))
    },
    perfil: {
      P1: contar(resp.map(function (r) { return r.P1; })),
      P2: contar(resp.map(function (r) { return r.P2; })),
      P4: contar(resp.map(function (r) { return r.P4; })),
      P5: contar(resp.map(function (r) { return r.P5; })),
      P6: contar(resp.map(function (r) { return r.P6; }))
    },
    compreensao: {
      porCondicao: { oficial: est(pctPorCond.oficial), plenaria: est(pctPorCond.plenaria) },
      pareado: pareado,
      porPergunta: porPergunta,
      porJulgamento: porJulgamento,
      naoSei: naoSei,
      certezaAlta: certezaAlta,
      calibracao: calib,
      distribuicao: distribuicao,
      tempoSegundos: { oficial: est(tempos.oficial), plenaria: est(tempos.plenaria) }
    },
    percepcao: { itens: percepcao, clareza: clareza, R6: contar(resp.map(function (r) { return r.R6; })) },
    abertas: { R7: abertas('R7', resp), R8: abertas('R8', resp) },
    usabilidade: {
      sus: sus,
      tarefa: contar(resp.map(function (r) { return txt(r.TAREFA) || 'sem_registro'; })),
      etapas: {
        localizar: contar(resp.map(function (r) { return r.TAREFA_LOCALIZAR; })),
        resumo: contar(resp.map(function (r) { return r.TAREFA_RESUMO; })),
        pauta: contar(resp.map(function (r) { return r.TAREFA_PAUTA; }))
      }
    },
    fidelidade: fid
  };
}
