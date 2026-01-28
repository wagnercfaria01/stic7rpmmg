// Sistema de Edição de OS

// Tornar osAtual global para ser acessada pelo código inline no HTML
window.osAtual = null;
let osAtual = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Obter ID da OS do sessionStorage
    const osId = sessionStorage.getItem('editarOSId');
    
    if (!osId) {
        mostrarErro('Nenhuma OS selecionada para edição!');
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
        return;
    }
    
    await carregarOS(osId);
    
    // Configurar form
    const form = document.getElementById('formEditarOS');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await salvarAlteracoes();
    });
});

// Carregar dados da OS
async function carregarOS(id) {
    try {
        mostrarLoading('Carregando OS...');
        
        const doc = await ordensServicoRef.doc(id).get();
        
        if (!doc.exists) {
            throw new Error('OS não encontrada!');
        }
        
        osAtual = { id: doc.id, ...doc.data() };
        window.osAtual = osAtual; // Tornar disponível globalmente
        
        console.log('✅ OS carregada:', osAtual.numero || osAtual.id);
        
        preencherFormulario(osAtual);
        
        document.getElementById('loadingOS').style.display = 'none';
        document.getElementById('formEditarOS').style.display = 'block';
        
        // Garantir que seção de fotos seja visível
        const secaoFotos = document.getElementById('secaoFotos');
        if (secaoFotos) {
            secaoFotos.style.display = 'block';
            console.log('✅ Seção de fotos exibida');
        } else {
            console.error('❌ Seção de fotos não encontrada no DOM');
        }
        
        ocultarLoading();
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao carregar OS:', error);
        mostrarErro('Erro ao carregar OS: ' + error.message);
        
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
    }
}

// Preencher formulário com dados da OS
function preencherFormulario(os) {
    // Informações básicas
    document.getElementById('numeroOS').value = os.numero || '';
    
    if (os.data_abertura) {
        const data = os.data_abertura.toDate ? os.data_abertura.toDate() : new Date(os.data_abertura);
        document.getElementById('dataAberturaOS').value = data.toLocaleString('pt-BR');
    }
    
    // Status e prioridade
    document.getElementById('statusEdit').value = os.status || 'aberta';
    document.getElementById('prioridadeEdit').value = os.prioridade || 'media';
    document.getElementById('tecnicoEdit').value = os.tecnico_responsavel || '';
    document.getElementById('prazoEdit').value = os.prazo_estimado || '';
    
    // Se já tem solução, mostrar seção
    if (os.solucao) {
        document.getElementById('secaoSolucao').style.display = 'block';
        document.getElementById('solucaoOS').value = os.solucao;
    }
    
    // Trigger evento de mudança de status
    if (os.status === 'finalizada') {
        document.getElementById('secaoSolucao').style.display = 'block';
        document.getElementById('solucaoOS').required = true;
    }
    
    // ========== CARREGAR FOTOS EXISTENTES ==========
    if (typeof carregarFotosExistentes === 'function') {
        carregarFotosExistentes(os);
    }
}

// Salvar alterações
async function salvarAlteracoes() {
    try {
        const form = document.getElementById('formEditarOS');
        
        if (!validarFormulario(form)) {
            mostrarErro('Preencha todos os campos obrigatórios!');
            return;
        }
        
        mostrarLoading('Salvando alterações...');
        
        // Dados atualizados
        const statusNovo = document.getElementById('statusEdit').value;
        const statusAntigo = osAtual.status;
        
        const atualizacao = {
            status: statusNovo,
            prioridade: document.getElementById('prioridadeEdit').value,
            tecnico_responsavel: document.getElementById('tecnicoEdit').value,
            prazo_estimado: document.getElementById('prazoEdit').value,
            data_atualizacao: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Se finalizada, adicionar solução e data
        if (statusNovo === 'finalizada') {
            atualizacao.solucao = document.getElementById('solucaoOS').value;
            atualizacao.data_finalizacao = firebase.firestore.FieldValue.serverTimestamp();
        }
        
        // Preparar histórico
        const comentario = document.getElementById('comentarioOS').value.trim();
        
        let acaoHistorico = '';
        if (statusAntigo !== statusNovo) {
            const statusTexto = {
                'aberta': 'Aberta',
                'em_andamento': 'Em Andamento',
                'em_manutencao': 'Em Manutenção',
                'aguardando_peca': 'Aguardando Peça',
                'aguardando_aprovacao': 'Aguardando Aprovação',
                'pausada': 'Pausada',
                'enviado_bh': 'Enviado para BH',
                'aguardando_teste': 'Aguardando Teste',
                'testada': 'Testada',
                'pronta_retirada': 'Pronta para Retirada',
                'finalizada': 'Finalizada',
                'cancelada': 'Cancelada'
            };
            const textoAntigo = statusTexto[statusAntigo] || statusAntigo;
            const textoNovo = statusTexto[statusNovo] || statusNovo;
            acaoHistorico = `Status alterado: ${textoAntigo} → ${textoNovo}`;
        } else if (comentario) {
            acaoHistorico = 'Comentário adicionado';
        } else {
            acaoHistorico = 'OS atualizada';
        }
        
        const novoHistorico = {
            data: new Date().toISOString(),
            acao: acaoHistorico,
            usuario: 'Wagner - STIC'
        };
        
        if (comentario) {
            novoHistorico.comentario = comentario;
        }
        
        // Adicionar ao histórico
        atualizacao.historico = firebase.firestore.FieldValue.arrayUnion(novoHistorico);
        
        // ========== SALVAR FOTOS ATUALIZADAS ==========
        if (typeof fotosEditArray !== 'undefined' && fotosEditArray.length >= 0) {
            atualizacao.fotos = fotosEditArray;
            
            // Adicionar ao histórico se fotos foram modificadas
            if (JSON.stringify(fotosEditArray) !== JSON.stringify(osAtual.fotos || [])) {
                const historicoFotos = {
                    data: new Date().toISOString(),
                    acao: 'Fotos atualizadas',
                    usuario: 'Wagner - STIC',
                    detalhes: `Total de fotos: ${fotosEditArray.length}`
                };
                atualizacao.historico = firebase.firestore.FieldValue.arrayUnion(novoHistorico, historicoFotos);
            }
        }
        
        // Atualizar no Firebase
        await ordensServicoRef.doc(osAtual.id).update(atualizacao);
        
        ocultarLoading();
        mostrarSucesso('Alterações salvas com sucesso!');
        
        // Limpar sessionStorage
        sessionStorage.removeItem('editarOSId');
        
        // Redirecionar após 1.5 segundos
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 1500);
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao salvar:', error);
        mostrarErro('Erro ao salvar alterações: ' + error.message);
    }
}

console.log('✅ Editor de OS carregado!');
