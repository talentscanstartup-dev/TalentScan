import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../config/supabase'
import MatchScoreCard from './MatchScoreCard'

const STATUS_STYLES = {
  pending:   'bg-gray-500/20 text-gray-400 border-gray-500/30',
  reviewing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  approved:  'bg-green-500/20 text-green-400 border-green-500/30',
  rejected:  'bg-red-500/20 text-red-400 border-red-500/30',
}

const STATUS_LABELS = {
  pending:   '⏳ Pendente',
  reviewing: '👁 Em Revisão',
  approved:  '✓ Aprovado',
  rejected:  '✕ Rejeitado',
}

export default function JobApplicantsModal({ job, onClose }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [signedUrls, setSignedUrls] = useState({})

  useEffect(() => {
    loadApplications()
  }, [job.id])

  const loadApplications = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('job_position_id', job.id)
      .order('created_at', { ascending: false })

    if (data) {
      setApplications(data)
      // Gerar URLs assinadas para os CVs
      const urls = {}
      for (const app of data) {
        if (app.cv_file_url) {
          // Extrair o path relativo ao bucket
          const urlParts = app.cv_file_url.split('/job-applications/')
          if (urlParts.length > 1) {
            const path = urlParts[1]
            const { data: signed } = await supabase.storage
              .from('job-applications')
              .createSignedUrl(path, 3600) // válida por 1 hora
            if (signed?.signedUrl) urls[app.id] = signed.signedUrl
          } else {
            urls[app.id] = app.cv_file_url
          }
        }
      }
      setSignedUrls(urls)
    }
    setLoading(false)
  }

  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingId(appId)
    const { error } = await supabase
      .from('job_applications')
      .update({ status: newStatus })
      .eq('id', appId)

    if (!error) {
      setApplications(prev =>
        prev.map(a => a.id === appId ? { ...a, status: newStatus } : a)
      )
    }
    setUpdatingId(null)
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
        className="bg-dark-bg border border-dark-border rounded-2xl p-8 max-w-3xl w-full relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10"
        >
          ✕
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-main/15 border border-purple-main/30 rounded-full text-purple-light text-xs font-medium mb-3">
            👥 Candidatos Inscritos
          </div>
          <h2 className="text-2xl font-bold text-white">{job.title}</h2>
          <p className="text-gray-400 text-sm">
            {applications.length} candidatura{applications.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex justify-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 border-4 border-purple-main border-t-transparent rounded-full"
            />
          </div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-400">Nenhuma candidatura ainda</p>
            <p className="text-gray-500 text-sm mt-1">As candidaturas aparecerão aqui quando candidatos se inscreverem.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {applications.map((app) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Card de compatibilidade */}
                <MatchScoreCard 
                  application={app} 
                  isCompact={true}
                  cvUrl={signedUrls[app.id] || app.cv_file_url}
                  candidateName={app.applicant_name}
                  onReanalyze={async () => {
                    // Forçar reanalise via API
                    try {
                      const token = JSON.parse(localStorage.getItem('talentscan_session') || '{}').session?.access_token;
                      await fetch(`http://localhost:5000/jobs/applications/${app.id}/reanalyze`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${token}`,
                        },
                      });
                      // Recarregar candidaturas
                      await loadApplications();
                    } catch (error) {
                      console.error('Erro ao reanalizar:', error);
                    }
                  }}
                />

                {/* Info da candidatura */}
                <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Avatar e info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-main to-purple-light flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {app.applicant_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{app.applicant_name}</p>
                        <p className="text-gray-400 text-xs truncate">{app.applicant_email}</p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${STATUS_STYLES[app.status] || STATUS_STYLES.pending}`}>
                      {STATUS_LABELS[app.status] || app.status}
                    </span>

                    {/* Ações */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Ver/Baixar CV */}
                      {(signedUrls[app.id] || app.cv_file_url) && (
                        <a
                          href={signedUrls[app.id] || app.cv_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-main/10 hover:bg-purple-main/20 text-purple-light border border-purple-main/20 rounded-lg text-xs font-medium transition-all"
                          title={`Ver currículo: ${app.cv_file_name || 'arquivo'}`}
                        >
                          📄 CV
                        </a>
                      )}

                      {/* Dropdown de status */}
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        disabled={updatingId === app.id}
                        className="px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-xs focus:outline-none focus:border-purple-main bg-dark-bg disabled:opacity-50 cursor-pointer"
                      >
                        <option value="pending">⏳ Pendente</option>
                        <option value="reviewing">👁 Em Revisão</option>
                        <option value="approved">✓ Aprovado</option>
                        <option value="rejected">✕ Rejeitado</option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Rodapé */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
          <div className="flex gap-4 text-xs text-gray-500">
            <span>✓ {applications.filter(a => a.status === 'approved').length} aprovados</span>
            <span>👁 {applications.filter(a => a.status === 'reviewing').length} em revisão</span>
            <span>⏳ {applications.filter(a => a.status === 'pending').length} pendentes</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition-colors"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
