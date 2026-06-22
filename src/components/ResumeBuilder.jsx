import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Phone, MapPin, ExternalLink, Target, Briefcase, GraduationCap,
  Wrench, Languages, Plus, Trash2, ChevronLeft, ChevronRight, Download,
  BrainCircuit, Eye, EyeOff, FileText, Sparkles, Calendar, Building2, Palette
} from 'lucide-react'

const STEPS = [
  { id: 'personal', label: 'Dados Pessoais', icon: User },
  { id: 'objective', label: 'Objetivo', icon: Target },
  { id: 'experience', label: 'Experiência', icon: Briefcase },
  { id: 'education', label: 'Formação', icon: GraduationCap },
  { id: 'skills', label: 'Habilidades', icon: Wrench },
  { id: 'languages', label: 'Idiomas', icon: Languages },
]

const emptyExperience = { company: '', role: '', startDate: '', endDate: '', current: false, description: '' }
const emptyEducation = { institution: '', course: '', startDate: '', endDate: '', current: false }
const emptyLanguage = { name: '', level: 'Básico' }

const COLOR_SCHEMES = {
  purple: { name: 'Roxo', border: 'border-purple-600', text: 'text-purple-700', bg: 'bg-purple-100', dot: 'bg-purple-500' },
  blue: { name: 'Azul', border: 'border-blue-600', text: 'text-blue-700', bg: 'bg-blue-100', dot: 'bg-blue-500' },
  emerald: { name: 'Verde', border: 'border-emerald-600', text: 'text-emerald-700', bg: 'bg-emerald-100', dot: 'bg-emerald-500' },
  rose: { name: 'Rosa', border: 'border-rose-600', text: 'text-rose-700', bg: 'bg-rose-100', dot: 'bg-rose-500' },
  slate: { name: 'Cinza', border: 'border-slate-600', text: 'text-slate-700', bg: 'bg-slate-100', dot: 'bg-slate-500' },
}

