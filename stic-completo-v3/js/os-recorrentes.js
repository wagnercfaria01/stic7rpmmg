/**
 * ════════════════════════════════════════════════════════════
 * SISTEMA DE ORDENS DE SERVIÇO RECORRENTES
 * Cria OS automaticamente em dias e horários definidos
 * ════════════════════════════════════════════════════════════
 */

// Referência do Firebase
const db = firebase.firestore();

/**
 * Verificar e criar OS recorrentes do dia
 * Chamado automaticamente ao abrir o sistema
 */
async function verificarOSRecorrentesDoDia() {
    try {
        console.log('🔄 Verificando OS recorrentes do dia...');
        
        const hoje = new Date();
        const diaSemana = hoje.getDay(); // 0=dom, 1=seg, ..., 6=sab
        const dataHoje = hoje.toISOString().split('T')[0]; // 2026-01-30
        const horaAtual = hoje.toTimeString().split(' ')[0].substring(0, 5); // 08:30
        
        console.log(`📅 Hoje: ${dataHoje} (dia ${diaSemana})`);
        console.log(`🕐 Hora: ${horaAtual}`);
        
        // Buscar OS recorrentes ativas
        const snapshot = await db.collection('os_recorrentes')
            .where('ativa', '==', true)
            .get();
        
        if (snapshot.empty) {
            console.log('ℹ️ Nenhuma OS recorrente configurada');
            return;
        }
        
        console.log(`📋 ${snapshot.size} OS recorrentes encontradas`);
        
        // Processar cada OS recorrente
        for (const doc of snapshot.docs) {
            const recorrente = { id: doc.id, ...doc.data() };
            
            // Verificar se é dia de criar esta OS
            if (!recorrente.dias_semana || !recorrente.dias_semana.includes(diaSemana)) {
                console.log(`⏭️ ${recorrente.titulo}: Não é dia de criar (hoje=${diaSemana})`);
                continue;
            }
            
            // Verificar se já passou o horário de início
            if (horaAtual < recorrente.horario_inicio) {
                console.log(`⏰ ${recorrente.titulo}: Ainda não chegou horário (${recorrente.horario_inicio})`);
                continue;
            }
            
            // Verificar se já existe OS desta recorrência hoje
            const osHoje = await db.collection('ordens_servico')
                .where('recorrente_id', '==', recorrente.id)
                .where('data_criacao_str', '==', dataHoje)
                .limit(1)
                .get();
            
            if (!osHoje.empty) {
                console.log(`✅ ${recorrente.titulo}: Já foi criada hoje`);
                continue;
            }
            
            // CRIAR OS AUTOMATICAMENTE!
            await criarOSAutomatica(recorrente, dataHoje, hoje);
        }
        
        console.log('✅ Verificação de OS recorrentes concluída!');
        
    } catch (error) {
        console.error('❌ Erro ao verificar OS recorrentes:', error);
    }
}

/**
 * Criar OS automática baseada na recorrente
 */
async function criarOSAutomatica(recorrente, dataHoje, hoje) {
    try {
        console.log(`🆕 Criando OS automática: ${recorrente.titulo}`);
        
        // Gerar número da OS
        const numero = await gerarNumeroOS();
        
        // Montar dados da OS
        const osData = {
            numero: numero,
            tipo_servico: recorrente.tipo_servico || 'Atendimento presencial',
            tipo_equipamento: recorrente.tipo_equipamento || 'Não se aplica',
            descricao: recorrente.descricao || '',
            unidade: recorrente.unidade || '',
            local: recorrente.local || recorrente.unidade || '',
            solicitante: recorrente.solicitante || 'Sistema Automático',
            militar_nome: recorrente.responsavel || currentUser.displayName,
            status: 'aberta',
            prioridade: recorrente.prioridade || 'normal',
            
            // Datas
            data_abertura: firebase.firestore.Timestamp.fromDate(hoje),
            data_previsao: calcularDataPrevisao(hoje, recorrente.dias_previsao || 1),
            data_criacao_str: dataHoje, // Para filtro
            
            // Vinculação com recorrente
            recorrente_id: recorrente.id,
            criada_automaticamente: true,
            
            // Metadados
            criado_por: 'Sistema - OS Recorrente',
            criado_em: firebase.firestore.Timestamp.now(),
            
            // Histórico
            historico: [{
                acao: 'OS criada automaticamente',
                data: firebase.firestore.Timestamp.now(),
                usuario: 'Sistema',
                detalhes: `OS recorrente: ${recorrente.titulo}`
            }]
        };
        
        // Salvar no Firebase
        await db.collection('ordens_servico').add(osData);
        
        console.log(`✅ OS ${numero} criada automaticamente!`);
        
        // Notificar usuário (opcional)
        if (typeof mostrarNotificacao === 'function') {
            mostrarNotificacao(`📋 OS ${numero} criada automaticamente: ${recorrente.titulo}`, 'success');
        }
        
        return numero;
        
    } catch (error) {
        console.error('❌ Erro ao criar OS automática:', error);
        throw error;
    }
}

