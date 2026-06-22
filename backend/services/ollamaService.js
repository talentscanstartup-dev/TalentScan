// services/ollamaService.js
// Serviço para integrar IA Local via Ollama

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder';

/**
 * Envia um prompt para o modelo local do Ollama para processamento
 * e força o formato de saída como JSON.
 * 
 * @param {string} prompt Prompt completo instruindo o modelo
 * @param {string} systemMessage Mensagem de sistema opcional (ex: "Você é um recrutador...")
 * @returns {Promise<Object>} JSON parseado retornado pelo modelo
 */
export async function generateAnalysisWithOllama(prompt, systemMessage = '') {
  try {
    console.log(`🤖 Chamando Ollama localmente (Modelo: ${DEFAULT_MODEL})...`);
    
    const requestBody = {
      model: DEFAULT_MODEL,
      prompt: prompt,
      system: systemMessage,
      stream: false,
      format: "json", // Forçar a saída a ser um JSON válido
      options: {
        temperature: 0.2, // Temperatura baixa para mais precisão estrutural
        top_p: 0.9,
      }
    };

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Erro na API do Ollama: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data && data.response) {
      try {
        // Garantir que a string JSON retorne parseada e sem blocos Markdown
        let jsonStr = data.response.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        }
        
        const parsedJson = JSON.parse(jsonStr);
        return parsedJson;
      } catch (parseError) {
        console.error('❌ Ollama retornou uma string que não é JSON válido:', data.response);
        throw new Error('Falha no Parse do JSON retornado pela IA Local');
      }
    } else {
      throw new Error('Resposta vazia do Ollama');
    }
  } catch (error) {
    console.error('❌ Erro na comunicação com Ollama:', error.message);
    throw error; // Repassa o erro para o matchingService dar o fallback local
  }
}
