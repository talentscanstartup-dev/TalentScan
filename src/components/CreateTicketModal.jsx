import React, { useState } from 'react'
import { X, Send, AlertCircle, CheckCircle, Upload, File, Trash2 } from 'lucide-react'

const CreateTicketModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'support',
    priority: 'medium',
    tags: [],
  })
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const categories = [
    { value: 'bug', label: 'Bug/Erro' },
    { value: 'feature_request', label: 'Solicitação de Recurso' },
    { value: 'support', label: 'Suporte' },
    { value: 'billing', label: 'Faturamento' },
    { value: 'other', label: 'Outro' },
  ]

  const priorities = [
    { value: 'low', label: 'Baixa' },
    { value: 'medium', label: 'Média' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' },
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault()
      const newTag = e.target.value.trim()
      if (!formData.tags.includes(newTag)) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, newTag],
        }))
      }
      e.target.value = ''
    }
  }

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    const newFiles = selectedFiles.filter((file) => {
      // Validar tipo de arquivo
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ]
      return allowedTypes.includes(file.type)
    })

    if (newFiles.length + files.length > 5) {
      setError('Máximo 5 arquivos por ticket')
      return
    }

    if (selectedFiles.length > newFiles.length) {
      setError('Alguns arquivos têm tipos não permitidos')
    }

    setFiles((prev) => [...prev, ...newFiles])
  }

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return '🖼️'
    } else if (file.type === 'application/pdf') {
      return '📄'
    } else {
      return '📎'
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Obter token da sessão
      const savedSession = localStorage.getItem('talentscan_session')
      let token = ''
      if (savedSession) {
        const parsed = JSON.parse(savedSession)
        token = parsed.session?.access_token || ''
      }

      // Criar ticket
      const ticketResponse = await fetch('http://localhost:5000/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!ticketResponse.ok) {
        const data = await ticketResponse.json()
        throw new Error(data.error || 'Erro ao criar ticket')
      }

      const ticketData = await ticketResponse.json()
      const ticketId = ticketData.ticket.id

      // Upload de arquivos se houver
      if (files.length > 0) {
        const formDataUpload = new FormData()
        files.forEach((file) => {
          formDataUpload.append('files', file)
        })

        const uploadResponse = await fetch(`http://localhost:5000/tickets/${ticketId}/attachments`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
          body: formDataUpload,
        })

        if (!uploadResponse.ok) {
          console.warn('Aviso: Ticket criado mas falha no upload dos arquivos')
        }
      }

      setSuccess(true)

      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          category: 'support',
          priority: 'medium',
          tags: [],
        })
        setFiles([])
        setSuccess(false)
        setUploadProgress(0)
        if (onSuccess) onSuccess(ticketData.ticket)
        onClose()
      }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass w-full max-w-2xl mx-4 rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">Criar Ticket de Atendimento</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle size={64} className="text-green-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Ticket Criado com Sucesso!</h3>
              <p className="text-gray-300 text-center">
                Você receberá um email com os detalhes do seu ticket.
              </p>
            </div>
          ) : (
            <form id="create-ticket-form" onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-300">{error}</p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Assunto *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Descreva o assunto do seu ticket"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Descrição *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Descreva detalhadamente o seu problema ou solicitação"
                  rows={5}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 resize-none"
                  required
                />
              </div>

              {/* Category and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Categoria *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Prioridade
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    {priorities.map((pri) => (
                      <option key={pri.value} value={pri.value}>
                        {pri.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Tags</label>
                <input
                  type="text"
                  placeholder="Digite uma tag e pressione Enter"
                  onKeyDown={handleTagInput}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-purple-500 mb-3"
                />
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full"
                    >
                      <span className="text-sm text-purple-300">{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-purple-400 hover:text-purple-300"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Anexar Fotos/Arquivos (Máximo 5 arquivos, 10MB cada)
                </label>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                    id="file-input"
                    disabled={loading}
                  />
                  <label
                    htmlFor="file-input"
                    className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-purple-500/30 rounded-lg bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all cursor-pointer"
                  >
                    <Upload size={20} className="text-purple-400" />
                    <div>
                      <p className="text-white font-medium">Clique para selecionar ou arraste arquivos</p>
                      <p className="text-xs text-gray-400">
                        Imagens, PDF, Word, Texto - até 5 arquivos
                      </p>
                    </div>
                  </label>
                </div>

                {/* Arquivos Selecionados */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-gray-400">
                      {files.length} arquivo(s) selecionado(s):
                    </p>
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{getFileIcon(file)}</span>
                          <div className="flex-1">
                            <p className="text-sm text-white truncate">{file.name}</p>
                            <p className="text-xs text-gray-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="create-ticket-form"
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              <Send size={18} />
              {loading ? 'Criando...' : 'Criar Ticket'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateTicketModal
