// ========== FUNÇÕES PARA ETAPA 2: GRÁFICOS + EXCEL + FILTRO ==========

// Variáveis globais para armazenar dados
let graficosGerados = {};
let unidadeFiltrada = null;

/**
 * ========== GERAR TODOS OS GRÁFICOS ==========
 */
async function gerarGraficos(stats) {
    try {
        console.log('📊 Gerando gráficos...');
        
        // Limpar gráficos anteriores
        Object.values(graficosGerados).forEach(chart => {
            if (chart) chart.destroy();
        });
        graficosGerados = {};
        
        // 1. Gráfico de Pizza - Status das OS
        const ctxStatus = document.getElementById('chartStatus').getContext('2d');
        graficosGerados.status = new Chart(ctxStatus, {
            type: 'pie',
            data: {
                labels: ['Finalizadas', 'Em Andamento', 'Abertas'],
                datasets: [{
                    data: [stats.finalizadas, stats.emAndamento, stats.abertas],
                    backgroundColor: ['#28a745', '#ffc107', '#17a2b8'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { size: 14 }, padding: 15 }
                    },
                    title: {
                        display: true,
                        text: 'Distribuição por Status',
                        font: { size: 16, weight: 'bold' }
                    }
                }
            }
        });
        
        // 2. Gráfico de Barras - Top 5 Serviços
        const ctxServicos = document.getElementById('chartServicos').getContext('2d');
        const top5Servicos = Object.entries(stats.tiposServico)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        graficosGerados.servicos = new Chart(ctxServicos, {
            type: 'bar',
            data: {
                labels: top5Servicos.map(([tipo]) => tipo),
                datasets: [{
                    label: 'Quantidade de OS',
                    data: top5Servicos.map(([, qtd]) => qtd),
                    backgroundColor: '#007bff',
                    borderColor: '#0056b3',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Top 5 Tipos de Serviço',
                        font: { size: 16, weight: 'bold' }
                    }
                }
            }
        });
        
        // 3. Gráfico de Barras - Top 5 Unidades
        const ctxUnidades = document.getElementById('chartUnidades').getContext('2d');
        const top5Unidades = stats.porUnidade.slice(0, 5);
        
        graficosGerados.unidades = new Chart(ctxUnidades, {
            type: 'bar',
            data: {
                labels: top5Unidades.map(u => u.nome),
                datasets: [{
                    label: 'Total de OS',
                    data: top5Unidades.map(u => u.total),
                    backgroundColor: '#6f42c1',
                    borderColor: '#5a31a1',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: false,
                indexAxis: 'y', // Barras horizontais
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                },
                plugins: {
                    legend: { display: false },
                    title: {
                        display: true,
                        text: 'Atendimentos por Unidade',
                        font: { size: 16, weight: 'bold' }
                    }
                }
            }
        });
        
        // 4. Gráfico de Linha - Tendências (se houver)
        if (stats.tendencias) {
            const ctxTendencias = document.getElementById('chartTendencias').getContext('2d');
            graficosGerados.tendencias = new Chart(ctxTendencias, {
                type: 'line',
                data: {
                    labels: ['Período Anterior', 'Período Atual'],
                    datasets: [
                        {
                            label: 'Total de OS',
                            data: [stats.tendencias.totalAnterior, stats.tendencias.totalAtual],
                            borderColor: '#007bff',
                            backgroundColor: 'rgba(0, 123, 255, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'Finalizadas',
                            data: [
                                Math.round(stats.tendencias.totalAnterior * (stats.tendencias.taxaAnterior / 100)),
                                stats.finalizadas
                            ],
                            borderColor: '#28a745',
                            backgroundColor: 'rgba(40, 167, 69, 0.1)',
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Evolução do Volume de OS',
                            font: { size: 16, weight: 'bold' }
                        }
                    }
                }
            });
        }
        
        console.log('✅ Gráficos gerados com sucesso!');
        return graficosGerados;
        
    } catch (error) {
        console.error('❌ Erro ao gerar gráficos:', error);
        return {};
    }
}

/**
 * ========== EXPORTAR PARA EXCEL ==========
 */
async function exportarExcel() {
    if (!relatorioAtual) {
        mostrarErro('Gere um relatório primeiro!');
        return;
    }
    
    try {
        mostrarLoading('Gerando arquivo Excel...');
        
        const stats = relatorioAtual.resultado.stats;
        const osArray = relatorioAtual.osArray;
        
        // ===== PLANILHA 1: RESUMO =====
        const sheetResumo = [
            ['RELATÓRIO DE ATIVIDADES - STIC 7ª RPM/PMMG'],
            [`Período: ${relatorioAtual.dias} dias | Gerado em: ${new Date().toLocaleString('pt-BR')}`],
            [],
            ['INDICADOR', 'VALOR'],
            ['Total de OS', stats.total],
            ['Finalizadas', `${stats.finalizadas} (${stats.percentualFinalizadas}%)`],
            ['Em Andamento', stats.emAndamento],
            ['Abertas', stats.abertas],
            ['Tempo Médio', `${stats.tempoMedio} dias`],
            ['Taxa de Conclusão', `${stats.taxaConclusao}%`],
            [],
            ['SLA (Meta: 3 dias)'],
            ['Dentro do prazo', `${stats.sla.dentroSLA} (${stats.sla.percentualSLA}%)`],
            ['Fora do prazo', stats.sla.foraSLA],
            ['Status', stats.sla.status]
        ];
        
        // ===== PLANILHA 2: OS DETALHADAS =====
        const sheetOS = [
            ['Número', 'Data Abertura', 'Solicitante', 'Tipo Serviço', 'Equipamento', 'Status', 'Tempo (dias)', 'Unidade']
        ];
        
        osArray.forEach(os => {
            const dataAbertura = os.data_abertura?.toDate ? os.data_abertura.toDate() : new Date(os.data_abertura || '');
            const tempo = os.data_finalizacao ? 
                Math.round((new Date(os.data_finalizacao.toDate ? os.data_finalizacao.toDate() : os.data_finalizacao) - dataAbertura) / (1000*60*60*24)) : 
                '-';
            
            sheetOS.push([
                os.numero || os.id.substr(0, 6).toUpperCase(),
                dataAbertura.toLocaleDateString('pt-BR'),
                os.solicitante?.nome || 'N/A',
                os.tipo_servico || 'N/A',
                os.tipo_equipamento || 'N/A',
                os.status || 'Aberta',
                tempo,
                os.unidade || os.batalhao || os.solicitante?.unidade || 'N/A'
            ]);
        });
        
        // ===== PLANILHA 3: ANÁLISE DE SLA =====
        const sheetSLA = [
            ['ANÁLISE DE SLA - Meta: 3 dias'],
            [],
            ['Categoria', 'Quantidade', 'Percentual'],
            ['Dentro do SLA', stats.sla.dentroSLA, `${stats.sla.percentualSLA}%`],
            ['Fora do SLA', stats.sla.foraSLA, `${(100 - parseFloat(stats.sla.percentualSLA)).toFixed(1)}%`],
            [],
            ['Status Geral', stats.sla.status],
            []
        ];
        
        if (stats.sla.osFora.length > 0) {
            sheetSLA.push(['OS FORA DO SLA:']);
            sheetSLA.push(['Número', 'Tipo', 'Tempo (dias)', 'Motivo']);
            stats.sla.osFora.forEach(os => {
                sheetSLA.push([os.numero, os.tipo, os.tempo, os.motivo]);
            });
        }
        
        // ===== PLANILHA 4: POR UNIDADE =====
        const sheetUnidades = [
            ['ATENDIMENTOS POR UNIDADE'],
            [],
            ['Unidade', 'Total OS', 'Finalizadas', '% Conclusão', 'Principais Tipos']
        ];
        
        stats.porUnidade.forEach(unidade => {
            const percConclusao = unidade.total > 0 ? ((unidade.finalizadas / unidade.total) * 100).toFixed(1) : 0;
            sheetUnidades.push([
                unidade.nome,
                unidade.total,
                unidade.finalizadas,
                `${percConclusao}%`,
                unidade.principaisTipos
            ]);
        });
        
        // ===== PLANILHA 5: TENDÊNCIAS =====
        const sheetTendencias = [
            ['ANÁLISE DE TENDÊNCIAS'],
            []
        ];
        
        if (stats.tendencias) {
            const t = stats.tendencias;
            sheetTendencias.push(
                ['Indicador', 'Período Anterior', 'Período Atual', 'Variação'],
                ['Total de OS', t.totalAnterior, t.totalAtual, t.totalVariacao],
                ['Tempo Médio', `${t.tempoAnterior}d`, `${t.tempoAtual}d`, t.tempoVariacao],
                ['Taxa de Conclusão', `${t.taxaAnterior}%`, `${t.taxaAtual}%`, t.taxaVariacao],
                [],
                ['ANÁLISE:'],
                ['Total de OS', t.totalMelhorou ? 'Aumentou ↑' : 'Diminuiu ↓'],
                ['Tempo Médio', t.tempoMelhorou ? 'Melhorou (↓)' : 'Piorou (↑)'],
                ['Taxa de Conclusão', t.taxaMelhorou ? 'Melhorou ↑' : 'Piorou ↓']
            );
        } else {
            sheetTendencias.push(['Primeiro período de análise - Sem dados para comparação']);
        }
        
        // ===== CRIAR WORKBOOK =====
        const wb = XLSX.utils.book_new();
        
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetResumo), 'Resumo');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetOS), 'OS Detalhadas');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetSLA), 'SLA');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetUnidades), 'Por Unidade');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheetTendencias), 'Tendências');
        
        // ===== SALVAR ARQUIVO =====
        const filename = `relatorio-stic-${relatorioAtual.dias}dias-${Date.now()}.xlsx`;
        XLSX.writeFile(wb, filename);
        
        ocultarLoading();
        mostrarSucesso('Excel exportado com sucesso!');
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao exportar Excel:', error);
        mostrarErro('Erro ao exportar Excel: ' + error.message);
    }
}

