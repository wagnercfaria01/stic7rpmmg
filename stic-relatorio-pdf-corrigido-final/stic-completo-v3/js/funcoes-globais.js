// Funções globais usadas em várias páginas

// Ver detalhes da OS
async function verDetalhesOS(id) {
    try {
        mostrarLoading('Carregando detalhes...');
        
        const doc = await ordensServicoRef.doc(id).get();
        
        if (!doc.exists) {
            ocultarLoading();
            mostrarErro('OS não encontrada!');
            return;
        }
        
        const os = { id: doc.id, ...doc.data() };
        
        ocultarLoading();
        mostrarModalDetalhesOS(os);
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao carregar detalhes:', error);
        mostrarErro('Erro ao carregar detalhes da OS');
    }
}

// Editar OS
function editarOS(id) {
    sessionStorage.setItem('editarOSId', id);
    window.location.href = (window.location.pathname.includes('/pages/') ? '' : 'pages/') + 'editar-os.html';
}

// Imprimir OS
async function imprimirOS(id) {
    try {
        const doc = await ordensServicoRef.doc(id).get();
        
        if (!doc.exists) {
            mostrarErro('OS não encontrada!');
            return;
        }
        
        const os = { id: doc.id, ...doc.data() };
        
        // Abrir em nova janela para imprimir
        const printWindow = window.open('', '_blank');
        printWindow.document.write(gerarHTMLImpressao(os));
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
        }, 500);
        
    } catch (error) {
        console.error('Erro ao imprimir:', error);
        mostrarErro('Erro ao gerar impressão');
    }
}

// Excluir OS
async function excluirOS(id, numero) {
    if (!confirm(`Tem certeza que deseja excluir a OS ${numero || id}?\n\nEsta ação não pode ser desfeita!`)) {
        return;
    }
    
    try {
        mostrarLoading('Excluindo OS...');
        
        await ordensServicoRef.doc(id).delete();
        
        ocultarLoading();
        mostrarSucesso('OS excluída com sucesso!');
        
        // Recarregar página atual
        setTimeout(() => {
            location.reload();
        }, 1500);
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao excluir:', error);
        mostrarErro('Erro ao excluir OS');
    }
}

