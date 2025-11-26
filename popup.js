// ✅ URL DO SEU WEB APP
const API_URL = "https://script.google.com/macros/s/AKfycbyBkz1XED-bMLDrPX19VMPoHmMB2_WovBb-Pn2HN1MG0P3lQOl6MkVCkcI6_Yo6WiGsEg/exec";

let dadosGlobais = [];
let listaAtendimentosGlobal = [];
let listaEncerradosGlobal = [];
let usuarioAtual = ""; 

document.addEventListener("DOMContentLoaded", () => {
    verificarSessao();
    document.getElementById("btn-login").onclick = realizarLogin;
    document.getElementById("btn-logout").onclick = fazerLogout;
    document.getElementById("btn-popout").onclick = abrirEmJanela;
    document.getElementById("btn-gestao").onclick = abrirGestao; 
    document.getElementById("btn-modulos").onclick = abrirModulos; 
    document.getElementById("btn-save-pass").onclick = salvarNovaSenha; 
    document.getElementById("btn-save-modules").onclick = salvarModulos; 
    document.getElementById("btn-refresh").onclick = carregarDados;
    document.getElementById("btn-search-manual").onclick = carregarDados;
    document.querySelectorAll(".close-modal").forEach(b => b.onclick = fecharModais);
    document.getElementById("login-pass").addEventListener("keypress", (e) => { if (e.key === "Enter") realizarLogin(); });
    setupKpiInteractions();
});

// --- MÓDULOS ---
function abrirModulos() {
    document.getElementById("modal-modulos").style.display = "block";
    chrome.storage.local.get([
        'MOD_CRONOMETROS', 'MOD_PAUSAS', 'MOD_PROTOCOLOS', 
        'MOD_RESPOSTAS', 'MOD_BAR', 'MOD_MENU', 'MOD_IA', 'MOD_ID' // Adicionado MOD_ID
    ], (r) => {
        document.getElementById("mod-cronometros").checked = r.MOD_CRONOMETROS !== false;
        document.getElementById("mod-pausas").checked = r.MOD_PAUSAS !== false;
        document.getElementById("mod-protocolos").checked = r.MOD_PROTOCOLOS !== false;
        document.getElementById("mod-respostas").checked = r.MOD_RESPOSTAS !== false;
        document.getElementById("mod-bar").checked = r.MOD_BAR !== false;
        document.getElementById("mod-menu").checked = r.MOD_MENU !== false;
        document.getElementById("mod-ia").checked = r.MOD_IA !== false;
        document.getElementById("mod-id").checked = r.MOD_ID !== false; // Adicionado
    });
}

function salvarModulos() {
    const config = {
        'MOD_CRONOMETROS': document.getElementById("mod-cronometros").checked,
        'MOD_PAUSAS': document.getElementById("mod-pausas").checked,
        'MOD_PROTOCOLOS': document.getElementById("mod-protocolos").checked,
        'MOD_RESPOSTAS': document.getElementById("mod-respostas").checked,
        'MOD_BAR': document.getElementById("mod-bar").checked,
        'MOD_MENU': document.getElementById("mod-menu").checked,
        'MOD_IA': document.getElementById("mod-ia").checked,
        'MOD_ID': document.getElementById("mod-id").checked // Adicionado
    };

    chrome.storage.local.set(config, () => {
        const btn = document.getElementById("btn-save-modules");
        const originalText = btn.innerText;
        btn.innerText = "Salvo! Recarregue a página.";
        btn.style.background = "var(--success)";
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = "var(--primary)";
            fecharModais();
            chrome.tabs.query({url: ["*://*.mypurecloud.com/*", "*://*.genesys.cloud/*"]}, tabs => {
                tabs.forEach(t => chrome.tabs.reload(t.id));
            });
        }, 1500);
    });
}

