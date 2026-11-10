/*
 * Configuração da aplicação.
 *
 * APPS_SCRIPT_URL: endereço do App da Web do Google Apps Script (termina em /exec).
 * Enquanto estiver vazio, a aplicação roda em "modo local": a versão é sorteada e as
 * respostas ficam só neste navegador (exportáveis em copia.html). Útil para testar.
 */
window.CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxmudWYHNlmtlwNgasx5yJeN24HF5m92xvRjK2l9llyNyLCWF5bNHnbeqgUdjOMRgS-xA/exec",

  CONTATO_PESQUISADOR: "josemargama7@gmail.com",
  CONTATO_ORIENTADOR: "furtado@unifap.br",

  // Tempo máximo de espera por uma resposta do Apps Script (ms).
  TIMEOUT_MS: 15000
};
