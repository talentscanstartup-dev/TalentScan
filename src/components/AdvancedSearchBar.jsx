import React, { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, MapPin, Briefcase, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Componente AdvancedSearchBar
 * Barra de busca inteligente (booleana) com filtros avançados e debounce integrado.
 * 
 * @param {Function} onResults - Callback disparado ao receber resultados da busca: (candidates) => void
 * @param {Function} onSearchStart - Callback opcional disparado ao iniciar a busca: () => void
 * @param {Function} onError - Callback opcional disparado em caso de erro: (errorMsg) => void
 */
export default function AdvancedSearchBar({ onResults, onSearchStart, onError }) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const isFirstRender = useRef(true);

  // Debounce para a busca textual e filtros
  useEffect(() => {
    // Evita busca na primeira renderização se os campos estiverem vazios
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const handler = setTimeout(() => {
      handleSearch();
    }, 600); // 600ms de debounce

    return () => clearTimeout(handler);
  }, [query, location, minExperience]);

  const handleSearch = async () => {
    setIsLoading(true);
    if (onSearchStart) onSearchStart();

    try {
      // Obter o token de autenticação a partir do localStorage
      const savedSession = localStorage.getItem('talentscan_session');
      let token = '';
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        token = parsed.session?.access_token || '';
      }

      // Montar os parâmetros de busca
      const params = new URLSearchParams();
      if (query.trim()) params.append('q', query.trim());
      if (location.trim()) params.append('location', location.trim());
      if (minExperience.trim()) params.append('minExperience', minExperience.trim());

      const response = await fetch(`http://localhost:5000/candidates/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao realizar a busca de candidatos.');
      }

      const data = await response.json();
      if (onResults) {
        onResults(data.candidates || []);
      }
    } catch (err) {
      console.error(err);
      if (onError) {
        onError(err.message || 'Erro de conexão com o servidor.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setLocation('');
    setMinExperience('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Barra de Busca Principal */}
      <div className="relative flex items-center gap-2 p-2 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl">
        <div className="relative flex-1 flex items-center pl-3">
          <Search className="w-5 h-5 text-slate-400 absolute left-4" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Ex: ("React" OR "Vue") AND "Node.js" AND NOT "PHP"'
            className="w-full pl-10 pr-4 py-3 bg-transparent text-slate-100 placeholder-slate-500 rounded-xl focus:outline-none focus:ring-0 text-sm sm:text-base"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botão de Filtros Avançados */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-300 ${
            showAdvanced || location || minExperience
              ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20'
              : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filtros</span>
          {(location || minExperience) && (
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          )}
        </button>

        {/* Loader de Loading de Busca */}
        {isLoading && (
          <div className="absolute -bottom-1 left-4 right-4 h-0.5 bg-purple-950 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 w-1/3 rounded-full animate-[loading_1.5s_infinite]" />
          </div>
        )}
      </div>

      {/* Seção Expandível de Filtros Avançados */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="p-5 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-2xl shadow-lg grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Input de Localização */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                Localização
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: São Paulo, SP ou Remoto"
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-purple-500 rounded-xl focus:outline-none text-slate-200 text-sm transition-colors"
                />
                {location && (
                  <button
                    onClick={() => setLocation('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Input de Experiência Mínima */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                Experiência Mínima (Anos)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={minExperience}
                  onChange={(e) => setMinExperience(e.target.value)}
                  placeholder="Ex: 3"
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-950/60 border border-slate-800 focus:border-purple-500 rounded-xl focus:outline-none text-slate-200 text-sm transition-colors"
                />
                {minExperience && (
                  <button
                    onClick={() => setMinExperience('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Ações de Limpeza de Filtro */}
            {(query || location || minExperience) && (
              <div className="md:col-span-2 flex justify-end pt-2">
                <button
                  onClick={clearFilters}
                  className="text-xs text-slate-400 hover:text-purple-400 font-medium transition-colors"
                >
                  Limpar todos os filtros
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adicionar Animação Personalizada para a Barra de Progresso no Tailwind */}
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}
