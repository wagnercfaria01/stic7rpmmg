/**
 * GROQ API CONFIGURATION
 * Sistema de geração de relatórios com IA
 */

const GroqConfig = {
    apiKey: null,
    apiUrl: '/.netlify/functions/groq',
    
    // Melhor modelo disponível
    model: 'llama-3.3-70b-versatile', // ✅ Modelo atualizado (Jan 2026) - Gratuito
    // Alternativas:
    // 'llama-3.1-405b-reasoning' - Melhor qualidade, mais lento
    // 'mixtral-8x7b-32768' - Ótimo para contextos longos
    
    // Configurações
    temperature: 0.7, // Criatividade moderada
    maxTokens: 2000, // Resposta longa
    
    // Prompt base para relatórios
    systemPrompt: `Você é um assistente especializado em criar relatórios técnicos profissionais para a Polícia Militar de Minas Gerais.

Seu objetivo é analisar dados de ordens de serviço (OS) do setor STIC (Seção de Tecnologia da Informação) e gerar:

1. RESUMO EXECUTIVO: Texto conciso e profissional descrevendo as atividades do período, destacando principais realizações e estatísticas relevantes.

2. ANÁLISE DE DESEMPENHO: Avaliar tempo de atendimento, taxa de conclusão, tipos de serviço mais frequentes.

3. DESTAQUES: Mencionar serviços mais complexos, desafios superados, melhorias implementadas.

4. RECOMENDAÇÕES: Sugestões baseadas nos dados para otimização do trabalho.

ESTILO:
- Linguagem formal e técnica
- Tom profissional e objetivo
- Uso de dados estatísticos
- Parágrafos bem estruturados
- Vocabulário apropriado para relatório institucional

FORMATO:
- Textos com 2-4 parágrafos
- Frases claras e diretas
- Uso de conectivos adequados
- Conclusões baseadas em dados`
};

/**
 * Gerar resumo executivo com IA
 */
