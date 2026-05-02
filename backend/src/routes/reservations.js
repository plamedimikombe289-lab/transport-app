const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  creerReservation, getReservationsClient, getReservationDetail,
  annulerReservation, getPassagersTrajet, getAllReservationsAgent,
  getHistoriqueReservation
} = require('../controllers/reservationController');

router.post('/', authenticate, authorize('client'), creerReservation);
router.get('/mes-reservations', authenticate, authorize('client'), getReservationsClient);
router.get('/agent/toutes', authenticate, authorize('agent', 'administrateur'), getAllReservationsAgent);
router.get('/:id', authenticate, getReservationDetail);
router.get('/:id/historique', authenticate, getHistoriqueReservation);
router.patch('/:id/annuler', authenticate, authorize('client'), annulerReservation);

// Agent
router.get('/trajet/:trajet_id/passagers', authenticate, authorize('agent', 'administrateur'), getPassagersTrajet);

module.exports = router;
