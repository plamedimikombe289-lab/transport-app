import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function GestionVehicules() {
  const [vehicules, setVehicules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ numero_plaque: '', modele: '', capacite: '' });

  const load = () => adminService.getVehicules().then(r => setVehicules(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try { await adminService.createVehicule(form); toast.success('Véhicule créé.'); setShowForm(false); setForm({ numero_plaque: '', modele: '', capacite: '' }); load(); }
    catch { toast.error('Erreur.'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Gestion des véhicules</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Ajouter un véhicule</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Numéro de plaque</label>
                <input className="form-control" required value={form.numero_plaque} onChange={e => setForm({ ...form, numero_plaque: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Modèle</label>
                <input className="form-control" required value={form.modele} onChange={e => setForm({ ...form, modele: e.target.value })} />
              </div>
            </div>
            <div className="form-group" style={{ maxWidth: 200 }}>
              <label>Capacité (sièges)</label>
              <input type="number" className="form-control" required min="1" value={form.capacite} onChange={e => setForm({ ...form, capacite: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary">Créer</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Plaque</th><th>Modèle</th><th>Capacité</th><th>Statut</th></tr></thead>
            <tbody>
              {vehicules.map(v => (
                <tr key={v.id}>
                  <td><code>{v.numero_plaque}</code></td>
                  <td>{v.modele}</td>
                  <td>{v.capacite} places</td>
                  <td><span className={`badge ${v.actif ? 'badge-success' : 'badge-danger'}`}>{v.actif ? 'Actif' : 'Inactif'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
