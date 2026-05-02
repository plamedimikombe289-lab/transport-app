const db = require('../config/db');

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ---- Villes ----
const getVilles = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM villes ORDER BY nom');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const createVille = async (req, res) => {
  const { nom, province, pays, latitude, longitude } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO villes (nom, province, pays, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
      [nom, province, pays || 'Canada', latitude || null, longitude || null]
    );
    res.status(201).json({ message: 'Ville créée.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const toggleVille = async (req, res) => {
  await db.query('UPDATE villes SET actif = NOT actif WHERE id = ?', [req.params.id]);
  res.json({ message: 'Statut de la ville mis à jour.' });
};

// ---- Lignes ----
const getLignes = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT l.*, vd.nom AS ville_depart, va.nom AS ville_arrivee
       FROM lignes_transport l
       JOIN villes vd ON l.ville_depart_id = vd.id
       JOIN villes va ON l.ville_arrivee_id = va.id
       ORDER BY l.code`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const createLigne = async (req, res) => {
  const { code, ville_depart_id, ville_arrivee_id, duree_minutes, prix_base } = req.body;

  if (ville_depart_id === ville_arrivee_id) {
    return res.status(400).json({ message: 'La ville de départ et d\'arrivée doivent être différentes.' });
  }

  try {
    const [villes] = await db.query(
      'SELECT id, nom, latitude, longitude FROM villes WHERE id IN (?, ?)',
      [ville_depart_id, ville_arrivee_id]
    );

    if (villes.length === 2) {
      const v1 = villes.find(v => v.id == ville_depart_id);
      const v2 = villes.find(v => v.id == ville_arrivee_id);
      if (v1.latitude && v2.latitude) {
        const distance = haversine(v1.latitude, v1.longitude, v2.latitude, v2.longitude);
        if (distance < 50) {
          return res.status(400).json({
            message: `Distance trop courte entre ${v1.nom} et ${v2.nom} : ${Math.round(distance)} km. Minimum requis : 50 km.`
          });
        }
      }
    }

    const [result] = await db.query(
      'INSERT INTO lignes_transport (code, ville_depart_id, ville_arrivee_id, duree_minutes, prix_base) VALUES (?, ?, ?, ?, ?)',
      [code, ville_depart_id, ville_arrivee_id, duree_minutes, prix_base]
    );

    let retourId = null;
    if (req.body.creer_retour) {
      const codeRetour = code + '-R';
      const [retour] = await db.query(
        'INSERT INTO lignes_transport (code, ville_depart_id, ville_arrivee_id, duree_minutes, prix_base) VALUES (?, ?, ?, ?, ?)',
        [codeRetour, ville_arrivee_id, ville_depart_id, duree_minutes, prix_base]
      );
      retourId = retour.insertId;
    }

    res.status(201).json({ message: retourId ? 'Ligne aller et retour créées.' : 'Ligne créée.', id: result.insertId, retour_id: retourId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getDistanceVilles = async (req, res) => {
  const { v1, v2 } = req.query;
  if (!v1 || !v2) return res.status(400).json({ message: 'Paramètres manquants.' });
  try {
    const [villes] = await db.query('SELECT id, nom, latitude, longitude FROM villes WHERE id IN (?, ?)', [v1, v2]);
    if (villes.length < 2) return res.status(404).json({ message: 'Villes introuvables.' });
    const a = villes.find(v => v.id == v1);
    const b = villes.find(v => v.id == v2);
    if (!a.latitude || !b.latitude) return res.json({ distance: null });
    const distance = Math.round(haversine(a.latitude, a.longitude, b.latitude, b.longitude));
    res.json({ distance, valide: distance >= 50 });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ---- Utilisateurs ----
const getUtilisateurs = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.nom, u.prenom, u.email, u.telephone, r.nom AS role, u.actif, u.created_at
       FROM utilisateurs u JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const updateRoleUtilisateur = async (req, res) => {
  const { role_id } = req.body;
  await db.query('UPDATE utilisateurs SET role_id = ? WHERE id = ?', [role_id, req.params.id]);
  res.json({ message: 'Rôle mis à jour.' });
};

const toggleUtilisateur = async (req, res) => {
  await db.query('UPDATE utilisateurs SET actif = NOT actif WHERE id = ?', [req.params.id]);
  res.json({ message: 'Statut de l\'utilisateur mis à jour.' });
};

// ---- Statistiques ----
const getStatistiques = async (req, res) => {
  try {
    const [[stats]] = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM reservations WHERE statut = 'confirmee') AS total_reservations,
        (SELECT COUNT(*) FROM utilisateurs WHERE role_id = 1) AS total_clients,
        (SELECT COUNT(*) FROM trajets WHERE statut = 'planifie') AS trajets_planifies,
        (SELECT COALESCE(SUM(montant), 0) FROM paiements WHERE statut = 'complete') AS revenus_total,
        (SELECT COUNT(*) FROM demandes_annulation WHERE statut = 'en_attente') AS annulations_en_attente
    `);

    const [trajetsPopulaires] = await db.query(`
      SELECT vd.nom AS depart, va.nom AS arrivee,
             COUNT(r.id) AS nb_reservations,
             AVG((v.capacite - t.places_disponibles) / v.capacite * 100) AS taux_occupation
      FROM trajets t
      JOIN lignes_transport l ON t.ligne_id = l.id
      JOIN villes vd ON l.ville_depart_id = vd.id
      JOIN villes va ON l.ville_arrivee_id = va.id
      JOIN vehicules v ON t.vehicule_id = v.id
      LEFT JOIN reservations r ON r.trajet_id = t.id AND r.statut = 'confirmee'
      GROUP BY l.id
      ORDER BY nb_reservations DESC
      LIMIT 5
    `);

    res.json({ ...stats, trajets_populaires: trajetsPopulaires });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const updateLigne = async (req, res) => {
  const { duree_minutes, prix_base } = req.body;
  try {
    await db.query(
      'UPDATE lignes_transport SET duree_minutes = ?, prix_base = ? WHERE id = ?',
      [duree_minutes, prix_base, req.params.id]
    );
    res.json({ message: 'Ligne mise à jour.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const toggleLigne = async (req, res) => {
  await db.query('UPDATE lignes_transport SET actif = NOT actif WHERE id = ?', [req.params.id]);
  res.json({ message: 'Statut de la ligne mis à jour.' });
};

// ---- Véhicules ----
const getVehicules = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vehicules ORDER BY numero_plaque');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const createVehicule = async (req, res) => {
  const { numero_plaque, modele, capacite } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO vehicules (numero_plaque, modele, capacite) VALUES (?, ?, ?)',
      [numero_plaque, modele, capacite]
    );
    res.status(201).json({ message: 'Véhicule créé.', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  getVilles, createVille, toggleVille,
  getLignes, createLigne, updateLigne, toggleLigne, getDistanceVilles,
  getUtilisateurs, updateRoleUtilisateur, toggleUtilisateur,
  getStatistiques,
  getVehicules, createVehicule
};
