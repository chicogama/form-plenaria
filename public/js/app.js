/*
 * Fluxo do formulário de validação do plenarIA.
 *
 * Rota leiga:     boas-vindas → TCLE → contato → perfil → instruções → leitura 1 → perguntas 1
 *                 → leitura 2 → perguntas 2 → tarefa no plenarIA → SUS → percepção → envio
 * Rota avaliador: (perfil com P3 = Sim, ou ?rota=avaliador) → código e formação
 *                 → avaliação do 1º resumo → avaliação do 2º resumo → envio
 *
 * Parâmetros de URL: ?modalidade=online | ?piloto=1 | ?rota=avaliador | ?versao=1..4
 */
(function () {
  "use strict";

  var D = window.DADOS;
  var C = window.CONFIG;
  var app = document.getElementById("app");
  var trilho = document.getElementById("trilho");
  var etapaNome = document.getElementById("etapa-nome");
  var etapaNum = document.getElementById("etapa-num");
  var params = new URLSearchParams(location.search);

  var CH_ESTADO = "plenaria_estado";
  var CH_PENDENTES = "plenaria_pendentes";
  var CH_COPIA = "plenaria_copia";

  // ------------------------------------------------------------ armazenamento

  function ler(area, chave, padrao) {
    try {
      var v = window[area].getItem(chave);
      return v ? JSON.parse(v) : padrao;
    } catch (e) { return padrao; }
  }
  function gravar(area, chave, valor) {
    try { window[area].setItem(chave, JSON.stringify(valor)); } catch (e) { /* sem armazenamento */ }
  }
  function apagar(area, chave) {
    try { window[area].removeItem(chave); } catch (e) { /* idem */ }
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function novoEstado() {
    return {
      uuid: uuid(),
      passo: "boasvindas",
      modalidade: params.get("piloto") === "1" ? "piloto" : (params.get("modalidade") || "presencial"),
      rotaForcada: params.get("rota") === "avaliador",
      // ?semtarefa=1: aplicação fora da rede do TRE; a tarefa no site e a SUS não aparecem.
      semTarefa: params.get("semtarefa") === "1",
      inicio: new Date().toISOString(),
      r: {},
      versao: null,
      leituraIdx: 0,
      t0: null,
      av: { ordem: Math.random() < 0.5 ? ["A", "B"] : ["B", "A"], idx: 0, dados: {} }
    };
  }

  var S = ler("sessionStorage", CH_ESTADO, null) || novoEstado();
  function salvar() { gravar("sessionStorage", CH_ESTADO, S); }

  // ------------------------------------------------------------ comunicação

  function postar(payload) {
    if (!C.APPS_SCRIPT_URL) return Promise.reject(new Error("modo local"));
    var ctrl = new AbortController();
    var t = setTimeout(function () { ctrl.abort(); }, C.TIMEOUT_MS);
    return fetch(C.APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      signal: ctrl.signal
    }).then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) throw new Error(j.erro || "erro no servidor");
        return j;
      })
      .finally(function () { clearTimeout(t); });
  }

  function obterVersao() {
    var manual = parseInt(params.get("versao"), 10);
    if (manual >= 1 && manual <= 4) return Promise.resolve({ versao: manual, fonte: "manual" });
    var sorteio = { versao: 1 + Math.floor(Math.random() * 4), fonte: "sorteio" };
    if (!C.APPS_SCRIPT_URL) return Promise.resolve(sorteio);
    var url = C.APPS_SCRIPT_URL + "?acao=versao" + (S.modalidade === "piloto" ? "&piloto=1" : "");
    var ctrl = new AbortController();
    var t = setTimeout(function () { ctrl.abort(); }, C.TIMEOUT_MS);
    return fetch(url, { signal: ctrl.signal })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.ok && j.versao >= 1 && j.versao <= 4) return { versao: j.versao, fonte: "rodizio" };
        return sorteio;
      })
      .catch(function () { return sorteio; })
      .finally(function () { clearTimeout(t); });
  }

  // Fila de envios pendentes (sobrevive a recarregar a página e a quedas de rede).
  function enfileirar(payload) {
    var fila = ler("localStorage", CH_PENDENTES, []);
    fila.push({ chave: uuid(), payload: payload, criado: new Date().toISOString() });
    gravar("localStorage", CH_PENDENTES, fila);
  }

  function guardarCopia(payload) {
    var copia = ler("localStorage", CH_COPIA, []);
    copia.push(payload);
    gravar("localStorage", CH_COPIA, copia);
  }

  var enviando = false;
  function enviarPendentes() {
    if (enviando || !C.APPS_SCRIPT_URL) return Promise.resolve(ler("localStorage", CH_PENDENTES, []).length);
    enviando = true;
    var fila = ler("localStorage", CH_PENDENTES, []);
    var restantes = [];
    return fila.reduce(function (p, item) {
      return p.then(function () {
        return postar(item.payload).catch(function () { restantes.push(item); });
      });
    }, Promise.resolve()).then(function () {
      // Mantém itens que entraram na fila durante o envio.
      var atual = ler("localStorage", CH_PENDENTES, []);
      var enviados = fila.filter(function (i) { return restantes.indexOf(i) < 0; }).map(function (i) { return i.chave; });
      var novos = atual.filter(function (i) { return enviados.indexOf(i.chave) < 0; });
      gravar("localStorage", CH_PENDENTES, novos);
      enviando = false;
      return novos.length;
    });
  }

  // ------------------------------------------------------------ utilitários de tela

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function radios(nome, legenda, opcoes, op) {
    op = op || {};
    var valores = op.valores || opcoes;
    var html = '<fieldset class="pergunta" data-obrig data-grupo="' + nome + '"><legend>' + legenda + "</legend>";
    opcoes.forEach(function (t, i) {
      html += '<label class="opcao"><input type="radio" name="' + nome + '" value="' + esc(valores[i]) + '"><span>' + esc(t) + "</span></label>";
    });
    if (op.naoSei) html += '<label class="opcao"><input type="radio" name="' + nome + '" value="NS"><span>Não sei</span></label>';
    if (op.outra) html += '<input type="text" class="outra" name="' + nome + '_OUTRA" placeholder="Se marcou &quot;' + esc(op.outra) + '&quot;, especifique" aria-label="Especifique">';
    return html + "</fieldset>";
  }

  function escala(nome, legenda, rotulos, classe) {
    rotulos = rotulos || D.escala;
    // Rótulos completos (Discordo totalmente… Concordo totalmente) viram lista vertical no celular;
    // rótulos só nas pontas (Nenhuma … Total) ficam sempre em linha.
    var compacta = rotulos.some(function (r) { return !r; });
    var html = '<fieldset class="pergunta ' + (classe || "") + '" data-obrig data-grupo="' + nome + '"><legend>' + legenda + '</legend><div class="escala' + (compacta ? " compacta" : "") + '">';
    for (var i = 1; i <= 5; i++) {
      html += '<label class="opcao"><input type="radio" name="' + nome + '" value="' + i + '"><span class="num">' + i + '</span><span class="rot">' + esc(rotulos[i - 1] || "") + "</span></label>";
    }
    html += "</div>";
    if (compacta) {
      html += '<div class="escala-ancoras" aria-hidden="true"><span>1 · ' + esc(rotulos[0]) + "</span><span>5 · " + esc(rotulos[4]) + "</span></div>";
    }
    return html + "</fieldset>";
  }

  function texto(nome, legenda, obrig, tipo) {
    return '<div class="pergunta" ' + (obrig ? 'data-obrig data-tipo="texto"' : "") + ' data-grupo="' + nome + '">' +
      '<label class="campo" for="' + nome + '">' + legenda + "</label>" +
      (tipo === "area"
        ? '<textarea id="' + nome + '" name="' + nome + '"></textarea>'
        : '<input id="' + nome + '" name="' + nome + '" type="' + (tipo || "text") + '">') +
      "</div>";
  }

  function validar(form) {
    var primeiro = null;
    form.querySelectorAll("[data-obrig]").forEach(function (el) {
      if (el.closest("[hidden]")) { el.classList.remove("faltando"); return; }
      var g = el.getAttribute("data-grupo");
      var ok = el.getAttribute("data-tipo") === "texto"
        ? form.elements[g].value.trim() !== ""
        : !!form.querySelector('input[name="' + g + '"]:checked');
      el.classList.toggle("faltando", !ok);
      if (!ok && !primeiro) primeiro = el;
    });
    if (primeiro) {
      primeiro.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  }

  function valores(form) {
    var o = {};
    new FormData(form).forEach(function (v, k) { o[k] = typeof v === "string" ? v.trim() : v; });
    return o;
  }

  // pular (opcional): { rotulo, acao } — botão secundário que avança sem validar as respostas.
  function pagina(html, aoEnviar, rotuloBotao, largo, pular) {
    app.classList.toggle("largo", !!largo);
    app.innerHTML = '<form id="f" novalidate>' + html +
      (aoEnviar ? '<div class="acoes">' +
        (pular ? '<button type="button" class="secundario" id="pular">' + pular.rotulo + "</button>" : "") +
        '<button type="submit">' + (rotuloBotao || "Continuar") + "</button></div>" : "") +
      "</form>";
    var form = document.getElementById("f");
    if (pular) document.getElementById("pular").addEventListener("click", pular.acao);
    form.addEventListener("change", function (e) {
      var g = e.target.closest("[data-obrig]");
      if (g) g.classList.remove("faltando");
    });
    if (aoEnviar) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validar(form)) return;
        aoEnviar(valores(form), form);
      });
    }
    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
    return form;
  }

  // ------------------------------------------------------------ navegação

  var ORDEM_LEIGO = ["boasvindas", "tcle", "contato", "perfil", "instrucoes", "leitura0", "perguntas0", "leitura1", "perguntas1", "tarefa", "sus", "percepcao", "fim"];
  var ORDEM_AV = ["boasvindas", "tcle", "contato", "perfil", "av_intro", "av_aval0", "av_aval1", "fim"];

  function progresso() {
    var chave = S.passo;
    if (chave === "leitura" || chave === "perguntas") chave += S.leituraIdx;
    if (chave === "av_aval") chave += S.av.idx;
    var lista = S.passo.indexOf("av_") === 0 ? ORDEM_AV
      : S.semTarefa ? ORDEM_LEIGO.filter(function (k) { return k !== "tarefa" && k !== "sus"; }) : ORDEM_LEIGO;
    var i = lista.indexOf(chave);
    if (i < 0) i = lista.length - 1;
    var segs = "";
    for (var k = 0; k < lista.length; k++) {
      segs += '<li class="' + (k < i ? "feito" : k === i ? "atual" : "") + '"></li>';
    }
    trilho.innerHTML = segs;
    etapaNome.textContent = NOMES_ETAPA[chave] || NOMES_ETAPA.fim;
    etapaNum.textContent = (i + 1) + "/" + lista.length;
  }

  var NOMES_ETAPA = {
    boasvindas: "Boas-vindas", tcle: "Termo de consentimento", contato: "Lista de presença", perfil: "Perfil",
    instrucoes: "Instruções", leitura0: "Leitura do texto 1", perguntas0: "Perguntas do texto 1",
    leitura1: "Leitura do texto 2", perguntas1: "Perguntas do texto 2", tarefa: "Tarefa no site",
    sus: "Usabilidade do site", percepcao: "Sua opinião", av_intro: "Orientações",
    av_aval0: "Avaliação do resumo 1", av_aval1: "Avaliação do resumo 2", fim: "Conclusão"
  };

  function ir(passo) {
    S.passo = passo;
    salvar();
    render();
  }

  function render() {
    progresso();
    (PASSOS[S.passo] || PASSOS.boasvindas)();
  }

  // Impede o botão "voltar" do navegador de sair do formulário.
  history.replaceState({ p: 1 }, "");
  history.pushState({ p: 2 }, "");
  window.addEventListener("popstate", function () {
    history.pushState({ p: 2 }, "");
    if (["boasvindas", "fim", "recusa"].indexOf(S.passo) < 0) {
      alert("Não é possível voltar às etapas anteriores. Continue do ponto em que está.");
    }
  });
  window.addEventListener("beforeunload", function (e) {
    if (["boasvindas", "fim", "recusa"].indexOf(S.passo) < 0) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  function leituraAtual() {
    var par = D.versoes[S.versao][S.leituraIdx];
    return { j: par[0], material: par[1] };
  }

  function julgamentoPlenaria() {
    var v = D.versoes[S.versao];
    var idx = v[0][1] === "plenaria" ? 0 : 1;
    return { j: v[idx][0], idx: idx };
  }

  // ------------------------------------------------------------ passos

  var PASSOS = {};

  // Origem dos resumos: o vídeo da sessão no YouTube, segmentado, transcrito e diarizado.
  var ETAPAS_PIPELINE =
    '<ol class="etapas">' +
    "<li><strong>Vídeo da sessão.</strong> O ponto de partida é a gravação da sessão judiciária ordinária, publicada no YouTube.</li>" +
    "<li><strong>Segmentação.</strong> O áudio é dividido em trechos, separando o julgamento de cada processo.</li>" +
    "<li><strong>Transcrição.</strong> Cada trecho é convertido em texto escrito.</li>" +
    "<li><strong>Diarização.</strong> Cada fala é atribuída a quem falou (presidente, relator, demais juízes, procurador, advogados).</li>" +
    "<li><strong>Resumo.</strong> A partir dessa transcrição, a inteligência artificial escreve um resumo em linguagem simples de cada processo.</li>" +
    "</ol>";

  var ICONE_PLAY = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.1-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14z"/></svg>';

  function cartaoVideo(j) {
    var J = D.julgamentos[j];
    return '<a class="cartao-video" href="' + J.videoUrl + '" target="_blank" rel="noopener">' +
      '<span class="cartao-video-play">' + ICONE_PLAY + "</span>" +
      '<span class="cartao-video-texto"><span class="cartao-video-titulo">' + J.sessao + "</span>" +
      '<span class="cartao-video-acao">Assistir ao vídeo da sessão no YouTube ↗</span></span></a>';
  }

  function blocoVideos(js, titulo, intro) {
    return '<section class="secao videos"><h2>' + titulo + "</h2>" + (intro ? "<p>" + intro + "</p>" : "") +
      '<div class="lista-videos">' + js.map(cartaoVideo).join("") + "</div></section>";
  }

  PASSOS.boasvindas = function () {
    var piloto = S.modalidade === "piloto"
      ? '<div class="alerta"><strong>Teste piloto.</strong> Estas respostas são marcadas como piloto e não entram nos resultados.</div>' : "";
    var local = !C.APPS_SCRIPT_URL
      ? '<div class="alerta"><strong>Modo local.</strong> O endereço da planilha não foi configurado; as respostas ficarão só neste aparelho.</div>' : "";
    pagina(
      '<div class="cartao">' + piloto + local +
      "<h1>Olá! Obrigado por participar.</h1>" +
      "<p>Esta atividade faz parte de um trabalho de conclusão de curso da Especialização em Projetos em Inteligência Artificial da UNIFAP.</p>" +
      "<p>Estamos testando formas de explicar para a população o que acontece nos julgamentos do Tribunal Regional Eleitoral do Amapá. " +
      "Você vai ler dois textos curtos sobre dois julgamentos e responder a algumas perguntas sobre cada um.</p>" +
      '<div class="aviso"><p><strong>Quem está sendo avaliado são os textos, e não você.</strong> Não existe resposta que prejudique você, e marcar "Não sei" ajuda tanto quanto acertar.</p>' +
      "<p style=\"margin:0\">A atividade leva no máximo 15 minutos, e você pode parar a qualquer momento.</p></div>" +
      // Apresentação neutra: não diz que o resumo é melhor nem descreve seu formato,
      // para não induzir respostas nem permitir identificar o texto do plenarIA na leitura.
      '<section class="secao"><h2>O que é o plenarIA</h2>' +
      "<p>O plenarIA é uma ferramenta desenvolvida neste trabalho que usa inteligência artificial para transformar o <strong>vídeo de uma sessão judiciária ordinária</strong> do TRE-AP em um resumo escrito de cada processo julgado. O caminho é este:</p>" +
      ETAPAS_PIPELINE +
      "<p>Nesta atividade, os resumos foram gerados a partir dos vídeos da <strong>58ª Sessão Judiciária Ordinária (5/8/2026)</strong> e da <strong>61ª Sessão Judiciária Ordinária (13/8/2026)</strong>. " +
      "Os links para os dois vídeos aparecem ao final da atividade, depois das perguntas.</p>" +
      "<p>Os resumos ficam disponíveis em um site público, onde qualquer pessoa pode consultar as sessões, ler os resumos e baixar a pauta.</p>" +
      "<p style=\"margin:0\">Esta atividade serve para verificar se esses resumos ajudam as pessoas a entender o que o tribunal decidiu. " +
      "Por isso, sua opinião sincera é o que mais importa, seja ela positiva ou negativa.</p></section></div>" +
      '<p class="suave">Antes de começar, leia o termo de participação na próxima tela.</p>',
      function () { ir("tcle"); }, "Começar"
    );
  };

  PASSOS.tcle = function () {
    pagina(
      '<div class="cartao"><h1>Termo de Consentimento Livre e Esclarecido</h1>' +
      "<p>Você está sendo convidado(a) a participar da atividade de validação do plenarIA, ferramenta que produz resumos em linguagem simples dos julgamentos realizados nas sessões do Tribunal Regional Eleitoral do Amapá (TRE-AP). A atividade faz parte do Trabalho de Conclusão de Curso da Especialização em Projetos em Inteligência Artificial da Universidade Federal do Amapá (UNIFAP).</p>" +
      "<p><strong>O que você vai fazer:</strong> ler dois textos curtos sobre julgamentos do tribunal, responder a algumas perguntas sobre eles e dar sua opinião sobre os textos. Se você tiver formação jurídica ou trabalhar na área judicial, a sua tarefa será outra: conferir se os resumos correspondem ao que foi julgado. A atividade dura no máximo 15 minutos.</p>" +
      "<p><strong>O que está sendo avaliado:</strong> os textos e a ferramenta, e não você. Não existe resposta que prejudique você.</p>" +
      "<p><strong>Participação voluntária:</strong> você pode desistir a qualquer momento, sem precisar explicar o motivo e sem nenhum prejuízo. Não há pagamento nem custo para participar.</p>" +
      "<p><strong>Riscos e benefícios:</strong> o risco é mínimo, limitado a cansaço ou desconforto ao responder. Se isso acontecer, você pode fazer uma pausa ou encerrar a participação. O benefício é contribuir para que as decisões da Justiça Eleitoral sejam mais fáceis de entender para a população.</p>" +
      "<p><strong>Sigilo:</strong> suas respostas serão analisadas sem identificação. Seu nome, telefone e e-mail serão guardados apenas na lista de presença, exigida pela universidade, em local separado das respostas, e não serão associados a elas em nenhuma publicação.</p>" +
      "<p><strong>Contato:</strong> Josemar Gama, " + esc(C.CONTATO_PESQUISADOR) + "; Prof. Dr. Julio Cezar Costa Furtado, " + esc(C.CONTATO_ORIENTADOR) + ".</p>" +
      "<p class=\"suave\">O aceite abaixo substitui a assinatura em papel.</p>" +
      '<section class="secao">' +
      radios("ACEITE", "Declaração de consentimento", [
        "Li as informações acima, tive a oportunidade de fazer perguntas e aceito participar desta atividade.",
        "Não aceito participar."
      ], { valores: ["sim", "nao"] }) +
      radios("IMAGEM", "Autorização de uso de imagem", [
        "Autorizo o uso de fotografias em que eu apareça, tiradas durante a atividade, exclusivamente no relatório acadêmico e em publicações científicas relacionadas a este trabalho.",
        "Não autorizo o uso da minha imagem."
      ], { valores: ["autorizo", "nao_autorizo"] }) +
      "</section></div>",
      function (v) {
        if (v.ACEITE !== "sim") { ir("recusa"); return; }
        S.r.IMAGEM = v.IMAGEM;
        ir("contato");
      }
    );
  };

  PASSOS.recusa = function () {
    apagar("sessionStorage", CH_ESTADO);
    pagina('<div class="cartao"><h1>Tudo bem, obrigado pelo seu tempo.</h1><p>Nenhuma resposta foi registrada.</p></div>' + botaoNovo(), null);
    ligarBotaoNovo();
  };

  PASSOS.contato = function () {
    pagina(
      '<div class="cartao"><h1>Lista de presença</h1>' +
      "<p>A universidade exige uma lista de presença. Estes dados ficam <strong>separados</strong> das suas respostas e não são ligados a elas.</p>" +
      texto("NOME", "Nome completo", true) +
      texto("TELEFONE", "Telefone (opcional)", false, "tel") +
      texto("EMAIL", "E-mail (opcional)", false, "email") +
      "</div>",
      function (v) {
        var payload = { tipo: "presenca", registro: {
          NOME: v.NOME, TELEFONE: v.TELEFONE || "", EMAIL: v.EMAIL || "",
          IMAGEM: S.r.IMAGEM, OBS: S.modalidade === "piloto" ? "piloto" : ""
        } };
        enfileirar(payload);
        enviarPendentes();
        ir("perfil");
      }
    );
  };

  PASSOS.perfil = function () {
    var html = '<div class="cartao"><h1>Sobre você</h1>';
    D.perfil.forEach(function (p) {
      html += radios(p.id, p.id + ". " + p.texto, p.opcoes, { outra: p.outra });
    });
    pagina(html + "</div>", function (v) {
      D.perfil.forEach(function (p) {
        S.r[p.id] = v[p.id];
        if (p.outra) S.r[p.id + "_OUTRA"] = v[p.id] === p.outra ? (v[p.id + "_OUTRA"] || "") : "";
      });
      if (v.P3 === "Sim" || S.rotaForcada) { ir("av_intro"); return; }
      obterVersaoEContinuar();
    });
  };

  function obterVersaoEContinuar() {
    app.innerHTML = '<div class="cartao"><p>Preparando os textos…</p></div>';
    obterVersao().then(function (r) {
      S.versao = r.versao;
      S.fonteVersao = r.fonte;
      ir("instrucoes");
    });
  }

  PASSOS.instrucoes = function () {
    pagina(
      '<div class="cartao"><h1>Como funciona a leitura</h1>' +
      "<p>Você vai ler <strong>dois textos</strong>, um de cada vez, cada um sobre um julgamento diferente.</p>" +
      "<ul><li>Leia com calma, no seu ritmo. Não há limite de tempo.</li>" +
      "<li>Quando terminar, clique em <strong>Terminei a leitura</strong>.</li>" +
      "<li>O texto sairá da tela e você responderá a algumas perguntas <strong>sem poder voltar a ele</strong>.</li>" +
      "<li>Por favor, não consulte outras pessoas, outras abas ou o celular durante as perguntas.</li></ul>" +
      "</div>",
      function () { S.leituraIdx = 0; S.t0 = null; ir("leitura"); }, "Começar a leitura"
    );
  };

  PASSOS.leitura = function () {
    var l = leituraAtual();
    var J = D.julgamentos[l.j];
    if (!S.t0) { S.t0 = Date.now(); salvar(); }
    pagina(
      '<article class="material folha ' + l.material + '">' +
      '<header class="folha-cab"><span>Texto ' + (S.leituraIdx + 1) + " de 2</span><span>" + J.rotulo + "</span></header>" +
      '<div class="folha-corpo">' + J[l.material] + "</div></article>",
      function () {
        if (!confirm("Depois de continuar, não será possível voltar a este texto. Deseja ir para as perguntas?")) return;
        S.r[l.j + "_TEMPO"] = Math.round((Date.now() - S.t0) / 1000);
        S.t0 = null;
        ir("perguntas");
      }, "Terminei a leitura"
    );
  };

  PASSOS.perguntas = function () {
    var l = leituraAtual();
    var J = D.julgamentos[l.j];
    var html = '<div class="cartao"><h1>O que você entendeu?</h1>' +
      '<p class="contexto">Perguntas sobre o ' + J.rotulo + "</p>" +
      '<p class="suave">Responda sem consultar o texto. Marque apenas uma opção. Se não souber, marque "Não sei": isso é tão útil quanto uma resposta.</p>';
    D.perguntas[l.j].forEach(function (q) {
      var base = q.comum ? D.comuns[q.comum] : q;
      var n = q.id.slice(1);
      var valoresQ = base.opcoes.map(function (_, i) { return String(i + 1); });
      html += '<div class="bloco-q">' +
        radios(l.j + "_" + q.id, q.id + ". " + base.texto, base.opcoes, { valores: valoresQ, naoSei: true }) +
        '<div class="certeza">' + escala(l.j + "_C" + n, "Quanto você tem certeza desta resposta?", ["Nenhuma", "", "", "", "Total"]) + "</div></div>";
    });
    pagina(html + "</div>", function (v) {
      Object.keys(v).forEach(function (k) { S.r[k] = v[k]; });
      if (S.leituraIdx === 0) {
        S.leituraIdx = 1;
        ir("leitura");
      } else {
        if (S.semTarefa) {
          S.r.TAREFA = "nao_aplicada";
          ir("percepcao");
        } else {
          ir("tarefa");
        }
      }
    });
  };

  PASSOS.tarefa = function () {
    var p = julgamentoPlenaria();
    var J = D.julgamentos[p.j];
    var ordinal = p.idx === 0 ? "primeiro" : "segundo";
    var form = pagina(
      '<div class="cartao"><h1>Agora, uma tarefa no site do plenarIA</h1>' +
      "<p>O <strong>" + ordinal + " texto</strong> que você leu (" + J.rotulo + ") era um resumo produzido pelo <strong>plenarIA</strong>. O outro era o registro oficial do tribunal.</p>" +
      '<div class="aviso"><p><strong>Tarefa:</strong> no site do plenarIA, encontre a sessão desse julgamento — a <strong>' + J.sessao + "</strong> —, abra o resumo e baixe a pauta.</p>" +
      '<p style="margin:0">O site abrirá em outra aba. Quando terminar (ou se não conseguir), volte para esta aba.</p></div>' +
      '<p><a class="botao secundario" href="' + D.plenariaInicio + '" target="_blank" rel="noopener">Abrir o site do plenarIA</a></p>' +
      '<section class="secao">' +
      radios("SITE", "O site do plenarIA abriu?", ["Sim", "Não, o site não abriu"], { valores: ["sim", "nao"] }) +
      '<div id="partes" hidden>' +
      radios("TAREFA_LOCALIZAR", "Você conseguiu encontrar a sessão?", ["Sim", "Não"], { valores: ["sim", "nao"] }) +
      radios("TAREFA_RESUMO", "Você conseguiu abrir o resumo?", ["Sim", "Não"], { valores: ["sim", "nao"] }) +
      radios("TAREFA_PAUTA", "Você conseguiu baixar a pauta?", ["Sim", "Não"], { valores: ["sim", "nao"] }) +
      "</div></section></div>",
      function (v) {
        if (v.SITE === "nao") {
          S.r.TAREFA = "indisponivel";
          ["TAREFA_LOCALIZAR", "TAREFA_RESUMO", "TAREFA_PAUTA"].forEach(function (k) { S.r[k] = ""; });
          ir("percepcao");
          return;
        }
        var partes = ["TAREFA_LOCALIZAR", "TAREFA_RESUMO", "TAREFA_PAUTA"];
        var sims = 0;
        partes.forEach(function (k) { S.r[k] = v[k]; if (v[k] === "sim") sims++; });
        S.r.TAREFA = sims === 3 ? "sim" : sims === 0 ? "nao" : "parcial";
        ir("sus");
      }, null, false, {
        // Pula a tarefa e, com ela, a SUS (que só faz sentido depois de usar o site).
        rotulo: "Pular esta etapa",
        acao: function () {
          S.r.TAREFA = "pulada";
          ["TAREFA_LOCALIZAR", "TAREFA_RESUMO", "TAREFA_PAUTA"].forEach(function (k) { S.r[k] = ""; });
          ir("percepcao");
        }
      }
    );
    form.addEventListener("change", function (e) {
      if (e.target.name === "SITE") document.getElementById("partes").hidden = e.target.value !== "sim";
    });
  };

  PASSOS.sus = function () {
    var html = '<div class="cartao"><h1>Sua opinião sobre o site do plenarIA</h1>' +
      "<p>As afirmações abaixo se referem ao <strong>site que você acabou de usar</strong>. Indique o quanto concorda com cada uma.</p>";
    D.sus.forEach(function (t, i) { html += escala("SUS" + (i + 1), (i + 1) + ". " + t); });
    pagina(html + "</div>", function (v) {
      var soma = 0;
      for (var i = 1; i <= 10; i++) {
        var x = parseInt(v["SUS" + i], 10);
        S.r["SUS" + i] = x;
        soma += i % 2 === 1 ? x - 1 : 5 - x;
      }
      S.r.SUS_ESCORE = soma * 2.5;
      ir("percepcao");
    }, null, false, {
      rotulo: "Pular este questionário",
      acao: function () {
        // SUS em branco; TAREFA mantém o que foi declarado na tela anterior.
        for (var i = 1; i <= 10; i++) S.r["SUS" + i] = "";
        S.r.SUS_ESCORE = "";
        ir("percepcao");
      }
    });
  };

  PASSOS.percepcao = function () {
    var p = julgamentoPlenaria();
    var html = '<div class="cartao"><h1>Sua opinião sobre o resumo do plenarIA</h1>' +
      "<p>As afirmações abaixo se referem ao <strong>resumo do plenarIA</strong> que você leu (o " + (p.idx === 0 ? "primeiro" : "segundo") +
      " texto, sobre o " + D.julgamentos[p.j].rotulo + "). Indique o quanto concorda com cada uma.</p>" +
      '<div class="aviso"><p>Esse resumo foi gerado pelo plenarIA a partir do <strong>vídeo da ' + D.julgamentos[p.j].sessao +
      "</strong>: o áudio foi segmentado, transcrito e diarizado (cada fala atribuída a quem falou) antes de a IA escrever o resumo.</p>" +
      cartaoVideo(p.j) + "</div>";
    D.percepcao.forEach(function (t, i) { html += escala("R" + (i + 1), (i + 1) + ". " + t); });
    html += radios("R6", "6. " + D.r6.texto, D.r6.opcoes) +
      texto("R7", "7. " + D.r7 + " (opcional)", false, "area") +
      texto("R8", "8. " + D.r8 + " (opcional)", false, "area") + "</div>";
    pagina(html, function (v) {
      Object.keys(v).forEach(function (k) { S.r[k] = v[k]; });
      enviarResposta();
    }, "Enviar respostas");
  };

  function registroLeigo() {
    var v = D.versoes[S.versao];
    var reg = {};
    Object.keys(S.r).forEach(function (k) { reg[k] = S.r[k]; });
    reg.UUID = S.uuid;
    reg.VERSAO = S.versao;
    reg.MODALIDADE = S.modalidade;
    reg.INICIO = S.inicio;
    reg.FIM = new Date().toISOString();
    reg.ORDEM = v[0][0] + "-" + v[1][0];
    v.forEach(function (par) { reg[par[0] + "_MATERIAL"] = par[1]; });
    return reg;
  }

  function enviarResposta() {
    finalizar({ tipo: "resposta", registro: registroLeigo() });
  }

  // Grava cópia local, põe na fila e tenta enviar. A tela final informa o resultado.
  function finalizar(payload) {
    guardarCopia(payload);
    enfileirar(payload);
    S.passo = "fim";
    apagar("sessionStorage", CH_ESTADO);
    progresso();
    app.innerHTML = '<div class="cartao"><p>Enviando suas respostas…</p></div>';
    enviarPendentes().then(function (restantes) { telaFim(restantes, payload.tipo); });
  }

  function botaoNovo() {
    return '<div class="acoes"><button type="button" class="secundario" id="novo">Iniciar novo participante</button></div>';
  }
  function ligarBotaoNovo() {
    var b = document.getElementById("novo");
    if (b) b.addEventListener("click", function () {
      apagar("sessionStorage", CH_ESTADO);
      location.reload();
    });
  }

  function telaFim(restantes, tipo) {
    var status;
    if (!C.APPS_SCRIPT_URL) {
      status = '<div class="alerta">Modo local: as respostas ficaram guardadas só neste aparelho (exportar em <a href="copia.html">copia.html</a>).</div>';
    } else if (restantes > 0) {
      status = '<div class="alerta"><strong>Não foi possível enviar agora.</strong> Suas respostas estão guardadas neste aparelho e serão reenviadas automaticamente. Por favor, avise o aplicador.' +
        '<div class="acoes"><button type="button" id="reenviar">Tentar novamente</button></div></div>';
    } else {
      status = '<div class="sucesso">Respostas enviadas com sucesso.</div>';
    }
    var extra = tipo === "resposta"
      ? "<p>Por favor, não comente as perguntas com outras pessoas que ainda vão participar. As respostas certas só serão divulgadas depois do fim da atividade.</p>"
      : "<p>Sua avaliação vai ajudar a medir a fidelidade dos resumos.</p>";
    extra += blocoVideos(["A", "B"], "Assista às sessões originais",
      "Os resumos do plenarIA foram gerados a partir destes vídeos, depois de segmentados, transcritos e diarizados.");
    app.classList.remove("largo");
    app.innerHTML = '<div class="cartao fim' + (C.APPS_SCRIPT_URL && restantes === 0 ? " ok" : "") + '"><h1>Muito obrigado pela participação!</h1>' + status + extra + "</div>" + botaoNovo();
    ligarBotaoNovo();
    var r = document.getElementById("reenviar");
    if (r) r.addEventListener("click", function () {
      r.disabled = true;
      enviarPendentes().then(function (n) { telaFim(n, tipo); });
    });
  }

  PASSOS.fim = function () { telaFim(ler("localStorage", CH_PENDENTES, []).length, "resposta"); };

  // ------------------------------------------------------------ rota dos avaliadores

  PASSOS.av_intro = function () {
    var html = '<div class="cartao"><h1>Avaliação de fidelidade dos resumos</h1>' +
      "<p>Como você tem formação jurídica ou trabalha na área judicial, sua participação será como <strong>avaliador(a)</strong>.</p>" +
      "<p>Você vai comparar <strong>dois resumos</strong> gerados pelo plenarIA com o <strong>acórdão</strong> de cada julgamento. " +
      "Avalie apenas se o resumo corresponde ao que foi julgado, <strong>e não se a decisão do tribunal foi correta</strong>. Trabalhe sozinho(a), sem consultar outros avaliadores.</p>" +
      '<section class="secao"><h2>Como os resumos foram gerados</h2>' +
      "<p>Os resumos foram produzidos a partir dos <strong>vídeos das sessões judiciárias ordinárias</strong>, e não do acórdão:</p>" + ETAPAS_PIPELINE +
      '<div class="lista-videos">' + cartaoVideo("A") + cartaoVideo("B") + "</div>" +
      '<p class="suave">Assistir aos vídeos é opcional. A referência para a avaliação é o acórdão.</p></section>' +
      '<div class="aviso exemplo"><strong>Como classificar cada afirmação do resumo</strong><dl>' +
      "<dt>Sustentada</dt><dd>Consta do acórdão. Ex.: “A decisão foi unânime”, quando o acórdão registra “por unanimidade”.</dd>" +
      "<dt>Não sustentada</dt><dd>Não consta do acórdão, nem para confirmar nem para negar. Ex.: “O relator destacou a gravidade dos fatos”, sem registro disso no acórdão.</dd>" +
      "<dt>Contraditória</dt><dd>Contraria o acórdão. Ex.: “O tribunal deu provimento aos embargos”, quando o acórdão os rejeitou; ou um nome, número ou classe processual errados.</dd>" +
      "</dl></div>" +
      '<section class="secao">' +
      texto("CODIGO", "Código de avaliador (recebido do aplicador; deixe em branco se não recebeu)", false) +
      radios("FORMACAO", "Formação", D.formacoes, { outra: "Outra" }) +
      "</section></div>";
    pagina(html, function (v) {
      S.av.codigo = (v.CODIGO || "").toUpperCase() || ("AV-" + S.uuid.slice(0, 4).toUpperCase());
      S.av.formacao = v.FORMACAO;
      S.av.formacaoOutra = v.FORMACAO === "Outra" ? (v.FORMACAO_OUTRA || "") : "";
      S.av.idx = 0;
      S.t0 = null;
      ir("av_aval");
    }, "Começar a avaliação");
  };

  PASSOS.av_aval = function () {
    var j = S.av.ordem[S.av.idx];
    var J = D.julgamentos[j];
    if (!S.t0) { S.t0 = Date.now(); salvar(); }

    var linhas = D.afirmacoes[j].map(function (a, i) {
      var nome = "AF" + (i < 9 ? "0" : "") + (i + 1);
      var cel = function (v, rot) {
        return '<td class="radio"><label><input type="radio" name="' + nome + '" value="' + v + '"><span class="rot-cel">' + rot + "</span></label></td>";
      };
      return '<tr data-obrig data-grupo="' + nome + '"><td>' + (i + 1) + "</td><td>" + esc(a) + "</td>" +
        cel("Sustentada", "Sustentada") + cel("Não sustentada", "Não sustentada") + cel("Contraditória", "Contraditória") + "</tr>";
    }).join("");

    var html =
      '<div class="cartao"><h1>' + J.sessao + "</h1>" +
      '<p class="contexto">Resumo ' + (S.av.idx + 1) + " de 2 · " + J.rotulo + "</p>" +
      '<p class="suave">Leia o resumo e o acórdão. Você pode consultar os dois enquanto responde.</p>' +
      "<p>Este resumo foi gerado a partir do vídeo desta sessão (segmentado, transcrito e diarizado):</p>" + cartaoVideo(j) + "</div>" +
      '<div class="lado-a-lado">' +
      '<div class="painel"><div class="painel-cab"><span>Resumo do plenarIA</span></div><article class="material plenaria"><div class="folha-corpo">' + J.plenaria + "</div></article></div>" +
      '<div class="painel"><div class="painel-cab"><span>' + J.acordaoNome + "</span>" +
      '<a href="' + J.acordaoPdf + '" target="_blank" rel="noopener">abrir em outra aba</a></div>' +
      '<iframe class="pdf" src="' + J.acordaoPdf + '" title="' + J.acordaoNome + '"></iframe></div>' +
      "</div>" +
      '<div class="cartao cartao-ficha"><h2>Parte A — Afirmações do resumo</h2>' +
      '<p class="suave">Classifique cada afirmação de fato extraída do resumo, comparando com o acórdão.</p>' +
      '<table class="afirmacoes"><thead><tr><th>Nº</th><th>Afirmação do resumo</th><th>Sustentada</th><th>Não sustentada</th><th>Contraditória</th></tr></thead><tbody>' +
      linhas + "</tbody></table>" +
      texto("AF_EXTRA", "Alguma afirmação do resumo ficou de fora da lista? Escreva-a e classifique-a (opcional).", false, "area") +
      '<section class="secao"><h2>Parte B — Elementos essenciais</h2>' +
      D.elementos.map(function (e) { return radios(e.id, e.texto, e.opcoes); }).join("") +
      "</section>" +
      '<section class="secao"><h2>Parte C — Linguagem e omissões</h2>' +
      D.parteC.map(function (t, i) { return escala("C" + (i + 1), (i + 1) + ". " + t); }).join("") +
      texto("OMISSOES", "Omissões relevantes (informação essencial do julgamento ausente do resumo). Se não houver, escreva \"nenhuma\".", true, "area") +
      "</section></div>";

    pagina(html, function (v) {
      v.TEMPO = Math.round((Date.now() - S.t0) / 1000);
      v.ORDEM_AVALIACAO = S.av.idx + 1;
      S.av.dados[j] = v;
      S.t0 = null;
      if (S.av.idx === 0) {
        S.av.idx = 1;
        ir("av_aval");
      } else {
        enviarAvaliacao();
      }
    }, S.av.idx === 0 ? "Ir para o segundo resumo" : "Enviar avaliação", true);
  };

  function enviarAvaliacao() {
    var linhas = S.av.ordem.map(function (j) {
      var l = { UUID: S.uuid, MODALIDADE: S.modalidade, CODIGO: S.av.codigo, FORMACAO: S.av.formacao,
        FORMACAO_OUTRA: S.av.formacaoOutra, P1: S.r.P1, P2: S.r.P2, P4: S.r.P4, P5: S.r.P5,
        JULGAMENTO: j, IMAGEM: S.r.IMAGEM };
      var d = S.av.dados[j];
      Object.keys(d).forEach(function (k) { l[k] = d[k]; });
      return l;
    });
    finalizar({ tipo: "avaliador", linhas: linhas });
  }

  // ------------------------------------------------------------ início

  enviarPendentes();
  render();
})();
