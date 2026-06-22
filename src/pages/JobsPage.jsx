import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { auth, supabase } from '../config/supabase'
import JobApplicationModal from '../components/JobApplicationModal'
import JobApplicantsModal from '../components/JobApplicantsModal'
import { Building2, BarChart3, Briefcase, Search, Users, Rocket, Check, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const EMPLOYMENT_TYPES = ['Todos', 'CLT', 'PJ', 'Híbrido', 'Freelancer', 'Estágio']

const EMPLOYMENT_COLORS = {
  CLT:        'bg-blue-500/15 text-blue-400 border-blue-500/30',
  PJ:         'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Híbrido:    'bg-purple-main/15 text-purple-light border-purple-main/30',
  Freelancer: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Estágio:    'bg-green-500/15 text-green-400 border-green-500/30',
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function JobsPage() {
  const navigate = useNavigate()

  // Auth
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Vagas
  const [jobs, setJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('Todos')

  // Modais
  const [applyModal, setApplyModal] = useState(null)     // job objeto
  const [applicantsModal, setApplicantsModal] = useState(null) // job objeto

  // Modal nova vaga (empresa)
  const [showNewJobModal, setShowNewJobModal] = useState(false)
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jobRequirements, setJobRequirements] = useState('')
  const [jobSkills, setJobSkills] = useState('')
  const [jobSalary, setJobSalary] = useState('')
  const [jobExperience, setJobExperience] = useState('pleno')
  const [jobEmploymentType, setJobEmploymentType] = useState('CLT')
  const [jobLoading, setJobLoading] = useState(false)

  // Candidaturas do usuário (para evitar duplicata)
  const [myApplicationJobIds, setMyApplicationJobIds] = useState(new Set())
  const [applySuccess, setApplySuccess] = useState(null)

  // Mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // ---------------------------------------------------------------------------
  // Inicialização
  // ---------------------------------------------------------------------------
  useEffect(() => {
    initPage()
  }, [])

  const initPage = async () => {
    const currentUser = await auth.getCurrentUser()
    setUser(currentUser)

    if (currentUser) {
      const { data: uData } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single()
      if (uData) setUserData(uData)

      // Carregar candidaturas já feitas pelo usuário
      const { data: myApps } = await supabase
        .from('job_applications')
        .select('job_position_id')
        .eq('applicant_user_id', currentUser.id)
      if (myApps) {
        setMyApplicationJobIds(new Set(myApps.map(a => a.job_position_id)))
      }
    }

    setAuthLoading(false)
    await loadJobs(currentUser)
  }

  const loadJobs = async (currentUser) => {
    setJobsLoading(true)
    let query = supabase
      .from('job_positions')
      .select('*')
      .order('created_at', { ascending: false })

    // Empresa vê somente as suas próprias
    if (currentUser) {
      const { data: uData } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single()

      if (uData?.role === 'COMPANY') {
        query = query.eq('user_id', currentUser.id)
      } else {
        query = query.eq('status', 'active')
      }
    } else {
      query = query.eq('status', 'active')
    }

    const { data } = await query
    if (data) setJobs(data)
    setJobsLoading(false)
  }

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------
  const isCompany = userData?.role === 'COMPANY'
  const isAdmin   = userData?.role === 'ADMIN'

  const filteredJobs = jobs.filter((job) => {
    const matchSearch =
      search === '' ||
      job.title?.toLowerCase().includes(search.toLowerCase()) ||
      job.description?.toLowerCase().includes(search.toLowerCase()) ||
      (Array.isArray(job.required_skills) &&
        job.required_skills.some((s) => s.toLowerCase().includes(search.toLowerCase())))

    const matchType =
      filterType === 'Todos' || job.employment_type === filterType

    return matchSearch && matchType
  })

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleCreateJob = async (e) => {
    e.preventDefault()
    if (!jobTitle.trim()) return
    setJobLoading(true)
    try {
      const skillsArray = jobSkills.split(',').map((s) => s.trim()).filter(Boolean)
      const { data, error } = await supabase
        .from('job_positions')
        .insert({
          user_id: user.id,
          title: jobTitle.trim(),
          description: jobDescription.trim(),
          requirements: jobRequirements.trim(),
          required_skills: skillsArray,
          experience_level: jobExperience,
          salary_range: jobSalary.trim(),
          employment_type: jobEmploymentType,
          status: 'active',
        })
        .select()
        .single()

      if (error) throw error
      setJobs((prev) => [data, ...prev])
      setShowNewJobModal(false)
      resetJobForm()
    } catch (err) {
      alert('Erro ao criar vaga: ' + err.message)
    } finally {
      setJobLoading(false)
    }
  }

  const resetJobForm = () => {
    setJobTitle('')
    setJobDescription('')
    setJobRequirements('')
    setJobSkills('')
    setJobSalary('')
    setJobExperience('pleno')
    setJobEmploymentType('CLT')
  }

  const handleApplicationSuccess = (jobId) => {
    setMyApplicationJobIds((prev) => new Set([...prev, jobId]))
    setApplySuccess(jobId)
    setTimeout(() => setApplySuccess(null), 4000)
  }

  const handleLogout = async () => {
    await auth.logout()
    navigate('/')
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const navLinks = user ? (
    <>
      {isCompany && (
        <button onClick={() => navigate('/company-admin')} className="text-gray-400 hover:text-purple-light text-sm font-medium transition-colors">
          <Building2 className="inline-block w-5 h-5 mr-2" /> Painel Empresa
        </button>
      )}
      {isAdmin && (
        <button onClick={() => navigate('/admin')} className="text-gray-400 hover:text-purple-light text-sm font-medium transition-colors">
          ⚙️ Admin
        </button>
      )}
      {!isCompany && !isAdmin && (
        <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-purple-light text-sm font-medium transition-colors">
          <BarChart3 className="inline-block w-5 h-5 mr-2" /> Meu Painel
        </button>
      )}
      <button onClick={handleLogout} className="btn-secondary px-5 py-2 text-sm">
        Sair
      </button>
    </>
  ) : (
    <>
      <button onClick={() => navigate('/login')} className="text-gray-400 hover:text-white text-sm font-medium transition-colors">
        Entrar
      </button>
      <button onClick={() => navigate('/register')} className="btn-primary px-5 py-2 text-sm">
        Cadastrar
      </button>
    </>
  )

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Decoração de fundo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-main opacity-5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-dark opacity-5 rounded-full blur-3xl" />
      </div>

      {/* ===== NAVBAR ===== */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-dark-border"
      >
        <div className="container mx-auto px-4 max-w-6xl py-4">
          <div className="flex items-center justify-between">
            {/* Logo + Breadcrumb */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-main to-purple-light flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TS</span>
                </div>
                <span className="text-white font-bold text-lg hidden sm:inline">Talent Scan</span>
              </button>
              <span className="text-dark-border hidden sm:inline">/</span>
              <span className="text-purple-light font-semibold text-sm hidden sm:inline">
                <Briefcase className="inline-block w-5 h-5 mr-2" /> Vagas Empresas
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-4">
              {navLinks}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

          {/* Mobile menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-dark-border mt-3 pt-3 flex flex-col gap-2"
              >
                {navLinks}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* ===== CONTEÚDO ===== */}
      <div className="relative z-10 container mx-auto px-4 max-w-6xl pt-28 pb-20">

        {/* Hero da página */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                <Briefcase className="inline-block w-5 h-5 mr-2" /> <span className="gradient-text">Vagas Empresas</span>
              </h1>
              <p className="text-gray-400 text-lg">
                {isCompany
                  ? 'Gerencie suas vagas e acompanhe os candidatos inscritos.'
                  : 'Encontre a vaga ideal e candidate-se com seu currículo.'}
              </p>
            </div>

            {/* Botão criar vaga (somente empresa) */}
            {isCompany && (
              <motion.button
                onClick={() => setShowNewJobModal(true)}
                className="btn-primary px-6 py-3 text-sm font-semibold flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                + Publicar Nova Vaga
              </motion.button>
            )}

            {/* CTA para não logados */}
            {!user && !authLoading && (
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="btn-secondary px-5 py-2.5 text-sm"
                >
                  Entrar para candidatar-se
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Barra de busca e filtros */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-4 rounded-2xl mb-8 flex flex-col md:flex-row gap-4"
        >
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, descrição ou habilidade..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main text-sm"
            />
          </div>

          {/* Filtro tipo */}
          <div className="flex gap-2 flex-wrap">
            {EMPLOYMENT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterType === type
                    ? 'bg-purple-main text-white shadow-lg shadow-purple-main/25'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Contagem de resultados */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-500 text-sm">
            {jobsLoading ? 'Carregando...' : `${filteredJobs.length} vaga${filteredJobs.length !== 1 ? 's' : ''} encontrada${filteredJobs.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* ===== LISTA DE VAGAS ===== */}
        {jobsLoading ? (
          <div className="flex justify-center py-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-purple-main border-t-transparent rounded-full"
            />
          </div>
        ) : filteredJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass p-20 rounded-2xl text-center"
          >
            <div className="mb-6 flex justify-center"><Search className="w-20 h-20 text-gray-500" /></div>
            <h3 className="text-2xl font-bold text-white mb-2">Nenhuma vaga encontrada</h3>
            <p className="text-gray-400">
              {search || filterType !== 'Todos'
                ? 'Tente ajustar os filtros de busca.'
                : isCompany
                ? 'Publique sua primeira vaga clicando em "+ Publicar Nova Vaga".'
                : 'Novas vagas serão publicadas em breve. Volte mais tarde!'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {filteredJobs.map((job, index) => {
                const alreadyApplied = myApplicationJobIds.has(job.id)
                const justApplied = applySuccess === job.id

                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -3 }}
                    className="glass rounded-2xl flex flex-col hover:border-purple-main/40 transition-all group"
                  >
                    {/* Card body */}
                    <div className="p-6 flex-1">
                      {/* Header do card */}
                      <div className="flex justify-between items-start gap-3 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-white group-hover:text-purple-light transition-colors truncate">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {job.employment_type && (
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${EMPLOYMENT_COLORS[job.employment_type] || 'bg-white/10 text-gray-300 border-white/10'}`}>
                                {job.employment_type}
                              </span>
                            )}
                            {job.experience_level && (
                              <span className="px-2.5 py-0.5 bg-white/5 border border-white/10 text-gray-400 rounded-full text-xs">
                                {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)}
                              </span>
                            )}
                            {isCompany && (
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${job.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                {job.status === 'active' ? '● Ativa' : '○ Inativa'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Salário */}
                        {job.salary_range && (
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-gray-500 mb-0.5">Salário</p>
                            <p className="text-white font-semibold text-sm">{job.salary_range}</p>
                          </div>
                        )}
                      </div>

                      {/* Descrição */}
                      {job.description && (
                        <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">
                          {job.description}
                        </p>
                      )}

                      {/* Requisitos */}
                      {job.requirements && (
                        <div className="mb-4 p-3 bg-white/3 rounded-lg border border-white/5">
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1.5">Requisitos</p>
                          <p className="text-gray-300 text-xs leading-relaxed line-clamp-3">
                            {job.requirements}
                          </p>
                        </div>
                      )}

                      {/* Skills */}
                      {Array.isArray(job.required_skills) && job.required_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {job.required_skills.slice(0, 6).map((skill, i) => (
                            <span key={i} className="px-2 py-0.5 bg-purple-main/10 border border-purple-main/20 text-purple-light rounded text-xs">
                              {skill}
                            </span>
                          ))}
                          {job.required_skills.length > 6 && (
                            <span className="text-gray-600 text-xs self-center">
                              +{job.required_skills.length - 6}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Card footer */}
                    <div className="px-6 pb-6 pt-3 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <p className="text-gray-600 text-xs">
                          {new Date(job.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </p>

                        {/* Ação: empresa vê candidatos / candidato se candidata */}
                        {isCompany ? (
                          <motion.button
                            onClick={() => setApplicantsModal(job)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-main/10 hover:bg-purple-main/20 text-purple-light border border-purple-main/20 rounded-lg text-sm font-medium transition-all"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            <Users className="inline-block w-4 h-4 mr-2" /> Ver Candidatos
                          </motion.button>
                        ) : (
                          <motion.button
                            onClick={() => {
                              if (!user) { navigate('/login'); return }
                              setApplyModal(job)
                            }}
                            disabled={alreadyApplied || justApplied}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              alreadyApplied || justApplied
                                ? 'bg-green-500/15 text-green-400 border border-green-500/30 cursor-default'
                                : 'btn-primary'
                            }`}
                            whileHover={!alreadyApplied ? { scale: 1.03 } : {}}
                            whileTap={!alreadyApplied ? { scale: 0.97 } : {}}
                          >
                            {alreadyApplied || justApplied
                              ? '<Check className="inline-block w-4 h-4 mr-2" /> Candidatura Enviada'
                              : '<Rocket className="inline-block w-4 h-4 mr-2" /> Candidatar-se'}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* CTA de cadastro para visitantes */}
        {!user && !authLoading && filteredJobs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 glass p-8 rounded-2xl text-center"
          >
            <h3 className="text-2xl font-bold text-white mb-2">
              Encontrou a vaga ideal?
            </h3>
            <p className="text-gray-400 mb-6">
              Cadastre-se gratuitamente para enviar sua candidatura.
            </p>
            <div className="flex justify-center gap-4">
              <motion.button
                onClick={() => navigate('/register')}
                className="btn-primary px-8 py-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Criar Conta Grátis
              </motion.button>
              <motion.button
                onClick={() => navigate('/login')}
                className="btn-secondary px-8 py-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Já Tenho Conta
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ===== MODAL NOVA VAGA (Empresa) ===== */}
      <AnimatePresence>
        {showNewJobModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNewJobModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-dark-bg border border-dark-border rounded-2xl p-8 max-w-2xl w-full relative max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowNewJobModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
              >
                ✕
              </button>

              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-main/15 border border-purple-main/30 rounded-full text-purple-light text-xs font-medium mb-3">
                  <Briefcase className="inline-block w-5 h-5 mr-2" /> Nova Vaga
                </div>
                <h2 className="text-2xl font-bold gradient-text">Publicar Vaga</h2>
                <p className="text-gray-400 text-sm mt-1">Preencha os detalhes da posição aberta na sua empresa.</p>
              </div>

              <form onSubmit={handleCreateJob} className="space-y-5">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Título da Vaga <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Ex: Desenvolvedor Full Stack Sênior"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main text-sm"
                    required
                  />
                </div>

                {/* Tipo + Experiência + Salário */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Regime</label>
                    <select
                      value={jobEmploymentType}
                      onChange={(e) => setJobEmploymentType(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-main text-sm bg-dark-bg"
                    >
                      {['CLT', 'PJ', 'Híbrido', 'Freelancer', 'Estágio'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nível</label>
                    <select
                      value={jobExperience}
                      onChange={(e) => setJobExperience(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-main text-sm bg-dark-bg"
                    >
                      <option value="estagio">Estágio</option>
                      <option value="junior">Júnior</option>
                      <option value="pleno">Pleno</option>
                      <option value="senior">Sênior</option>
                      <option value="especialista">Especialista</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Salário</label>
                    <input
                      type="text"
                      value={jobSalary}
                      onChange={(e) => setJobSalary(e.target.value)}
                      placeholder="Ex: R$ 8.000 - 12.000"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main text-sm"
                    />
                  </div>
                </div>

                {/* Habilidades */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Habilidades (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={jobSkills}
                    onChange={(e) => setJobSkills(e.target.value)}
                    placeholder="React, Node.js, TypeScript, Docker"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main text-sm"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descrição da Vaga</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={3}
                    placeholder="Descreva as responsabilidades e o contexto da posição..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main text-sm resize-none"
                  />
                </div>

                {/* Requisitos */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Requisitos da Vaga</label>
                  <textarea
                    value={jobRequirements}
                    onChange={(e) => setJobRequirements(e.target.value)}
                    rows={3}
                    placeholder="Liste os requisitos obrigatórios e desejáveis..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main text-sm resize-none"
                  />
                </div>

                {/* Ações */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewJobModal(false)}
                    className="flex-1 py-3 px-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-semibold transition-colors text-sm"
                  >
                    Cancelar
                  </button>
                  <motion.button
                    type="submit"
                    disabled={jobLoading}
                    className="flex-1 btn-primary py-3 rounded-lg font-semibold disabled:opacity-50 text-sm"
                    whileHover={!jobLoading ? { scale: 1.02 } : {}}
                    whileTap={!jobLoading ? { scale: 0.98 } : {}}
                  >
                    {jobLoading ? 'Publicando...' : '<Rocket className="inline-block w-4 h-4 mr-2" /> Publicar Vaga'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MODAL CANDIDATURA ===== */}
      <AnimatePresence>
        {applyModal && (
          <JobApplicationModal
            job={applyModal}
            user={user}
            userData={userData}
            onClose={() => setApplyModal(null)}
            onSuccess={() => handleApplicationSuccess(applyModal.id)}
          />
        )}
      </AnimatePresence>

      {/* ===== MODAL CANDIDATOS (empresa) ===== */}
      <AnimatePresence>
        {applicantsModal && (
          <JobApplicantsModal
            job={applicantsModal}
            onClose={() => setApplicantsModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
