// webhook-server/server.js
// Servidor Express para receber dados de curriculos via n8n

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'

// Carregar variáveis de ambiente
dotenv.config()

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
