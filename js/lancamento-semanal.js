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
    // Se já foi lançado no CAD2, retorna "lancado"
    if (hora.lancado_cad2) {
        return 'lancado';
    }
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const dataHora = new Date(hora.data);
    dataHora.setHours(0, 0, 0, 0);
    
    // Calcular quando PODE lançar (7 dias após a data da hora)
    const podeLancarAPartirDe = new Date(dataHora);
    podeLancarAPartirDe.setDate(podeLancarAPartirDe.getDate() + 7);
    
    // Calcular a próxima SEXTA após poder lançar
    const proximaSexta = new Date(podeLancarAPartirDe);
    const diaSemana = proximaSexta.getDay();
    if (diaSemana <= 5) {
        proximaSexta.setDate(proximaSexta.getDate() + (5 - diaSemana));
    } else {
        proximaSexta.setDate(proximaSexta.getDate() + (12 - diaSemana)); // próxima sexta
    }
    proximaSexta.setHours(23, 59, 59, 999);
    
    // Guardar a data limite no objeto para exibição
    hora.data_limite_lancamento = proximaSexta;
    
    // ✅ CORREÇÃO PRINCIPAL:
    // Só está "atrasado" se PASSOU da sexta-feira limite
    if (hoje > proximaSexta) {
        return 'atrasado';
    }
    
    // Se ainda não passaram 7 dias, está "aguardando"
    if (hoje < podeLancarAPartirDe) {
        return 'aguardando'; // NOVO STATUS
    }
    
    // Se passaram 7 dias mas ainda não passou a sexta, está "pronto"
    // Ou seja, PODE lançar
    if (hoje.getDay() === 5) {
        return 'pode_lancar_hoje'; // NOVO STATUS - É sexta!
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
    
    // Classes de estilo por status
    tr.classList.add(`status-${status}`);
    if (status === 'atrasado') {
        tr.style.background = 'linear-gradient(90deg, #ffebee 0%, white 100%)';
    } else if (status === 'pode_lancar_hoje') {
        tr.style.background = 'linear-gradient(90deg, #e8f5e9 0%, white 100%)';
    } else if (status === 'lancado') {
        tr.style.background = 'linear-gradient(90deg, #e3f2fd 0%, white 100%)';
    }
    
    // Status
    const tdStatus = document.createElement('td');
    tdStatus.innerHTML = getStatusBadge(status);
    tr.appendChild(tdStatus);
    
    // Militar
    const tdMilitar = document.createElement('td');
    tdMilitar.className = 'militar-cell';
    tdMilitar.innerHTML = `
        <strong>${hora.militar_nome || 'N/A'}</strong>
        <span class="pm-number" style="display:block;font-size:0.85em;color:#666;">${hora.militar_pm || 'N/A'}</span>
    `;
    tr.appendChild(tdMilitar);
    
    // Data da Hora Extra
    const tdData = document.createElement('td');
    const dataFormatada = hora.data ? new Date(hora.data + 'T12:00:00').toLocaleDateString('pt-BR') : 'N/A';
    tdData.innerHTML = `<strong>${dataFormatada}</strong>`;
    tr.appendChild(tdData);
    
    // Horas
    const tdHoras = document.createElement('td');
    tdHoras.className = 'horas-cell';
    tdHoras.innerHTML = `<span style="font-size:1.1em;font-weight:bold;color:#1565c0;">${hora.horas || 'N/A'}h</span>`;
    tr.appendChild(tdHoras);
    
    // Coluna "Lançar em" - MELHORADA
    const tdLancar = document.createElement('td');
    const dataLimite = hora.data_limite_lancamento;
    
    if (status === 'lancado') {
        // Já foi lançado
        tdLancar.innerHTML = `
            <div style="color:#2e7d32;font-weight:bold;">
                ✅ Lançado em:<br>
                <span style="font-size:1.1em;">${hora.data_lancamento_cad2 || 'N/A'}</span>
                ${hora.lancado_por ? `<br><small style="color:#666;">Por: ${hora.lancado_por}</small>` : ''}
            </div>
        `;
    } else if (status === 'atrasado') {
        // Atrasado
        const dataLimiteStr = dataLimite ? dataLimite.toLocaleDateString('pt-BR') : 'N/A';
        tdLancar.innerHTML = `
            <div style="color:#c62828;font-weight:bold;">
                ❌ Prazo era:<br>
                <span style="font-size:1.1em;">${dataLimiteStr}</span>
            </div>
        `;
    } else if (status === 'aguardando') {
        // Aguardando 7 dias
        const dataHora = new Date(hora.data);
        const podeLancarEm = new Date(dataHora);
        podeLancarEm.setDate(podeLancarEm.getDate() + 7);
        const diasRestantes = Math.ceil((podeLancarEm - new Date()) / (1000 * 60 * 60 * 24));
        
        tdLancar.innerHTML = `
            <div style="color:#ff8f00;">
                ⏳ 7 dias em:<br>
                <span style="font-size:1.1em;">${podeLancarEm.toLocaleDateString('pt-BR')}</span>
                <br><small style="color:#666;">Faltam ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}</small>
            </div>
        `;
    } else if (status === 'pode_lancar_hoje') {
        // Pode lançar HOJE!
        tdLancar.innerHTML = `
            <div style="color:#2e7d32;font-weight:bold;animation:pulse 1s infinite;">
                🚀 HOJE!<br>
                <span style="font-size:0.9em;">Sexta-feira</span>
            </div>
        `;
    } else {
        // Pendente - aguardando a sexta
        const dataLimiteStr = dataLimite ? dataLimite.toLocaleDateString('pt-BR') : 'N/A';
        const diasAteLimit = dataLimite ? Math.ceil((dataLimite - new Date()) / (1000 * 60 * 60 * 24)) : 0;
        
        tdLancar.innerHTML = `
            <div style="color:#1565c0;">
                📅 Lançar até:<br>
                <span style="font-size:1.1em;font-weight:bold;">${dataLimiteStr}</span>
                <br><small style="color:#666;">Faltam ${diasAteLimit} dia${diasAteLimit > 1 ? 's' : ''}</small>
            </div>
        `;
    }
    tr.appendChild(tdLancar);
    
    // Motivo - COM BOTÃO DE COPIAR INTEGRADO
    const tdMotivo = document.createElement('td');
    tdMotivo.className = 'motivo-cell';
    const motivoTexto = hora.motivo || 'N/A';
    const motivoResumido = motivoTexto.length > 50 ? motivoTexto.substring(0, 50) + '...' : motivoTexto;
    tdMotivo.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
            <span class="motivo-texto" title="${motivoTexto}" style="flex:1;cursor:pointer;" onclick="copiarMotivoRapido(this, '${hora.id}')">${motivoResumido}</span>
            <button class="btn-copiar-mini" onclick="copiarMotivo('${hora.id}')" title="📋 Copiar motivo completo" style="padding:4px 8px;border:none;background:#e3f2fd;border-radius:4px;cursor:pointer;">📋</button>
        </div>
    `;
    tr.appendChild(tdMotivo);
    
    // Ações
    const tdAcoes = document.createElement('td');
    tdAcoes.className = 'actions-cell';
    
    const btnConfirmar = status === 'lancado' 
        ? `<button class="btn-icon btn-confirmar" disabled title="Já lançado" style="opacity:0.5;">✅</button>`
        : `<button class="btn-icon btn-confirmar" onclick="confirmarLancamento('${hora.id}')" title="✅ Confirmar lançado no CAD2" style="background:#4caf50;color:white;border:none;padding:6px 10px;border-radius:4px;cursor:pointer;">✅ CAD2</button>`;
    
    tdAcoes.innerHTML = `
        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;">
            ${btnConfirmar}
            <button class="btn-icon btn-expandir" onclick="toggleExpandir(this, '${hora.id}')" title="👁️ Ver detalhes" style="background:#2196f3;color:white;border:none;padding:6px 10px;border-radius:4px;cursor:pointer;">👁️</button>
        </div>
    `;
        <button class="btn-icon btn-confirmar" onclick="confirmarLancamento('${hora.id}')" 
                ${status === 'lancado' ? 'disabled' : ''} title="Confirmar lançado">✅</button>
        <button class="btn-icon btn-expandir" onclick="toggleExpandir(this)" title="Ver mais">👁️</button>
    `;
    tr.appendChild(tdAcoes);
    
    return tr;
}

