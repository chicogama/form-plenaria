/*
 * Tamanho do texto (A− / A+), nos mesmos degraus do site do plenarIA.
 * Carregado no <head> para aplicar a escala antes do primeiro desenho.
 * A preferência fica neste navegador; sem armazenamento, volta a 100%.
 */
(function () {
  "use strict";
  var DEGRAUS = ["100", "115", "130", "150"];
  var CHAVE = "plenaria-form:escala";
  var raiz = document.documentElement;

  function ler() {
    try { var v = localStorage.getItem(CHAVE); return DEGRAUS.indexOf(v) >= 0 ? v : "100"; } catch (e) { return "100"; }
  }
  function aplicar(v) {
    raiz.setAttribute("data-escala", v);
    try { localStorage.setItem(CHAVE, v); } catch (e) { /* sem armazenamento */ }
    var rot = document.querySelector("[data-escala-valor]");
    if (rot) rot.textContent = v + "%";
    document.querySelectorAll("[data-escala-acao]").forEach(function (b) {
      var i = DEGRAUS.indexOf(v) + parseInt(b.getAttribute("data-escala-acao"), 10);
      b.disabled = i < 0 || i >= DEGRAUS.length;
    });
  }

  raiz.setAttribute("data-escala", ler());

  document.addEventListener("DOMContentLoaded", function () {
    aplicar(ler());
    document.querySelectorAll("[data-escala-acao]").forEach(function (b) {
      b.addEventListener("click", function () {
        var i = DEGRAUS.indexOf(raiz.getAttribute("data-escala")) + parseInt(b.getAttribute("data-escala-acao"), 10);
        if (i >= 0 && i < DEGRAUS.length) aplicar(DEGRAUS[i]);
      });
    });
  });
})();
