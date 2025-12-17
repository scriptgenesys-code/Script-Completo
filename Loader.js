(function() {
    // =================================================================
    // LOADER MESTRE (V31.0 - FINAL STABLE & CLEANUP)
    // - Carregamento em Cascata (Waterfall)
    // - Polyfills para Chrome API
    // - Limpeza Agressiva de Overlays (Correção de Bloqueio)
    // =================================================================

    const REPO_URL = "https://scriptgenesys-code.github.io/Script-Completo";
    const VERSION = "31.0";
    console.log(`[Loader V${VERSION}] Conectando ao Mestre...`);

    // --- 0. FORCE RESET & DEEP CLEANUP ---
    // Remove qualquer elemento visual ou estilo injetado anteriormente
    // Isso impede que versões antigas "fantasmas" bloqueiem a tela
    const idsLimpeza = [
        'uni-menu-container',                // Menu antigo
        'purecloud-script-mini-dashboard',   // Dashboard antigo
        'estilo-gerente-visual',             // CSS do Gerente
        'qr-script-injected-style',          // CSS das Respostas
        'game-overlay-backdrop',             // Overlay do Jogo (Bloqueador crítico)
        'central-modal-overlay',             // Overlay da Central
        'bau-rede',                          // Janela do Baú
        'purecloud-script-notification-container' // Notificações
    ];

    idsLimpeza.forEach(id => {
        // Remove por ID
        let el = document.getElementById(id);
        if(el) el.remove();
        
        // Remove por Classe (para garantir overlays duplicados)
        let els = document.querySelectorAll(`.${id}`);
        els.forEach(e => e.remove());
    });

    // 1. POLYFILLS (Simulador de Extensão)
    if(!window.chrome) window.chrome={};
    if(!window.chrome.runtime) window.chrome.runtime={};
    if(!window.chrome.storage) window.chrome.storage={};
    
    // Redireciona chamadas de recursos locais para o GitHub
    if(!window.chrome.runtime.getURL) window.chrome.runtime.getURL = path => `${REPO_URL}/${path}`;
    
    // Simula Storage Local usando localStorage do navegador
    if(!window.chrome.storage.local) window.chrome.storage.local = {
        get: (keys, cb) => {
            let res = {};
            let kList = Array.isArray(keys) ? keys : (keys ? [keys] : []);
            
            // Se keys for null ou vazio, retorna tudo que pertence ao script
            if(kList.length === 0) { 
                 for(let i=0; i<localStorage.length; i++) {
                     let k = localStorage.key(i);
                     if(k.startsWith('MOD_') || k.includes('CONFIG') || k.startsWith('IA_')) {
                         try { res[k] = JSON.parse(localStorage.getItem(k)); } catch(e){ res[k] = localStorage.getItem(k); }
                     }
                 }
            } else {
                kList.forEach(k => {
                    let val = localStorage.getItem(k);
                    try { val = JSON.parse(val); } catch(e){}
                    // Padrão ON: Se a config não existe, assume TRUE
                    if(val === null && k.startsWith('MOD_')) val = true; 
                    if(val !== null) res[k] = val;
                });
            }
            if(cb) cb(res);
        },
        set: (items, cb) => {
            for(let k in items) {
                let val = items[k];
                if(typeof val === 'object') val = JSON.stringify(val);
                localStorage.setItem(k, val);
            }
            if(cb) cb();
        }
    };
    if(!window.chrome.storage.onChanged) window.chrome.storage.onChanged = { addListener: ()=>{} };

    // 2. FUNÇÕES DE CARREGAMENTO (Com Cache Buster)
    function loadCSS(file) {
        let link = document.createElement("link");
        link.href = `${REPO_URL}/${file}?v=${Date.now()}`; // Força atualização
        link.rel = "stylesheet";
        link.type = "text/css";
        document.head.appendChild(link);
    }

    function lS(file) {
        return new Promise((resolve, reject) => {
            let script = document.createElement("script");
            script.src = `${REPO_URL}/${file}?v=${Date.now()}`; // Força atualização
            script.onload = resolve;
            script.onerror = () => { 
                console.warn(`[Loader] Aviso: ${file} não carregou (pode ser opcional).`); 
                resolve(); // Não quebra a corrente
            };
            document.body.appendChild(script);
        });
    }

    // 3. EXECUÇÃO EM CASCATA (Ordem Crítica)
    // Carrega CSS primeiro para evitar FOUC (Flash of Unstyled Content)
    loadCSS("style.css");

    lS("compatibility.js")      // 1. Configurações Globais
        .then(() => lS("gerente.js"))     // 2. Filtros Visuais (Importante carregar cedo)
        .then(() => lS("bar.js"))         // 3. Ferramentas Técnicas
        .then(() => lS("monitor.js"))     // 4. Monitor
        .then(() => lS("central.js"))     // 5. Base de Conhecimento
        .then(() => lS("respostas.js"))   // 6. Dados GitHub
        .then(() => lS("protocolos.js"))  // 7. Dados GitHub
        .then(() => lS("extrator.js"))    // 8. OCR e Utilitários
        .then(() => lS("espelho.js"))
        .then(() => lS("car.js"))
        .then(() => lS("pausas.js"))      // 9. Automação
        .then(() => lS("ia.js"))          // 10. Inteligência
        .then(() => lS("menu.js"))        // 11. Interface (Menu Unificado)
        .then(() => lS("cronometros.js")) // 12. Analytics (Pesado, fica por último)
        .then(() => {
            // Notificação de Sucesso
            let t = document.createElement("div");
            t.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg, #10b981, #059669); color:#fff; padding:12px 25px; border-radius:50px; z-index:2147483647; font-weight:bold; font-family:'Segoe UI',sans-serif; box-shadow:0 10px 25px rgba(0,0,0,0.3); font-size:14px; display:flex; align-items:center; gap:10px; pointer-events:none;";
            t.innerHTML = `<span>✅</span> Sistema Atualizado (v${VERSION})`;
            document.body.appendChild(t);
            
            // Som suave
            try { new Audio("https://www.soundjay.com/buttons/sounds/button-3.mp3").play().catch(()=>{}); } catch(e){}

            setTimeout(() => {
                t.style.transition = "opacity 0.5s, transform 0.5s";
                t.style.opacity = "0";
                t.style.transform = "translate(-50%, -50px)";
                setTimeout(() => t.remove(), 500);
            }, 3000);
        })
        .catch(err => {
            console.error("[Loader] Erro Crítico:", err);
            alert("Erro ao carregar Genesys Master. Verifique o console (F12).");
        });

})();
