// App principal - Dashboard

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Iniciando aplicação STIC...');
    
    // Aguardar Firebase estar pronto
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (typeof ordensServicoRef === 'undefined') {
        console.error('❌ Firebase não carregado!');
        return;
    }
    
    await carregarDashboard();
    
    // Atualizar a cada 30 segundos
    setInterval(carregarDashboard, 30000);
});

// Carregar dados do dashboard
async function carregarDashboard() {
    try {
        // Buscar todas as OS do Firebase
        const snapshot = await ordensServicoRef.limit(100).get();
        const todasOS = [];
        
        snapshot.forEach(doc => {
            todasOS.push({ id: doc.id, ...doc.data() });
        });
        
        // Calcular estatísticas
        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        
        const stats = {
            osAbertas: todasOS.filter(os => os.status === 'aberta').length,
            emManutencao: todasOS.filter(os => os.status === 'em_manutencao').length,
            enviadosBH: todasOS.filter(os => os.status === 'enviado_bh').length,
            finalizadas: todasOS.filter(os => {
                if (os.status !== 'finalizada') return false;
                if (!os.data_finalizacao) return false;
                const dataFinal = os.data_finalizacao.toDate ? os.data_finalizacao.toDate() : new Date(os.data_finalizacao);
                return dataFinal >= inicioMes;
            }).length
        };
        
        atualizarEstatisticas(stats);
        await carregarUltimasOS(todasOS);
        
        // Criar gráficos
        criarGraficoEquipamentos(todasOS);
        criarGraficoStatus(todasOS);
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        mostrarErro('Erro ao carregar dados do dashboard');
    }
}

// Atualizar estatísticas
function atualizarEstatisticas(stats) {
    document.getElementById('osAbertas').textContent = stats.osAbertas;
    document.getElementById('emManutencao').textContent = stats.emManutencao;
    document.getElementById('enviadosBH').textContent = stats.enviadosBH;
    document.getElementById('finalizadas').textContent = stats.finalizadas;
    
    // Animar números
    animarNumeros();
}

function animarNumeros() {
    const numeros = document.querySelectorAll('.stat-number');
    numeros.forEach(numero => {
        const valor = parseInt(numero.textContent);
        let contador = 0;
        const incremento = Math.ceil(valor / 20);
        
        const intervalo = setInterval(() => {
            contador += incremento;
            if (contador >= valor) {
                contador = valor;
                clearInterval(intervalo);
            }
            numero.textContent = contador;
        }, 50);
    });
}

// Carregar últimas OS
async function carregarUltimasOS(osArray) {
    const listaOS = document.getElementById('listaOS');
    
    if (!listaOS) return;
    
    // Limpar lista
    listaOS.innerHTML = '';
    
    if (!osArray || osArray.length === 0) {
        listaOS.innerHTML = `
            <div style="padding: 3rem; text-align: center; color: #6c757d;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                <h3>Nenhuma ordem de serviço encontrada</h3>
                <p>Crie a primeira OS clicando no botão "Nova OS"</p>
                <button onclick="window.location='pages/nova-os.html'" class="btn-primary" style="margin-top: 1rem;">
                    ➕ Criar Primeira OS
                </button>
            </div>
        `;
        return;
    }
    
    // Ordenar por data mais recente
    const osOrdenadas = osArray
        .filter(os => {
            // Filtrar apenas OS completamente vazias/inválidas
            return os.id && (os.patrimonio || os.tipo_servico);
        })
        .sort((a, b) => {
            const dataA = a.data_abertura?.toDate ? a.data_abertura.toDate() : new Date(a.data_abertura || 0);
            const dataB = b.data_abertura?.toDate ? b.data_abertura.toDate() : new Date(b.data_abertura || 0);
            return dataB - dataA;
        });
    
    // Mostrar apenas as 10 mais recentes
    const ultimasOS = osOrdenadas.slice(0, 10);
    
    // Renderizar OS
    ultimasOS.forEach(os => {
        const item = criarItemOS(os);
        listaOS.appendChild(item);
    });
}

