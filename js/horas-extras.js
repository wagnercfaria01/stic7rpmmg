// ====================================
// SISTEMA DE CONTROLE DE HORAS EXTRAS
// STIC 7º RPM - PMMG
// ====================================

// Referências Firebase já declaradas em firebase-config.js
// militaresRef e horasRef estão disponíveis globalmente

// Variáveis globais
let militaresCadastrados = [];
let horasLancadas = [];
let graficos = {};

// ====================================
// LÓGICA DE PRAZO - SEXTA-FEIRA
// ====================================

/**
 * Calcula o dia limite para lançamento (próxima sexta após 7 dias)
 * @param {Date|string} dataRealizacao - Data em que a hora foi realizada
 * @returns {Date} Data limite (sexta-feira às 23:59:59)
 */
function calcularDiaLimiteHoras(dataRealizacao) {
    const dataHora = new Date(dataRealizacao);
    
    // 1. Adicionar 7 dias
    dataHora.setDate(dataHora.getDate() + 7);
    
    // 2. Encontrar próxima sexta-feira
    const diaSemana = dataHora.getDay(); // 0=domingo, 5=sexta, 6=sábado
    
    let diasAteProximaSexta;
    if (diaSemana <= 5) {
        // Segunda a sexta: calcular dias até sexta
        diasAteProximaSexta = 5 - diaSemana;
    } else {
        // Sábado (6) ou domingo (0): próxima sexta é em 6 ou 5 dias
        diasAteProximaSexta = diaSemana === 6 ? 6 : 5;
    }
    
    dataHora.setDate(dataHora.getDate() + diasAteProximaSexta);
    dataHora.setHours(23, 59, 59, 999);
    
    return dataHora;
}

/**
 * Verifica se o lançamento está atrasado
 * @param {Date|string} dataRealizacao - Data em que a hora foi realizada
 * @param {Date|string} dataLancamento - Data em que está sendo lançado (default: hoje)
 * @returns {boolean} true se está atrasado
 */
function estaAtrasado(dataRealizacao, dataLancamento = new Date()) {
    const limite = calcularDiaLimiteHoras(dataRealizacao);
    const lancamento = new Date(dataLancamento);
    
    return lancamento > limite;
}

/**
 * Retorna mensagem amigável sobre o prazo
 * @param {Date|string} dataRealizacao - Data em que a hora foi realizada
 * @returns {string} Mensagem sobre o status do prazo
 */
function getMensagemPrazo(dataRealizacao) {
    const hoje = new Date();
    const limite = calcularDiaLimiteHoras(dataRealizacao);
    const diasRestantes = Math.ceil((limite - hoje) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes > 7) {
        const sextaFormatada = limite.toLocaleDateString('pt-BR');
        return `✅ Dentro do prazo! Pode lançar até ${sextaFormatada} (faltam ${diasRestantes} dias)`;
    } else if (diasRestantes > 0) {
        const sextaFormatada = limite.toLocaleDateString('pt-BR');
        return `⚠️ Prazo próximo! Deve lançar até ${sextaFormatada} (faltam ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''})`;
    } else if (diasRestantes === 0) {
        return '🚨 ÚLTIMO DIA! Lançar hoje até 23:59';
    } else {
        const sextaFormatada = limite.toLocaleDateString('pt-BR');
        return `❌ ATRASADO! Prazo era ${sextaFormatada}`;
    }
}

/**
 * Retorna classe CSS baseada no status do prazo
 * @param {Date|string} dataRealizacao - Data em que a hora foi realizada
 * @returns {string} Classe CSS ('prazo-ok', 'prazo-proximo', 'prazo-atrasado')
 */
function getClassePrazo(dataRealizacao) {
    const hoje = new Date();
    const limite = calcularDiaLimiteHoras(dataRealizacao);
    const diasRestantes = Math.ceil((limite - hoje) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes > 3) return 'prazo-ok';
    if (diasRestantes > 0) return 'prazo-proximo';
    return 'prazo-atrasado';
}

// ====================================
// LÓGICA DE LANÇAMENTO CAD 2
// ====================================

/**
 * Verifica se hoje é sexta-feira
 * @returns {boolean} true se hoje é sexta
 */
function hojeSexta() {
    return new Date().getDay() === 5; // 5 = sexta-feira
}

/**
 * Verifica se passaram 7 dias desde a data da hora
 * @param {Date|string} dataHora - Data em que a hora foi realizada
 * @returns {boolean} true se passaram 7 dias ou mais
 */
function passaram7Dias(dataHora) {
    const data = new Date(dataHora);
    const hoje = new Date();
    const diffDias = Math.floor((hoje - data) / (1000 * 60 * 60 * 24));
    return diffDias >= 7;
}

/**
 * Verifica se a hora pode ser lançada no CAD 2 HOJE
 * Critérios: Passou 7 dias E hoje é sexta-feira
 * @param {Date|string} dataHora - Data em que a hora foi realizada
 * @returns {boolean} true se pode lançar hoje
 */
function podeLancarHoje(dataHora) {
    return hojeSexta() && passaram7Dias(dataHora);
}

/**
 * Retorna a próxima sexta-feira disponível para lançamento
 * @param {Date|string} dataHora - Data em que a hora foi realizada
 * @returns {Date} Próxima sexta válida (após 7 dias)
 */
function proximaSextaLancamento(dataHora) {
    const data = new Date(dataHora);
    // Adicionar 7 dias
    data.setDate(data.getDate() + 7);
    
    // Encontrar próxima sexta
    const diaSemana = data.getDay();
    let diasAteProximaSexta;
    
    if (diaSemana <= 5) {
        diasAteProximaSexta = 5 - diaSemana;
    } else {
        diasAteProximaSexta = diaSemana === 6 ? 6 : 5;
    }
    
    data.setDate(data.getDate() + diasAteProximaSexta);
    return data;
}

/**
 * Retorna mensagem sobre quando pode lançar
 * @param {Date|string} dataHora - Data em que a hora foi realizada
 * @returns {string} Mensagem informativa
 */
function getMensagemLancamento(dataHora) {
    const passou7 = passaram7Dias(dataHora);
    const sexta = hojeSexta();
    
    if (!passou7) {
        const data = new Date(dataHora);
        data.setDate(data.getDate() + 7);
        return `⏳ Ainda não podem lançar. 7 dias completam em ${data.toLocaleDateString('pt-BR')}`;
    }
    
    if (passou7 && !sexta) {
        const proximaSexta = proximaSextaLancamento(dataHora);
        const hoje = new Date();
        const diasRestantes = Math.ceil((proximaSexta - hoje) / (1000 * 60 * 60 * 24));
        return `📅 Lançar na próxima sexta: ${proximaSexta.toLocaleDateString('pt-BR')} (em ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''})`;
    }
    
    if (passou7 && sexta) {
        return `✅ PODE LANÇAR HOJE! Hoje é sexta e já passaram 7 dias`;
    }
    
    return 'Aguardando lançamento';
}

// ====================================
// INICIALIZAÇÃO
// ====================================

window.onload = async function() {
    await carregarMilitares();
    await carregarHoras();
    atualizarDashboard();
    configurarEventos();
    preencherDataAtual();
};

// Configurar eventos
function configurarEventos() {
    // Form lançar horas
    document.getElementById('formLancarHoras').addEventListener('submit', lancarHoras);
    
    // Form lançar em lote
    document.getElementById('formLancarLote').addEventListener('submit', lancarLote);
    
    // Form cadastrar militar
    document.getElementById('formCadastroMilitar').addEventListener('submit', cadastrarMilitar);
    
    // Carregar motivos recentes
    carregarMotivosRecentes();
}

// Preencher motivo a partir do select
function preencherMotivo() {
    const select = document.getElementById('motivoPredefinido');
    const textarea = document.getElementById('motivoHoras');
    
    if (select.value) {
        textarea.value = select.value;
        salvarMotivoRecente(select.value);
    }
}

// ====================================
// HISTÓRICO DE MOTIVOS RECENTES
// ====================================

// Salvar motivo recente no localStorage
function salvarMotivoRecente(motivo) {
    if (!motivo || motivo.trim().length < 3) return;
    
    let recentes = JSON.parse(localStorage.getItem('motivosRecentes') || '[]');
    
    // Remove duplicados
    recentes = recentes.filter(m => m.texto !== motivo);
    
    // Adiciona no início
    recentes.unshift({
        texto: motivo,
        contador: (recentes.find(m => m.texto === motivo)?.contador || 0) + 1,
        ultima_vez: new Date().toISOString()
    });
    
    // Mantém apenas os 10 mais recentes
    recentes = recentes.slice(0, 10);
    
    localStorage.setItem('motivosRecentes', JSON.stringify(recentes));
    carregarMotivosRecentes();
}

// Carregar e exibir motivos recentes
function carregarMotivosRecentes() {
    const recentes = JSON.parse(localStorage.getItem('motivosRecentes') || '[]');
    const container = document.getElementById('listaMotivosRecentes');
    const divRecentes = document.getElementById('motivosRecentes');
    
    if (!container) return;
    
    if (recentes.length === 0) {
        divRecentes.style.display = 'none';
        return;
    }
    
    divRecentes.style.display = 'block';
    
    container.innerHTML = recentes.slice(0, 5).map(m => `
        <button type="button" 
            onclick="usarMotivoRecente('${m.texto.replace(/'/g, "\\'")}')"
            style="
                background: #e8f4f8;
                border: 1px solid #0066cc;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.3s;
            "
            onmouseover="this.style.background='#0066cc'; this.style.color='white';"
            onmouseout="this.style.background='#e8f4f8'; this.style.color='black';">
            ${m.texto} <small style="opacity: 0.7;">(${m.contador}x)</small>
        </button>
    `).join('');
}

// Usar motivo recente
function usarMotivoRecente(motivo) {
    document.getElementById('motivoHoras').value = motivo;
    document.getElementById('motivoPredefinido').value = '';
    atualizarPreview();
}

// ====================================
// PREVIEW DE SALDO
// ====================================

