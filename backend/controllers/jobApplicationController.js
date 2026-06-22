// controllers/jobApplicationController.js
// Controller para aplicações de vagas com análise de compatibilidade

import { supabase } from '../config/supabase.js';
import { analyzeJobCandidateMatch, updateApplicationWithAnalysis } from '../services/matchingService.js';

/**
 * POST /api/jobs/:jobId/apply
 * Candidato se candidata a uma vaga
 * Body: { applicant_name, applicant_email, cv_file_url, cv_file_name }
 */
export const applyToJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { applicant_name, applicant_email, cv_file_url, cv_file_name } = req.body;
    const applicantUserId = req.user?.id;

    // Validação
    if (!jobId || !applicant_name || !applicant_email || !cv_file_url) {
      return res.status(400).json({
        error: 'Campo obrigatório faltando: jobId, applicant_name, applicant_email, cv_file_url',
      });
    }

    // Buscar dados da vaga
    const { data: jobData, error: jobError } = await supabase
      .from('job_positions')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !jobData) {
      return res.status(404).json({ error: 'Vaga não encontrada' });
    }

    // Criar candidatura
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .insert({
        job_position_id: jobId,
        applicant_user_id: applicantUserId,
        applicant_name,
        applicant_email,
        cv_file_url,
        cv_file_name,
        status: 'pending',
        analysis_status: 'pending',
      })
      .select()
      .single();

    if (appError) {
      console.error('Erro ao criar candidatura:', appError);
      return res.status(500).json({ error: 'Erro ao criar candidatura' });
    }

    // Disparar análise de compatibilidade assincronamente
    analyzeApplicationAsync(application.id, jobData, applicant_email);

    return res.status(201).json({
      message: 'Candidatura enviada com sucesso',
      application: application,
    });
  } catch (error) {
    console.error('Erro ao candidatar:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Executa a análise de compatibilidade de forma assíncrona
 * Não bloqueia a resposta da candidatura
 */
async function analyzeApplicationAsync(applicationId, jobData, candidateEmail) {
  try {
    // Aguardar 1 segundo para garantir que os dados estão propagados
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Buscar dados do candidato pelo email
    const { data: candidates, error: candError } = await supabase
      .from('candidates')
      .select('*')
      .ilike('email', candidateEmail)
      .order('created_at', { ascending: false })
      .limit(1);

    if (candError || !candidates || candidates.length === 0) {
      console.warn(`⚠️ Candidato não encontrado para email: ${candidateEmail}`);
      // Marcar como falha, mas não bloquear
      await supabase
        .from('job_applications')
        .update({ analysis_status: 'failed' })
        .eq('id', applicationId);
      return;
    }

    const candidateData = candidates[0];

    // Buscar configuração de critérios da empresa dona da vaga
    let aiWeights = null;
    try {
      const { data: companyData } = await supabase
        .from('companies')
        .select('ai_criteria_weights')
        .eq('owner_id', jobData.user_id)
        .single();

      if (companyData?.ai_criteria_weights) {
        aiWeights = companyData.ai_criteria_weights;
        console.log(`⚙️ Critérios de IA personalizados carregados para a vaga ${jobData.id}`);
      }
    } catch (weightError) {
      console.warn('⚠️ Não foi possível carregar critérios de IA da empresa. Usando padrão.');
    }

    // Executar análise com pesos personalizados
    const analysisResult = await analyzeJobCandidateMatch(jobData, candidateData, applicationId, aiWeights);

    // Atualizar candidatura com resultado
    await updateApplicationWithAnalysis(applicationId, analysisResult);

    console.log(`✅ Análise concluída para candidatura ${applicationId}`);
  } catch (error) {
    console.error(`❌ Erro ao analisar candidatura ${applicationId}:`, error);
    // Marcar como falha, mas não travar o sistema
    await supabase
      .from('job_applications')
      .update({ analysis_status: 'failed' })
      .eq('id', applicationId)
      .catch(() => {});
  }
}

/**
 * GET /api/jobs/:jobId/applications
 * Listar candidaturas para uma vaga com análise
 * Apenas a empresa que criou a vaga pode ver
 */
export const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // Verificar se a vaga pertence ao usuário
    const { data: jobData, error: jobError } = await supabase
      .from('job_positions')
      .select('user_id')
      .eq('id', jobId)
      .single();

    if (jobError || !jobData || jobData.user_id !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Buscar candidaturas com análise
    const { data: applications, error: appError } = await supabase
      .from('job_applications')
      .select(`
        id,
        applicant_name,
        applicant_email,
        status,
        compatibility_score,
        compatibility_summary,
        strengths,
        concerns,
        analysis_status,
        created_at,
        updated_at
      `)
      .eq('job_position_id', jobId)
      .order('compatibility_score', { ascending: false, nullsFirst: false });

    if (appError) {
      console.error('Erro ao buscar candidaturas:', appError);
      return res.status(500).json({ error: 'Erro ao buscar candidaturas' });
    }

    return res.json({
      applications: applications || [],
      total: applications?.length || 0,
    });
  } catch (error) {
    console.error('Erro ao listar candidaturas:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/jobs/applications/:applicationId
 * Obter detalhes completos de uma candidatura com análise
 */
export const getApplicationDetails = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;

    // Buscar candidatura
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select(`
        *,
        job_positions (
          id,
          title,
          description,
          user_id
        )
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return res.status(404).json({ error: 'Candidatura não encontrada' });
    }

    // Verificar permissão (candidato ou empresa)
    const isApplicant = application.applicant_user_id === userId;
    const isCompany = application.job_positions?.user_id === userId;
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    if (!isApplicant && !isCompany && !isAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    return res.json({ application });
  } catch (error) {
    console.error('Erro ao buscar detalhes:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/jobs/applications/:applicationId
 * Atualizar status da candidatura
 * Apenas a empresa pode fazer isso
 */
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Validar status
    const validStatuses = ['pending', 'reviewing', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status inválido. Deve ser um de: ${validStatuses.join(', ')}` });
    }

    // Buscar candidatura e verificar permissão
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select(`
        id,
        job_positions (user_id)
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return res.status(404).json({ error: 'Candidatura não encontrada' });
    }

    if (application.job_positions?.user_id !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Atualizar status
    const { data: updated, error: updateError } = await supabase
      .from('job_applications')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar candidatura:', updateError);
      return res.status(500).json({ error: 'Erro ao atualizar candidatura' });
    }

    return res.json({
      message: 'Status atualizado com sucesso',
      application: updated,
    });
  } catch (error) {
    console.error('Erro ao atualizar candidatura:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/jobs/applications/:applicationId/reanalyze
 * Forçar reanalise de uma candidatura
 * Útil se o candidato atualizou o CV
 */
export const reanalyzeApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;

    // Buscar candidatura e verificar permissão
    const { data: application, error: appError } = await supabase
      .from('job_applications')
      .select(`
        *,
        job_positions (id, user_id, title, description, required_skills, experience_level, salary_range)
      `)
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return res.status(404).json({ error: 'Candidatura não encontrada' });
    }

    if (application.job_positions?.user_id !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Marcar como processing
    await supabase
      .from('job_applications')
      .update({ analysis_status: 'processing' })
      .eq('id', applicationId);

    // Disparar reanalise
    analyzeApplicationAsync(applicationId, application.job_positions, application.applicant_email);

    return res.json({
      message: 'Reanalise iniciada. Resultado será atualizado em breve.',
    });
  } catch (error) {
    console.error('Erro ao forçar reanalise:', error);
    res.status(500).json({ error: error.message });
  }
};
