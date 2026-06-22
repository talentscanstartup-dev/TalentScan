// webhook-server/server.js
// Servidor Express para receber dados de curriculos via n8n

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import multer from 'multer'
import { createRequire } from 'module'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

const require = createRequire(import.meta.url)
const pdfParseModule = require('pdf-parse')
const pdfParse = pdfParseModule.default || pdfParseModule
const mammoth = require('mammoth')
const Tesseract = require('tesseract.js')

// Carregar variáveis de ambiente
dotenv.config()

// Configurações
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// As chaves serão obtidas por requisição para suportar fallback
const getApiKeys = () => [
  process.env['GEMINI-API-SUACHAVEAQUI'],
  process.env['GEMINI-API-SUACHAVEAQUI2'],
  process.env['GEMINI-API-SUACHAVEAQUI3'],
  process.env.GEMINI_API_KEY
].filter(Boolean);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

const app = express()
const PORT = process.env.PORT || 3001

// ===== MIDDLEWARES GLOBAIS =====

// Segurança
app.use(helmet())

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}))

// Parse JSON
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Logger de requisições
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.path}`)
  next()
})

// ===== MIDDLEWARE DE AUTENTICAÇÃO =====
/**
 * Verifica se o token Bearer é válido
 * Token esperado no header: Authorization: Bearer <TOKEN>
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token ausente. Use: Authorization: Bearer <TOKEN>',
        timestamp: new Date().toISOString(),
      })
    }

    const validToken = process.env.N8N_WEBHOOK_TOKEN

    if (!validToken) {
      console.error('ERRO: N8N_WEBHOOK_TOKEN nao configurada em .env')
      return res.status(500).json({
        success: false,
        error: 'Configuracao do servidor incorreta',
      })
    }

    if (token !== validToken) {
      console.warn(`[AUTH FAILED] Token invalido recebido: ${token.substring(0, 10)}...`)
      return res.status(403).json({
        success: false,
        error: 'Token invalido',
        timestamp: new Date().toISOString(),
      })
    }

    // Token válido, continuar
    req.authenticated = true
    next()
  } catch (error) {
    console.error('Erro na autenticacao:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao processar autenticacao',
    })
  }
}

// ===== VALIDAÇÃO DE PAYLOAD =====
/**
 * Valida se o payload contém os campos obrigatórios
 */
const validateCurriculoPayload = (req, res, next) => {
  try {
    const payload = req.body

    // Campos obrigatórios
    const requiredFields = [
      'nome_candidato',
      'email',
      'telefone',
    ]

    const missingFields = requiredFields.filter(field => !payload[field])

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatorios faltando',
        missing_fields: missingFields,
        expected_fields: requiredFields,
      })
    }

    next()
  } catch (error) {
    console.error('Erro na validacao:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao validar payload',
    })
  }
}

// ===== ROUTES =====

/**
 * Health Check - Verificar se servidor está rodando
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

/**
 * POST /api/analyze-cv
 * Recebe o arquivo PDF do currículo, extrai o texto e processa com Gemini AI.
 */
app.post('/api/analyze-cv', upload.single('file'), async (req, res) => {
  try {
    const timestamp = new Date().toISOString()
    console.log('\n' + '='.repeat(70))
    console.log('NOVO CV RECEBIDO: POST /api/analyze-cv')
    console.log('='.repeat(70))
    console.log(`Timestamp: ${timestamp}`)

    if (!req.file) {
      console.log('Erro: Nenhum arquivo enviado.')
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado.' })
    }

    const apiKeys = getApiKeys()
    if (apiKeys.length === 0) {
      console.log('Erro: Nenhuma chave do Gemini configurada no .env')
      return res.status(500).json({ success: false, error: 'Chaves do Gemini não configuradas no servidor.' })
    }

    console.log(`Arquivo recebido: ${req.file.originalname} (${req.file.size} bytes)`)

    // 1. Extrair Texto do Arquivo
    console.log('Iniciando extração de texto...')
    let cvText = ''
    try {
      const mimeType = req.file.mimetype;
      if (mimeType === 'application/pdf') {
        const pdfData = await pdfParse(req.file.buffer)
        cvText = pdfData.text
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType === 'application/msword') {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        cvText = result.value;
      } else if (mimeType.startsWith('image/')) {
        const { data: { text } } = await Tesseract.recognize(req.file.buffer, 'por+eng');
        cvText = text;
      } else {
        return res.status(400).json({ success: false, error: 'Formato não suportado. Envie PDF, DOCX ou Imagens (JPG/PNG).' });
      }
      console.log(`Texto extraído: ${cvText.length} caracteres.`)
    } catch (extractError) {
      console.error('Erro na extração de texto (corrompido/ilegível):', extractError.message)
      return res.status(400).json({ 
        success: false, 
        error: 'Não foi possível ler o arquivo enviado. Ele pode estar corrompido ou o formato é inválido.' 
      })
    }

    // 2. Chamar IA Local (Ollama)
    console.log(`Chamando IA Local via Ollama...`)
    
    const prompt = `Você é um recrutador profissional de RH.

