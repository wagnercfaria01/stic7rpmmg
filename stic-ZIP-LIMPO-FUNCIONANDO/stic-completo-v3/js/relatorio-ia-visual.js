/**
 * ═══════════════════════════════════════════════════════════════
 * RELATÓRIO IA - DESIGN ULTRA MODERNO v3.0
 * STIC 7ª RPM - PMMG
 * Baseado nos melhores templates de dashboards 2024/2025
 * ═══════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// ESTILOS CSS ULTRA MODERNOS
// ═══════════════════════════════════════════════════════════════

const estilosRelatorioIAModerno = `
<style>
/* ═══════════════════════════════════════════════════════════
   VARIÁVEIS GLOBAIS - PALETA DE CORES 2024
   ═══════════════════════════════════════════════════════════ */

:root {
    /* Gradientes principais - Inspirados em uiGradients */
    --grad-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --grad-success: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    --grad-danger: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);
    --grad-warning: linear-gradient(135deg, #f2994a 0%, #f2c94c 100%);
    --grad-info: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    
    /* Gradientes secundários - Novos 2024 */
    --grad-purple: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    --grad-blue-sky: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
    --grad-sunset: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    --grad-ocean: linear-gradient(135deg, #209cff 0%, #68e0cf 100%);
    --grad-night: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
    
    /* Cores sólidas */
    --azul-escuro: #1a237e;
    --azul-medio: #3949ab;
    --azul-claro: #5c6bc0;
    --verde: #4caf50;
    --vermelho: #f44336;
    --amarelo: #ff9800;
    --roxo: #9c27b0;
    
    /* Cinzas */
    --gray-50: #fafafa;
    --gray-100: #f5f5f5;
    --gray-200: #eeeeee;
    --gray-300: #e0e0e0;
    --gray-400: #bdbdbd;
    --gray-500: #9e9e9e;
    --gray-600: #757575;
    --gray-700: #616161;
    --gray-800: #424242;
    --gray-900: #212121;
    
    /* Sombras */
    --shadow-sm: 0 2px 8px rgba(0,0,0,0.08);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.12);
    --shadow-lg: 0 8px 32px rgba(0,0,0,0.15);
    --shadow-xl: 0 12px 48px rgba(0,0,0,0.2);
}

/* ═══════════════════════════════════════════════════════════
   CONTAINER PRINCIPAL DO RELATÓRIO
   ═══════════════════════════════════════════════════════════ */

.relatorio-ia-container {
    font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 1200px;
    margin: 30px auto;
    background: var(--grad-primary);
    border-radius: 24px;
    padding: 6px;
    box-shadow: var(--shadow-xl);
    animation: fadeIn 0.6s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.relatorio-ia-inner {
    background: white;
    border-radius: 20px;
    overflow: hidden;
}

/* ═══════════════════════════════════════════════════════════
   CABEÇALHO PREMIUM
   ═══════════════════════════════════════════════════════════ */

.relatorio-header {
    background: var(--grad-night);
    color: white;
    padding: 40px 35px;
    position: relative;
    overflow: hidden;
}

.relatorio-header::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at center, rgba(255,255,255,0.15) 0%, transparent 70%);
    animation: shimmer 6s linear infinite;
}

@keyframes shimmer {
    0% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(1.1); }
    100% { transform: rotate(360deg) scale(1); }
}

.relatorio-header-content {
    position: relative;
    z-index: 2;
    text-align: center;
}

.relatorio-badge {
    display: inline-block;
    background: rgba(255,255,255,0.2);
    padding: 8px 20px;
    border-radius: 30px;
    font-size: 0.85em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255,255,255,0.3);
    margin-bottom: 15px;
}

.relatorio-header h1 {
    margin: 0;
    font-size: 2.5em;
    font-weight: 800;
    text-shadow: 3px 3px 6px rgba(0,0,0,0.3);
    margin-bottom: 12px;
    background: linear-gradient(to right, #fff, #a8edea);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.relatorio-subtitulo {
    font-size: 1.2em;
    opacity: 0.95;
    font-weight: 400;
    margin: 0;
}

.relatorio-periodo-badge {
    display: inline-block;
    background: rgba(255,255,255,0.25);
    padding: 10px 25px;
    border-radius: 40px;
    margin-top: 20px;
    font-weight: 600;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255,255,255,0.4);
    font-size: 1.05em;
}

