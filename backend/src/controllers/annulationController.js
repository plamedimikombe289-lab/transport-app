const db = require('../config/db');

// Agent: soumet une demande d'annulation
const demanderAnnulation = async (req, res) => {
  const { reservation_id, raison } = req.body;
  const agent_id = req.user.id;

  if (!raison || raison.trim().length < 10) {
    return res.status(400).json({ message: 'La raison doit contenir au moins 10 caractères.' });
  }

  try {
    const [[resa]] = await db.query('SELECT id, statut FROM reservations WHERE id = ?', [reservation_id]);
    if (!resa) return res.status(404).json({ message: 'Réservation introuvable.' });
    if (resa.statut !== 'confirmee') {
      return res.status(400).json({ message: 'Seules les réservations confirmées peuvent faire l\'objet d\'une demande d\'annulation.' });
    }

    const [[existing]] = await db.query(
      'SELECT id FROM demandes_annulation WHERE reservation_id = ? AND statut = "en_attente"',
      [reservation_id]
    );
    if (existing) return res.status(409).json({ message: 'Une demande d\'annulation est déjà en attente pour cette réservation.' });

    await db.query(
      'INSERT INTO demandes_annulation (reservation_id, demande_par, raison, type_demandeur, penalite_pourcent, montant_rembourse) VALUES (?, ?, ?, "agent", 0, NULL)',
      [reservation_id, agent_id, raison.trim()]
    );

    res.status(201).json({ message: 'Demande d\'annulation soumise. En attente de l\'approbation de l\'administrateur.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Client: soumet une demande d'annulation avec calcul de pénalité
const demanderAnnulationClient = async (req, res) => {
  const { reservation_id, raison } = req.body;
  const client_id = req.user.id;

  try {
    const [[resa]] = await db.query(
      `SELECT r.id, r.statut, r.prix_total, r.client_id, t.date_depart
       FROM reservations r
       JOIN trajets t ON r.trajet_id = t.id
       WHERE r.id = ? AND r.client_id = ?`,
      [reservation_id, client_id]
    );

    if (!resa) return res.status(404).json({ message: 'Réservation introuvable.' });
    if (resa.statut !== 'confirmee') {
      return res.status(400).json({ message: 'Seules les réservations confirmées peuvent faire l\'objet d\'une demande d\'annulation.' });
    }

    const [[existing]] = await db.query(
      'SELECT id FROM demandes_annulation WHERE reservation_id = ? AND statut = "en_attente"',
      [reservation_id]
    );
    if (existing) return res.status(409).json({ message: 'Une demande d\'annulation est déjà en attente pour cette réservation.' });

    const heuresAvantDepart = (new Date(resa.date_depart) - new Date()) / (1000 * 60 * 60);
    const penalite_pourcent = heuresAvantDepart < 24 ? 25 : 0;
    const montant_rembourse = parseFloat((resa.prix_total * (1 - penalite_pourcent / 100)).toFixed(2));

    await db.query(
      'INSERT INTO demandes_annulation (reservation_id, demande_par, raison, type_demandeur, penalite_pourcent, montant_rembourse) VALUES (?, ?, ?, "client", ?, ?)',
      [reservation_id, client_id, (raison || 'Annulation client').trim(), penalite_pourcent, montant_rembourse]
    );

    res.status(201).json({
      message: 'Demande d\'annulation soumise. En attente de validation par l\'administrateur.',
      penalite_pourcent,
      montant_rembourse
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Calcul preview de pénalité (avant soumission)
const previewPenalite = async (req, res) => {
  const client_id = req.user.id;
  try {
    const [[resa]] = await db.query(
      `SELECT r.prix_total, t.date_depart FROM reservations r
       JOIN trajets t ON r.trajet_id = t.id
       WHERE r.id = ? AND r.client_id = ? AND r.statut = 'confirmee'`,
      [req.params.reservation_id, client_id]
    );
    if (!resa) return res.status(404).json({ message: 'Réservation introuvable.' });

    const heuresAvantDepart = (new Date(resa.date_depart) - new Date()) / (1000 * 60 * 60);
    const penalite_pourcent = heuresAvantDepart < 24 ? 25 : 0;
    const montant_rembourse = parseFloat((resa.prix_total * (1 - penalite_pourcent / 100)).toFixed(2));
    const penalite_montant = parseFloat((resa.prix_total - montant_rembourse).toFixed(2));

    res.json({
      prix_total: resa.prix_total,
      penalite_pourcent,
      penalite_montant,
      montant_rembourse,
      heures_avant_depart: Math.round(heuresAvantDepart),
      date_depart: resa.date_depart
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Admin: liste des demandes
const getDemandesAnnulation = async (req, res) => {
  try {
    const { statut } = req.query;
    let where = '';
    const params = [];
    if (statut) { where = 'WHERE da.statut = ?'; params.push(statut); }

    const [rows] = await db.query(`
      SELECT da.id, da.raison, da.statut, da.type_demandeur, da.penalite_pourcent,
             da.montant_rembourse, da.commentaire_admin, da.created_at,
             r.id AS reservation_id, r.code_reservation, r.prix_total, r.nombre_sieges,
             u_client.nom AS client_nom, u_client.prenom AS client_prenom, u_client.email AS client_email,
             u_demandeur.nom AS demandeur_nom, u_demandeur.prenom AS demandeur_prenom,
             vd.nom AS ville_depart, va.nom AS ville_arrivee, t.date_depart
      FROM demandes_annulation da
      JOIN reservations r ON da.reservation_id = r.id
      JOIN utilisateurs u_client ON r.client_id = u_client.id
      JOIN utilisateurs u_demandeur ON da.demande_par = u_demandeur.id
      JOIN trajets t ON r.trajet_id = t.id
      JOIN lignes_transport l ON t.ligne_id = l.id
      JOIN villes vd ON l.ville_depart_id = vd.id
      JOIN villes va ON l.ville_arrivee_id = va.id
      ${where}
      ORDER BY da.created_at DESC
    `, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Admin: approuve une demande
const approuverAnnulation = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[demande]] = await conn.query('SELECT * FROM demandes_annulation WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!demande) { await conn.rollback(); return res.status(404).json({ message: 'Demande introuvable.' }); }
    if (demande.statut !== 'en_attente') { await conn.rollback(); return res.status(400).json({ message: 'Cette demande a déjà été traitée.' }); }

    const [[resa]] = await conn.query('SELECT * FROM reservations WHERE id = ? FOR UPDATE', [demande.reservation_id]);

    await conn.query('UPDATE reservations SET statut = "annulee" WHERE id = ?', [resa.id]);
    await conn.query('UPDATE trajets SET places_disponibles = places_disponibles + ? WHERE id = ?', [resa.nombre_sieges, resa.trajet_id]);
    await conn.query('DELETE FROM sieges_assignes WHERE reservation_id = ?', [resa.id]);
    await conn.query('UPDATE paiements SET statut = "rembourse" WHERE reservation_id = ?', [resa.id]);
    await conn.query(
      'UPDATE demandes_annulation SET statut = "approuvee", traite_par = ?, commentaire_admin = ? WHERE id = ?',
      [req.user.id, req.body.commentaire || null, demande.id]
    );

    const raisonLog = demande.type_demandeur === 'client'
      ? `Annulation client approuvée. Remboursement: ${demande.montant_rembourse}$ (pénalité: ${demande.penalite_pourcent}%)`
      : `Annulation agent approuvée. Raison: ${demande.raison}`;

    await conn.query(
      'INSERT INTO historique_reservations (reservation_id, statut_avant, statut_apres, modifie_par, raison) VALUES (?, "confirmee", "annulee", ?, ?)',
      [resa.id, req.user.id, raisonLog]
    );

    await conn.commit();
    const msg = demande.montant_rembourse !== null
      ? `Annulation approuvée. Remboursement de ${demande.montant_rembourse} $ au client.`
      : 'Annulation approuvée. Le client sera remboursé.';
    res.json({ message: msg });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  } finally {
    conn.release();
  }
};

// Admin: rejette une demande
const rejeterAnnulation = async (req, res) => {
  try {
    const [[demande]] = await db.query('SELECT * FROM demandes_annulation WHERE id = ?', [req.params.id]);
    if (!demande) return res.status(404).json({ message: 'Demande introuvable.' });
    if (demande.statut !== 'en_attente') return res.status(400).json({ message: 'Cette demande a déjà été traitée.' });

    await db.query(
      'UPDATE demandes_annulation SET statut = "rejetee", traite_par = ?, commentaire_admin = ? WHERE id = ?',
      [req.user.id, req.body.commentaire || null, demande.id]
    );
    res.json({ message: 'Demande d\'annulation rejetée.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  demanderAnnulation,
  demanderAnnulationClient,
  previewPenalite,
  getDemandesAnnulation,
  approuverAnnulation,
  rejeterAnnulation
};
