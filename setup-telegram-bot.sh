#!/bin/bash
# Setup automático do Bot Telegram STIC

echo "🤖 INSTALANDO BOT TELEGRAM STIC 7ª RPM"
echo "========================================"
echo ""

# Criar diretório
mkdir -p stic-telegram-bot
cd stic-telegram-bot

# Criar package.json
cat > package.json << 'EOF'
{
  "name": "stic-telegram-bot",
  "version": "1.0.0",
  "description": "Bot Telegram para STIC 7ª RPM",
  "main": "bot.js",
  "scripts": {
    "start": "node bot.js",
    "dev": "nodemon bot.js"
  },
  "keywords": ["telegram", "bot", "stic", "pmmg"],
  "author": "STIC 7ª RPM",
  "license": "MIT",
  "dependencies": {
    "node-telegram-bot-api": "^0.66.0",
    "firebase-admin": "^12.0.0",
    "dotenv": "^16.4.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.3"
  }
}
EOF

# Criar .env
cat > .env << 'EOF'
# Token do Bot (NÃO COMPARTILHE!)
TELEGRAM_BOT_TOKEN=8222354261:AAFEbbvm9DyZhDWF2muMqzOTzk3KQyFVZP8

# Firebase Admin SDK
FIREBASE_PROJECT_ID=stic7rpmmg-948b1
FIREBASE_PRIVATE_KEY=COLOQUE_SUA_CHAVE_AQUI
FIREBASE_CLIENT_EMAIL=COLOQUE_SEU_EMAIL_AQUI

# URL do Sistema
BASE_URL=https://stic7rpmmg.netlify.app
EOF

# Criar .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
*.log
.DS_Store
EOF

# Criar bot.js
cat > bot.js << 'ENDOFJS'
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

// Configurar Firebase Admin
try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        })
    });
    console.log('✅ Firebase conectado!');
} catch (error) {
    console.error('❌ Erro Firebase:', error.message);
    process.exit(1);
}

const db = admin.firestore();

// Criar bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { 
    polling: true,
    filepath: false
});

console.log('🤖 Bot STIC 7ª RPM iniciado!');
console.log('📱 Telegram: @Stic7rpmbot');
console.log('🎯 Aguardando comandos...\n');

// ==================
// COMANDOS DO BOT
// ==================

// /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const nome = msg.from.first_name || 'Militar';
    
    bot.sendMessage(chatId, 
        `🤖 *Bem-vindo, ${nome}!*\n\n` +
        `*STIC 7ª RPM - Bot Oficial*\n\n` +
        `📋 *Comandos disponíveis:*\n` +
        `/registro NUMERO_PM - Registrar para receber notificações\n` +
        `/status - Ver status do sistema\n` +
        `/meusemprestimos - Ver seus empréstimos ativos\n` +
        `/help - Ajuda completa\n\n` +
        `_Sistema desenvolvido pela STIC 7ª RPM_`,
        { parse_mode: 'Markdown' }
    );
});

// /registro
bot.onText(/\/registro (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const numeroPM = match[1].trim();
    
    // Validar formato (ex: 123456-7)
    if (!/^\d{6}-\d$/.test(numeroPM)) {
        bot.sendMessage(chatId, 
            '❌ *Formato inválido!*\n\n' +
            'Use: `/registro 123456-7`\n\n' +
            'Exemplo: `/registro 163396-5`',
            { parse_mode: 'Markdown' }
        );
        return;
    }
    
    try {
        await db.collection('telegram_users').doc(numeroPM).set({
            chat_id: chatId,
            nome: msg.from.first_name || 'Militar',
            username: msg.from.username || null,
            numero_pm: numeroPM,
            registrado_em: admin.firestore.FieldValue.serverTimestamp(),
            ultimo_acesso: admin.firestore.FieldValue.serverTimestamp()
        });
        
        bot.sendMessage(chatId, 
            '✅ *Registrado com sucesso!*\n\n' +
            `📋 Número PM: ${numeroPM}\n` +
            `👤 Nome: ${msg.from.first_name}\n\n` +
            `Você receberá notificações automáticas de:\n` +
            `• Novos empréstimos\n` +
            `• Lembretes de devolução\n` +
            `• Confirmações de devolução\n\n` +
            `_Sistema STIC 7ª RPM_`,
            { parse_mode: 'Markdown' }
        );
        
        console.log(`✅ Registrado: ${numeroPM} - ${msg.from.first_name}`);
        
    } catch (error) {
        console.error('Erro ao registrar:', error);
        bot.sendMessage(chatId, '❌ Erro ao registrar. Tente novamente.');
    }
});