Analise o documento abaixo e responda SOMENTE em JSON válido.

Currículo:
${cvText}

Regras Cruciais:
1. Validação: Se o documento não for um currículo real ou profissional (ex: receita de bolo, bula, texto aleatório), retorne "is_valid_resume": false e não preencha os outros campos.
2. Anti-Cheat (Keyword Stuffing): Ignore blocos massivos e desconexos de palavras-chave inseridas sem contexto. Se você detectar listas enormes de dezenas de ferramentas jogadas apenas para ludibriar o sistema (letras invisíveis/escondidas), penalize a nota drasticamente e indique nos pontos fracos a tentativa de manipulação do sistema.
3. Roteiro de Entrevista: Crie 3 perguntas (interview_questions) com base nas fraquezas ou forças do candidato para explorá-las na entrevista.
4. A nota deve ser de 0 a 10.
5. Não escreva NADA fora do formato JSON.

Formato obrigatório:
{
  "is_valid_resume": true,
  "nome": "",
  "nota": 0,
  "nivel": "",
  "area": "",
  "pontos_fortes": "",
  "pontos_fracos": "",
  "resumo": "",
  "probabilidade_contratacao": "",
  "interview_questions": ["", "", ""]
}`

    let parsedData = null

    try {
      const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder';

      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          prompt: prompt,
          stream: false,
          format: "json",
          options: {
            temperature: 0.2
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama falhou: ${response.statusText}`);
      }

      const result = await response.json();
      let text = result.response.trim();
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      parsedData = JSON.parse(text);
      if (parsedData.is_valid_resume === false) {
        throw new Error('Documento rejeitado pela IA: O arquivo enviado não é um currículo válido.');
      }
      console.log(`JSON processado pela IA Local com sucesso:`, parsedData.nome);
    } catch (err) {
      console.error(`Falha no processamento da IA Local:`, err.message);
      throw new Error(`Falha no motor de IA Local: ` + err.message);
    }

    if (!parsedData) {
      throw new Error(`A IA retornou um formato vazio.`);
    }

    // 3. Salvar no Supabase (se configurado)
    let candidatoId = null
    if (supabase) {
      console.log('Salvando no Supabase...')
      
      // O userId real ou um mock temporário
      const userId = req.body.userId
      const token = req.body.token
      
      let dbClient = supabase
      if (token) {
        dbClient = createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        })
      }
      
      if (!userId) {
         console.warn('Aviso: userId não fornecido na requisição. A inserção pode falhar caso haja política de restrição NOT NULL.')
      }

      // 1. Inserir CV
      const { data: cv, error: cvError } = await dbClient
        .from('cvs')
        .insert({
          user_id: userId,
          candidate_name: parsedData.nome || 'N/A',
          file_url: 'processamento_local',
          file_name: req.file.originalname,
          file_size: req.file.size,
          status: 'analyzed',
          created_at: timestamp
        })
        .select()

      if (cvError) {
        console.error('Erro ao salvar CV no Supabase:', cvError.message)
      } else if (cv && cv.length > 0) {
        const cvId = cv[0].id
        
        // 2. Inserir Candidato
        const { data: candidato, error: candError } = await dbClient
          .from('candidates')
          .insert({
            cv_id: cvId,
            user_id: userId,
            full_name: parsedData.nome || 'N/A',
            email: parsedData.email || null,
            phone: parsedData.telefone || null,
            location: parsedData.area || null,
            professional_summary: parsedData.resumo || null,
            skills: parsedData.pontos_fortes ? [parsedData.pontos_fortes] : [],
            ai_score: parsedData.nota || 0,
            ai_analysis: parsedData,
            created_at: timestamp
          })
          .select()
        
        if (candError) {
          console.error('Erro ao salvar candidato no Supabase:', candError.message)
        } else if (candidato && candidato.length > 0) {
          candidatoId = candidato[0].id
          console.log(`Salvo no Supabase com CV ID: ${cvId} e Candidato ID: ${candidatoId}`)
        }
      }
    } else {
      console.log('Aviso: Supabase não configurado neste servidor, dados não salvos no banco central.')
    }

    console.log('Processo concluído com sucesso.\n' + '='.repeat(70) + '\n')
    res.json({
      success: true,
      data: parsedData,
      candidato_id: candidatoId
    })

  } catch (error) {
    console.error('Erro ao processar currículo:', error)
    res.status(500).json({ success: false, error: 'Erro interno ao processar currículo: ' + error.message })
  }
})

