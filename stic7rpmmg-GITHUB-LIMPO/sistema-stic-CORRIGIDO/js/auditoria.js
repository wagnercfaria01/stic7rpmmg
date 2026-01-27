// ============================================
// SISTEMA DE AUDITORIA COMPLETO - STIC 7ª RPM
// ============================================

const AUDITORIA_CONFIG = {
    enabled: true,
    colecao: 'logs_auditoria',
    registrarVisualizacoes: false, // Desabilitar para não lotar o banco
    tentarObterIP: true,
    manterPorDias: 180 // Manter logs por 6 meses
};

class SistemaAuditoria {
    constructor() {
        this.db = firebase.firestore();
        this.ipCliente = null;
        this.usuarioLogado = null;
        this.init();
    }
    
    async init() {
        // Obter IP do cliente
        await this.obterIP();
        
        // Obter usuário logado
        this.atualizarUsuario();
        
        console.log('✅ Sistema de Auditoria inicializado');
    }
    
    async obterIP() {
        if (!AUDITORIA_CONFIG.tentarObterIP) return;
        
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            this.ipCliente = data.ip;
            console.log(`📡 IP detectado: ${this.ipCliente}`);
        } catch (error) {
            console.warn('⚠️ Não foi possível obter IP:', error);
            this.ipCliente = 'Não disponível';
        }
    }
    
    atualizarUsuario() {
        const usuario = sessionStorage.getItem('stic_usuario');
        if (usuario) {
            try {
                this.usuarioLogado = JSON.parse(usuario);
            } catch (e) {
                this.usuarioLogado = null;
            }
        }
    }
    
    // Método principal para registrar ações
    async registrar(config) {
        if (!AUDITORIA_CONFIG.enabled) return;
        
        // Atualizar usuário antes de registrar
        this.atualizarUsuario();
        
        const {
            tipo,           // 'criar', 'editar', 'excluir', 'visualizar', 'exportar', 'login', 'logout'
            modulo,         // 'os', 'emprestimos', 'materiais', 'horas_extras', 'usuarios'
            acao,           // Descrição da ação
            dados_antes = null,
            dados_depois = null,
            documento_id = null,
            sucesso = true,
            erro = null
        } = config;
        
        try {
            const log = {
                // Informações da ação
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                tipo,
                modulo,
                acao,
                documento_id,
                
                // Dados da mudança
                dados_antes,
                dados_depois,
                
                // Informações do usuário
                usuario: {
                    nome: this.usuarioLogado?.nome || 'Desconhecido',
                    numero_pm: this.usuarioLogado?.numero_pm || 'N/A',
                    id: this.usuarioLogado?.id || null,
                    tipo: this.usuarioLogado?.tipo || 'usuario'
                },
                
                // Informações técnicas
                ip_cliente: this.ipCliente,
                navegador: navigator.userAgent,
                plataforma: navigator.platform,
                idioma: navigator.language,
                url: window.location.href,
                url_referrer: document.referrer || null,
                
                // Status
                sucesso,
                erro,
                
                // Metadata
                versao_sistema: '10.0'
            };
            
            // Salvar no Firestore
            await this.db.collection(AUDITORIA_CONFIG.colecao).add(log);
            
            console.log(`✅ Log registrado: ${tipo} - ${acao}`);
            
        } catch (error) {
            console.error('❌ Erro ao registrar auditoria:', error);
        }
    }
    
    // ========================================
    // MÉTODOS AUXILIARES
    // ========================================
    
    // Registrar criação
    async criar(modulo, descricao, dados, documentoId = null) {
        return this.registrar({
            tipo: 'criar',
            modulo,
            acao: descricao,
            dados_depois: dados,
            documento_id: documentoId
        });
    }
    
    // Registrar edição
    async editar(modulo, descricao, dadosAntes, dadosDepois, documentoId = null) {
        return this.registrar({
            tipo: 'editar',
            modulo,
            acao: descricao,
            dados_antes: dadosAntes,
            dados_depois: dadosDepois,
            documento_id: documentoId
        });
    }
    
    // Registrar exclusão
    async excluir(modulo, descricao, dados, documentoId = null) {
        return this.registrar({
            tipo: 'excluir',
            modulo,
            acao: descricao,
            dados_antes: dados,
            documento_id: documentoId
        });
    }
    
    // Registrar visualização
    async visualizar(modulo, descricao) {
        if (!AUDITORIA_CONFIG.registrarVisualizacoes) return;
        
        return this.registrar({
            tipo: 'visualizar',
            modulo,
            acao: descricao
        });
    }
    
    // Registrar exportação
    async exportar(modulo, descricao, formato, quantidade = null) {
        return this.registrar({
            tipo: 'exportar',
            modulo,
            acao: descricao,
            dados_depois: { 
                formato, 
                quantidade,
                data_exportacao: new Date().toISOString()
            }
        });
    }
    
    // Registrar login/logout
    async autenticacao(tipo, sucesso = true, erro = null) {
        return this.registrar({
            tipo,
            modulo: 'autenticacao',
            acao: tipo === 'login' ? 'Usuário realizou login' : 'Usuário realizou logout',
            sucesso,
            erro
        });
    }
    
    // Registrar erro
    async erro(modulo, descricao, erro) {
        return this.registrar({
            tipo: 'erro',
            modulo,
            acao: descricao,
            sucesso: false,
            erro: erro.message || String(erro)
        });
    }
    
    // ========================================
    // CONSULTAS
    // ========================================
    
    // Buscar logs com filtros
    async buscarLogs(filtros = {}) {
        try {
            let query = this.db.collection(AUDITORIA_CONFIG.colecao)
                .orderBy('timestamp', 'desc');
            
            // Aplicar filtros
            if (filtros.tipo) {
                query = query.where('tipo', '==', filtros.tipo);
            }
            
            if (filtros.modulo) {
                query = query.where('modulo', '==', filtros.modulo);
            }
            
            if (filtros.documentoId) {
                query = query.where('documento_id', '==', filtros.documentoId);
            }
            
            if (filtros.limite) {
                query = query.limit(filtros.limite);
            }
            
            const snapshot = await query.get();
            const logs = [];
            
            snapshot.forEach(doc => {
                logs.push({ id: doc.id, ...doc.data() });
            });
            
            return logs;
            
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
            return [];
        }
    }
    
    // Buscar logs de um documento específico
    async buscarLogsPorDocumento(documentoId) {
        return this.buscarLogs({ documentoId, limite: 100 });
    }
    
    // Buscar atividades recentes
    async buscarAtividadesRecentes(limite = 50) {
        return this.buscarLogs({ limite });
    }
    
    // Limpar logs antigos (manutenção)
    async limparLogsAntigos() {
        try {
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() - AUDITORIA_CONFIG.manterPorDias);
            
            const snapshot = await this.db.collection(AUDITORIA_CONFIG.colecao)
                .where('timestamp', '<', dataLimite)
                .get();
            
            const batch = this.db.batch();
            let count = 0;
            
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
                count++;
            });
            
            if (count > 0) {
                await batch.commit();
                console.log(`🗑️ ${count} logs antigos removidos`);
            }
            
            return count;
            
        } catch (error) {
            console.error('Erro ao limpar logs antigos:', error);
            return 0;
        }
    }
}

