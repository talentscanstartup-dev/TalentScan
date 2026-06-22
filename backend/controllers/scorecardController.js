import { supabase } from '../config/supabase.js';

/**
 * Cria os critérios de avaliação (Scorecard) para uma vaga
 * POST /api/jobs/:jobId/scorecard
 */
export const createScorecardTemplate = async (req, res) => {
  const { jobId } = req.params;
  const { criteria } = req.body;
  const companyId = req.user.company_id;

  try {
    // 1. Verifica se a vaga pertence à empresa atual
    const { data: job, error: jobError } = await supabase
      .from('job_positions')
      .select('company_id')
      .eq('id', jobId)
      .single();

    if (jobError || job.company_id !== companyId) {
      return res.status(403).json({ error: 'Acesso negado ou vaga não encontrada.' });
    }

    // 2. Prepara os dados para inserção
    const payload = criteria.map(c => ({
      job_id: jobId,
      criteria_name: c.criteria_name,
      description: c.description
    }));

    const { data, error } = await supabase
      .from('scorecard_templates')
      .insert(payload)
      .select();

    if (error) throw error;
    
    return res.status(201).json({ message: 'Scorecard criado com sucesso!', data });
  } catch (err) {
    console.error('Erro em createScorecardTemplate:', err);
    return res.status(500).json({ error: 'Erro ao criar critérios da vaga.' });
  }
};

/**
 * Salva a avaliação (notas) feita por um recrutador
 * POST /api/candidates/:candidateId/evaluate
 */
export const evaluateCandidate = async (req, res) => {
  const { candidateId } = req.params;
  const { evaluations } = req.body; // array de { scorecard_template_id, score, notes }
  const evaluatorId = req.user.id;

  try {
    const payload = evaluations.map(ev => ({
      candidate_id: candidateId,
      scorecard_template_id: ev.scorecard_template_id,
      evaluator_id: evaluatorId,
      score: ev.score,
      notes: ev.notes
    }));

    // 'upsert' atualiza a nota se o recrutador alterar a própria avaliação no futuro
    const { data, error } = await supabase
      .from('candidate_evaluations')
      .upsert(payload, { onConflict: 'candidate_id, scorecard_template_id, evaluator_id' })
      .select();

    if (error) throw error;
    
    return res.status(200).json({ message: 'Avaliação salva com sucesso!', data });
  } catch (err) {
    console.error('Erro em evaluateCandidate:', err);
    return res.status(500).json({ error: 'Erro ao salvar avaliação do candidato.' });
  }
};

/**
 * Retorna as avaliações de um candidato (e a média global)
 * GET /api/candidates/:candidateId/score
 */
export const getCandidateScore = async (req, res) => {
  const { candidateId } = req.params;

  try {
    const { data, error } = await supabase
      .from('candidate_evaluations')
      .select(`
        id, score, notes, created_at, evaluator_id,
        scorecard_templates ( criteria_name )
      `)
      .eq('candidate_id', candidateId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(200).json({ averageScore: 0, details: [] });
    }

    const totalScore = data.reduce((acc, curr) => acc + curr.score, 0);
    const averageScore = (totalScore / data.length).toFixed(1);

    const details = data.map(ev => ({
      evaluationId: ev.id,
      criteria: ev.scorecard_templates.criteria_name,
      score: ev.score,
      notes: ev.notes,
      evaluatorId: ev.evaluator_id,
      date: ev.created_at
    }));

    return res.status(200).json({ averageScore, details });
  } catch (err) {
    console.error('Erro em getCandidateScore:', err);
    return res.status(500).json({ error: 'Erro ao buscar nota do candidato.' });
  }
};
