/**
 * ═══════════════════════════════════════════════════════════════
 * MÓDULO DE FORMATAÇÃO VISUAL PARA RELATÓRIOS IA
 * STIC 7ª RPM - PMMG
 * Versão 2.0 - Visual Premium
 * ═══════════════════════════════════════════════════════════════
 */

// Estilos CSS para o relatório
const estilosRelatorioIA = `
/* ═══════════════════════════════════════════════════════════════ */
/* TEMA PRINCIPAL DO RELATÓRIO IA */
/* ═══════════════════════════════════════════════════════════════ */

.relatorio-ia-container {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 900px;
    margin: 20px auto;
    padding: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4);
}

.relatorio-ia-inner {
    background: white;
    margin: 4px;
    border-radius: 18px;
    overflow: hidden;
}

/* ═══════════════════════════════════════════════════════════════ */
/* CABEÇALHO DO RELATÓRIO */
/* ═══════════════════════════════════════════════════════════════ */

.relatorio-header {
    background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%);
    color: white;
    padding: 30px;
    text-align: center;
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
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 50%);
    animation: shimmer 3s infinite;
}

@keyframes shimmer {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.relatorio-header h1 {
    margin: 0;
    font-size: 1.8em;
    font-weight: 700;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    position: relative;
    z-index: 1;
}

.relatorio-header .subtitulo {
    margin: 10px 0 0;
    font-size: 1.1em;
    opacity: 0.9;
    position: relative;
    z-index: 1;
}

.relatorio-header .periodo-badge {
    display: inline-block;
    background: rgba(255,255,255,0.2);
    padding: 8px 20px;
    border-radius: 30px;
    margin-top: 15px;
    font-weight: 500;
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255,255,255,0.3);
    position: relative;
    z-index: 1;
}

/* ═══════════════════════════════════════════════════════════════ */
/* CARDS DE ESTATÍSTICAS */
/* ═══════════════════════════════════════════════════════════════ */

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    padding: 25px;
    background: linear-gradient(180deg, #f5f7fa 0%, #ffffff 100%);
}

.stat-card {
    background: white;
    border-radius: 15px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    transition: all 0.3s ease;
    border: 1px solid #e0e0e0;
    position: relative;
    overflow: hidden;
}

.stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
}

.stat-card.total::before { background: linear-gradient(90deg, #667eea, #764ba2); }
.stat-card.finalizadas::before { background: linear-gradient(90deg, #00c853, #69f0ae); }
.stat-card.andamento::before { background: linear-gradient(90deg, #ff9800, #ffcc02); }
.stat-card.abertas::before { background: linear-gradient(90deg, #2196f3, #03a9f4); }
.stat-card.sla::before { background: linear-gradient(90deg, #9c27b0, #e040fb); }
.stat-card.tempo::before { background: linear-gradient(90deg, #f44336, #ff5722); }

.stat-card .icone {
    font-size: 2.5em;
    margin-bottom: 10px;
}

.stat-card .valor {
    font-size: 2.2em;
    font-weight: 700;
    color: #1a237e;
    line-height: 1;
}

.stat-card .label {
    font-size: 0.85em;
    color: #666;
    margin-top: 5px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.stat-card .variacao {
    font-size: 0.8em;
    padding: 3px 8px;
    border-radius: 10px;
    margin-top: 8px;
    display: inline-block;
}

.stat-card .variacao.positiva { background: #e8f5e9; color: #2e7d32; }
.stat-card .variacao.negativa { background: #ffebee; color: #c62828; }
.stat-card .variacao.neutra { background: #e3f2fd; color: #1565c0; }

/* ═══════════════════════════════════════════════════════════════ */
/* SEÇÃO DO RESUMO EXECUTIVO */
/* ═══════════════════════════════════════════════════════════════ */

.resumo-section {
    padding: 30px;
    background: white;
}

.resumo-section h2 {
    color: #1a237e;
    font-size: 1.4em;
    margin: 0 0 20px;
    padding-bottom: 10px;
    border-bottom: 3px solid #667eea;
    display: flex;
    align-items: center;
    gap: 10px;
}

.resumo-section h2::before {
    content: '📄';
    font-size: 1.2em;
}

.resumo-texto {
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
    padding: 25px;
    border-radius: 15px;
    border-left: 5px solid #667eea;
    font-size: 1.05em;
    line-height: 1.8;
    color: #333;
    text-align: justify;
    box-shadow: inset 0 2px 10px rgba(0,0,0,0.03);
}

.resumo-texto::first-letter {
    font-size: 2.5em;
    font-weight: bold;
    color: #667eea;
    float: left;
    margin-right: 10px;
    line-height: 1;
}

/* ═══════════════════════════════════════════════════════════════ */
/* SEÇÃO DE INSIGHTS */
/* ═══════════════════════════════════════════════════════════════ */

.insights-section {
    padding: 25px 30px;
    background: linear-gradient(180deg, #fafafa 0%, #f0f0f0 100%);
}

.insights-section h2 {
    color: #1a237e;
    font-size: 1.3em;
    margin: 0 0 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.insights-section h2::before {
    content: '💡';
}

.insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
}

.insight-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.08);
    border-left: 4px solid;
    transition: all 0.3s ease;
}

.insight-card:hover {
    transform: translateX(5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.12);
}

.insight-card.destaque { border-left-color: #4caf50; }
.insight-card.atencao { border-left-color: #ff9800; }
.insight-card.alerta { border-left-color: #f44336; }
.insight-card.info { border-left-color: #2196f3; }

.insight-card .insight-icone {
    font-size: 1.5em;
    margin-bottom: 8px;
}

.insight-card .insight-texto {
    color: #444;
    font-size: 0.95em;
    line-height: 1.5;
}

/* ═══════════════════════════════════════════════════════════════ */
/* SEÇÃO DE GRÁFICOS */
/* ═══════════════════════════════════════════════════════════════ */

.graficos-section {
    padding: 25px 30px;
    background: white;
}

.graficos-section h2 {
    color: #1a237e;
    font-size: 1.3em;
    margin: 0 0 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.graficos-section h2::before {
    content: '📊';
}

.grafico-container {
    background: #f8f9fa;
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 20px;
}

.barra-progresso {
    height: 30px;
    background: #e0e0e0;
    border-radius: 15px;
    overflow: hidden;
    margin: 10px 0;
    box-shadow: inset 0 2px 5px rgba(0,0,0,0.1);
}

.barra-progresso .preenchimento {
    height: 100%;
    border-radius: 15px;
    transition: width 1s ease;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 15px;
    color: white;
    font-weight: bold;
    font-size: 0.9em;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
}

.barra-progresso .preenchimento.sla-bom { background: linear-gradient(90deg, #4caf50, #8bc34a); }
.barra-progresso .preenchimento.sla-medio { background: linear-gradient(90deg, #ff9800, #ffc107); }
.barra-progresso .preenchimento.sla-ruim { background: linear-gradient(90deg, #f44336, #ff5722); }

/* ═══════════════════════════════════════════════════════════════ */
/* TABELA DE SERVIÇOS */
/* ═══════════════════════════════════════════════════════════════ */

.servicos-section {
    padding: 25px 30px;
    background: linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%);
}

.servicos-section h2 {
    color: #1a237e;
    font-size: 1.3em;
    margin: 0 0 20px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.servicos-section h2::before {
    content: '🔧';
}

.tabela-servicos {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 3px 15px rgba(0,0,0,0.1);
}

.tabela-servicos th {
    background: linear-gradient(135deg, #1a237e, #3949ab);
    color: white;
    padding: 15px;
    text-align: left;
    font-weight: 600;
}

.tabela-servicos td {
    padding: 12px 15px;
    border-bottom: 1px solid #e0e0e0;
}

.tabela-servicos tr:nth-child(even) {
    background: #f8f9fa;
}

.tabela-servicos tr:hover {
    background: #e3f2fd;
}

.tabela-servicos .barra-mini {
    height: 8px;
    background: #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
}

.tabela-servicos .barra-mini .fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 4px;
}

/* ═══════════════════════════════════════════════════════════════ */
/* RODAPÉ */
/* ═══════════════════════════════════════════════════════════════ */

.relatorio-footer {
    background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
    color: white;
    padding: 20px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 15px;
}

.relatorio-footer .info {
    font-size: 0.9em;
    opacity: 0.9;
}

.relatorio-footer .acoes {
    display: flex;
    gap: 10px;
}

.relatorio-footer .btn-acao {
    background: rgba(255,255,255,0.2);
    color: white;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 10px 20px;
    border-radius: 25px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
}

.relatorio-footer .btn-acao:hover {
    background: rgba(255,255,255,0.3);
    transform: translateY(-2px);
}

/* ═══════════════════════════════════════════════════════════════ */
/* ANIMAÇÕES */
/* ═══════════════════════════════════════════════════════════════ */

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.relatorio-ia-container .stat-card,
.relatorio-ia-container .insight-card {
    animation: fadeInUp 0.5s ease forwards;
}

.relatorio-ia-container .stat-card:nth-child(1) { animation-delay: 0.1s; }
.relatorio-ia-container .stat-card:nth-child(2) { animation-delay: 0.2s; }
.relatorio-ia-container .stat-card:nth-child(3) { animation-delay: 0.3s; }
.relatorio-ia-container .stat-card:nth-child(4) { animation-delay: 0.4s; }
.relatorio-ia-container .stat-card:nth-child(5) { animation-delay: 0.5s; }
.relatorio-ia-container .stat-card:nth-child(6) { animation-delay: 0.6s; }

/* ═══════════════════════════════════════════════════════════════ */
/* RESPONSIVO */
/* ═══════════════════════════════════════════════════════════════ */

@media (max-width: 768px) {
    .relatorio-ia-container {
        margin: 10px;
        border-radius: 15px;
    }
    
    .relatorio-header {
        padding: 20px;
    }
    
    .relatorio-header h1 {
        font-size: 1.4em;
    }
    
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        padding: 15px;
    }
    
    .resumo-section,
    .insights-section,
    .graficos-section,
    .servicos-section {
        padding: 20px 15px;
    }
    
    .relatorio-footer {
        flex-direction: column;
        text-align: center;
    }
}

/* ═══════════════════════════════════════════════════════════════ */
/* IMPRESSÃO */
/* ═══════════════════════════════════════════════════════════════ */

@media print {
    .relatorio-ia-container {
        box-shadow: none;
        margin: 0;
    }
    
    .relatorio-footer .acoes {
        display: none;
    }
    
    .stat-card,
    .insight-card {
        break-inside: avoid;
    }
}
`;