// Atualizar preview do saldo
async function atualizarPreview() {
    const militarId = document.getElementById('militarHoras').value;
    const tipo = document.getElementById('tipoHora').value;
    const quantidade = document.getElementById('quantidadeHoras').value;
    const data = document.getElementById('dataHora').value;
    
    if (!militarId || !quantidade || !data) {
        document.getElementById('previewSaldo').style.display = 'none';
        return;
    }
    
    // Validar formato
    if (!quantidade.match(/^[0-9]{1,3}:[0-5][0-9]$/)) {
        document.getElementById('previewSaldo').style.display = 'none';
        return;
    }
    
    const militar = militaresCadastrados.find(m => m.id === militarId);
    if (!militar) return;
    
    // Calcular saldo atual
    const horasMilitar = horasLancadas.filter(h => h.militar_id === militarId);
    let saldoAtual = 0;
    horasMilitar.forEach(h => {
        const minutos = horaParaMinutos(h.quantidade_horas);
        saldoAtual += h.tipo === 'extra' ? minutos : -minutos;
    });
    
    // Calcular novo saldo
    const minutosNovo = horaParaMinutos(quantidade);
    const novoSaldo = saldoAtual + (tipo === 'extra' ? minutosNovo : -minutosNovo);
    const diferenca = novoSaldo - saldoAtual;
    
    // Exibir preview
    document.getElementById('previewSaldo').style.display = 'block';
    document.getElementById('conteudoPreview').innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div>
                <strong>👤 Militar:</strong><br>
                ${militar.nome}
            </div>
            <div>
                <strong>📅 Data:</strong><br>
                ${formatarData(data)}
            </div>
            <div>
                <strong>⏰ Hora:</strong><br>
                <span style="color: ${tipo === 'extra' ? '#28a745' : '#dc3545'}; font-weight: bold; font-size: 1.1rem;">
                    ${tipo === 'extra' ? '+' : '-'}${quantidade}
                </span>
            </div>
        </div>
        <hr style="margin: 1rem 0; border: none; border-top: 1px solid #ddd;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; text-align: center;">
            <div>
                <div style="color: #666; font-size: 0.85rem;">Saldo Atual</div>
                <div style="font-size: 1.5rem; font-weight: bold; color: ${saldoAtual >= 0 ? '#28a745' : '#dc3545'};">
                    ${formatarMinutosParaHora(saldoAtual)}
                </div>
            </div>
            <div>
                <div style="color: #666; font-size: 0.85rem;">Diferença</div>
                <div style="font-size: 1.5rem; font-weight: bold; color: ${diferenca >= 0 ? '#28a745' : '#dc3545'};">
                    ${diferenca >= 0 ? '+' : ''}${formatarMinutosParaHora(diferenca)}
                </div>
            </div>
            <div>
                <div style="color: #666; font-size: 0.85rem;">Novo Saldo</div>
                <div style="font-size: 1.5rem; font-weight: bold; color: ${novoSaldo >= 0 ? '#28a745' : '#dc3545'};">
                    ${formatarMinutosParaHora(novoSaldo)} ${novoSaldo > saldoAtual ? '⬆️' : novoSaldo < saldoAtual ? '⬇️' : '➡️'}
                </div>
            </div>
        </div>
    `;
}

// Preencher data atual
function preencherDataAtual() {
    const hoje = new Date().toISOString().split('T')[0];
    const mesAtual = hoje.substring(0, 7);
    
    // Filtros dashboard
    if (document.getElementById('filtroMes')) {
        document.getElementById('filtroMes').value = mesAtual;
    }
    
    // Filtro histórico
    if (document.getElementById('filtroHistMes')) {
        document.getElementById('filtroHistMes').value = mesAtual;
    }
}

// ====================================
// GERENCIAMENTO DE ABAS
// ====================================

function abrirAba(aba) {
    // Desativar todas as abas
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Ativar botão da aba selecionada
    const botaoAba = document.querySelector(`[onclick*="abrirAba('${aba}')"]`);
    if (botaoAba) {
        botaoAba.classList.add('active');
    }
    
    // Ativar conteúdo da aba
    const conteudoAba = document.getElementById(aba);
    if (conteudoAba) {
        conteudoAba.classList.add('active');
    }
    
    // Carregar dados específicos da aba
    if (aba === 'dashboard') {
        atualizarDashboard();
    } else if (aba === 'lancar') {
        carregarMotivosRecentes();
    } else if (aba === 'lote') {
        atualizarSelectLote();
    } else if (aba === 'semanal') {
        preencherSelectResponsavel();
        preencherDataLancamentoHoje();
        carregarListaSemanal();
    } else if (aba === 'lancamento_cad2') {
        if (typeof carregarHorasSemanais === 'function') {
            carregarHorasSemanais();
        }
    } else if (aba === 'historico') {
        carregarHistorico();
    } else if (aba === 'militares') {
        listarMilitares();
    }
}

// ====================================
// BUSCA INTELIGENTE
// ====================================

let todasHoras = []; // Armazena todas as horas para busca

function buscarHistorico() {
    const termo = document.getElementById('buscaGlobal').value.toLowerCase().trim();
    
    if (!termo) {
        carregarHistorico();
        return;
    }
    
    // Buscar em todos os campos
    const resultados = todasHoras.filter(h => {
        // Busca em múltiplos campos
        const militar = (h.militar_nome + ' ' + h.militar_numero).toLowerCase();
        const data = formatarData(h.data_hora).toLowerCase();
        const horas = h.quantidade_horas.toLowerCase();
        const tipo = h.tipo.toLowerCase();
        const motivo = h.motivo.toLowerCase();
        const status = h.status.toLowerCase();
        const mes = h.mes_ano;
        
        return militar.includes(termo) ||
               data.includes(termo) ||
               horas.includes(termo) ||
               tipo.includes(termo) ||
               motivo.includes(termo) ||
               status.includes(termo) ||
               mes.includes(termo) ||
               (termo.includes('pendente') && h.status === 'pendente') ||
               (termo.includes('lançado') && h.status === 'lancado') ||
               (termo.includes('lancado') && h.status === 'lancado') ||
               (termo.includes('+') && h.tipo === 'extra') ||
               (termo.includes('-') && h.tipo === 'negativa');
    });
    
    renderizarHistorico(resultados);
}

// Função auxiliar para renderizar histórico
function renderizarHistorico(horas) {
    // Calcular estatísticas
    let totalExtras = 0;
    let totalNegativas = 0;
    
    horas.forEach(h => {
        const minutos = horaParaMinutos(h.quantidade_horas);
        if (h.tipo === 'extra') {
            totalExtras += minutos;
        } else {
            totalNegativas += minutos;
        }
    });
    
    // Atualizar estatísticas
    document.getElementById('histTotalRegistros').textContent = horas.length;
    document.getElementById('histTotalExtras').textContent = '+' + formatarMinutosParaHora(totalExtras);
    document.getElementById('histTotalNegativas').textContent = '-' + formatarMinutosParaHora(totalNegativas);
    document.getElementById('histSaldo').textContent = formatarMinutosParaHora(totalExtras - totalNegativas);
    
    // Renderizar tabela
    const tbody = document.getElementById('tabelaHistorico');
    tbody.innerHTML = '';
    
    if (horas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem; color: #666;">
                    <h3>🔍 Nenhum resultado encontrado</h3>
                    <p>Tente ajustar os filtros ou busca</p>
                </td>
            </tr>
        `;
        return;
    }
    
    horas.forEach(h => {
        const tr = document.createElement('tr');
        tr.style.background = h.status === 'pendente' ? '#fff3cd' : 'white';
        
        tr.innerHTML = `
            <td>${formatarData(h.data_hora)}</td>
            <td>
                <strong>${h.militar_nome}</strong><br>
                <small style="color: #666;">${h.militar_numero}</small>
            </td>
            <td>
                <strong style="color: ${h.tipo === 'extra' ? '#28a745' : '#dc3545'}; font-size: 1.1rem;">
                    ${h.tipo === 'extra' ? '+' : '-'}${h.quantidade_horas}
                </strong>
            </td>
            <td style="max-width: 200px; word-wrap: break-word;">
                ${h.motivo}
            </td>
            <td>${formatarData(h.data_prevista_lancamento)}</td>
            <td>
                <div id="status-${h.id}">
                    ${h.status === 'lancado' ? `
                        <span class="status-badge status-lancado">✅ Lançado</span>
                        ${h.data_lancamento_cad2 ? `<br><small style="color: #666;">📅 ${formatarData(h.data_lancamento_cad2)}</small>` : ''}
                    ` : `
                        <span class="status-badge status-pendente">⏳ Pendente</span>
                        <br><small style="color: #666;font-size:0.75rem;">${getMensagemLancamento(h.data_hora)}</small>
                    `}
                </div>
            </td>
            <td>
                <div id="responsavel-${h.id}">
                    ${h.responsavel_lancamento || '-'}
                </div>
            </td>
            <td>
                <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
                    ${h.status === 'pendente' && podeLancarHoje(h.data_hora) ? `
                        <button onclick="abrirModalLancamento('${h.id}')" 
                            class="btn-action btn-success" 
                            title="✅ Pode lançar HOJE!">
                            ✅
                        </button>
                    ` : ''}
                    ${h.status === 'pendente' && !podeLancarHoje(h.data_hora) ? `
                        <button 
                            class="btn-action" 
                            style="background:#6c757d;cursor:not-allowed;" 
                            disabled
                            title="${getMensagemLancamento(h.data_hora)}">
                            🔒
                        </button>
                    ` : ''}
                    <button onclick="editarHora('${h.id}')" 
                        class="btn-action btn-primary" 
                        title="Editar">
                        ✏️
                    </button>
                    <button onclick="duplicarHora('${h.id}')" 
                        class="btn-action btn-secondary" 
                        title="Duplicar">
                        🔄
                    </button>
                    <button onclick="gerarPDFIndividual('${h.id}')" 
                        class="btn-action btn-info" 
                        title="Gerar PDF">
                        📄
                    </button>
                    <button onclick="confirmarExcluir('${h.id}')" 
                        class="btn-action btn-danger" 
                        title="Excluir">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Duplicar hora
function duplicarHora(id) {
    const hora = horasLancadas.find(h => h.id === id);
    if (!hora) return;
    
    // Ir para aba de lançar
    document.querySelector('[onclick="abrirAba(\'lancar\')"]').click();
    
    // Aguardar carregar
    setTimeout(() => {
        // Preencher formulário
        document.getElementById('militarHoras').value = hora.militar_id;
        document.getElementById('tipoHora').value = hora.tipo;
        document.getElementById('quantidadeHoras').value = hora.quantidade_horas;
        document.getElementById('motivoHoras').value = hora.motivo;
        
        // Deixar data em branco para usuário preencher
        document.getElementById('dataHora').value = '';
        document.getElementById('dataHora').focus();
        
        mostrarSucesso('✅ Hora duplicada! Altere a data e salve.');
        
        // Atualizar preview
        atualizarPreview();
    }, 100);
}

// Preencher select de responsável
function preencherSelectResponsavel() {
    const select = document.getElementById('responsavelLote');
    if (!select) return;
    
    // Limpar
    select.innerHTML = '<option value="">Selecione...</option>';
    
    // Adicionar militares cadastrados
    militaresCadastrados.forEach(m => {
        const option = document.createElement('option');
        option.value = `${m.nome} - ${m.numero_pm}`;
        option.textContent = `${m.nome} (${m.numero_pm})`;
        select.appendChild(option);
    });
}

// Preencher data de hoje no lançamento em lote
function preencherDataLancamentoHoje() {
    const input = document.getElementById('dataLancamentoLote');
    if (input) {
        input.value = new Date().toISOString().split('T')[0];
    }
}

// ====================================
// MILITARES
// ====================================

// Carregar militares do Firebase
async function carregarMilitares() {
    try {
        console.log('📥 Carregando militares...');
        
        // Carregar todos os militares (sem orderBy para evitar erro de índice)
        const militaresSnapshot = await militaresRef.get();
        
        // Se não existir nenhum, criar exemplos
        if (militaresSnapshot.empty) {
            console.log('📝 Criando militares padrão...');
            await criarMilitaresPadrao();
            // Recarregar após criar
            const novoSnapshot = await militaresRef.get();
            militaresCadastrados = novoSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } else {
            militaresCadastrados = militaresSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        
        // Ordenar localmente por nome
        militaresCadastrados.sort((a, b) => {
            const nomeA = (a.nome || '').toLowerCase();
            const nomeB = (b.nome || '').toLowerCase();
            return nomeA.localeCompare(nomeB);
        });
        
        console.log('✅ Militares carregados:', militaresCadastrados.length);
        
        // Atualizar selects
        atualizarSelectsMilitares();
        
    } catch (error) {
        console.error('❌ Erro ao carregar militares:', error);
        alert('Erro ao carregar militares: ' + error.message);
    }
}

// Criar militares padrão (EXEMPLOS - pode apagar após cadastrar os reais)
async function criarMilitaresPadrao() {
    const militaresPadrao = [
        { numero_pm: '000000-0', nome: 'Exemplo Militar 1' },
        { numero_pm: '111111-1', nome: 'Exemplo Militar 2' }
    ];
    
    for (const militar of militaresPadrao) {
        await militaresRef.add({
            ...militar,
            data_cadastro: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
}

// Atualizar selects de militares
function atualizarSelectsMilitares() {
    const selects = [
        'militarHoras',
        'filtroMilitar',
        'filtroHistMilitar'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        // Salvar valor atual
        const valorAtual = select.value;
        
        // Limpar opções (exceto primeira)
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Adicionar militares
        militaresCadastrados.forEach(militar => {
            const option = document.createElement('option');
            option.value = militar.id;
            option.textContent = `${militar.nome} (${militar.numero_pm})`;
            select.appendChild(option);
        });
        
        // Restaurar valor
        select.value = valorAtual;
    });
}

// Cadastrar novo militar
async function cadastrarMilitar(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nomeNovoMilitar').value.trim();
    const numero = document.getElementById('numeroNovoMilitar').value.trim();
    const form = document.getElementById('formCadastroMilitar');
    const editandoId = form.getAttribute('data-editing-id');
    
    if (!nome || !numero) {
        alert('❌ Preencha todos os campos obrigatórios!');
        return;
    }
    
    try {
        // MODO EDIÇÃO
        if (editandoId) {
            console.log('✏️ Editando militar:', editandoId);
            
            // Verificar se o número já existe (exceto o próprio)
            const existe = await militaresRef.where('numero_pm', '==', numero).get();
            let numeroJaUsado = false;
            
            existe.forEach(doc => {
                if (doc.id !== editandoId) {
                    numeroJaUsado = true;
                }
            });
            
            if (numeroJaUsado) {
                alert('❌ Já existe outro militar cadastrado com este número!');
                return;
            }
            
            // Atualizar militar
            await militaresRef.doc(editandoId).update({
                nome: nome,
                numero_pm: numero,
                data_atualizacao: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Militar atualizado');
            
            // Registrar log
            if (typeof logEdicao === 'function') {
                await logEdicao('militar', numero, 'dados', '', {
                    nome: nome,
                    numero_pm: numero
                });
            }
            
            alert('✅ Militar atualizado com sucesso!\n\nNome: ' + nome + '\nNúmero: ' + numero);
            
            // Limpar modo de edição
            form.removeAttribute('data-editing-id');
            const btnSubmit = form.querySelector('button[type="submit"]');
            btnSubmit.innerHTML = '✅ Cadastrar Militar';
            btnSubmit.style.background = '';
            
            const btnCancelar = document.getElementById('btnCancelarEdicao');
            if (btnCancelar) btnCancelar.remove();
            
        } 
        // MODO CADASTRO
        else {
            console.log('📝 Cadastrando militar:', nome, numero);
            
            // Verificar se já existe
            const existe = await militaresRef.where('numero_pm', '==', numero).get();
            if (!existe.empty) {
                alert('❌ Já existe um militar cadastrado com este número!');
                return;
            }
            
            // Cadastrar
            const docRef = await militaresRef.add({
                nome: nome,
                numero_pm: numero,
                data_cadastro: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Militar cadastrado com ID:', docRef.id);
            
            // Registrar log
            if (typeof logCriacao === 'function') {
                await logCriacao('militar', docRef.id, {
                    nome: nome,
                    numero_pm: numero
                });
            }
            
            alert('✅ Militar cadastrado com sucesso!\n\nNome: ' + nome + '\nNúmero: ' + numero);
        }
        
        // Limpar form
        form.reset();
        
        // Recarregar
        await carregarMilitares();
        atualizarSelectsMilitares();
        listarMilitares();
        
    } catch (error) {
        console.error('❌ Erro ao salvar militar:', error);
        alert('❌ Erro ao salvar militar:\n\n' + error.message);
    }
}

// Listar militares cadastrados
async function listarMilitares() {
    const tbody = document.getElementById('tabelaMilitares');
    tbody.innerHTML = '';
    
    if (militaresCadastrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 2rem; color: #666;">
                    Nenhum militar cadastrado
                </td>
            </tr>
        `;
        return;
    }
    
    for (const militar of militaresCadastrados) {
        // Calcular total de horas
        const horasMilitar = horasLancadas.filter(h => h.militar_id === militar.id);
        const totalMinutos = horasMilitar.reduce((acc, h) => {
            const minutos = horaParaMinutos(h.quantidade_horas);
            return acc + (h.tipo === 'extra' ? minutos : -minutos);
        }, 0);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${militar.numero_pm}</strong></td>
            <td>${militar.nome}</td>
            <td><strong>${formatarMinutosParaHora(totalMinutos)}</strong></td>
            <td>
                <button onclick="editarMilitar('${militar.id}')" class="btn-secondary" style="padding: 0.5rem 1rem; margin-right: 0.5rem;">
                    ✏️ Editar
                </button>
                <button onclick="excluirMilitar('${militar.id}', '${militar.nome}', '${militar.numero_pm}')" class="btn-secondary" style="padding: 0.5rem 1rem; background: #dc3545; border-color: #dc3545;">
                    🗑️ Excluir
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

// Editar militar
async function editarMilitar(id) {
    try {
        // Buscar dados do militar
        const militar = militaresCadastrados.find(m => m.id === id);
        
        if (!militar) {
            alert('❌ Militar não encontrado!');
            return;
        }
        
        // Preencher campos do formulário
        document.getElementById('nomeNovoMilitar').value = militar.nome;
        document.getElementById('numeroNovoMilitar').value = militar.numero_pm;
        
        // Mudar texto do botão
        const form = document.getElementById('formCadastroMilitar');
        const btnSubmit = form.querySelector('button[type="submit"]');
        const btnTextoOriginal = btnSubmit.innerHTML;
        btnSubmit.innerHTML = '💾 Salvar Alterações';
        btnSubmit.style.background = '#28a745';
        
        // Adicionar botão de cancelar
        let btnCancelar = document.getElementById('btnCancelarEdicao');
        if (!btnCancelar) {
            btnCancelar = document.createElement('button');
            btnCancelar.type = 'button';
            btnCancelar.id = 'btnCancelarEdicao';
            btnCancelar.className = 'btn-secondary';
            btnCancelar.innerHTML = '❌ Cancelar';
            btnCancelar.style.marginLeft = '1rem';
            btnSubmit.parentElement.appendChild(btnCancelar);
            
            btnCancelar.onclick = function() {
                form.reset();
                btnSubmit.innerHTML = btnTextoOriginal;
                btnSubmit.style.background = '';
                form.removeAttribute('data-editing-id');
                btnCancelar.remove();
            };
        }
        
        // Marcar formulário como "editando"
        form.setAttribute('data-editing-id', id);
        
        // Scroll para o formulário
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Focar no campo nome
        document.getElementById('nomeNovoMilitar').focus();
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados do militar:', error);
        alert('❌ Erro ao carregar dados do militar:\n\n' + error.message);
    }
}

// Excluir militar
async function excluirMilitar(id, nome, numeroPm) {
    try {
        // Verificar se tem horas lançadas
        const horasMilitar = horasLancadas.filter(h => h.militar_id === id);
        
        if (horasMilitar.length > 0) {
            const totalMinutos = horasMilitar.reduce((acc, h) => {
                const minutos = horaParaMinutos(h.quantidade_horas);
                return acc + (h.tipo === 'extra' ? minutos : -minutos);
            }, 0);
            
            const confirma = confirm(
                `⚠️ ATENÇÃO!\n\n` +
                `Este militar possui ${horasMilitar.length} lançamento(s) de horas.\n` +
                `Total: ${formatarMinutosParaHora(totalMinutos)}\n\n` +
                `Ao excluir o militar, TODOS os lançamentos também serão excluídos!\n\n` +
                `Deseja realmente excluir?\n\n` +
                `Militar: ${nome} (${numeroPm})`
            );
            
            if (!confirma) return;
        } else {
            const confirma = confirm(
                `Deseja realmente excluir o militar?\n\n` +
                `${nome} (${numeroPm})\n\n` +
                `Esta ação não pode ser desfeita!`
            );
            
            if (!confirma) return;
        }
        
        // Segunda confirmação
        const confirmacao2 = confirm(
            `ÚLTIMA CONFIRMAÇÃO!\n\n` +
            `Tem certeza que deseja excluir?\n\n` +
            `${nome} (${numeroPm})`
        );
        
        if (!confirmacao2) return;
        
        console.log('🗑️ Excluindo militar:', id);
        
        // Excluir todas as horas do militar
        if (horasMilitar.length > 0) {
            console.log(`🗑️ Excluindo ${horasMilitar.length} lançamento(s) de horas...`);
            
            const batch = db.batch();
            horasMilitar.forEach(hora => {
                const horaRef = horasRef.doc(hora.id);
                batch.delete(horaRef);
            });
            await batch.commit();
            
            console.log('✅ Lançamentos excluídos');
        }
        
        // Excluir militar
        await militaresRef.doc(id).delete();
        
        console.log('✅ Militar excluído');
        
        // Registrar log
        if (typeof logExclusao === 'function') {
            await logExclusao('militar', numeroPm, {
                nome: nome,
                numero_pm: numeroPm,
                total_horas_excluidas: horasMilitar.length
            }, 'Exclusão via Controle de Horas Extras');
        }
        
        alert(`✅ Militar excluído com sucesso!\n\n${nome} (${numeroPm})\n\n${horasMilitar.length} lançamento(s) de horas também foram excluídos.`);
        
        // Recarregar tudo
        await carregarMilitares();
        await carregarHoras();
        atualizarSelectsMilitares();
        listarMilitares();
        atualizarDashboard();
        
    } catch (error) {
        console.error('❌ Erro ao excluir militar:', error);
        alert('❌ Erro ao excluir militar:\n\n' + error.message);
    }
}

// ====================================
// LANÇAMENTO DE HORAS
// ====================================

// Calcular data de lançamento (próxima sexta após 7 dias)
function calcularDataLancamento() {
    const dataHora = document.getElementById('dataHora').value;
    if (!dataHora) return;
    
    // Data da hora + 7 dias
    const data = new Date(dataHora + 'T00:00:00');
    data.setDate(data.getDate() + 7);
    
    // Próxima sexta-feira
    const diaSemana = data.getDay(); // 0 = domingo, 5 = sexta
    const diasAteProximaSexta = (5 - diaSemana + 7) % 7;
    data.setDate(data.getDate() + diasAteProximaSexta);
    
    // Se já for sexta, não altera
    if (diasAteProximaSexta === 0 && diaSemana !== 5) {
        data.setDate(data.getDate() + 7);
    }
    
    document.getElementById('dataLancamento').value = data.toISOString().split('T')[0];
}

// Lançar horas
async function lancarHoras(e) {
    e.preventDefault();
    
    const militar_id = document.getElementById('militarHoras').value;
    const data_hora = document.getElementById('dataHora').value;
    const tipo = document.getElementById('tipoHora').value;
    const quantidade = document.getElementById('quantidadeHoras').value;
    const motivo = document.getElementById('motivoHoras').value;
    
    // Validar formato de horas (HH:MM ou HHH:MM)
    if (!quantidade.match(/^[0-9]{1,3}:[0-5][0-9]$/)) {
        alert('❌ Formato de horas inválido! Use HH:MM (ex: 02:30) ou HHH:MM (ex: 125:45)');
        return;
    }
    
    try {
        mostrarLoading('Registrando hora...');
        
        // Salvar motivo nos recentes
        salvarMotivoRecente(motivo);
        
        // Pegar tags
        const tagsInput = document.getElementById('tagsHoras')?.value || '';
        const tags = tagsInput.trim().split(/\s+/).filter(t => t.length > 0);
        
        // Dados do lançamento
        const dados = {
            militar_id,
            militar_nome: militaresCadastrados.find(m => m.id === militar_id)?.nome || '',
            militar_numero: militaresCadastrados.find(m => m.id === militar_id)?.numero_pm || '',
            
            data_hora,
            mes_ano: data_hora.substring(0, 7),
            tipo,
            quantidade_horas: quantidade,
            motivo,
            tags, // Adiciona tags
            
            // ========== NOVO: CAMPOS DE PRAZO ==========
            data_limite: calcularDiaLimiteHoras(data_hora).toISOString(),
            atrasado: estaAtrasado(data_hora, new Date()),
            dias_para_lancamento: Math.ceil((calcularDiaLimiteHoras(data_hora) - new Date()) / (1000 * 60 * 60 * 24)),
            
            data_prevista_lancamento: document.getElementById('dataLancamento').value,
            
            // Sempre inicia como pendente
            lancado_cad2: false,
            status: 'pendente',
            
            usuario_registro: sessionStorage.getItem('stic_usuario_nome') || 'Sistema',
            data_registro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await horasRef.add(dados);
        
        ocultarLoading();
        mostrarSucesso('✅ Hora registrada com sucesso! Lançar no CAD 2 na data prevista.');
        
        // Limpar form
        limparFormHoras();
        
        // Recarregar
        await carregarHoras();
        atualizarDashboard();
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro:', error);
        mostrarErro('Erro ao registrar hora: ' + error.message);
    }
}

// Limpar formulário
function limparFormHoras() {
    document.getElementById('formLancarHoras').reset();
    document.getElementById('motivoPredefinido').value = '';
    document.getElementById('previewSaldo').style.display = 'none';
    calcularDataLancamento();
}

// ====================================
// LANÇAMENTO EM LOTE
// ====================================

// Atualizar select de militares do lote
function atualizarSelectLote() {
    const select = document.getElementById('militarLote');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione...</option>';
    militaresCadastrados.forEach(m => {
        const option = document.createElement('option');
        option.value = m.id;
        option.textContent = `${m.nome} (${m.numero_pm})`;
        select.appendChild(option);
    });
}

// Gerar dias da semana no período
function gerarDiasSemana() {
    const inicio = document.getElementById('periodoInicio').value;
    const fim = document.getElementById('periodoFim').value;
    
    if (!inicio || !fim) {
        alert('❌ Preencha o período (início e fim)!');
        return;
    }
    
    const dataInicio = new Date(inicio + 'T00:00:00');
    const dataFim = new Date(fim + 'T00:00:00');
    
    if (dataFim < dataInicio) {
        alert('❌ A data final deve ser maior que a inicial!');
        return;
    }
    
    // Marca os dias da semana que têm no período
    const diasEncontrados = new Set();
    let data = new Date(dataInicio);
    while (data <= dataFim) {
        diasEncontrados.add(data.getDay());
        data.setDate(data.getDate() + 1);
    }
    
    // Marca os checkboxes
    ['diaDom', 'diaSeg', 'diaTer', 'diaQua', 'diaQui', 'diaSex', 'diaSab'].forEach((id, index) => {
        document.getElementById(id).checked = false;
    });
    
    alert(`✅ Período selecionado: ${formatarData(inicio)} a ${formatarData(fim)}\n\nMarque os dias da semana desejados e clique em "Visualizar".`);
}

// Preview do lote
function previewLote() {
    const militar_id = document.getElementById('militarLote').value;
    const tipo = document.getElementById('tipoLote').value;
    const quantidade = document.getElementById('quantidadeLote').value;
    const motivo = document.getElementById('motivoLote').value;
    
    if (!militar_id || !quantidade || !motivo) {
        alert('❌ Preencha todos os campos!');
        return;
    }
    
    // Obter datas
    const datas = obterDatasLote();
    
    if (datas.length === 0) {
        alert('❌ Nenhuma data selecionada!\n\nMarque os dias da semana OU digite datas manualmente.');
        return;
    }
    
    const militar = militaresCadastrados.find(m => m.id === militar_id);
    const totalMinutos = horaParaMinutos(quantidade) * datas.length;
    
    // Exibir preview
    document.getElementById('previewLote').style.display = 'block';
    document.getElementById('conteudoPreviewLote').innerHTML = `
        <div style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <strong>👤 Militar:</strong> ${militar.nome}<br>
            <strong>📊 Tipo:</strong> ${tipo === 'extra' ? '➕ Hora Extra' : '➖ Hora Negativa'}<br>
            <strong>⏰ Quantidade por dia:</strong> ${quantidade}<br>
            <strong>📝 Motivo:</strong> ${motivo}
        </div>
        
        <div style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <strong>📅 Datas selecionadas (${datas.length}):</strong><br>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                ${datas.map(d => `
                    <span style="background: #e8f4f8; padding: 0.25rem 0.75rem; border-radius: 5px; font-size: 0.9rem;">
                        ${formatarData(d)}
                    </span>
                `).join('')}
            </div>
        </div>
        
        <div style="background: ${tipo === 'extra' ? '#d4edda' : '#f8d7da'}; padding: 1.5rem; border-radius: 8px; text-align: center;">
            <div style="font-size: 0.9rem; color: #666; margin-bottom: 0.5rem;">Total a registrar:</div>
            <div style="font-size: 2rem; font-weight: bold; color: ${tipo === 'extra' ? '#28a745' : '#dc3545'};">
                ${tipo === 'extra' ? '+' : '-'}${formatarMinutosParaHora(totalMinutos)}
            </div>
            <div style="font-size: 0.9rem; color: #666; margin-top: 0.5rem;">
                (${datas.length} dia${datas.length > 1 ? 's' : ''} × ${quantidade} = ${formatarMinutosParaHora(totalMinutos)})
            </div>
        </div>
    `;
}

// Obter datas do lote
function obterDatasLote() {
    const datas = [];
    
    // Opção 1: Datas manuais
    const datasManual = document.getElementById('datasManual').value.trim();
    if (datasManual) {
        const partes = datasManual.split(',');
        partes.forEach(parte => {
            const data = parte.trim();
            if (data.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                const [dia, mes, ano] = data.split('/');
                datas.push(`${ano}-${mes}-${dia}`);
            }
        });
        return datas;
    }
    
    // Opção 2: Período + dias da semana
    const inicio = document.getElementById('periodoInicio').value;
    const fim = document.getElementById('periodoFim').value;
    
    if (!inicio || !fim) return [];
    
    const diasSelecionados = [];
    if (document.getElementById('diaDom').checked) diasSelecionados.push(0);
    if (document.getElementById('diaSeg').checked) diasSelecionados.push(1);
    if (document.getElementById('diaTer').checked) diasSelecionados.push(2);
    if (document.getElementById('diaQua').checked) diasSelecionados.push(3);
    if (document.getElementById('diaQui').checked) diasSelecionados.push(4);
    if (document.getElementById('diaSex').checked) diasSelecionados.push(5);
    if (document.getElementById('diaSab').checked) diasSelecionados.push(6);
    
    if (diasSelecionados.length === 0) return [];
    
    const dataInicio = new Date(inicio + 'T00:00:00');
    const dataFim = new Date(fim + 'T00:00:00');
    
    let data = new Date(dataInicio);
    while (data <= dataFim) {
        if (diasSelecionados.includes(data.getDay())) {
            const ano = data.getFullYear();
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const dia = String(data.getDate()).padStart(2, '0');
            datas.push(`${ano}-${mes}-${dia}`);
        }
        data.setDate(data.getDate() + 1);
    }
    
    return datas;
}

// Lançar lote
async function lancarLote(e) {
    e.preventDefault();
    
    const militar_id = document.getElementById('militarLote').value;
    const tipo = document.getElementById('tipoLote').value;
    const quantidade = document.getElementById('quantidadeLote').value;
    const motivo = document.getElementById('motivoLote').value;
    
    // Validar
    if (!quantidade.match(/^[0-9]{1,3}:[0-5][0-9]$/)) {
        alert('❌ Formato de horas inválido!');
        return;
    }
    
    const datas = obterDatasLote();
    if (datas.length === 0) {
        alert('❌ Selecione pelo menos uma data!');
        return;
    }
    
    if (!confirm(`✅ Confirma o registro de ${datas.length} hora(s)?\n\nTotal: ${tipo === 'extra' ? '+' : '-'}${formatarMinutosParaHora(horaParaMinutos(quantidade) * datas.length)}`)) {
        return;
    }
    
    try {
        mostrarLoading(`Registrando ${datas.length} hora(s)...`);
        
        const militar = militaresCadastrados.find(m => m.id === militar_id);
        
        // Registrar cada data
        for (const data of datas) {
            // Calcular data prevista (sexta após 7 dias)
            const dataObj = new Date(data + 'T00:00:00');
            dataObj.setDate(dataObj.getDate() + 7);
            const diaSemana = dataObj.getDay();
            const diasAteProximaSexta = (5 - diaSemana + 7) % 7;
            dataObj.setDate(dataObj.getDate() + diasAteProximaSexta);
            
            const dataPrevista = dataObj.toISOString().split('T')[0];
            
            const dados = {
                militar_id,
                militar_nome: militar.nome,
                militar_numero: militar.numero_pm,
                
                data_hora: data,
                mes_ano: data.substring(0, 7),
                tipo,
                quantidade_horas: quantidade,
                motivo,
                
                data_prevista_lancamento: dataPrevista,
                
                lancado_cad2: false,
                status: 'pendente',
                
                usuario_registro: sessionStorage.getItem('stic_usuario_nome') || 'Sistema',
                data_registro: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await horasRef.add(dados);
        }
        
        salvarMotivoRecente(motivo);
        
        ocultarLoading();
        mostrarSucesso(`✅ ${datas.length} hora(s) registrada(s) com sucesso!`);
        
        limparFormLote();
        await carregarHoras();
        atualizarDashboard();
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro:', error);
        mostrarErro('Erro ao registrar lote: ' + error.message);
    }
}

// Limpar formulário de lote
function limparFormLote() {
    document.getElementById('formLancarLote').reset();
    document.getElementById('previewLote').style.display = 'none';
    ['diaDom', 'diaSeg', 'diaTer', 'diaQua', 'diaQui', 'diaSex', 'diaSab'].forEach(id => {
        document.getElementById(id).checked = false;
    });
}

// ====================================
// CARREGAR HORAS
// ====================================

async function carregarHoras() {
    try {
        const snapshot = await horasRef.orderBy('data_hora', 'desc').get();
        horasLancadas = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Erro ao carregar horas:', error);
    }
}

// ====================================
// DASHBOARD
// ====================================

function atualizarDashboard() {
    const filtroMilitar = document.getElementById('filtroMilitar')?.value || '';
    const filtroMes = document.getElementById('filtroMes')?.value || '';
    
    // Filtrar horas
    let horasFiltradas = horasLancadas.filter(h => {
        if (filtroMilitar && h.militar_id !== filtroMilitar) return false;
        if (filtroMes && h.mes_ano !== filtroMes) return false;
        return true;
    });
    
    // Calcular totais
    let totalPositivo = 0;
    let totalNegativo = 0;
    let totalPendentes = 0;
    
    horasFiltradas.forEach(h => {
        const minutos = horaParaMinutos(h.quantidade_horas);
        
        if (h.tipo === 'extra') {
            totalPositivo += minutos;
        } else {
            totalNegativo += minutos;
        }
        
        if (h.status === 'pendente') {
            totalPendentes++;
        }
    });
    
    const saldoTotal = totalPositivo - totalNegativo;
    
    // Atualizar cards
    document.getElementById('totalPositivo').textContent = 
        '+' + formatarMinutosParaHora(totalPositivo);
    document.getElementById('totalNegativo').textContent = 
        '-' + formatarMinutosParaHora(totalNegativo);
    document.getElementById('saldoTotal').textContent = 
        formatarMinutosParaHora(saldoTotal);
    document.getElementById('totalPendentes').textContent = totalPendentes;
    
    // Tabela de totais por militar
    preencherTabelaTotaisMilitares(horasFiltradas);
    
    // Atualizar gráficos
    atualizarGraficos(horasFiltradas);
}

// Preencher tabela de totais por militar
function preencherTabelaTotaisMilitares(horas) {
    const resumo = {};
    
    horas.forEach(h => {
        if (!resumo[h.militar_id]) {
            resumo[h.militar_id] = {
                nome: h.militar_nome,
                numero: h.militar_numero,
                extras: 0,
                negativas: 0,
                pendentes: 0,
                lancados: 0,
                total: 0
            };
        }
        
        const minutos = horaParaMinutos(h.quantidade_horas);
        if (h.tipo === 'extra') {
            resumo[h.militar_id].extras += minutos;
        } else {
            resumo[h.militar_id].negativas += minutos;
        }
        
        if (h.status === 'pendente') {
            resumo[h.militar_id].pendentes++;
        } else {
            resumo[h.militar_id].lancados++;
        }
        
        resumo[h.militar_id].total++;
    });
    
    const tbody = document.getElementById('tabelaTotaisMilitares');
    
    if (Object.keys(resumo).length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: #666;">
                    Nenhum dado para exibir
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = Object.values(resumo).map(m => {
        const saldo = m.extras - m.negativas;
        return `
            <tr style="background: ${saldo < 0 ? '#fff5f5' : saldo > 0 ? '#f0fff4' : 'white'};">
                <td>
                    <strong>${m.nome}</strong><br>
                    <small style="color: #666;">${m.numero}</small>
                </td>
                <td style="color: #28a745; font-weight: bold;">
                    +${formatarMinutosParaHora(m.extras)}
                </td>
                <td style="color: #dc3545; font-weight: bold;">
                    -${formatarMinutosParaHora(m.negativas)}
                </td>
                <td style="font-weight: bold; font-size: 1.1rem; color: ${saldo >= 0 ? '#28a745' : '#dc3545'};">
                    ${formatarMinutosParaHora(saldo)}
                </td>
                <td style="text-align: center;">
                    ${m.pendentes > 0 ? `<span style="background: #fff3cd; padding: 0.25rem 0.5rem; border-radius: 5px;">${m.pendentes}</span>` : '-'}
                </td>
                <td style="text-align: center;">
                    ${m.lancados > 0 ? `<span style="background: #d4edda; padding: 0.25rem 0.5rem; border-radius: 5px;">${m.lancados}</span>` : '-'}
                </td>
                <td style="text-align: center; font-weight: bold;">
                    ${m.total}
                </td>
            </tr>
        `;
    }).join('');
}

// Limpar filtros
function limparFiltros() {
    document.getElementById('filtroMilitar').value = '';
    document.getElementById('filtroMes').value = '';
    preencherDataAtual();
    atualizarDashboard();
}

// Atualizar gráficos
function atualizarGraficos(horas) {
    // Gráfico por militar
    const porMilitar = {};
    horas.forEach(h => {
        if (!porMilitar[h.militar_nome]) {
            porMilitar[h.militar_nome] = 0;
        }
        const minutos = horaParaMinutos(h.quantidade_horas);
        porMilitar[h.militar_nome] += h.tipo === 'extra' ? minutos : -minutos;
    });
    
    const ctxMilitares = document.getElementById('graficoMilitares');
    if (graficos.militares) graficos.militares.destroy();
    
    graficos.militares = new Chart(ctxMilitares, {
        type: 'bar',
        data: {
            labels: Object.keys(porMilitar),
            datasets: [{
                label: 'Total de Horas',
                data: Object.values(porMilitar).map(m => m / 60),
                backgroundColor: '#003366'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Horas' }
                }
            }
        }
    });
    
    // Gráfico mensal
    const porMes = {};
    horas.forEach(h => {
        if (!porMes[h.mes_ano]) {
            porMes[h.mes_ano] = { extras: 0, negativas: 0 };
        }
        const minutos = horaParaMinutos(h.quantidade_horas);
        if (h.tipo === 'extra') {
            porMes[h.mes_ano].extras += minutos;
        } else {
            porMes[h.mes_ano].negativas += minutos;
        }
    });
    
    const mesesOrdenados = Object.keys(porMes).sort();
    
    const ctxMensal = document.getElementById('graficoMensal');
    if (graficos.mensal) graficos.mensal.destroy();
    
    graficos.mensal = new Chart(ctxMensal, {
        type: 'line',
        data: {
            labels: mesesOrdenados.map(m => {
                const [ano, mes] = m.split('-');
                return `${mes}/${ano}`;
            }),
            datasets: [
                {
                    label: 'Horas Extras',
                    data: mesesOrdenados.map(m => porMes[m].extras / 60),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)'
                },
                {
                    label: 'Horas Negativas',
                    data: mesesOrdenados.map(m => porMes[m].negativas / 60),
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Horas' }
                }
            }
        }
    });
}

// ====================================
// LANÇAMENTO SEMANAL (SEXTA-FEIRA)
// ====================================

// Carregar lista semanal
async function carregarListaSemanal() {
    const filtroSemana = document.getElementById('filtroProximaSexta')?.checked || false;
    const filtroAtrasados = document.getElementById('filtroAtrasados')?.checked || false;
    
    // Filtrar pendentes
    let pendentes = horasLancadas.filter(h => h.status === 'pendente');
    
    // Filtrar por data
    const hoje = new Date();
    if (filtroSemana && !filtroAtrasados) {
        // Só desta semana (próxima sexta)
        const proximaSexta = new Date(hoje);
        proximaSexta.setDate(hoje.getDate() + ((5 - hoje.getDay() + 7) % 7));
        
        pendentes = pendentes.filter(h => {
            const dataPrev = new Date(h.data_prevista_lancamento + 'T00:00:00');
            return dataPrev <= proximaSexta;
        });
    }
    
    if (filtroAtrasados) {
        // Só atrasados
        pendentes = pendentes.filter(h => {
            const dataPrev = new Date(h.data_prevista_lancamento + 'T00:00:00');
            return dataPrev < hoje;
        });
    }
    
    // Ordenar por data prevista
    pendentes.sort((a, b) => {
        return new Date(a.data_prevista_lancamento) - new Date(b.data_prevista_lancamento);
    });
    
    // Atualizar contadores
    document.getElementById('qtdPendentes').textContent = pendentes.length;
    document.getElementById('qtdSelecionados').textContent = 
        document.querySelectorAll('.checkbox-hora:checked').length || 0;
    
    // Contar lançados hoje
    const lancadosHoje = horasLancadas.filter(h => {
        if (!h.data_lancamento_cad2) return false;
        const dataLanc = new Date(h.data_lancamento_cad2 + 'T00:00:00');
        return dataLanc.toDateString() === hoje.toDateString();
    }).length;
    document.getElementById('qtdLancadosHoje').textContent = lancadosHoje;
    
    // Renderizar lista
    const lista = document.getElementById('listaPendentes');
    
    if (pendentes.length === 0) {
        lista.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #666;">
                <h3>🎉 Nenhuma hora pendente!</h3>
                <p>Todas as horas foram lançadas no CAD 2.</p>
            </div>
        `;
        return;
    }
    
    lista.innerHTML = pendentes.map(h => {
        const dataPrev = new Date(h.data_prevista_lancamento + 'T00:00:00');
        const atrasado = dataPrev < hoje;
        
        return `
            <div class="hora-pendente-card" data-id="${h.id}" style="
                background: white;
                border: 2px solid ${atrasado ? '#dc3545' : '#ddd'};
                border-radius: 10px;
                padding: 1.5rem;
                margin-bottom: 1rem;
                display: grid;
                grid-template-columns: 40px 1fr;
                gap: 1rem;
                transition: all 0.3s;
                ${atrasado ? 'background: #fff5f5;' : ''}
            ">
                <div style="display: flex; align-items: center;">
                    <input type="checkbox" class="checkbox-hora" data-id="${h.id}" 
                        onchange="atualizarContadorSelecionados()"
                        style="width: 24px; height: 24px; cursor: pointer;">
                </div>
                
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                        <div>
                            <h4 style="margin: 0; color: #003366;">
                                ${h.militar_nome} <small style="color: #666;">(${h.militar_numero})</small>
                            </h4>
                            <div style="margin-top: 0.25rem; color: #666; font-size: 0.9rem;">
                                📅 ${formatarData(h.data_hora)} • 
                                ⏰ <strong style="color: ${h.tipo === 'extra' ? '#28a745' : '#dc3545'};">
                                    ${h.tipo === 'extra' ? '+' : '-'}${h.quantidade_horas}
                                </strong>
                            </div>
                        </div>
                        
                        <div style="text-align: right;">
                            ${atrasado ? `
                                <span style="background: #dc3545; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">
                                    ⚠️ ATRASADO
                                </span>
                            ` : ''}
                            <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                                📆 Lançar em: <strong>${formatarData(h.data_prevista_lancamento)}</strong>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: #f8f9fa; padding: 0.75rem; border-radius: 5px; margin-top: 0.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
                            <div style="flex: 1;">
                                <strong>📝 Motivo:</strong>
                                <div id="motivo-${h.id}" style="margin-top: 0.5rem; padding: 0.5rem; background: white; border: 1px solid #ddd; border-radius: 4px; font-family: monospace;">
                                    ${h.motivo}
                                </div>
                            </div>
                            <button 
                                onclick="copiarMotivo('${h.id}', '${h.motivo.replace(/'/g, "\\'")}'); event.stopPropagation();" 
                                style="
                                    padding: 0.5rem 1rem;
                                    background: #007bff;
                                    color: white;
                                    border: none;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-weight: 600;
                                    white-space: nowrap;
                                    transition: all 0.2s;
                                    box-shadow: 0 2px 4px rgba(0,123,255,0.3);
                                "
                                onmouseover="this.style.background='#0056b3'; this.style.transform='scale(1.05)';"
                                onmouseout="this.style.background='#007bff'; this.style.transform='scale(1)';"
                                title="Copiar motivo para colar no CAD 2">
                                📋 Copiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========== COPIAR MOTIVO PARA CAD 2 ==========
async function copiarMotivo(horaId, motivo) {
    try {
        // Copiar para clipboard
        await navigator.clipboard.writeText(motivo);
        
        // Feedback visual - mudar botão temporariamente
        const todosCards = document.querySelectorAll('[data-id]');
        todosCards.forEach(card => {
            if (card.getAttribute('data-id') === horaId) {
                const botao = card.querySelector('button[onclick*="copiarMotivo"]');
                if (botao) {
                    const textoOriginal = botao.innerHTML;
                    botao.innerHTML = '✅ Copiado!';
                    botao.style.background = '#28a745';
                    
                    setTimeout(() => {
                        botao.innerHTML = textoOriginal;
                        botao.style.background = '#007bff';
                    }, 2000);
                }
            }
        });
        
        console.log('✅ Motivo copiado:', motivo);
        
    } catch (error) {
        console.error('❌ Erro ao copiar:', error);
        alert('Erro ao copiar motivo. Tente novamente.');
    }
}

// Atualizar contador de selecionados
function atualizarContadorSelecionados() {
    const selecionados = document.querySelectorAll('.checkbox-hora:checked').length;
    document.getElementById('qtdSelecionados').textContent = selecionados;
    if (document.getElementById('qtdConfirmar')) {
        document.getElementById('qtdConfirmar').textContent = selecionados;
    }
}

// Marcar todos os selecionados
function marcarTodosSelecionados() {
    const checkboxes = document.querySelectorAll('.checkbox-hora');
    const todosMarcados = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !todosMarcados;
    });
    
    atualizarContadorSelecionados();
}

// Lançar horas selecionadas em lote
async function lancarSelecionados() {
    const responsavel = document.getElementById('responsavelLote').value;
    const dataLancamento = document.getElementById('dataLancamentoLote').value;
    
    if (!responsavel) {
        alert('❌ Selecione o responsável pelo lançamento!');
        return;
    }
    
    if (!dataLancamento) {
        alert('❌ Informe a data do lançamento!');
        return;
    }
    
    const selecionados = Array.from(document.querySelectorAll('.checkbox-hora:checked'))
        .map(cb => cb.dataset.id);
    
    if (selecionados.length === 0) {
        alert('❌ Selecione pelo menos uma hora para lançar!');
        return;
    }
    
    if (!confirm(`✅ Confirma o lançamento de ${selecionados.length} hora(s) no CAD 2?\n\n📅 Data: ${formatarData(dataLancamento)}\n👨‍💼 Responsável: ${responsavel}`)) {
        return;
    }
    
    try {
        mostrarLoading(`Lançando ${selecionados.length} hora(s)...`);
        
        // Atualizar cada hora
        for (const id of selecionados) {
            await horasRef.doc(id).update({
                status: 'lancado',
                lancado_cad2: true,
                data_lancamento_cad2: dataLancamento,
                responsavel_lancamento: responsavel
            });
        }
        
        ocultarLoading();
        mostrarSucesso(`✅ ${selecionados.length} hora(s) lançada(s) com sucesso!`);
        
        // Recarregar
        await carregarHoras();
        carregarListaSemanal();
        atualizarDashboard();
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro:', error);
        mostrarErro('Erro ao lançar horas: ' + error.message);
    }
}

// ====================================
// HISTÓRICO
// ====================================

function carregarHistorico() {
    const filtroMilitar = document.getElementById('filtroHistMilitar')?.value || '';
    const filtroMes = document.getElementById('filtroHistMes')?.value || '';
    const filtroTipo = document.getElementById('filtroHistTipo')?.value || '';
    const filtroStatus = document.getElementById('filtroHistStatus')?.value || '';
    
    // Filtrar
    let horasFiltradas = horasLancadas.filter(h => {
        if (filtroMilitar && h.militar_id !== filtroMilitar) return false;
        if (filtroMes && h.mes_ano !== filtroMes) return false;
        if (filtroTipo && h.tipo !== filtroTipo) return false;
        if (filtroStatus && h.status !== filtroStatus) return false;
        return true;
    });
    
    // Armazenar para busca
    todasHoras = horasFiltradas;
    
    // Renderizar
    renderizarHistorico(horasFiltradas);
}

// ====================================
// CÁLCULO DE SOBREAVISO
// ====================================

function calcularSobreaviso() {
    const inicio = document.getElementById('sobreHoraInicio').value;
    const fim = document.getElementById('sobreHoraFim').value;
    const diaSeguinte = document.getElementById('sobreDiaSeguinte').checked;
    
    if (!inicio || !fim) {
        document.getElementById('resultadoSobreaviso').textContent = 
            'Preencha os horários acima';
        return;
    }
    
    // Calcular total de minutos
    const minutosInicio = horaParaMinutos(inicio);
    const minutosFim = horaParaMinutos(fim);
    
    let totalMinutos;
    
    if (diaSeguinte) {
        // Termina no dia seguinte: calcula atravessando meia-noite
        // Ex: 20:00 às 04:00 = (24:00 - 20:00) + 04:00 = 4h + 4h = 8h
        totalMinutos = (24 * 60 - minutosInicio) + minutosFim;
    } else {
        // Mesmo dia
        if (minutosFim < minutosInicio) {
            // Aviso se fim < início mas não marcou dia seguinte
            document.getElementById('resultadoSobreaviso').innerHTML = `
                <span style="color: #dc3545;">
                    ⚠️ Atenção: Hora final é menor que inicial!<br>
                    Marque "Termina no dia seguinte" se for o caso.
                </span>
            `;
            return;
        }
        totalMinutos = minutosFim - minutosInicio;
    }
    
    // Sobreaviso = total / 4 (arredondar para minutos inteiros)
    const sobreaviso = Math.round(totalMinutos / 4);
    
    document.getElementById('resultadoSobreaviso').innerHTML = `
        <div style="line-height: 1.8;">
            <div>📊 <strong>Total de horas:</strong> ${formatarMinutosParaHora(totalMinutos)}</div>
            <div style="margin-top: 0.5rem; padding: 0.75rem; background: #d4edda; border-radius: 5px;">
                ✅ <strong>Valor a lançar:</strong> 
                <span style="font-size: 1.3rem; color: #28a745; font-weight: bold;">
                    ${formatarMinutosParaHora(sobreaviso)}
                </span>
            </div>
            <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                💡 Cálculo: ${formatarMinutosParaHora(totalMinutos)} ÷ 4 = ${formatarMinutosParaHora(sobreaviso)}
            </div>
        </div>
    `;
}

function calcularSobreComTrabalho() {
    const inicio = document.getElementById('sobreTrabInicio').value;
    const fim = document.getElementById('sobreTrabFim').value;
    const almoco = document.getElementById('sobreTrabAlmoco').value;
    const diaSeguinte = document.getElementById('sobreTrabDiaSeguinte').checked;
    
    if (!inicio || !fim) {
        document.getElementById('resultadoSobreComTrabalho').textContent = 
            'Preencha os horários acima';
        return;
    }
    
    // Total trabalhado
    const minutosInicio = horaParaMinutos(inicio);
    const minutosFim = horaParaMinutos(fim);
    const minutosAlmoco = horaParaMinutos(almoco);
    
    let totalTrabalhado;
    
    if (diaSeguinte) {
        // Turno atravessa meia-noite
        totalTrabalhado = (24 * 60 - minutosInicio) + minutosFim - minutosAlmoco;
    } else {
        // Mesmo dia
        if (minutosFim < minutosInicio) {
            document.getElementById('resultadoSobreComTrabalho').innerHTML = `
                <span style="color: #dc3545;">
                    ⚠️ Atenção: Hora final é menor que inicial!<br>
                    Marque "Turno termina no dia seguinte" se for o caso.
                </span>
            `;
            return;
        }
        totalTrabalhado = minutosFim - minutosInicio - minutosAlmoco;
    }
    
    // 24 horas - horas trabalhadas = sobreaviso
    const sobreTotal = (24 * 60) - totalTrabalhado;
    
    // Sobreaviso / 4 (arredondar para minutos inteiros)
    const sobreaviso = Math.round(sobreTotal / 4);
    
    document.getElementById('resultadoSobreComTrabalho').innerHTML = `
        <div style="line-height: 1.8;">
            <div>💼 <strong>Trabalhou:</strong> ${formatarMinutosParaHora(totalTrabalhado)}</div>
            <div>🌙 <strong>Sobreaviso:</strong> ${formatarMinutosParaHora(sobreTotal)}</div>
            <div style="margin-top: 0.5rem; padding: 0.75rem; background: #d4edda; border-radius: 5px;">
                ✅ <strong>Valor a lançar:</strong> 
                <span style="font-size: 1.3rem; color: #28a745; font-weight: bold;">
                    ${formatarMinutosParaHora(sobreaviso)}
                </span>
            </div>
            <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">
                💡 Cálculo: (24h - ${formatarMinutosParaHora(totalTrabalhado)}) ÷ 4 = ${formatarMinutosParaHora(sobreaviso)}
            </div>
        </div>
    `;
}

// ====================================
// FUNÇÕES AUXILIARES
// ====================================

// ====================================
// FORMATAÇÃO AUTOMÁTICA DE HORAS
// ====================================

// Formatar horas automaticamente enquanto digita (0230 → 02:30)
function formatarHoras(input) {
    let valor = input.value.replace(/\D/g, ''); // Remove tudo que não é número
    
    if (valor.length === 0) {
        input.value = '';
        return;
    }
    
    // Limita a 5 dígitos (HHH:MM)
    if (valor.length > 5) {
        valor = valor.substring(0, 5);
    }
    
    // Formata baseado na quantidade de dígitos
    if (valor.length <= 2) {
        // 1 ou 2 dígitos: só números
        input.value = valor;
    } else if (valor.length === 3) {
        // 3 dígitos: H:MM
        input.value = valor[0] + ':' + valor.substring(1);
    } else if (valor.length === 4) {
        // 4 dígitos: HH:MM
        input.value = valor.substring(0, 2) + ':' + valor.substring(2);
    } else {
        // 5 dígitos: HHH:MM
        input.value = valor.substring(0, 3) + ':' + valor.substring(3);
    }
    
    // Validar minutos (não pode ser > 59)
    const partes = input.value.split(':');
    if (partes.length === 2 && partes[1].length === 2) {
        let minutos = parseInt(partes[1]);
        if (minutos > 59) {
            minutos = 59;
            input.value = partes[0] + ':' + String(minutos).padStart(2, '0');
        }
    }
}

// ====================================
// UTILITÁRIOS DE CONVERSÃO
// ====================================

// Converter hora (HH:MM ou HHH:MM) para minutos
function horaParaMinutos(hora) {
    if (!hora) return 0;
    const partes = hora.split(':');
    if (partes.length < 2) return 0;
    const h = parseInt(partes[0]) || 0;
    const m = parseInt(partes[1]) || 0;
    return (h * 60) + m;
}

// Converter minutos para hora (HH:MM)
function formatarMinutosParaHora(minutos) {
    const sinal = minutos < 0 ? '-' : '';
    const abs = Math.abs(minutos);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return `${sinal}${h}:${m.toString().padStart(2, '0')}`;
}

// Formatardata
function formatarData(data) {
    if (!data) return '-';
    const d = new Date(data + 'T00:00:00');
    return d.toLocaleDateString('pt-BR');
}

// ====================================
// TAGS E CATEGORIAS
// ====================================

const tagsSugeridas = [
    'plantao', '2bpm', 'stic', 'sobreaviso', 'folga', 'consulta', 
    'curso', 'viagem', 'urgente', 'compensacao', 'diurno', 'noturno',
    '1bpm', '3bpm', '4bpm', '5bpm', '6bpm', '7bpm'
];

// Mostrar tags sugeridas
function mostrarTagsSugeridas() {
    const container = document.getElementById('tagsSugeridas');
    if (!container) return;
    
    container.innerHTML = tagsSugeridas.map(tag => `
        <button type="button" 
            onclick="adicionarTag('${tag}')"
            style="
                background: #e8f4f8;
                border: 1px solid #0066cc;
                padding: 0.25rem 0.75rem;
                border-radius: 15px;
                cursor: pointer;
                font-size: 0.85rem;
                transition: all 0.2s;
            "
            onmouseover="this.style.background='#0066cc'; this.style.color='white';"
            onmouseout="this.style.background='#e8f4f8'; this.style.color='black';"
            title="Clique para adicionar">
            #${tag}
        </button>
    `).join('');
}

// Adicionar tag ao campo
function adicionarTag(tag) {
    const input = document.getElementById('tagsHoras');
    const atual = input.value.trim();
    
    // Verifica se já existe
    const tags = atual.split(/\s+/).filter(t => t.length > 0);
    if (tags.includes(tag)) {
        return; // Já tem
    }
    
    // Adiciona
    input.value = atual ? `${atual} ${tag}` : tag;
}

// ====================================
// MODO ESCURO
// ====================================

function toggleModoEscuro() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark-mode');
    const btn = document.getElementById('btnModoEscuro');
    
    // Salvar preferência
    localStorage.setItem('modoEscuro', isDark ? 'true' : 'false');
    
    // Atualizar botão
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.title = isDark ? 'Modo claro' : 'Modo escuro';
}

// Carregar preferência de modo escuro
function carregarModoEscuro() {
    const preferencia = localStorage.getItem('modoEscuro');
    if (preferencia === 'true') {
        document.documentElement.classList.add('dark-mode');
        const btn = document.getElementById('btnModoEscuro');
        if (btn) {
            btn.textContent = '☀️';
            btn.title = 'Modo claro';
        }
    }
}

// ====================================
// ATALHOS DE TECLADO
// ====================================

// Configurar atalhos
function configurarAtalhos() {
    document.addEventListener('keydown', function(e) {
        // Ctrl + número (abas)
        if (e.ctrlKey && !e.shiftKey && !e.altKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    document.querySelector('[onclick="abrirAba(\'dashboard\')"]').click();
                    break;
                case '2':
                    e.preventDefault();
                    document.querySelector('[onclick="abrirAba(\'lancar\')"]').click();
                    break;
                case '3':
                    e.preventDefault();
                    document.querySelector('[onclick="abrirAba(\'lote\')"]').click();
                    break;
                case '4':
                    e.preventDefault();
                    document.querySelector('[onclick="abrirAba(\'semanal\')"]').click();
                    break;
                case '5':
                    e.preventDefault();
                    document.querySelector('[onclick="abrirAba(\'historico\')"]').click();
                    break;
                case '/':
                    e.preventDefault();
                    mostrarAtalhos();
                    break;
                case 'f':
                case 'F':
                    // Ctrl+F: focar busca
                    const busca = document.getElementById('buscaGlobal');
                    if (busca && busca.offsetParent !== null) {
                        e.preventDefault();
                        busca.focus();
                    }
                    break;
            }
        }
    });
}

// Mostrar lista de atalhos
function mostrarAtalhos() {
    const html = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        " onclick="this.remove()">
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 10px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            " onclick="event.stopPropagation()">
                <h2 style="margin-top: 0;">⌨️ Atalhos de Teclado</h2>
                
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="color: #003366; margin-bottom: 0.5rem;">📑 Navegação</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;"><code>Ctrl + 1</code></td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">Dashboard</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;"><code>Ctrl + 2</code></td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">Lançar Hora</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;"><code>Ctrl + 3</code></td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">Lançar em Lote</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;"><code>Ctrl + 4</code></td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">Lançamento Semanal</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;"><code>Ctrl + 5</code></td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">Histórico</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <h3 style="color: #003366; margin-bottom: 0.5rem;">🔍 Ações</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;"><code>Ctrl + F</code></td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">Buscar no histórico</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;"><code>Ctrl + /</code></td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #eee;">Mostrar esta ajuda</td>
                        </tr>
                    </table>
                </div>

                <div style="text-align: center; margin-top: 2rem;">
                    <button onclick="this.closest('div[onclick]').remove()" class="btn-primary">
                        ✅ Entendi
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

// ====================================
// NOTIFICAÇÕES
// ====================================

// Solicitar permissão de notificações
async function solicitarPermissaoNotificacoes() {
    if (!('Notification' in window)) {
        console.log('Notificações não suportadas neste navegador');
        return false;
    }
    
    if (Notification.permission === 'granted') {
        return true;
    }
    
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    
    return false;
}

// Enviar notificação
function enviarNotificacao(titulo, mensagem, icone = '🔔') {
    if (Notification.permission === 'granted') {
        new Notification(titulo, {
            body: mensagem,
            icon: icone,
            badge: icone
        });
    }
}

// Verificar horas pendentes (toda sexta)
function verificarHorasPendentes() {
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    
    // Se é sexta (5)
    if (diaSemana === 5) {
        const pendentes = horasLancadas.filter(h => h.status === 'pendente');
        
        if (pendentes.length > 0) {
            enviarNotificacao(
                '⏰ Lembrete: Horas Pendentes!',
                `Você tem ${pendentes.length} hora(s) pendente(s) para lançar no CAD 2 hoje!`
            );
        }
    }
}

// Verificar horas atrasadas
function verificarHorasAtrasadas() {
    const hoje = new Date().toISOString().split('T')[0];
    const atrasadas = horasLancadas.filter(h => 
        h.status === 'pendente' && h.data_prevista_lancamento < hoje
    );
    
    if (atrasadas.length > 0) {
        enviarNotificacao(
            '⚠️ Atenção: Horas Atrasadas!',
            `Você tem ${atrasadas.length} hora(s) atrasada(s) para lançar!`
        );
    }
}

// Inicializar notificações
async function inicializarNotificacoes() {
    const permissao = await solicitarPermissaoNotificacoes();
    
    if (permissao) {
        // Verificar horas pendentes na sexta
        verificarHorasPendentes();
        
        // Verificar horas atrasadas
        verificarHorasAtrasadas();
        
        // Verificar a cada hora
        setInterval(() => {
            verificarHorasPendentes();
            verificarHorasAtrasadas();
        }, 60 * 60 * 1000); // 1 hora
    }
}


// ====================================
// INICIALIZAÇÃO COM NOVAS FUNCIONALIDADES
// ====================================

// Executar ao carregar página
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar mobile primeiro
    inicializarMobile();
    
    // Carregar modo escuro
    carregarModoEscuro();
    
    // Configurar atalhos
    configurarAtalhos();
    
    // Mostrar tags sugeridas
    setTimeout(mostrarTagsSugeridas, 500);
    
    // Solicitar permissão de notificações (só pede, não força)
    setTimeout(() => {
        if (localStorage.getItem('notificacoesPermitidas') !== 'false') {
            solicitarPermissaoNotificacoes();
        }
    }, 2000);
    
    console.log('✅ Funcionalidades extras carregadas!');
    console.log('📱 Mobile: ' + (isMobile() ? 'SIM' : 'NÃO'));
});