// /status
bot.onText(/\/status/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        // Buscar estatísticas
        const emprestimosSnapshot = await db.collection('saidas')
            .where('tipo_saida', '==', 'emprestimo')
            .where('status', '==', 'emprestado')
            .get();
        
        const usuariosSnapshot = await db.collection('telegram_users').get();
        
        bot.sendMessage(chatId, 
            `📊 *Status do Sistema*\n\n` +
            `✅ Bot: Online\n` +
            `📦 Empréstimos ativos: ${emprestimosSnapshot.size}\n` +
            `👥 Usuários registrados: ${usuariosSnapshot.size}\n\n` +
            `🔄 Última atualização: ${new Date().toLocaleString('pt-BR')}\n\n` +
            `_Sistema STIC 7ª RPM_`,
            { parse_mode: 'Markdown' }
        );
        
    } catch (error) {
        bot.sendMessage(chatId, '❌ Erro ao buscar status.');
    }
});

// /meusemprestimos
bot.onText(/\/meusemprestimos/, async (msg) => {
    const chatId = msg.chat.id;
    
    try {
        // Buscar número PM do usuário
        const userSnapshot = await db.collection('telegram_users')
            .where('chat_id', '==', chatId)
            .limit(1)
            .get();
        
        if (userSnapshot.empty) {
            bot.sendMessage(chatId, 
                '❌ Você ainda não está registrado!\n\n' +
                'Use: `/registro SEU_NUMERO_PM`',
                { parse_mode: 'Markdown' }
            );
            return;
        }
        
        const userData = userSnapshot.docs[0].data();
        const numeroPM = userData.numero_pm;
        
        // Buscar empréstimos
        const emprestimosSnapshot = await db.collection('saidas')
            .where('numero_recebedor', '==', numeroPM)
            .where('status', '==', 'emprestado')
            .get();
        
        if (emprestimosSnapshot.empty) {
            bot.sendMessage(chatId, 
                '✅ *Sem empréstimos ativos*\n\n' +
                'Você não possui materiais emprestados no momento.',
                { parse_mode: 'Markdown' }
            );
            return;
        }
        
        let mensagem = `📦 *Seus Empréstimos Ativos*\n\n`;
        
        emprestimosSnapshot.forEach((doc) => {
            const emp = doc.data();
            const quantidade = emp.quantidade_itens || 1;
            
            mensagem += `━━━━━━━━━━━━━━━━\n`;
            mensagem += `📅 *Data:* ${emp.data_saida}\n`;
            mensagem += `📦 *Itens:* ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}\n`;
            mensagem += `⏰ *Prazo:* ${emp.prazo_retorno}\n`;
            mensagem += `📋 *Finalidade:* ${emp.finalidade_emprestimo}\n`;
        });
        
        mensagem += `━━━━━━━━━━━━━━━━\n\n`;
        mensagem += `_Sistema STIC 7ª RPM_`;
        
        bot.sendMessage(chatId, mensagem, { parse_mode: 'Markdown' });
        
    } catch (error) {
        console.error('Erro:', error);
        bot.sendMessage(chatId, '❌ Erro ao buscar empréstimos.');
    }
});

// /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId, 
        `📖 *Ajuda - STIC Bot*\n\n` +
        `*Como usar:*\n\n` +
        `1️⃣ Registre-se:\n` +
        `/registro SEU_NUMERO_PM\n` +
        `Exemplo: \`/registro 163396-5\`\n\n` +
        `2️⃣ Receba notificações:\n` +
        `Quando houver empréstimo para você, receberá mensagem automática\n\n` +
        `3️⃣ Assine digitalmente:\n` +
        `Clique no link recebido, assine com o dedo/mouse\n\n` +
        `4️⃣ Baixe o comprovante:\n` +
        `Após assinar, baixe o PDF\n\n` +
        `*Outros comandos:*\n` +
        `/status - Ver status do sistema\n` +
        `/meusemprestimos - Ver seus empréstimos\n\n` +
        `*Dúvidas?*\n` +
        `Entre em contato com a STIC 7ª RPM\n\n` +
        `_Sistema desenvolvido pela STIC_`,
        { parse_mode: 'Markdown' }
    );
});

// ==================
// MONITORAR NOVOS EMPRÉSTIMOS
// ==================

console.log('👀 Monitorando novos empréstimos...\n');

