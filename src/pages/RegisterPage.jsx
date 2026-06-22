import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { auth } from '../config/supabase'
import { User, Building2, Check } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('CLIENT') // CLIENT ou COMPANY
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validações
    if (!email || !password || !confirmPassword || !fullName) {
      setError('Por favor, preencha todos os campos obrigatórios')
      return
    }

    if (role === 'COMPANY' && !companyName) {
      setError('Por favor, informe o nome da sua empresa')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setIsLoading(true)

    const metadata = {
      full_name: fullName,
      role: role,
    }

    if (role === 'COMPANY') {
      metadata.company_name = companyName
      metadata.industry = industry
      metadata.phone = phone
    } else {
      metadata.phone = phone
    }

    const { data, error: authError } = await auth.signup(email, password, metadata)

    if (authError) {
      setError(authError)
      setIsLoading(false)
      return
    }

    setSuccess('Conta criada com sucesso! Redirecionando...')
    setIsLoading(false)
    setTimeout(() => {
      navigate('/login')
    }, 1500)
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
          <p className="text-gray-400">Crie sua conta</p>
        </motion.div>

        {/* Card de Registro */}
        <motion.div
          className="glass p-8 rounded-2xl space-y-6"
          variants={itemVariants}
        >
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Seletor de Tipo de Conta */}
            <motion.div variants={itemVariants} className="flex gap-2 p-1 bg-white/5 rounded-lg mb-4">
              <button
                type="button"
                onClick={() => setRole('CLIENT')}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                  role === 'CLIENT'
                    ? 'bg-purple-main text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <User className="inline-block w-5 h-5 mr-2" /> Candidato
              </button>
              <button
                type="button"
                onClick={() => setRole('COMPANY')}
                className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                  role === 'COMPANY'
                    ? 'bg-purple-main text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Building2 className="inline-block w-5 h-5 mr-2" /> Empresa
              </button>
            </motion.div>

            {/* Campo Nome Completo */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nome Completo *
              </label>
              <motion.input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all text-sm"
                placeholder="Seu nome completo"
                whileFocus={{ scale: 1.01 }}
                required
              />
            </motion.div>

            {/* Campo Email */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <motion.input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all text-sm"
                placeholder="seu@email.com"
                whileFocus={{ scale: 1.01 }}
                required
              />
            </motion.div>

            {/* Campo Telefone */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Telefone
              </label>
              <motion.input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all text-sm"
                placeholder="(00) 00000-0000"
                whileFocus={{ scale: 1.01 }}
              />
            </motion.div>

            {/* Campos exclusivos para Empresa */}
            {role === 'COMPANY' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome da Empresa *
                  </label>
                  <motion.input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all text-sm"
                    placeholder="Nome da sua empresa"
                    whileFocus={{ scale: 1.01 }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Setor / Indústria
                  </label>
                  <motion.input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all text-sm"
                    placeholder="Ex: Tecnologia, RH, Vendas"
                    whileFocus={{ scale: 1.01 }}
                  />
                </div>
              </div>
            )}

            {/* Campo Senha */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha *
              </label>
              <motion.input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all text-sm"
                placeholder="••••••••"
                whileFocus={{ scale: 1.01 }}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </motion.div>

            {/* Campo Confirmar Senha */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirmar Senha *
              </label>
              <motion.input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all text-sm"
                placeholder="••••••••"
                whileFocus={{ scale: 1.01 }}
                required
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

            {/* Mensagem de Sucesso */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm"
              >
                <Check className="inline-block w-4 h-4 mr-2" /> {success}
              </motion.div>
            )}

            {/* Botão de Registro */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 rounded-lg font-semibold mt-6 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: !isLoading ? 1.02 : 1 }}
              whileTap={{ scale: !isLoading ? 0.98 : 1 }}
            >
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
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

          {/* Link Login */}
          <motion.div variants={itemVariants}>
            <p className="text-center text-gray-400">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="text-purple-main hover:text-purple-light font-semibold transition-colors"
              >
                Faça login
              </Link>
            </p>
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
