import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Settings, X, ChevronLeft, ChevronRight, Bell, Moon, Sun, Palette, Eye, Lock } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const SettingsPanel = () => {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('settings_notifications');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('settings_soundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [emailNotifications, setEmailNotifications] = useState(() => {
    const saved = localStorage.getItem('settings_emailNotifications');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [publicProfile, setPublicProfile] = useState(() => {
    const saved = localStorage.getItem('settings_publicProfile');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [dataPrivacy, setDataPrivacy] = useState(() => {
    const saved = localStorage.getItem('settings_dataPrivacy');
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('settings_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('settings_soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('settings_emailNotifications', JSON.stringify(emailNotifications));
  }, [emailNotifications]);

  useEffect(() => {
    localStorage.setItem('settings_publicProfile', JSON.stringify(publicProfile));
  }, [publicProfile]);

  useEffect(() => {
    localStorage.setItem('settings_dataPrivacy', JSON.stringify(dataPrivacy));
  }, [dataPrivacy]);

  const panelRef = useRef(null);

  // Fechar configurações
  const closeSettings = useCallback(() => {
    setIsOpen(false);
    setCurrentPage(0);
  }, []);

  // Detectar clique fora do painel e Escape
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeSettings();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey, true);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey, true);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, closeSettings]);

  const pages = [
    {
      title: 'Tema',
      icon: Palette,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTheme('light');
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                theme === 'light'
                  ? 'bg-yellow-100 text-yellow-900 shadow-lg scale-105'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Sun size={24} />
              <span className="text-xs font-semibold">Claro</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTheme('dark');
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                theme === 'dark'
                  ? 'bg-slate-700 text-blue-300 shadow-lg scale-105'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Moon size={24} />
              <span className="text-xs font-semibold">Escuro</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleTheme('default');
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                theme === 'default'
                  ? 'bg-purple-500 text-white shadow-lg scale-105'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <Palette size={24} />
              <span className="text-xs font-semibold">Padrão</span>
            </button>
          </div>
        </div>
      ),
    },
    {
      title: 'Notificações',
      icon: Bell,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-purple-400" />
              <div>
                <p className="font-semibold text-white text-sm">Notificações</p>
                <p className="text-xs text-gray-400">Push notifications</p>
              </div>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-7 rounded-full transition-all ${
                notifications ? 'bg-purple-500' : 'bg-gray-600'
              } relative`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                  notifications ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
            <div className="flex items-center gap-3">
              <Sun size={20} className="text-yellow-400" />
              <div>
                <p className="font-semibold text-white text-sm">Sons</p>
                <p className="text-xs text-gray-400">Som das notificações</p>
              </div>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-12 h-7 rounded-full transition-all ${
                soundEnabled ? 'bg-purple-500' : 'bg-gray-600'
              } relative`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                  soundEnabled ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-blue-400" />
              <div>
                <p className="font-semibold text-white text-sm">Email</p>
                <p className="text-xs text-gray-400">Notificações por email</p>
              </div>
            </div>
            <button
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`w-12 h-7 rounded-full transition-all ${
                emailNotifications ? 'bg-purple-500' : 'bg-gray-600'
              } relative`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                  emailNotifications ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      ),
    },
    {
      title: 'Privacidade',
      icon: Lock,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-green-400" />
              <div>
                <p className="font-semibold text-white text-sm">Perfil Público</p>
                <p className="text-xs text-gray-400">Visível para empresas</p>
              </div>
            </div>
            <button
              onClick={() => setPublicProfile(!publicProfile)}
              className={`w-12 h-7 rounded-full transition-all ${
                publicProfile ? 'bg-purple-500' : 'bg-gray-600'
              } relative`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                  publicProfile ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all">
            <div className="flex items-center gap-3">
              <Lock size={20} className="text-red-400" />
              <div>
                <p className="font-semibold text-white text-sm">Privacidade de Dados</p>
                <p className="text-xs text-gray-400">Não compartilhar com terceiros</p>
              </div>
            </div>
            <button
              onClick={() => setDataPrivacy(!dataPrivacy)}
              className={`w-12 h-7 rounded-full transition-all ${
                dataPrivacy ? 'bg-purple-500' : 'bg-gray-600'
              } relative`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                  dataPrivacy ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      ),
    },
  ];

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % pages.length);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + pages.length) % pages.length);
  };

  const CurrentIcon = pages[currentPage].icon;

  // Handlers com stopPropagation
  const handleToggleClick = (e) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  const handleOverlayClick = (e) => {
    e.stopPropagation();
    closeSettings();
  };

  const handlePanelClick = (e) => {
    e.stopPropagation();
  };

  const handleCloseClick = (e) => {
    e.stopPropagation();
    closeSettings();
  };

  // Renderizar o overlay e painel via Portal para evitar ser cortado por overflow:hidden
  const portalContent = isOpen ? ReactDOM.createPortal(
    <>
      {/* Overlay - Clicável para fechar */}
      <div 
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm" 
        onClick={handleOverlayClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            closeSettings();
          }
        }}
      />

      {/* Painel Deslizável */}
      <div
        ref={panelRef}
        className="fixed right-0 top-0 bottom-0 w-full sm:w-96 z-[9999] flex flex-col"
        style={{
          backgroundColor: 'var(--card-bg, rgba(22, 17, 40, 0.95))',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderLeft: '1px solid var(--border-color, rgba(139, 92, 246, 0.15))',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.4)',
          animation: 'slideInFromRight 0.3s ease-out',
        }}
        onClick={handlePanelClick}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <CurrentIcon size={24} className="text-purple-400" />
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{pages[currentPage].title}</h3>
          </div>
          <button
            onClick={handleCloseClick}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            title="Fechar"
          >
            <X size={24} style={{ color: 'var(--text-primary)' }} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          {pages[currentPage].content}
        </div>

        {/* Footer com Navegação */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevPage();
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            disabled={pages.length <= 1}
          >
            <ChevronLeft size={24} style={{ color: 'var(--text-primary)' }} />
          </button>

          <div className="flex gap-2">
            {pages.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage(idx);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentPage ? 'bg-purple-500 w-6' : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextPage();
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            disabled={pages.length <= 1}
          >
            <ChevronRight size={24} style={{ color: 'var(--text-primary)' }} />
          </button>
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div className="relative">
      {/* Botão de Configurações */}
      <button
        onClick={handleToggleClick}
        title="Configurações"
        className="p-2 rounded-lg transition-all duration-300 bg-white/10 hover:bg-white/20"
        style={{ color: 'var(--text-primary)' }}
      >
        <Settings size={20} />
      </button>

      {portalContent}
    </div>
  );
};

export default SettingsPanel;
