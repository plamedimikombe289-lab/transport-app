const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/db');
const tokenBlacklist = require('../config/tokenBlacklist');

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { nom, prenom, email, mot_de_passe, telephone } = req.body;

  try {
    const [existing] = await db.query('SELECT id FROM utilisateurs WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);
    const [result] = await db.query(
      'INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, role_id) VALUES (?, ?, ?, ?, ?, 1)',
      [nom, prenom, email, hash, telephone || null]
    );

    const token = jwt.sign(
      { id: result.insertId, email, role: 'client' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'Inscription réussie.',
      token,
      user: { id: result.insertId, nom, prenom, email, role: 'client' }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, mot_de_passe } = req.body;

  try {
    const [rows] = await db.query(
      `SELECT u.*, r.nom AS role FROM utilisateurs u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ? AND u.actif = TRUE`,
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        telephone: user.telephone,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.nom, u.prenom, u.email, u.telephone, r.nom AS role, u.created_at
       FROM utilisateurs u JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Utilisateur introuvable.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const updateProfile = async (req, res) => {
  const { nom, prenom, telephone } = req.body;
  try {
    await db.query(
      'UPDATE utilisateurs SET nom=?, prenom=?, telephone=? WHERE id=?',
      [nom, prenom, telephone, req.user.id]
    );
    res.json({ message: 'Profil mis à jour.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const changePassword = async (req, res) => {
  const { ancien_mdp, nouveau_mdp } = req.body;
  if (!nouveau_mdp || nouveau_mdp.length < 6) {
    return res.status(400).json({ message: 'Le nouveau mot de passe doit faire au moins 6 caractères.' });
  }
  try {
    const [[user]] = await db.query('SELECT mot_de_passe FROM utilisateurs WHERE id = ?', [req.user.id]);
    const valid = await bcrypt.compare(ancien_mdp, user.mot_de_passe);
    if (!valid) return res.status(401).json({ message: 'Ancien mot de passe incorrect.' });
    const hash = await bcrypt.hash(nouveau_mdp, 10);
    await db.query('UPDATE utilisateurs SET mot_de_passe = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const logout = (req, res) => {
  if (req.token) tokenBlacklist.add(req.token);
  res.json({ message: 'Déconnexion réussie.' });
};

module.exports = { register, login, getProfile, updateProfile, changePassword, logout };
