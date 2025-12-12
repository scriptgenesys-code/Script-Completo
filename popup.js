// popup.js

const API_URL = window.GENESYS_CONFIG ? window.GENESYS_CONFIG.API_URL : null;

let todosAgentes = [], todosAtendimentos = [], todosEncerrados = [];
let usuarioLogado = "", agenteSelecionadoGlobal = "todos"; 

document.addEventListener("DOMContentLoaded", () => {
    if (!API_URL) {
        document.body.innerHTML = `
            <div style="padding:20px; text-align:center; color:#ff4d4d; font-family:sans-serif;">
                <h3>Erro de Configuração</h3>
                <p>O arquivo <b>compatibility.js</b> não carregou.</p>
                <p style="font-size:12px; color:#aaa;">Certifique-se que ele está na pasta e importado antes do popup.js.</p>
            </div>`;
        return;
    }

    verificarSessao();
    
    document.getElementById("btn-login").onclick = realizarLogin;
    document.getElementById("btn-logout").onclick = fazerLogout;
    document.getElementById("btn-search-manual").onclick = carregarDados;
    document.getElementById("btn-refresh").onclick = carregarDados;
    document.getElementById("btn-popout").onclick = abrirEmJanela;
    document.getElementById("btn-export").onclick = exportarRelatorio;
    
    document.getElementById("filtro-agente").onchange = (e) => {
        agenteSelecionadoGlobal = e.target.value;
        filtrarVisao(agenteSelecionadoGlobal);
    };
    
    document.getElementById("search-list").oninput = (e) => {
        const termo = e.target.value.toLowerCase();
        renderizarListaGlobal(todosAgentes.filter(a => a.nome && a.nome.toLowerCase().includes(termo)));
    };
    
    document.getElementById("btn-modulos").onclick = abrirModulos;
    document.getElementById("btn-gestao").onclick = () => document.getElementById("modal-gestao").style.display="block";
    document.getElementById("btn-save-modules").onclick = salvarModulos;
    document.getElementById("btn-save-pass").onclick = salvarNovaSenha;
    document.querySelectorAll(".close-modal").forEach(b => b.onclick = fecharModais);

    setupKpiInteractions();
});