async function gerarResumoIA(dadosOS, periodo) {
    try {
        console.log('🤖 Gerando resumo com IA Groq...');
        
        // Preparar dados estatísticos
        const stats = calcularEstatisticas(dadosOS);
        
        // Criar prompt com os dados
        const prompt = criarPromptRelatorio(stats, periodo, dadosOS);
        
        // Chamar API Groq
        const response = await fetch(GroqConfig.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GroqConfig.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: GroqConfig.model,
                messages: [
                    { role: 'system', content: GroqConfig.systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: GroqConfig.temperature,
                max_tokens: GroqConfig.maxTokens
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Erro da API:', errorData);
            throw new Error(errorData.error || `Erro na API: ${response.status}`);
        }
        
        const data = await response.json();
        
        // ✅ VALIDAR se a resposta tem o formato esperado
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            console.error('❌ Resposta inválida da IA:', data);
            throw new Error('Resposta da IA não está no formato esperado. Verifique os logs da Netlify Function.');
        }
        
        const textoIA = data.choices[0].message.content;
        
        console.log('✅ Resumo gerado com sucesso!');
        console.log(`📊 Tokens usados: ${data.usage?.total_tokens || 'N/A'}`);
        
        return {
            resumo: textoIA,
            stats: stats,
            modelo: GroqConfig.model,
            tokens: data.usage.total_tokens
        };
        
    } catch (error) {
        console.error('❌ Erro ao gerar resumo:', error);
        throw error;
    }
}

/**
 * Calcular estatísticas das OS
 */
function calcularEstatisticas(dadosOS) {
    const total = dadosOS.length;
    
    // Status (case-insensitive e variações)
    const finalizadas = dadosOS.filter(os => {
        const status = (os.status || '').toLowerCase().trim();
        return status === 'finalizada' || status === 'finalizado' || 
               status === 'concluída' || status === 'concluído' ||
               status === 'fechada' || status === 'fechado';
    }).length;
    
    const emAndamento = dadosOS.filter(os => {
        const status = (os.status || '').toLowerCase().trim();
        return status === 'em manutenção' || status === 'em andamento' || 
               status === 'em execução' || status === 'aguardando peça';
    }).length;
    
    const abertas = dadosOS.filter(os => {
        const status = (os.status || '').toLowerCase().trim();
        return status === 'aberta' || status === 'novo' || status === 'pendente';
    }).length;
    
    // Tipos de serviço
    const tiposServico = {};
    dadosOS.forEach(os => {
        const tipo = os.tipo_servico || os.tipo_equipamento || 'Outros';
        tiposServico[tipo] = (tiposServico[tipo] || 0) + 1;
    });
    
    // Tempo médio de atendimento
    let tempoTotal = 0;
    let countComTempo = 0;
    
    dadosOS.forEach(os => {
        if (os.data_abertura && os.data_finalizacao) {
            const inicio = new Date(os.data_abertura);
            const fim = new Date(os.data_finalizacao);
            const diffDias = (fim - inicio) / (1000 * 60 * 60 * 24);
            tempoTotal += diffDias;
            countComTempo++;
        }
    });
    
    const tempoMedio = countComTempo > 0 ? tempoTotal / countComTempo : 0;
    
    // Equipamentos mais atendidos
    const equipamentos = {};
    dadosOS.forEach(os => {
        const equip = os.tipo_equipamento || 'Não especificado';
        equipamentos[equip] = (equipamentos[equip] || 0) + 1;
    });
    
    const top5Equipamentos = Object.entries(equipamentos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    return {
        total,
        finalizadas,
        emAndamento,
        abertas,
        taxaConclusao: total > 0 ? ((finalizadas / total) * 100).toFixed(1) : 0,
        tempoMedio: tempoMedio.toFixed(1),
        tiposServico,
        top5Equipamentos,
        percentualFinalizadas: total > 0 ? ((finalizadas / total) * 100).toFixed(0) : 0
    };
}

/**
 * Criar prompt para a IA
 */
function criarPromptRelatorio(stats, periodo, dadosOS) {
    // Extrair descrições das OS para contexto
    const resumoOS = dadosOS.slice(0, 10).map(os => {
        const desc = (os.defeito || os.descricao_servico || os.observacoes || '').substring(0, 150);
        const tipo = os.tipo_servico || os.tipo_equipamento || 'Serviço';
        const status = os.status || 'Em andamento';
        return `• ${tipo}: ${desc} [${status}]`;
    }).join('\n');
    
    return `Crie um RESUMO EXECUTIVO técnico e CONCISO (máximo 200 palavras) para um relatório da STIC - 7ª RPM/PMMG.

PERÍODO: ${periodo.texto}

INDICADORES:
- Total: ${stats.total} OS | Finalizadas: ${stats.finalizadas} (${stats.percentualFinalizadas}%) | Em andamento: ${stats.emAndamento}
- Tempo médio: ${stats.tempoMedio} dias | Taxa de conclusão: ${stats.taxaConclusao}%

PRINCIPAIS SERVIÇOS:
${Object.entries(stats.tiposServico).map(([tipo, qtd]) => `- ${tipo}: ${qtd} OS`).join('\n')}

EXEMPLOS DE ATENDIMENTOS:
${resumoOS}

INSTRUÇÕES:
1. Seja OBJETIVO e TÉCNICO - use termos como "execução", "implementação", "configuração", "manutenção"
2. Foque em AÇÕES CONCRETAS - o que foi feito, não genéricos
3. Use PARÁGRAFOS CURTOS (2-3 parágrafos no máximo)
4. Mostre PROATIVIDADE e RESULTADOS
5. Linguagem FORMAL mas DIRETA - sem rodeios

Formato: Parágrafo 1 (visão geral + principais ações), Parágrafo 2 (resultados numéricos), Parágrafo 3 (conclusão técnica).`;
}

/**
 * Gerar análise de tendências
 */
async function gerarAnaliseTendencias(dadosComparativos) {
    try {
        const prompt = `Analise as tendências dos últimos períodos e forneça insights:
        
DADOS:
${JSON.stringify(dadosComparativos, null, 2)}

Forneça:
1. Tendência geral (aumento/diminuição de demanda)
2. Padrões identificados
3. Recomendações para gestão`;
        
        const response = await fetch(GroqConfig.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GroqConfig.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: GroqConfig.model,
                messages: [
                    { role: 'system', content: GroqConfig.systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });
        
        const data = await response.json();
        return data.choices[0].message.content;
        
    } catch (error) {
        console.error('❌ Erro na análise:', error);
        return 'Análise não disponível no momento.';
    }
}

console.log('✅ Groq API configurada!');
console.log('🤖 Modelo:', GroqConfig.model);
console.log('🎯 Pronto para gerar relatórios!');
