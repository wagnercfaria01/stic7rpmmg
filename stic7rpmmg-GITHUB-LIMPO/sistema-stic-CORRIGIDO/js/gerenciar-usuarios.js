// Gerenciador de Usuários Recebedores

// Referência da collection
const usuariosRef = db.collection('usuarios_recebedores');

document.addEventListener('DOMContentLoaded', async () => {
    await inicializarUsuariosPadrao();
    await carregarUsuarios();
    
    const form = document.getElementById('formNovoUsuario');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await adicionarUsuario();
    });
});

// Inicializar com usuários padrão
async function inicializarUsuariosPadrao() {
    try {
        // Verificar se já existem usuários
        const snapshot = await usuariosRef.limit(1).get();
        
        if (!snapshot.empty) {
            return; // Já tem usuários cadastrados
        }
        
        // Cadastrar usuários padrão (EXEMPLOS - pode apagar após cadastrar os reais)
        const usuariosPadrao = [
            {
                tipo: 'militar',
                nome: 'Exemplo Militar 1',
                numero_policia: '000000-0',
                unidade: 'STIC',
                telefone: '',
                ativo: true,
                data_cadastro: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                tipo: 'militar',
                nome: 'Exemplo Militar 2',
                numero_policia: '111111-1',
                unidade: 'STIC',
                telefone: '',
                ativo: true,
                data_cadastro: firebase.firestore.FieldValue.serverTimestamp()
            }
        ];
        
        for (const usuario of usuariosPadrao) {
            await usuariosRef.add(usuario);
        }
        
        console.log('✅ Usuários padrão cadastrados!');
        
    } catch (error) {
        console.error('Erro ao inicializar usuários:', error);
    }
}

// Carregar lista de usuários
async function carregarUsuarios() {
    try {
        mostrarLoading('Carregando recebedores...');
        
        const snapshot = await usuariosRef.where('ativo', '==', true).get();
        
        const lista = document.getElementById('listaUsuarios');
        lista.innerHTML = '';
        
        if (snapshot.empty) {
            lista.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <p>Nenhum recebedor cadastrado</p>
                </div>
            `;
            ocultarLoading();
            return;
        }
        
        snapshot.forEach(doc => {
            const usuario = { id: doc.id, ...doc.data() };
            const item = criarItemUsuario(usuario);
            lista.appendChild(item);
        });
        
        ocultarLoading();
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao carregar usuários:', error);
        mostrarErro('Erro ao carregar recebedores');
    }
}

// Criar item de usuário
function criarItemUsuario(usuario) {
    const div = document.createElement('div');
    div.className = 'os-item';
    div.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 100px';
    
    const tipoIcone = usuario.tipo === 'militar' ? '👮' : '👤';
    
    div.innerHTML = `
        <div>
            <strong>${tipoIcone} ${usuario.nome}</strong>
        </div>
        <div>
            <small style="color: #666;">
                ${usuario.tipo === 'militar' ? 
                    `Nº Polícia: ${usuario.numero_policia}` : 
                    `CPF: ${usuario.cpf || 'Não informado'}`}
            </small>
        </div>
        <div>
            <small style="color: #666;">
                ${usuario.unidade || usuario.orgao || '-'}
            </small>
        </div>
        <div>
            <small style="color: #666;">
                ${usuario.telefone || 'Sem telefone'}
            </small>
        </div>
        <div style="text-align: right;">
            <button class="btn-icon btn-delete" title="Excluir" onclick="excluirUsuario('${usuario.id}', '${usuario.nome}')">
                🗑️
            </button>
        </div>
    `;
    
    return div;
}

// Adicionar novo usuário
async function adicionarUsuario() {
    const form = document.getElementById('formNovoUsuario');
    
    if (!validarFormulario(form)) {
        mostrarErro('Preencha todos os campos obrigatórios!');
        return;
    }
    
    try {
        mostrarLoading('Adicionando recebedor...');
        
        const tipo = document.getElementById('tipoUsuario').value;
        
        const usuario = {
            tipo: tipo,
            nome: document.getElementById('nomeUsuario').value,
            telefone: document.getElementById('telefoneUser').value,
            ativo: true,
            data_cadastro: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (tipo === 'militar') {
            usuario.numero_policia = document.getElementById('numeroPoliciaUser').value;
            usuario.unidade = document.getElementById('unidadeUser').value;
        } else {
            usuario.cpf = document.getElementById('cpfUser').value;
            usuario.orgao = document.getElementById('orgaoUser').value;
        }
        
        await usuariosRef.add(usuario);
        
        ocultarLoading();
        mostrarSucesso('Recebedor adicionado com sucesso!');
        
        // Limpar formulário
        form.reset();
        
        // Recarregar lista
        await carregarUsuarios();
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao adicionar usuário:', error);
        mostrarErro('Erro ao adicionar recebedor: ' + error.message);
    }
}

// Excluir usuário
async function excluirUsuario(id, nome) {
    if (!confirm(`Tem certeza que deseja excluir o recebedor "${nome}"?\n\nEsta ação não pode ser desfeita!`)) {
        return;
    }
    
    try {
        mostrarLoading('Excluindo recebedor...');
        
        // Marcar como inativo ao invés de deletar
        await usuariosRef.doc(id).update({ ativo: false });
        
        ocultarLoading();
        mostrarSucesso('Recebedor excluído com sucesso!');
        
        // Recarregar lista
        await carregarUsuarios();
        
    } catch (error) {
        ocultarLoading();
        console.error('Erro ao excluir usuário:', error);
        mostrarErro('Erro ao excluir recebedor: ' + error.message);
    }
}

// Listar usuários ativos (para usar em dropdowns)
async function listarUsuariosAtivos() {
    try {
        const snapshot = await usuariosRef.where('ativo', '==', true).get();
        const usuarios = [];
        
        snapshot.forEach(doc => {
            usuarios.push({ id: doc.id, ...doc.data() });
        });
        
        return usuarios;
        
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        return [];
    }
}

console.log('✅ Gerenciador de usuários carregado!');
