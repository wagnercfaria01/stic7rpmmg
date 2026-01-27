// Controle de Materiais

let materiaisFiltrados = []; // Armazenar materiais para exportação

document.addEventListener('DOMContentLoaded', async () => {
    await carregarTodosMateriais();
});

// Carregar todos os materiais
async function carregarTodosMateriais() {
    try {
        mostrarLoading('Carregando materiais...');
        
        // Buscar entradas
        const entradasSnapshot = await entradasRef.get();
        const entradas = [];
        entradasSnapshot.forEach(doc => {
            entradas.push({ id: doc.id, tipo: 'entrada', ...doc.data() });
        });
        
        // Buscar saídas
        const saidasSnapshot = await saidasRef.get();
        const saidas = [];
        saidasSnapshot.forEach(doc => {
            saidas.push({ id: doc.id, tipo: 'saida', ...doc.data() });
        });
        
        // Juntar tudo
        const todosMateriais = [...entradas, ...saidas];
        
        // Ordenar por data (mais recente primeiro)
        todosMateriais.sort((a, b) => {
            const dataA = new Date(a.data_entrada || a.data_saida || 0);
            const dataB = new Date(b.data_entrada || b.data_saida || 0);
            return dataB - dataA;
        });
        
        // Calcular estatísticas
        const stats = {
            totalEntradas: entradas.length,
            totalSaidas: saidas.length,
            totalAssinados: todosMateriais.filter(m => m.assinado).length,
            totalPendentes: todosMateriais.filter(m => !m.assinado).length
        };
        
        atualizarEstatisticas(stats);
        renderizarMateriais(todosMateriais);
        
        ocultarLoading();
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao carregar materiais:', error);
        mostrarErro('Erro ao carregar materiais: ' + error.message);
    }
}

// Atualizar estatísticas
function atualizarEstatisticas(stats) {
    document.getElementById('totalEntradas').textContent = stats.totalEntradas;
    document.getElementById('totalSaidas').textContent = stats.totalSaidas;
    document.getElementById('totalAssinados').textContent = stats.totalAssinados;
    document.getElementById('totalPendentes').textContent = stats.totalPendentes;
}

