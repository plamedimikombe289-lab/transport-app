-- ============================================================
-- Application de réservation de trajets interurbains
-- Schéma de base de données
-- ============================================================

CREATE DATABASE IF NOT EXISTS transport_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE transport_db;

-- Rôles
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Utilisateurs
CREATE TABLE utilisateurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  telephone VARCHAR(20),
  role_id INT NOT NULL DEFAULT 1,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Villes
CREATE TABLE villes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL UNIQUE,
  province VARCHAR(100),
  pays VARCHAR(100) DEFAULT 'Canada',
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lignes de transport
CREATE TABLE lignes_transport (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  ville_depart_id INT NOT NULL,
  ville_arrivee_id INT NOT NULL,
  duree_minutes INT NOT NULL,
  prix_base DECIMAL(10,2) NOT NULL,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ville_depart_id) REFERENCES villes(id),
  FOREIGN KEY (ville_arrivee_id) REFERENCES villes(id)
);

-- Véhicules
CREATE TABLE vehicules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_plaque VARCHAR(20) NOT NULL UNIQUE,
  modele VARCHAR(100) NOT NULL,
  capacite INT NOT NULL,
  actif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trajets
CREATE TABLE trajets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ligne_id INT NOT NULL,
  vehicule_id INT NOT NULL,
  date_depart DATETIME NOT NULL,
  date_arrivee DATETIME NOT NULL,
  prix DECIMAL(10,2) NOT NULL,
  places_disponibles INT NOT NULL,
  statut ENUM('planifie', 'en_cours', 'termine', 'annule') DEFAULT 'planifie',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ligne_id) REFERENCES lignes_transport(id),
  FOREIGN KEY (vehicule_id) REFERENCES vehicules(id)
);

-- Réservations
CREATE TABLE reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  trajet_id INT NOT NULL,
  nombre_sieges INT NOT NULL DEFAULT 1,
  prix_total DECIMAL(10,2) NOT NULL,
  statut ENUM('en_attente', 'confirmee', 'annulee') DEFAULT 'en_attente',
  code_reservation VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES utilisateurs(id),
  FOREIGN KEY (trajet_id) REFERENCES trajets(id)
);

-- Paiements simulés
CREATE TABLE paiements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL UNIQUE,
  montant DECIMAL(10,2) NOT NULL,
  methode ENUM('carte_credit', 'carte_debit', 'paypal') DEFAULT 'carte_credit',
  statut ENUM('en_attente', 'complete', 'echoue', 'rembourse') DEFAULT 'en_attente',
  reference_paiement VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

-- Billets
CREATE TABLE billets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL UNIQUE,
  code_billet VARCHAR(30) NOT NULL UNIQUE,
  qr_code TEXT,
  emis_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

-- Historique des réservations
CREATE TABLE historique_reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL,
  statut_avant VARCHAR(50),
  statut_apres VARCHAR(50),
  modifie_par INT,
  raison TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  FOREIGN KEY (modifie_par) REFERENCES utilisateurs(id)
);

-- ============================================================
-- Données initiales
-- ============================================================

INSERT INTO roles (nom) VALUES ('client'), ('agent'), ('administrateur');

INSERT INTO villes (nom, province) VALUES
  ('Montréal', 'Québec'),
  ('Québec', 'Québec'),
  ('Sherbrooke', 'Québec'),
  ('Trois-Rivières', 'Québec'),
  ('Ottawa', 'Ontario'),
  ('Toronto', 'Ontario'),
  ('Gatineau', 'Québec');

INSERT INTO vehicules (numero_plaque, modele, capacite) VALUES
  ('MTL-001', 'Autobus Volvo 9700', 48),
  ('MTL-002', 'Autobus MCI D4505', 55),
  ('QUE-001', 'Autobus Prevost X3-45', 50),
  ('SHE-001', 'Minibus Ford Transit 350', 20);

INSERT INTO lignes_transport (code, ville_depart_id, ville_arrivee_id, duree_minutes, prix_base) VALUES
  ('MTL-QUE', 1, 2, 180, 35.00),
  ('QUE-MTL', 2, 1, 180, 35.00),
  ('MTL-SHE', 1, 3, 120, 25.00),
  ('MTL-TRV', 1, 4, 90, 20.00),
  ('MTL-OTT', 1, 5, 120, 30.00),
  ('MTL-TOR', 1, 6, 360, 60.00);

-- Admin par défaut (mot de passe: Admin123!)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role_id) VALUES
  ('Admin', 'Système', 'admin@transport.ca', '$2b$10$rQZ9uAVKQ2s6BxZjmLVnNO6P.k5Z5L5mCz2nTVrLGZ1mYqD2V1S6G', 3);
