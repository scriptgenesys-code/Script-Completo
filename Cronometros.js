// ==UserScript==
// @name         Gerenciador de Contagem e Produtividade (v1.0.27_MOD_5_FIX)
// @namespace    http://tampermonkey.net/
// @version      1.0.27
// @description  Script focado em Analytics. [v1.0.27_MOD_5_FIX: Corrigido bug de reset diário com ISO Date.]
// @author       Parceiro de Programação
// @match        https://apps.mypurecloud.com/*
// @match        https://apps.mypurecloud.de/*
// @match        https://apps.mypurecloud.jp/*
// @match        https://apps.mypurecloud.ie/*
// @match        https://apps.mypurecloud.com.au/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- ATUALIZADO ---
    // v1.0.27: Pacote de Correção de Layout e UI
    // 4. [MOD] Aba "Atendimentos": Removida a coluna "Encerrado por" (MOD_1).
    // 5. [MOD] Mini-Dashboard: "Enc. Agente" substituído por "Balão (Término)".
    // 6. [NEW] Nova aba "Encerrados" para detalhes do log de encerramento.
    // 7. [FIX] Mini-Dashboard Expandido: Removida a opção de redimensionamento.
    // 8. [MOD] Aba "Encerrados": Layout alterado para tabela padronizada (MOD_4).
    // 9. [FIX] Função de reset diário (initializeDailyCounters) usa ISO Date (YYYY-MM-DD) para robustez.
    //
    const SCRIPT_VERSION = '1.0.27_MOD_5_FIX'; // Versão Atualizada
    // --- FIM DA ATUALIZAÇÃO ---

    // Flag de Carregamento
    if (window[`PURECLOUD_SCRIPT_LOADED_FLAG_${SCRIPT_VERSION}`]) {
        console.log(`[NOVO SCRIPT] Script V${SCRIPT_VERSION} já está carregado e em execução.`);
        return;
    }
    window[`PURECLOUD_SCRIPT_LOADED_FLAG_${SCRIPT_VERSION}`] = true;

    // --- CONFIGURAÇÕES BÁSICAS ---
    const DEBUG_MODE = true;
    const log = (...args) => {
        if (DEBUG_MODE) console.log("[PURECLOUD SCRIPT]", ...args);
    };

    const soundPlayer = {
        audioContext: null,
        init() {
            if (!this.audioContext && (window.AudioContext || window.webkitAudioContext)) {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    log("AudioContext inicializado.");
                } catch (e) {
                    log("Erro ao inicializar AudioContext:", e);
                }
            }
        },
        playBeep(type = 'inactive') {
            if (!this.audioContext || !CONFIG.SOUND_ALERTS_ENABLED) return;
            try {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                let frequency = 440, duration = 0.1;
                if (type === 'inactive_client') { frequency = 880; duration = 0.15; }
                else if (type === 'inactive_operator') { frequency = 660; duration = 0.1; }
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + duration);
            } catch (e) { log("Erro ao tocar beep:", e); }
        }
    };

    const LOCKDOWN_CONFIG = {
        REQUIRED_CLICKS: 5,
        END_CHAT_BUTTON_SELECTOR: ['button[aria-label="Mensagens de término"]'],
        // Selector do v4.0 para fins de compatibilidade na detecção
        BALAO_BUTTON_SELECTOR_V4: 'button[aria-label="Mensagens de término"]',
    };

    const initialQuickReplies = [
        { title: "I - Apresentação Padrão", text: "Olá! Sou o agente.", isFavorite: true, requiredData: [] },
    ];

    const defaultThemeColors = {
        bgPrimary: '#ffffff', bgSecondary: '#f0f0f0', textPrimary: '#222222', textSecondary: '#555555',
        borderColor: '#dddddd',
        accent: '#444444', accentText: '#ffffff',
        timerBg: '#222222',
        timerNormalText: '#ffffff',
        timerActiveText: '#28a745',
        timerPausedText: '#dc3545',
        timerInactiveClientText: '#fdd835',
        timerInactiveOperatorText: '#fdd835',
        timerCompletedBg: '#222222',
        timerCompletedText: '#ffffff',
        success: '#28a745',
        error: '#dc3545',
        warn: '#fdd835',
        info: '#87cefa',
        miniDashboardProgress: '#61dafb'
    };

    let CONFIG = {
        CHECKMARK_THRESHOLD_MS: 70 * 1000,
        TIMER_UPDATE_INTERVAL_MS: 500,
        MAIN_LOOP_THROTTLE_MS: 1000,
        INACTIVITY_CLIENT_ALERT_SECONDS: parseInt(localStorage.getItem('inactivityClientAlertSeconds') || '70', 10),
        INACTIVITY_OPERATOR_ALERT_SECONDS: parseInt(localStorage.getItem('inactivityOperatorAlertSeconds') || '30', 10),
        LONG_CONVO_ALERT_MIN: parseInt(localStorage.getItem('longConvoAlertMin') || '15', 10),
        CONVERSATION_TARGET: parseInt(localStorage.getItem('conversationTarget') || '45', 10),
        DARK_MODE: localStorage.getItem('darkMode') === 'true',
        SOUND_ALERTS_ENABLED: localStorage.getItem('soundAlertsEnabled') === 'true',
        QUICK_REPLIES: JSON.parse(localStorage.getItem('quickReplies')) || initialQuickReplies,
        HOTKEYS: JSON.parse(localStorage.getItem('hotkeys')) || {
            copyInteraction: "Control+Shift+I",
            openSettings: "Control+Shift+S",
            toggleMiniDashboard: "Control+Shift+J",
            toggleLock: "Control+Shift+L",
        },
        THEME_COLORS: JSON.parse(localStorage.getItem('themeColors_v2')) || JSON.parse(localStorage.getItem('timerColors')) || defaultThemeColors,
        LAST_SCRIPT_VERSION: localStorage.getItem('lastScriptVersion') || '0',
        POPUP_POSITIONS: JSON.parse(sessionStorage.getItem('popupPositions') || '{}'),
        MINI_DASHBOARD_VISIBLE: sessionStorage.getItem('miniDashboardVisible') !== 'false',
        MINI_DASHBOARD_MAXIMIZED: sessionStorage.getItem('miniDashboardMaximized') === 'true',
        RECENT_REPLIES: JSON.parse(localStorage.getItem('recentReplies_v3')) || [],
        MESSAGES: {
            COPIED_SUCCESS: "Copiado com sucesso!", COPY_ERROR: "Erro ao copiar.",
            NOT_FOUND_INTERACTION_DATA: "Dados da interação não identificados ou inaccessíveis.",
            IFRAME_ACCESS_DENIED: "Acesso bloqueado a conteúdo de iframe por segurança (Cross-Origin). A extração pode estar incompleta.",
            SELECTOR_NOT_FOUND: (selector) => `Elemento PureCloud não encontrado para o seletor: ${Array.isArray(selector) ? selector.join(' ou ') : selector}.`,
            HOTKEY_TRIGGERED: (actionName, combo) => `Atalho '${combo}' para ${actionName} acionado.`, ACTION_NOT_FOUND: (action) => `Ação '${action}' não encontrada.`,
            HOTKEY_CONFLICT: (combo, action1, action2) => `Conflito de atalho! '${combo}' já está atribuído a '${action1}'. Não pode ser usado para '${action2}'.`,
            INTERACTION_COPIED: "Interação (Nome, Telefone e Link) copiada!",
        },
        PURECLOUD_SELECTORS: {
            TOOLBAR: ['div.interaction-controls-primary', 'div[data-qa-id="interaction-controls-primary"]', '.actions-container', 'div[role="toolbar"]'],
            PARTICIPANT_NAME_BADGE: ['h3.participant-name', 'div.interaction-name-wrapper div.participant-name > span','p.participant-name','span[data-qa-id="participant-name"]','h2.participant-name'],
            NATIVE_COPY_BUTTON: ['button[aria-label="Copiar link da interação"]', '.copy-interaction-url-btn', 'button[data-qa-id="copy-interaction-link"]', '.copy-action-button'],
            INTERACTION_ID_EL: 'span[data-qa-id="interaction-id"], [data-qa-id="detail-value-interactionId"]',
            CONVERSATION_ROOT: '.interaction-content',
            CONVERSATION_CONTENT_WRAPPER: ['.interaction-content-wrapper', '.interaction-content'],
            SCRIPT_IFRAME: '.interaction-script-container.no-headers.non-call iframe',
            MESSAGING_GADGET_IFRAME: 'iframe[src*="messaging-gadget.html"]',
            INTERACTION_GROUP: ['div.interaction-group', 'div[data-qa-id="interaction-group-list-item"]'],
            SELECTED_INTERACTION_GROUP: ['div.interaction-group.is-selected', 'div[data-qa-id="interaction-group-list-item"].is-selected'],
            TRANSFER_BUTTON_SELECTOR: ['button[aria-label*="Transferir"]', 'button[data-qa-id="interaction-control-transfer"]'],
            EVALUATION_BUTTON_SELECTOR: [
                'button[aria-label*="Enviar avaliação"]',
                'button[aria-label*="Enviar pesquisa"]',
                'button[data-qa-id="interaction-control-disconnect"]',
                'button.btn-main.container-inner'
            ],
            CONVERSATION_LIST_CONTAINER: ['div.infrg-1_medium.purecloud-grid-layout-grid-cell.interaction-list-column', 'div.interaction-list', 'div[data-qa-id*="interaction-list-column"]'],
            NATIVE_TIMER_SELECTORS: [
                '.message-timestamp', '.duration', '.chat-message-group > div:last-child > span',
                '.chat-message-group > div:last-child > div', 'span[class*="timestamp"]',
                'div[class*="time"]', 'span[class*="datetime"]', 'span[class*="date-time"]'
            ],
            ICON_SELECTOR_CALL: 'gux-icon[icon-name="phone"]',
            ICON_SELECTOR_CHAT: 'gux-icon[icon-name="comments"]'
        },
        LAST_ENDED_INTERACTIONS: new Map(),
        LAST_COPIED_REPLY: localStorage.getItem('lastCopiedReply') || ''
    };

    const featureDescriptions = {
        copyInteraction: { title: "Copiar Interação", description: "Copia o nome do cliente, telefone e o link direto para a interação no PureCloud (formato: Nome | Telefone \n Link).", hotkey: CONFIG.HOTKEYS.copyInteraction },
        openSettings: { title: "Configurações", description: "Abre o painel de configurações (Metas, Alertas, Analytics e Detalhes).", hotkey: CONFIG.HOTKEYS.openSettings },
        toggleMiniDashboard: { title: "Alternar Mini-Dashboard", description: "Oculta ou mostra o dashboard de produtividade.", hotkey: CONFIG.HOTKEYS.toggleMiniDashboard },
        toggleLock: { title: "Trava de Encerramento", description: "Adiciona um escudo para evitar o encerramento acidental da conversa.", hotkey: CONFIG.HOTKEYS.toggleLock },
        conversationCounter: { title: "Contador de Conversas (Atendidas)", description: "Exibe o número de conversas completas (duração > 1min 10s) hoje em relação à sua sua meta diária.", hotkey: "N/A" },
        conversationTimers: { title: "Timers de Conversa", description: "Adiciona um timer individual a cada conversa na lista lateral. Alerta sobre inatividade do cliente/operador." },
        achievements: { title: "Sistema de Conquistas", description: "Gere conquistas baseadas no seu desempenho diário.", hotkey: "N/A" },
        operatorInactivityAlert: { title: "Alerta de Inatividade do Operador", description: "Monitora sua inatividade no campo de chat ativo (cor roxa no timer)." },
        exportAnalytics: { title: "Exportar Dados de Atendimentos", description: "Permite exportar o histórico detalhado de atendimentos (TMA, TME, cliente, hora) para um arquivo JSON." },
    };

    // --- LÓGICA DE COLETA DE ENCERRAMENTO (INTEGRAÇÃO V4.0) ---
    let v4_counters = { balao: [] };
    const V4_STORAGE_KEY = 'encerramentoCounters_v4_balao';

    function loadV4Counters() {
        const today = getBrazilTime(new Date()).toLocaleDateString('pt-BR');
        const storedData = JSON.parse(localStorage.getItem(V4_STORAGE_KEY) || '{}');

        if (storedData.date === today) {
            v4_counters.balao = storedData.balao || [];
            log("V4 Counter: Históricos carregados.", v4_counters);
        } else {
            log("V4 Counter: Novo dia detectado. Resetando contadores.");
            v4_counters = { balao: [] };
        }
    }

    function saveV4Counters() {
        const today = getBrazilTime(new Date()).toLocaleDateString('pt-BR');
        const dataToSave = { date: today, balao: v4_counters.balao };
        try {
            localStorage.setItem(V4_STORAGE_KEY, JSON.stringify(dataToSave));
            log("V4 Counter: Históricos salvos.");
        } catch(e) {
            log("V4 Counter: Erro ao salvar dados no localStorage:", e);
        }
    }

    // Funções utilitárias
    const validateConfigValue = (key, value) => {
        const parsed = parseInt(value, 10);
        switch (key) {
            case 'CONVERSATION_TARGET': return !isNaN(parsed) && parsed >= 1 ? parsed : 45;
            case 'INACTIVITY_CLIENT_ALERT_SECONDS': return !isNaN(parsed) && parsed >= 30 ? parsed : 70;
            case 'INACTIVITY_OPERATOR_ALERT_SECONDS': return !isNaN(parsed) && parsed >= 10 ? parsed : 30;
            case 'LONG_CONVO_ALERT_MIN': return !isNaN(parsed) && parsed >= 5 ? parsed : 15;
            case 'DARK_MODE': return value === true || value === 'true';
            case 'SOUND_ALERTS_ENABLED': return value === true || value === 'true';
            case 'THEME_COLORS':
                if (typeof value !== 'object' || value === null) { return defaultThemeColors; }
                const validatedColors = { ...defaultThemeColors };
                for (const colorKey in defaultThemeColors) {
                    if (value.hasOwnProperty(colorKey)) {
                        if (typeof value[colorKey] === 'string' && value[colorKey].match(/^#[0-9a-f]{6}$/i)) {
                            validatedColors[colorKey] = value[colorKey];
                        } else { log(`WARN: Cor inválida para ${colorKey} (${value[colorKey]}). Usando padrão.`); }
                    }
                } return validatedColors;
            case 'HOTKEYS':
                if (typeof value === 'object' && value !== null) {
                    return {
                        copyInteraction: value.copyInteraction || "Control+Shift+I",
                        openSettings: value.openSettings || "Control+Shift+S",
                        toggleMiniDashboard: value.toggleMiniDashboard || "Control+Shift+J",
                        toggleLock: value.toggleLock || "Control+Shift+L",
                    };
                } return CONFIG.HOTKEYS;
            default: return value;
        }
    };
    const saveData = () => {
        try {
            const dataToSave = analyticsManager.getData();
            localStorage.setItem('conversationTarget', validateConfigValue('CONVERSATION_TARGET', CONFIG.CONVERSATION_TARGET));
            localStorage.setItem('darkMode', validateConfigValue('DARK_MODE', CONFIG.DARK_MODE));
            localStorage.setItem('soundAlertsEnabled', validateConfigValue('SOUND_ALERTS_ENABLED', CONFIG.SOUND_ALERTS_ENABLED));
            localStorage.setItem('inactivityClientAlertSeconds', validateConfigValue('INACTIVITY_CLIENT_ALERT_SECONDS', CONFIG.INACTIVITY_CLIENT_ALERT_SECONDS));
            localStorage.setItem('inactivityOperatorAlertSeconds', validateConfigValue('INACTIVITY_OPERATOR_ALERT_SECONDS', CONFIG.INACTIVITY_OPERATOR_ALERT_SECONDS));
            localStorage.setItem('longConvoAlertMin', validateConfigValue('LONG_CONVO_ALERT_MIN', CONFIG.LONG_CONVO_ALERT_MIN));
            localStorage.setItem('hotkeys', JSON.stringify(validateConfigValue('HOTKEYS', CONFIG.HOTKEYS)));
            localStorage.setItem('achievements_v2', JSON.stringify(analyticsManager.getAchievements()));
            localStorage.setItem('themeColors_v2', JSON.stringify(validateConfigValue('THEME_COLORS', CONFIG.THEME_COLORS)));
            localStorage.setItem('lastScriptVersion', SCRIPT_VERSION);
            localStorage.setItem('dailyAnalytics_v2_data', JSON.stringify(dataToSave));
            sessionStorage.setItem('popupPositions', JSON.stringify(CONFIG.POPUP_POSITIONS));
            sessionStorage.setItem('miniDashboardVisible', CONFIG.MINI_DASHBOARD_VISIBLE);
            sessionStorage.setItem('miniDashboardMaximized', CONFIG.MINI_DASHBOARD_MAXIMIZED);
            saveV4Counters(); // Salva o novo contador V4 junto
            log("Configurações salvas.");
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                log("Erro: localStorage cheio ao tentar salvar dados de CONFIG. Limpe o histórico do console/dados de site.", e);
                UI.createNotification("Erro: Espaço de armazenamento cheio. Não foi possível salvar configurações. Limpe os dados do navegador.", 'error', 10000);
            } else { log("Erro ao salvar dados de CONFIG:", e); }
        }
    };

    const findEl = (selectors, parent = document) => {
        if (!Array.isArray(selectors)) selectors = [selectors];
        for (const selector of selectors) { let el = parent.querySelector(selector); if (el) return el; } return null;
    };
    const throttle = (func, limit) => {
        let inThrottle; return function(...args) { if (!inThrottle) { func.apply(this, args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } };
    };
    const formatTime = num => String(num).padStart(2, '0');
    const getBrazilTime = (date) => {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'America/Fortaleza' };
        try {
            const formatter = new Intl.DateTimeFormat('en-US', options); const parts = formatter.formatToParts(date);
            const year = parseInt(parts.find(p => p.type === 'year').value); const month = parseInt(parts.find(p => p.type === 'month').value) - 1; const day = parseInt(parts.find(p => p.type === 'day').value);
            const hour = parseInt(parts.find(p => p.type === 'hour').value); const minute = parseInt(parts.find(p => p.type === 'minute').value); const second = parseInt(parts.find(p => p.type === 'second').value);
            const brazilDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
            return new Date(brazilDateString + '-03:00');
        } catch (e) { return date; }
    };

    const makeDraggable = (popup, header, popupName) => {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const enforceBounds = (top, left) => {
            const vpHeight = window.innerHeight; const vpWidth = window.innerWidth; const popHeight = popup.offsetHeight; const popWidth = popup.offsetWidth;
            let safeTop = Math.max(0, Math.min(vpHeight - popHeight, top)); let safeLeft = Math.max(0, Math.min(vpWidth - popWidth, left));
            if (popWidth > vpWidth) safeLeft = 0; if (popHeight > vpHeight) safeTop = 0; return { top: safeTop, left: safeLeft };
        };
        if (sessionStorage.getItem('popupPositions')) { CONFIG.POPUP_POSITIONS = JSON.parse(sessionStorage.getItem('popupPositions')); }
        if (CONFIG.POPUP_POSITIONS[popupName]) {
            let curTop = parseFloat(CONFIG.POPUP_POSITIONS[popupName].top); let curLeft = parseFloat(CONFIG.POPUP_POSITIONS[popupName].left); const safePos = enforceBounds(curTop, curLeft);
            popup.style.top = safePos.top + 'px'; popup.style.left = safePos.left + 'px'; popup.style.transform = 'none'; popup.style.margin = '0';
        } else {
             popup.style.bottom = '10px'; popup.style.left = '10px'; popup.style.top = 'auto'; popup.style.right = 'auto'; popup.style.transform = 'none'; popup.style.margin = '0';
        }
        const saveCurrentPositionAndSize = () => {
            let curTop = popup.style.top; let curLeft = popup.style.left;
            if (popup.style.bottom && popup.style.bottom !== 'auto' && popupName === 'miniDashboard') { const rect = popup.getBoundingClientRect(); curTop = rect.top + 'px'; curLeft = rect.left + 'px'; }
            if (popup.style.transform && popup.style.transform !== 'none') { const rect = popup.getBoundingClientRect(); curTop = rect.top + 'px'; curLeft = rect.left + 'px'; popup.style.transform = 'none'; }
            const safePos = enforceBounds(parseFloat(curTop), parseFloat(curLeft));
            CONFIG.POPUP_POSITIONS[popupName] = {
                top: safePos.top + 'px',
                left: safePos.left + 'px',
                width: CONFIG.MINI_DASHBOARD_MAXIMIZED ? '300px' : (CONFIG.POPUP_POSITIONS[popupName]?.width || '300px'), // Tamanho fixo
                height: CONFIG.MINI_DASHBOARD_MAXIMIZED ? 'auto' : (CONFIG.POPUP_POSITIONS[popupName]?.height || 'auto') // Tamanho fixo
            };
            sessionStorage.setItem('popupPositions', JSON.stringify(CONFIG.POPUP_POSITIONS)); saveData();
        };
        const dragElement = header.classList.contains('mini-dashboard-header') ? header : popup.querySelector('.panel-header');
        if (dragElement) {
            dragElement.onmousedown = e => {
                popup.dataset.isDragging = 'false';
                if (e.target.closest('.compact-btn, #mini-dashboard-adjust-attended-btn, input, textarea, button, select')) return;
                e.preventDefault(); const rect = popup.getBoundingClientRect(); popup.style.top = rect.top + 'px'; popup.style.left = rect.left + 'px'; popup.style.bottom = 'auto'; popup.style.right = 'auto'; popup.style.transform = 'none';
                pos3 = e.clientX; pos4 = e.clientY; document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; saveCurrentPositionAndSize(); };
                document.onmousemove = ev => {
                    popup.dataset.isDragging = 'true';
                    ev.preventDefault(); pos1 = pos3 - ev.clientX; pos2 = pos4 - ev.clientY; pos3 = ev.clientX; pos4 = ev.clientY;
                    const newTop = popup.offsetTop - pos2; const newLeft = popup.offsetLeft - pos1; const safePos = enforceBounds(newTop, newLeft);
                    popup.style.top = safePos.top + "px"; popup.style.left = safePos.left + "px";
                };
            };
        }
        // REMOVIDO: ResizeObserver para fixar o tamanho no modo expandido/maximizado.
    };

    const analyticsManager = {
        getData() {
            const today = getBrazilTime(new Date()).toLocaleDateString('pt-BR');
            const storedData = JSON.parse(localStorage.getItem('dailyAnalytics_v2_data') || '{}');
            if (storedData.date !== today) { return { date: today, conversations: [], docCopies: 0, hotkeysUsed: [], baloonClicks: 0, transferClicks: 0, evaluatedClicks: 0, diagnosticRepliesUsed: 0 }; }
            storedData.conversations = (storedData.conversations || []).map(conv => ({ 
                ...conv, 
                activeDuration: conv.activeDuration || 0, 
                isRecurrence: conv.isRecurrence || false, 
                participantName: conv.participantName || 'N/A', 
                phoneNumber: conv.phoneNumber || 'N/A', 
                endedByAgent: conv.endedByAgent || 'HIBERNADO', 
                interactionUrl: conv.interactionUrl || 'N/A', 
                timestamp: typeof conv.timestamp === 'string' ? (new Date(conv.timestamp).getTime() || Date.now()) : conv.timestamp,
                interactionType: conv.interactionType || 'unknown' 
            }));
            return storedData;
        },
        saveData(data) { try { localStorage.setItem('dailyAnalytics_v2_data', JSON.stringify(data)); } catch (e) { log("Erro ao salvar dados de analytics no localStorage:", e); } },
        getAchievements() { return JSON.parse(localStorage.getItem('achievements_v2') || '{}'); },
        logConversation(duration, activeDuration, participantName, phoneNumber, interactionUrl, classification, interactionType) {
            const data = this.getData();
            const isRecurrence = phoneNumber !== 'N/A' && data.conversations.some(conv => 
                conv.phoneNumber === phoneNumber && 
                conv.duration >= CONFIG.CHECKMARK_THRESHOLD_MS
            );
            data.conversations.push({ 
                timestamp: Date.now(), 
                duration: duration, 
                activeDuration: activeDuration, 
                participantName: participantName, 
                phoneNumber: phoneNumber, 
                isRecurrence: isRecurrence, 
                endedByAgent: classification, 
                interactionUrl: interactionUrl,
                interactionType: interactionType 
            });
            this.saveData(data); this._updateDashboard();
        },
        logBaloonClick() { 
            const data = this.getData(); 
            data.baloonClicks = (data.baloonClicks || 0) + 1; 
            this.saveData(data); 
            this._updateDashboard(); 
        },
        logTransferClick() { const data = this.getData(); data.transferClicks = (data.transferClicks || 0) + 1; this.saveData(data); this._updateDashboard(); },
        logEvaluatedClick() { const data = this.getData(); data.evaluatedClicks = (data.evaluatedClicks || 0) + 1; this.saveData(data); this._updateDashboard(); },
        _updateDashboard() { if (document.getElementById('purecloud-script-mini-dashboard')) { document.getElementById('purecloud-script-mini-dashboard')._updateStatsInternal(); } },
        calculateStats() {
            const data = this.getData(); 
            const conversations = data.conversations; 
            let completedConvos = conversations.filter(c => c.duration >= CONFIG.CHECKMARK_THRESHOLD_MS);
            const consolidatedConvos = completedConvos.filter(conv => !conv.isRecurrence); 
            const uniqueCount = consolidatedConvos.length;
            
            const recurrenceCount = completedConvos.filter(conv => conv.isRecurrence).length;
            const baloonClicksCount = v4_counters.balao.length; // Usa o novo contador V4

            if (completedConvos.length === 0) { 
                return { 
                    count: 0, tma: '00:00', tme: '00:00', perHour: {}, first: 'N/A', last: 'N/A', 
                    docCopies: data.docCopies, hotkeysUsed: (data.hotkeysUsed || []).length, 
                    baloonClicks: baloonClicksCount, // Usa o novo contador
                    transferClicks: data.transferClicks, evaluatedClicks: data.evaluatedClicks, 
                    allConversations: conversations, 
                    endedByAgentCount: 0, recurrenceCount: 0,
                    tmaSeconds: 0, // CORREÇÃO: Retorna 0 se não houver conversas
                    tmeSeconds: 0  // CORREÇÃO: Retorna 0 se não houver conversas
                }; 
            }
            
            const divisor = completedConvos.length > 0 ? completedConvos.length : 1; const totalDuration = completedConvos.reduce((sum, conv) => sum + conv.duration, 0);
            const tmaSeconds = Math.floor((totalDuration / divisor) / 1000); const totalActiveDuration = completedConvos.reduce((sum, conv) => sum + (conv.activeDuration || 0), 0);
            const tmeSeconds = Math.floor((totalActiveDuration / divisor) / 1000); const tma = `${formatTime(Math.floor(tmaSeconds / 60))}:${formatTime(tmaSeconds % 60)}`; const tme = `${formatTime(Math.floor(tmeSeconds / 60))}:${formatTime(tmeSeconds % 60)}`;
            const perHour = {}; for (let hour = 0; hour < 24; hour++) { perHour[hour] = 0; }
            completedConvos.forEach(conv => { const convDate = getBrazilTime(new Date(conv.timestamp)); const hour = convDate.getHours(); perHour[hour] = (perHour[hour] || 0) + 1; });
            const sortedByTimestamp = [...completedConvos].sort((a, b) => b.timestamp - a.timestamp);
            const first = sortedByTimestamp.length > 0 ? getBrazilTime(new Date(sortedByTimestamp[0].timestamp)).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : 'N/A';
            const last = sortedByTimestamp.length > 0 ? getBrazilTime(new Date(sortedByTimestamp[sortedByTimestamp.length - 1].timestamp)).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : 'N/A';
            
            return { 
                count: uniqueCount, tma, tme, perHour, first, last, 
                docCopies: data.docCopies, hotkeysUsed: (data.hotkeysUsed || []).length, 
                baloonClicks: baloonClicksCount, // Usa o novo contador
                transferClicks: data.transferClicks, evaluatedClicks: data.evaluatedClicks, 
                endedByAgentCount: 0, recurrenceCount: recurrenceCount, 
                allConversations: conversations,
                // *** CORREÇÃO APLICADA (Estava faltando) ***
                tmaSeconds: tmaSeconds, 
                tmeSeconds: tmeSeconds
            };
        },
        clearAllData() { 
            localStorage.removeItem('dailyAnalytics_v2_data'); 
            localStorage.removeItem('achievements_v2'); 
            // Limpa também o contador v4
            v4_counters = { balao: [] };
            saveV4Counters();

            UI.createMiniDashboard(); 
        }
    };
    window.analyticsManager = analyticsManager;
    
    // --- NOVA LINHA ADICIONADA ---
    // Torna o contador v4 (Balão) acessível globalmente para depuração
    window.v4_counters = v4_counters;
    // --- FIM DA NOVA LINHA ---
