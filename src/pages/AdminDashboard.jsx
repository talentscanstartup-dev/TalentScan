import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { auth, supabase, isSuperAdmin } from '../config/supabase'
import SettingsPanel from '../components/SettingsPanel'
import { 
  BarChart3, Users, Settings, FileText, Target, ClipboardList, 
  Crown, User, Building2, UserCog
} from 'lucide-react'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [allUsers, setAllUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  
  const [allCvs, setAllCvs] = useState([])
  const [filteredCvs, setFilteredCvs] = useState([])
  const [selectedCv, setSelectedCv] = useState(null)

  const [allCandidates, setAllCandidates] = useState([])
  const [filteredCandidates, setFilteredCandidates] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  const [allMatches, setAllMatches] = useState([])
  const [filteredMatches, setFilteredMatches] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)

  const [allLogs, setAllLogs] = useState([])
  const [filteredLogs, setFilteredLogs] = useState([])

  const [aiStatus, setAiStatus] = useState(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const currentUser = await auth.getCurrentUser()
    if (!currentUser) {
      navigate('/login')
      return
    }

    // Verificar se é super admin ou tem role ADMIN
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', currentUser.id)
      .single()

    if (!isSuperAdmin(currentUser.email) && userData?.role !== 'ADMIN') {
      navigate('/dashboard')
      return
    }

    setUser(currentUser)
    
    // Carregar webhooks do localStorage
    const savedWebhooks = localStorage.getItem('n8nWebhooks')
    if (savedWebhooks) {
      setN8nWebhooks(JSON.parse(savedWebhooks))
    }

    try {
      // Carregar todos os usuários
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (usersData) {
        setAllUsers(usersData)
        setFilteredUsers(usersData)
      }

      // Carregar todos os CVs
      const { data: cvsData } = await supabase
        .from('cvs')
        .select('*')
        .order('created_at', { ascending: false })
      if (cvsData) {
        setAllCvs(cvsData)
        setFilteredCvs(cvsData)
      }

      // Carregar todos os Candidatos
      const { data: candidatesData } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false })
      if (candidatesData) {
        setAllCandidates(candidatesData)
        setFilteredCandidates(candidatesData)
      }

      // Carregar todos os Matches
      const { data: matchesData } = await supabase
        .from('matches')
        .select(`
          *,
          candidates ( full_name ),
          job_positions ( title )
        `)
        .order('created_at', { ascending: false })
      if (matchesData) {
        setAllMatches(matchesData)
        setFilteredMatches(matchesData)
      }

      // Carregar todos os Logs de atividade (ou audit_logs)
      const { data: logsData } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (logsData) {
        setAllLogs(logsData)
        setFilteredLogs(logsData)
      } else {
        // Tentar carregar de audit_logs se activity_logs retornar nulo
        const { data: auditData } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
        if (auditData) {
          const mappedLogs = auditData.map(l => ({
            id: l.id,
            action: l.action,
            entity_type: l.entity_type,
            created_at: l.created_at,
            details: l.new_values || { ip: l.ip_address }
          }))
          setAllLogs(mappedLogs)
          setFilteredLogs(mappedLogs)
        }
      }

      // Check Ollama Status
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData?.session?.access_token || ''
        const aiRes = await fetch('http://localhost:3000/api/admin/ollama-status', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const aiData = await aiRes.json()
        setAiStatus(aiData)
      } catch (err) {
        setAiStatus({ success: false, status: 'offline', message: 'Erro de conexão com o servidor local' })
      }

    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err)
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

  const handleSearch = (term) => {
    setSearchTerm(term)
    const t = term.toLowerCase().trim()
    if (!t) {
      setFilteredUsers(allUsers)
      setFilteredCvs(allCvs)
      setFilteredCandidates(allCandidates)
      setFilteredMatches(allMatches)
      setFilteredLogs(allLogs)
      return
    }

    setFilteredUsers(allUsers.filter(u => 
      u.email?.toLowerCase().includes(t) ||
      u.full_name?.toLowerCase().includes(t) ||
      u.id?.toLowerCase().includes(t)
    ))

    setFilteredCvs(allCvs.filter(c => 
      c.candidate_name?.toLowerCase().includes(t) ||
      c.candidate_email?.toLowerCase().includes(t) ||
      c.file_name?.toLowerCase().includes(t) ||
      c.id?.toLowerCase().includes(t)
    ))

    setFilteredCandidates(allCandidates.filter(c => 
      c.full_name?.toLowerCase().includes(t) ||
      c.email?.toLowerCase().includes(t) ||
      c.location?.toLowerCase().includes(t) ||
      (Array.isArray(c.skills) && c.skills.some(s => s.toLowerCase().includes(t)))
    ))

    setFilteredMatches(allMatches.filter(m => 
      m.candidates?.full_name?.toLowerCase().includes(t) ||
      m.job_positions?.title?.toLowerCase().includes(t) ||
      m.status?.toLowerCase().includes(t) ||
      m.id?.toLowerCase().includes(t)
    ))

    setFilteredLogs(allLogs.filter(l => 
      l.action?.toLowerCase().includes(t) ||
      l.entity_type?.toLowerCase().includes(t) ||
      l.id?.toLowerCase().includes(t)
    ))
  }

  const handleDeleteUser = async (userId) => {
    if (confirm('Tem certeza que deseja deletar este usuário?')) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userId)

        if (error) throw error

        // Atualizar lista
        const newUsers = allUsers.filter(u => u.id !== userId)
        setAllUsers(newUsers)
        setFilteredUsers(newUsers)
        setSelectedUser(null)
      } catch (error) {
        alert('Erro ao deletar usuário: ' + error.message)
      }
    }
  }

  const handleDeleteCv = async (cvId) => {
    if (confirm('Tem certeza que deseja deletar este CV? Os candidatos e matches associados serão deletados por cascata.')) {
      try {
        const { error } = await supabase
          .from('cvs')
          .delete()
          .eq('id', cvId)

        if (error) throw error

        const newCvs = allCvs.filter(c => c.id !== cvId)
        setAllCvs(newCvs)
        setFilteredCvs(newCvs)
        setSelectedCv(null)
      } catch (error) {
        alert('Erro ao deletar CV: ' + error.message)
      }
    }
  }

  const handleDeleteCandidate = async (candidateId) => {
    if (confirm('Tem certeza que deseja deletar este candidato?')) {
      try {
        const { error } = await supabase
          .from('candidates')
          .delete()
          .eq('id', candidateId)

        if (error) throw error

        const newCands = allCandidates.filter(c => c.id !== candidateId)
        setAllCandidates(newCands)
        setFilteredCandidates(newCands)
        setSelectedCandidate(null)
      } catch (error) {
        alert('Erro ao deletar candidato: ' + error.message)
      }
    }
  }

  const handleDeleteMatch = async (matchId) => {
    if (confirm('Tem certeza que deseja deletar este match?')) {
      try {
        const { error } = await supabase
          .from('matches')
          .delete()
          .eq('id', matchId)

        if (error) throw error

        const newMatches = allMatches.filter(m => m.id !== matchId)
        setAllMatches(newMatches)
        setFilteredMatches(newMatches)
        setSelectedMatch(null)
      } catch (error) {
        alert('Erro ao deletar match: ' + error.message)
      }
    }
  }

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      // Atualizar lista
      const updatedUsers = allUsers.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      )
      setAllUsers(updatedUsers)
      setFilteredUsers(updatedUsers)
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole })
      }
    } catch (error) {
      alert('Erro ao atualizar role: ' + error.message)
    }
  }

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId)

      if (error) throw error

      // Atualizar lista
      const updatedUsers = allUsers.map(u =>
        u.id === userId ? { ...u, is_active: !currentStatus } : u
      )
      setAllUsers(updatedUsers)
      setFilteredUsers(updatedUsers)
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_active: !currentStatus })
      }
    } catch (error) {
      alert('Erro ao atualizar status: ' + error.message)
    }
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
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={18} className="mr-2" /> },
    { id: 'users', label: 'Gerenciar Usuários', icon: <Users size={18} className="mr-2" /> },
    { id: 'cvs', label: 'CVs', icon: <FileText size={18} className="mr-2" /> },
    { id: 'candidates', label: 'Candidatos', icon: <Target size={18} className="mr-2" /> },
    { id: 'matches', label: 'Matches', icon: <Target size={18} className="mr-2" /> },
    { id: 'logs', label: 'Logs', icon: <ClipboardList size={18} className="mr-2" /> },
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
            <SettingsPanel />
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
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Painel <span className="gradient-text">Administrativo</span>
          </h1>
          <p className="text-gray-400 text-lg">Gerenciar currículos, candidatos e métricas do sistema</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'btn-primary'
                  : 'glass hover:border-purple-main'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.icon}
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
          {/* Users Management Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <motion.div className="glass p-6 rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-2xl font-bold text-white mb-6">Gerenciar Usuários</h3>

                {/* Search e Info */}
                <div className="mb-6">
                  <div className="flex gap-4 mb-4">
                    <motion.input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Pesquisar por email, nome ou ID..."
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all"
                      whileFocus={{ scale: 1.01 }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['all', 'CLIENT', 'COMPANY', 'ADMIN'].map(role => (
                      <motion.button
                        key={role}
                        onClick={() => {
                          if (role === 'all') {
                            setFilteredUsers(allUsers)
                          } else {
                            setFilteredUsers(allUsers.filter(u => u.role === role))
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          role === 'all' ? 'bg-purple-main/20 text-purple-light border border-purple-main/30' :
                          role === 'CLIENT' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          role === 'COMPANY' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                          'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {role === 'all' && <><ClipboardList size={14}/> Todos</>}
                        {role === 'CLIENT' && <><User size={14}/> Clientes</>}
                        {role === 'COMPANY' && <><Building2 size={14}/> Empresas</>}
                        {role === 'ADMIN' && <><UserCog size={14}/> Admins</>}
                      </motion.button>
                    ))}
                  </div>
                  <p className="text-gray-400 text-sm">
                    Total de usuários: <span className="font-bold text-purple-light">{filteredUsers.length}</span>
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                  <motion.div className="glass p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold gradient-text">{allUsers.length}</p>
                    <p className="text-gray-400 text-sm mt-1">Total</p>
                  </motion.div>
                  <motion.div className="glass p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-400">{allUsers.filter(u => u.is_active).length}</p>
                    <p className="text-gray-400 text-sm mt-1">Ativos</p>
                  </motion.div>
                  <motion.div className="glass p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-orange-400">{allUsers.filter(u => u.role === 'COMPANY').length}</p>
                    <p className="text-gray-400 text-sm mt-1">Empresas</p>
                  </motion.div>
                  <motion.div className="glass p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-400">{allUsers.filter(u => u.role === 'CLIENT').length}</p>
                    <p className="text-gray-400 text-sm mt-1">Clientes</p>
                  </motion.div>
                  <motion.div className="glass p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-400">{allUsers.filter(u => u.role === 'ADMIN').length}</p>
                    <p className="text-gray-400 text-sm mt-1">Admins</p>
                  </motion.div>
                </div>

                {/* Tabela de Usuários */}
                {filteredUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-dark-border">
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Email</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Nome</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Tipo</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Status</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Data</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((usr) => (
                          <motion.tr
                            key={usr.id}
                            className="border-b border-dark-border hover:bg-white/5 transition-colors cursor-pointer"
                            onClick={() => setSelectedUser(usr)}
                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                          >
                            <td className="px-4 py-3 text-white font-mono text-sm">{usr.email}</td>
                            <td className="px-4 py-3 text-gray-300 text-sm">{usr.full_name || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                usr.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' :
                                usr.role === 'COMPANY' ? 'bg-orange-500/20 text-orange-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {usr.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                usr.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {usr.is_active ? '✓ Ativo' : '✗ Inativo'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-sm">
                              {new Date(usr.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3">
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedUser(usr)
                                }}
                                className="text-purple-light hover:text-purple-main transition-colors text-sm"
                                whileHover={{ scale: 1.1 }}
                              >
                                Editar
                              </motion.button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400">Nenhum usuário encontrado</p>
                  </div>
                )}
              </motion.div>

              {/* Detail Panel */}
              {selectedUser && (
                <motion.div
                  className="glass p-6 rounded-2xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Detalhes do Usuário</h3>
                    <motion.button
                      onClick={() => setSelectedUser(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                      whileHover={{ scale: 1.1 }}
                    >
                      ✕
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Email</p>
                      <p className="text-white font-mono">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Nome</p>
                      <p className="text-white">{selectedUser.full_name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">ID</p>
                      <p className="text-white font-mono text-sm">{selectedUser.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Data de Inscrição</p>
                      <p className="text-white">{new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Tipo de Conta</p>
                      {isSuperAdmin(selectedUser.email) ? (
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 font-bold text-sm">
                            <Crown size={16}/> Super Admin
                          </span>
                          <span className="text-gray-500 text-xs">Não pode ser alterado</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <select
                            value={selectedUser.role}
                            onChange={(e) => {
                              if (confirm(`Tem certeza que deseja alterar o tipo de conta de "${selectedUser.email}" para ${e.target.value === 'CLIENT' ? 'Cliente' : e.target.value === 'COMPANY' ? 'Empresa' : 'Administrador'}?`)) {
                                handleChangeUserRole(selectedUser.id, e.target.value)
                              }
                            }}
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-main"
                          >
                            <option value="CLIENT">Cliente (Candidato)</option>
                            <option value="COMPANY">Empresa (Recrutador)</option>
                            <option value="ADMIN">Administrador</option>
                          </select>
                          <p className="text-gray-500 text-xs">
                            {selectedUser.role === 'CLIENT' && '→ Pode ver vagas e se candidatar'}
                            {selectedUser.role === 'COMPANY' && '→ Pode criar vagas e gerenciar candidatos'}
                            {selectedUser.role === 'ADMIN' && '→ Acesso total ao painel administrativo'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <motion.button
                        onClick={() => handleToggleUserStatus(selectedUser.id, selectedUser.is_active)}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                          selectedUser.is_active
                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {selectedUser.is_active ? 'Desativar' : 'Ativar'}
                      </motion.button>

                      <motion.button
                        onClick={() => handleDeleteUser(selectedUser.id)}
                        className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg font-medium transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Deletar
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Total de CVs', value: allCvs.length.toString(), icon: <FileText size={28} />, color: 'from-blue-500' },
                  { title: 'Candidatos', value: allCandidates.length.toString(), icon: <Users size={28} />, color: 'from-purple-500' },
                  { title: 'Matches', value: allMatches.length.toString(), icon: <Target size={28} />, color: 'from-green-500' },
                  { 
                    title: 'Taxa Acerto', 
                    value: allMatches.length > 0 
                      ? `${((allMatches.filter(m => m.match_score >= 70 || m.status === 'shortlisted').length / allMatches.length) * 100).toFixed(0)}%` 
                      : '0%', 
                    icon: <BarChart3 size={28} />, 
                    color: 'from-orange-500' 
                  },
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
                </div>
              </motion.div>

              {/* Diagnóstico do Motor de IA Local */}
              <motion.div className="glass p-8 rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Diagnóstico de Inteligência Artificial Local</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${aiStatus?.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {aiStatus?.status === 'online' ? '● ONLINE' : '○ OFFLINE'}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-gray-400 text-sm mb-1">Mensagem de Status</p>
                    <p className="text-white">{aiStatus?.message || 'Verificando conexão...'}</p>
                  </div>

                  {aiStatus?.status === 'online' && aiStatus?.models?.length > 0 && (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-gray-400 text-sm mb-2">Modelos Carregados (Ollama)</p>
                      <div className="flex flex-wrap gap-2">
                        {aiStatus.models.map((m, idx) => (
                          <span key={idx} className="px-3 py-1 bg-purple-main/20 border border-purple-main/50 text-purple-light rounded-md text-xs font-mono">
                            {m.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* CVs Tab */}
          {activeTab === 'cvs' && (
            <div className="space-y-6">
              <motion.div className="glass p-8 rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-2xl font-bold text-white mb-6">Gerenciar CVs</h3>
                
                {/* Search bar */}
                <div className="mb-6">
                  <motion.input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Pesquisar por nome do candidato, email, arquivo..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all text-sm"
                    whileFocus={{ scale: 1.01 }}
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    Total de CVs: <span className="font-bold text-purple-light">{filteredCvs.length}</span>
                  </p>
                </div>

                {filteredCvs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-dark-border">
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Candidato</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Email</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Arquivo</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Status</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Data</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCvs.map(cv => (
                          <tr key={cv.id} className="border-b border-dark-border hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 text-white font-medium text-sm">{cv.candidate_name}</td>
                            <td className="px-4 py-3 text-gray-300 text-sm">{cv.candidate_email || '-'}</td>
                            <td className="px-4 py-3 text-gray-300 text-sm font-mono">{cv.file_name || 'cv.pdf'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                cv.status === 'analyzed' ? 'bg-green-500/20 text-green-400' :
                                cv.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {cv.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-sm">
                              {new Date(cv.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 flex gap-2">
                              <button
                                onClick={() => setSelectedCv(cv)}
                                className="text-purple-light hover:text-purple-main text-sm font-medium transition-colors"
                              >
                                Ver Texto
                              </button>
                              <button
                                onClick={() => handleDeleteCv(cv.id)}
                                className="text-red-400 hover:text-red-500 text-sm font-medium transition-colors"
                              >
                                Excluir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">Nenhum CV encontrado</p>
                    <p className="text-gray-500 text-sm mt-2">Os CVs enviados aparecerão aqui</p>
                  </div>
                )}
              </motion.div>

              {/* Modal de Detalhes do CV */}
              {selectedCv && (
                <motion.div
                  className="glass p-6 rounded-2xl space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex justify-between items-center pb-2 border-b border-dark-border">
                    <h4 className="text-xl font-bold text-white">Texto Extraído: {selectedCv.candidate_name}</h4>
                    <button onClick={() => setSelectedCv(null)} className="text-gray-400 hover:text-white">
                      ✕
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-4 bg-white/5 rounded-lg text-sm text-gray-300 font-mono whitespace-pre-wrap">
                    {selectedCv.raw_text || 'Nenhum texto extraído ainda.'}
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Candidates Tab */}
          {activeTab === 'candidates' && (
            <div className="space-y-6">
              <motion.div className="glass p-8 rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-2xl font-bold text-white mb-6">Candidatos Analisados</h3>

                {/* Search bar */}
                <div className="mb-6">
                  <motion.input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Pesquisar por nome, email, habilidades, localização..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all text-sm"
                    whileFocus={{ scale: 1.01 }}
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    Total de candidatos: <span className="font-bold text-purple-light">{filteredCandidates.length}</span>
                  </p>
                </div>

                {filteredCandidates.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-dark-border">
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Nome</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Email</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Score IA</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Localização</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Habilidades</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCandidates.map(cand => (
                          <tr key={cand.id} className="border-b border-dark-border hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 text-white font-medium text-sm">{cand.full_name}</td>
                            <td className="px-4 py-3 text-gray-300 text-sm">{cand.email || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded font-bold text-xs ${
                                cand.ai_score >= 80 ? 'bg-green-500/20 text-green-400' :
                                cand.ai_score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {cand.ai_score}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-300 text-sm">{cand.location || '-'}</td>
                            <td className="px-4 py-3 max-w-xs truncate text-gray-400 text-sm">
                              {Array.isArray(cand.skills) ? cand.skills.join(', ') : '-'}
                            </td>
                            <td className="px-4 py-3 flex gap-2">
                              <button
                                onClick={() => setSelectedCandidate(cand)}
                                className="text-purple-light hover:text-purple-main text-sm font-medium transition-colors"
                              >
                                Detalhes
                              </button>
                              <button
                                onClick={() => handleDeleteCandidate(cand.id)}
                                className="text-red-400 hover:text-red-500 text-sm font-medium transition-colors"
                              >
                                Excluir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">Nenhum candidato encontrado</p>
                    <p className="text-gray-500 text-sm mt-2">Os candidatos aparecerão aqui após a análise de IA</p>
                  </div>
                )}
              </motion.div>

              {/* Painel Lateral / Modal de Perfil do Candidato */}
              {selectedCandidate && (
                <motion.div
                  className="glass p-6 rounded-2xl space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex justify-between items-center pb-2 border-b border-dark-border">
                    <h4 className="text-2xl font-bold text-white">{selectedCandidate.full_name}</h4>
                    <button onClick={() => setSelectedCandidate(null)} className="text-gray-400 hover:text-white">
                      ✕
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="text-gray-400 text-sm font-semibold mb-2">Resumo Profissional</h5>
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedCandidate.professional_summary || 'Nenhum resumo disponível.'}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h5 className="text-gray-400 text-sm font-semibold mb-1">Contato</h5>
                        <p className="text-gray-300 text-sm">📧 {selectedCandidate.email || '-'}</p>
                        <p className="text-gray-300 text-sm">📞 {selectedCandidate.phone || '-'}</p>
                        <p className="text-gray-300 text-sm">📍 {selectedCandidate.location || '-'}</p>
                      </div>

                      <div>
                        <h5 className="text-gray-400 text-sm font-semibold mb-1">Habilidades</h5>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {Array.isArray(selectedCandidate.skills) ? (
                            selectedCandidate.skills.map((skill, index) => (
                              <span key={index} className="px-2.5 py-1 bg-purple-main/20 text-purple-light text-xs rounded-full">
                                {skill}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 text-sm">Nenhuma listada.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedCandidate.ai_analysis && (
                    <div className="border-t border-dark-border pt-4">
                      <h5 className="text-gray-400 text-sm font-semibold mb-2">Análise de IA (OpenAI)</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-500/5 border border-green-500/10 p-3 rounded-lg">
                          <p className="text-green-400 font-medium text-xs mb-1">Pontos Fortes</p>
                          <ul className="text-gray-300 text-sm list-disc list-inside space-y-1">
                            {selectedCandidate.ai_analysis.strengths?.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            )) || <li>Nenhum detalhado.</li>}
                          </ul>
                        </div>
                        <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg">
                          <p className="text-red-400 font-medium text-xs mb-1">Pontos a Desenvolver / Recomendações</p>
                          <ul className="text-gray-300 text-sm list-disc list-inside space-y-1">
                            {selectedCandidate.ai_analysis.weaknesses?.map((w, idx) => (
                              <li key={idx}>{w}</li>
                            )) || <li>Nenhum detalhado.</li>}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* Matches Tab */}
          {activeTab === 'matches' && (
            <div className="space-y-6">
              <motion.div className="glass p-8 rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-2xl font-bold text-white mb-6">Matches Gerados</h3>

                {/* Search bar */}
                <div className="mb-6">
                  <motion.input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Pesquisar por candidato, vaga, status..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all text-sm"
                    whileFocus={{ scale: 1.01 }}
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    Total de matches: <span className="font-bold text-purple-light">{filteredMatches.length}</span>
                  </p>
                </div>

                {filteredMatches.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-dark-border">
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Candidato</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Vaga</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Score</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Status</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Data</th>
                          <th className="px-4 py-3 text-gray-400 font-medium text-sm">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredMatches.map(m => (
                          <tr key={m.id} className="border-b border-dark-border hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 text-white font-medium text-sm">
                              {m.candidates?.full_name || 'Candidato Desconhecido'}
                            </td>
                            <td className="px-4 py-3 text-gray-300 text-sm">
                              {m.job_positions?.title || 'Posição Indefinida'}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded font-bold text-xs ${
                                m.match_score >= 80 ? 'bg-green-500/20 text-green-400' :
                                m.match_score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {m.match_score}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                m.status === 'shortlisted' ? 'bg-green-500/20 text-green-400' :
                                m.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {m.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-sm">
                              {new Date(m.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 flex gap-2">
                              <button
                                onClick={() => setSelectedMatch(m)}
                                className="text-purple-light hover:text-purple-main text-sm font-medium transition-colors"
                              >
                                Ver Detalhes
                              </button>
                              <button
                                onClick={() => handleDeleteMatch(m.id)}
                                className="text-red-400 hover:text-red-500 text-sm font-medium transition-colors"
                              >
                                Excluir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">Nenhum match encontrado</p>
                    <p className="text-gray-500 text-sm mt-2">Os matches aparecerão aqui após a triagem inteligente</p>
                  </div>
                )}
              </motion.div>

              {/* Modal de Detalhes do Match */}
              {selectedMatch && (
                <motion.div
                  className="glass p-6 rounded-2xl space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex justify-between items-center pb-2 border-b border-dark-border">
                    <h4 className="text-xl font-bold text-white">Análise de Match</h4>
                    <button onClick={() => setSelectedMatch(null)} className="text-gray-400 hover:text-white">
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Candidato</p>
                      <p className="text-white font-medium">{selectedMatch.candidates?.full_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Vaga</p>
                      <p className="text-white font-medium">{selectedMatch.job_positions?.title}</p>
                    </div>
                  </div>
                  {selectedMatch.match_details && (
                    <div className="bg-white/5 p-4 rounded-lg text-sm text-gray-300 space-y-2">
                      <p className="font-semibold text-purple-light">Habilidades Correspondentes:</p>
                      <p>{selectedMatch.match_details.matching_skills?.join(', ') || 'Nenhuma'}</p>
                      <p className="font-semibold text-red-400 mt-2">Habilidades Faltantes:</p>
                      <p>{selectedMatch.match_details.missing_skills?.join(', ') || 'Nenhuma'}</p>
                    </div>
                  )}
                  {selectedMatch.notes && (
                    <div>
                      <p className="text-gray-400 text-sm">Anotações:</p>
                      <p className="text-gray-300 text-sm">{selectedMatch.notes}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <motion.div className="glass p-8 rounded-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-2xl font-bold text-white mb-6">Logs de Atividade</h3>

                {/* Search bar */}
                <div className="mb-6">
                  <motion.input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Pesquisar por ação, entidade..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all text-sm"
                    whileFocus={{ scale: 1.01 }}
                  />
                  <p className="text-gray-400 text-sm mt-2">
                    Total de logs listados: <span className="font-bold text-purple-light">{filteredLogs.length}</span>
                  </p>
                </div>

                {filteredLogs.length > 0 ? (
                  <div className="overflow-x-auto font-mono text-sm max-h-[500px] overflow-y-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-dark-border">
                          <th className="px-4 py-3 text-gray-400 font-medium">Ação</th>
                          <th className="px-4 py-3 text-gray-400 font-medium">Entidade</th>
                          <th className="px-4 py-3 text-gray-400 font-medium">Detalhes</th>
                          <th className="px-4 py-3 text-gray-400 font-medium">Data/Hora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLogs.map(log => (
                          <tr key={log.id} className="border-b border-dark-border hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 text-purple-light font-semibold">{log.action}</td>
                            <td className="px-4 py-3 text-white">{log.entity_type || '-'}</td>
                            <td className="px-4 py-3 text-gray-400 max-w-sm truncate">
                              {JSON.stringify(log.details)}
                            </td>
                            <td className="px-4 py-3 text-gray-500">
                              {new Date(log.created_at).toLocaleString('pt-BR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400 text-lg">Nenhuma atividade registrada</p>
                    <p className="text-gray-500 text-sm mt-2">As ações serão registradas aqui</p>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
