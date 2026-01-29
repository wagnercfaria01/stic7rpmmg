// Sistema de Comentários para OS

// Carregar comentários de uma OS
async function carregarComentarios(osId) {
    try {
        const comentariosRef = db.collection('ordens_servico')
            .doc(osId)
            .collection('comentarios')
            .orderBy('timestamp', 'asc');
        
        const snapshot = await comentariosRef.get();
        const comentarios = [];
        
        snapshot.forEach(doc => {
            comentarios.push({ id: doc.id, ...doc.data() });
        });
        
        return comentarios;
        
    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
        return [];
    }
}

// Adicionar comentário
async function adicionarComentario(osId, texto) {
    if (!texto || texto.trim() === '') {
        alert('⚠️ Digite um comentário antes de enviar!');
        return;
    }
    
    try {
        const usuario = {
            nome: sessionStorage.getItem('stic_usuario_nome') || 'Sistema',
            numero_policia: sessionStorage.getItem('stic_usuario_numero') || '',
            email: sessionStorage.getItem('stic_usuario_email') || ''
        };
        
        const comentario = {
            texto: texto.trim(),
            usuario,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            data_hora: new Date().toISOString(),
            tipo: 'comentario' // ou 'sistema' para mudanças automáticas
        };
        
        await db.collection('ordens_servico')
            .doc(osId)
            .collection('comentarios')
            .add(comentario);
        
        // Registrar log
        await logComentario(osId, texto);
        
        console.log('✅ Comentário adicionado');
        
        // Limpar campo de texto
        document.getElementById('textoComentario').value = '';
        
        // Recarregar comentários
        await renderizarComentarios(osId);
        
    } catch (error) {
        console.error('Erro ao adicionar comentário:', error);
        alert('Erro ao adicionar comentário');
    }
}

// Adicionar comentário automático do sistema
async function adicionarComentarioSistema(osId, acao, detalhes = '') {
    try {
        const usuario = {
            nome: sessionStorage.getItem('stic_usuario_nome') || 'Sistema',
            numero_policia: sessionStorage.getItem('stic_usuario_numero') || ''
        };
        
        const comentario = {
            texto: acao,
            detalhes,
            usuario,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            data_hora: new Date().toISOString(),
            tipo: 'sistema'
        };
        
        await db.collection('ordens_servico')
            .doc(osId)
            .collection('comentarios')
            .add(comentario);
        
        console.log('✅ Comentário do sistema adicionado');
        
    } catch (error) {
        console.error('Erro ao adicionar comentário do sistema:', error);
    }
}

// Renderizar comentários
async function renderizarComentarios(osId) {
    const container = document.getElementById('listaComentarios');
    
    if (!container) return;
    
    const comentarios = await carregarComentarios(osId);
    
    if (comentarios.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #666;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">💬</div>
                <p>Nenhum comentário ainda</p>
                <small>Seja o primeiro a comentar!</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    comentarios.forEach(comentario => {
        const item = criarItemComentario(comentario);
        container.appendChild(item);
    });
    
    // Scroll para o final (comentário mais recente)
    container.scrollTop = container.scrollHeight;
}

// Criar item de comentário
function criarItemComentario(comentario) {
    const div = document.createElement('div');
    
    const isSystem = comentario.tipo === 'sistema';
    const usuario = comentario.usuario || {};
    const nomeCompleto = `${usuario.nome || 'Sistema'} ${usuario.numero_policia ? '(' + usuario.numero_policia + ')' : ''}`;
    
    // Formatar data/hora
    let horarioFormatado = '';
    if (comentario.data_hora) {
        const data = new Date(comentario.data_hora);
        horarioFormatado = formatarDataHoraComentario(data);
    }
    
    div.style.cssText = `
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 8px;
        ${isSystem ? 'background: #e3f2fd; border-left: 4px solid #2196f3;' : 'background: #f8f9fa; border-left: 4px solid #003366;'}
    `;
    
    div.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div style="width: 32px; height: 32px; background: ${isSystem ? '#2196f3' : '#003366'}; 
                            border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                            color: white; font-weight: bold;">
                    ${isSystem ? '🔄' : usuario.nome?.charAt(0) || '?'}
                </div>
                <div>
                    <div style="font-weight: bold; color: #003366;">
                        ${isSystem ? 'Sistema' : nomeCompleto}
                    </div>
                    <div style="font-size: 0.85rem; color: #6c757d;">
                        ${horarioFormatado}
                    </div>
                </div>
            </div>
        </div>
        <div style="color: #495057; margin-left: 42px;">
            ${comentario.texto}
            ${comentario.detalhes ? `<div style="font-size: 0.9rem; color: #6c757d; margin-top: 0.5rem;">${comentario.detalhes}</div>` : ''}
        </div>
    `;
    
    return div;
}

// Formatar data/hora para comentários
function formatarDataHoraComentario(data) {
    const agora = new Date();
    const diffMs = agora - data;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) {
        return 'Agora mesmo';
    } else if (diffMins < 60) {
        return `Há ${diffMins} min`;
    } else if (diffHoras < 24) {
        return `Há ${diffHoras}h`;
    } else {
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Criar HTML do componente de comentários (para inserir nas páginas)
function criarComponenteComentarios(osId) {
    return `
        <div style="background: white; padding: 2rem; border-radius: 10px; margin-top: 2rem;">
            <h3 style="margin-bottom: 1.5rem; color: #003366; display: flex; align-items: center; gap: 0.5rem;">
                💬 Comentários e Histórico
            </h3>
            
            <!-- Lista de Comentários -->
            <div id="listaComentarios" style="max-height: 400px; overflow-y: auto; margin-bottom: 1.5rem;">
                <div class="loading">Carregando comentários...</div>
            </div>
            
            <!-- Adicionar Comentário -->
            <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px;">
                <textarea id="textoComentario" 
                          placeholder="Adicione um comentário..." 
                          rows="3"
                          style="width: 100%; padding: 0.75rem; border: 2px solid #dee2e6; 
                                 border-radius: 5px; font-size: 1rem; resize: vertical; font-family: inherit;"></textarea>
                <div style="margin-top: 1rem; text-align: right;">
                    <button onclick="adicionarComentario('${osId}', document.getElementById('textoComentario').value)" 
                            class="btn-primary">
                        📤 Enviar Comentário
                    </button>
                </div>
            </div>
        </div>
        
        <script>
            // Carregar comentários ao abrir a página
            document.addEventListener('DOMContentLoaded', () => {
                renderizarComentarios('${osId}');
            });
        </script>
    `;
}

console.log('✅ Sistema de comentários carregado!');
