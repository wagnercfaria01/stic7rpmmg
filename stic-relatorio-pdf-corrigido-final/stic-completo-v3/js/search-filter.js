// Gerenciador de Busca e Filtros

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar data de hoje nos campos de data
    const hoje = new Date().toISOString().split('T')[0];
    const dataFimInput = document.getElementById('dataFim');
    if (dataFimInput) {
        dataFimInput.value = hoje;
    }
    
    // Carregar todas as OS ao abrir
    buscarOS();
});

// Buscar OS com filtros
async function buscarOS() {
    mostrarLoading('Buscando ordens de serviço...');
    
    try {
        // Buscar todas as OS do Firebase
        const todasOS = await listarTodasOS(500);
        
        // Aplicar filtros
        const patrimonio = document.getElementById('buscarPatrimonio')?.value.trim().toLowerCase();
        const serie = document.getElementById('buscarSerie')?.value.trim().toLowerCase();
        const solicitante = document.getElementById('buscarSolicitante')?.value.trim().toLowerCase();
        const historico = document.getElementById('buscarHistorico')?.value.trim().toLowerCase();
        const tipo = document.getElementById('filtroTipo')?.value;
        const status = document.getElementById('filtroStatus')?.value;
        const prioridade = document.getElementById('filtroPrioridade')?.value;
        const dataInicio = document.getElementById('dataInicio')?.value;
        const dataFim = document.getElementById('dataFim')?.value;
        
        let resultados = todasOS;
        
        // Filtrar
        if (patrimonio) {
            resultados = resultados.filter(os => 
                os.patrimonio?.toLowerCase().includes(patrimonio)
            );
        }
        
        if (serie) {
            resultados = resultados.filter(os => 
                os.numero_serie?.toLowerCase().includes(serie)
            );
        }
        
        if (solicitante) {
            resultados = resultados.filter(os => 
                os.solicitante?.nome?.toLowerCase().includes(solicitante)
            );
        }
        
        // NOVO: Busca por histórico
        if (historico) {
            resultados = resultados.filter(os => {
                if (!os.historico || os.historico.length === 0) return false;
                
                // Buscar em todas as ações e comentários do histórico
                return os.historico.some(h => {
                    const acao = (h.acao || '').toLowerCase();
                    const comentario = (h.comentario || '').toLowerCase();
                    const usuario = (h.usuario || '').toLowerCase();
                    
                    return acao.includes(historico) || 
                           comentario.includes(historico) || 
                           usuario.includes(historico);
                });
            });
        }
        
        if (tipo) {
            resultados = resultados.filter(os => os.tipo_equipamento === tipo);
        }
        
        if (status) {
            resultados = resultados.filter(os => os.status === status);
        }
        
        if (prioridade) {
            resultados = resultados.filter(os => os.prioridade === prioridade);
        }
        
        // Filtrar por data
        if (dataInicio || dataFim) {
            resultados = resultados.filter(os => {
                if (!os.data_abertura) return false;
                
                const dataOS = os.data_abertura.toDate ? 
                    os.data_abertura.toDate() : 
                    new Date(os.data_abertura);
                const dataStr = dataOS.toISOString().split('T')[0];
                
                if (dataInicio && dataStr < dataInicio) return false;
                if (dataFim && dataStr > dataFim) return false;
                
                return true;
            });
        }
        
        // Renderizar resultados
        renderizarResultados(resultados);
        
        ocultarLoading();
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao buscar:', error);
        mostrarErro('Erro ao realizar busca: ' + error.message);
    }
}

// Renderizar resultados da busca
function renderizarResultados(resultados) {
    const container = document.getElementById('resultadosBusca');
    container.innerHTML = '';
    
    if (resultados.length === 0) {
        container.innerHTML = `
            <div style="padding: 3rem; text-align: center; color: #6c757d;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
                <h3>Nenhum resultado encontrado</h3>
                <p>Tente ajustar os filtros de busca</p>
            </div>
        `;
        atualizarContador(0);
        return;
    }
    
    resultados.forEach(os => {
        const item = criarItemResultado(os);
        container.appendChild(item);
    });
    
    atualizarContador(resultados.length);
}

