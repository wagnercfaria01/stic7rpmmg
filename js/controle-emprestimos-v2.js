// ====================================
// CONTROLE DE EMPRÉSTIMOS V2 - COM ABAS
// ====================================

let todosEmprestimos = [];
let filtroAtual = 'todos';
let itensEmprestimo = []; // Lista de itens a emprestar

// ====================
// GESTÃO DE MÚLTIPLOS ITENS
// ====================

function adicionarItemEmprestimo() {
    const tipoMaterial = document.getElementById('tipoMaterial').value;
    const patrimonio = document.getElementById('patrimonioItem').value;
    const numeroSerie = document.getElementById('numeroSerieItem').value;
    const estado = document.getElementById('estadoItem').value;
    const observacao = document.getElementById('observacaoItem').value;
    
    // Validações
    if (!tipoMaterial) {
        alert('❌ Selecione o tipo de material primeiro!');
        return;
    }
    
    if (!patrimonio || patrimonio.trim() === '') {
        alert('❌ Informe o patrimônio do item!');
        return;
    }
    
    // Verificar duplicata
    const duplicado = itensEmprestimo.find(item => item.patrimonio === patrimonio);
    if (duplicado) {
        alert('❌ Este patrimônio já foi adicionado!');
        return;
    }
    
    // Adicionar à lista
    const item = {
        tipo: tipoMaterial,
        patrimonio: patrimonio,
        numero_serie: numeroSerie || '',
        estado: estado,
        observacao: observacao || ''
    };
    
    itensEmprestimo.push(item);
    
    // Limpar campos
    document.getElementById('patrimonioItem').value = '';
    document.getElementById('numeroSerieItem').value = '';
    document.getElementById('estadoItem').value = 'bom';
    document.getElementById('observacaoItem').value = '';
    
    // Atualizar exibição
    renderizarListaItens();
    
    console.log('✅ Item adicionado:', item);
}

function removerItemEmprestimo(index) {
    if (confirm('Remover este item da lista?')) {
        itensEmprestimo.splice(index, 1);
        renderizarListaItens();
    }
}

