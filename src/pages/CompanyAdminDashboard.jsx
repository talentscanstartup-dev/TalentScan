import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { auth, supabase, isSuperAdmin } from '../config/supabase'
import SettingsPanel from '../components/SettingsPanel'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

import { 
  BarChart3, Briefcase, Users, BrainCircuit, Settings,
  CheckCircle2, AlertCircle, Save, Settings2, SlidersHorizontal,
  Code2, CalendarDays, GraduationCap, Wrench, MessagesSquare, Languages,
  Leaf, Scale, Target, Eye, Clock, Check, X, Search
} from 'lucide-react'

export default function CompanyAdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [company, setCompany] = useState(null)
  const [employees, setEmployees] = useState([])
  const [jobs, setJobs] = useState([])
  const [candidates, setCandidates] = useState([])
  const [rawMatches, setRawMatches] = useState([])

  // Filtro por vaga
  const [selectedJobFilter, setSelectedJobFilter] = useState('all')

  // Tipo do Gráfico de Funil
  const [chartType, setChartType] = useState('bar')

  // Estados para Modal de Vagas
  const [showJobModal, setShowJobModal] = useState(false)
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jobSkills, setJobSkills] = useState('')
  const [jobExperience, setJobExperience] = useState('pleno')
  const [jobSalary, setJobSalary] = useState('')
  const [jobLoading, setJobLoading] = useState(false)

  // Modal de detalhes do candidato
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(null)

  // Estados para Configurações da Empresa
  const [compName, setCompName] = useState('')
  const [compCnpj, setCompCnpj] = useState('')
  const [compIndustry, setCompIndustry] = useState('')
  const [compSize, setCompSize] = useState('')
  const [compEmail, setCompEmail] = useState('')
  const [compPhone, setCompPhone] = useState('')
  const [compDesc, setCompDesc] = useState('')
  const [compWebsite, setCompWebsite] = useState('')
  const [compLoading, setCompLoading] = useState(false)
  const [compSuccess, setCompSuccess] = useState(false)

  // Estados para Critérios de IA
  const DEFAULT_AI_CRITERIA = {
    technical_skills: 40,
    experience_years: 25,
    education: 15,
    specific_tools: 10,
    soft_skills: 5,
    languages: 5,
    enabled_criteria: ['technical_skills', 'experience_years', 'education', 'specific_tools', 'soft_skills', 'languages'],
    strictness_level: 'balanced',
  }
  const [aiCriteria, setAiCriteria] = useState(DEFAULT_AI_CRITERIA)
  const [aiCriteriaLoading, setAiCriteriaLoading] = useState(false)
  const [aiCriteriaSuccess, setAiCriteriaSuccess] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const currentUser = await auth.getCurrentUser()
    if (!currentUser) {
      navigate('/login')
      return
    }

    // Verificar se é uma empresa
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', currentUser.id)
      .single()

    if (userData?.role !== 'COMPANY' && !isSuperAdmin(currentUser.email)) {
      navigate('/dashboard')
      return
    }

    setUser(userData)

    // Carregar dados da empresa
    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('owner_id', currentUser.id)
      .single()

    if (companyData) {
      setCompany(companyData)
      setCompName(companyData.company_name || '')
      setCompCnpj(companyData.cnpj || '')
      setCompIndustry(companyData.industry || '')
      setCompSize(companyData.company_size || '')
      setCompEmail(companyData.contact_email || '')
      setCompPhone(companyData.contact_phone || '')
      setCompDesc(companyData.description || '')
      setCompWebsite(companyData.website || '')

      // Carregar critérios de IA salvos
      if (companyData.ai_criteria_weights) {
        setAiCriteria({ ...DEFAULT_AI_CRITERIA, ...companyData.ai_criteria_weights })
      }

      // Carregar funcionários vinculados a esta empresa
      const { data: employeesData } = await supabase
        .from('users')
        .select('*')
        .eq('company_id', companyData.id)

      if (employeesData) setEmployees(employeesData)
    }

    // Carregar vagas criadas por este usuário
    const { data: jobsData } = await supabase
      .from('job_positions')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })

    if (jobsData) setJobs(jobsData)

    // Carregar candidatos (matches) do recrutador com dados completos
    const { data: matchesData } = await supabase
      .from('matches')
      .select(`
        *,
        candidates ( * ),
        job_positions ( id, title )
      `)
      .eq('user_id', currentUser.id)
      .order('match_score', { ascending: false })

    if (matchesData) {
      setRawMatches(matchesData)
      const mappedCandidates = matchesData.map(m => ({
        id: m.id,
        matchId: m.id,
        candidateId: m.candidates?.id,
        name: m.candidates?.full_name || 'Candidato',
        email: m.candidates?.email || '',
        position: m.job_positions?.title || 'Vaga',
        jobId: m.job_positions?.id,
        status: m.status || 'new',
        score: m.match_score,
        skills: m.candidates?.skills || [],
        location: m.candidates?.location || '',
        summary: m.candidates?.professional_summary || '',
        analysis: m.candidates?.analysis_result || null,
        aiScore: m.candidates?.ai_score,
        filename: m.candidates?.cv_filename || '',
        createdAt: m.created_at,
      }))
      setCandidates(mappedCandidates)
    }

    setLoading(false)
  }

  const handleCreateJob = async (e) => {
    e.preventDefault()
    if (!jobTitle.trim()) return

    setJobLoading(true)
    try {
      const skillsArray = jobSkills.split(',').map(s => s.trim()).filter(s => s)
      const { data, error } = await supabase
        .from('job_positions')
        .insert({
          user_id: user.id,
          title: jobTitle,
          description: jobDescription,
          required_skills: skillsArray,
          experience_level: jobExperience,
          salary_range: jobSalary,
          status: 'active'
        })
        .select()

      if (error) throw error

      if (data) {
        setJobs(prev => [data[0], ...prev])
        setShowJobModal(false)
        setJobTitle('')
        setJobDescription('')
        setJobSkills('')
        setJobExperience('pleno')
        setJobSalary('')
      }
    } catch (err) {
      alert('Erro ao criar vaga: ' + err.message)
    } finally {
      setJobLoading(false)
    }
  }

  const handleUpdateStatus = async (matchId, newStatus) => {
    setUpdatingStatus(matchId)
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: newStatus })
        .eq('id', matchId)

      if (error) throw error

      setCandidates(prev =>
        prev.map(c => c.matchId === matchId ? { ...c, status: newStatus } : c)
      )
      if (selectedCandidate?.matchId === matchId) {
        setSelectedCandidate(prev => ({ ...prev, status: newStatus }))
      }
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleTestBidirectionalMatch = async (candidateId) => {
    if (!candidateId) return;
    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      if (!token) throw new Error('Não autorizado')

      alert('Iniciando teste de match contra todas as vagas. A IA está analisando, por favor aguarde...');
      const response = await fetch(`http://localhost:3000/api/candidates/${candidateId}/match-all-jobs`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        if (data.matches.length === 0) {
          alert('Não há vagas abertas para testar o match.');
        } else {
          const results = data.matches.map(m => `🔹 Vaga: ${m.job_title}\n⭐ Score: ${m.compatibility_score}%\n📝 Resumo: ${m.compatibility_summary}`).join('\n\n');
          alert(`Resultados do Match Bi-Direcional:\n\n${results}`);
        }
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro ao testar match: ' + err.message)
    }
  }

  const handleUpdateCompany = async (e) => {
    e.preventDefault()
    setCompLoading(true)
    setCompSuccess(false)
    try {
      const { error } = await supabase
        .from('companies')
        .update({
          company_name: compName,
          cnpj: compCnpj,
          industry: compIndustry,
          company_size: compSize,
          contact_email: compEmail,
          contact_phone: compPhone,
          description: compDesc,
          website: compWebsite,
          updated_at: new Date()
        })
        .eq('id', company.id)

      if (error) throw error

      setCompany(prev => ({
        ...prev,
        company_name: compName,
        cnpj: compCnpj,
        industry: compIndustry,
        company_size: compSize,
        contact_email: compEmail,
        contact_phone: compPhone,
        description: compDesc,
        website: compWebsite
      }))
      setCompSuccess(true)
      setTimeout(() => setCompSuccess(false), 3000)
    } catch (err) {
      alert('Erro ao atualizar empresa: ' + err.message)
    } finally {
      setCompLoading(false)
    }
  }

  const handleLogout = async () => {
    await auth.logout()
    navigate('/')
  }

  // Critérios de IA: redistribuir pesos proporcionalmente
  const AI_CRITERIA_KEYS = ['technical_skills', 'experience_years', 'education', 'specific_tools', 'soft_skills', 'languages']

  const handleCriteriaWeightChange = (key, newValue) => {
    const val = Math.max(0, Math.min(100, Number(newValue)))
    const enabled = aiCriteria.enabled_criteria
    const otherEnabledKeys = AI_CRITERIA_KEYS.filter(k => k !== key && enabled.includes(k))
    const remaining = 100 - val
    const currentOtherSum = otherEnabledKeys.reduce((sum, k) => sum + (aiCriteria[k] || 0), 0)

    let updated = { ...aiCriteria, [key]: val }
    if (otherEnabledKeys.length > 0 && currentOtherSum > 0) {
      otherEnabledKeys.forEach(k => {
        updated[k] = Math.round((aiCriteria[k] / currentOtherSum) * remaining)
      })
      // Ajuste de arredondamento
      const total = AI_CRITERIA_KEYS.filter(k => enabled.includes(k)).reduce((s, k) => s + (updated[k] || 0), 0)
      if (total !== 100) {
        const lastKey = otherEnabledKeys[otherEnabledKeys.length - 1]
        updated[lastKey] = Math.max(0, (updated[lastKey] || 0) + (100 - total))
      }
    }
    setAiCriteria(updated)
  }

  const handleCriteriaToggle = (key) => {
    const enabled = aiCriteria.enabled_criteria
    const isEnabled = enabled.includes(key)
    const newEnabled = isEnabled ? enabled.filter(k => k !== key) : [...enabled, key]

    // Redistribuir pesos ao desabilitar
    const enabledKeys = AI_CRITERIA_KEYS.filter(k => newEnabled.includes(k))
    const total = enabledKeys.reduce((sum, k) => sum + (aiCriteria[k] || 0), 0)
    let updated = { ...aiCriteria, enabled_criteria: newEnabled }
    if (isEnabled) {
      updated[key] = 0
      // Redistribuir peso para os outros habilitados
      const freed = aiCriteria[key] || 0
      const otherKeys = enabledKeys.filter(k => k !== key)
      if (otherKeys.length > 0) {
        const otherSum = otherKeys.reduce((s, k) => s + (aiCriteria[k] || 0), 0)
        otherKeys.forEach(k => {
          updated[k] = Math.round((aiCriteria[k] / Math.max(1, otherSum)) * (otherSum + freed))
        })
      }
    } else {
      // Redistribuir para incluir o novo critério com peso mínimo
      const minWeight = 5
      updated[key] = minWeight
      const otherKeys = enabledKeys.filter(k => k !== key)
      const excess = Math.max(0, (total + minWeight) - 100)
      if (otherKeys.length > 0 && excess > 0) {
        const highestKey = otherKeys.reduce((max, k) => (updated[k] || 0) > (updated[max] || 0) ? k : max, otherKeys[0])
        updated[highestKey] = Math.max(0, (updated[highestKey] || 0) - excess)
      }
    }
    setAiCriteria(updated)
  }

  const handleSaveAiCriteria = async () => {
    if (!company?.id) return
    setAiCriteriaLoading(true)
    setAiCriteriaSuccess(false)
    try {
      const { error } = await supabase
        .from('companies')
        .update({ ai_criteria_weights: aiCriteria, updated_at: new Date() })
        .eq('id', company.id)
      if (error) throw error
      setAiCriteriaSuccess(true)
      setTimeout(() => setAiCriteriaSuccess(false), 3000)
    } catch (err) {
      alert('Erro ao salvar critérios: ' + err.message)
    } finally {
      setAiCriteriaLoading(false)
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

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: <BarChart3 size={18} className="mr-2" /> },
    { id: 'jobs', label: 'Vagas', icon: <Briefcase size={18} className="mr-2" /> },
    { id: 'candidates', label: `Candidatos (${candidates.length})`, icon: <Users size={18} className="mr-2" /> },
    { id: 'ai_criteria', label: 'Critérios IA', icon: <BrainCircuit size={18} className="mr-2" /> },

    { id: 'settings', label: 'Configurações', icon: <Settings size={18} className="mr-2" /> },
  ]

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  // Candidatos filtrados por vaga
  const filteredCandidates = selectedJobFilter === 'all'
    ? candidates
    : candidates.filter(c => String(c.jobId) === String(selectedJobFilter))

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
      case 'shortlisted': return <span className="flex items-center gap-1"><Check size={14}/> Aprovado</span>
      case 'rejected': return <span className="flex items-center gap-1"><X size={14}/> Rejeitado</span>
      case 'viewed': return <span className="flex items-center gap-1"><Eye size={14}/> Visualizado</span>
      case 'interview': return <span className="flex items-center gap-1"><CalendarDays size={14}/> Entrevista</span>
      default: return <span className="flex items-center gap-1"><Clock size={14}/> Novo</span>
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
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-main to-purple-light flex items-center justify-center">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Painel Empresarial</h1>
              <p className="text-xs text-gray-400">{company?.company_name || 'Empresa'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => navigate('/vagas-empresas')}
              className="flex items-center gap-1.5 text-purple-light hover:text-white transition-colors text-sm font-semibold"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Briefcase size={16} /> Vagas Públicas
            </motion.button>

            <motion.button
              onClick={() => navigate('/dashboard')}
              className="text-gray-400 hover:text-purple-light transition-colors text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Voltar
            </motion.button>

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
        className="relative z-10 container mx-auto px-4 max-w-6xl pt-24 pb-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all text-sm ${
                activeTab === tab.id
                  ? 'bg-purple-main text-white shadow-lg shadow-purple-main/25'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Conteúdo das Abas */}
        <AnimatePresence mode="wait">

          {/* ======================== ABA: VISÃO GERAL ======================== */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-white">Visão Geral</h2>

              {/* Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  className="glass p-6 rounded-xl text-center cursor-pointer hover:border-purple-main/30 transition-all"
                  whileHover={{ y: -2 }}
                  onClick={() => setActiveTab('jobs')}
                >
                  <p className="text-4xl font-bold gradient-text">{jobs.length}</p>
                  <p className="text-gray-400 mt-2">Vagas Abertas</p>
                </motion.div>

                <motion.div
                  className="glass p-6 rounded-xl text-center cursor-pointer hover:border-purple-main/30 transition-all"
                  whileHover={{ y: -2 }}
                  onClick={() => setActiveTab('candidates')}
                >
                  <p className="text-4xl font-bold gradient-text">{candidates.length}</p>
                  <p className="text-gray-400 mt-2">Candidatos</p>
                </motion.div>

                <motion.div className="glass p-6 rounded-xl text-center">
                  <p className="text-4xl font-bold gradient-text">
                    {candidates.filter(c => c.status === 'shortlisted').length}
                  </p>
                  <p className="text-gray-400 mt-2">Aprovados</p>
                </motion.div>
              </div>

              {/* Gráficos Analíticos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Gráfico 1: Score por Vaga */}
                <motion.div className="glass p-6 rounded-xl">
                  <h3 className="text-lg font-bold text-white mb-6">Média de Score por Vaga</h3>
                  <div className="h-64 w-full">
                    {jobs.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={
                          jobs.map(job => {
                            const jobCands = candidates.filter(c => c.jobId === job.id && c.score != null)
                            return {
                              name: job.title.length > 15 ? job.title.substring(0, 15) + '...' : job.title,
                              Score: jobCands.length ? Math.round(jobCands.reduce((acc, c) => acc + c.score, 0) / jobCands.length) : 0
                            }
                          }).filter(j => j.Score > 0)
                        }>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                          <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{fill: '#ffffff10'}} contentStyle={{ backgroundColor: '#1f1f23', border: '1px solid #333', borderRadius: '8px' }} />
                          <Bar dataKey="Score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500 text-sm">Sem dados suficientes</div>
                    )}
                  </div>
                </motion.div>

                {/* Gráfico 2: Status dos Candidatos */}
                <motion.div className="glass p-6 rounded-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Funil de Candidatos</h3>
                    <div className="flex gap-2 bg-white/5 rounded-lg p-1">
                      <button 
                        onClick={() => setChartType('bar')} 
                        className={`px-3 py-1 text-xs rounded-md transition-all ${chartType === 'bar' ? 'bg-purple-main text-white shadow' : 'text-gray-400 hover:text-white'}`}
                      >
                        Barras
                      </button>
                      <button 
                        onClick={() => setChartType('pie')} 
                        className={`px-3 py-1 text-xs rounded-md transition-all ${chartType === 'pie' ? 'bg-purple-main text-white shadow' : 'text-gray-400 hover:text-white'}`}
                      >
                        Pizza
                      </button>
                    </div>
                  </div>
                  <div className="h-64 w-full flex items-center justify-center">
                    {candidates.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'pie' ? (
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'Aprovados', value: candidates.filter(c => c.status === 'shortlisted').length },
                                { name: 'Entrevista', value: candidates.filter(c => c.status === 'interview').length },
                                { name: 'Novos', value: candidates.filter(c => c.status === 'new').length },
                                { name: 'Rejeitados', value: candidates.filter(c => c.status === 'rejected').length },
                              ].filter(d => d.value > 0)}
                              cx="50%" cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {[
                                { name: 'Aprovados', value: candidates.filter(c => c.status === 'shortlisted').length },
                                { name: 'Entrevista', value: candidates.filter(c => c.status === 'interview').length },
                                { name: 'Novos', value: candidates.filter(c => c.status === 'new').length },
                                { name: 'Rejeitados', value: candidates.filter(c => c.status === 'rejected').length },
                              ].filter(d => d.value > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#10b981', '#eab308', '#8b5cf6', '#ef4444'][index % 4]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1f1f23', border: '1px solid #333', borderRadius: '8px' }} />
                          </PieChart>
                        ) : (
                          <BarChart data={[
                            { name: 'Aprovados', value: candidates.filter(c => c.status === 'shortlisted').length },
                            { name: 'Entrevista', value: candidates.filter(c => c.status === 'interview').length },
                            { name: 'Novos', value: candidates.filter(c => c.status === 'new').length },
                            { name: 'Rejeitados', value: candidates.filter(c => c.status === 'rejected').length },
                          ].filter(d => d.value > 0)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip cursor={{fill: '#ffffff10'}} contentStyle={{ backgroundColor: '#1f1f23', border: '1px solid #333', borderRadius: '8px' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {[
                                { name: 'Aprovados', value: candidates.filter(c => c.status === 'shortlisted').length },
                                { name: 'Entrevista', value: candidates.filter(c => c.status === 'interview').length },
                                { name: 'Novos', value: candidates.filter(c => c.status === 'new').length },
                                { name: 'Rejeitados', value: candidates.filter(c => c.status === 'rejected').length },
                              ].filter(d => d.value > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#10b981', '#eab308', '#8b5cf6', '#ef4444'][index % 4]} />
                              ))}
                            </Bar>
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500 text-sm">Sem dados suficientes</div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Candidatos recentes */}
              {candidates.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Candidatos Recentes</h3>
                    <button
                      onClick={() => setActiveTab('candidates')}
                      className="text-purple-light text-sm hover:underline"
                    >
                      Ver todos →
                    </button>
                  </div>
                  <div className="space-y-3">
                    {candidates.slice(0, 3).map(c => (
                      <motion.div
                        key={c.id}
                        className="glass p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-purple-main/30 transition-all"
                        whileHover={{ x: 2 }}
                        onClick={() => setSelectedCandidate(c)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-main flex items-center justify-center text-white font-bold">
                            {c.name?.[0] || 'C'}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{c.name}</p>
                            <p className="text-gray-500 text-xs">{c.position}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {c.score !== null && c.score !== undefined && (
                            <span className={`text-sm font-bold ${
                              c.score >= 80 ? 'text-green-400' :
                              c.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {Math.round(c.score)}%
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusStyle(c.status)}`}>
                            {getStatusLabel(c.status)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ======================== ABA: VAGAS ======================== */}
          {activeTab === 'jobs' && (
            <motion.div
              key="jobs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">💼 Vagas Ativas</h2>
                <motion.button
                  onClick={() => setShowJobModal(true)}
                  className="btn-primary px-4 py-2 text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  + Nova Vaga
                </motion.button>
              </div>

              {jobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobs.map((job) => {
                    const jobCandidatesCount = candidates.filter(c => String(c.jobId) === String(job.id)).length
                    return (
                      <motion.div
                        key={job.id}
                        className="glass p-6 rounded-xl hover:border-purple-main/40 transition-all flex flex-col justify-between group"
                        whileHover={{ y: -2 }}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-xl font-bold text-white group-hover:text-purple-light transition-colors">
                              {job.title}
                            </h3>
                            <span className="px-2.5 py-0.5 bg-purple-main/20 text-purple-light text-xs font-semibold rounded-full uppercase flex-shrink-0">
                              {job.experience_level || 'Pleno'}
                            </span>
                          </div>
                          <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                            {job.description || 'Sem descrição.'}
                          </p>

                          <div className="space-y-2 mb-4">
                            <p className="text-xs text-gray-500 font-semibold uppercase">Habilidades</p>
                            <div className="flex flex-wrap gap-1.5">
                              {Array.isArray(job.required_skills) && job.required_skills.map((skill, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-gray-300 text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">💰 {job.salary_range || 'A combinar'}</span>
                            <span className="text-gray-500 text-xs">
                              {new Date(job.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <motion.button
                            onClick={() => {
                              setSelectedJobFilter(String(job.id))
                              setActiveTab('candidates')
                            }}
                            className="w-full py-2 text-sm rounded-lg bg-purple-main/10 hover:bg-purple-main/20 text-purple-light border border-purple-main/20 font-medium transition-all"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            👥 Ver Candidatos ({jobCandidatesCount})
                          </motion.button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <motion.div className="glass p-16 rounded-2xl text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="text-6xl mb-4">💼</div>
                  <p className="text-gray-400 mb-2">Nenhuma vaga publicada</p>
                  <p className="text-gray-500 text-sm">Clique em "+ Nova Vaga" para publicar e começar a receber candidatos.</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ======================== ABA: CANDIDATOS ======================== */}
          {activeTab === 'candidates' && (
            <motion.div
              key="candidates"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-white">🎯 Candidatos</h2>
                <div className="flex items-center gap-3">
                  {/* Filtro por Vaga */}
                  <select
                    value={selectedJobFilter}
                    onChange={(e) => setSelectedJobFilter(e.target.value)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-main bg-dark-bg"
                  >
                    <option value="all">Todas as vagas ({candidates.length})</option>
                    {jobs.map(job => (
                      <option key={job.id} value={String(job.id)}>
                        {job.title} ({candidates.filter(c => String(c.jobId) === String(job.id)).length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredCandidates.length > 0 ? (
                <div className="space-y-4">
                  {filteredCandidates.map((candidate) => (
                    <motion.div
                      key={candidate.id}
                      className="glass p-6 rounded-xl hover:border-purple-main/30 transition-all"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        {/* Avatar e Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-main to-purple-light flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                            {candidate.name?.[0] || 'C'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className="text-white font-bold text-lg">{candidate.name}</h3>
                              {candidate.score !== null && candidate.score !== undefined && (
                                <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                                  candidate.score >= 80 ? 'bg-green-500/20 text-green-400' :
                                  candidate.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {Math.round(candidate.score)}% match
                                </span>
                              )}
                            </div>
                            <p className="text-purple-light text-sm font-medium mb-1">📌 {candidate.position}</p>
                            {candidate.email && (
                              <p className="text-gray-500 text-xs">{candidate.email}</p>
                            )}
                            {candidate.location && (
                              <p className="text-gray-500 text-xs">📍 {candidate.location}</p>
                            )}
                            {candidate.skills && candidate.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {candidate.skills.slice(0, 4).map((s, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-gray-400 text-xs">
                                    {s}
                                  </span>
                                ))}
                                {candidate.skills.length > 4 && (
                                  <span className="text-gray-600 text-xs">+{candidate.skills.length - 4}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Ações e Status */}
                        <div className="flex flex-col gap-3 min-w-fit">
                          {/* Status atual */}
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border text-center ${getStatusStyle(candidate.status)}`}>
                            {getStatusLabel(candidate.status)}
                          </span>

                          {/* Botões de ação */}
                          <div className="flex gap-2 flex-wrap">
                            <motion.button
                              onClick={() => handleUpdateStatus(candidate.matchId, 'shortlisted')}
                              disabled={updatingStatus === candidate.matchId || candidate.status === 'shortlisted'}
                              className="flex-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              ✓ Aprovar
                            </motion.button>
                            <motion.button
                              onClick={() => handleUpdateStatus(candidate.matchId, 'interview')}
                              disabled={updatingStatus === candidate.matchId || candidate.status === 'interview'}
                              className="flex-1 px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              📅 Entrevista
                            </motion.button>
                            <motion.button
                              onClick={() => handleUpdateStatus(candidate.matchId, 'rejected')}
                              disabled={updatingStatus === candidate.matchId || candidate.status === 'rejected'}
                              className="flex-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              ✕ Rejeitar
                            </motion.button>
                          </div>

                          {/* Ver detalhes e Match */}
                          <div className="flex flex-col gap-2">
                            <motion.button
                              onClick={() => handleTestBidirectionalMatch(candidate.candidateId)}
                              className="w-full px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-medium transition-all"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              🤖 Testar em Todas Vagas
                            </motion.button>
                            <motion.button
                              onClick={() => setSelectedCandidate(candidate)}
                              className="w-full px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-lg text-xs font-medium transition-all"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              🔍 Ver Análise Completa
                            </motion.button>
                          </div>

                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div className="glass p-16 rounded-2xl text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-gray-400 mb-2">Nenhum candidato encontrado</p>
                  <p className="text-gray-500 text-sm">
                    {selectedJobFilter !== 'all'
                      ? 'Nenhum candidato se inscreveu para esta vaga ainda.'
                      : 'Os candidatos aparecerão aqui quando se inscreverem nas suas vagas.'}
                  </p>
                  {selectedJobFilter !== 'all' && (
                    <button
                      onClick={() => setSelectedJobFilter('all')}
                      className="mt-4 text-purple-light text-sm hover:underline"
                    >
                      Ver todos os candidatos
                    </button>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ======================== ABA: CRITÉRIOS IA ======================== */}
          {activeTab === 'ai_criteria' && (
            <motion.div
              key="ai_criteria"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BrainCircuit className="text-purple-main" size={28} />
                    Critérios de Análise da IA
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Configure como a Inteligência Artificial avalia e pondera cada currículo para suas vagas
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg bg-purple-main/10 border border-purple-main/20 text-purple-light">
                  <AlertCircle size={14} />
                  <span>Aplica-se a todas as vagas da empresa</span>
                </div>
              </div>

              {/* Success Banner */}
              <AnimatePresence>
                {aiCriteriaSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    <span>Critérios salvos com sucesso! As próximas análises utilizarão estas configurações.</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Card */}
              <div className="glass rounded-2xl overflow-hidden">
                {/* Gradient header bar */}
                <div className="h-1 w-full bg-gradient-to-r from-purple-main via-purple-light to-pink-500" />

                <div className="p-8 space-y-8">
                  {/* FOCO DA ANÁLISE */}
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <SlidersHorizontal size={20} className="text-purple-400" />
                          Foco da Análise
                        </h3>
                        <p className="text-gray-500 text-xs mt-0.5">Defina o peso percentual de cada critério. O total deve ser sempre 100%.</p>
                      </div>
                      {/* Total indicator */}
                      {(() => {
                        const enabled = aiCriteria.enabled_criteria || []
                        const total = ['technical_skills','experience_years','education','specific_tools','soft_skills','languages']
                          .filter(k => enabled.includes(k))
                          .reduce((s, k) => s + (aiCriteria[k] || 0), 0)
                        const isOk = total === 100
                        return (
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-bold text-sm ${
                            isOk
                              ? 'bg-green-500/10 border-green-500/30 text-green-400'
                              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                          }`}>
                            {isOk ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                            <span>Total: {total}%</span>
                          </div>
                        )
                      })()}
                    </div>

                    {/* Criteria Rows */}
                    <div className="space-y-4">
                      {[
                        { key: 'technical_skills', label: 'Habilidades Técnicas', desc: 'Hard skills, linguagens, frameworks', icon: <Code2 size={20} />, color: 'from-blue-500 to-cyan-400' },
                        { key: 'experience_years', label: 'Tempo de Experiência', desc: 'Anos de atuação profissional relevante', icon: <CalendarDays size={20} />, color: 'from-purple-500 to-purple-400' },
                        { key: 'education', label: 'Formação Acadêmica', desc: 'Graduação, pós, certificações', icon: <GraduationCap size={20} />, color: 'from-green-500 to-emerald-400' },
                        { key: 'specific_tools', label: 'Ferramentas Específicas', desc: 'Softwares, plataformas e tecnologias', icon: <Wrench size={20} />, color: 'from-orange-500 to-amber-400' },
                        { key: 'soft_skills', label: 'Soft Skills', desc: 'Comunicação, liderança, colaboração', icon: <MessagesSquare size={20} />, color: 'from-pink-500 to-rose-400' },
                        { key: 'languages', label: 'Idiomas', desc: 'Inglês, espanhol e outros idiomas', icon: <Languages size={20} />, color: 'from-teal-500 to-cyan-400' },
                      ].map(({ key, label, desc, icon, color }) => {
                        const isEnabled = (aiCriteria.enabled_criteria || []).includes(key)
                        const weight = aiCriteria[key] || 0
                        const priorityLabel = weight >= 30 ? { text: 'ALTA', bg: 'bg-red-500/20 text-red-400 border-red-500/30' }
                          : weight >= 15 ? { text: 'MÉDIA', bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
                          : { text: 'BAIXA', bg: 'bg-green-500/20 text-green-400 border-green-500/30' }

                        return (
                          <motion.div
                            key={key}
                            layout
                            className={`rounded-xl border p-4 transition-all duration-300 ${
                              isEnabled
                                ? 'bg-white/3 border-white/10 hover:border-purple-main/30'
                                : 'bg-white/1 border-white/5 opacity-50'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              {/* Checkbox + Icon */}
                              <div className="flex items-center gap-3 flex-shrink-0 pt-0.5">
                                <button
                                  onClick={() => handleCriteriaToggle(key)}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                    isEnabled
                                      ? 'bg-purple-main border-purple-main'
                                      : 'bg-transparent border-white/30 hover:border-purple-main/50'
                                  }`}
                                >
                                  {isEnabled && (
                                    <motion.span
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="text-white text-xs font-bold"
                                    >✓</motion.span>
                                  )}
                                </button>
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-500'}`}>
                                  {icon}
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div>
                                    <span className="text-white font-semibold text-sm">{label}</span>
                                    <span className="text-gray-500 text-xs ml-2 hidden sm:inline-block">{desc}</span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {isEnabled && (
                                      <span className={`text-[10px] tracking-wider px-2 py-0.5 rounded-full border ${priorityLabel.bg}`}>
                                        {priorityLabel.text}
                                      </span>
                                    )}
                                    <span className={`font-bold text-lg min-w-[3rem] text-right ${isEnabled ? 'text-white' : 'text-gray-600'}`}>
                                      {weight}%
                                    </span>
                                  </div>
                                </div>

                                {/* Slider */}
                                <div className="relative mt-2">
                                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                      className={`h-full rounded-full bg-gradient-to-r ${color} ${!isEnabled ? 'opacity-20' : ''}`}
                                      animate={{ width: `${weight}%` }}
                                      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                                    />
                                  </div>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={weight}
                                    disabled={!isEnabled}
                                    onChange={(e) => handleCriteriaWeightChange(key, e.target.value)}
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    style={{ height: '8px' }}
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/5" />

                  {/* NÍVEL DE RIGOROSIDADE */}
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                      <Settings2 size={20} className="text-purple-400" />
                      Nível de Rigorosidade
                    </h3>
                    <p className="text-gray-500 text-xs mb-5">
                      Define o quão exigente a IA será ao calcular a compatibilidade e avaliar lacunas no currículo.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        {
                          value: 'flexible',
                          label: 'Flexível',
                          icon: <Leaf size={24} />,
                          desc: 'Tolera gaps, valoriza potencial de aprendizado e adaptação.',
                          gradient: 'from-green-500/20 to-emerald-500/10',
                          border: 'border-green-500/40',
                          active: 'bg-green-500/15 border-green-500/60',
                          textActive: 'text-green-400',
                        },
                        {
                          value: 'balanced',
                          label: 'Balanceado',
                          icon: <Scale size={24} />,
                          desc: 'Avaliação objetiva e pragmática, sem viés excessivo.',
                          gradient: 'from-purple-500/20 to-blue-500/10',
                          border: 'border-purple-main/40',
                          active: 'bg-purple-main/15 border-purple-main/60',
                          textActive: 'text-purple-light',
                        },
                        {
                          value: 'strict',
                          label: 'Rigoroso',
                          icon: <Target size={24} />,
                          desc: 'Critérios exatos. Penaliza fortemente candidatos fora do perfil.',
                          gradient: 'from-red-500/20 to-orange-500/10',
                          border: 'border-red-500/40',
                          active: 'bg-red-500/15 border-red-500/60',
                          textActive: 'text-red-400',
                        },
                      ].map((opt) => {
                        const isActive = aiCriteria.strictness_level === opt.value
                        return (
                          <motion.button
                            key={opt.value}
                            onClick={() => setAiCriteria(prev => ({ ...prev, strictness_level: opt.value }))}
                            className={`relative p-5 rounded-xl border text-left transition-all duration-200 overflow-hidden ${
                              isActive ? opt.active : 'bg-white/3 border-white/10 hover:border-white/20'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {isActive && (
                              <motion.div
                                layoutId="strictness-indicator"
                                className={`absolute inset-0 bg-gradient-to-br ${opt.gradient} opacity-50`}
                              />
                            )}
                            <div className="relative z-10">
                              <div className="flex items-center justify-between mb-3">
                                <span className={isActive ? opt.textActive : 'text-gray-400'}>{opt.icon}</span>
                                {isActive && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className={`w-5 h-5 rounded-full border-2 ${opt.border} flex items-center justify-center`}
                                  >
                                    <span className={`text-[10px] font-bold ${opt.textActive}`}>✓</span>
                                  </motion.div>
                                )}
                              </div>
                              <p className={`font-bold text-sm mb-1 tracking-wide ${isActive ? opt.textActive : 'text-white'}`}>
                                {opt.label.toUpperCase()}
                              </p>
                              <p className="text-gray-500 text-xs leading-relaxed">{opt.desc}</p>
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/5" />

                  {/* Preview Visual */}
                  <div>
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                      <BarChart3 size={18} className="text-purple-400" />
                      Preview de Distribuição
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { key: 'technical_skills', label: 'Habilidades Técnicas', color: 'bg-blue-500' },
                        { key: 'experience_years', label: 'Experiência', color: 'bg-purple-500' },
                        { key: 'education', label: 'Formação', color: 'bg-green-500' },
                        { key: 'specific_tools', label: 'Ferramentas', color: 'bg-orange-500' },
                        { key: 'soft_skills', label: 'Soft Skills', color: 'bg-pink-500' },
                        { key: 'languages', label: 'Idiomas', color: 'bg-teal-500' },
                      ].map(({ key, label, color }) => {
                        const isEnabled = (aiCriteria.enabled_criteria || []).includes(key)
                        const w = isEnabled ? (aiCriteria[key] || 0) : 0
                        return (
                          <div key={key} className="flex items-center gap-3 bg-white/5 rounded-lg p-2 px-3">
                            <span className="text-gray-400 text-[11px] uppercase tracking-wider w-36 flex-shrink-0">{label}</span>
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${color} ${!isEnabled ? 'opacity-20' : ''}`}
                                animate={{ width: `${w}%` }}
                                transition={{ type: 'spring', stiffness: 150 }}
                              />
                            </div>
                            <span className={`text-[11px] font-bold w-8 text-right ${isEnabled ? 'text-white' : 'text-gray-600'}`}>
                              {w}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Save Button */}
                  <motion.button
                    onClick={handleSaveAiCriteria}
                    disabled={aiCriteriaLoading}
                    className="w-full mt-4 py-4 rounded-xl font-bold text-white relative overflow-hidden disabled:opacity-60 group shadow-lg shadow-purple-main/20"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7, #7c3aed)' }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {aiCriteriaLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          Salvando Configurações...
                        </>
                      ) : (
                        <>
                          <Save size={20} />
                          Salvar Critérios de IA
                        </>
                      )}
                    </span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}



          {/* ======================== ABA: CONFIGURAÇÕES ======================== */}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold text-white">⚙️ Configurações da Empresa</h2>

              <motion.div className="glass p-8 rounded-2xl">
                {compSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm"
                  >
                    ✓ Configurações salvas com sucesso!
                  </motion.div>
                )}

                <form onSubmit={handleUpdateCompany} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Nome da Empresa</label>
                      <input
                        type="text"
                        value={compName}
                        onChange={(e) => setCompName(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-main text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">CNPJ</label>
                      <input
                        type="text"
                        value={compCnpj}
                        onChange={(e) => setCompCnpj(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-main text-sm"
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Setor</label>
                      <input
                        type="text"
                        value={compIndustry}
                        onChange={(e) => setCompIndustry(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-main text-sm"
                        placeholder="Ex: Tecnologia, Finanças"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Tamanho da Empresa</label>
                      <select
                        value={compSize}
                        onChange={(e) => setCompSize(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-main text-sm bg-dark-bg"
                      >
                        <option value="">Selecione...</option>
                        <option value="1-10">1-10 funcionários</option>
                        <option value="11-50">11-50 funcionários</option>
                        <option value="51-200">51-200 funcionários</option>
                        <option value="201-500">201-500 funcionários</option>
                        <option value="500+">Mais de 500 funcionários</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email de Contato</label>
                      <input
                        type="email"
                        value={compEmail}
                        onChange={(e) => setCompEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-main text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Telefone de Contato</label>
                      <input
                        type="text"
                        value={compPhone}
                        onChange={(e) => setCompPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-main text-sm"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                    <input
                      type="url"
                      value={compWebsite}
                      onChange={(e) => setCompWebsite(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-main text-sm font-mono"
                      placeholder="https://suaempresa.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                    <textarea
                      value={compDesc}
                      onChange={(e) => setCompDesc(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-main text-sm"
                      placeholder="Descreva a atuação da empresa..."
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={compLoading}
                    className="w-full btn-primary py-3 rounded-lg font-semibold disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {compLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </motion.button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modal Nova Vaga */}
      <AnimatePresence>
        {showJobModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowJobModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-dark-bg border border-dark-border rounded-2xl p-8 max-w-lg w-full relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowJobModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold gradient-text mb-2">Criar Nova Vaga</h2>
              <p className="text-gray-400 text-sm mb-6">Cadastre uma vaga para comparar candidatos com IA</p>

              <form onSubmit={handleCreateJob} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Título da Vaga *</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-main text-sm"
                    placeholder="Ex: Desenvolvedor React Senior"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Habilidades Requeridas (separadas por vírgula) *</label>
                  <input
                    type="text"
                    value={jobSkills}
                    onChange={(e) => setJobSkills(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-main text-sm"
                    placeholder="React, Node.js, TypeScript, Git"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nível de Experiência</label>
                    <select
                      value={jobExperience}
                      onChange={(e) => setJobExperience(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-main text-sm bg-dark-bg"
                    >
                      <option value="junior">Júnior</option>
                      <option value="pleno">Pleno</option>
                      <option value="senior">Sênior</option>
                      <option value="especialista">Especialista</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Faixa Salarial</label>
                    <input
                      type="text"
                      value={jobSalary}
                      onChange={(e) => setJobSalary(e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-main text-sm"
                      placeholder="Ex: R$ 8.000 - R$ 12.000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descrição da Vaga</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-main text-sm"
                    placeholder="Descreva as responsabilidades e requisitos da vaga..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowJobModal(false)}
                    className="flex-1 py-3 px-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-semibold transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={jobLoading}
                    className="flex-1 btn-primary py-3 rounded-lg font-semibold disabled:opacity-50"
                  >
                    {jobLoading ? 'Criando...' : 'Criar Vaga'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Detalhes do Candidato */}
      <AnimatePresence>
        {selectedCandidate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedCandidate(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-dark-bg border border-dark-border rounded-2xl p-8 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedCandidate(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                ✕
              </button>

              {/* Header do candidato */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-main to-purple-light flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                  {selectedCandidate.name?.[0] || 'C'}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">{selectedCandidate.name}</h2>
                  <p className="text-purple-light text-sm font-medium">📌 {selectedCandidate.position}</p>
                  {selectedCandidate.email && (
                    <p className="text-gray-400 text-sm">{selectedCandidate.email}</p>
                  )}
                  {selectedCandidate.location && (
                    <p className="text-gray-500 text-xs">📍 {selectedCandidate.location}</p>
                  )}
                </div>
                {selectedCandidate.score !== null && selectedCandidate.score !== undefined && (
                  <div className="text-center flex-shrink-0">
                    <div className={`text-3xl font-bold ${
                      selectedCandidate.score >= 80 ? 'text-green-400' :
                      selectedCandidate.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {Math.round(selectedCandidate.score)}%
                    </div>
                    <p className="text-gray-500 text-xs">Match</p>
                  </div>
                )}
              </div>

              {/* Status atual */}
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2 font-medium">Status do Processo</p>
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getStatusStyle(selectedCandidate.status)}`}>
                  {getStatusLabel(selectedCandidate.status)}
                </span>
              </div>

              {/* Resumo Profissional */}
              {selectedCandidate.summary && (
                <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-sm font-semibold text-purple-light uppercase tracking-wide mb-2">Resumo Profissional</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{selectedCandidate.summary}</p>
                </div>
              )}

              {/* Habilidades */}
              {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-purple-light uppercase tracking-wide mb-3">Habilidades</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.skills.map((skill, i) => (
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

              {/* Score IA */}
              {selectedCandidate.aiScore !== null && selectedCandidate.aiScore !== undefined && (
                <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold text-purple-light uppercase tracking-wide">Score IA Global</h4>
                    <span className={`text-xl font-bold ${
                      selectedCandidate.aiScore >= 80 ? 'text-green-400' :
                      selectedCandidate.aiScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {Math.round(selectedCandidate.aiScore)}/100
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-white/10 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        selectedCandidate.aiScore >= 80 ? 'bg-green-500' :
                        selectedCandidate.aiScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(selectedCandidate.aiScore, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Análise da IA */}
              {selectedCandidate.analysis && (
                <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-sm font-semibold text-purple-light uppercase tracking-wide mb-2">Análise Detalhada da IA</h4>
                  <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                    {typeof selectedCandidate.analysis === 'string'
                      ? selectedCandidate.analysis
                      : JSON.stringify(selectedCandidate.analysis, null, 2)}
                  </p>
                </div>
              )}

              {/* Arquivo */}
              {selectedCandidate.filename && (
                <div className="mb-6">
                  <p className="text-gray-500 text-xs">📎 Arquivo: {selectedCandidate.filename}</p>
                </div>
              )}

              {/* Ações */}
              <div className="border-t border-white/10 pt-6">
                <p className="text-sm text-gray-400 mb-3 font-medium">Atualizar Status</p>
                <div className="flex gap-3 flex-wrap">
                  <motion.button
                    onClick={() => handleUpdateStatus(selectedCandidate.matchId, 'shortlisted')}
                    disabled={updatingStatus === selectedCandidate.matchId || selectedCandidate.status === 'shortlisted'}
                    className="flex-1 py-2.5 px-4 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    ✓ Aprovar
                  </motion.button>
                  <motion.button
                    onClick={() => handleUpdateStatus(selectedCandidate.matchId, 'interview')}
                    disabled={updatingStatus === selectedCandidate.matchId || selectedCandidate.status === 'interview'}
                    className="flex-1 py-2.5 px-4 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    📅 Entrevista
                  </motion.button>
                  <motion.button
                    onClick={() => handleUpdateStatus(selectedCandidate.matchId, 'rejected')}
                    disabled={updatingStatus === selectedCandidate.matchId || selectedCandidate.status === 'rejected'}
                    className="flex-1 py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-all disabled:opacity-40"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    ✕ Rejeitar
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
