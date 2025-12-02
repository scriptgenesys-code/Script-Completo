// Arquivo: admin.js

let dadosAtuais = [];
let shaAtual = "";
let itemSelecionadoIndex = -1;
let arquivoAtual = "";

document.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('gh_token');
    if(savedToken) document.getElementById('github-token').value = savedToken;
    
    // Listeners de Eventos (Substituindo onclick do HTML)
    document.getElementById('btn-carregar').addEventListener('click', carregarDados);
    document.getElementById('btn-salvar-github').addEventListener('click', salvarNoGithub);
    document.getElementById('btn-novo-item').addEventListener('click', novoItem);
    document.getElementById('input-filtro').addEventListener('input', (e) => filtrarLista(e.target.value));
    document.getElementById('btn-excluir').addEventListener('click', deletarItemAtual);
    document.getElementById('btn-confirmar-local').addEventListener('click', aplicarEdicaoLocal);
});

async function carregarDados() {
    const token = document.getElementById('github-token').value;
    const user = document.getElementById('repo-user').value;
    const repo = document.getElementById('repo-name').value;
    arquivoAtual = document.getElementById('file-selector').value;
    const status = document.getElementById('status-msg');

    if(!token) { alert("Por favor, insira o Token do GitHub."); return; }
    localStorage.setItem('gh_token', token);

    status.innerText = "Baixando...";
    status.style.color = "yellow";

    try {
        const url = `https://api.github.com/repos/${user}/${repo}/contents/${arquivoAtual}`;
        const response = await fetch(url, { headers: { 'Authorization': `token ${token}` } });
        
        if (!response.ok) throw new Error("Falha ao acessar GitHub.");
        
        const json = await response.json();
        shaAtual = json.sha;
        const content = decodeURIComponent(escape(atob(json.content)));
        const parsedData = JSON.parse(content);

        if (Array.isArray(parsedData)) {
            dadosAtuais = parsedData;
        } else if (parsedData.protocols) {
            dadosAtuais = parsedData.protocols;
        } else {
            dadosAtuais = [];
        }

        document.getElementById('editor-ui').style.display = "grid";
        status.innerText = "Pronto!";
        status.style.color = "#00f0ff";
        
        if (arquivoAtual.includes('protocolos')) {
            document.getElementById('hotkey-group').style.visibility = 'hidden';
        } else {
            document.getElementById('hotkey-group').style.visibility = 'visible';
        }
        renderizarLista();
    } catch (e) {
        console.error(e);
        status.innerText = "Erro!";
        status.style.color = "red";
        alert("Erro: " + e.message);
    }
}

function renderizarLista(filtro = "") {
    const listaDiv = document.getElementById('lista-itens');
    listaDiv.innerHTML = "";
    dadosAtuais.forEach((item, index) => {
        if (filtro && !item.title.toLowerCase().includes(filtro.toLowerCase())) return;
        const btn = document.createElement('button');
        btn.className = `item-list-btn ${index === itemSelecionadoIndex ? 'active' : ''}`;
        btn.innerText = (item.isFavorite ? "⭐ " : "") + item.title;
        btn.onclick = () => selecionarItem(index);
        listaDiv.appendChild(btn);
    });
}

function filtrarLista(valor) { renderizarLista(valor); }

function selecionarItem(index) {
    itemSelecionadoIndex = index;
    const item = dadosAtuais[index];
    document.getElementById('edit-title').value = item.title || "";
    document.getElementById('edit-text').value = item.text || "";
    document.getElementById('edit-favorite').checked = item.isFavorite || false;
    document.getElementById('edit-hotkey').value = item.hotkey || "";
    const tags = item.requiredData || [];
    document.getElementById('edit-tags').value = tags.join(', ');
    renderizarLista();
}

function novoItem() {
    const novo = { title: "NOVO - Título", text: "", isFavorite: false, requiredData: [] };
    dadosAtuais.unshift(novo);
    selecionarItem(0);
    document.getElementById('edit-title').focus();
}

function deletarItemAtual() {
    if (itemSelecionadoIndex === -1) return;
    if(!confirm("Tem certeza?")) return;
    dadosAtuais.splice(itemSelecionadoIndex, 1);
    itemSelecionadoIndex = -1;
    document.getElementById('edit-title').value = "";
    document.getElementById('edit-text').value = "";
    renderizarLista();
}

function aplicarEdicaoLocal() {
    if (itemSelecionadoIndex === -1) return;
    const tagsStr = document.getElementById('edit-tags').value;
    const tagsArr = tagsStr.split(',').map(t => t.trim().toUpperCase().replace(/ /g, '_')).filter(t => t !== "");
    dadosAtuais[itemSelecionadoIndex] = {
        title: document.getElementById('edit-title').value,
        text: document.getElementById('edit-text').value,
        isFavorite: document.getElementById('edit-favorite').checked,
        hotkey: document.getElementById('edit-hotkey').value,
        requiredData: tagsArr
    };
    if(arquivoAtual.includes('protocolos')) { dadosAtuais[itemSelecionadoIndex].category = "GERAL"; }
    renderizarLista();
    const btn = document.getElementById('btn-confirmar-local');
    const origText = btn.innerText;
    btn.innerText = "Editado!";
    setTimeout(() => btn.innerText = origText, 1000);
}

async function salvarNoGithub() {
    if (!confirm("Salvar alterações no GitHub?")) return;
    const token = document.getElementById('github-token').value;
    const user = document.getElementById('repo-user').value;
    const repo = document.getElementById('repo-name').value;
    const status = document.getElementById('status-msg');

    status.innerText = "Enviando...";
    let conteudoFinal;
    if (arquivoAtual.includes('protocolos')) {
        conteudoFinal = { 
            protocols: dadosAtuais,
            blocks: [],
            version: "1.9_Editor_Web_" + Date.now(),
            exported: new Date().toISOString()
        };
    } else { conteudoFinal = dadosAtuais; }

    const jsonStr = JSON.stringify(conteudoFinal, null, 2);
    const contentBase64 = btoa(unescape(encodeURIComponent(jsonStr)));
    const body = { message: "Atualização via Painel O Cérebro", content: contentBase64, sha: shaAtual };

    try {
        const url = `https://api.github.com/repos/${user}/${repo}/contents/${arquivoAtual}`;
        const response = await fetch(url, { 
            method: 'PUT',
            headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error("GitHub recusou a gravação.");
        const json = await response.json();
        shaAtual = json.content.sha;
        status.innerText = "Salvo!";
        status.style.color = "#2ecc71";
        alert("Sucesso!");
    } catch (e) {
        console.error(e);
        status.innerText = "Erro";
        status.style.color = "red";
        alert("Erro: " + e.message);
    }
}