function renderizarListaItens() {
    const container = document.getElementById('containerItens');
    
    if (itensEmprestimo.length === 0) {
        container.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #666; background: #f9f9f9; border-radius: 8px; border: 2px dashed #ddd;">
                Nenhum item adicionado ainda.<br>
                <small>Use o formulário abaixo para adicionar itens</small>
            </div>
        `;
        return;
    }
    
    const html = itensEmprestimo.map((item, index) => `
        <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 1rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
            <div style="flex: 1;">
                <strong style="color: #2196f3;">${formatarTipoMaterial(item.tipo)}</strong>
                <span style="margin: 0 0.5rem;">•</span>
                <strong>Patrimônio: ${item.patrimonio}</strong>
                ${item.numero_serie ? `<span style="margin: 0 0.5rem;">•</span><span style="color: #666;">Série: ${item.numero_serie}</span>` : ''}
                <br>
                <small style="color: #666;">
                    Estado: ${getEstadoTexto(item.estado)}
                    ${item.observacao ? ` • ${item.observacao}` : ''}
                </small>
            </div>
            <button onclick="removerItemEmprestimo(${index})" class="btn-secondary" style="padding: 0.5rem 1rem; white-space: nowrap;">
                🗑️ Remover
            </button>
        </div>
    `).join('');
    
    container.innerHTML = `
        <div style="background: #e8f5e9; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <strong>✅ ${itensEmprestimo.length} ${itensEmprestimo.length === 1 ? 'item adicionado' : 'itens adicionados'}</strong>
        </div>
        ${html}
    `;
}

// ====================
// SISTEMA DE ABAS
// ====================

function abrirAba(nomeAba) {
    // Esconder todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Desmarcar todos os botões
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar aba selecionada
    document.getElementById(`aba-${nomeAba}`).classList.add('active');
    event.target.classList.add('active');
    
    // Carregar dados da aba
    if (nomeAba === 'ativos') {
        carregarEmprestimosAtivos();
    } else if (nomeAba === 'historico') {
        carregarHistoricoCompleto();
    }
}

// ====================
// NOVO EMPRÉSTIMO
// ====================

document.addEventListener('DOMContentLoaded', () => {
    // Definir prazo padrão (7 dias)
    const prazoInput = document.getElementById('prazoRetorno');
    if (prazoInput) {
        const hoje = new Date();
        hoje.setDate(hoje.getDate() + 7);
        prazoInput.value = hoje.toISOString().split('T')[0];
    }
    
    // Form submit
    const form = document.getElementById('formNovoEmprestimo');
    if (form) {
        form.addEventListener('submit', registrarNovoEmprestimo);
    }
    
    // Inicializar lista de itens
    renderizarListaItens();
    
    // Carregar estatísticas
    carregarEstatisticas();
});

async function registrarNovoEmprestimo(e) {
    e.preventDefault();
    
    // Validar se tem itens
    if (itensEmprestimo.length === 0) {
        alert('❌ Adicione pelo menos 1 item ao empréstimo!');
        return;
    }
    
    if (!confirm(`Confirma o empréstimo de ${itensEmprestimo.length} ${itensEmprestimo.length === 1 ? 'item' : 'itens'}?`)) {
        return;
    }
    
    mostrarLoading('Registrando empréstimo...');
    
    try {
        const usuarioNome = sessionStorage.getItem('stic_usuario_nome') || 'Sistema';
        const usuarioNumero = sessionStorage.getItem('stic_usuario_numero') || '';
        
        const emprestimo = {
            // MÚLTIPLOS ITENS
            itens: itensEmprestimo,
            quantidade_itens: itensEmprestimo.length,
            tipo_material: document.getElementById('tipoMaterial').value,
            
            // Para compatibilidade com sistema antigo (primeiro item)
            patrimonio: itensEmprestimo[0].patrimonio,
            numero_serie: itensEmprestimo[0].numero_serie || '',
            estado_conservacao: itensEmprestimo[0].estado,
            
            // Tipo
            tipo_saida: 'emprestimo',
            status: 'emprestado',
            
            // Recebedor
            militar_recebedor: document.getElementById('nomeRecebedor').value,
            numero_recebedor: document.getElementById('numeroPolicia').value,
            recebedor: {
                tipo: 'militar',
                nome: document.getElementById('nomeRecebedor').value,
                numero_policia: document.getElementById('numeroPolicia').value,
                unidade: document.getElementById('unidadeRecebedor').value,
                telefone: document.getElementById('telefoneRecebedor').value
            },
            
            // Empréstimo
            data_saida: new Date().toISOString().split('T')[0],
            hora_saida: new Date().toTimeString().slice(0, 5),
            prazo_retorno: document.getElementById('prazoRetorno').value,
            hora_retorno: document.getElementById('horaRetorno').value,
            finalidade_emprestimo: document.getElementById('finalidade').value,
            
            // Sistema
            registrado_por: `${usuarioNome}${usuarioNumero ? ' - ' + usuarioNumero : ''}`,
            data_registro: firebase.firestore.FieldValue.serverTimestamp(),
            
            // Motivo
            motivo: 'emprestimo',
            observacoes: `Empréstimo de ${itensEmprestimo.length} ${itensEmprestimo.length === 1 ? 'item' : 'itens'} - ${document.getElementById('finalidade').value}`
        };
        
        // Salvar
        const docRef = await saidasRef.add(emprestimo);
        
        console.log('✅ Empréstimo registrado:', docRef.id);
        
        // Registrar log
        if (typeof logCriacao === 'function') {
            await logCriacao('emprestimo', docRef.id, {
                patrimonios: itensEmprestimo.map(i => i.patrimonio).join(', '),
                quantidade: itensEmprestimo.length,
                recebedor: emprestimo.militar_recebedor,
                prazo: emprestimo.prazo_retorno
            });
        }
        
        // 📱 ENVIAR TELEGRAM AUTOMÁTICO (ÚNICO AUTOMÁTICO)
        try {
            console.log('📱 Enviando Telegram automático...');
            
            const numeroPolicia = emprestimo.numero_recebedor || null;
            
            const dadosEmprestimo = {
                id: docRef.id,
                militar_recebedor: emprestimo.militar_recebedor,
                numero_recebedor: numeroPolicia,
                patrimonio: itensEmprestimo.length > 0 ? itensEmprestimo[0].patrimonio : 'N/A',
                tipo_material: itensEmprestimo.length > 0 ? itensEmprestimo[0].tipo : 'Material',
                quantidade_itens: itensEmprestimo.length,
                prazo_retorno: emprestimo.prazo_retorno
            };
            
            // Enviar APENAS Telegram (automático)
            if (typeof TelegramSTIC !== 'undefined' && TelegramSTIC.notificarEmprestimo) {
                await TelegramSTIC.notificarEmprestimo(dadosEmprestimo);
                console.log('✅ Telegram enviado automaticamente');
            } else {
                console.warn('⚠️ TelegramSTIC não disponível');
            }
        } catch (notifError) {
            console.warn('⚠️ Erro ao enviar Telegram:', notifError.message);
        }
        
        ocultarLoading();
        
        // 🎉 MOSTRAR MODAL DE SUCESSO
        if (typeof ModalSucesso !== 'undefined') {
            ModalSucesso.mostrarEmprestimo(docRef.id, emprestimo);
        } else {
            // Fallback se modal não estiver disponível
            mostrarModalSucesso(emprestimo, docRef.id);
        }
        
        // Limpar form
        itensEmprestimo = [];
        renderizarListaItens();
        document.getElementById('formNovoEmprestimo').reset();
        
        // Definir novo prazo padrão
        const prazoInput = document.getElementById('prazoRetorno');
        const hoje = new Date();
        hoje.setDate(hoje.getDate() + 7);
        prazoInput.value = hoje.toISOString().split('T')[0];
        
        // Atualizar estatísticas
        carregarEstatisticas();
        
    } catch (error) {
        ocultarLoading();
        console.error('❌ Erro:', error);
        mostrarErro('Erro ao registrar empréstimo: ' + error.message);
    }
}

function mostrarModalSucesso(emprestimo, emprestimoId) {
    const listaItens = emprestimo.itens.map(item => 
        `• ${formatarTipoMaterial(item.tipo)} - Patrimônio: ${item.patrimonio}`
    ).join('\n');
    
    const mensagemWhatsApp = `
*PMMG - STIC*
*TERMO DE EMPRÉSTIMO DE MATERIAL*

Prezado(a) *${emprestimo.militar_recebedor}*,

Registramos o empréstimo dos seguintes materiais:

${emprestimo.itens.map(item => 
    `📦 ${formatarTipoMaterial(item.tipo)}
🏷️ Patrimônio: ${item.patrimonio}
${item.numero_serie ? `🔢 Série: ${item.numero_serie}\n` : ''}📋 Estado: ${getEstadoTexto(item.estado)}
${item.observacao ? `📝 Obs: ${item.observacao}\n` : ''}`
).join('\n')}

📅 *Data:* ${emprestimo.data_saida} às ${emprestimo.hora_saida}
⏰ *Prazo de retorno:* ${formatarData(emprestimo.prazo_retorno)} às ${emprestimo.hora_retorno}
📋 *Finalidade:* ${emprestimo.finalidade_emprestimo}

Por favor, confirme o recebimento destes materiais.

_Documento gerado automaticamente pelo STIC_
    `.trim();
    
    const modal = `
        <div id="modalSucessoEmprestimo" style="
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); display: flex;
            align-items: center; justify-content: center; z-index: 9999;
            padding: 1rem;">
            <div style="background: white; padding: 2rem; border-radius: 10px; max-width: 700px; width: 100%; max-height: 90vh; overflow-y: auto;">
                <h2 style="color: #4caf50; margin-bottom: 1.5rem;">✅ Empréstimo Registrado!</h2>
                
                <div style="background: #e8f5e9; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">📋 Resumo do Empréstimo:</h3>
                    <p><strong>Recebedor:</strong> ${emprestimo.militar_recebedor}</p>
                    <p><strong>Unidade:</strong> ${emprestimo.recebedor.unidade}</p>
                    <p><strong>Quantidade:</strong> ${emprestimo.quantidade_itens} ${emprestimo.quantidade_itens === 1 ? 'item' : 'itens'}</p>
                    <p><strong>Prazo:</strong> ${formatarData(emprestimo.prazo_retorno)} às ${emprestimo.hora_retorno}</p>
                    
                    <details style="margin-top: 1rem;">
                        <summary style="cursor: pointer; font-weight: bold;">Ver lista de itens</summary>
                        <pre style="background: white; padding: 1rem; margin-top: 0.5rem; border-radius: 5px; font-size: 0.9rem;">${listaItens}</pre>
                    </details>
                </div>
                
                <div style="background: #fff3cd; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #ffc107;">
                    <h3 style="margin-bottom: 1rem;">✍️ Link de Assinatura Digital:</h3>
                    <input type="text" readonly id="linkAssinatura" 
                           value="${window.location.origin}/assinatura.html?id=${emprestimoId}"
                           style="width: 100%; padding: 0.7rem; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 1rem; font-family: monospace; font-size: 0.85rem;">
                    <button onclick="copiarLinkAssinatura()" class="btn-secondary" style="width: 100%;">
                        📋 Copiar Link de Assinatura
                    </button>
                    <small style="display: block; margin-top: 0.5rem; color: #666;">
                        Envie este link para o recebedor assinar digitalmente
                    </small>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="margin-bottom: 1rem;">📱 Enviar Termo:</h3>
                    
                    <div style="background: #e8f5e9; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                        <p style="margin: 0; color: #2e7d32;">
                            💡 <strong>Dica:</strong> O recebedor está registrado no Telegram? 
                            Ele já recebeu notificação automática!
                        </p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <button onclick="enviarTelegram('${emprestimoId}')" class="btn-primary" 
                                style="width: 100%; background: #0088cc;">
                            📱 Enviar Telegram
                        </button>
                        <button onclick="enviarWhatsAppEmprestimo('${emprestimo.recebedor.telefone.replace(/\D/g, '')}', '${emprestimo.militar_recebedor}', '${emprestimoId}')" 
                                class="btn-primary" style="width: 100%; background: #25d366;">
                            💬 Enviar WhatsApp
                        </button>
                    </div>
                    
                    <details style="margin-top: 1rem;">
                        <summary style="cursor: pointer; padding: 0.5rem; background: #f5f5f5; border-radius: 5px;">
                            📝 Ver mensagem completa
                        </summary>
                        <textarea id="mensagemCompleta" readonly 
                                  style="width: 100%; min-height: 150px; padding: 0.5rem; margin-top: 0.5rem; border: 1px solid #ddd; border-radius: 5px; font-size: 0.9rem; font-family: monospace;">
${mensagemWhatsApp}
                        </textarea>
                        <button onclick="copiarMensagemCompleta()" class="btn-secondary" style="width: 100%; margin-top: 0.5rem;">
                            📋 Copiar Mensagem
                        </button>
                    </details>
                </div>
                
                <button onclick="fecharModalSucesso()" class="btn-primary" style="width: 100%;">
                    ✅ Fechar
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

function fecharModalSucesso() {
    document.getElementById('modalSucessoEmprestimo')?.remove();
}

function copiarMensagemWhatsApp() {
    const textarea = document.getElementById('mensagemCompleta');
    if (textarea) {
        textarea.select();
        document.execCommand('copy');
        alert('✅ Mensagem copiada!');
    }
}

function copiarMensagemCompleta() {
    const textarea = document.getElementById('mensagemCompleta');
    textarea.select();
    document.execCommand('copy');
    alert('✅ Mensagem copiada! Cole no Telegram ou WhatsApp.');
}

async function enviarTelegram(emprestimoId) {
    try {
        const doc = await saidasRef.doc(emprestimoId).get();
        if (!doc.exists) {
            alert('❌ Empréstimo não encontrado');
            return;
        }
        
        const emp = doc.data();
        const numeroPM = emp.numero_recebedor;
        
        // Verificar se usuário está registrado no Telegram
        const telegramUser = await db.collection('telegram_users').doc(numeroPM).get();
        
        if (!telegramUser.exists) {
            const resposta = confirm(
                `⚠️ ${emp.militar_recebedor} não está registrado no Telegram!\n\n` +
                `Quer enviar por WhatsApp?`
            );
            
            if (resposta) {
                const telefone = emp.recebedor?.telefone?.replace(/\D/g, '');
                if (telefone) {
                    enviarWhatsAppEmprestimo(telefone, emp.militar_recebedor, emprestimoId);
                }
            } else {
                alert(
                    `📱 Para receber pelo Telegram, o militar deve:\n\n` +
                    `1. Abrir: t.me/Stic7rpmbot\n` +
                    `2. Enviar: /start\n` +
                    `3. Enviar: /registro ${numeroPM}`
                );
            }
            return;
        }
        
        // Link de assinatura
        const linkAssinatura = `${window.location.origin}/assinatura.html?id=${emprestimoId}`;
        
        // Formatar itens para Telegram
        let itensTexto = '';
        if (emp.itens && emp.itens.length > 0) {
            emp.itens.forEach((item, index) => {
                const tipo = formatarTipoMaterial(item.tipo);
                itensTexto += `${index + 1}. ${tipo} - Pat: ${item.patrimonio}\n`;
            });
        } else {
            itensTexto = `1. ${formatarTipoMaterial(emp.tipo_material)} - Pat: ${emp.patrimonio}\n`;
        }
        
        const mensagemTelegram = 
            `🔔 *NOVO EMPRÉSTIMO*\n\n` +
            `Olá *${emp.militar_recebedor}*!\n\n` +
            `📦 *Materiais emprestados:*\n` +
            itensTexto + `\n` +
            `📅 *Data:* ${emp.data_saida} às ${emp.hora_saida}\n` +
            `⏰ *Prazo:* ${formatarData(emp.prazo_retorno)} às ${emp.hora_retorno}\n` +
            `📋 *Finalidade:* ${emp.finalidade_emprestimo}\n\n` +
            `✍️ *ASSINE DIGITALMENTE:*\n` +
            `${linkAssinatura}\n\n` +
            `_STIC 7ª RPM_`;
        
        // Copiar para clipboard
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = mensagemTelegram;
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextarea);
        
        alert(
            `✅ Mensagem copiada!\n\n` +
            `📱 O bot já enviou automaticamente se o usuário está registrado.\n\n` +
            `Ou cole manualmente no Telegram do ${emp.militar_recebedor}`
        );
        
    } catch (error) {
        console.error('Erro:', error);
        alert('❌ Erro ao preparar mensagem Telegram');
    }
}

