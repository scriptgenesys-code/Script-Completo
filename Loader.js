(function() {
    console.log("[Loader V13] Iniciando modo de compatibilidade (Bookmarklet/Tampermonkey)...");

    // --- 1. URL BASE (Onde estão os arquivos no GitHub) ---
    // IMPORTANTE: Usa o raw.githack ou raw.githubusercontent para garantir que carrega como script
    const REPO_URL = "https://scriptgenesys-code.github.io/Script-Completo";

    // --- 2. SIMULADOR DE EXTENSÃO (POLYFILL) ---
    // Isto faz o navegador "fingir" que tem as APIs do Chrome
    if (!window.chrome) window.chrome = {};
    if (!window.chrome.runtime) window.chrome.runtime = {};
    if (!window.chrome.storage) window.chrome.storage = {};

    // Simula chrome.runtime.getURL (para carregar ícones/imagens)
    if (!window.chrome.runtime.getURL) {
        window.chrome.runtime.getURL = function(path) {
            return REPO_URL + "/" + path;
        };
    }

    // Simula chrome.storage.local (usa o localStorage do navegador)
    if (!window.chrome.storage.local) {
        window.chrome.storage.local = {
            get: function(keys, callback) {
                let result = {};
                let keysToGet = Array.isArray(keys) ? keys : [keys];
                
                // Se for null, pega tudo (comportamento do chrome)
                if (keys === null) {
                    for (let i = 0; i < localStorage.length; i++) {
                        let k = localStorage.key(i);
                        try { result[k] = JSON.parse(localStorage.getItem(k)); } 
                        catch(e) { result[k] = localStorage.getItem(k); }
                    }
                } else {
                    keysToGet.forEach(k => {
                        let val = localStorage.getItem(k);
                        try { val = JSON.parse(val); } catch(e) {} // Tenta converter JSON, se falhar usa texto
                        if (val !== null) result[k] = val;
                    });
                }
                if (callback) callback(result);
            },
            set: function(items, callback) {
                for (let k in items) {
                    let val = items[k];
                    if (typeof val === 'object') val = JSON.stringify(val);
                    localStorage.setItem(k, val);
                }
                if (callback) callback();
            },
            remove: function(keys, callback) {
                let keysToRem = Array.isArray(keys) ? keys : [keys];
                keysToRem.forEach(k => localStorage.removeItem(k));
                if (callback) callback();
            }
        };
    }
    
    // Simula o Listener de mudanças (para o Gerente.js funcionar)
    if (!window.chrome.storage.onChanged) {
        window.chrome.storage.onChanged = {
            addListener: function(callback) {
                // Simplificação: Não monitora mudanças em tempo real no modo Bookmarklet
                // Mas evita que o script quebre ao tentar adicionar o listener.
                console.log("[Polyfill] Listener de storage registado (simulado).");
            }
        };
    }

    // --- 3. CARREGADOR DE SCRIPTS E CSS ---
    
    function loadCSS(filename) {
        var link = document.createElement("link");
        link.href = REPO_URL + "/" + filename + "?v=" + Date.now();
        link.type = "text/css";
        link.rel = "stylesheet";
        document.head.appendChild(link);
    }

    function loadScript(filename) {
        return new Promise((resolve, reject) => {
            var script = document.createElement("script");
            script.src = REPO_URL + "/" + filename + "?v=" + Date.now();
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    // --- 4. ORDEM DE EXECUÇÃO ---
    // Carrega tudo na ordem certa
    loadCSS("style.css"); // Carrega o estilo global (embora algumas coisas sejam isoladas no ShadowDOM)

    // Sequência de Scripts
    loadScript("compatibility.js")
        .then(() => loadScript("gerente.js"))
        .then(() => loadScript("bar.js"))
        .then(() => loadScript("respostas.js"))
        .then(() => loadScript("protocolos.js"))
        .then(() => loadScript("extrator.js"))
        .then(() => loadScript("pausas.js"))
        .then(() => loadScript("ia.js"))
        .then(() => loadScript("menu.js"))
        .then(() => loadScript("cronometros.js"))
        .then(() => {
            console.log("✅ [Loader V13] Todos os módulos carregados via Bookmarklet!");
            
            // Pequeno aviso visual para confirmar que carregou
            let toast = document.createElement("div");
            toast.style.cssText = "position:fixed; top:10px; left:50%; transform:translateX(-50%); background:#2ecc71; color:white; padding:10px 20px; border-radius:20px; z-index:99999; font-weight:bold; box-shadow:0 5px 15px rgba(0,0,0,0.3);";
            toast.innerText = "🚀 Sistema Genesys V13 Carregado!";
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        })
        .catch(err => console.error("❌ [Loader] Erro ao carregar scripts:", err));

})();