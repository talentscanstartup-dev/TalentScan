// routes/candidates.js
// Rotas relacionadas a Candidatos

import express from 'express';
import { searchCandidates } from '../controllers/candidateController.js';
import { evaluateCandidate, getCandidateScore } from '../controllers/scorecardController.js';
import { matchCandidateToAllJobs } from '../controllers/matchController.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/candidates/search
 * Rota para busca booleana e filtragem avançada de candidatos.
 * Protegida: apenas para perfis COMPANY, ADMIN e SUPER_ADMIN.
 */
router.get('/search', verifyToken, checkRole(['COMPANY', 'ADMIN', 'SUPER_ADMIN']), searchCandidates);

/**
 * POST /api/candidates/:candidateId/evaluate
 * Salva a avaliação (notas 1 a 5 e comentários) de um recrutador para o candidato.
 */
router.post('/:candidateId/evaluate', verifyToken, checkRole(['COMPANY']), evaluateCandidate);

/**
 * GET /api/candidates/:candidateId/score
 * Retorna as notas detalhadas e a média do candidato.
 */
router.get('/:candidateId/score', verifyToken, checkRole(['COMPANY', 'ADMIN', 'SUPER_ADMIN']), getCandidateScore);

/**
 * POST /api/candidates/:candidateId/match-all-jobs
 * Roda o Match do candidato contra o banco de vagas abertas da empresa
 */
router.post('/:candidateId/match-all-jobs', verifyToken, checkRole(['COMPANY', 'ADMIN']), matchCandidateToAllJobs);

export default router;