function copiarLinkAssinatura() {
    const input = document.getElementById('linkAssinatura');
    input.select();
    document.execCommand('copy');
    alert('✅ Link copiado! Envie para o recebedor.');
}

async function excluirEmprestimo(emprestimoId) {
    if (!confirm('⚠️ ATENÇÃO!\n\nTem certeza que deseja EXCLUIR este empréstimo?\n\nEsta ação não pode ser desfeita!')) {
        return;
    }
    
    if (!confirm('Confirma a exclusão? (última confirmação)')) {
        return;
    }
    
    try {
        mostrarLoading('Excluindo empréstimo...');
        
        await saidasRef.doc(emprestimoId).delete();
        
        console.log('✅ Empréstimo excluído:', emprestimoId);
        
        ocultarLoading();
        mostrarSucesso('✅ Empréstimo excluído com sucesso!');
        
        // Recarregar histórico
        setTimeout(() => {
            carregarHistoricoCompleto();
            carregarEstatisticas();
        }, 1000);
        
    } catch (error) {
        ocultarLoading();
        console.error('❌ Erro:', error);
        mostrarErro('Erro ao excluir empréstimo: ' + error.message);
    }
}

function copiarLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        alert('✅ Link copiado!');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        alert('❌ Erro ao copiar link');
    });
}

