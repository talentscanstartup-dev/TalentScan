import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { auth } from '../config/supabase'
import CvUploadComponent from '../components/CvUploadComponent'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const currentUser = await auth.getCurrentUser()
    if (!currentUser) {
      navigate('/login')
      return
    }
    setUser(currentUser)
    setLoading(false)
  }

  const handleLogout = async () => {
    const { error } = await auth.logout()
    if (!error) {
      navigate('/')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-main border-t-transparent rounded-full"
        ></motion.div>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Fundo com gradiente */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-main opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-dark opacity-5 rounded-full blur-3xl"></div>
      </div>

      {/* Navbar */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-dark-border"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="container mx-auto px-4 max-w-6xl py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-main to-purple-light flex items-center justify-center">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <span className="text-xl font-bold text-white hidden sm:inline">Talent Scan</span>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate('/admin')}
              className="text-gray-400 hover:text-purple-light transition-colors text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ⚙️ Admin Panel
            </motion.button>

            <motion.button
              onClick={handleLogout}
              className="btn-secondary px-6 py-2 text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sair
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Conteúdo */}
      <motion.div
        className="relative z-10 container mx-auto px-4 max-w-6xl pt-24 pb-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-2">
            Bem-vindo, <span className="gradient-text">{user?.email?.split('@')[0]}</span>
          </h1>
          <p className="text-gray-400 text-lg">Painel do Talent Scan</p>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { title: 'CVs Processados', value: '0', icon: '📄' },
            { title: 'Taxa de Acerto', value: '0%', icon: '✓' },
            { title: 'Tempo Economizado', value: '0h', icon: '⏱️' },
            { title: 'Candidatos', value: '0', icon: '👥' },
          ].map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass p-6 rounded-xl"
            >
              <div className="text-3xl mb-3">{card.icon}</div>
              <p className="text-gray-400 text-sm mb-2">{card.title}</p>
              <p className="text-3xl font-bold text-white">{card.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Upload Section */}
        <div className="mb-12">
          <CvUploadComponent />
        </div>

        {/* Seção Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass p-8 rounded-2xl text-center mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Comece a Usar</h2>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Envie currículos, deixe a IA analisar e receba candidatos organizados automaticamente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="https://web.telegram.org/a/#8790543248"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-8 py-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Conectar no Telegram
            </motion.a>
            <motion.a
              href="#"
              className="btn-secondary px-8 py-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Ver Documentação
            </motion.a>
          </div>
        </motion.div>

        {/* Informações do Usuário */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass p-8 rounded-2xl"
        >
          <h3 className="text-xl font-bold text-white mb-6">Informações da Conta</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-dark-border">
              <span className="text-gray-400">Email:</span>
              <span className="text-white font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-dark-border">
              <span className="text-gray-400">ID do Usuário:</span>
              <span className="text-white font-mono text-sm">{user?.id?.substring(0, 12)}...</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Data de Inscrição:</span>
              <span className="text-white font-medium">
                {new Date(user?.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