/**
 * Gerar número sequencial para OS
 */
async function gerarNumeroOS() {
    const ano = new Date().getFullYear();
    const prefixo = `${ano}-`;
    
    // Buscar última OS do ano
    const snapshot = await db.collection('ordens_servico')
        .where('numero', '>=', prefixo)
        .where('numero', '<', `${ano + 1}-`)
        .orderBy('numero', 'desc')
        .limit(1)
        .get();
    
    let proximoNumero = 1;
    
    if (!snapshot.empty) {
        const ultimaOS = snapshot.docs[0].data();
        const ultimoNumero = parseInt(ultimaOS.numero.split('-')[1]) || 0;
        proximoNumero = ultimoNumero + 1;
    }
    
    return `${prefixo}${String(proximoNumero).padStart(4, '0')}`;
}

/**
 * Calcular data de previsão
 */
function calcularDataPrevisao(dataInicio, dias) {
    const data = new Date(dataInicio);
    data.setDate(data.getDate() + dias);
    return firebase.firestore.Timestamp.fromDate(data);
}

/**
 * Salvar OS recorrente
 */
async function salvarOSRecorrente(dados) {
    try {
        console.log('💾 Salvando OS recorrente...');
        
        // Validar dados
        if (!dados.titulo || !dados.dias_semana || dados.dias_semana.length === 0) {
            throw new Error('Preencha título e dias da semana');
        }
        
        const osRecorrente = {
            titulo: dados.titulo,
            descricao: dados.descricao || '',
            tipo_servico: dados.tipo_servico || 'Atendimento presencial',
            tipo_equipamento: dados.tipo_equipamento || '',
            unidade: dados.unidade || '',
            local: dados.local || '',
            solicitante: dados.solicitante || '',
            responsavel: dados.responsavel || currentUser.displayName,
            prioridade: dados.prioridade || 'normal',
            
            // Recorrência
            dias_semana: dados.dias_semana, // [1,2,3,4,5] = seg-sex
            horario_inicio: dados.horario_inicio || '08:30',
            dias_previsao: parseInt(dados.dias_previsao) || 1,
            
            // Status
            ativa: dados.ativa !== false,
            
            // Datas
            data_inicio: dados.data_inicio || new Date().toISOString().split('T')[0],
            data_fim: dados.data_fim || null,
            
            // Metadados
            criado_por: currentUser.displayName,
            criado_em: firebase.firestore.Timestamp.now(),
            atualizado_em: firebase.firestore.Timestamp.now()
        };
        
        // Salvar ou atualizar
        if (dados.id) {
            await db.collection('os_recorrentes').doc(dados.id).update(osRecorrente);
            console.log('✅ OS recorrente atualizada!');
        } else {
            await db.collection('os_recorrentes').add(osRecorrente);
            console.log('✅ OS recorrente criada!');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao salvar OS recorrente:', error);
        throw error;
    }
}

/**
 * Carregar OS recorrentes
 */
async function carregarOSRecorrentes() {
    try {
        const snapshot = await db.collection('os_recorrentes')
            .orderBy('criado_em', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
    } catch (error) {
        console.error('❌ Erro ao carregar OS recorrentes:', error);
        return [];
    }
}

/**
 * Ativar/Desativar OS recorrente
 */
async function toggleOSRecorrente(id, ativa) {
    try {
        await db.collection('os_recorrentes').doc(id).update({
            ativa: ativa,
            atualizado_em: firebase.firestore.Timestamp.now()
        });
        
        console.log(`✅ OS recorrente ${ativa ? 'ativada' : 'desativada'}!`);
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao atualizar status:', error);
        throw error;
    }
}

/**
 * Excluir OS recorrente
 */
async function excluirOSRecorrente(id) {
    try {
        if (!confirm('Tem certeza que deseja excluir esta OS recorrente?')) {
            return false;
        }
        
        await db.collection('os_recorrentes').doc(id).delete();
        
        console.log('✅ OS recorrente excluída!');
        return true;
        
    } catch (error) {
        console.error('❌ Erro ao excluir:', error);
        throw error;
    }
}

/**
 * Inicialização automática
 * Verifica OS recorrentes ao carregar a página
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Aguardar Firebase estar pronto
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se está logado
    if (typeof currentUser !== 'undefined' && currentUser) {
        await verificarOSRecorrentesDoDia();
    }
});

console.log('✅ Módulo OS Recorrentes carregado!');