// --- KPI ---
function setupKpiInteractions() {
    document.getElementById("card-logados").onclick = () => {
        if (dadosGlobais.length === 0) return;
        const online = dadosGlobais.filter(u => u.status === "Online");
        const itens = online.map(u => ({ titulo: u.nome, info1: "Setor: " + (u.setor || "N/A"), info2: "TMA Hoje: " + u.tma, link: "" }));
        abrirModalLista("👥 Agentes Online Agora", itens);
    };
    document.getElementById("card-atendimentos").onclick = () => {
        if (listaAtendimentosGlobal.length === 0) return;
        const itens = listaAtendimentosGlobal.map(i => ({ titulo: "✅ " + i.cliente, info1: `Agente: ${i.agente} | ${i.hora}`, info2: `TMA: ${i.tma}`, link: i.link }));
        abrirModalLista("✅ Todos os Atendimentos", itens);
    };
    document.getElementById("card-encerrados").onclick = () => {
        if (listaEncerradosGlobal.length === 0) return;
        const itens = listaEncerradosGlobal.map(i => ({ titulo: "⛔ " + i.cliente, info1: `Agente: ${i.atendente} | ${i.hora}`, info2: "Manual", link: i.link }));
        abrirModalLista("⛔ Encerramentos Manuais", itens);
    };
    document.getElementById("card-tma").onclick = () => {
        if (dadosGlobais.length === 0) return;
        const ranking = [...dadosGlobais].sort((a, b) => tmaToSeconds(b.tma) - tmaToSeconds(a.tma));
        const itens = ranking.map((u, index) => ({ titulo: `#${index + 1} ${u.nome}`, info1: `TMA Médio: ${u.tma}`, info2: `Atendimentos: ${u.conversas}`, link: "" }));
        abrirModalLista("⏱️ Ranking TMA (Maior p/ Menor)", itens);
    };
}

function tmaToSeconds(tmaStr) { if(!tmaStr) return 0; const p = tmaStr.split(':'); return (parseInt(p[0]) * 60) + parseInt(p[1]); }

// --- AUTH & CRYPTO ---
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function realizarLogin() {
    const user = document.getElementById("login-user").value;
    const pass = document.getElementById("login-pass").value;
    const msg = document.getElementById("login-msg");
    const btn = document.getElementById("btn-login");

    if (!user || !pass) { msg.innerText = "Preencha tudo."; return; }
    btn.innerText = "Criptografando..."; btn.disabled = true;

    try {
        const passHash = await sha256(pass);
        btn.innerText = "Autenticando...";
        const response = await fetch(API_URL, { 
            method: 'POST', 
            body: JSON.stringify({ type: 'login', user: user, passHash: passHash }) 
        });
        const data = await response.json();
        if (data.status === 'success') {
            chrome.storage.local.set({ 'ADMIN_SESSION_TOKEN': data.token, 'CURRENT_USER': user }, () => {
                usuarioAtual = user; mostrarApp();
            });
        } else {
            msg.innerText = data.message || "Erro."; btn.innerText = "Acessar Painel"; btn.disabled = false;
        }
    } catch (error) { msg.innerText = "Erro conexão."; btn.innerText = "Acessar Painel"; btn.disabled = false; }
}

async function salvarNovaSenha() {
    const tU = document.getElementById("gestao-user-select").value; 
    const nP = document.getElementById("gestao-new-pass").value;
    const msg = document.getElementById("gestao-msg"); 
    const btn = document.getElementById("btn-save-pass");
    
    if (!nP) return; 
    btn.disabled = true; btn.innerText = "Criptografando...";
    
    try { 
        const newPassHash = await sha256(nP);
        btn.innerText = "Enviando...";
        const res = await fetch(API_URL, { 
            method: 'POST', 
            body: JSON.stringify({ type: 'alterarSenha', adminUser: usuarioAtual, targetUser: tU, newPassHash: newPassHash }) 
        });
        const d = await res.json(); 
        if (d.status === 'success') { msg.innerText = "Senha Alterada!"; msg.style.color = "var(--success)"; } 
        else { msg.innerText = d.message; msg.style.color = "var(--danger)"; } 
    } catch (e) { msg.innerText = "Erro."; } 
    btn.disabled = false; btn.innerText = "💾 Salvar";
}

