// Relatórios Avançados com Gráficos - STIC PMMG

let todasOS = [];
let charts = {};

document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados();
    await carregarTecnicos();
    criarGraficos();
});

// Carregar dados
async function carregarDados() {
    try {
        mostrarLoading('Carregando dados...');
        
        const snapshot = await ordensServicoRef.get();
        todasOS = [];
        
        snapshot.forEach(doc => {
            todasOS.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`✅ ${todasOS.length} OS carregadas`);
        
        ocultarLoading();
        
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        ocultarLoading();
        mostrarErro('Erro ao carregar dados');
    }
}

// Carregar técnicos para filtro
async function carregarTecnicos() {
    const select = document.getElementById('filtroTecnico');
    const tecnicos = new Set();
    
    todasOS.forEach(os => {
        if (os.tecnico_responsavel) {
            tecnicos.add(os.tecnico_responsavel);
        }
    });
    
    tecnicos.forEach(tecnico => {
        const option = document.createElement('option');
        option.value = tecnico;
        option.textContent = tecnico;
        select.appendChild(option);
    });
}

// Filtrar OS
function filtrarOS() {
    const periodo = document.getElementById('filtroPeriodo').value;
    const tecnico = document.getElementById('filtroTecnico').value;
    const equipamento = document.getElementById('filtroEquipamento').value;
    
    let osFiltradas = todasOS;
    
    // Filtro por período
    if (periodo !== 'todos') {
        const agora = new Date();
        let dataLimite;
        
        if (periodo === 'mes') {
            dataLimite = new Date(agora.getFullYear(), agora.getMonth(), 1);
        } else if (periodo === 'trimestre') {
            dataLimite = new Date(agora.setMonth(agora.getMonth() - 3));
        } else if (periodo === 'semestre') {
            dataLimite = new Date(agora.setMonth(agora.getMonth() - 6));
        } else if (periodo === 'ano') {
            dataLimite = new Date(agora.getFullYear(), 0, 1);
        }
        
        osFiltradas = osFiltradas.filter(os => {
            if (!os.data_abertura) return false;
            const dataOS = os.data_abertura.toDate ? os.data_abertura.toDate() : new Date(os.data_abertura);
            return dataOS >= dataLimite;
        });
    }
    
    // Filtro por técnico
    if (tecnico) {
        osFiltradas = osFiltradas.filter(os => os.tecnico_responsavel === tecnico);
    }
    
    // Filtro por equipamento
    if (equipamento) {
        osFiltradas = osFiltradas.filter(os => os.tipo_equipamento === equipamento);
    }
    
    return osFiltradas;
}

// Criar todos os gráficos
function criarGraficos() {
    criarGraficoEquipamentos();
    criarGraficoTempo();
    criarGraficoPatrimonios();
    criarGraficoTecnicos();
    criarGraficoEvolucao();
}

// Atualizar gráficos quando filtros mudarem
function atualizarGraficos() {
    Object.values(charts).forEach(chart => chart.destroy());
    criarGraficos();
}

// Gráfico 1: OS por Equipamento (Pizza)
function criarGraficoEquipamentos() {
    const osFiltradas = filtrarOS();
    const equipamentos = {};
    
    osFiltradas.forEach(os => {
        const tipo = os.tipo_equipamento || 'Outros';
        equipamentos[tipo] = (equipamentos[tipo] || 0) + 1;
    });
    
    const ctx = document.getElementById('chartEquipamentos').getContext('2d');
    charts.equipamentos = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(equipamentos).map(tipo => {
                const nomes = {
                    'radio': 'Rádio',
                    'ht': 'HT',
                    'computador': 'Computador',
                    'notebook': 'Notebook',
                    'switch': 'Switch',
                    'roteador': 'Roteador',
                    'impressora': 'Impressora'
                };
                return nomes[tipo] || tipo;
            }),
            datasets: [{
                data: Object.values(equipamentos),
                backgroundColor: [
                    '#003366',
                    '#0066cc',
                    '#3399ff',
                    '#66b2ff',
                    '#99ccff',
                    '#ccddff',
                    '#e6f0ff'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Gráfico 2: Tempo Médio de Resolução (Linha)
function criarGraficoTempo() {
    const osFiltradas = filtrarOS().filter(os => os.status === 'finalizada');
    const meses = {};
    
    osFiltradas.forEach(os => {
        if (!os.data_abertura || !os.data_finalizacao) return;
        
        const dataAbertura = os.data_abertura.toDate ? os.data_abertura.toDate() : new Date(os.data_abertura);
        const dataFinal = os.data_finalizacao.toDate ? os.data_finalizacao.toDate() : new Date(os.data_finalizacao);
        
        const mes = `${dataAbertura.getMonth() + 1}/${dataAbertura.getFullYear()}`;
        const dias = Math.round((dataFinal - dataAbertura) / (1000 * 60 * 60 * 24));
        
        if (!meses[mes]) {
            meses[mes] = { total: 0, count: 0 };
        }
        meses[mes].total += dias;
        meses[mes].count += 1;
    });
    
    const labels = Object.keys(meses).sort();
    const medias = labels.map(mes => Math.round(meses[mes].total / meses[mes].count));
    
    const ctx = document.getElementById('chartTempo').getContext('2d');
    charts.tempo = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Dias Médios',
                data: medias,
                borderColor: '#003366',
                backgroundColor: 'rgba(0, 51, 102, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Dias'
                    }
                }
            }
        }
    });
}

