// ==========================================
// SISTEMA DE TELEGRAM AUTOMÁTICO - STIC 7ª RPM
// Versão Final: 3.0
// ==========================================

(function() {
    'use strict';

    // ==========================================
    // CONFIGURAÇÕES DO TELEGRAM
    // ==========================================
    const TELEGRAM_CONFIG = {
        BOT_TOKEN: '8222354261:AAFEbbvm9DyZhDWF2muMqzOTzk3KQyFVZP8',
        CHAT_ID: '-5234577304',
        API_URL: 'https://api.telegram.org/bot'
    };

    const CONTATO_STIC = {
        telefone: '(37) 3301-0116',
        email: 'stic7rpmmg@gmail.com'
    };

    // ==========================================
    // FUNÇÃO PRINCIPAL DE ENVIO
    // ==========================================
    
    /**
     * Envia mensagem para o grupo do Telegram
     * @param {string} mensagem - Texto da mensagem (suporta Markdown)
     * @returns {Promise} Resposta da API do Telegram
     */
    async function enviarMensagemTelegram(mensagem) {
        try {
            console.log('📱 [TelegramSTIC] Enviando mensagem...');
            
            const url = `${TELEGRAM_CONFIG.API_URL}${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CONFIG.CHAT_ID,
                    text: mensagem,
                    parse_mode: 'Markdown'
                })
            });

            const data = await response.json();
            
            if (data.ok) {
                console.log('✅ [TelegramSTIC] Mensagem enviada com sucesso!');
                return data;
            } else {
                console.error('❌ [TelegramSTIC] Erro na resposta da API:', data);
                throw new Error(data.description || 'Erro desconhecido ao enviar mensagem');
            }
            
        } catch (error) {
            console.error('❌ [TelegramSTIC] Erro ao enviar mensagem:', error);
            throw error;
        }
    }

    // ==========================================
    // NOTIFICAÇÕES ESPECÍFICAS
    // ==========================================

    /**
     * Escapar caracteres especiais do Markdown do Telegram
     */
    function escaparMarkdown(texto) {
        if (!texto) return '';
        // Escapar caracteres que quebram o Markdown do Telegram
        return String(texto)
            .replace(/\\/g, '\\\\')
            .replace(/_/g, '\\_')
            .replace(/\*/g, '\\*')
            .replace(/\[/g, '\\[')
            .replace(/\]/g, '\\]')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)')
            .replace(/~/g, '\\~')
            .replace(/`/g, '\\`')
            .replace(/>/g, '\\>')
            .replace(/#/g, '\\#')
            .replace(/\+/g, '\\+')
            .replace(/-/g, '\\-')
            .replace(/=/g, '\\=')
            .replace(/\|/g, '\\|')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}')
            .replace(/\./g, '\\.')
            .replace(/!/g, '\\!');
    }

    /**
     * 1. NOTIFICAÇÃO DE NOVA OS
     */
    async function notificarNovaOS(osData) {
        try {
            console.log('📱 [TelegramSTIC] Notificando nova OS...');
            
            const numeroOS = escaparMarkdown(osData.numero || osData.id || 'N/A');
            const solicitante = escaparMarkdown(osData.solicitante?.nome || osData.nome_solicitante || 'Não informado');
            const numeroPolicia = escaparMarkdown(osData.solicitante?.numero_pm || osData.numero_policia || 'N/A');
            const tipoServico = escaparMarkdown(osData.tipo_servico || osData.tipo_equipamento || 'Serviço técnico');
            const defeito = escaparMarkdown(osData.defeito || osData.descricao_servico || '');
            const prioridade = escaparMarkdown(osData.prioridade || 'Normal');

            const mensagem = `
🛠️ *NOVA ORDEM DE SERVIÇO*
━━━━━━━━━━━━━━━━━━━━━

*Número:* ${numeroOS}
*Solicitante:* ${solicitante}
*Nº Polícia:* ${numeroPolicia}
*Serviço:* ${tipoServico}
*Prioridade:* ${prioridade}
${defeito ? `\n*Defeito:* ${defeito}` : ''}

📞 *Contato STIC:* ${CONTATO_STIC.telefone}
            `.trim();

            return await enviarMensagemTelegram(mensagem);
            
        } catch (error) {
            console.error('❌ [TelegramSTIC] Erro ao notificar nova OS:', error);
            return null;
        }
    }

    /**
     * 2. NOTIFICAÇÃO DE ATUALIZAÇÃO DE OS
     */
    async function notificarAtualizacaoOS(osData, statusAnterior, statusNovo) {
        try {
            console.log('📱 [TelegramSTIC] Notificando atualização de OS...');
            
            const numeroOS = osData.numero || osData.id || 'N/A';
            const solicitante = osData.solicitante?.nome || osData.nome_solicitante || 'Não informado';

            const mensagem = `
🔄 *ATUALIZAÇÃO DE OS*
━━━━━━━━━━━━━━━━━━━━━

*Número:* ${numeroOS}
*Solicitante:* ${solicitante}

*Status Anterior:* ${statusAnterior || 'N/A'}
*Status Atual:* ${statusNovo || 'N/A'}

📞 *Contato STIC:* ${CONTATO_STIC.telefone}
            `.trim();

            return await enviarMensagemTelegram(mensagem);
            
        } catch (error) {
            console.error('❌ [TelegramSTIC] Erro ao notificar atualização de OS:', error);
            return null;
        }
    }

    /**
     * 3. NOTIFICAÇÃO DE OS FINALIZADA
     */
    async function notificarOSFinalizada(osData) {
        try {
            console.log('📱 [TelegramSTIC] Notificando OS finalizada...');
            
            const numeroOS = osData.numero || osData.id || 'N/A';
            const solicitante = osData.solicitante?.nome || osData.nome_solicitante || 'Não informado';

            const mensagem = `
✅ *OS FINALIZADA*
━━━━━━━━━━━━━━━━━━━━━

*Número:* ${numeroOS}
*Solicitante:* ${solicitante}
*Status:* Finalizada

📞 *Contato STIC:* ${CONTATO_STIC.telefone}
            `.trim();

            return await enviarMensagemTelegram(mensagem);
            
        } catch (error) {
            console.error('❌ [TelegramSTIC] Erro ao notificar OS finalizada:', error);
            return null;
        }
    }

    /**
     * 4. NOTIFICAÇÃO DE EMPRÉSTIMO DE MATERIAL
     */
    async function notificarEmprestimo(emprestimoData) {
        try {
            console.log('📱 [TelegramSTIC] Notificando empréstimo...');
            
            const militar = emprestimoData.militar_recebedor || emprestimoData.nome_militar || 'Não informado';
            const numeroPolicia = emprestimoData.numero_recebedor || emprestimoData.numero_policia || 'N/A';
            const patrimonio = emprestimoData.patrimonio || 'N/A';
            const material = emprestimoData.tipo_material || emprestimoData.material || 'Material';
            const quantidade = emprestimoData.quantidade_itens || emprestimoData.quantidade || 1;
            const prazo = emprestimoData.prazo_retorno || emprestimoData.data_retorno || 'N/A';
            
            const linkAssinatura = `${window.location.origin}/assinatura.html?id=${emprestimoData.id || 'ID'}`;

            const mensagem = `
📦 *EMPRÉSTIMO DE MATERIAL*
━━━━━━━━━━━━━━━━━━━━━

*Militar:* ${militar}
*Nº Polícia:* ${numeroPolicia}
${patrimonio !== 'N/A' ? `*Patrimônio:* ${patrimonio}\n` : ''}*Material:* ${material}
*Quantidade:* ${quantidade}
*Prazo de Retorno:* ${prazo}

✍️ *Assinatura Digital:*
${linkAssinatura}

📞 *Contato STIC:* ${CONTATO_STIC.telefone}
            `.trim();

            return await enviarMensagemTelegram(mensagem);
            
        } catch (error) {
            console.error('❌ [TelegramSTIC] Erro ao notificar empréstimo:', error);
            return null;
        }
    }

    /**
     * 5. NOTIFICAÇÃO DE ENTRADA DE MATERIAL
     */
    async function notificarEntradaMaterial(entradaData) {
        try {
            console.log('📱 [TelegramSTIC] Notificando entrada de material...');
            
            const militar = entradaData.militar_entregador?.nome || entradaData.nome_militar || 'Não informado';
            const numeroPolicia = entradaData.militar_entregador?.numero_pm || entradaData.numero_policia || 'N/A';
            const patrimonio = entradaData.patrimonio || 'N/A';
            const material = entradaData.tipo_material || entradaData.material || 'Material';
            const estado = entradaData.estado_conservacao || entradaData.estado || 'N/A';

            const mensagem = `
📥 *ENTRADA DE MATERIAL*
━━━━━━━━━━━━━━━━━━━━━

*Militar:* ${militar}
*Nº Polícia:* ${numeroPolicia}
${patrimonio !== 'N/A' ? `*Patrimônio:* ${patrimonio}\n` : ''}*Material:* ${material}
*Estado:* ${estado}
*Data/Hora:* ${new Date().toLocaleString('pt-BR')}

📞 *Contato STIC:* ${CONTATO_STIC.telefone}
            `.trim();

            return await enviarMensagemTelegram(mensagem);
            
        } catch (error) {
            console.error('❌ [TelegramSTIC] Erro ao notificar entrada de material:', error);
            return null;
        }
    }

    /**
     * 6. NOTIFICAÇÃO DE SAÍDA DE MATERIAL
     */
    async function notificarSaidaMaterial(saidaData) {
        try {
            console.log('📱 [TelegramSTIC] Notificando saída de material...');
            
            const militar = saidaData.militar_recebedor || saidaData.nome_militar || 'Não informado';
            const numeroPolicia = saidaData.numero_recebedor || saidaData.numero_policia || 'N/A';
            const patrimonio = saidaData.patrimonio || 'N/A';
            const material = saidaData.tipo_material || saidaData.material || 'Material';
            const destino = saidaData.destino || 'Não informado';
            
            const linkAssinatura = `${window.location.origin}/assinatura.html?id=${saidaData.id || 'ID'}&tipo=saida`;

            const mensagem = `
📤 *SAÍDA DE MATERIAL*
━━━━━━━━━━━━━━━━━━━━━

*Militar:* ${militar}
*Nº Polícia:* ${numeroPolicia}
${patrimonio !== 'N/A' ? `*Patrimônio:* ${patrimonio}\n` : ''}*Material:* ${material}
*Destino:* ${destino}
*Data/Hora:* ${new Date().toLocaleString('pt-BR')}

✍️ *Assinatura Digital:*
${linkAssinatura}

📞 *Contato STIC:* ${CONTATO_STIC.telefone}
            `.trim();

            return await enviarMensagemTelegram(mensagem);
            
        } catch (error) {
            console.error('❌ [TelegramSTIC] Erro ao notificar saída de material:', error);
            return null;
        }
    }

    // ==========================================
    // EXPORTAR PARA WINDOW
    // ==========================================
    
    window.TelegramSTIC = {
        notificarNovaOS,
        notificarAtualizacaoOS,
        notificarOSFinalizada,
        notificarEmprestimo,
        notificarEntradaMaterial,
        notificarSaidaMaterial,
        // Função genérica para testes
        enviarMensagem: enviarMensagemTelegram
    };

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================
    
    console.log('✅ [TelegramSTIC] Sistema inicializado!');
    console.log('🤖 [TelegramSTIC] Bot Token:', TELEGRAM_CONFIG.BOT_TOKEN.substring(0, 25) + '...');
    console.log('💬 [TelegramSTIC] Chat ID:', TELEGRAM_CONFIG.CHAT_ID);

})();
