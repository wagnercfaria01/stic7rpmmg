/**
 * MODAL DE SUCESSO - SISTEMA STIC
 * Gerencia modais de sucesso após operações com opções de compartilhamento
 */

const ModalSucesso = {
    
    /**
     * Mostra modal de sucesso após criar OS
     */
    mostrarOS(osId, dados) {
        const link = `${window.location.origin}/pages/acompanhar-os.html?id=${osId}`;
        
        const html = `
            <div class="modal-overlay" id="modalSucessoOverlay">
                <div class="modal-sucesso">
                    <div class="modal-header">
                        <div class="modal-header-icon">✅</div>
                        <h2>Ordem de Serviço Criada!</h2>
                        <p>OS registrada com sucesso no sistema</p>
                    </div>
                    
                    <div class="modal-body">
                        <!-- Resumo -->
                        <div class="resumo-card">
                            <h3>📋 Resumo da OS</h3>
                            <div class="resumo-item">
                                <span class="resumo-label">Número:</span>
                                <span class="resumo-valor">${dados.numero || osId}</span>
                            </div>
                            <div class="resumo-item">
                                <span class="resumo-label">Solicitante:</span>
                                <span class="resumo-valor">${dados.solicitante?.nome || 'Não informado'}</span>
                            </div>
                            ${dados.solicitante?.numero_pm ? `
                            <div class="resumo-item">
                                <span class="resumo-label">Nº Polícia:</span>
                                <span class="resumo-valor">${dados.solicitante.numero_pm}</span>
                            </div>
                            ` : ''}
                            <div class="resumo-item">
                                <span class="resumo-label">Serviço:</span>
                                <span class="resumo-valor">${dados.tipo_servico || dados.tipo_equipamento || 'N/A'}</span>
                            </div>
                            <div class="resumo-item">
                                <span class="resumo-label">Status:</span>
                                <span class="resumo-valor">Aberta</span>
                            </div>
                        </div>
                        
                        <!-- Notificações Enviadas -->
                        <div class="notificacoes-card">
                            <h3>🔔 Notificações Automáticas</h3>
                            <div class="notificacao-item">
                                <span class="notificacao-icon">📱</span>
                                <div class="notificacao-texto">
                                    <div><strong>Telegram Bot</strong></div>
                                    <div style="font-size: 0.875rem; color: #6c757d;">Grupo STIC</div>
                                </div>
                                <span class="notificacao-status">✅</span>
                            </div>
                        </div>
                        
                        <!-- Compartilhar -->
                        <div class="compartilhar-card">
                            <h3>📤 Enviar para o Militar (Manual)</h3>
                            <p style="font-size: 0.875rem; color: #856404; margin-bottom: 1rem;">
                                Escolha como deseja notificar o militar:
                            </p>
                            <div class="botoes-compartilhar">
                                ${dados.numeroPolicia || dados.solicitante?.numero_pm ? `
                                <button class="btn-compartilhar email" onclick="ModalSucesso.enviarEmailManual('OS', '${osId}', ${JSON.stringify(dados).replace(/"/g, '&quot;')})">
                                    <span class="btn-compartilhar-icon">📧</span>
                                    <span>Enviar Email</span>
                                </button>
                                ` : ''}
                                ${dados.telefone || dados.solicitante?.telefone ? `
                                <button class="btn-compartilhar whatsapp" onclick="ModalSucesso.enviarWhatsApp('${dados.telefone || dados.solicitante?.telefone}', '${link}', 'OS', '${dados.numero || osId}')">
                                    <span class="btn-compartilhar-icon">💬</span>
                                    <span>WhatsApp</span>
                                </button>
                                ` : ''}
                                <button class="btn-compartilhar copiar" onclick="ModalSucesso.copiarLink('${link}')">
                                    <span class="btn-compartilhar-icon">🔗</span>
                                    <span>Copiar Link</span>
                                </button>
                                <button class="btn-compartilhar pdf" onclick="ModalSucesso.baixarPDF('OS', '${osId}', ${JSON.stringify(dados).replace(/"/g, '&quot;')})">
                                    <span class="btn-compartilhar-icon">📄</span>
                                    <span>Baixar PDF</span>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Link -->
                        <div class="link-card">
                            <div class="link-input-group">
                                <input type="text" class="link-input" value="${link}" readonly id="linkOS">
                                <button class="btn-copiar-link" onclick="ModalSucesso.copiarLink('${link}')">
                                    <span>📋</span>
                                    <span>Copiar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn-modal primary" onclick="window.location.href='../index.html'">
                            🏠 Voltar ao Dashboard
                        </button>
                        <button class="btn-modal secondary" onclick="ModalSucesso.fechar()">
                            ✏️ Criar Outra OS
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
    },
    
    /**
     * Mostra modal de sucesso após empréstimo
     */
    mostrarEmprestimo(emprestimoId, dados) {
        const link = `${window.location.origin}/assinatura.html?id=${emprestimoId}`;
        
        const html = `
            <div class="modal-overlay" id="modalSucessoOverlay">
                <div class="modal-sucesso">
                    <div class="modal-header">
                        <div class="modal-header-icon">✅</div>
                        <h2>Empréstimo Registrado!</h2>
                        <p>Material emprestado com sucesso</p>
                    </div>
                    
                    <div class="modal-body">
                        <!-- Resumo -->
                        <div class="resumo-card">
                            <h3>📦 Resumo do Empréstimo</h3>
                            <div class="resumo-item">
                                <span class="resumo-label">Recebedor:</span>
                                <span class="resumo-valor">${dados.militar_recebedor || 'Não informado'}</span>
                            </div>
                            <div class="resumo-item">
                                <span class="resumo-label">Material:</span>
                                <span class="resumo-valor">${dados.tipo_material || 'N/A'}</span>
                            </div>
                            <div class="resumo-item">
                                <span class="resumo-label">Patrimônio:</span>
                                <span class="resumo-valor">${dados.patrimonio || 'N/A'}</span>
                            </div>
                            ${dados.prazo_retorno ? `
                            <div class="resumo-item">
                                <span class="resumo-label">Prazo Retorno:</span>
                                <span class="resumo-valor">${this.formatarData(dados.prazo_retorno)}</span>
                            </div>
                            ` : ''}
                        </div>
                        
                        <!-- Notificações -->
                        <div class="notificacoes-card">
                            <h3>🔔 Notificações Automáticas</h3>
                            <div class="notificacao-item">
                                <span class="notificacao-icon">📱</span>
                                <div class="notificacao-texto">
                                    <div><strong>Telegram Bot</strong></div>
                                    <div style="font-size: 0.875rem; color: #6c757d;">Grupo STIC</div>
                                </div>
                                <span class="notificacao-status">✅</span>
                            </div>
                        </div>
                        
                        <!-- Compartilhar -->
                        <div class="compartilhar-card">
                            <h3>📤 Enviar para o Militar (Manual)</h3>
                            <p style="font-size: 0.875rem; color: #856404; margin-bottom: 1rem;">
                                Compartilhe o link de assinatura:
                            </p>
                            <div class="botoes-compartilhar">
                                ${dados.numero_recebedor ? `
                                <button class="btn-compartilhar email" onclick="ModalSucesso.enviarEmailManual('Emprestimo', '${emprestimoId}', ${JSON.stringify(dados).replace(/"/g, '&quot;')})">
                                    <span class="btn-compartilhar-icon">📧</span>
                                    <span>Enviar Email</span>
                                </button>
                                ` : ''}
                                ${dados.telefone || dados.numero_recebedor ? `
                                <button class="btn-compartilhar whatsapp" onclick="ModalSucesso.enviarWhatsApp('${dados.telefone || dados.numero_recebedor}', '${link}', 'Emprestimo', '${emprestimoId}')">
                                    <span class="btn-compartilhar-icon">💬</span>
                                    <span>WhatsApp</span>
                                </button>
                                ` : ''}
                                <button class="btn-compartilhar copiar" onclick="ModalSucesso.copiarLink('${link}')">
                                    <span class="btn-compartilhar-icon">🔗</span>
                                    <span>Copiar Link</span>
                                </button>
                            </div>
                        </div>
                        
                        <!-- Link de Assinatura -->
                        <div class="link-card">
                            <div style="margin-bottom: 0.5rem; font-weight: 600; color: #856404;">
                                🔗 Link para Assinatura do Termo:
                            </div>
                            <div class="link-input-group">
                                <input type="text" class="link-input" value="${link}" readonly>
                                <button class="btn-copiar-link" onclick="ModalSucesso.copiarLink('${link}')">
                                    <span>📋</span>
                                    <span>Copiar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn-modal primary" onclick="ModalSucesso.fechar()">
                            ✅ Entendi
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
    },
    
    /**
     * Enviar WhatsApp
     */
    enviarWhatsApp(telefone, link, tipo, numero) {
        // Limpar telefone
        const tel = telefone.replace(/\D/g, '');
        
        // Mensagens por tipo
        const mensagens = {
            'OS': `*PMMG - STIC 7ª RPM*\n*ORDEM DE SERVIÇO*\n\nSua ordem de serviço ${numero} foi registrada no sistema.\n\n👉 Acompanhe em:\n${link}\n\nDúvidas: (37) 3301-0116`,
            'Emprestimo': `*PMMG - STIC 7ª RPM*\n*EMPRÉSTIMO DE MATERIAL*\n\nPor favor, assine o termo de empréstimo:\n\n👉 ${link}\n\nDúvidas: (37) 3301-0116`
        };
        
        const mensagem = mensagens[tipo] || `Link: ${link}`;
        const url = `https://wa.me/${tel}?text=${encodeURIComponent(mensagem)}`;
        
        window.open(url, '_blank');
        this.mostrarToast('WhatsApp aberto!', 'success');
    },
    
    /**
     * Copiar link
     */
    copiarLink(link) {
        navigator.clipboard.writeText(link).then(() => {
            this.mostrarToast('Link copiado!', 'success');
        }).catch(() => {
            // Fallback para navegadores antigos
            const input = document.createElement('input');
            input.value = link;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            this.mostrarToast('Link copiado!', 'success');
        });
    },
    
    /**
     * Baixar PDF
     */
    async baixarPDF(tipo, id, dados) {
        try {
            this.mostrarToast('Gerando PDF...', 'success');
            
            // Importar jsPDF se necessário
            if (typeof jspdf === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                document.head.appendChild(script);
                await new Promise(resolve => script.onload = resolve);
            }
            
            // Importar QRCode se necessário
            if (typeof QRCode === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
                document.head.appendChild(script);
                await new Promise(resolve => script.onload = resolve);
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Cabeçalho
            doc.setFontSize(20);
            doc.text('PMMG - STIC 7ª RPM', 105, 20, { align: 'center' });
            
            doc.setFontSize(16);
            doc.text(tipo === 'OS' ? 'Ordem de Serviço' : 'Comprovante', 105, 30, { align: 'center' });
            
            // Linha
            doc.setLineWidth(0.5);
            doc.line(20, 35, 190, 35);
            
            // Dados
            doc.setFontSize(12);
            let y = 50;
            
            if (tipo === 'OS') {
                doc.text(`Número: ${dados.numero || id}`, 20, y);
                y += 10;
                doc.text(`Solicitante: ${dados.solicitante?.nome || 'N/A'}`, 20, y);
                y += 10;
                if (dados.solicitante?.numero_pm) {
                    doc.text(`Nº Polícia: ${dados.solicitante.numero_pm}`, 20, y);
                    y += 10;
                }
                doc.text(`Serviço: ${dados.tipo_servico || dados.tipo_equipamento || 'N/A'}`, 20, y);
                y += 10;
                doc.text(`Status: Aberta`, 20, y);
                y += 10;
                doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, 20, y);
                y += 20;
                
                // Gerar QR Code
                const linkOS = `${window.location.origin}/pages/acompanhar-os.html?id=${id}`;
                
                // Criar elemento temporário para QR Code
                const qrDiv = document.createElement('div');
                qrDiv.style.display = 'none';
                document.body.appendChild(qrDiv);
                
                const qr = new QRCode(qrDiv, {
                    text: linkOS,
                    width: 128,
                    height: 128
                });
                
                // Aguardar geração do QR Code
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Obter imagem do QR Code
                const qrImage = qrDiv.querySelector('canvas').toDataURL('image/png');
                
                // Adicionar QR Code no PDF
                doc.addImage(qrImage, 'PNG', 150, y, 40, 40);
                
                // Texto ao lado do QR Code
                doc.setFontSize(10);
                doc.text('Escaneie para', 20, y + 10);
                doc.text('acompanhar a OS:', 20, y + 15);
                doc.setFontSize(8);
                const linkTexto = doc.splitTextToSize(linkOS, 120);
                doc.text(linkTexto, 20, y + 22);
                
                // Limpar elemento temporário
                document.body.removeChild(qrDiv);
            }
            
            // Rodapé
            doc.setFontSize(10);
            doc.text('STIC - Seção de Tecnologia da Informação', 105, 280, { align: 'center' });
            doc.text('Tel: (37) 3301-0116', 105, 285, { align: 'center' });
            
            // Download
            doc.save(`${tipo}-${id}.pdf`);
            this.mostrarToast('PDF baixado!', 'success');
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            this.mostrarToast('Erro ao gerar PDF', 'error');
        }
    },
    
    /**
     * Enviar email manualmente
     */
    async enviarEmailManual(tipo, id, dados) {
        try {
            this.mostrarToast('Enviando email...', 'success');
            
            if (tipo === 'OS') {
                if (typeof EmailAutomatico !== 'undefined' && EmailAutomatico.enviarEmailAberuraOS) {
                    await EmailAutomatico.enviarEmailAberuraOS(id, dados);
                    this.mostrarToast('Email enviado!', 'success');
                } else {
                    this.mostrarToast('Sistema de email indisponível', 'error');
                }
            } else if (tipo === 'Emprestimo') {
                if (typeof EmailAutomatico !== 'undefined' && EmailAutomatico.enviarEmailEmprestimo) {
                    await EmailAutomatico.enviarEmailEmprestimo(dados.numero_recebedor, dados, id);
                    this.mostrarToast('Email enviado!', 'success');
                } else {
                    this.mostrarToast('Sistema de email indisponível', 'error');
                }
            }
            
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            this.mostrarToast('Erro ao enviar email', 'error');
        }
    },
    
    /**
     * Fechar modal
     */
    fechar() {
        const modal = document.getElementById('modalSucessoOverlay');
        if (modal) {
            modal.remove();
        }
    },
    
    /**
     * Mostrar toast
     */
    mostrarToast(mensagem, tipo = 'success') {
        const icon = tipo === 'success' ? '✅' : '❌';
        const toast = document.createElement('div');
        toast.className = `toast ${tipo === 'error' ? 'error' : ''}`;
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span>${mensagem}</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    },
    
    /**
     * Gerar email PMMG
     */
    gerarEmailPMMG(numeroPolicia) {
        if (!numeroPolicia) return 'N/A';
        const numeroLimpo = String(numeroPolicia).replace(/\D/g, '');
        return `${numeroLimpo}@pmmg.mg.gov.br`;
    },
    
    /**
     * Formatar data
     */
    formatarData(data) {
        if (!data) return 'N/A';
        if (typeof data === 'string') {
            return new Date(data).toLocaleDateString('pt-BR');
        }
        return data;
    }
};

console.log('✅ Modal de Sucesso carregado!');
