import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { auth, supabase, isSuperAdmin } from '../config/supabase'
import CvUploadComponent from '../components/CvUploadComponent'
import ProfileModal from '../components/ProfileModal'
import SettingsPanel from '../components/SettingsPanel'
import { FileText, Search, ClipboardList, Check, X, Eye, Calendar, Briefcase, Building2, LogOut, Inbox, MapPin, Rocket, DollarSign, LifeBuoy, Settings, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('resume')

  // Estados do candidato
  const [candidateProfile, setCandidateProfile] = useState(null)
  const [availableJobs, setAvailableJobs] = useState([])
  const [myApplications, setMyApplications] = useState([])
  const [jobsLoading, setJobsLoading] = useState(false)
  const [appsLoading, setAppsLoading] = useState(false)
  const [applyingJobId, setApplyingJobId] = useState(null)
  const [applySuccess, setApplySuccess] = useState(null)
  const [applyError, setApplyError] = useState(null)
  const [selectedJob, setSelectedJob] = useState(null)

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

    // Carregar dados adicionais do usuário
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', currentUser.id)
      .single()

    if (data) {
      setUserData(data)
    }

    // Carregar perfil do candidato (pelo user_id)
    const { data: candidateData } = await supabase
      .from('candidates')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (candidateData) {
      setCandidateProfile(candidateData)
    }

    setLoading(false)
  }

  const loadAvailableJobs = async () => {
    setJobsLoading(true)
    const { data } = await supabase
      .from('job_positions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (data) setAvailableJobs(data)
    setJobsLoading(false)
  }

  const loadMyApplications = async () => {
    if (!candidateProfile) return
    setAppsLoading(true)
    const { data } = await supabase
      .from('matches')
      .select(`
        *,
        job_positions ( title, description, required_skills, experience_level, salary_range )
      `)
      .eq('candidate_id', candidateProfile.id)
      .order('created_at', { ascending: false })

    if (data) setMyApplications(data)
    setAppsLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'jobs') loadAvailableJobs()
    if (activeTab === 'applications') loadMyApplications()
  }, [activeTab, candidateProfile])

  const handleApply = async (job) => {
    if (!candidateProfile) {
      setApplyError('Você precisa enviar seu currículo antes de se candidatar.')
      setTimeout(() => setApplyError(null), 4000)
      return
    }

    // Verificar se já se candidatou
    const alreadyApplied = myApplications.some(
      (app) => app.job_position_id === job.id
    )
    if (alreadyApplied) {
      setApplyError('Você já se candidatou para esta vaga.')
      setTimeout(() => setApplyError(null), 3000)
      return
    }

    setApplyingJobId(job.id)
    setApplyError(null)
    try {
      const { data: jobRecruiter } = await supabase
        .from('job_positions')
        .select('user_id')
        .eq('id', job.id)
        .single()

      const { error } = await supabase
        .from('matches')
        .insert({
          candidate_id: candidateProfile.id,
          job_position_id: job.id,
          user_id: jobRecruiter?.user_id || null,
          status: 'new',
          match_score: null,
        })

      if (error) throw error

      setApplySuccess(job.id)
      setTimeout(() => setApplySuccess(null), 3000)
    } catch (err) {
      setApplyError('Erro ao se candidatar: ' + err.message)
      setTimeout(() => setApplyError(null), 4000)
    } finally {
      setApplyingJobId(null)
    }
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

  const isCompany = userData?.role === 'COMPANY' || isSuperAdmin(user?.email)
  const isAdmin = userData?.role === 'ADMIN' || isSuperAdmin(user?.email)

  const tabs = [
    { id: 'resume', label: <><FileText className="inline-block w-5 h-5 mr-2" /> Meu Currículo</> },
    { id: 'jobs', label: <><Search className="inline-block w-5 h-5 mr-2" /> Vagas Disponíveis</> },
    { id: 'applications', label: <><ClipboardList className="inline-block w-5 h-5 mr-2" /> Minhas Candidaturas</> },
  ]

  const getStatusStyle = (status) => {
    switch (status) {
      case 'shortlisted': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'viewed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'interview': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default: return 'bg-purple-main/20 text-purple-light border-purple-main/30'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'shortlisted': return <><Check className="inline-block w-4 h-4 mr-1" /> Aprovado</>
      case 'rejected': return <><X className="inline-block w-4 h-4 mr-1" /> Rejeitado</>
      case 'viewed': return <><Eye className="inline-block w-4 h-4 mr-1" /> Visualizado</>
      case 'interview': return <><Calendar className="inline-block w-4 h-4 mr-1" /> Entrevista</>
      default: return '⏳ Em Análise'
    }
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
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-main to-purple-light flex items-center justify-center">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <span className="text-xl font-bold text-white">Talent Scan</span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-4">
            <motion.button
              onClick={() => navigate('/vagas-empresas')}
              className="flex items-center gap-1.5 text-purple-light hover:text-white transition-colors text-sm font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Briefcase className="inline-block w-5 h-5 mr-2" /> Vagas
            </motion.button>

            {isCompany && (
              <motion.button
                onClick={() => navigate('/company-admin')}
                className="text-gray-400 hover:text-purple-light transition-colors text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Building2 className="inline-block w-5 h-5 mr-2" /> Painel Empresarial
              </motion.button>
            )}

            {isAdmin && (
              <motion.button
                onClick={() => navigate('/admin')}
                className="text-gray-400 hover:text-purple-light transition-colors text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="inline-block w-5 h-5 mr-2" /> Admin
              </motion.button>
            )}

            <motion.button
              onClick={() => navigate('/tickets')}
              className="flex items-center gap-1.5 text-gray-400 hover:text-purple-light transition-colors text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LifeBuoy className="inline-block w-5 h-5 mr-2" /> Tickets
            </motion.button>

            <SettingsPanel />

            <motion.button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-6 h-6 rounded-full bg-purple-main flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.email?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              <span className="text-sm font-medium text-gray-300">Perfil</span>
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

          {/* Mobile hamburger button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white focus:outline-none"
              aria-label="Toggle Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-dark-border bg-dark-bg/95 backdrop-blur-md px-4 py-4 space-y-3"
            >
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  navigate('/vagas-empresas')
                }}
                className="w-full text-left flex items-center gap-3 px-3 py-2 bg-purple-main/10 hover:bg-purple-main/20 rounded-lg text-sm text-purple-light font-semibold transition-colors border border-purple-main/20"
              >
                <Briefcase className="inline-block w-5 h-5 mr-2" /> Vagas Empresas
              </button>

              {isCompany && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    navigate('/company-admin')
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 font-medium transition-colors"
                >
                  <Building2 className="inline-block w-5 h-5 mr-2" /> Painel Empresarial
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    navigate('/admin')
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 font-medium transition-colors"
                >
                  <Settings className="inline-block w-5 h-5 mr-2" /> Admin
                </button>
              )}

              <div className="flex items-center justify-center px-3 py-2 border-t border-gray-700 mt-3 pt-3">
                <SettingsPanel />
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  setShowProfileModal(true)
                }}
                className="w-full text-left flex items-center gap-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 font-medium transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-purple-main flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.email?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                Editar Perfil
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  handleLogout()
                }}
                className="w-full text-left flex items-center gap-3 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors"
              >
                <LogOut className="inline-block w-4 h-4 mr-2" /> Sair
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Conteúdo */}
      <motion.div
        className="relative z-10 container mx-auto px-4 max-w-6xl pt-24 pb-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold text-white mb-3 tracking-tight"
          >
            Olá, <span className="gradient-text glow-purple">{userData?.full_name || user?.email?.split('@')[0]}</span> 
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-lg font-medium"
          >
            Gerencie seu currículo e acompanhe suas candidaturas
          </motion.p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mb-10 overflow-x-auto pb-4 hide-scrollbar">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all text-sm relative overflow-hidden ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200 border border-white/5'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-800 opacity-90 shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">

          {/* ======================== ABA: MEU CURRÍCULO ======================== */}
          {activeTab === 'resume' && (
            <motion.div
              key="resume"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Upload Component */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4"><FileText className="inline-block w-5 h-5 mr-2" /> Meu Currículo</h2>
                <CvUploadComponent onUploadSuccess={checkUser} />
              </div>

              {/* Perfil Extraído */}
              {candidateProfile ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass p-8 rounded-2xl"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-main to-purple-light flex items-center justify-center text-2xl font-bold text-white">
                      {candidateProfile.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{candidateProfile.full_name || 'Candidato'}</h3>
                      <p className="text-gray-400">{candidateProfile.email}</p>
                      {candidateProfile.location && (
                        <p className="text-gray-500 text-sm"><MapPin className="inline-block w-4 h-4 mr-1" /> {candidateProfile.location}</p>
                      )}
                    </div>
                    <div className="ml-auto">
                      {candidateProfile.ai_score !== null && candidateProfile.ai_score !== undefined && (
                        <div className="text-center">
                          <div className={`text-3xl font-bold ${
                            candidateProfile.ai_score >= 80 ? 'text-green-400' :
                            candidateProfile.ai_score >= 50 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {Math.round(candidateProfile.ai_score)}
                          </div>
                          <p className="text-gray-500 text-xs">Score IA</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resumo Profissional */}
                  {candidateProfile.professional_summary && (
                    <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                      <h4 className="text-sm font-semibold text-purple-light uppercase tracking-wide mb-2">Resumo Profissional</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{candidateProfile.professional_summary}</p>
                    </div>
                  )}

                  {/* Habilidades */}
                  {candidateProfile.skills && candidateProfile.skills.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-purple-light uppercase tracking-wide mb-3">Habilidades Identificadas</h4>
                      <div className="flex flex-wrap gap-2">
                        {candidateProfile.skills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-purple-main/15 border border-purple-main/30 text-purple-light rounded-full text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Informações do Arquivo */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Arquivo</p>
                      <p className="text-white text-sm font-medium truncate">{candidateProfile.cv_filename || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Status</p>
                      <span className="px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/30 rounded text-xs font-semibold">
                        {candidateProfile.status === 'analyzed' ? '✓ Analisado' : candidateProfile.status || 'Pendente'}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Enviado em</p>
                      <p className="text-white text-sm font-medium">
                        {candidateProfile.created_at ? new Date(candidateProfile.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Análise detalhada */}
                  {candidateProfile.analysis_result && (
                    <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                      <h4 className="text-sm font-semibold text-purple-light uppercase tracking-wide mb-2">Análise da IA</h4>
                      <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                        {typeof candidateProfile.analysis_result === 'string'
                          ? candidateProfile.analysis_result
                          : JSON.stringify(candidateProfile.analysis_result, null, 2)}
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass p-12 md:p-16 rounded-3xl text-center border border-dashed border-white/20 bg-black/40"
                >
                  <div className="mb-6 flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Inbox className="w-12 h-12 text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Nenhum currículo encontrado</h3>
                  <p className="text-gray-400 text-base max-w-md mx-auto">
                    Faça o upload do seu currículo acima e nossa Inteligência Artificial extrairá suas habilidades automaticamente para as melhores vagas.
                  </p>
                </motion.div>
              )}

              {/* Informações da Conta */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass p-6 rounded-2xl"
              >
                <h3 className="text-lg font-bold text-white mb-4">Informações da Conta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between pb-3 border-b border-dark-border">
                    <span className="text-gray-400 text-sm">Email:</span>
                    <span className="text-white font-medium text-sm">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-dark-border">
                    <span className="text-gray-400 text-sm">Tipo:</span>
                    <span className="text-white font-medium text-sm">{userData?.role || 'Candidato'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-dark-border">
                    <span className="text-gray-400 text-sm">Membro desde:</span>
                    <span className="text-white font-medium text-sm">
                      {new Date(user?.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-dark-border">
                    <span className="text-gray-400 text-sm">Candidaturas:</span>
                    <span className="text-white font-medium text-sm">{myApplications.length}</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ======================== ABA: VAGAS DISPONÍVEIS ======================== */}
          {activeTab === 'jobs' && (
            <motion.div
              key="jobs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white"><Search className="inline-block w-5 h-5 mr-2" /> Vagas Disponíveis</h2>
                <span className="px-3 py-1 bg-white/5 text-gray-400 rounded-full text-sm">
                  {availableJobs.length} vagas abertas
                </span>
              </div>

              {/* Alertas de feedback */}
              <AnimatePresence>
                {applyError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2"
                  >
                    <AlertCircle size={16} /> {applyError}
                  </motion.div>
                )}
              </AnimatePresence>

              {jobsLoading ? (
                <div className="flex justify-center py-20">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 border-4 border-purple-main border-t-transparent rounded-full"
                  />
                </div>
              ) : availableJobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableJobs.map((job) => (
                    <motion.div
                      key={job.id}
                      className="glass p-6 rounded-xl flex flex-col justify-between hover:border-purple-main/40 transition-all group"
                      whileHover={{ y: -2 }}
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-bold text-white group-hover:text-purple-light transition-colors pr-2">
                            {job.title}
                          </h3>
                          <span className="flex-shrink-0 px-2.5 py-0.5 bg-purple-main/20 text-purple-light text-xs font-semibold rounded-full uppercase">
                            {job.experience_level || 'Pleno'}
                          </span>
                        </div>

                        <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                          {job.description || 'Sem descrição fornecida.'}
                        </p>

                        {Array.isArray(job.required_skills) && job.required_skills.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Habilidades</p>
                            <div className="flex flex-wrap gap-1.5">
                              {job.required_skills.slice(0, 5).map((skill, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-gray-300 text-xs">
                                  {skill}
                                </span>
                              ))}
                              {job.required_skills.length > 5 && (
                                <span className="px-2 py-0.5 text-gray-500 text-xs">
                                  +{job.required_skills.length - 5}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-sm pt-3 border-t border-white/5">
                          <span className="text-gray-500"><DollarSign className="inline-block w-4 h-4 mr-1" /> {job.salary_range || 'A combinar'}</span>
                          <span className="text-gray-600 text-xs">
                            {new Date(job.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      <motion.button
                        onClick={() => handleApply(job)}
                        disabled={applyingJobId === job.id || applySuccess === job.id}
                        className={`mt-4 w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${
                          applySuccess === job.id
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                            : 'btn-primary'
                        }`}
                        whileHover={applySuccess !== job.id ? { scale: 1.02 } : {}}
                        whileTap={applySuccess !== job.id ? { scale: 0.98 } : {}}
                      >
                        {applyingJobId === job.id
                          ? '⏳ Candidatando...'
                          : applySuccess === job.id
                          ? <><Check className="inline-block w-4 h-4 mr-2" /> Candidatura Enviada!</>
                          : <><Rocket className="inline-block w-4 h-4 mr-2" /> Candidatar-se</>}
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  className="glass p-16 rounded-3xl text-center bg-black/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="mb-6 flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Search className="w-12 h-12 text-blue-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Nenhuma vaga disponível</h3>
                  <p className="text-gray-400 text-base max-w-md mx-auto">
                    Novas vagas serão publicadas pelas empresas em breve. Fique de olho ou ative as notificações!
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ======================== ABA: MINHAS CANDIDATURAS ======================== */}
          {activeTab === 'applications' && (
            <motion.div
              key="applications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white"><ClipboardList className="inline-block w-5 h-5 mr-2" /> Minhas Candidaturas</h2>
                <span className="px-3 py-1 bg-white/5 text-gray-400 rounded-full text-sm">
                  {myApplications.length} candidaturas
                </span>
              </div>

              {!candidateProfile && (
                <motion.div
                  className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <AlertCircle size={18} /> Você ainda não tem um currículo analisado. Vá para a aba "Meu Currículo" e faça o upload.
                </motion.div>
              )}

              {appsLoading ? (
                <div className="flex justify-center py-20">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 border-4 border-purple-main border-t-transparent rounded-full"
                  />
                </div>
              ) : myApplications.length > 0 ? (
                <div className="space-y-4">
                  {myApplications.map((app) => (
                    <motion.div
                      key={app.id}
                      className="glass p-6 rounded-xl hover:border-purple-main/30 transition-all"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-white">
                              {app.job_positions?.title || 'Vaga'}
                            </h3>
                            {app.job_positions?.experience_level && (
                              <span className="px-2 py-0.5 bg-white/10 text-gray-300 text-xs rounded-full">
                                {app.job_positions.experience_level}
                              </span>
                            )}
                          </div>

                          {app.job_positions?.description && (
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                              {app.job_positions.description}
                            </p>
                          )}

                          {app.job_positions?.required_skills && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {app.job_positions.required_skills.slice(0, 4).map((skill, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-gray-400 text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="text-gray-600 text-xs">
                            Candidatado em {new Date(app.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          {/* Status */}
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusStyle(app.status)}`}>
                            {getStatusLabel(app.status)}
                          </span>

                          {/* Score */}
                          {app.match_score !== null && app.match_score !== undefined && (
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${
                                app.match_score >= 80 ? 'text-green-400' :
                                app.match_score >= 50 ? 'text-yellow-400' : 'text-red-400'
                              }`}>
                                {Math.round(app.match_score)}%
                              </div>
                              <p className="text-gray-500 text-xs">Compatibilidade</p>
                            </div>
                          )}

                          {/* Salário */}
                          {app.job_positions?.salary_range && (
                            <p className="text-gray-500 text-xs">
                              <DollarSign className="inline-block w-4 h-4 mr-1" /> {app.job_positions.salary_range}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  className="glass p-16 rounded-2xl text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="mb-4 flex justify-center"><Inbox className="w-16 h-16 text-gray-500" /></div>
                  <h3 className="text-xl font-bold text-white mb-2">Nenhuma candidatura ainda</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Explore as vagas disponíveis e candidate-se para começar sua jornada!
                  </p>
                  <motion.button
                    onClick={() => setActiveTab('jobs')}
                    className="btn-primary px-6 py-2.5 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Ver Vagas Disponíveis →
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal
            user={user}
            onClose={() => setShowProfileModal(false)}
            onUpdate={checkUser}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
