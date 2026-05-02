-- ============================================================
-- Transport Interurbain — Script SQL complet pour production
-- Exécuter ce fichier une seule fois pour initialiser la BD
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
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
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

-- Demandes d'annulation
CREATE TABLE demandes_annulation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL,
  demande_par INT NOT NULL,
  raison TEXT NOT NULL,
  type_demandeur ENUM('client', 'agent') DEFAULT 'agent',
  penalite_pourcent TINYINT DEFAULT 0,
  montant_rembourse DECIMAL(10,2) NULL,
  statut ENUM('en_attente', 'approuvee', 'rejetee') DEFAULT 'en_attente',
  traite_par INT NULL,
  commentaire_admin TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  FOREIGN KEY (demande_par) REFERENCES utilisateurs(id),
  FOREIGN KEY (traite_par) REFERENCES utilisateurs(id)
);

-- Sièges assignés
CREATE TABLE sieges_assignes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trajet_id INT NOT NULL,
  reservation_id INT NOT NULL,
  numero_siege INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_siege_trajet (trajet_id, numero_siege),
  FOREIGN KEY (trajet_id) REFERENCES trajets(id),
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

-- ============================================================
-- Données initiales
-- ============================================================

INSERT INTO roles (nom) VALUES ('client'), ('agent'), ('administrateur');

INSERT INTO villes (nom, province, pays, latitude, longitude) VALUES
('Montréal',       'Québec',                    'Canada', 45.5017,  -73.5673),
('Québec',         'Québec',                    'Canada', 46.8139,  -71.2080),
('Sherbrooke',     'Québec',                    'Canada', 45.4043,  -71.8929),
('Trois-Rivières', 'Québec',                    'Canada', 46.3432,  -72.5429),
('Ottawa',         'Ontario',                   'Canada', 45.4215,  -75.6972),
('Toronto',        'Ontario',                   'Canada', 43.6532,  -79.3832),
('Gatineau',       'Québec',                    'Canada', 45.4765,  -75.7013),
('Vancouver',      'Colombie-Britannique',       'Canada', 49.2827, -123.1207),
('Calgary',        'Alberta',                   'Canada', 51.0447, -114.0719),
('Edmonton',       'Alberta',                   'Canada', 53.5461, -113.4938),
('Winnipeg',       'Manitoba',                  'Canada', 49.8951,  -97.1384),
('Hamilton',       'Ontario',                   'Canada', 43.2557,  -79.8711),
('London',         'Ontario',                   'Canada', 42.9849,  -81.2453),
('Windsor',        'Ontario',                   'Canada', 42.3149,  -83.0364),
('Kingston',       'Ontario',                   'Canada', 44.2312,  -76.4860),
('Barrie',         'Ontario',                   'Canada', 44.3894,  -79.6903),
('Sudbury',        'Ontario',                   'Canada', 46.4917,  -80.9930),
('Thunder Bay',    'Ontario',                   'Canada', 48.3809,  -89.2477),
('Halifax',        'Nouvelle-Écosse',            'Canada', 44.6488,  -63.5752),
('Moncton',        'Nouveau-Brunswick',          'Canada', 46.0878,  -64.7782),
('Fredericton',    'Nouveau-Brunswick',          'Canada', 45.9636,  -66.6431),
('Saint John',     'Nouveau-Brunswick',          'Canada', 45.2733,  -66.0633),
('Charlottetown',  'Île-du-Prince-Édouard',      'Canada', 46.2382,  -63.1311),
('Regina',         'Saskatchewan',              'Canada', 50.4452, -104.6189),
('Saskatoon',      'Saskatchewan',              'Canada', 52.1332, -106.6700),
('Saguenay',       'Québec',                    'Canada', 48.4284,  -71.0537),
('Rimouski',       'Québec',                    'Canada', 48.4472,  -68.5328),
('Drummondville',  'Québec',                    'Canada', 45.8837,  -72.4807),
('Saint-Jérôme',   'Québec',                    'Canada', 45.7806,  -74.0019),
('Rouyn-Noranda',  'Québec',                    'Canada', 48.2400,  -79.0200),
('Sept-Îles',      'Québec',                    'Canada', 50.2164,  -66.3806),
('Granby',         'Québec',                    'Canada', 45.4000,  -72.7333),
('Val-d\'Or',      'Québec',                    'Canada', 48.1000,  -77.7833),
('Brampton',       'Ontario',                   'Canada', 43.7315,  -79.7624),
('Mississauga',    'Ontario',                   'Canada', 43.5890,  -79.6441),
('Kitchener',      'Ontario',                   'Canada', 43.4516,  -80.4925);

INSERT INTO vehicules (numero_plaque, modele, capacite) VALUES
('MTL-001', 'Autobus Volvo 9700',      48),
('MTL-002', 'Autobus MCI D4505',       55),
('QUE-001', 'Autobus Prevost X3-45',   50),
('SHE-001', 'Minibus Ford Transit 350', 20);

INSERT INTO lignes_transport (code, ville_depart_id, ville_arrivee_id, duree_minutes, prix_base) VALUES
('MTL-QUE', 1, 2, 180, 35.00),
('QUE-MTL', 2, 1, 180, 35.00),
('MTL-SHE', 1, 3, 120, 25.00),
('MTL-TRV', 1, 4,  90, 20.00),
('MTL-OTT', 1, 5, 120, 30.00),
('MTL-TOR', 1, 6, 360, 60.00);

-- Admin par défaut — mot de passe: Admin123!
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role_id) VALUES
('Admin', 'Système', 'admin@transport.ca',
 '$2b$10$rQZ9uAVKQ2s6BxZjmLVnNO6P.k5Z5L5mCz2nTVrLGZ1mYqD2V1S6G', 3);

-- Trajets de démonstration
INSERT INTO trajets (ligne_id, vehicule_id, date_depart, date_arrivee, prix, places_disponibles) VALUES
(1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 7 HOUR,  DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 10 HOUR,  35.00, 48),
(1, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 12 HOUR, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 15 HOUR, 35.00, 55),
(1, 3, DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 8 HOUR,  DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 11 HOUR, 35.00, 50),
(2, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 8 HOUR,  DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 11 HOUR, 35.00, 50),
(2, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 13 HOUR, DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 16 HOUR, 35.00, 48),
(3, 4, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 9 HOUR,  DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 11 HOUR, 25.00, 20),
(3, 4, DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 15 HOUR, DATE_ADD(CURDATE(), INTERVAL 2 DAY) + INTERVAL 17 HOUR, 25.00, 20),
(4, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 7 HOUR,  DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 8 HOUR + INTERVAL 30 MINUTE, 20.00, 55),
(5, 3, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 9 HOUR,  DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 11 HOUR, 30.00, 50),
(6, 2, DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 6 HOUR,  DATE_ADD(CURDATE(), INTERVAL 1 DAY) + INTERVAL 12 HOUR, 60.00, 55);
