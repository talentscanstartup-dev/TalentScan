// backend/server.js
// Servidor Express Principal - Talent Scan

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

// Importar rotas
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import companyRoutes from './routes/company.js'
import userRoutes from './routes/users.js'
import candidateRoutes from './routes/candidates.js'
import jobRoutes from './routes/jobs.js'
import ticketRoutes from './routes/tickets.js'

// Importar middlewares
import {
  requestLogger,
  errorHandler,
  verifyToken,
} from './middleware/auth.js'

// Carregar variáveis de ambiente
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const NODE_ENV = process.env.NODE_ENV || 'development'

// ===== MIDDLEWARES DE SEGURANÇA =====
app.use(helmet()) // Headers de segurança
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))

// ===== RATE LIMITING =====
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por janela
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // máximo 5 tentativas de login
  skipSuccessfulRequests: true,
})

app.use(limiter) // Aplicar a todos

// ===== BODY PARSER =====
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// ===== LOGGING =====
app.use(requestLogger)

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// ===== API ROUTES =====

/**
 * Rota de Autenticação
 * POST /auth/login
 * POST /auth/register
 * POST /auth/logout
 */
app.use('/auth/login', loginLimiter)
app.use('/auth', authRoutes)

/**
 * Rotas Administrativas
 * Requer: Token de autenticação + Super Admin
 */
app.use('/admin', adminRoutes)

/**
 * Rotas de Empresa
 * Requer: Token de autenticação
 */
app.use('/company', companyRoutes)

/**
 * Rotas de Usuários
 * Requer: Token de autenticação
 */
app.use('/users', userRoutes)

/**
 * Rotas de Candidatos
 * Requer: Token de autenticação
 */
app.use('/candidates', candidateRoutes)

/**
 * Rotas de Vagas
 * Requer: Token de autenticação
 */
app.use('/jobs', jobRoutes)

/**
 * Rotas de Tickets de Atendimento
 * Requer: Token de autenticação
 */
app.use('/tickets', ticketRoutes)

// ===== ERROR HANDLING =====
app.use(errorHandler)

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
    method: req.method,
  })
})

// ===== SERVER START =====
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║     🎯 TALENT SCAN - Backend      ║
╠════════════════════════════════════╣
║ Servidor rodando em: http://localhost:${PORT}
║ Ambiente: ${NODE_ENV}
║ Horário: ${new Date().toLocaleString('pt-BR')}
╚════════════════════════════════════╝
  `)
  console.log('📍 Endpoints disponíveis:')
  console.log('   • GET  /health - Status do servidor')
  console.log('   • POST /auth/login - Fazer login')
  console.log('   • POST /auth/register - Registrar')
  console.log('   • GET  /admin/approvals - Solicitações (Admin)')
  console.log('   • GET  /tickets - Meus tickets')
  console.log('   • POST /tickets - Criar ticket')
  console.log('')
})

export default server
