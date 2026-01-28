export async function handler(event) {
  try {
    const payload = JSON.parse(event.body || "{}");

    console.log('🤖 [Function] Chamando Groq API...');
    
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile", // ✅ Modelo atualizado (Jan 2026)
          messages: payload.messages,
          temperature: 0.7,
          max_tokens: 800
        })
      }
    );

    const data = await response.json();

    // ✅ VALIDAR se a resposta foi sucesso
    if (!response.ok) {
      console.error('❌ [Function] Groq retornou erro:', data);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: data.error?.message || 'Erro desconhecido da Groq',
          details: data
        })
      };
    }

    // ✅ VALIDAR se a resposta tem o formato esperado
    if (!data.choices || !data.choices[0]) {
      console.error('❌ [Function] Resposta inválida da Groq:', data);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Resposta da IA sem formato esperado',
          details: data
        })
      };
    }

    console.log('✅ [Function] Groq respondeu com sucesso');
    
    return {
      statusCode: 200,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('❌ [Function] Erro interno:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erro interno da function',
        message: error.message 
      })
    };
  }
}
