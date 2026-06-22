// controllers/ticketController.js
// Controller para Tickets de Atendimento

import { supabase } from '../config/supabase.js'
import { createAuditLog } from '../services/auditService.js'
import { sendEmailNotification } from '../services/notificationService.js'

// Gerar número único de ticket
const generateTicketNumber = async () => {
  const prefix = 'TK'
  let attempts = 0
  
  while (attempts < 10) {
    const date = new Date()
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0')
    const ticketNumber = `${prefix}${dateStr}${random}`
    
    // Verificar se já existe no banco
    const { data, error } = await supabase
      .from('support_tickets')
      .select('id')
      .eq('ticket_number', ticketNumber)
      .maybeSingle()
      
    if (!data && !error) {
      return ticketNumber
    }
    attempts++
  }
  
  // Fallback seguro usando timestamp
  return `${prefix}${Date.now()}`
}

/**
 * GET /tickets
 * Listar tickets do usuário
 */
export const getTickets = async (req, res) => {
  try {
    const userId = req.user.id
    const { status = 'all', priority = 'all', page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('support_tickets')
      .select(
        `
        id,
        ticket_number,
        title,
        description,
        category,
        priority,
        status,
        assigned_to,
        tags,
        created_at,
        updated_at,
        users:assigned_to (id, email, full_name)
      `,
        { count: 'exact' }
      )

    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN') {
      query = query.eq('user_id', userId)
    }

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (priority !== 'all') {
      query = query.eq('priority', priority)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: tickets, count, error } = await query

    if (error) throw error

    res.json({
      tickets,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit),
    })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    res.status(500).json({ error: 'Erro ao buscar tickets' })
  }
}

/**
 * GET /tickets/:id
 * Obter detalhes de um ticket específico
 */
export const getTicketDetails = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const userRole = req.user.role

    let query = supabase
      .from('support_tickets')
      .select(
        `
        *,
        users:assigned_to (id, email, full_name),
        ticket_messages (
          id,
          user_id,
          message,
          attachments,
          is_internal,
          created_at,
          users (id, email, full_name)
        )
      `
      )
      .eq('id', id)

    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      query = query.eq('user_id', userId)
    }

    const { data: ticket, error } = await query.single()

    if (error) throw error
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' })
    }

    res.json(ticket)
  } catch (error) {
    console.error('Error fetching ticket details:', error)
    res.status(500).json({ error: 'Erro ao buscar detalhes do ticket' })
  }
}

/**
 * POST /tickets
 * Criar novo ticket
 */
export const createTicket = async (req, res) => {
  try {
    const userId = req.user.id
    const { title, description, category, priority = 'medium', tags = [] } = req.body

    // Validação
    if (!title || !description || !category) {
      return res.status(400).json({
        error: 'Campos obrigatórios: title, description, category',
      })
    }

    const ticketNumber = await generateTicketNumber()

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        ticket_number: ticketNumber,
        title,
        description,
        category,
        priority,
        tags,
        status: 'open',
      })
      .select()
      .single()

    if (error) throw error

    // Log de auditoria
    await createAuditLog({
      user_id: userId,
      action: 'create_ticket',
      entity_type: 'ticket',
      entity_id: ticket.id,
      changes: {
        ticket_number: ticketNumber,
      },
      ip_address: req.ip,
    })

    // Notificar administrador
    await sendEmailNotification({
      to: 'admin@talentscan.com',
      subject: 'Novo Ticket Criado',
      html: `Um novo ticket foi criado: ${ticketNumber} - ${title}`
    })

    res.status(201).json({
      message: 'Ticket criado com sucesso',
      ticket,
    })
  } catch (error) {
    console.error('Error creating ticket:', error)
    res.status(500).json({ error: 'Erro ao criar ticket' })
  }
}

/**
 * PUT /tickets/:id
 * Atualizar ticket
 */
export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const { title, description, category, priority, status, tags } = req.body

    // Verificar se o ticket pertence ao usuário
    const { data: ticket, error: fetchError } = await supabase
      .from('support_tickets')
      .select('id, user_id')
      .eq('id', id)
      .single()

    if (fetchError || !ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' })
    }

    if (ticket.user_id !== userId) {
      return res.status(403).json({ error: 'Sem permissão para atualizar este ticket' })
    }

    const updateData = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (priority !== undefined) updateData.priority = priority
    if (status !== undefined) updateData.status = status
    if (tags !== undefined) updateData.tags = tags
    updateData.updated_at = new Date().toISOString()

    const { data: updated, error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log de auditoria
    await createAuditLog({
      user_id: userId,
      action: 'update_ticket',
      entity_type: 'ticket',
      entity_id: id,
      changes: updateData,
      ip_address: req.ip,
    })

    res.json({
      message: 'Ticket atualizado com sucesso',
      ticket: updated,
    })
  } catch (error) {
    console.error('Error updating ticket:', error)
    res.status(500).json({ error: 'Erro ao atualizar ticket' })
  }
}

/**
 * POST /tickets/:id/messages
 * Adicionar mensagem ao ticket
 */
export const addMessage = async (req, res) => {
  try {
    const { id: ticketId } = req.params
    const userId = req.user.id
    const { message, attachments = [], is_internal = false } = req.body

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Mensagem não pode estar vazia' })
    }

    // Verificar se o ticket existe
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, user_id, assigned_to')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' })
    }

    // Adicionar mensagem
    const { data: newMessage, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        user_id: userId,
        message: message.trim(),
        attachments,
        is_internal,
      })
      .select()
      .single()

    if (error) throw error

    // Atualizar data de atualização do ticket
    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId)

    res.status(201).json({
      message: 'Mensagem adicionada com sucesso',
      data: newMessage,
    })
  } catch (error) {
    console.error('Error adding message:', error)
    res.status(500).json({ error: 'Erro ao adicionar mensagem' })
  }
}

