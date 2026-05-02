const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { simulerPaiement, getBillet } = require('../controllers/paiementController');

router.post('/simuler', authenticate, authorize('client'), simulerPaiement);
router.get('/billet/:reservation_id', authenticate, getBillet);

module.exports = router;
