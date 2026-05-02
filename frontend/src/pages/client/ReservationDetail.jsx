import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { reservationService, annulationService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUT_LABELS = { en_attente: 'En attente', confirmee: 'Confirmée', annulee: 'Annulée' };
const STATUT_COLORS = { en_attente: '#d97706', confirmee: '#059669', annulee: '#dc2626' };

export default function ReservationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [penalite, setPenalite] = useState(null);
  const [raison, setRaison] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingPenalite, setLoadingPenalite] = useState(false);
  const [historique, setHistorique] = useState([]);
  const [showHistorique, setShowHistorique] = useState(false);

  const load = () =>
    reservationService.getById(id)
      .then(r => setReservation(r.data))
      .catch(() => navigate('/mes-reservations'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [id, navigate]);

  const toggleHistorique = async () => {
    if (!showHistorique && historique.length === 0) {
      try {
        const res = await reservationService.getHistorique(id);
        setHistorique(res.data);
      } catch {
        toast.error('Impossible de charger l\'historique.');
        return;
      }
    }
    setShowHistorique(v => !v);
  };

  const ouvrirModal = async () => {
    setShowModal(true);
    setRaison('');
    setPenalite(null);
    setLoadingPenalite(true);
    try {
      const res = await annulationService.previewPenalite(id);
      setPenalite(res.data);
    } catch {
      toast.error('Impossible de calculer la pénalité.');
      setShowModal(false);
    } finally {
      setLoadingPenalite(false);
    }
  };

  const handleSoumettre = async () => {
    setSubmitting(true);
    try {
      const res = await annulationService.demanderAnnulationClient(id, raison);
      toast.success(res.data.message);
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!reservation) return null;

  const fmt = (d) => format(new Date(d), 'dd MMMM yyyy à HH:mm', { locale: fr });
  const badges = { confirmee: 'badge-success', en_attente: 'badge-warning', annulee: 'badge-danger' };
  const labels = { confirmee: 'Confirmée', en_attente: 'En attente de paiement', annulee: 'Annulée' };

  return (
    <div className="container" style={{ maxWidth: 650 }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>← Retour</button>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>Détail de la réservation</h2>
          <span className={`badge ${badges[reservation.statut]}`}>{labels[reservation.statut]}</span>
        </div>

        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {[
            ['Code', <code>{reservation.code_reservation}</code>],
            ['Trajet', `${reservation.ville_depart} → ${reservation.ville_arrivee}`],
            ['Départ', fmt(reservation.date_depart)],
            ['Arrivée', fmt(reservation.date_arrivee)],
            ['Véhicule', reservation.vehicule],
            ['Sièges réservés', reservation.nombre_sieges],
            ...(reservation.numeros_sieges ? [['Numéros de siège', reservation.numeros_sieges.split(',').map(n => `Siège ${n}`).join(', ')]] : []),
            ['Prix unitaire', `${reservation.prix_unitaire} $`],
            ['Total', <strong style={{ color: 'var(--primary)' }}>{reservation.prix_total} $</strong>],
          ].map(([label, value], i) => (
            <div key={i} className="billet-row"><span style={{ color: 'var(--gray-500)' }}>{label}</span><span>{value}</span></div>
          ))}
        </div>

        {reservation.statut === 'confirmee' && (
          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: '0.75rem 1rem', marginTop: '1.25rem', fontSize: '0.85rem', color: '#78350f' }}>
            <strong>📋 Politique d'annulation</strong>
            <ul style={{ margin: '0.4rem 0 0 1.2rem', padding: 0 }}>
              <li>Plus de 24h avant le départ → <strong style={{ color: '#065f46' }}>Remboursement complet</strong></li>
              <li>Moins de 24h avant le départ → <strong style={{ color: '#991b1b' }}>Pénalité de 25% retenue</strong></li>
            </ul>
            <p style={{ margin: '0.4rem 0 0' }}>L'annulation est soumise à la validation de l'administrateur.</p>
          </div>
        )}

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {reservation.statut === 'en_attente' && (
            <Link to={`/paiement/${reservation.id}`} className="btn btn-primary">💳 Procéder au paiement</Link>
          )}
          {reservation.code_billet && (
            <Link to={`/billet/${reservation.id}`} className="btn btn-success">🎟️ Voir le billet</Link>
          )}
          {reservation.statut === 'confirmee' && (
            <button className="btn btn-danger" onClick={ouvrirModal}>✖ Demander l'annulation</button>
          )}
          <button className="btn btn-secondary" onClick={toggleHistorique}>
            {showHistorique ? 'Masquer l\'historique' : 'Voir l\'historique'}
          </button>
        </div>

        {showHistorique && (
          <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--gray-200)', paddingTop: '1rem' }}>
            <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem', color: 'var(--gray-700)' }}>Historique des changements</h4>
            {historique.length === 0 ? (
              <p style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>Aucun historique disponible.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {historique.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUT_COLORS[h.statut_apres] || '#6b7280', marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <span style={{ color: 'var(--gray-500)' }}>
                        {h.statut_avant ? <><span style={{ color: STATUT_COLORS[h.statut_avant] }}>{STATUT_LABELS[h.statut_avant] || h.statut_avant}</span> → </> : ''}
                        <strong style={{ color: STATUT_COLORS[h.statut_apres] }}>{STATUT_LABELS[h.statut_apres] || h.statut_apres}</strong>
                      </span>
                      {h.raison && <span style={{ color: 'var(--gray-500)' }}> — {h.raison}</span>}
                      <div style={{ color: 'var(--gray-400)', fontSize: '0.78rem', marginTop: 2 }}>
                        {format(new Date(h.created_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                        {h.prenom && ` · ${h.prenom} ${h.nom}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, margin: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Demande d'annulation</h3>

            {loadingPenalite ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--gray-500)' }}>Calcul en cours...</div>
            ) : penalite && (
              <>
                <div style={{
                  borderRadius: 8, padding: '1rem', marginBottom: '1rem',
                  background: penalite.penalite_pourcent > 0 ? '#fee2e2' : '#d1fae5',
                  border: `1px solid ${penalite.penalite_pourcent > 0 ? '#fca5a5' : '#6ee7b7'}`,
                }}>
                  {penalite.penalite_pourcent > 0 ? (
                    <>
                      <p style={{ fontWeight: 700, color: '#991b1b', marginBottom: '0.5rem' }}>
                        ⚠️ Annulation moins de 24h avant le départ — pénalité de 25%
                      </p>
                      <div style={{ fontSize: '0.875rem', color: '#7f1d1d' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Montant payé</span><strong>{Number(penalite.prix_total).toFixed(2)} $</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Pénalité (25%)</span><strong style={{ color: '#dc2626' }}>- {Number(penalite.penalite_montant).toFixed(2)} $</strong></div>
                        <hr style={{ margin: '0.4rem 0', borderColor: '#fca5a5' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}><span>Remboursement</span><strong style={{ color: '#065f46' }}>{Number(penalite.montant_rembourse).toFixed(2)} $</strong></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p style={{ fontWeight: 700, color: '#065f46', marginBottom: '0.5rem' }}>
                        ✅ Annulation plus de 24h avant le départ — remboursement complet
                      </p>
                      <div style={{ fontSize: '0.875rem', color: '#064e3b' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Remboursement complet</span><strong>{Number(penalite.montant_rembourse).toFixed(2)} $</strong></div>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ background: '#f3f4f6', borderRadius: 6, padding: '0.6rem 0.75rem', fontSize: '0.8rem', color: 'var(--gray-600)', marginBottom: '1rem' }}>
                  Le remboursement sera effectif uniquement après la <strong>validation de l'administrateur</strong>.
                </div>

                <div className="form-group">
                  <label>Raison de l'annulation <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>(optionnelle)</span></label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Expliquez la raison de votre annulation..."
                    value={raison}
                    onChange={e => setRaison(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>Fermer</button>
              <button className="btn btn-danger" onClick={handleSoumettre} disabled={submitting || loadingPenalite}>
                {submitting ? 'Envoi...' : 'Confirmer la demande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
