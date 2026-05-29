// routes/company.js
// Rotas de Empresa - COMPANY role apenas

import express from 'express'
import {
  getCompanyDashboard,
  updateCompanyProfile,
  getCompanyMetrics,
  getCompanyMembers,
  addTeamMember,
  removeTeamMember,
  getCompanySettings,
  updateCompanySettings,
  uploadCompanyLogo,
  getApprovalStatus,
} from '../controllers/companyController.js'
import {
  verifyToken,
  checkRole,
  checkCompanyStatus,
  checkCompanyOwnership,
} from '../middleware/auth.js'

const router = express.Router()

// Aplicar middlewares
router.use(verifyToken)
router.use(checkRole(['COMPANY']))

/**
 * GET /company/status
 * Obter status de aprovação da empresa
 * Response: { status: 'pending_approval' | 'approved' | 'rejected' | 'suspended', ... }
 * Não requer checkCompanyStatus (não bloqueia acesso a usuários pending)
 */
router.get('/status', getApprovalStatus)

/**
 * Middlewares: Apenas para rotas que requerem empresa aprovada
 */
router.use(checkCompanyStatus)

/**
 * GET /company/dashboard
 * Dashboard da empresa (apenas se approved)
 * Response: { company_info, stats, recent_activity }
 */
router.get('/dashboard', getCompanyDashboard)

/**
 * GET /company/profile
 * Obter perfil completo da empresa
 */
router.get('/profile', getCompanyMetrics) // Alias para compatibilidade

/**
 * PUT /company/profile
 * Atualizar perfil da empresa
 * Body: { company_name, description, website, industry, company_size, contact_phone, address, etc }
 */
router.put('/profile', updateCompanyProfile)

/**
 * GET /company/metrics
 * Obter métricas da empresa
 * Response: { cvs_processed, success_rate, candidates_found, team_size, storage_used }
 */
router.get('/metrics', getCompanyMetrics)

/**
 * GET /company/settings
 * Obter configurações da empresa
 */
router.get('/settings', getCompanySettings)

/**
 * PUT /company/settings
 * Atualizar configurações da empresa
 * Body: { notification_email, api_key_rotation, privacy_settings, etc }
 */
router.put('/settings', updateCompanySettings)

/**
 * GET /company/members
 * Listar membros da equipe
 * Response: { members: [ { user_id, email, role, joined_at, status } ] }
 */
router.get('/members', getCompanyMembers)

/**
 * POST /company/members
 * Adicionar novo membro à equipe
 * Body: { email, role: 'admin' | 'member' }
 * Efeitos colaterais:
 * - Cria convite para email
 * - Envia email com link de convite
 */
router.post('/members', addTeamMember)

/**
 * DELETE /company/members/:member_id
 * Remover membro da equipe
 */
router.delete('/members/:member_id', removeTeamMember)

/**
 * POST /company/logo
 * Upload de logo da empresa
 * Body: FormData { file: File }
 */
router.post('/logo', uploadCompanyLogo)

export default router
