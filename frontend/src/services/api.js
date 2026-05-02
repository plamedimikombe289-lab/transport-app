import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  logout: () => api.post('/auth/logout'),
};

// Trajets
export const trajetService = {
  getAll: (params) => api.get('/trajets', { params }),
  getById: (id) => api.get(`/trajets/${id}`),
  getAllAgent: () => api.get('/trajets/admin/all'),
  create: (data) => api.post('/trajets', data),
  createSerie: (data) => api.post('/trajets/serie', data),
  update: (id, data) => api.patch(`/trajets/${id}`, data),
  updateStatut: (id, statut) => api.patch(`/trajets/${id}/statut`, { statut }),
};

// Réservations
export const reservationService = {
  create: (data) => api.post('/reservations', data),
  getMesReservations: () => api.get('/reservations/mes-reservations'),
  getById: (id) => api.get(`/reservations/${id}`),
  annuler: (id, raison) => api.patch(`/reservations/${id}/annuler`, { raison }),
  getPassagers: (trajet_id) => api.get(`/reservations/trajet/${trajet_id}/passagers`),
  getAllAgent: () => api.get('/reservations/agent/toutes'),
  getHistorique: (id) => api.get(`/reservations/${id}/historique`),
};

// Paiements
export const paiementService = {
  simuler: (data) => api.post('/paiements/simuler', data),
  getBillet: (reservation_id) => api.get(`/paiements/billet/${reservation_id}`),
};

// Admin
export const adminService = {
  getVilles: () => api.get('/admin/villes'),
  createVille: (data) => api.post('/admin/villes', data),
  toggleVille: (id) => api.patch(`/admin/villes/${id}/toggle`),
  getLignes: () => api.get('/admin/lignes'),
  createLigne: (data) => api.post('/admin/lignes', data),
  getDistance: (v1, v2) => api.get('/admin/distance', { params: { v1, v2 } }),
  getVehicules: () => api.get('/admin/vehicules'),
  createVehicule: (data) => api.post('/admin/vehicules', data),
  getUtilisateurs: () => api.get('/admin/utilisateurs'),
  updateRole: (id, role_id) => api.patch(`/admin/utilisateurs/${id}/role`, { role_id }),
  toggleUser: (id) => api.patch(`/admin/utilisateurs/${id}/toggle`),
  getStats: () => api.get('/admin/statistiques'),
  getAnnulations: (statut) => api.get('/admin/annulations', { params: statut ? { statut } : {} }),
  approuverAnnulation: (id, commentaire) => api.patch(`/admin/annulations/${id}/approuver`, { commentaire }),
  rejeterAnnulation: (id, commentaire) => api.patch(`/admin/annulations/${id}/rejeter`, { commentaire }),
  updateLigne: (id, data) => api.patch(`/admin/lignes/${id}`, data),
  toggleLigne: (id) => api.patch(`/admin/lignes/${id}/toggle`),
};

// Annulations
export const annulationService = {
  demanderAnnulation: (reservation_id, raison) => api.post('/annulations/demande', { reservation_id, raison }),
  demanderAnnulationClient: (reservation_id, raison) => api.post('/annulations/client', { reservation_id, raison }),
  previewPenalite: (reservation_id) => api.get(`/annulations/preview/${reservation_id}`),
};

export default api;
