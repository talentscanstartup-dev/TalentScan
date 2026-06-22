// routes/users.js
// Rotas de Gerenciamento de Usuários

import express from 'express'
import {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  getUserStats,
  deleteMyAccount,
} from '../controllers/userController.js'
import { requireAuth, requireAdmin, verifyToken } from '../middleware/auth.js'

const router = express.Router()

// Rotas protegidas (requerem admin)
router.get('/', requireAuth, requireAdmin, getAllUsers)
router.get('/stats', requireAuth, requireAdmin, getUserStats)
router.get('/:id', requireAuth, getUserById)
router.patch('/:id', requireAuth, updateUser)
router.patch('/:id/role', requireAuth, requireAdmin, updateUserRole)
router.patch('/:id/status', requireAuth, requireAdmin, toggleUserStatus)
// Rota LGPD - Excluir própria conta (candidato/usuário final)
router.delete('/me/delete-account', verifyToken, deleteMyAccount)

router.delete('/:id', requireAuth, requireAdmin, deleteUser)

export default router
