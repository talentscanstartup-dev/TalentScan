import React from 'react';
import { Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => toggleTheme('light')}
        title="Modo Claro"
        className={`p-2 rounded-lg transition-all duration-300 ${
          theme === 'light'
            ? 'bg-yellow-100 text-yellow-700 shadow-lg'
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }`}
      >
        <Sun size={20} />
      </button>

      <button
        onClick={() => toggleTheme('dark')}
        title="Modo Escuro"
        className={`p-2 rounded-lg transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-slate-700 text-blue-300 shadow-lg'
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }`}
      >
        <Moon size={20} />
      </button>

      <button
        onClick={() => toggleTheme('default')}
        title="Modo Padrão"
        className={`p-2 rounded-lg transition-all duration-300 ${
          theme === 'default'
            ? 'bg-purple-500 text-white shadow-lg'
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
        }`}
      >
        <Palette size={20} />
      </button>
    </div>
  );
};

export default ThemeToggle;

