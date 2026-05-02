import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reservationService, paiementService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const formatNumeroCard = (val) =>
  val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

const formatExpiry = (val) => {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
};

const detecterType = (numero) => {
  const n = numero.replace(/\s/g, '');
  if (/^4/.test(n)) return { label: 'Visa', icone: '💳' };
  if (/^5[1-5]/.test(n)) return { label: 'Mastercard', icone: '💳' };
  if (/^3[47]/.test(n)) return { label: 'Amex', icone: '💳' };
  return { label: '', icone: '💳' };
};

const validerCarte = (carte) => {
  const digits = carte.numero.replace(/\s/g, '');
  if (digits.length !== 16) return 'Le numéro de carte doit contenir 16 chiffres.';
  const [mois, annee] = carte.expiry.split('/');
  const m = parseInt(mois, 10);
  const a = parseInt('20' + annee, 10);
  const now = new Date();
  if (!mois || !annee || annee.length !== 2) return 'Date d\'expiration invalide (MM/AA).';
  if (m < 1 || m > 12) return 'Mois d\'expiration invalide.';
  if (a < now.getFullYear() || (a === now.getFullYear() && m < now.getMonth() + 1))
    return 'Cette carte est expirée.';
  if (carte.cvv.length !== 3) return 'Le CVV doit contenir 3 chiffres.';
  if (carte.nom.trim().length < 3) return 'Veuillez entrer le nom du titulaire.';
  return null;
};

export default function Paiement() {
  const { reservation_id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [methode, setMethode] = useState('carte_credit');
  const [paying, setPaying] = useState(false);
  const [carte, setCarte] = useState({ numero: '', expiry: '', cvv: '', nom: '' });
  const [paypalEmail, setPaypalEmail] = useState('');

  useEffect(() => {
    reservationService.getById(reservation_id)
      .then(r => { if (r.data.statut !== 'en_attente') { navigate('/mes-reservations'); } else setReservation(r.data); })
      .catch(() => navigate('/mes-reservations'))
      .finally(() => setLoading(false));
  }, [reservation_id, navigate]);

  const handlePayer = async () => {
    if (methode !== 'paypal') {
      const erreur = validerCarte(carte);
      if (erreur) { toast.error(erreur); return; }
    } else {
      if (!paypalEmail.includes('@')) { toast.error('Adresse PayPal invalide.'); return; }
    }

    setPaying(true);
    try {
      await paiementService.simuler({ reservation_id: Number(reservation_id), methode });
      toast.success('Paiement réussi! Votre billet est prêt.');
      navigate(`/billet/${reservation_id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de paiement.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!reservation) return null;

  const typeCarte = detecterType(carte.numero);
  const estCarte = methode === 'carte_credit' || methode === 'carte_debit';

  const inputStyle = {
    width: '100%', padding: '0.65rem 0.75rem', border: '1.5px solid var(--gray-300)',
    borderRadius: 7, fontSize: '1rem', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'monospace', letterSpacing: '0.05em',
  };

  return (
    <div className="container" style={{ maxWidth: 600 }}>
      <h1 className="page-title">Paiement simulé</h1>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Récapitulatif</h3>
        <div className="billet-row"><span>Trajet</span><strong>{reservation.ville_depart} → {reservation.ville_arrivee}</strong></div>
        <div className="billet-row"><span>Réservation</span><code>{reservation.code_reservation}</code></div>
        <div className="billet-row"><span>Sièges</span><strong>{reservation.nombre_sieges}</strong></div>
        <div className="billet-row"><span>Total à payer</span><strong style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>{reservation.prix_total} $</strong></div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>Mode de paiement</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { value: 'carte_credit', label: '💳 Carte de crédit' },
            { value: 'carte_debit', label: '🏦 Carte de débit' },
            { value: 'paypal', label: '🅿️ PayPal' },
          ].map(m => (
            <label key={m.value} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.75rem', border: `2px solid ${methode === m.value ? 'var(--primary)' : 'var(--gray-200)'}`, borderRadius: 8, background: methode === m.value ? 'var(--primary-light)' : 'white' }}>
              <input type="radio" name="methode" value={m.value} checked={methode === m.value} onChange={() => setMethode(m.value)} />
              {m.label}
            </label>
          ))}
        </div>

        {estCarte && (
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.875rem' }}>
                Numéro de carte {typeCarte.label && <span style={{ color: 'var(--primary)', marginLeft: 6 }}>{typeCarte.icone} {typeCarte.label}</span>}
              </label>
              <input
                style={inputStyle}
                placeholder="0000 0000 0000 0000"
                value={carte.numero}
                maxLength={19}
                inputMode="numeric"
                onChange={e => setCarte({ ...carte, numero: formatNumeroCard(e.target.value) })}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>16 chiffres</span>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.875rem' }}>Nom du titulaire</label>
              <input
                style={{ ...inputStyle, fontFamily: 'inherit', letterSpacing: 'normal', textTransform: 'uppercase' }}
                placeholder="PRÉNOM NOM"
                value={carte.nom}
                onChange={e => setCarte({ ...carte, nom: e.target.value.replace(/[^a-zA-ZÀ-ÿ\s-]/g, '') })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.875rem' }}>Date d'expiration</label>
                <input
                  style={inputStyle}
                  placeholder="MM/AA"
                  value={carte.expiry}
                  maxLength={5}
                  inputMode="numeric"
                  onChange={e => setCarte({ ...carte, expiry: formatExpiry(e.target.value) })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Mois / Année</span>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.875rem' }}>CVV</label>
                <input
                  style={inputStyle}
                  placeholder="000"
                  value={carte.cvv}
                  maxLength={3}
                  inputMode="numeric"
                  onChange={e => setCarte({ ...carte, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>3 chiffres au dos</span>
              </div>
            </div>
          </div>
        )}

        {methode === 'paypal' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.875rem' }}>Adresse courriel PayPal</label>
            <input
              style={{ ...inputStyle, fontFamily: 'inherit', letterSpacing: 'normal' }}
              type="email"
              placeholder="exemple@email.com"
              value={paypalEmail}
              onChange={e => setPaypalEmail(e.target.value)}
            />
          </div>
        )}

        <div className="alert" style={{ background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', marginBottom: '1rem' }}>
          ⚠️ Ceci est un paiement simulé. Aucun montant réel ne sera débité.
        </div>

        <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '0.75rem' }}
          onClick={handlePayer} disabled={paying}>
          {paying ? 'Traitement...' : `✅ Confirmer le paiement de ${reservation.prix_total} $`}
        </button>
      </div>
    </div>
  );
}
