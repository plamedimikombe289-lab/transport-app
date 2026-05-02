import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import toast from 'react-hot-toast';

export default function Profil() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ nom: user?.nom || '', prenom: user?.prenom || '', telephone: user?.telephone || '' });
  const [loading, setLoading] = useState(false);
  const [mdpForm, setMdpForm] = useState({ ancien_mdp: '', nouveau_mdp: '', confirmer_mdp: '' });
  const [loadingMdp, setLoadingMdp] = useState(false);
  const [showMdp, setShowMdp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.updateProfile(form);
      await refreshUser();
      toast.success('Profil mis à jour.');
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeMdp = async (e) => {
    e.preventDefault();
    if (mdpForm.nouveau_mdp !== mdpForm.confirmer_mdp) {
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }
    if (mdpForm.nouveau_mdp.length < 6) {
      toast.error('Le nouveau mot de passe doit faire au moins 6 caractères.');
      return;
    }
    setLoadingMdp(true);
    try {
      await authService.changePassword({ ancien_mdp: mdpForm.ancien_mdp, nouveau_mdp: mdpForm.nouveau_mdp });
      toast.success('Mot de passe modifié avec succès.');
      setMdpForm({ ancien_mdp: '', nouveau_mdp: '', confirmer_mdp: '' });
      setShowMdp(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur.');
    } finally {
      setLoadingMdp(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 500 }}>
      <h1 className="page-title">Mon profil</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--primary-light)', borderRadius: 8 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.prenom} {user?.nom}</div>
            <div style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>{user?.email}</div>
            <span className="badge badge-info" style={{ marginTop: '0.25rem' }}>{user?.role}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Prénom</label>
              <input className="form-control" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input className="form-control" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Téléphone</label>
            <input className="form-control" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showMdp ? '1rem' : 0 }}>
          <h3 style={{ margin: 0 }}>Changer le mot de passe</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowMdp(v => !v)}>
            {showMdp ? 'Annuler' : 'Modifier'}
          </button>
        </div>

        {showMdp && (
          <form onSubmit={handleChangeMdp}>
            <div className="form-group">
              <label>Mot de passe actuel</label>
              <input type="password" className="form-control" required value={mdpForm.ancien_mdp}
                onChange={e => setMdpForm({ ...mdpForm, ancien_mdp: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Nouveau mot de passe</label>
              <input type="password" className="form-control" required minLength={6} value={mdpForm.nouveau_mdp}
                onChange={e => setMdpForm({ ...mdpForm, nouveau_mdp: e.target.value })} />
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>Minimum 6 caractères</span>
            </div>
            <div className="form-group">
              <label>Confirmer le nouveau mot de passe</label>
              <input type="password" className="form-control" required value={mdpForm.confirmer_mdp}
                onChange={e => setMdpForm({ ...mdpForm, confirmer_mdp: e.target.value })} />
              {mdpForm.confirmer_mdp && mdpForm.nouveau_mdp !== mdpForm.confirmer_mdp && (
                <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Les mots de passe ne correspondent pas.</span>
              )}
            </div>
            <button type="submit" className="btn btn-primary" disabled={loadingMdp}>
              {loadingMdp ? 'Modification...' : 'Confirmer le changement'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
