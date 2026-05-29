import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { auth } from '../config/supabase'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [n8nWebhooks, setN8nWebhooks] = useState({
    cvUpload: '',
    analysis: '',
    telegram: '',
  })
  const [webhookSaved, setWebhookSaved] = useState(false)

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
    
    // Carregar webhooks do localStorage
    const savedWebhooks = localStorage.getItem('n8nWebhooks')
    if (savedWebhooks) {
      setN8nWebhooks(JSON.parse(savedWebhooks))
    }
    
    setLoading(false)
  }

  const handleWebhookChange = (key, value) => {
    setN8nWebhooks(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSaveWebhooks = () => {
    localStorage.setItem('n8nWebhooks', JSON.stringify(n8nWebhooks))
    setWebhookSaved(true)
    setTimeout(() => setWebhookSaved(false), 3000)
  }

  const handleLogout = async () => {
    await auth.logout()
    navigate('/')
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
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'n8n', label: '⚙️ N8N Webhooks', icon: '⚙️' },
    { id: 'cvs', label: '📄 CVs', icon: '📄' },
    { id: 'candidates', label: '👥 Candidatos', icon: '👥' },
    { id: 'matches', label: '🎯 Matches', icon: '🎯' },
    { id: 'logs', label: '📋 Logs', icon: '📋' },
  ]

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
        <div className="container mx-auto px-4 max-w-7xl py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-main to-purple-light flex items-center justify-center">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <span className="text-xl font-bold text-white hidden sm:inline">Admin Panel</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{user?.email}</span>
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
        className="relative z-10 container mx-auto px-4 max-w-7xl pt-24 pb-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            Painel <span className="gradient-text">Administrativo</span>
          </h1>
          <p className="text-gray-400 text-lg">Gerenciar n8n, CVs, candidatos e matches</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'btn-primary'
                  : 'glass hover:border-purple-main'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Total de CVs', value: '0', icon: '📄', color: 'from-blue-500' },
                  { title: 'Candidatos', value: '0', icon: '👥', color: 'from-purple-500' },
                  { title: 'Matches', value: '0', icon: '🎯', color: 'from-green-500' },
                  { title: 'Taxa Acerto', value: '0%', icon: '📊', color: 'from-orange-500' },
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

              <motion.div className="glass p-8 rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-xl font-bold text-white mb-4">Status do Sistema</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-dark-border">
                    <span className="text-gray-400">Supabase</span>
                    <span className="text-green-400 font-semibold">✓ Conectado</span>
                  </div>
                  <div className="flex items-center justify-between pb-4 border-b border-dark-border">
                    <span className="text-gray-400">N8N Webhooks</span>
                    <span className={n8nWebhooks.analysis ? 'text-green-400 font-semibold' : 'text-yellow-400 font-semibold'}>
                      {n8nWebhooks.analysis ? '✓ Configurado' : '⚠ Não configurado'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Google Sheets</span>
                    <span className="text-yellow-400 font-semibold">○ Pendente</span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* N8N Webhooks Tab */}
          {activeTab === 'n8n' && (
            <div className="space-y-6">
              <motion.div className="glass p-8 rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-2xl font-bold text-white mb-6">Configurar Webhooks N8N</h3>
                
                {webhookSaved && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400"
                  >
                    ✓ Webhooks salvos com sucesso!
                  </motion.div>
                )}

                <div className="space-y-6">
                  {/* CV Upload Webhook */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Webhook - Upload de CV
                    </label>
                    <motion.input
                      type="text"
                      value={n8nWebhooks.cvUpload}
                      onChange={(e) => handleWebhookChange('cvUpload', e.target.value)}
                      placeholder="https://seu-n8n.com/webhook/cv-upload"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all font-mono text-sm"
                      whileFocus={{ scale: 1.01 }}
                    />
                    <p className="text-xs text-gray-500 mt-2">URL webhook para quando um CV é enviado</p>
                  </div>

                  {/* Analysis Webhook */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Webhook - Análise com IA
                    </label>
                    <motion.input
                      type="text"
                      value={n8nWebhooks.analysis}
                      onChange={(e) => handleWebhookChange('analysis', e.target.value)}
                      placeholder="https://seu-n8n.com/webhook/analyze"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all font-mono text-sm"
                      whileFocus={{ scale: 1.01 }}
                    />
                    <p className="text-xs text-gray-500 mt-2">URL webhook para análise com OpenAI</p>
                  </div>

                  {/* Telegram Webhook */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Webhook - Sincronização Telegram
                    </label>
                    <motion.input
                      type="text"
                      value={n8nWebhooks.telegram}
                      onChange={(e) => handleWebhookChange('telegram', e.target.value)}
                      placeholder="https://seu-n8n.com/webhook/telegram"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all font-mono text-sm"
                      whileFocus={{ scale: 1.01 }}
                    />
                    <p className="text-xs text-gray-500 mt-2">URL webhook para sincronizar com Telegram Bot</p>
                  </div>
                </div>

                <motion.button
                  onClick={handleSaveWebhooks}
                  className="btn-primary w-full mt-8 py-3 rounded-lg font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Salvar Configurações
                </motion.button>
              </motion.div>

              <motion.div className="glass p-8 rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-xl font-bold text-white mb-4">Testar Webhooks</h3>
                <p className="text-gray-400 mb-6">
                  Clique nos botões abaixo para testar a conexão com seus webhooks n8n
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.button
                    className="btn-secondary py-2 rounded-lg font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Test CV Upload
                  </motion.button>
                  <motion.button
                    className="btn-secondary py-2 rounded-lg font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Test Analysis
                  </motion.button>
                  <motion.button
                    className="btn-secondary py-2 rounded-lg font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Test Telegram
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}

          {/* CVs Tab */}
          {activeTab === 'cvs' && (
            <motion.div className="glass p-8 rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-2xl font-bold text-white mb-6">Gerenciar CVs</h3>
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Nenhum CV encontrado</p>
                <p className="text-gray-500 text-sm mt-2">Os CVs enviados aparecerão aqui</p>
              </div>
            </motion.div>
          )}

          {/* Candidates Tab */}
          {activeTab === 'candidates' && (
            <motion.div className="glass p-8 rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-2xl font-bold text-white mb-6">Candidatos Analisados</h3>
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Nenhum candidato encontrado</p>
                <p className="text-gray-500 text-sm mt-2">Os candidatos aparecerão aqui após análise</p>
              </div>
            </motion.div>
          )}

          {/* Matches Tab */}
          {activeTab === 'matches' && (
            <motion.div className="glass p-8 rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-2xl font-bold text-white mb-6">Matches Gerados</h3>
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Nenhum match encontrado</p>
                <p className="text-gray-500 text-sm mt-2">Os matches aparecerão aqui após análise</p>
              </div>
            </motion.div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <motion.div className="glass p-8 rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h3 className="text-2xl font-bold text-white mb-6">Logs de Atividade</h3>
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">Nenhuma atividade registrada</p>
                <p className="text-gray-500 text-sm mt-2">As ações serão registradas aqui</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
