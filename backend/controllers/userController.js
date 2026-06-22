// controllers/userController.js
// Controller de Gerenciamento de Usuários

import { supabase } from '../config/supabase.js'
import { createAuditLog } from '../services/auditService.js'

/**
 * GET /users
 * Lista todos os usuários (apenas para admins)
 */
export const getAllUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({
      success: true,
      total: users.length,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }))
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Erro ao listar usuários' })
  }
}

/**
 * GET /users/:id
 * Obter informações de um usuário específico
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        is_active: user.is_active,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ error: 'Erro ao obter usuário' })
  }
}

/**
 * PATCH /users/:id
 * Atualizar informações do usuário (perfil)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { full_name, avatar_url, status, role } = req.body

    const requesterId = req.user.id
    const requesterRole = req.user.role

    if (requesterId !== id && requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Você não pode atualizar o perfil de outro usuário.' })
    }

    if (requesterRole !== 'SUPER_ADMIN' && requesterRole !== 'ADMIN') {
      if (status !== undefined || role !== undefined) {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem alterar o status ou a role.' })
      }
    }

    // Preparar dados de atualização
    const updateData = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url
    if (status !== undefined) updateData.status = status
    if (role !== undefined) updateData.role = role

    updateData.updated_at = new Date()

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log de auditoria
    await createAuditLog({
      user_id: id,
      action: 'user_updated',
      entity_type: 'user',
      entity_id: id,
      status: 'success',
      ip_address: req.ip,
      details: { updated_fields: Object.keys(updateData) }
    })

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ error: 'Erro ao atualizar usuário' })
  }
}

/**
 * PATCH /users/:id/role
 * Alterar a role de um usuário (apenas admin)
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body

    const validRoles = ['CLIENT', 'COMPANY', 'ADMIN']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Role inválida' })
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ 
        role,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log de auditoria
    await createAuditLog({
      user_id: id,
      action: 'user_role_changed',
      entity_type: 'user',
      entity_id: id,
      status: 'success',
      ip_address: req.ip,
      details: { new_role: role }
    })

    res.json({
      success: true,
      message: `Role do usuário alterada para ${role}`,
      user: updatedUser
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    res.status(500).json({ error: 'Erro ao atualizar role' })
  }
}

/**
 * PATCH /users/:id/status
 * Ativar/desativar um usuário
 */
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { is_active } = req.body

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', id)
      .single()

    if (fetchError || !user) {
      return res.status(404).json({ error: 'Usuário não encontrado' })
    }

    const newStatus = is_active !== undefined ? is_active : !user.is_active

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ 
        is_active: newStatus,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log de auditoria
    await createAuditLog({
      user_id: id,
      action: 'user_status_changed',
      entity_type: 'user',
      entity_id: id,
      status: 'success',
      ip_address: req.ip,
      details: { new_status: newStatus ? 'active' : 'inactive' }
    })

    res.json({
      success: true,
      message: `Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso`,
      user: updatedUser
    })
  } catch (error) {
    console.error('Error toggling user status:', error)
    res.status(500).json({ error: 'Erro ao atualizar status' })
  }
}

/**
 * DELETE /users/:id
 * Deletar um usuário
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    // Primeiro deletar do banco de dados
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (dbError) throw dbError

    // Deletar do Supabase Auth
    try {
      await supabase.auth.admin.deleteUser(id)
    } catch (authError) {
      console.error('Erro ao deletar usuário do Supabase Auth:', authError)
    }

    // Log de auditoria
    await createAuditLog({
      user_id: id,
      action: 'user_deleted',
      entity_type: 'user',
      entity_id: id,
      status: 'success',
      ip_address: req.ip,
    })

    res.json({
      success: true,
      message: 'Usuário deletado com sucesso'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Erro ao deletar usuário' })
  }
}

/**
 * GET /users/stats
 * Obter estatísticas de usuários
 */
export const getUserStats = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('role, is_active')

    if (error) throw error

    const stats = {
      total: users.length,
      active: users.filter(u => u.is_active).length,
      inactive: users.filter(u => !u.is_active).length,
      clients: users.filter(u => u.role === 'CLIENT').length,
      companies: users.filter(u => u.role === 'COMPANY').length,
      admins: users.filter(u => u.role === 'ADMIN').length,
    }

    res.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    res.status(500).json({ error: 'Erro ao obter estatísticas' })
  }
}

/**
 * DELETE /users/me/delete-account
 * Permite ao candidato excluir sua própria conta permanentemente (LGPD)
 */
export const deleteMyAccount = async (req, res) => {
  try {
    const userId = req.user.id

    // 1. Log de auditoria (feito antes de excluir para garantir que o user_id ainda existe e é válido)
    await createAuditLog({
      user_id: userId,
      action: 'account_deleted_by_user',
      entity_type: 'user',
      entity_id: userId,
      status: 'success',
      ip_address: req.ip,
      error_message: 'Account permanently deleted by user (LGPD)'
    })

    // 2. Buscar informações do usuário para deletar arquivos associados (ex: foto de perfil)
    const { data: user } = await supabase
      .from('users')
      .select('profile_picture_url')
      .eq('id', userId)
      .single()

    if (user && user.profile_picture_url) {
      try {
        // Extrair o nome do arquivo da URL (se aplicável ao padrão do Supabase Storage)
        const urlParts = user.profile_picture_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        
        if (fileName) {
          await supabase.storage.from('profiles').remove([fileName])
        }
      } catch (storageError) {
        console.error('Erro ao deletar foto de perfil:', storageError)
        // Ignora erro de storage para não impedir a deleção da conta
      }
    }

    // 3. Deletar registros da tabela candidates (mesmo que o CASCADE faça isso, é explícito como solicitado)
    await supabase.from('candidates').delete().eq('user_id', userId)

    // 4. Deletar usuário da tabela users (os cascades resolverão job_positions, cvs, matches, etc)
    const { error: dbError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (dbError) throw dbError

    // 5. Deletar do Supabase Auth usando o admin auth client (Service Role necessário)
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      if (authError) {
         console.error('Erro ao deletar auth user:', authError)
         // Dependendo do ambiente, se a service_role não estiver ativa para auth.admin, isso pode falhar.
      }
    } catch (authCatchErr) {
      console.error('Erro inesperado ao deletar auth user:', authCatchErr)
    }

    res.json({
      success: true,
      message: 'Conta e todos os dados associados foram excluídos permanentemente.'
    })
  } catch (error) {
    console.error('Error deleting account (LGPD):', error)
    // Deixa o middleware errorHandler.js global cuidar ou retorna 500
    res.status(500).json({ error: 'Erro interno ao excluir a conta.' })
  }
}