// Renderizar lista de materiais
function renderizarMateriais(materiais) {
    const lista = document.getElementById('listaMateriais');
    const contador = document.getElementById('contadorMateriais');
    
    // Salvar materiais filtrados para exportação
    materiaisFiltrados = materiais;
    
    contador.textContent = `${materiais.length} registro(s)`;
    
    if (materiais.length === 0) {
        lista.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #666;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📦</div>
                <h3>Nenhum material encontrado</h3>
                <p>Registre a primeira entrada ou saída de material</p>
            </div>
        `;
        return;
    }
    
    lista.innerHTML = '';
    
    materiais.forEach(material => {
        const item = criarItemMaterial(material);
        lista.appendChild(item);
    });
}

// Criar item de material
function criarItemMaterial(material) {
    const div = document.createElement('div');
    div.className = 'os-item';
    div.style.gridTemplateColumns = '80px 180px 2fr 1.5fr 130px 100px 120px';
    
    const tipoIcone = material.tipo === 'entrada' ? '📥' : '📤';
    const tipoTexto = material.tipo === 'entrada' ? 'Entrada' : 'Saída';
    const tipoClasse = material.tipo === 'entrada' ? 'status-aberta' : 'status-enviado-bh';
    
    const assinadoBadge = material.assinado ? 
        '<span class="status-badge status-finalizada">✅ Assinado</span>' :
        '<span class="status-badge status-manutencao">⏳ Pendente</span>';
    
    const pessoa = material.tipo === 'entrada' ? material.entregador : material.recebedor;
    const pessoaNome = pessoa?.nome || 'N/A';
    const pessoaInfo = pessoa?.numero_policia || pessoa?.cpf || pessoa?.unidade || '';
    
    const data = material.data_entrada || material.data_saida || '-';
    const hora = material.hora_entrada || material.hora_saida || '';
    
    const tiposMaterial = {
        'radio': '📻 Rádio',
        'ht': '📡 HT',
        'computador': '🖥️ Computador',
        'notebook': '💻 Notebook',
        'equipamento_rede': '🔌 Equipamento Rede',
        'outro': '📦 Outro'
    };
    
    div.innerHTML = `
        <div style="text-align: center; font-size: 2rem;">${tipoIcone}</div>
        <div>
            <span class="status-badge ${tipoClasse}">${tipoTexto}</span>
        </div>
        <div>
            <strong>${tiposMaterial[material.tipo_material] || material.tipo_material}</strong>
            <small style="display: block; color: #666;">Patr: ${material.patrimonio} | Série: ${material.numero_serie}</small>
        </div>
        <div>
            <strong>${pessoaNome}</strong>
            <small style="display: block; color: #666;">${pessoaInfo}</small>
        </div>
        <div style="text-align: center;">
            <strong>${data}</strong>
            <small style="display: block; color: #666;">${hora}</small>
        </div>
        <div style="text-align: center;">
            ${assinadoBadge}
        </div>
        <div style="text-align: right;">
            ${!material.assinado ? `
                <button class="btn-icon" title="Reenviar Link" onclick="reenviarLink('${material.tipo}', '${material.id}')">
                    📱
                </button>
            ` : `
                <button class="btn-icon" title="Ver Termo" onclick="verTermo('${material.tipo}', '${material.id}')">
                    📄
                </button>
                <button class="btn-icon" title="Imprimir" onclick="imprimirTermo('${material.tipo}', '${material.id}')">
                    🖨️
                </button>
            `}
            <button class="btn-icon btn-delete" title="Excluir" onclick="excluirMaterial('${material.tipo}', '${material.id}', '${material.patrimonio}')">
                🗑️
            </button>
        </div>
    `;
    
    return div;
}

// Buscar materiais com filtros
async function buscarMateriais() {
    try {
        mostrarLoading('Buscando...');
        
        const patrimonio = document.getElementById('buscaPatrimonio').value.toLowerCase().trim();
        const nome = document.getElementById('buscaNome').value.toLowerCase().trim();
        const tipoMov = document.getElementById('filtroTipoMov').value;
        const assinado = document.getElementById('filtroAssinado').value;
        
        // Buscar todas
        const entradasSnapshot = await entradasRef.get();
        const saidasSnapshot = await saidasRef.get();
        
        let materiais = [];
        
        // Processar entradas
        if (!tipoMov || tipoMov === 'entrada') {
            entradasSnapshot.forEach(doc => {
                materiais.push({ id: doc.id, tipo: 'entrada', ...doc.data() });
            });
        }
        
        // Processar saídas
        if (!tipoMov || tipoMov === 'saida') {
            saidasSnapshot.forEach(doc => {
                materiais.push({ id: doc.id, tipo: 'saida', ...doc.data() });
            });
        }
        
        // Aplicar filtros
        let resultados = materiais;
        
        if (patrimonio) {
            resultados = resultados.filter(m => 
                m.patrimonio?.toLowerCase().includes(patrimonio)
            );
        }
        
        if (nome) {
            resultados = resultados.filter(m => {
                const pessoa = m.tipo === 'entrada' ? m.entregador : m.recebedor;
                return pessoa?.nome?.toLowerCase().includes(nome);
            });
        }
        
        if (assinado === 'sim') {
            resultados = resultados.filter(m => m.assinado === true);
        } else if (assinado === 'nao') {
            resultados = resultados.filter(m => !m.assinado);
        }
        
        // Ordenar por data
        resultados.sort((a, b) => {
            const dataA = new Date(a.data_entrada || a.data_saida || 0);
            const dataB = new Date(b.data_entrada || b.data_saida || 0);
            return dataB - dataA;
        });
        
        // Calcular stats dos resultados
        const stats = {
            totalEntradas: resultados.filter(m => m.tipo === 'entrada').length,
            totalSaidas: resultados.filter(m => m.tipo === 'saida').length,
            totalAssinados: resultados.filter(m => m.assinado).length,
            totalPendentes: resultados.filter(m => !m.assinado).length
        };
        
        atualizarEstatisticas(stats);
        renderizarMateriais(resultados);
        
        ocultarLoading();
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao buscar:', error);
        mostrarErro('Erro ao buscar materiais');
    }
}

// Limpar filtros
function limparFiltrosMateriais() {
    document.getElementById('buscaPatrimonio').value = '';
    document.getElementById('buscaNome').value = '';
    document.getElementById('filtroTipoMov').value = '';
    document.getElementById('filtroAssinado').value = '';
    
    carregarTodosMateriais();
}

// Reenviar link de assinatura
function reenviarLink(tipo, id) {
    const link = gerarLinkAssinatura(tipo, id);
    
    if (confirm('Deseja copiar o link para enviar via WhatsApp?')) {
        copiarTexto(link);
        mostrarSucesso('Link copiado! Cole no WhatsApp.');
    }
}

// Ver detalhes do material
async function verDetalhesMaterial(tipo, id) {
    try {
        mostrarLoading('Carregando detalhes...');
        
        const ref = tipo === 'entrada' ? entradasRef : saidasRef;
        const doc = await ref.doc(id).get();
        
        if (!doc.exists) {
            throw new Error('Material não encontrado');
        }
        
        const material = { id: doc.id, ...doc.data() };
        
        ocultarLoading();
        
        // Redirecionar para link de assinatura (se não assinado) ou mostrar detalhes
        if (!material.assinado) {
            const link = gerarLinkAssinatura(tipo, id);
            window.open(link, '_blank');
        } else {
            alert('Material já foi assinado!\n\nEm breve: visualização completa dos detalhes.');
        }
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro:', error);
        mostrarErro('Erro ao carregar detalhes');
    }
}

// Excluir material
async function excluirMaterial(tipo, id, patrimonio) {
    if (!confirm(`Tem certeza que deseja excluir este registro?\n\nPatrimônio: ${patrimonio}\nTipo: ${tipo === 'entrada' ? 'Entrada' : 'Saída'}\n\nEsta ação não pode ser desfeita!`)) {
        return;
    }
    
    try {
        mostrarLoading('Excluindo...');
        
        const ref = tipo === 'entrada' ? entradasRef : saidasRef;
        await ref.doc(id).delete();
        
        ocultarLoading();
        mostrarSucesso('Registro excluído com sucesso!');
        
        // Recarregar lista
        await carregarTodosMateriais();
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao excluir:', error);
        mostrarErro('Erro ao excluir registro: ' + error.message);
    }
}

// Ver termo assinado
async function verTermo(tipo, id) {
    try {
        mostrarLoading('Carregando termo...');
        
        const ref = tipo === 'entrada' ? entradasRef : saidasRef;
        const doc = await ref.doc(id).get();
        
        if (!doc.exists) {
            throw new Error('Material não encontrado');
        }
        
        const material = { id: doc.id, ...doc.data() };
        
        if (!material.assinado) {
            ocultarLoading();
            alert('Este material ainda não foi assinado!');
            return;
        }
        
        ocultarLoading();
        
        // Abrir modal com o termo
        mostrarModalTermo(material, tipo);
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro:', error);
        mostrarErro('Erro ao carregar termo: ' + error.message);
    }
}

// Imprimir termo
async function imprimirTermo(tipo, id) {
    try {
        mostrarLoading('Carregando termo...');
        
        const ref = tipo === 'entrada' ? entradasRef : saidasRef;
        const doc = await ref.doc(id).get();
        
        if (!doc.exists) {
            throw new Error('Material não encontrado');
        }
        
        const material = { id: doc.id, ...doc.data() };
        
        if (!material.assinado) {
            ocultarLoading();
            alert('Este material ainda não foi assinado!');
            return;
        }
        
        ocultarLoading();
        
        // Criar janela de impressão com termo completo
        const janelaImpressao = window.open('', '_blank');
        janelaImpressao.document.write(gerarHTMLTermo(material, tipo));
        janelaImpressao.document.close();
        
        // Aguardar carregar e imprimir
        setTimeout(() => {
            janelaImpressao.print();
        }, 500);
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro:', error);
        mostrarErro('Erro ao carregar termo: ' + error.message);
    }
}

// Gerar HTML do termo para impressão/WhatsApp
function gerarHTMLTermo(material, tipo) {
    const pessoa = tipo === 'entrada' ? material.entregador : material.recebedor;
    const tituloTermo = tipo === 'entrada' ? 'TERMO DE ENTREGA DE MATERIAL' : 'TERMO DE RECEBIMENTO DE MATERIAL';
    const descricaoAcao = tipo === 'entrada'
        ? 'Declaro que ENTREGUEI o material descrito acima ao STIC/PMMG.'
        : 'Declaro que RECEBI o material descrito acima em perfeitas condições.';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${tituloTermo}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 2cm; background: white; }
        .header { text-align: center; margin-bottom: 2rem; border-bottom: 3px solid #003366; padding-bottom: 1rem; }
        .header h1 { color: #003366; font-size: 1.3rem; margin-bottom: 0.5rem; }
        .header h2 { color: #003366; font-size: 1.1rem; margin-bottom: 0.5rem; }
        .header h3 { color: #333; font-size: 1rem; margin-top: 1rem; }
        .section { margin: 1.5rem 0; padding: 1rem; background: #f4f6f9; border-left: 4px solid #003366; border-radius: 5px; }
        .section h4 { color: #003366; margin-bottom: 1rem; font-size: 1rem; }
        .section p { margin: 0.5rem 0; color: #333; }
        .declaracao { margin: 2rem 0; padding: 1.5rem; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 5px; }
        .declaracao p { color: #856404; font-weight: 600; }
        .assinatura-box { margin: 2rem 0; text-align: center; page-break-inside: avoid; }
        .assinatura-box h4 { margin-bottom: 1rem; color: #003366; }
        .assinatura-box p { color: #666; margin-bottom: 1rem; }
        .assinatura-box img { max-width: 100%; border: 2px solid #003366; border-radius: 10px; padding: 1rem; background: white; }
        .divisor { border-top: 2px solid #003366; margin: 2rem 0; }
        @media print {
            body { padding: 1cm; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>POLÍCIA MILITAR DE MINAS GERAIS</h1>
        <h2>SEÇÃO DE TECNOLOGIA DA INFORMAÇÃO - STIC</h2>
        <h3>${tituloTermo}</h3>
    </div>
    
    <div class="section">
        <h4>📦 DADOS DO MATERIAL</h4>
        <p><strong>Tipo:</strong> ${material.tipo_material || '-'}</p>
        <p><strong>Patrimônio PMMG:</strong> ${material.patrimonio || '-'}</p>
        <p><strong>Número de Série:</strong> ${material.numero_serie || '-'}</p>
        <p><strong>Marca/Modelo:</strong> ${material.marca || ''} ${material.modelo || ''}</p>
        <p><strong>Estado:</strong> ${material.estado_conservacao || '-'}</p>
    </div>
    
    <div class="section">
        <h4>📝 DESCRIÇÃO</h4>
        <p>${material.problema_relatado || material.motivo || material.observacoes || '-'}</p>
    </div>
    
    <div class="declaracao">
        <p>⚠️ <strong>DECLARAÇÃO:</strong><br><br>${descricaoAcao}</p>
    </div>
    
    <div class="section">
        <h4>👤 MILITAR ${tipo === 'entrada' ? '(ENTREGOU)' : '(RECEBEU)'}</h4>
        <p><strong>Nome:</strong> ${pessoa?.nome || '-'}</p>
        <p><strong>${pessoa?.tipo === 'militar' ? 'Número de Polícia' : 'CPF'}:</strong> ${pessoa?.numero_policia || pessoa?.cpf || '-'}</p>
        <p><strong>${pessoa?.tipo === 'militar' ? 'Unidade' : 'Órgão'}:</strong> ${pessoa?.unidade || pessoa?.orgao || '-'}</p>
        <p><strong>Data/Hora Assinatura:</strong> ${formatarDataHora(material.data_assinatura)}</p>
    </div>
    
    ${material.tecnico_stic ? `
    <div class="section" style="background: #e8f4f8; border-left-color: #0066cc;">
        <h4 style="color: #0066cc;">🔧 TÉCNICO STIC (RECEBEU/ENTREGOU)</h4>
        <p><strong>Nome:</strong> ${material.tecnico_stic.nome || '-'}</p>
        <p><strong>Número de Polícia:</strong> ${material.tecnico_stic.numero_policia || '-'}</p>
        <p><strong>Data/Hora Assinatura:</strong> ${formatarDataHora(material.tecnico_stic.data_assinatura)}</p>
    </div>
    ` : ''}
    
    <div class="divisor"></div>
    
    <h3 style="text-align: center; margin: 2rem 0; color: #003366;">✍️ ASSINATURAS DIGITAIS</h3>
    
    ${material.assinatura_tecnico || material.tecnico_stic?.assinatura_base64 ? `
    <div class="assinatura-box">
        <h4 style="color: #0066cc;">🔧 ASSINATURA DO TÉCNICO STIC</h4>
        <p>${material.tecnico_stic?.nome || 'Técnico STIC'} - ${formatarDataHora(material.tecnico_stic?.data_assinatura)}</p>
        <img src="${material.assinatura_tecnico || material.tecnico_stic?.assinatura_base64}" alt="Assinatura Técnico">
    </div>
    ` : ''}
    
    ${material.assinatura_base64 ? `
    <div class="assinatura-box">
        <h4>👤 ASSINATURA DO MILITAR</h4>
        <p>${pessoa?.nome || 'Militar'} - ${formatarDataHora(material.data_assinatura)}</p>
        <img src="${material.assinatura_base64}" alt="Assinatura Militar">
    </div>
    ` : ''}
    
    <div style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #ddd; text-align: center; font-size: 0.8rem; color: #666;">
        <p>Documento gerado eletronicamente pelo Sistema STIC - PMMG</p>
        <p>Data de geração: ${new Date().toLocaleString('pt-BR')}</p>
    </div>
</body>
</html>
    `;
}

// Mostrar modal com termo completo
function mostrarModalTermo(material, tipo) {
    const pessoa = tipo === 'entrada' ? material.entregador : material.recebedor;
    const tituloTermo = tipo === 'entrada' ? 'TERMO DE ENTREGA DE MATERIAL' : 'TERMO DE RECEBIMENTO DE MATERIAL';
    const descricaoAcao = tipo === 'entrada'
        ? 'Declaro que ENTREGUEI o material descrito acima ao STIC/PMMG.'
        : 'Declaro que RECEBI o material descrito acima em perfeitas condições.';
    
    const modal = document.createElement('div');
    modal.id = 'modalTermo';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
    `;
    
    modal.innerHTML = `
        <div style="background: white; max-width: 800px; width: 100%; max-height: 90vh; overflow-y: auto; border-radius: 15px; padding: 2rem;">
            <div style="text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #003366; padding-bottom: 1rem;">
                <h2 style="color: #003366; margin-bottom: 0.5rem;">POLÍCIA MILITAR DE MINAS GERAIS</h2>
                <h3 style="color: #003366; margin-bottom: 0.5rem;">SEÇÃO DE TECNOLOGIA DA INFORMAÇÃO - STIC</h3>
                <h3 style="margin-top: 1rem;">${tituloTermo}</h3>
            </div>
            
            <div style="background: #f4f6f9; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem; border-left: 4px solid #003366;">
                <h4 style="margin-bottom: 1rem; color: #003366;">📦 DADOS DO MATERIAL</h4>
                <p><strong>Tipo:</strong> ${material.tipo_material || '-'}</p>
                <p><strong>Patrimônio PMMG:</strong> ${material.patrimonio || '-'}</p>
                <p><strong>Número de Série:</strong> ${material.numero_serie || '-'}</p>
                <p><strong>Marca/Modelo:</strong> ${material.marca || ''} ${material.modelo || ''}</p>
                <p><strong>Estado:</strong> ${material.estado_conservacao || '-'}</p>
            </div>
            
            <div style="background: #f4f6f9; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem; border-left: 4px solid #003366;">
                <h4 style="margin-bottom: 1rem; color: #003366;">📝 DESCRIÇÃO</h4>
                <p>${material.problema_relatado || material.motivo || material.observacoes || '-'}</p>
            </div>
            
            <div style="margin: 2rem 0; padding: 1.5rem; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 5px;">
                <p style="margin: 0; color: #856404; font-weight: 600;">
                    ⚠️ <strong>DECLARAÇÃO:</strong><br><br>
                    ${descricaoAcao}
                </p>
            </div>
            
            <div style="background: #f4f6f9; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem; border-left: 4px solid #003366;">
                <h4 style="margin-bottom: 1rem; color: #003366;">👤 MILITAR ${tipo === 'entrada' ? '(ENTREGOU)' : '(RECEBEU)'}</h4>
                <p><strong>Nome:</strong> ${pessoa?.nome || '-'}</p>
                <p><strong>${pessoa?.tipo === 'militar' ? 'Número de Polícia' : 'CPF'}:</strong> ${pessoa?.numero_policia || pessoa?.cpf || '-'}</p>
                <p><strong>${pessoa?.tipo === 'militar' ? 'Unidade' : 'Órgão'}:</strong> ${pessoa?.unidade || pessoa?.orgao || '-'}</p>
                <p><strong>Data/Hora Assinatura:</strong> ${formatarDataHora(material.data_assinatura)}</p>
            </div>
            
            ${material.tecnico_stic ? `
                <div style="background: #e8f4f8; padding: 1.5rem; border-radius: 10px; margin-bottom: 1.5rem; border-left: 4px solid #0066cc;">
                    <h4 style="margin-bottom: 1rem; color: #0066cc;">🔧 TÉCNICO STIC (RECEBEU/ENTREGOU)</h4>
                    <p><strong>Nome:</strong> ${material.tecnico_stic.nome || '-'}</p>
                    <p><strong>Número de Polícia:</strong> ${material.tecnico_stic.numero_policia || '-'}</p>
                    <p><strong>Data/Hora Assinatura:</strong> ${formatarDataHora(material.tecnico_stic.data_assinatura)}</p>
                </div>
            ` : ''}
            
            <div style="border-top: 2px solid #003366; margin: 2rem 0;"></div>
            
            <h3 style="text-align: center; margin: 2rem 0; color: #003366;">✍️ ASSINATURAS DIGITAIS</h3>
            
            ${material.assinatura_tecnico || material.tecnico_stic?.assinatura_base64 ? `
                <div style="text-align: center; margin: 2rem 0;">
                    <h4 style="margin-bottom: 1rem; color: #0066cc;">🔧 ASSINATURA DO TÉCNICO STIC</h4>
                    <p style="color: #666; margin-bottom: 1rem;">${material.tecnico_stic?.nome || 'Técnico STIC'} - ${formatarDataHora(material.tecnico_stic?.data_assinatura)}</p>
                    <img src="${material.assinatura_tecnico || material.tecnico_stic?.assinatura_base64}" style="max-width: 100%; border: 2px solid #0066cc; border-radius: 10px; padding: 1rem; background: white;">
                </div>
            ` : ''}
            
            ${material.assinatura_base64 ? `
                <div style="text-align: center; margin: 2rem 0;">
                    <h4 style="margin-bottom: 1rem; color: #003366;">👤 ASSINATURA DO MILITAR</h4>
                    <p style="color: #666; margin-bottom: 1rem;">${pessoa?.nome || 'Militar'} - ${formatarDataHora(material.data_assinatura)}</p>
                    <img src="${material.assinatura_base64}" style="max-width: 100%; border: 2px solid #003366; border-radius: 10px; padding: 1rem; background: white;">
                </div>
            ` : ''}
            
            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #ddd;" class="no-print">
                <button onclick="document.getElementById('modalTermo').remove()" style="padding: 1rem 2rem; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    Fechar
                </button>
                <button onclick="compartilharWhatsApp('${tipo}', '${material.id}')" style="padding: 1rem 2rem; background: #25D366; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    📱 Compartilhar WhatsApp
                </button>
                <button onclick="imprimirTermoModal()" style="padding: 1rem 2rem; background: #003366; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    🖨️ Imprimir
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Imprimir termo do modal (corrige PDF em branco)
function imprimirTermoModal() {
    // Pegar conteúdo do modal
    const modalContent = document.querySelector('#modalTermo > div');
    if (!modalContent) {
        alert('Erro ao carregar conteúdo para impressão');
        return;
    }
    
    // Clonar conteúdo
    const conteudo = modalContent.cloneNode(true);
    
    // Remover botões
    const botoes = conteudo.querySelectorAll('.no-print');
    botoes.forEach(b => b.remove());
    
    // Criar janela de impressão
    const janelaImpressao = window.open('', '_blank', 'width=800,height=600');
    
    if (!janelaImpressao) {
        alert('Por favor, permita pop-ups para imprimir');
        return;
    }
    
    janelaImpressao.document.write(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Termo de Material - PMMG STIC</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            padding: 2cm;
            line-height: 1.6;
        }
        h1, h2, h3, h4 {
            color: #003366;
            margin: 1rem 0;
        }
        p {
            margin: 0.5rem 0;
            color: #333;
        }
        strong {
            color: #000;
        }
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 1rem auto;
        }
        @media print {
            body {
                padding: 1cm;
            }
            img {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    ${conteudo.innerHTML}
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>
    `);
    
    janelaImpressao.document.close();
}

// Compartilhar termo no WhatsApp
async function compartilharWhatsApp(tipo, id) {
    try {
        const ref = tipo === 'entrada' ? entradasRef : saidasRef;
        const doc = await ref.doc(id).get();
        
        if (!doc.exists) {
            throw new Error('Material não encontrado');
        }
        
        const material = doc.data();
        const pessoa = tipo === 'entrada' ? material.entregador : material.recebedor;
        
        // Obter telefone e formatar (remover caracteres especiais)
        const telefone = pessoa?.telefone || '';
        const telefoneFormatado = telefone.replace(/\D/g, '');
        
        const tipoTexto = tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA';
        const tituloTermo = tipo === 'entrada' ? 'TERMO DE ENTREGA DE MATERIAL' : 'TERMO DE RECEBIMENTO DE MATERIAL';
        
        // Gerar link do termo para visualização online
        const linkTermo = `${window.location.origin}/pages/ver-termo.html?tipo=${tipo}&id=${id}`;
        
        const mensagem = `
*PMMG - STIC*
*${tituloTermo}*

📋 *TERMO ASSINADO E COMPLETO*

📦 *Material:* ${material.tipo_material || '-'}
🏷️ *Patrimônio:* ${material.patrimonio || '-'}
📅 *Data:* ${material.data_entrada || material.data_saida || '-'}

👤 *${tipo === 'entrada' ? 'Entregue por' : 'Recebido por'}:*
${pessoa?.nome || '-'}

✅ *Status:* Assinado digitalmente
🔧 *Técnico STIC:* ${material.tecnico_stic?.nome || '-'}
👤 *Militar:* ${pessoa?.nome || '-'}

📄 *Visualizar termo completo:*
${linkTermo}

_Documento gerado pelo Sistema STIC - PMMG_
        `.trim();
        
        const mensagemEncoded = encodeURIComponent(mensagem);
        
        // Se tiver telefone, usar wa.me com número, senão abrir sem número
        let urlWhatsApp;
        if (telefoneFormatado) {
            urlWhatsApp = `https://wa.me/55${telefoneFormatado}?text=${mensagemEncoded}`;
        } else {
            urlWhatsApp = `https://wa.me/?text=${mensagemEncoded}`;
        }
        
        window.open(urlWhatsApp, '_blank');
        
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao gerar mensagem WhatsApp');
    }
}

// Exportar para Excel
function exportarExcel() {
    if (materiaisFiltrados.length === 0) {
        alert('Nenhum material para exportar!');
        return;
    }
    
    // Criar CSV
    let csv = 'Tipo;Data;Hora;Material;Patrimônio;Série;Marca;Modelo;Estado;Nome;Documento;Unidade/Órgão;Assinado\n';
    
    materiaisFiltrados.forEach(material => {
        const pessoa = material.tipo === 'entrada' ? material.entregador : material.recebedor;
        const tipo = material.tipo === 'entrada' ? 'Entrada' : 'Saída';
        const data = material.data_entrada || material.data_saida || '';
        const hora = material.hora_entrada || material.hora_saida || '';
        const assinado = material.assinado ? 'Sim' : 'Não';
        
        csv += `${tipo};`;
        csv += `${data};`;
        csv += `${hora};`;
        csv += `${material.tipo_material || ''};`;
        csv += `${material.patrimonio || ''};`;
        csv += `${material.numero_serie || ''};`;
        csv += `${material.marca || ''};`;
        csv += `${material.modelo || ''};`;
        csv += `${material.estado_conservacao || ''};`;
        csv += `${pessoa?.nome || ''};`;
        csv += `${pessoa?.numero_policia || pessoa?.cpf || ''};`;
        csv += `${pessoa?.unidade || pessoa?.orgao || ''};`;
        csv += `${assinado}\n`;
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const dataAtual = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `controle-materiais-${dataAtual}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarSucesso(`Exportado ${materiaisFiltrados.length} registros para Excel!`);
}

console.log('✅ Controle de materiais carregado!');
