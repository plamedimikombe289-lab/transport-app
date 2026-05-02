const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getVilles, createVille, toggleVille,
  getLignes, createLigne, updateLigne, toggleLigne, getDistanceVilles,
  getUtilisateurs, updateRoleUtilisateur, toggleUtilisateur,
  getStatistiques, getVehicules, createVehicule
} = require('../controllers/adminController');
const {
  getDemandesAnnulation, approuverAnnulation, rejeterAnnulation
} = require('../controllers/annulationController');

const admin = [authenticate, authorize('administrateur')];
const agentOrAdmin = [authenticate, authorize('agent', 'administrateur')];

router.get('/villes', agentOrAdmin, getVilles);
router.post('/villes', admin, createVille);
router.patch('/villes/:id/toggle', admin, toggleVille);

router.get('/lignes', agentOrAdmin, getLignes);
router.post('/lignes', admin, createLigne);
router.patch('/lignes/:id', admin, updateLigne);
router.patch('/lignes/:id/toggle', admin, toggleLigne);
router.get('/distance', agentOrAdmin, getDistanceVilles);

router.get('/vehicules', agentOrAdmin, getVehicules);
router.post('/vehicules', agentOrAdmin, createVehicule);

router.get('/utilisateurs', admin, getUtilisateurs);
router.patch('/utilisateurs/:id/role', admin, updateRoleUtilisateur);
router.patch('/utilisateurs/:id/toggle', admin, toggleUtilisateur);

router.get('/statistiques', admin, getStatistiques);

router.get('/annulations', admin, getDemandesAnnulation);
router.patch('/annulations/:id/approuver', admin, approuverAnnulation);
router.patch('/annulations/:id/rejeter', admin, rejeterAnnulation);

module.exports = router;
