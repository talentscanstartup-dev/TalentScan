// services/matchingService.js
// Serviço para análise de compatibilidade entre vaga e currículo

import { supabase } from '../config/supabase.js';
import { generateAnalysisWithOllama } from './ollamaService.js';

/**
 * Constrói as instruções de peso para o prompt da IA com base nos critérios da empresa
 * @param {Object|null} weights - Pesos configurados pela empresa
 * @returns {string} - Bloco de texto a ser inserido no prompt
 */
function buildWeightInstructions(weights) {
  if (!weights) return '';

  const criteriaLabels = {
    technical_skills: 'Habilidades Técnicas (hard skills)',
    experience_years: 'Tempo de Experiência Profissional',
    education: 'Formação Acadêmica / Educação',
    specific_tools: 'Ferramentas e Tecnologias Específicas',
    soft_skills: 'Soft Skills / Competências Comportamentais',
    languages: 'Idiomas',
  };

  const enabled = weights.enabled_criteria || Object.keys(criteriaLabels);
  const strictnessMap = {
    flexible: 'FLEXÍVEL — seja tolerante com gaps, valorize potencial e curva de aprendizado. Candidatos próximos do perfil devem receber scores mais altos.',
    balanced: 'BALANCEADO — avalie objetivamente pontos fortes e fracos sem viés excessivo em nenhuma direção.',
    strict: 'RIGOROSO — seja preciso e criterioso. Penalize fortemente candidatos com gaps em critérios habilitados. Somente candidatos que atendam bem aos requisitos devem ter score alto.',
  };

  const strictnessLabel = strictnessMap[weights.strictness_level] || strictnessMap.balanced;

  const priorityMap = {
    high: '[ALTA PRIORIDADE]',
    medium: '[PRIORIDADE MÉDIA]',
    low: '[BAIXA PRIORIDADE]'
  };

  const weightsBlock = Object.entries(criteriaLabels)
    .filter(([key]) => enabled.includes(key))
    .map(([key, label]) => {
      const w = weights[key] || 0;
      const priority = w >= 30 ? priorityMap.high : w >= 15 ? priorityMap.medium : priorityMap.low;
      return `  - ${label}: ${w}% de peso ${priority}`;
    })
    .join('\n');

  const disabledBlock = Object.entries(criteriaLabels)
    .filter(([key]) => !enabled.includes(key))
    .map(([, label]) => `  - ${label}: [IGNORAR NA AVALIAÇÃO]`)
    .join('\n');

  return `
--- CONFIGURAÇÃO DE CRITÉRIOS DA EMPRESA (PRIORIDADE MÁXIMA) ---

Esta empresa configurou pesos específicos para a avaliação. VOCÊ DEVE seguir estes pesos
ao calcular o compatibility_score e ao redigir a análise:

CRITÉRIOS HABILITADOS E SEUS PESOS:
${weightsBlock}
${disabledBlock ? `\nCRITÉRIOS DESABILITADOS (NÃO considerar no score):\n${disabledBlock}` : ''}

NÍVEL DE RIGOROSIDADE: ${strictnessLabel}

IMPORTANTE: O compatibility_score DEVE refletir estes pesos de forma matemática e consistente.
Se um critério tem peso alto, sua ausência DEVE impactar severamente a pontuação.

--- FIM DA CONFIGURAÇÃO DE CRITÉRIOS ---
`;
}

/**
 * Analisa a compatibilidade entre uma vaga e um candidato
 * Usa OpenAI para gerar análise inteligente
 * 
 * @param {Object} jobData - Dados da vaga { id, title, description, required_skills, experience_level, salary_range }
 * @param {Object} candidateData - Dados do candidato { id, full_name, email, skills, experience, professional_summary, education }
 * @param {string} applicationId - ID da candidatura
 * @param {Object|null} aiWeights - Pesos configurados pela empresa (opcional)
 * @returns {Object} { compatibility_score, summary, strengths, concerns, detailed_analysis, skills_match, etc }
 */
