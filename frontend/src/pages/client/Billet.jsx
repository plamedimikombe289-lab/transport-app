import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { paiementService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Billet() {
  const { reservation_id } = useParams();
  const navigate = useNavigate();
  const [billet, setBillet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paiementService.getBillet(reservation_id)
      .then(r => setBillet(r.data))
      .catch(() => navigate('/mes-reservations'))
      .finally(() => setLoading(false));
  }, [reservation_id, navigate]);

  if (loading) return <LoadingSpinner />;
  if (!billet) return null;

  const fmt = (d) => format(new Date(d), 'dd MMMM yyyy à HH:mm', { locale: fr });

  return (
    <div className="container" style={{ maxWidth: 650 }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '3rem' }}>🎟️</div>
        <h1 className="page-title" style={{ margin: 0 }}>Votre billet électronique</h1>
      </div>

      <div className="billet">
        <div className="billet-header">
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{billet.ville_depart} → {billet.ville_arrivee}</div>
          <div style={{ opacity: 0.85, marginTop: '0.25rem' }}>Transport Interurbain</div>
        </div>

        <div className="billet-body">
          <div className="billet-row"><span>Passager</span><strong>{billet.prenom} {billet.nom}</strong></div>
          <div className="billet-row"><span>Code réservation</span><code>{billet.code_reservation}</code></div>
          <div className="billet-row"><span>Départ</span><strong>{fmt(billet.date_depart)}</strong></div>
          <div className="billet-row"><span>Arrivée prévue</span><strong>{fmt(billet.date_arrivee)}</strong></div>
          <div className="billet-row"><span>Véhicule</span><span>{billet.vehicule}</span></div>
          <div className="billet-row"><span>Sièges</span><strong>{billet.nombre_sieges}</strong></div>
          {billet.numeros_sieges && (
            <div className="billet-row"><span>Numéros de siège</span><strong>{billet.numeros_sieges.split(',').map(n => `Siège ${n}`).join(', ')}</strong></div>
          )}
          <div className="billet-row"><span>Montant payé</span><strong style={{ color: 'var(--success)' }}>{billet.prix_total} $</strong></div>
          <div className="billet-row"><span>Émis le</span><span>{fmt(billet.emis_le)}</span></div>
        </div>

        <div className="billet-footer">
          {billet.code_billet}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'center' }}>
        <button onClick={() => window.print()} className="btn btn-secondary">🖨️ Imprimer</button>
        <Link to="/mes-reservations" className="btn btn-primary">Mes réservations</Link>
      </div>
    </div>
  );
}
