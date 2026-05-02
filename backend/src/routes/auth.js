const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { register, login, getProfile, updateProfile, changePassword, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
});

router.post('/register', [
  body('nom').notEmpty().withMessage('Nom requis'),
  body('prenom').notEmpty().withMessage('Prénom requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('mot_de_passe').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
], register);

router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage('Email invalide'),
  body('mot_de_passe').notEmpty().withMessage('Mot de passe requis'),
], login);

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);
router.post('/logout', authenticate, logout);

module.exports = router;
