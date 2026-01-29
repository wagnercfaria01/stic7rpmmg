// Sistema de Relatórios

let dadosRelatorio = [];
let graficos = {};

document.addEventListener('DOMContentLoaded', async () => {
    await carregarRelatorio();
});

// Carregar relatório
async function carregarRelatorio() {
    try {
        mostrarLoading('Gerando relatório...');
        
        // Obter período selecionado
        const periodo = document.getElementById('periodoRelatorio').value;
        const { dataInicio, dataFim } = obterPeriodo(periodo);
        
        // Buscar OS do Firebase
        const snapshot = await ordensServicoRef.get();
        let todasOS = [];
        
        snapshot.forEach(doc => {
            todasOS.push({ id: doc.id, ...doc.data() });
        });
        
        // Filtrar por período
        dadosRelatorio = todasOS.filter(os => {
            if (!os.data_abertura) return false;
            
            const dataOS = os.data_abertura.toDate ? os.data_abertura.toDate() : new Date(os.data_abertura);
            
            if (dataInicio && dataOS < dataInicio) return false;
            if (dataFim && dataOS > dataFim) return false;
            
            return true;
        });
        
        // Gerar estatísticas
        gerarCards();
        gerarGraficos();
        gerarTabela();
        
        ocultarLoading();
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao gerar relatório:', error);
        mostrarErro('Erro ao gerar relatório: ' + error.message);
    }
}

// Obter período selecionado
function obterPeriodo(periodo) {
    const agora = new Date();
    let dataInicio, dataFim;
    
    switch(periodo) {
        case 'mes_atual':
            dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
            dataFim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);
            break;
        
        case 'mes_passado':
            dataInicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
            dataFim = new Date(agora.getFullYear(), agora.getMonth(), 0, 23, 59, 59);
            break;
        
        case 'ultimo_trimestre':
            dataInicio = new Date(agora.getFullYear(), agora.getMonth() - 3, 1);
            dataFim = agora;
            break;
        
        case 'ano_atual':
            dataInicio = new Date(agora.getFullYear(), 0, 1);
            dataFim = new Date(agora.getFullYear(), 11, 31, 23, 59, 59);
            break;
        
        case 'customizado':
            const inicioInput = document.getElementById('dataInicioRel').value;
            const fimInput = document.getElementById('dataFimRel').value;
            dataInicio = inicioInput ? new Date(inicioInput) : null;
            dataFim = fimInput ? new Date(fimInput + 'T23:59:59') : null;
            break;
        
        case 'todos':
        default:
            dataInicio = null;
            dataFim = null;
    }
    
    return { dataInicio, dataFim };
}

