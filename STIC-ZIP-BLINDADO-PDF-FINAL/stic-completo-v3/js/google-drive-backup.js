// ============================================
// BACKUP AUTOMÁTICO GOOGLE DRIVE
// STIC 7ª RPM - v10.4
// ============================================

const GOOGLE_CONFIG = {
    // Client ID - STIC 7ª RPM
    clientId: '177637259329-lieimgi84jg0ic2uamgc5plc0inqavtj.apps.googleusercontent.com',
    
    scopes: ['https://www.googleapis.com/auth/drive.file'],
    redirectUri: 'https://stic7rpmmg.netlify.app'
};

let accessToken = null;

// ============================================
// AUTENTICAR
// ============================================

async function autenticarGoogleDrive() {
    accessToken = localStorage.getItem('google_drive_token');
    
    if (accessToken) {
        const valido = await verificarToken();
        if (valido) {
            console.log('✅ Token Google Drive válido');
            return true;
        }
    }
    
    await solicitarNovoToken();
    return true;
}

async function verificarToken() {
    try {
        const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        return response.ok;
    } catch {
        return false;
    }
}

function solicitarNovoToken() {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CONFIG.clientId}&` +
        `redirect_uri=${encodeURIComponent(GOOGLE_CONFIG.redirectUri)}&` +
        `response_type=token&` +
        `scope=${encodeURIComponent(GOOGLE_CONFIG.scopes.join(' '))}`;
    
    window.location.href = authUrl;
}

// Capturar token do redirect
if (window.location.hash) {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const token = params.get('access_token');
    if (token) {
        localStorage.setItem('google_drive_token', token);
        accessToken = token;
        window.location.hash = '';
        console.log('✅ Token Google Drive salvo!');
    }
}

// ============================================
// CRIAR/BUSCAR PASTA
// ============================================

async function buscarOuCriarPasta(nomePasta, pastaParentId = null) {
    try {
        let query = `name='${nomePasta}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        if (pastaParentId) query += ` and '${pastaParentId}' in parents`;
        
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        
        const data = await response.json();
        
        if (data.files && data.files.length > 0) {
            return data.files[0].id;
        }
        
        // Criar pasta
        const metadata = {
            name: nomePasta,
            mimeType: 'application/vnd.google-apps.folder'
        };
        if (pastaParentId) metadata.parents = [pastaParentId];
        
        const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        });
        
        const createData = await createResponse.json();
        return createData.id;
        
    } catch (error) {
        console.error('Erro:', error);
        return null;
    }
}

// ============================================
// UPLOAD ARQUIVO
// ============================================

