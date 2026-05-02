import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', mot_de_passe: '', telephone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      toast.success('Compte créé avec succès!');
      navigate('/trajets');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Créer un compte</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Prénom</label>
              <input className="form-control" required value={form.prenom} onChange={set('prenom')} />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input className="form-control" required value={form.nom} onChange={set('nom')} />
            </div>
          </div>
          <div className="form-group">
            <label>Courriel</label>
            <input type="email" className="form-control" required value={form.email} onChange={set('email')} />
          </div>
          <div className="form-group">
            <label>Téléphone</label>
            <input className="form-control" value={form.telephone} onChange={set('telephone')} />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <input type="password" className="form-control" required minLength={6} value={form.mot_de_passe} onChange={set('mot_de_passe')} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
          Déjà un compte? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
