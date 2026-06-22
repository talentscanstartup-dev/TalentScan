import React, { useState, useEffect } from 'react';

// Ajuste o caminho do api.js conforme a estrutura do seu projeto
// Presumindo que você tem um axios instance configurado em services/api.js
import api from '../services/api';

export default function InterviewScorecard({ candidateId, jobId }) {
  const [templates, setTemplates] = useState([]);
  const [evaluations, setEvaluations] = useState({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Busca os critérios vinculados à vaga
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data } = await api.get(`/jobs/${jobId}/scorecard`); 
        setTemplates(data.data || data); // Dependendo de como a API envia a resposta
      } catch (error) {
        console.error("Erro ao buscar scorecard", error);
      }
    };
    if (jobId) fetchTemplates();
  }, [jobId]);

  const handleUpdate = (templateId, field, value) => {
    setEvaluations(prev => ({
      ...prev,
      [templateId]: { ...prev[templateId], [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback({ message: '', type: '' });

    const payload = Object.keys(evaluations).map(templateId => ({
      scorecard_template_id: templateId,
      score: evaluations[templateId].score,
      notes: evaluations[templateId].notes || ''
    }));

    if (payload.length === 0) {
      setFeedback({ message: 'Selecione ao menos uma nota antes de salvar.', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      await api.post(`/candidates/${candidateId}/evaluate`, { evaluations: payload });
      setFeedback({ message: 'Avaliação salva com sucesso!', type: 'success' });
    } catch (error) {
      setFeedback({ message: 'Erro ao salvar avaliação. Verifique os campos.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!templates.length) {
    return <p className="text-gray-500 text-sm italic">Nenhum scorecard configurado para esta vaga.</p>;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 w-full max-w-2xl">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Scorecard da Entrevista</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {templates.map((template) => (
          <div key={template.id} className="p-4 bg-gray-50/50 rounded-lg border border-gray-100">
            <h4 className="font-semibold text-gray-700">{template.criteria_name}</h4>
            {template.description && <p className="text-xs text-gray-500 mb-3">{template.description}</p>}
            
            <div className="flex items-center gap-3 mb-4 mt-2">
              <span className="text-sm font-medium text-gray-600">Nota:</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => handleUpdate(template.id, 'score', num)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200
                      ${evaluations[template.id]?.score === num 
                        ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1' 
                        : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-500 hover:text-blue-600'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className="w-full p-3 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none bg-white placeholder:text-gray-400 transition-shadow"
              rows="2"
              placeholder="Anotações do recrutador sobre este critério (opcional)..."
              value={evaluations[template.id]?.notes || ''}
              onChange={(e) => handleUpdate(template.id, 'notes', e.target.value)}
            />
          </div>
        ))}
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processando...' : 'Salvar Avaliação'}
          </button>
          
          {feedback.message && (
            <span className={`text-sm font-medium ${feedback.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
              {feedback.message}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
