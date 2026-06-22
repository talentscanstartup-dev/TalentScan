// controllers/adminController.js
// Controller Administrativo - SUPER_ADMIN apenas

import { supabase } from '../config/supabase.js'
import { sendEmailNotification } from '../services/notificationService.js'
import { createAuditLog } from '../services/auditService.js'

/**
 * GET /admin/approvals
 * Listar solicitações de aprovação
 */
export const getPendingApprovals = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('approval_requests')
      .select(
        `
        id,
        company_id,
        user_id,
        status,
        requested_at,
        reviewed_at,
        review_notes,
        companies:company_id (
          id,
          company_name,
          cnpj,
          industry,
          contact_email,
          contact_phone,
          status
        ),
        users:user_id (
          id,
          email,
          full_name
        )
      `,
        { count: 'exact' }
      )

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: requests, count } = await query
      .order('requested_at', { ascending: false })
      .range(offset, offset + limit - 1)

    res.json({
      requests,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit),
    })
  } catch (error) {
    console.error('Get approvals error:', error)
    res.status(500).json({ error: 'Erro ao listar solicitacoes' })
  }
}

/**
 * POST /admin/approvals/:company_id/approve
 * Aprovar empresa
 */
export const approveCompany = async (req, res) => {
  try {
    const { company_id } = req.params
    const { notes = '' } = req.body

    // Obter dados da empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, owner_id, company_name, contact_email, status')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      return res.status(404).json({
        error: 'Empresa nao encontrada',
      })
    }

    if (company.status === 'approved') {
      return res.status(400).json({
        error: 'Empresa ja foi aprovada',
      })
    }

    // Atualizar status da empresa para approved
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: req.user.id,
      })
      .eq('id', company_id)

    if (updateError) {
      return res.status(500).json({
        error: 'Erro ao atualizar status',
      })
    }

    // Atualizar approval request
    await supabase
      .from('approval_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user.id,
        review_notes: notes,
      })
      .eq('company_id', company_id)

    // Criar notificação in-app
    await supabase.from('notifications').insert({
      user_id: company.owner_id,
      company_id: company_id,
      type: 'approval_status',
      title: 'Empresa Aprovada',
      message: `Parabens! Sua empresa ${company.company_name} foi aprovada. Acesso total ao dashboard agora disponivel.`,
      data: {
        status: 'approved',
        company_id: company_id,
      },
    })

    // Enviar email para empresa
    await sendEmailNotification({
      to: company.contact_email,
      type: 'company_approved',
      data: {
        company_name: company.company_name,
        dashboard_url: process.env.FRONTEND_URL + '/dashboard',
      },
    })

    // Log de auditoria
    await createAuditLog({
      user_id: req.user.id,
      action: 'company_approved',
      entity_type: 'company',
      entity_id: company_id,
      status: 'success',
      changes: {
        old_status: company.status,
        new_status: 'approved',
      },
      ip_address: req.ip,
    })

    res.json({
      message: 'Empresa aprovada com sucesso',
      company_id: company_id,
      status: 'approved',
      notification_sent: true,
    })
  } catch (error) {
    console.error('Approve company error:', error)
    res.status(500).json({ error: 'Erro ao aprovar empresa' })
  }
}

/**
 * POST /admin/approvals/:company_id/reject
 * Rejeitar empresa
 */
export const rejectCompany = async (req, res) => {
  try {
    const { company_id } = req.params
    const { rejection_reason = 'Solicitacao recusada' } = req.body

    // Obter dados da empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, owner_id, company_name, contact_email, status')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      return res.status(404).json({
        error: 'Empresa nao encontrada',
      })
    }

    // Atualizar status para rejected
    const { error: updateError } = await supabase
      .from('companies')
      .update({
        status: 'rejected',
        rejection_reason: rejection_reason,
        approved_by: req.user.id,
      })
      .eq('id', company_id)

    if (updateError) {
      return res.status(500).json({
        error: 'Erro ao atualizar status',
      })
    }

    // Atualizar approval request
    await supabase
      .from('approval_requests')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: req.user.id,
        review_notes: rejection_reason,
      })
      .eq('company_id', company_id)
      .eq('status', 'pending')

    // Criar notificação in-app
    await supabase.from('notifications').insert({
      user_id: company.owner_id,
      company_id: company_id,
      type: 'approval_status',
      title: 'Solicitacao Recusada',
      message: `Sua solicitacao foi recusada. Motivo: ${rejection_reason}`,
      data: {
        status: 'rejected',
        reason: rejection_reason,
      },
    })

    // Enviar email
    await sendEmailNotification({
      to: company.contact_email,
      type: 'company_rejected',
      data: {
        company_name: company.company_name,
        reason: rejection_reason,
      },
    })

    // Log de auditoria
    await createAuditLog({
      user_id: req.user.id,
      action: 'company_rejected',
      entity_type: 'company',
      entity_id: company_id,
      status: 'success',
      changes: {
        old_status: company.status,
        new_status: 'rejected',
      },
      ip_address: req.ip,
    })

    res.json({
      message: 'Empresa rejeitada',
      company_id: company_id,
      status: 'rejected',
    })
  } catch (error) {
    console.error('Reject company error:', error)
    res.status(500).json({ error: 'Erro ao rejeitar empresa' })
  }
}

/**
 * POST /admin/companies/:company_id/suspend
 * Suspender empresa
 */
