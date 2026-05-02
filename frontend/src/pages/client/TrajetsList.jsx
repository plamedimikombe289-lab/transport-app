import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { trajetService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function TrajetsList() {
  const [searchParams] = useSearchParams();
  const [trajets, setTrajets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    depart: searchParams.get('depart') || '',
    arrivee: searchParams.get('arrivee') || '',
    date: searchParams.get('date') || '',
  });
  const [prixMax, setPrixMax] = useState('');
  const [dureeMax, setDureeMax] = useState('');

  const fetchTrajets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.depart) params.depart = filters.depart;
      if (filters.arrivee) params.arrivee = filters.arrivee;
      if (filters.date) params.date = filters.date;
      const res = await trajetService.getAll(params);
      setTrajets(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrajets(); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchTrajets(); };
  const set = (field) => (e) => setFilters({ ...filters, [field]: e.target.value });

  const affichees = trajets.filter(t => {
    if (prixMax && t.prix > Number(prixMax)) return false;
    if (dureeMax && t.duree_minutes > Number(dureeMax)) return false;
    return true;
  });

  return (
    <div className="container">
      <h1 className="page-title">Trajets disponibles</h1>

      <form onSubmit={handleSearch} className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Départ</label>
            <input className="form-control" placeholder="Ville de départ" value={filters.depart} onChange={set('depart')} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Arrivée</label>
            <input className="form-control" placeholder="Ville d'arrivée" value={filters.arrivee} onChange={set('arrivee')} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Date</label>
            <input type="date" className="form-control" value={filters.date} onChange={set('date')} />
          </div>
          <button type="submit" className="btn btn-primary">Rechercher</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 500 }}>Filtres :</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', margin: 0, whiteSpace: 'nowrap' }}>Prix max ($)</label>
            <input type="number" className="form-control" style={{ width: 110 }} min="0" step="1"
              placeholder="Illimité" value={prixMax} onChange={e => setPrixMax(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.85rem', margin: 0, whiteSpace: 'nowrap' }}>Durée max (min)</label>
            <input type="number" className="form-control" style={{ width: 110 }} min="0" step="10"
              placeholder="Illimitée" value={dureeMax} onChange={e => setDureeMax(e.target.value)} />
          </div>
          {(prixMax || dureeMax) && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setPrixMax(''); setDureeMax(''); }}>
              Réinitialiser filtres
            </button>
          )}
          {!loading && <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{affichees.length} trajet(s) affiché(s)</span>}
        </div>
      </form>

      {loading ? <LoadingSpinner /> : affichees.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
          Aucun trajet disponible pour ces critères.
        </div>
      ) : (
        <div className="card-grid">
          {affichees.map(t => (
            <div key={t.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="badge badge-info">{t.ligne_code}</span>
                <strong style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>{t.prix} $</strong>
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>{t.ville_depart} → {t.ville_arrivee}</h3>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                🕐 {format(new Date(t.date_depart), 'dd MMM yyyy à HH:mm', { locale: fr })}
              </p>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                ⏱ {t.duree_minutes} min · 🚌 {t.vehicule} · 💺 {t.places_disponibles} places restantes
              </p>
              <Link to={`/trajets/${t.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Voir et réserver
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
