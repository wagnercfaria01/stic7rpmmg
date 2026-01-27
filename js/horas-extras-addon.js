// ============================================
// ADDON HORAS EXTRAS - Copiar Justificativa
// ============================================

// Função global para copiar justificativa
window.copiarJustificativa = function(texto) {
    // Tentar API moderna primeiro
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto)
            .then(() => {
                mostrarNotificacaoCopia('✅ Justificativa copiada para CAD2!', 'success');
            })
            .catch(err => {
                console.error('Erro ao copiar:', err);
                copiarTextoFallback(texto);
            });
    } else {
        // Fallback para navegadores antigos
        copiarTextoFallback(texto);
    }
};

// Fallback para copiar texto
function copiarTextoFallback(texto) {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    
    textarea.focus();
    textarea.select();
    
    try {
        const sucesso = document.execCommand('copy');
        if (sucesso) {
            mostrarNotificacaoCopia('✅ Justificativa copiada para CAD2!', 'success');
        } else {
            mostrarNotificacaoCopia('❌ Erro ao copiar. Use Ctrl+C manualmente.', 'error');
        }
    } catch (err) {
        console.error('Erro:', err);
        mostrarNotificacaoCopia('❌ Erro ao copiar', 'error');
    }
    
    document.body.removeChild(textarea);
}

// Sistema de notificações
function mostrarNotificacaoCopia(mensagem, tipo = 'info') {
    // Remover notificação anterior se existir
    const existente = document.getElementById('notificacao-copia');
    if (existente) existente.remove();
    
    const notif = document.createElement('div');
    notif.id = 'notificacao-copia';
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${tipo === 'success' ? '#28a745' : tipo === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 99999;
        font-weight: 600;
        animation: slideInRight 0.3s ease;
    `;
    
    notif.textContent = mensagem;
    document.body.appendChild(notif);
    
    // Adicionar CSS da animação se não existir
    if (!document.getElementById('notificacao-styles')) {
        const style = document.createElement('style');
        style.id = 'notificacao-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(400px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Remover após 3 segundos
    setTimeout(() => {
        notif.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// Adicionar botão de copiar nas tabelas de horas extras
function adicionarBotoesCopiar() {
    // Aguardar carregamento da tabela
    const observer = new MutationObserver((mutations, obs) => {
        const tabela = document.querySelector('table tbody');
        if (tabela) {
            processarTabela();
            obs.disconnect();
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function processarTabela() {
    // Buscar todas as células de motivo
    const celulasMotivo = document.querySelectorAll('td[data-motivo]');
    
    celulasMotivo.forEach(celula => {
        // Verificar se já tem botão
        if (celula.querySelector('.btn-copiar-motivo')) return;
        
        const motivo = celula.getAttribute('data-motivo');
        
        // Criar botão
        const btn = document.createElement('button');
        btn.className = 'btn-copiar-motivo';
        btn.innerHTML = '📋 Copiar';
        btn.title = 'Copiar justificativa para CAD2';
        btn.style.cssText = `
            margin-left: 0.5rem;
            padding: 0.4rem 0.8rem;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.85rem;
            font-weight: 600;
            transition: background 0.2s;
        `;
        
        btn.onmouseover = () => btn.style.background = '#0056b3';
        btn.onmouseout = () => btn.style.background = '#007bff';
        btn.onclick = () => copiarJustificativa(motivo);
        
        celula.appendChild(btn);
    });
}

// Inicializar quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', adicionarBotoesCopiar);
} else {
    adicionarBotoesCopiar();
}

console.log('✅ Addon Horas Extras carregado - Copiar Justificativa');
