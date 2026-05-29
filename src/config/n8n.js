// Configuração dos webhooks do n8n

// Variáveis de ambiente para n8n webhooks
const N8N_WEBHOOK_CV_UPLOAD = import.meta.env.VITE_N8N_WEBHOOK_CV_UPLOAD || ''
const N8N_WEBHOOK_ANALYSIS = import.meta.env.VITE_N8N_WEBHOOK_ANALYSIS || ''
const N8N_WEBHOOK_TELEGRAM = import.meta.env.VITE_N8N_WEBHOOK_TELEGRAM || ''

export const n8nConfig = {
  webhooks: {
    cvUpload: N8N_WEBHOOK_CV_UPLOAD,
    analysis: N8N_WEBHOOK_ANALYSIS,
    telegram: N8N_WEBHOOK_TELEGRAM,
  },
}

// Serviço para chamar n8n
export const n8nService = {
  // Disparar análise de CV
  async analyzeCv(cvData) {
    try {
      const response = await fetch(n8nConfig.webhooks.analysis, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'cv_analysis',
          timestamp: new Date().toISOString(),
          data: cvData,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao chamar n8n: ${response.statusText}`)
      }

      const result = await response.json()
      return { success: true, data: result }
    } catch (error) {
      console.error('Erro ao analisar CV:', error)
      return { success: false, error: error.message }
    }
  },

  // Notificar upload de CV
  async notifyCvUpload(uploadData) {
    try {
      const response = await fetch(n8nConfig.webhooks.cvUpload, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'cv_uploaded',
          timestamp: new Date().toISOString(),
          data: uploadData,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao notificar upload: ${response.statusText}`)
      }

      return { success: true }
    } catch (error) {
      console.error('Erro ao notificar upload:', error)
      return { success: false, error: error.message }
    }
  },

  // Sincronizar com Telegram
  async syncTelegram(telegramData) {
    try {
      const response = await fetch(n8nConfig.webhooks.telegram, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'telegram_sync',
          timestamp: new Date().toISOString(),
          data: telegramData,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao sincronizar Telegram: ${response.statusText}`)
      }

      const result = await response.json()
      return { success: true, data: result }
    } catch (error) {
      console.error('Erro ao sincronizar Telegram:', error)
      return { success: false, error: error.message }
    }
  },

  // Enviar dado customizado para n8n
  async sendData(webhookUrl, payload) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          ...payload,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao enviar dados: ${response.statusText}`)
      }

      const result = await response.json()
      return { success: true, data: result }
    } catch (error) {
      console.error('Erro ao enviar dados para n8n:', error)
      return { success: false, error: error.message }
    }
  },
}