// Criar item de OS
function criarItemOS(os) {
    const div = document.createElement('div');
    div.className = 'os-item';
    
    const statusClass = {
        'aberta': 'status-aberta',
        'em_manutencao': 'status-manutencao',
        'aguardando_peca': 'status-manutencao',
        'aguardando_teste': 'status-manutencao',
        'enviado_bh': 'status-enviado-bh',
        'finalizada': 'status-finalizada'
    };
    
    const statusTexto = {
        'aberta': 'Aberta',
        'em_manutencao': 'Em Manutenção',
        'aguardando_peca': 'Aguardando Peça',
        'aguardando_teste': 'Aguardando Teste',
        'enviado_bh': 'Enviado BH',
        'finalizada': 'Finalizada'
    };
    
    // Formatar data
    let dataFormatada = 'Data não disponível';
    if (os.data_abertura) {
        const data = os.data_abertura.toDate ? os.data_abertura.toDate() : new Date(os.data_abertura);
        dataFormatada = data.toLocaleDateString('pt-BR');
    }
    
    // Tipo de equipamento/serviço
    const tipoEquipamento = {
        'radio': '📻 Rádio',
        'ht': '📡 HT',
        'computador': '🖥️ Computador',
        'notebook': '💻 Notebook',
        'switch': '🔌 Switch',
        'roteador': '📶 Roteador',
        'impressora': '🖨️ Impressora',
        'outro': '📦 Outro'
    };
    
    const tipoServico = {
        'config_rede': '🌐 Configuração de Rede',
        'instalacao_cabeamento': '🔌 Instalação de Cabeamento',
        'config_roteador_switch': '📡 Config. Roteadores/Switches',
        'config_internet': '🌍 Configuração Internet',
        'config_firewall': '🔐 Config. Firewall',
        'instalacao_software': '🖥️ Instalação Software',
        'atualizacao_sistema': '💾 Atualização Sistema',
        'backup_restauracao': '🗄️ Backup/Restauração',
        'manutencao_preventiva': '🔧 Manutenção Preventiva',
        'instalacao_glpi': '📊 Instalação GLPI',
        'manutencao_cameras': '📹 Manutenção Câmeras',
        'instalacao_cameras': '📹 Instalação Câmeras',
        'config_dvr_nvr': '🎥 Config. DVR/NVR',
        'config_controle_acesso': '🔓 Controle de Acesso',
        'config_radios': '📻 Config. Rádios',
        'manutencao_radio': '📡 Manutenção Rádio',
        'config_pabx': '☎️ Config. PABX',
        'instalacao_ramal': '📞 Instalação Ramal',
        'outro': '📝 Outro'
    };
    
    // Verificar se é OS de equipamento ou serviço
    let tipoTexto, detalhesTexto;
    
    if (os.tipo_os === 'servico') {
        // OS de Serviço
        tipoTexto = tipoServico[os.tipo_servico] || '🛠️ Serviço';
        detalhesTexto = (os.descricao_servico || '').substring(0, 50) + '...';
    } else {
        // OS de Equipamento (padrão)
        tipoTexto = tipoEquipamento[os.tipo_equipamento] || os.tipo_equipamento || '📦 Equipamento';
        detalhesTexto = `Patrimônio: ${os.patrimonio || 'N/A'} | Série: ${os.numero_serie || 'N/A'}`;
    }
    
    div.innerHTML = `
        <div class="os-numero">${os.numero || 'N/A'}</div>
        <div class="os-equipamento">
            <strong>${tipoTexto}</strong>
            <small>${detalhesTexto}</small>
        </div>
        <div class="os-solicitante">
            <strong>${os.solicitante?.nome || 'N/A'}</strong>
            <small>${os.solicitante?.unidade || os.solicitante?.orgao || 'N/A'}</small>
        </div>
        <div class="os-data">${dataFormatada}</div>
        <span class="status-badge ${statusClass[os.status] || 'status-aberta'}">${statusTexto[os.status] || os.status}</span>
        <div class="os-actions">
            <button class="btn-icon" title="Ver detalhes" onclick="verDetalhesOS('${os.id}')">👁️</button>
            <button class="btn-icon" title="Editar" onclick="editarOS('${os.id}')">✏️</button>
            <button class="btn-icon" title="Imprimir" onclick="imprimirOS('${os.id}')">🖨️</button>
            <button class="btn-icon btn-delete" title="Excluir" onclick="excluirOS('${os.id}', '${os.numero}')">🗑️</button>
        </div>
    `;
    
    return div;
}

