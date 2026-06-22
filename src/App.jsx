import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Loader2, Mail, CheckCircle, MessageCircle, BookOpen, Zap, CheckCircle2, TrendingUp, Timer, FileText, Sparkles, BrainCircuit } from 'lucide-react'

const Model3D = ({ scale = 1 }) => {
  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  }

  return (
    <motion.div
      animate={floatingVariants.animate}
      className="w-full h-full flex items-center justify-center"
      style={{ transform: `scale(${scale})` }}
    >
      <img 
        src="/imagens/robotscan.png" 
        alt="Robot Talent Scan"
        className="w-full max-w-[400px] lg:max-w-[500px] object-contain drop-shadow-2xl"
        style={{ filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.3))' }}
      />
    </motion.div>
  )
}

const Navbar = ({ onLoginClick, onRegisterClick }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Como Funciona', href: '#como-funciona' },
    { label: 'Benefícios', href: '#beneficios' },
    { label: 'Criar Currículo', href: '/criar-curriculo', isRoute: true },
    { label: 'Preços', href: '#precos' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'glass backdrop-blur-md py-3 md:py-4 border-b border-dark-border' 
          : 'py-4 md:py-6'
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2 cursor-pointer group"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-main to-purple-light flex items-center justify-center">
              <span className="text-white font-bold text-sm">TS</span>
            </div>
            <span className="text-xl font-bold text-white hidden sm:inline">Talent Scan</span>
          </motion.div>

          {/* Links e Botões Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-8">
              {navLinks.map((link) => (
                link.isRoute ? (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    className="text-purple-400 hover:text-purple-300 transition-colors duration-300 text-sm font-semibold flex items-center gap-1.5"
                    whileHover={{ scale: 1.05 }}
                  >
                    <FileText size={14} />
                    {link.label}
                  </motion.a>
                ) : (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors duration-300 text-sm font-medium"
                    whileHover={{ scale: 1.05 }}
                  >
                    {link.label}
                  </motion.a>
                )
              ))}
            </div>
            
            {/* Divisor e Botões de Ação */}
            <div className="flex items-center gap-4 border-l border-dark-border pl-6">
              <motion.button
                onClick={onLoginClick}
                className="text-white hover:text-purple-light transition-colors text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Entrar
              </motion.button>

              <motion.button
                onClick={onRegisterClick}
                className="btn-primary px-6 py-2 text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cadastro
              </motion.button>
            </div>
          </div>

          {/* Botão Hamburger Mobile */}
          <motion.button
            className="md:hidden flex flex-col gap-1.5 relative w-8 h-8"
            onClick={() => setIsOpen(!isOpen)}
          >
            <motion.span
              className="w-full h-0.5 bg-white rounded-full"
              animate={isOpen ? { rotate: 45, y: 12 } : { rotate: 0, y: 0 }}
            />
            <motion.span
              className="w-full h-0.5 bg-white rounded-full"
              animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
            />
            <motion.span
              className="w-full h-0.5 bg-white rounded-full"
              animate={isOpen ? { rotate: -45, y: -12 } : { rotate: 0, y: 0 }}
            />
          </motion.button>
        </div>

        {/* Menu Mobile */}
        <motion.div
          className="md:hidden mt-4 overflow-hidden"
          animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col gap-4 pb-4 border-t border-dark-border pt-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`transition-colors duration-300 text-sm font-medium ${
                  link.isRoute ? 'text-purple-400 hover:text-purple-300 flex items-center gap-1.5' : 'text-gray-300 hover:text-white'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.isRoute && <FileText size={14} />}
                {link.label}
              </a>
            ))}
            
            <div className="flex flex-col gap-2 pt-2 border-t border-dark-border/50">
              <motion.button
                onClick={() => {
                  setIsOpen(false)
                  onLoginClick()
                }}
                className="text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/10 rounded-lg px-6 py-2 text-sm w-full text-center font-medium"
              >
                Entrar
              </motion.button>
              <motion.button
                onClick={() => {
                  setIsOpen(false)
                  onRegisterClick()
                }}
                className="btn-primary px-6 py-2 text-sm w-full text-center"
              >
                Cadastro
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  )
}

const HeroSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20 md:pt-40 md:pb-20">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-main opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-dark opacity-5 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        className="relative z-10 container mx-auto px-4 max-w-6xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <motion.div className="flex flex-col gap-8">
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass w-fit border-purple-500/30 bg-purple-500/10 mb-2">
              <Sparkles size={16} className="text-purple-400" />
              <span className="text-sm font-medium text-purple-200">A nova era do recrutamento chegou</span>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight drop-shadow-2xl"
            >
              <span className="text-white">Triagem de Currículos </span>
              <br className="hidden md:block" />
              <span className="gradient-text glow-purple font-extrabold">100% Automática</span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-xl"
            >
              Faça upload de currículos diretamente no seu painel. Deixe nossa IA ler, analisar e rankear os melhores candidatos para as suas vagas. Privado, rápido e inteligente.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 pt-2"
            >
              <motion.a
                href="/login"
                className="btn-primary text-lg px-8 py-4 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(139,92,246,0.4)]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Acessar Plataforma <Zap size={20} className="text-yellow-300" />
              </motion.a>
              <motion.button 
                className="btn-secondary text-lg px-8 py-4 glass border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Agendar Demo
              </motion.button>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col gap-4 pt-8 border-t border-white/10 mt-4"
            >
              <p className="text-xs font-bold tracking-widest text-gray-500 uppercase">Por que escolher o Talent Scan?</p>
              <div className="flex gap-6 flex-wrap">
                <div className="flex items-center gap-2 glass px-4 py-2 rounded-lg bg-white/5">
                  <Timer size={16} className="text-purple-400" />
                  <span className="text-sm font-medium text-gray-200">90% mais rápido</span>
                </div>
                <div className="flex items-center gap-2 glass px-4 py-2 rounded-lg bg-white/5">
                  <CheckCircle size={16} className="text-green-400" />
                  <span className="text-sm font-medium text-gray-200">Sem instalação</span>
                </div>
                <div className="flex items-center gap-2 glass px-4 py-2 rounded-lg bg-white/5">
                  <BrainCircuit size={16} className="text-blue-400" />
                  <span className="text-sm font-medium text-gray-200">Powered by IA Local</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="relative flex items-center justify-center h-96 lg:h-screen lg:max-h-96"
          >
            <div className="w-full h-full flex items-center justify-center">
              <Model3D scale={2.5} />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

const Stats = () => {
  const [ref, setRef] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!ref) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
      }
    }, { threshold: 0.1 })
    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref])

  const stats = [
    {
      icon: <Zap size={40} className="text-yellow-400" />,
      label: "Tempo Economizado",
      value: "80%",
      description: "redução no tempo de triagem"
    },
    {
      icon: <CheckCircle2 size={40} className="text-green-400" />,
      label: "Taxa de Acerto",
      value: "98%",
      description: "de precisão nas análises"
    },
    {
      icon: <TrendingUp size={40} className="text-purple-400" />,
      label: "ROI Médio",
      value: "12x",
      description: "retorno do investimento"
    },
    {
      icon: <Timer size={40} className="text-cyan-400" />,
      label: "Velocidade",
      value: "<10s",
      description: "por CV analisado"
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  return (
    <section className="relative py-16 md:py-24 overflow-hidden" ref={el => el && setRef(el)}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-main/10 via-transparent to-purple-dark/10 blur-3xl"></div>
      </div>

      <motion.div 
        className="relative z-10 container mx-auto px-4 max-w-6xl"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
            >
              <div className="glass p-6 rounded-xl text-center group hover:border-purple-main transition-all duration-300">
                <div className="mb-4 flex justify-center transform group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <p className="text-4xl md:text-5xl font-bold gradient-text mb-2 drop-shadow-md">{stat.value}</p>
                <p className="font-semibold text-white mb-2">{stat.label}</p>
                <p className="text-sm text-gray-400">{stat.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

const HowItWorks = () => {
  const [ref, setRef] = useState(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!ref) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true)
      }
    }, { threshold: 0.1 })
    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  }

  const steps = [
    {
      number: 1,
      title: "Upload Direto",
      description: "O usuário faz o envio do currículo diretamente pela interface segura do sistema.",
      color: "from-purple-main to-purple-light",
    },
    {
      number: 2,
      title: "Análise com IA Local",
      description: "O motor inteligente do Talent Scan extrai as habilidades e analisa a fundo o candidato.",
      color: "from-purple-light to-purple-dark",
    },
    {
      number: 3,
      title: "Resultados Instantâneos",
      description: "Os dados são organizados e vinculados automaticamente às vagas da sua empresa.",
      color: "from-purple-dark to-purple-main",
    },
  ]

  return (
    <section id="como-funciona" className="relative py-20 md:py-32 overflow-hidden" ref={el => el && setRef(el)}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-purple-dark opacity-3 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-main opacity-3 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        className="relative z-10 container mx-auto px-4 max-w-6xl"
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
      >
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Como Funciona</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Um pipeline simples e intuitivo que faz toda a triagem acontecer automaticamente.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="relative"
            >
              <div className="glass p-8 rounded-2xl h-full flex flex-col relative z-10">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 bg-purple-main shadow-lg">
                  <span className="text-2xl font-bold text-white">{step.number}</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed flex-grow">
                  {step.description}
                </p>
                {index < steps.length - 1 && (
                  <div 
                    className="hidden md:flex absolute -right-4 top-1/2 transform -translate-y-1/2 z-20"
                  >
                    <svg className="w-8 h-8 text-purple-main" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}
              </div>
              <motion.div 
                className={`absolute inset-0 rounded-2xl opacity-0 bg-gradient-to-r ${step.color}`}
                animate={{ opacity: [0, 0.1, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              ></motion.div>
            </motion.div>
          ))}
        </div>

        <motion.div variants={itemVariants} className="md:hidden">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-main flex items-center justify-center font-bold text-white">
                    {step.number}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-1 h-8 bg-gradient-to-b from-purple-main to-transparent mt-2"></div>
                  )}
                </div>
                <div className="pb-8">
                  <h4 className="font-semibold text-white">{step.title}</h4>
                  <p className="text-gray-400 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

const Benefits = () => {
  const [ref, setRef] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!ref) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
      }
    }, { threshold: 0.1 })
    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  const benefits = [
    {
      title: "90% Mais Rápido",
      description: "Processe centenas de currículos em minutos, não em dias.",
    },
    {
      title: "Precisão com IA",
      description: "Algoritmos avançados garantem matching de candidatos mais precisos.",
    },
    {
      title: "Fácil Acesso",
      description: "Acesse e gerencie todos os candidatos direto do seu navegador.",
    },
    {
      title: "Totalmente Automático",
      description: "Do upload do CV à extração de competências, tudo roda sozinho.",
    },
    {
      title: "Economize Recursos",
      description: "Reduz custos com triagem manual e aumenta a produtividade do RH.",
    },
    {
      title: "Análise Centralizada",
      description: "Resultados organizados e vinculados automaticamente às vagas abertas.",
    },
  ]

  return (
    <section id="beneficios" className="relative py-20 md:py-32 overflow-hidden" ref={el => el && setRef(el)}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-main opacity-3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-purple-dark opacity-3 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        className="relative z-10 container mx-auto px-4 max-w-6xl"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Por Que Usar o <span className="gradient-text">Talent Scan</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Benefícios reais que transformam seu processo de recrutamento.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
            >
              <div className="glass p-8 rounded-xl h-full flex flex-col group hover:border-purple-main transition-all duration-300">
                <h3 className="text-xl font-bold mb-3 text-white">
                  {benefit.title}
                </h3>
                <p className="text-gray-400 leading-relaxed flex-grow">
                  {benefit.description}
                </p>
                <motion.div 
                  className="mt-4 h-1 rounded-full bg-purple-main opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                ></motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={itemVariants}
          className="mt-16 glass p-8 md:p-12 rounded-2xl text-center"
        >
          <h3 className="text-3xl font-bold mb-4">
            Pronto para revolucionar seu processo de <span className="gradient-text">recrutamento</span>?
          </h3>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Comece a usar o Talent Scan hoje mesmo. É grátis para experimentar.
          </p>
          <motion.a
            href="https://web.telegram.org/a/#8790543248"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Testar Agora
          </motion.a>
        </motion.div>
      </motion.div>
    </section>
  )
}

const Testimonials = () => {
  const [ref, setRef] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!ref) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
      }
    }, { threshold: 0.1 })
    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref])

  const testimonials = [
    {
      name: "Carlos Silva",
      role: "Head of HR - Tech Startup",
      company: "StartupXYZ",
      text: "Reduzimos 80% do tempo de triagem de currículos. O Talent Scan é incrível!",
      rating: 5,
      avatar: "CS"
    },
    {
      name: "Maria Santos",
      role: "Recrutadora Sênior",
      company: "BigCorp Brasil",
      text: "Nunca vi uma ferramenta tão precisa. Os matches são perfeitos e confiáveis.",
      rating: 5,
      avatar: "MS"
    },
    {
      name: "João Oliveira",
      role: "Gerente de Talentos",
      company: "TechHub",
      text: "Automatizou completamente nosso pipeline. Muito recomendo para qualquer empresa.",
      rating: 5,
      avatar: "JO"
    },
    {
      name: "Ana Costa",
      role: "CEO - HR Solutions",
      company: "RHPro",
      text: "É exatamente o que procurávamos. Ter a Inteligência Artificial rodando no nosso próprio servidor mudou o jogo da privacidade.",
      rating: 5,
      avatar: "AC"
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  return (
    <section className="relative py-20 md:py-32 overflow-hidden" ref={el => el && setRef(el)}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-main opacity-3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-dark opacity-3 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        className="relative z-10 container mx-auto px-4 max-w-6xl"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            O Que Dizem Nossos <span className="gradient-text">Clientes</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Empresas de todos os tamanhos confiam no Talent Scan para revolucionar seu recrutamento.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
            >
              <div className="glass p-8 rounded-xl h-full flex flex-col group hover:border-purple-main transition-all duration-300">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                  ))}
                </div>
                <p className="text-gray-300 italic leading-relaxed flex-grow mb-6">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-4 pt-4 border-t border-dark-border">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-main to-purple-light flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                    <p className="text-xs text-purple-light">{testimonial.company}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div variants={itemVariants} className="glass p-8 md:p-12 rounded-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold gradient-text mb-2">500+</p>
              <p className="text-gray-400 text-sm">Empresas Ativas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold gradient-text mb-2">1.2M</p>
              <p className="text-gray-400 text-sm">CVs Processados</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold gradient-text mb-2">98%</p>
              <p className="text-gray-400 text-sm">Satisfação</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-3xl md:text-4xl font-bold gradient-text">4.9</p>
                <div className="w-5 h-5 bg-yellow-400 rounded-full mt-1"></div>
              </div>
              <p className="text-gray-400 text-sm">Rating Médio</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

const ResumeBuilderCTA = () => {
  const [ref, setRef] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!ref) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
      }
    }, { threshold: 0.1 })
    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  const features = [
    { icon: <FileText size={24} />, title: 'Formulário Inteligente', desc: 'Preencha passo a passo com um formulário intuitivo e organizado' },
    { icon: <Sparkles size={24} />, title: 'Análise com IA', desc: 'Receba um score instantâneo e dicas para melhorar seu currículo' },
    { icon: <CheckCircle2 size={24} />, title: 'Download em PDF', desc: 'Baixe seu currículo profissional pronto para enviar às empresas' },
  ]

  return (
    <section id="criar-curriculo" className="relative py-20 md:py-32 overflow-hidden" ref={el => el && setRef(el)}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-purple-main/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        className="relative z-10 container mx-auto px-4 max-w-6xl"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        <motion.div variants={itemVariants} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
            <Sparkles size={16} />
            Novo! Crie seu currículo gratuitamente
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Monte seu <span className="gradient-text">Currículo Profissional</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Crie um currículo impressionante em minutos. Preencha, visualize em tempo real, 
            baixe em PDF ou analise com nossa IA — tudo gratuito.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
            >
              <div className="glass p-6 rounded-2xl h-full text-center group hover:border-purple-main transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-purple-main to-purple-light flex items-center justify-center mx-auto mb-4 text-white transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div variants={itemVariants} className="text-center">
          <motion.a
            href="/criar-curriculo"
            className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FileText size={22} />
            Criar Meu Currículo Agora
          </motion.a>
          <p className="text-gray-500 text-sm mt-4">100% gratuito • Sem cadastro necessário • Download instantâneo</p>
        </motion.div>
      </motion.div>
    </section>
  )
}

const Pricing = () => {

  const [ref, setRef] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!ref) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
      }
    }, { threshold: 0.1 })
    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref])

  const plans = [
    {
      name: "Startup",
      price: "29",
      description: "Perfeito para pequenos times de RH",
      features: [
        "Até 100 CVs/mês",
        "1 usuário",
        "Análise básica com IA",
        "Google Sheets",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "99",
      description: "Para equipes em crescimento",
      features: [
        "Até 500 CVs/mês",
        "5 usuários",
        "Análise avançada com IA",
        "Google Sheets + API",
        "Prioridade 24/7 support",
        "Templates customizados"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Para empresas grandes",
      features: [
        "CVs ilimitados",
        "Usuários ilimitados",
        "Análise especializada",
        "Integrações custom",
        "Suporte dedicado",
        "SLA garantido"
      ],
      popular: false
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  return (
    <section id="precos" className="relative py-20 md:py-32 overflow-hidden" ref={el => el && setRef(el)}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-purple-dark opacity-3 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-main opacity-3 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        className="relative z-10 container mx-auto px-4 max-w-6xl"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Preços Simples</span> e Transparentes
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Escolha o plano perfeito para seu negócio. Sem taxas ocultas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={plan.popular ? { scale: 1.02 } : { scale: 1 }}
              className={`relative ${plan.popular ? 'md:scale-105' : ''}`}
            >
              {plan.popular && (
                <motion.div 
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <span className="bg-gradient-to-r from-purple-main to-purple-light px-4 py-1 rounded-full text-sm font-semibold text-white">
                    MAIS POPULAR
                  </span>
                </motion.div>
              )}

              <div className={`glass p-8 rounded-2xl h-full flex flex-col border-2 transition-all duration-300 ${
                plan.popular 
                  ? 'border-purple-main' 
                  : 'border-transparent hover:border-purple-main'
              }`}>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-gray-400">/mês</span>}
                  </div>
                </div>

                {plan.name === "Enterprise" ? (
                  <motion.a
                    href="mailto:contato@talentscan.com?subject=Solicitar Demo Enterprise"
                    className={`w-full py-3 px-4 rounded-lg font-semibold mb-8 transition-all duration-300 inline-block text-center ${
                      plan.popular
                        ? 'btn-primary'
                        : 'bg-purple-main/10 text-purple-light border border-purple-main/30 hover:border-purple-main/60'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Solicitar Demo
                  </motion.a>
                ) : (
                  <motion.a
                    href="https://web.telegram.org/a/#8790543248"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-3 px-4 rounded-lg font-semibold mb-8 transition-all duration-300 inline-block text-center ${
                      plan.popular
                        ? 'btn-primary'
                        : 'bg-purple-main/10 text-purple-light border border-purple-main/30 hover:border-purple-main/60'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Começar Agora
                  </motion.a>
                )}

                <div className="space-y-4 flex-grow">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-main to-purple-light flex items-center justify-center flex-shrink-0 mt-0.5"></div>
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={itemVariants}
          className="glass p-8 md:p-12 rounded-2xl text-center"
        >
          <h3 className="text-3xl font-bold mb-4">
            Teste <span className="gradient-text">grátis por 14 dias</span>
          </h3>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Sem cartão de crédito. Sem compromisso. Todos os recursos inclusos.
          </p>
          <motion.a
            href="https://web.telegram.org/a/#8790543248"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Começar Teste Gratuito
          </motion.a>
        </motion.div>
      </motion.div>
    </section>
  )
}

