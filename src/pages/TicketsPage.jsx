import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { LifeBuoy } from 'lucide-react'
import CreateTicketModal from '../components/CreateTicketModal'
import TicketsPanel from '../components/TicketsPanel'

export default function TicketsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleCreateSuccess = (ticket) => {
    console.log('Ticket criado:', ticket)
    // Pode atualizar lista de tickets aqui
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-dark-bg to-dark-bg/50 p-4 md:p-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl">
              <LifeBuoy size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Central de Atendimento
              </h1>
              <p className="text-gray-400">Gerencie seus tickets de suporte e solicitações</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="glass rounded-2xl p-6 border border-white/10">
          <TicketsPanel onCreateNew={() => setShowCreateModal(true)} />
        </div>

        {/* Create Ticket Modal */}
        <CreateTicketModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </motion.div>
  )
}
