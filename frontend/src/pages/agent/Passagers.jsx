import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reservationService, trajetService, annulationService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Passagers() {
  const { trajet_id } = useParams();
  const navigate = useNavigate();
  const [passagers, setPassagers] = useState([]);
  const [trajet, setTrajet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [raison, setRaison] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () =>
    Promise.all([
      reservationService.getPassagers(trajet_id),
      trajetService.getById(trajet_id)
    ]).then(([p, t]) => { setPassagers(p.data); setTrajet(t.data); }).finally(() => setLoading(false));

  useEffect(() => { load(); }, [trajet_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const ouvrirModal = (passager) => { setModal(passager); setRaison(''); };
  const fermerModal = () => { setModal(null); setRaison(''); };

  const handleDemandeAnnulation = async () => {
    if (raison.trim().length < 10) {
      toast.error('La raison doit contenir au moins 10 caractères.');
      return;
    }
    setSubmitting(true);
    try {
      await annulationService.demanderAnnulation(modal.id, raison.trim());
      toast.success('Demande d\'annulation soumise à l\'administrateur.');
      fermerModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem' }}>← Retour</button>

      {trajet && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2>{trajet.ville_depart} → {trajet.ville_arrivee}</h2>
          <p style={{ color: 'var(--gray-500)', marginTop: '0.25rem' }}>
            Départ: {format(new Date(trajet.date_depart), 'dd MMMM yyyy à HH:mm', { locale: fr })} · {passagers.length} passager(s)
          </p>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Liste des passagers confirmés</h3>
        {passagers.length === 0 ? (
          <p style={{ color: 'var(--gray-500)' }}>Aucun passager confirmé pour ce trajet.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>#</th><th>Nom</th><th>Courriel</th><th>Téléphone</th><th>Sièges</th><th>Nos sièges</th><th>Code rés.</th><th>Code billet</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {passagers.map((p, i) => (
                  <tr key={p.id}>
                    <td>{i + 1}</td>
                    <td>{p.prenom} {p.nom}</td>
                    <td>{p.email}</td>
                    <td>{p.telephone || '—'}</td>
                    <td>{p.nombre_sieges}</td>
                    <td>{p.numeros_sieges ? p.numeros_sieges.split(',').map(n => <span key={n} style={{ background: 'var(--primary)', color: '#fff', borderRadius: 4, padding: '0 5px', marginRight: 3, fontSize: '0.8rem' }}>{n}</span>) : '—'}</td>
                    <td><code>{p.code_reservation}</code></td>
                    <td><code>{p.code_billet || '—'}</code></td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => ouvrirModal(p)}
                        title="Demander annulation à l'admin"
                      >
                        Annuler
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, margin: '1rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>Demande d'annulation</h3>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Réservation <strong>{modal.code_reservation}</strong> — {modal.prenom} {modal.nom}
            </p>
            <div className="form-group">
              <label>Raison de l'annulation <span style={{ color: 'var(--danger)' }}>*</span></label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Expliquez la raison de l'annulation (min. 10 caractères)..."
                value={raison}
                onChange={e => setRaison(e.target.value)}
                style={{ resize: 'vertical' }}
              />
              <span style={{ fontSize: '0.75rem', color: raison.length < 10 ? 'var(--danger)' : 'var(--gray-500)' }}>
                {raison.length} caractère(s) — minimum 10
              </span>
            </div>
            <div className="alert" style={{ background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', fontSize: '0.875rem', marginBottom: '1rem' }}>
              ⚠️ Cette demande sera soumise à l'administrateur pour approbation avant tout remboursement.
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={fermerModal} disabled={submitting}>Annuler</button>
              <button className="btn btn-danger" onClick={handleDemandeAnnulation} disabled={submitting || raison.trim().length < 10}>
                {submitting ? 'Envoi...' : 'Soumettre la demande'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
