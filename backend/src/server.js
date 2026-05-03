require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.set('trust proxy', 1);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trajets', require('./routes/trajets'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/paiements', require('./routes/paiements'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/annulations', require('./routes/annulations'));

app.get('/', (req, res) => {
  res.json({ message: 'API Transport Interurbain v1.0' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur serveur interne.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});

module.exports = app;
