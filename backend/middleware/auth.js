// middleware/auth.js
// Middlewares de Autenticação e Autorização

import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'
import { createAuditLog } from '../services/auditService.js'

const JWT_SECRET = process.env.JWT_SECRET

class AuthError extends Error {
  constructor(message, statusCode = 401) {
    super(message)
    this.statusCode = statusCode
  }
}

/**
 * Middleware: Verifica e valida o JWT
 * Extrai user_id, role e company_id do token
 */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token nao fornecido' })
    }

    const token = authHeader.slice(7)

    let decoded
    try {
      decoded = jwt.verify(token, JWT_SECRET)
    } catch (error) {
      return res.status(401).json({ error: 'Token invalido ou expirado' })
    }

    // Recuperar dados do usuário do banco de dados
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, company_id, is_active')
      .eq('id', decoded.sub)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'Usuario nao encontrado' })
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Conta desativada' })
    }

    // Attach user data to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
      is_active: user.is_active,
    }

    next()
  } catch (error) {
    console.error('Auth error:', error)
    res.status(500).json({ error: 'Erro na autenticacao' })
  }
}

/**
 * Middleware: Valida se o usuário tem um dos roles permitidos
 * @param {string[]} allowedRoles - Roles permitidos (ex: ['SUPER_ADMIN', 'COMPANY'])
 */
export const checkRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Nao autenticado' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      createAuditLog({
        user_id: req.user.id,
        action: 'unauthorized_access_attempt',
        entity_type: 'route',
        status: 'unauthorized',
        error_message: `Acesso negado para role: ${req.user.role}`,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
      })

      return res.status(403).json({
        error: 'Acesso negado. Role insuficiente.',
        required_role: allowedRoles,
        current_role: req.user.role,
      })
    }

    next()
  }
}

/**
 * Middleware: Verifica se a empresa está aprovada
 * Apenas para usuários com role COMPANY
 */
export const checkCompanyStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'COMPANY') {
      return next()
    }

    const { data: company, error } = await supabase
      .from('companies')
      .select('status')
      .eq('owner_id', req.user.id)
      .single()

    if (error) {
      return res.status(404).json({ error: 'Empresa nao encontrada' })
    }

    if (company.status !== 'approved') {
      createAuditLog({
        user_id: req.user.id,
        action: 'access_pending_company',
        entity_type: 'company',
        entity_id: company.id,
        status: 'blocked',
        error_message: `Tentativa de acesso com status: ${company.status}`,
        ip_address: req.ip,
      })

      return res.status(403).json({
        error: 'Empresa ainda nao foi aprovada',
        company_status: company.status,
        message: 'Aguarde a aprovacao do administrador',
      })
    }

    // Attach company status to request
    req.companyStatus = company.status

    next()
  } catch (error) {
    console.error('Company status check error:', error)
    res.status(500).json({ error: 'Erro ao verificar status da empresa' })
  }
}

/**
 * Middleware: Valida se o usuário pertence à empresa
 * Previne acesso cruzado entre empresas
 */
export const checkCompanyOwnership = async (req, res, next) => {
  try {
    if (req.user.role !== 'COMPANY') {
      return next()
    }

    const companyId = req.params.company_id || req.body.company_id

    if (!companyId) {
      return res.status(400).json({ error: 'ID da empresa nao fornecido' })
    }

    const { data: company, error } = await supabase
      .from('companies')
      .select('owner_id, id')
      .eq('id', companyId)
      .single()

    if (error || !company) {
      return res.status(404).json({ error: 'Empresa nao encontrada' })
    }

    if (company.owner_id !== req.user.id) {
      createAuditLog({
        user_id: req.user.id,
        action: 'unauthorized_company_access',
        entity_type: 'company',
        entity_id: companyId,
        status: 'blocked',
        error_message: 'Tentativa de acesso a empresa de outro usuario',
        ip_address: req.ip,
      })

      return res.status(403).json({ error: 'Acesso negado a esta empresa' })
    }

    next()
  } catch (error) {
    console.error('Company ownership check error:', error)
    res.status(500).json({ error: 'Erro ao verificar propriedade da empresa' })
  }
}

/**
 * Middleware: Apenas Super Admin pode acessar
 */
export const requireSuperAdmin = checkRole(['SUPER_ADMIN'])

/**
 * Middleware: Apenas empresa aprovada ou cliente
 */
export const requireClientOrApprovedCompany = async (req, res, next) => {
  if (req.user.role === 'CLIENT') {
    return next()
  }

  if (req.user.role === 'COMPANY') {
    return checkCompanyStatus(req, res, next)
  }

  return res.status(403).json({ error: 'Role nao permitido' })
}

/**
 * Middleware: Error handler
 */
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AuthError) {
    return res.status(err.statusCode).json({ error: err.message })
  }

  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Erro interno do servidor' })
}

/**
 * Middleware: Log de requisições
 */
export const requestLogger = (req, res, next) => {
  const method = req.method
  const path = req.path
  const startTime = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - startTime
    const statusCode = res.statusCode
    const user = req.user?.id || 'anonymous'

    console.log(
      `[${new Date().toISOString()}] ${method} ${path} - ${statusCode} (${duration}ms) - User: ${user}`
    )
  })

  next()
}
