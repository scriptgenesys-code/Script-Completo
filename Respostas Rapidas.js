// ==UserScript==
// @name         PureCloud - Respostas Rápidas Isoladas (v2.4.9 - Auto-Fetch)
// @namespace    http://tampermonkey.net
// @version      2.4.9
// @description  Versão isolada (v2.4.4) com a lógica de Auto-Fetch (v1.5.17) adicionada.
// @author       (Adaptado por Parceiro de Programacao)
// @match        https://*.mypurecloud.*/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

// --- INÍCIO DO ISOLAMENTO (V5) ---
// Esta "caixa" impede que este script colida com os outros (ex: Cronometros.js)
(function() {
    'use strict';

    const SCRIPT_VERSION = '2.4.9-auto-fetch'; // Versão atualizada
    const DEBUG_MODE = true;

    // --- Log Helper ---
    const log = (...args) => { if (DEBUG_MODE) console.log(`[QR Script v${SCRIPT_VERSION}]`, ...args); };

    // --- NOVO (V2.4.9): URL para o ficheiro JSON de RESPOSTAS no GitHub Pages ---
    const RESPOSTAS_JSON_URL = 'https://scriptgenesys-code.github.io/Script-Completo/respostas_COMPLETAS.json';


    // --- CORES PADRÃO CYBERPUNK ELEGANTE ---
    const DEFAULT_CYBERPUNK_COLORS = { /* ... (igual v2.4.1) ... */
        '--cor-acento-primario': '#00BFFF', '--cor-acento-hover': '#40E0D0', '--cor-acento-texto': '#0D1117', '--cor-fundo-primario': '#0D1117', '--cor-fundo-secundario': '#161B22', '--cor-fundo-terciario': '#21262D', '--cor-borda': '#30363D', '--cor-texto-primario': '#C9D1D9', '--cor-texto-secundario': '#8B949E', '--cor-texto-desabilitado': '#484F58', '--cor-perigo': '#F47067', '--cor-perigo-hover': '#FF8080', '--cor-sucesso': '#3FB950', '--cor-info': '#58A6FF', '--glow-color': 'rgba(0, 191, 255, 0.2)', '--glow-hover-color': 'rgba(64, 224, 208, 0.3)'
    };
    const LIGHT_THEME_COLORS = { /* ... (igual v2.4.1) ... */
        '--cor-acento-primario': '#009999', '--cor-acento-hover': '#00CCCC', '--cor-acento-texto': '#FFFFFF', '--cor-fundo-primario': '#FFFFFF', '--cor-fundo-secundario': '#F7F7F9', '--cor-fundo-terciario': '#E8E8EE', '--cor-borda': '#D1D1D1', '--cor-texto-primario': '#1F1F1F', '--cor-texto-secundario': '#555555', '--cor-texto-desabilitado': '#AAAAAA', '--cor-perigo': '#D83A52', '--cor-perigo-hover': '#F85149', '--cor-sucesso': '#28A745', '--cor-info': '#17A2B8', '--glow-color': 'rgba(0, 153, 153, 0.1)', '--glow-hover-color': 'rgba(0, 204, 204, 0.2)'
    };

    // --- Respostas e Tags (Vazios) ---
    const initialQuickReplies = [];
    const requiredTagsMap = {};

    // --- ÍCONES SVG ---
    const ICONS = { /* ... (igual v2.4.1) ... */
        CHAT: `<svg class="panel-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>`, SETTINGS: `<svg class="panel-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.08-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24-.42-.12-.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61.25 1.17.59 1.69.98l2.49 1c.23.08.49 0 .61.22l2-3.46c.12-.22-.07.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></svg>`, CLOSE: `<svg class="panel-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>`, DELETE: `<svg class="panel-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`, ADD: `<svg class="panel-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`, IMPORT: `<svg class="panel-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-8-8-8 8h4v6zm-4 2h14v2H5v-2z"/></svg>`, EXPORT: `<svg class="panel-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`, FUNCTION: `<svg class="panel-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`
    };

    // --- Mapeamento e Ordem das Categorias ---
    const categoryDisplayMap = { /* ... (igual v2.4.3) ... */
        'recent': '⏱️ Recentes', 'favorites': '⭐ Favoritos', 'all': 'Todas', 'INICIO_ENCERRAMENTO': 'Início/Fim', 'DADOS_ID': 'Dados/ID', 'ATIVO': 'Ativo', 'INSTABILIDADE': 'Instabilidade', 'DIAG_RAPIDO': 'Diag. Rápido', 'VELOCIDADE': 'Velocidade', 'SINAL_ROTA': 'Sinal/Rota', 'LOS_PON': 'LOS/PON (Fibra)', 'MANUTENCAO_SINAL': 'Manut. Sinal', 'ROTA_INOP': 'Rota Inop.', 'INSTALACAO': 'Instalação', 'EQUIPAMENTOS': 'Equipamentos', 'WIFI_SENHA': 'WiFi/Senha', 'AGENDAMENTO': 'Agendamento', 'COBRANCA': 'Cobrança', 'EQUIP_PART': 'Equip. Part.', 'APPS_IPTV': 'Apps/IPTV', 'SVA': 'SVA', 'JOGOS': 'Jogos', 'SITES_VPN': 'Sites/VPN', 'TELEFONIA': 'Telefonia', 'BRISATV': 'BrisaTV', 'FWA_5G': 'FWA (5G)', 'FWA_5G_INFO': 'FWA (Info)', 'INTERNOS': 'Internos', 'AVANCADOS': 'Avançados', 'CORDIAIS': 'Cordiais', 'SV_AVULSOS': 'Serv. Avulsos', 'INFO_TEC': 'Info Tec.', 'INATIVIDADE_ENC': 'Inatividade', 'CONFIG_TEC': 'Config. Téc.', 'IP_PORTAS': 'IP/Portas', 'FINANCEIRO': 'Financeiro', 'DIALOGO': 'Diálogo', 'I': 'I - Início', 'A': 'A - Ativo', 'E': 'E - Encerramento', 'C': 'C - Cordialidade', 'CL': 'CL - Contrato/Cli.', 'D': 'D - Diagnóstico', 'P': 'P - Procedimentos', 'PN': 'PN - Velocidade', 'AG': 'AG - Agendamento', 'CR': 'CR - Cobrança Cham.', 'SV': 'SV - Serv. Avulsos', 'L': 'L - LOS (Fibra)', 'PON': 'PON - PON (Fibra)', 'TP': 'TP - TP-Link', 'RTC': 'RTC - Rota Cobrança', 'RTA': 'RTA - Rota Abertura', 'PIS': 'PIS - Sist. Interno', 'INS': 'INS - Instalação', 'APP': 'APP - Aplicativos', 'T': 'T - Técnico/Wi-Fi', 'J': 'J - Jogos', 'S': 'S - Sites/VPN', 'TV': 'TV - BrisaTV', 'EQ': 'EQ - Equip. Part.', 'TRANSFERENCIA': 'Transf.'
    };
    const sidebarCategoryOrder = [ /* ... (igual v2.4.3) ... */
        'recent', 'favorites', 'all', 'INICIO_ENCERRAMENTO', 'DADOS_ID', 'ATIVO', 'INSTABILIDADE', 'DIAG_RAPIDO', 'VELOCIDADE', 'SINAL_ROTA', 'LOS_PON', 'MANUTENCAO_SINAL', 'ROTA_INOP', 'INSTALACAO', 'EQUIPAMENTOS', 'WIFI_SENHA', 'AGENDAMENTO', 'COBRANCA', 'EQUIP_PART', 'APPS_IPTV', 'SVA', 'JOGOS', 'SITES_VPN', 'TELEFONIA', 'BRISATV', 'FWA_5G', 'FWA_5G_INFO', 'INTERNOS', 'AVANCADOS', 'CORDIAIS', 'SV_AVULSOS', 'INFO_TEC', 'INATIVIDADE_ENC', 'CONFIG_TEC', 'IP_PORTAS', 'FINANCEIRO', 'DIALOGO', 'TRANSFERENCIA', 'I', 'CL', 'P', 'TP', 'RTC', 'RTA', 'PIS', 'T'
    ];

    // --- Configuração ---
    let CONFIG = {
        QUICK_REPLIES: [], LAST_COPIED_REPLY: '', RECENT_REPLIES: [],
        POPUP_POSITIONS: {}, DARK_MODE: true,
        customThemeColors: { ...DEFAULT_CYBERPUNK_COLORS }
    };

    // --- Funções Utilitárias (findEl, copyTextToClipboard, formatReplyText, makeDraggable) ---
    // (sem alterações)
    const findEl=(q,p=document)=>{if(!Array.isArray(q))q=[q];for(const s of q){try{if(p&&typeof p.querySelector==='function'){const e=p.querySelector(s);if(e)return e}}catch(e){/* log("Selector error:",s,e) */}}return null};
    const copyTextToClipboard=async(t)=>{try{await navigator.clipboard.writeText(t);return!0}catch(e){log("Copy failed:",e);return!1}};
    
    // --- FUNÇÃO formatReplyText COMPLETA (v2.4.4) ---
    const formatReplyText=(t,n='cliente',i='protocolo')=>{const r={ 'NOME DO CLIENTE':n,'NOME_DO_CLIENTE':n,NOME:n,'NOME COMPLETO':n,NUMERO:i,PROTOCOLO:i,'DATA NASC':'[Confirmar Data]','DATA_NASC':'[Confirmar Data]',ENDERECO:'[Confirmar Endereço]',CPF:'[Confirmar CPF]',CIDADE:'[Informar Cidade]','DIA E MÊS':'[Informar Dia/Mês]','DIA/MÊS':'[Informar Dia/Mês]','MANHÃ OU TARDE':'[Manhã/Tarde]','MANHA_OU_TARDE':'[Manhã/Tarde]','QUANTIDADE HORAS':'[X]','QUANTIDADE_HORAS':'[X]','QUANTIDADE DE CLIENTES':'[Y]','QUANTIDADE_DE_CLIENTES':'[Y]',EMAIL:'[Confirmar Email]','NÚMERO DE CONTATO':'[Confirmar Contato]','NUMERO DE CONTATO':'[Confirmar Contato]',OPERADORA:'[Operadora]','APARELHO ESPECÍFICO':'[Aparelho]','APARELHO_ESPECIFICO':'[Aparelho]',SETOR:'[Setor]'};let o=t;for(const c in r){const s=c.replace(/ /g,'[_\\s]*'),a=new RegExp(`\\[\\s*${s}\\s*\\]|\\{\\s*${s}\\s*\\}`,'gi');o=o.replace(a,r[c]||`[${c}]`)}return o};
    
    // (makeDraggable usa 'qr_popupPositions' - já está prefixado e correto)
    const makeDraggable=(popup,header,popupName)=>{let startX,startY,initialPopupX,initialPopupY,isDragging=!1;const enforceBounds=(t,e)=>{const o=window.innerHeight,n=window.innerWidth,i=popup.offsetHeight,s=popup.offsetWidth,l=5;let a=Math.max(l,Math.min(o-i-l,t)),r=Math.max(l,Math.min(n-s-l,e));return(s<=0||i<=0||s>n-2*l||i>o-2*l)&&(a=l,r=l),{top:a,left:r}};try{CONFIG.POPUP_POSITIONS=JSON.parse(sessionStorage.getItem('qr_popupPositions')||'{}')}catch(e){log("Error loading positions:",e);CONFIG.POPUP_POSITIONS={}}const defaultWidth='650px',defaultHeight='75vh';popup.style.position='fixed',popup.style.margin='0',popup.style.transform='none';if(popupName==='quickReplyPopup'){popup.style.width=defaultWidth,popup.style.height=defaultHeight,requestAnimationFrame(()=>{const t=popup.offsetWidth||650,e=popup.offsetHeight||window.innerHeight*.75,o=Math.max(5,(window.innerWidth-t)/2),n=Math.max(5,(window.innerHeight-e)/2);popup.style.left=o+'px',popup.style.top=n+'px'})}else if(CONFIG.POPUP_POSITIONS[popupName]?.top&&CONFIG.POPUP_POSITIONS[popupName]?.left){try{let t=parseFloat(CONFIG.POPUP_POSITIONS[popupName].top),e=parseFloat(CONFIG.POPUP_POSITIONS[popupName].left),{top:o,left:n}=enforceBounds(t,e);popup.style.top=o+'px',popup.style.left=n+'px',popup.style.width=CONFIG.POPUP_POSITIONS[popupName].width||defaultWidth,popup.style.height=CONFIG.POPUP_POSITIONS[popupName].height||defaultHeight}catch(e){popup.style.top='10%',popup.style.left='10%',popup.style.width=defaultWidth,popup.style.height=defaultHeight}}else{popup.style.top='10%',popup.style.left='10%',popup.style.width=defaultWidth,popup.style.height=defaultHeight}const saveCurrentPositionAndSize=()=>{clearTimeout(popup._savePosTimeout),popup._savePosTimeout=setTimeout(()=>{if(popupName!=='quickReplyPopup'||isDragging){const t=popup.getBoundingClientRect(),{top:e,left:o}=enforceBounds(t.top,t.left);CONFIG.POPUP_POSITIONS[popupName]={top:e+'px',left:o+'px',width:popup.style.width,height:popup.style.height};try{sessionStorage.setItem('qr_popupPositions',JSON.stringify(CONFIG.POPUP_POSITIONS))}catch(n){log("Error saving position:",n)}}},300)},dragMouseMove=t=>{if(!isDragging)return;t.preventDefault();const e=t.clientX-startX,o=t.clientY-startY,n=initialPopupX+e,i=initialPopupY+o,{top:s,left:l}=enforceBounds(i,n);popup.style.left=l+'px',popup.style.top=s+'px'},dragMouseUp=()=>{if(!isDragging)return;isDragging=!1,document.removeEventListener('mousemove',dragMouseMove),document.removeEventListener('mouseup',dragMouseUp),saveCurrentPositionAndSize()};if(header){header.onmousedown=t=>{if(t.target.closest('button')||t.button!==0)return;t.preventDefault(),isDragging=!0,startX=t.clientX,startY=t.clientY,initialPopupX=popup.offsetLeft,initialPopupY=popup.offsetTop,document.addEventListener('mousemove',dragMouseMove),document.addEventListener('mouseup',dragMouseUp)}}else{log(`Header not found for ${popupName}. Drag disabled.`)}const resizeObserver=new ResizeObserver(()=>{if(isDragging||popupName!=='quickReplyPopup')saveCurrentPositionAndSize()});resizeObserver.observe(popup)};


    // --- Lógica de Dados (loadData, saveData, logUsedReply) ---
    // *** MODIFICADO v2.4.9 (Auto-Fetch Adicionado) ***
    const loadData = async () => {
        let repliesLoaded = false;
        
        // 1. Tentar carregar Respostas do LocalStorage
        try {
            const localReplies = localStorage.getItem('qr_quickReplies'); // Prefixo 'qr_'
            if (localReplies) {
                const parsed = JSON.parse(localReplies);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    CONFIG.QUICK_REPLIES = parsed;
                    repliesLoaded = true;
                    log("Respostas Rápidas carregadas do LocalStorage.");
                } else {
                    localStorage.removeItem('qr_quickReplies');
                    log("LocalStorage de Respostas Rápidas estava inválido. Removido.");
                }
            }
        } catch (e) {
            log("Erro ao ler Respostas Rápidas do LocalStorage (será substituído):", e);
            localStorage.removeItem('qr_quickReplies');
        }

        // 2. Se o LocalStorage estiver vazio, buscar do GitHub
        if (!repliesLoaded) {
            log(`LocalStorage de Respostas Rápidas vazio. Puxando de: ${RESPOSTAS_JSON_URL}`);
            try {
                const response = await fetch(RESPOSTAS_JSON_URL + '?v=' + Date.now());
                if (!response.ok) {
                    throw new Error(`Falha ao buscar: ${response.statusText} (status ${response.status})`);
                }
                const data = await response.json();
                
                if (Array.isArray(data)) {
                    CONFIG.QUICK_REPLIES = data;
                    log(`Respostas Rápidas (${data.length}) puxadas com sucesso do GitHub.`);
                    // Salvar no LocalStorage para a próxima vez
                    try {
                        localStorage.setItem('qr_quickReplies', JSON.stringify(data)); // Prefixo 'qr_'
                        log("Respostas Rápidas do GitHub salvas no LocalStorage.");
                    } catch (saveErr) {
                        log("Erro ao salvar Respostas Rápidas no LocalStorage:", saveErr);
                        UI.createNotification("Respostas carregadas, mas falha ao salvar localmente.", 'warn', 4000);
                    }
                } else {
                     throw new Error("Formato do JSON de Respostas Rápidas é inválido (esperado um Array []).");
                }

            } catch (fetchErr) {
                log("ERRO CRÍTICO ao puxar Respostas Rápidas do GitHub:", fetchErr);
                CONFIG.QUICK_REPLIES = initialQuickReplies;
                try { UI.createNotification("Falha ao carregar Respostas Rápidas do GitHub.", 'error', 5000); } catch(e){}
            }
        }
        
        // 3. Carregar o resto das configurações (não-respostas)
        try {
            CONFIG.LAST_COPIED_REPLY=localStorage.getItem('qr_lastCopiedReply')||'';
            CONFIG.RECENT_REPLIES=JSON.parse(localStorage.getItem('qr_recentReplies_v3'))||[];
            CONFIG.POPUP_POSITIONS=JSON.parse(sessionStorage.getItem('qr_popupPositions')||'{}');
            const e=localStorage.getItem('qr_darkMode');
            CONFIG.DARK_MODE=e!=='false';
            const t=localStorage.getItem('qr_customThemeColors');
            CONFIG.customThemeColors=t?JSON.parse(t):{...DEFAULT_CYBERPUNK_COLORS};
            for(const o in DEFAULT_CYBERPUNK_COLORS){if(!CONFIG.customThemeColors[o]){CONFIG.customThemeColors[o]=DEFAULT_CYBERPUNK_COLORS[o]}}
            log("Outras configs (Recentes, Posição, Tema) carregadas.");
        } catch (e) {
             log("Erro ao carregar outras configs:",e);CONFIG.RECENT_REPLIES=[];CONFIG.POPUP_POSITIONS={};CONFIG.DARK_MODE=!0;CONFIG.customThemeColors={...DEFAULT_CYBERPUNK_COLORS}
        }
        
        // 4. Processar os dados carregados
        CONFIG.QUICK_REPLIES=CONFIG.QUICK_REPLIES.map(e=>({...e,isFavorite:e.isFavorite||!1,requiredData:e.requiredData||[],hotkey:e.hotkey||null}))
    };
    // --- FIM DA MODIFICAÇÃO (V2.4.9) ---

    const saveData=()=>{try{
        localStorage.setItem('qr_quickReplies',JSON.stringify(CONFIG.QUICK_REPLIES)); // PREFIXADO
        localStorage.setItem('qr_lastCopiedReply',CONFIG.LAST_COPIED_REPLY); // PREFIXADO
        localStorage.setItem('qr_recentReplies_v3',JSON.stringify(CONFIG.RECENT_REPLIES)); // PREFIXADO
        localStorage.setItem('qr_darkMode',CONFIG.DARK_MODE); // (Já estava prefixado)
        localStorage.setItem('qr_customThemeColors',JSON.stringify(CONFIG.customThemeColors)); // PREFIXADO
        log("Data saved.")
    }catch(e){log("Error saving data:",e);UI.createNotification("Error saving settings.",'error')}applyThemeColors(CONFIG.DARK_MODE?CONFIG.customThemeColors:LIGHT_THEME_COLORS);document.body.classList.toggle('qr-dark-mode',CONFIG.DARK_MODE)};

    const logUsedReply=(e,t)=>{const o=5,n={title:e,text:t};CONFIG.RECENT_REPLIES=CONFIG.RECENT_REPLIES.filter(l=>l.title!==e||l.text!==t);CONFIG.RECENT_REPLIES.unshift(n);if(CONFIG.RECENT_REPLIES.length>o){CONFIG.RECENT_REPLIES.length=o}try{
        localStorage.setItem('qr_recentReplies_v3',JSON.stringify(CONFIG.RECENT_REPLIES)) // PREFIXADO
    }catch(l){log("Error saving recents:",l)}};
    // --- FIM DA MODIFICAÇÃO ---

    // --- Função para Aplicar Cores ---
    // (sem alterações)
    const applyThemeColors=(colors)=>{const root=document.documentElement;if(!colors){log("Error applying theme: colors object is missing.");return}log("Applying theme colors:",colors);for(const[key,value]of Object.entries(colors)){if(key.startsWith('--')){root.style.setProperty(key,value)}}root.style.setProperty('--glow-effect',`0 0 4px ${colors['--glow-color']||'rgba(0,0,0,0)'}, 0 0 8px ${colors['--glow-color']||'rgba(0,0,0,0)'}`);root.style.setProperty('--glow-effect-hover',`0 0 6px ${colors['--glow-hover-color']||'rgba(0,0,0,0)'}, 0 0 10px ${colors['--glow-hover-color']||'rgba(0,0,0,0)'}`);root.style.setProperty('--sombra-popup',`0 0 15px ${colors['--glow-color']||'rgba(0,0,0,0)'}, 0 4px 8px rgba(0,0,0,0.3)`)};

    // --- Funções para Extrair Dados (documentExtractor) ---
    // (sem alterações)
    const documentExtractor={getParticipantName:()=>{const e=['h3.participant-name','div.interaction-name-wrapper div.participant-name > span','p.participant-name','span[data-qa-id="participant-name"]','h2.participant-name','.top-section-block .title-wrapper .title-text','.conversation-header .participant-info .name'],t=findEl(e);if(!t)return'cliente';const o=t.textContent.trim(),n=o.match(/^([a-zA-Z\sáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ'.-]+)(?:\s*[|•\-\s(]?\s*(?:\d{2,}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}))?/);return n&&n[1]?n[1].trim():o||'cliente'},getInteractionId:()=>{const e=['span[data-qa-id="interaction-id"]','[data-qa-id="detail-value-interactionId"]','.interaction-id-value','#interactionIdDisplay','.conversation-id span'],t=findEl(e);return t?.textContent.trim().replace(/#/g,'')||'protocolo'}};

    // --- Funções Throttle e escapeRegExp ---
    // (sem alterações)
    const throttle=(e,t)=>{let o;return function(...n){if(!o){e.apply(this,n);o=!0;setTimeout(()=>o=!1,t)}}};
    const escapeRegExp=e=>e.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

    // --- Ouvinte de Eventos de Teclado (keyboardEventHandler) ---
    // *** MODIFICADO v2.4.4 (Conflict Fix) ***
    const keyboardEventHandler=(e)=>{
        const t=e.target.tagName.toUpperCase();
        // PREFIXADO
        const o=e.target.closest('.qr-script-popup')&&(t==='INPUT'||t==='TEXTAREA');
        if(e.key!=='Escape'&&o){return}
        if(e.ctrlKey&&e.shiftKey&&(e.key==='Ç'||e.key==='ç'||e.code==='Backslash')){e.preventDefault();log("Shortcut detected.");UI.createQuickReplyPopup()}
        if(e.key==='Escape'){
            const n=document.querySelector('.qr-script-quick-reply-popup'); // (Já prefixado)
            const l=document.querySelector('.qr-script-settings-panel'); // PREFIXADO
            if(n){log("Closing QR Popup with ESC.");n.remove();e.preventDefault()}
            else if(l){log("Closing Settings Popup with ESC.");l.remove();e.preventDefault()}
        }
    };

    // --- FUNÇÕES PERSONALIZADAS ---
    function exampleCustomFunction() { log("Botão de Exemplo Clicado!"); const name = documentExtractor.getParticipantName(); alert(`Função de exemplo executada!\nCliente: ${name}`); }

    // --- Interface do Usuário (UI) ---
    // *** MODIFICADO v2.4.4 (Conflict Fix) ***
    const UI = {
        createNotification(message, type = 'info', duration = 3000) {
             let container = document.getElementById('qr-script-notification-container'); // (ID já prefixado)
             if (!container) { container = document.createElement('div'); container.id = 'qr-script-notification-container'; document.body.appendChild(container); }
             const n = document.createElement("div"); n.textContent = message;
             n.className = `qr-script-notification qr-script-notification-${type}`; // PREFIXADO
             container.prepend(n);
             const visibleNotifications = container.querySelectorAll('.qr-script-notification'); // PREFIXADO
             if (visibleNotifications.length > 5) { visibleNotifications[visibleNotifications.length - 1].remove(); }
             setTimeout(() => { n.style.opacity = '0'; n.style.transform = 'translateX(100%)'; setTimeout(() => n.remove(), 300); }, duration);
        },
        createQuickReplyPopup() {
            document.querySelector('.qr-script-quick-reply-popup')?.remove(); // (Já prefixado)
            document.querySelector('.qr-script-settings-panel')?.remove(); // PREFIXADO
            const popup = document.createElement("div");
            popup.className = 'qr-script-quick-reply-popup qr-script-popup'; // PREFIXADO
            popup.innerHTML = `<div class="panel-header"><h4>Respostas Rápidas</h4><div class="panel-header-buttons"><button class="panel-header-btn settings-btn" title="Gerenciar Script">${ICONS.SETTINGS}</button><button class="panel-header-btn qr-script-popup-close-btn" title="Fechar (Esc)">${ICONS.CLOSE}</button></div></div><div class="qr-popup-body"><div id="qr-sidebar"><ul id="qr-category-list"></ul></div><div id="qr-main-content"><input type="text" id="purecloud-script-quick-reply-search" placeholder="Buscar..."><div id="quick-suggestion-filters" class="suggestion-filters-container"></div><div id="quick-reply-results" class="items-container"></div></div></div>`; // PREFIXADO qr-script-popup-close-btn
            document.body.appendChild(popup);
            makeDraggable(popup, popup.querySelector('.panel-header'), 'quickReplyPopup');
            popup.querySelector('.qr-script-popup-close-btn').onclick = () => popup.remove(); // PREFIXADO
            popup.querySelector('.settings-btn').onclick = () => UI.createSettingsPanel();
            // ... (restante da lógica da função é interna e não precisa de prefixo)
            const searchInput = popup.querySelector('#purecloud-script-quick-reply-search'); const categoryListContainer = popup.querySelector('#qr-category-list'); const resultsContainer = popup.querySelector('#quick-reply-results'); const suggestionsContainer = popup.querySelector('#quick-suggestion-filters'); let currentCategory = 'favorites'; let currentSearchTerm = ''; const getReplyDataTags = (title) => CONFIG.QUICK_REPLIES.find(r => r.title === title)?.requiredData || []; const populateReplies = (category, searchTerm) => { const name = documentExtractor.getParticipantName(); const id = documentExtractor.getInteractionId(); resultsContainer.innerHTML = ''; let filteredReplies = CONFIG.QUICK_REPLIES; let headerText = ''; if (searchTerm) { const lower = searchTerm.toLowerCase(); const regex = new RegExp(`\\b${escapeRegExp(lower)}|${escapeRegExp(lower)}`, 'i'); filteredReplies = CONFIG.QUICK_REPLIES.filter(r => regex.test(r.title.replace(/ - /g, ' ')) || regex.test(r.text) || (r.hotkey && regex.test(r.hotkey))); headerText = `Busca por "${searchTerm}"`; currentCategory = 'search'; } else if (category === 'favorites') { filteredReplies = filteredReplies.filter(r => r.isFavorite); headerText = categoryDisplayMap['favorites']; } else if (category === 'recent') { const titles = CONFIG.RECENT_REPLIES.map(r => r.title); filteredReplies = titles.map(title => CONFIG.QUICK_REPLIES.find(r => r.title === title)).filter(Boolean); headerText = categoryDisplayMap['recent']; } else if (category && category !== 'all') { filteredReplies = filteredReplies.filter(r => r.title.startsWith(category + ' - ')); headerText = categoryDisplayMap[category] || `Categoria: ${category}`; } else { headerText = categoryDisplayMap['all']; } const headerEl = document.createElement('h4'); headerEl.className = 'qr-results-header'; headerEl.textContent = `${headerText} (${filteredReplies.length})`; resultsContainer.appendChild(headerEl); 
            
            // --- MODIFICAÇÃO (V2.4.9) ---
            // Substituído o if (filteredReplies.length === 0...)
            if (filteredReplies.length === 0 && CONFIG.QUICK_REPLIES.length === 0 && !searchTerm) { 
                resultsContainer.innerHTML += `<p class="qr-no-results">Nenhuma resposta. (Se for o primeiro uso, recarregue a página. Se o erro persistir, verifique o URL do JSON no script).</p>`; return;
            // --- FIM DA MODIFICAÇÃO ---
            } else if (filteredReplies.length === 0) { resultsContainer.innerHTML += `<p class="qr-no-results">Nenhuma resposta encontrada.</p>`; return; } if (category !== 'recent') { filteredReplies.sort((a, b) => a.title.localeCompare(b.title)); } filteredReplies.forEach(reply => { const match = reply.title.match(/^([A-Z0-9_]+)\s*-\s*/); const subTitle = match ? reply.title.substring(match[0].length).trim() : reply.title; const tags = getReplyDataTags(reply.title); const tagsHtml = tags.map(t => `<span class="data-tag tag-${t.replace(/[^a-zA-Z0-9]/g, '_')}" title="${t.replace(/_/g, ' ')}">${t.substring(0, Math.min(t.length, 4))}${t.length > 4 ? '.' : ''}</span>`).join(''); const reqClass = tags.length > 0 ? 'requires-tags-highlight' : ''; const item = document.createElement('div'); item.className = `item quick-reply-item ${reqClass}`; item.innerHTML = `<div class="reply-header"><strong>${subTitle} ${reply.isFavorite ? '<span title="Favorito" class="favorite-star">⭐</span>' : ''} ${reply.hotkey ? `<span class"reply-hotkey-display" title="Atalho">${reply.hotkey}</span>` : ''}</strong><div class="data-tags">${tagsHtml}</div></div><small>${reply.text.substring(0, 150)}${reply.text.length > 150 ? '...' : ''}</small>`; item.title = reply.text; item.onclick = async () => { const final = formatReplyText(reply.text, name, id); CONFIG.LAST_COPIED_REPLY = final; logUsedReply(reply.title, reply.text); if (await copyTextToClipboard(final)) { UI.createNotification("Copiado!", 'success', 1500); } else { UI.createNotification("Erro ao copiar.", 'error'); } }; resultsContainer.appendChild(item); }); resultsContainer.scrollTop = 0; }; const buildSuggestionFilters = () => { suggestionsContainer.innerHTML = ''; const suggestions = ['LOS', 'PON', 'Instabilidade', 'Velocidade', 'Sem Gerência', 'TV', 'Wi-Fi', 'Senha', 'Agendamento', 'FWA', '5G']; suggestions.forEach(s => { const btn = document.createElement('button'); btn.className = 'suggestion-btn'; btn.textContent = s; btn.title = `Buscar por "${s}"`; btn.onclick = () => { searchInput.value = s; searchInput.dispatchEvent(new Event('input', { bubbles: true })); }; suggestionsContainer.appendChild(btn); }); }; const buildCategoriesSidebar = () => { categoryListContainer.innerHTML = ''; const cats = new Set(sidebarCategoryOrder); cats.forEach(code => { const hasReplies = CONFIG.QUICK_REPLIES.some(r => r.title.startsWith(code + ' - ')); const isSpecial = ['recent', 'favorites', 'all'].includes(code); if ((hasReplies || isSpecial) && categoryDisplayMap[code]) { const li = document.createElement('li'); li.className = 'qr-category-item'; li.dataset.category = code; li.textContent = categoryDisplayMap[code]; li.title = categoryDisplayMap[code]; if (code === currentCategory && !currentSearchTerm) { li.classList.add('active'); } li.onclick = () => { currentCategory = code; currentSearchTerm = ''; searchInput.value = ''; categoryListContainer.querySelectorAll('.qr-category-item').forEach(i => i.classList.remove('active')); li.classList.add('active'); buildSuggestionFilters(); populateReplies(currentCategory, ''); }; categoryListContainer.appendChild(li); } }); }; searchInput.oninput = throttle(() => { currentSearchTerm = searchInput.value.trim(); categoryListContainer.querySelectorAll('.qr-category-item').forEach(i => i.classList.remove('active')); if(!currentSearchTerm) { const prev = categoryListContainer.querySelector(`[data-category="${currentCategory}"]`); if (prev && currentCategory !== 'search') { prev.classList.add('active'); populateReplies(currentCategory, ''); } else { currentCategory = 'favorites'; categoryListContainer.querySelector(`[data-category="favorites"]`)?.classList.add('active'); populateReplies(currentCategory, ''); } } else { populateReplies(null, currentSearchTerm); } }, 300); buildCategoriesSidebar(); buildSuggestionFilters(); populateReplies(currentCategory, ''); searchInput.focus();
        },
        createSettingsPanel() {
            document.querySelector('.qr-script-quick-reply-popup')?.remove(); // (Já prefixado)
            document.querySelector('.qr-script-settings-panel')?.remove(); // PREFIXADO
            const panel = document.createElement('div');
            panel.className = 'qr-script-settings-panel qr-script-popup'; // PREFIXADO
            // PREFIXADO classes: qr-script-popup-close-btn, qr-script-button, qr-button-danger, qr-button-secondary, qr-save-settings-btn (ID)
            panel.innerHTML = `<div class="panel-header"><h2>Gerenciar Script</h2><div class="panel-header-buttons"><button class="panel-header-btn qr-script-popup-close-btn" title="Fechar (Esc)">${ICONS.CLOSE}</button></div></div><div class="panel-content-wrapper"><div class="settings-tabs"><button class="tab-button active" data-tab="replies">Respostas</button><button class="tab-button" data-tab="appearance">Aparência</button><button class="tab-button" data-tab="actions">Funções</button></div><div class="panel-content"><div class="settings-tab-content active" id="tab-content-replies"><input type="file" id="import-replies-input" accept=".json" style="display: none;"><div class="reply-controls"><button id="add-reply-btn" class="qr-script-button">${ICONS.ADD} Adicionar</button><button id="import-replies-btn" class="qr-script-button">${ICONS.IMPORT} Importar</button><button id="export-replies-btn" class="qr-script-button">${ICONS.EXPORT} Exportar</button><button id="restore-replies-btn" class="qr-script-button qr-button-danger">${ICONS.DELETE} Limpar Tudo</button></div><div id="settings-quick-replies-list" class="settings-reply-list"></div></div><div class="settings-tab-content" id="tab-content-appearance"><div class="settings-group-inline appearance-toggle"><label for="dark-mode-toggle">Modo Escuro:</label><label class="switch"><input type="checkbox" id="dark-mode-toggle" ${CONFIG.DARK_MODE ? 'checked' : ''}><span class="slider round"></span></label></div><div class="custom-colors-section"><h4>Personalizar Tema Cyberpunk (Modo Escuro)</h4><div class="color-picker-grid">${Object.entries(DEFAULT_CYBERPUNK_COLORS).map(([key, defaultValue]) => `<div class="color-picker-item"><label for="color-${key.replace(/--/g,'')}">${key.replace('--cor-', '').replace(/_/g, ' ').replace(/-/g, ' ')}:</label><input type="color" id="color-${key.replace(/--/g,'')}" data-color-key="${key}" value="${CONFIG.customThemeColors[key] || defaultValue}"></div>`).join('')}</div><button id="reset-colors-btn" class="qr-script-button qr-button-secondary">Resetar Cores</button></div></div><div class="settings-tab-content" id="tab-content-actions"><div class="custom-actions-section"><h4>Funções Personalizadas</h4><div class="custom-actions-buttons"><button id="custom-action-example-btn" class="qr-script-button qr-button-secondary">${ICONS.FUNCTION} Exemplo</button></div></div></div></div></div><div class="panel-footer"><button id="qr-save-settings-btn" class="qr-script-button">Salvar e Fechar</button></div>`;
            document.body.appendChild(panel);
            makeDraggable(panel, panel.querySelector('.panel-header'), 'settingsPanel');
            panel.querySelector('.qr-script-popup-close-btn').onclick = () => panel.remove(); // PREFIXADO
            // ... (restante da lógica da função é interna e não precisa de prefixo)
            const tabs = panel.querySelectorAll('.tab-button'); const contents = panel.querySelectorAll('.settings-tab-content'); tabs.forEach(tab => { tab.addEventListener('click', () => { log(`Tab clicked: ${tab.dataset.tab}`); const targetId = `tab-content-${tab.dataset.tab}`; const targetContent = panel.querySelector(`#${targetId}`); tabs.forEach(t => t.classList.remove('active')); contents.forEach(c => c.classList.remove('active')); tab.classList.add('active'); if (targetContent) { targetContent.classList.add('active'); log(`Activated tab content: #${targetId}`); } else { log(`Error: Target content not found for id #${targetId}`); } }); }); const getReplyDataTags = (title) => CONFIG.QUICK_REPLIES.find(r => r.title === title)?.requiredData || []; const renderRepliesSettings = () => { const list = panel.querySelector('#settings-quick-replies-list'); list.innerHTML = ''; const sorted = [...CONFIG.QUICK_REPLIES].sort((a, b) => a.title.localeCompare(b.title)); sorted.forEach((reply) => { const idx = CONFIG.QUICK_REPLIES.findIndex(r => r.title === reply.title && r.text === reply.text); const item = document.createElement('div'); item.className = 'reply-item'; item.dataset.originalIndex = idx; const tags = getReplyDataTags(reply.title); const tagsHtml = tags.map(t => `<span class="data-tag tag-${t.replace(/[^a-zA-Z0-9]/g, '_')}">${t.replace(/_/g, ' ')}</span>`).join(' '); item.innerHTML = `<input type="checkbox" class="favorite-toggle" title="Favorito" ${reply.isFavorite ? 'checked' : ''}><input type="text" value="${reply.title}" class="reply-title" placeholder="CATEGORIA - Título"><input type="text" value="${reply.hotkey || ''}" class="reply-hotkey" placeholder="Atalho (ex: /i1)"><div class="data-tags">${tagsHtml}</div><textarea class="reply-text" rows="3" placeholder="Texto...">${reply.text}</textarea><button class="remove-reply-btn" title="Remover">${ICONS.DELETE}</button>`; list.appendChild(item); }); list.querySelectorAll('.remove-reply-btn').forEach(btn => { btn.onclick = (e) => { if (confirm('Remover esta resposta?')) { e.target.closest('.reply-item').remove(); } }; }); }; panel.querySelector('#add-reply-btn').onclick = () => { const list = panel.querySelector('#settings-quick-replies-list'); const item = document.createElement('div'); item.className = 'reply-item'; item.dataset.originalIndex = '-1'; item.innerHTML = `<input type="checkbox" class="favorite-toggle" title="Favorito"><input type="text" value="NOVA - Título" class="reply-title" placeholder="CATEGORIA - Título"><input type="text" value="" class="reply-hotkey" placeholder="Atalho (ex: /i1)"><div class="data-tags"></div><textarea class="reply-text" rows="3" placeholder="Texto..."></textarea><button class="remove-reply-btn" title="Remover">${ICONS.DELETE}</button>`; list.prepend(item); item.querySelector('.remove-reply-btn').onclick = (e) => { if (confirm('Remover esta resposta?')) { e.target.closest('.reply-item').remove(); } }; item.querySelector('.reply-title').focus(); item.querySelector('.reply-title').select(); }; panel.querySelector('#restore-replies-btn').onclick = () => { if (confirm("Limpar TODAS as respostas?")) { CONFIG.QUICK_REPLIES = []; renderRepliesSettings(); UI.createNotification("Respostas limpas. Salve para confirmar.", "info", 4000); } }; const fileInput = panel.querySelector('#import-replies-input'); panel.querySelector('#export-replies-btn').onclick = () => { try { if (CONFIG.QUICK_REPLIES.length === 0) { UI.createNotification("Nada para exportar.", 'warn'); return; } const json = JSON.stringify(CONFIG.QUICK_REPLIES, null, 2); const blob = new Blob([json], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'respostas_rapidas_backup.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); UI.createNotification(`Exportado (${CONFIG.QUICK_REPLIES.length})!`, 'success'); } catch (e) { log("Erro exportar:", e); UI.createNotification("Erro ao exportar.", 'error'); } }; panel.querySelector('#import-replies-btn').onclick = () => { fileInput.click(); }; fileInput.onchange = (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (e) => { try { const imported = JSON.parse(e.target.result); if (!Array.isArray(imported) || (imported.length > 0 && (!imported[0].title || !imported[0].text))) { throw new Error('JSON inválido.'); } const msg = imported.length > 0 ? `Importar ${imported.length} respostas?` : "Arquivo vazio. Limpar atuais?"; if (confirm(`${msg}\n\nATENÇÃO: Substituirá as respostas atuais. Salve para confirmar.`)) { CONFIG.QUICK_REPLIES = imported.map(r => ({ title: r.title || "INVÁLIDO", text: r.text || "INVÁLIDO", isFavorite: r.isFavorite || false, requiredData: (Array.isArray(r.requiredData) ? r.requiredData : []).map(t => t.replace(/[{}]/g, '').replace(/ /g, '_').toUpperCase().replace(/[ÁÀÂÃÄ]/g,'A').replace(/[ÉÈÊË]/g,'E').replace(/[ÍÌÎÏ]/g,'I').replace(/[ÓÒÔÕÖ]/g,'O').replace(/[ÚÙÛÜ]/g,'U').replace(/Ç/g,'C').replace(/[^A-Z0-9_]/g, '')), hotkey: r.hotkey || null })); renderRepliesSettings(); UI.createNotification("Importado! Revise e Salve.", 'success', 4000); } } catch (err) { log("Erro importar:", err); UI.createNotification(err.message || "Erro ao ler JSON.", 'error'); } finally { event.target.value = null; } }; reader.readAsText(file, 'UTF-8'); }; panel.querySelector('#custom-action-example-btn').onclick = () => { exampleCustomFunction(); }; panel.querySelector('#reset-colors-btn').onclick = () => { if (confirm("Resetar as cores para o padrão Cyberpunk?")) { CONFIG.customThemeColors = { ...DEFAULT_CYBERPUNK_COLORS }; panel.querySelectorAll('.color-picker-grid input[type="color"]').forEach(input => { const key = input.dataset.colorKey; if (key && CONFIG.customThemeColors[key]) { input.value = CONFIG.customThemeColors[key]; } }); applyThemeColors(CONFIG.customThemeColors); UI.createNotification("Cores resetadas.", "info"); } }; panel.querySelector('#qr-save-settings-btn').onclick = () => { const newReplies = []; let hasError = false; const titles = new Set(); panel.querySelectorAll('#settings-quick-replies-list .reply-item').forEach(item => { const titleInput = item.querySelector('.reply-title'); const textInput = item.querySelector('.reply-text'); const hotkeyInput = item.querySelector('.reply-hotkey'); const title = titleInput.value.trim(); const text = textInput.value.trim(); const hotkey = hotkeyInput.value.trim() || null; const isFav = item.querySelector('.favorite-toggle').checked; const idx = parseInt(item.dataset.originalIndex, 10); titleInput.classList.remove('invalid-input'); titleInput.title = ''; textInput.classList.remove('invalid-input'); textInput.title = ''; let reqData = []; if (!isNaN(idx) && idx >= 0 && CONFIG.QUICK_REPLIES[idx]) { reqData = CONFIG.QUICK_REPLIES[idx].requiredData || []; } let titleError = ''; if (!title || !title.includes(' - ')) { titleError = 'Formato: CATEGORIA - Título'; } else if (titles.has(title.toLowerCase())) { titleError = 'Título duplicado.'; } if(titleError){ titleInput.classList.add('invalid-input'); titleInput.title = titleError; hasError = true; } else { titles.add(title.toLowerCase()); } if (!text) { textInput.classList.add('invalid-input'); textInput.title = 'Texto vazio.'; hasError = true; } if (!hasError) { newReplies.push({ title, text, isFavorite: isFav, requiredData: reqData, hotkey: hotkey }); } }); if (hasError) { UI.createNotification("Corrija os campos inválidos nas respostas.", 'error'); return; } CONFIG.QUICK_REPLIES = newReplies; panel.querySelectorAll('.color-picker-grid input[type="color"]').forEach(input => { const key = input.dataset.colorKey; if (key && CONFIG.customThemeColors.hasOwnProperty(key)) { CONFIG.customThemeColors[key] = input.value; } }); CONFIG.DARK_MODE = panel.querySelector('#dark-mode-toggle').checked; saveData(); UI.createNotification("Salvo!", "success"); panel.remove(); }; renderRepliesSettings();
        },
        createTriggerButton() { /* ... (igual v2.4.3 - usa ID #qr-trigger-button, já prefixado) ... */ let btn = document.getElementById('qr-trigger-button'); if (btn) return; btn = document.createElement('button'); btn.id = 'qr-trigger-button'; btn.innerHTML = ICONS.CHAT; btn.title = 'Abrir Respostas (Ctrl+Shift+Ç)'; document.body.appendChild(btn); let dragging = false, startX, startY, initialL, initialT; const saved = localStorage.getItem('qrTriggerButtonPos'); if (saved) { try { const pos = JSON.parse(saved); const w = 48, h = 48; const savedL = parseFloat(pos.left), savedT = parseFloat(pos.top); if (savedL >= 0 && savedL <= innerWidth - w && savedT >= 0 && savedT <= innerHeight - h) { btn.style.left = pos.left; btn.style.top = pos.top; btn.style.right = 'auto'; btn.style.bottom = 'auto'; } else { throw new Error("Fora dos limites."); } } catch (e) { log("Posição salva inválida (botão).", e); btn.style.right = '20px'; btn.style.bottom = '20px'; btn.style.left = 'auto'; btn.style.top = 'auto'; localStorage.removeItem('qrTriggerButtonPos'); } } else { btn.style.right = '20px'; btn.style.bottom = '20px'; btn.style.left = 'auto'; btn.style.top = 'auto'; } btn.onmousedown = (e) => { if (e.button !== 0) return; dragging = false; startX = e.clientX; startY = e.clientY; const rect = btn.getBoundingClientRect(); initialL = rect.left; initialT = rect.top; btn.style.cursor = 'grabbing'; e.preventDefault(); const threshold = 5; let moved = false; document.onmousemove = (me) => { const dX = me.clientX - startX; const dY = me.clientY - startY; if (!moved && (Math.abs(dX) > threshold || Math.abs(dY) > threshold)) { moved = true; dragging = true; } if (moved) { let nX = initialL + dX; let nY = initialT + dY; const bW = btn.offsetWidth, bH = btn.offsetHeight; nX = Math.max(5, Math.min(nX, innerWidth - bW - 5)); nY = Math.max(5, Math.min(nY, innerHeight - bH - 5)); btn.style.left = `${nX}px`; btn.style.top = `${nY}px`; btn.style.right = 'auto'; btn.style.bottom = 'auto'; } }; document.onmouseup = () => { btn.style.cursor = 'pointer'; if (moved) { localStorage.setItem('qrTriggerButtonPos', JSON.stringify({left: btn.style.left, top: btn.style.top})); } document.onmousemove = null; document.onmouseup = null; setTimeout(() => { dragging = false; }, 0); }; }; btn.onclick = () => { if (!dragging) { UI.createQuickReplyPopup(); } }; }
    };

    // --- Injeção de CSS ---
    // *** MODIFICADO v2.4.4 (Conflict Fix) ***
    const injectCss = () => {
        // Tenta carregar a fonte Inter via @resource
        let fontCss = '';
        try {
            if (typeof GM_getResourceText === 'function') {
                fontCss = GM_getResourceText("INTER_FONT") || '';
            }
        } catch(e) {
            log("Erro ao carregar @resource da fonte. Usando fallback.", e);
            fontCss = "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');"; // Fallback para @import
        }

        const C = DEFAULT_CYBERPUNK_COLORS; // Usa o padrão apenas definir a estrutura inicial
        // PREFIXADO todos os seletores de alto nível:
        const css = `
            ${fontCss} /* Injeta a fonte Inter */

             :root {
                 --font-main: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                 --raio-borda: 2px;
                 --transicao-padrao: all 0.15s ease-in-out;
                 /* Cores Claras (Base) */
                 --cp-light-accent: #009999; --cp-light-accent-hover: #00CCCC; --cp-light-accent-text: #FFFFFF; --cp-light-bg1: #FFFFFF; --cp-light-bg2: #F7F7F9; --cp-light-bg3: #E8E8EE; --cp-light-bg-hover: #E0E0E6; --cp-light-border: #D1D1D1; --cp-light-text1: #1F1F1F; --cp-light-text2: #555555; --cp-light-text-disabled: #AAAAAA; --cp-light-danger: #D83A52; --cp-light-danger-hover: #F85149; --cp-light-success: #28A745; --cp-light-info: #17A2B8; --cp-light-shadow: 0 1px 3px rgba(0,0,0,0.1);
                 /* Aplica tema claro como base */
                 --cor-acento-primario: var(--cp-light-accent); --cor-acento-hover: var(--cp-light-accent-hover); --cor-acento-texto: var(--cp-light-accent-text); --cor-fundo-primario: var(--cp-light-bg1); --cor-fundo-secundario: var(--cp-light-bg2); --cor-fundo-terciario: var(--cp-light-bg3); --cor-fundo-hover: var(--cp-light-bg-hover); --cor-borda: var(--cp-light-border); --cor-texto-primario: var(--cp-light-text1); --cor-texto-secundario: var(--cp-light-text2); --cor-texto-desabilitado: var(--cp-light-text-disabled); --cor-perigo: var(--cp-light-danger); --cor-perigo-hover: var(--cp-light-danger-hover); --cor-sucesso: var(--cp-light-success); --cor-info: var(--cp-light-info); --sombra-popup: var(--cp-light-shadow);
                 /* Glows zerados por padrão no claro */
                 --glow-effect: none; --glow-effect-hover: none; --glow-effect-border: none;
             }
             body.qr-dark-mode { /* Será preenchido por JS */ }

             /* Ícones */
             .qr-script-popup .panel-svg-icon { width: 1em; height: 1em; fill: currentColor; vertical-align: -0.15em; display: inline-block; } 
             .qr-script-button .panel-svg-icon { margin-right: 5px; } 
             .qr-script-popup .panel-header-btn .panel-svg-icon { width: 16px; height: 16px; fill: var(--cor-texto-secundario); transition: var(--transicao-padrao); } 
             .qr-script-popup .panel-header-btn:hover .panel-svg-icon { fill: var(--cor-acento-primario); filter: drop-shadow(0 0 2px var(--cor-acento-primario)); } 
             .qr-script-popup .panel-header-btn.qr-script-popup-close-btn:hover .panel-svg-icon { fill: var(--cor-perigo); filter: drop-shadow(0 0 2px var(--cor-perigo)); transform: rotate(90deg) scale(1.1); } 
             .qr-script-popup .remove-reply-btn .panel-svg-icon { width: 16px; height: 16px; fill: var(--cor-texto-desabilitado); transition: var(--transicao-padrao); } 
             .qr-script-popup .remove-reply-btn:hover .panel-svg-icon { fill: var(--cor-perigo); filter: drop-shadow(0 0 2px var(--cor-perigo)); transform: scale(1.1); }

             /* Geral & Popups */
             .qr-script-popup { font-family: var(--font-main); background: var(--cor-fundo-primario); color: var(--cor-texto-primario); border-radius: var(--raio-borda); box-shadow: var(--sombra-popup), inset 0 0 0 1px var(--cor-borda); z-index: 10002; display: flex; flex-direction: column; border: none; min-width: 300px; min-height: 200px; resize: both; overflow: hidden; font-size: 13.5px; transition: background-color 0.2s, color 0.2s, border-color 0.2s; position: fixed; }
             .qr-script-popup .panel-header { cursor: move; background: transparent; padding: 6px 10px; border-bottom: 1px solid var(--cor-acento-primario)55; box-shadow: 0 1px 3px -1px var(--cor-acento-primario)22; /* Sombra mais sutil */ display: flex; justify-content: space-between; align-items: center; border-radius: var(--raio-borda) var(--raio-borda) 0 0; height: 38px; box-sizing: border-box; flex-shrink: 0; }
             .qr-script-popup .panel-header h2, .qr-script-popup .panel-header h3, .qr-script-popup .panel-header h4 { margin: 0 auto 0 0; padding-left: 5px; color: var(--cor-texto-primario); font-size: 0.95em; font-weight: 500; text-shadow: 0 0 2px var(--cor-acento-primario)33; /* Sombra texto sutil */ white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.2px; }
             .qr-script-popup .panel-header-buttons { display: flex; gap: 4px; } .qr-script-popup .panel-header-btn { background: transparent; border: 1px solid transparent; cursor: pointer; color: var(--cor-texto-secundario); padding: 3px; border-radius: var(--raio-borda); display: flex; align-items: center; justify-content: center; transition: var(--transicao-padrao); } .qr-script-popup .panel-header-btn:hover { background-color: var(--cor-fundo-terciario); border-color: var(--cor-borda); color: var(--cor-acento-primario); }

             .qr-script-popup .panel-content-wrapper { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }
             .qr-script-popup .panel-content { padding: 8px; overflow-y: auto; flex-grow: 1; background: var(--cor-fundo-primario); }
             .qr-script-popup .panel-footer { padding: 6px 10px; background: var(--cor-fundo-secundario); border-top: 1px solid var(--cor-borda); text-align: right; border-radius: 0 0 var(--raio-borda) var(--raio-borda); flex-shrink: 0; }

             /* Botões */
             .qr-script-button { background-color: var(--cor-fundo-terciario); color: var(--cor-texto-secundario); border: 1px solid var(--cor-borda); padding: 6px 10px; border-radius: var(--raio-borda); cursor: pointer; font-size: 0.85em; font-weight: 500; transition: var(--transicao-padrao); margin-left: 6px; line-height: 1.2; display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-main); text-transform: none; letter-spacing: 0; }
             .qr-script-button:hover { background-color: var(--cor-acento-primario); color: var(--cor-acento-texto); border-color: var(--cor-acento-primario); box-shadow: var(--glow-effect); /* Glow sutil */ transform: translateY(-1px); }
             .qr-script-button.qr-button-danger { color: var(--cor-perigo); border-color: var(--cor-perigo); background-color: transparent; }
             .qr-script-button.qr-button-danger:hover { background-color: var(--cor-perigo); color: #fff; box-shadow: 0 0 4px var(--cor-perigo), 0 0 6px var(--cor-perigo); } /* Glow perigo sutil */
             #qr-save-settings-btn { background-color: var(--cor-acento-primario); color: var(--cor-acento-texto); border-color: var(--cor-acento-primario); box-shadow: var(--glow-effect); }
             #qr-save-settings-btn:hover { background-color: var(--cor-acento-hover); border-color: var(--cor-acento-hover); box-shadow: var(--glow-effect-hover); transform: scale(1.02) translateY(-1px); }
             .qr-script-button.qr-button-secondary { color: var(--cor-texto-secundario); border-color: var(--cor-borda); background-color: transparent; }
             .qr-script-button.qr-button-secondary:hover { background-color: var(--cor-fundo-hover); color: var(--cor-texto-primario); border-color: var(--cor-texto-secundario); box-shadow: none; }

             /* Notificações */
             #qr-script-notification-container { position: fixed; top: 15px; right: 15px; display: flex; flex-direction: column; gap: 8px; z-index: 10003; max-width: 280px; }
             .qr-script-notification { font-family: var(--font-main); box-shadow: var(--sombra-popup); padding: 9px 14px; border-radius: var(--raio-borda); font-size: 0.85em; font-weight: 500; color: #000; border: 1px solid transparent; transition: opacity 0.3s ease-out, transform 0.3s ease-out; backdrop-filter: blur(2px); opacity: 0.95; }
             .qr-script-notification-info { background-color: var(--cor-info)cc; border-color: var(--cor-info); text-shadow: 0 0 2px #fff;}
             .qr-script-notification-success { background-color: var(--cor-sucesso)cc; border-color: var(--cor-sucesso); text-shadow: 0 0 2px #fff;}
             .qr-script-notification-error { background-color: var(--cor-perigo)cc; border-color: var(--cor-perigo); color: #fff; text-shadow: 0 0 2px #000;}

             /* Popup Principal Layout */
             .qr-script-popup .qr-popup-body { display: flex; flex-grow: 1; overflow: hidden; height: calc(100% - 38px); }
             .qr-script-popup #qr-sidebar { width: 160px; flex-shrink: 0; background: var(--cor-fundo-secundario); border-right: 1px solid var(--cor-borda); overflow-y: auto; padding: 0; }
             .qr-script-popup #qr-category-list { list-style: none; padding: 5px 0; margin: 0; }
             .qr-script-popup .qr-category-item { padding: 8px 10px; cursor: pointer; font-size: 0.85em; font-weight: 500; color: var(--cor-texto-secundario); border: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: var(--transicao-padrao); border-left: 2px solid transparent; }
             .qr-script-popup .qr-category-item:hover { background-color: var(--cor-fundo-hover); color: var(--cor-acento-hover); border-left-color: var(--cor-acento-hover)55; }
             .qr-script-popup .qr-category-item.active { background-color: var(--cor-fundo-hover); color: var(--cor-acento-primario); font-weight: 500; border-left: 2px solid var(--cor-acento-primario); box-shadow: inset 2px 0 3px -2px var(--cor-acento-primario)55; }

             .qr-script-popup #qr-main-content { flex-grow: 1; display: flex; flex-direction: column; padding: 8px 12px; overflow: hidden; background-color: var(--cor-fundo-primario); }
             .qr-script-popup #purecloud-script-quick-reply-search { width: 100%; padding: 7px 5px; border: none; border-bottom: 1px solid var(--cor-borda); border-radius: 0; margin-bottom: 8px; box-sizing: border-box; font-size: 0.95em; flex-shrink: 0; background-color: transparent; color: var(--cor-texto-primario); transition: var(--transicao-padrao); font-family: var(--font-main); }
             .qr-script-popup #purecloud-script-quick-reply-search::placeholder { color: var(--cor-texto-secundario); opacity: 0.6; }
             .qr-script-popup #purecloud-script-quick-reply-search:focus { border-color: var(--cor-acento-primario); box-shadow: 0 2px 4px -2px var(--cor-acento-primario)66; outline: none; background-color: var(--cor-fundo-secundario); }

             /* Sugestões */
             .qr-script-popup .suggestion-filters-container { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; flex-shrink: 0; padding-bottom: 8px; border-bottom: 1px solid var(--cor-borda); }
             .qr-script-popup .suggestion-btn { background: transparent; border: 1px solid var(--cor-borda); color: var(--cor-texto-secundario); padding: 3px 7px; font-size: 0.75em; font-weight: 500; border-radius: var(--raio-borda); cursor: pointer; transition: var(--transicao-padrao); opacity: 0.8; }
             .qr-script-popup .suggestion-btn:hover { border-color: var(--cor-acento-primario); color: var(--cor-acento-primario); opacity: 1; box-shadow: var(--glow-effect-border); }

             /* Lista de Respostas */
             .qr-script-popup .items-container { flex-grow: 1; overflow-y: auto; padding-right: 4px; }
             .qr-script-popup .items-container .item { padding: 8px 10px; margin-bottom: 4px; background-color: transparent; border-radius: var(--raio-borda); cursor: pointer; border: 1px solid transparent; border-bottom: 1px solid var(--cor-borda); transition: var(--transicao-padrao); opacity: 0.95; }
             .qr-script-popup .items-container .item:hover { background-color: var(--cor-fundo-hover); border-color: var(--cor-fundo-hover); opacity: 1; transform: translateX(1px); box-shadow: inset 0 0 4px var(--cor-acento-primario)11; }
             .qr-script-popup .items-container .item strong { color: var(--cor-texto-primario); display: inline; font-size: 0.9em; font-weight: 500; } .qr-script-popup .items-container .item .favorite-star { display: inline-block; margin-left: 4px; filter: grayscale(1); opacity: 0.4; font-size: 0.9em; } .qr-script-popup .items-container .item strong .favorite-star { filter: none; opacity: 1; }
             .qr-script-popup .reply-hotkey-display { font-size: 0.8em; color: var(--cor-texto-secundario); background: var(--cor-fundo-terciario); padding: 0px 4px; border-radius: var(--raio-borda); border: 1px solid var(--cor-borda); margin-left: 5px; }
             .qr-script-popup .items-container .item small { color: var(--cor-texto-secundario); font-size: 0.8em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 3px; line-height: 1.4; }
             .qr-script-popup .qr-results-header { margin: 0 0 6px 0; padding-bottom: 3px; border-bottom: 1px solid var(--cor-borda); color: var(--cor-texto-desabilitado); font-size: 0.7em; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
             .qr-script-popup .qr-no-results { padding: 15px; color: var(--cor-texto-secundario); text-align: center; font-style: italic; opacity: 0.7; } .qr-script-popup .qr-no-results .panel-svg-icon { width: 1.1em; height: 1.1em; fill: var(--cor-texto-secundario); vertical-align: -0.2em; }
             .qr-script-popup .reply-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 4px; flex-wrap: wrap; margin-bottom: 3px; } .qr-script-popup .data-tags { display: flex; gap: 3px; flex-wrap: wrap; margin-left: auto; padding-left: 4px;} .qr-script-popup .data-tag { font-size: 0.6em; padding: 1px 3px; border-radius: var(--raio-borda); font-weight: 500; color: #fff; text-transform: uppercase; white-space: nowrap; border: none; opacity: 0.8;} .qr-script-popup .tag-NOME, .qr-script-popup .tag-NOME_DO_CLIENTE, .qr-script-popup .tag-NOME_COMPLETO { background-color: #A080FF;} .qr-script-popup .tag-CPF { background-color: #FFB000;} .qr-script-popup .tag-ENDERECO { background-color: #00C8A0; } .qr-script-popup .tag-PROTOCOLO, .qr-script-popup .tag-NUMERO { background-color: var(--cor-sucesso); color: #000;} .qr-script-popup .tag-DATA_NASC { background-color: #FF80A0;} .qr-script-popup .tag-QUANTIDADE_HORAS, .qr-script-popup .tag-HORAS { background-color: #80A0FF;} .qr-script-popup .tag-QUANTIDADE_DE_CLIENTES { background-color: #ffc107; color: #000;} .qr-script-popup .tag-CIDADE { background-color: var(--cor-info); color: #000;} .qr-script-popup .tag-DIA_E_MÊS, .qr-script-popup .tag-DIA_MES { background-color: #FF80FF;} .qr-script-popup .tag-MANHÃ_OU_TARDE, .qr-script-popup .tag-MANHA_OU_TARDE { background-color: #AAAAAA; color: #000;} .qr-script-popup .tag-EMAIL { background-color: #80C0FF;} .qr-script-popup .tag-NÚMERO_DE_CONTATO, .qr-script-popup .tag-NUMERO_DE_CONTATO { background-color: #3FB950; color:#000;} .qr-script-popup .tag-OPERADORA { background-color: #FF8080; } .qr-script-popup .tag-APARELHO_ESPECÍFICO { background-color: #C0A080; } .qr-script-popup .tag-SETOR { background-color: #8B949E; color: #000; } .qr-script-popup .data-tag { background-color: #6c757d; }
             .qr-script-popup .quick-reply-item.requires-tags-highlight { border: 1px solid var(--cor-acento-primario)44; background-color: var(--cor-fundo-terciario); }

             /* Painel Config */
             .qr-script-settings-panel { width: 90%; max-width: 800px; height: 85vh; max-height: 800px; min-width: 500px; min-height: 450px;}
             /* Abas */
             .qr-script-popup .settings-tabs { display: flex; border-bottom: 1px solid var(--cor-borda); margin: -8px -10px 10px -10px; padding: 0 10px; flex-shrink: 0; background-color: var(--cor-fundo-secundario); }
             .qr-script-popup .tab-button { background: none; border: none; border-bottom: 2px solid transparent; padding: 8px 12px; cursor: pointer; color: var(--cor-texto-secundario); font-family: var(--font-main); font-size: 0.9em; font-weight: 500; transition: var(--transicao-padrao); margin-bottom: -1px; text-transform: none; letter-spacing: 0; }
             .qr-script-popup .tab-button:hover { color: var(--cor-texto-primario); border-bottom-color: var(--cor-borda); }
             .qr-script-popup .tab-button.active { color: var(--cor-acento-primario); border-bottom-color: var(--cor-acento-primario); text-shadow: 0 0 3px var(--cor-acento-primario)55; }
             .qr-script-popup .settings-tab-content { display: none; flex-grow: 1; flex-direction: column; overflow: hidden; }
             .qr-script-popup .settings-tab-content.active { display: flex; }
             .qr-script-popup #tab-content-replies, .qr-script-popup #tab-content-appearance, .qr-script-popup #tab-content-actions { overflow-y: auto; height: 100%; padding: 5px; }
             .qr-script-popup #settings-quick-replies-list { flex-grow: 1; overflow-y: auto; padding-right: 5px; margin-top: 10px; border-top: 1px solid var(--cor-borda); padding-top: 10px; }
             /* Edição de Respostas */
             .qr-script-popup .reply-item { display: grid; grid-template-columns: auto 1fr 110px auto; gap: 5px 8px; align-items: center; border-bottom: 1px solid var(--cor-borda); padding: 8px 2px 12px 2px; transition: var(--transicao-padrao); } 
             .qr-script-popup .reply-item:hover { background-color: var(--cor-fundo-secundario); } 
             .qr-script-popup .reply-item .reply-title, .qr-script-popup .reply-item .reply-text, .qr-script-popup .reply-item .reply-hotkey { background-color: var(--cor-fundo-secundario); color: var(--cor-texto-primario); border: 1px solid var(--cor-borda); border-radius: var(--raio-borda); padding: 6px; font-family: var(--font-main); width: 100%; box-sizing: border-box; transition: var(--transicao-padrao); } 
             .qr-script-popup .reply-item .reply-title { grid-column: 2 / 3; grid-row: 1 / 2; font-size: 0.9em; font-weight: 500; } 
             .qr-script-popup .reply-item .reply-hotkey { grid-column: 3 / 4; grid-row: 1 / 2; font-size: 0.8em; }
             .qr-script-popup .reply-item .data-tags { grid-column: 2 / 5; grid-row: 2 / 3; margin-top: 2px; min-height: 1em; } 
             .qr-script-popup .reply-item .reply-text { grid-column: 1 / 5; grid-row: 3 / 4; margin-top: 3px; font-size: 0.85em; line-height: 1.4; resize: vertical; min-height: 45px; } 
             .qr-script-popup .reply-item .reply-title:focus, .qr-script-popup .reply-item .reply-text:focus, .qr-script-popup .reply-item .reply-hotkey:focus { border-color: var(--cor-acento-primario); box-shadow: 0 0 0 1px var(--cor-acento-primario)33, inset 0 0 3px var(--cor-acento-primario)22; outline: none; background-color: var(--cor-fundo-primario); } 
             .qr-script-popup .reply-item .remove-reply-btn { background: none; border: none; cursor: pointer; padding: 0; grid-column: 4 / 5; grid-row: 1 / 2; justify-self: end; line-height: 1; transition: var(--transicao-padrao); } 
             .qr-script-popup .reply-item .favorite-toggle { grid-column: 1 / 2; grid-row: 1 / 2; margin-right: 4px; transform: scale(1.1); cursor: pointer;} 
             .qr-script-popup .reply-controls { margin-bottom: 10px; display: flex; gap: 6px; flex-wrap: wrap; align-items: center; } 
             .qr-script-popup input.invalid-input, .qr-script-popup textarea.invalid-input { border-color: var(--cor-perigo) !important; box-shadow: 0 0 0 1px var(--cor-perigo)33, inset 0 0 3px var(--cor-perigo)22 !important; }
             
             /* Seção de Cores */ .qr-script-popup .custom-colors-section { padding-top: 10px; } .qr-script-popup .custom-colors-section h4 { margin: 0 0 8px 0; color: var(--cor-texto-secundario); font-size: 0.85em; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; } .qr-script-popup .color-picker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px 12px; margin-bottom: 8px; } .qr-script-popup .color-picker-item { display: flex; align-items: center; gap: 6px; } .qr-script-popup .color-picker-item label { font-size: 0.75em; color: var(--cor-texto-secundario); text-transform: capitalize; } .qr-script-popup .color-picker-item input[type="color"] { width: 26px; height: 26px; border: 1px solid var(--cor-borda); border-radius: var(--raio-borda); padding: 2px; cursor: pointer; background-color: var(--cor-fundo-terciario); -webkit-appearance: none; -moz-appearance: none; appearance: none; } .qr-script-popup .color-picker-item input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; } .qr-script-popup .color-picker-item input[type="color"]::-webkit-color-swatch { border: none; border-radius: calc(var(--raio-borda) - 1px); } .qr-script-popup .color-picker-item input[type="color"]::-moz-color-swatch { border: none; border-radius: calc(var(--raio-borda) - 1px); }
             /* Seção de Funções */ .qr-script-popup .custom-actions-section { padding-top: 10px; } .qr-script-popup .custom-actions-section h4 { margin: 0 0 8px 0; color: var(--cor-texto-secundario); font-size: 0.85em; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; } .qr-script-popup .custom-actions-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
             /* Botão Flutuante */
             #qr-trigger-button { position: fixed; width: 48px; height: 48px; border-radius: 50%; background-color: var(--cor-acento-primario); color: var(--cor-acento-texto); border: none; font-size: 22px; cursor: pointer; box-shadow: 0 0 8px var(--cor-acento-primario), 0 0 12px var(--cor-acento-primario), inset 0 0 3px rgba(255, 255, 255, 0.3); z-index: 9999; display: flex; align-items: center; justify-content: center; transition: var(--transicao-padrao), transform 0.1s ease, box-shadow 0.2s ease; user-select: none; }
             #qr-trigger-button .panel-svg-icon { width: 24px; height: 24px; fill: var(--cor-acento-texto); filter: drop-shadow(0 0 1px var(--cor-acento-texto)); }
             #qr-trigger-button:hover { background-color: var(--cor-acento-hover); transform: scale(1.08); box-shadow: 0 0 12px var(--cor-acento-hover), 0 0 18px var(--cor-acento-hover), inset 0 0 5px rgba(255, 255, 255, 0.4); }
             #qr-trigger-button:active { cursor: grabbing; transform: scale(1.03); }

             .qr-script-popup .settings-group-inline { display: flex; align-items: center; gap: 8px; margin-left: auto; } .qr-script-popup .settings-group-inline.appearance-toggle { margin-left: 0; margin-bottom: 10px; border-bottom: 1px solid var(--cor-borda); padding-bottom: 10px;} .qr-script-popup .settings-group-inline label { margin-bottom: 0; font-size: 0.8em; color: var(--cor-texto-primario); font-weight: 500; letter-spacing: 0.2px; } .qr-script-popup .switch { position: relative; display: inline-block; width: 36px; height: 18px; } .qr-script-popup .switch input { opacity: 0; width: 0; height: 0; } .qr-script-popup .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--cor-fundo-terciario); border: 1px solid var(--cor-borda); transition: .4s; } .qr-script-popup .slider:before { position: absolute; content: ""; height: 12px; width: 12px; left: 2px; bottom: 2px; background-color: white; transition: .4s; box-shadow: 0 1px 2px rgba(0,0,0,0.2); } body.qr-dark-mode .qr-script-popup .slider:before { background-color: var(--cor-texto-desabilitado); } .qr-script-popup input:checked + .slider { background-color: var(--cor-acento-primario); border-color: var(--cor-acento-primario); box-shadow: 0 0 3px var(--cor-acento-primario)88; } body.qr-dark-mode .qr-script-popup input:checked + .slider:before { background-color: #fff; } .qr-script-popup input:focus + .slider { box-shadow: 0 0 1px var(--cor-acento-primario); } .qr-script-popup input:checked + .slider:before { transform: translateX(18px); } .qr-script-popup .slider.round { border-radius: 18px; } .qr-script-popup .slider.round:before { border-radius: 50%; }
             .qr-script-popup ::-webkit-scrollbar { width: 6px; height: 6px; } .qr-script-popup ::-webkit-scrollbar-track { background: var(--cor-fundo-secundario); } .qr-script-popup ::-webkit-scrollbar-thumb { background: var(--cor-borda); border-radius: 3px; border: 1px solid var(--cor-fundo-secundario); } .qr-script-popup ::-webkit-scrollbar-thumb:hover { background: var(--cor-texto-desabilitado); }
        `;
        if (typeof GM_addStyle !== "undefined") { GM_addStyle(css); } else { let style = document.getElementById('qr-script-injected-style'); if (!style) { style = document.createElement('style'); style.id = 'qr-script-injected-style'; document.head.appendChild(style); } style.textContent = css; }
    };

    // --- Inicialização (MODIFICADA V2.4.9) ---
    const initialize = async () => { // <-- TORNAR ASYNC
        try {
            log(`Initializing QR Script V${SCRIPT_VERSION}`);
            await loadData(); // <-- ADICIONADO AWAIT
            injectCss(); 
            applyThemeColors(CONFIG.DARK_MODE ? CONFIG.customThemeColors : LIGHT_THEME_COLORS);
            document.body.classList.toggle('qr-dark-mode', CONFIG.DARK_MODE);
            log("Data loaded & Theme applied. Dark Mode:", CONFIG.DARK_MODE);
        } catch (error) { log("ERROR loading data:", error); try { UI.createNotification("Error loading script data.", "error", 5000); } catch(e){} return; }
        try { UI.createTriggerButton(); log("Trigger button created."); } catch (error) { log("ERROR creating trigger button:", error); UI.createNotification("Error creating script button.", "error", 5000); }
        try { document.removeEventListener('keydown', keyboardEventHandler); document.addEventListener('keydown', keyboardEventHandler); log("Keyboard listener registered."); } catch (error) { log("ERROR registering keyboard listener:", error); }
        log("Script ready.");
    };

    // --- Ponto de Entrada (MODIFICADO V2.4.9) ---
    const tryInitialize = async () => { // <-- TORNAR ASYNC
        if (findEl('body')) { 
            log("Body found. Initializing."); 
            await initialize(); // <-- ADICIONADO AWAIT
        } else { 
            log("Waiting for body..."); 
            setTimeout(tryInitialize, 1500); 
        } 
    }; 
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', tryInitialize); } else { tryInitialize(); };

})(); // --- FIM DO ISOLAMENTO (V5) ---