function exportarRelatorio() {
    const isGlobal = agenteSelecionadoGlobal === "todos";
    const nomeArquivo = isGlobal ? "Relatorio_Geral" : `Relatorio_${agenteSelecionadoGlobal.replace(/ /g, '_')}`;
    let listaExportacao = [];
    let atendimentosFiltrados = isGlobal ? todosAtendimentos : todosAtendimentos.filter(i => compararNomes(i.agente, agenteSelecionadoGlobal));
    let encerradosFiltrados = isGlobal ? todosEncerrados : todosEncerrados.filter(i => compararNomes(i.atendente, agenteSelecionadoGlobal) || compararNomes(i.agente, agenteSelecionadoGlobal));
    const processado = processarRecorrencia(atendimentosFiltrados);
    atendimentosFiltrados = processado.lista;
    atendimentosFiltrados.forEach(item => { listaExportacao.push({ Data: item.data || obterDataLocal(), Hora: item.hora, Tipo: "ATENDIMENTO", Agente: item.agente, Cliente: item.cliente, TMA: item.tma || "00:00", Status: item.isRecorrencia ? "Recorrência" : "Único", Link: item.link || "N/A" }); });
    encerradosFiltrados.forEach(item => { listaExportacao.push({ Data: obterDataLocal(), Hora: item.hora, Tipo: "ENCERRAMENTO MANUAL", Agente: item.atendente || item.agente || "Desconhecido", Cliente: item.cliente || "Desconhecido", TMA: "-", Status: "-", Link: item.link || "N/A" }); });
    listaExportacao.sort((a, b) => a.Hora.localeCompare(b.Hora));
    const jsonContent = JSON.stringify(listaExportacao, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", `${nomeArquivo}_${obterDataLocal()}.json`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

function obterDataLocal() { const agora = new Date(); const local = new Date(agora.getTime() - (agora.getTimezoneOffset() * 60000)); return local.toISOString().slice(0, 10); }
function tmaToSeconds(t){if(!t)return 0;const p=t.split(':');return(parseInt(p[0]||0)*60)+parseInt(p[1]||0);}
function formatarTempo(s){let m=Math.floor(s/60);let seg=s%60;return`${String(m).padStart(2,'0')}:${String(seg).padStart(2,'0')}`;}
function compararNomes(n1, n2) { if (!n1 || !n2) return false; return n1.trim().toLowerCase() === n2.trim().toLowerCase(); }
function processarRecorrencia(lista) { let unicos = new Set(); let listaProcessada = []; let countUnicos = 0; lista.sort((a, b) => (a.data+a.hora).localeCompare(b.data+b.hora)); lista.forEach(item => { const d = item.data || obterDataLocal(); const c = (item.cliente || "sem_nome").trim().toLowerCase(); const t = item.telefone || ""; const chave = `${d}_${c}_${t}`; if (unicos.has(chave)) item.isRecorrencia = true; else { item.isRecorrencia = false; unicos.add(chave); countUnicos++; } listaProcessada.push(item); }); return { lista: listaProcessada, totalUnicos: countUnicos }; }

async function carregarDados() {
    const btn = document.getElementById("btn-refresh"); btn.style.transform = "rotate(180deg)";
    try {
        const container = document.getElementById("lista-agentes-container"); container.innerHTML = "<div class='loading' style='text-align:center; padding:20px'>Carregando...</div>";
        const url = `${API_URL}?dataInicio=${document.getElementById("data-inicio").value}&dataFim=${document.getElementById("data-fim").value}&user=${usuarioLogado}`;
        const res = await fetch(url); const data = await res.json();
        if (data.permissoes && (data.permissoes.role === "ADMIN" || data.permissoes.setor === "ADMIN")) { document.getElementById("btn-gestao").style.display = "block"; if(data.usuariosGestao) preencherSelectGestao(data.usuariosGestao); } else { document.getElementById("btn-gestao").style.display = "none"; }
        todosAgentes = data.agentes || []; todosAtendimentos = data.detalhesAtendimentos || []; todosEncerrados = data.detalhesEncerrados || [];
        preencherDropdown(todosAgentes); renderizarGrafico(todosAgentes); renderizarListaGlobal(todosAgentes); filtrarVisao(agenteSelecionadoGlobal);
        setTimeout(() => btn.style.transform = "rotate(0deg)", 500);
    } catch (e) { console.error(e); document.getElementById("lista-agentes-container").innerHTML = "<div style='text-align:center; color:var(--danger)'>Erro Conexão</div>"; }
}

function filtrarVisao(agente) {
    const viewGeral = document.getElementById("view-geral"); const viewIndiv = document.getElementById("view-individual");
    document.getElementById("titulo-agente-selecionado").innerText = "👤 " + agente;
    let la, lat, lenc, countU = 0;
    if (agente === "todos") { viewGeral.style.display = "block"; viewIndiv.style.display = "none"; la = todosAgentes; lat = todosAtendimentos; lenc = todosEncerrados; countU = lat.length; } 
    else { viewGeral.style.display = "none"; viewIndiv.style.display = "block"; la = todosAgentes.filter(a => compararNomes(a.nome, agente)); let rawLat = todosAtendimentos.filter(i => compararNomes(i.agente, agente)); const proc = processarRecorrencia(rawLat); lat = proc.lista; countU = proc.totalUnicos; lenc = todosEncerrados.filter(i => compararNomes(i.atendente, agente) || compararNomes(i.agente, agente)); renderizarListaDetalhe("lista-individual-atendimentos", lat); renderizarListaDetalhe("lista-individual-encerrados", lenc); }
    atualizarKPIs(la, countU, lenc.length, agente !== "todos");
}

function atualizarKPIs(a, ca, ce, ind) { const el = document.getElementById("total-logados"); if (ind) { if(a.length) { el.innerText=a[0].status==="Online"?"ON":"OFF"; el.style.color=a[0].status==="Online"?"var(--success)":"var(--danger)"; } else el.innerText="-"; } else { el.innerText = a.filter(u => u.status === "Online").length; el.style.color = "var(--primary)"; } document.getElementById("total-conversas").innerText = ca; document.getElementById("total-encerrados").innerText = ce; let m=0; if(ind && a.length) m=tmaToSeconds(a[0].tma); else { let s=0,q=0; a.forEach(x=>{s+=(x.tmaSoma||0); q+=(x.conversas||0)}); m=q>0?Math.floor(s/q):0; } document.getElementById("media-tma").innerText = formatarTempo(m); }
function renderizarListaGlobal(lista) { const c = document.getElementById("lista-agentes-container"); c.innerHTML = ""; if(!lista.length) { c.innerHTML="<div style='text-align:center;padding:10px;color:#666'>Vazio.</div>"; return; } lista.sort((a,b)=>(parseInt(b.conversas)||0)-(parseInt(a.conversas)||0)); lista.forEach(ag => { if(!ag.nome) return; const d = document.createElement("div"); d.className = "agente-row"; const cor = ag.status==="Online"?"var(--success)":"var(--danger)"; d.innerHTML = `<div class="agente-info"><span class="agente-nome">${ag.nome}</span><span class="agente-detalhe"><span style="color:${cor}">● ${ag.status||'Off'}</span> | TMA: ${ag.tma||'00:00'}</span></div><div class="agente-valor">${ag.conversas||0}</div>`; d.onclick=()=>{document.getElementById("filtro-agente").value=ag.nome; agenteSelecionadoGlobal=ag.nome; filtrarVisao(ag.nome);}; c.appendChild(d); }); }
function renderizarListaDetalhe(id, lista) { const c = document.getElementById(id); c.innerHTML = ""; const isAtend = id.includes("atendimentos"); const cid = isAtend ? "count-atendimentos" : "count-encerrados"; const totalVisual = isAtend ? lista.filter(x => !x.isRecorrencia).length : lista.length; document.getElementById(cid).innerText = totalVisual; if(!lista.length) { c.innerHTML="<div style='padding:10px;text-align:center;color:#666;font-size:12px'>Sem registros.</div>"; return; } [...lista].reverse().forEach(i => { const d = document.createElement("div"); d.className = "detalhe-item"; const quem = i.atendente || i.agente || "Sistema"; const link = i.link ? `<a href="${i.link}" target="_blank" class="link-btn">Link 🔗</a>` : ""; let tag = (isAtend && i.isRecorrencia) ? `<span class="tag-recorrencia">🔁 Recorrência</span>` : ""; d.innerHTML = `<div class="item-content"><span class="item-title">${i.cliente || "Cliente"} ${tag}</span><span class="item-sub">🕒 ${i.hora} <span style="margin:0 5px">|</span> 👤 ${quem}</span></div>${link}`; c.appendChild(d); }); }
function renderizarGrafico(l){const c=document.getElementById("chart-container");c.innerHTML="";const t=[...l.filter(x=>x.nome&&x.conversas!==undefined)].sort((a,b)=>b.conversas-a.conversas).slice(0,5); const m=t.length?t[0].conversas:1; if(!t.length)c.innerHTML="<div class='loading'>Sem dados</div>"; t.forEach(x=>{const w=(x.conversas/m)*100; c.innerHTML+=`<div class="bar-row"><div class="bar-name">${x.nome.split(' ')[0]}</div><div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div><div class="bar-val">${x.conversas}</div></div>`;});}
function preencherDropdown(l){const s=document.getElementById("filtro-agente"); const v=s.value; while(s.options.length>1)s.remove(1); l.filter(x=>x.nome).sort((a,b)=>a.nome.localeCompare(b.nome)).forEach(x=>{let o=document.createElement("option");o.value=x.nome;o.innerText=x.nome;s.appendChild(o)}); if([...s.options].some(o=>o.value===v))s.value=v;}
function setupKpiInteractions(){const click=(t)=>{let l=[],ti="";let ba=agenteSelecionadoGlobal==="todos"?todosAgentes:todosAgentes.filter(a=>compararNomes(a.nome,agenteSelecionadoGlobal));let bat=agenteSelecionadoGlobal==="todos"?todosAtendimentos:todosAtendimentos.filter(i=>compararNomes(i.agente,agenteSelecionadoGlobal));let ben=agenteSelecionadoGlobal==="todos"?todosEncerrados:todosEncerrados.filter(i=>compararNomes(i.atendente,agenteSelecionadoGlobal)||compararNomes(i.agente,agenteSelecionadoGlobal));if(t==="logados"){ti="👥 Logados";l=ba.filter(u=>u.status==="Online").map(u=>({t:u.nome,s:`Setor: ${u.setor||'-'}`,l:""}));}else if(t==="atend"){ti="✅ Atendimentos";l=bat.map(i=>({t:i.cliente,s:`${i.hora} | ${i.agente}`,l:i.link}));}else if(t==="encer"){ti="⛔ Encerrados";l=ben.map(i=>({t:i.cliente,s:`${i.hora} | ${i.atendente||i.agente||'?' }`,l:i.link}));}else if(t==="tma"){ti="⏱️ TMA";l=[...ba].sort((a,b)=>tmaToSeconds(b.tma)-tmaToSeconds(a.tma)).map(u=>({t:u.nome,s:`TMA: ${u.tma}`,l:""}));}abrirModalLista(ti,l);};document.getElementById("card-logados").onclick=()=>click("logados");document.getElementById("card-atendimentos").onclick=()=>click("atend");document.getElementById("card-encerrados").onclick=()=>click("encer");document.getElementById("card-tma").onclick=()=>click("tma");}
function abrirModalLista(t,i){const c=document.getElementById("modal-lista-container");document.getElementById("modal-titulo").innerText=t;c.innerHTML="";if(!i.length)c.innerHTML="<p style='text-align:center;color:#888;padding:15px'>Vazio</p>";else i.forEach(x=>{const d=document.createElement("div");d.className="detalhe-item";const lk=x.l?`<a href="${x.l}" target="_blank" class="link-btn">Link 🔗</a>`:"";d.innerHTML=`<div class="item-content"><span class="item-title">${x.t}</span><span class="item-sub">${x.s}</span></div>${lk}`;c.appendChild(d);});document.getElementById("modal-detalhes").style.display="block";}

// ATUALIZADO: Salva/Carrega MOD_GAME e MOD_GAME_MODE
function abrirModulos(){
    document.getElementById("modal-modulos").style.display="block";
    chrome.storage.local.get(['MOD_CRONOMETROS','MOD_PAUSAS','MOD_PROTOCOLOS','MOD_RESPOSTAS','MOD_BAR','MOD_MENU','MOD_IA','MOD_ID','MOD_CAR', 'MOD_GAME', 'MOD_GAME_MODE'], r=>{
        document.getElementById("mod-cronometros").checked=r.MOD_CRONOMETROS!==false;
        document.getElementById("mod-pausas").checked=r.MOD_PAUSAS!==false;
        document.getElementById("mod-protocolos").checked=r.MOD_PROTOCOLOS!==false;
        document.getElementById("mod-respostas").checked=r.MOD_RESPOSTAS!==false;
        document.getElementById("mod-bar").checked=r.MOD_BAR!==false;
        document.getElementById("mod-menu").checked=r.MOD_MENU!==false;
        document.getElementById("mod-ia").checked=r.MOD_IA!==false;
        document.getElementById("mod-id").checked=r.MOD_ID!==false;
        document.getElementById("mod-car").checked=r.MOD_CAR!==false;
        
        document.getElementById("mod-game").checked=r.MOD_GAME!==false;
        document.getElementById("mod-game-mode").value = r.MOD_GAME_MODE || "window";
    });
}

function salvarModulos(){
    const c={
        'MOD_CRONOMETROS':document.getElementById("mod-cronometros").checked,
        'MOD_PAUSAS':document.getElementById("mod-pausas").checked,
        'MOD_PROTOCOLOS':document.getElementById("mod-protocolos").checked,
        'MOD_RESPOSTAS':document.getElementById("mod-respostas").checked,
        'MOD_BAR':document.getElementById("mod-bar").checked,
        'MOD_MENU':document.getElementById("mod-menu").checked,
        'MOD_IA':document.getElementById("mod-ia").checked,
        'MOD_ID':document.getElementById("mod-id").checked,
        'MOD_CAR':document.getElementById("mod-car").checked,
        
        'MOD_GAME':document.getElementById("mod-game").checked,
        'MOD_GAME_MODE':document.getElementById("mod-game-mode").value
    };
    chrome.storage.local.set(c,()=>{
        alert("Salvo! Recarregue a página.");
        fecharModais();
    });
}

function abrirEmJanela(){chrome.windows.create({url:"popup.html",type:"popup",width:520,height:650});}
function fecharModais(){document.querySelectorAll(".modal").forEach(m=>m.style.display="none");}
function preencherSelectGestao(u){const s=document.getElementById("gestao-user-select");s.innerHTML="";u.forEach(x=>{let o=document.createElement("option");o.value=x.usuario;o.innerText=x.usuario;s.appendChild(o)});}
async function salvarNovaSenha(){const u=document.getElementById("gestao-user-select").value;const p=document.getElementById("gestao-new-pass").value;if(!p)return;try{const h=await sha256(p);const r=await fetch(API_URL,{method:'POST',body:JSON.stringify({type:'alterarSenha',adminUser:usuarioLogado,targetUser:u,newPassHash:h})});const d=await r.json();document.getElementById("gestao-msg").innerText=d.status==='success'?"Senha alterada!":"Erro.";}catch(e){alert("Erro conexão");}}
async function realizarLogin(){const u=document.getElementById("login-user").value;const p=document.getElementById("login-pass").value;if(!u||!p)return;try{const h=await sha256(p);const r=await fetch(API_URL,{method:'POST',body:JSON.stringify({type:'login',user:u,passHash:h})});const d=await r.json();if(d.status==='success'){chrome.storage.local.set({'ADMIN_SESSION':d.token,'USER':u},()=>{usuarioLogado=u;verificarSessao();});}else{document.getElementById("login-msg").innerText="Erro login";}}catch(e){}}
function verificarSessao(){chrome.storage.local.get(['ADMIN_SESSION','USER'],r=>{if(r.ADMIN_SESSION){usuarioLogado=r.USER;document.getElementById("login-screen").style.display="none";document.getElementById("app-content").style.display="block";const h=obterDataLocal();document.getElementById("data-inicio").value=h;document.getElementById("data-fim").value=h;carregarDados();}});}
function fazerLogout(){chrome.storage.local.remove(['ADMIN_SESSION'],()=>location.reload());}
async function sha256(m){const b=new TextEncoder().encode(m);const h=await crypto.subtle.digest('SHA-256',b);return Array.from(new Uint8Array(h)).map(x=>x.toString(16).padStart(2,'0')).join('');}
