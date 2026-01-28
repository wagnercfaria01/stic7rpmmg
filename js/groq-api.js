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
        
        // ========== NOVO: BUSCAR PERÍODO ANTERIOR E CALCULAR TENDÊNCIAS ==========
        const statsPeriodoAnterior = buscarPeriodoAnterior(periodo.texto);
        const tendencias = calcularTendencias(stats, statsPeriodoAnterior);
        
        console.log('📈 Tendências:', tendencias ? 'Calculadas' : 'Primeiro período');
        
        // Adicionar tendências ao stats
        stats.tendencias = tendencias;
        
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
        
        // Tentar parsear JSON se a IA retornou estruturado
        let resumoFinal = textoIA;
        let insights = [];
        
        try {
            // Verificar se tem JSON no texto
            const jsonMatch = textoIA.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                resumoFinal = parsed.resumo || textoIA;
                insights = parsed.insights || [];
            }
        } catch (e) {
            // Se não conseguir parsear, usa o texto direto
            console.log('ℹ️ Resposta em texto puro (não JSON)');
        }
        
        console.log('✅ Resumo gerado com sucesso!');
        console.log(`📊 Tokens usados: ${data.usage?.total_tokens || 'N/A'}`);
        
        // ========== NOVO: SALVAR HISTÓRICO PARA PRÓXIMO RELATÓRIO ==========
        salvarHistorico(stats, periodo);
        
        return {
            resumo: resumoFinal,
            insights: insights,
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
    
    // ========== NOVO: SLA (Service Level Agreement) ==========
    const metaSLA = 3; // 3 dias é a meta
    let dentroSLA = 0;
    let foraSLA = 0;
    const osFora = [];
    
    // Tempo médio de atendimento
    let tempoTotal = 0;
    let countComTempo = 0;
    const temposDetalhados = [];
    
    dadosOS.forEach(os => {
        if (os.data_abertura && os.data_finalizacao) {
            const inicio = new Date(os.data_abertura.toDate ? os.data_abertura.toDate() : os.data_abertura);
            const fim = new Date(os.data_finalizacao.toDate ? os.data_finalizacao.toDate() : os.data_finalizacao);
            const diffDias = (fim - inicio) / (1000 * 60 * 60 * 24);
            tempoTotal += diffDias;
            countComTempo++;
            temposDetalhados.push({ os: os.numero || os.id, tempo: diffDias });
            
            // Verificar SLA
            if (diffDias <= metaSLA) {
                dentroSLA++;
            } else {
                foraSLA++;
                osFora.push({
                    numero: os.numero || os.id.substr(0, 6).toUpperCase(),
                    tipo: os.tipo_servico || os.tipo_equipamento || 'N/A',
                    tempo: diffDias.toFixed(1),
                    motivo: os.observacoes || 'Não especificado'
                });
            }
        }
    });
    
    const tempoMedio = countComTempo > 0 ? tempoTotal / countComTempo : 0;
    const percentualSLA = countComTempo > 0 ? ((dentroSLA / countComTempo) * 100).toFixed(1) : 0;
    
    // ========== NOVO: ANÁLISE POR UNIDADE ==========
    const porUnidade = {};
    dadosOS.forEach(os => {
        const unidade = os.unidade || os.batalhao || os.solicitante?.unidade || 'Não especificada';
        if (!porUnidade[unidade]) {
            porUnidade[unidade] = { total: 0, finalizadas: 0, tipos: {} };
        }
        porUnidade[unidade].total++;
        
        const status = (os.status || '').toLowerCase().trim();
        if (status.includes('final') || status.includes('conclu') || status.includes('fecha')) {
            porUnidade[unidade].finalizadas++;
        }
        
        const tipo = os.tipo_servico || os.tipo_equipamento || 'Outros';
        porUnidade[unidade].tipos[tipo] = (porUnidade[unidade].tipos[tipo] || 0) + 1;
    });
    
    // Ordenar unidades por total de OS
    const top5Unidades = Object.entries(porUnidade)
        .map(([nome, dados]) => ({
            nome,
            total: dados.total,
            finalizadas: dados.finalizadas,
            percentual: ((dados.total / total) * 100).toFixed(1),
            principaisTipos: Object.entries(dados.tipos)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([tipo, qtd]) => `${tipo} (${qtd})`)
                .join(', ')
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    
    // Equipamentos mais atendidos
    const equipamentos = {};
    dadosOS.forEach(os => {
        const equip = os.tipo_equipamento || 'Não especificado';
        equipamentos[equip] = (equipamentos[equip] || 0) + 1;
    });
    
    const top5Equipamentos = Object.entries(equipamentos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    // ========== NOVO: DISTRIBUIÇÃO POR DIA DA SEMANA ==========
    const porDiaSemana = {
        'Domingo': 0, 'Segunda': 0, 'Terça': 0, 'Quarta': 0, 
        'Quinta': 0, 'Sexta': 0, 'Sábado': 0
    };
    const diasNomes = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    dadosOS.forEach(os => {
        const data = os.data_abertura;
        if (data) {
            const dataObj = data.toDate ? data.toDate() : new Date(data);
            const diaSemana = diasNomes[dataObj.getDay()];
            porDiaSemana[diaSemana]++;
        }
    });
    
    return {
        total,
        finalizadas,
        emAndamento,
        abertas,
        taxaConclusao: total > 0 ? ((finalizadas / total) * 100).toFixed(1) : 0,
        tempoMedio: tempoMedio.toFixed(1),
        tiposServico,
        top5Equipamentos,
        percentualFinalizadas: total > 0 ? ((finalizadas / total) * 100).toFixed(0) : 0,
        
        // ========== NOVOS DADOS SLA ==========
        sla: {
            meta: metaSLA,
            dentroSLA,
            foraSLA,
            percentualSLA,
            osFora: osFora.slice(0, 5), // Top 5 fora do SLA
            status: parseFloat(percentualSLA) >= 90 ? 'EXCELENTE' : 
                   parseFloat(percentualSLA) >= 80 ? 'BOM' : 
                   parseFloat(percentualSLA) >= 70 ? 'REGULAR' : 'CRÍTICO',
            emoji: parseFloat(percentualSLA) >= 90 ? '🟢' : 
                  parseFloat(percentualSLA) >= 80 ? '🟡' : 
                  parseFloat(percentualSLA) >= 70 ? '🟠' : '🔴'
        },
        
        // ========== NOVOS DADOS POR UNIDADE ==========
        porUnidade: top5Unidades,
        
        // ========== NOVOS DADOS POR DIA ==========
        porDiaSemana
    };
}

/**
 * ========== NOVA FUNÇÃO: CALCULAR TENDÊNCIAS ==========
 * Compara estatísticas atuais com período anterior
 */
function calcularTendencias(statsAtual, statsPeriodoAnterior) {
    if (!statsPeriodoAnterior) {
        return null; // Primeiro relatório, sem comparação
    }
    
    const calcularVariacao = (atual, anterior) => {
        if (anterior === 0) return '+100';
        const variacao = ((atual - anterior) / anterior) * 100;
        const sinal = variacao > 0 ? '+' : '';
        return `${sinal}${variacao.toFixed(1)}%`;
    };
    
    const totalAtual = parseInt(statsAtual.total) || 0;
    const totalAnterior = parseInt(statsPeriodoAnterior.total) || 0;
    
    const tempoAtual = parseFloat(statsAtual.tempoMedio) || 0;
    const tempoAnterior = parseFloat(statsPeriodoAnterior.tempoMedio) || 0;
    
    const taxaAtual = parseFloat(statsAtual.taxaConclusao) || 0;
    const taxaAnterior = parseFloat(statsPeriodoAnterior.taxaConclusao) || 0;
    
    return {
        totalVariacao: calcularVariacao(totalAtual, totalAnterior),
        totalAtual,
        totalAnterior,
        totalMelhorou: totalAtual > totalAnterior,
        
        tempoVariacao: calcularVariacao(tempoAtual, tempoAnterior),
        tempoAtual: tempoAtual.toFixed(1),
        tempoAnterior: tempoAnterior.toFixed(1),
        tempoMelhorou: tempoAtual < tempoAnterior, // Menos tempo é melhor
        
        taxaVariacao: calcularVariacao(taxaAtual, taxaAnterior),
        taxaAtual: taxaAtual.toFixed(1),
        taxaAnterior: taxaAnterior.toFixed(1),
        taxaMelhorou: taxaAtual > taxaAnterior,
        
        // Resumo geral
        melhorias: [],
        alertas: []
    };
}

/**
 * ========== NOVA FUNÇÃO: SALVAR HISTÓRICO ==========
 * Salva dados do relatório atual para comparação futura
 */
function salvarHistorico(stats, periodo) {
    try {
        const historico = {
            data: new Date().toISOString(),
            periodo: periodo.texto,
            stats: {
                total: stats.total,
                finalizadas: stats.finalizadas,
                tempoMedio: stats.tempoMedio,
                taxaConclusao: stats.taxaConclusao
            }
        };
        
        // Buscar histórico anterior
        const historicoAnterior = JSON.parse(localStorage.getItem('stic_historico_relatorios') || '[]');
        
        // Adicionar novo registro (máximo 10 registros)
        historicoAnterior.push(historico);
        if (historicoAnterior.length > 10) {
            historicoAnterior.shift(); // Remove o mais antigo
        }
        
        localStorage.setItem('stic_historico_relatorios', JSON.stringify(historicoAnterior));
        console.log('📊 Histórico salvo com sucesso!');
        
    } catch (error) {
        console.warn('⚠️ Erro ao salvar histórico:', error);
    }
}

/**
 * ========== NOVA FUNÇÃO: BUSCAR PERÍODO ANTERIOR ==========
 * Busca dados do período anterior para comparação
 */
function buscarPeriodoAnterior(periodoAtual) {
    try {
        const historico = JSON.parse(localStorage.getItem('stic_historico_relatorios') || '[]');
        
        if (historico.length === 0) {
            return null; // Sem histórico
        }
        
        // Buscar relatório com mesmo período
        const anterior = historico
            .filter(h => h.periodo === periodoAtual)
            .sort((a, b) => new Date(b.data) - new Date(a.data))[1]; // [1] = segundo mais recente
        
        return anterior ? anterior.stats : null;
        
    } catch (error) {
        console.warn('⚠️ Erro ao buscar período anterior:', error);
        return null;
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
    
    // Análise de desempenho SLA
    const slaStatus = stats.sla.status;
    const slaEmoji = stats.sla.emoji;
    
    // Identificar padrões
    const diaMaisMovimentado = Object.entries(stats.porDiaSemana)
        .sort((a, b) => b[1] - a[1])[0];
    
    const unidadeMaisAtendida = stats.porUnidade[0]?.nome || 'N/A';
    
    // Texto de tendências (se houver)
    let textoTendencias = '';
    if (stats.tendencias) {
        const t = stats.tendencias;
        textoTendencias = `
📈 COMPARATIVO COM PERÍODO ANTERIOR:
Total de OS: ${t.totalAtual} (anterior: ${t.totalAnterior}) ${t.totalVariacao} ${t.totalMelhorou ? '↑' : '↓'}
Tempo médio: ${t.tempoAtual}d (anterior: ${t.tempoAnterior}d) ${t.tempoVariacao} ${t.tempoMelhorou ? '↓ MELHOROU' : '↑ PIOROU'}
Taxa conclusão: ${t.taxaAtual}% (anterior: ${t.taxaAnterior}%) ${t.taxaVariacao} ${t.taxaMelhorou ? '↑' : '↓'}`;
    } else {
        textoTendencias = '\n[PRIMEIRO PERÍODO - Sem dados para comparação]';
    }
    
    return `Você é um analista técnico da STIC (Seção de TI) da 7ª RPM/PMMG. Crie um RELATÓRIO PROFISSIONAL em formato JSON.

═══════════════════════════════════
DADOS DO PERÍODO: ${periodo.texto}
═══════════════════════════════════

📊 INDICADORES-CHAVE:
• Total: ${stats.total} OS
• Finalizadas: ${stats.finalizadas} (${stats.percentualFinalizadas}%)
• Em andamento: ${stats.emAndamento}
• Tempo médio: ${stats.tempoMedio} dias
• Taxa de conclusão: ${stats.taxaConclusao}%

⏱️ SLA (Meta: ${stats.sla.meta} dias):
• Dentro do prazo: ${stats.sla.dentroSLA} OS (${stats.sla.percentualSLA}%)
• Fora do prazo: ${stats.sla.foraSLA} OS
• STATUS: ${slaStatus} ${slaEmoji}
${stats.sla.osFora.length > 0 ? `• Principais atrasos:\n${stats.sla.osFora.map(o => `  - OS ${o.numero}: ${o.tempo}d - ${o.tipo}`).join('\n')}` : ''}

${textoTendencias}

📋 PADRÕES IDENTIFICADOS:
• Dia mais movimentado: ${diaMaisMovimentado[0]} (${diaMaisMovimentado[1]} OS)
• Unidade com mais demanda: ${unidadeMaisAtendida} (${stats.porUnidade[0]?.total || 0} OS)

🔧 TOP 5 SERVIÇOS:
${Object.entries(stats.tiposServico).slice(0, 5).map(([tipo, qtd]) => `• ${tipo}: ${qtd} OS`).join('\n')}

📝 EXEMPLOS DE ATENDIMENTOS:
${resumoOS}

═══════════════════════════════════
INSTRUÇÕES - GERE UM JSON:
═══════════════════════════════════

Retorne APENAS um objeto JSON (sem markdown, sem backticks) com esta estrutura:

{
  "resumo": "Parágrafo executivo de 150-200 palavras. Use linguagem técnica, formal e objetiva. Destaque as principais ações realizadas (implementação, configuração, manutenção), desempenho do SLA, e resultados numéricos. ${stats.tendencias ? 'Mencione as melhorias em relação ao período anterior.' : 'É o primeiro período de análise.'} Conclua com perspectivas proativas.",
  
  "insights": [
    "✅ PONTO FORTE: [Identifique 1-2 pontos positivos baseados nos dados. Ex: SLA excelente, tempo de atendimento abaixo da meta, produtividade alta]",
    
    "⚠️ ATENÇÃO: [Identifique 1-2 pontos de atenção. Ex: aumento em certo tipo de serviço, OS fora do SLA, unidade com sobrecarga]",
    
    "💡 RECOMENDAÇÃO: [Sugira 2-3 ações práticas e concretas. Ex: criar estoque de peças, manutenção preventiva, reforçar equipe em dia específico, capacitação técnica]"
  ]
}

REGRAS IMPORTANTES:
✓ Foque em DADOS e AÇÕES CONCRETAS
✓ Use terminologia técnica (implementação, configuração, solução)
✓ Seja OBJETIVO e DIRETO
✓ ${stats.tendencias ? 'Valorize as melhorias identificadas' : 'Estabeleça baseline para próximos períodos'}
✓ Recomendações devem ser PRÁTICAS e IMPLEMENTÁVEIS
✓ Retorne APENAS o JSON, sem formatação markdown`;
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

/**
 * Analisar tendências comparando com período anterior
 */
async function analisarTendencias(statsAtual, diasPeriodo) {
    try {
        // Buscar OS do período anterior (mesmo intervalo de tempo)
        const dataFimAnterior = new Date();
        dataFimAnterior.setDate(dataFimAnterior.getDate() - diasPeriodo);
        
        const dataInicioAnterior = new Date();
        dataInicioAnterior.setDate(dataInicioAnterior.getDate() - (diasPeriodo * 2));
        
        const snapshot = await db.collection('ordens_servico').get();
        
        const osAnterior = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(os => {
                const dataOS = os.data_abertura || os.data_criacao || os.created_at;
                if (!dataOS) return false;
                
                let dataOSDate;
                if (dataOS.toDate) {
                    dataOSDate = dataOS.toDate();
                } else if (typeof dataOS === 'string') {
                    dataOSDate = new Date(dataOS);
                } else {
                    return false;
                }
                
                return dataOSDate >= dataInicioAnterior && dataOSDate < dataFimAnterior;
            });
        
        if (osAnterior.length === 0) {
            return {
                temDados: false,
                mensagem: 'Dados do período anterior não disponíveis para comparação'
            };
        }
        
        const statsAnterior = calcularEstatisticas(osAnterior);
        
        // Calcular variações
        const variacaoTotal = calcularVariacao(statsAnterior.total, statsAtual.total);
        const variacaoFinalizadas = calcularVariacao(statsAnterior.finalizadas, statsAtual.finalizadas);
        const variacaoTempo = calcularVariacao(parseFloat(statsAnterior.tempoMedio), parseFloat(statsAtual.tempoMedio));
        const variacaoSLA = calcularVariacao(parseFloat(statsAnterior.sla.percentualSLA), parseFloat(statsAtual.sla.percentualSLA));
        
        return {
            temDados: true,
            anterior: {
                total: statsAnterior.total,
                finalizadas: statsAnterior.finalizadas,
                tempoMedio: statsAnterior.tempoMedio,
                slaPercent: statsAnterior.sla.percentualSLA
            },
            variacoes: {
                total: variacaoTotal,
                finalizadas: variacaoFinalizadas,
                tempo: variacaoTempo,
                sla: variacaoSLA
            }
        };
        
    } catch (error) {
        console.warn('Erro ao analisar tendências:', error);
        return {
            temDados: false,
            mensagem: 'Erro ao carregar dados do período anterior'
        };
    }
}

/**
 * Calcular variação percentual
 */
function calcularVariacao(anterior, atual) {
    if (anterior === 0) return { valor: 0, percentual: 0, tendencia: 'estável' };
    
    const percentual = ((atual - anterior) / anterior) * 100;
    const tendencia = percentual > 5 ? 'alta' : percentual < -5 ? 'baixa' : 'estável';
    
    return {
        valor: atual - anterior,
        percentual: percentual.toFixed(1),
        tendencia,
        icone: percentual > 0 ? '↑' : percentual < 0 ? '↓' : '→'
    };
}

console.log('✅ Groq API configurada!');
console.log('🤖 Modelo:', GroqConfig.model);
console.log('🎯 Pronto para gerar relatórios!');