db.collection('saidas')
    .where('tipo_saida', '==', 'emprestimo')
    .onSnapshot(async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'added') {
                const emprestimoId = change.doc.id;
                const emp = change.doc.data();
                
                console.log(`📦 Novo empréstimo detectado: ${emprestimoId}`);
                
                // Buscar usuário no Telegram
                const userDoc = await db.collection('telegram_users')
                    .doc(emp.numero_recebedor)
                    .get();
                
                if (!userDoc.exists) {
                    console.log(`⚠️  Usuário ${emp.numero_recebedor} não registrado no Telegram`);
                    return;
                }
                
                const chatId = userDoc.data().chat_id;
                
                // Formatar itens
                let itensTexto = '';
                if (emp.itens && emp.itens.length > 0) {
                    emp.itens.forEach((item, index) => {
                        const tipo = item.tipo === 'hd' ? 'HD/SSD' :
                                   item.tipo === 'radio' ? 'Rádio Móvel' :
                                   item.tipo === 'ht' ? 'HT' : item.tipo;
                        itensTexto += `${index + 1}. ${tipo} - Pat: ${item.patrimonio}\n`;
                    });
                } else {
                    const tipo = emp.tipo_material === 'hd' ? 'HD/SSD' :
                               emp.tipo_material === 'radio' ? 'Rádio Móvel' : emp.tipo_material;
                    itensTexto = `1. ${tipo} - Pat: ${emp.patrimonio}\n`;
                }
                
                // Link de assinatura
                const linkAssinatura = `${process.env.BASE_URL}/assinatura.html?id=${emprestimoId}`;
                
                // Mensagem Telegram
                const mensagemTelegram = 
                    `🔔 *NOVO EMPRÉSTIMO*\n\n` +
                    `Olá *${emp.militar_recebedor}*!\n\n` +
                    `📦 *Materiais emprestados:*\n` +
                    itensTexto + `\n` +
                    `📅 *Data:* ${emp.data_saida} às ${emp.hora_saida}\n` +
                    `⏰ *Prazo de devolução:* ${emp.prazo_retorno} às ${emp.hora_retorno}\n` +
                    `📋 *Finalidade:* ${emp.finalidade_emprestimo}\n\n` +
                    `✍️ *ASSINE DIGITALMENTE:*\n` +
                    `Clique no botão abaixo ⬇️`;
                
                // Enviar com botão
                bot.sendMessage(chatId, mensagemTelegram, {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [[
                            { 
                                text: '✍️ Assinar Digitalmente', 
                                url: linkAssinatura 
                            }
                        ]]
                    }
                });
                
                console.log(`✅ Notificação enviada para ${emp.militar_recebedor}`);
            }
        });
    });

// ==================
// MONITORAR DEVOLUÇÕES
// ==================

db.collection('saidas')
    .where('tipo_saida', '==', 'emprestimo')
    .where('status', '==', 'devolvido')
    .onSnapshot(async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === 'modified') {
                const emp = change.doc.data();
                
                // Verificar se acabou de ser devolvido
                if (emp.data_devolucao) {
                    console.log(`📥 Devolução detectada: ${change.doc.id}`);
                    
                    const userDoc = await db.collection('telegram_users')
                        .doc(emp.numero_recebedor)
                        .get();
                    
                    if (userDoc.exists) {
                        const chatId = userDoc.data().chat_id;
                        
                        const mensagem = 
                            `✅ *DEVOLUÇÃO CONFIRMADA*\n\n` +
                            `Olá *${emp.militar_recebedor}*!\n\n` +
                            `📥 Sua devolução foi registrada:\n\n` +
                            `📅 *Devolvido em:* ${emp.data_devolucao} às ${emp.hora_devolucao}\n` +
                            `⏱️ *Dias emprestado:* ${emp.dias_emprestado} dias\n` +
                            `✅ *Estado:* ${emp.estado_devolucao}\n\n` +
                            `Obrigado pela devolução!\n\n` +
                            `_STIC 7ª RPM_`;
                        
                        bot.sendMessage(chatId, mensagem, { parse_mode: 'Markdown' });
                        
                        console.log(`✅ Confirmação de devolução enviada`);
                    }
                }
            }
        });
    });

// Erro handler
bot.on('polling_error', (error) => {
    console.error('⚠️  Erro de polling:', error.message);
});

// Processo
process.on('SIGINT', () => {
    console.log('\n👋 Bot encerrado');
    process.exit(0);
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🤖 Bot ativo e funcionando!');
console.log('📱 Envie /start no Telegram');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
ENDOFJS

# Criar README
cat > README.md << 'EOF'
# 🤖 Bot Telegram STIC 7ª RPM

Bot oficial para notificações automáticas de empréstimos.

## 📋 Pré-requisitos

- Node.js 18+
- Conta Telegram
- Firebase Admin SDK

## 🚀 Instalação

```bash
npm install
```

## ⚙️ Configuração

1. Edite o arquivo `.env`
2. Cole suas credenciais do Firebase
3. Salve

## ▶️ Executar

```bash
npm start
```

## 📱 Usar

1. Abra: t.me/Stic7rpmbot
2. Envie: `/start`
3. Registre: `/registro SEU_NUMERO_PM`
4. Pronto!

## 🔄 Manter 24/7

```bash
npm install -g pm2
pm2 start bot.js --name stic-bot
pm2 save
```

## 📖 Comandos

- `/start` - Iniciar
- `/registro 123456-7` - Registrar
- `/status` - Ver status
- `/meusemprestimos` - Ver empréstimos
- `/help` - Ajuda

## 📞 Suporte

STIC 7ª RPM - Divinópolis/MG
EOF

echo ""
echo "✅ Setup completo criado!"
echo ""
echo "📁 Pasta: stic-telegram-bot/"
echo ""
echo "🔧 Próximos passos:"
echo "1. cd stic-telegram-bot"
echo "2. npm install"
echo "3. Edite .env com credenciais Firebase"
echo "4. npm start"
echo ""
echo "📱 Bot: @Stic7rpmbot"
echo "🔐 Token: 8222354261:AAFEbbvm9DyZhDWF2muMqzOTzk3KQyFVZP8"
echo ""
