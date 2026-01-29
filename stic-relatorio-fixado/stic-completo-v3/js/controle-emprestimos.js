// ====================================
// CONTROLE DE EMPRÉSTIMOS DE MATERIAL
// ====================================

let todosEmprestimos = [];
let filtroAtual = 'todos';

// Carregar empréstimos
async function carregarEmprestimos() {
    try {
        mostrarLoading('Carregando empréstimos...');
        
        const snapshot = await saidasRef
            .where('tipo_saida', '==', 'emprestimo')
            .where('status', '==', 'emprestado')
            .get();
        
        todosEmprestimos = [];
        snapshot.forEach(doc => {
            todosEmprestimos.push({ id: doc.id, ...doc.data() });
        });
        
        atualizarEstatisticas();
        renderizarEmprestimos();
        carregarHistorico();
        
        ocultarLoading();
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao carregar empréstimos:', error);
        mostrarErro('Erro ao carregar dados');
    }
}

// Atualizar estatísticas
function atualizarEstatisticas() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const noPrazo = todosEmprestimos.filter(emp => {
        const prazo = new Date(emp.prazo_retorno);
        return prazo >= hoje;
    }).length;
    
    const atrasado = todosEmprestimos.length - noPrazo;
    
    document.getElementById('totalEmprestimos').textContent = todosEmprestimos.length;
    document.getElementById('totalNoPrazo').textContent = noPrazo;
    document.getElementById('totalAtrasado').textContent = atrasado;
}

// Filtrar por status
function filtrarPorStatus(status) {
    filtroAtual = status;
    
    // Atualizar botões
    document.querySelectorAll('.btn-secondary').forEach(btn => {
        btn.style.background = '';
        btn.style.borderColor = '';
    });
    
    if (status === 'todos') {
        document.getElementById('btnTodos').style.background = '#2196f3';
        document.getElementById('btnTodos').style.borderColor = '#2196f3';
        document.getElementById('btnTodos').style.color = 'white';
    } else if (status === 'no_prazo') {
        document.getElementById('btnNoPrazo').style.background = '#388e3c';
        document.getElementById('btnNoPrazo').style.borderColor = '#388e3c';
        document.getElementById('btnNoPrazo').style.color = 'white';
    } else if (status === 'atrasado') {
        document.getElementById('btnAtrasado').style.background = '#d32f2f';
        document.getElementById('btnAtrasado').style.borderColor = '#d32f2f';
        document.getElementById('btnAtrasado').style.color = 'white';
    }
    
    renderizarEmprestimos();
}

