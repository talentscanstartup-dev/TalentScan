import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, AlertCircle, CheckCircle, Clock, RefreshCw, Download, ChevronDown, ChevronUp, Check, X, AlertTriangle, Lightbulb, Target } from 'lucide-react'

/**
 * MatchScoreCard
 * Componente que exibe a anÃ¡lise de compatibilidade entre candidato e vaga
 * 
 * Props:
 * - application: objeto com dados da candidatura e anÃ¡lise
 * - isCompact: modo compacto (para lista) ou expandido (para detalhe)
 * - onReanalyze: callback para forÃ§ar reanalise
 * - cvUrl: URL do CV para download
 * - candidateName: nome do candidato (para nome do arquivo)
 */
export default function MatchScoreCard({ application, isCompact = false, onReanalyze, cvUrl, candidateName }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isCompact);

  const handleReanalyze = async () => {
    if (onReanalyze) {
      setIsLoading(true);
      await onReanalyze();
      setIsLoading(false);
    }
  };

  const handleDownloadCV = () => {
    if (cvUrl) {
      const link = document.createElement('a');
      link.href = cvUrl;
      link.download = `CV_${candidateName || 'candidato'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Se anÃ¡lise ainda nÃ£o foi feita
  if (!application.compatibility_score && application.analysis_status !== 'completed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <Clock size={20} className="text-amber-400 animate-spin" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-300">
              {application.analysis_status === 'pending' ? 'AnÃ¡lise em fila...' : 'Processando anÃ¡lise...'}
            </p>
            <p className="text-xs text-amber-300/70">A compatibilidade serÃ¡ exibida em breve</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Se anÃ¡lise falhou
  if (application.analysis_status === 'failed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-xl p-4 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <AlertCircle size={20} className="text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-300">AnÃ¡lise nÃ£o disponÃ­vel</p>
              <p className="text-xs text-red-300/70">NÃ£o conseguimos analisar este candidato</p>
            </div>
          </div>
          <button
            onClick={handleReanalyze}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Reprocessando...' : 'Tentar novamente'}
          </button>
        </div>
      </motion.div>
    );
  }

  const score = application.compatibility_score || 0;
  const scoreColor = score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
  const scoreGradient = score >= 75 ? 'from-green-500' : score >= 50 ? 'from-yellow-500' : 'from-red-500';
  const bgColor = score >= 75 ? 'bg-green-500/10' : score >= 50 ? 'bg-yellow-500/10' : 'bg-red-500/10';
  const borderColor = score >= 75 ? 'border-green-500/30' : score >= 50 ? 'border-yellow-500/30' : 'border-red-500/30';

  if (isCompact) {
    // Modo compacto: para listar candidaturas
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r ${scoreGradient}/10 ${bgColor} border ${borderColor} rounded-xl p-4 backdrop-blur-sm`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-14 h-14 rounded-full bg-black/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-700/30" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - score / 100)}`}
                  className={`${score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'} transition-all`}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <p className={`text-lg font-bold ${scoreColor}`}>{score}</p>
                <p className="text-xs text-gray-400">%</p>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold flex items-center gap-1 ${scoreColor} mb-0.5`}>
                {score >= 75 ? <><Check size={14}/> Excelente</> : score >= 50 ? <><AlertTriangle size={14}/> Bom Match</> : <><X size={14}/> Fraco</>}
              </p>
              <p className="text-xs text-gray-300 line-clamp-2">
                {application.compatibility_summary}
              </p>
            </div>
          </div>

          {/* BotÃ£o expandir */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 p-2 rounded hover:bg-white/10 transition-colors text-gray-400"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Detalhes expandidos */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 mt-4 pt-4 border-t border-white/10"
            >
              {/* Pontos fortes e atenÃ§Ã£o */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-green-500/10 border border-green-500/20 rounded p-2.5">
                  <p className="text-green-400 font-semibold mb-1.5 flex items-center gap-1"><Check size={14}/> Fortes</p>
                  <p className="text-green-300/80 text-xs line-clamp-3">{application.strengths || '-'}</p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded p-2.5">
                  <p className="text-orange-400 font-semibold mb-1.5 flex items-center gap-1"><AlertTriangle size={14}/> AtenÃ§Ã£o</p>
                  <p className="text-orange-300/80 text-xs line-clamp-3">{application.concerns || '-'}</p>
                </div>
              </div>

              {/* RecomendaÃ§Ã£o */}
              {application.recommendation && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                  <p className="text-blue-300 text-xs font-semibold">{application.recommendation}</p>
                </div>
              )}

              {/* BotÃµes de aÃ§Ã£o */}
              <div className="flex gap-2 pt-2">
                {cvUrl && (
                  <button
                    onClick={handleDownloadCV}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs font-semibold transition-colors"
                  >
                    <Download size={14} />
                    Baixar CV
                  </button>
                )}
                <button
                  onClick={handleReanalyze}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                  {isLoading ? 'Processando' : 'Reanalizar'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Modo expandido: para detalhe da candidatura
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${scoreGradient}/5 border ${borderColor} rounded-2xl p-8 backdrop-blur-sm space-y-6`}
    >
      {/* Header com Score */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-6 flex-1">
          {/* Circular Progress */}
          <div className="relative w-28 h-28 rounded-full flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-700/50" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - score / 100)}`}
                className={`${score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'} transition-all duration-500`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <p className={`text-3xl font-bold ${scoreColor}`}>{score}</p>
              <p className="text-xs text-gray-400">%</p>
            </div>
          </div>

          {/* Texto */}
          <div>
            <h3 className={`text-2xl font-bold flex items-center gap-2 ${scoreColor} mb-2`}>
              {score >= 75 ? <><Target size={24}/> Excelente Match</> : score >= 50 ? <><AlertTriangle size={24}/> Bom Match</> : <><X size={24}/> Match Fraco</>}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {application.compatibility_summary}
            </p>
            {application.recommendation && (
              <p className="text-blue-300 text-sm mt-3 font-semibold flex items-start gap-1.5">
                <Lightbulb size={16} className="mt-0.5 shrink-0"/> {application.recommendation}
              </p>
            )}
          </div>
        </div>

        {/* BotÃµes de aÃ§Ã£o */}
        <div className="flex flex-col gap-2">
          {cvUrl && (
            <button
              onClick={handleDownloadCV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm font-semibold transition-colors"
            >
              <Download size={16} />
              Baixar CV
            </button>
          )}
          <button
            onClick={handleReanalyze}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Reprocessando' : 'Reanalizar'}
          </button>
        </div>
      </div>

      {/* Pontos Fortes */}
      {application.strengths && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-green-500/10 border border-green-500/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle size={20} className="text-green-400" />
            <h4 className="text-lg font-semibold text-green-300">Pontos Fortes</h4>
          </div>
          <p className="text-green-200/80 leading-relaxed ml-8">
            {application.strengths}
          </p>
        </motion.div>
      )}

      {/* Pontos de AtenÃ§Ã£o */}
      {application.concerns && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle size={20} className="text-orange-400" />
            <h4 className="text-lg font-semibold text-orange-300">Pontos de AtenÃ§Ã£o</h4>
          </div>
          <p className="text-orange-200/80 leading-relaxed ml-8">
            {application.concerns}
          </p>
        </motion.div>
      )}

      {/* AnÃ¡lise Detalhada */}
      {application.skills_match && Object.keys(application.skills_match).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center gap-3">
            <TrendingUp size={20} className="text-blue-400" />
            <h4 className="text-lg font-semibold text-blue-300">AnÃ¡lise Detalhada de Skills</h4>
          </div>

          {application.skills_match.match_percentage !== undefined && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-blue-200 font-semibold">Compatibilidade de Skills</p>
                <p className="text-blue-300 font-bold">{application.skills_match.match_percentage}%</p>
              </div>
              <div className="w-full bg-blue-900/30 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${application.skills_match.match_percentage}%` }}
                />
              </div>
            </div>
          )}

          {application.skills_match.matched_skills?.length > 0 && (
            <div>
              <p className="text-green-300 font-semibold mb-2 flex items-center gap-1.5"><Check size={16}/> Skills Correspondentes:</p>
              <div className="flex flex-wrap gap-2">
                {application.skills_match.matched_skills.map((skill, idx) => (
                  <span key={idx} className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {application.skills_match.missing_skills?.length > 0 && (
            <div>
              <p className="text-orange-300 font-semibold mb-2 flex items-center gap-1.5"><X size={16}/> Skills Faltantes:</p>
              <div className="flex flex-wrap gap-2">
                {application.skills_match.missing_skills.map((skill, idx) => (
                  <span key={idx} className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm font-medium border border-orange-500/30">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* InformaÃ§Ãµes Adicionais */}
      {(application.detailed_analysis?.overall_fit || application.experience_analysis) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 space-y-4"
        >
          <h4 className="text-lg font-semibold text-purple-300">InformaÃ§Ãµes Adicionais</h4>

          {application.detailed_analysis?.overall_fit && (
            <div>
              <p className="text-purple-200 font-semibold mb-2">Fit Geral</p>
              <p className="text-purple-300/90 text-sm">{application.detailed_analysis.overall_fit}</p>
            </div>
          )}

          {application.experience_analysis && (
            <div>
              <p className="text-purple-200 font-semibold mb-2">AnÃ¡lise de ExperiÃªncia</p>
              <p className="text-purple-300/90 text-sm">{application.experience_analysis}</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