function enviarWhatsApp(telefone, mensagem) {
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
}

async function enviarWhatsAppEmprestimo(telefone, nomeRecebedor, emprestimoId) {
    try {
        // Buscar dados completos do empréstimo
        const doc = await saidasRef.doc(emprestimoId).get();
        if (!doc.exists) {
            alert('Erro: Empréstimo não encontrado');
            return;
        }
        
        const emp = doc.data();
        
        // Gerar link de assinatura
        const linkAssinatura = `${window.location.origin}/assinatura.html?id=${emprestimoId}`;
        
        const mensagem = `
*PMMG - STIC*
*TERMO DE EMPRÉSTIMO DE MATERIAL*

Prezado(a) *${nomeRecebedor}*,

Registramos o empréstimo dos seguintes materiais:

${emp.itens.map(item => 
`📦 ${formatarTipoMaterial(item.tipo)}
🏷️ Patrimônio: ${item.patrimonio}
${item.numero_serie ? `🔢 Série: ${item.numero_serie}\n` : ''}📋 Estado: ${getEstadoTexto(item.estado)}
${item.observacao ? `📝 Obs: ${item.observacao}\n` : ''}`
).join('\n')}

📅 *Data:* ${emp.data_saida} às ${emp.hora_saida}
⏰ *Prazo:* ${formatarData(emp.prazo_retorno)} às ${emp.hora_retorno}
📋 *Finalidade:* ${emp.finalidade_emprestimo}

✍️ *ASSINE DIGITALMENTE:*
${linkAssinatura}

👆 Clique no link acima para assinar e confirmar o recebimento.

Após assinar, você poderá baixar o comprovante em PDF.

Por favor, confirme o recebimento.

_STIC - Sistema de Controle_
        `.trim();
        
        enviarWhatsApp(telefone, mensagem);
        
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao enviar WhatsApp');
    }
}

function imprimirTermoEmprestimo(emprestimoId) {
    // Função para impressão futura
    alert('Função de impressão em desenvolvimento');
}

function limparFormEmprestimo() {
    itensEmprestimo = [];
    renderizarListaItens();
    document.getElementById('formNovoEmprestimo').reset();
    const prazoInput = document.getElementById('prazoRetorno');
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + 7);
    prazoInput.value = hoje.toISOString().split('T')[0];
}

// ====================
// EMPRÉSTIMOS ATIVOS
// ====================

async function carregarEmprestimosAtivos() {
    try {
        mostrarLoading('Carregando empréstimos ativos...');
        
        const snapshot = await saidasRef
            .where('tipo_saida', '==', 'emprestimo')
            .where('status', '==', 'emprestado')
            .get();
        
        todosEmprestimos = [];
        snapshot.forEach(doc => {
            todosEmprestimos.push({ id: doc.id, ...doc.data() });
        });
        
        renderizarEmprestimosAtivos();
        ocultarLoading();
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro:', error);
        mostrarErro('Erro ao carregar empréstimos');
    }
}

