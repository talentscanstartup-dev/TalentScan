// controllers/candidateController.js
// Controller para busca e filtragem avançada de candidatos

import { supabase } from '../config/supabase.js';
import { parseBooleanQuery } from '../utils/booleanParser.js';

/**
 * GET /api/candidates/search
 * Busca candidatos com suporte a operadores booleanos e filtros adicionais
 */
export const searchCandidates = async (req, res) => {
  try {
    const { q, minExperience, location } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Inicializar query no Supabase
    let query = supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });

    // Se o usuário não for ADMIN/SUPER_ADMIN, limita aos candidatos pertencentes ao seu ID de recrutador
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      query = query.eq('user_id', userId);
    }

    // 1. Filtro por Localização (Busca parcial case-insensitive)
    if (location && location.trim() !== '') {
      query = query.ilike('location', `%${location.trim()}%`);
    }

    // 2. Filtro de Busca Booleana (q)
    if (q && q.trim() !== '') {
      const parsedQuery = parseBooleanQuery(q);
      
      if (parsedQuery) {
        // Realiza o textSearch na coluna 'professional_summary' usando o tsquery formatado
        query = query.textSearch('professional_summary', parsedQuery, {
          config: 'portuguese', // ou 'english' dependendo do idioma padrão do sistema
          type: 'phrase' // ou 'plain'
        });
      }
    }

    // Executar consulta
    const { data: candidates, error } = await query;

    if (error) {
      console.error('Erro na query do Supabase:', error);
      throw error;
    }

    let filteredCandidates = candidates || [];

    // 3. Filtro por Anos de Experiência (Filtro em JSONB via JavaScript para flexibilidade)
    if (minExperience && minExperience.trim() !== '') {
      const minYears = parseInt(minExperience, 10);
      
      if (!isNaN(minYears)) {
        filteredCandidates = filteredCandidates.filter(candidate => {
          let totalExperienceYears = 0;

          if (Array.isArray(candidate.experience)) {
            candidate.experience.forEach(exp => {
              const duration = exp.duration || '';
              
              // Tentar extrair anos de strings como "3 anos", "2 years"
              const matchYears = duration.match(/(\d+)\s*(ano|year|yr|a)/i);
              if (matchYears) {
                totalExperienceYears += parseInt(matchYears[1], 10);
              } else {
                // Tentar extrair intervalo de datas, ex: "2020-2023" ou "2021 - Presente"
                const years = duration.split('-');
                if (years.length === 2) {
                  const start = parseInt(years[0].trim(), 10);
                  // Se o final não for um número válido (ex: 'Presente'), usa o ano atual
                  const end = parseInt(years[1].trim(), 10) || new Date().getFullYear();
                  
                  if (!isNaN(start) && !isNaN(end) && end >= start) {
                    totalExperienceYears += (end - start);
                  }
                }
              }
            });
          }
          
          return totalExperienceYears >= minYears;
        });
      }
    }

    return res.json({
      success: true,
      count: filteredCandidates.length,
      candidates: filteredCandidates
    });

  } catch (error) {
    console.error('Candidate search error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno ao realizar a busca de candidatos.'
    });
  }
};