function getStatusBadge(status) {
    const badges = {
        'atrasado': '<span class="status-tag tag-atrasado">❌ ATRASADO</span>',
        'aguardando': '<span class="status-tag tag-aguardando">⏳ AGUARDANDO 7 DIAS</span>',
        'pendente': '<span class="status-tag tag-pendente">📅 AGUARDANDO SEXTA</span>',
        'pode_lancar_hoje': '<span class="status-tag tag-pode-lancar">🚀 LANÇAR HOJE!</span>',
        'lancado': '<span class="status-tag tag-lancado">✅ LANÇADO</span>'
    };
    
    return badges[status] || '<span class="status-tag">❓</span>';
}

// ============================================
// AÇÕES
// ============================================

async function copiarMotivo(id) {
    const hora = horasSemanais.find(h => h.id === id);
    if (!hora) return;
    
    try {
        await navigator.clipboard.writeText(hora.motivo);
        
        // Feedback visual melhorado
        mostrarToast('✅ Motivo copiado!', 'success');
        
    } catch (error) {
        // Fallback para navegadores mais antigos
        const textarea = document.createElement('textarea');
        textarea.value = hora.motivo;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        mostrarToast('✅ Motivo copiado!', 'success');
    }
}

// Copiar motivo com um clique no texto
async function copiarMotivoRapido(elemento, id) {
    const hora = horasSemanais.find(h => h.id === id);
    if (!hora) return;
    
    try {
        await navigator.clipboard.writeText(hora.motivo);
        
        // Feedback visual no próprio elemento
        const textoOriginal = elemento.textContent;
        elemento.textContent = '✅ Copiado!';
        elemento.style.color = '#2e7d32';
        elemento.style.fontWeight = 'bold';
        
        setTimeout(() => {
            elemento.textContent = textoOriginal;
            elemento.style.color = '';
            elemento.style.fontWeight = '';
        }, 1500);
        
    } catch (error) {
        copiarMotivo(id);
    }
}

