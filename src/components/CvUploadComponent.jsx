import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../config/supabase'

export default function CvUploadComponent({ onUploadSuccess }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor, selecione um arquivo')
      return
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    const fileExtension = file.name.split('.').pop().toLowerCase()
    const isAllowedFormat = allowedTypes.includes(file.type) || ['pdf', 'doc', 'docx'].includes(fileExtension)

    if (!isAllowedFormat) {
      setError('Atualmente, apenas arquivos PDF, DOC e DOCX são suportados.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('Enviando currículo para análise...')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      
      const formData = new FormData()
      formData.append('file', file)
      if (user?.id) {
        formData.append('userId', user.id)
      }
      if (session?.access_token) {
        formData.append('token', session.access_token)
      }

      const response = await fetch('http://localhost:3001/api/analyze-cv', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage(`✓ CV de ${result.data?.nome || 'Candidato'} analisado com sucesso! Nota: ${result.data?.nota}`)
        setFile(null)
        
        // Atualizar o dashboard com os novos dados
        if (onUploadSuccess) {
          setTimeout(() => onUploadSuccess(), 1000)
        }
      } else {
        setError('Erro na análise: ' + (result.error || 'Erro desconhecido'))
        setMessage('')
      }
    } catch (err) {
      setError('Erro ao comunicar com o servidor: ' + err.message)
      setMessage('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="glass p-8 rounded-2xl max-w-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-2xl font-bold text-white mb-6">📤 Enviar CV</h3>

      {/* Dropzone */}
      <motion.div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragActive
            ? 'border-purple-main bg-purple-main/10'
            : 'border-white/20 hover:border-purple-main/50'
        }`}
        whileHover={{ scale: 1.01 }}
      >
        <input
          type="file"
          id="file-upload"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx"
          className="hidden"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="text-4xl mb-4">📄</div>
          <p className="text-white font-semibold mb-2">
            {file ? file.name : 'Clique para selecionar ou arraste um arquivo'}
          </p>
          <p className="text-gray-400 text-sm">PDF ou DOCX - Máximo 10MB</p>
        </label>
      </motion.div>

      {/* Mensagens */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400"
        >
          {message}
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400"
        >
          {error}
        </motion.div>
      )}

      {/* Botão Upload */}
      <motion.button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full mt-6 btn-primary py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        whileHover={{ scale: !loading ? 1.02 : 1 }}
        whileTap={{ scale: !loading ? 0.98 : 1 }}
      >
        {loading ? '⏳ Enviando...' : '🚀 Enviar CV'}
      </motion.button>

      {/* Informações */}
      <div className="mt-6 p-4 bg-white/5 rounded-lg">
        <p className="text-gray-300 text-sm mb-3">
          <strong>O que acontece ao enviar:</strong>
        </p>
        <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
          <li>O currículo é enviado direto para o nosso servidor.</li>
          <li>O texto é extraído de forma rápida e segura.</li>
          <li>A Inteligência Artificial (Gemini) analisa os dados.</li>
          <li>O candidato estruturado é salvo no banco de dados.</li>
          <li>A nota e os pontos fortes aparecem na plataforma.</li>
        </ul>
      </div>
    </motion.div>
  )
}
