import { supabase } from '../config/supabase.js';
import { analyzeJobCandidateMatch } from '../services/matchingService.js';

export const matchCandidateToAllJobs = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const userId = req.user.id;

    // 1. Buscar Candidato
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (candidateError || !candidate) {
      return res.status(404).json({ success: false, error: 'Candidato não encontrado.' });
    }

    // 2. Buscar Vagas Abertas da Empresa (limitado a 5 vagas recentes p/ otimizar processamento local)
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(5);

    if (jobsError) {
      return res.status(500).json({ success: false, error: 'Erro ao buscar vagas.' });
    }

    if (!jobs || jobs.length === 0) {
      return res.json({ success: true, message: 'Nenhuma vaga aberta encontrada para testar match.', matches: [] });
    }

    // 3. Processar Match Bi-Direcional (em série para não engasgar o Ollama)
    const matches = [];
    for (const job of jobs) {
      // Verifica se a empresa tem pesos (scorecards) pra essa vaga
      const { data: scorecard } = await supabase
        .from('job_scorecards')
        .select('ai_weights')
        .eq('job_id', job.id)
        .single();

      const aiWeights = scorecard ? scorecard.ai_weights : null;

      const analysis = await analyzeJobCandidateMatch(job, candidate, 'bidirectional_match_test', aiWeights);
      
      matches.push({
        job_id: job.id,
        job_title: job.title,
        compatibility_score: analysis.compatibility_score,
        compatibility_summary: analysis.compatibility_summary,
        strengths: analysis.strengths,
      });
    }

    // Ordenar do maior para o menor score
    matches.sort((a, b) => b.compatibility_score - a.compatibility_score);

    return res.json({
      success: true,
      matches,
    });
  } catch (error) {
    console.error('Match bi-directional error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Erro interno ao processar matches.' });
  }
};