// Toast de notificação
function mostrarToast(mensagem, tipo = 'info') {
    // Remover toast existente
    const existente = document.getElementById('toast-lancamento');
    if (existente) existente.remove();
    
    const toast = document.createElement('div');
    toast.id = 'toast-lancamento';
    
    const cores = {
        'success': { bg: '#4caf50', icon: '✅' },
        'error': { bg: '#f44336', icon: '❌' },
        'warning': { bg: '#ff9800', icon: '⚠️' },
        'info': { bg: '#2196f3', icon: 'ℹ️' }
    };
    
    const cor = cores[tipo] || cores.info;
    
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${cor.bg};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    toast.textContent = mensagem;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Adicionar animações de toast
if (!document.getElementById('toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

async function confirmarLancamento(id) {
    // Modal de confirmação melhorado
    const hora = horasSemanais.find(h => h.id === id);
    if (!hora) return;
    
    const confirmacao = confirm(
        `✅ CONFIRMAR LANÇAMENTO NO CAD2\n\n` +
        `Militar: ${hora.militar_nome}\n` +
        `Data: ${hora.data}\n` +
        `Horas: ${hora.horas}h\n` +
        `Motivo: ${hora.motivo?.substring(0, 100)}...\n\n` +
        `Confirmar que foi lançado no CAD2?`
    );
    
    if (!confirmacao) return;
    
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
    let aguardando = 0;
    let pendentes = 0;
    let podeLancarHoje = 0;
    let atrasados = 0;
    let lancados = 0;
    
    horasFiltradasGlobal.forEach(hora => {
        const status = determinarStatus(hora);
        switch(status) {
            case 'aguardando': aguardando++; break;
            case 'pendente': pendentes++; break;
            case 'pode_lancar_hoje': podeLancarHoje++; break;
            case 'atrasado': atrasados++; break;
            case 'lancado': lancados++; break;
        }
    });
    
    // Atualizar elementos se existirem
    const elPendentes = document.getElementById('stat-pendentes');
    const elAtrasados = document.getElementById('stat-atrasados');
    const elLancados = document.getElementById('stat-lancados');
    
    if (elPendentes) elPendentes.textContent = aguardando + pendentes + podeLancarHoje;
    if (elAtrasados) elAtrasados.textContent = atrasados;
    if (elLancados) elLancados.textContent = lancados;
    
    // Criar/atualizar painel de resumo detalhado
    atualizarPainelResumo(aguardando, pendentes, podeLancarHoje, atrasados, lancados);
}

// Painel de resumo visual detalhado
function atualizarPainelResumo(aguardando, pendentes, podeLancarHoje, atrasados, lancados) {
    let painel = document.getElementById('painel-resumo-lancamento');
    
    if (!painel) {
        painel = document.createElement('div');
        painel.id = 'painel-resumo-lancamento';
        painel.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:15px 0;';
        
        const tabelaWrapper = document.querySelector('.tabela-wrapper');
        if (tabelaWrapper) {
            tabelaWrapper.parentNode.insertBefore(painel, tabelaWrapper);
        }
    }
    
    const total = aguardando + pendentes + podeLancarHoje + atrasados + lancados;
    
    painel.innerHTML = `
        <div style="background:linear-gradient(135deg,#fff3e0,#ffe0b2);padding:15px;border-radius:10px;text-align:center;border-left:4px solid #ff9800;">
            <div style="font-size:2em;font-weight:bold;color:#e65100;">${aguardando}</div>
            <div style="font-size:0.85em;color:#bf360c;">⏳ Aguardando 7 dias</div>
        </div>
        <div style="background:linear-gradient(135deg,#e3f2fd,#bbdefb);padding:15px;border-radius:10px;text-align:center;border-left:4px solid #2196f3;">
            <div style="font-size:2em;font-weight:bold;color:#1565c0;">${pendentes}</div>
            <div style="font-size:0.85em;color:#0d47a1;">📅 Aguardando Sexta</div>
        </div>
        <div style="background:linear-gradient(135deg,#e8f5e9,#c8e6c9);padding:15px;border-radius:10px;text-align:center;border-left:4px solid #4caf50;${podeLancarHoje > 0 ? 'animation:pulse 1s infinite;' : ''}">
            <div style="font-size:2em;font-weight:bold;color:#2e7d32;">${podeLancarHoje}</div>
            <div style="font-size:0.85em;color:#1b5e20;">🚀 Lançar HOJE!</div>
        </div>
        <div style="background:linear-gradient(135deg,#ffebee,#ffcdd2);padding:15px;border-radius:10px;text-align:center;border-left:4px solid #f44336;">
            <div style="font-size:2em;font-weight:bold;color:#c62828;">${atrasados}</div>
            <div style="font-size:0.85em;color:#b71c1c;">❌ Atrasados</div>
        </div>
        <div style="background:linear-gradient(135deg,#e8eaf6,#c5cae9);padding:15px;border-radius:10px;text-align:center;border-left:4px solid #3f51b5;">
            <div style="font-size:2em;font-weight:bold;color:#283593;">${lancados}</div>
            <div style="font-size:0.85em;color:#1a237e;">✅ Lançados</div>
        </div>
    `;
    
    // Adicionar CSS de animação se não existir
    if (!document.getElementById('pulse-animation-style')) {
        const style = document.createElement('style');
        style.id = 'pulse-animation-style';
        style.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.02); box-shadow: 0 0 20px rgba(76,175,80,0.4); }
                100% { transform: scale(1); }
            }
            .status-tag {
                display: inline-block;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 0.85em;
                font-weight: bold;
            }
            .tag-atrasado { background: #ffcdd2; color: #c62828; }
            .tag-aguardando { background: #ffe0b2; color: #e65100; }
            .tag-pendente { background: #bbdefb; color: #1565c0; }
            .tag-pode-lancar { background: #c8e6c9; color: #2e7d32; animation: pulse 1s infinite; }
            .tag-lancado { background: #c5cae9; color: #283593; }
        `;
        document.head.appendChild(style);
    }
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
