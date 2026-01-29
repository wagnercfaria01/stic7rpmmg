// Visualizador de Logs do Sistema

let todosLogs = [];
let logsFiltrados = [];
let ultimoLog = null;
const LOGS_POR_PAGINA = 50;

document.addEventListener('DOMContentLoaded', async () => {
    await carregarLogs();
});

// Carregar logs iniciais
async function carregarLogs() {
    try {
        const logsRef = db.collection('logs_sistema');
        
        // Carregar primeiros 50 logs
        const snapshot = await logsRef
            .orderBy('timestamp', 'desc')
            .limit(LOGS_POR_PAGINA)
            .get();
        
        todosLogs = [];
        snapshot.forEach(doc => {
            todosLogs.push({ id: doc.id, ...doc.data() });
        });
        
        if (!snapshot.empty) {
            ultimoLog = snapshot.docs[snapshot.docs.length - 1];
        }
        
        // Calcular estatísticas
        await calcularEstatisticas();
        
        // Renderizar logs
        logsFiltrados = todosLogs;
        renderizarLogs();
        
        // Mostrar botão carregar mais se houver mais logs
        if (snapshot.docs.length === LOGS_POR_PAGINA) {
            document.getElementById('btnCarregarMais').style.display = 'block';
        }
        
    } catch (error) {
        console.error('Erro ao carregar logs:', error);
        document.getElementById('listaLogs').innerHTML = `
            <div class="alert alert-error">
                <strong>Erro:</strong> Não foi possível carregar os logs.
            </div>
        `;
    }
}

// Carregar mais logs
async function carregarMaisLogs() {
    if (!ultimoLog) return;
    
    try {
        const btnCarregarMais = document.getElementById('btnCarregarMais');
        btnCarregarMais.textContent = 'Carregando...';
        btnCarregarMais.disabled = true;
        
        const logsRef = db.collection('logs_sistema');
        const snapshot = await logsRef
            .orderBy('timestamp', 'desc')
            .startAfter(ultimoLog)
            .limit(LOGS_POR_PAGINA)
            .get();
        
        snapshot.forEach(doc => {
            todosLogs.push({ id: doc.id, ...doc.data() });
        });
        
        if (!snapshot.empty) {
            ultimoLog = snapshot.docs[snapshot.docs.length - 1];
        }
        
        // Aplicar filtros nos novos logs
        filtrarLogs();
        
        // Ocultar botão se não houver mais logs
        if (snapshot.docs.length < LOGS_POR_PAGINA) {
            btnCarregarMais.style.display = 'none';
        } else {
            btnCarregarMais.textContent = 'Carregar Mais Logs';
            btnCarregarMais.disabled = false;
        }
        
    } catch (error) {
        console.error('Erro ao carregar mais logs:', error);
    }
}

// Calcular estatísticas
async function calcularEstatisticas() {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const logsHoje = todosLogs.filter(log => {
        if (!log.data_hora) return false;
        const dataLog = new Date(log.data_hora);
        return dataLog >= hoje;
    });
    
    document.getElementById('totalLogsHoje').textContent = logsHoje.length;
    document.getElementById('totalLoginHoje').textContent = 
        logsHoje.filter(log => log.tipo === 'login').length;
    document.getElementById('totalEdicoes').textContent = 
        logsHoje.filter(log => log.tipo === 'edicao').length;
    document.getElementById('totalErros').textContent = 
        logsHoje.filter(log => log.tipo === 'erro').length;
}

// Filtrar logs
function filtrarLogs() {
    const tipo = document.getElementById('filtroTipo').value;
    const periodo = document.getElementById('filtroPeriodo').value;
    const busca = document.getElementById('buscaLog').value.toLowerCase();
    
    logsFiltrados = todosLogs.filter(log => {
        // Filtro por tipo
        if (tipo && log.tipo !== tipo) return false;
        
        // Filtro por período
        if (periodo !== 'todos' && log.data_hora) {
            const dataLog = new Date(log.data_hora);
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            
            if (periodo === 'hoje') {
                if (dataLog < hoje) return false;
            } else if (periodo === 'ontem') {
                const ontem = new Date(hoje);
                ontem.setDate(ontem.getDate() - 1);
                if (dataLog < ontem || dataLog >= hoje) return false;
            } else if (periodo === 'semana') {
                const inicioSemana = new Date(hoje);
                inicioSemana.setDate(inicioSemana.getDate() - hoje.getDay());
                if (dataLog < inicioSemana) return false;
            } else if (periodo === 'mes') {
                const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                if (dataLog < inicioMes) return false;
            }
        }
        
        // Filtro por busca
        if (busca) {
            const textoLog = JSON.stringify(log).toLowerCase();
            if (!textoLog.includes(busca)) return false;
        }
        
        return true;
    });
    
    renderizarLogs();
}

