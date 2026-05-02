const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getTrajets, getTrajetById, createTrajet, updateStatutTrajet,
  getAllTrajetsAgent, updateTrajet, createTrajetSerie
} = require('../controllers/trajetController');

// Public
router.get('/', getTrajets);
router.get('/:id', getTrajetById);

// Agent / Admin
router.get('/admin/all', authenticate, authorize('agent', 'administrateur'), getAllTrajetsAgent);
router.post('/', authenticate, authorize('agent', 'administrateur'), createTrajet);
router.post('/serie', authenticate, authorize('agent', 'administrateur'), createTrajetSerie);
router.patch('/:id', authenticate, authorize('agent', 'administrateur'), updateTrajet);
router.patch('/:id/statut', authenticate, authorize('agent', 'administrateur'), updateStatutTrajet);

module.exports = router;
