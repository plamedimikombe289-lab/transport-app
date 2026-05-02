USE transport_db;

-- Table Siège : siège physique assigné à une réservation pour un trajet donné
CREATE TABLE IF NOT EXISTS sieges_assignes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trajet_id INT NOT NULL,
  reservation_id INT NOT NULL,
  numero_siege INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_siege_trajet (trajet_id, numero_siege),
  FOREIGN KEY (trajet_id) REFERENCES trajets(id),
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);
