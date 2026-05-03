import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function GestionLignes() {
  const [lignes, setLignes] = useState([]);
  const [villes, setVilles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', ville_depart_id: '', ville_arrivee_id: '', duree_minutes: '', prix_base: '', creer_retour: false });
  const [distance, setDistance] = useState(null);
  const [loadingDist, setLoadingDist] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ duree_minutes: '', prix_base: '' });

  const load = async () => {
    const [l, v] = await Promise.all([adminService.getLignes(), adminService.getVilles()]);
    setLignes(l.data); setVilles(v.data.filter(v => v.actif));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (form.ville_depart_id && form.ville_arrivee_id && form.ville_depart_id !== form.ville_arrivee_id) {
      setLoadingDist(true);
      adminService.getDistance(form.ville_depart_id, form.ville_arrivee_id)
        .then(r => setDistance(r.data))
        .catch(() => setDistance(null))
        .finally(() => setLoadingDist(false));
    } else {
      setDistance(null);
    }
  }, [form.ville_depart_id, form.ville_arrivee_id]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (distance && !distance.valide) {
      toast.error(`Distance insuffisante : ${distance.distance} km. Minimum requis : 50 km.`);
      return;
    }
    try {
      const res = await adminService.createLigne(form);
      toast.success(res.data.message);
      setShowForm(false);
      setDistance(null);
      setForm({ code: '', ville_depart_id: '', ville_arrivee_id: '', duree_minutes: '', prix_base: '', creer_retour: false });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    }
  };

  const ouvrirEdit = (l) => { setEditId(l.id); setEditForm({ duree_minutes: l.duree_minutes, prix_base: l.prix_base }); };
  const fermerEdit = () => setEditId(null);

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await adminService.updateLigne(editId, editForm);
      toast.success('Ligne mise à jour.');
      fermerEdit();
      load();
    } catch { toast.error('Erreur.'); }
  };

  const handleToggle = async (id) => {
    try {
      await adminService.toggleLigne(id);
      load();
    } catch { toast.error('Erreur.'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Gestion des lignes</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ Ajouter une ligne</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Créer une ligne</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Code</label>
                <input className="form-control" required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Prix de base ($)</label>
                <input type="number" step="0.01" className="form-control" required value={form.prix_base} onChange={e => setForm({ ...form, prix_base: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Ville de départ</label>
                <select className="form-control" required value={form.ville_depart_id} onChange={e => setForm({ ...form, ville_depart_id: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  {villes.map(v => <option key={v.id} value={v.id}>{v.nom} — {v.province}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Ville d'arrivée</label>
                <select className="form-control" required value={form.ville_arrivee_id} onChange={e => setForm({ ...form, ville_arrivee_id: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  {villes.map(v => <option key={v.id} value={v.id}>{v.nom} — {v.province}</option>)}
                </select>
              </div>
            </div>

            {(loadingDist || distance) && (
              <div style={{
                padding: '0.6rem 1rem', borderRadius: 7, marginBottom: '1rem', fontSize: '0.875rem',
                background: loadingDist ? '#f3f4f6' : distance?.valide ? '#d1fae5' : '#fee2e2',
                border: `1px solid ${loadingDist ? '#e5e7eb' : distance?.valide ? '#6ee7b7' : '#fca5a5'}`,
                color: loadingDist ? '#6b7280' : distance?.valide ? '#065f46' : '#991b1b',
              }}>
                {loadingDist ? '⏳ Calcul de la distance...' :
                  distance?.distance === null ? '⚠️ Coordonnées manquantes pour une ou plusieurs villes.' :
                  distance?.valide
                    ? `✅ Distance : ${distance.distance} km — Ligne valide.`
                    : `❌ Distance : ${distance.distance} km — Insuffisante (minimum 50 km requis).`}
              </div>
            )}

            <div className="form-group" style={{ maxWidth: 200 }}>
              <label>Durée (minutes)</label>
              <input type="number" className="form-control" required value={form.duree_minutes} onChange={e => setForm({ ...form, duree_minutes: e.target.value })} />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 400 }}>
                <input type="checkbox" checked={form.creer_retour} onChange={e => setForm({ ...form, creer_retour: e.target.checked })} />
                Créer aussi la ligne retour ({form.ville_arrivee_id && form.ville_depart_id ? `${villes.find(v=>String(v.id)===String(form.ville_arrivee_id))?.nom || '?'} → ${villes.find(v=>String(v.id)===String(form.ville_depart_id))?.nom || '?'}` : '— → —'})
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary" disabled={distance && !distance.valide}>
                {form.creer_retour ? 'Créer aller + retour' : 'Créer'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); setDistance(null); }}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table>
            <thead><tr><th>Code</th><th>Départ</th><th>Arrivée</th><th>Durée</th><th>Prix base</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {lignes.map(l => (
                <React.Fragment key={l.id}>
                  <tr>
                    <td><code>{l.code}</code></td>
                    <td>{l.ville_depart}</td>
                    <td>{l.ville_arrivee}</td>
                    <td>{l.duree_minutes} min</td>
                    <td>{l.prix_base} $</td>
                    <td><span className={`badge ${l.actif ? 'badge-success' : 'badge-danger'}`}>{l.actif ? 'Active' : 'Inactive'}</span></td>
                    <td style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => editId === l.id ? fermerEdit() : ouvrirEdit(l)}>
                        {editId === l.id ? 'Annuler' : 'Modifier'}
                      </button>
                      <button
                        className={`btn btn-sm ${l.actif ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggle(l.id)}
                      >
                        {l.actif ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                  {editId === l.id && (
                    <tr>
                      <td colSpan={7} style={{ background: 'var(--gray-100)', padding: '1rem' }}>
                        <form onSubmit={handleEdit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.85rem' }}>Durée (minutes)</label>
                            <input type="number" className="form-control" style={{ width: 140 }}
                              value={editForm.duree_minutes} onChange={e => setEditForm({ ...editForm, duree_minutes: e.target.value })} required />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.85rem' }}>Prix de base ($)</label>
                            <input type="number" step="0.01" className="form-control" style={{ width: 140 }}
                              value={editForm.prix_base} onChange={e => setEditForm({ ...editForm, prix_base: e.target.value })} required />
                          </div>
                          <button type="submit" className="btn btn-primary btn-sm">Sauvegarder</button>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={fermerEdit}>Annuler</button>
                        </form>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
