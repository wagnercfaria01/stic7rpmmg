/**
 * ════════════════════════════════════════════════════════════
 * SISTEMA DE ORDENS DE SERVIÇO RECORRENTES
 * Cria OS automaticamente em dias/horários definidos
 * ════════════════════════════════════════════════════════════
 */

console.log('📦 Carregando módulo OS Recorrentes...');

// Verificar OS recorrentes automaticamente
async function verificarOSRecorrentesDoDia() {
    try {
        console.log('🔄 Verificando OS recorrentes do dia...');
        
        const hoje = new Date();
        const diaSemana = hoje.getDay(); // 0=dom, 1=seg, 2=ter...
        const dataHoje = hoje.toISOString().split('T')[0]; // 2026-01-30
        const horaAgora = hoje.toTimeString().substring(0, 5); // 10:30
        
        console.log(`📅 Hoje: ${dataHoje} (dia da semana: ${diaSemana})`);
        console.log(`🕐 Hora atual: ${horaAgora}`);
        
        // Buscar OS recorrentes ATIVAS
        const snapshot = await firebase.firestore()
            .collection('os_recorrentes')
            .where('ativa', '==', true)
            .get();
        
        if (snapshot.empty) {
            console.log('ℹ️ Nenhuma OS recorrente ativa');
            return;
        }
        
        console.log(`📋 ${snapshot.size} OS recorrente(s) ativa(s)`);
        
        // Processar cada OS recorrente
        for (const doc of snapshot.docs) {
            const rec = doc.data();
            const recId = doc.id;
            
            // Verificar se é dia de criar
            if (!rec.dias_semana || !rec.dias_semana.includes(diaSemana)) {
                console.log(`⏭️ ${rec.descricao}: Não é dia (hoje=${diaSemana}, dias=${rec.dias_semana})`);
                continue;
            }
            
            // Verificar horário
            if (horaAgora < rec.horario) {
                console.log(`⏰ ${rec.descricao}: Ainda não (agora=${horaAgora}, criar=${rec.horario})`);
                continue;
            }
            
            // Verificar se JÁ criou hoje
            const osHoje = await firebase.firestore()
                .collection('ordens_servico')
                .where('recorrente_id', '==', recId)
                .where('data_criacao_str', '==', dataHoje)
                .limit(1)
                .get();
            
            if (!osHoje.empty) {
                console.log(`✅ ${rec.descricao}: Já criada hoje`);
                continue;
            }
            
            // CRIAR OS AUTOMATICAMENTE!
            await criarOSAutomatica(rec, recId, dataHoje, hoje);
        }
        
        console.log('✅ Verificação concluída!');
        
    } catch (error) {
        console.error('❌ Erro ao verificar:', error);
    }
}

// Criar OS automática
async function criarOSAutomatica(rec, recId, dataHoje, hoje) {
    try {
        console.log(`🆕 Criando OS automática: ${rec.descricao}`);
        
        // Gerar número da OS
        const numero = await gerarNumeroOSRecorrente();
        
        // Data de previsão (padrão: 1 dia)
        const dataPrevisao = new Date(hoje);
        dataPrevisao.setDate(dataPrevisao.getDate() + 1);
        
        // Montar OS
        const osData = {
            numero: numero,
            tipo_servico: rec.tipo_servico || 'Atendimento presencial',
            tipo_equipamento: rec.tipo_equipamento || '',
            descricao: rec.descricao || '',
            unidade: rec.unidade || '',
            local: rec.unidade || '',
            solicitante: 'Sistema Automático',
            status: 'aberta',
            prioridade: rec.prioridade || 'normal',
            
            // Datas
            data_abertura: firebase.firestore.Timestamp.fromDate(hoje),
            data_previsao: firebase.firestore.Timestamp.fromDate(dataPrevisao),
            data_criacao_str: dataHoje, // Para filtro
            
            // Vinculação
            recorrente_id: recId,
            criada_automaticamente: true,
            
            // Metadados
            criado_por: 'Sistema - OS Recorrente',
            criado_em: firebase.firestore.Timestamp.now(),
            
            // Histórico
            historico: [{
                acao: 'OS criada automaticamente',
                data: firebase.firestore.Timestamp.now(),
                usuario: 'Sistema',
                detalhes: `OS recorrente: ${rec.descricao}`
            }]
        };
        
        // Salvar
        await firebase.firestore().collection('ordens_servico').add(osData);
        
        console.log(`✅ OS ${numero} criada!`);
        
        // Notificar (se disponível)
        if (typeof mostrarNotificacaoSucesso === 'function') {
            mostrarNotificacaoSucesso(`📋 OS ${numero} criada automaticamente!`);
        }
        
    } catch (error) {
        console.error('❌ Erro ao criar OS:', error);
    }
}

