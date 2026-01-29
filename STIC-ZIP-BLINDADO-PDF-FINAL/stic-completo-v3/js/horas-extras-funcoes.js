// ============================================
// FUNÇÕES GLOBAIS HORAS EXTRAS
// ============================================

// Editar hora extra
window.editarHoraExtra = async function(id) {
    try {
        console.log('📝 Editando hora extra:', id);
        
        const doc = await firebase.firestore().collection('horas_extras').doc(id).get();
        
        if (!doc.exists) {
            alert('❌ Registro não encontrado!');
            return;
        }
        
        const hora = doc.data();
        
        // Preencher formulário
        document.getElementById('militarSelecionado').value = hora.militar_id || '';
        document.getElementById('dataHoras').value = hora.data || '';
        document.getElementById('horasExtras').value = hora.horas || '';
        document.getElementById('motivoHoras').value = hora.motivo || '';
        document.getElementById('dataLancamento').value = hora.data_prevista_lancamento || '';
        
        if (hora.tipo_hora) {
            const selectTipo = document.getElementById('tipoHora');
            if (selectTipo) selectTipo.value = hora.tipo_hora;
        }
        
        // Marcar que está editando
        const form = document.getElementById('formHoras');
        if (form) {
            form.dataset.editandoId = id;
            
            // Mudar texto do botão
            const btnSubmit = form.querySelector('button[type="submit"]');
            if (btnSubmit) {
                btnSubmit.textContent = '✏️ Atualizar';
                btnSubmit.style.background = '#ff9800';
            }
        }
        
        // Abrir modal/aba de lançamento
        const abaLancamento = document.querySelector('[onclick*="lancamento"]');
        if (abaLancamento) {
            abaLancamento.click();
        }
        
        // Scroll para o formulário
        const formContainer = document.getElementById('formHoras');
        if (formContainer) {
            formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        
        alert('✏️ Registro carregado! Edite os campos e clique em "Atualizar"');
        
    } catch (error) {
        console.error('Erro ao editar:', error);
        alert('❌ Erro ao carregar registro: ' + error.message);
    }
};

// Excluir hora extra
window.excluirHoraExtra = async function(id) {
    // Pedir confirmação
    const confirmacao = confirm(
        '⚠️ TEM CERTEZA?\n\n' +
        'Deseja EXCLUIR permanentemente este registro de hora extra?\n\n' +
        'Esta ação NÃO pode ser desfeita!'
    );
    
    if (!confirmacao) {
        console.log('❌ Exclusão cancelada pelo usuário');
        return;
    }
    
    try {
        console.log('🗑️ Excluindo hora extra:', id);
        
        // Buscar dados antes de excluir (para auditoria)
        const doc = await firebase.firestore().collection('horas_extras').doc(id).get();
        const dados = doc.exists ? doc.data() : null;
        
        // Excluir do Firebase
        await firebase.firestore().collection('horas_extras').doc(id).delete();
        
        // Registrar na auditoria (se disponível)
        if (window.auditoria) {
            await auditoria.excluir('horas_extras', 'Hora extra excluída', dados, id);
        }
        
        console.log('✅ Hora extra excluída com sucesso');
        alert('✅ Registro excluído com sucesso!');
        
        // Recarregar lista
        if (typeof carregarHoras === 'function') {
            carregarHoras();
        } else if (typeof carregarHistoricoCompleto === 'function') {
            carregarHistoricoCompleto();
        } else {
            // Fallback: recarregar página
            location.reload();
        }
        
    } catch (error) {
        console.error('❌ Erro ao excluir:', error);
        alert('❌ Erro ao excluir registro: ' + error.message);
    }
};

// Confirmar lançamento no CAD2
window.confirmarCAD2 = async function(id) {
    const confirmacao = confirm('Confirmar que este registro foi lançado no CAD2?');
    
    if (!confirmacao) return;
    
    try {
        console.log('✅ Confirmando CAD2:', id);
        
        const usuario = JSON.parse(sessionStorage.getItem('stic_usuario') || '{}');
        
        await firebase.firestore().collection('horas_extras').doc(id).update({
            lancado_cad2: true,
            data_lancamento_cad2: firebase.firestore.FieldValue.serverTimestamp(),
            lancado_por: usuario.nome || 'Sistema',
            lancado_por_pm: usuario.numero_pm || 'N/A'
        });
        
        // Registrar na auditoria
        if (window.auditoria) {
            await auditoria.editar('horas_extras', 'Confirmado lançamento no CAD2', 
                { lancado_cad2: false },
                { lancado_cad2: true, lancado_por: usuario.nome },
                id
            );
        }
        
        alert('✅ Lançamento confirmado no CAD2!');
        
        // Recarregar
        if (typeof carregarHoras === 'function') {
            carregarHoras();
        } else {
            location.reload();
        }
        
    } catch (error) {
        console.error('❌ Erro ao confirmar:', error);
        alert('❌ Erro ao confirmar: ' + error.message);
    }
};

// Duplicar registro
window.duplicarHoraExtra = function(id) {
    // Se a função duplicarHora já existir, usar ela
    if (typeof duplicarHora === 'function') {
        duplicarHora(id);
    } else {
        console.log('🔄 Duplicando:', id);
        alert('Função de duplicar será implementada em breve!');
    }
};

// Abrir modal de lançamento
window.abrirModalLancamento = function() {
    // Tentar vários métodos
    const modal = document.getElementById('modalNovoLancamento');
    if (modal) {
        modal.style.display = 'flex';
        return;
    }
    
    // Tentar abrir aba
    const abaLancamento = document.querySelector('[onclick*="lancamento"]');
    if (abaLancamento) {
        abaLancamento.click();
        return;
    }
    
    // Fallback: scroll para formulário
    const form = document.getElementById('formHoras');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth' });
    }
};

// ============================================
// ALIASES PARA COMPATIBILIDADE
// ============================================

// Aliases para nomes antigos usados no HTML
window.editarHora = window.editarHoraExtra;
window.excluirHora = window.excluirHoraExtra;
window.confirmarExcluir = window.excluirHoraExtra;
window.duplicarHora = window.duplicarHoraExtra;

console.log('✅ Funções globais de Horas Extras carregadas!');
