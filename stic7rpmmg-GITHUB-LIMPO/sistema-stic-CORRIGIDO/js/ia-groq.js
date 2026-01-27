// Sistema de Análise IA com Groq - STIC PMMG

// ⚠️ CONFIGURE SUA CHAVE API AQUI:
const GROQ_API_KEY = 'INSIRA_SUA_CHAVE_GROQ_AQUI';
// Obtenha sua chave em: https://console.groq.com

// Endpoint da API Groq
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Analisar patrimônio com IA
async function analisarPatrimonioIA(patrimonio) {
    try {
        if (!GROQ_API_KEY || GROQ_API_KEY === 'INSIRA_SUA_CHAVE_GROQ_AQUI') {
            throw new Error('Chave API do Groq não configurada! Configure em js/ia-groq.js');
        }
        
        mostrarLoading('🤖 Analisando com IA...');
        
        // Buscar histórico de OS deste patrimônio
        const historico = await buscarHistoricoPatrimonio(patrimonio);
        
        if (historico.length === 0) {
            ocultarLoading();
            alert('📋 Este patrimônio ainda não possui histórico de OS para análise.');
            return null;
        }
        
        // Preparar prompt para IA
        const prompt = criarPromptAnalise(patrimonio, historico);
        
        // Chamar API Groq
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-70b-versatile', // Modelo rápido e grátis
                messages: [
                    {
                        role: 'system',
                        content: 'Você é um assistente especializado em análise de equipamentos e manutenção preventiva. Responda APENAS em JSON válido, sem texto adicional.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        const respostaIA = data.choices[0].message.content;
        
        // Parsear resposta JSON
        let analise;
        try {
            analise = JSON.parse(respostaIA);
        } catch (e) {
            console.error('Erro ao parsear JSON:', respostaIA);
            // Tentar extrair JSON da resposta
            const jsonMatch = respostaIA.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analise = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('IA não retornou JSON válido');
            }
        }
        
        // Salvar análise no Firestore
        await salvarAnaliseIA(patrimonio, analise, historico);
        
        // Registrar log
        await logAnaliseIA(patrimonio, analise);
        
        ocultarLoading();
        
        // Mostrar resultado
        mostrarResultadoAnalise(patrimonio, analise, historico);
        
        return analise;
        
    } catch (error) {
        ocultarLoading();
        console.error('❌ Erro na análise IA:', error);
        mostrarErro('Erro na análise: ' + error.message);
        return null;
    }
}

// Buscar histórico de OS de um patrimônio
async function buscarHistoricoPatrimonio(patrimonio) {
    try {
        const snapshot = await ordensServicoRef
            .where('patrimonio', '==', patrimonio)
            .orderBy('data_abertura', 'desc')
            .get();
        
        const historico = [];
        
        snapshot.forEach(doc => {
            const os = doc.data();
            historico.push({
                numero: os.numero,
                data_abertura: os.data_abertura ? (os.data_abertura.toDate ? os.data_abertura.toDate() : new Date(os.data_abertura)) : null,
                defeito: os.defeito,
                solucao: os.solucao || os.observacoes,
                status: os.status,
                tempo_resolucao: calcularTempoResolucao(os),
                tipo_equipamento: os.tipo_equipamento,
                marca: os.marca,
                modelo: os.modelo
            });
        });
        
        return historico;
        
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        return [];
    }
}

// Calcular tempo de resolução
function calcularTempoResolucao(os) {
    if (os.status !== 'finalizada' || !os.data_abertura || !os.data_finalizacao) {
        return null;
    }
    
    const dataAbertura = os.data_abertura.toDate ? os.data_abertura.toDate() : new Date(os.data_abertura);
    const dataFinal = os.data_finalizacao.toDate ? os.data_finalizacao.toDate() : new Date(os.data_finalizacao);
    
    return Math.round((dataFinal - dataAbertura) / (1000 * 60 * 60 * 24)); // dias
}

// Criar prompt para análise
function criarPromptAnalise(patrimonio, historico) {
    const historicoTexto = historico.map((os, index) => `
OS ${index + 1}:
- Data: ${os.data_abertura ? os.data_abertura.toLocaleDateString('pt-BR') : 'N/A'}
- Defeito: ${os.defeito || 'Não especificado'}
- Solução: ${os.solucao || 'Não especificada'}
- Status: ${os.status}
- Tempo de Resolução: ${os.tempo_resolucao ? os.tempo_resolucao + ' dias' : 'Em aberto'}
    `).join('\n');
    
    return `
Analise este equipamento e seu histórico de manutenção:

PATRIMÔNIO: ${patrimonio}
TIPO: ${historico[0]?.tipo_equipamento || 'N/A'}
MARCA/MODELO: ${historico[0]?.marca || ''} ${historico[0]?.modelo || ''}

HISTÓRICO DE OS (${historico.length} registros):
${historicoTexto}

Com base nesse histórico, responda em JSON com o seguinte formato EXATO:
{
  "problema_recorrente": true ou false,
  "descricao_problema": "descrição do problema principal",
  "frequencia": "quantas vezes o problema ocorreu",
  "causa_provavel": "causa mais provável baseada no histórico",
  "tempo_estimado_proximo": "estimativa de dias para próximo reparo",
  "sugestoes": ["sugestão 1", "sugestão 2", "sugestão 3"],
  "alertas": ["alerta 1", "alerta 2"],
  "deve_substituir": true ou false,
  "justificativa_substituicao": "motivo se deve substituir",
  "nivel_criticidade": "baixo, médio ou alto",
  "custo_beneficio": "análise de custo x benefício de manter ou substituir"
}

Responda APENAS com o JSON, sem texto adicional.
`;
}

// Salvar análise no Firestore
async function salvarAnaliseIA(patrimonio, analise, historico) {
    try {
        const analiseDoc = {
            patrimonio,
            total_analises: firebase.firestore.FieldValue.increment(1),
            ultima_analise: new Date().toISOString(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            total_os: historico.length,
            analise_atual: analise,
            historico_problemas: historico.map(os => ({
                defeito: os.defeito,
                data: os.data_abertura ? os.data_abertura.toISOString() : null,
                solucao: os.solucao
            }))
        };
        
        await db.collection('analises_ia').doc(patrimonio).set(analiseDoc, { merge: true });
        
        console.log('✅ Análise IA salva no Firestore');
        
    } catch (error) {
        console.error('Erro ao salvar análise:', error);
    }
}

// Mostrar resultado da análise
function mostrarResultadoAnalise(patrimonio, analise, historico) {
    // Criar modal ou seção para mostrar resultado
    const resultadoHTML = `
        <div style="background: white; padding: 2rem; border-radius: 10px; margin-top: 2rem;">
            <h2 style="color: #003366; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
                🤖 Análise Inteligente - Patrimônio ${patrimonio}
            </h2>
            
            <!-- Criticidade -->
            <div style="background: ${
                analise.nivel_criticidade === 'alto' ? '#f8d7da' : 
                analise.nivel_criticidade === 'medio' ? '#fff3cd' : '#d4edda'
            }; padding: 1rem; border-radius: 5px; margin-bottom: 1.5rem; border-left: 4px solid ${
                analise.nivel_criticidade === 'alto' ? '#dc3545' : 
                analise.nivel_criticidade === 'medio' ? '#ffc107' : '#28a745'
            };">
                <strong>Nível de Criticidade: ${
                    analise.nivel_criticidade === 'alto' ? '🔴 ALTO' :
                    analise.nivel_criticidade === 'medio' ? '🟡 MÉDIO' : '🟢 BAIXO'
                }</strong>
            </div>
            
            <!-- Estatísticas -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 5px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: bold; color: #003366;">${historico.length}</div>
                    <div style="color: #666; font-size: 0.9rem;">Total de OS</div>
                </div>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 5px; text-align: center;">
                    <div style="font-size: 2rem; font-weight: bold; color: ${analise.problema_recorrente ? '#dc3545' : '#28a745'};">
                        ${analise.problema_recorrente ? 'SIM' : 'NÃO'}
                    </div>
                    <div style="color: #666; font-size: 0.9rem;">Problema Recorrente</div>
                </div>
            </div>
            
            <!-- Problema Identificado -->
            ${analise.problema_recorrente ? `
                <div style="background: #fff3cd; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #ffc107;">
                    <h4 style="margin-bottom: 0.5rem;">⚠️ Problema Recorrente Detectado</h4>
                    <p style="margin-bottom: 0.5rem;"><strong>Descrição:</strong> ${analise.descricao_problema}</p>
                    <p style="margin-bottom: 0.5rem;"><strong>Frequência:</strong> ${analise.frequencia}</p>
                    <p><strong>Causa Provável:</strong> ${analise.causa_provavel}</p>
                </div>
            ` : ''}
            
            <!-- Sugestões -->
            <div style="margin-bottom: 1.5rem;">
                <h4 style="margin-bottom: 1rem; color: #003366;">💡 Sugestões:</h4>
                <ul style="padding-left: 1.5rem;">
                    ${analise.sugestoes.map(sug => `<li style="margin-bottom: 0.5rem;">${sug}</li>`).join('')}
                </ul>
            </div>
            
            <!-- Alertas -->
            ${analise.alertas.length > 0 ? `
                <div style="background: #f8d7da; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #dc3545;">
                    <h4 style="margin-bottom: 1rem; color: #721c24;">⚠️ Alertas:</h4>
                    <ul style="padding-left: 1.5rem; margin: 0;">
                        ${analise.alertas.map(alerta => `<li style="margin-bottom: 0.5rem; color: #721c24;">${alerta}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <!-- Substituição -->
            ${analise.deve_substituir ? `
                <div style="background: #f8d7da; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border-left: 4px solid #dc3545;">
                    <h4 style="margin-bottom: 0.5rem; color: #721c24;">🔴 Recomendação: SUBSTITUIR EQUIPAMENTO</h4>
                    <p style="color: #721c24; margin: 0;"><strong>Justificativa:</strong> ${analise.justificativa_substituicao}</p>
                </div>
            ` : ''}
            
            <!-- Custo-Benefício -->
            <div style="background: #e3f2fd; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #2196f3;">
                <h4 style="margin-bottom: 0.5rem; color: #0d47a1;">📊 Análise Custo-Benefício:</h4>
                <p style="color: #0d47a1; margin: 0;">${analise.custo_beneficio}</p>
            </div>
            
            <!-- Tempo Estimado -->
            <div style="margin-top: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 5px; text-align: center;">
                <strong>⏱️ Tempo Estimado Próximo Reparo:</strong> ${analise.tempo_estimado_proximo}
            </div>
        </div>
    `;
    
    // Inserir na página (adaptar conforme necessário)
    const container = document.getElementById('resultadoAnaliseIA');
    if (container) {
        container.innerHTML = resultadoHTML;
    } else {
        // Criar modal temporário
        const modal = document.createElement('div');
        modal.innerHTML = resultadoHTML;
        modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); max-width: 800px; max-height: 90vh; overflow-y: auto; z-index: 10000; box-shadow: 0 10px 40px rgba(0,0,0,0.3);';
        
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999;';
        overlay.onclick = () => {
            document.body.removeChild(modal);
            document.body.removeChild(overlay);
        };
        
        document.body.appendChild(overlay);
        document.body.appendChild(modal);
    }
}

console.log('✅ Sistema de IA Groq carregado!');
console.log('⚠️ Não esqueça de configurar sua chave API em js/ia-groq.js');
