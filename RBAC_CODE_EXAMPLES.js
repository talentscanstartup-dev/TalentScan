// validators/authValidator.js
// Validação de dados de autenticação

export const validateClientRegistration = (data) => {
  const errors = {}

  // Email
  if (!data.email) {
    errors.email = 'Email é obrigatório'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Email inválido'
  }

  // Password
  if (!data.password) {
    errors.password = 'Senha é obrigatória'
  } else if (data.password.length < 6) {
    errors.password = 'Senha deve ter no mínimo 6 caracteres'
  }

  // Full name
  if (!data.full_name) {
    errors.full_name = 'Nome completo é obrigatório'
  } else if (data.full_name.trim().length < 3) {
    errors.full_name = 'Nome deve ter no mínimo 3 caracteres'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export const validateCompanyRegistration = (data) => {
  const errors = {}

  // Validar dados do cliente também
  const clientValidation = validateClientRegistration(data)
  if (!clientValidation.valid) {
    Object.assign(errors, clientValidation.errors)
  }

  // Company name
  if (!data.company_name) {
    errors.company_name = 'Nome da empresa é obrigatório'
  } else if (data.company_name.trim().length < 3) {
    errors.company_name = 'Nome da empresa deve ter no mínimo 3 caracteres'
  }

  // Contact email
  if (!data.contact_email) {
    errors.contact_email = 'Email de contato é obrigatório'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email)) {
    errors.contact_email = 'Email de contato inválido'
  }

  // Industry
  if (!data.industry) {
    errors.industry = 'Setor é obrigatório'
  }

  // Company size
  if (!data.company_size) {
    errors.company_size = 'Tamanho da empresa é obrigatório'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export const validateLogin = (data) => {
  const errors = {}

  if (!data.email) {
    errors.email = 'Email é obrigatório'
  }

  if (!data.password) {
    errors.password = 'Senha é obrigatória'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

// validators/companyValidator.js

export const validateCompanyProfileUpdate = (data) => {
  const errors = {}

  // Company name
  if (data.company_name && data.company_name.trim().length < 3) {
    errors.company_name = 'Nome deve ter no mínimo 3 caracteres'
  }

  // Website
  if (data.website && !/^https?:\/\/.+/.test(data.website)) {
    errors.website = 'URL inválida'
  }

  // Contact email
  if (data.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email)) {
    errors.contact_email = 'Email inválido'
  }

  // Contact phone
  if (data.contact_phone && !/^[\d\s\-\+\(\)]+$/.test(data.contact_phone)) {
    errors.contact_phone = 'Telefone inválido'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export const validateCompanyMemberInvite = (data) => {
  const errors = {}

  if (!data.email) {
    errors.email = 'Email é obrigatório'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Email inválido'
  }

  if (!data.role || !['admin', 'member'].includes(data.role)) {
    errors.role = 'Role deve ser admin ou member'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

// validators/adminValidator.js

export const validateApprovalDecision = (data) => {
  const errors = {}

  if (data.notes && data.notes.length > 500) {
    errors.notes = 'Notas nao podem exceder 500 caracteres'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export const validateSuspensionReason = (data) => {
  const errors = {}

  if (!data.reason) {
    errors.reason = 'Motivo é obrigatório'
  } else if (data.reason.length < 10) {
    errors.reason = 'Motivo deve ter no mínimo 10 caracteres'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

// config/supabase.js

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis Supabase nao configuradas')
}

// Cliente anônimo (para queries públicas)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente com service role (para operações administrativas)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole)

// config/jwt.js

import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d'

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET nao configurada')
}

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  })
}

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error('Token inválido')
  }
}

export const decodeToken = (token) => {
  return jwt.decode(token)
}

// utils/errorResponse.js

export class ApiError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message)
    this.statusCode = statusCode
    this.details = details
  }
}

export const sendErrorResponse = (res, error) => {
  const statusCode = error.statusCode || 500
  const message = error.message || 'Erro interno do servidor'

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      details: error.details,
      stack: error.stack,
    }),
  })
}

export const sendSuccessResponse = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
  })
}

// server.js - Arquivo Principal Completo

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

// Importar rotas
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import companyRoutes from './routes/company.js'
import profileRoutes from './routes/profile.js'

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

// Middlewares de Segurança
app.use(helmet()) // Headers de segurança
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))

// Rate Limiting
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

// Body Parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Request Logger
app.use(requestLogger)

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  })
})

// API Routes
app.use('/auth', loginLimiter, authRoutes)
app.use('/admin', verifyToken, adminRoutes)
app.use('/company', verifyToken, companyRoutes)
app.use('/profile', verifyToken, profileRoutes)

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota nao encontrada',
    path: req.path,
    method: req.method,
  })
})

// Error Handler (deve ser o ultimo middleware)
app.use(errorHandler)

// Start Server
app.listen(PORT, () => {
  console.log(`
    ╔════════════════════════════════════════╗
    ║     TALENT SCAN API - RBAC System     ║
    ╠════════════════════════════════════════╣
    ║  URL: http://localhost:${PORT}
    ║  Ambiente: ${NODE_ENV}
    ║  Timestamp: ${new Date().toISOString()}
    ╚════════════════════════════════════════╝
  `)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

export default app
