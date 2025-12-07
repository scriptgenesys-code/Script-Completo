(function() {
    // --- CONFIGURAÇÃO: MESTRE (ScriptGenesys) ---
    const REPO_URL = "https://scriptgenesys-code.github.io/Script-Completo";
    console.log("[Loader V28] Iniciando Mestre: " + REPO_URL);

    // --- 0. FORCE RESET (O segredo para aparecer sem F5) ---
    // Reseta as bandeiras de proteção para permitir que os scripts recarreguem
    window.GENESYS_CRONOMETROS_LOADED = false; 
    window.GENESYS_PAUSAS_LOADED = false;
    window.GENESYS_GERENTE_ACTIVE = false;
    // Limpa o menu antigo visualmente
    if(document.getElementById('uni-menu-container')) document.getElementById('uni-menu-container').remove();

    // 1. SIMULADOR DE EXTENSÃO (Polyfills)
    if(!window.chrome) window.chrome={};
    if(!window.chrome.runtime) window.chrome.runtime={};
    if(!window.chrome.storage) window.chrome.storage={};
    
    if(!window.chrome.runtime.getURL) window.chrome.runtime.getURL = p => REPO_URL + "/" + p;
    
    // Simula o banco de dados (usa localStorage do navegador)
    if(!window.chrome.storage.local) window.chrome.storage.local = {
        get: (keys, callback) => {
            let result = {};
            let keysToGet = Array.isArray(keys) ? keys : (keys === null ? [] : [keys]);
            
            if (keys === null) { 
                for (let i = 0; i < localStorage.length; i++) {
                    let k = localStorage.key(i);
                    // Filtra apenas chaves do nosso sistema
                    if(k.startsWith('MOD_') || k.startsWith('IA_') || k.startsWith('car_') || k.includes('activity')) {
                         try { result[k] = JSON.parse(localStorage.getItem(k)); } 
                         catch(e) { result[k] = localStorage.getItem(k); }
                    }
                }
            } else {
                keysToGet.forEach(k => {
                    let val = localStorage.getItem(k);
                    try { val = JSON.parse(val); } catch(e) {}
                    // GARANTIA: Se a configuração não existir, assume TRUE (Ativado)
                    if (val === null && k.startsWith('MOD_')) val = true; 
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

    if(!window.chrome.storage.onChanged) window.chrome.storage.onChanged = { addListener: () => {} };

    // 2. FUNÇÕES DE CARREGAMENTO
    function loadCSS(filename) {
        let link = document.createElement("link");
        link.href = REPO_URL + "/" + filename + "?v=" + Date.now();
        link.rel = "stylesheet";
        link.type = "text/css";
        document.head.appendChild(link);
    }

    function lS(filename) {
        return new Promise((resolve, reject) => {
            let script = document.createElement("script");
            script.src = REPO_URL + "/" + filename + "?v=" + Date.now();
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    // 3. ORDEM DE EXECUÇÃO
    loadCSS("style.css");

    lS("compatibility.js")
        .then(() => lS("gerente.js"))
        .then(() => lS("bar.js"))
        .then(() => lS("monitor.js"))
        .then(() => lS("central.js"))
        .then(() => lS("respostas.js"))
        .then(() => lS("protocolos.js"))
        .then(() => lS("extrator.js"))
        .then(() => lS("espelho.js"))
        .then(() => lS("car.js"))
        .then(() => lS("pausas.js"))
        .then(() => lS("ia.js"))
        .then(() => lS("menu.js"))
        .then(() => lS("cronometros.js")) // Cronômetros carrega por último
        .then(() => {
            console.log("✅ Sistema V28 Carregado com Sucesso!");
            
            let toast = document.createElement("div");
            toast.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:#8e44ad; color:#fff; padding:10px 20px; border-radius:30px; z-index:999999; font-weight:bold; font-family:Segoe UI, sans-serif; box-shadow:0 5px 15px rgba(0,0,0,0.3); font-size:14px; display:flex; align-items:center; gap:8px;";
            toast.innerHTML = "<span>☁️</span> Genesys Master (V28)";
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
            alert("Erro no Loader. Verifique o console.");
        });
})();
