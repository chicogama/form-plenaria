/**
 * plenarIA — backend do formulário de validação (Google Apps Script ligado à planilha).
 *
 * Abas: respostas, avaliadores, presenca, gabarito.
 *
 * doPost  -> grava uma resposta (tipo: resposta | avaliador | presenca)
 * doGet   -> ?acao=versao              próxima versão (1..4) em rodízio
 *            ?acao=metricas&chave=...  apenas agregados (sem respostas individuais)
 *
 * Primeira vez: rode configurar() pelo editor e autorize.
 */

var COLUNAS = {
  respostas: ['ID', 'UUID', 'VERSAO', 'MODALIDADE', 'TIMESTAMP', 'INICIO', 'FIM',
    'P1', 'P2', 'P3', 'P4', 'P4_OUTRA', 'P5', 'P6', 'P6_OUTRA',
    'A_MATERIAL', 'B_MATERIAL', 'ORDEM',
    'A_Q1', 'A_Q2', 'A_Q3', 'A_Q4', 'B_Q1', 'B_Q2', 'B_Q3', 'B_Q4',
    'A_C1', 'A_C2', 'A_C3', 'A_C4', 'B_C1', 'B_C2', 'B_C3', 'B_C4',
    'A_TEMPO', 'B_TEMPO',
    'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8',
    'TAREFA', 'TAREFA_LOCALIZAR', 'TAREFA_RESUMO', 'TAREFA_PAUTA',
    'SUS1', 'SUS2', 'SUS3', 'SUS4', 'SUS5', 'SUS6', 'SUS7', 'SUS8', 'SUS9', 'SUS10', 'SUS_ESCORE',
    'IMAGEM'],
  avaliadores: ['UUID', 'TIMESTAMP', 'MODALIDADE', 'CODIGO', 'FORMACAO', 'FORMACAO_OUTRA',
    'P1', 'P2', 'P4', 'P5', 'JULGAMENTO', 'ORDEM_AVALIACAO', 'TEMPO']
    .concat(seq_('AF', 20))
    .concat(['AF_EXTRA', 'B1', 'B2', 'B3', 'B4', 'B5', 'C1', 'C2', 'C3', 'OMISSOES', 'IMAGEM']),
  presenca: ['DATA', 'NOME', 'TELEFONE', 'EMAIL', 'IMAGEM', 'OBS'],
  gabarito: ['JULGAMENTO', 'PERGUNTA', 'RESPOSTA', 'DESCRICAO']
};

function seq_(prefixo, n) {
  var r = [];
  for (var i = 1; i <= n; i++) r.push(prefixo + (i < 10 ? '0' + i : i));
  return r;
}

/** Cria as abas, os cabeçalhos e regrava o gabarito. Pode rodar mais de uma vez. */
function configurar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(COLUNAS).forEach(function (nome) {
    var sh = ss.getSheetByName(nome) || ss.insertSheet(nome);
    sh.getRange(1, 1, 1, COLUNAS[nome].length).setValues([COLUNAS[nome]]).setFontWeight('bold');
    sh.setFrozenRows(1);
  });
  var g = ss.getSheetByName('gabarito');
  if (g.getLastRow() > 1) g.getRange(2, 1, g.getLastRow() - 1, 4).clearContent();
  g.getRange(2, 1, GABARITO.length, 4).setNumberFormat('@').setValues(GABARITO);

  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('CONTADOR_VERSAO')) props.setProperty('CONTADOR_VERSAO', '0');
  if (!props.getProperty('CHAVE_METRICAS')) {
    props.setProperty('CHAVE_METRICAS', Utilities.getUuid().slice(0, 8));
  }
  Logger.log('Pronto. Chave das métricas: ' + props.getProperty('CHAVE_METRICAS'));
}

/** Zera o rodízio de versões (use depois do teste piloto). */
function zerarContadorVersao() {
  PropertiesService.getScriptProperties().setProperty('CONTADOR_VERSAO', '0');
}