/**
 * Gera o HTML completo do relatório formatado
 */
function gerarRelatorioVisual(dados) {
    // Injetar estilos se não existirem
    if (!document.getElementById('estilos-relatorio-ia')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'estilos-relatorio-ia';
        styleTag.textContent = estilosRelatorioIA;
        document.head.appendChild(styleTag);
    }
    
    const { resumo, stats, periodo, tendencias } = dados;
    
    // Determinar classe do SLA
    const slaPercent = parseFloat(stats.sla?.percentualSLA || 0);
    let slaClasse = 'sla-bom';
    if (slaPercent < 70) slaClasse = 'sla-ruim';
    else if (slaPercent < 85) slaClasse = 'sla-medio';
    
    // Gerar insights automáticos
    const insights = gerarInsightsAutomaticos(stats);
    
    // Gerar tabela de serviços
    const tabelaServicos = gerarTabelaServicos(stats.tiposServico);
    
    return `
    <div class="relatorio-ia-container">
        <div class="relatorio-ia-inner">
            <!-- CABEÇALHO -->
            <div class="relatorio-header">
                <h1>📊 Relatório de Produtividade - STIC</h1>
                <p class="subtitulo">Seção de Tecnologia da Informação e Comunicação - 7ª RPM/PMMG</p>
                <span class="periodo-badge">📅 ${periodo?.texto || 'Período não especificado'}</span>
            </div>
            
            <!-- CARDS DE ESTATÍSTICAS -->
            <div class="stats-grid">
                <div class="stat-card total">
                    <div class="icone">📋</div>
                    <div class="valor">${stats.total || 0}</div>
                    <div class="label">Total de OS</div>
                    ${tendencias?.total ? `<div class="variacao ${tendencias.total.tendencia === 'alta' ? 'positiva' : tendencias.total.tendencia === 'baixa' ? 'negativa' : 'neutra'}">${tendencias.total.icone} ${Math.abs(tendencias.total.percentual)}%</div>` : ''}
                </div>
                
                <div class="stat-card finalizadas">
                    <div class="icone">✅</div>
                    <div class="valor">${stats.finalizadas || 0}</div>
                    <div class="label">Finalizadas</div>
                    <div class="variacao positiva">${stats.percentualFinalizadas || 0}%</div>
                </div>
                
                <div class="stat-card andamento">
                    <div class="icone">🔄</div>
                    <div class="valor">${stats.emAndamento || 0}</div>
                    <div class="label">Em Andamento</div>
                </div>
                
                <div class="stat-card abertas">
                    <div class="icone">📂</div>
                    <div class="valor">${stats.abertas || 0}</div>
                    <div class="label">Abertas</div>
                </div>
                
                <div class="stat-card sla">
                    <div class="icone">⏱️</div>
                    <div class="valor">${stats.sla?.percentualSLA || 0}%</div>
                    <div class="label">SLA (≤15 dias)</div>
                </div>
                
                <div class="stat-card tempo">
                    <div class="icone">📆</div>
                    <div class="valor">${stats.tempoMedio || 'N/A'}</div>
                    <div class="label">Dias (média)</div>
                </div>
            </div>
            
            <!-- GRÁFICO DE SLA -->
            <div class="graficos-section">
                <h2>Cumprimento do SLA (Meta: 15 dias)</h2>
                <div class="grafico-container">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Dentro do prazo: ${stats.sla?.dentroSLA || 0} OS</span>
                        <span>Fora do prazo: ${stats.sla?.foraSLA || 0} OS</span>
                    </div>
                    <div class="barra-progresso">
                        <div class="preenchimento ${slaClasse}" style="width: ${slaPercent}%">${slaPercent}%</div>
                    </div>
                    <div style="text-align: center; margin-top: 10px; color: #666; font-size: 0.9em;">
                        ${slaPercent >= 85 ? '🏆 Excelente! Meta superada!' : slaPercent >= 70 ? '👍 Bom desempenho, continue assim!' : '⚠️ Atenção: SLA abaixo do esperado'}
                    </div>
                </div>
            </div>
            
            <!-- RESUMO EXECUTIVO -->
            <div class="resumo-section">
                <h2>Resumo Executivo</h2>
                <div class="resumo-texto">
                    ${resumo || 'Resumo não disponível.'}
                </div>
            </div>
            
            <!-- INSIGHTS -->
            <div class="insights-section">
                <h2>Insights e Destaques</h2>
                <div class="insights-grid">
                    ${insights.map(i => `
                        <div class="insight-card ${i.tipo}">
                            <div class="insight-icone">${i.icone}</div>
                            <div class="insight-texto">${i.texto}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- TABELA DE SERVIÇOS -->
            <div class="servicos-section">
                <h2>Tipos de Serviço Realizados</h2>
                ${tabelaServicos}
            </div>
            
            <!-- RODAPÉ -->
            <div class="relatorio-footer">
                <div class="info">
                    <div>🤖 Gerado por IA (Groq - ${dados.modelo || 'LLaMA 3.3'})</div>
                    <div>📅 ${new Date().toLocaleString('pt-BR')}</div>
                </div>
                <div class="acoes">
                    <button class="btn-acao" onclick="imprimirRelatorio()">
                        🖨️ Imprimir
                    </button>
                    <button class="btn-acao" onclick="exportarPDF()">
                        📄 Exportar PDF
                    </button>
                    <button class="btn-acao" onclick="copiarResumo()">
                        📋 Copiar Resumo
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
}

