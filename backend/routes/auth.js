// routes/auth.js
// Rotas de Autenticação e Registro com Fluxo RBAC

import express from 'express'
import {
  registerAsClient,
  registerAsCompany,
  login,
  logout,
  getCurrentUser,
  validateEmail,
} from '../controllers/authController.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

/**
 * POST /auth/register/client
 * Registro como Cliente
 * Body: { email, password, full_name }
 * Response: { user_id, role, email, message }
 */
router.post('/register/client', registerAsClient)

/**
 * POST /auth/register/company
 * Registro como Empresa
 * Body: { email, password, full_name, company_name, cnpj, industry, company_size, contact_email }
 * Response: { company_id, status: 'pending_approval', message, company_name }
 * Nota: Status inicial é 'pending_approval', gera alerta no Super Admin
 */
router.post('/register/company', registerAsCompany)

/**
 * POST /auth/login
 * Login para qualquer role
 * Body: { email, password }
 * Response: { token, user: { id, email, role, status }, company_status? }
 */
router.post('/login', login)

/**
 * POST /auth/logout
 * Logout (invalida token)
 */
router.post('/logout', verifyToken, logout)

/**
 * GET /auth/me
 * Obter dados do usuário autenticado
 */
router.get('/me', verifyToken, getCurrentUser)

/**
 * POST /auth/validate-email
 * Validar se email já existe
 * Body: { email }
 */
router.post('/validate-email', validateEmail)

export default router