// Gerar cards de estatísticas
function gerarCards() {
    const container = document.getElementById('cardsEstatisticas');
    
    // ✅ CORREÇÃO: Normalizar status para comparação (case-insensitive e variações)
    const normalizarStatus = (status) => (status || '').toLowerCase().trim();
    
    const stats = {
        total: dadosRelatorio.length,
        // ✅ CORREÇÃO: Considerar variações de status
        abertas: dadosRelatorio.filter(os => {
            const s = normalizarStatus(os.status);
            return s === 'aberta' || s === 'novo' || s === 'pendente' || s === 'nova';
        }).length,
        emManutencao: dadosRelatorio.filter(os => {
            const s = normalizarStatus(os.status);
            return s === 'em_manutencao' || s === 'em manutenção' || s === 'em andamento' || 
                   s === 'em_andamento' || s === 'em execução' || s === 'em_execucao';
        }).length,
        aguardandoPeca: dadosRelatorio.filter(os => {
            const s = normalizarStatus(os.status);
            return s === 'aguardando_peca' || s === 'aguardando peça' || s === 'aguardando pecas' ||
                   s === 'aguardando_pecas' || s === 'aguardando material';
        }).length,
        finalizadas: dadosRelatorio.filter(os => {
            const s = normalizarStatus(os.status);
            return s === 'finalizada' || s === 'finalizado' || s === 'concluída' || 
                   s === 'concluida' || s === 'concluído' || s === 'concluido' ||
                   s === 'fechada' || s === 'fechado' || s === 'resolvida' || s === 'resolvido';
        }).length,
        tempoMedio: calcularTempoMedio()
    };
    
    // ✅ NOVO: Calcular percentuais
    const percentualFinalizadas = stats.total > 0 ? ((stats.finalizadas / stats.total) * 100).toFixed(1) : 0;
    const percentualAbertas = stats.total > 0 ? ((stats.abertas / stats.total) * 100).toFixed(1) : 0;
    
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-info">
                <h3>Total de OS</h3>
                <p class="stat-number">${stats.total}</p>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-info">
                <h3>Abertas</h3>
                <p class="stat-number">${stats.abertas}</p>
                <small style="color: #666;">${percentualAbertas}% do total</small>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon">🔧</div>
            <div class="stat-info">
                <h3>Em Manutenção</h3>
                <p class="stat-number">${stats.emManutencao}</p>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon">⏳</div>
            <div class="stat-info">
                <h3>Aguardando Peça</h3>
                <p class="stat-number">${stats.aguardandoPeca}</p>
            </div>
        </div>
        
        <div class="stat-card" style="background: linear-gradient(135deg, #28a745, #20c997);">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
                <h3>Finalizadas</h3>
                <p class="stat-number">${stats.finalizadas}</p>
                <small style="color: rgba(255,255,255,0.8);">${percentualFinalizadas}% de conclusão</small>
            </div>
        </div>
        
        <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-info">
                <h3>Tempo Médio</h3>
                <p class="stat-number">${stats.tempoMedio} dias</p>
            </div>
        </div>
    `;
}

// Calcular tempo médio de resolução
function calcularTempoMedio() {
    const finalizadas = dadosRelatorio.filter(os => os.status === 'finalizada' && os.data_finalizacao);
    
    if (finalizadas.length === 0) return 0;
    
    let somaTempos = 0;
    
    finalizadas.forEach(os => {
        const dataAbertura = os.data_abertura.toDate ? os.data_abertura.toDate() : new Date(os.data_abertura);
        const dataFinal = os.data_finalizacao.toDate ? os.data_finalizacao.toDate() : new Date(os.data_finalizacao);
        
        const diffDias = Math.ceil((dataFinal - dataAbertura) / (1000 * 60 * 60 * 24));
        somaTempos += diffDias;
    });
    
    return Math.round(somaTempos / finalizadas.length);
}

// Gerar gráficos
function gerarGraficos() {
    gerarGraficoStatus();
    gerarGraficoPrioridade();
    gerarGraficoTipo();
    gerarGraficoMensal();
}

// Gráfico por Status
function gerarGraficoStatus() {
    const ctx = document.getElementById('graficoStatus');
    
    // Destruir gráfico anterior se existir
    if (graficos.status) {
        graficos.status.destroy();
    }
    
    // ✅ CORREÇÃO: Normalizar status para comparação
    const normalizarStatus = (status) => (status || '').toLowerCase().trim();
    
    const dados = {
        aberta: dadosRelatorio.filter(os => {
            const s = normalizarStatus(os.status);
            return s === 'aberta' || s === 'novo' || s === 'pendente' || s === 'nova';
        }).length,
        em_manutencao: dadosRelatorio.filter(os => {
            const s = normalizarStatus(os.status);
            return s === 'em_manutencao' || s === 'em manutenção' || s === 'em andamento' || 
                   s === 'em_andamento' || s === 'em execução' || s === 'em_execucao';
        }).length,
        aguardando_peca: dadosRelatorio.filter(os => {
            const s = normalizarStatus(os.status);
            return s === 'aguardando_peca' || s === 'aguardando peça' || s === 'aguardando pecas' ||
                   s === 'aguardando_pecas' || s === 'aguardando material';
        }).length,
        enviado_bh: dadosRelatorio.filter(os => {
            const s = normalizarStatus(os.status);
            return s === 'enviado_bh' || s === 'enviado bh' || s === 'enviado para bh';
        }).length,
        finalizada: dadosRelatorio.filter(os => {
            const s = normalizarStatus(os.status);
            return s === 'finalizada' || s === 'finalizado' || s === 'concluída' || 
                   s === 'concluida' || s === 'concluído' || s === 'concluido' ||
                   s === 'fechada' || s === 'fechado' || s === 'resolvida' || s === 'resolvido';
        }).length
    };
    
    graficos.status = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Aberta', 'Em Manutenção', 'Aguardando Peça', 'Enviado BH', 'Finalizada'],
            datasets: [{
                data: [dados.aberta, dados.em_manutencao, dados.aguardando_peca, dados.enviado_bh, dados.finalizada],
                backgroundColor: ['#007bff', '#ffc107', '#fd7e14', '#6f42c1', '#28a745']
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

// Gráfico por Prioridade
function gerarGraficoPrioridade() {
    const ctx = document.getElementById('graficoPrioridade');
    
    if (graficos.prioridade) {
        graficos.prioridade.destroy();
    }
    
    const dados = {
        baixa: dadosRelatorio.filter(os => os.prioridade === 'baixa').length,
        media: dadosRelatorio.filter(os => os.prioridade === 'media').length,
        alta: dadosRelatorio.filter(os => os.prioridade === 'alta').length,
        urgente: dadosRelatorio.filter(os => os.prioridade === 'urgente').length
    };
    
    graficos.prioridade = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Baixa', 'Média', 'Alta', 'Urgente'],
            datasets: [{
                data: [dados.baixa, dados.media, dados.alta, dados.urgente],
                backgroundColor: ['#28a745', '#ffc107', '#fd7e14', '#dc3545']
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

// Gráfico por Tipo
function gerarGraficoTipo() {
    const ctx = document.getElementById('graficoTipo');
    
    if (graficos.tipo) {
        graficos.tipo.destroy();
    }
    
    const tipos = {};
    dadosRelatorio.forEach(os => {
        const tipo = os.tipo_equipamento || 'outro';
        tipos[tipo] = (tipos[tipo] || 0) + 1;
    });
    
    const labels = Object.keys(tipos).map(tipo => {
        const nomes = {
            'radio': 'Rádio',
            'ht': 'HT',
            'computador': 'Computador',
            'notebook': 'Notebook',
            'switch': 'Switch',
            'roteador': 'Roteador',
            'outro': 'Outro'
        };
        return nomes[tipo] || tipo;
    });
    
    graficos.tipo = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantidade',
                data: Object.values(tipos),
                backgroundColor: '#007bff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

// Gráfico Mensal
function gerarGraficoMensal() {
    const ctx = document.getElementById('graficoMensal');
    
    if (graficos.mensal) {
        graficos.mensal.destroy();
    }
    
    // Agrupar por mês
    const meses = {};
    dadosRelatorio.forEach(os => {
        if (!os.data_abertura) return;
        
        const data = os.data_abertura.toDate ? os.data_abertura.toDate() : new Date(os.data_abertura);
        const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`;
        
        meses[mesAno] = (meses[mesAno] || 0) + 1;
    });
    
    // Ordenar por data
    const mesesOrdenados = Object.keys(meses).sort((a, b) => {
        const [mesA, anoA] = a.split('/').map(Number);
        const [mesB, anoB] = b.split('/').map(Number);
        return (anoA - anoB) || (mesA - mesB);
    });
    
    graficos.mensal = new Chart(ctx, {
        type: 'line',
        data: {
            labels: mesesOrdenados,
            datasets: [{
                label: 'OS Abertas',
                data: mesesOrdenados.map(m => meses[m]),
                borderColor: '#007bff',
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

// Gerar tabela
function gerarTabela() {
    const container = document.getElementById('tabelaRelatorio');
    
    if (dadosRelatorio.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">Nenhum dado encontrado para o período selecionado</p>';
        return;
    }
    
    let html = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: var(--primary-color); color: white;">
                    <th style="padding: 1rem; text-align: left; border: 1px solid #ddd;">Número</th>
                    <th style="padding: 1rem; text-align: left; border: 1px solid #ddd;">Data</th>
                    <th style="padding: 1rem; text-align: left; border: 1px solid #ddd;">Equipamento</th>
                    <th style="padding: 1rem; text-align: left; border: 1px solid #ddd;">Patrimônio</th>
                    <th style="padding: 1rem; text-align: left; border: 1px solid #ddd;">Solicitante</th>
                    <th style="padding: 1rem; text-align: left; border: 1px solid #ddd;">Status</th>
                    <th style="padding: 1rem; text-align: left; border: 1px solid #ddd;">Prioridade</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    dadosRelatorio.forEach(os => {
        const dataAbertura = os.data_abertura ? 
            (os.data_abertura.toDate ? os.data_abertura.toDate() : new Date(os.data_abertura)).toLocaleDateString('pt-BR') : 
            '-';
        
        const statusTexto = {
            'aberta': 'Aberta',
            'em_manutencao': 'Em Manutenção',
            'aguardando_peca': 'Aguardando Peça',
            'enviado_bh': 'Enviado BH',
            'finalizada': 'Finalizada'
        };
        
        const prioridadeTexto = {
            'baixa': 'Baixa',
            'media': 'Média',
            'alta': 'Alta',
            'urgente': 'Urgente'
        };
        
        const tipoTexto = {
            'radio': 'Rádio',
            'ht': 'HT',
            'computador': 'Computador',
            'notebook': 'Notebook',
            'switch': 'Switch',
            'outro': 'Outro'
        };
        
        html += `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 0.8rem; border: 1px solid #ddd;">${os.numero || '-'}</td>
                <td style="padding: 0.8rem; border: 1px solid #ddd;">${dataAbertura}</td>
                <td style="padding: 0.8rem; border: 1px solid #ddd;">${tipoTexto[os.tipo_equipamento] || os.tipo_equipamento}</td>
                <td style="padding: 0.8rem; border: 1px solid #ddd;">${os.patrimonio}</td>
                <td style="padding: 0.8rem; border: 1px solid #ddd;">${os.solicitante?.nome || '-'}</td>
                <td style="padding: 0.8rem; border: 1px solid #ddd;">${statusTexto[os.status] || os.status}</td>
                <td style="padding: 0.8rem; border: 1px solid #ddd;">${prioridadeTexto[os.prioridade] || os.prioridade}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Exportar para Excel (CSV)
function exportarExcel() {
    if (dadosRelatorio.length === 0) {
        mostrarErro('Nenhum dado para exportar!');
        return;
    }
    
    // Preparar dados CSV
    let csv = 'Número;Data Abertura;Tipo;Patrimônio;Série;Solicitante;Unidade;Status;Prioridade;Defeito\n';
    
    dadosRelatorio.forEach(os => {
        const dataAbertura = os.data_abertura ? 
            (os.data_abertura.toDate ? os.data_abertura.toDate() : new Date(os.data_abertura)).toLocaleDateString('pt-BR') : 
            '';
        
        const linha = [
            os.numero || '',
            dataAbertura,
            os.tipo_equipamento || '',
            os.patrimonio || '',
            os.numero_serie || '',
            os.solicitante?.nome || '',
            os.solicitante?.unidade || '',
            os.status || '',
            os.prioridade || '',
            (os.defeito || '').replace(/\n/g, ' ')
        ];
        
        csv += linha.join(';') + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-stic-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    mostrarSucesso('Relatório exportado com sucesso!');
}

console.log('✅ Sistema de relatórios carregado!');