function filtrarAtivos(status) {
    filtroAtual = status;
    
    // Atualizar botões
    document.querySelectorAll('#aba-ativos .btn-secondary').forEach(btn => {
        btn.style.background = '';
        btn.style.color = '';
    });
    
    if (status === 'todos') {
        document.getElementById('btnTodos').style.background = '#2196f3';
        document.getElementById('btnTodos').style.color = 'white';
    } else if (status === 'no_prazo') {
        document.getElementById('btnNoPrazo').style.background = '#388e3c';
        document.getElementById('btnNoPrazo').style.color = 'white';
    } else if (status === 'atrasado') {
        document.getElementById('btnAtrasado').style.background = '#d32f2f';
        document.getElementById('btnAtrasado').style.color = 'white';
    }
    
    renderizarEmprestimosAtivos();
}

function renderizarEmprestimosAtivos() {
    const tbody = document.getElementById('tabelaAtivos');
    tbody.innerHTML = '';
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Filtrar
    let emprestimosFiltrados = todosEmprestimos;
    
    if (filtroAtual === 'no_prazo') {
        emprestimosFiltrados = todosEmprestimos.filter(emp => {
            const prazo = new Date(emp.prazo_retorno);
            return prazo >= hoje;
        });
    } else if (filtroAtual === 'atrasado') {
        emprestimosFiltrados = todosEmprestimos.filter(emp => {
            const prazo = new Date(emp.prazo_retorno);
            return prazo < hoje;
        });
    }
    
    if (emprestimosFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align: center; padding: 2rem; color: #666;">
                    ${filtroAtual === 'todos' ? 
                        'Nenhum empréstimo ativo no momento' : 
                        `Nenhum empréstimo ${filtroAtual === 'no_prazo' ? 'no prazo' : 'atrasado'}`
                    }
                </td>
            </tr>
        `;
        return;
    }
    
    // Ordenar por prazo
    emprestimosFiltrados.sort((a, b) => {
        return new Date(a.prazo_retorno) - new Date(b.prazo_retorno);
    });
    
    emprestimosFiltrados.forEach(emp => {
        const prazo = new Date(emp.prazo_retorno);
        const atrasado = prazo < hoje;
        const diasAtraso = atrasado ? Math.floor((hoje - prazo) / (1000 * 60 * 60 * 24)) : 0;
        
        const tr = document.createElement('tr');
        if (atrasado) tr.style.background = '#ffebee';
        
        // Mostrar lista de patrimônios se for múltiplo
        let patrimoniosTexto = emp.patrimonio || 'N/A';
        if (emp.itens && emp.itens.length > 1) {
            patrimoniosTexto = emp.itens.map(i => i.patrimonio).join(', ');
        }
        
        tr.innerHTML = `
            <td>
                <strong>${patrimoniosTexto}</strong>
                ${emp.itens && emp.itens.length > 1 ? 
                    `<br><small style="color: #2196f3; font-weight: bold;">${emp.itens.length} itens</small>` : 
                    ''
                }
            </td>
            <td>${formatarTipoMaterial(emp.tipo_material)}</td>
            <td>
                <strong>${emp.militar_recebedor || 'N/A'}</strong><br>
                <small>${emp.numero_recebedor || 'N/A'}</small>
            </td>
            <td><small>${emp.recebedor?.unidade || 'N/A'}</small></td>
            <td>${formatarData(emp.data_saida)}</td>
            <td>${formatarData(emp.prazo_retorno)}</td>
            <td>
                ${atrasado ? 
                    `<span style="color: #d32f2f; font-weight: bold;">⚠️ ${diasAtraso} dia${diasAtraso !== 1 ? 's' : ''} atrasado</span>` : 
                    '<span style="color: #388e3c;">✅ No Prazo</span>'
                }
            </td>
            <td><small>${emp.registrado_por || 'N/A'}</small></td>
            <td>
                <button onclick="registrarDevolucao('${emp.id}')" 
                        class="btn-primary" style="padding: 0.5rem 1rem; white-space: nowrap;">
                    ✅ Devolver
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// ====================
// HISTÓRICO COMPLETO
// ====================

let historicoCompleto = [];

async function carregarHistoricoCompleto() {
    try {
        mostrarLoading('Carregando histórico...');
        
        // Buscar TODOS os empréstimos (ativos + devolvidos)
        // REMOVI orderBy para evitar erro de índice
        const snapshot = await saidasRef
            .where('tipo_saida', '==', 'emprestimo')
            .limit(100)
            .get();
        
        historicoCompleto = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Adicionar timestamp se existir
            if (data.data_registro && data.data_registro.toDate) {
                data.timestamp_sort = data.data_registro.toDate().getTime();
            } else {
                data.timestamp_sort = 0;
            }
            historicoCompleto.push({ id: doc.id, ...data });
        });
        
        // Ordenar manualmente por data (mais recentes primeiro)
        historicoCompleto.sort((a, b) => b.timestamp_sort - a.timestamp_sort);
        
        aplicarFiltrosHistorico();
        ocultarLoading();
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao carregar histórico:', error);
        mostrarErro('Erro ao carregar histórico: ' + error.message);
    }
}

function aplicarFiltrosHistorico() {
    const patrimonio = document.getElementById('filtroPatrimonio')?.value.toLowerCase();
    const numeroPM = document.getElementById('filtroNumeroPM')?.value.toLowerCase();
    const mes = document.getElementById('filtroMes')?.value;
    const ano = document.getElementById('filtroAno')?.value;
    
    let filtrados = historicoCompleto;
    
    // Filtrar por patrimônio
    if (patrimonio) {
        filtrados = filtrados.filter(item => {
            if (item.patrimonio && item.patrimonio.toLowerCase().includes(patrimonio)) {
                return true;
            }
            if (item.itens) {
                return item.itens.some(i => i.patrimonio.toLowerCase().includes(patrimonio));
            }
            return false;
        });
    }
    
    // Filtrar por número PM
    if (numeroPM) {
        filtrados = filtrados.filter(item => {
            return item.numero_recebedor && item.numero_recebedor.toLowerCase().includes(numeroPM);
        });
    }
    
    // Filtrar por mês
    if (mes) {
        filtrados = filtrados.filter(item => {
            return item.data_saida && item.data_saida.substring(5, 7) === mes;
        });
    }
    
    // Filtrar por ano
    if (ano) {
        filtrados = filtrados.filter(item => {
            return item.data_saida && item.data_saida.substring(0, 4) === ano;
        });
    }
    
    renderizarHistoricoCompleto(filtrados);
}

