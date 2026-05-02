const db = require('../config/db');

const normaliserVille = (str) =>
  str.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-_]/g, ' ').trim();

const getTrajets = async (req, res) => {
  try {
    const { depart, arrivee, date } = req.query;

    let query = `
      SELECT t.id, t.date_depart, t.date_arrivee, t.prix, t.places_disponibles, t.statut,
             l.code AS ligne_code,
             vd.nom AS ville_depart, va.nom AS ville_arrivee,
             v.modele AS vehicule, v.capacite,
             l.duree_minutes
      FROM trajets t
      JOIN lignes_transport l ON t.ligne_id = l.id
      JOIN villes vd ON l.ville_depart_id = vd.id
      JOIN villes va ON l.ville_arrivee_id = va.id
      JOIN vehicules v ON t.vehicule_id = v.id
      WHERE t.statut = 'planifie' AND t.places_disponibles > 0
    `;
    const params = [];

    if (depart) {
      query += " AND REPLACE(vd.nom, '-', ' ') COLLATE utf8mb4_general_ci LIKE ?";
      params.push(`%${normaliserVille(depart)}%`);
    }
    if (arrivee) {
      query += " AND REPLACE(va.nom, '-', ' ') COLLATE utf8mb4_general_ci LIKE ?";
      params.push(`%${normaliserVille(arrivee)}%`);
    }
    if (date) {
      query += ' AND DATE(t.date_depart) = ?';
      params.push(date);
    }

    query += ' ORDER BY t.date_depart ASC';

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getTrajetById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, l.code AS ligne_code,
              vd.nom AS ville_depart, va.nom AS ville_arrivee,
              v.modele AS vehicule, v.capacite, l.duree_minutes
       FROM trajets t
       JOIN lignes_transport l ON t.ligne_id = l.id
       JOIN villes vd ON l.ville_depart_id = vd.id
       JOIN villes va ON l.ville_arrivee_id = va.id
       JOIN vehicules v ON t.vehicule_id = v.id
       WHERE t.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Trajet introuvable.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const createTrajet = async (req, res) => {
  const { ligne_id, vehicule_id, date_depart, date_arrivee, prix } = req.body;
  try {
    const [veh] = await db.query('SELECT capacite FROM vehicules WHERE id = ?', [vehicule_id]);
    if (veh.length === 0) return res.status(404).json({ message: 'Véhicule introuvable.' });

    const [result] = await db.query(
      'INSERT INTO trajets (ligne_id, vehicule_id, date_depart, date_arrivee, prix, places_disponibles) VALUES (?, ?, ?, ?, ?, ?)',
      [ligne_id, vehicule_id, date_depart, date_arrivee, prix, veh[0].capacite]
    );
    res.status(201).json({ message: 'Trajet créé.', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const updateStatutTrajet = async (req, res) => {
  const { statut } = req.body;
  const validStatuts = ['planifie', 'en_cours', 'termine', 'annule'];
  if (!validStatuts.includes(statut)) {
    return res.status(400).json({ message: 'Statut invalide.' });
  }
  try {
    await db.query('UPDATE trajets SET statut = ? WHERE id = ?', [statut, req.params.id]);
    res.json({ message: 'Statut mis à jour.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getAllTrajetsAgent = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.id, t.date_depart, t.date_arrivee, t.prix, t.places_disponibles, t.statut,
              vd.nom AS ville_depart, va.nom AS ville_arrivee,
              v.modele AS vehicule, v.capacite,
              COUNT(r.id) AS nb_reservations
       FROM trajets t
       JOIN lignes_transport l ON t.ligne_id = l.id
       JOIN villes vd ON l.ville_depart_id = vd.id
       JOIN villes va ON l.ville_arrivee_id = va.id
       JOIN vehicules v ON t.vehicule_id = v.id
       LEFT JOIN reservations r ON r.trajet_id = t.id AND r.statut = 'confirmee'
       GROUP BY t.id
       ORDER BY t.date_depart DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const updateTrajet = async (req, res) => {
  const { vehicule_id, date_depart, date_arrivee, prix } = req.body;
  try {
    const [[trajet]] = await db.query('SELECT statut FROM trajets WHERE id = ?', [req.params.id]);
    if (!trajet) return res.status(404).json({ message: 'Trajet introuvable.' });
    if (trajet.statut !== 'planifie') {
      return res.status(400).json({ message: 'Seuls les trajets planifiés peuvent être modifiés.' });
    }

    const fields = [];
    const params = [];

    if (vehicule_id) {
      const [[veh]] = await db.query('SELECT capacite FROM vehicules WHERE id = ?', [vehicule_id]);
      if (!veh) return res.status(404).json({ message: 'Véhicule introuvable.' });
      const [[reserved]] = await db.query(
        'SELECT COALESCE(SUM(nombre_sieges), 0) AS total FROM reservations WHERE trajet_id = ? AND statut != "annulee"',
        [req.params.id]
      );
      const dispo = veh.capacite - Number(reserved.total);
      if (dispo < 0) return res.status(400).json({ message: 'Ce véhicule est trop petit pour les réservations existantes.' });
      fields.push('vehicule_id = ?', 'places_disponibles = ?');
      params.push(vehicule_id, dispo);
    }
    if (date_depart) { fields.push('date_depart = ?'); params.push(date_depart); }
    if (date_arrivee) { fields.push('date_arrivee = ?'); params.push(date_arrivee); }
    if (prix !== undefined) { fields.push('prix = ?'); params.push(prix); }

    if (fields.length === 0) return res.status(400).json({ message: 'Aucune modification fournie.' });
    params.push(req.params.id);
    await db.query(`UPDATE trajets SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'Trajet mis à jour.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const createTrajetSerie = async (req, res) => {
  const { ligne_id, vehicule_id, date_depart, date_arrivee, prix, repetitions, intervalle_jours } = req.body;
  const nb = Math.min(Math.max(parseInt(repetitions) || 1, 1), 52);
  const interval = Math.max(parseInt(intervalle_jours) || 7, 1);

  try {
    const [[veh]] = await db.query('SELECT capacite FROM vehicules WHERE id = ?', [vehicule_id]);
    if (!veh) return res.status(404).json({ message: 'Véhicule introuvable.' });

    const ids = [];
    for (let i = 0; i < nb; i++) {
      const dep = new Date(date_depart);
      const arr = new Date(date_arrivee);
      dep.setDate(dep.getDate() + i * interval);
      arr.setDate(arr.getDate() + i * interval);
      const fmt = (d) => d.toISOString().slice(0, 19).replace('T', ' ');
      const [result] = await db.query(
        'INSERT INTO trajets (ligne_id, vehicule_id, date_depart, date_arrivee, prix, places_disponibles) VALUES (?, ?, ?, ?, ?, ?)',
        [ligne_id, vehicule_id, fmt(dep), fmt(arr), prix, veh.capacite]
      );
      ids.push(result.insertId);
    }
    res.status(201).json({ message: `${nb} trajet(s) créé(s).`, ids });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { getTrajets, getTrajetById, createTrajet, updateStatutTrajet, getAllTrajetsAgent, updateTrajet, createTrajetSerie };