// Criar item de resultado
function criarItemResultado(os) {
    const div = document.createElement('div');
    div.className = 'os-item';
    
    const statusClass = {
        'aberta': 'status-aberta',
        'em_manutencao': 'status-manutencao',
        'enviado_bh': 'status-enviado-bh',
        'finalizada': 'status-finalizada'
    };
    
    const statusTexto = {
        'aberta': 'Aberta',
        'em_manutencao': 'Em Manutenção',
        'enviado_bh': 'Enviado BH',
        'finalizada': 'Finalizada'
    };
    
    const data = os.data_abertura?.toDate ? 
        formatarData(os.data_abertura.toDate()) : 
        'Data não disponível';
    
    // Mapear tipos
    const tipoEquipamento = {
        'radio': '📻 Rádio',
        'ht': '📡 HT',
        'computador': '🖥️ Computador',
        'notebook': '💻 Notebook'
    };
    
    const tipoServico = {
        'config_rede': '🌐 Config. Rede',
        'instalacao_software': '🖥️ Instalação Software',
        'manutencao_cameras': '📹 Manutenção Câmeras',
        'instalacao_glpi': '📊 Instalação GLPI'
    };
    
    // Verificar tipo de OS
    let tipoTexto, detalhesTexto;
    
    if (os.tipo_os === 'servico') {
        tipoTexto = tipoServico[os.tipo_servico] || '🛠️ Serviço';
        detalhesTexto = (os.descricao_servico || 'Serviço').substring(0, 40) + '...';
    } else {
        tipoTexto = tipoEquipamento[os.tipo_equipamento] || os.tipo_equipamento || 'Equipamento';
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
            <small>${os.solicitante?.unidade || 'N/A'}</small>
        </div>
        <div class="os-data">${data}</div>
        <span class="status-badge ${statusClass[os.status]}">${statusTexto[os.status]}</span>
        <div class="os-actions">
            <button class="btn-icon" title="Ver detalhes" onclick="verDetalhes('${os.id}')">👁️</button>
            <button class="btn-icon" title="Editar" onclick="editarOS('${os.id}')">✏️</button>
            <button class="btn-icon" title="Imprimir" onclick="imprimirOS('${os.id}')">🖨️</button>
            <button class="btn-icon" title="Excluir" onclick="excluirOS('${os.id}', '${os.numero}')" style="color: #dc3545;">🗑️</button>
        </div>
    `;
    
    return div;
}

// Atualizar contador de resultados
function atualizarContador(total) {
    const contador = document.getElementById('totalResultados');
    if (contador) {
        const texto = total === undefined ? 
            document.querySelectorAll('.os-item').length : 
            total;
        contador.textContent = `${texto} resultado${texto !== 1 ? 's' : ''} encontrado${texto !== 1 ? 's' : ''}`;
    }
}

// Limpar filtros
function limparFiltros() {
    document.getElementById('buscarPatrimonio').value = '';
    document.getElementById('buscarSerie').value = '';
    document.getElementById('buscarSolicitante').value = '';
    const buscarHistorico = document.getElementById('buscarHistorico');
    if (buscarHistorico) buscarHistorico.value = '';
    document.getElementById('filtroTipo').value = '';
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroPrioridade').value = '';
    document.getElementById('dataInicio').value = '';
    document.getElementById('dataFim').value = '';
    
    // Recarregar todas as OS
    buscarOS();
}

// Exportar para Excel
async function exportarExcel() {
    mostrarLoading('Preparando exportação...');
    
    try {
        const resultados = [];
        const items = document.querySelectorAll('.os-item');
        
        items.forEach(item => {
            const dados = {
                'OS': item.querySelector('.os-numero').textContent,
                'Equipamento': item.querySelector('.os-equipamento strong').textContent,
                'Patrimônio/Série': item.querySelector('.os-equipamento small').textContent,
                'Solicitante': item.querySelector('.os-solicitante strong').textContent,
                'Unidade': item.querySelector('.os-solicitante small').textContent,
                'Data': item.querySelector('.os-data').textContent,
                'Status': item.querySelector('.status-badge').textContent
            };
            resultados.push(dados);
        });
        
        // Aqui você integraria com uma biblioteca como SheetJS
        console.log('Dados para exportação:', resultados);
        
        ocultarLoading();
        mostrarSucesso(`${resultados.length} registros prontos para exportação!`);
        
        // Simular download
        alert('Exportação para Excel será implementada com biblioteca SheetJS');
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao exportar:', error);
        mostrarErro('Erro ao exportar dados');
    }
}

// Filtro rápido por status
function filtrarPorStatus(status) {
    document.getElementById('filtroStatus').value = status;
    buscarOS();
}

// Ver detalhes da OS
async function verDetalhes(id) {
    try {
        mostrarLoading('Carregando detalhes...');
        
        const doc = await ordensServicoRef.doc(id).get();
        
        if (!doc.exists) {
            ocultarLoading();
            mostrarErro('OS não encontrada!');
            return;
        }
        
        const os = { id: doc.id, ...doc.data() };
        ocultarLoading();
        
        // Usar função do app.js se disponível
        if (typeof mostrarModalDetalhes === 'function') {
            mostrarModalDetalhes(os);
        } else {
            // Redirecionar para index
            sessionStorage.setItem('verOSId', id);
            window.location.href = '../index.html';
        }
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro:', error);
        mostrarErro('Erro ao carregar detalhes');
    }
}

// Editar OS
function editarOS(id) {
    sessionStorage.setItem('editarOSId', id);
    window.location.href = 'editar-os.html';
}

// Imprimir OS
async function imprimirOS(id) {
    await verDetalhes(id);
    setTimeout(() => {
        window.print();
    }, 500);
}

// Excluir OS
async function excluirOS(id, numero) {
    // Confirmar exclusão
    if (!confirm(`⚠️ ATENÇÃO!\n\nDeseja realmente EXCLUIR a OS #${numero}?\n\nEsta ação NÃO pode ser desfeita!`)) {
        return;
    }
    
    // Segunda confirmação
    if (!confirm('Última confirmação:\n\nTem certeza que deseja excluir esta OS?\n\nTodos os dados serão perdidos permanentemente.')) {
        return;
    }
    
    try {
        mostrarLoading('Excluindo OS...');
        
        // Buscar dados da OS antes de excluir (para o log)
        const doc = await ordensServicoRef.doc(id).get();
        if (!doc.exists) {
            throw new Error('OS não encontrada');
        }
        
        const dadosOS = doc.data();
        
        // Excluir OS
        await ordensServicoRef.doc(id).delete();
        
        // Registrar log de exclusão
        if (typeof logExclusao === 'function') {
            await logExclusao('os', numero, {
                patrimonio: dadosOS.patrimonio,
                tipo_equipamento: dadosOS.tipo_equipamento,
                solicitante: dadosOS.solicitante?.nome,
                status: dadosOS.status
            }, 'Exclusão manual via interface');
        }
        
        console.log('✅ OS excluída:', id);
        
        ocultarLoading();
        mostrarSucesso(`OS #${numero} excluída com sucesso!`);
        
        // Recarregar resultados após 1 segundo
        setTimeout(() => {
            buscarOS();
        }, 1000);
        
    } catch (error) {
        ocultarLoading();
        console.error('❌ Erro ao excluir OS:', error);
        mostrarErro('Erro ao excluir OS: ' + error.message);
    }
}

console.log('✅ Gerenciador de busca carregado!');
