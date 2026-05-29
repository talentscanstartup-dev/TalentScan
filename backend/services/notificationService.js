// services/notificationService.js
// Serviço de Notificações (Email e In-App)

import nodemailer from 'nodemailer'
import { supabase } from '../config/supabase.js'

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

/**
 * Templates de email
 */
const emailTemplates = {
  welcome: (data) => ({
    subject: 'Bem-vindo ao Talent Scan',
    html: `
      <h1>Bem-vindo, ${data.full_name}!</h1>
      <p>Sua conta como ${data.role} foi criada com sucesso.</p>
      <p>Acesse o painel em: ${process.env.FRONTEND_URL}</p>
    `,
  }),

  company_registration_pending: (data) => ({
    subject: 'Solicitacao Recebida - Talent Scan',
    html: `
      <h1>Obrigado por se registrar, ${data.full_name}!</h1>
      <p>Sua empresa <strong>${data.company_name}</strong> foi registrada.</p>
      <p>Estamos revisando sua solicitacao. Voce sera notificado quando for aprovada.</p>
      <p>Tempo medio de analise: 24-48 horas.</p>
    `,
  }),

  new_company_approval_request: (data) => ({
    subject: 'Nova Solicitacao de Empresa para Aprovar',
    html: `
      <h1>Nova Solicitacao de Aprovacao</h1>
      <p><strong>Empresa:</strong> ${data.company_name}</p>
      <p><strong>Contato:</strong> ${data.contact_email}</p>
      <p><a href="${process.env.ADMIN_DASHBOARD_URL}/approvals/${data.company_id}">Ver Solicitacao</a></p>
    `,
  }),

  company_approved: (data) => ({
    subject: 'Sua Empresa Foi Aprovada!',
    html: `
      <h1>Parabens!</h1>
      <p>Sua empresa <strong>${data.company_name}</strong> foi aprovada!</p>
      <p>Acesse seu dashboard em: <a href="${data.dashboard_url}">${data.dashboard_url}</a></p>
      <p>Voce agora tem acesso a todos os recursos.</p>
    `,
  }),

  company_rejected: (data) => ({
    subject: 'Atualizacao sobre sua Solicitacao',
    html: `
      <h1>Solicitacao Recusada</h1>
      <p>Lamentamos informar que sua solicitacao foi recusada.</p>
      <p><strong>Motivo:</strong> ${data.reason}</p>
      <p>Voce pode entrar em contato conosco para maiores informacoes.</p>
    `,
  }),

  company_suspended: (data) => ({
    subject: 'Sua Conta Foi Suspensa',
    html: `
      <h1>Aviso Importante</h1>
      <p>Sua empresa <strong>${data.company_name}</strong> foi suspensa.</p>
      <p><strong>Motivo:</strong> ${data.reason}</p>
      <p>Entre em contato com nosso suporte para maiores detalhes.</p>
    `,
  }),

  team_invitation: (data) => ({
    subject: 'Convite para Equipe - Talent Scan',
    html: `
      <h1>Voce foi convidado!</h1>
      <p>Voce foi convidado para se juntar a equipe de <strong>${data.company_name}</strong>.</p>
      <p><a href="${data.invitation_link}">Aceitar Convite</a></p>
      <p>Link expira em: ${data.expires_at}</p>
    `,
  }),

  notification_digest: (data) => ({
    subject: 'Suas Notificacoes - Talent Scan',
    html: `
      <h1>Resumo de Notificacoes</h1>
      ${data.notifications.map((n) => `<p>- ${n.title}: ${n.message}</p>`).join('')}
    `,
  }),
}

/**
 * Enviar email
 */
export const sendEmailNotification = async ({ to, type, data }) => {
  try {
    if (!to) {
      console.warn('Email "to" nao fornecido')
      return false
    }

    const template = emailTemplates[type]

    if (!template) {
      console.warn(`Template de email nao encontrado: ${type}`)
      return false
    }

    const { subject, html } = template(data)

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    })

    console.log(`Email enviado: ${info.messageId}`)
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

/**
 * Criar notificação in-app
 */
export const createInAppNotification = async ({
  user_id,
  company_id,
  type,
  title,
  message,
  data = {},
}) => {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id,
      company_id,
      type,
      title,
      message,
      data,
    })

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('In-app notification error:', error)
    return false
  }
}

/**
 * Enviar notificação dupla (Email + In-App)
 */
export const sendNotification = async ({
  user_email,
  user_id,
  company_id,
  type,
  title,
  message,
  data = {},
}) => {
  try {
    // Email
    if (user_email) {
      await sendEmailNotification({
        to: user_email,
        type,
        data,
      })
    }

    // In-app
    if (user_id) {
      await createInAppNotification({
        user_id,
        company_id,
        type,
        title,
        message,
        data,
      })
    }

    return true
  } catch (error) {
    console.error('Notification error:', error)
    return false
  }
}

/**
 * Marcar notificação como lida
 */
export const markNotificationAsRead = async (notification_id) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notification_id)

    if (error) {
      throw error
    }

    return true
  } catch (error) {
    console.error('Mark as read error:', error)
    return false
  }
}

/**
 * Obter notificações do usuário
 */
export const getUserNotifications = async (user_id, limit = 20) => {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return notifications
  } catch (error) {
    console.error('Get notifications error:', error)
    return []
  }
}

/**
 * Limpar notificações expiradas
 */
export const cleanupExpiredNotifications = async () => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .lt('expires_at', new Date().toISOString())

    if (error) {
      throw error
    }

    console.log('Notificacoes expiradas removidas')
  } catch (error) {
    console.error('Cleanup error:', error)
  }
}