// --- APP LOGIC ---
function verificarSessao() {
    chrome.storage.local.get(['ADMIN_SESSION_TOKEN', 'CURRENT_USER'], (result) => {
        if (result.ADMIN_SESSION_TOKEN) { usuarioAtual = result.CURRENT_USER || ""; mostrarApp(); } 
        else { document.getElementById("login-screen").style.display = "flex"; }
    });
}

function mostrarApp() {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("app-content").style.display = "block";
    setupApp();
    carregarDados();
}

function setupApp() {
    const hoje = new Date(new Date() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
    const dtInicio = document.getElementById("data-inicio");
    const dtFim = document.getElementById("data-fim");
    
    if (!dtInicio.value) dtInicio.value = hoje;
    if (!dtFim.value) dtFim.value = hoje;
    
    document.getElementById("search").oninput = () => {
        const t = document.getElementById("search").value.toLowerCase();
        renderizarLista(dadosGlobais.filter(a => a.nome.toLowerCase().includes(t)));
    };
}

async function carregarDados() {
    const container = document.getElementById("lista-agentes");
    const dataIni = document.getElementById("data-inicio").value;
    const dataFim = document.getElementById("data-fim").value;
    
    container.innerHTML = "<div class=\"loading\">Carregando dados...</div>";
    
    try {
        const url = `${API_URL}?dataInicio=${dataIni}&dataFim=${dataFim}&user=${usuarioAtual}`;
        const response = await fetch(url);
        const data = await response.json();
        
        let role = data.permissoes ? data.permissoes.role : "";
        let setor = data.permissoes ? data.permissoes.setor : "";
        if (role === "ADMIN" || setor === "ADMIN") {
            document.getElementById("btn-gestao").style.display = "block";
            if(data.usuariosGestao) preencherSelectGestao(data.usuariosGestao);
        } else {
            document.getElementById("btn-gestao").style.display = "none";
        }

        let agentes = data.agentes || [];
        listaAtendimentosGlobal = data.detalhesAtendimentos || [];
        listaEncerradosGlobal = data.detalhesEncerrados || [];
        dadosGlobais = agentes;
        
        if (agentes.length === 0) { 
            container.innerHTML = "<div class=\"loading\">Sem dados no período.</div>"; 
            atualizarResumo([],0,0);
            document.getElementById("chart-container").innerHTML = "<div class='loading-chart'>Sem dados</div>";
            return; 
        }
        atualizarResumo(agentes);
        renderizarLista(agentes);
        renderizarGrafico(agentes);
    } catch (error) { console.error(error); container.innerHTML = "<div class=\"loading\" style=\"color:var(--danger)\">Erro.</div>"; }
}

function atualizarResumo(agentes) {
    const logados = agentes.filter(u => u.status === "Online");
    document.getElementById("total-logados").innerText = logados.length;
    document.getElementById("total-conversas").innerText = listaAtendimentosGlobal.length;
    document.getElementById("total-encerrados").innerText = listaEncerradosGlobal.length;
    
    let totalSegundos = 0; let totalCalls = 0;
    agentes.forEach(a => { totalSegundos += (a.tmaSoma || 0); totalCalls += (a.conversas || 0); });
    let mediaGeral = totalCalls > 0 ? Math.floor(totalSegundos / totalCalls) : 0;
    document.getElementById("media-tma").innerText = formatarTempo(mediaGeral);
}

function renderizarGrafico(agentes) {
    const container = document.getElementById("chart-container"); container.innerHTML = "";
    let top5 = [...agentes].sort((a,b) => b.conversas - a.conversas).slice(0, 5);
    let maxVal = top5.length > 0 ? top5[0].conversas : 1;
    top5.forEach(agente => {
        let width = (agente.conversas / maxVal) * 100;
        let row = document.createElement("div"); row.className = "chart-row";
        row.innerHTML = `<div class="chart-name" title="${agente.nome}">${agente.nome.split(' ')[0]}</div><div class="chart-bar-bg"><div class="chart-bar-fill" style="width: ${width}%"></div></div><div class="chart-val">${agente.conversas}</div>`;
        container.appendChild(row);
    });
}

function renderizarLista(lista) {
    const container = document.getElementById("lista-agentes"); container.innerHTML = "";
    lista.sort((a, b) => b.conversas - a.conversas);
    lista.forEach(agente => {
        let tempoTotal = formatarTempo(agente.tmaSoma || 0);
        const div = document.createElement("div"); div.className = `agente-item ${agente.status === "Online" ? "online" : "offline"}`;
        div.innerHTML = `<div class="agente-header"><span class="agente-name">${agente.nome}</span><span class="agente-status">${agente.status === "Online"?"🟢":"🔴"}</span></div><div class="agente-metrics"><div class="metric"><span>Atend</span><span>${agente.conversas}</span></div><div class="metric"><span>TMA Med</span><span>${agente.tma}</span></div><div class="metric" style="color:var(--gold)"><span>T. Total</span><span>${tempoTotal}</span></div></div>`;
        div.onclick = () => {
             const ats = listaAtendimentosGlobal.filter(i => i.agente === agente.nome).map(i => ({ titulo: "✅ " + i.cliente, info1: i.hora + " | TMA: " + i.tma, info2: "Link", link: i.link }));
             const encs = listaEncerradosGlobal.filter(i => i.atendente === agente.nome).map(i => ({ titulo: "⛔ " + i.cliente, info1: i.hora, info2: "Manual", link: i.link }));
             abrirModalLista(agente.nome, [...encs, ...ats].sort((a,b) => b.info1 < a.info1 ? -1 : 1));
        };
        container.appendChild(div);
    });
}

function formatarTempo(segundos) { let m = Math.floor(segundos / 60); let s = segundos % 60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
function abrirModalLista(titulo, itens) {
    const container = document.getElementById("modal-lista-container"); document.getElementById("modal-titulo").innerText = titulo; container.innerHTML = "";
    if (!itens || itens.length === 0) container.innerHTML = "<p style=\"text-align:center;color:#888\">Vazio.</p>";
    else {
        itens.forEach(item => {
            const div = document.createElement("div"); div.className = "detalhe-item";
            let linkHtml = (item.link && item.link !== "N/A") ? `<div class="detalhe-link"><a href="${item.link}" target="_blank">Link 🔗</a></div>` : "";
            div.innerHTML = `<div class="detalhe-header"><span>${item.titulo}</span></div><div class="detalhe-sub"><span>${item.info1}</span></div>${linkHtml}`;
            container.appendChild(div);
        });
    }
    document.getElementById("modal-detalhes").style.display = "block";
}

function fazerLogout() { chrome.storage.local.remove(['ADMIN_SESSION_TOKEN', 'CURRENT_USER'], () => location.reload()); }
function fecharModais() { document.getElementById("modal-detalhes").style.display = "none"; document.getElementById("modal-gestao").style.display = "none"; document.getElementById("modal-modulos").style.display = "none"; }
function abrirEmJanela() { chrome.windows.create({ url: "popup.html", type: "popup", width: 400, height: 600 }); }
function abrirGestao() { document.getElementById("modal-gestao").style.display = "block"; document.getElementById("gestao-msg").innerText = ""; document.getElementById("gestao-new-pass").value = ""; }
function preencherSelectGestao(usuarios) { const s = document.getElementById("gestao-user-select"); s.innerHTML = ""; usuarios.forEach(u => { let o = document.createElement("option"); o.value = u.usuario; o.innerText = `${u.usuario} (${u.setor})`; s.appendChild(o); }); }