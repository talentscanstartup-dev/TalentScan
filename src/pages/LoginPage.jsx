import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { auth, isSuperAdmin } from '../config/supabase'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Por favor, preencha todos os campos')
      return
    }

    setIsLoading(true)
    const { data, error: authError } = await auth.login(email, password)

    if (authError) {
      setError(authError)
      setIsLoading(false)
      return
    }

    // Redirecionar super admin para admin, outros para dashboard
    setTimeout(() => {
      setIsLoading(false)
      if (isSuperAdmin(email)) {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    }, 500)
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fundo com gradiente */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-main opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-dark opacity-5 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-main to-purple-light flex items-center justify-center">
              <span className="text-white font-bold text-lg">TS</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Talent Scan</h1>
          <p className="text-gray-400">Acesse sua conta</p>
        </motion.div>

        {/* Card de Login */}
        <motion.div
          className="glass p-8 rounded-2xl space-y-6"
          variants={itemVariants}
        >
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Campo Email */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <motion.input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all"
                placeholder="seu@email.com"
                whileFocus={{ scale: 1.01 }}
              />
            </motion.div>

            {/* Campo Senha */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <motion.input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all"
                placeholder="••••••••"
                whileFocus={{ scale: 1.01 }}
              />
            </motion.div>

            {/* Mensagem de Erro */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Botão de Login */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 rounded-lg font-semibold mt-6 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: !isLoading ? 1.02 : 1 }}
              whileTap={{ scale: !isLoading ? 0.98 : 1 }}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </motion.button>
          </form>

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-dark-bg text-gray-400">ou</span>
            </div>
          </div>

          {/* Botão Registro */}
          <motion.div variants={itemVariants}>
            <p className="text-center text-gray-400 mb-3">
              Não tem uma conta?{' '}
              <Link
                to="/register"
                className="text-purple-main hover:text-purple-light font-semibold transition-colors"
              >
                Cadastre-se
              </Link>
            </p>
          </motion.div>

          {/* Link Esqueceu Senha */}
          <motion.div variants={itemVariants} className="text-center">
            <a
              href="#"
              className="text-purple-main hover:text-purple-light text-sm transition-colors"
            >
              Esqueceu sua senha?
            </a>
          </motion.div>
        </motion.div>

        {/* Link Voltar */}
        <motion.div
          variants={itemVariants}
          className="mt-6 text-center"
        >
          <Link
            to="/"
            className="text-gray-400 hover:text-white transition-colors text-sm flex items-center justify-center gap-2"
          >
            ← Voltar para home
          </Link>
        </motion.div>

        {/* Ornamenta */}
        <motion.div
          className="absolute top-0 right-0 w-40 h-40 bg-purple-main opacity-3 rounded-full blur-3xl -z-10"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.03, 0.06, 0.03],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        ></motion.div>
      </motion.div>
    </div>
  )
}
