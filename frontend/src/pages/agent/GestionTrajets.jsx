import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { trajetService, adminService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusLabels = { planifie: 'Planifié', en_cours: 'En cours', termine: 'Terminé', annule: 'Annulé' };
const statusBadges = { planifie: 'badge-info', en_cours: 'badge-success', termine: 'badge-gray', annule: 'badge-danger' };

const emptyForm = { ligne_id: '', vehicule_id: '', date_depart: '', date_arrivee: '', prix: '', repetitions: 1, intervalle_jours: 7 };

export default function GestionTrajets() {
  const [trajets, setTrajets] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [vehicules, setVehicules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ vehicule_id: '', date_depart: '', date_arrivee: '', prix: '' });

  const load = async () => {
    try {
      const [t, l, v] = await Promise.all([trajetService.getAllAgent(), adminService.getLignes(), adminService.getVehicules()]);
      setTrajets(t.data); setLignes(l.data); setVehicules(v.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (form.repetitions > 1) {
        await trajetService.createSerie(form);
        toast.success(`${form.repetitions} trajets créés.`);
      } else {
        await trajetService.create(form);
        toast.success('Trajet créé.');
      }
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    }
  };

  const handleStatut = async (id, statut) => {
    try { await trajetService.updateStatut(id, statut); toast.success('Statut mis à jour.'); load(); }
    catch { toast.error('Erreur.'); }
  };

  const ouvrirEdit = (t) => {
    setEditId(t.id);
    setEditForm({ vehicule_id: t.vehicule_id || '', date_depart: t.date_depart?.slice(0, 16) || '', date_arrivee: t.date_arrivee?.slice(0, 16) || '', prix: t.prix });
  };
  const fermerEdit = () => setEditId(null);

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await trajetService.update(editId, editForm);
      toast.success('Trajet mis à jour.');
      fermerEdit(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur.'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>Gestion des trajets</h1>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setForm(emptyForm); }}>+ Nouveau trajet</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Créer un trajet</h3>
          <form onSubmit={handleCreate}>
            <div className="form-row">
              <div className="form-group">
                <label>Ligne</label>
                <select className="form-control" required value={form.ligne_id} onChange={e => setForm({ ...form, ligne_id: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  {lignes.filter(l => l.actif).map(l => <option key={l.id} value={l.id}>{l.code} — {l.ville_depart} → {l.ville_arrivee}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Véhicule</label>
                <select className="form-control" required value={form.vehicule_id} onChange={e => setForm({ ...form, vehicule_id: e.target.value })}>
                  <option value="">Sélectionner...</option>
                  {vehicules.filter(v => v.actif).map(v => <option key={v.id} value={v.id}>{v.numero_plaque} — {v.modele} ({v.capacite} places)</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Date et heure de départ</label>
                <input type="datetime-local" className="form-control" required value={form.date_depart} onChange={e => setForm({ ...form, date_depart: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Date et heure d'arrivée</label>
                <input type="datetime-local" className="form-control" required value={form.date_arrivee} onChange={e => setForm({ ...form, date_arrivee: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group" style={{ maxWidth: 160 }}>
                <label>Prix ($)</label>
                <input type="number" className="form-control" required min="0" step="0.01" value={form.prix} onChange={e => setForm({ ...form, prix: e.target.value })} />
              </div>
              <div className="form-group" style={{ maxWidth: 160 }}>
                <label>Répétitions</label>
                <input type="number" className="form-control" min="1" max="52" value={form.repetitions} onChange={e => setForm({ ...form, repetitions: e.target.value })} />
              </div>
              {form.repetitions > 1 && (
                <div className="form-group" style={{ maxWidth: 180 }}>
                  <label>Intervalle (jours)</label>
                  <input type="number" className="form-control" min="1" value={form.intervalle_jours} onChange={e => setForm({ ...form, intervalle_jours: e.target.value })} />
                </div>
              )}
            </div>
            {form.repetitions > 1 && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '0.6rem 0.9rem', fontSize: '0.85rem', color: '#1e40af', marginBottom: '0.75rem' }}>
                {form.repetitions} trajets seront créés, tous les {form.intervalle_jours} jour(s) à partir du {form.date_depart ? new Date(form.date_depart).toLocaleDateString('fr-CA') : '—'}.
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary">
                {form.repetitions > 1 ? `Créer ${form.repetitions} trajets` : 'Créer'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Trajet</th><th>Départ</th><th>Véhicule</th><th>Prix</th><th>Places</th><th>Rés.</th><th>Statut</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {trajets.map(t => (
                <React.Fragment key={t.id}>
                  <tr>
                    <td>{t.ville_depart} → {t.ville_arrivee}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{format(new Date(t.date_depart), 'dd MMM yyyy HH:mm', { locale: fr })}</td>
                    <td>{t.vehicule}</td>
                    <td>{t.prix} $</td>
                    <td>{t.places_disponibles}/{t.capacite}</td>
                    <td>{t.nb_reservations}</td>
                    <td><span className={`badge ${statusBadges[t.statut]}`}>{statusLabels[t.statut]}</span></td>
                    <td style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                      <Link to={`/agent/passagers/${t.id}`} className="btn btn-secondary btn-sm">Passagers</Link>
                      {t.statut === 'planifie' && (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => editId === t.id ? fermerEdit() : ouvrirEdit(t)}>
                            {editId === t.id ? '✕' : 'Modifier'}
                          </button>
                          <button className="btn btn-primary btn-sm" onClick={() => handleStatut(t.id, 'en_cours')}>Démarrer</button>
                        </>
                      )}
                      {t.statut === 'en_cours' && <button className="btn btn-success btn-sm" onClick={() => handleStatut(t.id, 'termine')}>Terminer</button>}
                    </td>
                  </tr>
                  {editId === t.id && (
                    <tr>
                      <td colSpan={8} style={{ background: 'var(--gray-100)', padding: '1rem' }}>
                        <form onSubmit={handleEdit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.82rem' }}>Véhicule</label>
                            <select className="form-control" style={{ minWidth: 200 }} value={editForm.vehicule_id} onChange={e => setEditForm({ ...editForm, vehicule_id: e.target.value })}>
                              <option value="">— inchangé —</option>
                              {vehicules.filter(v => v.actif).map(v => <option key={v.id} value={v.id}>{v.modele} ({v.capacite} pl.)</option>)}
                            </select>
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.82rem' }}>Départ</label>
                            <input type="datetime-local" className="form-control" value={editForm.date_depart} onChange={e => setEditForm({ ...editForm, date_depart: e.target.value })} />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.82rem' }}>Arrivée</label>
                            <input type="datetime-local" className="form-control" value={editForm.date_arrivee} onChange={e => setEditForm({ ...editForm, date_arrivee: e.target.value })} />
                          </div>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label style={{ fontSize: '0.82rem' }}>Prix ($)</label>
                            <input type="number" step="0.01" min="0" className="form-control" style={{ width: 100 }} value={editForm.prix} onChange={e => setEditForm({ ...editForm, prix: e.target.value })} />
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
