# 🚌 Application de réservation de trajets interurbains

Application fullstack complète pour la gestion de réservations de transport interurbain.

## 🏗️ Architecture

```
transport-app/
├── backend/          # API REST Node.js / Express
├── frontend/         # Interface React
└── database/         # Schéma MySQL
```

## 🚀 Démarrage rapide

### Prérequis
- Node.js >= 18
- MySQL >= 8.0
- npm

---

### 1. Base de données

```bash
mysql -u root -p < database/schema.sql
```

---

### 2. Backend

```bash
cd backend
cp .env.example .env
# Modifier .env avec vos paramètres MySQL
npm install
npm run dev
```

L'API sera disponible sur `http://localhost:5000`

---

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

L'application sera disponible sur `http://localhost:3000`

---

## 👤 Comptes par défaut

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | admin@transport.ca | Admin123! |

Créez des comptes client via la page d'inscription.

Pour créer un agent, connectez-vous en admin et changez le rôle d'un utilisateur.

---

## 🔐 Rôles et fonctionnalités

### Client
- Recherche et consultation des trajets
- Réservation de sièges
- Paiement simulé
- Consultation du billet électronique
- Historique des réservations
- Annulation de réservation

### Agent
- Tableau de bord opérationnel
- Création et gestion des trajets
- Mise à jour du statut des trajets
- Consultation de la liste des passagers

### Administrateur
- Toutes les fonctionnalités agent
- Gestion des utilisateurs et rôles
- Gestion des villes desservies
- Gestion des lignes de transport
- Gestion des véhicules
- Statistiques et rapports

---

## 📡 API REST

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/register | Inscription |
| POST | /api/auth/login | Connexion |
| GET | /api/auth/profile | Mon profil |
| GET | /api/trajets | Liste des trajets |
| GET | /api/trajets/:id | Détail d'un trajet |
| POST | /api/trajets | Créer un trajet |
| PATCH | /api/trajets/:id/statut | Mettre à jour le statut |
| POST | /api/reservations | Créer une réservation |
| GET | /api/reservations/mes-reservations | Mes réservations |
| PATCH | /api/reservations/:id/annuler | Annuler |
| POST | /api/paiements/simuler | Simuler un paiement |
| GET | /api/paiements/billet/:id | Consulter le billet |
| GET | /api/admin/statistiques | Statistiques |

---

## 🛠️ Technologies utilisées

**Backend**
- Node.js + Express
- MySQL2 (avec transactions)
- JWT (authentification)
- bcrypt (hash des mots de passe)
- express-validator

**Frontend**
- React 18
- React Router v6
- Axios
- date-fns
- react-hot-toast

---

## 📁 Déploiement GitHub

```bash
git init
git add .
git commit -m "Initial commit - Application transport interurbain"
git remote add origin https://github.com/votre-compte/transport-app.git
git push -u origin main
```

---

## ⚙️ Variables d'environnement (backend)

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=transport_db
JWT_SECRET=votre_clé_secrète
JWT_EXPIRES_IN=7d
NODE_ENV=development
```