// ====================================
// MELHORIAS MOBILE
// ====================================

// Detectar se é mobile
function isMobile() {
    return window.innerWidth <= 768;
}

// Mostrar dica de scroll nas tabs
function mostrarDicaScrollTabs() {
    if (isMobile()) {
        const dica = document.getElementById('dicaScrollTabs');
        if (dica) {
            dica.style.display = 'block';
            
            // Esconder após 5 segundos
            setTimeout(() => {
                dica.style.opacity = '0';
                dica.style.transition = 'opacity 1s';
                setTimeout(() => {
                    dica.style.display = 'none';
                }, 1000);
            }, 5000);
        }
    }
}

// Ajustar viewport para mobile
function ajustarViewportMobile() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && isMobile()) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
    }
}

// Scroll suave para tab ativa (mobile)
function scrollParaTabAtiva() {
    if (isMobile()) {
        const tabAtiva = document.querySelector('.tab.active');
        const tabsContainer = document.getElementById('tabsContainer');
        
        if (tabAtiva && tabsContainer) {
            // Scroll suave para centralizar tab ativa
            const tabOffset = tabAtiva.offsetLeft;
            const tabWidth = tabAtiva.offsetWidth;
            const containerWidth = tabsContainer.offsetWidth;
            
            tabsContainer.scrollTo({
                left: tabOffset - (containerWidth / 2) + (tabWidth / 2),
                behavior: 'smooth'
            });
        }
    }
}

