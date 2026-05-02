import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function GestionUtilisateurs() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => adminService.getUtilisateurs().then(r => setUsers(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleRole = async (id, role_id) => {
    try { await adminService.updateRole(id, role_id); toast.success('Rôle mis à jour.'); load(); }
    catch { toast.error('Erreur.'); }
  };

  const handleToggle = async (id) => {
    try { await adminService.toggleUser(id); toast.success('Statut mis à jour.'); load(); }
    catch { toast.error('Erreur.'); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <h1 className="page-title">Gestion des utilisateurs</h1>
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Nom</th><th>Courriel</th><th>Téléphone</th><th>Rôle</th><th>Statut</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.prenom} {u.nom}</td>
                  <td>{u.email}</td>
                  <td>{u.telephone || '—'}</td>
                  <td>
                    <select value={u.role} className="form-control" style={{ padding: '0.25rem', width: 'auto' }}
                      onChange={e => handleRole(u.id, e.target.value === 'client' ? 1 : e.target.value === 'agent' ? 2 : 3)}>
                      <option value="client">client</option>
                      <option value="agent">agent</option>
                      <option value="administrateur">administrateur</option>
                    </select>
                  </td>
                  <td><span className={`badge ${u.actif ? 'badge-success' : 'badge-danger'}`}>{u.actif ? 'Actif' : 'Inactif'}</span></td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleToggle(u.id)}>
                      {u.actif ? 'Désactiver' : 'Activer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