/**
 * ========== POPULAR DROPDOWN DE UNIDADES ==========
 */
function popularDropdownUnidades(stats) {
    const dropdown = document.getElementById('filtroUnidade');
    if (!dropdown) return;
    
    // Limpar opções antigas (exceto "Todas")
    dropdown.innerHTML = '<option value="">Todas as Unidades</option>';
    
    // Adicionar unidades
    stats.porUnidade.forEach(unidade => {
        const option = document.createElement('option');
        option.value = unidade.nome;
        option.textContent = `${unidade.nome} (${unidade.total} OS)`;
        dropdown.appendChild(option);
    });
}

/**
 * ========== APLICAR FILTRO POR UNIDADE ==========
 */
function aplicarFiltroUnidade() {
    const dropdown = document.getElementById('filtroUnidade');
    const unidadeSelecionada = dropdown.value;
    
    if (!unidadeSelecionada) {
        limparFiltroUnidade();
        return;
    }
    
    unidadeFiltrada = unidadeSelecionada;
    
    // Mostrar info do filtro
    document.getElementById('infoFiltroUnidade').style.display = 'block';
    document.getElementById('nomeUnidadeFiltrada').textContent = unidadeSelecionada;
    
    // Avisar que precisa gerar novo relatório
    mostrarSucesso(`Filtro aplicado: ${unidadeSelecionada}. Gere o relatório novamente para ver os dados filtrados.`);
}

/**
 * ========== LIMPAR FILTRO POR UNIDADE ==========
 */
function limparFiltroUnidade() {
    unidadeFiltrada = null;
    document.getElementById('filtroUnidade').value = '';
    document.getElementById('infoFiltroUnidade').style.display = 'none';
    mostrarSucesso('Filtro removido. Gere o relatório novamente para ver todos os dados.');
}
