import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trajetService, reservationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function TrajetDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trajet, setTrajet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nbSieges, setNbSieges] = useState(1);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    trajetService.getById(id).then(r => setTrajet(r.data)).catch(() => navigate('/trajets')).finally(() => setLoading(false));
  }, [id, navigate]);

  const handleReserver = async () => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'client') { toast.error('Seuls les clients peuvent réserver.'); return; }
    setReserving(true);
    try {
      const res = await reservationService.create({ trajet_id: id, nombre_sieges: nbSieges });
      toast.success('Réservation créée! Procédez au paiement.');
      navigate(`/paiement/${res.data.reservation_id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la réservation.');
    } finally {
      setReserving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!trajet) return null;

  const fmt = (d) => format(new Date(d), 'dd MMMM yyyy à HH:mm', { locale: fr });

  return (
    <div className="container" style={{ maxWidth: 700 }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>← Retour</button>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <span className="badge badge-info" style={{ marginBottom: '0.5rem' }}>{trajet.ligne_code}</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{trajet.ville_depart} → {trajet.ville_arrivee}</h1>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{trajet.prix} $</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>par personne</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: '🕐 Départ', value: fmt(trajet.date_depart) },
            { label: '🏁 Arrivée', value: fmt(trajet.date_arrivee) },
            { label: '⏱ Durée', value: `${trajet.duree_minutes} minutes` },
            { label: '🚌 Véhicule', value: trajet.vehicule },
            { label: '💺 Places disponibles', value: `${trajet.places_disponibles} / ${trajet.capacite}` },
            { label: '📊 Statut', value: trajet.statut },
          ].map((item, i) => (
            <div key={i} style={{ background: 'var(--gray-100)', borderRadius: 6, padding: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{item.label}</div>
              <div style={{ fontWeight: 600 }}>{item.value}</div>
            </div>
          ))}
        </div>

        {trajet.statut === 'planifie' && trajet.places_disponibles > 0 && (
          <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '1.5rem' }}>
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: '#78350f' }}>
              <strong>📋 Politique d'annulation</strong>
              <ul style={{ margin: '0.5rem 0 0 1.2rem', padding: 0 }}>
                <li>Annulation <strong>plus de 24h</strong> avant le départ → <strong style={{ color: '#065f46' }}>Remboursement complet</strong></li>
                <li>Annulation <strong>moins de 24h</strong> avant le départ → <strong style={{ color: '#991b1b' }}>Pénalité de 25% retenue</strong></li>
              </ul>
              <p style={{ margin: '0.5rem 0 0' }}>Toute annulation est soumise à la validation de l'administrateur avant remboursement.</p>
            </div>

            <h3 style={{ marginBottom: '1rem' }}>Réserver des sièges</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Nombre de sièges</label>
                <input type="number" className="form-control" min={1} max={trajet.places_disponibles}
                  value={nbSieges} onChange={e => setNbSieges(Number(e.target.value))} style={{ width: 120 }} />
              </div>
              <div style={{ padding: '0.6rem 0', color: 'var(--gray-700)' }}>
                Total: <strong>{(trajet.prix * nbSieges).toFixed(2)} $</strong>
              </div>
              <button className="btn btn-primary" onClick={handleReserver} disabled={reserving}>
                {reserving ? 'Réservation...' : 'Réserver maintenant'}
              </button>
            </div>
          </div>
        )}

        {trajet.places_disponibles === 0 && (
          <div className="alert alert-error">Ce trajet est complet.</div>
        )}
      </div>
    </div>
  );
}
