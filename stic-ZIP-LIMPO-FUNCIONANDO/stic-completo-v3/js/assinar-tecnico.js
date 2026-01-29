// Sistema de Assinatura do Técnico

let canvas, ctx;
let desenhando = false;
let assinaturaVazia = true;
let tipoRegistro, registroId;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('✍️ Sistema de assinatura do técnico iniciado');
    
    // Obter parâmetros da URL
    const params = new URLSearchParams(window.location.search);
    tipoRegistro = params.get('tipo');
    registroId = params.get('id');
    
    if (!tipoRegistro || !registroId) {
        alert('❌ Erro: Parâmetros inválidos!');
        window.close();
        return;
    }
    
    // Configurar canvas
    configurarCanvas();
    
    // Carregar dados do registro
    await carregarDadosRegistro();
});

// Configurar canvas de assinatura
function configurarCanvas() {
    canvas = document.getElementById('canvasAssinatura');
    if (!canvas) return;
    
    ctx = canvas.getContext('2d');
    
    // IMPORTANTE: Preencher fundo branco para aparecer no celular
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Configurações do canvas
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Mouse events
    canvas.addEventListener('mousedown', iniciarDesenho);
    canvas.addEventListener('mousemove', desenhar);
    canvas.addEventListener('mouseup', pararDesenho);
    canvas.addEventListener('mouseout', pararDesenho);
    
    // Touch events
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        canvas.dispatchEvent(mouseEvent);
    });
    
    console.log('✅ Canvas configurado');
}

// Iniciar desenho
function iniciarDesenho(e) {
    desenhando = true;
    assinaturaVazia = false;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
}

// Desenhar
function desenhar(e) {
    if (!desenhando) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
}

// Parar desenho
function pararDesenho() {
    desenhando = false;
    ctx.beginPath();
}

// Limpar assinatura
function limparAssinatura() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Repintar o fundo branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    assinaturaVazia = true;
    console.log('🗑️ Assinatura limpa');
}

// Cancelar
function cancelar() {
    if (confirm('Deseja cancelar? A assinatura não será salva.')) {
        window.close();
    }
}

// Carregar dados do registro
async function carregarDadosRegistro() {
    try {
        const ref = tipoRegistro === 'entrada' ? entradasRef : saidasRef;
        const doc = await ref.doc(registroId).get();
        
        if (!doc.exists) {
            throw new Error('Registro não encontrado');
        }
        
        const dados = doc.data();
        
        // Preencher informações
        document.getElementById('tipoRegistro').textContent = 
            tipoRegistro === 'entrada' ? '📥 ENTRADA DE MATERIAL' : '📤 SAÍDA DE MATERIAL';
        document.getElementById('tipoMaterial').textContent = dados.tipo_material || '-';
        document.getElementById('patrimonio').textContent = dados.patrimonio || '-';
        
        // Nome do técnico logado
        const tecnicoNome = sessionStorage.getItem('stic_usuario_nome');
        const tecnicoNumero = sessionStorage.getItem('stic_usuario_numero');
        document.getElementById('tecnicoNome').textContent = 
            `${tecnicoNome}${tecnicoNumero ? ' - ' + tecnicoNumero : ''}`;
        
        console.log('✅ Dados carregados');
        
    } catch (error) {
        console.error('❌ Erro:', error);
        alert('Erro ao carregar dados: ' + error.message);
        window.close();
    }
}