// Melhorar clique em elementos pequenos no mobile
function melhorarClicksMobile() {
    if (isMobile()) {
        // Aumentar área de clique dos botões pequenos
        const botoesSmall = document.querySelectorAll('button, a, input[type="checkbox"], input[type="radio"]');
        botoesSmall.forEach(btn => {
            btn.style.minHeight = '44px'; // Padrão iOS/Android
        });
    }
}

// Inicializar melhorias mobile
function inicializarMobile() {
    ajustarViewportMobile();
    ajustarLayoutMobile();
    melhorarClicksMobile();
    
    // Ao mudar de tab, scroll para ela
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            setTimeout(scrollParaTabAtiva, 100);
        });
    });
    
    // Listener para redimensionamento
    window.addEventListener('resize', () => {
        ajustarLayoutMobile();
        melhorarClicksMobile();
    });
}


// ====================================
// MENU HAMBÚRGUER MOBILE
// ====================================

// Toggle menu mobile
function toggleMenuMobile() {
    const menu = document.getElementById('menuMobileOpcoes');
    const icon = document.getElementById('menuIcon');
    
    if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'block';
        icon.textContent = '✕';
    } else {
        menu.style.display = 'none';
        icon.textContent = '☰';
    }
}

// Selecionar aba pelo menu mobile
function selecionarAba(aba) {
    // Atualizar texto do botão
    const textos = {
        'dashboard': '📊 Dashboard',
        'lancar': '➕ Lançar Hora',
        'lote': '🚀 Lançar em Lote',
        'semanal': '📅 Lançamento Semanal',
        'historico': '📋 Histórico',
        'sobreaviso': '🌙 Sobreaviso',
        'militares': '👥 Militares'
    };
    
    document.getElementById('abaAtualTexto').textContent = textos[aba];
    
    // Atualizar classe active nas opções
    document.querySelectorAll('.opcao-menu-mobile').forEach(opcao => {
        opcao.classList.remove('active');
        opcao.style.background = 'white';
    });
    
    const opcaoAtiva = Array.from(document.querySelectorAll('.opcao-menu-mobile'))
        .find(el => el.textContent.trim() === textos[aba]);
    
    if (opcaoAtiva) {
        opcaoAtiva.classList.add('active');
        opcaoAtiva.style.background = '#e8f4f8';
    }
    
    // Chamar função de abrir aba normal
    const tabBtn = document.querySelector(`[onclick="abrirAba('${aba}')"]`);
    if (tabBtn) {
        tabBtn.click();
    }
}

// Mostrar menu mobile ou tabs normais
function ajustarLayoutMobile() {
    const menuMobile = document.getElementById('menuMobile');
    const tabs = document.getElementById('tabsContainer');
    const dicaScroll = document.getElementById('dicaScrollTabs');
    
    if (isMobile()) {
        // Telas pequenas: mostrar menu hambúrguer
        if (window.innerWidth <= 480) {
            menuMobile.style.display = 'block';
            tabs.style.display = 'none';
            if (dicaScroll) dicaScroll.style.display = 'none';
        } else {
            // Telas médias: tabs com scroll
            menuMobile.style.display = 'none';
            tabs.style.display = 'flex';
            mostrarDicaScrollTabs();
        }
    } else {
        // Desktop: tabs normais
        menuMobile.style.display = 'none';
        tabs.style.display = 'flex';
        if (dicaScroll) dicaScroll.style.display = 'none';
    }
}