const FAQ = () => {
  const [ref, setRef] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [openIndex, setOpenIndex] = useState(null)

  useEffect(() => {
    if (!ref) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
      }
    }, { threshold: 0.1 })
    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref])

  const faqs = [
    {
      question: "Como funciona a integração com Telegram?",
      answer: "Basta adicionar nosso bot do Telegram e enviar um CV. O Talent Scan fará a análise automaticamente e enviará os resultados para sua planilha Google Sheets."
    },
    {
      question: "Posso conectar em múltiplas planilhas?",
      answer: "Sim! No plano Professional e Enterprise você pode conectar quantas planilhas quiser. Cada uma pode ter configurações diferentes."
    },
    {
      question: "Qual é a precisão da análise de IA?",
      answer: "Nossa IA tem 98% de precisão no matching de candidatos. Usamos modelos treinados especificamente para análise de CVs em português."
    },
    {
      question: "Quanto tempo leva para analisar um CV?",
      answer: "Em média 5-10 segundos por CV. Você pode enviar centenas de CVs de uma vez e o Talent Scan processará tudo automaticamente."
    },
    {
      question: "Os dados dos candidatos são seguros?",
      answer: "Sim! Todos os dados são criptografados em trânsito e em repouso. Estamos em conformidade com LGPD e práticas internacionais de segurança."
    },
    {
      question: "Posso personalizar os critérios de análise?",
      answer: "Sim! No plano Professional e Enterprise você pode customizar os pesos de cada critério de análise para se adequar ao seu processo de seleção."
    },
    {
      question: "Existe suporte em português?",
      answer: "Claro! Temos suporte completo em português 24/7. Você pode entrar em contato via email, chat ou telefone."
    },
    {
      question: "Posso integrar com meu ATS?",
      answer: "Atualmente suportamos Google Sheets. Estamos desenvolvendo integrações com Workable, Gupy e outros ATSs populares."
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  return (
    <section id="faq" className="relative py-20 md:py-32 overflow-hidden" ref={el => el && setRef(el)}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-main opacity-3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-dark opacity-3 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        className="relative z-10 container mx-auto px-4 max-w-3xl"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Perguntas <span className="gradient-text">Frequentes</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Tudo que você precisa saber sobre o Talent Scan.
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="glass rounded-xl overflow-hidden group hover:border-purple-main transition-all duration-300"
            >
              <button
                className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors duration-200"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-lg font-semibold text-white pr-6">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <svg
                    className="w-6 h-6 text-purple-main"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </motion.div>
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-dark-border"
                  >
                    <p className="p-6 text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={itemVariants}
          className="mt-16 glass p-8 md:p-12 rounded-2xl text-center"
        >
          <h3 className="text-2xl font-bold mb-4">Não encontrou sua pergunta?</h3>
          <p className="text-gray-400 mb-6">
            Entre em contato conosco diretamente. Estamos aqui para ajudar!
          </p>
          <a
            href="mailto:suporte@talentscan.com"
            className="btn-primary px-8 py-3 inline-block"
          >
            Entrar em Contato
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}

const TechStack = () => {
  const [ref, setRef] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!ref) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
      }
    }, { threshold: 0.1 })
    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.8 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6 },
    },
  }

  const techStack = [
    { name: "React 18", description: "Interface fluida e reativa" },
    { name: "Ollama (IA Local)", description: "Inteligência Artificial sem limites" },
    { name: "Supabase", description: "Banco de dados e Autenticação" },
    { name: "Node.js", description: "Backend de alta performance" },
  ]

  return (
    <section className="relative py-20 md:py-32 overflow-hidden" ref={setRef}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-bg via-transparent to-dark-bg"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-main/5 via-purple-dark/5 to-purple-light/5 blur-3xl rounded-full"></div>
        </div>
      </div>

      <motion.div 
        className="relative z-10 container mx-auto px-4 max-w-6xl"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Nossa Infraestrutura</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            100% Integrado. Processamento local, seguro e escalável.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {techStack.map((tech, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              custom={index}
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass p-6 rounded-xl text-center group hover:border-purple-main transition-all duration-300 h-full flex flex-col items-center justify-center">
                <h3 className="text-xl font-bold mb-2 text-white">{tech.name}</h3>
                <p className="text-sm text-gray-400">{tech.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={itemVariants}
          className="glass p-8 md:p-12 rounded-2xl"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-main to-purple-light flex items-center justify-center">
                <span className="text-2xl font-bold">📄</span>
              </div>
              <h4 className="font-semibold text-white">Upload Direto</h4>
              <p className="text-gray-400 text-sm text-center">Via Dashboard</p>
            </div>

            <div className="hidden md:block text-purple-light px-4">
              <div className="w-8 h-px bg-gradient-to-r from-purple-light to-transparent"></div>
            </div>

            <div className="flex-1 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-dark to-purple-main flex items-center justify-center">
                <span className="text-2xl font-bold">🧠</span>
              </div>
              <h4 className="font-semibold text-white">Ollama IA</h4>
              <p className="text-gray-400 text-sm text-center">Extração & Match</p>
            </div>

            <div className="hidden md:block text-purple-main px-4">
              <div className="w-8 h-px bg-gradient-to-r from-purple-main to-transparent"></div>
            </div>

            <div className="flex-1 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-light to-purple-main flex items-center justify-center">
                <span className="text-2xl font-bold">📊</span>
              </div>
              <h4 className="font-semibold text-white">Vagas e Métricas</h4>
              <p className="text-gray-400 text-sm text-center">Score Calculado</p>
            </div>
          </div>

          <div className="md:hidden flex justify-between items-center text-center my-6">
            <div className="flex-1">
              <motion.div 
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1 h-6 bg-purple-main mx-auto"
              >
              </motion.div>
            </div>
            <div className="flex-1">
              <motion.div 
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                className="w-1 h-6 bg-purple-light mx-auto"
              >
              </motion.div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-12 p-6 md:p-8 rounded-xl border border-dark-border bg-gradient-to-r from-purple-main/5 via-purple-dark/5 to-purple-light/5"
        >
          <div className="flex gap-4 items-start">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-main to-purple-light rounded flex-shrink-0 mt-1"></div>
            <div>
              <h4 className="font-bold text-white mb-2">Privacidade Total e Processamento Local</h4>
              <p className="text-gray-400">
                Abandonamos as APIs de terceiros. Seu fluxo é direto: Faça o upload pela nossa interface web, deixe nosso motor de Inteligência Artificial Local (Ollama) fazer a triagem a fundo e visualize os matches instantâneos com as suas vagas. Tudo fica na sua própria infraestrutura.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

const Contact = () => {
  const [ref, setRef] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!ref) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
      }
    }, { threshold: 0.1 })
    observer.observe(ref)
    return () => observer.disconnect()
  }, [ref])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setSubmitted(true)
    setEmail('')
    setLoading(false)
    
    setTimeout(() => setSubmitted(false), 5000)
  }

  return (
    <section className="relative py-20 md:py-32 overflow-hidden" ref={el => el && setRef(el)}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-main opacity-3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-dark opacity-3 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        className="relative z-10 container mx-auto px-4 max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
      >
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Fique por Dentro das <span className="gradient-text">Novidades</span>
          </h2>
          <p className="text-gray-400 text-lg">
            Receba dicas, atualizações e cases de sucesso direto no seu email.
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="glass p-8 md:p-12 rounded-2xl"
        >
          {!submitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-6 py-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-main transition-all duration-300"
                required
                disabled={loading}
              />
              <motion.button
                type="submit"
                className="btn-primary px-8 py-4 font-semibold whitespace-nowrap"
                disabled={loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? <><Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" /> Enviando...</> : <><Mail className="inline-block w-4 h-4 mr-2" /> Inscrever</>}
              </motion.button>
            </form>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <p className="text-lg text-green-400 font-semibold">
                <CheckCircle className="inline-block w-5 h-5 mr-2 text-green-400" /> Inscrição realizada com sucesso!
              </p>
              <p className="text-gray-400 mt-2">
                Verifique sua caixa de entrada para receber atualizações.
              </p>
            </motion.div>
          )}
          
          <p className="text-xs text-gray-500 text-center mt-4">
            Prometemos não spammar. Você pode se desinscrever a qualquer momento.
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 mb-4">Junte-se a milhares de recrutadores</p>
          <div className="flex justify-center gap-6">
            <a 
              href="#" 
              className="text-gray-400 hover:text-purple-light transition-colors duration-300 text-sm font-medium"
            >
              <MessageCircle className="inline-block w-4 h-4 mr-2" /> Twitter
            </a>
            <a 
              href="#" 
              className="text-gray-400 hover:text-purple-light transition-colors duration-300 text-sm font-medium"
            >
              <Briefcase className="inline-block w-4 h-4 mr-2" /> LinkedIn
            </a>
            <a 
              href="#" 
              className="text-gray-400 hover:text-purple-light transition-colors duration-300 text-sm font-medium"
            >
              <BookOpen className="inline-block w-4 h-4 mr-2" /> Blog
            </a>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  }

  const footerLinks = {
    Produto: ["Recursos", "Preços", "Documentação", "Roadmap"],
    Empresa: ["Sobre", "Blog", "Contato", "Carreiras"],
    Legal: ["Privacidade", "Termos", "Cookies", "LGPD"],
    Social: ["Twitter", "LinkedIn", "GitHub", "Discord"],
  }

  return (
    <footer className="relative py-16 md:py-24 overflow-hidden border-t border-dark-border">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-main opacity-3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-dark opacity-3 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        className="relative z-10 container mx-auto px-4 max-w-6xl"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-main to-purple-light flex items-center justify-center">
                <span className="text-white font-bold text-sm">TS</span>
              </div>
              <h3 className="text-xl font-bold text-white">Talent Scan</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Inteligência artificial para triagem de currículos instantânea.
            </p>
            <div className="flex gap-4 mt-4">
              {["Twitter", "LinkedIn", "GitHub"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:border-purple-main transition-all duration-300"
                  title={social}
                >
                  <span className="text-sm font-semibold">{social[0]}</span>
                </a>
              ))}
            </div>
          </motion.div>

          {Object.entries(footerLinks).slice(0, 3).map(([title, links], idx) => (
            <motion.div key={title} variants={itemVariants} className="flex flex-col">
              <h4 className="font-semibold text-white mb-4">{title}</h4>
              <ul className="space-y-3 flex-1">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-neon-blue transition-colors duration-300 text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          variants={itemVariants}
          className="glass p-8 md:p-12 rounded-2xl mb-12 text-center"
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            Comece a usar <span className="gradient-text">Talent Scan</span> agora
          </h3>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Solução 100% gratuita rodando localmente na sua máquina.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.a
              href="/login"
              className="btn-primary px-8 py-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Começar Agora
            </motion.a>
            <motion.button 
              className="btn-secondary px-8 py-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Ver Demo
            </motion.button>
          </div>
        </motion.div>

        <div className="h-px bg-gradient-to-r from-transparent via-dark-border to-transparent mb-8"></div>

        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400"
        >
          <p>© {currentYear} Talent Scan. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-neon-blue transition-colors duration-300">
              Status
            </a>
            <a href="#" className="hover:text-neon-blue transition-colors duration-300">
              Contato
            </a>
            <a href="#" className="hover:text-neon-blue transition-colors duration-300">
              Suporte
            </a>
          </div>
        </motion.div>

        <div
          className="absolute bottom-0 left-0 w-40 h-40 border border-purple-main rounded-full opacity-5 pointer-events-none"
          style={{ marginLeft: "-80px", marginBottom: "-80px" }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-40 h-40 border border-purple-dark rounded-full opacity-5 pointer-events-none"
          style={{ marginRight: "-80px", marginBottom: "-80px" }}
        ></div>
      </motion.div>
    </footer>
  )
}

function App() {
  const navigate = useNavigate()

  const handleLoginClick = () => {
    navigate('/login')
  }

  const handleRegisterClick = () => {
    navigate('/register')
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 stars"></div>
      </div>

      <Navbar onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} />
      <HeroSection />
      <Stats />
      <HowItWorks />
      <Benefits />
      <Testimonials />
      <ResumeBuilderCTA />
      <Pricing />
      <FAQ />
      <TechStack />
      <Contact />
      <Footer />
    </div>
  )
}

export default App