// Renderizar tabela
function renderizarEmprestimos() {
    const tbody = document.getElementById('tabelaEmprestimos');
    tbody.innerHTML = '';
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Filtrar
    let emprestimosFiltrados = todosEmprestimos;
    
    if (filtroAtual === 'no_prazo') {
        emprestimosFiltrados = todosEmprestimos.filter(emp => {
            const prazo = new Date(emp.prazo_retorno);
            return prazo >= hoje;
        });
    } else if (filtroAtual === 'atrasado') {
        emprestimosFiltrados = todosEmprestimos.filter(emp => {
            const prazo = new Date(emp.prazo_retorno);
            return prazo < hoje;
        });
    }
    
    if (emprestimosFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #666;">
                    ${filtroAtual === 'todos' ? 
                        'Nenhum material emprestado no momento' : 
                        `Nenhum material ${filtroAtual === 'no_prazo' ? 'no prazo' : 'atrasado'}`
                    }
                </td>
            </tr>
        `;
        return;
    }
    
    // Ordenar por prazo (atrasados primeiro)
    emprestimosFiltrados.sort((a, b) => {
        return new Date(a.prazo_retorno) - new Date(b.prazo_retorno);
    });
    
    emprestimosFiltrados.forEach(emp => {
        const prazo = new Date(emp.prazo_retorno);
        const atrasado = prazo < hoje;
        const diasAtraso = atrasado ? Math.floor((hoje - prazo) / (1000 * 60 * 60 * 24)) : 0;
        
        const tr = document.createElement('tr');
        if (atrasado) tr.style.background = '#ffebee';
        
        tr.innerHTML = `
            <td><strong>${emp.patrimonio || 'N/A'}</strong></td>
            <td>${formatarTipoMaterial(emp.tipo_material)}</td>
            <td>
                <strong>${emp.militar_recebedor || emp.recebedor?.nome || 'N/A'}</strong><br>
                <small>${emp.numero_recebedor || emp.recebedor?.numero_policia || 'N/A'}</small>
            </td>
            <td><small>${emp.recebedor?.unidade || 'N/A'}</small></td>
            <td>${formatarData(emp.data_saida)}</td>
            <td>${formatarData(emp.prazo_retorno)}</td>
            <td>
                ${atrasado ? 
                    `<span style="color: #d32f2f; font-weight: bold;">⚠️ ${diasAtraso} dia${diasAtraso !== 1 ? 's' : ''} atrasado</span>` : 
                    '<span style="color: #388e3c;">✅ No Prazo</span>'
                }
            </td>
            <td>
                <button onclick="registrarDevolucao('${emp.id}')" 
                        class="btn-primary" style="white-space: nowrap;">
                    ✅ Registrar Devolução
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// Registrar devolução
async function registrarDevolucao(saidaId) {
    try {
        // Buscar dados da saída
        const doc = await saidasRef.doc(saidaId).get();
        if (!doc.exists) {
            mostrarErro('Saída não encontrada!');
            return;
        }
        
        const saida = doc.data();
        
        // Criar modal de devolução
        const modal = `
            <div id="modalDevolucao" style="
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.7); display: flex;
                align-items: center; justify-content: center; z-index: 9999;
                padding: 1rem;">
                <div style="background: white; padding: 2rem; border-radius: 10px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
                    <h2 style="margin-bottom: 1.5rem;">✅ Registrar Devolução</h2>
                    
                    <div style="background: #f5f5f5; padding: 1rem; border-radius: 5px; margin-bottom: 1.5rem;">
                        <p style="margin: 0.5rem 0;"><strong>Patrimônio:</strong> ${saida.patrimonio || 'N/A'}</p>
                        <p style="margin: 0.5rem 0;"><strong>Tipo:</strong> ${formatarTipoMaterial(saida.tipo_material)}</p>
                        <p style="margin: 0.5rem 0;"><strong>Recebedor:</strong> ${saida.militar_recebedor || saida.recebedor?.nome || 'N/A'}</p>
                        <p style="margin: 0.5rem 0;"><strong>Número PM:</strong> ${saida.numero_recebedor || saida.recebedor?.numero_policia || 'N/A'}</p>
                        <p style="margin: 0.5rem 0;"><strong>Data Saída:</strong> ${formatarData(saida.data_saida)}</p>
                        <p style="margin: 0.5rem 0;"><strong>Prazo:</strong> ${formatarData(saida.prazo_retorno)}</p>
                    </div>
                    
                    <div style="margin: 1rem 0;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Estado do Material:</label>
                        <select id="estadoDevolucao" style="width: 100%; padding: 0.7rem; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem;">
                            <option value="perfeito">✅ Perfeito Estado</option>
                            <option value="bom">👍 Bom Estado</option>
                            <option value="regular">⚠️ Estado Regular</option>
                            <option value="com_defeito">🔧 Com Defeito</option>
                            <option value="danificado">❌ Danificado</option>
                        </select>
                    </div>
                    
                    <div style="margin: 1rem 0;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Observações:</label>
                        <textarea id="observacoesDevolucao" rows="4" 
                                  style="width: 100%; padding: 0.7rem; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem; resize: vertical;"
                                  placeholder="Descreva o estado do material, se houve algum problema durante o empréstimo, etc..."></textarea>
                    </div>
                    
                    <div style="margin: 1.5rem 0; padding: 1rem; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 5px;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" id="confirmarRecebimento" style="width: 20px; height: 20px;">
                            <strong>Confirmo que recebi o material de volta em mãos</strong>
                        </label>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button onclick="fecharModal()" class="btn-secondary" style="flex: 1; padding: 0.8rem;">
                            ❌ Cancelar
                        </button>
                        <button onclick="confirmarDevolucao('${saidaId}')" 
                                class="btn-primary" style="flex: 1; padding: 0.8rem;">
                            ✅ Confirmar Devolução
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modal);
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao abrir formulário de devolução');
    }
}

// Confirmar devolução
async function confirmarDevolucao(saidaId) {
    const confirmado = document.getElementById('confirmarRecebimento').checked;
    
    if (!confirmado) {
        alert('❌ Você precisa confirmar o recebimento marcando a caixa!');
        return;
    }
    
    const estado = document.getElementById('estadoDevolucao').value;
    const obs = document.getElementById('observacoesDevolucao').value;
    
    if (!obs || obs.trim().length < 10) {
        alert('❌ Por favor, descreva o estado do material com mais detalhes (mínimo 10 caracteres).');
        return;
    }
    
    try {
        mostrarLoading('Registrando devolução...');
        
        const usuarioNome = sessionStorage.getItem('stic_usuario_nome') || 'Sistema';
        const usuarioNumero = sessionStorage.getItem('stic_usuario_numero') || '';
        
        // Buscar dados completos da saída
        const doc = await saidasRef.doc(saidaId).get();
        const saidaData = doc.data();
        
        // Calcular dias emprestado
        const dataSaida = new Date(saidaData.data_saida);
        const dataHoje = new Date();
        const diasEmprestado = Math.floor((dataHoje - dataSaida) / (1000 * 60 * 60 * 24));
        
        // Atualizar saída
        await saidasRef.doc(saidaId).update({
            status: 'devolvido',
            data_devolucao: new Date().toISOString().split('T')[0],
            hora_devolucao: new Date().toTimeString().slice(0, 5),
            estado_devolucao: estado,
            observacoes_devolucao: obs,
            dias_emprestado: diasEmprestado,
            recebido_por: {
                nome: usuarioNome,
                numero_policia: usuarioNumero
            },
            timestamp_devolucao: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Registrar log
        if (typeof logDevolucao === 'function') {
            await logDevolucao(saidaData.patrimonio, {
                estado: estado,
                observacoes: obs,
                dias_emprestado: diasEmprestado,
                recebedor: saidaData.militar_recebedor || saidaData.recebedor?.nome
            });
        }
        
        console.log('✅ Devolução registrada');
        
        ocultarLoading();
        fecharModal();
        mostrarSucesso('✅ Devolução registrada com sucesso!');
        
        // Recarregar
        setTimeout(() => {
            carregarEmprestimos();
        }, 1000);
        
    } catch (error) {
        ocultarLoading();
        console.error('❌ Erro:', error);
        mostrarErro('Erro ao registrar devolução: ' + error.message);
    }
}

// Carregar histórico de devoluções
async function carregarHistorico() {
    try {
        const snapshot = await saidasRef
            .where('tipo_saida', '==', 'emprestimo')
            .where('status', '==', 'devolvido')
            .orderBy('timestamp_devolucao', 'desc')
            .limit(10)
            .get();
        
        const historico = [];
        snapshot.forEach(doc => {
            historico.push({ id: doc.id, ...doc.data() });
        });
        
        renderizarHistorico(historico);
        
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
    }
}

// Renderizar histórico
function renderizarHistorico(historico) {
    const tbody = document.getElementById('tabelaHistorico');
    tbody.innerHTML = '';
    
    if (historico.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem; color: #666;">
                    Nenhuma devolução recente
                </td>
            </tr>
        `;
        return;
    }
    
    historico.forEach(item => {
        const estadoIcons = {
            'perfeito': '✅',
            'bom': '👍',
            'regular': '⚠️',
            'com_defeito': '🔧',
            'danificado': '❌'
        };
        
        const estadoTexto = {
            'perfeito': 'Perfeito',
            'bom': 'Bom',
            'regular': 'Regular',
            'com_defeito': 'Com Defeito',
            'danificado': 'Danificado'
        };
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.patrimonio || 'N/A'}</strong></td>
            <td>
                <strong>${item.militar_recebedor || item.recebedor?.nome || 'N/A'}</strong><br>
                <small>${item.numero_recebedor || item.recebedor?.numero_policia || 'N/A'}</small>
            </td>
            <td>${formatarData(item.data_devolucao)}</td>
            <td>
                ${estadoIcons[item.estado_devolucao] || ''} 
                ${estadoTexto[item.estado_devolucao] || item.estado_devolucao}
                ${item.observacoes_devolucao ? `<br><small style="color: #666;">${item.observacoes_devolucao.substring(0, 50)}...</small>` : ''}
            </td>
            <td>${item.dias_emprestado || 0} dias</td>
        `;
        tbody.appendChild(tr);
    });
}

// Formatar tipo de material
function formatarTipoMaterial(tipo) {
    const tipos = {
        'radio': '📻 Rádio',
        'ht': '📡 HT',
        'computador': '🖥️ Computador',
        'notebook': '💻 Notebook',
        'impressora': '🖨️ Impressora'
    };
    return tipos[tipo] || tipo || 'N/A';
}

// Fechar modal
function fecharModal() {
    document.getElementById('modalDevolucao')?.remove();
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    carregarEmprestimos();
    filtrarPorStatus('todos');
});

console.log('✅ Controle de empréstimos carregado');
