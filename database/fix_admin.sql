USE transport_db;
UPDATE utilisateurs SET mot_de_passe = '$2b$10$UfLzcf8lj.pnmRphqD/yBeO2dXou9tDZg7T8G9xzGydxPuDFz4RMm' WHERE email = 'admin@transport.ca';
SELECT email, mot_de_passe FROM utilisateurs WHERE email = 'admin@transport.ca';