/**
 * POST /api/receber-curriculo
 * Recebe dados estruturados de curriculo do n8n
 * 
 * Headers: Authorization: Bearer <TOKEN>
 * 
 * Body esperado (exemplo):
 * {
 *   "nome_candidato": "João Silva",
 *   "email": "joao@example.com",
 *   "telefone": "+55 11 98765-4321",
 *   "profissao": "Desenvolvedor Backend",
 *   "experiencia_anos": 5,
 *   "skills": ["Node.js", "Express", "PostgreSQL"],
 *   "localizacao": "São Paulo, SP",
 *   "pretensao_salarial": "R$ 8.000 - R$ 12.000",
 *   "linkedin": "https://linkedin.com/in/joao",
 *   "portfolio": "https://github.com/joao",
 *   "resumo": "Desenvolvedor backend com 5 anos de experiência...",
 *   "arquivo_id": "telegram_123456",
 *   "arquivo_url": "https://t.me/...",
 *   "data_extracao": "2024-01-15T10:30:00Z",
 *   "confianca_extracao": 0.95,
 *   "metadata": {
 *     "source": "telegram",
 *     "n8n_execution_id": "exec_abc123",
 *     "groq_model": "mixtral-8x7b-32768"
 *   }
 * }
 */
app.post(
  '/api/receber-curriculo',
  authenticateToken,
  validateCurriculoPayload,
  async (req, res) => {
    try {
      const payload = req.body
      const timestamp = new Date().toISOString()

      console.log('\n' + '='.repeat(70))
      console.log('WEBHOOK RECEBIDO: POST /api/receber-curriculo')
      console.log('='.repeat(70))
      console.log(`Timestamp: ${timestamp}`)
      console.log(`Token autenticado: ${req.authenticated}`)
      console.log('\nPayload recebido:')
      console.log(JSON.stringify(payload, null, 2))
      console.log('='.repeat(70) + '\n')

      // ==========================================
      // TODO: INSERIR NO BANCO DE DADOS AQUI
      // ==========================================
      // Exemplo de como seria a inserção:
      //
      // const { data: candidato, error } = await supabase
      //   .from('candidatos')
      //   .insert({
      //     nome: payload.nome_candidato,
      //     email: payload.email,
      //     telefone: payload.telefone,
      //     profissao: payload.profissao,
      //     experiencia_anos: payload.experiencia_anos,
      //     skills: payload.skills,
      //     localizacao: payload.localizacao,
      //     pretensao_salarial: payload.pretensao_salarial,
      //     linkedin: payload.linkedin,
      //     portfolio: payload.portfolio,
      //     resumo: payload.resumo,
      //     arquivo_id: payload.arquivo_id,
      //     arquivo_url: payload.arquivo_url,
      //     confianca_extracao: payload.confianca_extracao,
      //     metadata: payload.metadata,
      //     criado_em: timestamp,
      //     status: 'novo',
      //   })
      //   .select()
      //
      // if (error) {
      //   console.error('Erro ao inserir no banco:', error)
      //   return res.status(500).json({
      //     success: false,
      //     error: 'Erro ao salvar curriculo no banco de dados',
      //   })
      // }
      //
      // console.log('Candidato inserido com sucesso:', candidato[0].id)
      // ==========================================

      // Simular processamento
      // Remover em produção ou usar para logs adicionais
      const processamento = {
        campos_recebidos: Object.keys(payload).length,
        campos_validados: true,
        timestamp_processamento: timestamp,
        status_banco_dados: 'simulado', // Mudar para 'inserido' quando integrar BD
      }

      console.log('\nProcessamento realizado:')
      console.log(JSON.stringify(processamento, null, 2))

      // Resposta obrigatória para n8n (evitar timeout)
      res.status(200).json({
        success: true,
        message: 'Curriculo recebido com sucesso',
        timestamp: timestamp,
        processamento,
        data: {
          candidato_id: null, // Será preenchido quando integrar BD
          nome_candidato: payload.nome_candidato,
          email: payload.email,
        },
      })
    } catch (error) {
      console.error('ERRO ao processar webhook:', error)
      res.status(500).json({
        success: false,
        error: 'Erro ao processar curriculo',
        message: error.message,
      })
    }
  }
)

