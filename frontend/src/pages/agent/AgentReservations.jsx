import React, { useEffect, useState } from 'react';
import { reservationService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUTS = ['', 'en_attente', 'confirmee', 'annulee'];
const LABELS = { '': 'Toutes', en_attente: 'En attente', confirmee: 'Confirmées', annulee: 'Annulées' };
const BADGES = { en_attente: 'badge-warning', confirmee: 'badge-success', annulee: 'badge-danger' };

export default function AgentReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState('');
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    reservationService.getAllAgent()
      .then(r => setReservations(r.data))
      .finally(() => setLoading(false));
  }, []);

  const affichees = reservations.filter(r => {
    const matchStatut = !filtre || r.statut === filtre;
    const q = recherche.toLowerCase();
    const matchRecherche = !q || [r.code_reservation, r.client_nom, r.client_prenom, r.client_email, r.ville_depart, r.ville_arrivee]
      .some(v => v && v.toLowerCase().includes(q));
    return matchStatut && matchRecherche;
  });

  const fmt = (d) => format(new Date(d), 'dd MMM yyyy HH:mm', { locale: fr });

  const exportCSV = () => {
    const header = ['Code', 'Trajet', 'Client', 'Courriel', 'Date départ', 'Sièges', 'Nos sièges', 'Total ($)', 'Statut', 'Date réservation'];
    const rows = affichees.map(r => [
      r.code_reservation,
      `${r.ville_depart} → ${r.ville_arrivee}`,
      `${r.client_prenom} ${r.client_nom}`,
      r.client_email,
      fmt(r.date_depart),
      r.nombre_sieges,
      r.numeros_sieges || '',
      Number(r.prix_total).toFixed(2),
      LABELS[r.statut] || r.statut,
      fmt(r.created_at),
    ]);
    const csv = [header, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `reservations_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <h1 className="page-title">Toutes les réservations</h1>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {STATUTS.map(s => (
            <button key={s} className={`btn btn-sm ${filtre === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFiltre(s)}>
              {LABELS[s]}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="form-control"
          placeholder="Rechercher client, code, trajet..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <span style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>{affichees.length} résultat(s)</span>
        <button className="btn btn-secondary btn-sm" onClick={exportCSV} disabled={affichees.length === 0}>
          Exporter CSV
        </button>
      </div>

      {loading ? <LoadingSpinner /> : affichees.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
          Aucune réservation trouvée.
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Code</th><th>Trajet</th><th>Client</th><th>Départ</th>
                  <th>Sièges</th><th>Nos sièges</th><th>Total</th><th>Statut</th><th>Date rés.</th>
                </tr>
              </thead>
              <tbody>
                {affichees.map(r => (
                  <tr key={r.id}>
                    <td><code>{r.code_reservation}</code></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.ville_depart} → {r.ville_arrivee}</td>
                    <td>
                      {r.client_prenom} {r.client_nom}
                      <br /><small style={{ color: 'var(--gray-500)' }}>{r.client_email}</small>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmt(r.date_depart)}</td>
                    <td>{r.nombre_sieges}</td>
                    <td>
                      {r.numeros_sieges
                        ? r.numeros_sieges.split(',').map(n => (
                            <span key={n} style={{ background: 'var(--primary)', color: '#fff', borderRadius: 4, padding: '0 5px', marginRight: 3, fontSize: '0.75rem' }}>{n}</span>
                          ))
                        : <span style={{ color: 'var(--gray-400)' }}>—</span>}
                    </td>
                    <td><strong>{Number(r.prix_total).toFixed(2)} $</strong></td>
                    <td><span className={`badge ${BADGES[r.statut]}`}>{LABELS[r.statut]}</span></td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{fmt(r.created_at)}</td>
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
