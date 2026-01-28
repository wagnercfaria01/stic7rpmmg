// ============================================================
// FUNÇÕES NOVAS PARA RELATÓRIOS IA - PACOTE BÁSICO + INTERMEDIÁRIO
// Copie e cole estas funções no relatorios-ia.html
// ============================================================

/**
 * Renderizar relatório completo com SLA, tendências, gráficos e por unidade
 */
function renderizarRelatorio(resultado, osArray, dias, tendencias) {
    const preview = document.getElementById('relatorioPreview');
    const stats = resultado.stats;
    
    // Determinar status SLA
    const slaPercent = parseFloat(stats.sla.percentualSLA);
    const slaStatus = slaPercent >= 90 ? 'excelente' : 
                     slaPercent >= 80 ? 'bom' : 
                     slaPercent >= 70 ? 'regular' : 'critico';
    const slaTexto = slaPercent >= 90 ? 'EXCELENTE' : 
                    slaPercent >= 80 ? 'BOM' : 
                    slaPercent >= 70 ? 'REGULAR' : 'CRÍTICO';
    
    let html = `
        <div class="relatorio-header">
            <h1>POLÍCIA MILITAR DE MINAS GERAIS</h1>
            <h2>7ª REGIÃO DE POLÍCIA MILITAR</h2>
            <h2>STIC - SEÇÃO DE TECNOLOGIA DA INFORMAÇÃO</h2>
            <h3>RELATÓRIO DE ATIVIDADES</h3>
            <p style="margin-top:1rem;color:#666;">
                Período: ${resultado.stats.dataInicio || 'N/A'} a ${resultado.stats.dataFim || new Date().toLocaleDateString('pt-BR')}
            </p>
        </div>
        
        <!-- Resumo Executivo -->
        <div class="secao">
            <h3>📊 RESUMO EXECUTIVO</h3>
            <div class="resumo-executivo">${resultado.resumo}</div>
        </div>
        
        <!-- ========== NOVO: SLA ========== -->
        <div class="sla-container">
            <div class="sla-header">
                <div>
                    <div style="font-size:1.1rem;margin-bottom:0.5rem;">⏱️ Service Level Agreement (SLA)</div>
                    <div style="font-size:0.9rem;opacity:0.9;">Meta: Resolver em até ${stats.sla.meta} dias</div>
                </div>
                <span class="sla-status ${slaStatus}">${slaTexto}</span>
            </div>
            <div class="sla-grid">
                <div class="sla-card">
                    <div class="sla-card-valor">${stats.sla.dentroSLA}</div>
                    <div class="sla-card-label">Dentro do Prazo</div>
                </div>
                <div class="sla-card">
                    <div class="sla-card-valor">${stats.sla.foraSLA}</div>
                    <div class="sla-card-label">Fora do Prazo</div>
                </div>
                <div class="sla-card">
                    <div class="sla-card-valor">${stats.sla.percentualSLA}%</div>
                    <div class="sla-card-label">Taxa de Cumprimento</div>
                </div>
            </div>
            ${stats.sla.osFora.length > 0 ? `
            <div style="margin-top:1rem;font-size:0.85rem;">
                <strong>⚠️ OS Fora do SLA:</strong><br>
                ${stats.sla.osFora.map(os => `${os.numero} (${os.tipo}, ${os.tempo} dias)`).join(' • ')}
            </div>
            ` : ''}
        </div>
        
        <!-- ========== NOVO: TENDÊNCIAS ========== -->
        ${tendencias && tendencias.temDados ? `
        <div class="tendencias-container">
            <h3 style="margin-bottom:1rem;color:#003366;">📈 ANÁLISE DE TENDÊNCIAS</h3>
            <p style="font-size:0.9rem;color:#6c757d;margin-bottom:1rem;">
                Comparação com período anterior (${dias} dias)
            </p>
            <div class="tendencia-item">
                <span class="tendencia-label">Total de OS</span>
                <div class="tendencia-valor tendencia-${tendencias.variacoes.total.tendencia}">
                    <span class="tendencia-icone">${tendencias.variacoes.total.icone}</span>
                    <span>${stats.total} (${tendencias.variacoes.total.percentual}%)</span>
                </div>
            </div>
            <div class="tendencia-item">
                <span class="tendencia-label">OS Finalizadas</span>
                <div class="tendencia-valor tendencia-${tendencias.variacoes.finalizadas.tendencia}">
                    <span class="tendencia-icone">${tendencias.variacoes.finalizadas.icone}</span>
                    <span>${stats.finalizadas} (${tendencias.variacoes.finalizadas.percentual}%)</span>
                </div>
            </div>
            <div class="tendencia-item">
                <span class="tendencia-label">Tempo Médio</span>
                <div class="tendencia-valor tendencia-${tendencias.variacoes.tempo.tendencia}">
                    <span class="tendencia-icone">${tendencias.variacoes.tempo.icone}</span>
                    <span>${stats.tempoMedio} dias (${tendencias.variacoes.tempo.percentual}%)</span>
                </div>
            </div>
            <div class="tendencia-item">
                <span class="tendencia-label">Cumprimento SLA</span>
                <div class="tendencia-valor tendencia-${tendencias.variacoes.sla.tendencia}">
                    <span class="tendencia-icone">${tendencias.variacoes.sla.icone}</span>
                    <span>${stats.sla.percentualSLA}% (${tendencias.variacoes.sla.percentual}%)</span>
                </div>
            </div>
        </div>
        ` : ''}
        
        <!-- Indicadores Tradicionais -->
        <div class="secao">
            <h3>📈 INDICADORES-CHAVE</h3>
            <div class="indicadores-grid">
                <div class="indicador-card">
                    <div class="indicador-valor">${stats.total}</div>
                    <div class="indicador-label">Total de OS</div>
                </div>
                <div class="indicador-card success">
                    <div class="indicador-valor">${stats.finalizadas}</div>
                    <div class="indicador-label">Finalizadas</div>
                </div>
                <div class="indicador-card warning">
                    <div class="indicador-valor">${stats.tempoMedio}</div>
                    <div class="indicador-label">Dias (tempo médio)</div>
                </div>
                <div class="indicador-card">
                    <div class="indicador-valor">${stats.taxaConclusao}%</div>
                    <div class="indicador-label">Taxa de Conclusão</div>
                </div>
            </div>
        </div>
        
        <!-- ========== NOVO: GRÁFICOS ========== -->
        <div class="graficos-grid">
            <div class="grafico-card">
                <div class="grafico-titulo">📊 OS por Status</div>
                <canvas id="graficoStatus" width="300" height="300"></canvas>
            </div>
            <div class="grafico-card">
                <div class="grafico-titulo">📅 OS por Dia da Semana</div>
                <canvas id="graficoDiaSemana" width="300" height="300"></canvas>
            </div>
        </div>
        
        <!-- ========== NOVO: POR UNIDADE ========== -->
        ${stats.porUnidade.length > 0 ? `
        <div class="unidades-container">
            <h3 style="margin-bottom:1rem;color:#003366;">🏢 ATENDIMENTOS POR UNIDADE</h3>
            ${stats.porUnidade.map(unidade => `
                <div class="unidade-item">
                    <div class="unidade-header">
                        <span class="unidade-nome">${unidade.nome}</span>
                        <span class="unidade-badge">${unidade.total} OS (${unidade.percentual}%)</span>
                    </div>
                    <div class="unidade-detalhes">
                        ✅ Finalizadas: ${unidade.finalizadas} | 
                        📋 Principais serviços: ${unidade.principaisTipos}
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <!-- Principais Serviços -->
        <div class="secao">
            <h3>🔧 SERVIÇOS REALIZADOS</h3>
            <div style="background:#f8f9fa;padding:1rem;border-radius:8px;">
    `;
    
    // Listar top 10 OS
    osArray.slice(0, 10).forEach((os, index) => {
        const statusFinalizado = (os.status || '').toLowerCase().includes('final') || 
                                 (os.status || '').toLowerCase().includes('conclu');
        html += `
            <div class="os-detalhada">
                <strong>OS-${os.numero || os.id.substr(0, 6).toUpperCase()}</strong> | 
                ${os.tipo_servico || os.tipo_equipamento || 'Não especificado'}
                <br>
                <small style="color:#6c757d;">
                    Solicitante: ${os.solicitante?.nome || os.nome_solicitante || 'N/A'} | 
                    Status: <span style="color:${statusFinalizado ? '#28a745' : '#ffc107'}">${os.status || 'Aberta'}</span>
                </small>
        `;
        
        // Adicionar fotos se existirem
        if (os.fotos && os.fotos.length > 0) {
            html += `
                <div class="os-fotos-grid">
                    ${os.fotos.slice(0, 4).map(foto => `
                        <div class="os-foto">
                            <img src="${foto.url}" alt="Foto OS">
                            ${foto.legenda ? `<div class="os-foto-legenda">${foto.legenda}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        html += `</div>`;
    });
    
    html += `
            </div>
        </div>
        
        <!-- Top Equipamentos -->
        <div class="secao">
            <h3>🏆 TOP 5 EQUIPAMENTOS ATENDIDOS</h3>
            <ol style="line-height:2;">
                ${stats.top5Equipamentos.map(([equip, qtd]) => `
                    <li><strong>${equip}</strong>: ${qtd} atendimentos</li>
                `).join('')}
            </ol>
        </div>
    `;
    
    preview.innerHTML = html;
    
    // Renderizar gráficos após HTML estar no DOM
    setTimeout(() => {
        renderizarGraficos(stats);
    }, 100);
}

/**
 * Renderizar gráficos com Chart.js
 */
function renderizarGraficos(stats) {
    // Gráfico de Status
    const ctxStatus = document.getElementById('graficoStatus');
    if (ctxStatus) {
        new Chart(ctxStatus, {
            type: 'pie',
            data: {
                labels: ['Finalizadas', 'Em Andamento', 'Abertas'],
                datasets: [{
                    data: [stats.finalizadas, stats.emAndamento, stats.abertas],
                    backgroundColor: ['#28a745', '#ffc107', '#007bff']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }
    
    // Gráfico por Dia da Semana
    const ctxDia = document.getElementById('graficoDiaSemana');
    if (ctxDia) {
        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const valores = dias.map(d => stats.porDiaSemana[d] || 0);
        
        new Chart(ctxDia, {
            type: 'bar',
            data: {
                labels: dias,
                datasets: [{
                    label: 'Número de OS',
                    data: valores,
                    backgroundColor: '#007bff'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

/**
 * Exportar relatório para Excel
 */
function exportarExcel() {
    try {
        mostrarLoading('Gerando Excel...');
        
        const stats = relatorioAtual.resultado.stats;
        const osArray = relatorioAtual.osArray;
        
        // Criar workbook
        const wb = XLSX.utils.book_new();
        
        // ABA 1: Resumo Geral
        const resumoData = [
            ['RELATÓRIO STIC - 7ª RPM'],
            ['Período:', `${relatorioAtual.dias} dias`],
            ['Gerado em:', new Date().toLocaleString('pt-BR')],
            [],
            ['INDICADORES'],
            ['Total de OS', stats.total],
            ['Finalizadas', stats.finalizadas],
            ['Em Andamento', stats.emAndamento],
            ['Abertas', stats.abertas],
            ['Taxa de Conclusão', `${stats.taxaConclusao}%`],
            ['Tempo Médio', `${stats.tempoMedio} dias`],
            [],
            ['SLA (Meta: ' + stats.sla.meta + ' dias)'],
            ['Dentro do SLA', stats.sla.dentroSLA],
            ['Fora do SLA', stats.sla.foraSLA],
            ['% Cumprimento SLA', `${stats.sla.percentualSLA}%`]
        ];
        
        const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
        XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
        
        // ABA 2: Ordens de Serviço Detalhadas
        const osData = [
            ['Número', 'Status', 'Solicitante', 'Tipo de Serviço', 'Equipamento', 'Data Abertura', 'Data Finalização', 'Tempo (dias)', 'Unidade']
        ];
        
        osArray.forEach(os => {
            const dataAbertura = os.data_abertura?.toDate ? os.data_abertura.toDate() : new Date(os.data_abertura || '');
            const dataFinal = os.data_finalizacao?.toDate ? os.data_finalizacao.toDate() : new Date(os.data_finalizacao || '');
            const tempoDias = os.data_finalizacao ? ((dataFinal - dataAbertura) / (1000*60*60*24)).toFixed(1) : '-';
            
            osData.push([
                os.numero || os.id.substr(0, 8),
                os.status || 'Aberta',
                os.solicitante?.nome || os.nome_solicitante || 'N/A',
                os.tipo_servico || 'N/A',
                os.tipo_equipamento || 'N/A',
                dataAbertura.toLocaleDateString('pt-BR'),
                os.data_finalizacao ? dataFinal.toLocaleDateString('pt-BR') : '-',
                tempoDias,
                os.unidade || os.batalhao || 'N/A'
            ]);
        });
        
        const wsOS = XLSX.utils.aoa_to_sheet(osData);
        XLSX.utils.book_append_sheet(wb, wsOS, 'Ordens de Serviço');
        
        // ABA 3: Análise por Unidade
        if (stats.porUnidade.length > 0) {
            const unidadeData = [
                ['Unidade', 'Total OS', 'Finalizadas', 'Percentual', 'Principais Serviços']
            ];
            
            stats.porUnidade.forEach(u => {
                unidadeData.push([
                    u.nome,
                    u.total,
                    u.finalizadas,
                    `${u.percentual}%`,
                    u.principaisTipos
                ]);
            });
            
            const wsUnidade = XLSX.utils.aoa_to_sheet(unidadeData);
            XLSX.utils.book_append_sheet(wb, wsUnidade, 'Por Unidade');
        }
        
        // ABA 4: Top Equipamentos
        const equipData = [['Equipamento', 'Quantidade de OS']];
        stats.top5Equipamentos.forEach(([eq, qtd]) => {
            equipData.push([eq, qtd]);
        });
        
        const wsEquip = XLSX.utils.aoa_to_sheet(equipData);
        XLSX.utils.book_append_sheet(wb, wsEquip, 'Top Equipamentos');
        
        // Salvar arquivo
        const filename = `relatorio-stic-${relatorioAtual.dias}dias-${Date.now()}.xlsx`;
        XLSX.writeFile(wb, filename);
        
        ocultarLoading();
        mostrarSucesso('Excel gerado com sucesso!');
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao gerar Excel:', error);
        mostrarErro('Erro ao gerar Excel: ' + error.message);
    }
}
