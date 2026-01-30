(function() {
    // =================================================================
    // 1. ESCUDO DE SILÊNCIO (SISTEMA DE SEGURANÇA SONORA)
    // =================================================================
    // Link do Bip Oficial (Autorizado)
    const BIP_AUTORIZADO = "https://actions.google.com/sounds/v1/foley/button_click.ogg";

    // Sobrescreve a criação de áudio do navegador
    window.Audio = class extends Audio {
        constructor(src) {
            super(src);
            // Verifica se o som é o nosso bip. Se não for, marca como não autorizado.
            // O .includes garante que mesmo se houver parâmetros extras na URL, ele reconheça.
            this.isAuthorized = src && src.includes("button_click.ogg");
            
            if (!this.isAuthorized) {
                console.log("%c[Security] Som bloqueado preventivamente: " + src, "color: #e74c3c; font-style: italic;");
            }
        }

        play() { 
            // Se for o bip autorizado, toca normalmente
            if (this.isAuthorized) {
                return super.play();
            }
            // Se for o grito ou outro som, retorna uma promessa falsa (finge que tocou, mas fica mudo)
            return Promise.resolve(); 
        }
    };

    // =================================================================
    // 2. LOADER MESTRE (V31.0 - LIMPEZA & CARREGAMENTO)
    // =================================================================

    const REPO_URL = "https://scriptgenesys-code.github.io/Script-Completo";
    const VERSION = "31.0";
    console.log(`[Loader V${VERSION}] Conectando ao Mestre...`);

    // --- LIMPEZA AGRESSIVA (Remove versões antigas e bugs visuais) ---
    const idsLimpeza = [
        'uni-menu-container', 'purecloud-script-mini-dashboard',
        'estilo-gerente-visual', 'qr-script-injected-style',
        'game-overlay-backdrop', 'central-modal-overlay',
        'bau-rede', 'purecloud-script-notification-container'
    ];

    idsLimpeza.forEach(id => {
        let el = document.getElementById(id);
        if(el) el.remove();
        let els = document.querySelectorAll(`.${id}`);
        els.forEach(e => e.remove());
    });

    // --- POLYFILLS (Simulador de Extensão para funcionar no Navegador) ---
    if(!window.chrome) window.chrome={};
    if(!window.chrome.runtime) window.chrome.runtime={};
    if(!window.chrome.storage) window.chrome.storage={};
    
    // Redireciona recursos locais para o GitHub
    if(!window.chrome.runtime.getURL) window.chrome.runtime.getURL = path => `${REPO_URL}/${path}`;
    
    // Simula o armazenamento local (Storage)
    if(!window.chrome.storage.local) window.chrome.storage.local = {
        get: (keys, cb) => {
            let res = {};
            let kList = Array.isArray(keys) ? keys : (keys ? [keys] : []);
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

    // --- FUNÇÕES DE CARREGAMENTO ---
    function loadCSS(file) {
        let link = document.createElement("link");
        link.href = `${REPO_URL}/${file}?v=${Date.now()}`;
        link.rel = "stylesheet";
        link.type = "text/css";
        document.head.appendChild(link);
    }

    function lS(file) {
        return new Promise((resolve, reject) => {
            let script = document.createElement("script");
            script.src = `${REPO_URL}/${file}?v=${Date.now()}`;
            script.onload = resolve;
            script.onerror = () => { 
                console.warn(`[Loader] Aviso: ${file} não carregou.`); 
                resolve(); // Não trava o carregamento se um arquivo falhar
            };
            document.body.appendChild(script);
        });
    }

    // --- ORDEM DE CARREGAMENTO (CASCATA) ---
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
        .then(() => lS("cronometros.js"))
        .then(() => {
            // --- SUCESSO! ---
            
            // 1. Notificação Visual
            let t = document.createElement("div");
            t.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg, #10b981, #059669); color:#fff; padding:12px 25px; border-radius:50px; z-index:2147483647; font-weight:bold; font-family:'Segoe UI',sans-serif; box-shadow:0 10px 25px rgba(0,0,0,0.3); font-size:14px; display:flex; align-items:center; gap:10px; pointer-events:none;";
            t.innerHTML = `<span>✅</span> Sistema Atualizado (v${VERSION})`;
            document.body.appendChild(t);
            
            // 2. Tocar Bip Autorizado
            try { 
                let bip = new Audio(BIP_AUTORIZADO); 
                bip.volume = 0.4; // Volume agradável
                bip.play().catch(e => console.log("Autoplay bloqueado pelo navegador")); 
            } catch(e){}

            // 3. Remover notificação após 3 segundos
            setTimeout(() => {
                t.style.transition = "opacity 0.5s, transform 0.5s";
                t.style.opacity = "0";
                t.style.transform = "translate(-50%, -50px)";
                setTimeout(() => t.remove(), 500);
            }, 3000);
        })
        .catch(err => {
            console.error("[Loader] Erro Crítico:", err);
            alert("Erro ao carregar Genesys Master.");
        });

})();
