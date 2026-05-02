USE transport_db;

-- Coordonnées GPS pour les villes
ALTER TABLE villes
  ADD COLUMN latitude DECIMAL(10,7) NULL AFTER actif,
  ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude;

-- Mettre à jour les villes existantes avec coordonnées
UPDATE villes SET latitude=45.5017, longitude=-73.5673 WHERE nom='Montréal';
UPDATE villes SET latitude=46.8139, longitude=-71.2080 WHERE nom='Québec';
UPDATE villes SET latitude=45.4043, longitude=-71.8929 WHERE nom='Sherbrooke';
UPDATE villes SET latitude=46.3432, longitude=-72.5429 WHERE nom='Trois-Rivières';
UPDATE villes SET latitude=45.4215, longitude=-75.6972 WHERE nom='Ottawa';
UPDATE villes SET latitude=43.6532, longitude=-79.3832 WHERE nom='Toronto';
UPDATE villes SET latitude=45.4765, longitude=-75.7013 WHERE nom='Gatineau';

-- Villes canadiennes majeures (toutes à plus de 50km les unes des autres pour les paires pertinentes)
INSERT IGNORE INTO villes (nom, province, pays, latitude, longitude) VALUES
('Vancouver',        'Colombie-Britannique',          'Canada', 49.2827, -123.1207),
('Calgary',          'Alberta',                        'Canada', 51.0447, -114.0719),
('Edmonton',         'Alberta',                        'Canada', 53.5461, -113.4938),
('Winnipeg',         'Manitoba',                       'Canada', 49.8951,  -97.1384),
('Hamilton',         'Ontario',                        'Canada', 43.2557,  -79.8711),
('London',           'Ontario',                        'Canada', 42.9849,  -81.2453),
('Windsor',          'Ontario',                        'Canada', 42.3149,  -83.0364),
('Kingston',         'Ontario',                        'Canada', 44.2312,  -76.4860),
('Barrie',           'Ontario',                        'Canada', 44.3894,  -79.6903),
('Sudbury',          'Ontario',                        'Canada', 46.4917,  -80.9930),
('Thunder Bay',      'Ontario',                        'Canada', 48.3809,  -89.2477),
('Halifax',          'Nouvelle-Écosse',                'Canada', 44.6488,  -63.5752),
('Moncton',          'Nouveau-Brunswick',              'Canada', 46.0878,  -64.7782),
('Fredericton',      'Nouveau-Brunswick',              'Canada', 45.9636,  -66.6431),
('Saint John',       'Nouveau-Brunswick',              'Canada', 45.2733,  -66.0633),
('Charlottetown',    'Île-du-Prince-Édouard',          'Canada', 46.2382,  -63.1311),
('Regina',           'Saskatchewan',                   'Canada', 50.4452, -104.6189),
('Saskatoon',        'Saskatchewan',                   'Canada', 52.1332, -106.6700),
('Saguenay',         'Québec',                         'Canada', 48.4284,  -71.0537),
('Rimouski',         'Québec',                         'Canada', 48.4472,  -68.5328),
('Drummondville',    'Québec',                         'Canada', 45.8837,  -72.4807),
('Saint-Jérôme',     'Québec',                         'Canada', 45.7806,  -74.0019),
('Rouyn-Noranda',    'Québec',                         'Canada', 48.2400,  -79.0200),
('Sept-Îles',        'Québec',                         'Canada', 50.2164,  -66.3806),
('Granby',           'Québec',                         'Canada', 45.4000,  -72.7333),
('Chicoutimi',       'Québec',                         'Canada', 48.4275,  -71.0558),
('Val-d''Or',        'Québec',                         'Canada', 48.1000,  -77.7833),
('Brampton',         'Ontario',                        'Canada', 43.7315,  -79.7624),
('Mississauga',      'Ontario',                        'Canada', 43.5890,  -79.6441),
('Kitchener',        'Ontario',                        'Canada', 43.4516,  -80.4925);

-- Table des demandes d'annulation (agent → admin)
CREATE TABLE IF NOT EXISTS demandes_annulation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL,
  demande_par INT NOT NULL,
  raison TEXT NOT NULL,
  statut ENUM('en_attente', 'approuvee', 'rejetee') DEFAULT 'en_attente',
  traite_par INT NULL,
  commentaire_admin TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (reservation_id) REFERENCES reservations(id),
  FOREIGN KEY (demande_par) REFERENCES utilisateurs(id),
  FOREIGN KEY (traite_par) REFERENCES utilisateurs(id)
);