// Mostrar modal de detalhes
function mostrarModalDetalhesOS(os) {
    let modal = document.getElementById('modalDetalhesOS');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modalDetalhesOS';
        modal.className = 'modal-overlay';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
        document.body.appendChild(modal);
    }
    
    const dataAbertura = os.data_abertura?.toDate ? 
        os.data_abertura.toDate().toLocaleString('pt-BR') : 
        'Data não disponível';
    
    const statusClass = {
        'aberta': 'background: #ffc107; color: #000;',
        'em_manutencao': 'background: #17a2b8; color: #fff;',
        'enviado_bh': 'background: #6c757d; color: #fff;',
        'finalizada': 'background: #28a745; color: #fff;'
    };
    
    const statusTexto = {
        'aberta': '📋 Aberta',
        'em_manutencao': '🔧 Em Manutenção',
        'enviado_bh': '🚚 Enviado BH',
        'finalizada': '✅ Finalizada'
    };
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 10px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; padding: 2rem; position: relative;">
            <button onclick="document.getElementById('modalDetalhesOS').remove()" style="position: absolute; top: 1rem; right: 1rem; background: #dc3545; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 1.5rem; cursor: pointer; line-height: 1;">×</button>
            
            <h2 style="color: #003366; margin-bottom: 1rem;">📋 Detalhes da OS</h2>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                <div style="padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <strong>Número:</strong><br>${os.numero || os.id.substring(0, 8)}
                </div>
                <div style="padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <strong>Status:</strong><br>
                    <span style="padding: 0.3rem 0.8rem; border-radius: 20px; display: inline-block; margin-top: 0.5rem; ${statusClass[os.status] || statusClass.aberta}">
                        ${statusTexto[os.status] || os.status}
                    </span>
                </div>
                <div style="padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                    <strong>Data Abertura:</strong><br>${dataAbertura}
                </div>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <h3 style="color: #003366; margin-bottom: 0.5rem;">Material/Equipamento:</h3>
                <p style="margin: 0; color: #495057;">
                    ${os.tipo_equipamento || os.tipo_servico || 'N/A'}<br>
                    ${os.patrimonio ? `<strong>Patrimônio:</strong> ${os.patrimonio}<br>` : ''}
                    ${os.numero_serie ? `<strong>Série:</strong> ${os.numero_serie}<br>` : ''}
                    ${os.marca ? `<strong>Marca:</strong> ${os.marca}<br>` : ''}
                    ${os.modelo ? `<strong>Modelo:</strong> ${os.modelo}` : ''}
                </p>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <h3 style="color: #003366; margin-bottom: 0.5rem;">Solicitante:</h3>
                <p style="margin: 0; color: #495057;">
                    <strong>${os.solicitante?.nome || 'N/A'}</strong><br>
                    ${os.solicitante?.numero_pm ? `PM: ${os.solicitante.numero_pm}<br>` : ''}
                    ${os.solicitante?.telefone ? `Tel: ${os.solicitante.telefone}<br>` : ''}
                    ${os.solicitante?.unidade || os.solicitante?.orgao || 'N/A'}
                </p>
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <h3 style="color: #003366; margin-bottom: 0.5rem;">Defeito Relatado:</h3>
                <p style="margin: 0; color: #495057; padding: 1rem; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                    ${os.defeito || 'Não informado'}
                </p>
            </div>
            
            ${os.observacoes ? `
                <div style="margin-bottom: 1.5rem;">
                    <h3 style="color: #003366; margin-bottom: 0.5rem;">Observações:</h3>
                    <p style="margin: 0; color: #495057; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
                        ${os.observacoes}
                    </p>
                </div>
            ` : ''}
            
            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem;">
                <button onclick="editarOS('${os.id}')" class="btn btn-primary">✏️ Editar</button>
                <button onclick="imprimirOS('${os.id}')" class="btn btn-primary">🖨️ Imprimir</button>
                <button onclick="excluirOS('${os.id}', '${os.numero || ''}')" class="btn btn-danger">🗑️ Excluir</button>
                <button onclick="document.getElementById('modalDetalhesOS').remove()" class="btn btn-secondary">🔙 Fechar</button>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

// Gerar HTML para impressão
function gerarHTMLImpressao(os) {
    const dataAbertura = os.data_abertura?.toDate ? 
        os.data_abertura.toDate().toLocaleDateString('pt-BR') : 
        'Data não disponível';
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>OS ${os.numero || os.id.substring(0, 8)} - STIC 7ª RPM</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 2rem; }
                h1 { color: #003366; text-align: center; }
                .info { margin-bottom: 1rem; }
                .info strong { display: inline-block; width: 150px; }
                @media print {
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>Ordem de Serviço #${os.numero || os.id.substring(0, 8)}</h1>
            <div class="info"><strong>Data:</strong> ${dataAbertura}</div>
            <div class="info"><strong>Status:</strong> ${os.status}</div>
            <div class="info"><strong>Equipamento:</strong> ${os.tipo_equipamento || os.tipo_servico}</div>
            <div class="info"><strong>Patrimônio:</strong> ${os.patrimonio || 'N/A'}</div>
            <div class="info"><strong>Série:</strong> ${os.numero_serie || 'N/A'}</div>
            <div class="info"><strong>Solicitante:</strong> ${os.solicitante?.nome || 'N/A'}</div>
            <div class="info"><strong>Unidade:</strong> ${os.solicitante?.unidade || 'N/A'}</div>
            <div class="info"><strong>Defeito:</strong> ${os.defeito || 'N/A'}</div>
            ${os.observacoes ? `<div class="info"><strong>Observações:</strong> ${os.observacoes}</div>` : ''}
        </body>
        </html>
    `;
}

console.log('✅ Funções globais carregadas!');
