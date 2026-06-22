import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../config/supabase'

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const ACCEPTED_EXTENSIONS = '.pdf,.docx'
const MAX_SIZE_MB = 10

export default function JobApplicationModal({ job, user, userData, onClose, onSuccess }) {
  const [name, setName] = useState(userData?.full_name || user?.user_metadata?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [cvFile, setCvFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Apenas arquivos PDF ou DOCX são aceitos.'
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `O arquivo deve ter menos de ${MAX_SIZE_MB}MB.`
    }
    return null
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const err = validateFile(file)
    if (err) { setError(err); return }
    setError(null)
    setCvFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    const err = validateFile(file)
    if (err) { setError(err); return }
    setError(null)
    setCvFile(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!cvFile) { setError('Selecione um currículo para enviar.'); return }
    if (!name.trim() || !email.trim()) { setError('Preencha nome e e-mail.'); return }

    setLoading(true)
    setError(null)

    try {
      // 1. Fazer upload do CV no Supabase Storage
      const fileExt = cvFile.name.split('.').pop()
      const fileName = `${job.id}/${Date.now()}_${name.replace(/\s+/g, '_')}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('job-applications')
        .upload(fileName, cvFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: cvFile.type,
        })

      if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`)

      // 2. Obter URL pública/assinada do arquivo
      const { data: urlData } = supabase.storage
        .from('job-applications')
        .getPublicUrl(fileName)

      const cvUrl = urlData?.publicUrl || fileName

      // 3. Salvar candidatura no banco
      const { error: insertError } = await supabase
        .from('job_applications')
        .insert({
          job_position_id: job.id,
          applicant_user_id: user?.id || null,
          applicant_name: name.trim(),
          applicant_email: email.trim().toLowerCase(),
          cv_file_url: cvUrl,
          cv_file_name: cvFile.name,
          status: 'pending',
        })

      if (insertError) throw new Error(`Erro ao salvar candidatura: ${insertError.message}`)

      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25 }}
        className="bg-dark-bg border border-dark-border rounded-2xl p-8 max-w-lg w-full relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-main/15 border border-purple-main/30 rounded-full text-purple-light text-xs font-medium mb-3">
            🚀 Candidatura
          </div>
          <h2 className="text-2xl font-bold text-white">{job.title}</h2>
          {job.employment_type && (
            <span className="text-sm text-gray-400">
              {job.employment_type} · {job.salary_range || 'Salário a combinar'}
            </span>
          )}
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome Completo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main text-sm transition-colors"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              E-mail <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main text-sm transition-colors"
              required
            />
          </div>

          {/* Upload de CV */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Currículo (PDF ou DOCX) <span className="text-red-400">*</span>
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                dragOver
                  ? 'border-purple-main bg-purple-main/10'
                  : cvFile
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-white/10 hover:border-purple-main/50 hover:bg-white/3'
              }`}
              onClick={() => document.getElementById('cv-upload-input').click()}
            >
              <input
                id="cv-upload-input"
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                onChange={handleFileChange}
                className="hidden"
              />

              {cvFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 text-lg">
                    {cvFile.name.endsWith('.pdf') ? '📄' : '📝'}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium text-sm truncate max-w-[200px]">
                      {cvFile.name}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCvFile(null) }}
                    className="ml-auto text-gray-500 hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-2">📎</div>
                  <p className="text-gray-300 text-sm font-medium">
                    Arraste seu currículo aqui ou clique para selecionar
                  </p>
                  <p className="text-gray-500 text-xs mt-1">PDF ou DOCX · Máx. {MAX_SIZE_MB}MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Erro */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg text-white font-semibold transition-colors text-sm"
            >
              Cancelar
            </button>
            <motion.button
              type="submit"
              disabled={loading || !cvFile}
              className="flex-1 btn-primary py-3 rounded-lg font-semibold disabled:opacity-40 text-sm"
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block"
                  />
                  Enviando...
                </span>
              ) : (
                '🚀 Enviar Candidatura'
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
