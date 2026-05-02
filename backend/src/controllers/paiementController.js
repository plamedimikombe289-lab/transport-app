const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const simulerPaiement = async (req, res) => {
  const { reservation_id, methode } = req.body;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [[resa]] = await conn.query(
      'SELECT * FROM reservations WHERE id = ? AND client_id = ? FOR UPDATE',
      [reservation_id, req.user.id]
    );

    if (!resa) {
      await conn.rollback();
      return res.status(404).json({ message: 'Réservation introuvable.' });
    }
    if (resa.statut !== 'en_attente') {
      await conn.rollback();
      return res.status(400).json({ message: 'Cette réservation ne peut pas être payée.' });
    }

    // Lock trajet and find available seat numbers
    const [[trajet]] = await conn.query('SELECT capacite FROM trajets WHERE id = ? FOR UPDATE', [resa.trajet_id]);
    const [siegesPris] = await conn.query(
      'SELECT numero_siege FROM sieges_assignes WHERE trajet_id = ?',
      [resa.trajet_id]
    );
    const pris = new Set(siegesPris.map(s => s.numero_siege));
    const siegesAssignes = [];
    for (let n = 1; siegesAssignes.length < resa.nombre_sieges && n <= trajet.capacite + resa.nombre_sieges; n++) {
      if (!pris.has(n)) siegesAssignes.push(n);
    }
    for (const num of siegesAssignes) {
      await conn.query(
        'INSERT INTO sieges_assignes (trajet_id, reservation_id, numero_siege) VALUES (?, ?, ?)',
        [resa.trajet_id, reservation_id, num]
      );
    }

    const reference = 'PAY-' + uuidv4().split('-')[0].toUpperCase();

    await conn.query(
      'INSERT INTO paiements (reservation_id, montant, methode, statut, reference_paiement) VALUES (?, ?, ?, "complete", ?)',
      [reservation_id, resa.prix_total, methode || 'carte_credit', reference]
    );

    await conn.query(
      'UPDATE reservations SET statut = "confirmee" WHERE id = ?',
      [reservation_id]
    );

    const code_billet = 'BIL-' + uuidv4().split('-')[0].toUpperCase();
    await conn.query(
      'INSERT INTO billets (reservation_id, code_billet) VALUES (?, ?)',
      [reservation_id, code_billet]
    );

    await conn.query(
      'INSERT INTO historique_reservations (reservation_id, statut_avant, statut_apres, modifie_par) VALUES (?, "en_attente", "confirmee", ?)',
      [reservation_id, req.user.id]
    );

    await conn.commit();

    res.json({
      message: 'Paiement simulé avec succès. Réservation confirmée.',
      reference_paiement: reference,
      code_billet,
      montant: resa.prix_total
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  } finally {
    conn.release();
  }
};

const getBillet = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.code_billet, b.emis_le,
              r.code_reservation, r.nombre_sieges, r.prix_total,
              u.nom, u.prenom,
              t.date_depart, t.date_arrivee,
              vd.nom AS ville_depart, va.nom AS ville_arrivee,
              v.modele AS vehicule,
              (SELECT GROUP_CONCAT(sa.numero_siege ORDER BY sa.numero_siege)
               FROM sieges_assignes sa WHERE sa.reservation_id = r.id) AS numeros_sieges
       FROM billets b
       JOIN reservations r ON b.reservation_id = r.id
       JOIN utilisateurs u ON r.client_id = u.id
       JOIN trajets t ON r.trajet_id = t.id
       JOIN lignes_transport l ON t.ligne_id = l.id
       JOIN villes vd ON l.ville_depart_id = vd.id
       JOIN villes va ON l.ville_arrivee_id = va.id
       JOIN vehicules v ON t.vehicule_id = v.id
       WHERE b.reservation_id = ? AND r.client_id = ?`,
      [req.params.reservation_id, req.user.id]
    );

    if (rows.length === 0) return res.status(404).json({ message: 'Billet introuvable.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { simulerPaiement, getBillet };
