import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function CandidateScoreBadge({ candidateId }) {
  const [scoreData, setScoreData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const { data } = await api.get(`/candidates/${candidateId}/score`);
        setScoreData(data);
      } catch (error) {
        console.error("Erro ao buscar score médio", error);
      } finally {
        setLoading(false);
      }
    };
    if (candidateId) fetchScore();
  }, [candidateId]);

  if (loading) return <div className="animate-pulse w-28 h-7 bg-gray-200 rounded-full"></div>;
  if (!scoreData || scoreData.averageScore == 0) return null;

  const score = parseFloat(scoreData.averageScore);
  
  // Lógica de cores baseada na nota
  const getBadgeStyle = (s) => {
    if (s >= 4.0) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s >= 3.0) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-semibold shadow-sm ${getBadgeStyle(score)}`}>
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span>Score: {score} / 5</span>
    </div>
  );
}
