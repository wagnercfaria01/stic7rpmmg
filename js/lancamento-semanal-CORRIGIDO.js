// ============================================
// LANÇAMENTO SEMANAL - VERSÃO CORRIGIDA v3.0
// STIC 7ª RPM - PMMG
// Com lógica correta de 7 dias + sexta-feira
// ============================================

let horasSemanais = [];
let horasFiltradasGlobal = [];

// ============================================
// DETERMINAR STATUS COM LÓGICA CORRIGIDA
// ============================================

function determinarStatus(hora) {
    // Se já foi lançado no CAD2, retorna "lancado"
    if (hora.lancado_cad2) {
        return 'lancado';
    }
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataHora = new Date(hora.data);
    dataHora.setHours(0, 0, 0, 0);
    
    // ✅ REGRA 1: Adicionar 7 dias à data da hora extra
    const dataApos7Dias = new Date(dataHora);
    dataApos7Dias.setDate(dataApos7Dias.getDate() + 7);
    dataApos7Dias.setHours(0, 0, 0, 0);
    
    // ✅ REGRA 2: Encontrar a PRIMEIRA SEXTA-FEIRA após os 7 dias
    const proximaSexta = new Date(dataApos7Dias);
    const diaSemana = proximaSexta.getDay(); // 0=domingo, 5=sexta, 6=sábado
    
    // Se for sexta-feira (5), usa essa mesma sexta
    // Se for antes de sexta (0-4), avança até a próxima sexta
    // Se for sábado (6), avança 6 dias para a próxima sexta
    if (diaSemana === 5) {
        // Já é sexta, mantém a data
    } else if (diaSemana < 5) {
        // Avança até a próxima sexta (5 - diaSemana)
        proximaSexta.setDate(proximaSexta.getDate() + (5 - diaSemana));
    } else {
        // É sábado (6), avança 6 dias para a próxima sexta
        proximaSexta.setDate(proximaSexta.getDate() + 6);
    }
    
    proximaSexta.setHours(23, 59, 59, 999);
    
    // Guardar a data limite no objeto para exibição
    hora.data_limite_lancamento = proximaSexta;
    hora.data_prevista_lancamento = proximaSexta.toISOString().split('T')[0];
    
    // ✅ REGRA 3: Determinar status
    
    // 1. Se ainda não passaram 7 dias
    if (hoje < dataApos7Dias) {
        const diasRestantes = Math.ceil((dataApos7Dias - hoje) / (1000 * 60 * 60 * 24));
        hora.dias_ate_poder_lancar = diasRestantes;
        return 'aguardando_7_dias';
    }
    
    // 2. Já passaram 7 dias, mas ainda não chegou a sexta-feira
    if (hoje < proximaSexta) {
        const diasAteSexta = Math.ceil((proximaSexta - hoje) / (1000 * 60 * 60 * 24));
        hora.dias_ate_sexta = diasAteSexta;
        
        // Se hoje É sexta-feira, pode lançar!
        if (hoje.getDay() === 5) {
            return 'pode_lancar_hoje';
        }
        
        return 'aguardando_sexta';
    }
    
    // 3. Já passou a sexta-feira = ATRASADO!
    if (hoje > proximaSexta) {
        const diasAtraso = Math.ceil((hoje - proximaSexta) / (1000 * 60 * 60 * 24));
        hora.dias_atraso = diasAtraso;
        return 'atrasado';
    }
    
    // 4. É exatamente a sexta-feira hoje
    if (hoje.getDay() === 5 && hoje.toDateString() === proximaSexta.toDateString()) {
        return 'pode_lancar_hoje';
    }
    
    return 'pendente';
}

// ============================================
// CARREGAR HORAS DA SEMANA
// ============================================

async function carregarHorasSemanais() {
    try {
        const periodo = document.getElementById('filtroPeriodo').value;
        const hoje = new Date();
        let dataInicio;
        
        // Calcular data início baseado no período
        switch(periodo) {
            case 'esta_semana':
                dataInicio = new Date(hoje);
                dataInicio.setDate(hoje.getDate() - hoje.getDay());
                break;
            case 'ultimas_2':
                dataInicio = new Date(hoje);
                dataInicio.setDate(hoje.getDate() - 14);
                break;
            case 'este_mes':
                dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                break;
            case 'ultimos_30':
                dataInicio = new Date(hoje);
                dataInicio.setDate(hoje.getDate() - 30);
                break;
        }
        
        dataInicio.setHours(0, 0, 0, 0);
        
        // Buscar do Firebase
        const snapshot = await firebase.firestore()
            .collection('horas_extras')
            .where('data', '>=', dataInicio.toISOString().split('T')[0])
            .orderBy('data', 'desc')
            .get();
        
        horasSemanais = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            horasSemanais.push({
                id: doc.id,
                ...data
            });
        });
        
        // Atualizar período exibido
        atualizarPeriodoExibido(dataInicio, hoje);
        
        // Carregar militares no filtro
        carregarMilitaresFiltro();
        
        // Aplicar filtros e renderizar
        aplicarFiltros();
        
    } catch (error) {
        console.error('Erro ao carregar horas:', error);
        mostrarNotificacao('Erro ao carregar horas: ' + error.message, 'erro');
    }
}

