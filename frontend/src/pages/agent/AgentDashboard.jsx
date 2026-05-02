import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { trajetService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AgentDashboard() {
  const [trajets, setTrajets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trajetService.getAllAgent().then(r => setTrajets(r.data)).finally(() => setLoading(false));
  }, []);

  const upcoming = trajets.filter(t => t.statut === 'planifie').slice(0, 5);

  return (
    <div className="container">
      <h1 className="page-title">Tableau de bord agent</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="value">{trajets.filter(t => t.statut === 'planifie').length}</div>
          <div className="label">Trajets planifiés</div>
        </div>
        <div className="stat-card">
          <div className="value">{trajets.filter(t => t.statut === 'en_cours').length}</div>
          <div className="label">Trajets en cours</div>
        </div>
        <div className="stat-card">
          <div className="value">{trajets.reduce((s, t) => s + (t.nb_reservations || 0), 0)}</div>
          <div className="label">Total réservations</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Link to="/agent/trajets" className="btn btn-primary">Gérer les trajets</Link>
        <Link to="/agent/reservations" className="btn btn-secondary">Toutes les réservations</Link>
        <Link to="/agent/vehicules" className="btn btn-secondary">Gérer les véhicules</Link>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Prochains départs</h3>
          <Link to="/agent/trajets" className="btn btn-primary btn-sm">Voir tous</Link>
        </div>
        {loading ? <LoadingSpinner /> : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Trajet</th><th>Départ</th><th>Véhicule</th><th>Places</th><th>Réservations</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {upcoming.map(t => (
                  <tr key={t.id}>
                    <td>{t.ville_depart} → {t.ville_arrivee}</td>
                    <td>{format(new Date(t.date_depart), 'dd MMM HH:mm', { locale: fr })}</td>
                    <td>{t.vehicule}</td>
                    <td>{t.places_disponibles}/{t.capacite}</td>
                    <td>{t.nb_reservations}</td>
                    <td><Link to={`/agent/passagers/${t.id}`} className="btn btn-secondary btn-sm">Passagers</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
