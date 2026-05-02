const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { demanderAnnulation, demanderAnnulationClient, previewPenalite } = require('../controllers/annulationController');

// Agent
router.post('/demande', authenticate, authorize('agent', 'administrateur'), demanderAnnulation);

// Client
router.post('/client', authenticate, authorize('client'), demanderAnnulationClient);
router.get('/preview/:reservation_id', authenticate, authorize('client'), previewPenalite);

module.exports = router;
