// compatibility.js
// Configuração Centralizada

console.log("[Compatibility] Carregando configurações globais...");

window.GENESYS_CONFIG = {
    // URL do teu Google Apps Script
    API_URL: "https://script.google.com/macros/s/AKfycbyBkz1XED-bMLDrPX19VMPoHmMB2_WovBb-Pn2HN1MG0P3lQOl6MkVCkcI6_Yo6WiGsEg/exec",
    
    // Configurações do Repositório GitHub (Para o Admin.js)
    REPO_USER: "scriptgenesys-code",
    REPO_NAME: "Script-Completo",
    
    VERSION: "6.8-Stable"
};

// Adaptadores para funcionar como Extensão
window.GM_addStyle = function(css) {
    const style = document.createElement('style');
    style.textContent = css;
    (document.head || document.body).appendChild(style);
};

window.GM_setClipboard = function(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).catch(e => console.error(e));
    }
};

window.GM_openInTab = function(url) {
    window.open(url, '_blank');
};

window.unsafeWindow = window;
