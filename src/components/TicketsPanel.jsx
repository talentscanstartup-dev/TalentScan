import React, { useState, useEffect } from 'react'
import { MessageSquare, Clock, AlertCircle, ChevronRight, Filter, Download, Trash2, File } from 'lucide-react'

const TicketsPanel = ({ onCreateNew }) => {
  const [tickets, setTickets] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: 'open', priority: 'all' })
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchTickets()
  }, [filter, page])

  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && selectedTicket) {
        setSelectedTicket(null)
      }
    }

    if (selectedTicket) {
      fetchAttachments(selectedTicket.id)
      document.addEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'unset'
    }
  }, [selectedTicket])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: filter.status,
        priority: filter.priority,
        page,
        limit: 10,
      })

      // Obter token da sessão
      const savedSession = localStorage.getItem('talentscan_session')
      let token = ''
      if (savedSession) {
        const parsed = JSON.parse(savedSession)
        token = parsed.session?.access_token || ''
      }

      const response = await fetch(`http://localhost:5000/tickets?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Erro ao buscar tickets')

      const data = await response.json()
      setTickets(data.tickets)
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAttachments = async (ticketId) => {
    try {
      setLoadingAttachments(true)
      
      // Obter token da sessão
      const savedSession = localStorage.getItem('talentscan_session')
      let token = ''
      if (savedSession) {
        const parsed = JSON.parse(savedSession)
        token = parsed.session?.access_token || ''
      }

      const response = await fetch(`http://localhost:5000/tickets/${ticketId}/attachments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Erro ao buscar anexos')

      const data = await response.json()
      setAttachments(data.attachments || [])
    } catch (error) {
      console.error('Error fetching attachments:', error)
      setAttachments([])
    } finally {
      setLoadingAttachments(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId) => {
    if (!selectedTicket) return

    try {
      // Obter token da sessão
      const savedSession = localStorage.getItem('talentscan_session')
      let token = ''
      if (savedSession) {
        const parsed = JSON.parse(savedSession)
        token = parsed.session?.access_token || ''
      }

      const response = await fetch(`http://localhost:5000/tickets/${selectedTicket.id}/attachments/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Erro ao deletar anexo')

      // Atualizar lista de anexos
      await fetchAttachments(selectedTicket.id)
    } catch (error) {
      console.error('Error deleting attachment:', error)
      alert('Erro ao deletar anexo')
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'high':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'low':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/20 text-blue-300'
      case 'in_progress':
        return 'bg-purple-500/20 text-purple-300'
      case 'waiting_user':
        return 'bg-yellow-500/20 text-yellow-300'
      case 'resolved':
        return 'bg-green-500/20 text-green-300'
      case 'closed':
        return 'bg-gray-500/20 text-gray-300'
      default:
        return 'bg-gray-500/20 text-gray-300'
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      open: 'Aberto',
      in_progress: 'Em Progresso',
      waiting_user: 'Aguardando Usuário',
      resolved: 'Resolvido',
      closed: 'Fechado',
    }
    return labels[status] || status
  }

  const getPriorityLabel = (priority) => {
    const labels = {
      urgent: 'Urgente',
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa',
    }
    return labels[priority] || priority
  }

  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) {
      return '🖼️'
    } else if (mimetype === 'application/pdf') {
      return '📄'
    } else {
      return '📎'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Meus Tickets</h2>
        <button
          onClick={onCreateNew}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
        >
          + Novo Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <select
            value={filter.status}
            onChange={(e) => {
              setFilter((prev) => ({ ...prev, status: e.target.value }))
              setPage(1)
            }}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="all">Todos os Status</option>
            <option value="open">Abertos</option>
            <option value="in_progress">Em Progresso</option>
            <option value="waiting_user">Aguardando</option>
            <option value="resolved">Resolvidos</option>
            <option value="closed">Fechados</option>
          </select>

          <select
            value={filter.priority}
            onChange={(e) => {
              setFilter((prev) => ({ ...prev, priority: e.target.value }))
              setPage(1)
            }}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
          >
            <option value="all">Todas as Prioridades</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Média</option>
            <option value="low">Baixa</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare size={48} className="mx-auto text-gray-500 mb-3" />
            <p className="text-gray-400">Nenhum ticket encontrado</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className="w-full text-left p-4 glass rounded-lg border border-white/10 hover:border-purple-500/50 hover:bg-white/5 transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-purple-400">
                      {ticket.ticket_number}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded border ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {getStatusLabel(ticket.status)}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded border ${getPriorityColor(
                        ticket.priority
                      )}`}
                    >
                      {getPriorityLabel(ticket.priority)}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold group-hover:text-purple-300 transition-colors">
                    {ticket.title}
                  </h3>
                </div>
                <ChevronRight size={20} className="text-gray-500 group-hover:text-purple-400 transition-colors" />
              </div>

              <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                {ticket.description}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                </span>
                <span className="text-purple-400">
                  Atualizado: {new Date(ticket.updated_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div
          onClick={() => setSelectedTicket(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedTicket.title}</h2>
                <p className="text-sm text-gray-400">{selectedTicket.ticket_number}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronRight size={24} className="text-white rotate-180" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <p className={`text-sm font-semibold ${getStatusColor(selectedTicket.status)}`}>
                    {getStatusLabel(selectedTicket.status)}
                  </p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Prioridade</p>
                  <p
                    className={`text-sm font-semibold ${getPriorityColor(
                      selectedTicket.priority
                    )}`}
                  >
                    {getPriorityLabel(selectedTicket.priority)}
                  </p>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Categoria</p>
                  <p className="text-sm font-semibold text-purple-300">
                    {selectedTicket.category}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Descrição</p>
                <p className="text-white bg-white/5 p-3 rounded-lg">
                  {selectedTicket.description}
                </p>
              </div>

              {selectedTicket.tags && selectedTicket.tags.length > 0 && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTicket.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attachments Section */}
              <div>
                <p className="text-sm text-gray-400 mb-2">Anexos</p>
                {loadingAttachments ? (
                  <div className="text-center py-4">
                    <div className="inline-block">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                    </div>
                  </div>
                ) : attachments.length === 0 ? (
                  <p className="text-gray-500 text-sm py-3">Nenhum anexo</p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <span className="text-2xl">{getFileIcon(attachment.mimetype)}</span>
                          <div className="flex-1">
                            <p className="text-sm text-white truncate">{attachment.original_name}</p>
                            <p className="text-xs text-gray-400">
                              {(attachment.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={attachment.path}
                            download
                            className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-400"
                            title="Download"
                          >
                            <Download size={18} />
                          </a>
                          <button
                            onClick={() => handleDeleteAttachment(attachment.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                            title="Deletar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-white/10">
              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TicketsPanel
