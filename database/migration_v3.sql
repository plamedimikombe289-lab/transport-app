USE transport_db;

ALTER TABLE demandes_annulation
  ADD COLUMN type_demandeur ENUM('client', 'agent') DEFAULT 'agent' AFTER raison,
  ADD COLUMN penalite_pourcent TINYINT DEFAULT 0 AFTER type_demandeur,
  ADD COLUMN montant_rembourse DECIMAL(10,2) NULL AFTER penalite_pourcent;
