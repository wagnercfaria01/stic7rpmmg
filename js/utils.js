// Funções utilitárias

// Formatar data para padrão brasileiro
function formatarData(data) {
    if (!data) return '';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
}

// Formatar data e hora
function formatarDataHora(data) {
    if (!data) return '';
    const d = new Date(data);
    return d.toLocaleString('pt-BR');
}

// Gerar número único de OS
function gerarNumeroOS() {
    const ano = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `OS${ano}${timestamp}`;
}

// Gerar ID único
function gerarID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Validar patrimônio
function validarPatrimonio(patrimonio) {
    return patrimonio && patrimonio.length >= 4;
}

// MÁSCARAS DE TELEFONE
function aplicarMascaraTelefone(input) {
    let valor = input.value.replace(/\D/g, '');
    
    if (valor.length <= 10) {
        // Telefone fixo: (37) 3301-0124
        valor = valor.replace(/^(\d{2})(\d{4})(\d{4}).*/, '($1) $2-$3');
    } else {
        // Celular: (37) 9 9801-2036
        valor = valor.replace(/^(\d{2})(\d{1})(\d{4})(\d{4}).*/, '($1) $2 $3-$4');
    }
    
    input.value = valor;
}

// MÁSCARA DE NÚMERO DE POLÍCIA PMMG (SEM VALIDAÇÃO DE DÍGITO)
function aplicarMascaraNumeroPolicia(input) {
    let valor = input.value.replace(/\D/g, '');
    
    // Limita a 7 dígitos (6 + 1 verificador)
    valor = valor.slice(0, 7);
    
    if (valor.length > 6) {
        // Formata como 163396-5
        valor = valor.replace(/^(\d{6})(\d{1})/, '$1-$2');
    }
    
    input.value = valor;
}

// VALIDAÇÃO DE CPF
function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    // Valida primeiro dígito
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf[i]) * (10 - i);
    }
    let resto = soma % 11;
    let digito1 = resto < 2 ? 0 : 11 - resto;
    
    if (parseInt(cpf[9]) !== digito1) return false;
    
    // Valida segundo dígito
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf[i]) * (11 - i);
    }
    resto = soma % 11;
    let digito2 = resto < 2 ? 0 : 11 - resto;
    
    return parseInt(cpf[10]) === digito2;
}

