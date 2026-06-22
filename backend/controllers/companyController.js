// controllers/companyController.js
// Controller de Gerenciamento de Empresas

import { supabase } from '../config/supabase.js'
import { createAuditLog } from '../services/auditService.js'

/**
 * GET /company/status
 * Obter status de aprovação da empresa
 */
export const getApprovalStatus = async (req, res) => {
  try {
    const userId = req.user.id

    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, status, logo_url')
      .eq('owner_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (!company) {
      return res.status(200).json({ status: 'no_company' })
    }

    res.json({
      success: true,
      company_id: company.id,
      name: company.name,
      status: company.status,
      logo_url: company.logo_url
    })
  } catch (error) {
    console.error('Error fetching approval status:', error)
    res.status(500).json({ error: 'Erro ao buscar status de aprovação' })
  }
}

/**
 * GET /company/dashboard
 * Obter dados do dashboard da empresa
 */
export const getCompanyDashboard = async (req, res) => {
  try {
    const userId = req.user.id

    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', userId)
      .single()

    if (error) throw error

    // Buscar algumas estatísticas simples
    const { count: jobCount } = await supabase
      .from('job_positions')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)

    res.json({
      success: true,
      company,
      stats: {
        jobs_count: jobCount || 0,
        candidates_count: 0,
        matches_count: 0
      }
    })
  } catch (error) {
    console.error('Error fetching company dashboard:', error)
    res.status(500).json({ error: 'Erro ao buscar dashboard da empresa' })
  }
}

/**
 * PUT /company/profile
 * Atualizar perfil da empresa
 */
export const updateCompanyProfile = async (req, res) => {
  try {
    const userId = req.user.id
    const { name, description, website, industry, company_size, contact_phone, address } = req.body

    const { data: company, error: findError } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', userId)
      .single()

    if (findError) throw findError

    const { data: updatedCompany, error } = await supabase
      .from('companies')
      .update({
        name,
        description,
        website,
        industry,
        company_size,
        contact_phone,
        address,
        updated_at: new Date()
      })
      .eq('id', company.id)
      .select()
      .single()

    if (error) throw error

    res.json({
      success: true,
      company: updatedCompany
    })
  } catch (error) {
    console.error('Error updating company profile:', error)
    res.status(500).json({ error: 'Erro ao atualizar perfil da empresa' })
  }
}

/**
 * GET /company/metrics
 * Obter métricas da empresa
 */
export const getCompanyMetrics = async (req, res) => {
  try {
    const userId = req.user.id

    const { data: company, error } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', userId)
      .single()

    if (error) throw error

    res.json({
      success: true,
      metrics: {
        cvs_processed: 0,
        success_rate: 100,
        candidates_found: 0,
        team_size: 1,
        storage_used: 0
      }
    })
  } catch (error) {
    console.error('Error fetching company metrics:', error)
    res.status(500).json({ error: 'Erro ao buscar métricas da empresa' })
  }
}

/**
 * GET /company/settings
 * Obter configurações da empresa
 */
export const getCompanySettings = async (req, res) => {
  try {
    const userId = req.user.id

    const { data: company, error } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', userId)
      .single()

    if (error) throw error

    res.json({
      success: true,
      settings: {
        notification_email: req.user.email,
        api_key_rotation: false,
        privacy_settings: {}
      }
    })
  } catch (error) {
    console.error('Error fetching company settings:', error)
    res.status(500).json({ error: 'Erro ao buscar configurações da empresa' })
  }
}

/**
 * PUT /company/settings
 * Atualizar configurações da empresa
 */
export const updateCompanySettings = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Configurações atualizadas'
    })
  } catch (error) {
    console.error('Error updating company settings:', error)
    res.status(500).json({ error: 'Erro ao atualizar configurações' })
  }
}

/**
 * GET /company/members
 * Listar membros da equipe
 */
export const getCompanyMembers = async (req, res) => {
  try {
    const userId = req.user.id

    const { data: company, error } = await supabase
      .from('companies')
      .select('id')
      .eq('owner_id', userId)
      .single()

    if (error) throw error

    // Buscar usuários associados a essa empresa
    const { data: members, error: membersError } = await supabase
      .from('users')
      .select('id, email, role, full_name, created_at')
      .eq('company_id', company.id)

    if (membersError) throw membersError

    res.json({
      success: true,
      members: members || []
    })
  } catch (error) {
    console.error('Error fetching company members:', error)
    res.status(500).json({ error: 'Erro ao buscar membros da equipe' })
  }
}

/**
 * POST /company/members
 * Adicionar membro à equipe
 */
export const addTeamMember = async (req, res) => {
  try {
    res.status(501).json({ error: 'Funcionalidade não implementada' })
  } catch (error) {
    console.error('Error adding team member:', error)
    res.status(500).json({ error: 'Erro ao adicionar membro' })
  }
}

/**
 * DELETE /company/members/:member_id
 * Remover membro da equipe
 */
export const removeTeamMember = async (req, res) => {
  try {
    res.status(501).json({ error: 'Funcionalidade não implementada' })
  } catch (error) {
    console.error('Error removing team member:', error)
    res.status(500).json({ error: 'Erro ao remover membro' })
  }
}

/**
 * POST /company/logo
 * Upload de logo da empresa
 */
export const uploadCompanyLogo = async (req, res) => {
  try {
    res.status(501).json({ error: 'Upload não implementado no backend local' })
  } catch (error) {
    console.error('Error uploading logo:', error)
    res.status(500).json({ error: 'Erro ao fazer upload da logo' })
  }
}
