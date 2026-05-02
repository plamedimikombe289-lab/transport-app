const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const generateCode = (prefix = 'RES') => {
  return prefix + '-' + uuidv4().split('-')[0].toUpperCase();
};

const creerReservation = async (req, res) => {
  const { trajet_id, nombre_sieges } = req.body;
  const client_id = req.user.id;

  if (!nombre_sieges || nombre_sieges < 1) {
    return res.status(400).json({ message: 'Le nombre de sièges doit être au moins 1.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[trajet]] = await conn.query(
      'SELECT id, prix, places_disponibles, statut FROM trajets WHERE id = ? FOR UPDATE',
      [trajet_id]
    );

    if (!trajet) {
      await conn.rollback();
      return res.status(404).json({ message: 'Trajet introuvable.' });
    }
    if (trajet.statut !== 'planifie') {
      await conn.rollback();
      return res.status(400).json({ message: 'Ce trajet n\'est plus disponible.' });
    }
    if (trajet.places_disponibles < nombre_sieges) {
      await conn.rollback();
      return res.status(400).json({ message: `Seulement ${trajet.places_disponibles} place(s) disponible(s).` });
    }

    const prix_total = trajet.prix * nombre_sieges;
    const code_reservation = generateCode('RES');

    const [result] = await conn.query(
      'INSERT INTO reservations (client_id, trajet_id, nombre_sieges, prix_total, statut, code_reservation) VALUES (?, ?, ?, ?, "en_attente", ?)',
      [client_id, trajet_id, nombre_sieges, prix_total, code_reservation]
    );

    await conn.query(
      'UPDATE trajets SET places_disponibles = places_disponibles - ? WHERE id = ?',
      [nombre_sieges, trajet_id]
    );

    await conn.query(
      'INSERT INTO historique_reservations (reservation_id, statut_avant, statut_apres, modifie_par) VALUES (?, NULL, "en_attente", ?)',
      [result.insertId, client_id]
    );

    await conn.commit();

    res.status(201).json({
      message: 'Réservation créée. Veuillez procéder au paiement.',
      reservation_id: result.insertId,
      code_reservation,
      prix_total
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  } finally {
    conn.release();
  }
};

const getReservationsClient = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.code_reservation, r.nombre_sieges, r.prix_total, r.statut, r.created_at,
              t.date_depart, t.date_arrivee,
              vd.nom AS ville_depart, va.nom AS ville_arrivee,
              b.code_billet
       FROM reservations r
       JOIN trajets t ON r.trajet_id = t.id
       JOIN lignes_transport l ON t.ligne_id = l.id
       JOIN villes vd ON l.ville_depart_id = vd.id
       JOIN villes va ON l.ville_arrivee_id = va.id
       LEFT JOIN billets b ON b.reservation_id = r.id
       WHERE r.client_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getReservationDetail = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, t.date_depart, t.date_arrivee, t.prix AS prix_unitaire,
              vd.nom AS ville_depart, va.nom AS ville_arrivee,
              v.modele AS vehicule,
              p.montant AS montant_paye, p.methode, p.statut AS statut_paiement,
              b.code_billet, b.emis_le,
              (SELECT GROUP_CONCAT(sa.numero_siege ORDER BY sa.numero_siege)
               FROM sieges_assignes sa WHERE sa.reservation_id = r.id) AS numeros_sieges
       FROM reservations r
       JOIN trajets t ON r.trajet_id = t.id
       JOIN lignes_transport l ON t.ligne_id = l.id
       JOIN villes vd ON l.ville_depart_id = vd.id
       JOIN villes va ON l.ville_arrivee_id = va.id
       JOIN vehicules v ON t.vehicule_id = v.id
       LEFT JOIN paiements p ON p.reservation_id = r.id
       LEFT JOIN billets b ON b.reservation_id = r.id
       WHERE r.id = ? AND r.client_id = ?`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Réservation introuvable.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const annulerReservation = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[resa]] = await conn.query(
      'SELECT * FROM reservations WHERE id = ? AND client_id = ? FOR UPDATE',
      [req.params.id, req.user.id]
    );

    if (!resa) {
      await conn.rollback();
      return res.status(404).json({ message: 'Réservation introuvable.' });
    }
    if (resa.statut === 'annulee') {
      await conn.rollback();
      return res.status(400).json({ message: 'Cette réservation est déjà annulée.' });
    }

    await conn.query(
      'UPDATE reservations SET statut = "annulee" WHERE id = ?',
      [resa.id]
    );
    await conn.query(
      'UPDATE trajets SET places_disponibles = places_disponibles + ? WHERE id = ?',
      [resa.nombre_sieges, resa.trajet_id]
    );
    if (resa.statut === 'confirmee') {
      await conn.query(
        'UPDATE paiements SET statut = "rembourse" WHERE reservation_id = ?',
        [resa.id]
      );
    }
    await conn.query(
      'INSERT INTO historique_reservations (reservation_id, statut_avant, statut_apres, modifie_par, raison) VALUES (?, ?, "annulee", ?, ?)',
      [resa.id, resa.statut, req.user.id, req.body.raison || 'Annulation client']
    );

    await conn.commit();
    res.json({ message: 'Réservation annulée avec succès.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: 'Erreur serveur.' });
  } finally {
    conn.release();
  }
};

const getPassagersTrajet = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.code_reservation, r.nombre_sieges, r.statut,
              u.nom, u.prenom, u.email, u.telephone,
              b.code_billet,
              (SELECT GROUP_CONCAT(sa.numero_siege ORDER BY sa.numero_siege)
               FROM sieges_assignes sa WHERE sa.reservation_id = r.id) AS numeros_sieges
       FROM reservations r
       JOIN utilisateurs u ON r.client_id = u.id
       LEFT JOIN billets b ON b.reservation_id = r.id
       WHERE r.trajet_id = ? AND r.statut = 'confirmee'
       ORDER BY u.nom ASC`,
      [req.params.trajet_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getAllReservationsAgent = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.code_reservation, r.nombre_sieges, r.prix_total, r.statut, r.created_at,
              t.date_depart, t.date_arrivee,
              vd.nom AS ville_depart, va.nom AS ville_arrivee,
              u.nom AS client_nom, u.prenom AS client_prenom, u.email AS client_email,
              b.code_billet,
              (SELECT GROUP_CONCAT(sa.numero_siege ORDER BY sa.numero_siege)
               FROM sieges_assignes sa WHERE sa.reservation_id = r.id) AS numeros_sieges
       FROM reservations r
       JOIN trajets t ON r.trajet_id = t.id
       JOIN lignes_transport l ON t.ligne_id = l.id
       JOIN villes vd ON l.ville_depart_id = vd.id
       JOIN villes va ON l.ville_arrivee_id = va.id
       JOIN utilisateurs u ON r.client_id = u.id
       LEFT JOIN billets b ON b.reservation_id = r.id
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getHistoriqueReservation = async (req, res) => {
  try {
    const [[resa]] = await db.query('SELECT client_id FROM reservations WHERE id = ?', [req.params.id]);
    if (!resa) return res.status(404).json({ message: 'Réservation introuvable.' });
    if (req.user.role === 'client' && resa.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé.' });
    }
    const [rows] = await db.query(
      `SELECT h.statut_avant, h.statut_apres, h.raison, h.created_at,
              u.prenom, u.nom
       FROM historique_reservations h
       LEFT JOIN utilisateurs u ON h.modifie_par = u.id
       WHERE h.reservation_id = ?
       ORDER BY h.created_at ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  creerReservation,
  getReservationsClient,
  getReservationDetail,
  annulerReservation,
  getPassagersTrajet,
  getAllReservationsAgent,
  getHistoriqueReservation
};