function atualizarPeriodoExibido(inicio, fim) {
    const inicioStr = inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const fimStr = fim.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const elementoPeriodo = document.getElementById('periodo-semana');
    if (elementoPeriodo) {
        elementoPeriodo.textContent = `📅 Período: ${inicioStr} a ${fimStr}`;
    }
}

function carregarMilitaresFiltro() {
    const select = document.getElementById('filtroMilitar');
    if (!select) return;
    
    const militaresUnicos = [...new Set(horasSemanais.map(h => h.militar_nome))].sort();
    
    select.innerHTML = '<option value="">👥 Todos militares</option>';
    
    militaresUnicos.forEach(nome => {
        const option = document.createElement('option');
        option.value = nome;
        option.textContent = nome;
        select.appendChild(option);
    });
}

// ============================================
// APLICAR FILTROS
// ============================================

function aplicarFiltros() {
    const filtroMilitar = document.getElementById('filtroMilitar')?.value || '';
    const filtroStatus = document.getElementById('filtroStatus')?.value || '';
    
    let horasFiltradas = [...horasSemanais];
    
    // Filtrar por militar
    if (filtroMilitar) {
        horasFiltradas = horasFiltradas.filter(h => h.militar_nome === filtroMilitar);
    }
    
    // Filtrar por status
    if (filtroStatus) {
        horasFiltradas = horasFiltradas.filter(h => {
            const status = determinarStatus(h);
            return status === filtroStatus;
        });
    }
    
    horasFiltradasGlobal = horasFiltradas;
    
    renderizarTabela(horasFiltradas);
    atualizarEstatisticas();
}

// ============================================
// RENDERIZAR TABELA
// ============================================