/**
 * Gera insights automáticos baseados nas estatísticas
 */
function gerarInsightsAutomaticos(stats) {
    const insights = [];
    
    // Taxa de conclusão
    const taxa = parseFloat(stats.percentualFinalizadas || 0);
    if (taxa >= 80) {
        insights.push({
            tipo: 'destaque',
            icone: '🏆',
            texto: `Taxa de conclusão de ${taxa}% demonstra alta eficiência da equipe técnica.`
        });
    } else if (taxa >= 60) {
        insights.push({
            tipo: 'info',
            icone: '📈',
            texto: `Taxa de conclusão de ${taxa}% - dentro da média esperada.`
        });
    } else {
        insights.push({
            tipo: 'atencao',
            icone: '⚠️',
            texto: `Taxa de conclusão de ${taxa}% - avaliar gargalos no processo.`
        });
    }
    
    // SLA
    const sla = parseFloat(stats.sla?.percentualSLA || 0);
    if (sla >= 90) {
        insights.push({
            tipo: 'destaque',
            icone: '⏱️',
            texto: `Excelente cumprimento de SLA: ${sla}% das OS dentro do prazo de 15 dias.`
        });
    } else if (sla < 70) {
        insights.push({
            tipo: 'alerta',
            icone: '🚨',
            texto: `SLA de ${sla}% abaixo do esperado. ${stats.sla?.foraSLA || 0} OS excederam o prazo.`
        });
    }
    
    // Tempo médio
    const tempo = parseFloat(stats.tempoMedio || 0);
    if (tempo > 0 && tempo <= 7) {
        insights.push({
            tipo: 'destaque',
            icone: '⚡',
            texto: `Tempo médio de ${tempo} dias indica resolução ágil dos chamados.`
        });
    } else if (tempo > 15) {
        insights.push({
            tipo: 'atencao',
            icone: '📊',
            texto: `Tempo médio de ${tempo} dias - avaliar complexidade das demandas.`
        });
    }
    
    // Volume de trabalho
    if (stats.total >= 50) {
        insights.push({
            tipo: 'destaque',
            icone: '📋',
            texto: `Alto volume de ${stats.total} OS demonstra demanda significativa pelo setor.`
        });
    }
    
    // Serviço mais demandado
    if (stats.tiposServico) {
        const servicos = Object.entries(stats.tiposServico).sort((a, b) => b[1] - a[1]);
        if (servicos.length > 0) {
            insights.push({
                tipo: 'info',
                icone: '🔧',
                texto: `"${servicos[0][0]}" foi o serviço mais demandado com ${servicos[0][1]} ocorrências.`
            });
        }
    }
    
    return insights;
}