// ---------------------------------------------------------------- HTTP

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.acao === 'versao') return json_(proximaVersao_(p.piloto === '1'));
    if (p.acao === 'metricas') {
      var chave = PropertiesService.getScriptProperties().getProperty('CHAVE_METRICAS');
      if (!chave || p.chave !== chave) return json_({ ok: false, erro: 'chave inválida' });
      return json_({ ok: true, metricas: metricas_() });
    }
    return json_({ ok: true, servico: 'plenarIA validação' });
  } catch (err) {
    return json_({ ok: false, erro: String(err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var dados = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (dados.tipo === 'resposta') return json_(gravarResposta_(ss, dados.registro));
    if (dados.tipo === 'avaliador') return json_(gravarAvaliador_(ss, dados.linhas));
    if (dados.tipo === 'presenca') return json_(gravarPresenca_(ss, dados.registro));
    return json_({ ok: false, erro: 'tipo desconhecido' });
  } catch (err) {
    return json_({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function proximaVersao_(piloto) {
  if (piloto) return { ok: true, versao: 1 + Math.floor(Math.random() * 4), piloto: true };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var props = PropertiesService.getScriptProperties();
    var n = parseInt(props.getProperty('CONTADOR_VERSAO') || '0', 10);
    props.setProperty('CONTADOR_VERSAO', String(n + 1));
    return { ok: true, versao: (n % 4) + 1 };
  } finally {
    lock.releaseLock();
  }
}

function linha_(colunas, obj) {
  return colunas.map(function (c) {
    var v = obj[c];
    return v === undefined || v === null ? '' : v;
  });
}

function uuidsGravados_(sh, coluna) {
  var idx = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].indexOf(coluna);
  if (sh.getLastRow() < 2 || idx < 0) return [];
  return sh.getRange(2, idx + 1, sh.getLastRow() - 1, 1).getValues().map(function (r) { return String(r[0]); });
}

function gravarResposta_(ss, r) {
  var sh = ss.getSheetByName('respostas');
  var uuids = uuidsGravados_(sh, 'UUID');
  var pos = uuids.indexOf(String(r.UUID));
  if (pos >= 0) return { ok: true, id: sh.getRange(pos + 2, 1).getValue(), duplicado: true };

  var prefixo = r.MODALIDADE === 'piloto' ? 'T' : 'P';
  var ids = sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  var n = ids.filter(function (x) { return String(x[0]).charAt(0) === prefixo; }).length + 1;
  r.ID = prefixo + (n < 10 ? '0' + n : n);
  r.TIMESTAMP = new Date();
  sh.appendRow(linha_(COLUNAS.respostas, r));
  return { ok: true, id: r.ID };
}

function gravarAvaliador_(ss, linhas) {
  var sh = ss.getSheetByName('avaliadores');
  var chaves = uuidsGravados_(sh, 'UUID');
  var gravadas = 0;
  linhas.forEach(function (l) {
    var chave = l.UUID + '-' + l.JULGAMENTO;
    if (chaves.indexOf(chave) >= 0) return;
    l.UUID = chave;
    l.TIMESTAMP = new Date();
    sh.appendRow(linha_(COLUNAS.avaliadores, l));
    gravadas++;
  });
  return { ok: true, gravadas: gravadas };
}

/**
 * Lista de presença: grava só a data (sem hora) e reordena a aba por nome,
 * para que a ordem das linhas não permita ligar presença a respostas.
 */
function gravarPresenca_(ss, r) {
  var sh = ss.getSheetByName('presenca');
  r.DATA = Utilities.formatDate(new Date(), 'America/Belem', 'dd/MM/yyyy');
  sh.appendRow(linha_(COLUNAS.presenca, r));
  if (sh.getLastRow() > 2) {
    sh.getRange(2, 1, sh.getLastRow() - 1, COLUNAS.presenca.length).sort({ column: 2, ascending: true });
  }
  return { ok: true };
}

// ---------------------------------------------------------------- Métricas (agregados; ver Agregacao.gs)

function tabela_(ss, nome) {
  var sh = ss.getSheetByName(nome);
  if (!sh || sh.getLastRow() < 2) return [];
  var v = sh.getDataRange().getValues();
  var cab = v.shift();
  return v.map(function (l) {
    var o = {};
    cab.forEach(function (c, i) { o[c] = l[i]; });
    return o;
  });
}

function metricas_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return agregar_(tabela_(ss, 'respostas'), tabela_(ss, 'avaliadores'), tabela_(ss, 'gabarito'));
}