function renderizarTabela(dados) {
    const tbody = document.getElementById('corpoTabelaLancamento');
    if (!tbody) return;
    
    if (dados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
                    📭 Nenhuma hora extra encontrada para os filtros selecionados
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    dados.forEach(hora => {
        const status = determinarStatus(hora);
        const tr = document.createElement('tr');
        tr.className = 'linha-hora';
        
        // Badge de status
        const badgeInfo = obterBadgeStatus(status, hora);
        
        // Data formatada
        const dataFormatada = new Date(hora.data).toLocaleDateString('pt-BR');
        
        // Data de lançamento formatada
        const dataLancamento = hora.data_limite_lancamento 
            ? new Date(hora.data_limite_lancamento).toLocaleDateString('pt-BR')
            : 'Calculando...';
        
        tr.innerHTML = `
            <td>
                <span class="status-badge badge-${status}">
                    ${badgeInfo.icon} ${badgeInfo.texto}
                </span>
            </td>
            <td>
                <strong>${hora.militar_nome || 'N/A'}</strong><br>
                <small style="color: #666;">${hora.militar_pm || ''}</small>
            </td>
            <td>${dataFormatada}</td>
            <td><strong>${hora.horas || 'N/A'}</strong></td>
            <td>
                <strong>${dataLancamento}</strong><br>
                <small style="color: #666;">${badgeInfo.info}</small>
            </td>
            <td class="motivo-resumido" title="${hora.motivo || 'N/A'}">
                ${(hora.motivo || 'N/A').substring(0, 50)}${(hora.motivo?.length > 50 ? '...' : '')}
            </td>
            <td>
                ${status === 'lancado' 
                    ? `<span style="color: #4caf50;">✅ Lançado</span>` 
                    : `
                        <button onclick="marcarComoLancado('${hora.id}')" 
                                class="btn-lancar ${status === 'pode_lancar_hoje' ? 'btn-lancar-destaque' : ''}"
                                ${status === 'aguardando_7_dias' || status === 'aguardando_sexta' ? 'disabled' : ''}>
                            ${status === 'pode_lancar_hoje' ? '🚀 Lançar Agora!' : 
                              status === 'atrasado' ? '⚠️ Lançar (Atrasado)' : 
                              '⏳ Aguardando'}
                        </button>
                    `}
                <button onclick="expandirDetalhes(this)" class="btn-detalhes">
                    📋 Detalhes
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

function obterBadgeStatus(status, hora) {
    switch(status) {
        case 'aguardando_7_dias':
            return {
                icon: '⏳',
                texto: 'Aguardando 7 dias',
                info: `Faltam ${hora.dias_ate_poder_lancar} dias`
            };
        case 'aguardando_sexta':
            return {
                icon: '📅',
                texto: 'Aguardando sexta',
                info: `Próxima sexta em ${hora.dias_ate_sexta} dias`
            };
        case 'pode_lancar_hoje':
            return {
                icon: '🚀',
                texto: 'LANÇAR HOJE!',
                info: 'Hoje é sexta-feira!'
            };
        case 'atrasado':
            return {
                icon: '❌',
                texto: 'ATRASADO',
                info: `${hora.dias_atraso} dias de atraso`
            };
        case 'lancado':
            return {
                icon: '✅',
                texto: 'Lançado',
                info: hora.data_lancamento_cad2 || 'Concluído'
            };
        default:
            return {
                icon: '📌',
                texto: 'Pendente',
                info: 'Verificar status'
            };
    }
}

// ============================================
// MARCAR COMO LANÇADO
// ============================================

async function marcarComoLancado(horaId) {
    if (!confirm('Confirma que esta hora extra foi lançada no CAD 2?')) {
        return;
    }
    
    try {
        const usuarioAtual = firebase.auth().currentUser;
        const hoje = new Date().toISOString().split('T')[0];
        
        await firebase.firestore()
            .collection('horas_extras')
            .doc(horaId)
            .update({
                lancado_cad2: true,
                data_lancamento_cad2: hoje,
                lancado_por: usuarioAtual?.email || 'Usuário',
                timestamp_lancamento: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        mostrarNotificacao('✅ Hora extra marcada como lançada no CAD 2!', 'sucesso');
        
        // Recarregar dados
        await carregarHorasSemanais();
        
    } catch (error) {
        console.error('Erro ao marcar como lançado:', error);
        mostrarNotificacao('❌ Erro ao marcar como lançado: ' + error.message, 'erro');
    }
}

// ============================================
// EXPANDIR DETALHES
// ============================================

function expandirDetalhes(botao) {
    const tr = botao.closest('tr');
    const proximoTr = tr.nextElementSibling;
    
    // Se já existe uma linha expandida, remove
    if (proximoTr && proximoTr.classList.contains('linha-expandida')) {
        proximoTr.remove();
        return;
    }
    
    // Pega os dados da hora
    const index = Array.from(tr.parentNode.children).indexOf(tr);
    const hora = horasFiltradasGlobal[index];
    
    const trExpand = document.createElement('tr');
    trExpand.className = 'linha-expandida';
    trExpand.innerHTML = `
        <td colspan="7">
            <div class="detalhes-expandidos">
                <div class="detalhes-grid">
                    <div class="detalhe-item">
                        <strong>📋 Motivo Completo:</strong>
                        <p>${hora.motivo || 'Não informado'}</p>
                    </div>
                    
                    <div class="detalhe-item">
                        <strong>🏷️ Tipo de Hora:</strong>
                        <p>${hora.tipo_hora || 'Não especificado'}</p>
                    </div>
                    
                    ${hora.responsavel ? `
                        <div class="detalhe-item">
                            <strong>👤 Responsável:</strong>
                            <p>${hora.responsavel}</p>
                        </div>
                    ` : ''}
                    
                    ${hora.lancado_cad2 ? `
                        <div class="detalhe-item status-lancado">
                            <strong>✅ Informações do Lançamento:</strong>
                            <p>Lançado em: ${hora.data_lancamento_cad2 || 'N/A'}</p>
                            <p>Lançado por: ${hora.lancado_por || 'N/A'}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        </td>
    `;
    
    tr.parentNode.insertBefore(trExpand, tr.nextSibling);
}

// ============================================
// ATUALIZAR ESTATÍSTICAS
// ============================================

function atualizarEstatisticas() {
    let aguardando7Dias = 0;
    let aguardandoSexta = 0;
    let podeLancarHoje = 0;
    let atrasados = 0;
    let lancados = 0;
    
    horasFiltradasGlobal.forEach(hora => {
        const status = determinarStatus(hora);
        switch(status) {
            case 'aguardando_7_dias': aguardando7Dias++; break;
            case 'aguardando_sexta': aguardandoSexta++; break;
            case 'pode_lancar_hoje': podeLancarHoje++; break;
            case 'atrasado': atrasados++; break;
            case 'lancado': lancados++; break;
        }
    });
    
    // Atualizar elementos do cabeçalho
    const elPendentes = document.getElementById('stat-pendentes');
    const elAtrasados = document.getElementById('stat-atrasados');
    const elLancados = document.getElementById('stat-lancados');
    
    if (elPendentes) elPendentes.textContent = aguardando7Dias + aguardandoSexta + podeLancarHoje;
    if (elAtrasados) elAtrasados.textContent = atrasados;
    if (elLancados) elLancados.textContent = lancados;
    
    // Criar/atualizar painel de resumo detalhado
    atualizarPainelResumo(aguardando7Dias, aguardandoSexta, podeLancarHoje, atrasados, lancados);
}

function atualizarPainelResumo(aguardando7Dias, aguardandoSexta, podeLancarHoje, atrasados, lancados) {
    let painel = document.getElementById('painel-resumo-lancamento');
    
    if (!painel) {
        painel = document.createElement('div');
        painel.id = 'painel-resumo-lancamento';
        painel.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:15px;margin:20px 0;';
        
        const tabelaWrapper = document.querySelector('.tabela-wrapper');
        if (tabelaWrapper) {
            tabelaWrapper.parentNode.insertBefore(painel, tabelaWrapper);
        }
    }
    
    const total = aguardando7Dias + aguardandoSexta + podeLancarHoje + atrasados + lancados;
    
    painel.innerHTML = `
        <div class="card-stat card-aguardando-7">
            <div class="card-numero">${aguardando7Dias}</div>
            <div class="card-label">⏳ Aguardando 7 dias</div>
            <div class="card-info">Ainda não pode lançar</div>
        </div>
        
        <div class="card-stat card-aguardando-sexta">
            <div class="card-numero">${aguardandoSexta}</div>
            <div class="card-label">📅 Aguardando Sexta</div>
            <div class="card-info">Já passou 7 dias</div>
        </div>
        
        <div class="card-stat card-pode-lancar ${podeLancarHoje > 0 ? 'card-destaque' : ''}">
            <div class="card-numero">${podeLancarHoje}</div>
            <div class="card-label">🚀 LANÇAR HOJE!</div>
            <div class="card-info">Hoje é sexta-feira</div>
        </div>
        
        <div class="card-stat card-atrasado">
            <div class="card-numero">${atrasados}</div>
            <div class="card-label">❌ Atrasados</div>
            <div class="card-info">Passar da sexta</div>
        </div>
        
        <div class="card-stat card-lancado">
            <div class="card-numero">${lancados}</div>
            <div class="card-label">✅ Lançados</div>
            <div class="card-info">Concluídos no CAD 2</div>
        </div>
    `;
}

// ============================================
// EXPORTAR PARA EXCEL
// ============================================

function exportarParaExcel() {
    try {
        const dados = horasFiltradasGlobal.map(hora => {
            const status = determinarStatus(hora);
            const statusInfo = obterBadgeStatus(status, hora);
            
            return {
                'Status': statusInfo.texto,
                'Militar': hora.militar_nome || 'N/A',
                'Número PM': hora.militar_pm || 'N/A',
                'Data Hora Extra': hora.data || 'N/A',
                'Horas': hora.horas || 'N/A',
                'Lançar até': hora.data_prevista_lancamento || 'N/A',
                'Situação': statusInfo.info,
                'Motivo': hora.motivo || 'N/A',
                'Tipo': hora.tipo_hora || 'N/A',
                'Lançado CAD2': hora.lancado_cad2 ? 'Sim' : 'Não',
                'Data Lançamento': hora.data_lancamento_cad2 || '',
                'Lançado por': hora.lancado_por || ''
            };
        });
        
        if (dados.length === 0) {
            mostrarNotificacao('❌ Nenhum dado para exportar!', 'erro');
            return;
        }
        
        // Criar CSV
        const headers = Object.keys(dados[0]);
        const csv = [
            headers.join(','),
            ...dados.map(row => 
                headers.map(header => `"${(row[header] || '').toString().replace(/"/g, '""')}"`).join(',')
            )
        ].join('\n');
        
        // Download
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `horas_extras_CAD2_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        mostrarNotificacao('✅ Arquivo exportado com sucesso!', 'sucesso');
        
    } catch (error) {
        console.error('Erro ao exportar:', error);
        mostrarNotificacao('❌ Erro ao exportar: ' + error.message, 'erro');
    }
}

// ============================================
// NOTIFICAÇÕES
// ============================================

function mostrarNotificacao(mensagem, tipo = 'info') {
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao notificacao-${tipo}`;
    notificacao.textContent = mensagem;
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    if (tipo === 'sucesso') {
        notificacao.style.background = 'linear-gradient(135deg, #4caf50, #45a049)';
    } else if (tipo === 'erro') {
        notificacao.style.background = 'linear-gradient(135deg, #f44336, #e53935)';
    } else {
        notificacao.style.background = 'linear-gradient(135deg, #2196f3, #1976d2)';
    }
    
    document.body.appendChild(notificacao);
    
    setTimeout(() => {
        notificacao.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notificacao.remove(), 300);
    }, 3000);
}

// Adicionar CSS de animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

console.log('✅ Sistema de Lançamento Semanal CORRIGIDO v3.0 carregado!');
