import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState({ depart: '', arrivee: '', date: '' });

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(search);
    navigate(`/trajets?${params}`);
  };

  return (
    <div>
      <div className="hero">
        <h1>Voyagez à travers le Québec</h1>
        <p>Réservez facilement vos billets d'autobus interurbain</p>
        <form onSubmit={handleSearch} className="search-bar">
          <div className="form-group" style={{ margin: 0 }}>
            <label>Ville de départ</label>
            <input className="form-control" placeholder="Ex: Montréal"
              value={search.depart} onChange={e => setSearch({ ...search, depart: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Ville d'arrivée</label>
            <input className="form-control" placeholder="Ex: Québec"
              value={search.arrivee} onChange={e => setSearch({ ...search, arrivee: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Date</label>
            <input type="date" className="form-control"
              value={search.date} onChange={e => setSearch({ ...search, date: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-primary">🔍 Rechercher</button>
        </form>
      </div>

      <div className="container">
        <h2 className="page-title" style={{ textAlign: 'center', marginTop: '2rem' }}>Pourquoi nous choisir?</h2>
        <div className="card-grid" style={{ marginTop: '1rem' }}>
          {[
            { icon: '💺', title: 'Réservation en ligne', desc: 'Réservez votre siège en quelques clics, 24h/7j.' },
            { icon: '💳', title: 'Paiement sécurisé', desc: 'Paiement simulé sécurisé, billet électronique immédiat.' },
            { icon: '📋', title: 'Gestion de vos voyages', desc: 'Consultez et gérez toutes vos réservations facilement.' },
            { icon: '🚌', title: 'Réseau étendu', desc: 'Des dizaines de villes desservies au Québec et en Ontario.' },
          ].map((item, i) => (
            <div key={i} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{item.icon}</div>
              <h3 style={{ marginBottom: '0.5rem' }}>{item.title}</h3>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
