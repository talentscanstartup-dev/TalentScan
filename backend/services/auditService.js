// services/auditService.js
// Serviço de Auditoria - Log de todas as ações importantes

import { supabase } from '../config/supabase.js'

/**
 * Criar entry de auditoria
 * Registra todas as ações do sistema
 */
export const createAuditLog = async ({
  user_id = null,
  action,
  entity_type,
  entity_id = null,
  changes = {},
  ip_address = null,
  user_agent = null,
  status = 'success',
  error_message = null,
}) => {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      user_id,
      action,
      entity_type,
      entity_id,
      changes,
      ip_address,
      user_agent,
      status,
      error_message,
    })

    if (error) {
      console.error('Audit log creation error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Audit log error:', error)
    return false
  }
}

/**
 * Ações comuns de auditoria
 */
export const auditActions = {
  // User actions
  USER_REGISTERED: 'user_registered',
  USER_REGISTERED_AS_CLIENT: 'user_registered_as_client',
  USER_REGISTERED_AS_COMPANY: 'user_registered_as_company',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_PROFILE_UPDATED: 'user_profile_updated',
  USER_DEACTIVATED: 'user_deactivated',
  USER_ACTIVATED: 'user_activated',

  // Company actions
  COMPANY_REGISTERED: 'company_registered',
  COMPANY_APPROVED: 'company_approved',
  COMPANY_REJECTED: 'company_rejected',
  COMPANY_SUSPENDED: 'company_suspended',
  COMPANY_PROFILE_UPDATED: 'company_profile_updated',
  COMPANY_STATUS_CHANGED: 'company_status_changed',

  // Team actions
  TEAM_MEMBER_ADDED: 'team_member_added',
  TEAM_MEMBER_REMOVED: 'team_member_removed',
  TEAM_MEMBER_ROLE_CHANGED: 'team_member_role_changed',

  // Access attempts
  UNAUTHORIZED_ACCESS_ATTEMPT: 'unauthorized_access_attempt',
  ACCESS_PENDING_COMPANY: 'access_pending_company',
  UNAUTHORIZED_COMPANY_ACCESS: 'unauthorized_company_access',

  // Admin actions
  APPROVAL_GRANTED: 'approval_granted',
  APPROVAL_DENIED: 'approval_denied',
  COMPANY_SUSPENDED_BY_ADMIN: 'company_suspended_by_admin',
  SYSTEM_SETTING_CHANGED: 'system_setting_changed',

  // CV/File actions
  CV_UPLOADED: 'cv_uploaded',
  CV_ANALYZED: 'cv_analyzed',
  CV_DELETED: 'cv_deleted',

  // Security actions
  PASSWORD_CHANGED: 'password_changed',
  EMAIL_VERIFIED: 'email_verified',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
}

/**
 * Exemplo de uso:
 * 
 * await createAuditLog({
 *   user_id: req.user.id,
 *   action: auditActions.COMPANY_APPROVED,
 *   entity_type: 'company',
 *   entity_id: company.id,
 *   changes: {
 *     old_status: 'pending_approval',
 *     new_status: 'approved',
 *   },
 *   ip_address: req.ip,
 *   user_agent: req.get('user-agent'),
 *   status: 'success',
 * })
 */

/**
 * Obter logs de auditoria
 */
export const getAuditLogs = async ({
  action = null,
  entity_type = null,
  user_id = null,
  limit = 100,
  offset = 0,
}) => {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')

    if (action) {
      query = query.eq('action', action)
    }

    if (entity_type) {
      query = query.eq('entity_type', entity_type)
    }

    if (user_id) {
      query = query.eq('user_id', user_id)
    }

    const { data: logs, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return logs
  } catch (error) {
    console.error('Get audit logs error:', error)
    return []
  }
}

/**
 * Obter logs de um usuário específico
 */
export const getUserAuditTrail = async (user_id, limit = 50) => {
  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return logs
  } catch (error) {
    console.error('User audit trail error:', error)
    return []
  }
}

/**
 * Obter logs de uma empresa
 */
export const getCompanyAuditTrail = async (company_id, limit = 50) => {
  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_id', company_id)
      .eq('entity_type', 'company')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return logs
  } catch (error) {
    console.error('Company audit trail error:', error)
    return []
  }
}

/**
 * Detectar atividades suspeitas
 */
export const detectSuspiciousActivity = async ({
  user_id,
  ip_address,
  action,
  timestamp,
}) => {
  try {
    // Buscar tentativas de login falhadas nos últimos 15 minutos
    const fifteenMinutesAgo = new Date(timestamp - 15 * 60 * 1000)

    const { data: failedAttempts, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', user_id)
      .eq('action', 'user_login')
      .eq('status', 'failed')
      .gte('created_at', fifteenMinutesAgo.toISOString())

    if (error) {
      return false
    }

    // Se mais de 5 tentativas falhadas, registrar como suspeito
    if (failedAttempts && failedAttempts.length >= 5) {
      await createAuditLog({
        user_id,
        action: auditActions.SUSPICIOUS_ACTIVITY,
        entity_type: 'user',
        entity_id: user_id,
        changes: {
          failed_login_attempts: failedAttempts.length,
          ip_address,
        },
        ip_address,
        status: 'detected',
        error_message: 'Multiplas tentativas de login falhadas',
      })

      return true
    }

    return false
  } catch (error) {
    console.error('Suspicious activity detection error:', error)
    return false
  }
}
