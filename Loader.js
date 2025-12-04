(function() {
    // --- CONFIGURAÇÃO: MESTRE (ScriptGenesys) ---
    // Este é o repositório onde estão todos os arquivos reais.
    const REPO_URL = "https://scriptgenesys-code.github.io/Script-Completo";
    console.log("[Loader V25] Iniciando Mestre: " + REPO_URL);

    // 1. SIMULADOR DE EXTENSÃO (Polyfills para Chrome API)
    if(!window.chrome) window.chrome={};
    if(!window.chrome.runtime) window.chrome.runtime={};
    if(!window.chrome.storage) window.chrome.storage={};
    
    // Simula getURL para carregar ícones/imagens do GitHub
    if(!window.chrome.runtime.getURL) window.chrome.runtime.getURL = p => REPO_URL + "/" + p;
    
    // Simula o banco de dados local (usando localStorage do navegador)
    if(!window.chrome.storage.local) window.chrome.storage.local = {
        get: (keys, callback) => {
            let result = {};
            let keysToGet = Array.isArray(keys) ? keys : (keys === null ? [] : [keys]);
            
            if (keys === null) { // Se null, pega tudo
                for (let i = 0; i < localStorage.length; i++) {
                    let k = localStorage.key(i);
                    try { result[k] = JSON.parse(localStorage.getItem(k)); } 
                    catch(e) { result[k] = localStorage.getItem(k); }
                }
            } else {
                keysToGet.forEach(k => {
                    let val = localStorage.getItem(k);
                    try { val = JSON.parse(val); } catch(e) {}
                    if (val !== null) result[k] = val;
                });
            }
            if (callback) callback(result);
        },
        set: (items, callback) => {
            for (let k in items) {
                let val = items[k];
                if (typeof val === 'object') val = JSON.stringify(val);
                localStorage.setItem(k, val);
            }
            if (callback) callback();
        },
        remove: (keys, callback) => {
            let keysToRem = Array.isArray(keys) ? keys : [keys];
            keysToRem.forEach(k => localStorage.removeItem(k));
            if (callback) callback();
        }
    };

    // Simula Listener (Evita erros no Gerente.js)
    if(!window.chrome.storage.onChanged) window.chrome.storage.onChanged = { addListener: () => {} };

    // 2. FUNÇÕES DE CARREGAMENTO
    function loadCSS(filename) {
        let link = document.createElement("link");
        link.href = REPO_URL + "/" + filename + "?v=" + Date.now();
        link.rel = "stylesheet";
        link.type = "text/css";
        document.head.appendChild(link);
    }

    function loadScript(filename) {
        return new Promise((resolve, reject) => {
            let script = document.createElement("script");
            script.src = REPO_URL + "/" + filename + "?v=" + Date.now();
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    // 3. ORDEM DE EXECUÇÃO (Carrega todos os módulos)
    loadCSS("style.css");

    loadScript("compatibility.js")
        .then(() => loadScript("gerente.js"))
        .then(() => loadScript("bar.js"))
        .then(() => loadScript("monitor.js"))
        .then(() => loadScript("central.js"))
        .then(() => loadScript("respostas.js"))
        .then(() => loadScript("protocolos.js"))
        .then(() => loadScript("extrator.js"))
        .then(() => loadScript("espelho.js"))  // <--- MÓDULO NOVO INSERIDO
        .then(() => loadScript("pausas.js"))
        .then(() => loadScript("ia.js"))
        .then(() => loadScript("menu.js"))      // Interface visual
        .then(() => loadScript("cronometros.js")) // Lógica pesada (por último)
        .then(() => {
            console.log("✅ Sistema V25 Carregado com Sucesso!");
            
            // Notificação Visual de Sucesso
            let toast = document.createElement("div");
            toast.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#2ecc71; color:#fff; padding:10px 20px; border-radius:30px; z-index:999999; font-weight:bold; font-family:Segoe UI, sans-serif; box-shadow:0 5px 15px rgba(0,0,0,0.3); font-size:14px; display:flex; align-items:center; gap:8px;";
            toast.innerHTML = "<span>🚀</span> Sistema Genesys Ativo";
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.style.transition = "opacity 0.5s, transform 0.5s";
                toast.style.opacity = "0";
                toast.style.transform = "translate(-50%, -20px)";
                setTimeout(() => toast.remove(), 500);
            }, 3000);
        })
        .catch(err => {
            console.error("❌ Erro ao carregar o sistema:", err);
            alert("Erro ao carregar o sistema. Verifique o console (F12).");
        });
})();
