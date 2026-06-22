import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { auth, supabase, isSuperAdmin } from '../config/supabase'

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await auth.getCurrentUser()
        if (!currentUser) {
          setUser(null)
          setLoading(false)
          return
        }

        setUser(currentUser)

        // Se o email for do super admin, role é ADMIN automaticamente para o frontend
        if (isSuperAdmin(currentUser.email)) {
          setUserRole('ADMIN')
          setLoading(false)
          return
        }

        // Buscar role no banco de dados
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single()

        if (!error && data) {
          setUserRole(data.role)
        }
      } catch (error) {
        console.error('Erro na verificação de autenticação:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0813] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#a78bfa]"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redireciona para o dashboard padrão do usuário
    return <Navigate to="/dashboard" replace />
  }

  return children
}
