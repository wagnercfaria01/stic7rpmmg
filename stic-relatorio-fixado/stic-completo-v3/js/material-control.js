// Gerenciador de Entrada e Saída de Material

// Referência à collection de usuários
const usuariosRecebedoresRef = db.collection('usuarios_recebedores');

document.addEventListener('DOMContentLoaded', () => {
    const formEntrada = document.getElementById('formEntrada');
    
    if (formEntrada) {
        // Preencher data e hora atuais
        const agora = new Date();
        document.getElementById('dataEntrada').value = agora.toISOString().split('T')[0];
        document.getElementById('horaEntrada').value = agora.toTimeString().slice(0, 5);
        
        formEntrada.addEventListener('submit', async (e) => {
            e.preventDefault();
            await registrarEntrada();
        });
        
        // Carregar recebedores cadastrados
        carregarRecebedoresDropdown();
    }
});

// Carregar recebedores no dropdown
async function carregarRecebedoresDropdown() {
    try {
        const snapshot = await usuariosRecebedoresRef.where('ativo', '==', true).get();
        const select = document.getElementById('recebedorSelecionado');
        
        if (!select) return;
        
        select.innerHTML = '<option value="">Selecione um recebedor...</option>';
        
        snapshot.forEach(doc => {
            const user = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${user.tipo === 'militar' ? '👮' : '👤'} ${user.nome} - ${user.numero_policia || user.cpf || ''}`;
            option.dataset.userData = JSON.stringify({ id: doc.id, ...user });
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Erro ao carregar recebedores:', error);
    }
}

// Mostrar dropdown de recebedores
function mostrarRecebedoresCadastrados() {
    document.getElementById('dropdownRecebedoresEntrada').style.display = 'block';
    document.getElementById('formularioManualEntrada').style.display = 'none';
}

// Mostrar formulário manual
function mostrarFormularioManual() {
    document.getElementById('dropdownRecebedoresEntrada').style.display = 'none';
    document.getElementById('formularioManualEntrada').style.display = 'block';
}

// Preencher dados do recebedor selecionado
function preencherDadosRecebedor() {
    const select = document.getElementById('recebedorSelecionado');
    const option = select.options[select.selectedIndex];
    
    if (!option.value) return;
    
    const userData = JSON.parse(option.dataset.userData);
    
    // Preencher campos
    document.getElementById('tipoEntregador').value = userData.tipo;
    document.getElementById('nomeEntregador').value = userData.nome;
    document.getElementById('telefoneEntregador').value = userData.telefone || '';
    
    if (userData.tipo === 'militar') {
        document.getElementById('numeroPoliciaEnt').value = userData.numero_policia;
        document.getElementById('unidadeEntregador').value = userData.unidade;
        alterarTipoEntregador(); // Mostra campos militar
    } else {
        document.getElementById('cpfEntregador').value = userData.cpf || '';
        document.getElementById('tipoEntregador').value = 'civil';
        alterarTipoEntregador(); // Mostra campos civil
    }
    
    // Mostrar formulário preenchido
    mostrarFormularioManual();
}

function alterarTipoEntregador() {
    const tipo = document.getElementById('tipoEntregador').value;
    const camposMilitar = document.getElementById('camposMilitarEnt');
    const camposCivil = document.getElementById('camposCivilEnt');
    const numeroPolicia = document.getElementById('numeroPoliciaEnt');
    const cpf = document.getElementById('cpfEntregador');
    
    if (tipo === 'militar') {
        camposMilitar.style.display = 'block';
        camposCivil.style.display = 'none';
        numeroPolicia.required = true;
        cpf.required = false;
    } else {
        camposMilitar.style.display = 'none';
        camposCivil.style.display = 'block';
        numeroPolicia.required = false;
        cpf.required = true;
    }
}

// Registrar entrada de material
async function registrarEntrada() {
    const form = document.getElementById('formEntrada');
    
    if (!validarFormulario(form)) {
        mostrarErro('Preencha todos os campos obrigatórios!');
        return;
    }
    
    mostrarLoading('Registrando entrada de material...');
    
    try {
        const tipoEntregador = document.getElementById('tipoEntregador') ? 
            document.getElementById('tipoEntregador').value : 'militar';
        
        // Obter usuário logado
        const usuarioNome = sessionStorage.getItem('stic_usuario_nome') || 'Sistema';
        const usuarioNumero = sessionStorage.getItem('stic_usuario_numero') || '';
        const usuarioLogado = `${usuarioNome}${usuarioNumero ? ' - ' + usuarioNumero : ''}`;
        
        const entrada = {
            tipo_material: document.getElementById('tipoMaterial').value,
            patrimonio: document.getElementById('patrimonioEntrada').value,
            numero_serie: document.getElementById('numSerieEntrada').value,
            marca: document.getElementById('marcaEntrada').value,
            modelo: document.getElementById('modeloEntrada').value,
            estado_conservacao: document.getElementById('estadoConservacao').value,
            
            entregador: {
                tipo: tipoEntregador,
                nome: document.getElementById('nomeEntregador').value,
                telefone: document.getElementById('telefoneEntregador').value
            },
            
            data_entrada: document.getElementById('dataEntrada').value,
            hora_entrada: document.getElementById('horaEntrada').value,
            motivo: document.getElementById('motivoEntrada').value,
            problema_relatado: document.getElementById('problemaRelatado').value,
            acessorios: document.getElementById('acessoriosEntrada').value,
            
            status: 'aguardando_assinatura',
            assinado: false,
            registrado_por: usuarioLogado,
            data_registro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Adicionar campos específicos por tipo
        if (tipoEntregador === 'militar') {
            entrada.entregador.numero_policia = document.getElementById('numeroPoliciaEnt').value;
            entrada.entregador.unidade = document.getElementById('unidadeEntregador').value;
        } else {
            entrada.entregador.cpf = document.getElementById('cpfEntregador').value;
        }
        
        // Salvar no Firebase
        const docRef = await entradasRef.add(entrada);
        
        // 📧 ENVIAR EMAIL E TELEGRAM AUTOMÁTICO
        try {
            console.log('📧 Tentando enviar email e telegram de entrada...');
            
            // Preparar dados para notificação
            const numeroPolicia = entrada.entregador?.numero_policia || null;
            
            const dadosEntrada = {
                militar_entregador: entrada.entregador,
                nome_militar: entrada.entregador?.nome || 'Não informado',
                numero_policia: numeroPolicia,
                patrimonio: entrada.patrimonio || 'N/A',
                tipo_material: entrada.tipo_material,
                estado_conservacao: entrada.estado_conservacao
            };
            
            // Enviar Email (se tiver número de polícia)
            if (numeroPolicia && typeof EmailAutomatico !== 'undefined' && EmailAutomatico.enviarEmailEntradaMaterial) {
                await EmailAutomatico.enviarEmailEntradaMaterial(numeroPolicia, dadosEntrada);
                console.log('✅ Email de entrada de material enviado');
            } else {
                console.warn('⚠️ Email não enviado (número de polícia não informado ou EmailAutomatico indisponível)');
            }
            
            // Enviar Telegram
            if (typeof TelegramSTIC !== 'undefined' && TelegramSTIC.notificarEntradaMaterial) {
                await TelegramSTIC.notificarEntradaMaterial(dadosEntrada);
                console.log('✅ Telegram de entrada de material enviado');
            } else {
                console.warn('⚠️ TelegramSTIC não disponível');
            }
        } catch (notifError) {
            console.warn('⚠️ Erro ao enviar notificações:', notifError.message);
            // Não quebra o fluxo se a notificação falhar
        }
        
        ocultarLoading();
        
        // NOVO: Abrir página para técnico assinar ANTES de gerar link
        const linkAssinarTecnico = `${window.location.origin}/pages/assinar-tecnico.html?tipo=entrada&id=${docRef.id}`;
        
        mostrarSucesso('Entrada registrada! Agora assine o termo.');
        
        // Aguardar 1 segundo e abrir página de assinatura
        setTimeout(() => {
            window.location.href = linkAssinarTecnico;
        }, 1000);
${linkAssinatura}

O termo contém a descrição completa do material recebido.

Atenciosamente,
*STIC - Seção de Tecnologia*
PMMG
            `.trim();
            
            enviarWhatsApp(telefone, mensagem);
        };
        
        // Configurar botão copiar
        document.getElementById('btnCopiarLink').onclick = () => {
            copiarTexto(linkAssinatura);
        };
        
        mostrarSucesso('Entrada registrada com sucesso!');
        
        // Scroll para mensagem
        document.getElementById('mensagemSucesso').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao registrar entrada:', error);
        mostrarErro('Erro ao registrar entrada: ' + error.message);
    }
}

// Registrar saída de material
async function registrarSaida(dados) {
    try {
        mostrarLoading('Registrando saída de material...');
        
        // Obter usuário logado
        const usuarioNome = sessionStorage.getItem('stic_usuario_nome') || 'Sistema';
        const usuarioNumero = sessionStorage.getItem('stic_usuario_numero') || '';
        const usuarioLogado = `${usuarioNome}${usuarioNumero ? ' - ' + usuarioNumero : ''}`;
        
        const saida = {
            ...dados,
            status: 'aguardando_assinatura',
            assinado: false,
            registrado_por: usuarioLogado,
            data_registro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await saidasRef.add(saida);
        
        ocultarLoading();
        mostrarSucesso('Saída registrada! Agora assine o termo.');
        
        // NOVO: Redirecionar para página de assinatura do técnico
        const linkAssinarTecnico = `${window.location.origin}/pages/assinar-tecnico.html?tipo=saida&id=${docRef.id}`;
        
        setTimeout(() => {
            window.location.href = linkAssinarTecnico;
        }, 1000);
        
        return {
            id: docRef.id
        };
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao registrar saída:', error);
        mostrarErro('Erro ao registrar saída');
        return null;
    }
}

// Buscar entrada por patrimônio
async function buscarEntradaPorPatrimonio(patrimonio) {
    try {
        const snapshot = await entradasRef
            .where('patrimonio', '==', patrimonio)
            .orderBy('data_registro', 'desc')
            .get();
        
        const docs = [];
        snapshot.forEach(doc => {
            docs.push({ id: doc.id, ...doc.data() });
        });
        
        return docs;
        
    } catch (error) {
        console.error('Erro ao buscar entrada:', error);
        return [];
    }
}

// Listar entradas recentes
async function listarEntradasRecentes(limite = 20) {
    try {
        const snapshot = await entradasRef
            .orderBy('data_registro', 'desc')
            .limit(limite)
            .get();
        
        const docs = [];
        snapshot.forEach(doc => {
            docs.push({ id: doc.id, ...doc.data() });
        });
        
        return docs;
        
    } catch (error) {
        console.error('Erro ao listar entradas:', error);
        return [];
    }
}

// Salvar assinatura
async function salvarAssinatura(tipo, registroId, assinatura) {
    try {
        const assinaturaData = {
            tipo: tipo, // 'entrada' ou 'saida'
            registro_id: registroId,
            assinatura_base64: assinatura,
            data_assinatura: firebase.firestore.FieldValue.serverTimestamp(),
            ip: await obterIP()
        };
        
        await assinaturasRef.add(assinaturaData);
        
        // Atualizar status do registro
        const ref = tipo === 'entrada' ? entradasRef : saidasRef;
        await ref.doc(registroId).update({
            assinado: true,
            data_assinatura: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return true;
        
    } catch (error) {
        console.error('Erro ao salvar assinatura:', error);
        return false;
    }
}

// Obter IP do usuário (simplificado)
async function obterIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        return 'IP não disponível';
    }
}

// Verificar se já tem assinatura
async function verificarAssinatura(tipo, registroId) {
    try {
        const snapshot = await assinaturasRef
            .where('tipo', '==', tipo)
            .where('registro_id', '==', registroId)
            .limit(1)
            .get();
        
        return !snapshot.empty;
        
    } catch (error) {
        console.error('Erro ao verificar assinatura:', error);
        return false;
    }
}

console.log('✅ Gerenciador de material carregado!');
