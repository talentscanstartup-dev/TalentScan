import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../config/supabase'

export default function ProfileModal({ user, onClose, onUpdate }) {
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
  const [profileImage, setProfileImage] = useState(user?.user_metadata?.avatar_url || '')
  const [imageFile, setImageFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Arquivo muito grande. Máximo 5MB.')
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadImage = async () => {
    if (!imageFile) return

    try {
      const fileName = `${user.id}-${Date.now()}`
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(`avatars/${fileName}`, imageFile)

      if (error) throw error

      const { data: publicData } = supabase.storage
        .from('profiles')
        .getPublicUrl(`avatars/${fileName}`)

      return publicData?.publicUrl
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error)
      setError('Erro ao fazer upload da imagem')
      return null
    }
  }

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError('Nome completo é obrigatório')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      let avatarUrl = user?.user_metadata?.avatar_url

      // Se uma nova imagem foi selecionada, fazer upload
      if (imageFile) {
        avatarUrl = await handleUploadImage()
        if (!avatarUrl) {
          setIsLoading(false)
          return
        }
      }

      // Atualizar perfil do usuário
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          avatar_url: avatarUrl,
        },
      })

      if (updateError) throw updateError

      // Atualizar também na tabela users se existir
      const { error: dbError } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id)
        .select()

      if (dbError) {
        console.warn('Aviso ao atualizar banco de dados:', dbError)
      }

      setSuccess(true)
      setImageFile(null)

      setTimeout(() => {
        setSuccess(false)
        if (onUpdate) {
          onUpdate()
        }
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      setError(error.message || 'Erro ao atualizar perfil')
      setIsLoading(false)
    }
  }

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

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-dark-bg border border-dark-border rounded-2xl p-8 max-w-md w-full relative"
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
        <div className="mb-6">
          <h2 className="text-2xl font-bold gradient-text mb-1">Editar Perfil</h2>
          <p className="text-gray-400 text-sm">Atualize seu nome e foto de perfil</p>
        </div>

        {/* Avatar */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-main bg-gray-800 flex items-center justify-center">
              {profileImage ? (
                <img src={profileImage} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-purple-main hover:bg-purple-light p-2 rounded-full cursor-pointer transition-colors">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
          {imageFile && (
            <p className="text-xs text-purple-light text-center">Imagem selecionada</p>
          )}
        </div>

        {/* Formulário */}
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
          {/* Campo Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome Completo
            </label>
            <motion.input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-main focus:bg-white/10 transition-all"
              placeholder="Seu nome"
              whileFocus={{ scale: 1.01 }}
            />
          </div>

          {/* Email (apenas leitura) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Mensagens */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm"
            >
              ✓ Perfil atualizado com sucesso!
            </motion.div>
          )}

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <motion.button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-medium hover:bg-white/10 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancelar
            </motion.button>
            <motion.button
              type="submit"
              disabled={isLoading || success}
              className="flex-1 btn-primary py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: !isLoading ? 1.02 : 1 }}
              whileTap={{ scale: !isLoading ? 0.98 : 1 }}
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
