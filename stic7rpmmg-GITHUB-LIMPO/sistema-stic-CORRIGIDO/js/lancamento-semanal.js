// ============================================
// LANÇAMENTO SEMANAL - TABELA COMPACTA v2.0
// ============================================

// Este código substitui a seção de "Lançar no CAD2" em horas-extras.html

// CÓDIGO HTML PARA ADICIONAR:

/*
<div class="secao-lancamento-semanal" style="display: none;">
    <div class="header-lancamento">
        <div class="header-info">
            <h2>⚡ Lançar Horas no CAD 2</h2>
            <p id="periodo-semana">Semana de XX/XX a XX/XX/2026</p>
        </div>
        <div class="header-stats">
            <div class="stat-item">📋 Pendentes: <strong id="stat-pendentes">0</strong></div>
            <div class="stat-item">⚠️ Atrasados: <strong id="stat-atrasados">0</strong></div>
            <div class="stat-item">✅ Lançados: <strong id="stat-lancados">0</strong></div>
        </div>
        <button onclick="exportarParaExcel()" class="btn-exportar">
            📥 Exportar Excel
        </button>
    </div>
    
    <div class="filtros-lancamento">
        <select id="filtroPeriodo" onchange="carregarHorasSemanais()">
            <option value="esta_semana">📅 Só desta semana</option>
            <option value="ultimas_2">Últimas 2 semanas</option>
            <option value="este_mes">Este mês</option>
        </select>
        
        <select id="filtroMilitar" onchange="aplicarFiltros()">
            <option value="">👥 Todos militares</option>
        </select>
        
        <select id="filtroStatus" onchange="aplicarFiltros()">
            <option value="">⚠️ Todos status</option>
            <option value="atrasado">Apenas atrasados</option>
            <option value="pendente">Apenas pendentes</option>
            <option value="lancado">Já lançados</option>
        </select>
    </div>
    
    <div class="tabela-wrapper">
        <table id="tabelaLancamento">
            <thead>
                <tr>
                    <th>Status</th>
                    <th>Militar</th>
                    <th>Data</th>
                    <th>Horas</th>
                    <th>Lançar em</th>
                    <th>Motivo</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody id="corpoTabelaLancamento">
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem;">
                        Carregando...
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</div>
*/

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================

let horasSemanais = [];
let horasFiltradasGlobal = [];

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
                // Início da semana (domingo)
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
        alert('Erro ao carregar horas: ' + error.message);
    }
}

function atualizarPeriodoExibido(inicio, fim) {
    const inicioStr = inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const fimStr = fim.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    document.getElementById('periodo-semana').textContent = 
        `Semana de ${inicioStr} a ${fimStr}/2026`;
}

