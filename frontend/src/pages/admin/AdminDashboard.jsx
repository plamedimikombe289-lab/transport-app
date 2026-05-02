import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats().then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <h1 className="page-title">Administration</h1>

      <div className="stats-grid">
        {[
          { label: 'Réservations confirmées', value: stats?.total_reservations || 0, color: 'var(--primary)' },
          { label: 'Clients enregistrés', value: stats?.total_clients || 0, color: 'var(--secondary)' },
          { label: 'Trajets planifiés', value: stats?.trajets_planifies || 0, color: 'var(--warning)' },
          { label: 'Revenus totaux ($)', value: `${Number(stats?.revenus_total || 0).toFixed(2)}`, color: 'var(--success)' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ borderLeftColor: s.color }}>
            <div className="value" style={{ color: s.color }}>{s.value}</div>
            <div className="label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Gestion du système</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link to="/admin/utilisateurs" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>👥 Gérer les utilisateurs</Link>
            <Link to="/admin/villes" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>🏙️ Gérer les villes</Link>
            <Link to="/admin/lignes" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>🛣️ Gérer les lignes</Link>
            <Link to="/admin/vehicules" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>🚌 Gérer les véhicules</Link>
            <Link to="/agent/trajets" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>📋 Gérer les trajets</Link>
            <Link to="/admin/annulations" className="btn btn-secondary" style={{ justifyContent: 'flex-start', position: 'relative' }}>
              🔔 Demandes d'annulation
              {stats?.annulations_en_attente > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--danger)', color: 'white', borderRadius: '999px', padding: '0.1rem 0.55rem', fontSize: '0.8rem', fontWeight: 700 }}>
                  {stats.annulations_en_attente}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Trajets les plus populaires</h3>
          {stats?.trajets_populaires?.length === 0 ? (
            <p style={{ color: 'var(--gray-500)' }}>Aucune donnée disponible.</p>
          ) : (
            <table style={{ fontSize: '0.85rem', width: '100%' }}>
              <thead>
                <tr><th>Trajet</th><th>Rés.</th><th>Taux occ.</th></tr>
              </thead>
              <tbody>
                {stats?.trajets_populaires?.map((t, i) => (
                  <tr key={i}>
                    <td>{t.depart} → {t.arrivee}</td>
                    <td>{t.nb_reservations}</td>
                    <td>{Number(t.taux_occupation || 0).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
