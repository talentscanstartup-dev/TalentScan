import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText } from 'lucide-react'
import ResumeBuilder from '../components/ResumeBuilder'

export default function ResumeBuilderPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 stars"></div>
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-main/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-dark/5 rounded-full blur-3xl"></div>
      </div>

      {/* Navbar */}
      <motion.nav
        className="sticky top-0 z-50 glass backdrop-blur-md border-b border-dark-border"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 max-w-7xl py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => navigate('/')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="hidden sm:inline text-sm">Voltar</span>
              </motion.button>
              <div className="h-6 w-px bg-white/10"></div>
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-main to-purple-light flex items-center justify-center">
                  <span className="text-white font-bold text-sm">TS</span>
                </div>
                <span className="text-lg font-bold text-white hidden sm:inline">Talent Scan</span>
              </Link>
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              <FileText size={20} />
              <span className="font-semibold text-white text-sm md:text-base">Criador de Currículo</span>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-4 max-w-7xl py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Crie seu <span className="gradient-text">Currículo Profissional</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Preencha as informações abaixo, visualize em tempo real e baixe em PDF ou analise com nossa IA.
          </p>
        </motion.div>

        {/* Resume Builder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <ResumeBuilder />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-dark-border py-8 mt-12 print:hidden">
        <div className="container mx-auto px-4 max-w-7xl text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Talent Scan — Inteligência artificial para contratação.
          </p>
        </div>
      </footer>
    </div>
  )
}