function limparFiltrosHistorico() {
    document.getElementById('filtroPatrimonio').value = '';
    document.getElementById('filtroNumeroPM').value = '';
    document.getElementById('filtroMes').value = '';
    document.getElementById('filtroAno').value = '';
    aplicarFiltrosHistorico();
}

function renderizarHistoricoCompleto(historico) {
    const tbody = document.getElementById('tabelaHistorico');
    tbody.innerHTML = '';
    
    if (historico.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #666;">
                    Nenhum registro encontrado
                </td>
            </tr>
        `;
        return;
    }
    
    historico.forEach(item => {
        const devolvido = item.status === 'devolvido';
        
        // Mostrar lista de patrimônios se for múltiplo
        let patrimoniosTexto = item.patrimonio || 'N/A';
        let detalhesItens = '';
        if (item.itens && item.itens.length > 1) {
            patrimoniosTexto = item.itens.map(i => i.patrimonio).join(', ');
            detalhesItens = `<br><small style="color: #2196f3; font-weight: bold;">${item.itens.length} itens</small>`;
        }
        
        // LINHA DE EMPRÉSTIMO
        const trEmprestimo = document.createElement('tr');
        trEmprestimo.style.background = devolvido ? '#f5f5f5' : 'white';
        
        trEmprestimo.innerHTML = `
            <td style="vertical-align: middle;">
                ${formatarData(item.data_saida)}<br>
                <small>${item.hora_saida || '-'}</small>
            </td>
            <td style="vertical-align: middle;"><span style="color: #ff9800; font-weight: bold;">📤 EMPRÉSTIMO</span></td>
            <td style="vertical-align: middle;">
                <strong>${patrimoniosTexto}</strong>
                ${detalhesItens}
            </td>
            <td style="vertical-align: middle;">
                <strong>${item.militar_recebedor || 'N/A'}</strong><br>
                <small>${item.numero_recebedor || 'N/A'}</small>
            </td>
            <td style="vertical-align: middle;">${formatarData(item.prazo_retorno)}</td>
            <td style="vertical-align: middle;"><span style="color: #2196f3;">${getEstadoTexto(item.estado_conservacao)}</span></td>
            <td style="vertical-align: middle; text-align: center;">-</td>
            <td style="vertical-align: middle;"><strong>${item.registrado_por || 'N/A'}</strong></td>
            <td style="vertical-align: middle; text-align: center;">
                <button onclick="excluirEmprestimo('${item.id}')" class="btn-secondary" 
                        style="padding: 0.5rem; background: #d32f2f; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(trEmprestimo);
        
        // LINHA DE DEVOLUÇÃO (se devolvido)
        if (devolvido) {
            const trDevolucao = document.createElement('tr');
            trDevolucao.style.background = '#e8f5e9';
            
            const estadoIcons = {
                'perfeito': '✅',
                'bom': '👍',
                'regular': '⚠️',
                'com_defeito': '🔧',
                'danificado': '❌'
            };
            
            trDevolucao.innerHTML = `
                <td style="vertical-align: middle;">
                    ${formatarData(item.data_devolucao)}<br>
                    <small>${item.hora_devolucao || '-'}</small>
                </td>
                <td style="vertical-align: middle;"><span style="color: #4caf50; font-weight: bold;">📥 DEVOLUÇÃO</span></td>
                <td style="vertical-align: middle;">
                    <strong>${patrimoniosTexto}</strong>
                    ${detalhesItens}
                </td>
                <td style="vertical-align: middle;">
                    <strong>${item.militar_recebedor || 'N/A'}</strong>
                </td>
                <td style="vertical-align: middle; text-align: center;">-</td>
                <td style="vertical-align: middle;">
                    ${estadoIcons[item.estado_devolucao] || ''} 
                    ${getEstadoTexto(item.estado_devolucao)}<br>
                    ${item.observacoes_devolucao ? 
                        `<small style="color: #666;">${item.observacoes_devolucao.substring(0, 40)}...</small>` : 
                        ''
                    }
                </td>
                <td style="vertical-align: middle; text-align: center;"><strong>${item.dias_emprestado || 0}</strong></td>
                <td style="vertical-align: middle;"><strong>${item.recebido_por?.nome || 'N/A'}</strong></td>
                <td style="vertical-align: middle; text-align: center;"></td>
            `;
            tbody.appendChild(trDevolucao);
        }
    });
}

// ====================
// DEVOLUÇÃO
// ====================

