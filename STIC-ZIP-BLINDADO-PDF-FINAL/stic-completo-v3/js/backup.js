// Sistema de Backup Automático - STIC PMMG

// Fazer backup manual
async function fazerBackup() {
    try {
        mostrarLoading('Gerando backup...');
        
        // Coletar dados de todas as collections
        const collections = [
            'ordens_servico',
            'entradas',
            'saidas',
            'usuarios_recebedores',
            'logs_sistema'
        ];
        
        const backup = {
            data_backup: new Date().toISOString(),
            versao: '3.0',
            collections: {}
        };
        
        // Exportar cada collection
        for (const collectionName of collections) {
            const snapshot = await db.collection(collectionName).get();
            const dados = [];
            
            snapshot.forEach(doc => {
                dados.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            backup.collections[collectionName] = dados;
            console.log(`✅ ${collectionName}: ${dados.length} documentos`);
        }
        
        // Converter para JSON
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        
        // Download
        const dataAtual = new Date().toISOString().split('T')[0];
        const horaAtual = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
        const nomeArquivo = `backup-stic-${dataAtual}-${horaAtual}.json`;
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = nomeArquivo;
        link.click();
        
        // Salvar metadata do backup
        await salvarMetadataBackup(nomeArquivo, backup);
        
        // Registrar log
        await logBackup('manual', true);
        
        ocultarLoading();
        mostrarSucesso(`Backup realizado com sucesso!<br>Arquivo: ${nomeArquivo}`);
        
        return backup;
        
    } catch (error) {
        ocultarLoading();
        console.error('❌ Erro ao fazer backup:', error);
        mostrarErro('Erro ao fazer backup: ' + error.message);
        await logBackup('manual', false);
        throw error;
    }
}

// Salvar metadata do backup
async function salvarMetadataBackup(nomeArquivo, backup) {
    try {
        const metadata = {
            nome_arquivo: nomeArquivo,
            data_backup: new Date().toISOString(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            usuario: sessionStorage.getItem('stic_usuario_nome') || 'Sistema',
            tipo: 'manual',
            tamanho_kb: Math.round(JSON.stringify(backup).length / 1024),
            total_documentos: Object.values(backup.collections)
                .reduce((total, col) => total + col.length, 0),
            collections: Object.keys(backup.collections).map(nome => ({
                nome,
                total: backup.collections[nome].length
            }))
        };
        
        await db.collection('backups_metadata').add(metadata);
        console.log('✅ Metadata do backup salva');
        
    } catch (error) {
        console.error('❌ Erro ao salvar metadata:', error);
    }
}

// Restaurar backup
async function restaurarBackup(arquivo) {
    if (!confirm('⚠️ ATENÇÃO!\n\nRestaurar um backup irá SOBRESCREVER todos os dados atuais.\n\nVocê tem certeza que deseja continuar?\n\nRecomendamos fazer um backup dos dados atuais antes de prosseguir.')) {
        return;
    }
    
    if (!confirm('Última confirmação:\n\nTodos os dados atuais serão substituídos pelo backup.\n\nContinuar?')) {
        return;
    }
    
    try {
        mostrarLoading('Restaurando backup...');
        
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const backup = JSON.parse(e.target.result);
                
                console.log('📦 Backup carregado:', backup.data_backup);
                
                // Restaurar cada collection
                for (const [collectionName, documentos] of Object.entries(backup.collections)) {
                    console.log(`Restaurando ${collectionName}...`);
                    
                    const batch = db.batch();
                    let contador = 0;
                    
                    for (const doc of documentos) {
                        const docRef = db.collection(collectionName).doc(doc.id);
                        const { id, ...dados } = doc;
                        batch.set(docRef, dados);
                        
                        contador++;
                        
                        // Firestore limita 500 operações por batch
                        if (contador >= 500) {
                            await batch.commit();
                            contador = 0;
                        }
                    }
                    
                    if (contador > 0) {
                        await batch.commit();
                    }
                    
                    console.log(`✅ ${collectionName} restaurada`);
                }
                
                // Registrar log
                await logBackup('restauracao', true);
                
                ocultarLoading();
                mostrarSucesso('Backup restaurado com sucesso!<br>A página será recarregada.');
                
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
                
            } catch (error) {
                ocultarLoading();
                console.error('❌ Erro ao restaurar backup:', error);
                mostrarErro('Erro ao restaurar backup: ' + error.message);
                await logBackup('restauracao', false);
            }
        };
        
        reader.readAsText(arquivo);
        
    } catch (error) {
        ocultarLoading();
        console.error('❌ Erro ao processar arquivo:', error);
        mostrarErro('Erro ao processar arquivo de backup');
    }
}

// Listar backups recentes
async function listarBackups() {
    try {
        const snapshot = await db.collection('backups_metadata')
            .orderBy('timestamp', 'desc')
            .limit(30)
            .get();
        
        const backups = [];
        snapshot.forEach(doc => {
            backups.push({ id: doc.id, ...doc.data() });
        });
        
        return backups;
        
    } catch (error) {
        console.error('❌ Erro ao listar backups:', error);
        return [];
    }
}

// Limpar backups antigos (manter últimos 30 dias)
async function limparBackupsAntigos() {
    try {
        const trintaDiasAtras = new Date();
        trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
        
        const snapshot = await db.collection('backups_metadata')
            .where('timestamp', '<', trintaDiasAtras)
            .get();
        
        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        console.log(`✅ ${snapshot.size} backups antigos removidos`);
        
    } catch (error) {
        console.error('❌ Erro ao limpar backups antigos:', error);
    }
}

// Backup automático diário (executar via Cloud Function)
// Este código seria colocado em uma Cloud Function do Firebase
/*
exports.backupDiario = functions.pubsub
    .schedule('0 0 * * *') // Todo dia à meia-noite
    .timeZone('America/Sao_Paulo')
    .onRun(async (context) => {
        const admin = require('firebase-admin');
        const db = admin.firestore();
        const storage = admin.storage();
        
        try {
            // Coletar dados
            const collections = ['ordens_servico', 'entradas', 'saidas', 'usuarios_recebedores'];
            const backup = {
                data_backup: new Date().toISOString(),
                versao: '3.0',
                collections: {}
            };
            
            for (const collectionName of collections) {
                const snapshot = await db.collection(collectionName).get();
                const dados = [];
                
                snapshot.forEach(doc => {
                    dados.push({ id: doc.id, ...doc.data() });
                });
                
                backup.collections[collectionName] = dados;
            }
            
            // Salvar no Storage
            const dataAtual = new Date().toISOString().split('T')[0];
            const nomeArquivo = `backup-automatico-${dataAtual}.json`;
            const bucket = storage.bucket();
            const file = bucket.file(`backups/${nomeArquivo}`);
            
            await file.save(JSON.stringify(backup, null, 2), {
                contentType: 'application/json'
            });
            
            // Salvar metadata
            await db.collection('backups_metadata').add({
                nome_arquivo: nomeArquivo,
                data_backup: new Date().toISOString(),
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                tipo: 'automatico',
                tamanho_kb: Math.round(JSON.stringify(backup).length / 1024)
            });
            
            // Limpar backups com mais de 30 dias
            const trintaDiasAtras = new Date();
            trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);
            
            const [files] = await bucket.getFiles({ prefix: 'backups/' });
            for (const file of files) {
                const [metadata] = await file.getMetadata();
                const fileDate = new Date(metadata.timeCreated);
                
                if (fileDate < trintaDiasAtras) {
                    await file.delete();
                }
            }
            
            console.log('✅ Backup automático concluído');
            return null;
            
        } catch (error) {
            console.error('❌ Erro no backup automático:', error);
            throw error;
        }
    });
*/

console.log('✅ Sistema de backup carregado!');