const documentExtractor = {
        getNameAndNumber: (convEl = document) => {
            if (convEl === document) { convEl = findEl(CONFIG.PURECLOUD_SELECTORS.SELECTED_INTERACTION_GROUP) || document; }
            const nameEl = findEl(CONFIG.PURECLOUD_SELECTORS.PARTICIPANT_NAME_BADGE, convEl); const rawText = nameEl?.textContent.trim() || 'N/A';
            const match = rawText.match(/^(.*?)\s*\|\s*(\(\d{2}\)\s*\d{4,5}[-.\s]*\d{4,5}|\d{8,14})$/); let participantName = rawText; let phoneNumber = 'N/A';
            if (match) { participantName = match[1].trim(); phoneNumber = match[2].replace(/\D/g, ''); } else { const numberMatch = rawText.match(/(\(\d{2}\)\s*\d{4,5}[-.\s]*\d{4,5}|\d{8,14})/); if (numberMatch) { phoneNumber = numberMatch[0].replace(/\D/g, ''); participantName = rawText.replace(numberMatch[0], '').replace(/\|/g, '').trim() || 'N/A'; } }
            if (participantName.endsWith('|')) { participantName = participantName.slice(0, -1).trim(); } let formattedPhoneNumber = 'N/A';
            if (phoneNumber.length === 11) { formattedPhoneNumber = `(${phoneNumber.substring(0, 2)}) ${phoneNumber.substring(2, 7)}-${phoneNumber.substring(7)}`; } else if (phoneNumber.length === 10) { formattedPhoneNumber = `(${phoneNumber.substring(0, 2)}) ${phoneNumber.substring(2, 6)}-${phoneNumber.substring(6)}`; } else if (phoneNumber !== 'N/A') { formattedPhoneNumber = phoneNumber; }
            return { participantName, phoneNumber: phoneNumber || 'N/A', formattedPhoneNumber: formattedPhoneNumber };
        },
        getInteractionId: (parentEl = document) => { const el = findEl(CONFIG.PURECLOUD_SELECTORS.INTERACTION_ID_EL, parentEl); return el?.textContent.trim().replace(/#/g, ''); },
    };
    async function copyTextToClipboard(text) { try { await navigator.clipboard.writeText(text); return true; } catch (err) { log('❌ FALHA AO COPIAR para a área de transferência (API Clipboard).', err); return false; } }
    async function getNativeInteractionUrl() { 
        const btn = findEl(CONFIG.PURECLOUD_SELECTORS.NATIVE_COPY_BUTTON); 
        if (!btn) return null; 
        
        // Tentativa de obter o clipboard original para restaurar depois
        let originalClipboard = '';
        try {
            originalClipboard = await navigator.clipboard.readText();
        } catch (e) {
            log("WARN: Não foi possível ler o clipboard original (permissão?).");
        }
        
        btn.click(); 
        
        return new Promise(resolve => { 
            setTimeout(async () => { 
                let url = null;
                try { 
                    url = await navigator.clipboard.readText(); 
                    if (!url || !(url.includes('interactions/') || url.includes('conversations/'))) { 
                        url = null;
                    }
                } catch (e) { 
                    log("Erro ao ler clipboard para obter link da interação.", e); 
                    url = null;
                } 

                // Tenta restaurar o clipboard original
                if (originalClipboard && url) { 
                     try {
                        await navigator.clipboard.writeText(originalClipboard); 
                     } catch(e) {
                        log("WARN: Não foi possível restaurar o clipboard.", e);
                     }
                }

                resolve(url); 
            }, 200); // Aumentado ligeiramente para dar tempo da cópia nativa
        }); 
    }

    const actions = {
        copyInteraction: async () => {
            const selectedConvEl = findEl(CONFIG.PURECLOUD_SELECTORS.SELECTED_INTERACTION_GROUP);
            const { participantName, phoneNumber, formattedPhoneNumber } = documentExtractor.getNameAndNumber(selectedConvEl);
            if (participantName === 'N/A' || !findEl(CONFIG.PURECLOUD_SELECTORS.NATIVE_COPY_BUTTON)) {
                UI.createNotification(CONFIG.MESSAGES.NOT_FOUND_INTERACTION_DATA + ". O nome do cliente pode estar ausente ou inacessível.", 'error');
                return;
            }
            const url = await getNativeInteractionUrl();
            if (url && (url.includes('interactions/') || url.includes('conversations/'))) {
                const tData = conversationTimers.get(selectedConvEl);
                if (tData) {
                    tData.interactionUrl = url;
                    tData.participantName = participantName;
                    tData.phoneNumber = phoneNumber;
                    log(`[Melhoria] Link e dados do cliente salvos no timer para ${participantName}.`);
                    UI.createNotification("Link salvo na aba 'Atendimentos'!", 'info', 1500);
                } else {
                    log(`[Melhoria] WARN: tData (timer) não foi encontrado. O link pode não ser salvo nos analytics.`);
                }
                const nameAndPhone = formattedPhoneNumber !== 'N/A' ? `${participantName} | ${formattedPhoneNumber}` : (participantName !== 'N/A' ? participantName : 'Nome Indisponível');
                const finalCopyText = `${nameAndPhone}\n${url}`;
                if (await copyTextToClipboard(finalCopyText)) {
                    UI.createNotification(CONFIG.MESSAGES.INTERACTION_COPIED, 'success');
                } else {
                    UI.createNotification(CONFIG.MESSAGES.COPY_ERROR, 'error');
                }
            } else {
                UI.createNotification("Link da interação nativa não encontrado. Nome copiado separadamente.", 'warn');
                if (participantName !== 'N/A' && await copyTextToClipboard(participantName)) {
                    UI.createNotification(`Nome do cliente (${participantName}) copiado como fallback.`, 'info');
                }
            }
        },
        openSettings: () => UI.createSettingsPanel(),
        toggleMiniDashboard: () => { const dashboard = document.getElementById('purecloud-script-mini-dashboard'); if (dashboard) { clearInterval(dashboard._updateInterval); dashboard.remove(); CONFIG.MINI_DASHBOARD_VISIBLE = false; saveData(); } else { CONFIG.MINI_DASHBOARD_VISIBLE = true; saveData(); UI.createMiniDashboard(); } },
        toggleLock: () => { const selectedConvEl = findEl(CONFIG.PURECLOUD_SELECTORS.SELECTED_INTERACTION_GROUP); if (!selectedConvEl) { UI.createNotification("Por favor, selecione uma conversa para destravar.", "warn"); return; } conversationLockManager.toggleLock(selectedConvEl); },
        copyDoc: () => { UI.createNotification("Função Copiar Documento removida do modo minimalista.", 'info', 1000); },
        pasteReplies: () => { UI.createNotification("Função Colar Respostas Rápidas removida do modo minimalista.", 'info', 1000); },
        openReplies: () => { UI.createNotification("Função Respostas Rápidas removida do modo minimalista.", 'info', 1000); },
    };
// --- LÓGICA DO CLIQUE DO BALÃO (V4.0) ---
    async function handleBalaoClick(e) {
        log("Botão 'Balão' clicado! Coletando dados (V4.0)...");
        // Verifica se o botão está desabilitado pelo lockdown
        const endChatButton = findEl(LOCKDOWN_CONFIG.END_CHAT_BUTTON_SELECTOR);
        if (endChatButton && endChatButton.disabled) {
            log("Clique ignorado: Botão Balão está bloqueado pelo Lockdown.");
            return;
        }

        const { participantName, phoneNumber } = documentExtractor.getNameAndNumber(document.body);
        
        let interactionUrl = 'N/A';
        try {
            const urlFromButton = await getNativeInteractionUrl();
            if (urlFromButton) {
                interactionUrl = urlFromButton;
            } else {
                 const id = documentExtractor.getInteractionId(document.body);
                 if (id && id !== 'N/A') {
                     interactionUrl = `${window.location.origin}/directory/conversations/${id}`;
                 } else {
                     interactionUrl = window.location.href.includes('/conversations/') ? window.location.href : 'N/A';
                 }
            }
        } catch (error) {
            log("Erro ao tentar obter link na função handleBalaoClick:", error);
        }
        
        v4_counters.balao.push({ 
            timestamp: Date.now(), 
            participantName: participantName, 
            phoneNumber: phoneNumber, 
            interactionUrl: interactionUrl 
        });
        
        saveV4Counters();
        analyticsManager._updateDashboard();
        // Não mostra notificação de sucesso aqui, pois o clique pode ser cancelado
        // A lógica de notificação é melhor na função 'actions.copyInteraction' (Ctrl+Shift+I)
    }
    
    const conversationLockManager = {
        states: new Map(),
        toggleLock: (selectedConvEl) => {
            const convState = conversationLockManager.states.get(selectedConvEl);
            if (!convState || !convState.isLocked) { log("LockManager: Ação ignorada (estado não encontrado ou já destravado)."); return; }
            const lockButton = document.getElementById('purecloud-script-btn-toggleLock');
            if (lockButton) { lockButton.classList.add('btn-feedback-click'); setTimeout(() => lockButton.classList.remove('btn-feedback-click'), 200); }
            convState.unlockClicks++;
            const clicksRemaining = LOCKDOWN_CONFIG.REQUIRED_CLICKS - convState.unlockClicks;
            if (clicksRemaining > 0) {
                UI.createNotification(`Clique mais ${clicksRemaining} vez(es) para destravar.`, "info", 1500);
                setTimeout(() => { conversationLockManager.updateLockButton(selectedConvEl); }, 0);
            } else {
                convState.isLocked = false;
                UI.createNotification("Conversa destravada! O botão 'Mensagens de Término' foi liberado.", "success");
                setTimeout(() => { conversationLockManager.updateLockButton(selectedConvEl); }, 0);
            }
        },
        updateLockButton: (conv) => {
            const currentConvState = conversationLockManager.states.get(conv);
            const endChatButton = findEl(LOCKDOWN_CONFIG.END_CHAT_BUTTON_SELECTOR);
            const lockButton = document.getElementById('purecloud-script-btn-toggleLock');
            if (currentConvState && lockButton) {
                const ICON_SHIELD_LOCKED = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>';
                const ICON_SHIELD_UNLOCKED = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path>';
                lockButton.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${currentConvState.isLocked ? ICON_SHIELD_LOCKED : ICON_SHIELD_UNLOCKED}</svg>`;
                lockButton.disabled = !currentConvState.isLocked;
                lockButton.classList.toggle('lockdown-unlocked', !currentConvState.isLocked);
                lockButton.title = currentConvState.isLocked ? `Destravar Encerrar (Faltam ${LOCKDOWN_CONFIG.REQUIRED_CLICKS - currentConvState.unlockClicks} cliques)` : "Conversa Destravada. O botão de encerrar está liberado.";
                if (endChatButton) { endChatButton.disabled = currentConvState.isLocked; endChatButton.classList.toggle('lockdown-disabled', currentConvState.isLocked); endChatButton.title = currentConvState.isLocked ? 'Botão bloqueado. Clique no escudo para liberar.' : 'Mensagens de término'; }
            }

            const getScriptIframeDoc = () => {
                const conversationRoot = findEl(CONFIG.PURECLOUD_SELECTORS.CONVERSATION_ROOT);
                if (!conversationRoot) return null;
                const scriptIframe = findEl(CONFIG.PURECLOUD_SELECTORS.SCRIPT_IFRAME, conversationRoot);
                if (scriptIframe && scriptIframe.contentDocument) {
                    return scriptIframe.contentDocument;
                }
                return null;
            };

            const scriptDoc = getScriptIframeDoc();
            
            // Adiciona listener para o botão de transferência e avaliação (Ainda rastreado pelo analyticsManager)
            const addAnalyticsListener = (btn, type) => {
                if (btn.dataset.gmListenerAdded) return;
                
                btn.addEventListener('click', (e) => {
                    if (btn.disabled) return;
                    const id = documentExtractor.getInteractionId(); 
                    if (!id || id === 'N/A') { log(`[Listener] ERRO: Não foi possível obter o InteractionID no clique.`); return; }
                    
                    if (type === 'TRANSFERIDO') {
                        analyticsManager.logTransferClick();
                        CONFIG.LAST_ENDED_INTERACTIONS.set(id, { type: 'TRANSFERIDO', timestamp: Date.now() });
                        log(`Clique em Transferir (TRANSFERIDO) rastreado para ID: ${id}`);
                    } else if (type === 'AVALIACAO') {
                        analyticsManager.logEvaluatedClick();
                        CONFIG.LAST_ENDED_INTERACTIONS.set(id, { type: 'AVALIACAO', timestamp: Date.now() });
                        log(`Clique em Avaliação (AVALIACAO) rastreado para ID: ${id}`);
                    }
                });
                btn.dataset.gmListenerAdded = true;
            };

            // Adiciona listener para o botão Balão (usa o novo rastreamento V4)
            const addBalaoListener = (btn) => {
                 if (btn.dataset.gmBalaoListenerAdded) return;
                 btn.addEventListener('click', handleBalaoClick);
                 btn.dataset.gmBalaoListenerAdded = true;
                 log("Listener do Balão V4 adicionado.");
            };

            document.querySelectorAll(LOCKDOWN_CONFIG.END_CHAT_BUTTON_SELECTOR.join(','))
                .forEach(btn => addBalaoListener(btn));

            document.querySelectorAll(CONFIG.PURECLOUD_SELECTORS.TRANSFER_BUTTON_SELECTOR.join(','))
                .forEach(btn => addAnalyticsListener(btn, 'TRANSFERIDO'));

            document.querySelectorAll(CONFIG.PURECLOUD_SELECTORS.EVALUATION_BUTTON_SELECTOR.join(','))
                .forEach(btn => addAnalyticsListener(btn, 'AVALIACAO')); 

            if (scriptDoc) {
                log("[Listener] Procurando botões de avaliação dentro do Iframe do Script...");
                scriptDoc.querySelectorAll(CONFIG.PURECLOUD_SELECTORS.EVALUATION_BUTTON_SELECTOR.join(','))
                    .forEach(btn => addAnalyticsListener(btn, 'AVALIACAO'));
            }
        },
        initLockState: (conv) => { if (!conversationLockManager.states.has(conv)) { conversationLockManager.states.set(conv, { isLocked: true, unlockClicks: 0 }); } }
    };

    const conversationTimers = new Map();
    let currentChatObserverInstance = null;
    let currentChatInputField = null;

    function updateTimerDisplay(timerData) {
        if (!timerData.div?.isConnected || !timerData.numDiv?.isConnected || !timerData.bubblesContainer?.isConnected) { return; }
        let currentElapsed; if (timerData.isPaused) { currentElapsed = timerData.pausedAt - timerData.startTime; } else { currentElapsed = Date.now() - timerData.startTime; }
        const secs = Math.floor(currentElapsed / 1000); timerData.div.textContent = `${formatTime(Math.floor(secs/60))}:${formatTime(secs%60)}`;
        timerData.div.classList.remove('paused-alert', 'inactive-client-alert', 'normal-timer', 'inactive-operator-alert'); timerData.div.style.removeProperty('animation');
        
        if (timerData.isPaused) { 
            timerData.div.classList.add('paused-alert'); 
        } else { 
            const inactivityOperatorSeconds = (Date.now() - (timerData.lastOperatorActivityTimestamp || timerData.startTime)) / 1000; 
            const inactivityClientSeconds = (Date.now() - (timerData.lastCustomerReplyTimestamp || timerData.startTime)) / 1000; 
            
            if (inactivityOperatorSeconds >= CONFIG.INACTIVITY_OPERATOR_ALERT_SECONDS) { 
                timerData.div.classList.add('inactive-operator-alert'); 
                if (!timerData.operatorAlertPlayed) {
                    soundPlayer.playBeep('inactive_operator');
                    timerData.operatorAlertPlayed = true; 
                }
            } else if (inactivityClientSeconds >= CONFIG.INACTIVITY_CLIENT_ALERT_SECONDS) { 
                timerData.div.classList.add('inactive-client-alert'); 
                if (!timerData.clientAlertPlayed) {
                    soundPlayer.playBeep('inactive_client');
                    timerData.clientAlertPlayed = true; 
                }
            } else { 
                timerData.div.classList.add('normal-timer'); 
                timerData.operatorAlertPlayed = false;
                timerData.clientAlertPlayed = false;
            } 
        }
        
        if (currentElapsed >= CONFIG.CHECKMARK_THRESHOLD_MS) { if (!timerData.completedVisual) { if (!timerData.checkmarkDiv) { timerData.checkmarkDiv = document.createElement('div'); timerData.checkmarkDiv.className = 'injected-element injected-checkmark'; timerData.checkmarkDiv.innerHTML = '✔️'; timerData.bubblesContainer.appendChild(timerData.checkmarkDiv); } timerData.checkmarkDiv.style.display = 'flex'; timerData.completedVisual = true; } } else { if (timerData.checkmarkDiv) { timerData.checkmarkDiv.style.display = 'none'; timerData.completedVisual = false; } }
        if (currentElapsed > CONFIG.LONG_CONVO_ALERT_MIN * 60000 && !timerData.longConvoNotified) { UI.createNotification(`A conversa com ${timerData.participantName || 'o cliente'} está muito longa (${CONFIG.LONG_CONVO_ALERT_MIN} min).`, 'warn', 5000); timerData.longConvoNotified = true; }
    }

    const timerManager = {
        initTimer(convEl, index, total) {
            let tData = conversationTimers.get(convEl); if (!tData) { let bubblesContainer = convEl.querySelector('.injected-bubbles-container'); let tDiv = convEl.querySelector('.injected-conversation-timer'); let nDiv = convEl.querySelector('.injected-conversation-number'); let checkmarkDiv = convEl.querySelector('.injected-checkmark');
                let recurrenceDiv = convEl.querySelector('.injected-recurrence-icon');
                let iconDiv = convEl.querySelector('.injected-interaction-icon');

                if (!bubblesContainer) { 
                    bubblesContainer = document.createElement('div'); 
                    bubblesContainer.className = 'injected-bubbles-container'; 
                    
                    nDiv = document.createElement('div'); 
                    nDiv.className = 'injected-element injected-conversation-number'; 
                    bubblesContainer.appendChild(nDiv); 
                    
                    iconDiv = document.createElement('div');
                    iconDiv.className = 'injected-element injected-interaction-icon';
                    iconDiv.innerHTML = '❔';
                    bubblesContainer.appendChild(iconDiv);

                    tDiv = document.createElement('div'); 
                    tDiv.className = 'injected-element injected-conversation-timer'; 
                    bubblesContainer.appendChild(tDiv); 
                    
                    let contentWrapper = findEl(CONFIG.PURECLOUD_SELECTORS.CONVERSATION_CONTENT_WRAPPER, convEl);
                    if (contentWrapper) {
                        contentWrapper.appendChild(bubblesContainer);
                    } else {
                        log("WARN: .interaction-content não encontrado. Anexando bolhas ao convEl.");
                        convEl.appendChild(bubblesContainer);
                    }

                    setTimeout(() => { 
                        if (contentWrapper && !contentWrapper.contains(bubblesContainer)) {
                             contentWrapper.appendChild(bubblesContainer); 
                        } else if (!convEl.contains(bubblesContainer)) {
                            convEl.appendChild(bubblesContainer);
                        }
                    }, 100); 
                } else { 
                    if (!nDiv) { nDiv = document.createElement('div'); nDiv.className = 'injected-element injected-conversation-number'; bubblesContainer.prepend(nDiv); } 
                    
                    if (!iconDiv) {
                        iconDiv = document.createElement('div');
                        iconDiv.className = 'injected-element injected-interaction-icon';
                        iconDiv.innerHTML = '❔'; 
                        if (nDiv && nDiv.nextSibling) {
                            bubblesContainer.insertBefore(iconDiv, nDiv.nextSibling);
                        } else {
                            bubblesContainer.appendChild(iconDiv);
                        }
                    }

                    if (!tDiv) { tDiv = document.createElement('div'); tDiv.className = 'injected-element injected-conversation-timer'; bubblesContainer.appendChild(tDiv); } 
                }
                
                const { participantName, phoneNumber } = documentExtractor.getNameAndNumber(convEl); const interactionId = documentExtractor.getInteractionId(convEl);

                const isRecurrence = phoneNumber !== 'N/A' && analyticsManager.getData().conversations.some(conv => 
                    conv.phoneNumber === phoneNumber && 
                    conv.duration >= CONFIG.CHECKMARK_THRESHOLD_MS
                );

                if (isRecurrence) {
                    if (!recurrenceDiv) {
                        recurrenceDiv = document.createElement('div');
                        recurrenceDiv.className = 'injected-element injected-recurrence-icon';
                        recurrenceDiv.innerHTML = '🔁';
                        recurrenceDiv.title = 'Cliente recorrente hoje';
                        bubblesContainer.appendChild(recurrenceDiv);
                    }
                    recurrenceDiv.style.display = 'flex';
                } else if (recurrenceDiv) {
                    recurrenceDiv.style.display = 'none';
                }

                tData = {
                    div: tDiv,
                    numDiv: nDiv,
                    iconDiv: iconDiv,
                    checkmarkDiv: checkmarkDiv,
                    recurrenceDiv: recurrenceDiv,
                    bubblesContainer: bubblesContainer,
                    element: convEl,
                    creationTime: Date.now(),
                    startTime: Date.now(),
                    pausedAt: Date.now(),
                    isPaused: true,
                    completedVisual: false,
                    tmaLogged: false,
                    activeDuration: 0,
                    activeSessionStart: null,
                    lastOperatorActivityTimestamp: Date.now(),
                    lastCustomerReplyTimestamp: Date.now(),
                    longConvoNotified: false,
                    operatorAlertPlayed: false,
                    clientAlertPlayed: false,
                    participantName: participantName,
                    phoneNumber: phoneNumber,
                    interactionUrl: 'N/A',
                    interactionId: interactionId,
                    isRecurrence: isRecurrence,
                    interactionType: 'unknown'
                };
                tData.intervalId = setInterval(() => { updateTimerDisplay(tData); }, CONFIG.TIMER_UPDATE_INTERVAL_MS); conversationTimers.set(convEl, tData);
            }
            tData.numDiv.textContent = total - index;
            if (tData.isRecurrence && tData.recurrenceDiv) { tData.recurrenceDiv.style.display = 'flex'; }
            
            return tData;
        },
        updateState(tData, isSelected) { if (isSelected) { if (tData.isPaused) { tData.startTime += (Date.now() - tData.pausedAt); tData.isPaused = false; tData.activeSessionStart = Date.now(); tData.lastOperatorActivityTimestamp = Date.now(); } } else { if (!tData.isPaused) { if (tData.activeSessionStart) { tData.activeDuration += (Date.now() - tData.activeSessionStart); tData.activeSessionStart = null; } tData.pausedAt = Date.now(); tData.isPaused = true; } } updateTimerDisplay(tData); },
        cleanupTimers(activeConversationElements) {
            const timersToDelete = [];
            const AGENT_END_WINDOW_MS = 5000;
            conversationTimers.forEach((timerData, convEl) => {
                if (!document.body.contains(convEl)) {
                    log(`Limpando timer para ${timerData.participantName} removido do DOM.`);
                    clearInterval(timerData.intervalId);
                    if (!timerData.tmaLogged) {
                        if (!timerData.isPaused && timerData.activeSessionStart) {
                            timerData.activeDuration += (Date.now() - timerData.activeSessionStart);
                            timerData.activeSessionStart = null;
                        }
                        const duration = Date.now() - timerData.creationTime;
                        const currentTime = Date.now();
                        
                        // Lógica de classificação baseada em interações recentes (para manter a coleta de Transferido/Avaliação)
                        const clickData = CONFIG.LAST_ENDED_INTERACTIONS.get(timerData.interactionId);
                        let classification = 'HIBERNADO';
                        if (clickData && (currentTime - clickData.timestamp) < AGENT_END_WINDOW_MS) {
                            if (clickData.type === 'BALAO') { classification = 'BALAO'; }
                            else if (clickData.type === 'TRANSFERIDO') { classification = 'TRANSFERIDO'; }
                            else if (clickData.type === 'AVALIACAO') { classification = 'AVALIACAO'; }
                            CONFIG.LAST_ENDED_INTERACTIONS.delete(timerData.interactionId);
                        }
                        
                        analyticsManager.logConversation(
                            duration, 
                            timerData.activeDuration, 
                            timerData.participantName, 
                            timerData.phoneNumber, 
                            timerData.interactionUrl, 
                            classification,
                            timerData.interactionType 
                        );
                        
                        timerData.tmaLogged = true;
                        if (CONFIG.LAST_ENDED_INTERACTIONS.has(timerData.interactionId)) {
                            CONFIG.LAST_ENDED_INTERACTIONS.delete(timerData.interactionId);
                        }
                    }
                    timersToDelete.push(convEl);
                    timerData.div?.remove();
                    timerData.numDiv?.remove();
                    timerData.iconDiv?.remove();
                    timerData.checkmarkDiv?.remove();
                    timerData.recurrenceDiv?.remove();
                    timerData.bubblesContainer?.remove();
                }
            });
            timersToDelete.forEach(convEl => conversationTimers.delete(convEl));
        }
    }
    function observeCurrentChatMessages(timerData) {
        if (currentChatObserverInstance) { currentChatObserverInstance.disconnect(); currentChatObserverInstance = null; } if (currentChatInputField) { currentChatInputField.removeEventListener('input', handleOperatorActivity); currentChatInputField.removeEventListener('keypress', handleOperatorActivity); currentChatInputField = null; } let chatMessagesContainer = null; let chatInputField = null; const messagingIframe = document.querySelector(CONFIG.PURECLOUD_SELECTORS.MESSAGING_GADGET_IFRAME); if (messagingIframe && messagingIframe.contentDocument) { try { chatMessagesContainer = findEl('.chat-messages-container', messagingIframe.contentDocument); chatInputField = findEl('textarea[aria-label="Digitar uma mensagem"]', messagingIframe.contentDocument); } catch (e) { log("WARN: Erro ao acessar contentDocument do iframe de mensagens."); } } if (!chatMessagesContainer) { chatMessagesContainer = findEl('.chat-messages-container'); chatInputField = findEl('textarea[aria-label="Digitar uma mensagem"]'); } const handleOperatorActivity = () => { if (timerData.lastOperatorActivityTimestamp !== Date.now()) { timerData.lastOperatorActivityTimestamp = Date.now(); updateTimerDisplay(timerData); } }; if (chatMessagesContainer) { if (chatMessagesContainer.dataset.observedByScript === 'true') { if (chatInputField && currentChatInputField !== chatInputField) { chatInputField.addEventListener('input', handleOperatorActivity); chatInputField.addEventListener('keypress', handleOperatorActivity); currentChatInputField = chatInputField; } return; } currentChatObserverInstance = new MutationObserver((mutations) => { for (const mutation of mutations) { if (mutation.type === 'childList' && mutation.addedNodes.length > 0) { const newClientMessages = Array.from(mutation.addedNodes).filter(node => node.nodeType === 1 && node.matches('.chat-message-group.remote')); if (newClientMessages.length > 0) { timerData.lastCustomerReplyTimestamp = Date.now(); updateTimerDisplay(timerData); } } } }); currentChatObserverInstance.observe(chatMessagesContainer, { childList: true, subtree: true }); chatMessagesContainer.dataset.observedByScript = 'true'; if (chatInputField) { chatInputField.addEventListener('input', handleOperatorActivity); chatInputField.addEventListener('keypress', handleOperatorActivity); currentChatInputField = chatInputField; } }
    }

    // --- MAIN LOOP ---
    function mainLoop() {
        const toolbar = findEl(CONFIG.PURECLOUD_SELECTORS.TOOLBAR); if (toolbar) { createToolbarUI(toolbar); } else { log(`CRITICAL: Toolbar não encontrada. Seletores: ${CONFIG.PURECLOUD_SELECTORS.TOOLBAR.join(', ')}`); }
        let conversationsNodeList = document.querySelectorAll(CONFIG.PURECLOUD_SELECTORS.INTERACTION_GROUP.join(', ')); const sortedConversationsArray = Array.from(conversationsNodeList).sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
        const activeConversationElements = new Set(sortedConversationsArray); timerManager.cleanupTimers(activeConversationElements); const selectedConvEl = findEl(CONFIG.PURECLOUD_SELECTORS.SELECTED_INTERACTION_GROUP);
        
        sortedConversationsArray.forEach((conv, index) => { 
            const nativeTimeElementsInConv = conv.querySelectorAll(CONFIG.PURECLOUD_SELECTORS.NATIVE_TIMER_SELECTORS.join(', '));
            nativeTimeElementsInConv.forEach(el => { 
                if (el.classList.contains('injected-element') || el.classList.contains('injected-bubbles-container')) {
                    return; 
                }
                if (el.textContent.match(/\d+\s*(min|hr|seg|now|agora)/i) || el.matches('.duration, .message-timestamp')) { 
                    el.style.display = 'none'; 
                } 
            });

            const tData = timerManager.initTimer(conv, index, sortedConversationsArray.length); 
            
            // --- INÍCIO (v1.0.25) --- Lógica de Ícones
            const isCall = conv.querySelector(CONFIG.PURECLOUD_SELECTORS.ICON_SELECTOR_CALL);
            const isChat = conv.querySelector(CONFIG.PURECLOUD_SELECTORS.ICON_SELECTOR_CHAT);
            
            if (tData.iconDiv) {
                if (isCall) {
                    tData.iconDiv.innerHTML = '📞';
                    tData.iconDiv.title = 'Ligação';
                    tData.interactionType = 'call';
                } else if (isChat) {
                    tData.iconDiv.innerHTML = '💬';
                    tData.iconDiv.title = 'Chat';
                    tData.interactionType = 'chat';
                } else {
                    tData.iconDiv.innerHTML = '❔';
                    tData.iconDiv.title = 'Interação';
                    tData.interactionType = 'unknown';
                }
            }
            // --- FIM (v1.0.25) ---

            const isSelected = conv === selectedConvEl; 
            timerManager.updateState(tData, isSelected); 
            conversationLockManager.initLockState(conv); 
            if (isSelected) { 
                observeCurrentChatMessages(tData); 
                conversationLockManager.updateLockButton(conv); 
            } 
        });
        
        if (!selectedConvEl) {
            const allEndButtons = document.querySelectorAll(LOCKDOWN_CONFIG.END_CHAT_BUTTON_SELECTOR.join(','));
            allEndButtons.forEach(btn => { btn.disabled = true; btn.classList.add('lockdown-disabled'); btn.title = 'Selecione uma conversa'; });
            
            const allEvalButtons = document.querySelectorAll(CONFIG.PURECLOUD_SELECTORS.EVALUATION_BUTTON_SELECTOR.join(','));
            allEvalButtons.forEach(btn => { btn.disabled = true; btn.classList.add('lockdown-disabled'); btn.title = 'Selecione uma conversa'; });

            const lockButton = document.getElementById('purecloud-script-btn-toggleLock');
            if (lockButton) {
                const ICON_SHIELD_LOCKED = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>';
                lockButton.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 18px; height: 18px;">${ICON_SHIELD_LOCKED}</svg>`;
                lockButton.title = 'Controle de Encerramento de Conversa';
            }
        }
        
        if (CONFIG.MINI_DASHBOARD_VISIBLE) { UI.createMiniDashboard(); }
    }

    // --- HANDLER DE TECLADO ---
    const getHotkeyCombo = (e) => {
        const pressedKeys = []; if (e.ctrlKey) pressedKeys.push('Control'); if (e.shiftKey) pressedKeys.push('Shift'); if (e.altKey) pressedKeys.push('Alt'); const key = e.key === ' ' ? 'Space' : (e.key.length === 1 ? e.key.toUpperCase() : e.key); if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) { pressedKeys.push(key); } const primaryKey = pressedKeys.pop(); pressedKeys.sort(); if (primaryKey) pressedKeys.push(primaryKey); return pressedKeys.join('+');
    };
    const keyboardEventHandler = (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) { return; } const currentCombo = getHotkeyCombo(e); if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) { return; } for (const actionName in CONFIG.HOTKEYS) { if (CONFIG.HOTKEYS[actionName] === currentCombo) { e.preventDefault(); if (actions[actionName]) { actions[actionName](); UI.createNotification(featureDescriptions[actionName]?.title || actionName, 'info', 1000); return; } } }
    };

    // --- CRIAÇÃO DA BARRA DE FERRAMENTAS ---
    function createToolbarUI(toolbar) {
        if (toolbar.dataset.scriptVersion === SCRIPT_VERSION) { return; } 
        toolbar.querySelectorAll('.purecloud-script-custom-btn, #purecloud-script-toolbar-counter, .purecloud-script-menu-container').forEach(el => el.remove()); 
        toolbar.dataset.scriptVersion = SCRIPT_VERSION; 
        
        const createMainToolbarBtn = (id, title, svg, onClick) => { 
            const btn = document.createElement("button"); 
            btn.id = id; 
            btn.className = 'purecloud-script-custom-btn'; 
            btn.title = title; 
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">${svg}</svg>`; 
            btn.onclick = onClick; 
            
            btn.classList.toggle('pc-script-dark-mode', CONFIG.DARK_MODE); 

            toolbar.appendChild(btn); 
            return btn; 
        };
        
        createMainToolbarBtn('purecloud-script-btn-copyInteraction', featureDescriptions.copyInteraction.title, '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/>', actions.copyInteraction);
        createMainToolbarBtn('purecloud-script-btn-openSettings', featureDescriptions.openSettings.title, '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>', actions.openSettings);
        
        const ICON_SHIELD_LOCKED = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>'; 
        const lockButton = document.createElement("button"); 
        lockButton.id = 'purecloud-script-btn-toggleLock'; 
        lockButton.className = 'purecloud-script-custom-btn'; 
        lockButton.title = 'Controle de Encerramento de Conversa'; 
        lockButton.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 18px; height: 18px;">${ICON_SHIELD_LOCKED}</svg>`; 
        lockButton.onclick = actions.toggleLock; 
        lockButton.classList.toggle('pc-script-dark-mode', CONFIG.DARK_MODE); 

        const endChatButton = findEl(LOCKDOWN_CONFIG.END_CHAT_BUTTON_SELECTOR, toolbar); 
        if (endChatButton) { 
            endChatButton.parentNode.insertBefore(lockButton, endChatButton); 
        } else { 
            toolbar.prepend(lockButton); 
        }
    }

    // --- UI ---
    const UI = {
        createNotification(message, type = 'info', duration = 3000) {
            let c = document.getElementById('purecloud-script-notification-container');
            if (!c) {
                c = document.createElement('div');
                c.id = 'purecloud-script-notification-container';
                c.classList.toggle('pc-script-dark-mode', CONFIG.DARK_MODE);
                document.body.appendChild(c);
            }
            const n = document.createElement("div"); n.textContent = message; n.className = `purecloud-script-notification purecloud-script-notification-${type}`; c.prepend(n); const v = document.querySelectorAll('#purecloud-script-notification-container .purecloud-script-notification'); if (v.length > 5) { v[v.length - 1].remove(); } setTimeout(() => { n.style.opacity = '0'; n.style.transform = 'translateX(100%)'; setTimeout(() => n.remove(), 300); }, duration);
        },
        renderBarChart(container, perHourData) {
            container.innerHTML = ''; if (Object.keys(perHourData).length === 0) { container.innerHTML = '<div class="chart-placeholder">Nenhuma conversa para exibir gráfico.</div>'; return; } const maxCount = Math.max(...Object.values(perHourData)); const chartWrapper = document.createElement('div'); chartWrapper.className = 'chart-bars-wrapper'; for (let hour = 0; hour < 24; hour++) { const count = perHourData[hour] || 0; const height = (count / (maxCount || 1)) * 90; const barWrapper = document.createElement('div'); barWrapper.className = 'chart-bar-wrapper'; barWrapper.title = `${count} conversas às ${String(hour).padStart(2, '0')}h`; barWrapper.style.height = '100%'; barWrapper.style.position = 'relative'; barWrapper.innerHTML = `<div class="chart-bar building-bar" style="height: ${height}%; position: absolute; bottom: 0; width: 90%;"><span class="bar-count">${count > 0 ? count : ''}</span></div><span class="bar-label">${String(hour).padStart(2, '0')}h</span>`; chartWrapper.appendChild(barWrapper); } container.innerHTML = `<div class="chart-scroll-container">${chartWrapper.outerHTML}</div>`;
        },
        renderAnalyticsContent(container) {
            const stats = analyticsManager.calculateStats(); container.innerHTML = `<div class="stats-grid"><div class="stat-item"><span>Conversas (Únicas)</span><strong id="analytics-total-count">${stats.count}</strong></div><div class="stat-item"><span>TMA (Geral)</span><strong id="analytics-tma">${stats.tma}</strong></div><div class="stat-item"><span>TME (Ativo)</span><strong id="analytics-tme">${stats.tme}</strong></div><div class="stat-item"><span>Balão (Término)</span><strong id="analytics-balao-clicks">${stats.baloonClicks}</strong></div> <div class="stat-item"><span>Início</span><strong id="analytics-first">${stats.first}</strong></div><div class="stat-item"><span>Última</span><strong id="analytics-last">${stats.last}</strong></div><div class="stat-item"><span>Meta</span><strong id="analytics-target">${CONFIG.CONVERSATION_TARGET}</strong></div><div class="stat-item"><span>Transferidos</span><strong id="analytics-transfer-count">${stats.transferClicks}</strong></div></div><p style="font-size: 0.8em; color: var(--purecloud-script-text-secondary); margin-top: 5px;">* Balão (Término) usa o contador integrado (v4.0).</p><h4>Conversas/Hora (Todas Completas)</h4><div class="analytics-chart-container-main"></div>`; UI.renderBarChart(container.querySelector('.analytics-chart-container-main'), stats.perHour);
        },
        renderDetailsContent(container) {
            const stats = analyticsManager.calculateStats(); 
            const conversations = stats.allConversations.filter(c => c.duration >= CONFIG.CHECKMARK_THRESHOLD_MS).sort((a, b) => b.timestamp - a.timestamp);
            
            let detailsList = container.querySelector('#details-list'); 
            if (!detailsList) { 
                detailsList = document.createElement('div'); 
                detailsList.id = 'details-list'; 
                container.appendChild(detailsList); 
            }
            
            if (conversations.length === 0) { 
                detailsList.innerHTML = '<p>Nenhum atendimento completo registrado hoje.</p>'; 
                return; 
            }

            const conversationsAsc = conversations.reverse();
            const totalCount = conversationsAsc.length;
            const recurrenceCount = stats.recurrenceCount;

            detailsList.innerHTML = `
                <div class="details-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="margin:0; color: var(--purecloud-script-text-primary);">Total de Atendimentos Completos: ${totalCount}</h4>
                    <h4 style="margin:0; color: var(--purecloud-script-warn-color); font-weight: bold;">Recorrências Hoje: ${recurrenceCount}</h4>
                </div>
                <style>
                    .details-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.85em; }
                    .details-table th, .details-table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid var(--purecloud-script-border-color); }
                    .details-table th { background-color: var(--purecloud-script-bg-secondary); color: var(--purecloud-script-text-primary); }
                    .details-table tr:hover { background-color: rgba(0, 0, 0, 0.05); }
                    .pc-script-dark-mode .details-table tr:hover { background-color: rgba(255, 255, 255, 0.05); }
                    .recurrence-tag, .first-tag { padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 0.8em; display: inline-block; }
                    .recurrence-tag { background-color: var(--purecloud-script-warn-color); color: #222; }
                    .first-tag { background-color: var(--purecloud-script-success-color); color: #fff; }
                    /* REMOVIDO: Classes ended-agent-tag */
                    .is-recurrence-row { opacity: 0.8; font-style: italic; }
                    .details-table th.col-num, .details-table td.col-num { 
                        text-align: right; 
                        width: 40px; 
                        font-weight: bold;
                        color: var(--purecloud-script-text-secondary);
                    }
                    /* Nova coluna 'Tipo' */
                    .details-table th.col-type, .details-table td.col-type { 
                        text-align: center; 
                        width: 40px; 
                        font-size: 1.1em;
                    }
                </style>
                <table class="details-table">
                    <thead>
                        <tr>
                            <th class="col-num">#</th>
                            <th class="col-type">Tipo</th>
                            <th>Hora Fim</th>
                            <th>Cliente</th>
                            <th>TME</th>
                            <th>Recorrência</th>
                            <th>Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${conversationsAsc.map((conv, index) => { 
                            const time = getBrazilTime(new Date(conv.timestamp)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); 
                            const tmeSeconds = Math.floor(conv.activeDuration / 1000); 
                            const tme = `${formatTime(Math.floor(tmeSeconds / 60))}:${formatTime(tmeSeconds % 60)}`; 
                            const recurrenceLabel = conv.isRecurrence ? '<span class="recurrence-tag">Sim</span>' : '<span class="first-tag">Não</span>'; 
                            const urlLink = conv.interactionUrl && conv.interactionUrl !== 'N/A' ? `<a href="${conv.interactionUrl}" target="_blank" title="Abrir Interação">🔗</a>` : 'N/A'; 
                            
                            let typeIcon = '❔';
                            if (conv.interactionType === 'call') {
                                typeIcon = '📞';
                            } else if (conv.interactionType === 'chat') {
                                typeIcon = '💬';
                            }

                            return `<tr class="${conv.isRecurrence ? 'is-recurrence-row' : ''}">
                                <td class="col-num">${index + 1}</td>
                                <td class="col-type" title="${conv.interactionType}">${typeIcon}</td>
                                <td>${time}</td>
                                <td>${conv.participantName || 'N/A'}</td>
                                <td>${tme}</td>
                                <td>${recurrenceLabel}</td>
                                <td>${urlLink}</td>
                            </tr>`; 
                        }).join('')}
                    </tbody>
                </table>
                <button id="export-details-btn" class="purecloud-script-button" style="margin-top: 15px;">Exportar Detalhes (JSON)</button>`;
            
            const exportDetailsBtn = container.querySelector('#export-details-btn'); 
            if (exportDetailsBtn) { 
                exportDetailsBtn.onclick = () => { 
                    const dataToExport = analyticsManager.getData().conversations; 
                    const filename = `purecloud_script_attendances_${getBrazilTime(new Date()).toISOString().split('T')[0]}.json`; 
                    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' }); 
                    const url = URL.createObjectURL(blob); 
                    const a = document.createElement('a'); 
                    a.href = url; a.download = filename; 
                    document.body.appendChild(a); 
                    a.click(); 
                    document.body.removeChild(a); 
                    URL.revokeObjectURL(url); 
                    UI.createNotification("Dados de atendimentos exportados com sucesso!", "success"); 
                }; 
            }
        },
        // FUNÇÃO ATUALIZADA: Layout de Tabela para Encerrados
        renderClosedDetailsContent(container) {
            const balaoRecords = v4_counters.balao.slice().reverse(); // Copia e inverte para mostrar o mais recente primeiro

            container.innerHTML = `
                <h4 style="margin-top:0;">Histórico de Cliques: Balão (Mensagens de Término)</h4>
                <p style="font-size: 0.85em; color: var(--purecloud-script-text-secondary); margin-bottom: 15px;">
                    Total de Cliques de Balão Hoje: <strong style="color: var(--purecloud-script-error-color);">${balaoRecords.length}</strong>
                </p>
                <div id="closed-interactions-list" class="details-table-wrapper" style="max-height: 400px; overflow-y: auto;">
                    ${balaoRecords.length === 0 ? '<p>Nenhum clique de Balão registrado hoje.</p>' : ''}
                    
                    <table class="details-table">
                        <thead>
                            <tr>
                                <th style="width: 20%;">Hora</th>
                                <th style="width: 45%;">Cliente</th>
                                <th style="width: 25%;">Telefone</th>
                                <th style="width: 10%; text-align: center;">Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${balaoRecords.map(item => {
                                // Formatação da Hora: Mostra Hora e Minuto
                                const time = getBrazilTime(new Date(item.timestamp)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                const urlLink = (item.interactionUrl && item.interactionUrl !== 'N/A')
                                    ? `<a href="${item.interactionUrl}" target="_blank" title="Abrir Interação">🔗</a>`
                                    : 'N/A';
                                    
                                return `<tr>
                                    <td>${time}</td>
                                    <td>${item.participantName || 'N/A'}</td>
                                    <td>${item.phoneNumber || 'N/A'}</td>
                                    <td style="text-align: center;">${urlLink}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                <button id="export-balao-details-btn" class="purecloud-script-button" style="margin-top: 15px;">Exportar Detalhes de Balão (JSON)</button>
            `;

            // Adicionando a função de exportação de dados V4
            const exportDetailsBtn = container.querySelector('#export-balao-details-btn'); 
            if (exportDetailsBtn) { 
                exportDetailsBtn.onclick = () => { 
                    const dataToExport = v4_counters.balao; 
                    const filename = `purecloud_script_balao_closures_${getBrazilTime(new Date()).toISOString().split('T')[0]}.json`; 
                    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' }); 
                    const url = URL.createObjectURL(blob); 
                    const a = document.createElement('a'); 
                    a.href = url; a.download = filename; 
                    document.body.appendChild(a); 
                    a.click(); 
                    document.body.removeChild(a); 
                    URL.revokeObjectURL(url); 
                    UI.createNotification("Dados de encerramento Balão exportados com sucesso!", "success"); 
                }; 
            }
        },
        renderThemeContent(container, tempThemeColors) {
            const colorGroups = { "Interface Geral": { bgPrimary: "Fundo Principal", bgSecondary: "Fundo Secundário", textPrimary: "Texto Principal", textSecondary: "Texto Secundário", borderColor: "Cor da Borda", }, "Timers e Números (Bolhas)": { timerBg: "Fundo Padrão", accent: "Fundo (Selecionado)", timerNormalText: "Texto (Novo/Completo)", timerActiveText: "Texto (Contando)", timerPausedText: "Texto (Pausado)", timerInactiveClientText: "Texto (Cliente Inativo)", timerInactiveOperatorText: "Texto (Operador Inativo)", }, "Cores de Alerta e Status": { success: "Sucesso (Verde)", error: "Erro (Vermelho)", warn: "Aviso (Amarelo)", info: "Informação (Azul)", }, "Outros": { miniDashboardProgress: "Progresso (Mini Dashboard)" } };
            container.innerHTML = `<h3>Configurações de Tema</h3><p>Altere as cores da interface do script. As alterações serão aplicadas após salvar.</p><div id="theme-color-sections"></div><button id="reset-theme-btn" class="purecloud-script-button button-danger" style="margin-top: 25px;">Resetar Cores Padrão</button>`;
            const sectionsContainer = container.querySelector('#theme-color-sections');
            for (const groupName in colorGroups) { const section = document.createElement('div'); section.className = 'theme-section'; section.innerHTML = `<h4>${groupName}</h4><div class="settings-group color-grid"></div>`; const grid = section.querySelector('.color-grid'); for (const key in colorGroups[groupName]) { if (tempThemeColors.hasOwnProperty(key)) { const label = colorGroups[groupName][key]; const color = tempThemeColors[key]; const pickerGroup = document.createElement('div'); pickerGroup.className = 'color-picker-group'; pickerGroup.innerHTML = `<label for="theme-color-${key}">${label}</label><input type="color" id="theme-color-${key}" data-key="${key}" value="${color}">`; grid.appendChild(pickerGroup); } } sectionsContainer.appendChild(section); }
            container.querySelectorAll('input[type="color"]').forEach(input => { input.addEventListener('input', (e) => { tempThemeColors[e.target.dataset.key] = e.target.value; }); });
            container.querySelector('#reset-theme-btn').onclick = () => { if (!confirm("Tem certeza que deseja resetar todas as cores para o padrão? (Irá resetar apenas nesta aba, clique em Salvar para confirmar).")) return; Object.assign(tempThemeColors, JSON.parse(JSON.stringify(defaultThemeColors))); container.querySelectorAll('input[type="color"]').forEach(input => { const key = input.dataset.key; if (tempThemeColors.hasOwnProperty(key)) { input.value = tempThemeColors[key]; } }); UI.createNotification("Cores resetadas para o padrão. Clique em 'Salvar' para confirmar.", "info"); };
        },
        createSettingsPanel() {
            document.querySelector('.purecloud-script-settings-panel')?.remove();
            const panel = document.createElement('div');
            panel.className = 'purecloud-script-settings-panel purecloud-script-popup';
            panel.classList.toggle('pc-script-dark-mode', CONFIG.DARK_MODE);
            let tempHotkeysConfig = { ...CONFIG.HOTKEYS }; let tempThemeColors = JSON.parse(JSON.stringify(CONFIG.THEME_COLORS));
            // ABA 'closed' ADICIONADA AQUI
            panel.innerHTML = `<div class="panel-header" style="cursor: move;"><h2>Config. Contador</h2><div class="panel-header-buttons"><button class="panel-header-btn minimize-btn" title="Minimizar">-</button><button class="panel-header-btn purecloud-script-popup-close-btn" id="closeSettingsPanelBtn" title="Fechar">X</button></div></div><div class="purecloud-script-tabs"><button class="purecloud-script-tab-button active" data-tab="analytics">Analytics</button><button class="purecloud-script-tab-button" data-tab="details">Atendimentos</button><button class="purecloud-script-tab-button" data-tab="closed">Encerrados</button><button class="purecloud-script-tab-button" data-tab="general">Geral</button><button class="purecloud-script-tab-button" data-tab="theme">Aparência</button><button class="purecloud-script-tab-button" data-tab="hotkeys">Atalhos</button></div><div class="panel-content"><div class="purecloud-script-tab-content active" data-tab-content="analytics"></div><div class="purecloud-script-tab-content" data-tab-content="details"></div><div class="purecloud-script-tab-content" data-tab-content="closed"></div><div class="purecloud-script-tab-content" data-tab-content="general"></div><div class="purecloud-script-tab-content" data-tab-content="theme"></div><div class="purecloud-script-tab-content" data-tab-content="hotkeys"></div></div><div class="panel-footer"><button id="save-settings-btn" class="purecloud-script-button">Salvar e Fechar</button></div>`;
            document.body.appendChild(panel); makeDraggable(panel, panel.querySelector('.panel-header'), 'settingsPanel'); panel.querySelector('#closeSettingsPanelBtn').onclick = () => panel.remove();
            const renderHotkeys = (container) => { container.innerHTML = '<h3>Atalhos de Teclado</h3><p>Clique no campo de atalho e pressione o combo de teclas desejado (ex: Ctrl + Shift + I). Use ESC para cancelar a gravação.</p><div id="hotkey-list"></div>'; const hotkeyList = container.querySelector('#hotkey-list'); for (const actionKey in tempHotkeysConfig) { const feature = featureDescriptions[actionKey]; if (!feature) continue; const hotkeyGroup = document.createElement('div'); hotkeyGroup.className = 'settings-group hotkey-group'; hotkeyGroup.innerHTML = `<label for="hotkey-${actionKey}">${feature.title}:</label><input type="text" id="hotkey-${actionKey}" data-action="${actionKey}" value="${tempHotkeysConfig[actionKey]}" readonly class="hotkey-input">`; hotkeyList.appendChild(hotkeyGroup); } hotkeyList.querySelectorAll('.hotkey-input').forEach(input => { document.removeEventListener('keydown', input._captureHotkey, true); const captureHotkey = (e) => { if (!input.classList.contains('listening')) return; e.preventDefault(); e.stopPropagation(); if (e.key === 'Escape') { input.classList.remove('listening'); input.value = tempHotkeysConfig[input.dataset.action]; input.title = ''; document.removeEventListener('keydown', input._captureHotkey, true); return; } const newCombo = getHotkeyCombo(e); if (['Control', 'Shift', 'Alt'].includes(e.key) && newCombo.split('+').length < 2) { return; } const existingAction = Object.keys(tempHotkeysConfig).find(key => tempHotkeysConfig[key] === newCombo && key !== input.dataset.action); if (existingAction) { UI.createNotification(`Conflito! O atalho '${newCombo}' já está em uso por ${featureDescriptions[existingAction].title}.`, 'error', 5000); input.value = tempHotkeysConfig[input.dataset.action]; } else if (newCombo.split('+').length < 2) { UI.createNotification("O atalho deve conter pelo menos um modificador (Ctrl, Shift, Alt) e uma tecla.", 'warn', 4000); input.value = tempHotkeysConfig[input.dataset.action]; } else { tempHotkeysConfig[input.dataset.action] = newCombo; input.value = newCombo; UI.createNotification(`Atalho para ${feature.title} salvo temporariamente. Clique em 'Salvar e Fechar' para confirmar.`, 'info', 3000); } input.classList.remove('listening'); input.title = ''; document.removeEventListener('keydown', input._captureHotkey, true); }; input._captureHotkey = captureHotkey; input.addEventListener('click', () => { if (input.classList.contains('listening')) { input.classList.remove('listening'); input.value = tempHotkeysConfig[input.dataset.action]; input.title = ''; document.removeEventListener('keydown', input._captureHotkey, true); return; } hotkeyList.querySelectorAll('.hotkey-input.listening').forEach(i => { i.classList.remove('listening'); i.value = tempHotkeysConfig[i.dataset.action]; i.title = ''; document.removeEventListener('keydown', i._captureHotkey, true); }); input.classList.add('listening'); input.value = 'Pressione o atalho...'; input.title = 'Pressione ESC para cancelar'; document.addEventListener('keydown', input._captureHotkey, true); }); }); };
            const switchTab = (tabId) => { 
                panel.querySelectorAll('.purecloud-script-tab-button').forEach(btn => btn.classList.remove('active')); 
                panel.querySelectorAll('.purecloud-script-tab-content').forEach(content => content.classList.remove('active')); 
                const targetTabBtn = panel.querySelector(`.purecloud-script-tab-button[data-tab="${tabId}"]`); 
                const targetTabContent = panel.querySelector(`[data-tab-content="${tabId}"]`); 
                if (targetTabBtn) targetTabBtn.classList.add('active'); 
                if (targetTabContent) targetTabContent.classList.add('active'); 
                
                if (tabId === 'general') { 
                    panel.querySelector('#conversation-target').value = CONFIG.CONVERSATION_TARGET; 
                    panel.querySelector('#dark-mode-toggle').checked = CONFIG.DARK_MODE; 
                    panel.querySelector('#sound-alerts-toggle').checked = CONFIG.SOUND_ALERTS_ENABLED; 
                    panel.querySelector('#inactivity-client-alert-seconds').value = CONFIG.INACTIVITY_CLIENT_ALERT_SECONDS; 
                    panel.querySelector('#inactivity-operator-alert-seconds').value = CONFIG.INACTIVITY_OPERATOR_ALERT_SECONDS; 
                    panel.querySelector('#long-convo-alert-min').value = CONFIG.LONG_CONVO_ALERT_MIN; 
                } else if (tabId === 'analytics') { 
                    UI.renderAnalyticsContent(targetTabContent); 
                } else if (tabId === 'details') { 
                    UI.renderDetailsContent(targetTabContent); 
                } else if (tabId === 'closed') { 
                    UI.renderClosedDetailsContent(targetTabContent); // NOVO: Carrega conteúdo da aba Encerrados
                } else if (tabId === 'hotkeys') { 
                    renderHotkeys(targetTabContent); 
                } else if (tabId === 'theme') { 
                    UI.renderThemeContent(targetTabContent, tempThemeColors); 
                } 
                
                if (tabId !== 'hotkeys') { panel.querySelectorAll('.hotkey-input.listening').forEach(i => { i.classList.remove('listening'); i.value = tempHotkeysConfig[i.dataset.action]; i.title = ''; document.removeEventListener('keydown', i._captureHotkey, true); }); } 
            };
            panel.querySelectorAll('.purecloud-script-tab-button').forEach(btn => { btn.onclick = () => switchTab(btn.dataset.tab); });
            const generalTab = panel.querySelector('[data-tab-content="general"]');
            
            // --- ABA GERAL (v1.0.27) ---
            generalTab.innerHTML = `<div class="settings-group"><label for="conversation-target">Meta Conversas Diárias:</label><input type="number" id="conversation-target" value="${CONFIG.CONVERSATION_TARGET}" min="1"></div>
            <div class="settings-group"><label>Modo Escuro:</label><label class="switch"><input type="checkbox" id="dark-mode-toggle" ${CONFIG.DARK_MODE ? 'checked' : ''}><span class="slider round"></span></label></div>
            <div class="settings-group"><label>Alertas Sonoros (Inatividade):</label><label class="switch"><input type="checkbox" id="sound-alerts-toggle" ${CONFIG.SOUND_ALERTS_ENABLED ? 'checked' : ''}><span class="slider round"></span></label></div>
            <div class="settings-group"><label for="inactivity-client-alert-seconds">Alerta Inatividade CLIENTE (seg, min 30):</label><input type="number" id="inactivity-client-alert-seconds" value="${CONFIG.INACTIVITY_CLIENT_ALERT_SECONDS}" min="30"></div>
            <div class="settings-group"><label for="inactivity-operator-alert-seconds">Alerta Inatividade OPERADOR (seg, min 10):</label><input type="number" id="inactivity-operator-alert-seconds" value="${CONFIG.INACTIVITY_OPERATOR_ALERT_SECONDS}" min="10"></div>
            <div class="settings-group"><label for="long-convo-alert-min">Alerta Conversa Longa (min, min 5):</label><input type="number" id="long-convo-alert-min" value="${CONFIG.LONG_CONVO_ALERT_MIN}" min="5"></div>
            <div class="settings-group"><h4>Contadores Diários:</h4><button id="reset-counter-btn" class="purecloud-script-button button-danger">Resetar Contadores/Dados do Dia</button><p style="font-size: 0.85em; margin-top: 5px; color: var(--purecloud-script-text-secondary);">Zera contagem, TMA, TME, lista de atendimentos e histórico de encerramentos.</p></div>`; 
            
            panel.querySelector('#reset-counter-btn').onclick = () => { if (confirm("Tem certeza?")) { analyticsManager.clearAllData(); UI.renderDetailsContent(panel.querySelector('[data-tab-content="details"]')); UI.renderAnalyticsContent(panel.querySelector('[data-tab-content="analytics"]')); UI.renderClosedDetailsContent(panel.querySelector('[data-tab-content="closed"]')); } };
            panel.querySelector('[data-tab-content="analytics"]').innerHTML = `<div id="analytics-content-main"><button id="load-stats-btn" class="purecloud-script-button">Carregar Estatísticas</button><p style="margin-top: 10px;">Atualize as estatísticas.</p></div>`; panel.querySelector('#load-stats-btn').onclick = () => { UI.renderAnalyticsContent(panel.querySelector('[data-tab-content="analytics"]')); };
            
            panel.querySelector('#save-settings-btn').onclick = () => {
                CONFIG.CONVERSATION_TARGET = validateConfigValue('CONVERSATION_TARGET', panel.querySelector('#conversation-target').value);
                CONFIG.INACTIVITY_CLIENT_ALERT_SECONDS = validateConfigValue('INACTIVITY_CLIENT_ALERT_SECONDS', panel.querySelector('#inactivity-client-alert-seconds').value);
                CONFIG.INACTIVITY_OPERATOR_ALERT_SECONDS = validateConfigValue('INACTIVITY_OPERATOR_ALERT_SECONDS', panel.querySelector('#inactivity-operator-alert-seconds').value);
                CONFIG.LONG_CONVO_ALERT_MIN = validateConfigValue('LONG_CONVO_ALERT_MIN', panel.querySelector('#long-convo-alert-min').value);
                CONFIG.DARK_MODE = validateConfigValue('DARK_MODE', panel.querySelector('#dark-mode-toggle').checked);
                CONFIG.SOUND_ALERTS_ENABLED = validateConfigValue('SOUND_ALERTS_ENABLED', panel.querySelector('#sound-alerts-toggle').checked);
                CONFIG.HOTKEYS = validateConfigValue('HOTKEYS', tempHotkeysConfig);
                CONFIG.THEME_COLORS = validateConfigValue('THEME_COLORS', tempThemeColors);
                saveData();
                UI.createNotification("Configurações salvas!", "success");
                panel.remove();
                document.getElementById('purecloud-script-injected-style')?.remove();
                injectCss();
                document.getElementById('purecloud-script-mini-dashboard')?.classList.toggle('pc-script-dark-mode', CONFIG.DARK_MODE);
                document.getElementById('purecloud-script-notification-container')?.classList.toggle('pc-script-dark-mode', CONFIG.DARK_MODE);
                const toolbarEl = findEl(CONFIG.PURECLOUD_SELECTORS.TOOLBAR);
                if (toolbarEl) { toolbarEl.dataset.scriptVersion = ''; createToolbarUI(toolbarEl); }
            };
            switchTab('analytics');
        },
        createMiniDashboard() {
            if (!CONFIG.MINI_DASHBOARD_VISIBLE) {
                const dashboard = document.getElementById('purecloud-script-mini-dashboard');
                if (dashboard && dashboard._updateInterval) { clearInterval(dashboard._updateInterval); }
                dashboard?.remove(); return;
            }
            let dashboard = document.getElementById('purecloud-script-mini-dashboard');
            if (!dashboard) {
                dashboard = document.createElement('div');
                dashboard.id = 'purecloud-script-mini-dashboard';
                dashboard.className = 'purecloud-script-popup';
                dashboard.classList.toggle('pc-script-dark-mode', CONFIG.DARK_MODE);
                document.body.appendChild(dashboard);
                
                // HTML Atualizado (Métrica Balão)
                dashboard.innerHTML = `<div class="mini-dashboard-header"><div class="counter-display"><span class="counter-text">--/--</span><div class="progress-bar-container-compact"><div class="progress-bar-compact"></div></div></div><div class="mini-dashboard-controls"><button id="mini-dashboard-adjust-attended-btn" class="compact-btn adjust-btn" title="Ajustar Contagem"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button><button class="compact-btn toggle-expand-btn" title="Expandir/Recolher"><svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg><svg class="collapse-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px; display: none;"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg></button><button class="compact-btn close-btn" id="closeMiniDashboardBtn" title="Fechar">X</button></div></div>
                <div class="mini-dashboard-content">
                    <div class="stats-grid-original mini-dashboard-stats-grid">
                        <div class="stat-item-original"><span>Conversas (Únicas)</span><strong id="dashboard-conv-count">--</strong></div>
                        <div class="stat-item-original"><span>TMA</span><strong id="dashboard-tma">--:--</strong></div>
                        <div class="stat-item-original"><span>TME</span><strong id="dashboard-tme">--:--</strong></div>
                        <div class="stat-item-original" title="Cliques no botão 'Mensagens de Término' (Balão)"><span>Balão (Término)</span><strong id="dashboard-balao-clicks">--</strong></div>
                    </div>
                </div>`;
                
                const dashboardHeader = dashboard.querySelector('.mini-dashboard-header');
                makeDraggable(dashboard, dashboardHeader, 'miniDashboard');
                
                // Função de Atualização Interna
                dashboard._updateStatsInternal = () => {
                    if (!dashboard.isConnected) { clearInterval(dashboard._updateInterval); return; } 
                    const stats = analyticsManager.calculateStats(); 
                    const progress = (stats.count / CONFIG.CONVERSATION_TARGET) * 100;
                    const counterTextEl = dashboard.querySelector('.counter-text'); 
                    if(counterTextEl) counterTextEl.textContent = `${stats.count}/${CONFIG.CONVERSATION_TARGET}`; 
                    const progressBarEl = dashboard.querySelector('.progress-bar-compact'); 
                    if(progressBarEl) progressBarEl.style.width = `${Math.min(100, progress)}%`;
                    
                    if (CONFIG.MINI_DASHBOARD_MAXIMIZED) {
                        const currentTmaSeconds = Math.floor(stats.tma.split(':').reduce((acc, time) => (60 * acc) + +time, 0)); 
                        const targetTmaSeconds = CONFIG.LONG_CONVO_ALERT_MIN * 60; 
                        let tmaIndicator = currentTmaSeconds > 0 ? (currentTmaSeconds < targetTmaSeconds * 0.9 ? '▲' : (currentTmaSeconds > targetTmaSeconds * 1.1 ? '▼' : '●')) : '';
                        
                        const convCountElement = dashboard.querySelector('#dashboard-conv-count'); 
                        if (convCountElement) convCountElement.textContent = stats.count; 
                        const tmaElement = dashboard.querySelector('#dashboard-tma'); 
                        if (tmaElement) tmaElement.innerHTML = `${stats.tma} <span style="font-size: 0.8em; color: ${tmaIndicator === '▲' ? '#28a745' : tmaIndicator === '▼' ? '#dc3545' : '#ffc107'};">${tmaIndicator}</span>`; 
                        const tmeElement = dashboard.querySelector('#dashboard-tme'); 
                        if (tmeElement) tmeElement.textContent = stats.tme; 
                        
                        // NOVO: Atualiza a métrica Balão
                        const baloonClicksElement = dashboard.querySelector('#dashboard-balao-clicks'); 
                        if (baloonClicksElement) baloonClicksElement.textContent = stats.baloonClicks;
                    }
                };
                
                const toggleButton = dashboard.querySelector('.toggle-expand-btn');
                const expandIcon = dashboard.querySelector('.expand-icon');
                const collapseIcon = dashboard.querySelector('.collapse-icon');
                const toggleFloatingDashboard = (forceState = null) => {
                    const shouldExpand = forceState !== null ? forceState : !CONFIG.MINI_DASHBOARD_MAXIMIZED; CONFIG.MINI_DASHBOARD_MAXIMIZED = shouldExpand;
                    dashboard.classList.toggle('expanded', shouldExpand); dashboard.classList.toggle('collapsed', !shouldExpand);
                    expandIcon.style.display = shouldExpand ? 'none' : 'inline-block'; collapseIcon.style.display = shouldExpand ? 'inline-block' : 'none'; toggleButton.title = shouldExpand ? "Recolher" : "Expandir";
                    
                    if (!shouldExpand) { 
                        dashboard.style.width = ''; dashboard.style.height = ''; dashboard.style.resize = 'none'; 
                    } else {
                        const savedPosition = CONFIG.POPUP_POSITIONS['miniDashboard']; 
                        if (savedPosition && savedPosition.top && savedPosition.top !== 'auto') { 
                            dashboard.style.top = savedPosition.top; dashboard.style.left = savedPosition.left; 
                            dashboard.style.bottom = 'auto'; dashboard.style.right = 'auto'; 
                            dashboard.style.transform = 'none'; 
                        } else { 
                            dashboard.style.top = '50%'; dashboard.style.left = '50%'; 
                            dashboard.style.transform = 'translate(-50%, -50%)'; 
                            dashboard.style.bottom = 'auto'; dashboard.style.right = 'auto'; 
                        } 
                        // Impõe tamanho fixo e impede redimensionamento (Solicitação do usuário)
                        dashboard.style.width = '300px'; 
                        dashboard.style.height = 'auto'; 
                        dashboard.style.resize = 'none'; 
                    } 
                    
                    saveData(); 
                    dashboard._updateStatsInternal();
                };
                dashboard._toggleFloatingDashboard = toggleFloatingDashboard;
                dashboardHeader.onclick = (e) => {
                    if (e.target.closest('.compact-btn, #mini-dashboard-adjust-attended-btn')) { return; }
                    const wasDragging = dashboard.dataset.isDragging === 'true';
                    dashboard.dataset.isDragging = 'false';
                    if (!wasDragging && !CONFIG.MINI_DASHBOARD_MAXIMIZED) { toggleFloatingDashboard(true); }
                };
                toggleButton.onclick = (e) => { e.stopPropagation(); toggleFloatingDashboard(); };
                dashboard.querySelector('.close-btn').onclick = () => { clearInterval(dashboard._updateInterval); dashboard.remove(); CONFIG.MINI_DASHBOARD_VISIBLE = false; saveData(); };
                dashboard.querySelector('#mini-dashboard-adjust-attended-btn').onclick = (e) => {
                    e.stopPropagation(); const currentAttendedCount = analyticsManager.calculateStats().count; const newCount = prompt("Insira o novo número de conversas atendidas:", currentAttendedCount); if (newCount !== null && !isNaN(newCount)) { const parsedNewCount = parseInt(newCount, 10); if (parsedNewCount < 0) { UI.createNotification("O número deve ser positivo.", 'error', 4000); return; } let data = analyticsManager.getData(); const currentUniqueCount = analyticsManager.calculateStats().count; if(parsedNewCount < currentUniqueCount) { UI.createNotification("Use 'Resetar Contadores' nas Configurações para reduzir.", "warn", 7000); return; } if (parsedNewCount > currentUniqueCount) { const diff = parsedNewCount - currentUniqueCount; for (let i = 0; i < diff; i++) { data.conversations.push({ timestamp: Date.now() - (i * 1000), duration: CONFIG.CHECKMARK_THRESHOLD_MS + 5000, activeDuration: CONFIG.CHECKMARK_THRESHOLD_MS + 2000, participantName: `Ajuste Manual ${Date.now()}`, phoneNumber: `000000000${i}`, isRecurrence: false, endedByAgent: 'AVALIACAO', interactionUrl: 'Ajuste Manual' }); } analyticsManager.saveData(data); } dashboard._updateStatsInternal(); }
                };
                toggleFloatingDashboard(CONFIG.MINI_DASHBOARD_MAXIMIZED);
                if (dashboard._updateInterval) { clearInterval(dashboard._updateInterval); }
                dashboard._updateInterval = setInterval(dashboard._updateStatsInternal, 5000);
                dashboard._updateStatsInternal();
            } else {
                if (dashboard._updateStatsInternal) { dashboard._updateStatsInternal(); }
                dashboard.classList.toggle('pc-script-dark-mode', CONFIG.DARK_MODE);
            }
        },
    };

    function injectCss() {
        document.getElementById('purecloud-script-injected-style')?.remove();
        const theme = validateConfigValue('THEME_COLORS', CONFIG.THEME_COLORS);
        const css = `
            :root {
                --purecloud-script-bg-primary: ${theme.bgPrimary}; --purecloud-script-bg-secondary: ${theme.bgSecondary};
                --purecloud-script-text-primary: ${theme.textPrimary}; --purecloud-script-text-secondary: ${theme.textSecondary};
                --purecloud-script-border-color: ${theme.borderColor}; --purecloud-script-accent-color: ${theme.accent};
                --purecloud-script-accent-text: ${theme.accentText};
                --purecloud-script-success-color: ${theme.success}; --purecloud-script-error-color: ${theme.error};
                --purecloud-script-warn-color: ${theme.warn}; --purecloud-script-info-color: ${theme.info};
                --purecloud-script-bubble-bg-normal: ${theme.timerBg};
                --purecloud-script-bubble-bg-selected: ${theme.accent};
                --purecloud-script-bubble-text-normal: ${theme.timerNormalText};
                --purecloud-script-bubble-text-active: ${theme.timerActiveText};
                --purecloud-script-bubble-text-paused: ${theme.timerPausedText};
                --purecloud-script-bubble-text-timer-inactive: ${theme.timerInactiveClientText};
                --purecloud-script-shadow-color: rgba(0,0,0,0.15);
                --mini-dashboard-progress-color: ${theme.miniDashboardProgress};
                --purecloud-script-tag-highlight-color: #f44336;
            }
            .pc-script-dark-mode {
                --purecloud-script-bg-primary: #1e1e1e !important; --purecloud-script-bg-secondary: #252526 !important;
                --purecloud-script-text-primary: #f0f0f0 !important; --purecloud-script-text-secondary: #aaaaaa !important;
                --purecloud-script-border-color: #3b3b3b !important;
                --purecloud-script-accent-color: #555555 !important;
                --purecloud-script-shadow-color: rgba(0,0,0,0.8) !important;
            }
            .purecloud-script-button { background-color: var(--purecloud-script-accent-color); color: var(--purecloud-script-accent-text); border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; font-size: 0.9em; font-weight: bold; transition: filter 0.2s ease, transform 0.1s ease, background-color 0.2s; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2); }
            .purecloud-script-button:hover { filter: brightness(1.1); }
            .purecloud-script-notification { position: relative; z-index: 10005; width: 320px; padding: 15px 20px; margin: 10px; border-radius: 5px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); color: #fff; font-size: 0.9em; font-weight: 600; opacity: 0.95; transition: opacity 0.3s, transform 0.3s; animation: fadeInRight 0.3s ease-out; background-color: var(--purecloud-script-bg-secondary); color: var(--purecloud-script-text-primary); }
            #purecloud-script-notification-container { position: fixed; top: 10px; right: 10px; z-index: 10004; }
            @keyframes fadeInRight { from { opacity: 0; transform: translateX(100%); } to { opacity: 0.95; transform: translateX(0); } }
            .purecloud-script-notification-success { background-color: var(--purecloud-script-success-color); color: #fff; }
            .purecloud-script-notification-error { background-color: var(--purecloud-script-error-color); color: #fff; }
            .purecloud-script-notification-info { background-color: var(--purecloud-script-info-color); color: var(--purecloud-script-text-primary); }
            .purecloud-script-notification-warn { background-color: var(--purecloud-script-warn-color); color: #222; }
            .injected-element { font-family: inherit; font-weight: 600; font-size: 11px !important; padding: 1px 6px !important; border-radius: 4px; display: flex; align-items: center; justify-content: center; height: 19px; line-height: 1; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.05) !important; transition: background-color 0.2s, color 0.2s; white-space: nowrap; background-color: var(--purecloud-script-bubble-bg-normal) !important; color: var(--purecloud-script-bubble-text-normal) !important; border-color: rgba(255, 255, 255, 0.1) !important; }
            
            .injected-bubbles-container { position: absolute; bottom: 4px; left: 10px; display: flex; gap: 4px; z-index: 10; pointer-events: none; user-select: none; }
            .interaction-content-wrapper, .interaction-content { position: relative !important; padding-bottom: 25px !important; }

            .injected-conversation-number { min-width: 19px; padding: 1px 7px !important; }
            
            .injected-interaction-icon {
                padding: 1px 4px !important;
                font-size: 10px !important;
            }

            .injected-bubbles-container:has(.injected-conversation-timer.normal-timer) .injected-conversation-number,
            .injected-bubbles-container:has(.injected-conversation-timer.normal-timer) .injected-interaction-icon,
            .injected-conversation-timer.normal-timer { color: var(--purecloud-script-bubble-text-active) !important; }
            
            .injected-bubbles-container:has(.injected-conversation-timer.paused-alert) .injected-conversation-number,
            .injected-bubbles-container:has(.injected-conversation-timer.paused-alert) .injected-interaction-icon,
            .injected-conversation-timer.paused-alert { color: var(--purecloud-script-bubble-text-paused) !important; }
            
            .injected-bubbles-container:has(.injected-conversation-timer.inactive-client-alert) .injected-conversation-number,
            .injected-bubbles-container:has(.injected-conversation-timer.inactive-client-alert) .injected-interaction-icon,
            .injected-conversation-timer.inactive-client-alert,
            .injected-bubbles-container:has(.injected-conversation-timer.inactive-operator-alert) .injected-conversation-number,
            .injected-bubbles-container:has(.injected-conversation-timer.inactive-operator-alert) .injected-interaction-icon,
            .injected-conversation-timer.inactive-operator-alert { color: var(--purecloud-script-bubble-text-timer-inactive) !important; }
            
            .injected-checkmark { background-color: ${theme.timerCompletedBg === defaultThemeColors.timerBg ? 'var(--purecloud-script-success-color)' : 'var(--purecloud-script-bubble-bg-completed)'} !important; color: ${theme.timerCompletedBg === defaultThemeColors.timerBg ? '#ffffff' : 'var(--purecloud-script-bubble-text-normal)'} !important; border-color: transparent !important; }
            
            .injected-recurrence-icon {
                background-color: var(--purecloud-script-warn-color) !important;
                color: #222 !important;
                font-size: 10px !important;
            }
            div.interaction-group.is-selected .injected-recurrence-icon {
                background-color: var(--purecloud-script-bubble-bg-selected) !important;
                color: var(--purecloud-script-warn-color) !important;
            }

            div.interaction-group.is-selected .injected-element { background-color: var(--purecloud-script-bubble-bg-selected) !important; border-color: rgba(255, 255, 255, 0.15) !important; }
            div.interaction-group.is-selected .injected-bubbles-container:not(:has(.normal-timer, .paused-alert, .inactive-client-alert, .inactive-operator-alert)) .injected-element { color: var(--purecloud-script-accent-text) !important; }
            .theme-section { margin-bottom: 20px; }
            .theme-section h4 { margin-bottom: 10px; padding-bottom: 5px; border-bottom: 1px solid var(--purecloud-script-border-color); color: var(--purecloud-script-text-primary); }
            .settings-group.color-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
            .color-picker-group { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; background: var(--purecloud-script-bg-secondary); border: 1px solid var(--purecloud-script-border-color); border-radius: 4px; }
            .color-picker-group label { margin-bottom: 0; font-size: 0.85em; color: var(--purecloud-script-text-secondary); margin-right: 10px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .color-picker-group input[type="color"] { min-width: 40px; height: 25px; padding: 1px; border: 1px solid var(--purecloud-script-border-color); cursor: pointer; background: var(--purecloud-script-bg-primary); border-radius: 3px; flex-shrink: 0; }
            .color-picker-group input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
            .color-picker-group input[type="color"]::-webkit-color-swatch { border: none; border-radius: 2px; }
            .progress-bar-compact { background-color: var(--mini-dashboard-progress-color); height: 100%; transition: width 0.5s ease-out; }
            
            .purecloud-script-custom-btn { background: var(--purecloud-script-bg-secondary) !important; border: 1px solid var(--purecloud-script-border-color) !important; padding: 5px 8px !important; margin: 0 2px !important; cursor: pointer; display: inline-flex; align-items: center; transition: all .2s; height: 30px; order: 3; color: var(--purecloud-script-text-secondary) !important; border-radius: 4px; font-size: 14px; text-decoration: none; position: relative; overflow: hidden; }
            .purecloud-script-custom-btn:hover { color: var(--purecloud-script-text-primary) !important; background-color: var(--purecloud-script-border-color) !important; box-shadow: 0 0 8px var(--purecloud-script-accent-color); transform: translateY(-1px); }
            
            .purecloud-script-custom-btn:active { background-color: var(--purecloud-script-accent-color) !important; color: var(--purecloud-script-accent-text) !important; box-shadow: inset 0 0 5px rgba(0,0,0,0.2); transform: translateY(0); }
            .purecloud-script-custom-btn svg { stroke: currentColor !important; width: 18px; height: 18px; margin-right: 0px !important; flex-shrink: 0; }
            .purecloud-script-custom-btn#purecloud-script-btn-toggleLock.lockdown-unlocked { cursor: default !important; opacity: 0.7; color: var(--purecloud-script-success-color) !important; background-color: var(--purecloud-script-bg-secondary) !important; box-shadow: none !important; transform: none !important; }
            .purecloud-script-custom-btn#purecloud-script-btn-toggleLock.lockdown-unlocked:hover { color: var(--purecloud-script-success-color) !important; background-color: var(--purecloud-script-bg-secondary) !important; }
            .purecloud-script-popup { position: fixed; background: var(--purecloud-script-bg-primary); border-radius: 8px; box-shadow: 0 8px 30px var(--purecloud-script-shadow-color); z-index: 10002; display: flex; flex-direction: column; border: 1px solid var(--purecloud-script-border-color); transition: opacity 0.2s, transform 0.2s, height 0.3s ease-in-out, width 0.3s ease-in-out, background-color 0.2s, border-radius 0.3s ease-in-out; margin: 0; overflow: hidden; }
            .purecloud-script-settings-panel { resize: none; width: 90%; max-width: 800px; min-height: 500px; height: 85vh; }
            .panel-header { cursor: move; background: var(--purecloud-script-bg-secondary); padding: 10px 15px; border-bottom: 1px solid var(--purecloud-script-border-color); display: flex; justify-content: space-between; align-items: center; border-radius: 8px 8px 0 0; }
            .panel-header h2, .panel-header h3 { margin: 0; color: var(--purecloud-script-text-primary); font-size: 16px; font-weight: 600; }
            .panel-header-buttons { display: flex; gap: 5px; } .panel-header-btn { background: none; border: none; font-size: 1.2em; cursor: pointer; color: var(--purecloud-script-text-secondary); padding: 0 5px; } .panel-header-btn:hover { color: var(--purecloud-script-text-primary); }
            .panel-content { padding: 15px; overflow-y: auto; flex-grow: 1; background: var(--purecloud-script-bg-primary); color: var(--purecloud-script-text-primary); }
            .panel-footer { padding: 10px 15px; background: var(--purecloud-script-bg-secondary); border-top: 1px solid var(--purecloud-script-border-color); text-align: right; border-radius: 0 0 8px 8px; }
            .purecloud-script-button.button-danger { background-color: var(--purecloud-script-error-color); color: #fff; }
            .purecloud-script-tabs { display: flex; background: var(--purecloud-script-bg-secondary); border-bottom: 1px solid var(--purecloud-script-border-color); padding-left: 10px; }
            .purecloud-script-tab-button { background-color: transparent; color: var(--purecloud-script-text-secondary); border: none; padding: 10px 15px; cursor: pointer; margin-right: 0px; transition: color 0.2s ease, border-bottom 0.2s ease; font-size: 0.95em; font-weight: 500; }
            .purecloud-script-tab-button.active { background-color: transparent; border-bottom: 2px solid var(--purecloud-script-accent-color); color: var(--purecloud-script-text-primary); font-weight: bold; }
            .purecloud-script-tab-button:hover:not(.active) { color: var(--purecloud-script-text-primary); } .purecloud-script-tab-content { display: none; padding-top: 15px; flex-direction: column; flex-grow: 1;} .purecloud-script-tab-content.active { display: flex; }
            .settings-group { margin-bottom: 20px; display: flex; flex-direction: column; } .settings-group label { color: var(--purecloud-script-text-secondary); font-size: 0.9em; margin-bottom: 5px; font-weight: 600; }
            .settings-group input[type="number"], .settings-group input[type="text"] { background: var(--purecloud-script-bg-primary); color: var(--purecloud-script-text-primary); border: 1px solid var(--purecloud-script-border-color); padding: 8px 10px; border-radius: 4px; transition: border-color 0.2s; width: 100%; box-sizing: border-box; }
            .settings-group input:focus { border-color: var(--purecloud-script-accent-color); outline: none; box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2); }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; text-align: center; margin-bottom: 20px; } .stat-item { background: var(--purecloud-script-bg-secondary); padding: 15px; border-radius: 4px; border-left: 3px solid var(--purecloud-script-accent-color); } .stat-item span { font-size: 0.8em; color: var(--purecloud-script-text-secondary); } .stat-item strong { font-size: 1.5em; display: block; margin-top: 5px; color: var(--purecloud-script-text-primary); }
            .analytics-chart-container-main { padding: 15px 0 5px 0; } .chart-scroll-container { overflow-x: auto; width: 100%; padding-bottom: 5px; } .chart-bars-wrapper { display: flex; align-items: flex-end; height: 150px; min-width: 800px; padding-bottom: 20px; border-bottom: 1px solid var(--purecloud-script-border-color); } .chart-bar-wrapper { width: 4.1666%; margin-right: 1px; text-align: center; position: relative; font-size: 0.7em; height: 100%; flex-shrink: 0; } .chart-bar { background-color: var(--purecloud-script-accent-color); border-radius: 2px 2px 0 0; transition: height 0.3s; } .bar-count { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); font-size: 0.8em; font-weight: bold; color: var(--purecloud-script-text-primary); } .bar-label { position: absolute; bottom: -15px; left: 0; width: 100%; color: var(--purecloud-script-text-secondary); }
            .panel-content h4 { color: var(--purecloud-script-text-primary); font-size: 1.1em; margin-top: 15px; margin-bottom: 10px; border-bottom: 1px solid var(--purecloud-script-border-color); padding-bottom: 5px; }
            div.interaction-group{position:relative!important;} 
            #purecloud-script-mini-dashboard { padding: 0; background-color: var(--purecloud-script-bg-secondary) !important; box-shadow: 0 4px 10px var(--purecloud-script-shadow-color); border: 1px solid var(--purecloud-script-border-color); resize: none; }
            #purecloud-script-mini-dashboard.collapsed { width: auto; min-width: 70px; height: 35px; border-radius: 50px; cursor: move; overflow: hidden; padding: 0 12px; }
            #purecloud-script-mini-dashboard.expanded { min-width: 300px; max-width: 300px; border-radius: 8px; cursor: default; resize: none; bottom: auto; left: auto; padding: 0; }
            .mini-dashboard-header { background-color: transparent; padding: 0; display: flex; align-items: center; justify-content: center; height: 100%; cursor: move; border-bottom: none; border-radius: inherit; transition: background-color 0.2s, justify-content 0.2s; }
            #purecloud-script-mini-dashboard.collapsed .mini-dashboard-header { cursor: move; }
            #purecloud-script-mini-dashboard.expanded .mini-dashboard-header { background-color: var(--purecloud-script-bg-secondary); border-bottom: 1px solid var(--purecloud-script-border-color); cursor: move; height: 35px; padding: 5px 10px; justify-content: space-between; }
            .mini-dashboard-content { padding: 10px; background-color: var(--purecloud-script-bg-primary); border-top: none; border-radius: 0 0 8px 8px; flex-grow: 1; overflow-y: auto; display: none; }
            #purecloud-script-mini-dashboard.expanded .mini-dashboard-content { display: block; }
            .counter-display { display: flex; align-items: center; flex-grow: 1; margin-right: 0; overflow: hidden; justify-content: center; }
            #purecloud-script-mini-dashboard.expanded .counter-display { justify-content: flex-start; margin-right: 5px; }
            .counter-text { color: var(--purecloud-script-text-primary); font-weight: bold; font-size: 1.1em; white-space: nowrap; }
            #purecloud-script-mini-dashboard.expanded .counter-text { margin-right: 10px; }
            .progress-bar-container-compact { flex-grow: 1; height: 4px; background-color: var(--purecloud-script-border-color); border-radius: 2px; overflow: hidden; display: none; }
            #purecloud-script-mini-dashboard.expanded .progress-bar-container-compact { display: block; }
            .mini-dashboard-controls { display: flex; align-items: center; gap: 5px; }
            #purecloud-script-mini-dashboard.collapsed .mini-dashboard-controls { display: none; }
            #purecloud-script-mini-dashboard.expanded .mini-dashboard-controls { display: flex; }
            .compact-btn { background: var(--purecloud-script-bg-primary); border: 1px solid var(--purecloud-script-border-color); color: var(--purecloud-script-text-secondary); border-radius: 4px; cursor: pointer; height: 25px; width: 25px; display: flex; align-items: center; justify-content: center; font-size: 0.8em; padding: 0; }
            .compact-btn:hover { color: var(--purecloud-script-text-primary); background-color: var(--purecloud-script-border-color); }
            /* --- Grid 2x2 do Mini-Dashboard --- */
            .stats-grid-original.mini-dashboard-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin: 0; }
            .stat-item-original { text-align: center; background-color: var(--purecloud-script-bg-secondary); padding: 8px; border-radius: 4px; margin: 0; display: block; font-size: 0.8em; line-height: 1.2; } .stat-item-original span { display: block; color: var(--purecloud-script-text-secondary); font-size: 0.9em; } .stat-item-original strong { font-size: 1.1em; color: var(--purecloud-script-text-primary); }
            .hotkey-group { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding: 5px; border: 1px solid var(--purecloud-script-border-color); border-radius: 4px; } .hotkey-group label { flex-grow: 1; margin-right: 10px; font-weight: bold; } .hotkey-input { padding: 5px 8px; border: 1px solid var(--purecloud-script-border-color); border-radius: 4px; text-align: center; cursor: pointer; background: var(--purecloud-script-bg-secondary); color: var(--purecloud-script-text-primary); transition: background-color 0.2s, border-color 0.2s; } .hotkey-input.listening { background-color: var(--purecloud-script-warn-color); color: #222; border-color: var(--purecloud-script-warn-color); cursor: wait; box-shadow: 0 0 5px var(--purecloud-script-warn-color); }
            .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--purecloud-script-border-color); transition: .4s; }
            .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; }
            input:checked + .slider { background-color: var(--purecloud-script-success-color); }
            input:focus + .slider { box-shadow: 0 0 1px var(--purecloud-script-success-color); }
            input:checked + .slider:before { transform: translateX(20px); }
            .slider.round { border-radius: 24px; }
            .slider.round:before { border-radius: 50%; }
        `;
        const style = document.createElement('style'); style.id = 'purecloud-script-injected-style'; document.head.appendChild(style); style.textContent = css;
    }

    // --- FUNÇÃO MODIFICADA (v1.0.27_MOD_5_FIX) ---
    function initializeDailyCounters(forceReset = false) {
        // Usa o formato YYYY-MM-DD para evitar problemas de fuso horário na comparação de "novo dia"
        const todayKey = getBrazilTime(new Date()).toISOString().split('T')[0];

        // Pega a chave que o script salvou pela última vez
        const lastSavedDate = localStorage.getItem('purecloudScript_lastActivityDate');

        // Se a data de hoje for diferente da data salva, ou se forceReset for true
        if (lastSavedDate !== todayKey || forceReset) { 
            localStorage.setItem('purecloudScript_lastActivityDate', todayKey); 
            analyticsManager.clearAllData(); // ZERA TODOS OS CONTADORES
        } else { 
            analyticsManager.getData(); 
            loadV4Counters();
        } 
    }
    // --- FIM DA MODIFICAÇÃO ---


    // ==========================================================
    // INÍCIO: FUNÇÃO DE SINCRONIZAÇÃO (V2.1 - AJUSTADA)
    // ==========================================================
    
    // URL DE LOG (copiada do Iniciar.js)
    const LOG_URL = 'https://script.google.com/macros/s/AKfycbwIRwR7V6eo2BWFQqtVfnomi5zn-VCFe76ltXLN25eYcAqPn4nakZDxv1QdWPvOXz12vA/exec'; // SUA URL DE IMPLANTAÇÃO
    
    // Esta função envia todos os dados para a planilha
    function sincronizarDadosComPlanilha() {
        console.log('[Sincronização V2.1] Iniciando envio de dados para a planilha...');
        try {
            // 1. Verifica se os objetos estão prontos
            if (typeof window.analyticsManager === 'undefined' || typeof window.v4_counters === 'undefined') {
                console.warn('[Sincronização] Analytics não está pronto. Tentando novamente no próximo ciclo.');
                return;
            }

            // 2. Pega o nome do usuário
            let currentUserName = "Usuário Anônimo";
            let userEl = document.querySelector('div.name span.entry-value');
            if (userEl) {
                currentUserName = userEl.innerText;
            }

            // 3. Envio de Analytics (Os dados de resumo que decidimos IGNORAR no V2.1)
            const stats = window.analyticsManager.calculateStats();
            const analyticsPayload = {
                conversasUnicas: stats.count,
                tmaGeral: stats.tma,
                tmeAtivo: stats.tme,
                encAgente: stats.baloonClicks, 
                inicio: stats.last, 
                ultima: stats.first, 
                meta: window.CONFIG ? window.CONFIG.CONVERSATION_TARGET : 45,
                transferidos: stats.transferClicks,
                tmaGeralSegundos: stats.tmaSeconds || 0,
                tmeAtivoSegundos: stats.tmeSeconds || 0
            };
            // Nota: O Cérebro V2.1 vai receber isto e ignorar, como pedimos.
            fetch(LOG_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ type: 'analytics', user: currentUserName, stats: analyticsPayload }) });

            // 4. Envio de Atendimentos (O MAIS IMPORTANTE)
            const atendimentosPayload = window.analyticsManager.getData().conversations.map(conv => ({
                tipo: conv.interactionType || 'unknown',
                horaFim: new Date(conv.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                cliente: conv.participantName,
                // TME (Texto)
                tme: (() => {
                    const s = Math.floor(conv.activeDuration / 1000);
                    return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`
                })(),
                // *** ADIÇÃO IMPORTANTE (V2.1) ***
                // TME (Segundos) - O dado que faltava para os dashboards
                tmeSegundos: Math.floor(conv.activeDuration / 1000), 
                // **********************************
                recorrencia: conv.isRecurrence ? 'Sim' : 'Não',
                link: conv.interactionUrl || 'N/A'
            }));
            fetch(LOG_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ type: 'atendimento', user: currentUserName, atendimentos: atendimentosPayload }) });

            // 5. Envio de Encerrados (Balão)
            const encerradosBalao = window.v4_counters.balao;
            if (encerradosBalao && encerradosBalao.length > 0) {
                 fetch(LOG_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify({
                        type: 'encerrados',
                        user: currentUserName,
                        encerrados: encerradosBalao
                    })
                });
            }

            console.log(`[Sincronização V2.1] Dados de ${currentUserName} enviados com sucesso.`);

        } catch (e) {
            console.error('[Sincronização V2.1] Erro ao enviar dados:', e);
        }
    }
    // ==========================================================
    // FIM: FUNÇÃO DE SINCRONIZAÇÃO
    // ==========================================================


    const initialize = () => {
        initializeDailyCounters(); 
        saveData(); 
        injectCss(); 
        document.addEventListener('keydown', keyboardEventHandler); 
        document.addEventListener('click', () => soundPlayer.init(), { once: true });
        let targetNode = findEl(CONFIG.PURECLOUD_SELECTORS.CONVERSATION_LIST_CONTAINER); 
        if (!targetNode) { 
            targetNode = document.body; 
            log("WARN: Container de lista não encontrado. Usando document.body como alvo."); 
        } 
        const mainObserver = new MutationObserver(throttle(mainLoop, CONFIG.MAIN_LOOP_THROTTLE_MS)); 
        setTimeout(() => { mainObserver.observe(targetNode, { childList: true, subtree: true, attributes: true }); }, 500); 
        setTimeout(mainLoop, 100); 
        setTimeout(mainLoop, 1500); 
        setTimeout(mainLoop, 3500); 
        if (CONFIG.MINI_DASHBOARD_VISIBLE) { 
            setTimeout(() => { 
                UI.createMiniDashboard(); 
                UI.createNotification("Script operacional. Ctrl+Shift+S para Config.", 'info', 4000); 
            }, 4000); 
        }

        // ==========================================================
        // INÍCIO: MODIFICAÇÃO (ADICIONADO O INTERVALO)
        // ==========================================================
        
        // Espera 45 segundos para a primeira sincronização (para garantir que tudo carregou)
        setTimeout(sincronizarDadosComPlanilha, 45000); 

        // Define um loop (Interval) para sincronizar a cada 10 minutos
        // (10 minutos * 60 segundos * 1000 milissegundos)
        const DEZ_MINUTOS = 10 * 60 * 1000;
        setInterval(sincronizarDadosComPlanilha, DEZ_MINUTOS);
        
        console.log(`[Sincronização] Configurada. Os dados serão enviados para a planilha a cada 10 minutos.`);
        
        // ==========================================================
        // FIM: MODIFICAÇÃO
        // ==========================================================
    };

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initialize); } else { initialize(); }
    log(`Script PureCloud V${SCRIPT_VERSION} (Corrigido e Fundido) carregado com sucesso e pronto para uso.`);
})();