/**
 * Gera tabela HTML dos tipos de serviço
 */
function gerarTabelaServicos(tiposServico) {
    if (!tiposServico || Object.keys(tiposServico).length === 0) {
        return '<p style="text-align:center;color:#666;">Nenhum serviço registrado.</p>';
    }
    
    const servicos = Object.entries(tiposServico).sort((a, b) => b[1] - a[1]);
    const total = servicos.reduce((sum, [, qtd]) => sum + qtd, 0);
    const maxQtd = servicos[0][1];
    
    let html = `
    <table class="tabela-servicos">
        <thead>
            <tr>
                <th style="width: 50px;">#</th>
                <th>Tipo de Serviço</th>
                <th style="width: 80px;">Qtd</th>
                <th style="width: 80px;">%</th>
                <th style="width: 150px;">Proporção</th>
            </tr>
        </thead>
        <tbody>
    `;
    
    servicos.slice(0, 10).forEach(([tipo, qtd], index) => {
        const percentual = ((qtd / total) * 100).toFixed(1);
        const barraWidth = (qtd / maxQtd) * 100;
        
        html += `
            <tr>
                <td style="font-weight: bold; color: #667eea;">${index + 1}º</td>
                <td>${tipo}</td>
                <td style="text-align: center; font-weight: bold;">${qtd}</td>
                <td style="text-align: center;">${percentual}%</td>
                <td>
                    <div class="barra-mini">
                        <div class="fill" style="width: ${barraWidth}%;"></div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
        </tbody>
    </table>
    `;
    
    return html;
}

/**
 * Função para imprimir relatório
 */
function imprimirRelatorio() {
    window.print();
}

/**
 * Função para copiar resumo
 */
async function copiarResumo() {
    const resumoEl = document.querySelector('.resumo-texto');
    if (resumoEl) {
        try {
            await navigator.clipboard.writeText(resumoEl.textContent);
            alert('✅ Resumo copiado para a área de transferência!');
        } catch (e) {
            // Fallback
            const range = document.createRange();
            range.selectNode(resumoEl);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand('copy');
            window.getSelection().removeAllRanges();
            alert('✅ Resumo copiado!');
        }
    }
}

/**
 * Função para exportar PDF (abre diálogo de impressão)
 */
function exportarPDF() {
    window.print();
}

// Exportar funções globalmente
window.gerarRelatorioVisual = gerarRelatorioVisual;
window.imprimirRelatorio = imprimirRelatorio;
window.copiarResumo = copiarResumo;
window.exportarPDF = exportarPDF;

console.log('✅ Módulo de Relatório Visual IA carregado!');