function aplicarMascaraCPF(input) {
    let valor = input.value.replace(/\D/g, '');
    valor = valor.slice(0, 11);
    
    if (valor.length > 9) {
        valor = valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (valor.length > 6) {
        valor = valor.replace(/^(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
    } else if (valor.length > 3) {
        valor = valor.replace(/^(\d{3})(\d{3})/, '$1.$2');
    }
    
    input.value = valor;
}

// Validar formulário
function validarCampo(campo) {
    const valor = campo.value.trim();
    const formGroup = campo.closest('.form-group');
    
    if (campo.hasAttribute('required') && !valor) {
        formGroup.classList.add('has-error');
        return false;
    }
    
    // Validação de CPF
    if (campo.id === 'cpf' && valor) {
        if (!validarCPF(valor)) {
            formGroup.classList.add('has-error');
            const errorMsg = formGroup.querySelector('.error-message');
            if (errorMsg) errorMsg.textContent = 'CPF inválido';
            return false;
        }
    }
    
    formGroup.classList.remove('has-error');
    return true;
}

function validarFormulario(formulario) {
    let valido = true;
    const campos = formulario.querySelectorAll('input[required], select[required], textarea[required]');
    
    campos.forEach(campo => {
        if (!validarCampo(campo)) {
            valido = false;
        }
    });
    
    return valido;
}

// Mostrar mensagem de sucesso
function mostrarSucesso(mensagem) {
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-success';
    alerta.style.position = 'fixed';
    alerta.style.top = '20px';
    alerta.style.right = '20px';
    alerta.style.zIndex = '9999';
    alerta.style.minWidth = '300px';
    alerta.innerHTML = `<strong>✅ Sucesso!</strong><br>${mensagem}`;
    
    document.body.appendChild(alerta);
    
    setTimeout(() => {
        alerta.remove();
    }, 3000);
}

// Mostrar mensagem de erro
function mostrarErro(mensagem) {
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-danger';
    alerta.style.position = 'fixed';
    alerta.style.top = '20px';
    alerta.style.right = '20px';
    alerta.style.zIndex = '9999';
    alerta.style.minWidth = '300px';
    alerta.innerHTML = `<strong>❌ Erro!</strong><br>${mensagem}`;
    
    document.body.appendChild(alerta);
    
    setTimeout(() => {
        alerta.remove();
    }, 4000);
}

// Mostrar loading
function mostrarLoading(mensagem = 'Carregando...') {
    const loading = document.createElement('div');
    loading.id = 'loading';
    loading.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        color: white;
        font-size: 1.2rem;
    `;
    loading.innerHTML = `<div style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">⏳</div>
        <div>${mensagem}</div>
    </div>`;
    
    document.body.appendChild(loading);
}

function ocultarLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.remove();
    }
}

// Gerar link de assinatura
function gerarLinkAssinatura(tipo, id) {
    // Pegar apenas o domínio base
    const baseURL = window.location.origin;
    
    // Escolher página correta baseado no tipo
    let pagina;
    if (tipo === 'saida' || tipo === 'saida_material') {
        pagina = 'assinatura-saida.html';
    } else if (tipo === 'entrada') {
        pagina = 'assinar-tecnico.html';
    } else {
        // Empréstimo ou padrão
        pagina = 'assinatura.html';
    }
    
    // Gerar link correto - SEMPRE caminho absoluto da raiz
    const link = `${baseURL}/${pagina}?tipo=${tipo}&id=${id}`;
    
    // Debug
    console.log('🔗 Link de assinatura gerado:', link);
    console.log('   Base URL:', baseURL);
    console.log('   Página:', pagina);
    console.log('   Tipo:', tipo);
    console.log('   ID:', id);
    
    // Aviso se estiver em localhost
    if (baseURL.includes('127.0.0.1') || baseURL.includes('localhost')) {
        console.warn('⚠️ ATENÇÃO: Link gerado para localhost. Para funcionar em outros dispositivos, faça deploy no Netlify!');
    }
    
    return link;
}

// Enviar via WhatsApp
function enviarWhatsApp(telefone, mensagem) {
    const tel = telefone.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=55${tel}&text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
}

// Copiar para área de transferência
function copiarTexto(texto) {
    navigator.clipboard.writeText(texto).then(() => {
        mostrarSucesso('Copiado para área de transferência!');
    }).catch(err => {
        mostrarErro('Erro ao copiar: ' + err);
    });
}

// Exportar para Excel (simplificado)
function exportarParaExcel(dados, nomeArquivo) {
    // Aqui você pode integrar uma biblioteca como SheetJS
    console.log('Exportando para Excel:', dados);
    mostrarSucesso('Função de exportação será implementada!');
}

// Imprimir OS
function imprimirOS(id) {
    window.print();
}

// Logout
function logout() {
    if (confirm('Deseja realmente sair do sistema?')) {
        localStorage.clear();
        window.location.href = '../index.html';
    }
}

// Adicionar validação em tempo real
document.addEventListener('DOMContentLoaded', () => {
    const campos = document.querySelectorAll('input[required], select[required], textarea[required]');
    
    campos.forEach(campo => {
        campo.addEventListener('blur', () => {
            validarCampo(campo);
        });
        
        campo.addEventListener('input', () => {
            const formGroup = campo.closest('.form-group');
            if (formGroup.classList.contains('has-error')) {
                validarCampo(campo);
            }
        });
    });
});

console.log('✅ Utilitários carregados!');
