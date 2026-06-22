import { createClient } from '@supabase/supabase-js'

// Substitua com suas credenciais do Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERRO: Credenciais do Supabase não configuradas no arquivo .env!')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Super Admin - acesso total a todos os painéis
const SUPER_ADMIN_EMAIL = import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'mayknaua@gmail.com'

export const isSuperAdmin = (email) => {
  return email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
}

// Funções de autenticação
export const auth = {
  // Registro
  async signup(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Login
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      // Salvar sessão no localStorage para persistência
      if (data?.session) {
        localStorage.setItem('talentscan_session', JSON.stringify({
          user: data.user,
          session: data.session,
        }))
      }
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error.message }
    }
  },

  // Logout
  async logout() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      // Limpar sessão do localStorage
      localStorage.removeItem('talentscan_session')
      return { error: null }
    } catch (error) {
      return { error: error.message }
    }
  },

  // Obter usuário atual
  async getCurrentUser() {
    try {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (e) {
      console.error('Error in getCurrentUser:', e)
      return null
    }
  },

  // Obter sessão
  async getSession() {
    try {
      const {
        data: { session },
        error
      } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (e) {
      console.error('Error in getSession:', e)
      return null
    }
  },

  // Restaurar sessão salva
  async restoreSession() {
    try {
      const savedSession = localStorage.getItem('talentscan_session')
      if (savedSession) {
        const { session } = JSON.parse(savedSession)
        if (session) {
          // Restaurar a sessão no Supabase
          const { data } = await supabase.auth.setSession(session)
          return data?.user || null
        }
      }
      return null
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error)
      localStorage.removeItem('talentscan_session')
      return null
    }
  },

  // Verificar se há sessão salva
  hasStoredSession() {
    return !!localStorage.getItem('talentscan_session')
  },
}