// ========================================
// INSTÂNCIA GLOBAL
// ========================================

let auditoria;

// Inicializar quando Firebase estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar Firebase
    const checkFirebase = setInterval(() => {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            clearInterval(checkFirebase);
            auditoria = new SistemaAuditoria();
            window.auditoria = auditoria;
        }
    }, 100);
});

// ========================================
// EXEMPLOS DE USO
// ========================================

/*

// 1. CRIAR OS
await auditoria.criar('os', 'Nova OS criada', {
    numero: '001',
    tipo: 'equipamento',
    solicitante: 'Cb Silva'
}, osId);

// 2. EDITAR OS
await auditoria.editar('os', 'OS atualizada', 
    { status: 'aberta' }, 
    { status: 'em_manutencao' },
    osId
);

// 3. EXCLUIR OS
await auditoria.excluir('os', 'OS excluída', {
    numero: '001',
    solicitante: 'Cb Silva'
}, osId);

// 4. EXPORTAR RELATÓRIO
await auditoria.exportar('relatorios', 'Relatório de OS exportado', 'xlsx', 150);

// 5. LOGIN/LOGOUT
await auditoria.autenticacao('login', true);
await auditoria.autenticacao('logout');

// 6. REGISTRAR ERRO
try {
    // código...
} catch (error) {
    await auditoria.erro('os', 'Erro ao criar OS', error);
}

// 7. BUSCAR LOGS
const logs = await auditoria.buscarLogs({
    tipo: 'editar',
    modulo: 'os',
    limite: 100
});

// 8. BUSCAR HISTÓRICO DE UM DOCUMENTO
const historico = await auditoria.buscarLogsPorDocumento(osId);

*/
