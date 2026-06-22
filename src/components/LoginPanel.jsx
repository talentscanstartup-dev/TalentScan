import React, { useState } from 'react'
import { motion } from 'framer-motion'

export default function LoginPanel({ onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos')
      return
    }

    setIsLoading(true)
    // Simular chamada API
    setTimeout(() => {
      setIsLoading(false)
      // Aqui você pode adicionar a lógica de login real
      alert(`Login com: ${email}`)
    }, 1000)
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4"
      onClick={onBack}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        // Aumentamos o max-w para acomodar a imagem e adicionamos flex para ficar lado a lado
        className="bg-dark-bg border border-dark-border rounded-2xl max-w-4xl w-full relative flex flex-col md:flex-row overflow-hidden shadow-2xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        {/* LADO ESQUERDO: Imagem do Robô */}
        {/* Oculto em telas pequenas (hidden) e visível a partir de tablets (md:flex) */}
        <div className="hidden md:flex md:w-1/2 bg-white/5 items-center justify-center p-8 border-r border-white/5">
          <img 
            src="/imagens/robologin.png" 
            alt="Robô de Login" 
            className="max-w-full h-auto object-contain drop-shadow-2xl"
          />
        </div>

        {/* LADO DIREITO: Formulário de Login */}
        <div className="w-full md:w-1/2 p-8 relative">
          
          {/* Botão Fechar */}
          <button
            onClick={onBack}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
            aria-label="Fechar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold gradient-text mb-2">Bem-vindo</h2>
            <p className="text-gray-400">Faça login para acessar sua conta</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Campo Email */}
            <div>
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
            </div>

            {/* Campo Senha */}
            <div>
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
            </div>

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
              className="w-full btn-primary bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold mt-6 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              whileHover={{ scale: !isLoading ? 1.02 : 1 }}
              whileTap={{ scale: !isLoading ? 0.98 : 1 }}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </motion.button>
          </form>

          {/* Links Adicionais */}
          <div className="mt-6 flex flex-col gap-3 text-center text-sm">
            <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">
              Esqueceu a senha?
            </a>
            <p className="text-gray-400">
              Não tem conta?{' '}
              <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
                Cadastre-se
              </a>
            </p>
          </div>

          {/* Ornamenta */}
          <motion.div
            className="absolute top-0 right-0 w-40 h-40 bg-purple-500 opacity-5 rounded-full blur-3xl -z-10"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          ></motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}