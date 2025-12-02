// ==UserScript==
// @name         PureCloud - Monitor Pro (Módulo Extensão)
// @description  Monitor de filas com Busca e Horários precisos.
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. BASE DE DADOS COMPLETA (77 FILAS) ---
    const QUEUES_DB = [
        // --- AGENDAMENTO ---
        { label: "AGENDAMENTO INSTALAÇÃO DIGITAL", desc: "Agendamento via Chat.", channel: "Chat", sector: "Fibra", schedules: { wd: ["08:00", "17:00"], sat: ["08:00", "12:00"], sun: null } },
        { label: "AGENDAMENTO INSTALAÇÃO", desc: "Agendamento via Voz.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "17:00"], sat: ["08:00", "12:00"], sun: null } },
        { label: "AGENDAMENTO REPARO DIGITAL", desc: "Reparo via Chat.", channel: "Chat", sector: "Fibra", schedules: { wd: ["08:00", "17:48"], sat: ["08:00", "17:48"], sun: ["08:00", "17:48"] } },
        { label: "AGENDAMENTO REPARO", desc: "Reparo via Voz.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "17:48"], sat: ["08:00", "17:48"], sun: ["08:00", "17:48"] } },

        // --- BACKOFFICE ---
        { label: "BACKOFFICE 5G DIGITAL", desc: "N2 5G via Chat.", channel: "Chat", sector: "5G", schedules: { wd: ["08:00", "20:30"], sat: ["08:00", "20:30"], sun: null } },
        { label: "BACKOFFICE BRISAMOVEL", desc: "Suporte interno.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "17:40"], sat: ["08:00", "14:00"], sun: null } },
        { label: "BACKOFFICE GC", desc: "Gestão de Carteira.", channel: "Voz", sector: "5G", schedules: { wd: ["08:00", "21:50"], sat: ["08:00", "21:50"], sun: null } },
        { label: "BACKOFFICE LOJA", desc: "Suporte Lojas.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "20:40"], sat: ["08:00", "20:40"], sun: null } },
        { label: "BACKOFFICE MAPAS", desc: "Correção de Rede.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "18:50"], sat: ["08:00", "18:50"], sun: null } },
        { label: "BACKOFFICE MAPAS DIGITAL", desc: "Correção via Chat.", channel: "Chat", sector: "Fibra", schedules: { wd: ["08:00", "18:50"], sat: ["08:00", "18:50"], sun: null } },
        { label: "BACKOFFICE MAPAS/CORREÇÃO", desc: "Ajustes de cadastro.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "17:00"], sat: ["08:00", "17:00"], sun: null } },
        { label: "BACKOFFICE RETENCAO", desc: "Tratativa crítica.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "18:20"], sat: ["08:00", "18:20"], sun: ["08:00", "18:20"] } },
        
        // --- COBRANÇA ---
        { label: "COBRANÇA", desc: "Negociação Voz.", channel: "Voz", sector: "Fibra", schedules: { wd: ["07:00", "21:50"], sat: ["07:00", "21:50"], sun: ["07:00", "20:40"] } },
        { label: "COBRANÇA 5G", desc: "Negociação 5G.", channel: "Voz", sector: "5G", schedules: { wd: ["08:00", "21:40"], sat: ["08:00", "21:40"], sun: ["08:00", "20:40"] } },
        { label: "COBRANCA 5G CALL BACK", desc: "Retorno Noturno.", channel: "Voz", sector: "5G", schedules: { wd: ["21:50", "08:00"], sat: ["21:50", "08:00"], sun: ["20:40", "08:00"] } },
        { label: "COBRANCA 5G DIGITAL", desc: "Negociação Chat.", channel: "Chat", sector: "5G", schedules: { wd: ["08:00", "21:50"], sat: ["08:00", "21:50"], sun: ["08:00", "20:40"] } },
        { label: "COBRANCA 5G DIGITAL FH", desc: "Plantão Cobrança.", channel: "Chat", sector: "5G", schedules: { wd: ["21:50", "08:00"], sat: ["21:50", "08:00"], sun: ["20:00", "08:00"] } },
        { label: "COBRANÇA CORPORATIVO", desc: "Cobrança B2B.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "18:00"], sat: ["08:00", "18:00"], sun: null } },
        { label: "COBRANÇA CORPORATIVO DIGITAL", desc: "Cobrança B2B Chat.", channel: "Chat", sector: "Fibra", schedules: { wd: ["08:00", "18:00"], sat: ["08:00", "18:00"], sun: null } },
        { label: "COBRANCA DIGITAL", desc: "WhatsApp/Web.", channel: "Chat", sector: "Fibra", schedules: { wd: ["08:00", "21:50"], sat: ["08:00", "21:50"], sun: ["08:00", "20:40"] } },
        { label: "COBRANCA DIGITAL FH", desc: "Plantão Noturno.", channel: "Chat", sector: "Fibra", schedules: { wd: ["21:50", "08:00"], sat: ["21:50", "08:00"], sun: ["20:40", "08:00"] } },
        { label: "COBRANCA REVERSAO", desc: "Reversão Inadimplência.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "18:00"], sat: ["08:00", "18:00"], sun: null } },

        // --- COMERCIAL ---
        { label: "COMERCIAL 5G", desc: "Vendas Voz.", channel: "Voz", sector: "5G", schedules: { wd: ["08:00", "21:50"], sat: ["08:00", "21:50"], sun: ["08:00", "21:50"] } },
        { label: "COMERCIAL 5G DIGITAL", desc: "Vendas Chat.", channel: "Chat", sector: "5G", schedules: { wd: ["08:00", "22:00"], sat: ["08:00", "22:00"], sun: ["08:00", "21:00"] } },
        { label: "COMERCIAL 5G DIGITAL FH", desc: "Vendas Plantão.", channel: "Chat", sector: "5G", schedules: { wd: ["22:00", "08:00"], sat: ["22:00", "08:00"], sun: ["21:00", "08:00"] } },
        { label: "COMERCIAL B2C", desc: "Vendas Fibra Voz.", channel: "Voz", sector: "Fibra", schedules: { wd: ["07:00", "21:50"], sat: ["07:00", "21:50"], sun: ["07:00", "21:50"] } },
        { label: "COMERCIAL CORPORATIVO (B2B) DIGITAL", desc: "Vendas B2B Chat.", channel: "Chat", sector: "Fibra", schedules: { wd: ["08:00", "18:00"], sat: ["08:00", "17:00"], sun: null } },
        { label: "COMERCIAL CORPORATIVO (B2B)", desc: "Vendas B2B Voz.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "18:00"], sat: ["08:00", "16:00"], sun: null } },
        { label: "COMERCIAL CORPORATIVO GE DIGITAL", desc: "Grandes Empresas Chat.", channel: "Chat", sector: "Fibra", schedules: { wd: ["08:00", "18:00"], sat: null, sun: null } },
        { label: "COMERCIAL CORPORATIVO GE", desc: "Grandes Empresas Voz.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "18:00"], sat: null, sun: null } },
        { label: "COMERCIAL DIGITAL B2C", desc: "Vendas Online.", channel: "Chat", sector: "Fibra", schedules: { wd: ["08:00", "21:40"], sat: ["08:00", "21:40"], sun: ["08:00", "20:40"] } },
        { label: "INDIQUE UM AMIGO DIGITAL", desc: "Indicação Chat.", channel: "Chat", sector: "Fibra", schedules: { wd: ["08:00", "21:40"], sat: ["08:00", "21:40"], sun: ["08:00", "20:40"] } },
        { label: "INDIQUE UM AMIGO", desc: "Indicação Voz.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "21:50"], sat: ["08:00", "21:50"], sun: ["08:00", "21:50"] } },

        // --- OUTROS ---
        { label: "BRISA MÓVEL", desc: "Atendimento Móvel.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "17:40"], sat: ["08:00", "14:00"], sun: null } },
        { label: "BRISAMOVEL BACKOFFICE RECEPTIVO", desc: "Suporte N2 Móvel.", channel: "Voz", sector: "5G", schedules: { wd: ["08:00", "21:50"], sat: ["08:00", "21:50"], sun: ["08:00", "20:30"] } },
        { label: "OUVIDORIA", desc: "Resolução Final.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "18:00"], sat: ["08:00", "12:00"], sun: null } },
        { label: "PORTABILIDADE", desc: "Migração Voz.", channel: "Voz", sector: "5G", schedules: { wd: ["08:00", "20:40"], sat: ["08:00", "20:40"], sun: null } },
        { label: "PORTABILIDADE DIGITAL ATIVO", desc: "Migração Chat.", channel: "Chat", sector: "5G", schedules: { wd: ["08:00", "20:40"], sat: ["08:00", "20:40"], sun: null } },
        { label: "PORTABILIDADE DIGITAL ATIVO FH", desc: "Plantão Portabilidade.", channel: "Chat", sector: "5G", schedules: { wd: ["20:40", "08:00"], sat: ["20:40", "08:00"], sun: ["00:00", "23:59"] } },
        { label: "PÓS VENDAS", desc: "Acompanhamento.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "17:00"], sat: ["08:00", "14:20"], sun: null } },
        
        // --- SUPORTE E REDE ---
        { label: "REDES FTTH DIGITAL", desc: "Suporte Rede Chat.", channel: "Chat", sector: "Fibra", schedules: { wd: ["07:00", "19:00"], sat: ["07:00", "18:00"], sun: ["08:00", "18:00"] } },
        { label: "REDES FTTH", desc: "Suporte Rede Voz.", channel: "Voz", sector: "Fibra", schedules: { wd: ["07:00", "19:00"], sat: ["07:00", "18:00"], sun: ["08:00", "18:00"] } },
        { label: "RENTABILIZAÇÃO", desc: "Ofertas e Upgrades.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "21:50"], sat: ["08:00", "19:50"], sun: null } },
        { label: "RETENÇÃO", desc: "Anti-Cancelamento.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "21:50"], sat: ["08:00", "21:50"], sun: null } },
        { label: "RETENCAO 5G DIGITAL", desc: "Retenção Chat.", channel: "Chat", sector: "5G", schedules: { wd: ["08:00", "20:20"], sat: ["08:00", "20:20"], sun: null } },
        { label: "RETENCAO 5G DIGITAL FH", desc: "Plantão Retenção.", channel: "Chat", sector: "5G", schedules: { wd: ["20:20", "08:00"], sat: ["20:20", "08:00"], sun: ["00:00", "23:59"] } },
        { label: "RETENÇÃO 5G E BACKOFFICE GC", desc: "Retenção Especializada.", channel: "Voz", sector: "5G", schedules: { wd: ["08:00", "21:40"], sat: ["08:00", "20:40"], sun: null } },
        { label: "RETENÇÃO LOJA E BACKOFFICE RETENÇÃO", desc: "Apoio Loja.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "18:00"], sat: ["08:00", "17:00"], sun: null } },
        
        // --- SAC ---
        { label: "SAC", desc: "Atendimento Geral.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "21:50"], sat: ["08:00", "21:50"], sun: ["08:00", "20:30"] } },
        { label: "SAC 5G DIGITAL ATIVO", desc: "Atendimento 5G.", channel: "Chat", sector: "5G", schedules: { wd: ["09:00", "19:20"], sat: ["09:00", "19:20"], sun: null } },
        { label: "SAC BRISAMOVEL", desc: "Atendimento Móvel.", channel: "Voz", sector: "5G", schedules: { wd: ["08:00", "18:00"], sat: ["08:00", "14:20"], sun: null } },
        { label: "SAC BRISAMOVEL DIGITAL", desc: "Móvel via Chat.", channel: "Chat", sector: "5G", schedules: { wd: ["08:00", "18:00"], sat: ["08:00", "14:20"], sun: null } },
        { label: "SAC BRISAMOVEL DIGITAL FH", desc: "Plantão Móvel.", channel: "Chat", sector: "5G", schedules: { wd: ["18:00", "08:00"], sat: ["14:20", "08:00"], sun: ["00:00", "23:59"] } },
        { label: "SAC COBRANCA", desc: "Dúvidas Financeiras.", channel: "Voz", sector: "Fibra", schedules: { wd: ["07:00", "21:50"], sat: ["07:00", "21:50"], sun: ["07:00", "21:50"] } },
        { label: "SAC COBRANÇA 5G", desc: "Financeiro 5G.", channel: "Voz", sector: "5G", schedules: { wd: ["08:00", "21:40"], sat: ["08:00", "21:40"], sun: ["08:00", "20:40"] } },
        { label: "SAC COBRANÇA 5G DIGITAL", desc: "Financeiro Chat.", channel: "Chat", sector: "5G", schedules: { wd: ["08:00", "21:40"], sat: ["08:00", "21:40"], sun: ["08:00", "20:40"] } },
        { label: "SAC COMERCIAL", desc: "Informações Planos.", channel: "Voz", sector: "Fibra", schedules: { wd: ["07:00", "21:50"], sat: ["07:00", "21:50"], sun: ["07:00", "20:40"] } },
        { label: "SAC/FINANCEIRO 5G", desc: "Atendimento Integrado.", channel: "Voz", sector: "5G", schedules: { wd: ["08:00", "21:40"], sat: ["08:00", "21:40"], sun: ["08:00", "20:40"] } },
        { label: "SAC/FINANCEIRO 5G CALL BACK", desc: "Retorno Noturno.", channel: "Voz", sector: "5G", schedules: { wd: ["21:40", "08:00"], sat: ["21:40", "08:00"], sun: ["20:40", "08:00"] } },
        { label: "SAC/FINANCEIRO 5G DIGITAL", desc: "Integrado Chat.", channel: "Chat", sector: "5G", schedules: { wd: ["08:00", "21:40"], sat: ["08:00", "21:40"], sun: ["08:00", "20:40"] } },
        { label: "SAC/FINANCEIRO 5G DIGITAL FH", desc: "Plantão Integrado.", channel: "Chat", sector: "5G", schedules: { wd: ["21:40", "08:00"], sat: ["21:40", "08:00"], sun: ["20:40", "08:00"] } },
        
        // --- SUPORTE TÉCNICO ---
        { label: "SUPORTE 5G N2", desc: "Nível 2.", channel: "Voz", sector: "5G", schedules: { wd: ["08:00", "17:00"], sat: ["08:00", "12:00"], sun: null } },
        { label: "SUPORTE ATIVO", desc: "Suporte Fibra N1.", channel: "Voz", sector: "Fibra", schedules: { wd: ["08:00", "20:40"], sat: ["08:00", "20:40"], sun: ["08:00", "20:40"] } },
        { label: "SUPORTE B2G (CFTV)", desc: "Governo/Câmeras.", channel: "Voz", sector: "Fibra", schedules: { wd: ["00:00", "23:59"], sat: ["00:00", "23:59"], sun: ["00:00", "23:59"] } },
        { label: "SUPORTE CORPORATIVO B2B", desc: "Empresarial 24h.", channel: "Voz", sector: "Fibra", schedules: { wd: ["00:00", "23:59"], sat: ["00:00", "23:59"], sun: ["00:00", "23:59"] } },
        { label: "SUPORTE ISP", desc: "Provedores 24h.", channel: "Voz", sector: "Fibra", schedules: { wd: ["00:00", "23:59"], sat: ["00:00", "23:59"], sun: ["00:00", "23:59"] } },
        { label: "SUPORTE REGIONAL DIGITAL", desc: "Regional Chat.", channel: "Chat", sector: "Fibra", schedules: { wd: ["07:00", "19:00"], sat: ["07:00", "19:00"], sun: ["08:00", "18:00"] } },
        { label: "SUPORTE REGIONAL", desc: "Regional Voz.", channel: "Voz", sector: "Fibra", schedules: { wd: ["07:00", "19:00"], sat: ["07:00", "19:00"], sun: ["08:00", "18:00"] } },
        { label: "SUPORTE TÉCNICO 5G", desc: "Suporte 5G Voz.", channel: "Voz", sector: "5G", schedules: { wd: ["08:00", "21:40"], sat: ["08:00", "21:40"], sun: ["08:00", "20:40"] } },
        { label: "SUPORTE TÉCNICO 5G CALL BACK", desc: "Retorno Noturno.", channel: "Voz", sector: "5G", schedules: { wd: ["21:40", "08:00"], sat: ["21:40", "08:00"], sun: ["20:40", "08:00"] } },
        { label: "SUPORTE TÉCNICO 5G DIGITAL", desc: "Suporte 5G Chat.", channel: "Chat", sector: "5G", schedules: { wd: ["08:00", "21:40"], sat: ["08:00", "21:40"], sun: ["08:00", "20:40"] } },
        { label: "SUPORTE TÉCNICO 5G FH", desc: "Plantão Suporte.", channel: "Chat", sector: "5G", schedules: { wd: ["21:40", "08:00"], sat: ["21:40", "08:00"], sun: ["20:40", "08:00"] } },
        { label: "SUPORTE VAREJO", desc: "Residencial 24h.", channel: "Voz", sector: "Fibra", schedules: { wd: ["00:00", "23:59"], sat: ["00:00", "23:59"], sun: ["00:00", "23:59"] } },
        { label: "SUPORTE VAREJO DIGITAL", desc: "Residencial Chat.", channel: "Chat", sector: "Fibra", schedules: { wd: ["08:00", "23:40"], sat: ["08:00", "23:40"], sun: ["08:00", "23:40"] } },
        { label: "SUPORTE VAREJO DIGITAL FH", desc: "Plantão Chat.", channel: "Chat", sector: "Fibra", schedules: { wd: ["23:40", "08:00"], sat: ["23:40", "08:00"], sun: ["23:40", "08:00"] } },
        
        // --- TELEVENDAS ---
        { label: "TELEVENDAS RECEPTIVO 5G", desc: "Venda Ativa/Rec.", channel: "Voz", sector: "5G", schedules: { wd: ["08:00", "22:00"], sat: ["08:00", "22:00"], sun: ["08:00", "21:00"] } },
        { label: "TELEVENDAS RECEPTIVO FIBRA", desc: "Venda Ativa/Rec.", channel: "Voz", sector: "FIBRA", schedules: { wd: ["08:00", "22:00"], sat: ["08:00", "22:00"], sun: ["08:00", "20:40"] } }
    ];

    const ICONS = {
        CLOSE: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
        MAIN: `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`
    };

    function checkQueueStatus(schedule) {
        if (!schedule) return { isOpen: false, text: "SEM HORÁRIO", color: "#64748b", badge: "Indefinido" };
        const now = new Date();
        const day = now.getDay();
        const currentMinutes = (now.getHours() * 60) + now.getMinutes();
        let times = (day >= 1 && day <= 5) ? schedule.wd : (day === 6 ? schedule.sat : schedule.sun);
        if (!times) return { isOpen: false, text: "FECHADO HOJE", color: "#ef4444", badge: "Fechado", timeStr: "Não Abre" };
        const [startStr, endStr] = times;
        const startMin = (parseInt(startStr.split(':')[0]) * 60) + parseInt(startStr.split(':')[1]);
        const endMin = (parseInt(endStr.split(':')[0]) * 60) + parseInt(endStr.split(':')[1]);
        let isOpen = false;
        if (startMin < endMin) { if (currentMinutes >= startMin && currentMinutes < endMin) isOpen = true; }
        else { if (currentMinutes >= startMin || currentMinutes < endMin) isOpen = true; }
        if (isOpen) return { isOpen: true, text: `ABERTO (Fecha ${endStr})`, color: "#10b981", badge: "Aberto", timeStr: `${startStr} - ${endStr}` };
        return { isOpen: false, text: `FECHADO (Abre ${startStr})`, color: "#ef4444", badge: "Fechado", timeStr: `${startStr} - ${endStr}` };
    }

    function createInterface() {
        const existing = document.querySelector('.queue-monitor-container');
        if (existing) { existing.remove(); return; }

        const container = document.createElement("div");
        container.className = 'queue-monitor-container';
        container.innerHTML = `
            <div class="monitor-header">
                <div class="header-top">
                    <div class="header-title">${ICONS.MAIN}<span>Fila de Atendimento</span></div>
                    <button class="close-btn">${ICONS.CLOSE}</button>
                </div>
                <div class="clock-area">
                    <div class="digital-clock" id="monitor-clock">00:00:00</div>
                    <div class="date-display" id="monitor-date">--/--/----</div>
                </div>
                <div class="tabs-container">
                    <button class="tab-btn active" data-tab="open">ABERTAS <span id="count-open" class="count-badge green">0</span></button>
                    <button class="tab-btn" data-tab="closed">FECHADAS <span id="count-closed" class="count-badge red">0</span></button>
                </div>
                <div class="search-container">
                    <input type="text" id="monitor-search" placeholder="🔍 Pesquisar fila ou setor...">
                </div>
            </div>
            <div class="monitor-content" id="monitor-content-area"></div>
            <div class="resize-handle"></div>
        `;
        document.body.appendChild(container);
        makeDraggable(container, container.querySelector('.monitor-header'));

        container.querySelector('.close-btn').onclick = () => container.remove();
        const tabs = container.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderQueues();
            };
        });
        
        document.getElementById('monitor-search').addEventListener('input', renderQueues);

        const update = () => { if(!document.body.contains(container)) return; updateTime(); renderQueues(); };
        update(); setInterval(update, 10000); setInterval(updateTime, 1000);
    }

    function updateTime() {
        const now = new Date();
        const clockEl = document.getElementById('monitor-clock');
        const dateEl = document.getElementById('monitor-date');
        if(clockEl) clockEl.innerText = now.toLocaleTimeString();
        if(dateEl) dateEl.innerText = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    }

    function renderQueues() {
        const contentArea = document.getElementById('monitor-content-area');
        if (!contentArea) return;
        let openList = [], closedList = [];
        QUEUES_DB.forEach(queue => {
            const status = checkQueueStatus(queue.schedules);
            const item = { ...queue, status };
            if (status.isOpen) openList.push(item); else closedList.push(item);
        });
        document.getElementById('count-open').innerText = openList.length;
        document.getElementById('count-closed').innerText = closedList.length;
        
        const activeTab = document.querySelector('.tab-btn.active').dataset.tab;
        let currentList = (activeTab === 'open') ? openList : closedList;
        
        // Lógica de Pesquisa
        const searchTerm = document.getElementById('monitor-search')?.value.toLowerCase() || "";
        if(searchTerm) {
            currentList = currentList.filter(q => 
                q.label.toLowerCase().includes(searchTerm) || 
                q.desc.toLowerCase().includes(searchTerm) || 
                q.sector.toLowerCase().includes(searchTerm)
            );
        }

        contentArea.innerHTML = '';
        if (currentList.length === 0) { contentArea.innerHTML = '<div style="text-align:center; padding:40px; color:#64748b;">Nenhuma fila encontrada.</div>'; return; }
        currentList.forEach(item => {
            const card = document.createElement('div'); card.className = 'queue-card'; card.style.borderLeftColor = item.status.color;
            card.innerHTML = `<div class="q-header"><span class="q-channel">${item.channel}</span><span class="q-sector">${item.sector}</span></div><div class="q-body"><div class="q-title">${item.label}</div><div class="q-desc">${item.desc}</div></div><div class="q-footer"><span class="status-pill" style="color:${item.status.color}; border:1px solid ${item.status.color}; background:${item.status.color}11;">${item.status.badge.toUpperCase()}</span><span class="q-time">${item.status.timeStr}</span></div>`;
            contentArea.appendChild(card);
        });
    }

    // --- BOTÃO OCULTO (TRIGGER) ---
    function createTriggerButton() {
        let btn = document.getElementById('monitor-trigger-btn');
        if (btn) return;
        btn = document.createElement('button');
        btn.id = 'monitor-trigger-btn';
        btn.style.display = 'none'; // Invisível, só para ser clicado pelo Menu.js
        document.body.appendChild(btn);
        btn.onclick = createInterface;
    }

    function makeDraggable(el, handle) {
        handle.style.cursor = "move";
        handle.onmousedown = (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return; // Evita arrastar ao clicar no input
            let startX = e.clientX, startY = e.clientY;
            let rect = el.getBoundingClientRect();
            let initL = rect.left, initT = rect.top;
            const move = (ev) => { el.style.transform = "none"; el.style.left = (initL + ev.clientX - startX) + 'px'; el.style.top = (initT + ev.clientY - startY) + 'px'; };
            const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
            document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
        };
    }

    function injectCss() {
        const css = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
            .queue-monitor-container { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 420px; height: 600px; min-width: 320px; min-height: 400px; background: #0f172a; border-radius: 12px; box-shadow: 0 25px 50px rgba(0,0,0,0.6); z-index: 100000; display: flex; flex-direction: column; font-family: 'Inter', sans-serif; border: 1px solid #1e293b; overflow: hidden; resize: both; }
            .resize-handle { position: absolute; bottom: 0; right: 0; width: 15px; height: 15px; background: linear-gradient(135deg, transparent 50%, #475569 50%); cursor: nwse-resize; pointer-events: none; }
            .monitor-header { background: #1e293b; padding: 0; flex-shrink: 0; user-select: none; }
            .header-top { display: flex; justify-content: space-between; align-items: center; padding: 12px 15px; border-bottom: 1px solid #334155; }
            .header-title { font-weight: 700; color: #f8fafc; font-size: 16px; display: flex; align-items: center; gap: 10px; } .header-title svg { color: #6366f1; }
            .close-btn { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; } .close-btn:hover { background: #ef4444; color: white; }
            .clock-area { background: #0f172a; padding: 15px 0; border-bottom: 1px solid #1e293b; text-align: center; }
            .digital-clock { font-family: 'JetBrains Mono', monospace; font-size: 36px; font-weight: 700; color: #f8fafc; letter-spacing: 1px; line-height: 1; }
            .date-display { color: #6366f1; font-size: 13px; font-weight: 500; text-transform: capitalize; margin-top: 5px; opacity: 0.9; }
            .tabs-container { display: flex; background: #1e293b; padding: 0 5px; }
            .tab-btn { flex: 1; background: transparent; border: none; padding: 12px; color: #64748b; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; transition: 0.2s; font-size: 13px; }
            .tab-btn:hover { color: #94a3b8; background: rgba(255,255,255,0.02); } .tab-btn.active { color: #f8fafc; border-bottom-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
            .count-badge { padding: 2px 6px; border-radius: 10px; font-size: 10px; margin-left: 6px; color: #000; font-weight: 800; min-width: 18px; display: inline-block; text-align: center; } .count-badge.green { background: #4ade80; } .count-badge.red { background: #f87171; }
            
            /* ESTILO DA PESQUISA */
            .search-container { padding: 10px; background: #1e293b; border-bottom: 1px solid #334155; }
            #monitor-search { width: 100%; background: #0f172a; border: 1px solid #334155; color: #f8fafc; padding: 8px 12px; border-radius: 6px; font-family: 'Inter', sans-serif; font-size: 13px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
            #monitor-search:focus { border-color: #3b82f6; }

            .monitor-content { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 10px; background: #0f172a; } .monitor-content::-webkit-scrollbar { width: 6px; } .monitor-content::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
            .queue-card { background: #1e293b; padding: 12px; border-radius: 8px; border-left: 3px solid #64748b; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); transition: transform 0.2s; } .queue-card:hover { background: #243045; }
            .q-header { display: flex; justify-content: space-between; font-size: 10px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 6px; }
            .q-body { margin-bottom: 10px; } .q-title { font-weight: 600; color: #f1f5f9; font-size: 14px; margin-bottom: 3px; } .q-desc { font-size: 12px; color: #64748b; line-height: 1.3; font-style: italic; }
            .q-footer { display: flex; justify-content: space-between; align-items: center; font-size: 11px; padding-top: 8px; border-top: 1px solid #334155; } .status-pill { padding: 2px 8px; border-radius: 4px; font-weight: 700; font-size: 10px; } .q-time { color: #cbd5e1; font-family: 'JetBrains Mono', monospace; }
        `;
        const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
    }

    injectCss();
    createTriggerButton();
})();
