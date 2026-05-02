import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reservationService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusBadge = (s) => {
  const map = { confirmee: 'badge-success', en_attente: 'badge-warning', annulee: 'badge-danger' };
  const labels = { confirmee: 'Confirmée', en_attente: 'En attente', annulee: 'Annulée' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{labels[s] || s}</span>;
};

export default function MesReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reservationService.getMesReservations()
      .then(r => setReservations(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <h1 className="page-title">Mes réservations</h1>
      {reservations.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
          Aucune réservation. <Link to="/trajets">Voir les trajets disponibles</Link>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Code</th><th>Trajet</th><th>Date départ</th><th>Sièges</th><th>Total</th><th>Statut</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(r => (
                  <tr key={r.id}>
                    <td><code>{r.code_reservation}</code></td>
                    <td>{r.ville_depart} → {r.ville_arrivee}</td>
                    <td>{format(new Date(r.date_depart), 'dd MMM yyyy HH:mm', { locale: fr })}</td>
                    <td>{r.nombre_sieges}</td>
                    <td>{r.prix_total} $</td>
                    <td>{statusBadge(r.statut)}</td>
                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/reservations/${r.id}`} className="btn btn-secondary btn-sm">Détails</Link>
                      {r.statut === 'en_attente' && (
                        <Link to={`/paiement/${r.id}`} className="btn btn-primary btn-sm">Payer</Link>
                      )}
                      {r.code_billet && (
                        <Link to={`/billet/${r.id}`} className="btn btn-success btn-sm">Billet</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
