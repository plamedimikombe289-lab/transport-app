import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function GestionVilles() {
  const [villes, setVilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nom: '', province: '', pays: 'Canada', latitude: '', longitude: '' });
  const [showForm, setShowForm] = useState(false);

  const load = () => adminService.getVilles().then(r => setVilles(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminService.createVille(form);
      toast.success('Ville créée.');
      setShowForm(false);
      setForm({ nom: '', province: '', pays: 'Canada', latitude: '', longitude: '' });
      load();
    } catch { toast.error('Erreur.'); }
  };

  const handleToggle = async (id) => {
    try { await adminService.toggleVille(id); toast.success('Statut mis à jour.'); load(); }
    catch { toast.error('Erreur.'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Gestion des villes</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Ajouter une ville</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Nom de la ville</label>
                <input className="form-control" required value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Province</label>
                <input className="form-control" value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Latitude <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>(ex: 45.5017)</span></label>
                <input
                  type="number" step="any" className="form-control"
                  placeholder="Ex: 45.5017"
                  value={form.latitude}
                  onChange={e => setForm({ ...form, latitude: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Longitude <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>(ex: -73.5673)</span></label>
                <input
                  type="number" step="any" className="form-control"
                  placeholder="Ex: -73.5673"
                  value={form.longitude}
                  onChange={e => setForm({ ...form, longitude: e.target.value })}
                />
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '1rem' }}>
              💡 Les coordonnées sont nécessaires pour valider la distance minimale de 50 km entre villes lors de la création de lignes.
            </p>
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
            <thead><tr><th>Ville</th><th>Province</th><th>Coordonnées GPS</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {villes.map(v => (
                <tr key={v.id}>
                  <td>{v.nom}</td>
                  <td>{v.province || '—'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontFamily: 'monospace' }}>
                    {v.latitude && v.longitude ? `${Number(v.latitude).toFixed(4)}, ${Number(v.longitude).toFixed(4)}` : <span style={{ color: 'var(--warning)' }}>⚠️ Manquantes</span>}
                  </td>
                  <td><span className={`badge ${v.actif ? 'badge-success' : 'badge-danger'}`}>{v.actif ? 'Active' : 'Inactive'}</span></td>
                  <td><button className="btn btn-secondary btn-sm" onClick={() => handleToggle(v.id)}>{v.actif ? 'Désactiver' : 'Activer'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
