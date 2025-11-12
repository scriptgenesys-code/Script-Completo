// =================================================================
// Parceiro de Programação: SCRIPT FINAL (V48.4 - RELÓGIO HEADER)
// Mudanças:
// 1. NOVO (Relógio Header): Adicionado relógio no cabeçalho
//    entre o título e os botões de config/minimizar.
// 2. MANTIDO (V48.3): Correções de Logoff e Design.
// 3. MANTIDO (V48.0): Relógio com ponto piscante e nomes.
// 4. MANTIDO (V46.4): Lógica de cronômetro, 'Voltar' e cliques.
// =================================================================

(function() {

    // --- INÍCIO: KILL SWITCH (V48.2) ---
    // Remove à força qualquer UI antiga antes de construir a nova
    console.log("[GERENCIADOR V48.4] Forçando a remoção de UIs antigas...");
    try {
        const old_ui = document.getElementById('pausa-script-container');
        if (old_ui) old_ui.remove();
        const old_config = document.getElementById('pausa-script-config-container');
        if (old_config) old_config.remove();
        console.log("[GERENCIADOR V48.4] UIs antigas removidas com sucesso.");
    } catch (e) {
        console.warn("[GERENCIADOR V48.4] Erro ao limpar UI antiga:", e.message);
    }
    // --- FIM: KILL SWITCH ---


    // ----------------------------------------------------
    // CONSTANTES E CONFIGURAÇÕES
    // ----------------------------------------------------
    
    // ATUALIZADA V48.3
    const SELECTORES = {
        MENU_STATUS_TOGGLE: '#toggleUserDropdownTarget',
        DISPONIVEL: 'button.presence-available',
        REFEICAO: 'button.presence-meal',
        INTERVALO_MENU: 'button.presence-break', 
        OCUPADO_MENU: 'button.presence-busy',   
        // CORREÇÃO V48.3: Aponta para a span com o texto
        LOGOFF: 'span.menu-label', 
        NA_FILA_TOGGLE_HOST: 'gux-toggle#command-bar-queue-toggle', 
        NA_FILA_DIRETO: 'gux-button.onQueueButton',
        VOLTAR_SUBMENU: 'button[title="Volte às presenças primárias"]', // Corrigido V46.2
        STATUS_LABEL_TEXT: 'span.presence-label-text',
        TREINAMENTO: 'button.presence-training',
        REUNIAO: 'button.presence-meeting',
    };

    const PAUSAS_AGENDADAS_DEFAULT = [
        { hora: "17:40", status: "Na fila" }, { hora: "18:35", status: "Pausa out" },
        { hora: "18:40", status: "Descanso" }, { hora: "18:50", status: "Na fila" },
        { hora: "19:45", status: "Pausa out" }, { hora: "19:50", status: "Refeição" },
        { hora: "20:10", status: "Na fila" }, { hora: "22:25", status: "Pausa out" },
        { hora: "22:30", status: "Descanso" }, { hora: "22:40", status: "Na fila" },
        { hora: "00:00", status: "Logoff" }
    ];

    let estadoAtual = { tipo: 'Disponível', inicio: new Date(), ativa: false };
    let historicoPausas = [];
    let isAgendamentoAtivo = false;
    let schedulerInterval = null;
    let syncTimeout = null;
    let ultimoEventoProcessado = null;
    let isConfigPainelAberto = false;
    let dragElement = null;
    let offsetX = 0, offsetY = 0;
    let isDragging = false;
    let isAutomacaoPausada = false;
    let confirmModalTimeout = null; 
    const STORAGE_KEY_HORARIOS = 'gerenciadorPausas_horarios';
    const STORAGE_KEY_POS_MAIN = 'gerenciadorPausas_posMain';
    const STORAGE_KEY_POS_CONFIG = 'gerenciadorPausas_posConfig';
    const STORAGE_KEY_NOTIF_CONFIG = 'gerenciadorPausas_notifConfig';

    const NOTIF_CONFIG_DEFAULT = { ativadas: true, somAtivado: false, antecedenciaSegundos: 15 };
    let configNotificacao = { ...NOTIF_CONFIG_DEFAULT };
    const SOM_NOTIFICACAO_URL = 'https://www.soundjay.com/button/sounds/beep-07a.mp3';
    let audioNotificacao = new Audio(SOM_NOTIFICACAO_URL);
    let audioDesbloqueado = false;

    // --- Funções de LocalStorage ---
    function salvarHorariosLocalStorage(h){try{localStorage.setItem(STORAGE_KEY_HORARIOS,JSON.stringify(h));console.log("[LS] Horários salvos.")}catch(e){console.error("[LS] Erro save horários:",e)}}
    function carregarHorariosLocalStorage(){try{const h=localStorage.getItem(STORAGE_KEY_HORARIOS);if(h){const p=JSON.parse(h);if(Array.isArray(p)){if(p.every(i=>typeof i.hora==='string'&&typeof i.status==='string')){console.log("[LS] Horários carregados.");return p}else{console.warn("[LS] Formato interno inválido.");localStorage.removeItem(STORAGE_KEY_HORARIOS)}}else{console.warn("[LS] Formato JSON inválido.");localStorage.removeItem(STORAGE_KEY_HORARIOS)}}}catch(e){console.error("[LS] Erro load horários:",e);localStorage.removeItem(STORAGE_KEY_HORARIOS)}console.log("[LS] Nenhum horário salvo. Usando padrão.");return[...PAUSAS_AGENDADAS_DEFAULT]}
    function salvarPosicaoPainelLocalStorage(k,el){if(!el)return;try{let p={};if(el.style.top&&el.style.left){p={top:el.style.top,left:el.style.left}}else if(el.style.bottom&&el.style.right){p={bottom:el.style.bottom,right:el.style.right}}else{const r=el.getBoundingClientRect();p={top:r.top+'px',left:r.left+'px'}}localStorage.setItem(k,JSON.stringify(p))}catch(e){console.error(`[LS] Erro save pos ${k}:`,e)}}
    function carregarPosicaoPainelLocalStorage(k){try{const pS=localStorage.getItem(k);if(pS){const p=JSON.parse(pS);if(p&&(p.top||p.bottom))return p}}catch(e){console.error(`[LS] Erro load pos ${k}:`,e);localStorage.removeItem(k)}return null}
    function salvarConfiguracoesNotificacaoLocalStorage(c){try{localStorage.setItem(STORAGE_KEY_NOTIF_CONFIG,JSON.stringify(c));console.log("[LS] Config Notif salva.")}catch(e){console.error("[LS] Erro save config notif:",e)}}
    function carregarConfiguracoesNotificacaoLocalStorage(){try{const cS=localStorage.getItem(STORAGE_KEY_NOTIF_CONFIG);if(cS){const c=JSON.parse(cS);if(typeof c.ativadas==='boolean'&&typeof c.somAtivado==='boolean'&&typeof c.antecedenciaSegundos==='number'){console.log("[LS] Config Notif carregada.");return{...NOTIF_CONFIG_DEFAULT,...c}}else{console.warn("[LS] Formato config notif inválido.");localStorage.removeItem(STORAGE_KEY_NOTIF_CONFIG)}}}catch(e){console.error("[LS] Erro load config notif:",e);localStorage.removeItem(STORAGE_KEY_NOTIF_CONFIG)}console.log("[LS] Nenhuma config notif salva. Usando padrão.");return{...NOTIF_CONFIG_DEFAULT}}
    
    let PAUSAS_AGENDADAS=carregarHorariosLocalStorage();
    configNotificacao = carregarConfiguracoesNotificacaoLocalStorage();

    // ----------------------------------------------------
    // FUNÇÕES DE UTILIDADE E INTERAÇÃO COM A PLATAFORMA
    // ----------------------------------------------------

    function tocarSomNotificacao(){if(!configNotificacao.somAtivado)return;if(!audioDesbloqueado){console.warn("[Notif Som] Áudio não desbloqueado.");desbloquearAudio(true);return}audioNotificacao.currentTime=0;audioNotificacao.play().catch(e=>{console.error("[Notif Som] Erro:",e.message);audioDesbloqueado=!1;document.addEventListener('click',desbloquearAudio,{once:!0})})}
    function desbloquearAudio(forcePlay=!1){if(audioDesbloqueado&&!forcePlay)return;let p=audioNotificacao.play();if(p!==undefined){p.then(()=>{audioNotificacao.pause();audioNotificacao.currentTime=0;if(!audioDesbloqueado){audioDesbloqueado=!0;console.log("[Audio] Contexto desbloqueado.")}}).catch(e=>{});}if(audioDesbloqueado){document.removeEventListener('click',desbloquearAudio)}}
    async function mostrarNotificacao(evento){if(!configNotificacao.ativadas){console.log("[Notif] Desativadas.");return}if(!("Notification"in window)){console.warn("[Notif] Navegador não suporta.");return}let p=Notification.permission;if(p==="granted"){tocarSomNotificacao();new Notification("Gerenciador - Próxima Ação",{body:`${evento.status} às ${evento.hora}`,tag:`gdp-${evento.hora}-${evento.status}`});console.log(`[Notif] Exibida: ${evento.status}`)}else if(p==="default"){console.log("[Notif] Pedindo permissão...");try{p=await Notification.requestPermission();if(p==="granted"){console.log("[Notif] Permissão OK!");mostrarNotificacao(evento)}else{console.warn("[Notif] Permissão Negada.");localStorage.setItem('notif_negada','1')}}catch(err){console.error("[Notif] Erro ao pedir:",err)}}else{if(!localStorage.getItem('notif_negada')){console.warn("[Notif] Permissão negada antes.");localStorage.setItem('notif_negada','1')}}}
    
    // ATUALIZADA V46.1
    function clicarElemento(s, t = null) {
        let e = null;
        if (t) {
            const l = document.querySelectorAll(s); 
            if (l.length === 0) {
                console.warn(`[AÇÃO V48.4] Nenhum elemento encontrado com o seletor: ${s}`);
            }
            for (const o of l) {
                if (o.textContent.trim().toLowerCase() === t.toLowerCase()) {
                    e = o;
                    while (e && e.parentElement && e.tagName !== 'BUTTON') {
                        e = e.parentElement;
                    }
                    if (e && e.tagName === 'BUTTON') break; 
                    e = null; 
                }
            }
        } else {
            e = document.querySelector(s);
        }
        
        if (e) {
            console.log(`[AÇÃO V48.4] Clicando: ${s}` + (t ? ` (Texto: ${t})` : ''));
            const c = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
            e.dispatchEvent(c);
            return true;
        }
        console.warn(`[AÇÃO V48.4] Não encontrado: ${s}` + (t ? ` (Texto: ${t})` : ''));
        return false;
    }
    
    function forcarCliquePorTexto(t){const s=SELECTORES.STATUS_LABEL_TEXT;const e=document.querySelectorAll(s);for(const l of e){if(l.textContent.trim()===t){let o=l;while(o&&o.parentElement&&o.tagName!=='BUTTON'){o=o.parentElement}if(o&&o.tagName==='BUTTON'){const c=new MouseEvent('click',{view:window,bubbles:!0,cancelable:!0});o.dispatchEvent(c);return!0}}}return!1}
    
    // ATUALIZADO V46.2
    function clicarVoltarSubmenu(){if(clicarElemento(SELECTORES.VOLTAR_SUBMENU)){console.log("[AÇÃO] Clicado Voltar.");return!0}console.warn("[AÇÃO] Voltar não encontrado.");return!1}
    
    function formatarDuracao(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),c=Math.max(0,s%60);const p=n=>String(n).padStart(2,'0');return`${p(h)}:${p(m)}:${p(c)}`}
    function converterDuracaoParaSegundos(d){if(!d||typeof d!=='string')return 0;const p=d.split(':');if(p.length!==3)return 0;const h=parseInt(p[0],10)||0,m=parseInt(p[1],10)||0,s=parseInt(p[2],10)||0;return(h*3600)+(m*60)+s}
    
    // ATUALIZADA V46.4
    function registrarPausa(n){
        const a=new Date;
        console.log(`[PAUSA V46.4] Registrando: ${n}`);
        
        if(estadoAtual.ativa){
            const f=a;
            const d=f.getTime()-estadoAtual.inicio.getTime();
            if(d>500){ 
                historicoPausas.push({
                    tipo:estadoAtual.tipo,
                    inicio:estadoAtual.inicio.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
                    fim:f.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
                    duracao:formatarDuracao(Math.round(d/1000))
                });
                renderizarHistoricoLog();
                renderizarEstatisticas();
            }else{
                console.log(`[PAUSA] Anterior (${estadoAtual.tipo}) muito curta. Descartada.`);
            }
        } 
        
        estadoAtual={
            tipo:n,
            inicio:a,
            ativa: (n !== 'Logoff')
        };
        
        atualizarUI();
    }
    
    function adicionarAtalho(){document.addEventListener('keydown',function(e){const c=e.ctrlKey||e.metaKey,s=e.shiftKey,o=e.key==='1';if(document.activeElement&&['INPUT','TEXTAREA'].includes(document.activeElement.tagName))return;if(c&&s&&o){e.preventDefault();toggleVisibilidade()}})}

    // --- Funções de Agendamento ---
    
    // ATUALIZADA V48.0
    function mapearEexecutarAcao(s){
        console.log(`[AGENDAMENTO V48.4] Mapeando: ${s}`);
        const status = s.toLowerCase().trim();
        
        switch(status){
            case"na fila": iniciarNaFila(true); break;
            case"disponível": voltarDisponivel(true); break;
            case"pausa out": iniciarPausaOut(true); break;
            case"descanso": iniciarDescanso(true); break;
            case"refeição": iniciarRefeicao(true); break;
            case"treinamento": iniciarTreinamento(true); break;
            case"reunião": iniciarReuniao(true); break;
            case"logoff": realizarLogoff(true); break;
            case"atividade backoffice":
            case"ativ. backoffice":
            case"backoffice":
                iniciarBackoffice(true); break;
            case"feedback": iniciarFeedback(true); break;
            case"particular": iniciarParticular(true); break;
            case"questões de saúde":
            case"questoes de saude":
            case"saúde":
            case"saude": 
                iniciarQuestoesSaude(true); break;
            default:
                console.warn(`[AGENDAMENTO V48.4] Status '${s}' não mapeado.`);
        }
    }
    
    // ATUALIZADA V48.0
    function verificarEExecutarAgendamentos(){if(!isAgendamentoAtivo||isAutomacaoPausada){if(isAutomacaoPausada)console.log("[AGENDAMENTO CHECK V48.4] Pausado.");return} const a=new Date,h=`${String(a.getHours()).padStart(2,'0')}:${String(a.getMinutes()).padStart(2,'0')}`,s=a.getSeconds(); console.log(`[AGENDAMENTO CHECK V48.4] Verificando ${h}:${String(s).padStart(2,'0')}`); Object.keys(window).forEach(k=>{if(k.startsWith('notif_')){const e=k.split('_')[1];if(e<h){clearTimeout(window[k]);delete window[k];}}}); const eA=PAUSAS_AGENDADAS.find(p=>p.hora===h);if(eA && ultimoEventoProcessado !== h){console.warn(`[AGENDAMENTO DISPARADO V48.4] EXECUTANDO: ${eA.status} às ${eA.hora}`);mapearEexecutarAcao(eA.status);ultimoEventoProcessado = h;if(eA.status.toLowerCase()==='logoff'){setTimeout(()=>{if(isAgendamentoAtivo)toggleAgendamento()},500)}return} if(!eA && ultimoEventoProcessado) { ultimoEventoProcessado = null; } if (s < 15) {const pM=new Date(a.getTime()+6e4),hP=`${String(pM.getHours()).padStart(2,'0')}:${String(pM.getMinutes()).padStart(2,'0')}`;const eP=PAUSAS_AGENDADAS.find(p=>p.hora===hP);if(eP){const antecedencia = configNotificacao.antecedenciaSegundos; const sN=Math.max(0,(60-antecedencia)-s),tId=`notif_${eP.hora}_${eP.status}`;if(sN>0&&!window[tId]){console.log(`[Notif V48.4] Agendando ${eP.status} às ${eP.hora} em ${sN} seg. (Antecedência: ${antecedencia}s)`);window[tId]=setTimeout(()=>{mostrarNotificacao(eP);delete window[tId]},sN*1e3)}}}}
    function iniciarSchedulerSincronizado(){console.log("[Scheduler V48.4] Sincronizado!");if(!isAgendamentoAtivo){console.log("[Scheduler V48.4] Automação desligada pós-sinc.");return} verificarEExecutarAgendamentos();schedulerInterval=setInterval(verificarEExecutarAgendamentos,60000)}
    function sincronizarEIniciarScheduler(){if(schedulerInterval)clearInterval(schedulerInterval);if(syncTimeout)clearTimeout(syncTimeout);const sA=new Date().getSeconds();const dMs=(60-sA)*1000;console.log(`[Scheduler V48.4] Aguardando ${dMs/1000}s para sincronizar...`);syncTimeout=setTimeout(iniciarSchedulerSincronizado,dMs)}
    
    // ATUALIZADA V48.0
    function toggleAgendamento(){
        console.log("[AÇÃO V48.4] toggleAgendamento.");
        const b=document.getElementById('btn-toggle-agendamento'),p=document.getElementById('btn-pause-resume-agendamento');
        if(isAgendamentoAtivo){
            if(schedulerInterval)clearInterval(schedulerInterval);if(syncTimeout)clearTimeout(syncTimeout);
            schedulerInterval=null;syncTimeout=null;isAgendamentoAtivo=!1;isAutomacaoPausada=!1;
            console.warn("[AGENDAMENTO V48.4] OFF.");
            if(b){b.textContent="Ligar Automação";b.style.background = 'linear-gradient(135deg, #23a745, #2dc24f)';}
            if(p)p.style.display='none';
        }else{
            PAUSAS_AGENDADAS=carregarHorariosLocalStorage();
            console.log(`[AGENDAMENTO V48.4] ${PAUSAS_AGENDADAS.length} horários carregados.`);
            ultimoEventoProcessado=null;isAutomacaoPausada=!1;isAgendamentoAtivo=!0;
            console.info("[AGENDAMENTO V48.4] ON. Sincronizando...");
            if(b){b.textContent="Desligar Automação";b.style.background = 'linear-gradient(135deg, #dc3545, #e84a5f)';}
            if(p){
                p.textContent="Pausar ⏸️";
                p.style.background = 'linear-gradient(135deg, #ffc107, #ffd25a)';
                p.style.color = '#000';
                p.style.display='inline-block';
            }
            sincronizarEIniciarScheduler();
        }
    }
    // ATUALIZADA V48.0
    function togglePausaAutomacao(){
        if(!isAgendamentoAtivo)return;
        isAutomacaoPausada=!isAutomacaoPausada;
        const b=document.getElementById('btn-pause-resume-agendamento');
        if(isAutomacaoPausada){
            console.warn("[AGENDAMENTO] PAUSADO.");
            if(b){
                b.textContent="Retomar ▶️";
                b.style.background = 'linear-gradient(135deg, #007FFF, #009cff)';
                b.style.color = '#fff';
            }
        }else{
            console.info("[AGENDAMENTO] RETOMADO.");
            if(b){
                b.textContent="Pausar ⏸️";
                b.style.background = 'linear-gradient(135deg, #ffc107, #ffd25a)';
                b.style.color = '#000';
            }
            verificarEExecutarAgendamentos();
        }
    }

    // --- Funções de Edição ---
    function adicionarNovoHorario(){const iH=document.getElementById('novo-horario-hora'),iS=document.getElementById('novo-horario-status');if(!iH||!iS)return;const h=iH.value,s=iS.value.trim();if(!h){alert("Insira hora.");iH.focus();return}if(!s){alert("Insira status.");iS.focus();return}if(PAUSAS_AGENDADAS.some(p=>p.hora===h)){if(!confirm(`Já existe ${h}. Substituir?`))return;PAUSAS_AGENDADAS=PAUSAS_AGENDADAS.filter(p=>p.hora!==h)}PAUSAS_AGENDADAS.push({hora:h,status:s});PAUSAS_AGENDADAS.sort((a,b)=>a.hora.localeCompare(b.hora));salvarHorariosLocalStorage(PAUSAS_AGENDADAS);iH.value='';iS.value='';renderizarAgendamentos();console.log(`Adicionado/Atualizado: ${h} - ${s}`); alert("Horário salvo! Desligue e Ligue a Automação para aplicar.")}
    function removerHorario(idx){if(idx<0||idx>=PAUSAS_AGENDADAS.length)return;const item=PAUSAS_AGENDADAS[idx];if(confirm(`Remover: ${item.hora} - ${item.status}?`)){PAUSAS_AGENDADAS.splice(idx,1);salvarHorariosLocalStorage(PAUSAS_AGENDADAS);renderizarAgendamentos();console.log(`Removido: ${item.hora} - ${item.status}`); alert("Horário removido! Desligue e Ligue a Automação para aplicar.")}}
    function carregarHorarioParaEdicao(idx){if(idx<0||idx>=PAUSAS_AGENDADAS.length)return;const item=PAUSAS_AGENDADAS[idx];const iH=document.getElementById('novo-horario-hora'),iS=document.getElementById('novo-horario-status');if(!iH||!iS)return;iH.value=item.hora;iS.value=item.status;console.log(`[Editor] Carregado: ${item.hora}`);iS.focus();iS.select()}

    // --- Funções de Exportar/Importar ---
    function exportarConfiguracoes(){console.log("[Backup] Exportando...");try{const c={pausas:carregarHorariosLocalStorage(),notificacoes:carregarConfiguracoesNotificacaoLocalStorage(),posicoes:{main:carregarPosicaoPainelLocalStorage(STORAGE_KEY_POS_MAIN)||{bottom:'30px',right:'30px'},config:carregarPosicaoPainelLocalStorage(STORAGE_KEY_POS_CONFIG)||{bottom:'30px',right:'340px'}}};const d="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(c,null,2));const l=document.createElement('a');l.setAttribute('href',d);l.setAttribute('download','config_gerenciador_pausas.json');document.body.appendChild(l);l.click();l.remove();console.log("[Backup] Exportado.")}catch(e){console.error("[Backup] Erro exportar:",e);alert("Erro ao exportar.")}}
    function importarConfiguracoes(){const i=document.getElementById('import-file-input');if(i)i.click();else console.error("[Backup] Input não encontrado.")}
    function handleArquivoImportado(event){const a=event.target.files[0];if(!a){console.log("[Backup] Nenhum arquivo.");return}const r=new FileReader();r.onload=function(e){try{const c=JSON.parse(e.target.result);if(c&&c.pausas&&c.notificacoes&&c.posicoes){salvarHorariosLocalStorage(c.pausas);salvarConfiguracoesNotificacaoLocalStorage(c.notificacoes);salvarPosicaoPainelLocalStorage(STORAGE_KEY_POS_MAIN,c.posicoes.main);salvarPosicaoPainelLocalStorage(STORAGE_KEY_POS_CONFIG,c.posicoes.config);console.log("[Backup] Importado e salvo.");alert("Configurações importadas!\n\nRecarregue a página (F5) agora.");event.target.value=null}else{throw new Error("Arquivo inválido.")}}catch(err){console.error("[Backup] Erro importar:",err.message);alert("Erro ao importar: arquivo inválido.");event.target.value=null}};r.readAsText(a)}

    // ----------------------------------------------------
    // FUNÇÕES DE AÇÃO PRINCIPAIS
    // ----------------------------------------------------
    const DELAY_ABRIR_MENU = 700; const DELAY_ABRIR_SUBMENU = 500; const DELAY_FECHAR_MENU = 200;
    
    // ======================================================
    // MODAL DE CONFIRMAÇÃO GENÉRICO (V46.0)
    // ======================================================
    
    function exibirModalConfirmacao(statusNome, callbackFuncao) {
        removerModalConfirmacao(); 
        console.log(`[AÇÃO V48.4] Exibindo confirmação customizada para '${statusNome}'...`);

        const cId = 'pausa-script-confirm-modal';
        const dialog = document.createElement('div');
        dialog.id = cId;
        dialog.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 320px; background-color: rgba(20, 30, 45, 0.95); color: #FFFFFF;
            border: 2px solid #0FF; border-radius: 10px; padding: 20px;
            z-index: 2147483648; box-shadow: 0 0 25px rgba(0, 255, 255, 0.3), 0 5px 15px rgba(0, 0, 0, 0.6);
            font-family: 'Segoe UI', Tahoma, sans-serif; backdrop-filter: blur(8px); box-sizing: border-box;
        `;

        dialog.innerHTML = `
            <style>
                #${cId} h4 { color: #0FF; margin: 0 0 10px 0; font-size: 18px; text-shadow: 0 0 5px #0FF; }
                #${cId} p { margin: 0 0 20px 0; font-size: 14px; line-height: 1.5; }
                #${cId} strong { color: #f1fa8c; }
                #${cId} .confirm-buttons { display: flex; justify-content: space-between; gap: 10px; }
                #${cId} .confirm-btn {
                    flex-grow: 1; padding: 10px; border: none; border-radius: 6px; cursor: pointer;
                    font-size: 14px; font-weight: 700; transition: all .2s;
                }
                #${cId} #btn-confirm-permitir { background-color: #28a745; color: white; }
                #${cId} #btn-confirm-permitir:hover { filter: brightness(1.15); }
                #${cId} #btn-confirm-cancelar { background-color: #6c757d; color: white; }
                #${cId} #btn-confirm-cancelar:hover { filter: brightness(1.15); }
            </style>
            <h4>🚨 Alerta de Automação</h4>
            <p>O script agendado quer alterar seu status para <strong>${statusNome}</strong>. Deseja permitir?</p>
            <div class="confirm-buttons">
                <button id="btn-confirm-cancelar" class="confirm-btn">Cancelar</button>
                <button id="btn-confirm-permitir" class="confirm-btn">Permitir</button>
            </div>
        `;

        document.body.appendChild(dialog);

        document.getElementById('btn-confirm-permitir').onclick = () => {
            console.log(`[AÇÃO V48.4] Permissão concedida (custom) para '${statusNome}'.`);
            if (callbackFuncao) callbackFuncao(); 
            removerModalConfirmacao();
        };
        document.getElementById('btn-confirm-cancelar').onclick = () => {
            console.warn(`[AÇÃO V48.4] Ação '${statusNome}' automática CANCELADA (custom).`);
            removerModalConfirmacao();
        };

        const autoCloseTime = 30000;
        confirmModalTimeout = setTimeout(() => {
            console.warn(`[AÇÃO V48.4] Confirmação '${statusNome}' expirou (sem resposta em ${autoCloseTime/1000}s).`);
            removerModalConfirmacao();
        }, autoCloseTime);
    }

    function removerModalConfirmacao() {
        if (confirmModalTimeout) {
            clearTimeout(confirmModalTimeout);
            confirmModalTimeout = null;
        }
        const dialog = document.getElementById('pausa-script-confirm-modal');
        if (dialog) {
            dialog.remove();
        }
    }

    // ======================================================
    // FUNÇÕES DE LÓGICA DE CLIQUE (V46.3)
    // ======================================================
    
    function executarLogicaMenuSimples(seletorBotao, nomePausa, isAutomatico = false) {
        if (clicarElemento(SELECTORES.MENU_STATUS_TOGGLE)) {
            setTimeout(() => {
                if (clicarElemento(seletorBotao)) {
                    // V46.3: registrarPausa movido
                } else {
                    console.warn(`[AÇÃO] Botão '${nomePausa}' (${seletorBotao}) não encontrado.`);
                    clicarElemento(SELECTORES.MENU_STATUS_TOGGLE);
                }
            }, DELAY_ABRIR_MENU);
        } else { console.warn("[AÇÃO] Botão Menu Status não encontrado."); }
    }
    
    // ATUALIZADA V46.1
    function executarLogicaSubMenu(seletorMenuTexto, seletorItemTexto, nomePausa, isAutomatico = false) {
         console.log(`[AÇÃO] Iniciando '${nomePausa}'...`);
         if (clicarElemento(SELECTORES.MENU_STATUS_TOGGLE)) {
            setTimeout(() => {
                const seletorMenuBotao = SELECTORES.STATUS_LABEL_TEXT;
                
                if (clicarElemento(seletorMenuBotao, seletorMenuTexto)) { 
                    console.log(`[AÇÃO] Clicado em '${seletorMenuTexto}'...`);
                    setTimeout(() => {
                        if (clicarElemento(SELECTORES.STATUS_LABEL_TEXT, seletorItemTexto)) {
                             // V46.3: registrarPausa movido
                             console.log(`[AÇÃO] '${nomePausa}' ativado.`);
                             setTimeout(clicarVoltarSubmenu, DELAY_FECHAR_MENU);
                        } else {
                            console.warn(`[AÇÃO] Item '${seletorItemTexto}' não encontrado.`);
                             clicarElemento(SELECTORES.VOLTAR_SUBMENU); 
                             setTimeout(clicarElemento, DELAY_FECHAR_MENU, SELECTORES.MENU_STATUS_TOGGLE);
                        }
                    }, DELAY_ABRIR_SUBMENU);
                } else {
                     console.warn(`[AÇÃO] Menu '${seletorMenuTexto}' não encontrado.`);
                     clicarElemento(SELECTORES.MENU_STATUS_TOGGLE);
                }
            }, DELAY_ABRIR_MENU);
        }
    }

    // --- Lógica "Na Fila" ---
    function executarLogicaNaFila(isAutomatico = false) {
        let clicado = false; 
        let elDireto = document.querySelector(SELECTORES.NA_FILA_DIRETO);
        if (elDireto && elDireto.offsetHeight !== 0) {
            console.log("[AÇÃO V48.4] Clicando no botão 'Entrar na fila' (Direto)...");
            try{ elDireto.click(); clicado = true; }
            catch(e){ clicado = clicarElemento(SELECTORES.NA_FILA_DIRETO); }
        } else {
            console.log("[AÇÃO V48.4] Tentando clicar no toggle 'Na Fila' (Shadow DOM)...");
            try {
                const guxToggle = document.querySelector(SELECTORES.NA_FILA_TOGGLE_HOST);
                if (guxToggle && guxToggle.shadowRoot) {
                    const shadowContent = guxToggle.shadowRoot;
                    const clickableSlider = shadowContent.querySelector('div[role="checkbox"]'); 
                    if (clickableSlider) { clickableSlider.click(); clicado = true; } 
                    else { console.warn("[AÇÃO V48.4] 'gux-toggle' interno (div[role=checkbox]) não encontrado."); }
                } else { console.warn("[AÇÃO V48.4] 'gux-toggle' (host) não encontrado ou sem shadowRoot."); }
            } catch (e) { console.error("[AÇÃO V48.4] Erro ao tentar clicar no Shadow DOM do 'gux-toggle':", e); }
        }
        
        if(!clicado) console.warn("Ação 'Na Fila' falhou.");
    }
    
    // --- Lógica Ações Antigas ---
    function executarLogicaRefeicao(isAutomatico = false){ executarLogicaMenuSimples(SELECTORES.REFEICAO, 'Refeição', isAutomatico); }
    function executarLogicaDisponivel(isAutomatico = false){ executarLogicaMenuSimples(SELECTORES.DISPONIVEL, 'Disponível', isAutomatico); }
    function executarLogicaTreinamento(isAutomatico = false){ executarLogicaMenuSimples(SELECTORES.TREINAMENTO, 'Treinamento', isAutomatico); }
    function executarLogicaReuniao(isAutomatico = false){ executarLogicaMenuSimples(SELECTORES.REUNIAO, 'Reunião', isAutomatico); }
    function executarLogicaDescanso(isAutomatico = false){ executarLogicaSubMenu("Intervalo", "Descanso", "Descanso", isAutomatico); }
    function executarLogicaPausaOut(isAutomatico = false){ executarLogicaSubMenu("Ocupado", "Pausa out", "Pausa out", isAutomatico); }
    
    // --- Lógica Ações NOVAS (V48.0) ---
    function executarLogicaBackoffice(isAutomatico = false){ executarLogicaSubMenu("Ocupado", "Atividade backoffice", "Backoffice", isAutomatico); }
    function executarLogicaFeedback(isAutomatico = false){ executarLogicaSubMenu("Ocupado", "Feedback", "Feedback", isAutomatico); }
    function executarLogicaParticular(isAutomatico = false){ executarLogicaSubMenu("Ausente", "Particular", "Particular", isAutomatico); }
    function executarLogicaQuestoesSaude(isAutomatico = false){ executarLogicaSubMenu("Ausente", "Questões de saúde", "Saúde", isAutomatico); }

    // --- Lógica Logoff (ATUALIZADA V48.3) ---
    function executarLogicaLogoff(isAutomatico = false) {
        if (!isAutomatico && !confirm("Tem certeza que deseja fazer logoff?\nO histórico será zerado.")) {
             console.log("[AÇÃO] Logoff manual cancelado.");
             return;
        }

        if (clicarElemento(SELECTORES.MENU_STATUS_TOGGLE)) {
            setTimeout(() => {
                // CORREÇÃO V48.3: Usa o seletor de texto correto
                if (clicarElemento(SELECTORES.LOGOFF, "Fazer logoff")) {
                    historicoPausas=[];
                    estadoAtual={tipo:'Logoff',inicio:new Date,ativa:!1};
                    atualizarUI();renderizarHistoricoLog();renderizarEstatisticas();
                    if(isAgendamentoAtivo) toggleAgendamento();
                    console.log("[AÇÃO] Logoff iniciado.");
                } else {
                    console.warn("Botão 'Logoff' não encontrado.");
                    clicarElemento(SELECTORES.MENU_STATUS_TOGGLE);
                }
            }, DELAY_ABRIR_MENU);
        }
    }

    // ======================================================
    // FUNÇÕES ORQUESTRADORAS (V46.3)
    // ======================================================

    function iniciarNaFila(isAutomatico = false){
        const status = "Na fila";
        if (isAutomatico) { 
            exibirModalConfirmacao(status, () => {
                registrarPausa(status); 
                executarLogicaNaFila(true);
            }); 
        } else { 
            registrarPausa(status); 
            executarLogicaNaFila(false); 
        }
    }
    
    function iniciarRefeicao(isAutomatico = false){
        const status = "Refeição";
        if (isAutomatico) { 
            exibirModalConfirmacao(status, () => {
                registrarPausa(status);
                executarLogicaRefeicao(true);
            }); 
        } else { 
            registrarPausa(status); 
            executarLogicaRefeicao(false); 
        }
    }

    function voltarDisponivel(isAutomatico = false){
        const status = "Disponível";
        if (isAutomatico) { 
            exibirModalConfirmacao(status, () => {
                registrarPausa(status);
                executarLogicaDisponivel(true);
            }); 
        } else { 
            registrarPausa(status); 
            executarLogicaDisponivel(false); 
        }
    }

    function iniciarTreinamento(isAutomatico = false){
        const status = "Treinamento";
        if (isAutomatico) { 
            exibirModalConfirmacao(status, () => {
                registrarPausa(status);
                executarLogicaTreinamento(true);
            }); 
        } else { 
            registrarPausa(status); 
            executarLogicaTreinamento(false); 
        }
    }

    function iniciarReuniao(isAutomatico = false){
        const status = "Reunião";
        if (isAutomatico) { 
            exibirModalConfirmacao(status, () => {
                registrarPausa(status);
                executarLogicaReuniao(true);
            }); 
        } else { 
            registrarPausa(status); 
            executarLogicaReuniao(false); 
        }
    }

    function iniciarDescanso(isAutomatico = false){
        const status = "Descanso";
        if (isAutomatico) { 
            exibirModalConfirmacao(status, () => {
                registrarPausa(status);
                executarLogicaDescanso(true);
            }); 
        } else { 
            registrarPausa(status); 
            executarLogicaDescanso(false); 
        }
    }

    function iniciarPausaOut(isAutomatico = false){
        const status = "Pausa out";
        if (isAutomatico) { 
            exibirModalConfirmacao(status, () => {
                registrarPausa(status);
                executarLogicaPausaOut(true);
            }); 
        } else { 
            registrarPausa(status); 
            executarLogicaPausaOut(false); 
        }
    }
    
    // --- NOVAS Orquestradoras (V48.0) ---
    
    function iniciarBackoffice(isAutomatico = false){
        const status = "Backoffice"; 
        if (isAutomatico) { 
            exibirModalConfirmacao(status, () => {
                registrarPausa(status);
                executarLogicaBackoffice(true);
            }); 
        } else { 
            registrarPausa(status); 
            executarLogicaBackoffice(false); 
        }
    }
    
    function iniciarFeedback(isAutomatico = false){
        const status = "Feedback";
        if (isAutomatico) { 
            exibirModalConfirmacao(status, () => {
                registrarPausa(status);
                executarLogicaFeedback(true);
            }); 
        } else { 
            registrarPausa(status); 
            executarLogicaFeedback(false); 
        }
    }

    function iniciarParticular(isAutomatico = false){
        const status = "Particular";
        if (isAutomatico) { 
            exibirModalConfirmacao(status, () => {
                registrarPausa(status);
                executarLogicaParticular(true);
            }); 
        } else { 
            registrarPausa(status); 
            executarLogicaParticular(false); 
        }
    }
    
    function iniciarQuestoesSaude(isAutomatico = false){
        const status = "Saúde"; 
        if (isAutomatico) { 
            exibirModalConfirmacao(status, () => {
                registrarPausa(status);
                executarLogicaQuestoesSaude(true);
            }); 
        } else { 
            registrarPausa(status); 
            executarLogicaQuestoesSaude(false); 
        }
    }

    // --- Logoff (Especial) ---
    function realizarLogoff(isAutomatico = false){
        if (isAutomatico) { 
            exibirModalConfirmacao("Logoff", () => {
                executarLogicaLogoff(true);
            }); 
        } else { 
            executarLogicaLogoff(false); 
        }
    }


    // ----------------------------------------------------
    // FUNÇÕES DE VISIBILIDADE, ARRASTE E UI
    // ----------------------------------------------------
    
    function dragMouseDown(e){
        dragElement=e.target.closest('#pausa-script-container, #pausa-script-config-container');
        if(!dragElement)return;
        const isHeaderMain = e.target.closest('#pausa-script-header');
        const isHeaderConfig = e.target.closest('#pausa-script-config-header');
        const isIcon = e.target.closest('#pausa-script-icone');
        if (!isHeaderMain && !isHeaderConfig && !isIcon) { dragElement = null; return; }
        e=e||window.event;if(e.button===0)e.preventDefault();else return; 
        isDragging=false; 
        offsetX=e.clientX-dragElement.offsetLeft;offsetY=e.clientY-dragElement.offsetTop;
        if(dragElement.style.bottom||dragElement.style.right){const t=dragElement.getBoundingClientRect();dragElement.style.left=t.left+'px';dragElement.style.top=t.top+'px';dragElement.style.right='';dragElement.style.bottom=''} 
        document.body.style.userSelect='none';document.onmouseup=closeDragElement;document.onmousemove=elementDrag;
    }
    
    function elementDrag(e){if(!dragElement)return;isDragging=true;e=e||window.event;e.preventDefault();let t=e.clientY-offsetY,l=e.clientX-offsetX;const n=window.innerWidth-dragElement.offsetWidth,o=window.innerHeight-dragElement.offsetHeight;l=Math.max(0,Math.min(l,n));t=Math.max(0,Math.min(t,o));dragElement.style.top=t+"px";dragElement.style.left=l+"px";dragElement.style.cursor='grabbing';}
    
    function closeDragElement(){
        document.body.style.userSelect='';
        if(dragElement){
            if(dragElement.id==='pausa-script-container')salvarPosicaoPainelLocalStorage(STORAGE_KEY_POS_MAIN,dragElement);
            else if(dragElement.id==='pausa-script-config-container')salvarPosicaoPainelLocalStorage(STORAGE_KEY_POS_CONFIG,dragElement); 
            const t=document.getElementById('pausa-script-conteudo');
            if(dragElement.id==='pausa-script-container'&&t&&t.style.display==='none')dragElement.style.cursor='grab'; 
            else{const e=dragElement.querySelector('#pausa-script-header')||dragElement.querySelector('#pausa-script-config-header');if(e)e.style.cursor='move';dragElement.style.cursor='default'}
        } 
        document.onmouseup=null;document.onmousemove=null;
        setTimeout(() => { isDragging = false; }, 50); 
        dragElement=null;
    }

    // ATUALIZADA V47.0
    function toggleVisibilidade() {
        const c=document.getElementById('pausa-script-container'),o=document.getElementById('pausa-script-conteudo'),i=document.getElementById('pausa-script-icone');
        if(!c||!o||!i){console.error("UI Principal não encontrada.");return}
        const m=15;
        if (o.style.display !== 'none') {
            // --- MINIMIZAR ---
            o.style.display = 'none';
            i.style.display = 'flex';
            c.style.width = 'auto';
            c.style.height = 'auto';
            c.style.padding = '5px 12px';
            c.style.cursor = 'grab';
            c.style.fontFamily = "'Courier New', Courier, monospace"; 
            c.style.background='linear-gradient(145deg, rgba(20, 25, 35, 0.9), rgba(30, 35, 50, 0.95))'; 
            c.style.border = '1px solid rgba(0, 255, 255, 0.3)';
        } else {
            // --- MAXIMIZAR ---
            o.style.display = 'block';
            i.style.display = 'none';
            const lE = 300; 
            c.style.width = lE + 'px';
            c.style.height = 'auto';
            c.style.padding = '15px';
            c.style.cursor = 'default';
            c.style.fontFamily = "'Segoe UI',Tahoma,Geneva,Verdana,sans-serif"; 
            c.style.background='linear-gradient(145deg, rgba(25, 30, 40, 0.9), rgba(35, 40, 55, 0.95))'; 
            c.style.border = '1px solid rgba(0, 255, 255, 0.3)';
            
            const h = c.querySelector('#pausa-script-header');
            if (h) h.style.cursor = 'move';
            
            if(c.style.top&&c.style.left){let cT=parseInt(c.style.top,10),cL=parseInt(c.style.left,10);setTimeout(()=>{const hE=c.offsetHeight;const mL=window.innerWidth-lE-m;if(cL>mL){c.style.left=mL+'px'}if(cL<m){c.style.left=m+'px'}const mT=window.innerHeight-hE-m;if(cT>mT){c.style.top=mT+'px'}if(cT<m){c.style.top=m+'px'}},10)}
            else {
                const r=c.getBoundingClientRect();c.style.left=r.left+'px';c.style.top=r.top+'px';
                c.style.bottom = ''; c.style.right = '';
            }
        }
    }
    
    function toggleVisibilidadeConfig(){const c=document.getElementById('pausa-script-config-container');if(!c){console.error("UI Config não encontrada.");return} isConfigPainelAberto=!isConfigPainelAberto;c.style.display=isConfigPainelAberto?'block':'none';if(isConfigPainelAberto){renderizarAgendamentos();renderizarHistoricoLog();renderizarEstatisticas()}}
    function renderizarAgendamentos(){const l=document.getElementById('agendamento-lista');if(!l)return; l.innerHTML='';if(PAUSAS_AGENDADAS.length===0){l.innerHTML='<p style="color:#999;margin:5px 0;font-size:11px;text-align:center;">Nenhum horário agendado.</p>'}else{const r=document.createDocumentFragment();PAUSAS_AGENDADAS.forEach((p,idx)=>{const i=document.createElement('div');i.style.cssText=`display:flex;justify-content:space-between;align-items:center;border-bottom:1px dashed #ffffff15;padding:4px 2px;font-size:11px;`;const tD=document.createElement('div');tD.style.flexGrow='1';tD.innerHTML=`<strong>${p.hora}</strong>: ${p.status}`;const bD=document.createElement('div');bD.style.flexShrink='0';bD.style.marginLeft='10px'; const bE=document.createElement('button');bE.innerHTML='✏️';bE.title=`Editar ${p.hora} - ${p.status}`;bE.style.cssText=`background:0 0;border:none;color:#ffc107;cursor:pointer;font-size:14px;padding:0 4px;opacity:.7;transition:opacity .2s;`;bE.onmouseover=function(){this.style.opacity='1'};bE.onmouseout=function(){this.style.opacity='.7'};bE.onclick=()=>carregarHorarioParaEdicao(idx); const bR=document.createElement('button');bR.innerHTML='❌';bR.title=`Remover ${p.hora} - ${p.status}`;bR.style.cssText=`background:0 0;border:none;color:#ff6b6b;cursor:pointer;font-size:14px;padding:0 4px;margin-left:5px;opacity:.7;transition:opacity .2s;`;bR.onmouseover=function(){this.style.opacity='1'};bE.onmouseout=function(){this.style.opacity='.7'};bR.onclick=()=>removerHorario(idx); bD.appendChild(bE);bD.appendChild(bR);i.appendChild(tD);i.appendChild(bD);r.appendChild(i)});l.appendChild(r)}}
    function renderizarHistoricoLog(){const l=document.getElementById('historico-log');if(!l)return; l.innerHTML='';if(historicoPausas.length===0){l.innerHTML='<p style="color:#999;margin:5px 0;font-size:11px;">Nenhum registro.</p>';return} const f=document.createDocumentFragment();historicoPausas.slice().reverse().forEach(p=>{const i=document.createElement('div');i.style.cssText=`border-bottom:1px dashed #ffffff15;padding:4px 0;font-size:11px;line-height:1.4;`;i.innerHTML=`<strong>${p.tipo}</strong>: ${p.inicio} às ${p.fim} <span style="color:#00b0ff;">(Dur: ${p.duracao})</span>`;f.appendChild(i)});l.appendChild(f);}
    function renderizarEstatisticas(){const s=document.getElementById('estatisticas-pausas');if(!s)return; s.innerHTML='';if(historicoPausas.length===0){s.innerHTML='<p style="color:#999;font-style:italic;margin:5px 0;font-size:11px;">Sem estatísticas.</p>';return} const r={};historicoPausas.forEach(p=>{const t=p.tipo;if(!r[t])r[t]={c:0,s:0};r[t].c++;r[t].s+=converterDuracaoParaSegundos(p.duracao)}); const d=document.createElement('details');d.style.marginTop='10px';d.open=!0; const m=document.createElement('summary');m.style.cssText='cursor:pointer;color:#00b0ff;font-weight:700;margin-bottom:5px;';m.textContent='Estatísticas';d.appendChild(m); const c=document.createElement('div');c.style.cssText=`background-color:#00000040;padding:8px;border-radius:8px;font-size:11px;`; const f=document.createDocumentFragment();const k=Object.keys(r).sort();k.forEach((t,x)=>{const o=r[t];const u=formatarDuracao(o.s);const i=document.createElement('div');i.style.cssText=`display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px dashed #ffffff15;line-height:1.4;`;if(x===k.length-1)i.style.borderBottom='none';i.innerHTML=`<strong>${t} (x${o.c})</strong> <span style="color:#00b0ff;">${u}</span>`;f.appendChild(i)}); c.appendChild(f);d.appendChild(c);s.appendChild(d);}
    function criarUIRelogio(){ /* Removido V44.0 */ }
    function verificarSeletoresEAtualizarUI(){const rD=document.getElementById('seletores-resultados'); if(!rD){console.error("Div resultados não encontrado.");return}console.log("[Diagnóstico] Verificando...");rD.innerHTML='<p style="font-style:italic;color:#bbb;">Verificando...</p>'; let hR='<ul style="list-style:none;padding:0;margin:5px 0 0 0;font-size:11px;">',tO=!0;setTimeout(()=>{Object.keys(SELECTORES).forEach(k=>{const s=SELECTORES[k];if(k==='CLOCK_CONTAINER_PARENT')return; const e=document.querySelector(s);const f=e!==null&&(e.offsetParent!==null||e.tagName==='DIV'); hR+=`<li style="padding:3px 0;border-bottom:1px dashed #ffffff15;display:flex;justify-content:space-between;align-items:center;"><span style="color:#ccc; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${k}">${k}:</span><span><code style="font-size:10px;background-color:rgba(0,255,255,.1);border:1px solid rgba(0,255,255,.2);color:#9fefef;padding:1px 3px;border-radius:3px; max-width: 120px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${s}">${s}</code><span style="margin-left:8px;font-weight:700;color:${f?'#50fa7b':'#ff5555'};">${f?'✔️ Ok':'❌ Falha'}</span></span></li>`;if(!f){tO=!1;console.warn(`[Diagnóstico] Falha ${k}: ${s}`)}});hR+='</ul>';if(tO){hR='<p style="color:#50fa7b;font-weight:700;margin:5px 0;">✔️ Todos OK!</p>'+hR;console.log("[Diagnóstico] OK.")}else{hR='<p style="color:#ff5555;font-weight:700;margin:5px 0;">❌ Atenção: Falha em um ou mais seletores!</p>'+hR;console.warn("[Diagnóstico] Falha(s) encontrada(s).")} rD.innerHTML=hR},50)}

    // --- CRIAR UI PRINCIPAL (ATUALIZADA V48.4 - RELÓGIO HEADER) ---
    function criarUI() {
        const cId='pausa-script-container';let cA=document.getElementById(cId);if(cA)cA.remove(); const c=document.createElement('div');c.id=cId;document.body.appendChild(c);
        
        const pS=carregarPosicaoPainelLocalStorage(STORAGE_KEY_POS_MAIN);
        let cssPos = `position:fixed; ${pS ? (pS.top ? `top:${pS.top};left:${pS.left};` : `bottom:${pS.bottom};right:${pS.right};`) : 'bottom:30px;right:30px;'}`;
        
        c.style.cssText = `${cssPos} 
            width: auto; height: auto; 
            color: #E0E0E0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 5px 12px;
            border-radius: 10px; 
            border: 1px solid rgba(0, 255, 255, 0.3); 
            background: linear-gradient(145deg, rgba(20, 25, 35, 0.9), rgba(30, 35, 50, 0.95)); 
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            z-index: 2147483647; 
            cursor: grab; user-select: none; 
            transition: all .2s ease-out; 
            box-sizing: border-box;`;
        
        c.onmouseenter=(e)=>{if(document.getElementById('pausa-script-conteudo').style.display !== 'none') c.style.background='linear-gradient(145deg, rgba(25, 30, 40, 0.9), rgba(35, 40, 55, 0.95))'};
        c.onmouseleave=()=>{if(document.getElementById('pausa-script-conteudo').style.display !== 'none') c.style.background='linear-gradient(145deg, rgba(20, 25, 35, 0.9), rgba(30, 35, 50, 0.95))'};
        
        // ======================================
        // INÍCIO: ESTILOS (V48.0)
        // ======================================
        c.innerHTML=`<style>
            #${cId} * { box-sizing: border-box; }
            #${cId} .script-btn {
                display: flex; align-items: center; justify-content: flex-start; 
                gap: 10px; padding: 10px 15px; border: none;
                border-radius: 8px; cursor: pointer;
                font-size: 13px; font-weight: 600; color: #FFFFFF;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                background-image: none; 
                box-shadow: 0 3px 5px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1); 
                transition: all 0.15s ease-out;
                width: 100%;
            }
            #${cId} .script-btn:hover {
                filter: brightness(1.1);
                transform: translateY(-2px); 
                box-shadow: 0 5px 12px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1);
            }
            #${cId} .script-btn:active {
                transform: translateY(1px); 
                filter: brightness(0.95);
                box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3); 
            }
            #${cId} #btn-disponivel, #${cId} #btn-toggle-agendamento[style*="background: linear-gradient(135deg, rgb(35, 167, 69)"] { background: linear-gradient(135deg, #23a745, #2dc24f); }
            #${cId} #btn-toggle-agendamento[style*="background: linear-gradient(135deg, rgb(220, 53, 69)"] { background: linear-gradient(135deg, #dc3545, #e84a5f); }
            #${cId} #btn-pause-resume-agendamento[style*="background: linear-gradient(135deg, rgb(255, 193, 7)"] { background: linear-gradient(135deg, #ffc107, #ffd25a); color: #000; }
            #${cId} #btn-pause-resume-agendamento[style*="background: linear-gradient(135deg, rgb(0, 127, 255)"] { background: linear-gradient(135deg, #007FFF, #009cff); color: #fff; }
            #${cId} #btn-na-fila { background: linear-gradient(135deg, #0096C7, #00bfff); }
            #${cId} #btn-refeicao { background: linear-gradient(135deg, #fd7e14, #ff9a40); }
            #${cId} #btn-descanso { background: linear-gradient(135deg, #ffc107, #ffd25a); color: #000; }
            #${cId} #btn-pausa-out { background: linear-gradient(135deg, #e63946, #f45b69); }
            #${cId} #btn-treinamento { background: linear-gradient(135deg, #6a00c9, #8e2de2); }
            #${cId} #btn-backoffice { background: linear-gradient(135deg, #c94b4b, #d46a6a); }
            #${cId} #btn-feedback { background: linear-gradient(135deg, #e85d04, #fa7e30); }
            #${cId} #btn-particular { background: linear-gradient(135deg, #8338ec, #9f60f0); }
            #${cId} #btn-saude { background: linear-gradient(135deg, #5e60ce, #7b7de0); }
            #${cId} #btn-reuniao { background: linear-gradient(135deg, #00c9c9, #30dede); color: #000; }
            #${cId} #btn-logoff { background: linear-gradient(135deg, #6c757d, #868e96); }
            #${cId} .automation-controls { display: flex; gap: 8px; }
            #${cId} .automation-controls .script-btn {
                width: auto; flex-grow: 1;
                font-size: 13px;
                justify-content: center;
                padding: 10px 8px;
            }
            #${cId} #pausa-script-header {
                display: flex; justify-content: space-between; align-items: center;
                margin-bottom: 12px; padding-bottom: 8px;
                border-bottom: 1px solid rgba(0, 255, 255, 0.2);
                cursor: move;
            }
            #${cId} #pausa-script-header h3 {
                color: #0FF; text-shadow: 0 0 8px rgba(0, 255, 255, 0.7);
                margin: 0; font-size: 16px; font-weight: 600;
            }
            #${cId} #pausa-script-header span { transition: color .2s; }
            #${cId} #pausa-script-header span#btn-abrir-config { cursor: pointer; color: #0FF; font-size: 20px; margin-right: 12px; }
            #${cId} #pausa-script-header span#btn-abrir-config:hover { color: #5FF; }
            #${cId} #pausa-script-header span#btn-minimizar { cursor: pointer; color: #ff5555; font-size: 16px; font-weight: 700; }
            #${cId} #pausa-script-header span#btn-minimizar:hover { color: #ff8080; }
            #${cId} #status-display {
                background-color: rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(0, 0, 0, 0.3);
                box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.4);
                color: #FFF;
                padding: 10px; border-radius: 8px;
                margin-bottom: 15px; text-align: center;
                font-size: 14px;
            }
            #${cId} #current-status { font-weight: 700; }
            #${cId} #current-status[style*="rgb(80, 250, 123)"] { color: #50fa7b; }
            #${cId} #current-status[style*="rgb(241, 250, 140)"] { color: #f1fa8c; }
            #${cId} #pausa-script-icone {
                display: flex; align-items: center; justify-content: center;
                width: 100%; height: 100%; cursor: grab;
            }
            #${cId} #top-bar-time {
                font-size: 1.5em;
                font-weight: 700; white-space: nowrap;
                color: #0FF;
                text-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
            }
            #${cId} #pausa-script-clock-dot {
                width: 8px; height: 8px;
                background-color: #f1fa8c;
                border-radius: 50%;
                margin-right: 8px;
                box-shadow: 0 0 5px #f1fa8c, 0 0 10px #f1fa8c;
                animation: blink-animation 1.5s infinite ease-in-out;
            }
            #${cId} #pausa-script-clock-dot.status-ok {
                background-color: #50fa7b;
                box-shadow: 0 0 5px #50fa7b, 0 0 10px #50fa7b;
            }
            @keyframes blink-animation {
                0% { opacity: 1; }
                50% { opacity: 0.3; }
                100% { opacity: 1; }
            }
            </style>
        
            <div id="pausa-script-icone" style="display:flex;">
                 <span id="pausa-script-clock-dot" style="display: none;"></span> 
                 <span id="top-bar-time">--:--:--</span>
            </div>
            
            <div id="pausa-script-conteudo" style="display:none; padding:0;">
                
                <div id="pausa-script-header">
                    <h3 style="">🛠️ Gerenciador</h3>
                    
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span id="pausa-script-header-clock" style="
                            font-size: 15px; 
                            font-family: 'Courier New', Courier, monospace; 
                            color: #f1fa8c; 
                            text-shadow: 0 0 5px rgba(241, 250, 140, 0.5);
                            line-height: 1;
                        ">--:--:--</span>
                        
                        <div style="flex-shrink:0;">
                            <span id="btn-abrir-config" title="Configurações">⚙️</span>
                            <span id="btn-minimizar" title="Fechar Painel">[X]</span>
                        </div>
                    </div>
                    </div>
                
                <div id="status-display">Status: <strong id="current-status" style="color:#50fa7b;">${estadoAtual.tipo}</strong></div>
                
                <div class="automation-controls" style="margin-bottom:15px; text-align:center;">
                    <button id="btn-toggle-agendamento" class="script-btn" style="flex-basis:65%;">Ligar Automação</button>
                    <button id="btn-pause-resume-agendamento" class="script-btn" style="display:none;flex-basis:35%;">Pausar ⏸️</button>
                </div>
                
                <div id="buttons-container" style="display:grid;grid-template-columns:repeat(2, 1fr);gap:10px;margin-bottom:10px;">
                    <button id="btn-disponivel" class="script-btn">🟢 Disponível</button>
                    <button id="btn-na-fila" class="script-btn">🎧 Na Fila</button>
                    <button id="btn-refeicao" class="script-btn">🍔 Refeição</button>
                    <button id="btn-descanso" class="script-btn">☕ Descanso</button>
                    <button id="btn-pausa-out" class="script-btn">⛔ Pausa Out</button>
                    <button id="btn-treinamento" class="script-btn">📚 Treinamento</button>
                    <button id="btn-backoffice" class="script-btn">📁 Backoffice</button>
                    <button id="btn-feedback" class="script-btn">📝 Feedback</button>
                    <button id="btn-particular" class="script-btn">🔒 Particular</button>
                    <button id="btn-saude" class="script-btn">🩺 Saúde</button>
                </div>
                
                <div id="buttons-extra" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <button id="btn-reuniao" class="script-btn">🧑‍🤝‍🧑 Reunião</button>
                    <button id="btn-logoff" class="script-btn">🚪 Fazer Logoff</button>
                </div>
            </div>
        `;
        
        const header = c.querySelector('#pausa-script-header');
        const icone = c.querySelector('#pausa-script-icone');
        if (header) header.onmousedown = dragMouseDown;
        if (icone) icone.onmousedown = dragMouseDown; 

        c.addEventListener('click',function(e){
            if (isDragging) { isDragging = false; return; }
            const t=e.target.closest('button'),n=e.target.closest('span#btn-minimizar, span#btn-abrir-config'),o=e.target.closest('div#pausa-script-icone');let l=t||n||o;if(!l)return; 
            const d=document.getElementById('pausa-script-conteudo');
            if (o && d && d.style.display==='none'){ toggleVisibilidade(); return; }
            const a=document.getElementById('pausa-script-header');
            if (d.style.display!=='none'&&a&&a.contains(e.target)&&!n&&!t)return;
            
            const i=l.id;switch(i){
                case'btn-na-fila':iniciarNaFila(false);break; 
                case'btn-refeicao':iniciarRefeicao(false);break;
                case'btn-descanso':iniciarDescanso(false);break; 
                case'btn-pausa-out':iniciarPausaOut(false);break;
                case'btn-disponivel':voltarDisponivel(false);break; 
                case'btn-logoff':realizarLogoff(false);break;
                case'btn-treinamento':iniciarTreinamento(false);break; 
                case'btn-reuniao':iniciarReuniao(false);break;
                case'btn-backoffice':iniciarBackoffice(false);break;
                case'btn-feedback':iniciarFeedback(false);break;
                case'btn-particular':iniciarParticular(false);break;
                case'btn-saude':iniciarQuestoesSaude(false);break;
                case'btn-toggle-agendamento':toggleAgendamento();break; 
                case'btn-pause-resume-agendamento':togglePausaAutomacao();break;
                case'btn-minimizar':toggleVisibilidade();break; 
                case'btn-abrir-config':toggleVisibilidadeConfig();break;
            }
        });
        
        const bTg=c.querySelector('#btn-toggle-agendamento'),bP=c.querySelector('#btn-pause-resume-agendamento');
        if(bTg&&bP){
            if(isAgendamentoAtivo){
                bTg.textContent="Desligar Automação";
                bTg.style.background = 'linear-gradient(135deg, #dc3545, #e84a5f)';
                bP.style.display='inline-block';
                if(isAutomacaoPausada){
                    bP.textContent="Retomar ▶️";
                    bP.style.background = 'linear-gradient(135deg, #007FFF, #009cff)';
                    bP.style.color = '#fff';
                }else{
                    bP.textContent="Pausar ⏸️";
                    bP.style.background = 'linear-gradient(135deg, #ffc107, #ffd25a)';
                    bP.style.color = '#000';
                }
            }else{
                bTg.textContent="Ligar Automação";
                bTg.style.background = 'linear-gradient(135deg, #23a745, #2dc24f)';
                bP.style.display='none';
            }
        }
        
        registrarPausa(estadoAtual.tipo);
        adicionarAtalho();
        setInterval(atualizarUI,1000);
    }

    // --- CRIAR UI CONFIGURAÇÕES (ATUALIZADA V48.1 - CÓDIGO CORRETO) ---
    function criarUIConfiguracoes() {
        const cId='pausa-script-config-container';let cA=document.getElementById(cId);if(cA)cA.remove(); const cC=document.createElement('div');cC.id=cId;document.body.appendChild(cC); const pSC=carregarPosicaoPainelLocalStorage(STORAGE_KEY_POS_CONFIG);
        let cssPos = `position:fixed; ${pSC ? (pSC.top ? `top:${pSC.top};left:${pSC.left};` : `bottom:${pSC.bottom};right:${pSC.right};`) : 'bottom:30px;right:340px;'}`;
        
        // V48.0 - Estilo do Painel de Configuração
        cC.style.cssText=`${cssPos} 
            width:340px;
            background: linear-gradient(145deg, rgba(25, 30, 40, 0.9), rgba(35, 40, 55, 0.95));
            color:#E0E0E0;
            border:1px solid rgba(0,255,255,.3);
            border-radius:10px;padding:15px;
            z-index:2147483646;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 255, 255, 0.1);
            font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;
            font-size:13px;height:auto;max-height:calc(100vh - 60px);
            backdrop-filter:blur(10px);
            transition:all .3s ease-in-out;display:none;overflow-y:auto;
            box-sizing:border-box;cursor:default;`;
        
        // V48.0 - CSS Interno do Painel de Configuração
        cC.innerHTML=`<style>
            #${cId} *{box-sizing:border-box}
            #${cId} .script-btn-config{
                padding:10px 15px;border:none;border-radius:8px;cursor:pointer;
                font-size:13px;font-weight:600;color:#fff;
                text-shadow: 0 1px 2px rgba(0,0,0,0.3);
                box-shadow: 0 3px 5px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1); 
                transition:all .15s ease-out;
                width:100%;box-sizing:border-box;
            }
            #${cId} .script-btn-config:hover{filter:brightness(1.1); transform: translateY(-2px); box-shadow: 0 5px 12px rgba(0, 0, 0, 0.4);}
            #${cId} .script-btn-config:active{transform:translateY(1px); filter:brightness(.95); box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);}
            
            #${cId} details{
                margin-top:15px;border:1px solid rgba(0,255,255,.1);
                border-radius:8px;background-color:rgba(0,0,0,.2);
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);
            }
            #${cId} summary{padding:10px 12px;cursor:pointer;color:#0FF;font-weight:600;list-style:none;display:flex;align-items:center}
            #${cId} summary::before{content:'▶';margin-right:8px;font-size:10px;transition:transform .2s;display:inline-block}
            #${cId} details[open]>summary::before{transform:rotate(90deg)}
            #${cId} details>div{padding:12px;border-top:1px solid rgba(0,255,255,.1)}
            
            #${cId} .add-schedule-form{display:flex;gap:8px;margin-top:10px;align-items:center}
            #${cId} .add-schedule-form input[type=time],#${cId} .add-schedule-form input[type=text]{
                background-color:rgba(0,0,0,.3);
                border:1px solid rgba(0,255,255,.3);
                color:#E0E0E0;padding:8px;border-radius:6px;font-size:13px;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);
            }
            #${cId} .add-schedule-form input[type=time]{flex-basis:90px;flex-shrink:0}
            #${cId} .add-schedule-form input[type=text]{flex-grow:1}
            #${cId} .add-schedule-form button{ 
                flex-shrink:0;padding:8px 14px!important;font-size:14px!important;
                width:auto!important;
                background: linear-gradient(135deg, #23a745, #2dc24f) !important;
                font-weight:700; border: none;
                border-radius: 8px;
                box-shadow: 0 3px 5px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.1); 
            }
            #${cId} .add-schedule-form button:hover{filter:brightness(1.1); transform: translateY(-2px);}
            #${cId} .add-schedule-form button:active{transform:translateY(1px); filter:brightness(.95);}

            #${cId} #agendamento-lista{max-height:150px;overflow-y:auto;margin-bottom:10px;border-radius:6px;padding:8px;background-color:rgba(0,0,0,.25);}
            #${cId} #agendamento-lista div button{background:0 0;border:none;cursor:pointer;font-size:14px;padding:0 4px;margin-left:5px;opacity:.7;transition:opacity .2s}
            #${cId} #agendamento-lista div button:hover{opacity:1}
            #${cId} #agendamento-lista button[title*=Editar]{color:#ffc107}
            #${cId} #agendamento-lista button[title*=Remover]{color:#ff6b6b}
            #${cId} #historico-log div,#${cId} #seletores-resultados li{border-color:rgba(0,255,255,.15)!important}
            
            #${cId} #pausa-script-config-header h3{color:#0FF;text-shadow:0 0 8px rgba(0,255,255,.7)}
            #${cId} #pausa-script-config-header span#btn-fechar-config{color:#ff5555;transition:color .2s; font-size: 16px; font-weight: 700;}
            #${cId} #pausa-script-config-header span#btn-fechar-config:hover{color:#ff8080}
            
            #${cId} code{background-color:rgba(0,255,255,.1);border:1px solid rgba(0,255,255,.2);color:#9fefef;padding:1px 3px;border-radius:3px;font-size:10px}
            #${cId} .config-item{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:13px}
            #${cId} .config-item label{color:#ccc}
            #${cId} .config-item input[type=checkbox]{margin-left:10px;accent-color:#0FF; transform: scale(1.1);}
            #${cId} .config-item input[type=number]{
                width:55px;background-color:rgba(0,0,0,.3);
                border:1px solid rgba(0,255,255,.3);color:#E0E0E0;
                padding:4px 6px;border-radius:6px;font-size:13px;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);
            }

            #${cId} #btn-exportar-config { background: linear-gradient(135deg, #007FFF, #009cff); border: none; }
            #${cId} #btn-importar-config { background: linear-gradient(135deg, #6c757d, #868e96); border: none; }
            #${cId} #btn-verificar-seletores { background: linear-gradient(135deg, #5a6268, #7a8288); border: none; }
            </style>
            
            <div id="pausa-script-config-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:5px;border-bottom:1px solid rgba(0,255,255,.2);cursor:move;"><h3 style="margin:0;font-size:15px;">⚙️ Config & Histórico</h3><span id="btn-fechar-config" style="cursor:pointer;" title="Fechar Configurações">[X]</span></div>
            <div id="estatisticas-pausas" style="margin-bottom:0;"></div>
            
            <details><summary>🔔 Configurar Notificações</summary><div id="notificacao-config" style="padding-bottom:5px;"><div class="config-item"><label for="notif-ativadas">Ativar Notificações Visuais:</label><input type="checkbox" id="notif-ativadas"></div><div class="config-item"><label for="notif-som">Ativar Som da Notificação:</label><input type="checkbox" id="notif-som"></div><div class="config-item"><label for="notif-tempo">Antecedência (segundos):</label><input type="number" id="notif-tempo" min="5" max="55" step="5"></div></div></details>
            
            <details open><summary>Editar Horários</summary><div id="agendamento-edit"><p style="font-size:11px;color:#aaa;margin:0 0 5px 0;">Agendamentos Atuais:</p><div id="agendamento-lista"></div><p style="font-size:11px;color:#aaa;margin:10px 0 5px 0;">Adicionar / Substituir:</p><div class="add-schedule-form"><input type="time" id="novo-horario-hora" required><input type="text" id="novo-horario-status" placeholder="Status (Ex: Refeição, Backoffice)" required><button id="btn-adicionar-horario" class="script-btn-config" title="Adicionar ou Substituir Horário">+</button></div></div></details>
            
            <details open><summary>Histórico de Pausas</summary><div id="historico-log" style="max-height:150px;overflow-y:auto;background-color:transparent;padding:0;border-radius:0;"></div></details>
            
            <details><summary>🩺 Diagnóstico Seletores</summary><div id="seletores-check" style="background-color:transparent;padding:0;"><p style="font-size:11px;color:#aaa;margin:0 0 8px 0;">Verifica validade dos seletores CSS.</p><button id="btn-verificar-seletores" class="script-btn-config" style="margin-bottom:8px;">Verificar Agora</button><div id="seletores-resultados" style="max-height:150px;overflow-y:auto;"><p style="color:#888;font-style:italic;font-size:11px;">Clique em "Verificar Agora".</p></div></div></details>
            
            <details><summary>💾 Backup e Restauração</summary><div id="backup-restore" style="padding-bottom:5px;"><p style="font-size:11px;color:#aaa;margin:0 0 8px 0;">Salve ou carregue suas configurações.</p><div style="display:flex;gap:8px;"><button id="btn-exportar-config" class="script-btn-config" style="flex-basis:50%;">Exportar</button><button id="btn-importar-config" class="script-btn-config" style="flex-basis:50%;">Importar</button></div><input type="file" id="import-file-input" accept=".json" style="display:none;"></div></details>
        `;
        
        const hC=cC.querySelector('#pausa-script-config-header');if(hC)hC.onmousedown=dragMouseDown;
        const bF=cC.querySelector('#btn-fechar-config');if(bF)bF.onclick=toggleVisibilidadeConfig;
        const bV=cC.querySelector('#btn-verificar-seletores');if(bV)bV.onclick=verificarSeletoresEAtualizarUI;
        const bA=cC.querySelector('#btn-adicionar-horario');if(bA)bA.onclick=adicionarNovoHorario;
        const cN=cC.querySelector('#notif-ativadas'),cS=cC.querySelector('#notif-som'),iT=cC.querySelector('#notif-tempo');if(cN)cN.checked=configNotificacao.ativadas;if(cS)cS.checked=configNotificacao.somAtivado;if(iT)iT.value=configNotificacao.antecedenciaSegundos;
        function sM(){configNotificacao.ativadas=cN.checked;configNotificacao.somAtivado=cS.checked;let t=parseInt(iT.value,10);if(isNaN(t)||t<5)t=5;if(t>55)t=55;iT.value=t;configNotificacao.antecedenciaSegundos=t;salvarConfiguracoesNotificacaoLocalStorage(configNotificacao);console.log("[Config Notif] Salvas:",configNotificacao)}
        if(cN)cN.onchange=sM;if(cS)cS.onchange=sM;if(iT)iT.onchange=sM;
        const bE=cC.querySelector('#btn-exportar-config');if(bE)bE.onclick=exportarConfiguracoes;
        const bI=cC.querySelector('#btn-importar-config');if(bI)bI.onclick=importarConfiguracoes;
        const fI=cC.querySelector('#import-file-input');if(fI)fI.onchange=handleArquivoImportado;

        renderizarAgendamentos();renderizarHistoricoLog();renderizarEstatisticas();
    }

    // ATUALIZADA V48.4 (Controla o novo relógio do cabeçalho)
    function atualizarUI() {
        const a=new Date,h=a.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
        
        // Relógio minimizado
        const tFlutuante=document.getElementById('top-bar-time');
        const tDot=document.getElementById('pausa-script-clock-dot'); // V48.0
        
        // --- INÍCIO DA MODIFICAÇÃO V48.4 ---
        // Novo relógio do cabeçalho
        const tHeader = document.getElementById('pausa-script-header-clock');
        // --- FIM DA MODIFICAÇÃO V48.4 ---


        if(tFlutuante){
            tFlutuante.textContent=h;
            // Lógica da Cor do Relógio
            if(estadoAtual.tipo==='Disponível'||estadoAtual.tipo==='Na fila') tFlutuante.style.color = '#50fa7b';
            else if (estadoAtual.tipo === 'Logoff') tFlutuante.style.color = '#999';
            else tFlutuante.style.color = '#f1fa8c';
        }
        
        // --- INÍCIO DA MODIFICAÇÃO V48.4 ---
        // Atualiza o novo relógio do cabeçalho e aplica a mesma lógica de cor
        if(tHeader) {
            tHeader.textContent = h;
            if(estadoAtual.tipo==='Disponível'||estadoAtual.tipo==='Na fila') {
                tHeader.style.color = '#50fa7b';
                tHeader.style.textShadow = '0 0 5px rgba(80, 250, 123, 0.5)';
            }
            else if (estadoAtual.tipo === 'Logoff') {
                tHeader.style.color = '#999';
                tHeader.style.textShadow = 'none';
            }
            else {
                tHeader.style.color = '#f1fa8c'; // Cor de pausa
                tHeader.style.textShadow = '0 0 5px rgba(241, 250, 140, 0.5)';
            }
        }
        // --- FIM DA MODIFICAÇÃO V48.4 ---
        
        // V48.0 - Lógica do Ponto Piscante
        if (tDot) {
            if (estadoAtual.ativa) { // 'ativa' é true para tudo, exceto Logoff
                tDot.style.display = 'block';
                // Muda a cor do ponto para verde se estiver 'OK'
                if (estadoAtual.tipo==='Disponível'||estadoAtual.tipo==='Na fila') {
                    tDot.className = 'status-ok';
                } else {
                    tDot.className = ''; // Usa a cor amarela padrão
                }
            } else {
                tDot.style.display = 'none'; // Esconde o ponto (Ex: Logoff)
            }
        }

        const s=document.getElementById('current-status');if(s){let e='';
            
            if(estadoAtual.ativa){
                const o=a.getTime()-estadoAtual.inicio.getTime();
                const r=Math.max(0,Math.round(o/1000));
                e=` (${formatarDuracao(r)})`;
            }
            
            s.textContent=`${estadoAtual.tipo}${e}`;
            
            s.style.color=(estadoAtual.tipo==='Disponível'||estadoAtual.tipo==='Na fila')?'#50fa7b':'#f1fa8c';
        }
    }

    // ----------------------------------------------------
    // INÍCIO DO SCRIPT
    // ----------------------------------------------------
    console.log("[GERENCIADOR DE PAUSAS V48.4] Aguardando para injetar UI...");
    const delayInicial = 2800;
    
    setTimeout(() => {
        try {
            configNotificacao = carregarConfiguracoesNotificacaoLocalStorage();
            PAUSAS_AGENDADAS = carregarHorariosLocalStorage();

            console.log("[GERENCIADOR] Solicitando permissão para notificações...");
            if (configNotificacao.ativadas && "Notification" in window && Notification.permission === 'default') { Notification.requestPermission().then(p => { if(p==='granted'){ console.log("[Notificação] Permissão OK!"); new Notification("Gerenciador",{body:"Notificações Ativadas!"})} else { console.warn("[Notificação] Permissão Negada."); localStorage.setItem('notificacao_permissao_negada_aviso','true');} }); }
            else if (Notification.permission === 'denied') { console.warn("[Notificação] Permissão Negada Anteriormente."); localStorage.setItem('notificacao_permissao_negada_aviso','true'); }

            console.log("[GERENCIADOR] Injetando UI...");
            criarUI();
            criarUIConfiguracoes(); // Esta é a função que foi corrigida
            renderizarAgendamentos();
            console.log("[GERENCIADOR] UI Injetada.");
            
            audioNotificacao.volume = 0.5;
            document.addEventListener('click', desbloquearAudio, { once: true });
            console.log("[Audio] Pronto para desbloquear no próximo clique.");

        } catch (error) {
            console.error("[GERENCIADOR] Erro crítico ao iniciar:", error);
            alert("Erro grave ao iniciar o Gerenciador. Verifique o console (F12).");
        }
    }, delayInicial);

})(); // Fim do IIFE