/* ═══════════════════════════════════════════════════════════
   GRID DE ESTATÍSTICAS MODERNO
   ═══════════════════════════════════════════════════════════ */

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    padding: 35px;
    background: linear-gradient(180deg, var(--gray-50) 0%, white 100%);
}

.stat-card {
    background: white;
    padding: 25px;
    border-radius: 16px;
    box-shadow: var(--shadow-md);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    border-left: 5px solid;
    position: relative;
    overflow: hidden;
}

.stat-card::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1), transparent 70%);
    opacity: 0;
    transition: opacity 0.4s ease;
}

.stat-card:hover::before {
    opacity: 1;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

.stat-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-lg);
}

.stat-card-icon {
    font-size: 2.5em;
    margin-bottom: 12px;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
}

.stat-card-value {
    font-size: 2.8em;
    font-weight: 800;
    margin: 10px 0;
    background: var(--grad-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.stat-card-label {
    font-size: 0.95em;
    color: var(--gray-600);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.stat-card-trend {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--gray-200);
    font-size: 0.85em;
    color: var(--gray-500);
}

/* Variações de cores para cards */
.stat-card.stat-primary { border-left-color: #667eea; }
.stat-card.stat-success { border-left-color: #11998e; }
.stat-card.stat-danger { border-left-color: #ee0979; }
.stat-card.stat-warning { border-left-color: #f2994a; }
.stat-card.stat-info { border-left-color: #4facfe; }

/* ═══════════════════════════════════════════════════════════
   SEÇÕES DE CONTEÚDO
   ═══════════════════════════════════════════════════════════ */

.relatorio-section {
    padding: 35px;
    border-bottom: 1px solid var(--gray-200);
}

.relatorio-section:last-child {
    border-bottom: none;
}

.section-header {
    display: flex;
    align-items: center;
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 3px solid;
    border-image: var(--grad-primary) 1;
}

.section-icon {
    font-size: 2em;
    margin-right: 15px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.section-title {
    font-size: 1.8em;
    font-weight: 700;
    color: var(--gray-800);
    margin: 0;
}

.section-description {
    font-size: 1em;
    color: var(--gray-600);
    margin-top: 5px;
    font-weight: 400;
}

/* ═══════════════════════════════════════════════════════════
   CONTEÚDO GERADO PELA IA
   ═══════════════════════════════════════════════════════════ */

.ia-content {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    padding: 30px;
    border-radius: 16px;
    line-height: 1.8;
    color: var(--gray-800);
    font-size: 1.05em;
    box-shadow: var(--shadow-sm);
}

.ia-content h3 {
    color: var(--azul-escuro);
    font-size: 1.4em;
    font-weight: 700;
    margin: 25px 0 15px;
    display: flex;
    align-items: center;
}

.ia-content h3::before {
    content: '';
    width: 4px;
    height: 24px;
    background: var(--grad-primary);
    margin-right: 12px;
    border-radius: 2px;
}

.ia-content p {
    margin: 15px 0;
    text-align: justify;
}

.ia-content ul, .ia-content ol {
    margin: 15px 0;
    padding-left: 25px;
}

.ia-content li {
    margin: 10px 0;
    padding-left: 10px;
}

.ia-content strong {
    color: var(--azul-medio);
    font-weight: 700;
}

.ia-content em {
    color: var(--roxo);
    font-style: italic;
}

/* ═══════════════════════════════════════════════════════════
   CARDS DE DESTAQUE
   ═══════════════════════════════════════════════════════════ */

.highlight-card {
    background: white;
    border-radius: 16px;
    padding: 25px;
    margin: 20px 0;
    box-shadow: var(--shadow-md);
    border-left: 5px solid;
    transition: all 0.3s ease;
}

.highlight-card:hover {
    transform: translateX(5px);
    box-shadow: var(--shadow-lg);
}

.highlight-card.card-success {
    border-left-color: var(--verde);
    background: linear-gradient(135deg, #e8f5e9, white);
}

.highlight-card.card-warning {
    border-left-color: var(--amarelo);
    background: linear-gradient(135deg, #fff3e0, white);
}

.highlight-card.card-danger {
    border-left-color: var(--vermelho);
    background: linear-gradient(135deg, #ffebee, white);
}

.highlight-card.card-info {
    border-left-color: var(--azul-claro);
    background: linear-gradient(135deg, #e3f2fd, white);
}

.highlight-title {
    font-size: 1.2em;
    font-weight: 700;
    margin: 0 0 12px;
    display: flex;
    align-items: center;
}

.highlight-icon {
    font-size: 1.5em;
    margin-right: 10px;
}

.highlight-content {
    color: var(--gray-700);
    line-height: 1.6;
}

/* ═══════════════════════════════════════════════════════════
   TABELAS DE DADOS
   ═══════════════════════════════════════════════════════════ */

.data-table-wrapper {
    overflow-x: auto;
    border-radius: 12px;
    box-shadow: var(--shadow-md);
    margin: 20px 0;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
}

.data-table thead {
    background: var(--grad-night);
    color: white;
}

.data-table thead th {
    padding: 16px;
    text-align: left;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.9em;
    letter-spacing: 0.5px;
}

.data-table tbody tr {
    border-bottom: 1px solid var(--gray-200);
    transition: background 0.2s ease;
}

.data-table tbody tr:hover {
    background: var(--gray-50);
}

.data-table tbody td {
    padding: 14px 16px;
    color: var(--gray-700);
}

.data-table tbody td:first-child {
    font-weight: 600;
    color: var(--gray-900);
}

/* ═══════════════════════════════════════════════════════════
   BADGES E TAGS
   ═══════════════════════════════════════════════════════════ */

.badge {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 0.85em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.badge-success {
    background: var(--grad-success);
    color: white;
}

.badge-warning {
    background: var(--grad-warning);
    color: white;
}

.badge-danger {
    background: var(--grad-danger);
    color: white;
}

.badge-info {
    background: var(--grad-info);
    color: white;
}

.badge-primary {
    background: var(--grad-primary);
    color: white;
}

/* ═══════════════════════════════════════════════════════════
   GRÁFICOS E VISUALIZAÇÕES
   ═══════════════════════════════════════════════════════════ */

.chart-container {
    background: white;
    padding: 25px;
    border-radius: 16px;
    box-shadow: var(--shadow-md);
    margin: 20px 0;
}

.chart-title {
    font-size: 1.3em;
    font-weight: 700;
    color: var(--gray-800);
    margin-bottom: 20px;
    text-align: center;
}

.progress-bar-wrapper {
    margin: 15px 0;
}

.progress-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 0.95em;
    color: var(--gray-700);
}

.progress-bar {
    height: 12px;
    background: var(--gray-200);
    border-radius: 10px;
    overflow: hidden;
    position: relative;
}

.progress-fill {
    height: 100%;
    background: var(--grad-primary);
    border-radius: 10px;
    transition: width 1s ease;
    position: relative;
    overflow: hidden;
}

.progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
    animation: shimmer-progress 2s infinite;
}

@keyframes shimmer-progress {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

/* ═══════════════════════════════════════════════════════════
   RODAPÉ DO RELATÓRIO
   ═══════════════════════════════════════════════════════════ */

.relatorio-footer {
    background: linear-gradient(135deg, var(--gray-100) 0%, white 100%);
    padding: 30px 35px;
    border-top: 3px solid;
    border-image: var(--grad-primary) 1;
}

.footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 25px;
    margin-bottom: 25px;
}

.footer-section h4 {
    color: var(--azul-escuro);
    font-size: 1.1em;
    font-weight: 700;
    margin-bottom: 12px;
}

.footer-section p {
    color: var(--gray-600);
    line-height: 1.6;
    font-size: 0.95em;
}

.footer-meta {
    text-align: center;
    padding-top: 20px;
    border-top: 1px solid var(--gray-300);
    color: var(--gray-500);
    font-size: 0.9em;
}

.footer-meta .timestamp {
    font-weight: 600;
    color: var(--azul-medio);
}

/* ═══════════════════════════════════════════════════════════
   BOTÕES DE AÇÃO
   ═══════════════════════════════════════════════════════════ */

.action-buttons {
    display: flex;
    gap: 15px;
    margin-top: 25px;
    flex-wrap: wrap;
}

.btn-action {
    padding: 12px 28px;
    border: none;
    border-radius: 30px;
    font-weight: 600;
    font-size: 1em;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    box-shadow: var(--shadow-sm);
}

.btn-action:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-md);
}

.btn-primary {
    background: var(--grad-primary);
    color: white;
}

.btn-success {
    background: var(--grad-success);
    color: white;
}

.btn-download {
    background: var(--grad-info);
    color: white;
}

/* ═══════════════════════════════════════════════════════════
   ANIMAÇÕES ESPECIAIS
   ═══════════════════════════════════════════════════════════ */

@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-slide-in {
    animation: slideInUp 0.6s ease forwards;
}

/* ═══════════════════════════════════════════════════════════
   RESPONSIVO
   ═══════════════════════════════════════════════════════════ */

@media (max-width: 768px) {
    .relatorio-ia-container {
        margin: 15px;
        border-radius: 16px;
    }
    
    .relatorio-header {
        padding: 30px 20px;
    }
    
    .relatorio-header h1 {
        font-size: 1.8em;
    }
    
    .stats-grid {
        grid-template-columns: 1fr;
        padding: 20px;
    }
    
    .relatorio-section {
        padding: 20px;
    }
    
    .section-title {
        font-size: 1.4em;
    }
    
    .ia-content {
        padding: 20px;
        font-size: 1em;
    }
    
    .footer-content {
        grid-template-columns: 1fr;
    }
    
    .action-buttons {
        flex-direction: column;
    }
    
    .btn-action {
        width: 100%;
        justify-content: center;
    }
}

/* ═══════════════════════════════════════════════════════════
   IMPRESSÃO
   ═══════════════════════════════════════════════════════════ */

@media print {
    .relatorio-ia-container {
        box-shadow: none;
        margin: 0;
    }
    
    .action-buttons {
        display: none;
    }
    
    .stat-card {
        break-inside: avoid;
    }
    
    .relatorio-section {
        break-inside: avoid;
    }
}
</style>
`;

// ═══════════════════════════════════════════════════════════════
// FUNÇÃO PARA GERAR RELATÓRIO MELHORADO
// ═══════════════════════════════════════════════════════════════

async function gerarRelatorioIAMelhorado(dados, periodo) {
    try {
        // Preparar prompt para a IA
        const prompt = criarPromptMelhorado(dados, periodo);
        
        // Chamar API Groq
        const analiseIA = await chamarGroqAPI(prompt);
        
        // Formatar relatório com novo design
        const relatorioHTML = formatarRelatorioModerno(dados, analiseIA, periodo);
        
        // Exibir relatório
        exibirRelatorioModerno(relatorioHTML);
        
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        alert('Erro ao gerar relatório: ' + error.message);
    }
}

function criarPromptMelhorado(dados, periodo) {
    const estatisticas = calcularEstatisticas(dados);
    
    return `
Você é um analista de dados especializado em relatórios para órgãos públicos de segurança.

Analise os seguintes dados do STIC - 7ª RPM PMMG sobre horas extras:

PERÍODO: ${periodo}

ESTATÍSTICAS:
- Total de horas extras lançadas: ${estatisticas.total}
- Aguardando 7 dias: ${estatisticas.aguardando7}
- Aguardando sexta-feira: ${estatisticas.aguardandoSexta}
- Podem ser lançadas hoje: ${estatisticas.podeLancarHoje}
- Atrasadas: ${estatisticas.atrasadas}
- Já lançadas no CAD2: ${estatisticas.lancadas}
- Total de horas trabalhadas: ${estatisticas.totalHoras}
- Militares envolvidos: ${estatisticas.militares.length}

DISTRIBUIÇÃO POR MILITAR:
${estatisticas.distribuicao.map(d => `- ${d.nome}: ${d.quantidade} lançamentos, ${d.horas} horas`).join('\n')}

Gere um relatório profissional e completo com:

1. RESUMO EXECUTIVO (2-3 parágrafos)
   - Visão geral do período
   - Principais destaques
   - Pontos de atenção

2. ANÁLISE DETALHADA
   - Performance no lançamento (pontualidade)
   - Distribuição de horas extras
   - Padrões identificados
   - Comparações relevantes

3. PONTOS CRÍTICOS
   - Lançamentos atrasados (se houver)
   - Concentração de horas
   - Áreas que precisam atenção

4. RECOMENDAÇÕES
   - Melhorias no processo
   - Ações prioritárias
   - Sugestões práticas

5. CONCLUSÃO
   - Síntese final
   - Próximos passos

Use linguagem profissional, clara e objetiva. Formatação em HTML para destacar informações importantes.
`;
}

async function chamarGroqAPI(prompt) {
    // Implementação da chamada à API Groq
    // Este é um placeholder - você deve usar sua implementação existente
    
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mixtral-8x7b-32768',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });
        
        const data = await response.json();
        return data.choices[0].message.content;
        
    } catch (error) {
        console.error('Erro na API Groq:', error);
        return gerarRelatorioFallback();
    }
}

function gerarRelatorioFallback() {
    return `
<h3>Análise Automática Indisponível</h3>
<p>Não foi possível gerar a análise pela IA no momento. Consulte as estatísticas acima para informações detalhadas.</p>
    `;
}

function calcularEstatisticas(dados) {
    const stats = {
        total: dados.length,
        aguardando7: 0,
        aguardandoSexta: 0,
        podeLancarHoje: 0,
        atrasadas: 0,
        lancadas: 0,
        totalHoras: 0,
        militares: new Set(),
        distribuicao: []
    };
    
    // Calcular estatísticas
    dados.forEach(hora => {
        const status = determinarStatus(hora);
        
        switch(status) {
            case 'aguardando_7_dias': stats.aguardando7++; break;
            case 'aguardando_sexta': stats.aguardandoSexta++; break;
            case 'pode_lancar_hoje': stats.podeLancarHoje++; break;
            case 'atrasado': stats.atrasadas++; break;
            case 'lancado': stats.lancados++; break;
        }
        
        // Somar horas
        const horas = parseFloat(hora.horas) || 0;
        stats.totalHoras += horas;
        
        // Adicionar militar
        if (hora.militar_nome) {
            stats.militares.add(hora.militar_nome);
        }
    });
    
    // Calcular distribuição por militar
    const distribuicaoMap = {};
    dados.forEach(hora => {
        const nome = hora.militar_nome || 'Não identificado';
        if (!distribuicaoMap[nome]) {
            distribuicaoMap[nome] = {
                nome: nome,
                quantidade: 0,
                horas: 0
            };
        }
        distribuicaoMap[nome].quantidade++;
        distribuicaoMap[nome].horas += parseFloat(hora.horas) || 0;
    });
    
    stats.distribuicao = Object.values(distribuicaoMap)
        .sort((a, b) => b.quantidade - a.quantidade);
    
    stats.militares = Array.from(stats.militares);
    
    return stats;
}

function formatarRelatorioModerno(dados, analiseIA, periodo) {
    const stats = calcularEstatisticas(dados);
    const dataAtual = new Date().toLocaleString('pt-BR');
    
    return `
${estilosRelatorioIAModerno}

<div class="relatorio-ia-container">
    <div class="relatorio-ia-inner">
        
        <!-- CABEÇALHO -->
        <div class="relatorio-header">
            <div class="relatorio-header-content">
                <div class="relatorio-badge">🤖 Relatório Gerado por IA</div>
                <h1>📊 Análise de Horas Extras</h1>
                <p class="relatorio-subtitulo">STIC - 7ª Região da Polícia Militar de Minas Gerais</p>
                <div class="relatorio-periodo-badge">
                    📅 Período: ${periodo}
                </div>
            </div>
        </div>
        
        <!-- ESTATÍSTICAS -->
        <div class="stats-grid">
            <div class="stat-card stat-primary">
                <div class="stat-card-icon">📋</div>
                <div class="stat-card-value">${stats.total}</div>
                <div class="stat-card-label">Total de Lançamentos</div>
                <div class="stat-card-trend">Período analisado</div>
            </div>
            
            <div class="stat-card stat-warning">
                <div class="stat-card-icon">⏳</div>
                <div class="stat-card-value">${stats.aguardando7}</div>
                <div class="stat-card-label">Aguardando 7 Dias</div>
                <div class="stat-card-trend">Ainda no prazo</div>
            </div>
            
            <div class="stat-card stat-info">
                <div class="stat-card-icon">📅</div>
                <div class="stat-card-value">${stats.aguardandoSexta}</div>
                <div class="stat-card-label">Aguardando Sexta</div>
                <div class="stat-card-trend">Prontos após 7 dias</div>
            </div>
            
            <div class="stat-card stat-success">
                <div class="stat-card-icon">🚀</div>
                <div class="stat-card-value">${stats.podeLancarHoje}</div>
                <div class="stat-card-label">Lançar Hoje</div>
                <div class="stat-card-trend">Ação imediata</div>
            </div>
            
            <div class="stat-card stat-danger">
                <div class="stat-card-icon">❌</div>
                <div class="stat-card-value">${stats.atrasadas}</div>
                <div class="stat-card-label">Atrasados</div>
                <div class="stat-card-trend">Requerem atenção</div>
            </div>
            
            <div class="stat-card stat-success">
                <div class="stat-card-icon">✅</div>
                <div class="stat-card-value">${stats.lancadas}</div>
                <div class="stat-card-label">Lançados</div>
                <div class="stat-card-trend">Concluídos</div>
            </div>
            
            <div class="stat-card stat-primary">
                <div class="stat-card-icon">⏰</div>
                <div class="stat-card-value">${stats.totalHoras.toFixed(1)}h</div>
                <div class="stat-card-label">Total de Horas</div>
                <div class="stat-card-trend">Horas trabalhadas</div>
            </div>
            
            <div class="stat-card stat-info">
                <div class="stat-card-icon">👥</div>
                <div class="stat-card-value">${stats.militares.length}</div>
                <div class="stat-card-label">Militares</div>
                <div class="stat-card-trend">Envolvidos</div>
            </div>
        </div>
        
        <!-- ANÁLISE DA IA -->
        <div class="relatorio-section">
            <div class="section-header">
                <div class="section-icon">🤖</div>
                <div>
                    <h2 class="section-title">Análise Inteligente</h2>
                    <p class="section-description">Gerado por inteligência artificial</p>
                </div>
            </div>
            
            <div class="ia-content">
                ${analiseIA}
            </div>
        </div>
        
        <!-- DISTRIBUIÇÃO POR MILITAR -->
        <div class="relatorio-section">
            <div class="section-header">
                <div class="section-icon">👥</div>
                <div>
                    <h2 class="section-title">Distribuição por Militar</h2>
                    <p class="section-description">Top ${Math.min(10, stats.distribuicao.length)} militares com mais horas extras</p>
                </div>
            </div>
            
            <div class="chart-container">
                <div class="chart-title">Ranking de Horas Extras</div>
                ${gerarGraficosDistribuicao(stats.distribuicao.slice(0, 10))}
            </div>
        </div>
        
        <!-- INDICADORES DE PERFORMANCE -->
        <div class="relatorio-section">
            <div class="section-header">
                <div class="section-icon">📈</div>
                <div>
                    <h2 class="section-title">Indicadores de Performance</h2>
                    <p class="section-description">Métricas de eficiência do processo</p>
                </div>
            </div>
            
            ${gerarIndicadoresPerformance(stats)}
        </div>
        
        <!-- RODAPÉ -->
        <div class="relatorio-footer">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>📌 Sobre este Relatório</h4>
                    <p>Relatório gerado automaticamente pelo Sistema STIC utilizando inteligência artificial para análise de dados.</p>
                </div>
                
                <div class="footer-section">
                    <h4>🔍 Metodologia</h4>
                    <p>Os dados foram processados respeitando a regra de lançamento de 7 dias + próxima sexta-feira para cada hora extra registrada.</p>
                </div>
                
                <div class="footer-section">
                    <h4>📞 Contato</h4>
                    <p>7ª Região da Polícia Militar de Minas Gerais<br>Sistema STIC - Setor de Tecnologia</p>
                </div>
            </div>
            
            <div class="footer-meta">
                <p>Gerado em: <span class="timestamp">${dataAtual}</span></p>
                <p>© 2025 STIC 7ª RPM PMMG - Todos os direitos reservados</p>
            </div>
            
            <div class="action-buttons">
                <button class="btn-action btn-primary" onclick="window.print()">
                    🖨️ Imprimir Relatório
                </button>
                <button class="btn-action btn-download" onclick="exportarRelatorioPDF()">
                    📥 Baixar PDF
                </button>
                <button class="btn-action btn-success" onclick="compartilharRelatorio()">
                    📤 Compartilhar
                </button>
            </div>
        </div>
        
    </div>
</div>
    `;
}

function gerarGraficosDistribuicao(distribuicao) {
    const maxHoras = Math.max(...distribuicao.map(d => d.horas));
    
    return distribuicao.map((item, index) => {
        const percentual = (item.horas / maxHoras) * 100;
        
        return `
            <div class="progress-bar-wrapper">
                <div class="progress-label">
                    <span><strong>#${index + 1}</strong> ${item.nome}</span>
                    <span><strong>${item.horas.toFixed(1)}h</strong> (${item.quantidade} lançamentos)</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentual}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function gerarIndicadoresPerformance(stats) {
    const taxaLancamento = stats.total > 0 
        ? ((stats.lancadas / stats.total) * 100).toFixed(1) 
        : 0;
    
    const taxaAtraso = stats.total > 0 
        ? ((stats.atrasadas / stats.total) * 100).toFixed(1) 
        : 0;
    
    const mediaPorMilitar = stats.militares.length > 0
        ? (stats.total / stats.militares.length).toFixed(1)
        : 0;
    
    return `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            
            <div class="highlight-card card-${taxaLancamento >= 80 ? 'success' : taxaLancamento >= 50 ? 'warning' : 'danger'}">
                <h3 class="highlight-title">
                    <span class="highlight-icon">📊</span>
                    Taxa de Lançamento
                </h3>
                <div class="highlight-content">
                    <p style="font-size: 2.5em; font-weight: 800; margin: 10px 0;">
                        ${taxaLancamento}%
                    </p>
                    <p>${stats.lancadas} de ${stats.total} lançamentos concluídos</p>
                </div>
            </div>
            
            <div class="highlight-card card-${taxaAtraso < 10 ? 'success' : taxaAtraso < 20 ? 'warning' : 'danger'}">
                <h3 class="highlight-title">
                    <span class="highlight-icon">⚠️</span>
                    Taxa de Atraso
                </h3>
                <div class="highlight-content">
                    <p style="font-size: 2.5em; font-weight: 800; margin: 10px 0;">
                        ${taxaAtraso}%
                    </p>
                    <p>${stats.atrasadas} lançamentos com atraso</p>
                </div>
            </div>
            
            <div class="highlight-card card-info">
                <h3 class="highlight-title">
                    <span class="highlight-icon">👤</span>
                    Média por Militar
                </h3>
                <div class="highlight-content">
                    <p style="font-size: 2.5em; font-weight: 800; margin: 10px 0;">
                        ${mediaPorMilitar}
                    </p>
                    <p>lançamentos por pessoa</p>
                </div>
            </div>
            
        </div>
    `;
}

function exibirRelatorioModerno(html) {
    const container = document.getElementById('container-relatorio-ia');
    if (container) {
        container.innerHTML = html;
        container.scrollIntoView({ behavior: 'smooth' });
    }
}

// Funções auxiliares para botões

function compartilharRelatorio() {
    if (navigator.share) {
        navigator.share({
            title: 'Relatório de Horas Extras - STIC',
            text: 'Confira o relatório completo de análise de horas extras',
            url: window.location.href
        });
    } else {
        alert('Recurso de compartilhamento não disponível neste navegador');
    }
}

console.log('✅ Módulo de Relatório IA Ultra Moderno v3.0 carregado!');