export const analyzeJobCandidateMatch = async (jobData, candidateData, applicationId, aiWeights = null) => {
  try {
    console.log(`📊 Iniciando análise detalhada para: ${candidateData.full_name} -> ${jobData.title}`);

    // Preparar dados para o prompt
    const jobDescription = jobData.description || '';
    const requiredSkills = Array.isArray(jobData.required_skills) 
      ? jobData.required_skills.join(', ') 
      : jobData.required_skills || '';
    const candidateSkills = Array.isArray(candidateData.skills) 
      ? candidateData.skills.join(', ') 
      : candidateData.skills || '';
    const candidateSummary = candidateData.professional_summary || '';
    const candidateExperience = Array.isArray(candidateData.experience)
      ? candidateData.experience
          .map(exp => `${exp.position} em ${exp.company} (${exp.duration})`)
          .join('; ')
      : candidateData.experience || '';
    const candidateEducation = Array.isArray(candidateData.education)
      ? candidateData.education
          .map(edu => `${edu.degree} em ${edu.field}${edu.institution ? ` - ${edu.institution}` : ''}`)
          .join('; ')
      : candidateData.education || '';

    // Construir instruções de peso personalizadas da empresa
    const weightInstructions = buildWeightInstructions(aiWeights);

    // Montar prompt detalhado para a IA
    const analysisPrompt = `
Você é um AI Recruiter Sênior e Especialista em Análise de Perfis Profissionais.
Sua função é fornecer uma análise RIGOROSA, PROFUNDA e IMPARCIAL da compatibilidade entre a vaga detalhada abaixo e o currículo do candidato.

═══════════════════════════════════════════════════════════════════════════════════
DADOS DA VAGA:
- Título: ${jobData.title}
- Nível de Experiência: ${jobData.experience_level || 'Não especificado'}
- Faixa Salarial: ${jobData.salary_range || 'Não especificada'}
- Skills Requeridas: ${requiredSkills}

Descrição Completa da Vaga:
${jobDescription}
═══════════════════════════════════════════════════════════════════════════════════
DADOS DO CANDIDATO:
- Nome: ${candidateData.full_name}
- Resumo Profissional: ${candidateSummary}
- Skills Declaradas: ${candidateSkills}

Experiência Profissional Detalhada:
${candidateExperience || 'Nenhuma informação disponível'}

Formação Acadêmica:
${candidateEducation || 'Nenhuma informação disponível'}
═══════════════════════════════════════════════════════════════════════════════════
${weightInstructions}

DIRETRIZES DE AVALIAÇÃO E ANTI-CHEAT:
1. FOCO NO CONCRETO: Avalie evidências reais de impacto e experiência, não apenas palavras-chave soltas.
2. DETECÇÃO DE EXAGERO E KEYWORD STUFFING (Anti-Cheat): Ignore blocos massivos e desconexos de palavras-chave. Se o candidato listar dezenas de ferramentas apenas para ludibriar o sistema de Match, penalize a nota (compatibility_score = 0) e marque no campo 'red_flags'.
3. VALIDAÇÃO DE CURRÍCULO: Se o texto avaliado não for um currículo ou perfil profissional (ex: receita, código, bula), retorne "is_valid_resume": false.
4. POTENCIAL VS REALIDADE: Distinga claramente entre habilidades que o candidato domina e tecnologias que ele apenas mencionou tangencialmente.
5. RIGOR MATEMÁTICO: O 'compatibility_score' (0-100) deve refletir uma penalização severa se os critérios marcados como "ALTA PRIORIDADE" não forem atendidos de forma clara e comprovável.

FORMATO DE SAÍDA (JSON ESTRITO - SEM MARKDOWN):
{
  "is_valid_resume": true,
  "compatibility_score": <número inteiro 0-100 representando o grau de aderência real e pragmático à vaga>,
  "summary": "<Resumo executivo de 2-3 linhas focado no impacto. Ex: '82% de fit. Forte base em arquitetura de microsserviços e liderança de times, mas carece da experiência exigida em infraestrutura AWS.'>",
  "strengths": "<String única com 3 a 5 pontos fortes principais, separados por '; '>",
  "concerns": "<String única com 2 a 4 pontos de atenção críticos (gaps técnicos, job hopping, etc.), separados por '; '>",
  "recommendation": "<Recomendação diretiva. Ex: 'Recomendado para entrevista técnica focada em [skill]'>",
  "detailed_analysis": {
    "overall_fit": "<Parágrafo analítico sobre o encaixe global do candidato na vaga>",
    "career_progression": "<Análise sobre a progressão de carreira (estagnação, crescimento, transições)>"
  },
  "skills_match": {
    "required_skills": ["skill1", "skill2"],
    "matched_skills": ["skill_do_candidato_1"],
    "match_percentage": <inteiro 0-100 refletindo a sobreposição de skills críticas>,
    "matched_details": ["Lista de observações sobre como o candidato domina as skills correspondentes"],
    "missing_skills": ["Lista de skills essenciais ausentes"],
    "missing_notes": ["Análise do impacto da ausência destas skills no dia a dia da vaga"]
  },
  "experience_match": {
    "required_years": "<Exigência da vaga>",
    "candidate_years": "<Estimativa real da experiência do candidato com base nos dados>",
    "alignment": "<Análise crítica: a senioridade real bate com a exigida?>",
    "relevant_experience": ["Projetos ou experiências passadas altamente conectadas com a vaga"],
    "gap_analysis": "<Análise sobre eventuais buracos no currículo ou transições de carreira abruptas>"
  },
  "education_match": {
    "requirement": "<Formação exigida>",
    "candidate_education": "<Formação apresentada>",
    "match": "<Aderência formativa>"
  },
  "cultural_fit": "<Análise comportamental extraída do tom do currículo e experiências (trabalho em equipe, autonomia, liderança)>",
  "red_flags": "<Bandeiras vermelhas (inflação de título, manipulação de texto, keyword stuffing). Use 'Nenhuma' se aplicável.>",
  "interview_questions": ["Pergunta estratégica e incisiva focada em validar o que o candidato alegou 1", "Pergunta sobre fraqueza detectada 2", "Pergunta sobre cultura 3"],
  "hiring_score_rationale": "<Justificativa analítica profunda do número exato escolhido para o compatibility_score>"
}

IMPORTANTE: 
Retorne APENAS o JSON válido. Não inclua texto adicional.
${aiWeights ? '- RESPEITE RIGOROSAMENTE OS PESOS DA EMPRESA ACIMA.' : ''}
`;

    // Chamada à nova integração de IA Local via Ollama
    let analysis;
    try {
      analysis = await generateAnalysisWithOllama(analysisPrompt);
    } catch (ollamaError) {
      console.warn('⚠️ Falha ao contactar Ollama (local). Recorrendo à análise de fallback heurística.', ollamaError.message);
      return generateLocalAnalysis(jobData, candidateData);
    }
    
    // Validar e processar resultado
    if (analysis) {
      if (analysis.is_valid_resume === false) {
        throw new Error('Análise rejeitada: O texto fornecido não é um currículo válido.');
      }

      return {
        compatibility_score: analysis.compatibility_score || 0,
        compatibility_summary: analysis.summary || '',
        strengths: analysis.strengths || '',
        concerns: analysis.concerns || '',
        recommendation: analysis.recommendation || '',
        detailed_analysis: analysis.detailed_analysis || {},
        skills_match: analysis.skills_match || {},
        experience_analysis: analysis.experience_match?.gap_analysis || '',
        education_analysis: analysis.education_match?.match || '',
        interview_questions: analysis.interview_questions || [],
        ai_analysis: analysis, // Store full analysis
        analysis_status: 'completed',
        analysis_timestamp: new Date().toISOString(),
      };
    }

    return generateLocalAnalysis(jobData, candidateData);
  } catch (error) {
    console.error('❌ Erro na análise de compatibilidade:', error);
    return generateLocalAnalysis(jobData, candidateData);
  }
};