// Salvar assinatura
async function salvarAssinatura() {
    if (assinaturaVazia) {
        alert('⚠️ Por favor, assine no quadro antes de continuar!');
        return;
    }
    
    if (!confirm('Confirma sua assinatura? Após confirmar, o link será gerado para o militar assinar.')) {
        return;
    }
    
    try {
        // Mostrar loading
        document.getElementById('loading').style.display = 'block';
        
        // Converter canvas para base64
        const assinaturaBase64 = canvas.toDataURL('image/png');
        
        // Obter dados do técnico
        const tecnicoNome = sessionStorage.getItem('stic_usuario_nome');
        const tecnicoNumero = sessionStorage.getItem('stic_usuario_numero');
        const tecnico = {
            nome: tecnicoNome,
            numero_policia: tecnicoNumero,
            assinatura_base64: assinaturaBase64,
            data_assinatura: new Date().toISOString()
        };
        
        // Salvar no Firebase
        const ref = tipoRegistro === 'entrada' ? entradasRef : saidasRef;
        
        const updateData = {
            tecnico_stic: tecnico,
            tecnico_recebedor: {
                nome: tecnicoNome,
                numero_pm: tecnicoNumero
            },
            assinatura_tecnico: assinaturaBase64,
            assinado: true,  // IMPORTANTE: Marca como assinado para bot detectar!
            status: 'assinado',
            data_assinatura: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await ref.doc(registroId).update(updateData);
        
        console.log('✅ Assinatura do técnico salva!');
        console.log('📝 Status atualizado:', updateData);
        
        // Buscar dados completos do registro
        const doc = await ref.doc(registroId).get();
        const dados = doc.data();
        
        console.log('📊 Dados da entrada:', dados);
        
        // Ocultar loading
        document.getElementById('loading').style.display = 'none';
        
        // Mostrar sucesso (SEM gerar link!)
        mostrarSucesso(dados);
        
    } catch (error) {
        document.getElementById('loading').style.display = 'none';
        console.error('❌ Erro ao salvar:', error);
        alert('Erro ao salvar assinatura: ' + error.message);
    }
}

// Mostrar sucesso e voltar
function mostrarSucesso(dados) {
    const container = document.querySelector('.container-assinatura');
    
    const osNumero = dados.os_vinculada || 'N/A';
    const material = dados.tipo_material || 'Material';
    const patrimonio = dados.patrimonio || 'N/A';
    
    container.innerHTML = `
        <div class="header-assinatura">
            <h1 style="color: #003366;">✅ ASSINATURA REGISTRADA!</h1>
        </div>
        
        <div style="background: #d4edda; padding: 2rem; border-radius: 10px; border-left: 4px solid #28a745; margin-bottom: 2rem; text-align: center;">
            <h2 style="color: #155724; margin-bottom: 1rem;">🎉 Entrada confirmada com sucesso!</h2>
            <p style="color: #155724; font-size: 1.1rem;">
                Material recebido e registrado no sistema.
            </p>
        </div>
        
        <div style="background: #f4f6f9; padding: 2rem; border-radius: 10px; margin-bottom: 2rem;">
            <h3 style="margin-bottom: 1rem;">📋 Resumo:</h3>
            <p><strong>OS:</strong> #${osNumero}</p>
            <p><strong>Material:</strong> ${material}</p>
            <p><strong>Patrimônio:</strong> ${patrimonio}</p>
            <p><strong>Status:</strong> ✅ Assinado</p>
        </div>
        
        <div style="background: #e7f3ff; padding: 1.5rem; border-radius: 10px; margin-bottom: 2rem; border-left: 4px solid #0066cc;">
            <p style="margin: 0; color: #004085;">
                🤖 <strong>Notificação automática:</strong> O militar que entregou o material receberá o comprovante via Telegram (se cadastrado).
            </p>
        </div>
        
        <div style="text-align: center;">
            <button onclick="voltarSistema()" class="btn btn-primary" style="font-size: 1.2rem; padding: 1rem 2rem;">
                🔙 Voltar ao Sistema
            </button>
        </div>
    `;
}

// Voltar para o dashboard
function voltarSistema() {
    window.location.href = '../index.html';
}

// Copiar link
function copiarLink() {
    const input = document.getElementById('linkAssinatura');
    input.select();
    document.execCommand('copy');
    alert('✅ Link copiado para área de transferência!');
}

// Enviar WhatsApp
function enviarWhatsApp(telefone) {
    const link = document.getElementById('linkAssinatura').value;
    
    // Limpar telefone (remover caracteres especiais)
    const telefoneFormatado = telefone ? telefone.replace(/\D/g, '') : '';
    
    const mensagem = `🔐 *STIC - Assinatura de Termo de Material*

Por favor, assine o termo acessando o link abaixo:

${link}

_Sistema de Ordem de Serviço - PMMG_`;
    
    // Se tiver telefone, usar wa.me com número, senão abrir sem número
    let whatsappURL;
    if (telefoneFormatado) {
        whatsappURL = `https://wa.me/55${telefoneFormatado}?text=${encodeURIComponent(mensagem)}`;
    } else {
        whatsappURL = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    }
    
    window.open(whatsappURL, '_blank');
}

console.log('✅ Sistema de assinatura do técnico carregado!');
