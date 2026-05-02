import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🚌 TransportInterurbain</Link>
      <div className="navbar-links">
        <Link to="/trajets">Trajets</Link>
        {user?.role === 'client' && <Link to="/mes-reservations">Mes réservations</Link>}
        {(user?.role === 'agent' || user?.role === 'administrateur') && (
          <>
            <Link to="/agent">Tableau de bord</Link>
            <Link to="/agent/trajets">Gestion trajets</Link>
          </>
        )}
        {user?.role === 'administrateur' && (
          <>
            <Link to="/admin">Administration</Link>
          </>
        )}
      </div>
      <div className="navbar-actions">
        {user ? (
          <>
            <Link to="/profil" className="btn btn-secondary btn-sm">
              👤 {user.prenom}
            </Link>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary btn-sm">Connexion</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Inscription</Link>
          </>
        )}
      </div>
    </nav>
  );
}