// Gráfico 3: Patrimônios Problemáticos (Barra)
function criarGraficoPatrimonios() {
    const osFiltradas = filtrarOS();
    const patrimonios = {};
    
    osFiltradas.forEach(os => {
        if (os.patrimonio) {
            patrimonios[os.patrimonio] = (patrimonios[os.patrimonio] || 0) + 1;
        }
    });
    
    // Top 10 patrimônios com mais OS
    const top10 = Object.entries(patrimonios)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    const ctx = document.getElementById('chartPatrimonios').getContext('2d');
    charts.patrimonios = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top10.map(p => p[0]),
            datasets: [{
                label: 'Número de OS',
                data: top10.map(p => p[1]),
                backgroundColor: '#dc3545'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Gráfico 4: Performance por Técnico (Barra Horizontal)
function criarGraficoTecnicos() {
    const osFiltradas = filtrarOS();
    const tecnicos = {};
    
    osFiltradas.forEach(os => {
        if (os.tecnico_responsavel) {
            if (!tecnicos[os.tecnico_responsavel]) {
                tecnicos[os.tecnico_responsavel] = {
                    total: 0,
                    finalizadas: 0,
                    dias_total: 0
                };
            }
            
            tecnicos[os.tecnico_responsavel].total += 1;
            
            if (os.status === 'finalizada') {
                tecnicos[os.tecnico_responsavel].finalizadas += 1;
                
                if (os.data_abertura && os.data_finalizacao) {
                    const dataAbertura = os.data_abertura.toDate ? os.data_abertura.toDate() : new Date(os.data_abertura);
                    const dataFinal = os.data_finalizacao.toDate ? os.data_finalizacao.toDate() : new Date(os.data_finalizacao);
                    const dias = Math.round((dataFinal - dataAbertura) / (1000 * 60 * 60 * 24));
                    tecnicos[os.tecnico_responsavel].dias_total += dias;
                }
            }
        }
    });
    
    const labels = Object.keys(tecnicos);
    const dados = labels.map(tecnico => tecnicos[tecnico].finalizadas);
    
    const ctx = document.getElementById('chartTecnicos').getContext('2d');
    charts.tecnicos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'OS Finalizadas',
                data: dados,
                backgroundColor: '#28a745'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Gráfico 5: Evolução Mensal (Linha)
function criarGraficoEvolucao() {
    const osFiltradas = filtrarOS();
    const meses = {};
    
    osFiltradas.forEach(os => {
        if (!os.data_abertura) return;
        
        const data = os.data_abertura.toDate ? os.data_abertura.toDate() : new Date(os.data_abertura);
        const mes = `${data.getMonth() + 1}/${data.getFullYear()}`;
        
        if (!meses[mes]) {
            meses[mes] = {
                aberta: 0,
                em_manutencao: 0,
                finalizada: 0
            };
        }
        
        if (os.status === 'aberta') meses[mes].aberta += 1;
        else if (os.status === 'em_manutencao') meses[mes].em_manutencao += 1;
        else if (os.status === 'finalizada') meses[mes].finalizada += 1;
    });
    
    const labels = Object.keys(meses).sort();
    
    const ctx = document.getElementById('chartEvolucao').getContext('2d');
    charts.evolucao = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Abertas',
                    data: labels.map(mes => meses[mes].aberta),
                    borderColor: '#ffc107',
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Em Manutenção',
                    data: labels.map(mes => meses[mes].em_manutencao),
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Finalizadas',
                    data: labels.map(mes => meses[mes].finalizada),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Exportar relatório
function exportarRelatorio() {
    alert('Funcionalidade de exportação em PDF será implementada em breve!');
}

console.log('✅ Relatórios avançados carregados!');
