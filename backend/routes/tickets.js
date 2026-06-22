// routes/tickets.js
// Rotas para Tickets de Atendimento

import express from 'express'
import {
  getTickets,
  getTicketDetails,
  createTicket,
  updateTicket,
  addMessage,
  getTicketMessages,
  closeTicket,
  uploadTicketAttachment,
  getTicketAttachments,
  deleteTicketAttachment,
} from '../controllers/ticketController.js'
import { verifyToken } from '../middleware/auth.js'
import { upload, handleUploadError } from '../middleware/upload.js'

const router = express.Router()

// Aplicar middleware de autenticação
router.use(verifyToken)

/**
 * GET /tickets
 * Listar tickets do usuário autenticado
 * Query: { status: 'open' | 'closed' | 'all', priority: 'low' | 'medium' | 'high' | 'urgent' | 'all', page: 1, limit: 20 }
 * Response: { tickets: [...], total, page, limit, pages }
 */
router.get('/', getTickets)

/**
 * GET /tickets/:id
 * Obter detalhes completos de um ticket (inclui mensagens)
 * Response: { id, ticket_number, title, description, ..., ticket_messages: [...] }
 */
router.get('/:id', getTicketDetails)

/**
 * POST /tickets
 * Criar novo ticket de atendimento
 * Body: { title, description, category, priority: 'medium', tags: [] }
 * Response: { message, ticket: { id, ticket_number, ... } }
 */
router.post('/', createTicket)

/**
 * PUT /tickets/:id
 * Atualizar ticket
 * Body: { title?, description?, category?, priority?, status?, tags? }
 * Response: { message, ticket }
 */
router.put('/:id', updateTicket)

/**
 * POST /tickets/:id/messages
 * Adicionar mensagem ao ticket
 * Body: { message, attachments: [], is_internal: false }
 * Response: { message, data: { id, user_id, message, ... } }
 */
router.post('/:id/messages', addMessage)

/**
 * GET /tickets/:id/messages
 * Listar mensagens do ticket
 * Query: { page: 1, limit: 50 }
 * Response: { messages: [...], total, page, limit }
 */
router.get('/:id/messages', getTicketMessages)

/**
 * POST /tickets/:id/attachments
 * Upload de múltiplos anexos ao ticket
 * Form-Data: { files: File[] }
 * Response: { message, attachments: [...] }
 */
router.post(
  '/:id/attachments',
  upload.array('files', 5),
  handleUploadError,
  uploadTicketAttachment
)

/**
 * GET /tickets/:id/attachments
 * Listar anexos do ticket
 * Response: { attachments: [...], count }
 */
router.get('/:id/attachments', getTicketAttachments)

/**
 * DELETE /tickets/:id/attachments/:attachmentId
 * Deletar anexo específico
 * Response: { message }
 */
router.delete('/:id/attachments/:attachmentId', deleteTicketAttachment)

/**
 * DELETE /tickets/:id
 * Fechar ticket
 * Body: { resolution_notes?: string }
 * Response: { message, ticket }
 */
router.delete('/:id', closeTicket)

export default router