/**
 * POST /api/receber-curriculo/teste
 * Endpoint de teste sem autenticação (remover em produção)
 */
app.post('/api/receber-curriculo/teste', validateCurriculoPayload, async (req, res) => {
  try {
    const payload = req.body
    const timestamp = new Date().toISOString()

    console.log('\n' + '='.repeat(70))
    console.log('WEBHOOK TESTE (SEM AUTENTICACAO): POST /api/receber-curriculo/teste')
    console.log('='.repeat(70))
    console.log(`Timestamp: ${timestamp}`)
    console.log('\nPayload recebido:')
    console.log(JSON.stringify(payload, null, 2))
    console.log('='.repeat(70) + '\n')

    res.status(200).json({
      success: true,
      message: 'Dados recebidos com sucesso (modo teste)',
      timestamp: timestamp,
      dados_recebidos: Object.keys(payload),
    })
  } catch (error) {
    console.error('ERRO em webhook teste:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao processar teste',
    })
  }
})

/**
 * Webhook simples para verificar funcionamento
 * Segue o mesmo padrão mas sem validação de payload
 */
app.post('/api/webhook-simples', authenticateToken, async (req, res) => {
  try {
    console.log('\n[WEBHOOK SIMPLES] Dados recebidos:')
    console.log(JSON.stringify(req.body, null, 2))

    res.status(200).json({
      success: true,
      message: 'Webhook acionado com sucesso',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Erro:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

// ===== ERROR HANDLERS =====

/**
 * 404 - Rota não encontrada
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota nao encontrada',
    path: req.path,
    method: req.method,
    available_routes: [
      'POST /api/receber-curriculo',
      'POST /api/receber-curriculo/teste',
      'POST /api/webhook-simples',
      'GET /health',
    ],
  })
})

/**
 * Error handler global
 */
app.use((err, req, res, next) => {
  console.error('Erro nao tratado:', err)
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
})

// ===== INICIAR SERVIDOR =====

const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║         N8N WEBHOOK SERVER - RECEBER CURRICULOS          ║
╠════════════════════════════════════════════════════════════╣
║ Servidor iniciado com sucesso                            ║
║ URL: http://localhost:${PORT}                              ║
║ Health: GET  http://localhost:${PORT}/health              ║
║ Webhook: POST http://localhost:${PORT}/api/receber-curriculo
║ Teste:   POST http://localhost:${PORT}/api/receber-curriculo/teste
║                                                           ║
║ Token necessário: ${process.env.N8N_WEBHOOK_TOKEN?.substring(0, 10) || 'NAO CONFIGURADO'}... ║
╚════════════════════════════════════════════════════════════╝
  `)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM recebido. Encerrando servidor...')
  server.close(() => {
    console.log('Servidor encerrado')
    process.exit(0)
  })
})

export default app
