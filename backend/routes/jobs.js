import express from 'express';
import { createScorecardTemplate } from '../controllers/scorecardController.js';
import {
  applyToJob,
  getJobApplications,
  getApplicationDetails,
  updateApplicationStatus,
  reanalyzeApplication,
} from '../controllers/jobApplicationController.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /jobs/:jobId/scorecard
 * Rota para a empresa criar os critérios de avaliação (scorecard) de uma vaga.
 * Protegida: apenas para perfis COMPANY.
 */
router.post('/:jobId/scorecard', verifyToken, checkRole(['COMPANY']), createScorecardTemplate);

/**
 * POST /jobs/:jobId/apply
 * Candidato se candidata a uma vaga com CV
 * Body: { applicant_name, applicant_email, cv_file_url, cv_file_name }
 * Protegida: autenticado
 */
router.post('/:jobId/apply', verifyToken, applyToJob);

/**
 * GET /jobs/:jobId/applications
 * Listar candidaturas para uma vaga com análise de compatibilidade
 * Protegida: apenas a empresa que criou a vaga
 */
router.get('/:jobId/applications', verifyToken, getJobApplications);

/**
 * GET /jobs/applications/:applicationId
 * Obter detalhes completos de uma candidatura
 * Protegida: candidato, empresa ou admin
 */
router.get('/applications/:applicationId', verifyToken, getApplicationDetails);

/**
 * PUT /jobs/applications/:applicationId
 * Atualizar status da candidatura
 * Protegida: apenas a empresa que criou a vaga
 * Body: { status: 'pending' | 'reviewing' | 'approved' | 'rejected' }
 */
router.put('/applications/:applicationId', verifyToken, updateApplicationStatus);

/**
 * POST /jobs/applications/:applicationId/reanalyze
 * Forçar reanalise de compatibilidade
 * Protegida: apenas a empresa que criou a vaga
 */
router.post('/applications/:applicationId/reanalyze', verifyToken, reanalyzeApplication);

export default router;
