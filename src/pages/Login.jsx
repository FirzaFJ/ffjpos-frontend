import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Lock, Mail, Store, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const res = await api.post('/login', { email, password });

    // Debugging: Cek isi response di console browser (F12)
    console.log("Response Login:", res.data);

    // Ambil token & user dengan fallback format
    const token = res.data.access_token || res.data.token || res.data.data?.token;
    const userData = res.data.user || res.data.data?.user || res.data.data;

    if (token && userData) {
      // Simpan ke AuthContext
      login({
        token: token,
        user: userData,
      });

      // Redirect berdasarkan role
      if (userData.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/pos');
      }
    } else {
      setError('Format respon dari server tidak sesuai.');
    }
  } catch (err) {
    console.error("Detail Error Login:", err);
    const errorMessage = err.response?.data?.message 
      || err.response?.data?.errors?.email?.[0] 
      || 'Gagal terhubung ke server / Kredensial salah.';
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header Logo / Title */}
        <div style={styles.header}>
          <div style={styles.iconWrapper}>
            <Store size={32} color="#2563eb" />
          </div>
          <h2 style={styles.title}>Sistem Kasir & Inventaris</h2>
          <p style={styles.subtitle}>Masukkan akun kasir/admin Anda untuk masuk</p>
        </div>

        {/* Alert Pesan Error */}
        {error && (
          <div style={styles.alert}>
            <AlertCircle size={18} style={{ marginRight: 8, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Field Email */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Alamat Email</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kasir@pos.com"
                required
                style={styles.input}
              />
            </div>
          </div>

          {/* Field Password */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={styles.input}
              />
            </div>
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={styles.spinner} />
                <span>Memproses...</span>
              </>
            ) : (
              'Masuk ke Sistem'
            )}
          </button>
        </form>

        {/* Footer info dummy account */}
        {/* <div style={styles.footerNote}>
          <p style={{ margin: '0 0 4px 0', fontWeight: '600' }}>Akun Default:</p>
          <code>Admin: admin@pos.com | Pass: password123</code><br/>
          <code>Kasir: kasir@pos.com | Pass: password123</code>
        </div> */}
      </div>
    </div>
  );
}

// Inline Styling untuk tampilan bersih & modern
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    padding: '20px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  iconWrapper: {
    width: '56px',
    height: '56px',
    backgroundColor: '#eff6ff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px auto',
  },
  title: {
    margin: '0 0 6px 0',
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    margin: 0,
    fontSize: '13px',
    color: '#64748b',
  },
  alert: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: '#94a3b8',
  },
  input: {
    width: '100%',
    padding: '10px 12px 10px 40px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
  },
  footerNote: {
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0',
    textAlign: 'center',
    fontSize: '11px',
    color: '#64748b',
  },
};