// Gerar número da OS
async function gerarNumeroOSRecorrente() {
    const ano = new Date().getFullYear();
    const prefixo = `${ano}-`;
    
    const snapshot = await firebase.firestore()
        .collection('ordens_servico')
        .where('numero', '>=', prefixo)
        .where('numero', '<', `${ano + 1}-`)
        .orderBy('numero', 'desc')
        .limit(1)
        .get();
    
    let proximo = 1;
    
    if (!snapshot.empty) {
        const ultimo = snapshot.docs[0].data();
        const ultimoNum = parseInt(ultimo.numero.split('-')[1]) || 0;
        proximo = ultimoNum + 1;
    }
    
    return `${prefixo}${String(proximo).padStart(4, '0')}`;
}

// ═════════════════════════════════════════════════════════════
// FUNÇÕES DE GERENCIAMENTO
// ═════════════════════════════════════════════════════════════

// Salvar OS recorrente
async function salvarOSRecorrente(dados) {
    try {
        const rec = {
            tipo_servico: dados.tipo_servico,
            descricao: dados.descricao,
            unidade: dados.unidade,
            dias_semana: dados.dias_semana, // [1,2,3,4,5] = seg-sex
            horario: dados.horario, // "08:30"
            prioridade: dados.prioridade || 'normal',
            ativa: dados.ativa !== false,
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (dados.id) {
            // Atualizar
            await firebase.firestore().collection('os_recorrentes').doc(dados.id).update(rec);
        } else {
            // Criar nova
            await firebase.firestore().collection('os_recorrentes').add(rec);
        }
        
        return true;
    } catch (error) {
        console.error('Erro ao salvar:', error);
        throw error;
    }
}

// Carregar OS recorrentes
async function carregarOSRecorrentes() {
    try {
        const snapshot = await firebase.firestore()
            .collection('os_recorrentes')
            .orderBy('created_at', 'desc')
            .get();
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Erro ao carregar:', error);
        return [];
    }
}

// Toggle ativa/inativa
async function toggleOSRecorrente(id, ativa) {
    try {
        await firebase.firestore().collection('os_recorrentes').doc(id).update({
            ativa: ativa,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}

// Excluir
async function excluirOSRecorrente(id) {
    try {
        await firebase.firestore().collection('os_recorrentes').doc(id).delete();
        return true;
    } catch (error) {
        console.error('Erro:', error);
        throw error;
    }
}

// ═════════════════════════════════════════════════════════════
// INICIALIZAÇÃO AUTOMÁTICA
// ═════════════════════════════════════════════════════════════

// Executar verificação quando a página carregar
if (typeof firebase !== 'undefined') {
    // Aguardar Firebase inicializar
    const intervaloVerificacao = setInterval(() => {
        if (firebase.apps.length > 0) {
            clearInterval(intervaloVerificacao);
            
            // Aguardar 3 segundos e verificar
            setTimeout(() => {
                verificarOSRecorrentesDoDia();
            }, 3000);
        }
    }, 500);
}

console.log('✅ Módulo OS Recorrentes carregado!');
