// Gerenciador de Saída de Material

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formSaida');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await registrarSaida();
        });
    }
});

// Registrar saída de material
async function registrarSaida() {
    const form = document.getElementById('formSaida');
    
    if (!validarFormulario(form)) {
        mostrarErro('Preencha todos os campos obrigatórios!');
        return;
    }
    
    mostrarLoading('Registrando saída de material...');
    
    try {
        const tipoRecebedor = document.getElementById('tipoRecebedor').value;
        const tipoSaida = document.getElementById('tipoSaida').value;
        
        const saida = {
            tipo_material: document.getElementById('tipoMaterialSaida').value,
            patrimonio: document.getElementById('patrimonioSaida').value,
            numero_serie: document.getElementById('numSerieSaida').value,
            marca: document.getElementById('marcaSaida').value,
            modelo: document.getElementById('modeloSaida').value,
            estado_conservacao: document.getElementById('estadoSaida').value,
            
            // NOVO: Tipo de saída
            tipo_saida: tipoSaida,
            
            recebedor: {
                tipo: tipoRecebedor,
                nome: document.getElementById('nomeRecebedor').value,
                telefone: document.getElementById('telefoneRecebedor').value
            },
            
            data_saida: document.getElementById('dataSaida').value,
            hora_saida: document.getElementById('horaSaida').value,
            motivo: document.getElementById('motivoSaida').value,
            observacoes: document.getElementById('observacoesSaida').value,
            acessorios: document.getElementById('acessoriosSaida').value,
            
            status: tipoSaida === 'emprestimo' ? 'emprestado' : 'saida_registrada',
            assinado: false,
            registrado_por: sessionStorage.getItem('stic_usuario_nome') + ' - ' + sessionStorage.getItem('stic_usuario_numero'),
            data_registro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Adicionar campos específicos por tipo
        if (tipoRecebedor === 'militar') {
            saida.recebedor.numero_policia = document.getElementById('numeroPoliciaRec').value;
            saida.recebedor.unidade = document.getElementById('unidadeRecebedor').value;
            
            // Salvar também no formato antigo para compatibilidade
            saida.militar_recebedor = saida.recebedor.nome;
            saida.numero_recebedor = saida.recebedor.numero_policia;
        } else {
            saida.recebedor.cpf = document.getElementById('cpfRecebedor').value;
        }
        
        // Adicionar campos de empréstimo
        if (tipoSaida === 'emprestimo') {
            saida.prazo_retorno = document.getElementById('prazoRetorno').value;
            saida.hora_retorno = document.getElementById('horaRetorno').value || '';
            saida.finalidade_emprestimo = document.getElementById('finalidadeEmprestimo').value;
        }
        
        // Salvar no Firebase
        const docRef = await saidasRef.add(saida);
        
        // 📧 ENVIAR EMAIL E TELEGRAM AUTOMÁTICO
        try {
            console.log('📧 Tentando enviar email e telegram de saída...');
            
            // Preparar dados para notificação
            const numeroPolicia = saida.recebedor?.numero_pm || null;
            
            const dadosSaida = {
                id: docRef.id,
                militar_recebedor: saida.recebedor?.nome || 'Não informado',
                numero_recebedor: numeroPolicia,
                patrimonio: saida.patrimonio || 'N/A',
                tipo_material: saida.tipo_material,
                destino: saida.recebedor?.unidade || 'Não informado'
            };
            
            // Enviar Email (se tiver número de polícia)
            if (numeroPolicia && typeof EmailAutomatico !== 'undefined' && EmailAutomatico.enviarEmailSaidaMaterial) {
                await EmailAutomatico.enviarEmailSaidaMaterial(numeroPolicia, dadosSaida, docRef.id);
                console.log('✅ Email de saída de material enviado');
            } else {
                console.warn('⚠️ Email não enviado (número de polícia não informado ou EmailAutomatico indisponível)');
            }
            
            // Enviar Telegram
            if (typeof TelegramSTIC !== 'undefined' && TelegramSTIC.notificarSaidaMaterial) {
                await TelegramSTIC.notificarSaidaMaterial(dadosSaida);
                console.log('✅ Telegram de saída de material enviado');
            } else {
                console.warn('⚠️ TelegramSTIC não disponível');
            }
        } catch (notifError) {
            console.warn('⚠️ Erro ao enviar notificações:', notifError.message);
            // Não quebra o fluxo se a notificação falhar
        }
        
        ocultarLoading();
        
        // Gerar link de assinatura
        const linkAssinatura = gerarLinkAssinatura('saida', docRef.id);
        
        // Mostrar opções de envio
        document.getElementById('mensagemSucessoSaida').style.display = 'block';
        document.getElementById('linkAssinaturaSaida').textContent = linkAssinatura;
        
        // Configurar botão WhatsApp
        document.getElementById('btnEnviarWhatsAppSaida').onclick = () => {
            const telefone = saida.recebedor.telefone;
            
            const tipoMaterialTexto = {
                'radio': 'Rádio Móvel',
                'ht': 'HT',
                'computador': 'Computador',
                'notebook': 'Notebook',
                'equipamento_rede': 'Equipamento de Rede',
                'outro': 'Outro Material'
            };
            
            const mensagem = `
*PMMG - STIC*
*TERMO DE DEVOLUÇÃO DE MATERIAL*

Prezado(a) *${saida.recebedor.nome}*,

Registramos a devolução do seguinte material:

📦 *MATERIAL:* ${tipoMaterialTexto[saida.tipo_material] || saida.tipo_material}
🏷️ *Patrimônio:* ${saida.patrimonio}
🔢 *Série:* ${saida.numero_serie}
📋 *Serviço Realizado:* ${saida.observacoes}

📅 *Data:* ${saida.data_saida} às ${saida.hora_saida}

Para finalizar o processo, é necessário assinar digitalmente o termo de devolução.

👉 *Clique no link abaixo para assinar:*
${linkAssinatura}

O termo contém a descrição completa do material devolvido e serviços realizados.

Atenciosamente,
*STIC - Seção de Tecnologia*
PMMG
            `.trim();
            
            enviarWhatsApp(telefone, mensagem);
        };
        
        // Configurar botão copiar
        document.getElementById('btnCopiarLinkSaida').onclick = () => {
            copiarTexto(linkAssinatura);
        };
        
        mostrarSucesso('Saída registrada com sucesso!');
        
        // Scroll para mensagem
        document.getElementById('mensagemSucessoSaida').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao registrar saída:', error);
        mostrarErro('Erro ao registrar saída: ' + error.message);
    }
}

console.log('✅ Gerenciador de saída carregado!');