// Ver detalhes da OS
async function verDetalhesOS(id) {
    try {
        mostrarLoading('Carregando detalhes...');
        
        const os = await buscarOSPorId(id);
        
        if (!os) {
            ocultarLoading();
            mostrarErro('OS não encontrada!');
            return;
        }
        
        ocultarLoading();
        mostrarModalDetalhes(os);
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao carregar detalhes:', error);
        mostrarErro('Erro ao carregar detalhes da OS');
    }
}

// Buscar OS por ID
async function buscarOSPorId(id) {
    try {
        const doc = await ordensServicoRef.doc(id).get();
        
        if (!doc.exists) {
            return null;
        }
        
        return { id: doc.id, ...doc.data() };
        
    } catch (error) {
        console.error('Erro ao buscar OS:', error);
        throw error;
    }
}

// Mostrar modal com detalhes
function mostrarModalDetalhes(os) {
    // Criar modal se não existir
    let modal = document.getElementById('modalDetalhes');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalDetalhes';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }
    
    // Formatar data
    const dataAbertura = os.data_abertura?.toDate ? 
        formatarDataHora(os.data_abertura.toDate()) : 
        'Data não disponível';
    
    const dataFinalizacao = os.data_finalizacao?.toDate ? 
        formatarDataHora(os.data_finalizacao.toDate()) : 
        '-';
    
    // Tipo equipamento
    const tipoEquipamento = {
        'radio': '📻 Rádio Móvel',
        'ht': '📡 HT (Handheld)',
        'computador': '🖥️ Computador Desktop',
        'notebook': '💻 Notebook',
        'switch': '🔌 Switch de Rede',
        'roteador': '📶 Roteador',
        'impressora': '🖨️ Impressora',
        'outro': '📦 Outro'
    };
    
    // Status
    const statusInfo = {
        'aberta': { classe: 'status-aberta', texto: '📋 Aberta - Aguardando Análise' },
        'em_manutencao': { classe: 'status-manutencao', texto: '🔧 Em Manutenção' },
        'aguardando_peca': { classe: 'status-manutencao', texto: '⏳ Aguardando Peça' },
        'aguardando_teste': { classe: 'status-manutencao', texto: '🧪 Aguardando Teste' },
        'enviado_bh': { classe: 'status-enviado-bh', texto: '🚚 Enviado para BH' },
        'finalizada': { classe: 'status-finalizada', texto: '✅ Finalizada' }
    };
    
    const statusAtual = statusInfo[os.status] || { classe: 'status-aberta', texto: os.status };
    
    // Prioridade
    const prioridadeInfo = {
        'baixa': '🟢 Baixa',
        'media': '🟡 Média',
        'alta': '🟠 Alta',
        'urgente': '🔴 Urgente'
    };
    
    // Histórico
    let historicoHTML = '';
    if (os.historico && os.historico.length > 0) {
        historicoHTML = os.historico.map(h => {
            const dataHist = new Date(h.data);
            return `
                <div style="padding: 0.8rem; background: #f8f9fa; border-left: 3px solid var(--primary-color); margin-bottom: 0.5rem; border-radius: 3px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;">
                        <strong>${h.acao}</strong>
                        <span style="color: #666; font-size: 0.85rem;">${dataHist.toLocaleString('pt-BR')}</span>
                    </div>
                    <div style="color: #666; font-size: 0.9rem;">${h.usuario}</div>
                    ${h.comentario ? `<div style="margin-top: 0.5rem; color: #333;">${h.comentario}</div>` : ''}
                </div>
            `;
        }).join('');
    } else {
        historicoHTML = '<p style="color: #666;">Nenhum histórico disponível</p>';
    }
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <h2>🔍 Detalhes da Ordem de Serviço</h2>
                <button onclick="fecharModal()" class="btn-close">✕</button>
            </div>
            
            <div class="modal-body">
                <!-- Número e Status -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding: 1rem; background: var(--light-bg); border-radius: 8px;">
                    <div>
                        <h3 style="color: var(--primary-color); margin-bottom: 0.5rem;">${os.numero}</h3>
                        <p style="color: #666; margin: 0;">Aberta em: ${dataAbertura}</p>
                    </div>
                    <span class="status-badge ${statusAtual.classe}" style="font-size: 1rem; padding: 0.75rem 1.5rem;">${statusAtual.texto}</span>
                </div>
                
                <!-- Equipamento -->
                <div class="info-section">
                    <h3>📦 Equipamento</h3>
                    <div class="info-grid">
                        <div><strong>Tipo:</strong> ${tipoEquipamento[os.tipo_equipamento] || os.tipo_equipamento}</div>
                        <div><strong>Patrimônio:</strong> ${os.patrimonio}</div>
                        <div><strong>Série:</strong> ${os.numero_serie}</div>
                        <div><strong>Marca:</strong> ${os.marca || '-'}</div>
                        <div><strong>Modelo:</strong> ${os.modelo || '-'}</div>
                    </div>
                </div>
                
                <!-- Solicitante -->
                <div class="info-section">
                    <h3>👤 Solicitante</h3>
                    <div class="info-grid">
                        <div><strong>Nome:</strong> ${os.solicitante?.nome || '-'}</div>
                        <div><strong>Tipo:</strong> ${os.solicitante?.tipo === 'militar' ? '👮 Militar' : '👤 Civil'}</div>
                        ${os.solicitante?.numero_policia ? `<div><strong>Nº Polícia:</strong> ${os.solicitante.numero_policia}</div>` : ''}
                        ${os.solicitante?.cpf ? `<div><strong>CPF:</strong> ${os.solicitante.cpf}</div>` : ''}
                        ${os.solicitante?.unidade ? `<div><strong>Unidade:</strong> ${os.solicitante.unidade}</div>` : ''}
                        ${os.solicitante?.orgao ? `<div><strong>Órgão:</strong> ${os.solicitante.orgao}</div>` : ''}
                        <div><strong>Telefone:</strong> ${os.solicitante?.telefone || '-'}</div>
                    </div>
                </div>
                
                <!-- Problema -->
                <div class="info-section">
                    <h3>🔧 Problema Relatado</h3>
                    <p style="white-space: pre-wrap; background: #f8f9fa; padding: 1rem; border-radius: 5px;">${os.defeito}</p>
                    ${os.observacoes ? `
                        <div style="margin-top: 1rem;">
                            <strong>Observações:</strong>
                            <p style="white-space: pre-wrap; background: #f8f9fa; padding: 1rem; border-radius: 5px; margin-top: 0.5rem;">${os.observacoes}</p>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Informações Adicionais -->
                <div class="info-section">
                    <h3>ℹ️ Informações Adicionais</h3>
                    <div class="info-grid">
                        <div><strong>Prioridade:</strong> ${prioridadeInfo[os.prioridade] || os.prioridade}</div>
                        <div><strong>Técnico:</strong> ${os.tecnico_responsavel || 'Não atribuído'}</div>
                        <div><strong>Prazo:</strong> ${os.prazo_estimado ? `${os.prazo_estimado} dias` : 'Não definido'}</div>
                        <div><strong>Criado por:</strong> ${os.criado_por || '-'}</div>
                        ${os.data_finalizacao ? `<div><strong>Finalizada em:</strong> ${dataFinalizacao}</div>` : ''}
                        ${os.solucao ? `<div style="grid-column: 1 / -1;"><strong>Solução:</strong><br>${os.solucao}</div>` : ''}
                    </div>
                </div>
                
                <!-- Histórico -->
                <div class="info-section">
                    <h3>📜 Histórico</h3>
                    ${historicoHTML}
                </div>
            </div>
            
            <div class="modal-footer">
                <button onclick="fecharModal()" class="btn-secondary">Fechar</button>
                <button onclick="editarOS('${os.id}')" class="btn-primary">✏️ Editar</button>
                <button onclick="imprimirModalDetalhes()" class="btn-primary">🖨️ Imprimir</button>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Fechar modal
function fecharModal() {
    const modal = document.getElementById('modalDetalhes');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Imprimir modal
function imprimirModalDetalhes() {
    window.print();
}

// Editar OS
function editarOS(id) {
    // Salvar ID no sessionStorage e redirecionar
    sessionStorage.setItem('editarOSId', id);
    window.location.href = 'pages/editar-os.html';
}

// Imprimir OS
async function imprimirOS(id) {
    await verDetalhesOS(id);
    setTimeout(() => {
        window.print();
    }, 500);
}

// Excluir OS
async function excluirOS(id, numero) {
    if (!confirm(`Tem certeza que deseja excluir a OS ${numero}?\n\nEsta ação não pode ser desfeita!`)) {
        return;
    }
    
    try {
        mostrarLoading('Excluindo OS...');
        
        await ordensServicoRef.doc(id).delete();
        
        ocultarLoading();
        mostrarSucesso('OS excluída com sucesso!');
        
        // Recarregar dashboard
        await carregarDashboard();
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao excluir OS:', error);
        mostrarErro('Erro ao excluir OS: ' + error.message);
    }
}

// Buscar OS em tempo real
function buscarOSTempoReal(termo) {
    const items = document.querySelectorAll('.os-item');
    
    items.forEach(item => {
        const texto = item.textContent.toLowerCase();
        const corresponde = texto.includes(termo.toLowerCase());
        
        item.style.display = corresponde ? 'grid' : 'none';
    });
}

// ==========================================
// GRÁFICOS DO DASHBOARD
// ==========================================

let chartTiposInstance = null;
let chartStatusInstance = null;

function criarGraficoEquipamentos(osArray) {
    const ctx = document.getElementById('chartTipos');
    if (!ctx) return;
    
    // Contar equipamentos por tipo
    const tiposCount = {};
    osArray.forEach(os => {
        const tipo = os.tipo_equipamento || os.tipo_servico || 'Outro';
        tiposCount[tipo] = (tiposCount[tipo] || 0) + 1;
    });
    
    // Ordenar e pegar top 5
    const tiposOrdenados = Object.entries(tiposCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    const labels = tiposOrdenados.map(([tipo]) => tipo);
    const dados = tiposOrdenados.map(([, count]) => count);
    
    // Destruir gráfico anterior se existir
    if (chartTiposInstance) {
        chartTiposInstance.destroy();
    }
    
    // Criar novo gráfico
    chartTiposInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dados,
                backgroundColor: [
                    '#007bff',
                    '#28a745',
                    '#ffc107',
                    '#dc3545',
                    '#6c757d'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function criarGraficoStatus(osArray) {
    const ctx = document.getElementById('chartStatus');
    if (!ctx) return;
    
    // Contar OS por status
    const statusMap = {
        'aberta': 'Abertas',
        'em_manutencao': 'Em Manutenção',
        'aguardando_pecas': 'Aguardando Peças',
        'enviado_bh': 'Enviado BH',
        'finalizada': 'Finalizadas'
    };
    
    const statusCount = {
        'Abertas': 0,
        'Em Manutenção': 0,
        'Aguardando Peças': 0,
        'Enviado BH': 0,
        'Finalizadas': 0
    };
    
    osArray.forEach(os => {
        const status = os.status || 'aberta';
        const statusLabel = statusMap[status] || 'Outras';
        if (statusCount[statusLabel] !== undefined) {
            statusCount[statusLabel]++;
        }
    });
    
    const labels = Object.keys(statusCount);
    const dados = Object.values(statusCount);
    
    // Destruir gráfico anterior se existir
    if (chartStatusInstance) {
        chartStatusInstance.destroy();
    }
    
    // Criar novo gráfico
    chartStatusInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantidade de OS',
                data: dados,
                backgroundColor: [
                    '#007bff',
                    '#ffc107',
                    '#fd7e14',
                    '#17a2b8',
                    '#28a745'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} OS`;
                        }
                    }
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

console.log('✅ App principal carregado!');
