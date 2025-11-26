// ==UserScript==
// @name         PureCloud - Protocolos Rápidos (v1.7.0 - Fixed)
// @namespace    http://tampermonkey.net/protocolos-rapidos
// @version      1.7.0
// @description  Correção do erro de referência e layout ajustado.
// @author       Parceiro de Programacao
// @match        https://*.mypurecloud.*/*
// @match        https://*.genesys.cloud/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // --- 🛡️ PORTEIRO DE MÓDULOS ---
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['MOD_PROTOCOLOS'], function(result) {
            if (result.MOD_PROTOCOLOS === false) {
                console.log("⛔ [Genesys Admin] Módulo Protocolos DESATIVADO pelo usuário.");
                return;
            }
            initProtocolos();
        });
    } else {
        initProtocolos();
    }

    function initProtocolos() {

        const SCRIPT_VERSION = '1.7.0_Fixed';
        const DEBUG_MODE = true;
        const log = (...args) => { if (DEBUG_MODE) console.log(`[Protocolos v${SCRIPT_VERSION}]`, ...args); };

        const PROTOCOLOS_JSON_URL = 'https://scriptgenesys-code.github.io/Script-Completo/protocolos_brisanet_v1_9.json';
        
        const ICONS = {
            GEAR: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2 2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
            CLOSE: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
            BACK: `<svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
            TRASH: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`
        };

        const initialProtocolos = [];
        const requiredTagsMap = {};
        const categoryDisplayMap = { 'recent': '⏱️ Recentes', 'favorites': '⭐ Favoritos', 'all': 'Todos', 'AGENDAMENTO': 'Agendamento', 'ATIVO': 'Ativo', 'BRISATV': 'BrisaTV', 'CABO': 'Cabo', 'CANCELAMENTO': 'Cancelamento', 'DIALOGO': 'Diálogo', 'EQUIPAMENTO': 'Equipamento', 'FINANCEIRO': 'Financeiro', 'FWA': 'FWA', 'ID': 'ID (Dados)', 'INFO': 'Info', 'INSTABILIDADE': 'Instabilidade', 'INSTALACAO': 'Instalação', 'JOGOS': 'Jogos', 'LENTIDAO': 'Lentidão', 'LIGACAO': 'Ligação', 'PARTICULAR': 'Particular', 'QUEDAS': 'Quedas', 'ROTEADOR': 'Roteador', 'SEM_ACESSO': 'Sem Acesso', 'SEM_GERENCIA': 'Sem Gerência', 'SINAL': 'Sinal', 'SVA': 'SVA', 'TELEFONIA': 'Telefonia', 'VELOCIDADE': 'Velocidade', 'VISITA': 'Visita (Custo)', 'WIFI': 'Wi-Fi', };
        const sidebarCategoryOrder = [ 'recent', 'favorites', 'all', 'SEM_ACESSO', 'LENTIDAO', 'QUEDAS', 'INSTABILIDADE', 'SINAL', 'SEM_GERENCIA', 'CABO', 'WIFI', 'EQUIPAMENTO', 'ROTEADOR', 'FWA', 'BRISATV', 'TELEFONIA', 'JOGOS', 'PARTICULAR', 'FINANCEIRO', 'ID', 'VISITA', 'AGENDAMENTO', 'INSTALACAO', 'CANCELAMENTO', 'SVA', 'ATIVO', 'LIGACAO', 'DIALOGO', 'INFO' ];
        
        let CONFIG = { PROTOCOLOS: [], LAST_COPIED_PROTOCOLO: '', RECENT_PROTOCOLOS: [], POPUP_POSITIONS: {}, PR_DARK_MODE: false };

        // --- Funções Utilitárias ---
        const findEl = (selectors, parent = document) => {
            if (!Array.isArray(selectors)) selectors = [selectors];
            for (const selector of selectors) {
                try {
                    if (!parent?.querySelector) continue;
                    const el = parent.querySelector(selector);
                    if (el) return el;
                } catch (e) { log("Erro sel:", selector, e); }
            }
            return null;
        };

        const copyTextToClipboard = async (text) => {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (err) {
                log('Falha copiar:', err);
                return false;
            }
        };

        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        const throttle = (func, limit) => {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        };

        // --- Draggable Logic ---
        const makeDraggable = (popup, header, popupName) => { 
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0; 
            const enforceBounds = (top, left) => { 
                const vh = window.innerHeight, vw = window.innerWidth; 
                const ph = popup.offsetHeight, pw = popup.offsetWidth; 
                const m = 5; 
                let st = Math.max(m, Math.min(vh - ph - m, top)); 
                let sl = Math.max(m, Math.min(vw - pw - m, left)); 
                if (pw > vw - 2 * m) sl = m; 
                if (ph > vh - 2 * m) st = m; 
                return { top: st, left: sl }; 
            }; 
            
            try { CONFIG.POPUP_POSITIONS = JSON.parse(sessionStorage.getItem('pr_popupPositions') || '{}'); } catch(e) { CONFIG.POPUP_POSITIONS = {}; } 
            
            if (CONFIG.POPUP_POSITIONS[popupName]?.top && CONFIG.POPUP_POSITIONS[popupName]?.left) { 
                try { 
                    let ct = parseFloat(CONFIG.POPUP_POSITIONS[popupName].top); 
                    let cl = parseFloat(CONFIG.POPUP_POSITIONS[popupName].left); 
                    popup.style.top = ct + 'px'; 
                    popup.style.left = cl + 'px'; 
                } catch(e) { popup.style.top = '10%'; popup.style.left = '10%'; } 
            } else { popup.style.top = '10%'; popup.style.left = '10%'; } 

            const saveCurrentPositionAndSize = () => { 
                clearTimeout(popup._savePosTimeout); 
                popup._savePosTimeout = setTimeout(() => { 
                    let cut = popup.style.top, cul = popup.style.left; 
                    const sp = enforceBounds(parseFloat(cut), parseFloat(cul)); 
                    CONFIG.POPUP_POSITIONS[popupName] = { top: sp.top + 'px', left: sp.left + 'px', width: popup.style.width, height: popup.style.height }; 
                    try { sessionStorage.setItem('pr_popupPositions', JSON.stringify(CONFIG.POPUP_POSITIONS)); } catch (e) {} 
                }, 300); 
            }; 

            if (header) { 
                header.onmousedown = e => { 
                    if (e.target.closest('button') || e.button !== 0) return; 
                    e.preventDefault(); 
                    pos3 = e.clientX; pos4 = e.clientY; 
                    document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; saveCurrentPositionAndSize(); }; 
                    document.onmousemove = ev => { 
                        ev.preventDefault(); 
                        pos1 = pos3 - ev.clientX; pos2 = pos4 - ev.clientY; 
                        pos3 = ev.clientX; pos4 = ev.clientY; 
                        const nt = popup.offsetTop - pos2, nl = popup.offsetLeft - pos1; 
                        const sp = enforceBounds(nt, nl); 
                        popup.style.top = sp.top + "px"; popup.style.left = sp.left + "px"; 
                    }; 
                }; 
            } 
        };

        // --- Teclado (A função que faltava) ---
        const keyboardEventHandler = (e) => {
            const target = e.target.tagName.toUpperCase(); 
            const isPopupInput = e.target.closest('.pr-script-base-popup') && (target === 'INPUT' || target === 'TEXTAREA' || target === 'SELECT'); 
            if (e.key !== 'Escape' && isPopupInput) return; 
            
            if (e.ctrlKey && e.shiftKey && e.key.toUpperCase() === 'U') { 
                e.preventDefault(); 
                UI.createProtocoloPopup(); 
            } 
            if (e.key === 'Escape') { 
                const p1 = document.querySelector('.pr-script-popup'); 
                const p2 = document.querySelector('.pr-script-settings-panel'); 
                if (p1) { p1.remove(); e.preventDefault(); } 
                else if (p2) { p2.remove(); e.preventDefault(); } 
            }
        };

        // --- DADOS ---
        const loadData = async () => {
            let protocolsLoaded = false;
            try { 
                const localProtocols = localStorage.getItem('pr_protocolos'); 
                if (localProtocols) { 
                    const parsed = JSON.parse(localProtocols); 
                    if (Array.isArray(parsed) && parsed.length > 0) { CONFIG.PROTOCOLOS = parsed; protocolsLoaded = true; } 
                } 
            } catch (e) { localStorage.removeItem('pr_protocolos'); }
            
            if (!protocolsLoaded) { 
                try { 
                    const response = await fetch(PROTOCOLOS_JSON_URL + '?v=' + Date.now()); 
                    if (!response.ok) throw new Error('Network error'); 
                    const data = await response.json(); 
                    let newProtocolos = (Array.isArray(data)) ? data : (data && Array.isArray(data.protocols) ? data.protocols : null); 
                    if (newProtocolos) { 
                        CONFIG.PROTOCOLOS = newProtocolos; 
                        try { localStorage.setItem('pr_protocolos', JSON.stringify(newProtocolos)); } catch (e) {} 
                    } 
                } catch (fetchErr) { CONFIG.PROTOCOLOS = initialProtocolos; } 
            }
            
            try { 
                CONFIG.LAST_COPIED_PROTOCOLO = localStorage.getItem('pr_lastCopiedProtocol') || ''; 
                CONFIG.RECENT_PROTOCOLOS = JSON.parse(localStorage.getItem('pr_recentProtocols_v1')) || []; 
                CONFIG.POPUP_POSITIONS = JSON.parse(sessionStorage.getItem('pr_popupPositions') || '{}'); 
                CONFIG.PR_DARK_MODE = localStorage.getItem('pr_darkMode') === 'true'; 
            } catch (e) { 
                CONFIG.RECENT_PROTOCOLOS = []; 
                CONFIG.POPUP_POSITIONS = {}; 
                CONFIG.PR_DARK_MODE = false; 
            }
            
            CONFIG.PROTOCOLOS = CONFIG.PROTOCOLOS.map(r => ({ ...r, isFavorite: r.isFavorite || false, requiredData: r.requiredData || [] }));
            CONFIG.PROTOCOLOS.forEach(reply => { requiredTagsMap[reply.title] = (Array.isArray(reply.requiredData) ? reply.requiredData : []).map(tag => typeof tag === 'string' ? tag.replace(/[{}]/g, '').replace(/ /g, '_').toUpperCase() : ''); });
        };

        const saveData = () => { try { localStorage.setItem('pr_protocolos', JSON.stringify(CONFIG.PROTOCOLOS)); localStorage.setItem('pr_lastCopiedProtocol', CONFIG.LAST_COPIED_PROTOCOLO); localStorage.setItem('pr_recentProtocols_v1', JSON.stringify(CONFIG.RECENT_PROTOCOLOS)); localStorage.setItem('pr_darkMode', CONFIG.PR_DARK_MODE); } catch (e) {} };
        
        const logUsedProtocolo = (title, text) => { 
            const MAX = 5; 
            const entry = { title, text }; 
            CONFIG.RECENT_PROTOCOLOS = CONFIG.RECENT_PROTOCOLOS.filter(r => r.title !== title || r.text !== text); 
            CONFIG.RECENT_PROTOCOLOS.unshift(entry); 
            if (CONFIG.RECENT_PROTOCOLOS.length > MAX) CONFIG.RECENT_PROTOCOLOS.length = MAX; 
        };

        const documentExtractor = { 
            getParticipantName: () => { const sels = ['h3.participant-name', 'div.interaction-name-wrapper div.participant-name > span', 'p.participant-name', 'span[data-qa-id="participant-name"]', 'h2.participant-name']; const el = findEl(sels); if (!el) return 'cliente'; const raw = el.textContent.trim(); const match = raw.match(/^([a-zA-Z\sáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ.-]+)/); return (match?.[1]?.trim() || raw) || 'cliente'; }, 
            getInteractionId: () => { const sels = ['span[data-qa-id="interaction-id"]', '[data-qa-id="detail-value-interactionId"]', '.interaction-id-value']; const el = findEl(sels); return el?.textContent.trim().replace(/#/g, '') || 'protocolo'; } 
        };
        
        const UI = {
            createNotification(message, type = 'info', duration = 3000) { 
                let cont = document.getElementById('pr-script-notification-container'); 
                if (!cont) { cont = document.createElement('div'); cont.id = 'pr-script-notification-container'; document.body.appendChild(cont); } 
                const n = document.createElement("div"); n.textContent = message; n.className = `pr-script-notification pr-script-notification-${type}`; 
                cont.prepend(n); 
                setTimeout(() => n.remove(), duration); 
            },

            createProtocoloPopup() {
                document.querySelector('.pr-script-popup')?.remove(); 
                document.querySelector('.pr-script-settings-panel')?.remove();
                
                const popup = document.createElement("div"); 
                popup.className = 'pr-script-popup pr-script-base-popup';

                popup.innerHTML = `
                    <div class="panel-header">
                        <h4>Protocolos Rápidos</h4>
                        <div class="panel-header-buttons">
                            <button class="panel-header-btn settings-btn" title="Gerenciar Protocolos">${ICONS.GEAR}</button>
                            <button class="panel-header-btn pr-script-popup-close-btn" title="Fechar (Esc)">${ICONS.CLOSE}</button>
                        </div>
                    </div>
                    <div class="pr-popup-body">
                        <div id="pr-sidebar">
                            <div class="pr-sidebar-title">CATEGORIAS</div>
                            <ul id="pr-category-list"></ul>
                        </div>
                        <div id="pr-main-content">
                            <input type="text" id="pr-script-search" placeholder="Buscar por protocolo ou palavra-chave...">
                            <div id="pr-reply-tags" class="pr-tags-container-filter"></div>
                            <div id="pr-suggestion-filters" class="pr-suggestion-filters-container"></div>
                            <div id="pr-quick-filters" class="pr-quick-filters"></div>
                            <div id="pr-reply-results" class="pr-items-container"></div>
                        </div>
                        <div id="pr-editor-sidebar" style="display: none;">
                            <h5>Editor de Protocolo</h5>
                            <textarea id="pr-editor-original-text" readonly rows="4" style="display:none;"></textarea>

                            <div class="pr-editor-grid">
                                <div class="pr-editor-field"><label>Nome Titular:</label><input type="text" id="pr-editor-titular"></div>
                                <div class="pr-editor-field">
                                    <label>Gênero:</label>
                                    <select id="pr-editor-gender">
                                        <option value="neutro" selected>Neutro/Não Aplic.</option>
                                        <option value="masculino">Masculino</option>
                                        <option value="feminino">Feminino</option>
                                    </select>
                                </div>
                            </div>

                            <div class="pr-editor-field">
                                <label>Relação do Contato:</label>
                                <select id="pr-editor-relationship"> <option value="proprio" selected>Próprio Titular</option> <option value="filho">Filho(a)</option> <option value="conjuge">Cônjuge</option> <option value="pai_mae">Pai/Mãe</option> <option value="irmao">Irmão(ã)</option> <option value="amigo">Amigo(a)</option> <option value="outro_parente">Outro Parente</option> <option value="terceiro">Funcionário(a) / Terceiro</option> </select>
                            </div>
                            <div class="pr-editor-field" id="pr-editor-contact-name-group" style="display: none;"> <label>Nome Contato:</label> <input type="text" id="pr-editor-contact-name"> </div>
                            <div class="pr-editor-field"><label>Telefone Contato:</label><input type="tel" id="pr-editor-phone" placeholder="(XX) XXXXX-XXXX"></div>

                            <div class="pr-editor-grid">
                                <div class="pr-editor-field">
                                    <label>Data:</label>
                                    <input type="date" id="pr-editor-date">
                                </div>
                                <div class="pr-editor-field">
                                    <label>Período:</label>
                                    <select id="pr-editor-timeslot"> <option value="nao_definido" selected>--</option> <option value="manha">Manhã</option> <option value="tarde">Tarde</option> <option value="noite">Noite</option> </select>
                                </div>
                            </div>

                            <div class="pr-editor-field">
                                <label>Notas Rápidas:</label>
                                <textarea id="pr-editor-notes" rows="2" placeholder="Adicionar observação..."></textarea>
                            </div>

                            <button id="pr-editor-preview-btn" class="pr-script-button">Gerar Pré-visualização</button>
                            
                            <div style="margin-top:10px; margin-bottom:5px;">
                                <label style="color:#888; font-size:11px; font-weight:bold;">RESULTADO:</label>
                                <textarea id="pr-editor-preview" placeholder="O texto gerado aparecerá aqui..."></textarea>
                            </div>

                            <button id="pr-editor-copy-preview-btn" class="pr-script-button" style="background:#6c757d;">Copiar Texto</button>
                        </div>
                    </div>`;

            document.body.appendChild(popup); 
            popup.style.width = '900px'; 
            popup.style.height = '680px'; 
            
            makeDraggable(popup, popup.querySelector('.panel-header'), 'protocoloPopup'); 
            
            popup.querySelector('.pr-script-popup-close-btn').onclick = () => popup.remove(); 
            popup.querySelector('.settings-btn').onclick = () => UI.createSettingsPanel();

            // Elementos
            const searchInput = popup.querySelector('#pr-script-search');
            const categoryListContainer = popup.querySelector('#pr-category-list');
            const resultsContainer = popup.querySelector('#pr-reply-results');
            const tagsContainer = popup.querySelector('#pr-reply-tags');
            const suggestionsContainer = popup.querySelector('#pr-suggestion-filters');
            const quickFiltersContainer = popup.querySelector('#pr-quick-filters');
            
            const editorSidebar = popup.querySelector('#pr-editor-sidebar');
            const originalTextArea = popup.querySelector('#pr-editor-original-text');
            const titularInput = popup.querySelector('#pr-editor-titular');
            const genderSelect = popup.querySelector('#pr-editor-gender');
            const relationshipSelect = popup.querySelector('#pr-editor-relationship');
            const contactNameGroup = popup.querySelector('#pr-editor-contact-name-group');
            const contactNameInput = popup.querySelector('#pr-editor-contact-name');
            const phoneInput = popup.querySelector('#pr-editor-phone');
            const dateInput = popup.querySelector('#pr-editor-date');
            const timeslotSelect = popup.querySelector('#pr-editor-timeslot');
            const notesTextarea = popup.querySelector('#pr-editor-notes');
            const previewBtn = popup.querySelector('#pr-editor-preview-btn');
            const previewTextArea = popup.querySelector('#pr-editor-preview');
            const copyPreviewBtn = popup.querySelector('#pr-editor-copy-preview-btn');

            let currentCategory = 'favorites'; let currentSearchTerm = ''; let activeTagFilter = null; let activeQuickFilters = [];

            const getReplyDataTags = (title) => { const r = CONFIG.PROTOCOLOS.find(p => p.title === title); return r?.requiredData || []; };
            const highlightText = (text, keywords) => { if (!keywords || keywords.length === 0 || !text) { return text; } const regexKeywords = keywords.map(kw => escapeRegExp(kw)).join('|'); const regex = new RegExp(`(${regexKeywords})`, 'gi'); return text.replace(regex, '<span class="pr-highlight">$1</span>'); };

            const populateReplies = (category, searchTerm, tagFilter) => {
                const name = documentExtractor.getParticipantName(); const id = documentExtractor.getInteractionId(); resultsContainer.innerHTML = ''; let filteredReplies = []; let headerText = ''; const lowerSearch = searchTerm ? searchTerm.toLowerCase() : ''; const searchKeywords = lowerSearch ? lowerSearch.split(/\s+/).filter(k => k) : []; if (searchTerm) { const scored = []; CONFIG.PROTOCOLOS.forEach(reply => { const lt = reply.title.toLowerCase(); const ltxt = reply.text.toLowerCase(); let score = 0; if (lt.startsWith(lowerSearch)) { score += 1000; } else if (lt.includes(lowerSearch)) { score += 100; } let keywordsFoundCount = 0; searchKeywords.forEach(kw => { if (lt.includes(kw)) { score += 20; keywordsFoundCount++; } else if (ltxt.includes(kw)) { score += 5; keywordsFoundCount++; } }); if (searchKeywords.length > 1 && keywordsFoundCount === searchKeywords.length) { score += 50; } if (score > 0) scored.push({ ...reply, score }); }); scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)); filteredReplies = scored; headerText = `Busca por "${searchTerm}"`; } else if (tagFilter) { let base = CONFIG.PROTOCOLOS; if (category && !['all', 'favorites', 'recent', 'search'].includes(category)) { base = base.filter(r => r.title.startsWith(category + ' - ')); } filteredReplies = base.filter(r => getReplyDataTags(r.title).includes(tagFilter)); const catLabel = categoryDisplayMap[category] || category; headerText = `Filtro Tag: "${tagFilter.replace(/_/g, ' ')}"` + (category && !['all', 'search'].includes(category) ? ` em ${catLabel}` : ''); filteredReplies.sort((a, b) => a.title.localeCompare(b.title)); } else if (category === 'favorites') { filteredReplies = CONFIG.PROTOCOLOS.filter(r => r.isFavorite); headerText = categoryDisplayMap['favorites']; filteredReplies.sort((a, b) => a.title.localeCompare(b.title)); } else if (category === 'recent') { const titles = CONFIG.RECENT_PROTOCOLOS.map(r => r.title); filteredReplies = CONFIG.PROTOCOLOS.filter(r => titles.includes(r.title)).sort((a, b) => titles.indexOf(a.title) - titles.indexOf(b.title)); headerText = categoryDisplayMap['recent']; } else if (category && category !== 'all') { filteredReplies = CONFIG.PROTOCOLOS.filter(r => r.title.startsWith(category + ' - ')); headerText = categoryDisplayMap[category] || `Categoria: ${category}`; filteredReplies.sort((a, b) => a.title.localeCompare(b.title)); } else { filteredReplies = [...CONFIG.PROTOCOLOS]; headerText = categoryDisplayMap['all']; filteredReplies.sort((a, b) => a.title.localeCompare(b.title)); } if (activeQuickFilters.length > 0) { headerText += ` (Filtros: ${activeQuickFilters.join(', ')})`; filteredReplies = filteredReplies.filter(reply => { const lowerTextAndTitle = (reply.title + ' ' + reply.text).toLowerCase(); return activeQuickFilters.every(filterKeyword => lowerTextAndTitle.includes(filterKeyword)); }); } if (filteredReplies.length === 0) { resultsContainer.innerHTML = `<p class="pr-no-results">Nenhum protocolo encontrado.</p>`; return; } resultsContainer.innerHTML = `<h4 class="pr-results-header">${headerText} (${filteredReplies.length})</h4>`; 
                
                filteredReplies.forEach(reply => { 
                    const code = reply.title.split(' - ')[0].trim(); 
                    let sub = reply.title.substring(code.length).replace(/^ - /, '').trim() || reply.title; 
                    let textSnippet = reply.text.substring(0, 150) + (reply.text.length > 150 ? '...' : ''); 
                    if (searchKeywords.length > 0) { sub = highlightText(sub, searchKeywords); textSnippet = highlightText(textSnippet, searchKeywords); } 
                    const tags = getReplyDataTags(reply.title); 
                    const tagsHTML = tags.map(t => `<span class="pr-data-tag pr-tag-${t.replace(/[^a-zA-Z0-9]/g, '_')}" title="${t.replace(/_/g, ' ')}">${t.substring(0, Math.min(t.length, 4))}${t.length > 4 ? '.' : ''}</span>`).join(''); 
                    const reqClass = tags.length > 0 ? 'pr-requires-tags-highlight' : ''; 
                    const item = document.createElement('div'); 
                    item.className = `item pr-reply-item ${reqClass}`; 
                    item.dataset.originalText = reply.text; 
                    item.innerHTML = `<div class="pr-reply-header"><strong>${sub} ${reply.isFavorite ? '⭐' : ''}</strong><div class="pr-data-tags">${tagsHTML}</div></div><small>${textSnippet}</small>`; 
                    item.title = reply.text; 
                    
                    item.onclick = async () => { 
                        const origTxt = item.dataset.originalText; 
                        logUsedProtocolo(reply.title, reply.text); 
                        
                        // Preencher campos do editor
                        originalTextArea.value = origTxt; 
                        titularInput.value = name; 
                        genderSelect.value = 'neutro'; 
                        relationshipSelect.value = 'proprio'; 
                        contactNameGroup.style.display = 'none'; 
                        contactNameInput.value = ''; 
                        phoneInput.value = ''; 
                        dateInput.value = ''; 
                        timeslotSelect.value = 'nao_definido'; 
                        notesTextarea.value = ''; 
                        previewTextArea.value = origTxt; 
                        
                        // Mostrar Editor
                        editorSidebar.style.display = 'flex'; 
                        
                        // Gera o preview inicial
                        previewBtn.click();
                        titularInput.focus(); 
                    }; 
                    resultsContainer.appendChild(item); 
                }); 
                resultsContainer.scrollTop = 0;
            };

            relationshipSelect.addEventListener('change', () => { contactNameGroup.style.display = relationshipSelect.value === 'proprio' ? 'none' : 'block'; if(relationshipSelect.value !== 'proprio') contactNameInput.focus(); });

            previewBtn.addEventListener('click', () => {
                 try {
                     let modifiedText = originalTextArea.value; if (!modifiedText) return;
                     const holderName = titularInput.value.trim() || 'Titular';
                     const gender = genderSelect.value;
                     const relationshipValue = relationshipSelect.value;
                     const relationshipText = relationshipSelect.options[relationshipSelect.selectedIndex].text;
                     const contactName = contactNameInput.value.trim();
                     const phoneNumber = phoneInput.value.trim();
                     const visitDateRaw = dateInput.value;
                     const timeslotValue = timeslotSelect.value;
                     const quickNotes = notesTextarea.value.trim();
                     
                     let contactPerson = '';
                     let pronounEnding = gender === 'feminino' ? 'a' : 'o';
                     if (relationshipValue === 'proprio') {
                         contactPerson = `Própri${pronounEnding} titular ${holderName}`;
                         if (gender !== 'neutro') { modifiedText = modifiedText.replace(/\b(o|a)\s+mesm[oa]\b/gi, `${pronounEnding} mesm${pronounEnding}`); modifiedText = modifiedText.replace(/\bclient[ea]\b/gi, `client${gender === 'feminino' ? 'a' : 'e'}`); }
                     } else if (contactName) {
                         contactPerson = `${relationshipText} ${contactName}`;
                          if (gender !== 'neutro') { modifiedText = modifiedText.replace(/\b(o|a)\s+mesm[oa]\b/gi, `${pronounEnding} mesm${pronounEnding}`); }
                     } else { contactPerson = relationshipText; }

                     const contactRegex = /^(?:Própri[ao]\s+titular|Cliente)\b/i;
                     if (contactPerson && contactRegex.test(modifiedText.trimStart())) { modifiedText = modifiedText.replace(contactRegex, contactPerson); } 
                     else if (contactPerson && !modifiedText.trimStart().toLowerCase().startsWith(contactPerson.toLowerCase())) { modifiedText = contactPerson + ". " + modifiedText.trimStart(); }
                     
                     const phoneAddRegex = /(entrou em contato(?:\s+com o número(?:\s+[\d\s()+-]+)?)?)([.,;]?\s)?/i;
                     let phoneMatch = modifiedText.match(phoneAddRegex);
                     if (phoneNumber) {
                         const phoneText = `entrou em contato com o número ${phoneNumber}${phoneMatch ? (phoneMatch[2] || '') : '.'}`;
                         if (phoneMatch) { modifiedText = modifiedText.replace(phoneAddRegex, phoneText); } 
                         else { const nameEndRegex = new RegExp(`^${escapeRegExp(contactPerson)}(\\s*[.,;]?)`, 'i'); if (contactPerson && nameEndRegex.test(modifiedText.trim())) { modifiedText = modifiedText.replace(nameEndRegex, (match, p1) => `${contactPerson}, contato ${phoneNumber}${p1 || '.'}`); } else { modifiedText = `Contato ${phoneNumber}. ${modifiedText}`; } }
                     } else if (phoneMatch) { modifiedText = modifiedText.replace(phoneAddRegex, `entrou em contato${phoneMatch[2] || ''}`); }
                     
                     let visitInfo = '';
                     if (visitDateRaw) { try { const [year, month, day] = visitDateRaw.split('-'); if (day && month && year && year.length === 4) { visitInfo += ` no dia ${day}/${month}/${year}`; } } catch (e) { log("Erro data", e)} }
                     if (timeslotValue !== 'nao_definido') { visitInfo += (visitInfo ? ', ' : ' no ') + `período da ${timeslotSelect.options[timeslotSelect.selectedIndex].text}`; }
                     if (visitInfo) {
                         const visitPlaceholderRegex = /(receber a equipe no dia|disponibilidade para receber a equipe|visita no dia|agendamento no dia|passar no local no dia)(?:[\s\d\/,a-zA-Zà-úÀ-Ú.-]*?)?([.,!?;]?\s*)$/mi;
                         let replacedDate = false;
                          modifiedText = modifiedText.replace(visitPlaceholderRegex, (match, p1, p2) => { replacedDate = true; let finalPunctuation = (p2 && p2.trim().match(/[.,!?;]$/)) ? p2.trim() : '.'; return `${p1}${visitInfo}${finalPunctuation}`; });
                          if (!replacedDate) { modifiedText = modifiedText.trimEnd().replace(/[.,!?;]$/, '') + visitInfo + '.'; }
                     }
                     if (quickNotes) { modifiedText = modifiedText.trimEnd(); modifiedText += `\n\nOBS: ${quickNotes}`; }
                     
                     previewTextArea.value = modifiedText.trim();
                     
                     // Efeito Visual no Botão
                     const originalText = previewBtn.innerText;
                     previewBtn.innerText = "Gerado!";
                     previewBtn.style.backgroundColor = "#28a745";
                     setTimeout(() => {
                         previewBtn.innerText = originalText;
                         previewBtn.style.backgroundColor = "";
                     }, 1000);

                 } catch(err) { UI.createNotification("Erro ao gerar.", "error"); previewTextArea.value = originalTextArea.value; }
            });

            copyPreviewBtn.addEventListener('click', async () => {
                 const textToCopy = previewTextArea.value; 
                 if (!textToCopy) { UI.createNotification("Vazio.", 'warn'); return; } 
                 if (await copyTextToClipboard(textToCopy)) { UI.createNotification("Copiado!", 'success'); } 
                 else { UI.createNotification("Erro.", 'error'); }
            });

            // --- Listas ---
            const buildTagFilters = () => { tagsContainer.innerHTML = ''; const tags = new Set(); CONFIG.PROTOCOLOS.forEach(r => getReplyDataTags(r.title).forEach(t => { if(t) tags.add(t); })); if (tags.size > 0) { tagsContainer.style.display = 'flex'; const arr = Array.from(tags).sort(); const clr = document.createElement('button'); clr.className = 'pr-tag-filter-btn pr-tag-clear-btn'; clr.textContent = 'Limpar'; clr.onclick = () => { activeTagFilter = null; currentSearchTerm = ''; searchInput.value = ''; buildTagFilters(); populateReplies(currentCategory, '', null); }; tagsContainer.appendChild(clr); arr.forEach(t => { const btn = document.createElement('button'); const cls = t.replace(/[^a-zA-Z0-9]/g, '_'); btn.className = `pr-tag-filter-btn pr-tag-${cls}`; btn.textContent = t.replace(/_/g, ' '); if (activeTagFilter === t) btn.classList.add('active'); btn.onclick = () => { activeTagFilter = (activeTagFilter === t) ? null : t; currentSearchTerm = ''; searchInput.value = ''; activeQuickFilters = []; buildQuickFilters(); buildTagFilters(); populateReplies(currentCategory === 'search' ? 'all' : currentCategory, '', activeTagFilter); }; tagsContainer.appendChild(btn); }); } else { tagsContainer.style.display = 'none'; } };
            const buildSuggestionFilters = () => { suggestionsContainer.innerHTML = ''; const suggs = ['LOS', 'Rota', 'Lentidão', 'Sem Acesso', 'Quedas', 'Cabo', 'Wi-Fi', 'Senha', 'OS', 'FWA', 'Financeiro']; suggs.forEach(s => { const btn = document.createElement('button'); btn.className = 'pr-suggestion-btn'; btn.textContent = s; btn.onclick = () => { searchInput.value = s; searchInput.dispatchEvent(new Event('input', { bubbles: true })); }; suggestionsContainer.appendChild(btn); }); };
            const buildQuickFilters = () => { quickFiltersContainer.innerHTML = ''; ['OS', 'Normalizado', 'Transferência'].forEach(keyword => { const label = document.createElement('label'); const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.value = keyword.toLowerCase(); checkbox.checked = activeQuickFilters.includes(keyword.toLowerCase()); checkbox.onchange = () => { if (checkbox.checked) activeQuickFilters.push(keyword.toLowerCase()); else activeQuickFilters = activeQuickFilters.filter(f => f !== keyword.toLowerCase()); populateReplies(currentCategory, currentSearchTerm, activeTagFilter); }; label.appendChild(checkbox); label.appendChild(document.createTextNode(keyword)); quickFiltersContainer.appendChild(label); }); };
            const buildCategoriesSidebar = () => { categoryListContainer.innerHTML = ''; sidebarCategoryOrder.forEach(code => { const exists = ['recent', 'favorites', 'all'].includes(code) || CONFIG.PROTOCOLOS.some(r => r.title.startsWith(code + ' - ')); if (exists && categoryDisplayMap[code]) { const li = document.createElement('li'); li.className = 'pr-category-item'; li.textContent = categoryDisplayMap[code]; if (code === currentCategory) li.classList.add('active'); li.onclick = () => { currentCategory = code; currentSearchTerm = ''; activeTagFilter = null; searchInput.value = ''; buildTagFilters(); buildQuickFilters(); populateReplies(currentCategory, '', null); editorSidebar.style.display = 'none'; categoryListContainer.querySelectorAll('.pr-category-item').forEach(i => i.classList.remove('active')); li.classList.add('active'); }; categoryListContainer.appendChild(li); } }); };
            
            searchInput.oninput = throttle(() => { currentSearchTerm = searchInput.value.trim(); activeTagFilter = null; buildTagFilters(); if(!currentSearchTerm) { populateReplies(currentCategory, '', null); } else { currentCategory = 'search'; populateReplies(null, currentSearchTerm, null); } editorSidebar.style.display = 'none'; }, 300);
            
            buildCategoriesSidebar(); buildTagFilters(); buildSuggestionFilters(); buildQuickFilters(); populateReplies(currentCategory, '', null); searchInput.focus();
        },

        createSettingsPanel() {
             document.querySelector('.pr-script-popup')?.remove(); document.querySelector('.pr-script-settings-panel')?.remove(); 
             const panel = document.createElement('div'); panel.className = 'pr-script-settings-panel pr-script-base-popup'; 
             
             panel.innerHTML = ` 
             <div class="panel-header">
                <div style="display:flex;align-items:center;gap:5px;">
                    <button class="panel-header-btn back-btn" title="Voltar">${ICONS.BACK}</button>
                    <h2>Gerenciar Protocolos</h2>
                </div>
                <div class="panel-header-buttons"><button class="panel-header-btn pr-script-popup-close-btn" title="Fechar">${ICONS.CLOSE}</button></div>
             </div> 
             <div class="panel-content"> 
                <div class="pr-reply-controls"> 
                    <button id="pr-add-reply-btn" class="pr-script-button">Add Protocolo</button> 
                    <button id="pr-restore-replies-btn" class="pr-script-button button-danger">Restaurar Padrão</button> 
                    <button id="pr-export-json-btn" class="pr-script-button" style="background-color: #4d8aff;">Exportar JSON</button> 
                    <button id="pr-import-json-btn" class="pr-script-button" style="background-color: #3bafda;">Importar JSON</button> 
                </div> 
                <div id="pr-settings-replies-list" class="pr-settings-reply-list"></div> 
             </div> 
             <div class="panel-footer"> <button id="pr-save-settings-btn" class="pr-script-button">Salvar e Fechar</button> </div> `; 
             
             document.body.appendChild(panel); makeDraggable(panel, panel.querySelector('.panel-header'), 'settingsPanel'); 
             panel.querySelector('.pr-script-popup-close-btn').onclick = () => panel.remove(); 
             panel.querySelector('.back-btn').onclick = () => { panel.remove(); UI.createProtocoloPopup(); };

             const renderSettings = () => { 
                 const list = panel.querySelector('#pr-settings-replies-list'); list.innerHTML = ''; 
                 [...CONFIG.PROTOCOLOS].sort((a,b)=>a.title.localeCompare(b.title)).forEach(r => { 
                     const item = document.createElement('div'); item.className = 'pr-reply-item'; 
                     const idx = CONFIG.PROTOCOLOS.findIndex(p => p.title === r.title && p.text === r.text);
                     item.dataset.originalIndex = idx;
                     item.innerHTML = `
                        <div class="pr-reply-row-top">
                            <input type="checkbox" class="pr-favorite-toggle" ${r.isFavorite ? 'checked' : ''} title="Favorito">
                            <input type="text" value="${r.title}" class="pr-reply-title" placeholder="CATEGORIA - Título">
                            <button class="pr-remove-reply-btn" title="Remover">${ICONS.TRASH}</button>
                        </div>
                        <div class="pr-reply-row-bottom">
                            <textarea class="pr-reply-text" rows="2">${r.text}</textarea>
                        </div>
                     `;
                     list.appendChild(item); 
                 }); 
                 list.querySelectorAll('.pr-remove-reply-btn').forEach(btn => btn.onclick = (e) => { if (confirm('Remover protocolo?')) e.target.closest('.pr-reply-item').remove(); });
             }; 
             
             panel.querySelector('#pr-save-settings-btn').onclick = () => { 
                 const newPs = []; 
                 panel.querySelectorAll('.pr-reply-item').forEach(item => { 
                     const title = item.querySelector('.pr-reply-title').value.trim();
                     const text = item.querySelector('.pr-reply-text').value.trim();
                     const isFavorite = item.querySelector('.pr-favorite-toggle').checked;
                     if(title && text) {
                         let reqData = requiredTagsMap[title] || []; 
                         newPs.push({ title, text, isFavorite, requiredData: reqData }); 
                     }
                 }); 
                 CONFIG.PROTOCOLOS = newPs; saveData(); UI.createNotification("Salvo!", "success"); panel.remove(); UI.createProtocoloPopup();
             }; 
             panel.querySelector('#pr-add-reply-btn').onclick = () => {
                const list = panel.querySelector('#pr-settings-replies-list');
                const item = document.createElement('div'); item.className = 'pr-reply-item';
                item.innerHTML = `
                    <div class="pr-reply-row-top">
                        <input type="checkbox" class="pr-favorite-toggle" title="Favorito">
                        <input type="text" value="NOVO - Título" class="pr-reply-title" placeholder="CATEGORIA - Título">
                        <button class="pr-remove-reply-btn" title="Remover">${ICONS.TRASH}</button>
                    </div>
                    <div class="pr-reply-row-bottom">
                        <textarea class="pr-reply-text" rows="2">Texto do protocolo...</textarea>
                    </div>
                `;
                list.prepend(item);
                item.querySelector('.pr-remove-reply-btn').onclick = (e) => { if (confirm('Remover protocolo?')) e.target.closest('.pr-reply-item').remove(); };
             };
             renderSettings();
        },

        createTriggerButton() {
             let btn = document.getElementById('pr-trigger-button'); if (btn) return; 
             btn = document.createElement('button'); btn.id = 'pr-trigger-button'; btn.innerHTML = '📋'; btn.title = 'Protocolos (Ctrl+Shift+U)'; document.body.appendChild(btn);
             let isDragging = false; const savedPos = localStorage.getItem('prTriggerButtonPos'); if (savedPos) { const p = JSON.parse(savedPos); btn.style.left = p.left; btn.style.top = p.top; } else { btn.style.right = '25px'; btn.style.bottom = '30px'; }
             btn.onmousedown = (e) => { if (e.button !== 0) return; isDragging = false; const startX = e.clientX, startY = e.clientY; const rect = btn.getBoundingClientRect(); const initL = rect.left, initT = rect.top; btn.style.cursor = 'grabbing'; const move = (me) => { if (Math.abs(me.clientX - startX) > 5 || Math.abs(me.clientY - startY) > 5) { isDragging = true; btn.style.left = (initL + me.clientX - startX) + 'px'; btn.style.top = (initT + me.clientY - startY) + 'px'; btn.style.right = 'auto'; btn.style.bottom = 'auto'; } }; const up = () => { btn.style.cursor = 'pointer'; if (isDragging) localStorage.setItem('prTriggerButtonPos', JSON.stringify({left: btn.style.left, top: btn.style.top})); document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); }; document.addEventListener('mousemove', move); document.addEventListener('mouseup', up); };
             btn.onclick = () => { if (!isDragging) UI.createProtocoloPopup(); };
        }
    };

    const injectCss = () => {
        const css = `
            :root { --bg-dark: #1a1c23; --bg-medium: #2a2d38; --bg-light: #3a3f50; --text-primary: #e0e0e0; --text-secondary: #a0a4b8; --accent-primary: #00f0ff; --accent-secondary: #00aaff; --border-color: #4a5068; --glow-color: rgba(0, 240, 255, 0.5); --danger-color: #ff4d6a; --highlight-bg: #ffe066; --highlight-text: #332700; }
            .pr-script-base-popup { position: fixed; background-color: var(--bg-medium); border-radius: 8px; box-shadow: 0 0 20px rgba(0,0,0,0.5); z-index: 10001; display: flex; flex-direction: column; border: 1px solid var(--border-color); min-width: 300px; min-height: 200px; resize: both; overflow: hidden; color: var(--text-primary); font-family: sans-serif; font-size: 14px; }
            .panel-header { cursor: move; background-color: var(--bg-dark); padding: 8px 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; } 
            .panel-header h4 { margin: 0; color: var(--accent-primary); }
            .panel-header-btn { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 4px; display: flex; align-items: center; transition: color .2s; }
            .panel-header-buttons { display: flex; align-items: center; gap: 8px; flex-direction: row; }
            .panel-header-btn:hover { color: var(--accent-primary); }

            .pr-popup-body { display: flex; flex-grow: 1; overflow: hidden; height: calc(100% - 35px); } 
            
            #pr-sidebar { width: 160px; flex-shrink: 0; background-color: var(--bg-dark); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; } 
            .pr-sidebar-title { padding: 10px 15px; font-weight: bold; color: var(--accent-primary); font-size: 0.85em; text-transform: uppercase; border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.2); }
            #pr-category-list { list-style: none; padding: 0; margin: 0; overflow-y: auto; flex-grow: 1; }
            .pr-category-item { padding: 10px 15px; cursor: pointer; font-size: 0.9em; color: var(--text-secondary); border-left: 3px solid transparent; transition: background-color 0.2s, color 0.2s; user-select: none; }
            .pr-category-item:hover { background-color: var(--bg-light); color: var(--text-primary); }
            .pr-category-item.active { background-color: var(--bg-medium); color: var(--accent-primary); font-weight: 600; border-left-color: var(--accent-primary); }

            #pr-main-content { flex-grow: 1; padding: 15px; overflow-y: auto; background-color: var(--bg-medium); display: flex; flex-direction: column; min-width: 300px; }
            #pr-editor-sidebar { width: 280px; flex-shrink: 0; background-color: var(--bg-dark); padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; font-size: 0.9em; border-left: 1px solid var(--border-color); }
            
            #pr-editor-sidebar h5 { margin: 0 0 10px 0; color: var(--accent-primary); text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; }
            .pr-editor-field { margin-bottom: 10px; } 
            .pr-editor-field label { display: block; margin-bottom: 4px; color: var(--accent-secondary); font-size: 0.88em; } 
            .pr-editor-field input, .pr-editor-field select, .pr-editor-field textarea { 
                width: 100%; padding: 8px; border: 1px solid #444 !important; 
                background-color: var(--bg-medium) !important; color: var(--text-primary) !important; 
                box-sizing: border-box; border-radius: 4px; 
            }
            
            /* PREVIEW BOX: Mais altura, melhor cor, resize */
            #pr-editor-preview {
                background-color: #151515 !important; 
                color: #e0e0e0 !important; 
                border: 1px solid var(--accent-secondary) !important; 
                min-height: 150px !important; /* Forçar altura maior */
                font-family: monospace; 
                margin-top: 5px; font-size: 12px; 
                resize: vertical;
            }

            #pr-trigger-button { position: fixed; width: 50px; height: 50px; border-radius: 50%; background: var(--bg-light); color: var(--accent-primary); border: 2px solid var(--border-color); font-size: 24px; cursor: pointer; z-index: 2147483647; display: flex; align-items: center; justify-content: center; box-shadow: 0 5px 15px rgba(0,0,0,0.5); }
            
            .pr-items-container .item { padding: 10px; margin-bottom: 8px; background: var(--bg-dark); border-radius: 4px; cursor: pointer; border-left: 4px solid transparent; transition: background 0.2s; } .pr-items-container .item:hover { border-left-color: var(--accent-primary); background: var(--bg-light); }
            
            .pr-script-settings-panel { width: 900px; max-width: 95vw; height: 80vh; }
            .pr-settings-reply-list { display: flex; flex-direction: column; gap: 10px; padding-right: 10px; }
            .pr-reply-item { display: flex; flex-direction: column; gap: 8px; padding: 12px; background: var(--bg-dark); border: 1px solid var(--border-color); border-radius: 6px; }
            .pr-reply-row-top { display: flex; gap: 10px; align-items: center; }
            .pr-reply-title { flex-grow: 1; background: var(--bg-medium); border: 1px solid #555; color: white; padding: 6px; border-radius: 4px; }
            .pr-reply-text { width: 100%; background: var(--bg-medium); border: 1px solid #555; color: #ccc; padding: 6px; border-radius: 4px; min-height: 60px; resize: vertical; }
            .pr-remove-reply-btn { background: transparent; border: none; cursor: pointer; color: var(--danger-color); }
            .pr-reply-controls { margin-bottom: 15px; display: flex; gap: 10px; }
            .pr-script-button { padding: 6px 12px; border-radius: 4px; border: none; cursor: pointer; background: var(--accent-secondary); color: #000; font-weight: bold; transition: background 0.2s; }
            .pr-script-button:hover { background: var(--accent-primary); }
            
            #pr-script-search { width: 100%; padding: 10px; background-color: var(--bg-dark) !important; color: var(--text-primary) !important; border: 1px solid var(--border-color); margin-bottom: 10px; }
            .pr-suggestion-btn { background: var(--bg-dark); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 4px 8px; font-size: 0.8em; border-radius: 4px; cursor: pointer; transition: all .2s; }
            .pr-suggestion-btn:hover { background: var(--bg-light); border-color: var(--accent-primary); color: var(--accent-primary); }
            .pr-quick-filters { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
            .pr-quick-filters label { display: flex; align-items: center; gap: 4px; font-size: 0.8em; color: var(--text-secondary); cursor: pointer; }
        `;
        const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
    };

    const initialize = async () => { 
        await loadData(); injectCss(); 
        setTimeout(() => { UI.createTriggerButton(); document.addEventListener('keydown', keyboardEventHandler); }, 2000); 
    };
    
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize); else initialize();
    }
})();