function carregarMilitaresFiltro() {
    const select = document.getElementById('filtroMilitar');
    const militaresUnicos = [...new Set(horasSemanais.map(h => h.militar_nome))];
    
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
    const filtroMilitar = document.getElementById('filtroMilitar').value;
    const filtroStatus = document.getElementById('filtroStatus').value;
    
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

function determinarStatus(hora) {
    if (hora.lancado_cad2) {
        return 'lancado';
    }
    
    const hoje = new Date();
    const dataLancamento = new Date(hora.data_prevista_lancamento);
    
    if (dataLancamento < hoje) {
        return 'atrasado';
    }
    
    return 'pendente';
}

// ============================================
// RENDERIZAR TABELA
// ============================================

function renderizarTabela(horas) {
    const tbody = document.getElementById('corpoTabelaLancamento');
    
    if (horas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
                    📭 Nenhuma hora extra encontrada neste período
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    horas.forEach(hora => {
        const tr = criarLinhaTabela(hora);
        tbody.appendChild(tr);
    });
}

function criarLinhaTabela(hora) {
    const tr = document.createElement('tr');
    const status = determinarStatus(hora);
    
    if (status === 'atrasado') {
        tr.classList.add('atrasado');
    }
    
    // Status
    const tdStatus = document.createElement('td');
    tdStatus.innerHTML = getStatusBadge(status);
    tr.appendChild(tdStatus);
    
    // Militar
    const tdMilitar = document.createElement('td');
    tdMilitar.className = 'militar-cell';
    tdMilitar.innerHTML = `
        ${hora.militar_nome || 'N/A'}
        <span class="pm-number">${hora.militar_pm || 'N/A'}</span>
    `;
    tr.appendChild(tdMilitar);
    
    // Data
    const tdData = document.createElement('td');
    tdData.textContent = hora.data || 'N/A';
    tr.appendChild(tdData);
    
    // Horas
    const tdHoras = document.createElement('td');
    tdHoras.className = 'horas-cell';
    tdHoras.textContent = hora.horas || 'N/A';
    tr.appendChild(tdHoras);
    
    // Lançar em
    const tdLancar = document.createElement('td');
    const dataLancamento = hora.data_prevista_lancamento || 'N/A';
    if (status === 'atrasado') {
        tdLancar.style.color = '#c62828';
        tdLancar.style.fontWeight = 'bold';
    } else if (status === 'lancado') {
        tdLancar.style.color = '#2e7d32';
        tdLancar.style.fontWeight = 'bold';
        tdLancar.textContent = hora.data_lancamento_cad2 || dataLancamento;
    } else {
        tdLancar.textContent = dataLancamento;
    }
    tr.appendChild(tdLancar);
    
    // Motivo
    const tdMotivo = document.createElement('td');
    tdMotivo.className = 'motivo-cell';
    tdMotivo.textContent = hora.motivo || 'N/A';
    tr.appendChild(tdMotivo);
    
    // Ações
    const tdAcoes = document.createElement('td');
    tdAcoes.className = 'actions-cell';
    tdAcoes.innerHTML = `
        <button class="btn-icon btn-copiar" onclick="copiarMotivo('${hora.id}')" title="Copiar motivo">📋</button>
        <button class="btn-icon btn-confirmar" onclick="confirmarLancamento('${hora.id}')" 
                ${status === 'lancado' ? 'disabled' : ''} title="Confirmar lançado">✅</button>
        <button class="btn-icon btn-expandir" onclick="toggleExpandir(this)" title="Ver mais">👁️</button>
    `;
    tr.appendChild(tdAcoes);
    
    return tr;
}

function getStatusBadge(status) {
    const badges = {
        'atrasado': '<span class="status-tag tag-atrasado">⚠️ ATRASADO</span>',
        'pendente': '<span class="status-tag tag-pendente">⏳ PENDENTE</span>',
        'lancado': '<span class="status-tag tag-lancado">✅ LANÇADO</span>'
    };
    
    return badges[status] || '';
}

// ============================================
// AÇÕES
// ============================================

async function copiarMotivo(id) {
    const hora = horasSemanais.find(h => h.id === id);
    if (!hora) return;
    
    try {
        await navigator.clipboard.writeText(hora.motivo);
        
        // Feedback visual
        const btn = event.target;
        const textoOriginal = btn.textContent;
        btn.textContent = '✅';
        btn.style.background = '#4caf50';
        
        setTimeout(() => {
            btn.textContent = textoOriginal;
            btn.style.background = '#2196f3';
        }, 2000);
        
    } catch (error) {
        alert('Erro ao copiar: ' + error.message);
    }
}

async function confirmarLancamento(id) {
    if (!confirm('Confirmar que foi lançado no CAD2?')) return;
    
    try {
        const usuario = JSON.parse(sessionStorage.getItem('stic_usuario') || '{}');
        
        await firebase.firestore()
            .collection('horas_extras')
            .doc(id)
            .update({
                lancado_cad2: true,
                data_lancamento_cad2: new Date().toISOString().split('T')[0],
                lancado_por: usuario.nome || 'Sistema',
                lancado_por_pm: usuario.numero_pm || 'N/A'
            });
        
        // Registrar auditoria
        if (window.auditoria) {
            await auditoria.editar('horas_extras', 'Confirmado lançamento no CAD2', 
                { lancado_cad2: false },
                { lancado_cad2: true, lancado_por: usuario.nome },
                id
            );
        }
        
        alert('✅ Lançamento confirmado!');
        
        // Recarregar
        carregarHorasSemanais();
        
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao confirmar: ' + error.message);
    }
}

function toggleExpandir(btn) {
    const tr = btn.closest('tr');
    const existente = document.getElementById('expand-' + tr.rowIndex);
    
    if (existente) {
        existente.remove();
        return;
    }
    
    // Buscar dados completos
    const index = tr.rowIndex - 1;
    const hora = horasFiltradasGlobal[index];
    
    if (!hora) return;
    
    const trExpand = document.createElement('tr');
    trExpand.id = 'expand-' + tr.rowIndex;
    trExpand.className = 'expanded-row show';
    trExpand.innerHTML = `
        <td colspan="7">
            <div class="expanded-content">
                <h4>📋 Motivo Completo:</h4>
                <p>${hora.motivo || 'N/A'}</p>
                
                <h4 style="margin-top: 1rem;">📊 Informações Adicionais:</h4>
                <p><strong>Tipo:</strong> ${hora.tipo_hora || 'N/A'}</p>
                ${hora.responsavel ? `<p><strong>Responsável:</strong> ${hora.responsavel}</p>` : ''}
                ${hora.lancado_cad2 ? `
                    <h4 style="margin-top: 1rem;">✅ Lançamento:</h4>
                    <p><strong>Lançado em:</strong> ${hora.data_lancamento_cad2 || 'N/A'}</p>
                    <p><strong>Lançado por:</strong> ${hora.lancado_por || 'N/A'}</p>
                ` : ''}
            </div>
        </td>
    `;
    
    tr.parentNode.insertBefore(trExpand, tr.nextSibling);
}

// ============================================
// ATUALIZAR ESTATÍSTICAS
// ============================================

function atualizarEstatisticas() {
    let pendentes = 0;
    let atrasados = 0;
    let lancados = 0;
    
    horasFiltradasGlobal.forEach(hora => {
        const status = determinarStatus(hora);
        if (status === 'pendente') pendentes++;
        if (status === 'atrasado') atrasados++;
        if (status === 'lancado') lancados++;
    });
    
    document.getElementById('stat-pendentes').textContent = pendentes;
    document.getElementById('stat-atrasados').textContent = atrasados;
    document.getElementById('stat-lancados').textContent = lancados;
}

// ============================================
// EXPORTAR PARA EXCEL
// ============================================

function exportarParaExcel() {
    try {
        // Preparar dados
        const dados = horasFiltradasGlobal.map(hora => {
            const status = determinarStatus(hora);
            const statusTexto = {
                'atrasado': 'ATRASADO',
                'pendente': 'PENDENTE',
                'lancado': 'LANÇADO'
            }[status];
            
            return {
                'Status': statusTexto,
                'Militar': hora.militar_nome || 'N/A',
                'Número PM': hora.militar_pm || 'N/A',
                'Data': hora.data || 'N/A',
                'Horas': hora.horas || 'N/A',
                'Data Lançamento': hora.data_prevista_lancamento || 'N/A',
                'Motivo': hora.motivo || 'N/A',
                'Lançado no CAD2': hora.lancado_cad2 ? 'Sim' : 'Não',
                'Lançado em': hora.data_lancamento_cad2 || '',
                'Lançado por': hora.lancado_por || ''
            };
        });
        
        if (dados.length === 0) {
            alert('Nenhum dado para exportar!');
            return;
        }
        
        // Criar CSV
        const headers = Object.keys(dados[0]);
        const csv = [
            headers.join(','),
            ...dados.map(row => 
                headers.map(header => `"${row[header]}"`).join(',')
            )
        ].join('\n');
        
        // Download
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `horas_extras_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        alert('✅ Arquivo exportado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao exportar:', error);
        alert('Erro ao exportar: ' + error.message);
    }
}

// ============================================
// BACKUP AUTOMÁTICO GOOGLE DRIVE
// ============================================

// IMPORTANTE: Requer configuração da API do Google Drive
// Ver arquivo separado: GUIA_BACKUP_GOOGLE_DRIVE.md

async function backupGoogleDrive() {
    // Implementação completa no guia separado
    console.log('Iniciando backup Google Drive...');
}

// Agendar backup diário
function agendarBackupDiario() {
    const agora = new Date();
    const proximoBackup = new Date();
    proximoBackup.setHours(23, 0, 0, 0); // 23h
    
    if (proximoBackup < agora) {
        proximoBackup.setDate(proximoBackup.getDate() + 1);
    }
    
    const tempo = proximoBackup - agora;
    
    setTimeout(() => {
        backupGoogleDrive();
        agendarBackupDiario(); // Reagendar
    }, tempo);
    
    console.log(`✅ Backup agendado para: ${proximoBackup.toLocaleString('pt-BR')}`);
}

// Iniciar ao carregar sistema
// agendarBackupDiario();

console.log('✅ Sistema de Lançamento Semanal carregado!');
