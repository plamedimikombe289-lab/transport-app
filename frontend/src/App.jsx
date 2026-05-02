import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages publiques
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TrajetsList from './pages/client/TrajetsList';
import TrajetDetail from './pages/client/TrajetDetail';

// Pages client
import MesReservations from './pages/client/MesReservations';
import ReservationDetail from './pages/client/ReservationDetail';
import Paiement from './pages/client/Paiement';
import Billet from './pages/client/Billet';
import Profil from './pages/client/Profil';

// Pages agent
import AgentDashboard from './pages/agent/AgentDashboard';
import GestionTrajets from './pages/agent/GestionTrajets';
import Passagers from './pages/agent/Passagers';
import AgentReservations from './pages/agent/AgentReservations';

// Pages admin
import AdminDashboard from './pages/admin/AdminDashboard';
import GestionUtilisateurs from './pages/admin/GestionUtilisateurs';
import GestionVilles from './pages/admin/GestionVilles';
import GestionLignes from './pages/admin/GestionLignes';
import GestionVehicules from './pages/admin/GestionVehicules';
import GestionAnnulations from './pages/admin/GestionAnnulations';

import Navbar from './components/common/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/trajets" element={<TrajetsList />} />
          <Route path="/trajets/:id" element={<TrajetDetail />} />

          {/* Client */}
          <Route path="/mes-reservations" element={<PrivateRoute roles={['client']}><MesReservations /></PrivateRoute>} />
          <Route path="/reservations/:id" element={<PrivateRoute roles={['client']}><ReservationDetail /></PrivateRoute>} />
          <Route path="/paiement/:reservation_id" element={<PrivateRoute roles={['client']}><Paiement /></PrivateRoute>} />
          <Route path="/billet/:reservation_id" element={<PrivateRoute roles={['client']}><Billet /></PrivateRoute>} />
          <Route path="/profil" element={<PrivateRoute><Profil /></PrivateRoute>} />

          {/* Agent */}
          <Route path="/agent" element={<PrivateRoute roles={['agent', 'administrateur']}><AgentDashboard /></PrivateRoute>} />
          <Route path="/agent/trajets" element={<PrivateRoute roles={['agent', 'administrateur']}><GestionTrajets /></PrivateRoute>} />
          <Route path="/agent/passagers/:trajet_id" element={<PrivateRoute roles={['agent', 'administrateur']}><Passagers /></PrivateRoute>} />
          <Route path="/agent/reservations" element={<PrivateRoute roles={['agent', 'administrateur']}><AgentReservations /></PrivateRoute>} />
          <Route path="/agent/vehicules" element={<PrivateRoute roles={['agent', 'administrateur']}><GestionVehicules /></PrivateRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<PrivateRoute roles={['administrateur']}><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/utilisateurs" element={<PrivateRoute roles={['administrateur']}><GestionUtilisateurs /></PrivateRoute>} />
          <Route path="/admin/villes" element={<PrivateRoute roles={['administrateur']}><GestionVilles /></PrivateRoute>} />
          <Route path="/admin/lignes" element={<PrivateRoute roles={['administrateur']}><GestionLignes /></PrivateRoute>} />
          <Route path="/admin/vehicules" element={<PrivateRoute roles={['administrateur']}><GestionVehicules /></PrivateRoute>} />
          <Route path="/admin/annulations" element={<PrivateRoute roles={['administrateur']}><GestionAnnulations /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