async function uploadArquivo(nomeArquivo, conteudo, pastaId) {
    try {
        const metadata = {
            name: nomeArquivo,
            parents: [pastaId]
        };
        
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', new Blob([conteudo], { type: 'application/json' }));
        
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` },
            body: formData
        });
        
        const data = await response.json();
        return data.id;
        
    } catch (error) {
        console.error('Erro upload:', error);
        return null;
    }
}

// ============================================
// BACKUP COMPLETO DO SISTEMA
// ============================================

async function fazerBackupCompleto() {
    try {
        console.log('🔄 Iniciando backup completo do sistema...');
        
        const autenticado = await autenticarGoogleDrive();
        if (!autenticado) throw new Error('Falha na autenticação');
        
        const db = firebase.firestore();
        const backup = {
            data: new Date().toISOString(),
            sistema: 'STIC 7ª RPM',
            versao: '10.4',
            colecoes: {}
        };
        
        // Coleções para backup
        const colecoes = [
            'horas_extras',
            'ordens_servico',
            'saidas',
            'entradas_material',
            'militares',
            'logs_auditoria',
            'logs_sistema',
            'usuarios_recebedores',
            'telegram_users',
            'assinaturas'
        ];
        
        // Exportar cada coleção
        for (const col of colecoes) {
            try {
                console.log(`📦 Exportando ${col}...`);
                const snapshot = await db.collection(col).get();
                backup.colecoes[col] = [];
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    
                    // Converter Timestamps para ISO string
                    Object.keys(data).forEach(key => {
                        if (data[key] && typeof data[key].toDate === 'function') {
                            data[key] = data[key].toDate().toISOString();
                        }
                    });
                    
                    backup.colecoes[col].push({
                        id: doc.id,
                        data: data
                    });
                });
                
                console.log(`✅ ${col}: ${backup.colecoes[col].length} registros`);
                
            } catch (error) {
                console.warn(`⚠️ Erro ao exportar ${col}:`, error.message);
                backup.colecoes[col] = [];
            }
        }
        
        // Criar JSON
        const json = JSON.stringify(backup, null, 2);
        const tamanhoKB = (json.length / 1024).toFixed(2);
        
        console.log(`📊 Tamanho do backup: ${tamanhoKB} KB`);
        
        // Organizar pastas por data
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = hoje.toLocaleDateString('pt-BR', { month: 'long' });
        
        console.log('📁 Criando estrutura de pastas...');
        const pastaRaiz = await buscarOuCriarPasta('STIC Backups');
        const pastaAno = await buscarOuCriarPasta(ano.toString(), pastaRaiz);
        const pastaMes = await buscarOuCriarPasta(mes, pastaAno);
        
        // Nome do arquivo
        const nomeArquivo = `backup_completo_${hoje.toISOString().split('T')[0]}.json`;
        
        // Upload
        console.log('📤 Fazendo upload para Google Drive...');
        const fileId = await uploadArquivo(nomeArquivo, json, pastaMes);
        
        if (fileId) {
            console.log(`✅ BACKUP REALIZADO COM SUCESSO!`);
            console.log(`📄 Arquivo: ${nomeArquivo}`);
            console.log(`🔗 File ID: ${fileId}`);
            console.log(`📊 Tamanho: ${tamanhoKB} KB`);
            
            // Registrar log no Firebase
            await db.collection('backups_log').add({
                data: firebase.firestore.FieldValue.serverTimestamp(),
                tipo: 'google_drive_completo',
                arquivo: nomeArquivo,
                file_id: fileId,
                tamanho_kb: tamanhoKB,
                colecoes: Object.keys(backup.colecoes).map(col => ({
                    nome: col,
                    registros: backup.colecoes[col].length
                })),
                sucesso: true
            });
            
            return true;
        }
        
        throw new Error('Falha no upload');
        
    } catch (error) {
        console.error('❌ ERRO NO BACKUP:', error);
        
        // Registrar erro no Firebase
        try {
            await firebase.firestore().collection('backups_log').add({
                data: firebase.firestore.FieldValue.serverTimestamp(),
                tipo: 'google_drive_completo',
                sucesso: false,
                erro: error.message
            });
        } catch (e) {
            console.error('Erro ao registrar log:', e);
        }
        
        return false;
    }
}

// ============================================
// AGENDAR BACKUP DIÁRIO (23h)
// ============================================

function agendarBackupDiario() {
    const agora = new Date();
    const proximoBackup = new Date();
    proximoBackup.setHours(23, 0, 0, 0); // 23h
    
    if (proximoBackup < agora) {
        proximoBackup.setDate(proximoBackup.getDate() + 1);
    }
    
    const tempo = proximoBackup - agora;
    
    setTimeout(async () => {
        console.log('⏰ Iniciando backup automático diário...');
        await fazerBackupCompleto();
        agendarBackupDiario(); // Reagendar para próximo dia
    }, tempo);
    
    console.log(`⏰ Próximo backup automático: ${proximoBackup.toLocaleString('pt-BR')}`);
}

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Sistema de Backup Google Drive carregado!');
    agendarBackupDiario();
});

// Expor função globalmente para uso manual
window.fazerBackupCompleto = fazerBackupCompleto;
