// controllers/authController.js
// Controller de Autenticação com Fluxo RBAC

import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { supabase } from '../config/supabase.js'
import { sendEmailNotification } from '../services/notificationService.js'
import { createAuditLog } from '../services/auditService.js'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRY = '7d'

/**
 * POST /auth/register/client
 * Registro como Cliente
 * Cria usuário imediatamente com status active e role CLIENT
 */
export const registerAsClient = async (req, res) => {
  try {
    const { email, password, full_name } = req.body

    // Validações
    if (!email || !password || !full_name) {
      return res.status(400).json({
        error: 'Email, senha e nome completo sao obrigatorios',
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Senha deve ter pelo menos 6 caracteres',
      })
    }

    // Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return res.status(409).json({
        error: 'Email ja registrado',
      })
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUpWithPassword({
      email,
      password,
    })

    if (authError) {
      return res.status(400).json({ error: authError.message })
    }

    const userId = authData.user.id

    // Criar perfil do usuário no banco de dados
    const { error: dbError } = await supabase.from('users').insert({
      id: userId,
      email,
      full_name,
      role: 'CLIENT',
      status: 'active',
      is_active: true,
    })

    if (dbError) {
      return res.status(500).json({
        error: 'Erro ao criar perfil do usuario',
      })
    }

    // Gerar JWT token
    const token = jwt.sign(
      { sub: userId, email, role: 'CLIENT' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    )

    // Log de auditoria
    await createAuditLog({
      user_id: userId,
      action: 'user_registered_as_client',
      entity_type: 'user',
      entity_id: userId,
      status: 'success',
      ip_address: req.ip,
    })

    // Enviar email de boas-vindas
    await sendEmailNotification({
      to: email,
      type: 'welcome',
      data: { full_name, role: 'CLIENT' },
    })

    res.status(201).json({
      message: 'Cliente registrado com sucesso',
      token,
      user: {
        id: userId,
        email,
        full_name,
        role: 'CLIENT',
        status: 'active',
      },
    })
  } catch (error) {
    console.error('Client registration error:', error)
    res.status(500).json({ error: 'Erro ao registrar cliente' })
  }
}

/**
 * POST /auth/register/company
 * Registro como Empresa
 * Cria usuário + empresa com status pending_approval
 * Gera alerta para Super Admin
 */
export const registerAsCompany = async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      company_name,
      cnpj,
      industry,
      company_size,
      contact_email,
      contact_phone,
    } = req.body

    // Validações
    if (!email || !password || !full_name || !company_name || !contact_email) {
      return res.status(400).json({
        error: 'Dados obrigatorios faltando',
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Senha deve ter pelo menos 6 caracteres',
      })
    }

    // Verificar se email já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return res.status(409).json({
        error: 'Email ja registrado',
      })
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUpWithPassword({
      email,
      password,
    })

    if (authError) {
      return res.status(400).json({ error: authError.message })
    }

    const userId = authData.user.id

    // Criar usuário no banco
    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      email,
      full_name,
      role: 'COMPANY',
      status: 'pending_approval',
      is_active: true,
    })

    if (userError) {
      return res.status(500).json({
        error: 'Erro ao criar perfil do usuario',
      })
    }

    // Criar registro de empresa
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({
        owner_id: userId,
        company_name,
        cnpj,
        industry,
        company_size,
        contact_email,
        contact_phone,
        status: 'pending_approval',
      })
      .select('id')
      .single()

    if (companyError) {
      return res.status(500).json({
        error: 'Erro ao criar registro de empresa',
      })
    }

    // Criar approval request
    await supabase.from('approval_requests').insert({
      company_id: companyData.id,
      user_id: userId,
      status: 'pending',
    })

    // Gerar notificação para Super Admin
    const { data: superAdmins } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'SUPER_ADMIN')

    if (superAdmins && superAdmins.length > 0) {
      for (const admin of superAdmins) {
        await supabase.from('notifications').insert({
          user_id: admin.id,
          company_id: companyData.id,
          type: 'approval_status',
          title: 'Nova Solicitacao de Empresa',
          message: `${company_name} solicitou aprovacao. Revisar em: /admin/approvals`,
          data: {
            company_id: companyData.id,
            company_name,
            contact_email,
          },
        })
      }

      // Enviar email para Super Admin
      await sendEmailNotification({
        to: superAdmins[0].email,
        type: 'new_company_approval_request',
        data: {
          company_name,
          contact_email,
          company_id: companyData.id,
        },
      })
    }

    // Enviar email para empresa
    await sendEmailNotification({
      to: contact_email,
      type: 'company_registration_pending',
      data: {
        company_name,
        full_name,
      },
    })

    // Log de auditoria
    await createAuditLog({
      user_id: userId,
      action: 'company_registered',
      entity_type: 'company',
      entity_id: companyData.id,
      status: 'success',
      ip_address: req.ip,
    })

    res.status(201).json({
      message: 'Empresa registrada. Aguardando aprovacao do Super Admin.',
      company_id: companyData.id,
      user_id: userId,
      company_name,
      status: 'pending_approval',
      next_step: 'Voce recebera uma notificacao por email quando a solicitacao for revisada.',
    })
  } catch (error) {
    console.error('Company registration error:', error)
    res.status(500).json({ error: 'Erro ao registrar empresa' })
  }
}

