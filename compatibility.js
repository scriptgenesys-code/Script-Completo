// compatibility.js
// Este arquivo ensina ao Chrome os comandos do Tampermonkey que usamos

console.log("[Compatibility] Carregando adaptadores GM_...");

// Simula GM_addStyle (Adicionar CSS)
window.GM_addStyle = function(css) {
    const style = document.createElement('style');
    style.textContent = css;
    (document.head || document.body).appendChild(style);
};

// Simula GM_setClipboard (Copiar texto)
window.GM_setClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log("Texto copiado via Adaptador.");
    }).catch(err => {
        console.error("Falha ao copiar via Adaptador:", err);
    });
};

// Simula GM_openInTab (Abrir aba)
window.GM_openInTab = function(url) {
    window.open(url, '_blank');
};

// Garante que variáveis globais dos scripts sejam acessíveis
window.unsafeWindow = window;