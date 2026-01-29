// Assinatura Digital - Saída de Material
// Variáveis globais
let canvas, ctx;

// Aguardar DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    inicializarAssinatura();
    carregarSaida();
});

function inicializarAssinatura() {
    canvas = document.getElementById('signaturePad');
    if (!canvas) {
        console.error('❌ Canvas não encontrado!');
        return;
    }
    
    ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Mouse events
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        lastX = e.offsetX;
        lastY = e.offsetY;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        lastX = e.offsetX;
        lastY = e.offsetY;
    });

    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });

    canvas.addEventListener('mouseout', () => {
        isDrawing = false;
    });

    // Touch events
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        isDrawing = true;
        lastX = touch.clientX - rect.left;
        lastY = touch.clientY - rect.top;
    });

    canvas.addEventListener('touchmove', (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        lastX = x;
        lastY = y;
    });

    canvas.addEventListener('touchend', () => {
        isDrawing = false;
    });
}

function limpar() {
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

// Pegar ID da URL
const urlParams = new URLSearchParams(window.location.search);
const saidaId = urlParams.get('id');

async function carregarSaida() {
    if (!saidaId) {
        document.getElementById('dadosSaida').innerHTML = 
            '<p style="color: red;">❌ ID inválido</p>';
        return;
    }
    
    try {
        console.log('Carregando saída:', saidaId);
        
        const doc = await db.collection('saidas_material').doc(saidaId).get();
        
        if (!doc.exists) {
            document.getElementById('dadosSaida').innerHTML = 
                '<p style="color: red;">❌ Saída não encontrada</p>';
            return;
        }
        
        const saida = doc.data();
        console.log('Dados carregados:', saida);
        
        const html = `
            <div class="info-item"><strong>Tipo:</strong> ${saida.tipo_saida === 'emprestimo' ? 'Empréstimo' : 'Saída Definitiva'}</div>
            <div class="info-item"><strong>Recebedor:</strong> ${saida.recebedor?.nome || 'N/A'}</div>
            <div class="info-item"><strong>Patrimônio:</strong> ${saida.patrimonio || 'N/A'}</div>
            <div class="info-item"><strong>Data:</strong> ${saida.data_saida || 'N/A'}</div>
            <div class="info-item"><strong>Motivo:</strong> ${saida.motivo || 'N/A'}</div>
        `;
        
        document.getElementById('dadosSaida').innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar:', error);
        document.getElementById('dadosSaida').innerHTML = 
            '<p style="color: red;">❌ Erro ao carregar dados</p>';
    }
}

async function salvarAssinatura() {
    // Verificar se assinou
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let hasDrawing = false;
    
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] !== 0) {
            hasDrawing = true;
            break;
        }
    }
    
    if (!hasDrawing) {
        alert('❌ Por favor, assine antes de confirmar!');
        return;
    }
    
    if (!confirm('Confirma a assinatura?')) {
        return;
    }
    
    try {
        // Converter canvas para Base64
        const assinaturaBase64 = canvas.toDataURL('image/png');
        
        // Obter IP
        const ip = await obterIP();

        // Salvar no Firestore
        await db.collection('saidas_material').doc(saidaId).update({
            assinado: true,
            data_assinatura: new Date().toISOString(),
            assinatura_base64: assinaturaBase64,
            ip_assinatura: ip
        });

        console.log('✅ Assinatura salva com sucesso!');

        // Mostrar sucesso
        document.getElementById('successMessage').style.display = 'block';
        document.querySelector('.buttons').style.display = 'none';
        canvas.style.border = '2px solid #28a745';

        // Adicionar botões de ação
        const actionsDiv = document.createElement('div');
        actionsDiv.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem';
        actionsDiv.innerHTML = '<button onclick="baixarPDF()" class="btn btn-primary">📄 Baixar PDF</button>';
        actionsDiv.innerHTML += '<button onclick="fecharPagina()" class="btn btn-secondary">✅ Fechar</button>';
        document.getElementById('successMessage').after(actionsDiv);

    } catch (error) {
        console.error('Erro:', error);
        alert('❌ Erro ao salvar assinatura: ' + error.message);
    }
}

async function obterIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        return 'Não disponível';
    }
}

function fecharPagina() {
    window.close();
    // Se não fechar (bloqueio), redirecionar
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 500);
}

async function baixarPDF() {
    try {
        const doc = await db.collection('saidas_material').doc(saidaId).get();
        const saida = doc.data();
        
        const pw = window.open('', '_blank');
        
        let html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Termo de Saída</title>';
        html += '<style>';
        html += '@page{size:A4;margin:15mm}';
        html += 'body{font-family:Arial;font-size:11px;line-height:1.3;padding:10px;margin:0}';
        html += 'h1{text-align:center;color:#003366;font-size:18px;margin:5px 0}';
        html += 'h2{text-align:center;font-size:14px;margin:5px 0;color:#555}';
        html += 'p{margin:4px 0;font-size:11px}';
        html += '.assinatura{margin-top:10px;text-align:center}';
        html += '.assinatura img{max-width:300px;max-height:100px;border:1px solid #ddd}';
        html += '.info-box{background:#f8f9fa;padding:8px;border-radius:5px;margin:8px 0}';
        html += '</style></head><body>';
        html += '<h1>PMMG - STIC</h1><h2>TERMO DE SAÍDA DE MATERIAL</h2>';
        html += '<div class="info-box">';
        html += '<p><strong>Tipo:</strong> ' + (saida.tipo_saida === 'emprestimo' ? 'Empréstimo' : 'Saída Definitiva') + '</p>';
        html += '<p><strong>Recebedor:</strong> ' + (saida.recebedor?.nome || 'N/A') + '</p>';
        html += '<p><strong>Patrimônio:</strong> ' + (saida.patrimonio || 'N/A') + '</p>';
        html += '<p><strong>Data:</strong> ' + (saida.data_saida || 'N/A') + ' às ' + (saida.hora_saida || 'N/A') + '</p>';
        html += '<p><strong>Motivo:</strong> ' + (saida.motivo || 'N/A') + '</p>';
        html += '</div>';
        html += '<div class="assinatura"><h3>Assinatura Digital:</h3>';
        
        if (saida.assinatura_base64) {
            html += '<img src="' + saida.assinatura_base64 + '">';
        } else {
            html += '<p>Assinatura não disponível</p>';
        }
        
        html += '<p style="font-size:9px;margin:3px 0"><strong>Assinado em:</strong> ' + new Date(saida.data_assinatura).toLocaleString('pt-BR') + ' | <strong>IP:</strong> ' + saida.ip_assinatura + '</p></div>';
        html += '<script>window.onload=function(){window.print()}</script></body></html>';

        pw.document.write(html);
        pw.document.close();

    } catch (error) {
        console.error('Erro:', error);
        alert('❌ Erro ao gerar PDF: ' + error.message);
    }
}