/**
 * Análise local sem IA (fallback)
 * Calcula score baseado em skill matching simples
 */
export const generateLocalAnalysis = (jobData, candidateData) => {
  try {
    const requiredSkills = Array.isArray(jobData.required_skills) 
      ? jobData.required_skills.map(s => s.toLowerCase()) 
      : [];
    const candidateSkills = Array.isArray(candidateData.skills) 
      ? candidateData.skills.map(s => s.toLowerCase()) 
      : [];

    // Calcular match de skills
    const matchedSkills = requiredSkills.filter(skill => 
      candidateSkills.some(cs => cs.includes(skill) || skill.includes(cs))
    );
    const skillMatchPercentage = requiredSkills.length > 0 
      ? Math.round((matchedSkills.length / requiredSkills.length) * 100) 
      : 50;

    // Calcular score baseado em fatores
    let baseScore = skillMatchPercentage;
    
    // Ajustar por experiência
    const experienceLevel = jobData.experience_level?.toLowerCase() || '';
    if (candidateData.experience && candidateData.experience.length > 0) {
      if (experienceLevel.includes('junior') && candidateData.experience.length < 2) {
        baseScore += 15;
      } else if (experienceLevel.includes('pleno') && candidateData.experience.length >= 2 && candidateData.experience.length < 5) {
        baseScore += 15;
      } else if (experienceLevel.includes('senior') && candidateData.experience.length >= 5) {
        baseScore += 15;
      }
    }

    const finalScore = Math.min(Math.round(baseScore), 100);

    const strengths = [
      ...matchedSkills.slice(0, 2).map(s => `Domínio em ${s}`),
      candidateData.experience?.length ? `${candidateData.experience.length} experiências profissionais` : null,
    ].filter(Boolean).join(', ');

    const missingSkills = requiredSkills.filter(skill => !matchedSkills.includes(skill));
    const concerns = [
      ...missingSkills.slice(0, 2).map(s => `Não possui ${s}`),
      matchedSkills.length === 0 ? 'Skill matching baixo' : null,
    ].filter(Boolean).join(', ');

    const summary = `${finalScore}% de compatibilidade. Pontos fortes: ${strengths || 'Perfil alinhado'}. Ponto de atenção: ${concerns || 'Nenhum destaque negativo'}.`;

    return {
      compatibility_score: finalScore,
      compatibility_summary: summary,
      strengths: strengths || 'Candidato com boa base',
      concerns: concerns || 'Sem pontos críticos identificados',
      ai_analysis: {
        method: 'local',
        skill_match_percentage: skillMatchPercentage,
        matched_skills: matchedSkills,
        missing_skills: missingSkills,
      },
      analysis_status: 'completed',
    };
  } catch (error) {
    console.error('❌ Erro na análise local:', error);
    return {
      compatibility_score: 0,
      compatibility_summary: 'Erro ao analisar compatibilidade',
      strengths: '',
      concerns: '',
      ai_analysis: {},
      analysis_status: 'failed',
    };
  }
};

