// ==========================================
// SISTEMA DE EMAIL AUTOMÁTICO - STIC 7ª RPM
// Versão Final: 3.0
// ==========================================

(function() {
    'use strict';

    // ==========================================
    // CONFIGURAÇÕES
    // ==========================================
    const CONFIG = {
        SERVICE_ID: 'service_778ldur',
        TEMPLATE_ID: 'template_5g8jixl',
        PUBLIC_KEY: 'LDlUqkqdk_ZNRLN22',
        
        CONTATO_STIC: {
            // telefone removido - não exibir em PDFs
            email: 'stic7rpmmg@gmail.com'
        },
        
        // URL base detectada automaticamente
        URL_BASE: window.location.origin
    };

    // ==========================================
    // UTILITÁRIOS
    // ==========================================
    
    /**
     * Gera email PMMG a partir do número de polícia
     * @param {string} numeroPolicia - Número do PM (ex: 1633965 ou 163396-5)
     * @returns {string|null} Email no formato numeroPolicia@pmmg.mg.gov.br
     */
    function gerarEmailPMMG(numeroPolicia) {
        if (!numeroPolicia) {
            console.warn('⚠️ [EmailAutomatico] Número de polícia não fornecido');
            return null;
        }
        
        // Remove todos os caracteres não numéricos
        const numeroLimpo = String(numeroPolicia).replace(/\D/g, '');
        
        if (!numeroLimpo) {
            console.warn('⚠️ [EmailAutomatico] Número de polícia inválido:', numeroPolicia);
            return null;
        }
        
        const email = `${numeroLimpo}@pmmg.mg.gov.br`;
        console.log(`📧 [EmailAutomatico] Email gerado: ${email}`);
        return email;
    }

    /**
     * Formata data para exibição
     */
    function formatarData(data) {
        if (!data) return 'N/A';
        
        if (data instanceof Date) {
            return data.toLocaleDateString('pt-BR');
        }
        
        if (typeof data === 'string') {
            const d = new Date(data);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('pt-BR');
            }
            return data;
        }
        
        return 'N/A';
    }

    /**
     * Formata data e hora para exibição
     */
    function formatarDataHora(data) {
        if (!data) return 'N/A';
        
        if (data instanceof Date) {
            return data.toLocaleString('pt-BR');
        }
        
        if (typeof data === 'string') {
            const d = new Date(data);
            if (!isNaN(d.getTime())) {
                return d.toLocaleString('pt-BR');
            }
            return data;
        }
        
        return 'N/A';
    }

    // ==========================================
    // FUNÇÃO PRINCIPAL DE ENVIO
    // ==========================================
    
    /**
     * Envia email via EmailJS
     * @param {string} destinatario - Email do destinatário
     * @param {string} assunto - Assunto do email
     * @param {object} conteudo - Objeto com os campos do template
     */
    async function enviarEmail(destinatario, assunto, conteudo) {
        try {
            console.log('📧 [EmailAutomatico] Iniciando envio...');
            console.log('📧 [EmailAutomatico] Destinatário:', destinatario);
            console.log('📧 [EmailAutomatico] Assunto:', assunto);
            
            if (!destinatario) {
                throw new Error('Destinatário não informado');
            }

            if (typeof emailjs === 'undefined') {
                throw new Error('EmailJS não carregado. Verifique se o script está incluído no HTML.');
            }

            const templateParams = {
                email_destinatario: destinatario,
                assunto: assunto,
                mensagem_inicial: conteudo.mensagem_inicial || '',
                nome_militar: conteudo.nome_militar || '',
                titulo_secao: conteudo.titulo_secao || '',
                conteudo_principal: conteudo.conteudo_principal || '',
                observacoes: conteudo.observacoes || ''
            };

            const response = await emailjs.send(
                CONFIG.SERVICE_ID,
                CONFIG.TEMPLATE_ID,
                templateParams,
                CONFIG.PUBLIC_KEY
            );

            console.log('✅ [EmailAutomatico] Email enviado com sucesso!', response);
            
            // Tentar salvar log (não crítico)
            try {
                if (typeof db !== 'undefined' && db) {
                    await db.collection('logs_email').add({
                        destinatario: destinatario,
                        assunto: assunto,
                        status: 'enviado',
                        data: firebase.firestore.FieldValue.serverTimestamp(),
                        response_status: response.status
                    });
                }
            } catch (logError) {
                console.warn('⚠️ [EmailAutomatico] Erro ao salvar log:', logError.message);
            }

            return response;
            
        } catch (error) {
            console.error('❌ [EmailAutomatico] Erro ao enviar email:', error);
            
            // Tentar salvar log de erro (não crítico)
            try {
                if (typeof db !== 'undefined' && db) {
                    await db.collection('logs_email').add({
                        destinatario: destinatario,
                        assunto: assunto,
                        status: 'erro',
                        erro: error.message,
                        data: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            } catch (logError) {
                // Ignora silenciosamente
            }
            
            throw error;
        }
    }

    // ==========================================
    // FUNÇÕES ESPECÍFICAS DE NOTIFICAÇÃO
    // ==========================================

    /**
     * 1. NOTIFICAÇÃO DE ABERTURA DE OS
     */
    async function enviarEmailAberuraOS(osId, dados) {
        try {
            console.log('📧 [EmailAutomatico] Enviando email de abertura de OS...');
            
            const numeroPolicia = dados.numeroPolicia || 
                                  dados.solicitante?.numero_pm || 
                                  dados.numero_policia;
            
            const emailDestinatario = gerarEmailPMMG(numeroPolicia);
            
            if (!emailDestinatario) {
                console.warn('⚠️ [EmailAutomatico] Não foi possível gerar email. Operação cancelada.');
                return null;
            }

            const numeroOS = dados.numero || osId;
            const nomeSolicitante = dados.solicitante?.nome || dados.nome_solicitante || 'Não informado';
            const tipoServico = dados.tipo_servico || dados.tipo_equipamento || 'Serviço técnico';
            const defeito = dados.defeito || dados.descricao_servico || '';
            
            const linkAcompanhamento = `${CONFIG.URL_BASE}/pages/acompanhar-os-CONFIGURADO.html?id=${osId}`;

            const conteudo = {
                nome_militar: nomeSolicitante,
                mensagem_inicial: 'Uma nova ordem de serviço foi aberta para você no Sistema STIC 7ª RPM.',
                titulo_secao: '📋 Dados da Ordem de Serviço',
                conteudo_principal: `
Número da OS: ${numeroOS}
Solicitante: ${nomeSolicitante}
Serviço: ${tipoServico}
Status: Aberta
${defeito ? `\nDefeito Relatado:\n${defeito}` : ''}

🔗 Acompanhe sua OS em:
${linkAcompanhamento}
                `.trim(),
                observacoes: `
Dúvidas entre em contato com a STIC:
📧 Email: ${CONFIG.CONTATO_STIC.email}
                `.trim()
            };

            return await enviarEmail(
                emailDestinatario,
                `[STIC 7ª RPM] Nova Ordem de Serviço - ${numeroOS}`,
                conteudo
            );
            
        } catch (error) {
            console.error('❌ [EmailAutomatico] Erro ao enviar email de abertura de OS:', error);
            return null;
        }
    }

    /**
     * 2. NOTIFICAÇÃO DE EMPRÉSTIMO DE MATERIAL
     */
    async function enviarEmailEmprestimo(numeroPolicia, dados, emprestimoId) {
        try {
            console.log('📧 [EmailAutomatico] Enviando email de empréstimo...');
            
            const emailDestinatario = gerarEmailPMMG(numeroPolicia);
            
            if (!emailDestinatario) {
                console.warn('⚠️ [EmailAutomatico] Não foi possível gerar email. Operação cancelada.');
                return null;
            }

            const nomeMilitar = dados.militar_recebedor || dados.nome_militar || 'Não informado';
            const patrimonio = dados.patrimonio || 'N/A';
            const material = dados.tipo_material || dados.material || 'Material';
            const quantidade = dados.quantidade_itens || dados.quantidade || 1;
            const prazo = dados.prazo_retorno || dados.data_retorno || 'N/A';
            
            const linkAssinatura = `${CONFIG.URL_BASE}/assinatura.html?id=${emprestimoId}`;

            const conteudo = {
                nome_militar: nomeMilitar,
                mensagem_inicial: 'Registramos um empréstimo de material em seu nome no Sistema STIC 7ª RPM.',
                titulo_secao: '📦 Empréstimo de Material',
                conteudo_principal: `
Militar Recebedor: ${nomeMilitar}
Número Polícia: ${numeroPolicia}
${patrimonio !== 'N/A' ? `Patrimônio: ${patrimonio}` : ''}
Material: ${material}
Quantidade: ${quantidade}
Prazo de Retorno: ${prazo}

✍️ ASSINATURA DIGITAL:
Por favor, acesse o link abaixo para assinar digitalmente o termo de empréstimo:
${linkAssinatura}
                `.trim(),
                observacoes: `
Dúvidas entre em contato com a STIC:
📧 Email: ${CONFIG.CONTATO_STIC.email}
                `.trim()
            };

            return await enviarEmail(
                emailDestinatario,
                `[STIC 7ª RPM] Empréstimo de Material - Assinatura Necessária`,
                conteudo
            );
            
        } catch (error) {
            console.error('❌ [EmailAutomatico] Erro ao enviar email de empréstimo:', error);
            return null;
        }
    }

    /**
     * 3. NOTIFICAÇÃO DE ENTRADA DE MATERIAL
     */
    async function enviarEmailEntradaMaterial(numeroPolicia, dados) {
        try {
            console.log('📧 [EmailAutomatico] Enviando email de entrada de material...');
            
            const emailDestinatario = gerarEmailPMMG(numeroPolicia);
            
            if (!emailDestinatario) {
                console.warn('⚠️ [EmailAutomatico] Não foi possível gerar email. Operação cancelada.');
                return null;
            }

            const nomeMilitar = dados.militar_entregador?.nome || dados.nome_militar || 'Não informado';
            const patrimonio = dados.patrimonio || 'N/A';
            const material = dados.tipo_material || dados.material || 'Material';
            const estado = dados.estado_conservacao || dados.estado || 'N/A';

            const conteudo = {
                nome_militar: nomeMilitar,
                mensagem_inicial: 'Registramos a entrada de material no Sistema STIC 7ª RPM.',
                titulo_secao: '📥 Entrada de Material',
                conteudo_principal: `
Militar Entregador: ${nomeMilitar}
Número Polícia: ${numeroPolicia}
${patrimonio !== 'N/A' ? `Patrimônio: ${patrimonio}` : ''}
Material: ${material}
Estado de Conservação: ${estado}
Data/Hora: ${formatarDataHora(new Date())}
                `.trim(),
                observacoes: `
Dúvidas entre em contato com a STIC:
📧 Email: ${CONFIG.CONTATO_STIC.email}
                `.trim()
            };

            return await enviarEmail(
                emailDestinatario,
                `[STIC 7ª RPM] Entrada de Material Registrada`,
                conteudo
            );
            
        } catch (error) {
            console.error('❌ [EmailAutomatico] Erro ao enviar email de entrada de material:', error);
            return null;
        }
    }

    /**
     * 4. NOTIFICAÇÃO DE SAÍDA DE MATERIAL
     */
    async function enviarEmailSaidaMaterial(numeroPolicia, dados, saidaId) {
        try {
            console.log('📧 [EmailAutomatico] Enviando email de saída de material...');
            
            const emailDestinatario = gerarEmailPMMG(numeroPolicia);
            
            if (!emailDestinatario) {
                console.warn('⚠️ [EmailAutomatico] Não foi possível gerar email. Operação cancelada.');
                return null;
            }

            const nomeMilitar = dados.militar_recebedor || dados.nome_militar || 'Não informado';
            const patrimonio = dados.patrimonio || 'N/A';
            const material = dados.tipo_material || dados.material || 'Material';
            const destino = dados.destino || 'Não informado';
            
            const linkAssinatura = `${CONFIG.URL_BASE}/assinatura.html?id=${saidaId}&tipo=saida`;

            const conteudo = {
                nome_militar: nomeMilitar,
                mensagem_inicial: 'Registramos uma saída de material em seu nome no Sistema STIC 7ª RPM.',
                titulo_secao: '📤 Saída de Material',
                conteudo_principal: `
Militar Recebedor: ${nomeMilitar}
Número Polícia: ${numeroPolicia}
${patrimonio !== 'N/A' ? `Patrimônio: ${patrimonio}` : ''}
Material: ${material}
Destino: ${destino}
Data/Hora: ${formatarDataHora(new Date())}

✍️ ASSINATURA DIGITAL:
Por favor, acesse o link abaixo para assinar digitalmente o termo de saída:
${linkAssinatura}
                `.trim(),
                observacoes: `
Dúvidas entre em contato com a STIC:
📧 Email: ${CONFIG.CONTATO_STIC.email}
                `.trim()
            };

            return await enviarEmail(
                emailDestinatario,
                `[STIC 7ª RPM] Saída de Material - Assinatura Necessária`,
                conteudo
            );
            
        } catch (error) {
            console.error('❌ [EmailAutomatico] Erro ao enviar email de saída de material:', error);
            return null;
        }
    }

    // ==========================================
    // EXPORTAR PARA WINDOW
    // ==========================================
    
    window.EmailAutomatico = {
        enviarEmailAberuraOS,
        enviarEmailEmprestimo,
        enviarEmailEntradaMaterial,
        enviarEmailSaidaMaterial,
        // Utilitários expostos
        gerarEmailPMMG
    };

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================
    
    console.log('✅ [EmailAutomatico] Sistema inicializado!');
    console.log('📧 [EmailAutomatico] Service ID:', CONFIG.SERVICE_ID);
    console.log('📝 [EmailAutomatico] Template ID:', CONFIG.TEMPLATE_ID);
    console.log('📞 [EmailAutomatico] Telefone STIC:', CONFIG.CONTATO_STIC.telefone);
    console.log('🌐 [EmailAutomatico] URL Base:', CONFIG.URL_BASE);

})();
