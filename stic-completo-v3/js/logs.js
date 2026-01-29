// Sistema de Logs Completo - STIC PMMG

// Função principal para criar logs
async function criarLog(tipo, acao, dados = {}) {
    try {
        // Obter dados do usuário logado
        const usuario = {
            nome: sessionStorage.getItem('stic_usuario_nome') || 'Sistema',
            numero_policia: sessionStorage.getItem('stic_usuario_numero') || '',
            email: sessionStorage.getItem('stic_usuario_email') || ''
        };
        
        // Obter IP do usuário (usando serviço gratuito)
        let ip = 'Desconhecido';
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            ip = data.ip;
        } catch (error) {
            console.log('Não foi possível obter IP');
        }
        
        // Criar objeto de log
        const log = {
            tipo, // login, criacao, edicao, status, exclusao, visualizacao
            usuario,
            acao,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            data_hora: new Date().toISOString(),
            ip,
            navegador: navigator.userAgent,
            dispositivo: isMobile() ? 'Mobile' : 'Desktop',
            sistema_operacional: getOS(),
            ...dados
        };
        
        // Salvar no Firestore
        await db.collection('logs_sistema').add(log);
        
        console.log('✅ Log registrado:', tipo, acao);
        
    } catch (error) {
        console.error('❌ Erro ao criar log:', error);
        // Não bloqueia operação se log falhar
    }
}

// Detectar se é mobile
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Detectar sistema operacional
function getOS() {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
    
    if (macosPlatforms.indexOf(platform) !== -1) {
        return 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
        return 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
        return 'Windows';
    } else if (/Android/.test(userAgent)) {
        return 'Android';
    } else if (/Linux/.test(platform)) {
        return 'Linux';
    }
    return 'Desconhecido';
}

// Funções específicas para cada tipo de log

// LOG DE LOGIN
async function logLogin(sucesso = true) {
    await criarLog('login', sucesso ? 'Login bem-sucedido' : 'Tentativa de login falhou', {
        sucesso
    });
}

// LOG DE LOGOUT
async function logLogout() {
    await criarLog('logout', 'Usuário saiu do sistema');
}

// LOG DE CRIAÇÃO
async function logCriacao(tipo, id, dados) {
    const tipos = {
        'os': 'Ordem de Serviço',
        'entrada': 'Entrada de Material',
        'saida': 'Saída de Material',
        'usuario': 'Usuário/Recebedor'
    };
    
    await criarLog('criacao', `Criou ${tipos[tipo]} #${id}`, {
        documento: `${tipo}/${id}`,
        dados_criados: dados
    });
}

// LOG DE EDIÇÃO
async function logEdicao(tipo, id, campo, valorAntigo, valorNovo) {
    const tipos = {
        'os': 'OS',
        'entrada': 'Entrada',
        'saida': 'Saída',
        'usuario': 'Usuário'
    };
    
    await criarLog('edicao', `Editou ${tipos[tipo]} #${id}`, {
        documento: `${tipo}/${id}`,
        campo_alterado: campo,
        valor_anterior: valorAntigo,
        valor_novo: valorNovo
    });
}

// LOG DE MUDANÇA DE STATUS
async function logMudancaStatus(osId, statusAntigo, statusNovo, motivo = '') {
    await criarLog('status', `Alterou status da OS #${osId}`, {
        documento: `ordens_servico/${osId}`,
        status_anterior: statusAntigo,
        status_novo: statusNovo,
        motivo
    });
}

// LOG DE EXCLUSÃO
async function logExclusao(tipo, id, dados, motivo = '') {
    const tipos = {
        'os': 'Ordem de Serviço',
        'entrada': 'Entrada de Material',
        'saida': 'Saída de Material',
        'usuario': 'Usuário/Recebedor'
    };
    
    await criarLog('exclusao', `Excluiu ${tipos[tipo]} #${id}`, {
        documento: `${tipo}/${id}`,
        dados_excluidos: dados,
        motivo
    });
}

// LOG DE VISUALIZAÇÃO
async function logVisualizacao(tipo, id) {
    const tipos = {
        'os': 'OS',
        'termo': 'Termo',
        'relatorio': 'Relatório'
    };
    
    await criarLog('visualizacao', `Visualizou ${tipos[tipo]} #${id}`, {
        documento: `${tipo}/${id}`
    });
}

// LOG DE ASSINATURA
async function logAssinatura(tipo, id, quemAssinou) {
    const tipos = {
        'entrada': 'Termo de Entrada',
        'saida': 'Termo de Saída'
    };
    
    await criarLog('assinatura', `Assinou ${tipos[tipo]} #${id}`, {
        documento: `${tipo}/${id}`,
        assinante: quemAssinou
    });
}

// LOG DE COMPARTILHAMENTO
async function logCompartilhamento(tipo, id, destino) {
    await criarLog('compartilhamento', `Compartilhou ${tipo} #${id} via ${destino}`, {
        documento: `${tipo}/${id}`,
        destino
    });
}

// LOG DE EXPORTAÇÃO
async function logExportacao(tipo, formato, filtros = {}) {
    await criarLog('exportacao', `Exportou ${tipo} em formato ${formato}`, {
        tipo_exportacao: tipo,
        formato,
        filtros_aplicados: filtros
    });
}

// LOG DE BACKUP
async function logBackup(tipo, sucesso = true) {
    await criarLog('backup', `${tipo} de backup ${sucesso ? 'realizado' : 'falhou'}`, {
        tipo_backup: tipo, // manual ou automatico
        sucesso
    });
}

// LOG DE ERRO
async function logErro(erro, contexto = '') {
    await criarLog('erro', `Erro no sistema: ${erro.message || erro}`, {
        erro: erro.toString(),
        stack: erro.stack || '',
        contexto
    });
}

// LOG DE COMENTÁRIO
async function logComentario(osId, comentario) {
    await criarLog('comentario', `Adicionou comentário na OS #${osId}`, {
        documento: `ordens_servico/${osId}`,
        comentario_texto: comentario.substring(0, 100) + (comentario.length > 100 ? '...' : '')
    });
}

// LOG DE ANÁLISE IA
async function logAnaliseIA(patrimonio, resultado) {
    await criarLog('ia', `Análise IA executada para patrimônio ${patrimonio}`, {
        patrimonio,
        problemas_encontrados: resultado.problema_recorrente,
        deve_substituir: resultado.deve_substituir
    });
}

console.log('✅ Sistema de logs carregado!');