/**
 * POST /auth/login
 * Login com email e senha
 * Funciona para todos os roles (CLIENT, COMPANY, SUPER_ADMIN)
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email e senha sao obrigatorios',
      })
    }

    // Autenticar no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword(
      email,
      password
    )

    if (authError) {
      return res.status(401).json({
        error: 'Email ou senha invalidos',
      })
    }

    const userId = authData.user.id

    // Obter dados do usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, status, company_id, is_active')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return res.status(401).json({
        error: 'Usuario nao encontrado',
      })
    }

    if (!user.is_active) {
      return res.status(403).json({
        error: 'Conta desativada',
      })
    }

    // Obter status da empresa (se for COMPANY)
    let companyStatus = null
    if (user.role === 'COMPANY') {
      const { data: company } = await supabase
        .from('companies')
        .select('status, company_name')
        .eq('owner_id', userId)
        .single()

      if (company) {
        companyStatus = company.status
      }
    }

    // Gerar JWT token
    const token = jwt.sign(
      {
        sub: userId,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    )

    // Atualizar last_login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)

    // Log de auditoria
    await createAuditLog({
      user_id: userId,
      action: 'user_login',
      entity_type: 'user',
      entity_id: userId,
      status: 'success',
      ip_address: req.ip,
    })

    const response = {
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    }

    // Adicionar companyStatus se for COMPANY
    if (user.role === 'COMPANY') {
      response.company_status = companyStatus
      if (companyStatus !== 'approved') {
        response.warning = 'Empresa ainda nao foi aprovada. Acesso limitado.'
      }
    }

    res.json(response)
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Erro ao fazer login' })
  }
}

/**
 * POST /auth/logout
 */
export const logout = async (req, res) => {
  try {
    await supabase.auth.signOut()

    await createAuditLog({
      user_id: req.user.id,
      action: 'user_logout',
      entity_type: 'user',
      entity_id: req.user.id,
      status: 'success',
      ip_address: req.ip,
    })

    res.json({ message: 'Logout realizado com sucesso' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Erro ao fazer logout' })
  }
}

/**
 * GET /auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, status, company_id, created_at')
      .eq('id', req.user.id)
      .single()

    if (error || !user) {
      return res.status(404).json({
        error: 'Usuario nao encontrado',
      })
    }

    res.json({
      user,
      company_status: req.companyStatus || null,
    })
  } catch (error) {
    console.error('Get current user error:', error)
    res.status(500).json({ error: 'Erro ao obter dados do usuario' })
  }
}

/**
 * POST /auth/validate-email
 */
export const validateEmail = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        error: 'Email obrigatorio',
      })
    }

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    res.json({
      available: !user,
      email,
    })
  } catch (error) {
    console.error('Email validation error:', error)
    res.status(500).json({ error: 'Erro ao validar email' })
  }
}