async function registrarDevolucao(saidaId) {
    try {
        const doc = await saidasRef.doc(saidaId).get();
        if (!doc.exists) {
            mostrarErro('Empréstimo não encontrado!');
            return;
        }
        
        const saida = doc.data();
        
        const modal = `
            <div id="modalDevolucao" style="
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.7); display: flex;
                align-items: center; justify-content: center; z-index: 9999;
                padding: 1rem;">
                <div style="background: white; padding: 2rem; border-radius: 10px; max-width: 600px; width: 100%; max-height: 90vh; overflow-y: auto;">
                    <h2 style="margin-bottom: 1.5rem;">✅ Registrar Devolução</h2>
                    
                    <div style="background: #f5f5f5; padding: 1rem; border-radius: 5px; margin-bottom: 1.5rem;">
                        <p style="margin: 0.5rem 0;"><strong>Patrimônio:</strong> ${saida.patrimonio || 'N/A'}</p>
                        <p style="margin: 0.5rem 0;"><strong>Recebedor:</strong> ${saida.militar_recebedor || 'N/A'}</p>
                        <p style="margin: 0.5rem 0;"><strong>Número PM:</strong> ${saida.numero_recebedor || 'N/A'}</p>
                        <p style="margin: 0.5rem 0;"><strong>Unidade:</strong> ${saida.recebedor?.unidade || 'N/A'}</p>
                        <p style="margin: 0.5rem 0;"><strong>Saída:</strong> ${formatarData(saida.data_saida)}</p>
                        <p style="margin: 0.5rem 0;"><strong>Prazo:</strong> ${formatarData(saida.prazo_retorno)}</p>
                    </div>
                    
                    <div style="margin: 1rem 0;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Estado do Material:</label>
                        <select id="estadoDevolucao" style="width: 100%; padding: 0.7rem; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem;">
                            <option value="perfeito" ${saida.estado_conservacao === 'perfeito' || saida.estado_conservacao === 'otimo' ? 'selected' : ''}>✅ Perfeito Estado</option>
                            <option value="bom" ${saida.estado_conservacao === 'bom' || !saida.estado_conservacao ? 'selected' : ''}>👍 Bom Estado</option>
                            <option value="regular" ${saida.estado_conservacao === 'regular' ? 'selected' : ''}>⚠️ Estado Regular</option>
                            <option value="com_defeito" ${saida.estado_conservacao === 'com_defeito' ? 'selected' : ''}>🔧 Com Defeito</option>
                            <option value="danificado" ${saida.estado_conservacao === 'danificado' ? 'selected' : ''}>❌ Danificado</option>
                        </select>
                        <small style="color: #666; display: block; margin-top: 0.3rem;">
                            Estado na entrega: <strong>${getEstadoTexto(saida.estado_conservacao)}</strong> (pode alterar se necessário)
                        </small>
                    </div>
                    
                    <div style="margin: 1rem 0;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Observações:</label>
                        <textarea id="observacoesDevolucao" rows="4" 
                                  style="width: 100%; padding: 0.7rem; border: 1px solid #ddd; border-radius: 5px; font-size: 1rem; resize: vertical;"
                                  placeholder="Descreva o estado do material..."></textarea>
                    </div>
                    
                    <div style="margin: 1.5rem 0; padding: 1rem; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 5px;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" id="confirmarRecebimento" style="width: 20px; height: 20px;">
                            <strong>Confirmo que recebi o material de volta</strong>
                        </label>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button onclick="fecharModal()" class="btn-secondary" style="flex: 1; padding: 0.8rem;">
                            ❌ Cancelar
                        </button>
                        <button onclick="confirmarDevolucao('${saidaId}')" 
                                class="btn-primary" style="flex: 1; padding: 0.8rem;">
                            ✅ Confirmar Devolução
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modal);
        
    } catch (error) {
        console.error('Erro:', error);
        mostrarErro('Erro ao abrir formulário de devolução');
    }
}

async function confirmarDevolucao(saidaId) {
    const confirmado = document.getElementById('confirmarRecebimento').checked;
    
    if (!confirmado) {
        alert('❌ Você precisa confirmar o recebimento!');
        return;
    }
    
    const estado = document.getElementById('estadoDevolucao').value;
    const obs = document.getElementById('observacoesDevolucao').value;
    
    if (!obs || obs.trim().length < 10) {
        alert('❌ Descreva o estado do material (mínimo 10 caracteres).');
        return;
    }
    
    try {
        mostrarLoading('Registrando devolução...');
        
        const usuarioNome = sessionStorage.getItem('stic_usuario_nome') || 'Sistema';
        const usuarioNumero = sessionStorage.getItem('stic_usuario_numero') || '';
        
        const doc = await saidasRef.doc(saidaId).get();
        const saidaData = doc.data();
        
        const dataSaida = new Date(saidaData.data_saida);
        const dataHoje = new Date();
        const diasEmprestado = Math.floor((dataHoje - dataSaida) / (1000 * 60 * 60 * 24));
        
        await saidasRef.doc(saidaId).update({
            status: 'devolvido',
            data_devolucao: new Date().toISOString().split('T')[0],
            hora_devolucao: new Date().toTimeString().slice(0, 5),
            estado_devolucao: estado,
            observacoes_devolucao: obs,
            dias_emprestado: diasEmprestado,
            recebido_por: {
                nome: usuarioNome,
                numero_policia: usuarioNumero
            },
            timestamp_devolucao: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Log
        if (typeof logDevolucao === 'function') {
            await logDevolucao(saidaData.patrimonio, {
                estado: estado,
                observacoes: obs,
                dias_emprestado: diasEmprestado,
                recebedor: saidaData.militar_recebedor
            });
        }
        
        ocultarLoading();
        fecharModal();
        
        // Pegar telefone
        const telefone = saidaData.recebedor?.telefone?.replace(/\D/g, '') || '';
        
        // Gerar termo de devolução
        const termoDevolucao = `
*PMMG - STIC*
*COMPROVANTE DE DEVOLUÇÃO*

Prezado(a) *${saidaData.militar_recebedor}*,

✅ *DEVOLUÇÃO REGISTRADA COM SUCESSO!*

${saidaData.itens ? saidaData.itens.map(item => {
    const tipo = item.tipo === 'hd' ? 'HD/SSD' :
                item.tipo === 'radio' ? 'Rádio Móvel' :
                item.tipo === 'ht' ? 'HT' : item.tipo;
    return `📦 ${tipo} - Patrimônio: ${item.patrimonio}`;
}).join('\n') : `📦 ${saidaData.tipo_material} - Patrimônio: ${saidaData.patrimonio}`}

📤 *Emprestado em:* ${saidaData.data_saida} às ${saidaData.hora_saida}
📥 *Devolvido em:* ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
⏱️ *Dias emprestado:* ${diasEmprestado} ${diasEmprestado === 1 ? 'dia' : 'dias'}

✅ *Estado:* ${estado === 'perfeito' ? 'Perfeito' : estado === 'bom' ? 'Bom' : estado === 'regular' ? 'Regular' : estado === 'com_defeito' ? 'Com defeito' : 'Danificado'}
📝 *Observações:* ${obs}

✅ *Recebido por:* ${usuarioNome}

Obrigado pela devolução!

_STIC - Sistema de Controle_
        `.trim();
        
        // Criar modal com opções WhatsApp e Telegram
        const modalEnvio = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;" id="modalEnvioComprovante">
                <div style="background: white; padding: 2rem; border-radius: 15px; max-width: 500px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                    <h3 style="margin: 0 0 1.5rem 0; color: #2c3e50;">✅ Devolução Registrada!</h3>
                    <p style="margin-bottom: 1.5rem; color: #555;">Como deseja enviar o comprovante para <strong>${saidaData.militar_recebedor}</strong>?</p>
                    
                    <div style="display: grid; gap: 1rem; margin-bottom: 1.5rem;">
                        <button onclick="enviarWhatsAppDevolucao('${telefone}', \`${termoDevolucao.replace(/`/g, '\\`')}\`)" 
                                style="padding: 1rem; background: #25d366; color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer;">
                            💬 Enviar WhatsApp
                        </button>
                        <button onclick="enviarTelegramDevolucao('${saidaData.numero_recebedor}', \`${termoDevolucao.replace(/`/g, '\\`')}\`)" 
                                style="padding: 1rem; background: #0088cc; color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer;">
                            📱 Enviar Telegram
                        </button>
                        <button onclick="copiarComprovanteDevolucao(\`${termoDevolucao.replace(/`/g, '\\`')}\`)" 
                                style="padding: 1rem; background: #607d8b; color: white; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer;">
                            📋 Copiar Texto
                        </button>
                    </div>
                    
                    <button onclick="document.getElementById('modalEnvioComprovante').remove()" 
                            style="width: 100%; padding: 0.75rem; background: #e0e0e0; color: #333; border: none; border-radius: 8px; cursor: pointer;">
                        Fechar
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalEnvio);
        
        mostrarSucesso('✅ Devolução registrada com sucesso!');
        
        setTimeout(() => {
            carregarEstatisticas();
            carregarEmprestimosAtivos();
        }, 1000);
        
    } catch (error) {
        ocultarLoading();
        console.error('❌ Erro:', error);
        mostrarErro('Erro ao registrar devolução: ' + error.message);
    }
}

function fecharModal() {
    document.getElementById('modalDevolucao')?.remove();
}

// ====================
// ESTATÍSTICAS
// ====================

async function carregarEstatisticas() {
    try {
        const snapshot = await saidasRef
            .where('tipo_saida', '==', 'emprestimo')
            .where('status', '==', 'emprestado')
            .get();
        
        const emprestimos = [];
        snapshot.forEach(doc => {
            emprestimos.push(doc.data());
        });
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const noPrazo = emprestimos.filter(emp => {
            const prazo = new Date(emp.prazo_retorno);
            return prazo >= hoje;
        }).length;
        
        const atrasado = emprestimos.length - noPrazo;
        
        document.getElementById('totalEmprestimos').textContent = emprestimos.length;
        document.getElementById('totalNoPrazo').textContent = noPrazo;
        document.getElementById('totalAtrasado').textContent = atrasado;
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// ====================
// UTILITÁRIOS
// ====================

function formatarTipoMaterial(tipo) {
    const tipos = {
        'radio': '📻 Rádio',
        'ht': '📡 HT',
        'computador': '🖥️ Computador',
        'notebook': '💻 Notebook'
    };
    return tipos[tipo] || tipo || 'N/A';
}

function getEstadoTexto(estado) {
    const estados = {
        'perfeito': 'Perfeito',
        'otimo': 'Ótimo',
        'bom': 'Bom',
        'regular': 'Regular',
        'com_defeito': 'Com Defeito',
        'danificado': 'Danificado'
    };
    return estados[estado] || estado || 'N/A';
}

console.log('✅ Controle de Empréstimos V2 carregado');

// Funções para envio de comprovante de devolução
function enviarWhatsAppDevolucao(telefone, mensagem) {
    document.getElementById('modalEnvioComprovante').remove();
    if (telefone && telefone.length >= 10) {
        const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
        window.open(url, '_blank');
        mostrarSucesso('✅ WhatsApp aberto!');
    } else {
        alert('❌ Telefone não encontrado ou inválido!');
    }
}

async function enviarTelegramDevolucao(numeroPM, mensagem) {
    document.getElementById('modalEnvioComprovante').remove();
    
    try {
        // Verificar se usuário está registrado no Telegram
        const telegramUser = await db.collection('telegram_users').doc(numeroPM).get();
        
        if (!telegramUser.exists) {
            alert(`⚠️ Usuário não registrado no Telegram!\n\nPara receber notificações, envie para @Stic7rpmbot:\n/registro ${numeroPM}`);
            return;
        }
        
        // Copiar mensagem
        const tempTextarea = document.createElement('textarea');
        tempTextarea.value = mensagem;
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextarea);
        
        alert('✅ Mensagem copiada!\n\nO bot Telegram enviará automaticamente se estiver configurado.\n\nOu cole manualmente no chat do usuário.');
        
    } catch (error) {
        console.error('Erro:', error);
        alert('❌ Erro ao verificar Telegram');
    }
}

function copiarComprovanteDevolucao(mensagem) {
    document.getElementById('modalEnvioComprovante').remove();
    
    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = mensagem;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextarea);
    
    mostrarSucesso('✅ Comprovante copiado! Cole onde desejar.');
}
