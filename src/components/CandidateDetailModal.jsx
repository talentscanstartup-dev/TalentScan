import React from 'react'
import { motion } from 'framer-motion'

export default function CandidateDetailModal({ candidate, onClose }) {
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  }

  if (!candidate) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-dark-bg border border-dark-border rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-8 pr-8">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-main to-purple-light flex items-center justify-center text-white font-bold text-xl overflow-hidden">
              {candidate.nome?.[0]?.toUpperCase() || 'C'}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-1">{candidate.nome}</h2>
              <p className="text-gray-400">{candidate.vaga || 'Vaga não especificada'}</p>
            </div>
          </div>
        </div>

        {/* Score destaque */}
        <motion.div
          className="glass p-6 rounded-xl mb-6 bg-gradient-to-r from-purple-main/20 to-purple-light/20 border border-purple-main/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Pontuação Total</p>
              <p className="text-4xl font-bold gradient-text">{(candidate.pontos ?? 0).toFixed(1)}</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border-2 border-purple-main">
                <span className="text-2xl font-bold text-purple-light">
                  {Math.min(Math.round(((candidate.pontos ?? 0) / 100) * 100), 100)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Informações de contato */}
        <motion.div
          className="glass p-6 rounded-xl mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-lg font-bold text-white mb-4">Informações de Contato</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-dark-border">
              <span className="text-gray-400">Email:</span>
              <a href={`mailto:${candidate.email}`} className="text-purple-light hover:text-purple-main transition-colors">
                {candidate.email}
              </a>
            </div>
            {candidate.telefone && (
              <div className="flex items-center justify-between pb-3 border-b border-dark-border">
                <span className="text-gray-400">Telefone:</span>
                <a href={`tel:${candidate.telefone}`} className="text-purple-light hover:text-purple-main transition-colors">
                  {candidate.telefone}
                </a>
              </div>
            )}
            <div className="flex items-center justify-between pb-3 border-b border-dark-border">
              <span className="text-gray-400">Data de Envio:</span>
              <span className="text-white">{candidate.dataEnvio}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                candidate.status === 'aprovado' ? 'bg-green-500/20 text-green-400' :
                candidate.status === 'rejeitado' ? 'bg-red-500/20 text-red-400' :
                'bg-yellow-500/20 text-yellow-400'
              }`}>
                {candidate.status?.toUpperCase() || 'NOVO'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Habilidades */}
        {candidate.habilidades && candidate.habilidades.length > 0 && (
          <motion.div
            className="glass p-6 rounded-xl mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-bold text-white mb-4">Habilidades</h3>
            <div className="flex flex-wrap gap-2">
              {candidate.habilidades.map((skill, idx) => (
                <motion.span
                  key={idx}
                  className="px-3 py-1 bg-purple-main/20 text-purple-light rounded-full text-sm font-medium border border-purple-main/30"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                >
                  {skill}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Roteiro de Entrevista */}
        {(candidate.interview_questions || candidate.rawData?.interview_questions || candidate.rawData?.ai_analysis?.interview_questions) && (
          <motion.div
            className="glass p-6 rounded-xl mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h3 className="text-lg font-bold text-white mb-4">🎙️ Roteiro de Entrevista Sugerido (IA)</h3>
            <div className="space-y-3">
              {(candidate.interview_questions || candidate.rawData?.interview_questions || candidate.rawData?.ai_analysis?.interview_questions).map((question, idx) => (
                <div key={idx} className="bg-white/5 p-3 rounded-lg border border-white/10 text-gray-300 text-sm">
                  <span className="text-purple-main font-bold mr-2">Q{idx + 1}:</span>
                  {question}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Dados adicionais */}
        {candidate.rawData && (
          <motion.div
            className="glass p-6 rounded-xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-bold text-white mb-4">Dados Adicionais</h3>
            <div className="bg-white/5 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">
              <pre>{JSON.stringify(candidate, null, 2)}</pre>
            </div>
          </motion.div>
        )}

        {/* Ações */}
        <div className="flex gap-4 mt-8 pt-6 border-t border-dark-border">
          <motion.button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-medium hover:bg-white/10 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Fechar
          </motion.button>
          <motion.button
            onClick={() => {
              // Copiar email para clipboard
              navigator.clipboard.writeText(candidate.email)
              alert('Email copiado!')
            }}
            className="flex-1 px-4 py-2 btn-primary rounded-lg text-white font-medium transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Copiar Email
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