export const suspendCompany = async (req, res) => {
  try {
    const { company_id } = req.params
    const { reason = 'Violacao de termos' } = req.body

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, owner_id, company_name, contact_email')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      return res.status(404).json({ error: 'Empresa nao encontrada' })
    }

    // Suspender
    await supabase
      .from('companies')
      .update({ status: 'suspended' })
      .eq('id', company_id)

    // Notificacao
    await supabase.from('notifications').insert({
      user_id: company.owner_id,
      company_id: company_id,
      type: 'suspension',
      title: 'Empresa Suspensa',
      message: `Sua empresa foi suspensa. Motivo: ${reason}`,
    })

    // Email
    await sendEmailNotification({
      to: company.contact_email,
      type: 'company_suspended',
      data: { company_name: company.company_name, reason },
    })

    // Log
    await createAuditLog({
      user_id: req.user.id,
      action: 'company_suspended',
      entity_type: 'company',
      entity_id: company_id,
      status: 'success',
      changes: { reason },
      ip_address: req.ip,
    })

    res.json({
      message: 'Empresa suspensa com sucesso',
      company_id,
      status: 'suspended',
    })
  } catch (error) {
    console.error('Suspend company error:', error)
    res.status(500).json({ error: 'Erro ao suspender empresa' })
  }
}

/**
 * GET /admin/users
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, status = 'active', page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('users')
      .select('id, email, full_name, role, status, created_at, last_login', {
        count: 'exact',
      })

    if (role) {
      query = query.eq('role', role)
    }

    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    const { data: users, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    res.json({
      users,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
    })
  } catch (error) {
    console.error('Get all users error:', error)
    res.status(500).json({ error: 'Erro ao listar usuarios' })
  }
}

/**
 * GET /admin/users/:user_id
 */
export const getUserDetails = async (req, res) => {
  try {
    const { user_id } = req.params

    const { data: user, error } = await supabase
      .from('users')
      .select(
        `
        *,
        companies:company_id (*)
      `
      )
      .eq('id', user_id)
      .single()

    if (error || !user) {
      return res.status(404).json({ error: 'Usuario nao encontrado' })
    }

    res.json(user)
  } catch (error) {
    console.error('Get user details error:', error)
    res.status(500).json({ error: 'Erro ao obter detalhes do usuario' })
  }
}

/**
 * GET /admin/companies
 */
export const getAllCompanies = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('companies')
      .select('*, users:owner_id(email, full_name)', { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: companies, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    res.json({
      companies,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
    })
  } catch (error) {
    console.error('Get all companies error:', error)
    res.status(500).json({ error: 'Erro ao listar empresas' })
  }
}

/**
 * GET /admin/stats
 */
export const getSystemStats = async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: totalCompanies },
      { count: pendingApprovals },
      { count: approvedCompanies },
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('companies').select('id', { count: 'exact' }),
      supabase
        .from('approval_requests')
        .select('id', { count: 'exact' })
        .eq('status', 'pending'),
      supabase
        .from('companies')
        .select('id', { count: 'exact' })
        .eq('status', 'approved'),
    ])

    res.json({
      total_users: totalUsers,
      total_companies: totalCompanies,
      pending_approvals: pendingApprovals,
      approved_companies: approvedCompanies,
      system_health: 'operational',
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Erro ao obter estatisticas' })
  }
}

/**
 * GET /admin/logs
 */
export const getAuditLogs = async (req, res) => {
  try {
    const { action, entity_type, page = 1, limit = 50 } = req.query
    const offset = (page - 1) * limit

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })

    if (action) {
      query = query.eq('action', action)
    }

    if (entity_type) {
      query = query.eq('entity_type', entity_type)
    }

    const { data: logs, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    res.json({
      logs,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
    })
  } catch (error) {
    console.error('Get audit logs error:', error)
    res.status(500).json({ error: 'Erro ao obter logs' })
  }
}

/**
 * POST /admin/notifications
 */
export const sendNotification = async (req, res) => {
  try {
    const { user_id, company_id, title, message, type } = req.body

    const { error } = await supabase.from('notifications').insert({
      user_id,
      company_id,
      title,
      message,
      type,
    })

    if (error) {
      return res.status(500).json({ error: 'Erro ao enviar notificacao' })
    }

    res.json({ message: 'Notificacao enviada' })
  } catch (error) {
    console.error('Send notification error:', error)
    res.status(500).json({ error: 'Erro' })
  }
}

/**
 * GET /admin/notifications/logs
 */
export const getNotificationLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const offset = (page - 1) * limit

    const { data: logs, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    res.json({
      logs,
      total: count,
      page: parseInt(page),
    })
  } catch (error) {
    console.error('Get notification logs error:', error)
    res.status(500).json({ error: 'Erro ao buscar logs de notificação' })
  }
}

/**
 * GET /admin/ollama-status
 * Verifica a saúde do motor de inteligência artificial (Ollama)
 */
export const getOllamaStatus = async (req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:11434/api/tags');
    if (!response.ok) throw new Error('Ollama not responding properly');
    
    const data = await response.json();
    
    return res.json({
      success: true,
      status: 'online',
      models: data.models || [],
      message: 'Motor de IA Local operando normalmente.'
    });
  } catch (error) {
    return res.json({
      success: true,
      status: 'offline',
      models: [],
      error: error.message,
      message: 'Não foi possível conectar ao Ollama. Verifique se o serviço está rodando.'
    });
  }
}