export default function ResumeBuilder() {
  const [currentStep, setCurrentStep] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [showAnalysisResult, setShowAnalysisResult] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisScore, setAnalysisScore] = useState(null)
  const [themeColor, setThemeColor] = useState('purple')
  const printRef = useRef(null)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    linkedin: '',
    objective: '',
    experiences: [{ ...emptyExperience }],
    educations: [{ ...emptyEducation }],
    skills: [],
    languages: [{ ...emptyLanguage }],
  })

  const [skillInput, setSkillInput] = useState('')

  // ───── helpers ─────
  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  const updateArrayItem = (field, index, key, value) => {
    setFormData(prev => {
      const arr = [...prev[field]]
      arr[index] = { ...arr[index], [key]: value }
      return { ...prev, [field]: arr }
    })
  }

  const addArrayItem = (field, template) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], { ...template }] }))
  }

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !formData.skills.includes(s)) {
      updateField('skills', [...formData.skills, s])
      setSkillInput('')
    }
  }

  const removeSkill = (skill) => {
    updateField('skills', formData.skills.filter(s => s !== skill))
  }

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addSkill() }
  }

  // ───── navigation ─────
  const next = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1))
  const prev = () => setCurrentStep(prev => Math.max(prev - 1, 0))

  // ───── PDF via print ─────
  const handleDownloadPDF = () => {
    const previewWasVisible = showPreview
    setShowPreview(true)
    setTimeout(() => {
      window.print()
      if (!previewWasVisible) setShowPreview(false)
    }, 300)
  }

  // ───── AI Analysis (mock) ─────
  const handleAnalyze = () => {
    setAnalyzing(true)
    setShowAnalysisResult(false)

    // Calcula score baseado no preenchimento
    setTimeout(() => {
      let score = 0
      let details = []

      if (formData.fullName) score += 10
      if (formData.email) score += 5
      if (formData.phone) score += 5
      if (formData.city) score += 5
      if (formData.linkedin) score += 5
      if (formData.objective && formData.objective.length > 30) { score += 15; details.push('Objetivo bem definido') }
      else if (formData.objective) { score += 8; details.push('Objetivo poderia ser mais detalhado') }

      const validExps = formData.experiences.filter(e => e.company && e.role)
      if (validExps.length >= 3) { score += 20; details.push(`${validExps.length} experiências — excelente`) }
      else if (validExps.length >= 1) { score += 12; details.push(`${validExps.length} experiência(s) — considere adicionar mais`) }

      const validEdus = formData.educations.filter(e => e.institution && e.course)
      if (validEdus.length >= 1) { score += 15; details.push('Formação acadêmica presente') }

      if (formData.skills.length >= 5) { score += 15; details.push(`${formData.skills.length} habilidades — ótimo`) }
      else if (formData.skills.length >= 1) { score += 8; details.push(`${formData.skills.length} habilidade(s) — adicione mais`) }

      const validLangs = formData.languages.filter(l => l.name)
      if (validLangs.length >= 2) { score += 5; details.push('Múltiplos idiomas — diferencial') }
      else if (validLangs.length === 1) { score += 3 }

      setAnalysisScore({ score: Math.min(score, 100), details })
      setAnalyzing(false)
      setShowAnalysisResult(true)
    }, 2500)
  }

  // ───── input classes ─────
  const inputClass = 'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all duration-300'
  const labelClass = 'block text-sm font-medium text-gray-300 mb-1.5'

  // ───── step forms ─────
  const renderStep = () => {
    const variants = {
      initial: { opacity: 0, x: 30 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -30 },
    }

    switch (STEPS[currentStep].id) {
      case 'personal':
        return (
          <motion.div key="personal" {...variants} transition={{ duration: 0.3 }} className="space-y-5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <User size={22} className="text-purple-400" /> Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nome Completo *</label>
                <input className={inputClass} placeholder="João da Silva" value={formData.fullName} onChange={e => updateField('fullName', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Email *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input className={`${inputClass} pl-10`} type="email" placeholder="joao@email.com" value={formData.email} onChange={e => updateField('email', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Telefone</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input className={`${inputClass} pl-10`} placeholder="(11) 99999-0000" value={formData.phone} onChange={e => updateField('phone', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Cidade / Estado</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input className={`${inputClass} pl-10`} placeholder="São Paulo, SP" value={formData.city} onChange={e => updateField('city', e.target.value)} />
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>LinkedIn (opcional)</label>
              <div className="relative">
                <ExternalLink size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input className={`${inputClass} pl-10`} placeholder="linkedin.com/in/seu-perfil" value={formData.linkedin} onChange={e => updateField('linkedin', e.target.value)} />
              </div>
            </div>
          </motion.div>
        )

      case 'objective':
        return (
          <motion.div key="objective" {...variants} transition={{ duration: 0.3 }} className="space-y-5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Target size={22} className="text-purple-400" /> Objetivo Profissional
            </h3>
            <p className="text-gray-400 text-sm">Descreva brevemente seus objetivos e o que você busca profissionalmente.</p>
            <textarea
              className={`${inputClass} min-h-[180px] resize-none`}
              placeholder="Ex: Profissional com 5 anos de experiência em desenvolvimento web buscando oportunidades como Full Stack Developer em empresas de tecnologia inovadoras..."
              value={formData.objective}
              onChange={e => updateField('objective', e.target.value)}
            />
            <p className="text-xs text-gray-500 text-right">{formData.objective.length} caracteres</p>
          </motion.div>
        )

      case 'experience':
        return (
          <motion.div key="experience" {...variants} transition={{ duration: 0.3 }} className="space-y-5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase size={22} className="text-purple-400" /> Experiência Profissional
            </h3>
            {formData.experiences.map((exp, i) => (
              <div key={i} className="glass p-5 rounded-xl space-y-4 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-purple-400">Experiência {i + 1}</span>
                  {formData.experiences.length > 1 && (
                    <button onClick={() => removeArrayItem('experiences', i)} className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Empresa</label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input className={`${inputClass} pl-10`} placeholder="Nome da empresa" value={exp.company} onChange={e => updateArrayItem('experiences', i, 'company', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Cargo</label>
                    <input className={inputClass} placeholder="Desenvolvedor Full Stack" value={exp.role} onChange={e => updateArrayItem('experiences', i, 'role', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Início</label>
                    <input className={inputClass} type="month" value={exp.startDate} onChange={e => updateArrayItem('experiences', i, 'startDate', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Término</label>
                    <div className="flex items-center gap-3">
                      <input className={`${inputClass} ${exp.current ? 'opacity-50' : ''}`} type="month" value={exp.endDate} disabled={exp.current} onChange={e => updateArrayItem('experiences', i, 'endDate', e.target.value)} />
                      <label className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap cursor-pointer">
                        <input type="checkbox" checked={exp.current} onChange={e => updateArrayItem('experiences', i, 'current', e.target.checked)} className="accent-purple-500" />
                        Atual
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Descrição das atividades</label>
                  <textarea className={`${inputClass} min-h-[80px] resize-none`} placeholder="Descreva suas principais atividades e conquistas..." value={exp.description} onChange={e => updateArrayItem('experiences', i, 'description', e.target.value)} />
                </div>
              </div>
            ))}
            <button onClick={() => addArrayItem('experiences', emptyExperience)} className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium">
              <Plus size={16} /> Adicionar outra experiência
            </button>
          </motion.div>
        )

      case 'education':
        return (
          <motion.div key="education" {...variants} transition={{ duration: 0.3 }} className="space-y-5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <GraduationCap size={22} className="text-purple-400" /> Formação Acadêmica
            </h3>
            {formData.educations.map((edu, i) => (
              <div key={i} className="glass p-5 rounded-xl space-y-4 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-purple-400">Formação {i + 1}</span>
                  {formData.educations.length > 1 && (
                    <button onClick={() => removeArrayItem('educations', i)} className="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Instituição</label>
                    <input className={inputClass} placeholder="Universidade / Faculdade" value={edu.institution} onChange={e => updateArrayItem('educations', i, 'institution', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Curso</label>
                    <input className={inputClass} placeholder="Ciência da Computação" value={edu.course} onChange={e => updateArrayItem('educations', i, 'course', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Início</label>
                    <input className={inputClass} type="month" value={edu.startDate} onChange={e => updateArrayItem('educations', i, 'startDate', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Término</label>
                    <div className="flex items-center gap-3">
                      <input className={`${inputClass} ${edu.current ? 'opacity-50' : ''}`} type="month" value={edu.endDate} disabled={edu.current} onChange={e => updateArrayItem('educations', i, 'endDate', e.target.value)} />
                      <label className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap cursor-pointer">
                        <input type="checkbox" checked={edu.current} onChange={e => updateArrayItem('educations', i, 'current', e.target.checked)} className="accent-purple-500" />
                        Cursando
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => addArrayItem('educations', emptyEducation)} className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium">
              <Plus size={16} /> Adicionar outra formação
            </button>
          </motion.div>
        )

      case 'skills':
        return (
          <motion.div key="skills" {...variants} transition={{ duration: 0.3 }} className="space-y-5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Wrench size={22} className="text-purple-400" /> Habilidades
            </h3>
            <p className="text-gray-400 text-sm">Adicione suas habilidades técnicas e soft skills. Pressione Enter ou clique em + para adicionar.</p>
            <div className="flex gap-2">
              <input
                className={inputClass}
                placeholder="Ex: React, Node.js, Liderança..."
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
              />
              <motion.button
                onClick={addSkill}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              >
                <Plus size={20} />
              </motion.button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[60px]">
              <AnimatePresence>
                {formData.skills.map(skill => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm"
                  >
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              {formData.skills.length === 0 && (
                <p className="text-gray-600 text-sm italic">Nenhuma habilidade adicionada ainda</p>
              )}
            </div>
          </motion.div>
        )

      case 'languages':
        return (
          <motion.div key="languages" {...variants} transition={{ duration: 0.3 }} className="space-y-5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Languages size={22} className="text-purple-400" /> Idiomas
            </h3>
            {formData.languages.map((lang, i) => (
              <div key={i} className="flex items-end gap-3">
                <div className="flex-1">
                  <label className={labelClass}>Idioma</label>
                  <input className={inputClass} placeholder="Inglês" value={lang.name} onChange={e => updateArrayItem('languages', i, 'name', e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Nível</label>
                  <select className={inputClass} value={lang.level} onChange={e => updateArrayItem('languages', i, 'level', e.target.value)}>
                    <option value="Básico">Básico</option>
                    <option value="Intermediário">Intermediário</option>
                    <option value="Avançado">Avançado</option>
                    <option value="Fluente">Fluente</option>
                    <option value="Nativo">Nativo</option>
                  </select>
                </div>
                {formData.languages.length > 1 && (
                  <button onClick={() => removeArrayItem('languages', i)} className="pb-3 text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => addArrayItem('languages', emptyLanguage)} className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors text-sm font-medium">
              <Plus size={16} /> Adicionar outro idioma
            </button>
          </motion.div>
        )

      default:
        return null
    }
  }

  // ───── format date helper ─────
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const [year, month] = dateStr.split('-')
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return `${months[parseInt(month) - 1]} ${year}`
  }

  // ───── score color helper ─────
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreGradient = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-500'
    if (score >= 60) return 'from-yellow-500 to-amber-500'
    if (score >= 40) return 'from-orange-500 to-amber-600'
    return 'from-red-500 to-rose-600'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excelente'
    if (score >= 60) return 'Bom'
    if (score >= 40) return 'Regular'
    return 'Precisa Melhorar'
  }

  // ───── preview component ─────
  const ResumePreview = ({ forPrint = false }) => {
    const containerClass = forPrint
      ? 'resume-print-area bg-white text-gray-900 p-8 max-w-[210mm]'
      : 'bg-white text-gray-900 p-6 md:p-8 rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto'

    const scheme = COLOR_SCHEMES[themeColor]

    return (
      <div className={containerClass} ref={forPrint ? printRef : undefined}>
        {/* Header */}
        <div className={`border-b-2 ${scheme.border} pb-4 mb-6`}>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{formData.fullName || 'Seu Nome'}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
            {formData.email && <span className="flex items-center gap-1"><Mail size={13} /> {formData.email}</span>}
            {formData.phone && <span className="flex items-center gap-1"><Phone size={13} /> {formData.phone}</span>}
            {formData.city && <span className="flex items-center gap-1"><MapPin size={13} /> {formData.city}</span>}
            {formData.linkedin && <span className="flex items-center gap-1"><ExternalLink size={13} /> {formData.linkedin}</span>}
          </div>
        </div>

        {/* Objective */}
        {formData.objective && (
          <div className="mb-6">
            <h2 className={`text-lg font-bold ${scheme.text} uppercase tracking-wide mb-2`}>Objetivo</h2>
            <p className="text-gray-700 text-sm leading-relaxed">{formData.objective}</p>
          </div>
        )}

        {/* Experience */}
        {formData.experiences.some(e => e.company || e.role) && (
          <div className="mb-6">
            <h2 className={`text-lg font-bold ${scheme.text} uppercase tracking-wide mb-3`}>Experiência Profissional</h2>
            {formData.experiences.filter(e => e.company || e.role).map((exp, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{exp.role || 'Cargo'}</h3>
                    <p className="text-sm text-gray-600">{exp.company || 'Empresa'}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(exp.startDate)} {(exp.startDate || exp.endDate || exp.current) && '—'} {exp.current ? 'Atual' : formatDate(exp.endDate)}
                  </span>
                </div>
                {exp.description && <p className="text-sm text-gray-600 mt-1 leading-relaxed">{exp.description}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {formData.educations.some(e => e.institution || e.course) && (
          <div className="mb-6">
            <h2 className={`text-lg font-bold ${scheme.text} uppercase tracking-wide mb-3`}>Formação Acadêmica</h2>
            {formData.educations.filter(e => e.institution || e.course).map((edu, i) => (
              <div key={i} className="mb-3 last:mb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{edu.course || 'Curso'}</h3>
                    <p className="text-sm text-gray-600">{edu.institution || 'Instituição'}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(edu.startDate)} {(edu.startDate || edu.endDate || edu.current) && '—'} {edu.current ? 'Cursando' : formatDate(edu.endDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {formData.skills.length > 0 && (
          <div className="mb-6">
            <h2 className={`text-lg font-bold ${scheme.text} uppercase tracking-wide mb-2`}>Habilidades</h2>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, i) => (
                <span key={i} className={`px-3 py-1 text-xs rounded-full ${scheme.bg} ${scheme.text} font-medium`}>{skill}</span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {formData.languages.some(l => l.name) && (
          <div>
            <h2 className={`text-lg font-bold ${scheme.text} uppercase tracking-wide mb-2`}>Idiomas</h2>
            <div className="flex flex-wrap gap-4">
              {formData.languages.filter(l => l.name).map((lang, i) => (
                <span key={i} className="text-sm text-gray-700">
                  <strong>{lang.name}</strong> — {lang.level}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ───── main render ─────
  return (
    <>
      {/* Print-only hidden preview */}
      <div className="hidden print:block print:!visible">
        <ResumePreview forPrint />
      </div>

      <div className="print:hidden">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-1 md:gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            const isActive = i === currentStep
            const isCompleted = i < currentStep
            return (
              <React.Fragment key={step.id}>
                <motion.button
                  onClick={() => setCurrentStep(i)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : isCompleted
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-white/5 text-gray-500 border border-white/10'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden md:inline">{step.label}</span>
                </motion.button>
                {i < STEPS.length - 1 && (
                  <div className={`w-4 md:w-8 h-0.5 rounded-full transition-colors duration-300 ${
                    isCompleted ? 'bg-purple-500' : 'bg-white/10'
                  }`} />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Content area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Form */}
          <div className="glass p-6 md:p-8 rounded-2xl">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
              <motion.button
                onClick={prev}
                disabled={currentStep === 0}
                whileHover={{ scale: currentStep === 0 ? 1 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                  currentStep === 0
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
                }`}
              >
                <ChevronLeft size={18} /> Anterior
              </motion.button>

              {currentStep < STEPS.length - 1 ? (
                <motion.button
                  onClick={next}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-600/30"
                >
                  Próximo <ChevronRight size={18} />
                </motion.button>
              ) : (
                <div className="flex gap-2">
                  <motion.button
                    onClick={handleDownloadPDF}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white transition-all shadow-lg shadow-green-600/30"
                  >
                    <Download size={18} /> Baixar PDF
                  </motion.button>
                  <motion.button
                    onClick={handleAnalyze}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={analyzing}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50"
                  >
                    {analyzing ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                          <BrainCircuit size={18} />
                        </motion.div>
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} /> Analisar com IA
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          {/* Right: Preview / Analysis */}
          <div className="space-y-6">
            {/* Toggle preview */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText size={20} className="text-purple-400" /> Pré-visualização
              </h3>
              <motion.button
                onClick={() => setShowPreview(!showPreview)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white text-sm transition-all"
              >
                {showPreview ? <><EyeOff size={16} /> Ocultar</> : <><Eye size={16} /> Mostrar</>}
              </motion.button>
            </div>

            {/* Color Scheme Selector */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-xl">
              <Palette size={18} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-300 mr-2">Esquema de Cores:</span>
              <div className="flex items-center gap-2">
                {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
                  <button
                    key={key}
                    onClick={() => setThemeColor(key)}
                    className={`w-8 h-8 rounded-full ${scheme.dot} flex items-center justify-center transition-all hover:scale-110 ${themeColor === key ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : 'opacity-70 hover:opacity-100'}`}
                    title={scheme.name}
                  />
                ))}
              </div>
            </div>

            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ResumePreview />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analysis result */}
            <AnimatePresence>
              {showAnalysisResult && analysisScore && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="glass p-6 rounded-2xl border border-purple-500/30"
                >
                  <h4 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <Sparkles className="text-purple-400" size={20} /> Resultado da Análise IA
                  </h4>

                  {/* Score circle */}
                  <div className="flex items-center gap-6 mb-6">
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                        <motion.circle
                          cx="50" cy="50" r="42"
                          stroke="url(#scoreGradient)"
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          initial={{ strokeDasharray: '0 264' }}
                          animate={{ strokeDasharray: `${(analysisScore.score / 100) * 264} 264` }}
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                        />
                        <defs>
                          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={analysisScore.score >= 60 ? '#22c55e' : '#f97316'} />
                            <stop offset="100%" stopColor={analysisScore.score >= 60 ? '#10b981' : '#ef4444'} />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span
                          className={`text-2xl font-bold ${getScoreColor(analysisScore.score)}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          {analysisScore.score}
                        </motion.span>
                      </div>
                    </div>
                    <div>
                      <p className={`text-xl font-bold ${getScoreColor(analysisScore.score)}`}>{getScoreLabel(analysisScore.score)}</p>
                      <p className="text-sm text-gray-400 mt-1">Score geral do currículo baseado em completude e qualidade</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-300 mb-2">Detalhes:</p>
                    {analysisScore.details.map((detail, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.15 }}
                        className="flex items-start gap-2 text-sm"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                        <span className="text-gray-300">{detail}</span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-500">
                      💡 Dica: Preencha todas as seções do currículo para obter um score mais alto. 
                      Recrutadores priorizam currículos com objetivo claro, experiências detalhadas e habilidades relevantes.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick action buttons when preview is hidden */}
            {!showPreview && !showAnalysisResult && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass p-8 rounded-2xl text-center"
              >
                <FileText size={48} className="text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">Preencha os campos ao lado</p>
                <p className="text-gray-500 text-sm">Clique em "Mostrar" para ver a pré-visualização do seu currículo em tempo real</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
