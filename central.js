// ==UserScript==
// @name         PureCloud - Central de Conhecimento (Módulo Extensão)
// @description  Base completa de conhecimento integrada ao Menu Unificado.
// ==/UserScript==

(function() {
    'use strict';

    // 1. TEMPLATES HTML
    const TPL = {
        sistema: (titulo, subtitulo, conteudo, link) => `
            <div class="wiki-content system-theme">
                <div class="wiki-header">
                    <h3 style="color:#8be9fd;">🖥️ ${titulo}</h3>
                    <p class="wiki-subtitle">${subtitulo}</p>
                </div>
                <div class="wiki-body">${conteudo}</div>
                ${link && link !== '#' ? `<div class="wiki-footer"><a href="${link}" target="_blank" class="btn-acesso">Acessar Agora ↗</a></div>` : ''}
            </div>`,
        produto: (titulo, subtitulo, conteudo) => `
            <div class="wiki-content product-theme">
                <div class="wiki-header">
                    <h3 style="color:#f1fa8c;">📦 ${titulo}</h3>
                    <p class="wiki-subtitle">${subtitulo}</p>
                </div>
                <div class="wiki-body">${conteudo}</div>
            </div>`,
        tecnico: (titulo, resumo, conteudo, link = null) => `
            <div class="wiki-content tech-theme">
                <div class="wiki-header">
                    <h3 style="color:#ff79c6;">🛠️ ${titulo}</h3>
                </div>
                <div class="wiki-summary"><strong>RESUMO:</strong> ${resumo}</div>
                <div class="wiki-body">${conteudo}</div>
                ${link ? `<div class="wiki-footer"><a href="${link}" target="_blank" class="btn-acesso">Abrir Documento/Link ↗</a></div>` : ''}
            </div>`
    };

    // 2. BANCO DE DADOS COMPLETO
    const BRISA_DB = {
        systems: [
            { label: "YODA", icon: "🧙‍♂️", desc: "ERP Central", url: "https://revan-atendimento.brisanet.net.br/#/yoda/dashboard", details: TPL.sistema("YODA", "Gestão Integrada", `<h4>📌 Funções Principais:</h4><ul><li><b>Financeiro:</b> Verificação de faturas, desbloqueio em confiança e negociação.</li><li><b>Contratos:</b> Status do cliente (Ativo, Bloqueado, Cancelado).</li><li><b>Provisionamento:</b> Reenvio de comandos para a ONU/Modem.</li></ul><p><b>Dica:</b> Sempre verifique se há "OS em Aberto" antes de criar um novo atendimento.</p>`, "https://revan-atendimento.brisanet.net.br/#/yoda/dashboard") },
            { label: "Genesys", icon: "☁️", desc: "Telefonia", url: "https://apps.sae1.pure.cloud/directory/", details: TPL.sistema("Genesys Cloud", "Contact Center", `<h4>📌 Status do Agente:</h4><ul><li><b>On Queue (Na Fila):</b> Pronto para receber chamadas.</li><li><b>ACW (Pós-atendimento):</b> Tempo para tabular o chamado anterior.</li></ul><p>Se o áudio falhar, pressione F5 ou limpe o cache.</p>`, "https://apps.sae1.pure.cloud/directory/") },
            { label: "LTM (FWA)", icon: "⚙️", desc: "Gestão 5G", url: "https://mae-ltm.brisanet.net.br/unisso/login.action", details: TPL.tecnico("LTM (Axess)", "Gestão de Modems 5G/4G", `<h4>📡 Parâmetros de Sinal (RSRP):</h4><ul><li><b>-50 a -90 dBm:</b> Excelente.</li><li><b>-91 a -105 dBm:</b> Bom/Regular.</li><li><b>-110 dBm ou mais:</b> Sinal Crítico (Lentidão). Tentar reposicionar o equipamento.</li></ul>`, "https://mae-ltm.brisanet.net.br/unisso/login.action") },
            { label: "PASTOR", icon: "🐑", desc: "Rede Externa", url: "https://pastor.brisanet.net.br/#/authentication/login", details: TPL.sistema("PASTOR", "Mapeamento", "<p>Georreferenciamento de rede, CTOs e viabilidade técnica.</p>", "https://pastor.brisanet.net.br/#/authentication/login") },
            { label: "Raumil", icon: "📡", desc: "Campo", url: "https://raumil.brisanet.net.br/#/login", details: TPL.sistema("Raumil", "Field Service", "<p>Gestão de técnicos de campo e OS.</p>", "https://raumil.brisanet.net.br/#/login") },
            { label: "SASKI", icon: "🧩", desc: "Estoque", url: "https://saski.brisanet.net.br/", details: TPL.sistema("SASKI", "Logística", "<p>Controle de patrimônio e equipamentos.</p>", "https://saski.brisanet.net.br/") },
            { label: "Meu RH", icon: "👥", desc: "Colaborador", url: "https://brisanetservicos138386.rm.cloudtotvs.com.br/FrameHTML/web/app/RH/PortalMeuRH/#/login", details: TPL.sistema("Meu RH", "Autoatendimento", "<p>Contracheques, ponto e férias.</p>", "https://brisanetservicos138386.rm.cloudtotvs.com.br/FrameHTML/web/app/RH/PortalMeuRH/#/login") },
            { label: "Jira", icon: "🎫", desc: "Chamados TI", url: "https://brisanet.atlassian.net/servicedesk/customer/portals", details: TPL.sistema("Jira Service", "Suporte Interno", "<p>Abertura de chamados para TI e Sistemas.</p>", "https://brisanet.atlassian.net/servicedesk/customer/portals") },
            { label: "Looker", icon: "📊", desc: "Métricas", url: "https://lookerstudio.google.com/reporting/b16d26d9-a2c7-48d3-b595-d39737b610ca/page/p_icvajs4fjd?pli=1", details: TPL.sistema("Looker", "Dashboard", "<p>Acompanhamento de métricas (TMA, TME).</p>", "https://lookerstudio.google.com/reporting/b16d26d9-a2c7-48d3-b595-d39737b610ca/page/p_icvajs4fjd?pli=1") }
        ],
        materials: [
            { label: "Mapa Cobertura 1", icon: "🗺️", desc: "Google Maps", details: TPL.sistema("Mapa 1", "Cobertura Técnica", "<p>Mapa operacional.</p>", "https://www.google.com/maps/d/viewer?mid=1rmfAe5YTRjsPeN9tnkZJzsj3fNGC7QI&femb=1&ll=-5.3780124559692535%2C-36.970868593510744&z=8") },
            { label: "Mapa Cobertura 2", icon: "🗺️", desc: "Google Maps", details: TPL.sistema("Mapa 2", "Cobertura Técnica", "<p>Mapa operacional.</p>", "https://www.google.com/maps/d/u/0/viewer?hl=pt-BR&ll=-6.02942900614608%2C-38.38409606722841&z=12&mid=1ZaOEDR9_2xOACjZoip1xFkBstS_SSqo") },
            { label: "Site Cobertura", icon: "🌐", desc: "Site Oficial", details: TPL.sistema("Site Brisanet", "Viabilidade", "<p>Consulta pública de cobertura.</p>", "https://www.brisanet.com.br/mapa-de-area-de-cobertura") },
            { label: "Abertura IMOC", icon: "📝", desc: "Incidentes", details: TPL.sistema("IMOC", "Abertura de Chamado", "<p>Para eventos massivos e manutenção de rede.</p>", "https://docs.google.com/forms/d/e/1FAIpQLSdOStjaDN5FZ73EaIYCxvA5PA5S3uPqWWWdaOM4ltNzzAamFQ/viewform") },
            { label: "Regularização Drop", icon: "➰", desc: "Manutenção", details: TPL.sistema("Cabo Drop", "Manutenção", "<p>Solicitar reparo de cabos baixos ou partidos.</p>", "https://docs.google.com/forms/d/e/1FAIpQLSezeLhFUVyh-3W1mkPAxUOBp623O5Yx6Re12vcH0jKpSUFE2g/viewform") },
            { label: "Reagendamento", icon: "📆", desc: "Solicitação", details: TPL.sistema("Reagendamento", "Reporte", "<p>Quando o agendamento muda sem aviso.</p>", "https://docs.google.com/forms/d/e/1FAIpQLSfN-rzjuS2unjZiIhxfxIdyhlU_S7ypfqh_NwWWLeDTlIKQZg/viewform") },
            { label: "Cobrança Prazo", icon: "⏰", desc: "SLA", details: TPL.sistema("Cobrança SLA", "Atraso", "<p>Cobrar chamados fora do prazo.</p>", "https://docs.google.com/forms/d/e/1FAIpQLSf7C6JvJW4O-0fodj2rsymzLauNDpMMZIA6Or7ZSri5jS18aQ/viewform") },
            { label: "Planilha Apoio", icon: "📑", desc: "Geral", details: TPL.sistema("Planilha Apoio", "Controle", "<p>Planilha de apoio operacional.</p>", "https://docs.google.com/spreadsheets/d/1c0BbUVV7oI3f4v3hA-ONea_jJoeqvpBU8mandBEQeR0/edit?gid=1798580531#gid=1798580531") },
            { label: "Códigos", icon: "🔢", desc: "Tabulação", details: TPL.sistema("Códigos", "Encerramento", "<p>Lista de códigos de tabulação.</p>", "https://docs.google.com/spreadsheets/d/108CeKc84WUCiP0Np6F8htHgwy7Y37jqlCq24LC0Y6no/edit?gid=769704755#gid=769704755") },
            { label: "Escala", icon: "📅", desc: "Turnos", details: TPL.sistema("Escala", "Horários", "<p>Escala de trabalho da equipe.</p>", "https://docs.google.com/spreadsheets/d/1EKO1APFQXNAjdEzwpC1naoYR4wKUYqj6vYUGGDdihmM/edit?gid=0#gid=0") },
            { label: "Ramais", icon: "☎️", desc: "Contatos", details: TPL.sistema("Lista de Ramais", "Interno", "<p>Lista de contatos corporativos.</p>", "https://docs.google.com/spreadsheets/d/1-QKtRfxW0EQWTFs967N6EYrvkMDUG4d7gfQNY-uiZ2g/edit?gid=1764454763#gid=1764454763") },
            { label: "Vagas", icon: "💼", desc: "RH", details: TPL.sistema("Vagas", "Indicação", "<p>Planilha de indicação de vagas.</p>", "https://docs.google.com/spreadsheets/d/17Scc98dmXg8-9bSiSu4ujP1Ig_J51e5Deqj9CD42QiA/edit?gid=1615271674#gid=1615271674") }
        ],
        products_list: [
            { label: "Netflix", icon: "🔴", desc: "Filmes e Séries", details: TPL.produto("Netflix", "Parceria via Fatura", `<h4>🔑 Como Ativar:</h4><p>O cliente recebe um <b>SMS ou E-mail</b> com o link de ativação após a instalação. Caso não encontre, pode acessar a área do cliente (App Brisanet).</p><h4>⚠️ Problemas Comuns:</h4><ul><li><b>"Atualize sua forma de pagamento":</b> O vínculo com a provedora caiu. Verifique no YODA se o contrato está ativo e peça para o cliente refazer o login pelo link da parceria.</li><li><b>Login em Smart TV:</b> O cliente deve usar o e-mail e senha cadastrados na Netflix, <b>NÃO</b> a senha da central do assinante.</li><li><b>Planos:</b> Padrão (2 telas, HD) | Premium (4 telas, 4K).</li></ul>`) },
            { label: "Globoplay", icon: "🌍", desc: "Globo e Canais", details: TPL.produto("Globoplay", "Streaming + Canais Ao Vivo", `<h4>🔑 Regras de Acesso:</h4><p>Acesse <b>globoplay.globo.com</b> > Clique no ícone de perfil > "Entrar" > Selecione "Entrar com Operadora" > Escolha Brisanet.</p><h4>🛠️ Erros Conhecidos:</h4><ul><li><b>Erro "Não autorizado" (Canais ao vivo):</b> O cliente provavelmente tem o pacote "Padrão" (só VOD) e está tentando assistir Sportv/Premiere. Confirme a venda.</li><li><b>Erro de Geolocalização (Mobile):</b> O GPS deve estar ativo.</li><li><b>Smart TV:</b> Algumas TVs antigas (antes de 2017) não rodam canais ao vivo, apenas filmes gravados.</li></ul>`) },
            { label: "Paramount+", icon: "🏔️", desc: "Séries Premium", details: TPL.produto("Paramount+", "Conteúdo CBS/Viacom", `<h4>🎬 O que inclui:</h4><p>Filmes blockbusters, séries exclusivas (Handmaid's Tale, Star Trek) e conteúdo MTV/Nickelodeon.</p><h4>🔑 Acesso:</h4><p>No site/app Paramount+, selecione "Fazer login com parceiro" (Sign in with Partner) e busque por Brisanet.</p>`) },
            { label: "FWA 5G", icon: "📡", desc: "Internet Rural/Móvel", details: TPL.produto("FWA 5G (Internet Air)", "Sem Cabos / Plug & Play", `<h4>📌 Como Funciona:</h4><p>Um modem (CPE) que capta sinal 4G/5G da torre e cria um Wi-Fi. Ideal para zonas rurais ou onde não passa fibra.</p><h4>⚠️ Atenção à Franquia:</h4><p>Diferente da fibra, este plano possui <b>LIMITE DE DADOS</b> (ex: 400GB). Se o cliente assistir Netflix 4K o dia todo, a internet vai acabar e a velocidade será reduzida.</p><h4>💡 Dica de Sinal:</h4><p>O modem deve ficar próximo à janela ou em local alto. Paredes grossas bloqueiam o sinal 5G.</p>`) },
            { label: "Fibra (FTTH)", icon: "⚡", desc: "Internet Fixa", details: TPL.produto("Brisa Fibra", "Fiber To The Home", `<h4>🚀 Características:</h4><p>Fibra óptica ponta a ponta (dentro da casa do cliente). Baixa latência (ping) e alta estabilidade.</p><h4>🐢 Cliente reclama de lentidão?</h4><ul><li><b>Teste no Wi-Fi:</b> Não garante velocidade contratada (interferências).</li><li><b>Teste no Cabo:</b> É o único que valida a entrega da banda.</li><li><b>Limitação de Hardware:</b> Celulares/PCs antigos não passam de 40Mbps mesmo em planos de 500Mbps.</li></ul>`) },
            { label: "Brisafixo", icon: "☎️", desc: "Telefonia Fixa", details: TPL.produto("Brisafixo (VoIP)", "Voz sobre IP", `<h4>📞 Instalação:</h4><p>O aparelho telefônico é conectado na porta <b>TEL1</b> da ONU/Modem. Não usa fiação telefônica antiga da rua.</p><h4>🛠️ Diagnóstico:</h4><ul><li><b>Mudo:</b> Verifique se o LED "TEL" na ONU está aceso fixo. Se piscar ou apagar, há falha de registro (Provisionamento).</li><li><b>Chiado:</b> Geralmente é defeito no aparelho telefônico ou cabo espiral do cliente, não na linha.</li></ul>`) },
            { label: "Móvel 5G", icon: "📱", desc: "Chips e Planos", details: TPL.produto("Brisa Móvel", "Telefonia Celular", `<h4>📲 Tipos de Chip:</h4><ul><li><b>SIM Card Físico:</b> Chip tradicional.</li><li><b>eSIM:</b> Chip virtual (ativado por QR Code). Exige celular compatível.</li></ul><h4>⚙️ Configuração (APN):</h4><p>Se a internet não funcionar, configure a APN: <b>nome: brisanet / apn: brisanet.br</b>.</p><p><b>Roaming:</b> Para usar fora da área de cobertura própria, ativar "Dados em Roaming" no celular.</p>`) },
            { label: "Brisamusic", icon: "🎵", desc: "App de Música", details: TPL.produto("Brisamusic", "Streaming de Áudio", `<h4>🎧 O Produto:</h4><p>Concorrente do Spotify/Deezer. Permite baixar músicas para ouvir offline e não tem anúncios.</p><h4>🔑 Acesso:</h4><p>Baixar o app na loja (Play Store/App Store) e logar com as credenciais da Central do Assinante.</p>`) },
            { label: "Premiere", icon: "⚽", desc: "Futebol", details: TPL.produto("Premiere", "Pay-per-view", "Campeonato Brasileiro.") },
            { label: "Telecine", icon: "🍿", desc: "Filmes", details: TPL.produto("Telecine", "Cinema", "6 canais de filmes.") },
            { label: "Saúde 24hs", icon: "🩺", desc: "Telemedicina", details: TPL.produto("Saúde 24hs", "Médico", "Consultas online sem carência.") },
            { label: "Skeelo", icon: "📚", desc: "Ebooks", details: TPL.produto("Skeelo", "Livros", "Cliente ganha 1 livro digital por mês.") },
            { label: "Taplingo", icon: "🗣️", desc: "Idiomas", details: TPL.produto("Taplingo", "Cursos", "App de aprendizado de inglês/espanhol.") },
            { label: "Reforça", icon: "🎓", desc: "Escolar", details: TPL.produto("Reforça", "Educação", "Reforço escolar online.") },
            { label: "EXA Segurança", icon: "🛡️", desc: "Antivírus", details: TPL.produto("EXA", "Proteção", "Antivírus e VPN para o cliente.") },
            { label: "Max", icon: "🟣", desc: "HBO", details: TPL.produto("Max", "Streaming", "Antiga HBO Max. Filmes Warner e DC.") }
        ],
        manuals: [
            { label: "Lentidão", icon: "🐢", desc: "Diagnóstico", details: TPL.tecnico("Lentidão", "Procedimento Obrigatório", `<h4>1. Como testar:</h4><p>O teste deve ser feito via <b>CABO DE REDE (RJ45)</b>. Testes via Wi-Fi não garantem banda contratada.</p><h4>2. Sites Homologados:</h4><p>Utilize <a href="https://fast.com/pt" target="_blank">Fast.com</a> ou <a href="https://www.speedtest.net/" target="_blank">Speedtest</a> (Servidor Brisanet).</p><h4>3. Conclusão:</h4><p>Se a velocidade bater no cabo e não no Wi-Fi, o problema é interferência ou limitação do dispositivo do cliente.</p>`, "https://docs.google.com/document/d/1ryKjpd4lKW1UttU_HxUlRZimCF6R5shqFOvi3b_E4B0/edit?usp=sharing") },
            { label: "Sem Conexão", icon: "🚫", desc: "Queda Total", details: TPL.tecnico("Cliente sem Acesso", "Verificação de LEDs", `<h4>LED PON Piscando:</h4><p>Sinal atenuado (fibra suja ou dobrada). Agendar visita.</p><h4>LED LOS Vermelho:</h4><p>Rompimento de fibra. Verificar se há massiva na região antes de agendar.</p><h4>LEDs Normais (Verdes):</h4><p>Pode ser travamento do roteador (fazer reset elétrico) ou bloqueio financeiro.</p>`, "https://docs.google.com/document/d/18H0MsbCN6_mguf3zaG0eMUlAeu4RdE5N_xSvA9pSN8U/edit?usp=sharing") },
            { label: "CGNAT / Jogos", icon: "🎮", desc: "NAT Estrito", details: TPL.tecnico("CGNAT e Jogos Online", "Portas Fechadas", `<h4>O Problema:</h4><p>O CGNAT compartilha IPs, impedindo abertura de portas (NAT Tipo 3/Estrito).</p><h4>A Solução:</h4><p>Ativar <b>IPv6</b> no roteador e no console do cliente. O IPv6 não possui NAT e resolve a conexão.</p>`, "https://docs.google.com/document/d/1evXyscMO_6hhkFQhghiykTWwwC_NhSxP0_4-g-pfxhA/edit?tab=t.0") },
            { label: "Wi-Fi Oscilando", icon: "📶", desc: "Instabilidade", details: TPL.tecnico("Wi-Fi Caindo", "Melhoria de Sinal", `<h4>Causas:</h4><p>Canal congestionado (muitos vizinhos), espelhos, aquários ou roteador em local fechado.</p><h4>Ação:</h4><p>Alterar canal do Wi-Fi (1, 6, 11 no 2.4GHz) e fixar largura de banda em 20MHz para maior estabilidade.</p>`, "https://docs.google.com/presentation/d/1TUEanxohqbOruZ9OP4E_17x5-1nuew_oHpnKu8_GPG8/edit?slide=id.g1ee83cbd389_2_0") },
            { label: "Diag. Velocidade", icon: "📘", desc: "Slide", details: TPL.tecnico("Procedimento Velocidade", "Slide Oficial", "<p>Ping, Tracert e Pathping.</p>", "https://docs.google.com/presentation/d/1sFq9AbsG4OXP-6DfpTNUGVUvtShWPInbMFB7us0vHuc/edit?slide=id.g203410fc01f_0_60#slide=id.g203410fc01f_0_60") },
            { label: "Prob. Roteador", icon: "📘", desc: "Slide", details: TPL.tecnico("Roteador", "Configuração", "<p>Otimização de rede.</p>", "https://docs.google.com/presentation/d/1WMQFP_M8xklLzK9ExBSLUFFv-7DCPd3mWhYpgOmzzmk/edit?slide=id.g28dccbacb76_17_77#slide=id.g28dccbacb76_17_77") },
            { label: "Rede Mesh", icon: "📘", desc: "Slide", details: TPL.tecnico("Mesh", "Diagnóstico", "<p>Problemas com EasyMesh.</p>", "https://docs.google.com/presentation/d/1EJLJGUKQWmeYOUAgLC12iyBxEzyMMDImnT4WjseUjWA/edit?slide=id.g2820d168d26_32_161#slide=id.g2820d168d26_32_161") },
            { label: "Troca Equip.", icon: "📘", desc: "Slide", details: TPL.tecnico("Troca", "Política", "<p>Quando solicitar troca.</p>", "https://docs.google.com/presentation/d/136X85ywiAuc9kT4sfwkPwAOOXcSFyXbEsELhoZ9Tb7U/edit?slide=id.g2bca5b4418c_51_63#slide=id.g2bca5b4418c_51_63") },
            { label: "Manual VPN", icon: "📄", desc: "Doc", details: TPL.tecnico("VPN", "Guia", "<p>Resolvendo problemas com VPN.</p>", "https://docs.google.com/document/d/1-G8z7iq6bKyiVdkVdmM54NkYM-aYH66iJBxZyVP27dQ/edit?tab=t.0") },
            { label: "IPv6", icon: "📄", desc: "Doc", details: TPL.tecnico("IPv6", "Guia", "<p>Testar conectividade IPv6.</p>", "https://docs.google.com/document/d/1S3Q4wA_lQtolvlfAY09IoaeB6WUXqsMXtxxYfxv2UTs/edit?usp=sharing") }
        ],
        equipment: [
            { label: "Intelbras GX3000", icon: "📡", desc: "Modem 5G", details: TPL.tecnico("Intelbras GX3000", "CPE 5G/Wi-Fi 6", `<h4>🚦 LEDs:</h4><ul><li><b>Azul/Branco:</b> Sinal Ótimo.</li><li><b>Amarelo:</b> Sinal Regular (Pode oscilar).</li><li><b>Vermelho:</b> Sem sinal (Verificar torre).</li></ul><p><b>Botão Wi-Fi:</b> Pressione por 3s se a rede sumir.</p>`) },
            { label: "TP-Link NX620v", icon: "📡", desc: "Modem 5G", details: TPL.tecnico("NX620v", "FWA", "Suporta EasyMesh e possui botão físico On/Off.") },
            { label: "ONU Padrão", icon: "📠", desc: "Huawei/Nokia", details: TPL.tecnico("ONU Fibra", "Status", `<h4>🚦 LEDs:</h4><ul><li><b>PON Fixo:</b> Conectado.</li><li><b>PON Piscando:</b> Tentando conectar (Sinal ruim).</li><li><b>LOS Vermelho:</b> Cabo rompido.</li></ul>`) },
            { label: "Roteadores Wi-Fi 6", icon: "📶", desc: "AX1500/1800", details: TPL.tecnico("Wi-Fi 6", "Tecnologia", `<p>Equipamentos pretos (BSN/TP-Link). Trabalham com duas redes (2.4G e 5G) ou Smart Connect (nome único).</p><p><b>Atenção:</b> Celulares antigos podem não detectar a rede Wi-Fi 6.</p>`) }
        ],
        tools: [
            { label: "Teste Velocidade", url: "https://fast.com/pt/", icon: "🚀", desc: "Fast.com", details: TPL.tecnico("Teste", "Instruções", "Sempre via CABO de rede.") },
            { label: "Downdetector", url: "https://downdetector.com.br/", icon: "📉", desc: "Status", details: TPL.tecnico("Downdetector", "Massivas", "Verificar quedas globais (Whatsapp, Google, etc).") },
            { label: "Anydesk", url: "https://anydesk.com/pt/downloads/windows", icon: "↔️", desc: "Remoto", details: TPL.tecnico("Anydesk", "Acesso", "Suporte remoto leve.") },
            { label: "TeamViewer", url: "https://www.teamviewer.com/pt-br/download/windows/", icon: "💻", desc: "Remoto", details: TPL.tecnico("TeamViewer", "Acesso", "Suporte remoto robusto.") }
        ],
        contacts: [
            { label: "Ouvidoria", icon: "📢", desc: "0800 281 4000", details: TPL.sistema("Ouvidoria", "2ª Instância", "<p>Canal para resolução de conflitos não resolvidos no suporte padrão.</p><h2>📞 0800 281 4000</h2>", "#") },
            { label: "Suporte 10517", icon: "👤", desc: "Atendimento Geral", details: TPL.sistema("Suporte Técnico", "Canal Padrão", "<p>Atendimento geral ao cliente (Residencial).</p><h2>📞 10517</h2>", "#") },
            { label: "Regional", icon: "🌍", desc: "0800 285 3917", details: TPL.sistema("Atendimento Regional", "Escritórios Locais", "<p>Dúvidas sobre lojas e atendimentos específicos de região.</p><h2>📞 0800 285 3917</h2>", "#") },
            { label: "Corporativo", icon: "🏢", desc: "0800 282 3017", details: TPL.sistema("B2B / Empresas", "Atendimento VIP", "<p>Canal exclusivo para clientes CNPJ e Grandes Contas.</p><h2>📞 0800 282 3017</h2>", "#") },
            { label: "Zap Suporte", icon: "💬", desc: "(84) 98111-8525", details: TPL.sistema("Suporte Digital", "WhatsApp Oficial", "<p>Atendimento automatizado e humano via chat.</p>", "https://wa.me/5584981118525") },
            { label: "Zap Regional", icon: "📱", desc: "(88) 98122-3054", details: TPL.sistema("Regional Digital", "WhatsApp Regional", "<p>Atendimento de demandas regionais via chat.</p>", "https://wa.me/5588981223054") },
            { label: "Zap Comercial", icon: "💻", desc: "Vendas Fibra", details: TPL.sistema("Comercial Fibra", "(88) 98182-0637", "<p>Canal de vendas para novos planos Fibra.</p>", "https://wa.me/5588981820637") },
            { label: "Zap Vendas 5G", icon: "📶", desc: "Vendas Móvel", details: TPL.sistema("Comercial 5G", "(88) 98182-2574", "<p>Canal exclusivo para vendas de planos móveis 5G.</p>", "https://wa.me/5588981822574") },
            { label: "Brisa Móvel", icon: "📵", desc: "(88) 98111-7600", details: TPL.sistema("Suporte Móvel", "Telefonia Celular", "<p>Dúvidas sobre chips, portabilidade e planos móveis.</p>", "https://wa.me/5588981117600") },
            { label: "Móvel 5G", icon: "📶", desc: "(84) 98111-8525", details: TPL.sistema("Brisa Móvel 5G", "Suporte Avançado", "<p>Atendimento especializado em tecnologia 5G.</p>", "https://wa.me/5584981118525") },
            { label: "RH Atende", icon: "👥", desc: "Colaborador", details: TPL.sistema("RH Atende", "(84) 98187-0438", "<p>Dúvidas sobre ponto, férias e contracheque.</p>", "https://wa.me/5584981870438") },
            { label: "Benefícios", icon: "🏦", desc: "Vale/Plano", details: TPL.sistema("Setor Benefícios", "(88) 98140-6250", "<p>Dúvidas sobre Vale Alimentação, Plano de Saúde, etc.</p>", "https://wa.me/5588981406250") }
        ]
    };

    // 3. INTERFACE VISUAL
    const ICONS = {
        CLOSE: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
        LINK_EXT: `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
        MAIN_ICON: `💠`
    };

    const createTriggerButton = () => {
        let btn = document.getElementById('central-trigger-btn');
        if (btn) return;
        btn = document.createElement('button');
        btn.id = 'central-trigger-btn';
        btn.style.display = 'none'; 
        document.body.appendChild(btn);
        btn.onclick = createDashboard;
    };

    function createDashboard() {
        if (document.getElementById('central-dashboard')) return;

        const dashboard = document.createElement('div');
        dashboard.id = 'central-dashboard';
        dashboard.innerHTML = `
            <div class="central-sidebar">
                <div class="central-logo"><span>${ICONS.MAIN_ICON}</span> Central</div>
                <ul class="central-menu"></ul>
                <div class="central-version">v34.1 Dark</div>
            </div>
            <div class="central-main">
                <div class="central-topbar">
                    <h3 id="section-title">Início</h3>
                    <input type="text" id="central-search" placeholder="Pesquisar...">
                    <button id="btn-close-dashboard">${ICONS.CLOSE}</button>
                </div>
                <div class="central-grid" id="central-content"></div>
            </div>
        `;
        document.body.appendChild(dashboard);

        const menuContainer = dashboard.querySelector('.central-menu');
        const contentContainer = dashboard.querySelector('#central-content');
        const searchInput = dashboard.querySelector('#central-search');
        const sectionTitle = dashboard.querySelector('#section-title');

        const CATEGORIES = [
            { id: 'systems', icon: '🖥️', label: 'Sistemas', data: BRISA_DB.systems || [] },
            { id: 'materials', icon: '📑', label: 'Materiais', data: BRISA_DB.materials || [] },
            { id: 'products_list', icon: '📦', label: 'Produtos', data: BRISA_DB.products_list || [] },
            { id: 'manuals', icon: '📘', label: 'Manuais', data: BRISA_DB.manuals || [] },
            { id: 'equipment', icon: '📟', label: 'Equipamentos', data: BRISA_DB.equipment || [] },
            { id: 'tools', icon: '🔧', label: 'Ferramentas', data: BRISA_DB.tools || [] },
            { id: 'contacts', icon: '📞', label: 'Contatos', data: BRISA_DB.contacts || [] }
        ];

        function render(items, title) {
            contentContainer.innerHTML = '';
            sectionTitle.innerText = title;
            contentContainer.style.opacity = '0';
            setTimeout(() => contentContainer.style.opacity = '1', 50);

            if (!items || items.length === 0) {
                contentContainer.innerHTML = '<div class="empty-state">Nenhum resultado encontrado.</div>';
                return;
            }

            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'central-card';
                if (title.includes("Produtos")) card.classList.add('product-card-style');
                if (title.includes("Manuais") || title.includes("Equipamentos")) card.classList.add('tech-card-style');
                
                card.innerHTML = `
                    <div class="card-icon">${item.icon}</div>
                    <div class="card-body">
                        <div class="card-title">${item.label}</div>
                        <div class="card-desc">${item.desc || ''}</div>
                    </div>
                `;
                card.onclick = () => openModal(item);
                contentContainer.appendChild(card);
            });
        }

        CATEGORIES.forEach(cat => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${cat.icon}</span> ${cat.label}`;
            li.onclick = () => {
                dashboard.querySelectorAll('li').forEach(i => i.classList.remove('active'));
                li.classList.add('active');
                searchInput.value = '';
                render(cat.data, cat.label);
            };
            menuContainer.appendChild(li);
        });

        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            if (!term) { dashboard.querySelector('li.active')?.click(); return; }
            dashboard.querySelectorAll('li').forEach(i => i.classList.remove('active'));
            let results = [];
            CATEGORIES.forEach(cat => {
                if(!cat.data) return;
                const matches = cat.data.filter(item => item.label.toLowerCase().includes(term) || (item.desc && item.desc.toLowerCase().includes(term)));
                results = results.concat(matches);
            });
            render(results, `🔍 Busca: "${term}"`);
        });

        if (menuContainer.firstChild) menuContainer.firstChild.click();
        dashboard.querySelector('#btn-close-dashboard').onclick = () => dashboard.remove();
        makeDraggable(dashboard, dashboard.querySelector('.central-logo'));
    }

    function openModal(item) {
        const oldOverlay = document.querySelector('.central-modal-overlay');
        if (oldOverlay) oldOverlay.remove();

        const overlay = document.createElement('div');
        overlay.className = 'central-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'central-modal';
        
        let btnLink = '';
        if (item.url && item.url !== "#") {
             btnLink = `<a href="${item.url}" target="_blank" class="btn-modal-action">Acessar Link Externo ${ICONS.LINK_EXT}</a>`;
        }

        modal.innerHTML = `
            <div class="modal-header">
                <div class="modal-title"><span>${item.icon}</span> ${item.label}</div>
                <button class="btn-close-modal">${ICONS.CLOSE}</button>
            </div>
            <div class="modal-content">${item.details || "<p>Sem detalhes.</p>"}</div>
            <div class="modal-footer">${btnLink}</div>
        `;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        const close = () => { overlay.style.opacity = '0'; setTimeout(() => overlay.remove(), 200); };
        modal.querySelector('.btn-close-modal').onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };
        
        setTimeout(() => { overlay.style.opacity = '1'; modal.style.transform = 'translate(-50%, -50%) scale(1)'; }, 10);
    }

    function makeDraggable(el, handle) {
        let isDrag = false, startX, startY, initL, initT;
        handle.onmousedown = e => { isDrag = true; startX = e.clientX; startY = e.clientY; initL = el.offsetLeft; initT = el.offsetTop; };
        document.onmousemove = e => { if (isDrag) { el.style.left = (initL + e.clientX - startX) + 'px'; el.style.top = (initT + e.clientY - startY) + 'px'; }};
        document.onmouseup = () => isDrag = false;
    }

    function injectCss() {
        const style = document.createElement('style');
        style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            #central-dashboard { position: fixed; top: 8%; left: 12%; width: 980px; height: 720px; background: #0f172a; color: #f8fafc; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); z-index: 100000; display: flex; font-family: 'Inter', sans-serif; border: 1px solid #1e293b; overflow: hidden; animation: fadeIn 0.3s ease-out; }
            @keyframes fadeIn { from { opacity: 0; transform: scale(0.98) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            .central-sidebar { width: 240px; background: #1e293b; padding: 20px; display: flex; flex-direction: column; border-right: 1px solid #334155; user-select: none; }
            .central-logo { font-size: 20px; font-weight: 700; color: #3b82f6; margin-bottom: 30px; display: flex; align-items: center; gap: 10px; cursor: move; }
            .central-menu { list-style: none; padding: 0; margin: 0; flex: 1; overflow-y: auto; }
            .central-menu li { padding: 12px 15px; margin-bottom: 8px; cursor: pointer; color: #94a3b8; border-radius: 8px; transition: 0.2s; display: flex; align-items: center; gap: 12px; font-weight: 500; font-size: 14px; }
            .central-menu li:hover { background: rgba(255,255,255,0.05); color: white; }
            .central-menu li.active { background: #3b82f6; color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
            .central-version { font-size: 11px; color: #475569; text-align: center; margin-top: 20px; }
            .central-main { flex: 1; display: flex; flex-direction: column; background: #0f172a; }
            .central-topbar { padding: 20px 25px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; gap: 20px; }
            .central-topbar h3 { margin: 0; font-size: 20px; font-weight: 600; white-space: nowrap; }
            #central-search { flex: 1; background: #1e293b; border: 1px solid #334155; color: white; padding: 12px 15px; border-radius: 8px; outline: none; font-family: 'Inter', sans-serif; transition: border 0.2s; }
            #central-search:focus { border-color: #3b82f6; }
            #btn-close-dashboard { background: transparent; border: none; color: #94a3b8; cursor: pointer; padding: 5px; border-radius: 4px; }
            #btn-close-dashboard:hover { background: #ef4444; color: white; }
            .central-grid { padding: 25px; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 15px; }
            .central-grid::-webkit-scrollbar { width: 6px; }
            .central-grid::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
            .empty-state { grid-column: 1 / -1; text-align: center; color: #64748b; padding: 40px; font-style: italic; }
            .central-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.2s; display: flex; align-items: flex-start; gap: 15px; min-height: 90px; }
            .central-card:hover { transform: translateY(-4px); border-color: #3b82f6; box-shadow: 0 10px 20px rgba(0,0,0,0.3); background: #252f45; }
            .product-card-style { border-left: 4px solid #f1fa8c; }
            .tech-card-style { border-left: 4px solid #ff79c6; }
            .card-icon { font-size: 28px; flex-shrink: 0; margin-top: 2px; }
            .card-title { font-weight: 600; font-size: 15px; margin-bottom: 6px; color: #f8fafc; }
            .card-desc { font-size: 13px; color: #94a3b8; line-height: 1.4; }
            .central-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); z-index: 100001; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.2s; }
            .central-modal { background: #0f172a !important; width: 750px; max-width: 90%; max-height: 85vh; border-radius: 16px; border: 1px solid #334155; box-shadow: 0 25px 60px rgba(0,0,0,0.7); display: flex; flex-direction: column; transform: translate(-50%, -50%) scale(0.95); transition: transform 0.2s; position: absolute; top: 50%; left: 50%; font-family: 'Inter', sans-serif; color: #f8fafc; }
            .modal-header { padding: 20px 25px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; background: #1e293b; border-radius: 16px 16px 0 0; }
            .modal-title { font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 12px; color: #f1f5f9; }
            .btn-close-modal { background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 24px; transition: color 0.2s; }
            .btn-close-modal:hover { color: white; }
            .modal-content { padding: 30px; overflow-y: auto; line-height: 1.6; color: #cbd5e1; font-size: 15px; background: #0f172a !important; }
            .modal-footer { padding: 20px 25px; border-top: 1px solid #334155; background: #1e293b; border-radius: 0 0 16px 16px; text-align: right; }
            .btn-modal-action { background: #3b82f6; color: white; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; transition: 0.2s; }
            .btn-modal-action:hover { background: #2563eb; transform: translateY(-1px); }
            .wiki-content { background: #0f172a !important; border: none; padding: 0; color: #cbd5e1; }
            .system-theme .wiki-header { border-left: 4px solid #8be9fd; padding-left: 15px; margin-bottom: 20px; }
            .product-theme .wiki-header { border-left: 4px solid #f1fa8c; padding-left: 15px; margin-bottom: 20px; }
            .tech-theme .wiki-header { border-left: 4px solid #ff79c6; padding-left: 15px; margin-bottom: 20px; }
            .wiki-content h4 { color: #60a5fa; margin-top: 25px; margin-bottom: 12px; font-size: 16px; font-weight: 600; border-bottom: 1px solid #334155; padding-bottom: 5px; }
            .wiki-content ul { padding-left: 20px; margin-bottom: 15px; }
            .wiki-content li { margin-bottom: 8px; list-style-type: disc; color: #cbd5e1; }
            .wiki-content p { margin-bottom: 15px; color: #cbd5e1; }
            .wiki-content b { color: #e2e8f0; font-weight: 600; }
            .wiki-subtitle { font-size: 14px; color: #94a3b8; margin: 0; margin-top: 5px; }
            .wiki-summary { background: rgba(59, 130, 246, 0.1) !important; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px; border-radius: 4px; color: #bfdbfe !important; }
            .btn-acesso { background: #334155; color: white; padding: 8px 12px; border-radius: 6px; text-decoration: none; font-size: 13px; transition: 0.2s; display: inline-block; margin-top: 10px; }
            .btn-acesso:hover { background: #475569; }
        `;
        document.head.appendChild(style);
    }

    injectCss();
    createTriggerButton();
})();
