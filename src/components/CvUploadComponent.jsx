import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { n8nService } from '../config/n8n'

export default function CvUploadComponent() {
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

    if (!file.type.includes('pdf') && !file.type.includes('word')) {
      setError('Apenas arquivos PDF e DOCX são permitidos')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      // Aqui você pode fazer upload para Supabase Storage primeiro
      // e depois chamar o n8n com a URL

      const uploadData = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadedAt: new Date().toISOString(),
      }

      // Notificar n8n sobre o upload
      const result = await n8nService.notifyCvUpload(uploadData)

      if (result.success) {
        setMessage('✓ CV enviado com sucesso! Análise iniciada...')
        setFile(null)

        // Disparar análise automática
        await n8nService.analyzeCv(uploadData)
      } else {
        setError('Erro ao enviar CV: ' + result.error)
      }
    } catch (err) {
      setError('Erro ao fazer upload: ' + err.message)
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
          <li>Arquivo é armazenado no Supabase</li>
          <li>N8N extrai o texto do CV</li>
          <li>OpenAI analisa os dados</li>
          <li>Candidato é adicionado ao banco</li>
          <li>Você recebe um match score</li>
        </ul>
      </div>
    </motion.div>
  )
}