/**
 * Atualizar candidatura com análise de compatibilidade
 */
export const updateApplicationWithAnalysis = async (applicationId, analysisData) => {
  try {
    const { error } = await supabase
      .from('job_applications')
      .update({
        compatibility_score: analysisData.compatibility_score,
        compatibility_summary: analysisData.compatibility_summary,
        strengths: analysisData.strengths,
        concerns: analysisData.concerns,
        recommendation: analysisData.recommendation,
        ai_analysis: analysisData.ai_analysis,
        detailed_analysis: analysisData.detailed_analysis,
        skills_match: analysisData.skills_match,
        experience_analysis: analysisData.experience_analysis,
        education_analysis: analysisData.education_analysis,
        analysis_status: analysisData.analysis_status,
        analysis_timestamp: analysisData.analysis_timestamp || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (error) {
      console.error('❌ Erro ao atualizar candidatura:', error);
      throw error;
    }

    // Também salvar no histórico
    await supabase
      .from('match_analyses_history')
      .insert({
        application_id: applicationId,
        compatibility_score: analysisData.compatibility_score,
        compatibility_summary: analysisData.compatibility_summary,
        strengths: analysisData.strengths,
        concerns: analysisData.concerns,
        full_analysis: analysisData.ai_analysis,
      });

    console.log(`✅ Análise concluída para candidatura ${applicationId}`);
  } catch (error) {
    console.error('❌ Erro ao salvar análise:', error);
    throw error;
  }
};