// Renderizar logs
function renderizarLogs() {
    const lista = document.getElementById('listaLogs');
    
    if (logsFiltrados.length === 0) {
        lista.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #666;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                <h3>Nenhum log encontrado</h3>
                <p>Ajuste os filtros ou tente outra busca</p>
            </div>
        `;
        return;
    }
    
    lista.innerHTML = '';
    
    logsFiltrados.forEach(log => {
        const item = criarItemLog(log);
        lista.appendChild(item);
    });
}

// Criar item de log
function criarItemLog(log) {
    const div = document.createElement('div');
    div.className = `log-item ${log.tipo}`;
    
    // Ícones por tipo
    const icones = {
        'login': '🔓',
        'logout': '🔒',
        'criacao': '➕',
        'edicao': '✏️',
        'status': '🔄',
        'exclusao': '🗑️',
        'visualizacao': '👁️',
        'assinatura': '✍️',
        'compartilhamento': '📤',
        'exportacao': '📥',
        'backup': '💾',
        'erro': '❌',
        'comentario': '💬',
        'ia': '🤖'
    };
    
    const icone = icones[log.tipo] || '📌';
    const usuario = log.usuario || {};
    const nomeCompleto = `${usuario.nome || 'Sistema'} ${usuario.numero_policia ? '(' + usuario.numero_policia + ')' : ''}`;
    
    // Formatar data/hora
    let horarioFormatado = 'Data desconhecida';
    if (log.data_hora) {
        const data = new Date(log.data_hora);
        horarioFormatado = formatarDataHora(data);
    }
    
    div.innerHTML = `
        <div class="log-header">
            <div>
                <span class="log-icone">${icone}</span>
                <span class="log-usuario">${nomeCompleto}</span>
            </div>
            <div class="log-horario">${horarioFormatado}</div>
        </div>
        <div class="log-acao">${log.acao}</div>
        ${criarDetalhesLog(log)}
    `;
    
    return div;
}

// Criar detalhes do log
function criarDetalhesLog(log) {
    let detalhes = [];
    
    // IP e dispositivo
    if (log.ip) {
        detalhes.push(`<strong>IP:</strong> ${log.ip}`);
    }
    
    if (log.dispositivo) {
        detalhes.push(`<strong>Dispositivo:</strong> ${log.dispositivo}`);
    }
    
    if (log.sistema_operacional) {
        detalhes.push(`<strong>SO:</strong> ${log.sistema_operacional}`);
    }
    
    // Detalhes específicos por tipo
    if (log.tipo === 'edicao') {
        if (log.campo_alterado) {
            detalhes.push(`<strong>Campo:</strong> ${log.campo_alterado}`);
        }
        if (log.valor_anterior !== undefined) {
            detalhes.push(`<strong>De:</strong> ${log.valor_anterior}`);
        }
        if (log.valor_novo !== undefined) {
            detalhes.push(`<strong>Para:</strong> ${log.valor_novo}`);
        }
    }
    
    if (log.tipo === 'status') {
        if (log.status_anterior) {
            detalhes.push(`<strong>Status anterior:</strong> ${log.status_anterior}`);
        }
        if (log.status_novo) {
            detalhes.push(`<strong>Status novo:</strong> ${log.status_novo}`);
        }
        if (log.motivo) {
            detalhes.push(`<strong>Motivo:</strong> ${log.motivo}`);
        }
    }
    
    if (log.tipo === 'exclusao' && log.motivo) {
        detalhes.push(`<strong>Motivo:</strong> ${log.motivo}`);
    }
    
    if (log.tipo === 'erro') {
        if (log.erro) {
            detalhes.push(`<strong>Erro:</strong> ${log.erro}`);
        }
        if (log.contexto) {
            detalhes.push(`<strong>Contexto:</strong> ${log.contexto}`);
        }
    }
    
    if (log.documento) {
        detalhes.push(`<strong>Documento:</strong> ${log.documento}`);
    }
    
    if (detalhes.length > 0) {
        return `<div class="log-detalhes">${detalhes.join(' | ')}</div>`;
    }
    
    return '';
}

// Formatar data/hora
function formatarDataHora(data) {
    const agora = new Date();
    const diffMs = agora - data;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
        return 'Agora mesmo';
    } else if (diffMins < 60) {
        return `Há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    } else if (diffHoras < 24) {
        return `Há ${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    } else if (diffDias === 1) {
        return `Ontem às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDias < 7) {
        return `Há ${diffDias} dias`;
    } else {
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Exportar logs para CSV
function exportarLogs() {
    if (logsFiltrados.length === 0) {
        alert('Nenhum log para exportar!');
        return;
    }
    
    // Criar CSV
    let csv = 'Data/Hora,Tipo,Usuário,Número Polícia,Ação,IP,Dispositivo,SO\n';
    
    logsFiltrados.forEach(log => {
        const usuario = log.usuario || {};
        const linha = [
            log.data_hora || '',
            log.tipo || '',
            usuario.nome || '',
            usuario.numero_policia || '',
            log.acao || '',
            log.ip || '',
            log.dispositivo || '',
            log.sistema_operacional || ''
        ].map(campo => `"${campo}"`).join(',');
        
        csv += linha + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const dataAtual = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `logs-sistema-${dataAtual}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Registrar log de exportação
    logExportacao('logs-sistema', 'csv', {
        total_logs: logsFiltrados.length,
        tipo_filtro: document.getElementById('filtroTipo').value,
        periodo_filtro: document.getElementById('filtroPeriodo').value
    });
}

console.log('✅ Visualizador de logs carregado!');
