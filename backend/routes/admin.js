// routes/admin.js
// Rotas Administrativas - Apenas SUPER_ADMIN

import express from 'express'
import {
  getPendingApprovals,
  approveCompany,
  rejectCompany,
  suspendCompany,
  getAllUsers,
  getUserDetails,
  getAllCompanies,
  getSystemStats,
  getAuditLogs,
  sendNotification,
  getNotificationLogs,
} from '../controllers/adminController.js'
import {
  verifyToken,
  requireSuperAdmin,
} from '../middleware/auth.js'

const router = express.Router()

// Aplicar middlewares de autenticação e autorização
router.use(verifyToken)
router.use(requireSuperAdmin)

/**
 * GET /admin/approvals
 * Listar todas as solicitações de aprovação pendentes
 * Query: { status: 'pending' | 'approved' | 'rejected' | 'all', page: 1, limit: 20 }
 * Response: { requests: [...], total, page, limit }
 */
router.get('/approvals', getPendingApprovals)

/**
 * POST /admin/approvals/:company_id/approve
 * Aprovar solicitação de empresa
 * Response: { company_id, status: 'approved', message, notification_sent: true }
 * Efeitos colaterais:
 * - Atualiza status da empresa para 'approved'
 * - Cria entrada em company_members (owner como admin)
 * - Envia notificação por email/in-app para empresa
 */
router.post('/approvals/:company_id/approve', approveCompany)

/**
 * POST /admin/approvals/:company_id/reject
 * Rejeitar solicitação de empresa
 * Body: { rejection_reason: string }
 * Response: { company_id, status: 'rejected', message, notification_sent: true }
 */
router.post('/approvals/:company_id/reject', rejectCompany)

/**
 * POST /admin/companies/:company_id/suspend
 * Suspender empresa (remover acesso)
 * Body: { reason?: string }
 */
router.post('/companies/:company_id/suspend', suspendCompany)

/**
 * GET /admin/users
 * Listar todos os usuários do sistema
 * Query: { role: 'CLIENT' | 'COMPANY' | 'SUPER_ADMIN', status: 'active' | 'inactive', page: 1, limit: 20 }
 */
router.get('/users', getAllUsers)

/**
 * GET /admin/users/:user_id
 * Obter detalhes de um usuário específico
 */
router.get('/users/:user_id', getUserDetails)

/**
 * GET /admin/companies
 * Listar todas as empresas
 * Query: { status: 'approved' | 'pending_approval' | 'rejected' | 'suspended', page: 1, limit: 20 }
 */
router.get('/companies', getAllCompanies)

/**
 * GET /admin/stats
 * Obter estatísticas do sistema
 * Response: { total_users, total_companies, pending_approvals, total_cvs, system_health }
 */
router.get('/stats', getSystemStats)

/**
 * GET /admin/logs
 * Obter registros de auditoria
 * Query: { action: string, entity_type: string, page: 1, limit: 50 }
 */
router.get('/logs', getAuditLogs)

/**
 * POST /admin/notifications
 * Enviar notificação para usuário/empresa
 * Body: { user_id, company_id?, title, message, type }
 */
router.post('/notifications', sendNotification)

/**
 * GET /admin/notifications/logs
 * Visualizar histórico de notificações enviadas
 */
router.get('/notifications/logs', getNotificationLogs)

export default router