/**
 * GET /tickets/:id/messages
 * Obter mensagens de um ticket
 */
export const getTicketMessages = async (req, res) => {
  try {
    const { id: ticketId } = req.params
    const { page = 1, limit = 50 } = req.query
    const offset = (page - 1) * limit

    const { data: messages, count, error } = await supabase
      .from('ticket_messages')
      .select(
        `
        *,
        users (id, email, full_name)
      `,
        { count: 'exact' }
      )
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) throw error

    res.json({
      messages,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
    })
  } catch (error) {
    console.error('Error fetching ticket messages:', error)
    res.status(500).json({ error: 'Erro ao buscar mensagens' })
  }
}

/**
 * DELETE /tickets/:id
 * Fechar ticket
 */
export const closeTicket = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const { resolution_notes } = req.body

    const { data: updated, error } = await supabase
      .from('support_tickets')
      .update({
        status: 'closed',
        resolved_at: new Date().toISOString(),
        resolution_notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    await createAuditLog({
      user_id: userId,
      action: 'close_ticket',
      entity_type: 'ticket',
      entity_id: id,
      ip_address: req.ip,
    })

    res.json({ message: 'Ticket fechado com sucesso', ticket: updated })
  } catch (error) {
    console.error('Error closing ticket:', error)
    res.status(500).json({ error: 'Erro ao fechar ticket' })
  }
}

/**
 * POST /tickets/:id/attachments
 * Upload de anexos ao ticket
 */
export const uploadTicketAttachment = async (req, res) => {
  try {
    const { id: ticketId } = req.params
    const userId = req.user.id

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo foi enviado' })
    }

    // Verificar se o ticket existe e pertence ao usuário
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, user_id, ticket_number')
      .eq('id', ticketId)
      .eq('user_id', userId)
      .single()

    if (ticketError || !ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' })
    }

    // Preparar dados dos attachments
    const attachments = req.files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/api/tickets/${ticketId}/attachments/${file.filename}`,
      uploadedAt: new Date().toISOString(),
    }))

    // Salvar attachments na tabela ticket_attachments
    const { data: savedAttachments, error } = await supabase
      .from('ticket_attachments')
      .insert(
        attachments.map((att) => ({
          ticket_id: ticketId,
          filename: att.filename,
          original_name: att.originalName,
          mimetype: att.mimetype,
          size: att.size,
          path: att.path,
        }))
      )
      .select()

    if (error) throw error

    // Log de auditoria
    await createAuditLog({
      user_id: userId,
      action: 'upload_attachment',
      entity_type: 'ticket',
      entity_id: ticketId,
      changes: {
        files_count: req.files.length,
      },
      ip_address: req.ip,
    })

    res.status(201).json({
      message: `${req.files.length} arquivo(s) enviado(s) com sucesso`,
      attachments: savedAttachments,
    })
  } catch (error) {
    console.error('Error uploading attachment:', error)
    res.status(500).json({ error: 'Erro ao fazer upload do arquivo' })
  }
}

/**
 * GET /tickets/:id/attachments
 * Obter lista de anexos do ticket
 */
export const getTicketAttachments = async (req, res) => {
  try {
    const { id: ticketId } = req.params
    const userId = req.user.id

    // Verificar se o ticket pertence ao usuário
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, user_id')
      .eq('id', ticketId)
      .eq('user_id', userId)
      .single()

    if (ticketError || !ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' })
    }

    // Buscar attachments
    const { data: attachments, error } = await supabase
      .from('ticket_attachments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({
      attachments: attachments || [],
      count: attachments?.length || 0,
    })
  } catch (error) {
    console.error('Error fetching attachments:', error)
    res.status(500).json({ error: 'Erro ao buscar anexos' })
  }
}

/**
 * DELETE /tickets/:id/attachments/:attachmentId
 * Deletar anexo
 */
export const deleteTicketAttachment = async (req, res) => {
  try {
    const { id: ticketId, attachmentId } = req.params
    const userId = req.user.id

    // Verificar se o ticket pertence ao usuário
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('id, user_id')
      .eq('id', ticketId)
      .eq('user_id', userId)
      .single()

    if (ticketError || !ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' })
    }

    // Buscar attachment para obter o caminho do arquivo
    const { data: attachment, error: attachError } = await supabase
      .from('ticket_attachments')
      .select('id, filename, path')
      .eq('id', attachmentId)
      .eq('ticket_id', ticketId)
      .single()

    if (attachError || !attachment) {
      return res.status(404).json({ error: 'Anexo não encontrado' })
    }

    // Deletar arquivo do disco (opcional, implementar conforme necessário)
    // await deleteFile(attachment.path)

    // Deletar registro do banco
    const { error: delError } = await supabase
      .from('ticket_attachments')
      .delete()
      .eq('id', attachmentId)

    if (delError) throw delError

    // Log de auditoria
    await createAuditLog({
      user_id: userId,
      action: 'delete_attachment',
      entity_type: 'ticket',
      entity_id: ticketId,
      changes: {
        attachment_id: attachmentId,
      },
      ip_address: req.ip,
    })

    res.json({ message: 'Anexo deletado com sucesso' })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    res.status(500).json({ error: 'Erro ao deletar anexo' })
  }
}
