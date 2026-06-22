import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/**
 * DeleteAccountModal
 * Modal para exclusão permanente de conta (LGPD - Direito ao Esquecimento).
 * 
 * @param {boolean} isOpen - Controla a visibilidade do modal.
 * @param {Function} onClose - Função para fechar o modal.
 */
export default function DeleteAccountModal({ isOpen, onClose }) {
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  const isConfirmed = confirmationText === 'CONFIRMAR EXCLUSÃO';

  const handleDeleteAccount = async () => {
    if (!isConfirmed) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Obter o token de autenticação a partir do localStorage
      const savedSession = localStorage.getItem('talentscan_session');
      let token = '';
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        token = parsed.session?.access_token || '';
      }

      if (!token) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      const response = await fetch('http://localhost:5000/users/me/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Ocorreu um erro ao excluir a conta.');
      }

      // Sucesso na exclusão
      // Limpar todos os dados locais
      localStorage.removeItem('talentscan_session');
      
      // Fechar modal
      onClose();
      
      // Redirecionar imediatamente para a Landing Page
      navigate('/');
      
      // Forçar refresh para garantir que qualquer estado global seja limpo
      window.location.reload();

    } catch (err) {
      console.error('Delete account error:', err);
      setError(err.message || 'Erro de conexão com o servidor.');
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay Escuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Container do Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-slate-900 border border-red-900/50 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col"
            >
              {/* Cabeçalho */}
              <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-red-950/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-100">Excluir Conta Permanentemente</h2>
                </div>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Corpo */}
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Você está prestes a excluir sua conta do TalentScan. Esta ação é <strong className="text-red-400">irreversível</strong> e resultará na remoção permanente de:
                  </p>
                  
                  <ul className="text-sm text-slate-400 space-y-2 list-disc pl-5">
                    <li>Sua foto de perfil e dados de cadastro.</li>
                    <li>Todos os seus currículos e informações extraídas.</li>
                    <li>Seu histórico de matches com vagas.</li>
                  </ul>
                  
                  <p className="text-slate-300 text-sm">
                    Para confirmar a exclusão, digite <strong className="text-slate-200 select-all">CONFIRMAR EXCLUSÃO</strong> no campo abaixo:
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="CONFIRMAR EXCLUSÃO"
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-center font-mono placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors disabled:opacity-50"
                  />
                  {error && (
                    <p className="text-sm text-red-400 text-center animate-pulse">{error}</p>
                  )}
                </div>
              </div>

              {/* Rodapé */}
              <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50 w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={!isConfirmed || isLoading}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 w-full sm:w-auto ${
                    isConfirmed && !isLoading
                      ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20'
                      : 'bg-red-900/50 text-red-400/50 cursor-not-allowed border border-red-900/50'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {isLoading ? 'Excluindo...' : 'Excluir Minha Conta'}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
