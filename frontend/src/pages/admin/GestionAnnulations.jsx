import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function GestionAnnulations() {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('en_attente');
  const [modal, setModal] = useState(null);
  const [action, setAction] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    adminService.getAnnulations(filtre)
      .then(r => setDemandes(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filtre]);

  const ouvrirModal = (demande, act) => { setModal(demande); setAction(act); setCommentaire(''); };
  const fermerModal = () => { setModal(null); setAction(''); setCommentaire(''); };

  const handleTraiter = async () => {
    setSubmitting(true);
    try {
      if (action === 'approuver') {
        await adminService.approuverAnnulation(modal.id, commentaire);
        toast.success('Annulation approuvée. Le client sera remboursé.');
      } else {
        await adminService.rejeterAnnulation(modal.id, commentaire);
        toast.success('Demande rejetée.');
      }
      fermerModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    } finally {
      setSubmitting(false);
    }
  };

  const badgeStatut = (s) => {
    const map = { en_attente: 'badge-warning', approuvee: 'badge-success', rejetee: 'badge-danger' };
    const labels = { en_attente: 'En attente', approuvee: 'Approuvée', rejetee: 'Rejetée' };
    return <span className={`badge ${map[s]}`}>{labels[s]}</span>;
  };

  return (
    <div className="container">
      <h1 className="page-title">Demandes d'annulation</h1>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {['en_attente', 'approuvee', 'rejetee', ''].map((s, i) => (
          <button
            key={i}
            className={`btn ${filtre === s ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFiltre(s)}
          >
            {s === '' ? 'Toutes' : s === 'en_attente' ? '⏳ En attente' : s === 'approuvee' ? '✅ Approuvées' : '❌ Rejetées'}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : demandes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
          Aucune demande d'annulation.
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Réservation</th><th>Trajet</th><th>Client</th><th>Demandeur</th>
                  <th>Payé</th><th>Remboursement</th><th>Raison</th><th>Date</th><th>Statut</th>
                  {filtre === 'en_attente' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {demandes.map(d => (
                  <tr key={d.id}>
                    <td><code>{d.code_reservation}</code></td>
                    <td>{d.ville_depart} → {d.ville_arrivee}</td>
                    <td>{d.client_prenom} {d.client_nom}<br /><small style={{ color: 'var(--gray-500)' }}>{d.client_email}</small></td>
                    <td>
                      <span className={`badge ${d.type_demandeur === 'client' ? 'badge-info' : 'badge-gray'}`}>
                        {d.type_demandeur === 'client' ? '👤 Client' : '🎫 Agent'}
                      </span>
                      <br /><small>{d.demandeur_prenom} {d.demandeur_nom}</small>
                    </td>
                    <td><strong>{Number(d.prix_total).toFixed(2)} $</strong></td>
                    <td>
                      {d.montant_rembourse !== null ? (
                        <>
                          <strong style={{ color: 'var(--success)' }}>{Number(d.montant_rembourse).toFixed(2)} $</strong>
                          {d.penalite_pourcent > 0 && (
                            <><br /><span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>Pénalité {d.penalite_pourcent}%</span></>
                          )}
                        </>
                      ) : <span style={{ color: 'var(--gray-400)' }}>Complet</span>}
                    </td>
                    <td style={{ maxWidth: 180, wordBreak: 'break-word', fontSize: '0.85rem' }}>{d.raison}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{format(new Date(d.created_at), 'dd MMM yyyy', { locale: fr })}</td>
                    <td>{badgeStatut(d.statut)}</td>
                    {filtre === 'en_attente' && (
                      <td style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-success btn-sm" onClick={() => ouvrirModal(d, 'approuver')}>✅ Approuver</button>
                        <button className="btn btn-danger btn-sm" onClick={() => ouvrirModal(d, 'rejeter')}>❌ Rejeter</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, margin: '1rem' }}>
            <h3 style={{ marginBottom: '0.5rem', color: action === 'approuver' ? 'var(--success)' : 'var(--danger)' }}>
              {action === 'approuver' ? '✅ Approuver l\'annulation' : '❌ Rejeter la demande'}
            </h3>
            <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
              Réservation <strong>{modal.code_reservation}</strong> — {modal.client_prenom} {modal.client_nom} — <strong>{Number(modal.prix_total).toFixed(2)} $</strong>
            </p>
            <div style={{ background: 'var(--gray-100)', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem', fontSize: '0.875rem' }}>
              <strong>Raison de l'agent :</strong><br />{modal.raison}
            </div>

            {action === 'approuver' && (
              <div className="alert" style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {modal.montant_rembourse !== null ? (
                  <>
                    ✅ La réservation sera annulée.<br />
                    Remboursement au client : <strong>{Number(modal.montant_rembourse).toFixed(2)} $</strong>
                    {modal.penalite_pourcent > 0 && (
                      <span style={{ color: '#b45309' }}> (pénalité de {modal.penalite_pourcent}% appliquée — {Number(modal.prix_total - modal.montant_rembourse).toFixed(2)} $ retenus)</span>
                    )}
                  </>
                ) : (
                  <>✅ La réservation sera annulée et le paiement de <strong>{Number(modal.prix_total).toFixed(2)} $</strong> sera remboursé en totalité.</>
                )}
              </div>
            )}

            <div className="form-group">
              <label>Commentaire administrateur (optionnel)</label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="Ajoutez un commentaire..."
                value={commentaire}
                onChange={e => setCommentaire(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={fermerModal} disabled={submitting}>Annuler</button>
              <button
                className={`btn ${action === 'approuver' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleTraiter}
                disabled={submitting}
              >
                {submitting ? 'Traitement...' : action === 'approuver' ? 'Confirmer l\'approbation' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
