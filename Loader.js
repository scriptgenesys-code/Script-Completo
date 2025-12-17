(function() {
    // =================================================================
    // LOADER MESTRE (V30.1 - FINAL STABLE)
    // - Carregamento em Cascata (Waterfall)
    // - Polyfills para Chrome API (Suporte a Game e Storage)
    // - Cache Busting Agressivo (Atualização imediata)
    // =================================================================

    const REPO_URL = "https://scriptgenesys-code.github.io/Script-Completo";
    const VERSION = "30.1";
    console.log(`[Loader V${VERSION}] Conectando ao Mestre...`);

    // --- 0. LIMPEZA DE AMBIENTE ---
    // Remove injeções antigas para evitar duplicação ao clicar no favorito 2x
    const idsLimpeza = ['uni-menu-container', 'purecloud-script-mini-dashboard', 'estilo-gerente-visual', 'qr-script-injected-style'];
    idsLimpeza.forEach(id => {
        let el = document.getElementById(id);
        if(el) el.remove();
    });

    // 1. POLYFILLS (Simula a Extensão para quem usa Favoritos)
    if(!window.chrome) window.chrome={};
    if(!window.chrome.runtime) window.chrome.runtime={};
    if(!window.chrome.storage) window.chrome.storage={};
    
    // Redireciona chamadas de URL local (como imagens e game.html) para o GitHub
    if(!window.chrome.runtime.getURL) window.chrome.runtime.getURL = path => `${REPO_URL}/${path}`;
    
    // Simula Storage Local usando localStorage do navegador
    if(!window.chrome.storage.local) window.chrome.storage.local = {
        get: (keys, cb) => {
            let res = {};
            let kList = Array.isArray(keys) ? keys : (keys ? [keys] : []);
            if(kList.length === 0) { // Se pedir tudo
                 for(let i=0; i<localStorage.length; i++) {
                     let k = localStorage.key(i);
                     if(k.startsWith('MOD_') || k.includes('CONFIG')) res[k] = JSON.parse(localStorage.getItem(k));
                 }
            } else {
                kList.forEach(k => {
                    let val = localStorage.getItem(k);
                    try { val = JSON.parse(val); } catch(e){}
                    if(val === null && k.startsWith('MOD_')) val = true; // Padrão ON se não existir
                    if(val !== null) res[k] = val;
                });
            }
            if(cb) cb(res);
        },
        set: (items, cb) => {
            for(let k in items) localStorage.setItem(k, JSON.stringify(items[k]));
            if(cb) cb();
        }
    };
    if(!window.chrome.storage.onChanged) window.chrome.storage.onChanged = { addListener: ()=>{} };

    // 2. FUNÇÕES DE CARREGAMENTO
    function loadCSS(file) {
        let link = document.createElement("link");
        link.href = `${REPO_URL}/${file}?v=${Date.now()}`; // No-Cache
        link.rel = "stylesheet";
        link.type = "text/css";
        document.head.appendChild(link);
    }

    function lS(file) {
        return new Promise((resolve, reject) => {
            let script = document.createElement("script");
            script.src = `${REPO_URL}/${file}?v=${Date.now()}`; // No-Cache
            script.onload = resolve;
            script.onerror = () => { console.warn(`[Loader] Falha não crítica: ${file}`); resolve(); }; // Continua mesmo se falhar
            document.body.appendChild(script);
        });
    }

    // 3. EXECUÇÃO EM CASCATA (Ordem de Dependência Crítica)
    loadCSS("style.css");

    lS("compatibility.js") // 1. Configs Globais
        .then(() => lS("gerente.js"))     // 2. Filtros Visuais (Esconde o que não deve ver)
        .then(() => lS("bar.js"))         // 3. Ferramentas Técnicas
        .then(() => lS("monitor.js"))
        .then(() => lS("central.js"))
        .then(() => lS("respostas.js"))   // 4. Bancos de Dados
        .then(() => lS("protocolos.js"))
        .then(() => lS("extrator.js"))    // 5. Utilitários
        .then(() => lS("espelho.js"))
        .then(() => lS("car.js"))
        .then(() => lS("pausas.js"))      // 6. Automação
        .then(() => lS("ia.js"))          // 7. Inteligência
        .then(() => lS("menu.js"))        // 8. Interface Unificada (Trigger)
        .then(() => lS("cronometros.js")) // 9. Analytics (O mais pesado fica por último)
        .then(() => {
            // Notificação de Sucesso
            let t = document.createElement("div");
            t.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg, #667eea, #764ba2); color:#fff; padding:12px 25px; border-radius:50px; z-index:999999; font-weight:bold; font-family:'Segoe UI',sans-serif; box-shadow:0 10px 25px rgba(0,0,0,0.3); font-size:14px; display:flex; align-items:center; gap:10px; animation: slideDown 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);";
            t.innerHTML = `<span>🚀</span> Genesys Master Ativado (v${VERSION})`;
            document.body.appendChild(t);
            
            // Som de sucesso sutil (opcional)
            try { new Audio("https://www.soundjay.com/buttons/sounds/button-3.mp3").play().catch(()=>{}); } catch(e){}

            setTimeout(() => {
                t.style.transition = "opacity 0.5s, transform 0.5s";
                t.style.opacity = "0";
                t.style.transform = "translate(-50%, -50px)";
                setTimeout(() => t.remove(), 500);
            }, 4000);
        });

    // Injeta estilo da animação da notificação
    let style = document.createElement('style');
    style.innerHTML = "@keyframes slideDown { from { transform: translate(-50%, -100%); opacity:0; } to { transform: translate(-50%, 0); opacity:1; } }";
    document.head.appendChild(style);

})();
